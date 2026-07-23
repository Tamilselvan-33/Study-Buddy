import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Sparkles, User as UserIcon, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import type { RegisterParams } from '../services/authService';

const features = [
  '14-Factor deep compatibility scoring',
  'AI explainable match breakdowns',
  'Goal-driven temporary & permanent study groups',
];

export const RegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterParams>();

  const onSubmit = async (data: RegisterParams) => {
    setIsLoading(true);
    try {
      await registerAuth(data);
      showToast("Account created successfully! Let's set up your profile.");
      navigate('/profile');
    } catch (err: unknown) {
      showToast(typeof err === 'string' ? err : 'Registration failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-[var(--app-bg)] relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-30"
        style={{ background: 'var(--accent-light)' }} />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: 'var(--accent-2-light)' }} />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden z-10 shadow-[var(--shadow-modal)]"
        style={{ border: '1px solid var(--border)' }}>

        {/* Left: Brand */}
        <div className="p-8 md:p-10 flex flex-col justify-between"
          style={{
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-3) 100%)',
            borderRight: '1px solid var(--border)',
          }}>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6"
              style={{ background: 'var(--accent-2-light)', border: '1px solid rgba(79,70,229,0.30)', color: 'var(--accent-2)' }}>
              <Sparkles className="w-3.5 h-3.5" />
              Join 5,000+ Students
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight mb-4 text-[var(--text-primary)]">
              Find your ideal <span className="gradient-text">Study Partners</span>
            </h2>
            <p className="text-sm leading-relaxed mb-6 text-[var(--text-secondary)]">
              Create your account in seconds and unlock AI-powered compatibility recommendations.
            </p>
          </div>
          <div className="space-y-3">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--success-text)' }} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Form */}
        <div className="p-8 md:p-10 flex flex-col justify-center bg-[var(--surface-2)]">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">Create Account</h3>
          <p className="text-xs text-[var(--text-muted)] mb-6">Enter your details below to get started.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Alex Morgan"
                  {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })}
                  className="input-base w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                />
              </div>
              {errors.name && <span className="text-xs mt-1 block" style={{ color: 'var(--error-text)' }}>{errors.name.message}</span>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="alex@university.edu"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' },
                  })}
                  className="input-base w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                />
              </div>
              {errors.email && <span className="text-xs mt-1 block" style={{ color: 'var(--error-text)' }}>{errors.email.message}</span>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
                  className="input-base w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                />
              </div>
              {errors.password && <span className="text-xs mt-1 block" style={{ color: 'var(--error-text)' }}>{errors.password.message}</span>}
            </div>

            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}>
              Get Started
            </Button>
          </form>

          <p className="text-xs text-center mt-6 text-[var(--text-muted)]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold underline underline-offset-4"
              style={{ color: 'var(--accent-text)' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
