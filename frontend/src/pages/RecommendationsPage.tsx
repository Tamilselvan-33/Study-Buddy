import React, { useEffect, useState, useTransition } from 'react';
import { Sparkles, Search, RefreshCw, Filter, Compass, Users } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { matchingService } from '../services/matchingService';
import { PartnerCard } from '../components/matching/PartnerCard';
import { MatchExplanationModal } from '../components/matching/MatchExplanationModal';
import { InviteToGroupModal } from '../components/groups/InviteToGroupModal';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import type { MatchRecommendation } from '../types';

const SUBJECT_OPTIONS = [
  'All Subjects',
  'Data Structures & Algorithms',
  'Machine Learning & AI',
  'Web Development',
  'Database Systems',
  'Calculus & Linear Algebra',
  'Computer Systems & Networks',
  'Software Architecture',
];

const SKILL_OPTIONS = ['All Skill Levels', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

export const RecommendationsPage: React.FC = () => {
  const { showToast } = useToast();
  const [, startTransition] = useTransition();

  const [recommendations, setRecommendations] = useState<MatchRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedSkill, setSelectedSkill] = useState('All Skill Levels');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState<'compatibility' | 'name' | 'skill'>('compatibility');

  // Selected match modal state
  const [selectedMatch, setSelectedMatch] = useState<MatchRecommendation | null>(null);
  // Invite modal state
  const [inviteTarget, setInviteTarget] = useState<{ userId: string; name: string } | null>(null);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const data = await matchingService.getRecommendations({
        subject: selectedSubject === 'All Subjects' ? undefined : selectedSubject,
        skill_level: selectedSkill === 'All Skill Levels' ? undefined : selectedSkill,
        min_score: minScore > 0 ? minScore : undefined,
        search: searchQuery.trim() || undefined,
        sort_by: sortBy,
      });
      setRecommendations(data);
    } catch (err: any) {
      showToast(err || 'Failed to load study partner recommendations.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        fetchRecommendations();
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedSubject, selectedSkill, minScore, sortBy]);

  const handleInvite = (userId: string, name: string) => {
    setInviteTarget({ userId, name });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="hero-banner p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-[var(--accent-light)] border border-[var(--accent-border)] text-[var(--accent-text)]">
            <Sparkles className="w-3.5 h-3.5" />
            scikit-learn Cosine Similarity Matrix
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Recommended <span className="gradient-text">Study Partners</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl mt-1">
            Discover compatible students matched by subject, learning style, schedule, goals, and commitment level.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchRecommendations}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          className="z-10"
        >
          Recalculate Matches
        </Button>
      </div>

      {/* Controls & Multi-Filter Bar */}
      <div className="card p-4 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, college, or bio..."
              className="input-base w-full pl-10 pr-4 py-2 rounded-xl text-sm"
            />
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-medium text-[var(--text-secondary)] shrink-0">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input-base px-3 py-2 rounded-xl text-xs"
            >
              <option value="compatibility">Compatibility % (Highest First)</option>
              <option value="name">Student Name (A-Z)</option>
              <option value="skill">Skill Alignment</option>
            </select>
          </div>
        </div>

        {/* Filter Chips Row */}
        <div className="pt-3 border-t border-theme flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-semibold mr-2">
            <Filter className="w-3.5 h-3.5 text-[var(--accent-text)]" /> Filters:
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="input-base px-3 py-1.5 rounded-xl text-xs"
          >
            {SUBJECT_OPTIONS.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Skill Filter */}
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="input-base px-3 py-1.5 rounded-xl text-xs"
          >
            {SKILL_OPTIONS.map((sk) => (
              <option key={sk} value={sk}>
                {sk}
              </option>
            ))}
          </select>

          {/* Min Score Filter */}
          <div className="flex items-center gap-2 bg-[var(--surface-2)] px-3 py-1.5 rounded-xl border border-theme text-xs text-[var(--text-secondary)]">
            <span>Min Score:</span>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-20 accent-[var(--accent)]"
            />
            <span className="font-mono text-[var(--accent-text)] font-bold">{minScore}%</span>
          </div>

          {/* Reset Filters */}
          {(selectedSubject !== 'All Subjects' ||
            selectedSkill !== 'All Skill Levels' ||
            minScore > 0 ||
            searchQuery) && (
            <button
              onClick={() => {
                setSelectedSubject('All Subjects');
                setSelectedSkill('All Skill Levels');
                setMinScore(0);
                setSearchQuery('');
              }}
              className="text-xs text-[var(--error-text)] hover:underline underline-offset-2 ml-auto font-semibold"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Showing {recommendations.length} compatible study partners</span>
            <span className="font-mono text-[var(--accent-text)] font-bold">14-factor weighted similarity</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((match) => (
              <PartnerCard
                key={match.userId}
                match={match}
                onViewExplanation={(m) => setSelectedMatch(m)}
                onInvite={handleInvite}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="card p-12 text-center space-y-4 max-w-md mx-auto my-12">
          <div className="p-4 rounded-full bg-[var(--accent-light)] border border-[var(--accent-border)] w-16 h-16 mx-auto flex items-center justify-center text-[var(--accent-text)]">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">No Matching Study Partners Found</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Try adjusting your search query, lowering your minimum compatibility score, or broadening your subject filters.
          </p>
          <Button
            variant="primary"
            onClick={() => {
              setSelectedSubject('All Subjects');
              setSelectedSkill('All Skill Levels');
              setMinScore(0);
              setSearchQuery('');
            }}
            leftIcon={<Users className="w-4 h-4" />}
          >
            Show All Available Partners
          </Button>
        </div>
      )}

      {/* Match Explanation Modal */}
      <MatchExplanationModal
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onInvite={handleInvite}
      />

      {/* Invite to Group Modal */}
      {inviteTarget && (
        <InviteToGroupModal
          inviteeId={inviteTarget.userId}
          inviteeName={inviteTarget.name}
          onClose={() => setInviteTarget(null)}
        />
      )}
    </div>
  );
};
