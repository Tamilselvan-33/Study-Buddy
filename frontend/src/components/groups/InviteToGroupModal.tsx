import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Send, Loader2, CheckCircle2, BookOpen } from 'lucide-react';
import { groupService } from '../../services/groupService';
import { inviteService } from '../../services/inviteService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';

interface Group {
  id: string;
  name: string;
  subject: string;
  members: any[];
  maxMembers: number;
  leaderId: string;
}

interface InviteToGroupModalProps {
  inviteeId: string;
  inviteeName: string;
  onClose: () => void;
}

export const InviteToGroupModal: React.FC<InviteToGroupModalProps> = ({
  inviteeId,
  inviteeName,
  onClose,
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const { showToast } = useToast();

  useEffect(() => {
    groupService.getMyGroups()
      .then(data => setGroups(data.filter((g: Group) => g.members.length < g.maxMembers)))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  const sendInvite = async (groupId: string, groupName: string) => {
    setSending(groupId);
    try {
      await inviteService.sendInvite(groupId, inviteeId);
      setSent(prev => new Set(prev).add(groupId));
      showToast(`Invitation sent to ${inviteeName} for "${groupName}"!`, 'success');
    } catch (err: any) {
      showToast(err || 'Failed to send invitation.', 'error');
    } finally {
      setSending(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="card w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-theme shrink-0">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Send className="w-4 h-4 text-[var(--accent)]" />
                Invite {inviteeName}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Select a group to send the invitation to
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-[var(--surface-2)] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-sm font-semibold text-[var(--text-secondary)]">No groups available</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Create a group first, or your groups may be full.
                </p>
              </div>
            ) : (
              groups.map(group => {
                const alreadySent = sent.has(group.id);
                const isSending = sending === group.id;
                return (
                  <div
                    key={group.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-theme bg-[var(--input-bg)] hover:border-[var(--border-strong)] transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{group.name}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{group.subject}</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {group.members.length}/{group.maxMembers}
                        </span>
                      </div>
                    </div>
                    {alreadySent ? (
                      <div className="flex items-center gap-1 text-xs font-semibold text-[var(--success-text)] shrink-0">
                        <CheckCircle2 className="w-4 h-4" /> Sent
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isSending}
                        onClick={() => sendInvite(group.id, group.name)}
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                      >
                        Invite
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-theme shrink-0">
            <Button variant="ghost" className="w-full" onClick={onClose}>Close</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
