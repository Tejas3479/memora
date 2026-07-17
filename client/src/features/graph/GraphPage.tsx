import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Network, Layout, Eye, Layers, Milestone, Grid, Users, BarChart } from 'lucide-react';

export default function GraphPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [layoutPreset, setLayoutPreset] = useState<'graph' | 'explorer' | 'timeline' | 'board' | 'people'>('graph');

  useEffect(() => {
    // Mimic 3D scene loading percentage sequence (Section 8.2)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setLoading(false);
          return 100;
        }
        return prev + 25;
      });
    }, 150);

    api.get('/api/graph').then((res) => {
      setNodes(res.graph?.nodes || []);
      setEdges(res.graph?.edges || []);
    }).catch(console.error);

    return () => clearInterval(interval);
  }, []);

  const presets = [
    { id: 'graph', label: 'Immersive Graph', icon: Network },
    { id: 'explorer', label: 'Explorer', icon: Layers },
    { id: 'timeline', label: 'Timeline', icon: Milestone },
    { id: 'board', label: 'Masonry Board', icon: Grid },
    { id: 'people', label: 'People', icon: Users },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in h-[calc(100vh-12rem)] font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Semantic Memory Graph</h1>
          <p className="text-sm text-memora-text-muted">Interactive map highlighting concept relationships in your memory cosmos.</p>
        </div>

        {/* Layout Preset Selectors Toolbar (Section 8.4) */}
        <div className="flex bg-[#0f0f16]/60 border border-memora-border rounded-xl p-1 shrink-0 overflow-x-auto no-scrollbar max-w-full">
          {presets.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setLayoutPreset(p.id as any)}
                title={p.label}
                className={`p-2 rounded-lg flex items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer active:scale-95 whitespace-nowrap ${
                  layoutPreset === p.id
                    ? 'bg-memora-accent text-white shadow-lg shadow-memora-accent-glow'
                    : 'text-memora-text-muted hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span className="hidden md:inline">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        /* Full-screen Loading State with Percentage Loader (Section 8.2) */
        <div className="flex-1 glass rounded-2xl flex flex-col items-center justify-center p-8 gap-4 select-none">
          <Network className="text-memora-accent animate-spin" size={48} />
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-white tracking-widest uppercase font-semibold">Initializing Memory Cosmos</span>
            <span className="text-2xl font-extrabold text-memora-accent font-mono mt-1">{progress}%</span>
          </div>
          <div className="w-48 h-1 bg-memora-surface rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-memora-accent to-[#06b6d4] transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <div className="flex-1 glass rounded-2xl border border-white/5 relative flex flex-col items-center justify-center p-8 overflow-hidden">
          {/* WebGL Point Cloud Background Placeholder */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#7c3aed_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
          
          <div className="z-10 flex flex-col items-center gap-4 text-center max-w-md animate-fade-in">
            <div className="p-4 rounded-xl bg-memora-accent/10 border border-memora-accent/20">
              <Network className="text-memora-accent animate-pulse" size={40} />
            </div>
            <h3 className="font-bold text-white text-lg select-none">Cosmic Node Canvas</h3>
            <p className="text-xs text-memora-text-muted leading-relaxed select-none">
              Render mode configured: <span className="text-white font-semibold capitalize font-mono">{layoutPreset}</span>.
              Tracing {nodes.length} structural entities and {edges.length} connections inside your vector index.
            </p>
            
            <div className="w-full mt-4 flex flex-col gap-2 max-h-[16rem] overflow-y-auto pr-1">
              {nodes.map((node) => (
                <div key={node.id} className="bg-[#050508]/60 hover:bg-memora-surface/80 border border-memora-border/80 rounded-xl px-4 py-3 text-left text-xs flex justify-between items-center hover:scale-[1.01] hover:border-white/10 active:scale-[0.99] transition-all duration-200 cursor-pointer group">
                  <span className="font-semibold text-white group-hover:text-memora-accent transition-colors">{node.label}</span>
                  <span className="text-[10px] bg-memora-border text-memora-text-muted px-2 py-0.5 rounded font-mono uppercase">
                    {node.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
