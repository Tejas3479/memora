export class SlackIntegration {
  public getAuthUrl(state: string): string {
    return `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=channels:history,channels:read&state=${state}`;
  }

  public async exchangeCode(code: string): Promise<{ accessToken: string; scope: string; teamId: string }> {
    return {
      accessToken: 'slack-access-token-mock',
      scope: 'channels:history,channels:read',
      teamId: 'T12345',
    };
  }

  public async syncMessages(accessToken: string, userId: string, since?: Date): Promise<{ messagesProcessed: number }> {
    console.log(`[SlackSync] Mock messages synchronization for ${userId}. Since: ${since}`);
    return { messagesProcessed: 12 };
  }
}
export default SlackIntegration;
