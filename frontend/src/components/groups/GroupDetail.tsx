import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import {
  fetchTasks, createTask, updateTask, deleteTask,
  fetchResources, createResource, deleteResource,
  fetchMessages, sendMessage,
  leaveGroup, removeMember,
} from '../../services/groupService';
import type { StudyGroup, GroupTask, GroupResource, GroupMessage } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';

// ── Utility ───────────────────────────────────────────────────────────────────

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const categoryColors: Record<string, string> = {
  'Notes': 'bg-[var(--info-light)] text-[var(--info-text)] border-[rgba(59,130,246,0.2)]',
  'Video': 'bg-[var(--error-light)] text-[var(--error-text)] border-[rgba(239,68,68,0.2)]',
  'Article': 'bg-[var(--success-light)] text-[var(--success-text)] border-[rgba(16,185,129,0.2)]',
  'GitHub': 'bg-[var(--surface-3)] text-[var(--text-secondary)] border-[var(--border)]',
  'PDF': 'bg-[var(--warning-light)] text-[var(--warning-text)] border-[rgba(245,158,11,0.2)]',
  'General': 'bg-[var(--accent-light)] text-[var(--accent-text)] border-[var(--accent-border)]',
};

type GroupDetailTab = 'chat' | 'tasks' | 'resources' | 'members';

// ── Chat Panel ────────────────────────────────────────────────────────────────

const ChatPanel: React.FC<{ groupId: string; currentUserId: string }> = ({
  groupId,
  currentUserId,
}) => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchMessages(groupId);
      if (res.success) setMessages(res.data.messages);
    } catch {
      showToast('Failed to load messages.', 'error');
    } finally {
      setLoading(false);
    }
  }, [groupId, showToast]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000); // Poll every 8s
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput('');
    try {
      const res = await sendMessage(groupId, content);
      if (res.success) setMessages((prev) => [...prev, res.data.message]);
    } catch (err: unknown) {
      showToast(typeof err === 'string' ? err : 'Failed to send message.', 'error');
      setInput(content); // restore
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <Skeleton className="h-12 w-48 rounded-2xl" />
            </div>
          ))
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-3)] border border-theme flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-[var(--text-secondary)] text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-sm">
                  {msg.senderName.charAt(0).toUpperCase()}
                </div>
                <div className={`flex flex-col gap-0.5 max-w-[70%] ${isMe ? 'items-end' : ''}`}>
                  <span className="text-[10px] text-[var(--text-muted)] px-1">
                    {isMe ? 'You' : msg.senderName} · {timeAgo(msg.timestamp)}
                  </span>
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-[var(--accent)] text-white rounded-tr-sm shadow-sm'
                        : 'msg-bubble-them border border-theme rounded-tl-sm shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-theme p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type a message… (Enter to send)"
          className="input-base flex-1 rounded-xl px-4 py-2 text-sm"
          maxLength={2000}
        />
        <Button
          variant="primary"
          size="sm"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="px-4"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </Button>
      </div>
    </div>
  );
};

// ── Tasks Panel ───────────────────────────────────────────────────────────────

const TasksPanel: React.FC<{
  groupId: string;
  members: StudyGroup['members'];
  currentUserId: string;
}> = ({ groupId, members }) => {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<GroupTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchTasks(groupId);
        if (res.success) setTasks(res.data.tasks);
      } catch {
        showToast('Failed to load tasks.', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId, showToast]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await createTask(groupId, {
        title: newTitle.trim(),
        assignedTo: newAssignee || undefined,
        dueDate: newDueDate || undefined,
      });
      if (res.success) {
        setTasks((prev) => [...prev, res.data.task]);
        setNewTitle('');
        setNewAssignee('');
        setNewDueDate('');
        setShowForm(false);
        showToast('Task added!', 'success');
      }
    } catch (err: unknown) {
      showToast(typeof err === 'string' ? err : 'Failed to add task.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (task: GroupTask) => {
    const prev = task.completed;
    setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, completed: !prev } : x)));
    try {
      await updateTask(groupId, task.id, { completed: !prev });
    } catch {
      setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, completed: prev } : x)));
    }
  };

  const handleDelete = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await deleteTask(groupId, taskId);
    } catch (err: unknown) {
      showToast(typeof err === 'string' ? err : 'Failed to delete task.', 'error');
    }
  };

  const done = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
      {/* Progress summary */}
      {tasks.length > 0 && (
        <div className="p-3 bg-[var(--surface-3)] rounded-xl border border-theme space-y-2">
          <div className="flex justify-between text-sm text-[var(--text-secondary)] font-medium">
            <span>{done}/{tasks.length} tasks complete</span>
            <span className="text-[var(--accent-text)] font-bold">{progress}%</span>
          </div>
          <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden border border-theme">
            <motion.div
              className="h-full bg-[var(--accent)] rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))
      ) : tasks.length === 0 && !showForm ? (
        <div className="text-center py-10 text-[var(--text-muted)] text-sm">
          No tasks yet. Add your first one below!
        </div>
      ) : (
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-start gap-3 p-3 bg-[var(--surface-2)] rounded-xl border border-theme group hover:border-[var(--accent-border)] transition-colors duration-150"
            >
              {/* Checkbox */}
              <button
                onClick={() => handleToggle(task)}
                className={`mt-0.5 w-5 h-5 rounded-md border flex-shrink-0 transition-colors flex items-center justify-center ${
                  task.completed
                    ? 'bg-[var(--accent)] border-[var(--accent)]'
                    : 'border-[var(--border-input)] hover:border-[var(--accent)]'
                }`}
              >
                {task.completed && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${task.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {task.assignedTo && (
                    <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                      👤 {task.assignedTo}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className={`text-[11px] font-medium ${new Date(task.dueDate) < new Date() && !task.completed ? 'text-[var(--error-text)]' : 'text-[var(--text-muted)]'}`}>
                      📅 Due {formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--error-text)] hover:bg-[var(--error-light)] transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Add task form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 bg-[var(--surface-3)] border border-theme rounded-xl p-3"
          >
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Task title…"
              autoFocus
              className="input-base w-full rounded-lg px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="input-base bg-[var(--input-bg)] border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Assign to…</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="input-base bg-[var(--input-bg)] border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAdd}
                disabled={!newTitle.trim() || adding}
                className="flex-1"
              >
                {adding ? 'Adding…' : 'Add Task'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2.5 border border-dashed border-[var(--border-strong)] rounded-xl text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)] transition-all flex items-center justify-center gap-2 font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      )}
    </div>
  );
};

// ── Resources Panel ───────────────────────────────────────────────────────────

const RESOURCE_CATEGORIES = ['General', 'Notes', 'Video', 'Article', 'GitHub', 'PDF'];

const ResourcesPanel: React.FC<{ groupId: string }> = ({ groupId }) => {
  const { showToast } = useToast();
  const [resources, setResources] = useState<GroupResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', category: 'General' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchResources(groupId);
        if (res.success) setResources(res.data.resources);
      } catch {
        showToast('Failed to load resources.', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId, showToast]);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.url.trim()) return;
    setAdding(true);
    try {
      const res = await createResource(groupId, form);
      if (res.success) {
        setResources((prev) => [res.data.resource, ...prev]);
        setForm({ title: '', url: '', category: 'General' });
        setShowForm(false);
        showToast('Resource shared!', 'success');
      }
    } catch (err: unknown) {
      showToast(typeof err === 'string' ? err : 'Failed to share resource.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
    try {
      await deleteResource(groupId, resourceId);
    } catch (err: unknown) {
      showToast(typeof err === 'string' ? err : 'Failed to remove resource.', 'error');
    }
  };

  // Group by category
  const byCategory: Record<string, GroupResource[]> = {};
  for (const r of resources) {
    const cat = r.category || 'General';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(r);
  }

  return (
    <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
      ) : resources.length === 0 && !showForm ? (
        <div className="text-center py-10 text-[var(--text-muted)] text-sm">
          No resources yet. Share a link with your group!
        </div>
      ) : (
        Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat}>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 mt-1">{cat}</p>
            <div className="space-y-2">
              {items.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-xl border border-theme group hover:border-[var(--accent-border)] transition-colors duration-150"
                >
                  <div className="flex-1 min-w-0">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-[var(--accent-text)] hover:underline truncate block"
                    >
                      {r.title}
                    </a>
                    <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{r.url}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        categoryColors[cat] || categoryColors['General']
                      }`}
                    >
                      {cat}
                    </span>
                    <span className="text-[10px] font-medium text-[var(--text-secondary)]">Shared by {r.sharedBy}</span>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--error-text)] hover:bg-[var(--error-light)] transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add resource form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 bg-[var(--surface-3)] border border-theme rounded-xl p-3"
          >
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Resource title…"
              autoFocus
              className="input-base w-full rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://…"
              className="input-base w-full rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="input-base w-full rounded-lg px-3 py-2 text-sm bg-[var(--input-bg)]"
            >
              {RESOURCE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAdd}
                disabled={!form.title.trim() || !form.url.trim() || adding}
                className="flex-1"
              >
                {adding ? 'Sharing…' : 'Share'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2.5 border border-dashed border-[var(--border-strong)] rounded-xl text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)] transition-all flex items-center justify-center gap-2 font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Share Resource
        </button>
      )}
    </div>
  );
};

// ── Members Panel ─────────────────────────────────────────────────────────────

const MembersPanel: React.FC<{
  group: StudyGroup;
  currentUserId: string;
  onGroupUpdated: (g: StudyGroup) => void;
}> = ({ group, currentUserId, onGroupUpdated }) => {
  const { showToast } = useToast();
  const isLeader = group.leaderId === currentUserId;

  const handleKick = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this group?`)) return;
    try {
      await removeMember(group.id, memberId);
      onGroupUpdated({
        ...group,
        members: group.members.filter((m) => m.userId !== memberId),
      });
      showToast(`${memberName} removed from group.`, 'success');
    } catch (err: unknown) {
      showToast(typeof err === 'string' ? err : 'Failed to remove member.', 'error');
    }
  };

  return (
    <div className="p-4 space-y-2 max-h-[520px] overflow-y-auto">
      {/* Charter */}
      {group.charter && (
        <div className="mb-4 p-4 bg-[var(--accent-light)] border border-[var(--accent-border)] rounded-xl">
          <h4 className="text-sm font-semibold text-[var(--accent-text)] mb-1">Group Charter</h4>
          <p className="text-sm text-[var(--text-secondary)] font-medium">{group.charter.objective}</p>
          {group.charter.expectations?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {group.charter.expectations.map((exp, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="text-[var(--accent-text)] mt-0.5 font-bold">•</span>
                  {exp}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Member list */}
      {group.members.map((member) => (
        <motion.div
          key={member.userId}
          layout
          className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-xl border border-theme"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[var(--surface-3)]">
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                {member.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {member.name}
              {member.userId === currentUserId && (
                <span className="ml-1.5 text-[10px] text-[var(--text-muted)] font-normal">(You)</span>
              )}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{member.email}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={member.role === 'Leader' ? 'purple' : 'slate'}>
              {member.role}
            </Badge>
            {isLeader && member.userId !== currentUserId && (
              <button
                onClick={() => handleKick(member.userId, member.name)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--error-text)] hover:bg-[var(--error-light)] transition-all"
                title="Remove member"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                </svg>
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ── Group Detail ──────────────────────────────────────────────────────────────

interface GroupDetailProps {
  group: StudyGroup;
  currentUserId: string;
  onBack: () => void;
  onGroupUpdated: (group: StudyGroup) => void;
}

export const GroupDetail: React.FC<GroupDetailProps> = ({
  group: initialGroup,
  currentUserId,
  onBack,
  onGroupUpdated,
}) => {
  const { showToast } = useToast();
  const [group, setGroup] = useState<StudyGroup>(initialGroup);
  const [activeTab, setActiveTab] = useState<GroupDetailTab>('chat');
  const [leavingGroup, setLeavingGroup] = useState(false);

  const isLeader = group.leaderId === currentUserId;
  const memberCount = group.members.length;

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    setLeavingGroup(true);
    try {
      await leaveGroup(group.id);
      showToast('You have left the group.', 'success');
      onBack();
    } catch (err: unknown) {
      showToast(typeof err === 'string' ? err : 'Failed to leave group.', 'error');
      setLeavingGroup(false);
    }
  };

  const handleGroupUpdated = (updated: StudyGroup) => {
    setGroup(updated);
    onGroupUpdated(updated);
  };

  const TABS: { id: GroupDetailTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'chat',
      label: 'Chat',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      id: 'members',
      label: `Members (${memberCount})`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="min-h-screen bg-[var(--app-bg)] px-4 py-8"
    >
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Back + header */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-theme text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] truncate">{group.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-[var(--text-secondary)] font-medium">{group.subject}</span>
              <span className="text-[var(--text-muted)] font-bold">·</span>
              <span className="text-sm text-[var(--text-secondary)]">
                {memberCount}/{group.maxMembers} members
              </span>
              {group.meetingTime && (
                <>
                  <span className="text-[var(--text-muted)] font-bold">·</span>
                  <span className="text-sm text-[var(--text-secondary)]">📅 {group.meetingTime}</span>
                </>
              )}
            </div>
          </div>
          {!isLeader && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeave}
              disabled={leavingGroup}
              className="text-[var(--error-text)] hover:bg-[var(--error-light)] flex-shrink-0"
            >
              {leavingGroup ? 'Leaving…' : 'Leave'}
            </Button>
          )}
        </div>

        {/* Group description */}
        {group.description && (
          <p className="text-sm text-[var(--text-secondary)] bg-[var(--surface-2)] border border-theme rounded-xl px-4 py-3 leading-relaxed">
            {group.description}
          </p>
        )}

        {/* Tab nav + panel */}
        <div className="bg-[var(--surface-2)] border border-theme rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
          {/* Tab bar */}
          <div className="flex border-b border-theme overflow-x-auto bg-[var(--surface-3)]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-[var(--accent-text)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="group-detail-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === 'chat' && (
                <ChatPanel groupId={group.id} currentUserId={currentUserId} />
              )}
              {activeTab === 'tasks' && (
                <TasksPanel
                  groupId={group.id}
                  members={group.members}
                  currentUserId={currentUserId}
                />
              )}
              {activeTab === 'resources' && <ResourcesPanel groupId={group.id} />}
              {activeTab === 'members' && (
                <MembersPanel
                  group={group}
                  currentUserId={currentUserId}
                  onGroupUpdated={handleGroupUpdated}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
