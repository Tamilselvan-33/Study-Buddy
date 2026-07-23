import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchMyGroups, createGroup, joinGroup, exploreGroups, deleteGroup } from '../services/groupService';
import type { StudyGroup } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { GroupDetail } from '../components/groups/GroupDetail';
import { CreateGroupModal } from '../components/groups/CreateGroupModal';
import { InvitationsInbox } from '../components/groups/InvitationsInbox';
import { inviteService } from '../services/inviteService';
import { Bell } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

const subjectColors: Record<string, string> = {
  'Mathematics': 'from-blue-500 to-cyan-500',
  'Physics': 'from-purple-500 to-indigo-500',
  'Chemistry': 'from-green-500 to-emerald-500',
  'Computer Science': 'from-orange-500 to-amber-500',
  'Biology': 'from-pink-500 to-rose-500',
  'Literature': 'from-yellow-500 to-orange-500',
  'History': 'from-red-500 to-pink-500',
  'Economics': 'from-teal-500 to-cyan-500',
  'Data Structures & Algorithms': 'from-violet-500 to-purple-500',
  'Machine Learning & AI': 'from-fuchsia-500 to-pink-500',
};

const getSubjectColor = (subject: string) => {
  for (const key of Object.keys(subjectColors)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) {
      return subjectColors[key];
    }
  }
  return 'from-slate-500 to-slate-600';
};

const avatarInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

// ── Group Card ────────────────────────────────────────────────────────────────

interface GroupCardProps {
  group: StudyGroup;
  isMember: boolean;
  currentUserId: string;
  onOpen: () => void;
  onJoin: () => void;
  onDelete: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({
  group,
  isMember,
  currentUserId,
  onOpen,
  onJoin,
  onDelete,
}) => {
  const isLeader = group.leaderId === currentUserId;
  const memberCount = group.members.length;
  const isFull = memberCount >= group.maxMembers;
  const gradient = getSubjectColor(group.subject);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="group relative h-full"
    >
      <Card noPadding className="h-full flex flex-col overflow-hidden border border-theme hover:border-[var(--accent-border)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-200">
        {/* Gradient header */}
        <div className={`h-2 w-full bg-gradient-to-r ${gradient}`} />

        <div className="p-5 flex-1 flex flex-col gap-3" onClick={onOpen}>
          {/* Subject badge + temp tag */}
          <div className="flex items-start justify-between gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${gradient} text-white shadow-sm`}
            >
              {group.subject}
            </span>
            {group.isTemporary && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--warning-light)] text-[var(--warning-text)] border border-[var(--warning-text)]/20">
                Temporary
              </span>
            )}
          </div>

          {/* Name & description */}
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] text-base leading-tight mb-1 group-hover:text-[var(--accent-text)] transition-colors">
              {group.name}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
              {group.description || 'No description provided.'}
            </p>
          </div>

          {/* Member avatars */}
          <div className="flex items-center gap-2 mt-auto">
            <div className="flex -space-x-2">
              {group.members.slice(0, 5).map((m) => (
                <div
                  key={m.userId}
                  title={m.name}
                  className="w-7 h-7 rounded-full border-2 border-[var(--surface)] bg-[var(--surface-3)] overflow-hidden flex items-center justify-center"
                >
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] font-bold text-[var(--text-secondary)]">
                      {avatarInitials(m.name)}
                    </span>
                  )}
                </div>
              ))}
              {memberCount > 5 && (
                <div className="w-7 h-7 rounded-full border-2 border-[var(--surface)] bg-[var(--surface-3)] flex items-center justify-center">
                  <span className="text-[9px] font-bold text-[var(--text-secondary)]">+{memberCount - 5}</span>
                </div>
              )}
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              {memberCount}/{group.maxMembers} members
            </span>
            {isLeader && (
              <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)]">
                Leader
              </span>
            )}
          </div>

          {/* Health bar */}
          {isMember && group.healthScore !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                <span>Group Health</span>
                <span className="font-semibold">{group.healthScore}%</span>
              </div>
              <div className="h-1 bg-[var(--surface-3)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    group.healthScore >= 70
                      ? 'bg-emerald-500'
                      : group.healthScore >= 40
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${group.healthScore}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="px-5 pb-4 flex gap-2">
          {isMember ? (
            <Button variant="primary" size="sm" onClick={onOpen} className="flex-1">
              Open Group
            </Button>
          ) : isFull ? (
            <Button variant="ghost" size="sm" disabled className="flex-1">
              Full
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={onJoin} className="flex-1">
              Join Group
            </Button>
          )}
          {isLeader && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-[var(--error-text)] hover:bg-[var(--error-light)] px-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

// ── Empty State ───────────────────────────────────────────────────────────────

const EmptyMyGroups: React.FC<{ onExplore: () => void; onCreate: () => void }> = ({
  onExplore,
  onCreate,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="col-span-full flex flex-col items-center justify-center py-20 text-center"
  >
    <div className="w-20 h-20 rounded-3xl bg-[var(--accent-light)] border border-[var(--accent-border)] flex items-center justify-center mb-6">
      <svg className="w-10 h-10 text-[var(--accent-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No study groups yet</h3>
    <p className="text-[var(--text-secondary)] max-w-md mb-6">
      Create your own group or explore public groups to get started studying with peers.
    </p>
    <div className="flex gap-3">
      <Button variant="primary" onClick={onCreate}>Create Group</Button>
      <Button variant="secondary" onClick={onExplore}>Explore Groups</Button>
    </div>
  </motion.div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'my-groups' | 'explore' | 'invitations';

export const GroupsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('my-groups');
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [exploreList, setExploreList] = useState<StudyGroup[]>([]);
  const [loadingMy, setLoadingMy] = useState(true);
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [exploreSearch, setExploreSearch] = useState('');
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  const currentUserId = user?.id ?? '';

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadMyGroups = useCallback(async () => {
    setLoadingMy(true);
    try {
      const res = await fetchMyGroups();
      if (res.success) setMyGroups(res.data.groups);
    } catch (err: unknown) {
      showToast(typeof err === 'string' ? err : 'Failed to load your groups.', 'error');
    } finally {
      setLoadingMy(false);
    }
  }, [showToast]);

  const loadExplore = useCallback(
    async (subject?: string) => {
      setLoadingExplore(true);
      try {
        const res = await exploreGroups(subject);
        if (res.success) setExploreList(res.data.groups);
      } catch (err: unknown) {
        showToast(typeof err === 'string' ? err : 'Failed to load groups.', 'error');
      } finally {
        setLoadingExplore(false);
      }
    },
    [showToast]
  );

  const fetchPendingCount = useCallback(async () => {
    try {
      const count = await inviteService.getPendingCount();
      setPendingInvitesCount(count);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    loadMyGroups();
    fetchPendingCount();
  }, [loadMyGroups, fetchPendingCount]);

  useEffect(() => {
    if (activeTab === 'explore') loadExplore();
    if (activeTab === 'invitations') fetchPendingCount();
  }, [activeTab, loadExplore, fetchPendingCount]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreateGroup = async (payload: Parameters<typeof createGroup>[0]) => {
    try {
      const res = await createGroup(payload);
      if (res.success) {
        setMyGroups((prev) => [res.data.group, ...prev]);
        showToast('Study group created!', 'success');
        setShowCreateModal(false);
        setSelectedGroup(res.data.group);
      }
    } catch (err: unknown) {
      showToast(typeof err === 'string' ? err : 'Failed to create group.', 'error');
    }
  };

  const handleJoin = async (groupId: string) => {
    try {
      await joinGroup(groupId);
      showToast('Joined group successfully!', 'success');
      await loadMyGroups();
      setActiveTab('my-groups');
    } catch (err: unknown) {
      showToast(typeof err === 'string' ? err : 'Failed to join group.', 'error');
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
    try {
      await deleteGroup(groupId);
      setMyGroups((prev) => prev.filter((g) => g.id !== groupId));
      showToast('Group deleted.', 'success');
    } catch (err: unknown) {
      showToast(typeof err === 'string' ? err : 'Failed to delete group.', 'error');
    }
  };

  const handleGroupUpdated = (updated: StudyGroup) => {
    setMyGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setSelectedGroup(updated);
  };

  // If a group is selected, show the detail view
  if (selectedGroup) {
    return (
      <GroupDetail
        group={selectedGroup}
        currentUserId={currentUserId}
        onBack={() => {
          setSelectedGroup(null);
          loadMyGroups();
        }}
        onGroupUpdated={handleGroupUpdated}
      />
    );
  }

  const displayList = activeTab === 'my-groups' ? myGroups : exploreList;
  const isLoading = activeTab === 'my-groups' ? loadingMy : loadingExplore;

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Study Groups</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Collaborate with peers in focused, goal-driven study groups.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="sm:self-start"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Group
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 tab-bar-bg rounded-xl w-fit">
          {(['my-groups', 'explore', 'invitations'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="group-tab-indicator"
                  className="absolute inset-0 bg-[var(--surface-2)] shadow-[var(--shadow-sm)] border border-theme rounded-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10 capitalize flex items-center gap-1.5">
                {tab === 'my-groups' && `My Groups (${myGroups.length})`}
                {tab === 'explore' && 'Explore'}
                {tab === 'invitations' && (
                  <>
                    <Bell className="w-3.5 h-3.5 inline" />
                    Invitations
                    {pendingInvitesCount > 0 && (
                      <span className="bg-[var(--accent)] text-[var(--text-on-accent)] text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                        {pendingInvitesCount}
                      </span>
                    )}
                  </>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Explore search */}
        <AnimatePresence>
          {activeTab === 'explore' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Search by subject…"
                value={exploreSearch}
                onChange={(e) => setExploreSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadExplore(exploreSearch)}
                className="input-base flex-1 rounded-xl px-4 py-2.5 text-sm"
              />
              <Button variant="secondary" onClick={() => loadExplore(exploreSearch)}>
                Search
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid / Invitations Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'invitations' ? (
            <motion.div
              key="invitations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl"
            >
              <InvitationsInbox
                onCountChange={(count) => {
                  setPendingInvitesCount(count);
                  loadMyGroups();
                }}
              />
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 rounded-2xl overflow-hidden">
                  <Skeleton className="w-full h-full" />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {displayList.length === 0 ? (
                activeTab === 'my-groups' ? (
                  <EmptyMyGroups
                    onExplore={() => setActiveTab('explore')}
                    onCreate={() => setShowCreateModal(true)}
                  />
                ) : (
                  <div className="col-span-full text-center py-16 text-[var(--text-muted)]">
                    No groups found. Try a different subject or create a new one.
                  </div>
                )
              ) : (
                displayList.map((group) => {
                  const isMember = group.members.some((m) => m.userId === currentUserId);
                  return (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isMember={isMember}
                      currentUserId={currentUserId}
                      onOpen={() => setSelectedGroup(group)}
                      onJoin={() => handleJoin(group.id)}
                      onDelete={() => handleDelete(group.id)}
                    />
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateGroupModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateGroup}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
