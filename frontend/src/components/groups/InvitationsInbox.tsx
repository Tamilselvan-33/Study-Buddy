import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, Users, BookOpen, Clock, Loader2, Inbox } from 'lucide-react';
import { inviteService } from '../../services/inviteService';
import type { Invitation } from '../../services/inviteService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';

interface InvitationsInboxProps {
  onCountChange?: (count: number) => void;
}

export const InvitationsInbox: React.FC<InvitationsInboxProps> = ({ onCountChange }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const data = await inviteService.getInvitations();
      setInvitations(data);
      const pending = data.filter(i => i.status === 'pending').length;
      onCountChange?.(pending);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, [load]);

  const respond = async (id: string, action: 'accept' | 'decline') => {
    setResponding(id);
    try {
      await inviteService.respondToInvite(id, action);
      showToast(
        action === 'accept' ? '🎉 You joined the group!' : 'Invitation declined.',
        action === 'accept' ? 'success' : 'info'
      );
      await load();
    } catch (err: any) {
      showToast(err || 'Failed to respond to invitation.', 'error');
    } finally {
      setResponding(null);
    }
  };

  const pending = invitations.filter(i => i.status === 'pending');
  const history = invitations.filter(i => i.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center">
          <Inbox className="w-7 h-7 text-[var(--text-muted)]" />
        </div>
        <p className="text-sm font-semibold text-[var(--text-secondary)]">No invitations yet</p>
        <p className="text-xs text-[var(--text-muted)] max-w-xs">
          When someone invites you to their study group, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            Pending ({pending.length})
          </h3>
          <div className="space-y-3">
            <AnimatePresence>
              {pending.map(inv => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="card p-4 border-l-4 border-[var(--accent)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Users className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span className="text-sm font-bold text-[var(--text-primary)] truncate">{inv.groupName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mb-0.5">
                        <BookOpen className="w-3 h-3" />
                        {inv.groupSubject}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                        <Clock className="w-3 h-3" />
                        Invited by <span className="font-semibold text-[var(--text-secondary)] ml-1">{inv.inviterName}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={responding === inv.id}
                        onClick={() => respond(inv.id, 'accept')}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        isLoading={responding === inv.id}
                        onClick={() => respond(inv.id, 'decline')}
                        leftIcon={<X className="w-3.5 h-3.5" />}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">History</h3>
          <div className="space-y-2">
            {history.map(inv => (
              <div key={inv.id} className="card p-3 opacity-60 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{inv.groupName}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-2">from {inv.inviterName}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  inv.status === 'accepted'
                    ? 'bg-[var(--success-light)] text-[var(--success-text)]'
                    : 'bg-[var(--error-light)] text-[var(--error-text)]'
                }`}>
                  {inv.status === 'accepted' ? 'Joined' : 'Declined'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
