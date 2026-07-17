import { useAuthStore } from '../store/authStore.js';

class ApiClient {
  private async request(method: string, path: string, body?: any): Promise<any> {
    const token = useAuthStore.getState().accessToken;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      // Attempt refresh
      const refreshResponse = await fetch('/auth/refresh', { method: 'POST' });
      if (refreshResponse.ok) {
        const { accessToken } = await refreshResponse.json();
        useAuthStore.getState().setToken(accessToken);
        headers['Authorization'] = `Bearer ${accessToken}`;
        
        const retryResponse = await fetch(path, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
        return retryResponse.json();
      } else {
        useAuthStore.getState().logout();
        throw new Error('Unauthorized session expired');
      }
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  public get(path: string) {
    return this.request('GET', path);
  }

  public post(path: string, body: any) {
    return this.request('POST', path, body);
  }

  public put(path: string, body: any) {
    return this.request('PUT', path, body);
  }

  public delete(path: string) {
    return this.request('DELETE', path);
  }
}

export const api = new ApiClient();
export default api;
