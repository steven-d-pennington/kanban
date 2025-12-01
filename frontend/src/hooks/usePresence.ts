import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface PresenceUser {
  odoo_id: string;
  email: string;
  name?: string;
  online_at: string;
}

export function usePresence(projectId: string | null) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || !projectId) {
      // Demo mode - show mock presence
      setUsers([
        {
          odoo_id: 'demo-user',
          email: 'demo@example.com',
          name: 'Demo User',
          online_at: new Date().toISOString(),
        },
      ]);
      return;
    }

    const client = supabase;
    const channel = client.channel(`presence:${projectId}`, {
      config: {
        presence: {
          key: user?.id || 'anonymous',
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const presentUsers: PresenceUser[] = [];
        Object.values(state).forEach((presences) => {
          presences.forEach((p) => {
            const presence = p as unknown as PresenceUser;
            if (presence.odoo_id) {
              presentUsers.push(presence);
            }
          });
        });
        setUsers(presentUsers);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const newUsers = newPresences
          .map((p) => p as unknown as PresenceUser)
          .filter((u) => u.odoo_id);
        setUsers((prev) => [...prev, ...newUsers]);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftIds = leftPresences
          .map((p) => (p as unknown as PresenceUser).odoo_id)
          .filter(Boolean);
        setUsers((prev) => prev.filter((u) => !leftIds.includes(u.odoo_id)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await channel.track({
            odoo_id: user.id,
            email: user.email || 'unknown',
            name: user.email?.split('@')[0] || 'User',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [projectId, user]);

  return users;
}
