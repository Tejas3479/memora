import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { Lock, Mail, User, RefreshCw } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;

    setLoading(true);
    setError('');
    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-memora-bg relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-memora-accent/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-sm glass p-8 rounded-2xl flex flex-col gap-6 animate-fade-in relative z-10">
        <div className="flex flex-col items-center text-center gap-1">
          <span className="font-bold text-2xl text-white">Create Account</span>
          <span className="text-sm text-memora-text-muted">Register to start capturing your knowledge</span>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-memora-text-muted">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-memora-text-muted" size={16} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-memora-bg border border-memora-border pl-10 pr-4 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-memora-accent"
              />
            </div>
          </div>

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
            {loading ? <RefreshCw className="animate-spin" size={16} /> : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-xs text-memora-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-memora-accent font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
