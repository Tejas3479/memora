import crypto from 'crypto';
import { prisma } from '../prisma.js';
import { QdrantService } from '../services/ai/qdrant.js';
import { EmbeddingService } from '../services/ai/embedding.js';
import { createLogger } from '@memora/shared';

const logger = createLogger('SlackIntegration');

export class SlackIntegration {
  public getAuthUrl(state: string): string {
    const clientId = process.env.SLACK_CLIENT_ID;
    if (!clientId) {
      logger.warn('SLACK_CLIENT_ID is missing from environment variables');
    }
    return `https://slack.com/oauth/v2/authorize?client_id=${clientId || ''}&scope=channels:history,channels:read&state=${state}`;
  }

  public async exchangeCode(code: string): Promise<{ accessToken: string; scope: string; teamId: string }> {
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Slack OAuth configurations are missing from environment');
    }

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('code', code);

    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Slack OAuth exchange failed with status: ${response.status}`);
    }

    const data = (await response.json()) as any;
    if (!data.ok) {
      throw new Error(`Slack OAuth exchange error: ${data.error || 'Unknown error'}`);
    }

    return {
      accessToken: data.access_token || data.authed_user?.access_token || '',
      scope: data.scope || '',
      teamId: data.team?.id || '',
    };
  }

  public async syncMessages(accessToken: string, userId: string, since?: Date): Promise<{ messagesProcessed: number }> {
    logger.info(`Starting real-time Slack message sync for user ${userId}`);
    
    const oldest = since ? Math.floor(since.getTime() / 1000) : 0;
    let messagesProcessed = 0;

    try {
      // 1. Fetch channel list
      const channelsRes = await fetch('https://slack.com/api/conversations.list?types=public_channel', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!channelsRes.ok) {
        throw new Error(`Slack API error conversations.list status ${channelsRes.status}`);
      }

      const channelsData = (await channelsRes.json()) as any;
      if (!channelsData.ok) {
        throw new Error(`Slack conversations.list failed: ${channelsData.error || 'unknown error'}`);
      }

      const channels = channelsData.channels || [];
      const qdrantService = new QdrantService();
      const embeddingService = new EmbeddingService();

      for (const channel of channels) {
        if (channel.is_archived) continue;

        // 2. Fetch conversation history for each channel
        const oldestParam = oldest ? `&oldest=${oldest}` : '';
        const historyUrl = `https://slack.com/api/conversations.history?channel=${channel.id}&limit=50${oldestParam}`;
        
        const historyRes = await fetch(historyUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!historyRes.ok) {
          logger.warn(`Failed to fetch history for Slack channel ${channel.id}: status ${historyRes.status}`);
          continue;
        }

        const historyData = (await historyRes.json()) as any;
        if (!historyData.ok) {
          logger.warn(`Slack conversations.history failed for channel ${channel.id}: ${historyData.error}`);
          continue;
        }

        const messages = historyData.messages || [];
        const pointsToUpsert = [];

        for (const msg of messages) {
          if (!msg.text || msg.subtype) continue; // Skip bot messages or subtype events

          // 3. Generate embedding vector
          const vector = await embeddingService.embedSingle(msg.text);
          const memoryId = crypto.randomUUID();
          
          pointsToUpsert.push({
            id: crypto.randomUUID(),
            vector,
            payload: {
              userId,
              chunkId: crypto.randomUUID(),
              source: 'SLACK',
              url: `slack://message/${msg.ts}`,
              title: `Slack Message in #${channel.name}`,
              content: msg.text,
              timestamp: Math.floor(parseFloat(msg.ts)),
              metadata: {
                memoryId,
                ts: msg.ts,
                channelId: channel.id,
                channelName: channel.name,
                user: msg.user,
              },
            },
          });
          
          messagesProcessed++;
        }

        if (pointsToUpsert.length > 0) {
          await qdrantService.upsertMemories(pointsToUpsert);
          logger.info(`Successfully synced ${pointsToUpsert.length} Slack messages from #${channel.name}`);
        }
      }

      return { messagesProcessed };
    } catch (err) {
      logger.error(`Error executing Slack synchronization for ${userId}`, err);
      throw err;
    }
  }
}
export default SlackIntegration;
