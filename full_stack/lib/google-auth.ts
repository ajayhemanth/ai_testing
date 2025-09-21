import { GoogleAuth } from 'google-auth-library';
import path from 'path';

let authClient: GoogleAuth | null = null;

export async function getAccessToken(): Promise<string> {
  try {
    if (!authClient) {
      // Use the service account file from parent directory
      const keyFilePath = path.resolve(process.cwd(), '../service_account.json');

      authClient = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        keyFile: keyFilePath,
      });
    }

    const client = await authClient.getClient();
    const tokenResponse = await client.getAccessToken();

    if (!tokenResponse.token) {
      throw new Error('Failed to obtain access token');
    }

    return tokenResponse.token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}