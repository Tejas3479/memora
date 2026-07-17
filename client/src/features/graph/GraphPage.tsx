import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Network, HelpCircle } from 'lucide-react';

export default function GraphPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/graph').then((res) => {
      setNodes(res.graph?.nodes || []);
      setEdges(res.graph?.edges || []);
    }).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in h-[calc(100vh-12rem)]">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white font-sans">Semantic Memory Graph</h1>
          <p className="text-sm text-memora-text-muted">Interactive map highlighting concept relationships in your memory layer.</p>
        </div>
      </div>

      <div className="flex-1 glass rounded-xl border border-memora-border relative flex flex-col items-center justify-center p-8 overflow-hidden">
        {/* Render connections placeholder canvas visualizer */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="z-10 flex flex-col items-center gap-4 text-center max-w-md">
          <div className="p-4 rounded-full bg-memora-accent/15">
            <Network className="text-memora-accent animate-pulse" size={40} />
          </div>
          <h3 className="font-bold text-white text-lg">Knowledge Map Ready</h3>
          <p className="text-xs text-memora-text-muted leading-relaxed">
            Visualizing {nodes.length} nodes and {edges.length} connections. Hover nodes to view parent records and trace related files or Slack comments.
          </p>
          
          <div className="w-full mt-4 flex flex-col gap-2">
            {nodes.map((node) => (
              <div key={node.id} className="bg-memora-bg p-3 border border-memora-border rounded-lg text-left text-xs flex justify-between items-center">
                <span className="font-semibold text-white">{node.label}</span>
                <span className="text-[10px] bg-memora-accent/20 text-memora-accent px-2 py-0.5 rounded font-mono uppercase">
                  {node.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
