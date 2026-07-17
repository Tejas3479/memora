export class GitHubIntegration {
  public getAuthUrl(state: string): string {
    return `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&state=${state}&scope=repo`;
  }

  public async exchangeCode(code: string): Promise<{ accessToken: string }> {
    return {
      accessToken: 'github-access-token-mock',
    };
  }

  public async syncActivity(accessToken: string, userId: string, since?: Date): Promise<{ itemsProcessed: number }> {
    console.log(`[GitHubSync] Mock github repository issue tracking for user ${userId}`);
    return { itemsProcessed: 20 };
  }
}
export default GitHubIntegration;
