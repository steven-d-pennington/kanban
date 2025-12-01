import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'demo';

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(
    isSupabaseConfigured() ? 'connecting' : 'demo'
  );

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setStatus('demo');
      return;
    }

    const client = supabase;
    const channel = client.channel('connection-status-check');

    channel.subscribe((channelStatus) => {
      if (channelStatus === 'SUBSCRIBED') {
        setStatus('connected');
      } else if (channelStatus === 'CLOSED' || channelStatus === 'CHANNEL_ERROR') {
        setStatus('disconnected');
      } else {
        setStatus('connecting');
      }
    });

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  return status;
}
