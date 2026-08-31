import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore.js';
import { useUiStore } from '../store/uiStore.js';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  
  const token = useAuthStore((state) => state.accessToken);
  const addNotification = useUiStore((state) => state.addNotification);

  useEffect(() => {
    if (!token) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws?token=${token}`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      console.log('[WS Connection] Active');
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setLastMessage(msg);
        
        if (msg.type === 'ingest_status') {
          addNotification(
            'New Memory Captured',
            `Successfully indexed: "${msg.data?.title || 'Memory'}" from ${msg.data?.source || 'web'}`,
            'success'
          );
          queryClient.invalidateQueries({ queryKey: ['timeline'] });
          queryClient.invalidateQueries({ queryKey: ['folders'] });
          queryClient.invalidateQueries({ queryKey: ['people'] });
        } else if (msg.type === 'proactive_memory') {
          addNotification(
            'Proactive Concept Found',
            'Surfaced related context matches for Slack channel activity.',
            'info'
          );
          queryClient.invalidateQueries({ queryKey: ['timeline'] });
        } else if (msg.type === 'loop_completed') {
          addNotification(
            'Cognitive Loop Finished',
            `Loop ${msg.data?.loopType || ''} finished execution.`,
            'info'
          );
          queryClient.invalidateQueries({ queryKey: ['loops'] });
          queryClient.invalidateQueries({ queryKey: ['timeline'] });
        } else if (msg.type === 'automation_executed') {
          queryClient.invalidateQueries({ queryKey: ['automations'] });
        }
      } catch (err) {
        console.error('[WS Message Error]', err);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      console.log('[WS Connection] Closed');
    };

    return () => {
      socket.close();
    };
  }, [token, addNotification, queryClient]);

  return { isConnected, lastMessage };
}
export default useWebSocket;
