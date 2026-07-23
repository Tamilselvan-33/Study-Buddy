import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import {
  fetchMetrics,
  fetchSessions,
  logSession,
  deleteSession,
  fetchInactiveGroups,
  fetchScheduleSuggestions,
  fetchGoalSuggestions,
} from '../services/progressService';
import type { StudySession, ProgressMetrics } from '../types';
import type {
  InactiveGroup,
  ScheduleBlock,
  GoalSuggestion,
} from '../services/progressService';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';

// ── Contribution Heatmap ──────────────────────────────────────────────────────

const ContributionHeatmap: React.FC<{ data: { date: string; hours: number }[] }> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const weeks: { date: string; hours: number }[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const maxHours = Math.max(...data.map((d) => d.hours), 1);

  const getCellClass = (hours: number) => {
    if (hours === 0) return 'heatmap-empty';
    const intensity = hours / maxHours;
    if (intensity < 0.25) return 'bg-[var(--accent)] opacity-35';
    if (intensity < 0.5) return 'bg-[var(--accent)] opacity-60';
    if (intensity < 0.75) return 'bg-[var(--accent)] opacity-85';
    return 'bg-[var(--accent)]';
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                title={`${day.date}: ${day.hours.toFixed(1)}h`}
                className={`w-3 h-3 rounded-sm transition-colors ${getCellClass(day.hours)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[10px] text-[var(--text-muted)] font-medium">Less</span>
        <div className="w-3 h-3 rounded-sm heatmap-empty" />
        <div className="w-3 h-3 rounded-sm bg-[var(--accent)] opacity-35" />
        <div className="w-3 h-3 rounded-sm bg-[var(--accent)] opacity-60" />
        <div className="w-3 h-3 rounded-sm bg-[var(--accent)] opacity-85" />
        <div className="w-3 h-3 rounded-sm bg-[var(--accent)]" />
        <span className="text-[10px] text-[var(--text-muted)] font-medium">More</span>
      </div>
    </div>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  gradient: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, gradient }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden bg-[var(--surface-2)] border border-theme rounded-2xl p-5 shadow-[var(--shadow-card)]"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-15 ${gradient}`} />
    <div className="relative z-10">
      <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${gradient} text-white mb-3 shadow-md`}>
        {icon}
      </div>
      <p className="text-3xl font-extrabold text-[var(--text-primary)]">{value}</p>
      <p className="text-sm font-semibold text-[var(--text-secondary)] mt-0.5">{label}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
    </div>
  </motion.div>
);

// ── Log Session Modal ─────────────────────────────────────────────────────────

interface LogSessionModalProps {
  onClose: () => void;
  onLog: (payload: Parameters<typeof logSession>[0]) => Promise<void>;
}

const LogSessionModal: React.FC<LogSessionModalProps> = ({ onClose, onLog }) => {
  const [form, setForm] = useState({
    title: '',
    durationMinutes: 60,
    date: new Date().toISOString().split('T')[0],
    topicsCovered: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim() || form.durationMinutes <= 0) return;
    setLoading(true);
    try {
      await onLog({
        title: form.title.trim(),
        durationMinutes: form.durationMinutes,
        date: form.date,
        topicsCovered: form.topicsCovered.split(',').map((s) => s.trim()).filter(Boolean),
        notes: form.notes.trim() || undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative z-10 w-full max-w-md modal-bg rounded-2xl shadow-2xl p-6 border border-theme"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Log Study Session</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Session Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g., DSA: Graph Algorithms"
              className="input-base w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Duration (minutes) *</label>
              <input
                type="number"
                min={1}
                max={1440}
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value) || 1 }))}
                className="input-base w-full rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="input-base w-full rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Topics Covered <span className="text-[var(--text-muted)] font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={form.topicsCovered}
              onChange={(e) => setForm((f) => ({ ...f, topicsCovered: e.target.value }))}
              placeholder="e.g., BFS, DFS, Dijkstra"
              className="input-base w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Key insights or takeaways…"
              rows={2}
              className="input-base w-full rounded-xl px-4 py-2.5 text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!form.title.trim() || form.durationMinutes <= 0 || loading}
            className="flex-1"
          >
            {loading ? 'Logging…' : 'Log Session'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Heuristics Section ────────────────────────────────────────────────────────

const priorityStyles = {
  High: 'bg-[var(--error-light)] text-[var(--error-text)] border-[rgba(239,68,68,0.25)]',
  Medium: 'bg-[var(--warning-light)] text-[var(--warning-text)] border-[rgba(245,158,11,0.25)]',
  Low: 'bg-[var(--success-light)] text-[var(--success-text)] border-[rgba(16,185,129,0.25)]',
};

interface HeuristicsPanelProps {
  inactiveGroups: InactiveGroup[];
  schedule: ScheduleBlock[];
  scheduleRationale: string;
  goals: GoalSuggestion[];
  avgHours: number;
  loadingH: boolean;
}

const HeuristicsPanel: React.FC<HeuristicsPanelProps> = ({
  inactiveGroups,
  schedule,
  scheduleRationale,
  goals,
  avgHours,
  loadingH,
}) => {
  if (loadingH) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Inactive groups alert */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--warning-light)] text-[var(--warning-text)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Inactive Groups</h3>
        </div>
        {inactiveGroups.length === 0 ? (
          <p className="text-sm text-[var(--success-text)] font-semibold">✓ All your groups are active!</p>
        ) : (
          <div className="space-y-2">
            {inactiveGroups.map((g) => (
              <div key={g.groupId} className="p-3 bg-[var(--warning-light)] border border-[var(--warning-text)]/20 rounded-xl">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{g.groupName}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {g.lastActivityDaysAgo != null
                    ? `Silent for ${g.lastActivityDaysAgo} days`
                    : 'Never had a conversation'}
                </p>
                <p className="text-xs text-[var(--warning-text)] font-semibold mt-1">{g.suggestion}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Schedule optimizer */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--info-light)] text-[var(--info-text)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Optimal Schedule</h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">{scheduleRationale}</p>
        <div className="space-y-2">
          {schedule.map((block, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 bg-[var(--surface-3)] border border-theme rounded-xl">
              <span className="text-sm font-semibold text-[var(--text-secondary)]">{block.day}</span>
              <span className="text-xs text-[var(--info-text)] font-bold font-mono">
                {block.startTime} – {block.endTime}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Goal suggestions */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--accent-light)] text-[var(--accent-text)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">AI Goal Suggestions</h3>
        </div>
        <p className="text-xs text-[var(--text-muted)] font-medium">Avg {avgHours}h/week recently</p>
        <div className="space-y-2 overflow-y-auto max-h-52">
          {goals.map((goal, i) => (
            <div key={i} className="p-2.5 bg-[var(--surface-3)] border border-theme rounded-xl space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug flex-1">{goal.goal}</p>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex-shrink-0 ${
                    priorityStyles[goal.priority]
                  }`}
                >
                  {goal.priority}
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] leading-snug">{goal.rationale}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const ProgressPage: React.FC = () => {
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState<ProgressMetrics | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);

  // Heuristics
  const [inactiveGroups, setInactiveGroups] = useState<InactiveGroup[]>([]);
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [scheduleRationale, setScheduleRationale] = useState('');
  const [goals, setGoals] = useState<GoalSuggestion[]>([]);
  const [avgHours, setAvgHours] = useState(0);
  const [loadingH, setLoadingH] = useState(true);

  const loadAll = useCallback(async () => {
    const [metricsRes, sessionsRes] = await Promise.allSettled([
      fetchMetrics(),
      fetchSessions(),
    ]);
    if (metricsRes.status === 'fulfilled' && metricsRes.value.success) {
      setMetrics(metricsRes.value.data.metrics);
    }
    setLoadingMetrics(false);
    if (sessionsRes.status === 'fulfilled' && sessionsRes.value.success) {
      setSessions(sessionsRes.value.data.sessions.slice().reverse());
    }
    setLoadingSessions(false);
  }, []);

  const loadHeuristics = useCallback(async () => {
    setLoadingH(true);
    const [inactiveRes, scheduleRes, goalsRes] = await Promise.allSettled([
      fetchInactiveGroups(),
      fetchScheduleSuggestions(),
      fetchGoalSuggestions(),
    ]);
    if (inactiveRes.status === 'fulfilled' && inactiveRes.value.success) {
      setInactiveGroups(inactiveRes.value.data.inactiveGroups);
    }
    if (scheduleRes.status === 'fulfilled' && scheduleRes.value.success) {
      setSchedule(scheduleRes.value.data.schedule);
      setScheduleRationale(scheduleRes.value.data.rationale);
    }
    if (goalsRes.status === 'fulfilled' && goalsRes.value.success) {
      setGoals(goalsRes.value.data.suggestions);
      setAvgHours(goalsRes.value.data.averageWeeklyHours);
    }
    setLoadingH(false);
  }, []);

  useEffect(() => {
    loadAll();
    loadHeuristics();
  }, [loadAll, loadHeuristics]);

  const handleLog = async (payload: Parameters<typeof logSession>[0]) => {
    try {
      const res = await logSession(payload);
      if (res.success) {
        setSessions((prev) => [res.data.session, ...prev]);
        showToast('Session logged!', 'success');
        setShowLogModal(false);
        // Refresh metrics
        fetchMetrics().then((r) => {
          if (r.success) setMetrics(r.data.metrics);
        });
      }
    } catch (err: unknown) {
      showToast(typeof err === 'string' ? err : 'Failed to log session.', 'error');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    try {
      await deleteSession(sessionId);
      showToast('Session removed.', 'success');
      fetchMetrics().then((r) => {
        if (r.success) setMetrics(r.data.metrics);
      });
    } catch (err: unknown) {
      showToast(typeof err === 'string' ? err : 'Failed to delete session.', 'error');
    }
  };

  const weeklyProgress =
    metrics
      ? Math.min(100, Math.round(((metrics.totalHoursStudied % metrics.weeklyGoalHours) / metrics.weeklyGoalHours) * 100))
      : 0;

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Progress Tracker</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Monitor your study hours, streaks, and AI-powered insights.
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowLogModal(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Log Session
          </Button>
        </div>

        {/* Stats grid */}
        {loadingMetrics ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Hours Studied"
              value={`${metrics.totalHoursStudied}h`}
              sub="All time"
              gradient="from-purple-600 to-indigo-600"
              icon={
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="Sessions Completed"
              value={metrics.sessionsCompleted}
              sub="Study logs"
              gradient="from-blue-600 to-cyan-600"
              icon={
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <StatCard
              label="Current Streak"
              value={`${metrics.currentStreakDays}d`}
              sub={metrics.currentStreakDays > 0 ? '🔥 Keep it up!' : 'Start today!'}
              gradient="from-orange-600 to-amber-600"
              icon={
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              }
            />
            <StatCard
              label="Tasks Completed"
              value={metrics.completedTasksCount}
              sub="Across all groups"
              gradient="from-emerald-600 to-teal-600"
              icon={
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        ) : null}

        {/* Weekly goal progress + heatmap */}
        {metrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Weekly goal */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[var(--text-primary)]">Weekly Goal</h3>
                <span className="text-sm text-[var(--accent-text)] font-extrabold font-mono">
                  {weeklyProgress}%
                </span>
              </div>
              <div>
                <div className="flex justify-between text-xs text-[var(--text-secondary)] font-medium mb-2">
                  <span>Target: {metrics.weeklyGoalHours}h/week</span>
                  <span>{weeklyProgress >= 100 ? '🎉 Goal reached!' : `${100 - weeklyProgress}% remaining`}</span>
                </div>
                <div className="h-3 bg-[var(--surface-3)] border border-theme rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                    animate={{ width: `${weeklyProgress}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </Card>

            {/* Contribution heatmap */}
            <Card className="space-y-3">
              <h3 className="font-bold text-[var(--text-primary)]">Activity Heatmap</h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">Last 12 weeks of study activity</p>
              <ContributionHeatmap data={metrics.contributionMap} />
            </Card>
          </div>
        )}

        {/* AI Heuristics */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-[var(--accent-light)]">
              <svg className="w-4 h-4 text-[var(--accent-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">AI Insights</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)]">
              BETA
            </span>
          </div>
          <HeuristicsPanel
            inactiveGroups={inactiveGroups}
            schedule={schedule}
            scheduleRationale={scheduleRationale}
            goals={goals}
            avgHours={avgHours}
            loadingH={loadingH}
          />
        </div>

        {/* Recent sessions */}
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Recent Sessions</h2>
          {loadingSessions ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[var(--border-strong)] rounded-2xl">
              <p className="text-[var(--text-muted)] text-sm mb-3">No sessions logged yet.</p>
              <Button variant="secondary" size="sm" onClick={() => setShowLogModal(true)}>
                Log Your First Session
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-4 p-4 bg-[var(--surface-2)] border border-theme rounded-xl group hover:border-[var(--accent-border)] transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)] border border-[var(--accent-border)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[var(--accent-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{session.title}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-[var(--text-muted)] font-medium">{session.date}</span>
                        <span className="text-xs text-[var(--accent-text)] font-semibold">
                          {session.durationMinutes >= 60
                            ? `${Math.floor(session.durationMinutes / 60)}h ${session.durationMinutes % 60 > 0 ? `${session.durationMinutes % 60}m` : ''}`
                            : `${session.durationMinutes}m`}
                        </span>
                        {session.topicsCovered?.map((t) => (
                          <Badge key={t} variant="slate" className="text-[10px] py-0">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--error-text)] hover:bg-[var(--error-light)] transition-all flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Log Session Modal */}
      <AnimatePresence>
        {showLogModal && (
          <LogSessionModal onClose={() => setShowLogModal(false)} onLog={handleLog} />
        )}
      </AnimatePresence>
    </div>
  );
};
