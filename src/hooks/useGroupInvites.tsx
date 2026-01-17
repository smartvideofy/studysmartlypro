import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface GroupInvite {
  id: string;
  group_id: string;
  invite_code: string;
  created_by: string;
  expires_at: string;
  max_uses: number | null;
  use_count: number;
  created_at: string;
}

// Generate a random invite code
const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export function useGroupInvites(groupId: string) {
  return useQuery({
    queryKey: ['group-invites', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_invites')
        .select('*')
        .eq('group_id', groupId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GroupInvite[];
    },
    enabled: !!groupId,
  });
}

export function useCreateInvite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      groupId, 
      expiresInDays = 7, 
      maxUses = null 
    }: { 
      groupId: string; 
      expiresInDays?: number; 
      maxUses?: number | null;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const inviteCode = generateInviteCode();

      const { data, error } = await supabase
        .from('group_invites')
        .insert({
          group_id: groupId,
          invite_code: inviteCode,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
          max_uses: maxUses,
        })
        .select()
        .single();

      if (error) throw error;
      return data as GroupInvite;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-invites', variables.groupId] });
      toast.success('Invite link created');
    },
    onError: (error) => {
      toast.error('Failed to create invite: ' + error.message);
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inviteId, groupId }: { inviteId: string; groupId: string }) => {
      const { error } = await supabase
        .from('group_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-invites', groupId] });
      toast.success('Invite revoked');
    },
    onError: (error) => {
      toast.error('Failed to revoke invite: ' + error.message);
    },
  });
}

export function useJoinByInvite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Find the invite
      const { data: invite, error: findError } = await supabase
        .from('group_invites')
        .select('*')
        .eq('invite_code', inviteCode)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (findError || !invite) {
        throw new Error('Invalid or expired invite code');
      }

      // Check max uses
      if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
        throw new Error('This invite has reached its maximum uses');
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', invite.group_id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        throw new Error('You are already a member of this group');
      }

      // Join the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: invite.group_id,
          user_id: user.id,
          role: 'member',
        });

      if (joinError) throw joinError;

      // Increment use count
      await supabase
        .from('group_invites')
        .update({ use_count: invite.use_count + 1 })
        .eq('id', invite.id);

      return invite.group_id;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success('Successfully joined the group!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
