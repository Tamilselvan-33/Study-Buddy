import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Sun, Moon, LogOut, User as UserIcon, Users, BarChart2, Compass } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navLinks = [
    { label: 'Recommendations', path: '/recommendations', icon: Compass },
    { label: 'Study Groups', path: '/groups', icon: Users },
    { label: 'Progress', path: '/progress', icon: BarChart2 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full navbar-bg backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-[var(--text-primary)] tracking-tight leading-none group-hover:text-[var(--accent-text)] transition-colors">
              Study<span className="gradient-text">Buddy</span>
            </span>
            <span className="text-[10px] font-medium text-[var(--text-muted)] tracking-wider uppercase">
              AI Study Finder
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 nav-pill-bg p-1 rounded-xl">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive ? 'nav-item-active' : 'nav-item'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-light)] transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark'
              ? <Sun className="w-5 h-5 text-amber-400" />
              : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-xl hover:bg-[var(--accent-light)] transition-colors border border-transparent hover:border-[var(--accent-border)]"
              >
                <img
                  src={user.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                  alt={user.profile?.name || 'User'}
                  className="w-8 h-8 rounded-full border border-[var(--accent-border)] bg-[var(--surface-2)] object-cover"
                />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">
                    {user.profile?.name || 'Student'}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] line-clamp-1">
                    {user.profile?.college || user.email}
                  </span>
                </div>
              </Link>

              <button
                onClick={logout}
                className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--error-text)] hover:bg-[var(--error-light)] transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm" leftIcon={<UserIcon className="w-3.5 h-3.5" />}>
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
