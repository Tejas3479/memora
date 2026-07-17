export class NotionIntegration {
  public getAuthUrl(state: string): string {
    return `https://api.notion.com/v1/oauth/authorize?client_id=${process.env.NOTION_CLIENT_ID}&response_type=code&owner=user&state=${state}`;
  }

  public async exchangeCode(code: string): Promise<{ accessToken: string; workspaceId: string }> {
    return {
      accessToken: 'notion-access-token-mock',
      workspaceId: 'workspace-notion-id',
    };
  }

  public async syncPages(accessToken: string, userId: string, since?: Date): Promise<{ pagesProcessed: number }> {
    console.log(`[NotionSync] Mock notion sync for user ${userId}.`);
    return { pagesProcessed: 5 };
  }
}
export default NotionIntegration;
