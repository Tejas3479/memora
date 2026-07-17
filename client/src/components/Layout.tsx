import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useUiStore } from '../store/uiStore.js';
import { useWebSocket } from '../hooks/useWebSocket.js';
import {
  Search,
  Clock,
  Network,
  Users,
  FolderClosed,
  Zap,
  Cpu,
  Settings,
  LogOut,
  Bell,
  Menu,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, notifications, removeNotification, adhdFocusMode, toggleAdhdFocusMode } = useUiStore();
  
  // Initialize websocket hook
  useWebSocket();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/search', label: 'Search', icon: Search },
    { path: '/timeline', label: 'Timeline', icon: Clock },
    { path: '/graph', label: 'Knowledge Graph', icon: Network },
    { path: '/people', label: 'People', icon: Users },
    { path: '/folders', label: 'Folders', icon: FolderClosed },
    { path: '/automations', label: 'Automations', icon: Zap },
    { path: '/team', label: 'Team', icon: Users },
    { path: '/loops', label: 'Reflection Loops', icon: Cpu },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={`flex h-screen w-screen bg-memora-bg text-memora-text overflow-hidden ${adhdFocusMode ? 'adhd-focus-active' : ''}`}>
      {/* Toast notifications container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => removeNotification(n.id)}
            className="glass p-4 rounded-lg shadow-lg flex flex-col gap-1 cursor-pointer animate-fade-in border-l-4 border-memora-accent"
          >
            <div className="font-semibold text-sm text-white">{n.title}</div>
            <div className="text-xs text-memora-text-muted">{n.message}</div>
          </div>
        ))}
      </div>

      {/* Sidebar navigation */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } shrink-0 bg-memora-surface border-r border-memora-border flex flex-col justify-between transition-all duration-300 layout-sidebar`}
      >
        <div>
          <div className="flex h-16 items-center justify-between px-6 border-b border-memora-border">
            <span className={`font-bold text-lg text-memora-accent transition-opacity ${!sidebarOpen && 'opacity-0 hidden'}`}>
              Memora
            </span>
            <button onClick={toggleSidebar} className="p-1 rounded hover:bg-memora-border">
              <Menu size={20} />
            </button>
          </div>
          
          <nav className="p-4 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-memora-accent text-white shadow-lg shadow-memora-accent-glow'
                      : 'hover:bg-memora-border text-memora-text-muted hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span className={`${!sidebarOpen && 'hidden'}`}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-memora-border">
          <div className={`flex items-center gap-3 px-4 py-2 ${!sidebarOpen && 'hidden'}`}>
            <div className="h-8 w-8 rounded-full bg-memora-accent flex items-center justify-center font-semibold text-white">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">{user?.name || 'User'}</span>
              <span className="text-xs text-memora-text-muted truncate">{user?.email}</span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-md mt-2"
          >
            <LogOut size={18} />
            <span className={`${!sidebarOpen && 'hidden'}`}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header toolbar */}
        <header className="h-16 border-b border-memora-border flex items-center justify-between px-8 bg-memora-surface">
          <div className="font-semibold text-lg text-white">
            {navItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAdhdFocusMode}
              title={adhdFocusMode ? "Disable ADHD Focus Mode" : "Enable ADHD Focus Mode"}
              className={`p-2 rounded-full hover:bg-memora-border relative transition-colors ${adhdFocusMode ? 'text-memora-accent' : 'text-memora-text-muted hover:text-white'}`}
            >
              {adhdFocusMode ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <button className="p-2 text-memora-text-muted hover:text-white rounded-full hover:bg-memora-border relative">
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-memora-accent rounded-full"></span>
              )}
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
