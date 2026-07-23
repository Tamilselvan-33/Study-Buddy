import api from './api';

export interface Invitation {
  id: string;
  groupId: string;
  groupName: string;
  groupSubject: string;
  inviterName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export const inviteService = {
  /** Send an invite to a user to join a group */
  sendInvite: async (groupId: string, inviteeId: string): Promise<void> => {
    await api.post('/invitations', { groupId, inviteeId });
  },

  /** Get all invitations for the current user */
  getInvitations: async (status?: 'pending' | 'accepted' | 'declined'): Promise<Invitation[]> => {
    const params = status ? { status } : {};
    const res: any = await api.get('/invitations', { params });
    return res?.data?.invitations ?? [];
  },

  /** Accept or decline an invitation */
  respondToInvite: async (inviteId: string, action: 'accept' | 'decline'): Promise<void> => {
    await api.patch(`/invitations/${inviteId}`, { action });
  },

  /** Get count of pending invitations (for badge) */
  getPendingCount: async (): Promise<number> => {
    const res: any = await api.get('/invitations/count');
    return res?.data?.count ?? 0;
  },
};
