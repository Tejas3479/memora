import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { SearchResult, LoopType } from '@memora/shared';

// ─── Timeline Queries ────────────────────────────────────────────────────────

export interface TimelineFilters {
  source?: string;
  folderId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export function useTimelineInfiniteQuery(filters: TimelineFilters = {}) {
  const { source = '', folderId = '', dateFrom = '', dateTo = '', limit = 10 } = filters;

  return useInfiniteQuery({
    queryKey: ['timeline', { source, folderId, dateFrom, dateTo }],
    queryFn: async ({ pageParam = 0 }) => {
      let url = `/api/timeline?limit=${limit}&offset=${pageParam}`;
      if (source) url += `&source=${encodeURIComponent(source)}`;
      if (folderId) url += `&folderId=${encodeURIComponent(folderId)}`;
      if (dateFrom) url += `&dateFrom=${encodeURIComponent(dateFrom)}`;
      if (dateTo) url += `&dateTo=${encodeURIComponent(dateTo)}`;
      const res = await api.get(url);
      return {
        items: (res.items || []) as SearchResult[],
        hasMore: Boolean(res.hasMore),
        nextOffset: pageParam + (res.items?.length || 0),
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
  });
}

export function useCreateMemoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content: string; source?: string; url?: string; folderId?: string }) =>
      api.post('/api/ingest', {
        title: data.title,
        content: data.content,
        source: data.source || 'NOTE',
        url: data.url || `note://${Date.now()}`,
        metadata: data.folderId ? { folderId: data.folderId } : {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['graph'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useUploadFileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.upload('/api/upload', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['graph'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

// ─── Folders Queries & Mutations ─────────────────────────────────────────────

export function useFoldersQuery() {
  return useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const res = await api.get('/api/folders');
      return Array.isArray(res) ? res : [];
    },
  });
}

export function useCreateFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; parentId?: string; color?: string; icon?: string }) =>
      api.post('/api/folders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useDeleteFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (folderId: string) => api.delete(`/api/folders/${folderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

// ─── Teams Queries & Mutations ───────────────────────────────────────────────

export function useTeamsQuery() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get('/api/teams');
      return Array.isArray(res) ? res : [];
    },
  });
}

export function useCreateTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) => api.post('/api/teams', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useTeamDetailsQuery(teamId: string) {
  return useQuery({
    queryKey: ['teams', teamId],
    queryFn: async () => {
      if (!teamId) return null;
      return api.get(`/api/teams/${teamId}`);
    },
    enabled: Boolean(teamId),
  });
}

export function useInviteTeamMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, email, role }: { teamId: string; email: string; role?: string }) =>
      api.post(`/api/teams/${teamId}/invite`, { email, role }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useRemoveTeamMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      api.delete(`/api/teams/${teamId}/members/${userId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

// ─── Automations Queries & Mutations ─────────────────────────────────────────

export function useAutomationsQuery() {
  return useQuery({
    queryKey: ['automations'],
    queryFn: async () => {
      const res = await api.get('/api/automations');
      return Array.isArray(res) ? res : [];
    },
  });
}

export function useCreateAutomationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      trigger: string;
      conditions?: Record<string, any>;
      actions: string[];
      actionConfig?: Record<string, any>;
    }) => api.post('/api/automations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });
}

export function useToggleAutomationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.put(`/api/automations/${id}`, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });
}

export function useDeleteAutomationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/automations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });
}

// ─── Cognitive Loops Queries & Mutations ─────────────────────────────────────

export function useLoopsHistoryQuery() {
  return useQuery({
    queryKey: ['loops', 'history'],
    queryFn: async () => {
      const res = await api.get('/api/loops/history');
      return (res.executions || []) as Array<{
        id: string;
        loopType: LoopType | string;
        status: string;
        input: Record<string, any>;
        output?: any;
        startedAt: string;
        completedAt?: string;
        error?: string;
      }>;
    },
    refetchInterval: (query) => {
      const hasRunning = query.state.data?.some(
        (e) => e.status === 'PENDING' || e.status === 'RUNNING'
      );
      return hasRunning ? 2500 : false;
    },
  });
}

export function useTriggerLoopMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { loopType: LoopType | string; config?: Record<string, any>; sync?: boolean }) =>
      api.post('/api/loops/trigger', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loops'] });
    },
  });
}

// ─── People Registry Queries & Mutations ─────────────────────────────────────

export function usePeopleQuery(searchQuery: string = '') {
  return useQuery({
    queryKey: ['people', searchQuery],
    queryFn: async () => {
      const res = await api.get(`/api/people?query=${encodeURIComponent(searchQuery)}`);
      return Array.isArray(res) ? res : [];
    },
  });
}

export function useCreatePersonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email?: string; company?: string; role?: string; notes?: string }) =>
      api.post('/api/people', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });
}

export function usePersonDetailsQuery(personId: string) {
  return useQuery({
    queryKey: ['people', personId],
    queryFn: async () => {
      if (!personId) return null;
      return api.get(`/api/people/${personId}`);
    },
    enabled: Boolean(personId),
  });
}

export function useUpdatePersonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; email?: string; company?: string; role?: string; notes?: string } }) =>
      api.put(`/api/people/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['people', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });
}

export function useDeletePersonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/people/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });
}

// ─── Integrations & Billing Queries ──────────────────────────────────────────

export function useIntegrationsQuery() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const res = await api.get('/api/integrations');
      return Array.isArray(res) ? res : [];
    },
  });
}

export function useDisconnectIntegrationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/integrations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}

export function useBillingQuery() {
  return useQuery({
    queryKey: ['billing'],
    queryFn: async () => {
      return api.get('/api/billing/status');
    },
  });
}

export function useUserProfileQuery() {
  return useQuery({
    queryKey: ['account', 'profile'],
    queryFn: async () => {
      return api.get('/api/account');
    },
  });
}

// ─── Knowledge Graph Queries ─────────────────────────────────────────────────

export function useGraphQuery() {
  return useQuery({
    queryKey: ['graph'],
    queryFn: async () => {
      const res = await api.get('/api/graph');
      return {
        nodes: res.graph?.nodes || [],
        edges: res.graph?.edges || [],
      };
    },
  });
}
