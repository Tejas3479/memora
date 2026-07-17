export class GoogleIntegration {
  public getAuthUrl(state: string): string {
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&response_type=code&scope=https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/calendar.readonly&state=${state}`;
  }

  public async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    return {
      accessToken: 'google-access-token-mock',
      refreshToken: 'google-refresh-token-mock',
    };
  }

  public async syncDriveFiles(accessToken: string, userId: string, since?: Date): Promise<{ filesProcessed: number }> {
    console.log(`[GoogleDriveSync] Mock Google Drive syncing for ${userId}`);
    return { filesProcessed: 8 };
  }

  public async syncCalendarEvents(accessToken: string, userId: string, since?: Date): Promise<{ eventsProcessed: number }> {
    console.log(`[GoogleCalendarSync] Mock Google Calendar sync for user ${userId}`);
    return { eventsProcessed: 15 };
  }
}
export default GoogleIntegration;
