import { useAuthStore } from '../store/authStore.js';

class ApiClient {
  private refreshPromise: Promise<string | null> | null = null;

  private async getRefreshedToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshResponse = await fetch('/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (refreshResponse.ok) {
          const { accessToken } = await refreshResponse.json();
          if (accessToken) {
            useAuthStore.getState().setToken(accessToken);
            return accessToken;
          }
        }
        useAuthStore.getState().logout();
        return null;
      } catch {
        useAuthStore.getState().logout();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    let token = useAuthStore.getState().accessToken;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(path, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      // Attempt synchronized refresh
      const newToken = await this.getRefreshedToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(path, {
          method,
          headers,
          credentials: 'include',
          body: body ? JSON.stringify(body) : undefined,
        });
        if (!retryResponse.ok) {
          const err = await retryResponse.json().catch(() => ({}));
          throw new Error(err.error?.message || `Retry request failed with status ${retryResponse.status}`);
        }
        return retryResponse.json();
      } else {
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

  public patch(path: string, body: any) {
    return this.request('PATCH', path, body);
  }

  public delete(path: string) {
    return this.request('DELETE', path);
  }

  public async upload(path: string, formData: FormData): Promise<any> {
    let token = useAuthStore.getState().accessToken;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(path, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });

    if (response.status === 401) {
      const newToken = await this.getRefreshedToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(path, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: formData,
        });
        if (!retryResponse.ok) {
          const err = await retryResponse.json().catch(() => ({}));
          throw new Error(err.error?.message || `Upload failed with status ${retryResponse.status}`);
        }
        return retryResponse.json();
      } else {
        throw new Error('Unauthorized session expired');
      }
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Upload failed with status ${response.status}`);
    }

    return response.json();
  }
}

export const api = new ApiClient();
export default api;
