import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type Notification = Database['public']['Tables']['notifications']['Row'];

export function useNotifications(userId?: string) {
  const queryClient = useQueryClient();

  // Fetch notifications for the current user
  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Add new notification to cache
          queryClient.setQueryData<Notification[]>(
            ['notifications', userId],
            (old) => {
              if (!old) return [payload.new as Notification];
              return [payload.new as Notification, ...old];
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return {
    notifications,
    isLoading,
    error,
  };
}