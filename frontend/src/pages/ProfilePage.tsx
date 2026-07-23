import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  User,
  GraduationCap,
  BookOpen,
  Target,
  Clock,
  Calendar,
  MessageSquare,
  Users,
  Sparkles,
  Save,
  CheckCircle2,
  Plus,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/userService';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import type {
  UserProfile,
  SkillLevel,
  LearningStyle,
  PreferredTime,
  CommitmentLevel,
  CommunicationPref,
} from '../types';

const PRESET_SUBJECTS = [
  'Data Structures & Algorithms',
  'Machine Learning & AI',
  'Web Development',
  'Database Systems',
  'Computer Systems & Networks',
  'Calculus & Linear Algebra',
  'Physics & Engineering',
  'Software Architecture',
  'Cybersecurity',
  'Mobile App Development',
];

const PRESET_GOALS = [
  'Exam & Final Revision',
  'Project Collaboration',
  'Interview & LeetCode Prep',
  'Daily Homework & Assignments',
  'Hackathons & Coding Contests',
  'Research & Paper Discussion',
];

const SKILL_LEVELS: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const LEARNING_STYLES: LearningStyle[] = ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic', 'Project-Based'];
const STUDY_TIMES: PreferredTime[] = ['Early Morning', 'Afternoon', 'Evening', 'Late Night', 'Flexible'];
const COMMITMENT_LEVELS: CommitmentLevel[] = [
  'Low (1-3 hrs/wk)',
  'Moderate (4-8 hrs/wk)',
  'High (9-15 hrs/wk)',
  'Intensive (15+ hrs/wk)',
];
const COMMUNICATION_PREFS: CommunicationPref[] = [
  'Discord Chat',
  'Google Meet / Video',
  'In-Person',
  'Async Messages',
  'Mixed',
];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Multi-select states
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');

  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');

  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Wednesday', 'Friday']);

  const { register, handleSubmit, setValue, watch } = useForm<UserProfile>({
    defaultValues: {
      name: '',
      college: '',
      department: '',
      year: '1st Year',
      skillLevel: 'Intermediate',
      learningStyle: 'Visual',
      preferredStudyTime: 'Evening',
      commitmentLevel: 'Moderate (4-8 hrs/wk)',
      communicationPref: 'Discord Chat',
      preferredGroupSize: 4,
      bio: '',
      avatarUrl: '',
    },
  });

  const watchName = watch('name');
  const watchCollege = watch('college');
  const watchDepartment = watch('department');
  const watchYear = watch('year');
  const watchSkillLevel = watch('skillLevel');
  const watchLearningStyle = watch('learningStyle');
  const watchStudyTime = watch('preferredStudyTime');
  const watchCommitment = watch('commitmentLevel');
  const watchGroupSize = watch('preferredGroupSize');
  const watchBio = watch('bio');
  const watchAvatarUrl = watch('avatarUrl');

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = await userService.getProfile();
        if (data.profile) {
          const p = data.profile;
          setValue('name', p.name || user?.profile?.name || '');
          setValue('college', p.college || '');
          setValue('department', p.department || '');
          setValue('year', p.year || '1st Year');
          setValue('skillLevel', p.skillLevel || 'Intermediate');
          setValue('learningStyle', p.learningStyle || 'Visual');
          setValue('preferredStudyTime', p.preferredStudyTime || 'Evening');
          setValue('commitmentLevel', p.commitmentLevel || 'Moderate (4-8 hrs/wk)');
          setValue('communicationPref', p.communicationPref || 'Discord Chat');
          setValue('preferredGroupSize', p.preferredGroupSize || 4);
          setValue('bio', p.bio || '');
          setValue(
            'avatarUrl',
            p.avatarUrl ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'Student'}`
          );

          if (p.subjects && p.subjects.length > 0) setSelectedSubjects(p.subjects);
          if (p.studyGoals && p.studyGoals.length > 0) setSelectedGoals(p.studyGoals);
          if (p.availabilityDays && p.availabilityDays.length > 0) setSelectedDays(p.availabilityDays);
        }
      } catch (err: any) {
        showToast('Loaded local fallback profile data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [setValue, user, showToast]);

  const toggleSubject = (sub: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const addCustomSubject = () => {
    if (customSubject.trim() && !selectedSubjects.includes(customSubject.trim())) {
      setSelectedSubjects((prev) => [...prev, customSubject.trim()]);
      setCustomSubject('');
    }
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const addCustomGoal = () => {
    if (customGoal.trim() && !selectedGoals.includes(customGoal.trim())) {
      setSelectedGoals((prev) => [...prev, customGoal.trim()]);
      setCustomGoal('');
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const onSubmit = async (formData: UserProfile) => {
    if (selectedSubjects.length === 0) {
      showToast('Please select at least one study subject.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<UserProfile> = {
        ...formData,
        subjects: selectedSubjects,
        studyGoals: selectedGoals,
        availabilityDays: selectedDays,
      };

      const updatedUser = await userService.updateProfile(payload);
      updateUser(updatedUser);
      showToast('Study profile saved successfully!');
    } catch (err: any) {
      showToast(err || 'Failed to update profile. Try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 md:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="hero-banner p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2 bg-[var(--accent-light)] border border-[var(--accent-border)] text-[var(--accent-text)]">
            <Sparkles className="w-3.5 h-3.5" />
            14-Factor Matching Profile
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
            Study Compatibility Profile
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Tell us how you learn best so our AI can pair you with compatible long-term partners.
          </p>
        </div>

        <div className="flex items-center gap-2 tab-bar-bg p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'edit'
                ? 'bg-[var(--accent)] text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'preview'
                ? 'bg-[var(--accent)] text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Match Card Preview
          </button>
        </div>
      </div>

      {activeTab === 'edit' ? (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Section 1: Basic & Academic Info */}
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[var(--accent-text)]" />
                Basic & Academic Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: true })}
                    className="input-base w-full px-3.5 py-2 rounded-xl text-sm"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    University / College
                  </label>
                  <input
                    type="text"
                    {...register('college')}
                    className="input-base w-full px-3.5 py-2 rounded-xl text-sm"
                    placeholder="Stanford University"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Department / Major
                  </label>
                  <input
                    type="text"
                    {...register('department')}
                    className="input-base w-full px-3.5 py-2 rounded-xl text-sm"
                    placeholder="Computer Science"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Academic Year
                  </label>
                  <select
                    {...register('year')}
                    className="input-base w-full px-3.5 py-2 rounded-xl text-sm bg-[var(--input-bg)]"
                  >
                    <option value="1st Year">1st Year (Freshman)</option>
                    <option value="2nd Year">2nd Year (Sophomore)</option>
                    <option value="3rd Year">3rd Year (Junior)</option>
                    <option value="4th Year">4th Year (Senior)</option>
                    <option value="Graduate">Graduate Student</option>
                    <option value="PhD">PhD Candidate</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Study Subjects */}
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[var(--accent-2)]" />
                Subjects You are Studying (Weight: 40%)
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                Select or add the core subjects you want study partners for.
              </p>

              <div className="flex flex-wrap gap-2">
                {PRESET_SUBJECTS.map((sub) => {
                  const isSelected = selectedSubjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-[var(--accent-light)] border-[var(--accent-border)] text-[var(--accent-text)] shadow-sm'
                          : 'bg-[var(--input-bg)] border-theme text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-[var(--accent-text)]" />}
                      {sub}
                    </button>
                  );
                })}
              </div>

              {/* Custom Subject Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Add custom subject (e.g. Econometrics)..."
                  className="input-base flex-1 px-3.5 py-2 rounded-xl text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomSubject();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addCustomSubject} leftIcon={<Plus className="w-4 h-4" />}>
                  Add
                </Button>
              </div>

              {/* Selected Subjects Badges */}
              {selectedSubjects.length > 0 && (
                <div className="pt-2 border-t border-theme">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] mb-2 block">Selected Subjects ({selectedSubjects.length}):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSubjects.map((sub) => (
                      <Badge key={sub} variant="purple" className="py-1 px-2.5">
                        <span>{sub}</span>
                        <button type="button" onClick={() => toggleSubject(sub)} className="ml-1 text-[var(--accent-text)] hover:scale-105">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Learning Dynamics & Skill Level */}
            <div className="card p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-[var(--warning-text)]" />
                  Skill Level & Learning Style
                </h2>
                <p className="text-xs text-[var(--text-muted)] font-medium mb-4">
                  Match with partners with complementary skill levels and compatible learning styles.
                </p>

                {/* Skill Level Selection */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Current Skill Level</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SKILL_LEVELS.map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setValue('skillLevel', lvl)}
                        className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                          watchSkillLevel === lvl
                            ? 'bg-[var(--warning-light)] border-[var(--warning-text)]/40 text-[var(--warning-text)]'
                            : 'bg-[var(--input-bg)] border-theme text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Learning Style Selection */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Preferred Learning Style</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {LEARNING_STYLES.map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setValue('learningStyle', style)}
                        className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                          watchLearningStyle === style
                            ? 'bg-[var(--accent-2-light)] border-theme text-[var(--accent-2)]'
                            : 'bg-[var(--input-bg)] border-theme text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Study Goals & Schedule */}
            <div className="card p-6 space-y-6">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Target className="w-5 h-5 text-[var(--success-text)]" />
                Goals & Schedule Preferences
              </h2>

              {/* Study Goals */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Study Goals</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_GOALS.map((goal) => {
                    const isSelected = selectedGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleGoal(goal)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-[var(--success-light)] border-[var(--success-text)]/30 text-[var(--success-text)] font-semibold shadow-sm'
                            : 'bg-[var(--input-bg)] border-theme text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        {goal}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="Add custom goal (e.g. Master DP & Graphs)..."
                    className="input-base flex-1 px-3.5 py-2 rounded-xl text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomGoal();
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={addCustomGoal} leftIcon={<Plus className="w-4 h-4" />}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Preferred Study Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[var(--info-text)]" />
                    Preferred Study Time
                  </label>
                  <select
                    {...register('preferredStudyTime')}
                    className="input-base w-full px-3.5 py-2 rounded-xl text-sm bg-[var(--input-bg)]"
                  >
                    {STUDY_TIMES.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[var(--accent-text)]" />
                    Preferred Group Size
                  </label>
                  <select
                    {...register('preferredGroupSize', { valueAsNumber: true })}
                    className="input-base w-full px-3.5 py-2 rounded-xl text-sm bg-[var(--input-bg)]"
                  >
                    <option value={2}>2 Members (1-on-1 Buddy)</option>
                    <option value={3}>3 Members (Small Group)</option>
                    <option value={4}>4 Members (Standard Group)</option>
                    <option value={5}>5 Members (Large Group)</option>
                    <option value={6}>6+ Members (Study Circle)</option>
                  </select>
                </div>
              </div>

              {/* Weekly Availability Days */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[var(--error-text)]" />
                  Weekly Availability
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isAvail = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isAvail
                            ? 'bg-[var(--error-light)] border border-[var(--error-text)]/30 text-[var(--error-text)] shadow-sm'
                            : 'bg-[var(--input-bg)] border-theme text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Commitment & Communication */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Weekly Commitment Level</label>
                  <select
                    {...register('commitmentLevel')}
                    className="input-base w-full px-3.5 py-2 rounded-xl text-sm bg-[var(--input-bg)]"
                  >
                    {COMMITMENT_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[var(--success-text)]" />
                    Communication Preference
                  </label>
                  <select
                    {...register('communicationPref')}
                    className="input-base w-full px-3.5 py-2 rounded-xl text-sm bg-[var(--input-bg)]"
                  >
                    {COMMUNICATION_PREFS.map((pref) => (
                      <option key={pref} value={pref}>
                        {pref}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 5: Bio & Avatar */}
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <User className="w-5 h-5 text-[var(--accent-text)]" />
                Short Bio & Profile Image
              </h2>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Bio / Learning Philosophy
                </label>
                <textarea
                  rows={3}
                  {...register('bio')}
                  placeholder="Share a bit about your academic background, what you enjoy studying, or how you like to collaborate..."
                  className="input-base w-full px-3.5 py-2 rounded-xl text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="text"
                  {...register('avatarUrl')}
                  placeholder="https://api.dicebear.com/7.x/avataaars/svg?seed=YourName"
                  className="input-base w-full px-3.5 py-2 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Compatibility Profile
              </Button>
            </div>
          </div>

          {/* Right Column: Live Match Card Preview */}
          <div className="space-y-6">
            <div className="sticky top-24">
              <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                Live Match Card Preview
              </h3>

              <div className="card p-6 border-accent hover:shadow-[var(--shadow-card-hover)] relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-3">
                  <Badge variant="purple" className="shadow-lg font-bold">
                    <Sparkles className="w-3 h-3 text-[var(--accent-text)]" />
                    Preview
                  </Badge>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={
                      watchAvatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${watchName || 'Student'}`
                    }
                    alt="Preview Avatar"
                    className="w-14 h-14 rounded-2xl border-2 border-[var(--accent-border)] bg-[var(--surface-2)] object-cover shadow-sm"
                  />
                  <div>
                    <h4 className="font-bold text-[var(--text-primary)] text-base leading-tight">
                      {watchName || 'Jane Student'}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {watchCollege || 'University Student'} • {watchYear || '1st Year'}
                    </p>
                    <span className="text-[11px] text-[var(--accent-text)] font-semibold mt-0.5 block">
                      {watchDepartment || 'Computer Science'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 italic mb-4 px-3 py-2 rounded-xl bg-[var(--surface-3)] border border-theme">
                  "{watchBio || 'Looking for dedicated study buddies for exam prep and coding collaboration!'}"
                </p>

                <div className="space-y-3 pt-3 border-t border-theme">
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] font-semibold block mb-1">Target Subjects:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedSubjects.length > 0 ? (
                        selectedSubjects.slice(0, 3).map((s) => (
                          <Badge key={s} variant="indigo" size="sm">
                            {s}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] italic">No subjects selected</span>
                      )}
                      {selectedSubjects.length > 3 && (
                        <Badge variant="slate" size="sm">
                          +{selectedSubjects.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-[var(--surface-3)] border border-theme">
                      <span className="text-[10px] text-[var(--text-muted)] block">Style</span>
                      <span className="font-bold text-[var(--text-primary)]">{watchLearningStyle}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-[var(--surface-3)] border border-theme">
                      <span className="text-[10px] text-[var(--text-muted)] block">Time</span>
                      <span className="font-bold text-[var(--text-primary)]">{watchStudyTime}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[var(--accent-light)] border border-[var(--accent-border)] text-xs space-y-1">
                    <span className="text-[11px] font-bold text-[var(--accent-text)] block mb-1">
                      Compatibility Vector Factors
                    </span>
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                      <span>Commitment:</span>
                      <span className="font-bold text-[var(--accent-text)]">{watchCommitment}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                      <span>Group Capacity:</span>
                      <span className="font-bold text-[var(--accent-text)]">Max {watchGroupSize} Members</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="card p-8 max-w-xl mx-auto text-center space-y-6 shadow-xl border border-theme">
          <img
            src={
              watchAvatarUrl ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${watchName || 'Student'}`
            }
            alt="Preview Avatar"
            className="w-24 h-24 rounded-full border-4 border-[var(--accent-border)] bg-[var(--surface-2)] mx-auto object-cover shadow-md"
          />
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">{watchName || 'Jane Student'}</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {watchCollege || 'University'} • {watchDepartment || 'Department'} ({watchYear})
            </p>
          </div>
          <p className="text-sm text-[var(--text-secondary)] italic max-w-md mx-auto">
            "{watchBio || 'Dedicated learner looking for proactive study partners.'}"
          </p>

          <div className="p-4 rounded-2xl bg-[var(--surface-3)] border border-theme text-left space-y-2">
            <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Profile Summary
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
              <div>
                <strong>Skill Level:</strong> {watchSkillLevel}
              </div>
              <div>
                <strong>Learning Style:</strong> {watchLearningStyle}
              </div>
              <div>
                <strong>Study Time:</strong> {watchStudyTime}
              </div>
              <div>
                <strong>Commitment:</strong> {watchCommitment}
              </div>
            </div>
          </div>

          <Button variant="primary" onClick={() => setActiveTab('edit')}>
            Return to Edit Mode
          </Button>
        </div>
      )}
    </div>
  );
};
