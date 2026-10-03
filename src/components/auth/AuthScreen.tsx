import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, Mail, MailCheck, Sparkles } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp } = useWallet();
  const [mode, setMode] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);

  const switchMode = (next: typeof mode) => {
    setMode(next);
    setError('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'sign_up') {
      if (password.length < 8) return setError('Password must be at least 8 characters long');
      if (password !== confirmPassword) return setError('Passwords do not match');
    }

    setIsLoading(true);
    try {
      if (mode === 'sign_in') {
        const err = await signIn(email, password);
        if (err) setError(err);
      } else {
        const { error: err, needsConfirmation } = await signUp(email, password);
        if (err) setError(err);
        else if (needsConfirmation) setConfirmationSentTo(email.trim());
      }
    } catch {
      setError('Could not reach the server. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-3">
        <h1 className="text-xl font-bold text-white">Backend not configured</h1>
        <p className="text-sm text-slate-400">
          Set <code className="text-indigo-300">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-indigo-300">VITE_SUPABASE_ANON_KEY</code> in <code>.env</code>, then restart the dev server.
        </p>
      </div>
    );
  }

  if (confirmationSentTo) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <MailCheck className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-xl font-bold text-white">Check your email</h1>
        <p className="text-sm text-slate-400">
          We sent a confirmation link to <span className="text-slate-200">{confirmationSentTo}</span>.
          Open it, then sign in here.
        </p>
        <button
          onClick={() => { setConfirmationSentTo(null); switchMode('sign_in'); }}
          className="text-xs text-indigo-400 hover:text-indigo-300"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  const inputClass =
    'w-full pl-11 pr-4 py-3.5 bg-slate-900/80 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium';

  return (
    <div className="w-full max-w-md mx-auto p-6 text-center animate-fadeIn">
      <div className="inline-flex p-3 rounded-3xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 mb-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white">
          <Sparkles className="w-7 h-7" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
        {mode === 'sign_in' ? 'Welcome Back' : 'Create Your Account'}
      </h1>
      <p className="text-sm text-slate-400 mb-7">
        {mode === 'sign_in'
          ? 'Sign in to access your wallets on any device.'
          : 'Your wallets and history sync across devices.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 text-left">
        <div className="relative">
          <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
            placeholder="Email address"
            className={inputClass}
          />
        </div>

        <div className="relative">
          <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete={mode === 'sign_in' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
            placeholder={mode === 'sign_in' ? 'Password' : 'Password (min 8 chars)'}
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {mode === 'sign_up' && (
          <div className="relative">
            <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(''); }}
              placeholder="Confirm password"
              className={inputClass}
            />
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>{mode === 'sign_in' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="text-xs text-slate-500 mt-6">
        {mode === 'sign_in' ? "Don't have an account? " : 'Already have an account? '}
        <button
          type="button"
          onClick={() => switchMode(mode === 'sign_in' ? 'sign_up' : 'sign_in')}
          className="text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          {mode === 'sign_in' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  );
};
