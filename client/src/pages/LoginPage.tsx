import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { Lock, Mail, RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-memora-bg relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-memora-accent/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-sm glass p-8 rounded-2xl flex flex-col gap-6 animate-fade-in relative z-10">
        <div className="flex flex-col items-center text-center gap-1">
          <span className="font-bold text-2xl text-white">Welcome Back</span>
          <span className="text-sm text-memora-text-muted">Sign in to access your memory layer</span>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-memora-text-muted">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-memora-text-muted" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-memora-bg border border-memora-border pl-10 pr-4 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-memora-accent"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-memora-text-muted">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-memora-text-muted" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-memora-bg border border-memora-border pl-10 pr-4 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-memora-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 mt-2 bg-memora-accent text-white font-semibold rounded-lg text-sm hover:bg-memora-accent-hover flex items-center justify-center gap-2 shadow-lg shadow-memora-accent-glow disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-memora-text-muted">
          Don't have an account?{' '}
          <Link to="/register" className="text-memora-accent font-semibold hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
