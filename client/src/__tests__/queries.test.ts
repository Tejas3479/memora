import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

describe('Client API & React Query Synchronization', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.restoreAllMocks();
  });

  it('should fetch and cache folders query', async () => {
    const mockFolders = [{ id: 'f-1', name: 'Research' }];
    vi.spyOn(api, 'get').mockResolvedValueOnce(mockFolders);

    const data = await queryClient.fetchQuery({
      queryKey: ['folders'],
      queryFn: () => api.get('/api/folders'),
    });

    expect(data).toEqual(mockFolders);
    expect(api.get).toHaveBeenCalledWith('/api/folders');
  });

  it('should invalidate folders cache on mutation', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.spyOn(api, 'post').mockResolvedValueOnce({ id: 'f-2', name: 'New Folder' });

    await api.post('/api/folders', { name: 'New Folder' });
    await queryClient.invalidateQueries({ queryKey: ['folders'] });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['folders'] });
  });

  it('should fetch teams query', async () => {
    const mockTeams = [{ id: 't-1', team: { name: 'Memora Core' }, role: 'owner' }];
    vi.spyOn(api, 'get').mockResolvedValueOnce(mockTeams);

    const data = await queryClient.fetchQuery({
      queryKey: ['teams'],
      queryFn: () => api.get('/api/teams'),
    });

    expect(data).toEqual(mockTeams);
    expect(api.get).toHaveBeenCalledWith('/api/teams');
  });

  it('should fetch loops history query', async () => {
    const mockHistory = {
      executions: [
        { id: 'e-1', loopType: 'DREAMING', status: 'COMPLETED' },
      ],
    };
    vi.spyOn(api, 'get').mockResolvedValueOnce(mockHistory);

    const data = await queryClient.fetchQuery({
      queryKey: ['loops', 'history'],
      queryFn: async () => {
        const res = await api.get('/api/loops/history');
        return res.executions;
      },
    });

    expect(data).toHaveLength(1);
    expect(data[0].loopType).toBe('DREAMING');
  });

  it('should trigger loop and post payload', async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({ success: true, executionId: 'e-2' });

    const res = await api.post('/api/loops/trigger', { loopType: 'SELF_REFLECTION' });
    expect(res.executionId).toBe('e-2');
    expect(api.post).toHaveBeenCalledWith('/api/loops/trigger', { loopType: 'SELF_REFLECTION' });
  });
});
