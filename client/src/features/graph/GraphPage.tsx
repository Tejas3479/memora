import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client.js';
import { Network, Layers, Milestone, Grid, Users, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export default function GraphPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [layoutPreset, setLayoutPreset] = useState<'graph' | 'explorer' | 'timeline' | 'board' | 'people'>('graph');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Pan and Zoom State
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const dragNodeRef = useRef<GraphNode | null>(null);
  const isPanningRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });

  // Fetch nodes & edges
  useEffect(() => {
    const loader = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(loader);
          setLoading(false);
          return 100;
        }
        return prev + 25;
      });
    }, 120);

    api.get('/api/graph')
      .then((res) => {
        const rawNodes = res.graph?.nodes || [];
        const rawEdges = res.graph?.edges || [];

        // Initialize 2D coordinates for physics engine
        const initializedNodes: GraphNode[] = rawNodes.map((node: any) => ({
          ...node,
          x: Math.random() * 400 - 200,
          y: Math.random() * 400 - 200,
          vx: 0,
          vy: 0,
          radius: node.type === 'MEMORY' ? 12 : 8,
        }));

        setNodes(initializedNodes);
        setEdges(rawEdges);
      })
      .catch(console.error);

    return () => clearInterval(loader);
  }, []);

  // Preset Layout Adjustments
  useEffect(() => {
    if (nodes.length === 0) return;

    const updatedNodes = nodes.map((node, i) => {
      let x = node.x;
      let y = node.y;

      if (layoutPreset === 'timeline') {
        // Arrange sequentially horizontally
        x = (i - nodes.length / 2) * 50;
        y = Math.sin(i) * 60;
      } else if (layoutPreset === 'explorer') {
        // Arrange layered stacked vertically by type
        const layers: Record<string, number> = { MEMORY: -100, PERSON: 0, TOPIC: 100 };
        const offset = layers[node.type] !== undefined ? layers[node.type] : 200;
        x = (i % 6) * 80 - 200;
        y = offset + Math.sin(i) * 20;
      } else if (layoutPreset === 'people') {
        // Circle layout
        const angle = (i / nodes.length) * Math.PI * 2;
        x = Math.cos(angle) * 180;
        y = Math.sin(angle) * 180;
      } else {
        // Random cluster scatter
        x = Math.random() * 300 - 150;
        y = Math.random() * 300 - 150;
      }

      return {
        ...node,
        x,
        y,
        vx: 0,
        vy: 0,
      };
    });

    setNodes(updatedNodes);
  }, [layoutPreset]);

  // Canvas Drawing & Physics Simulation Loop
  useEffect(() => {
    if (loading || nodes.length === 0) return;

    let animFrame: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle Resize
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 600;
      canvas.height = canvas.parentElement?.clientHeight || 450;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Simulation Constants
    const repulsion = 800;
    const attraction = 0.03;
    const centerForce = 0.01;
    const friction = 0.85;

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const tick = () => {
      const w = canvas.width;
      const h = canvas.height;

      // 1. Repulsion Force
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 300) {
            const force = repulsion / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            n1.vx -= fx;
            n1.vy -= fy;
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }

      // 2. Attraction Force along edges
      for (const edge of edges) {
        const n1 = nodeMap.get(edge.source);
        const n2 = nodeMap.get(edge.target);
        if (n1 && n2) {
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = dist * attraction;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          n1.vx += fx;
          n1.vy += fy;
          n2.vx -= fx;
          n2.vy -= fy;
        }
      }

      // 3. Gravity/Center Pull & Update Velocity
      for (const node of nodes) {
        if (node === dragNodeRef.current) continue;
        node.vx -= node.x * centerForce;
        node.vy -= node.y * centerForce;
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= friction;
        node.vy *= friction;
      }

      // 4. Render Layout
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2 + panX, h / 2 + panY);
      ctx.scale(zoom, zoom);

      // Draw Connection Edges
      ctx.strokeStyle = 'rgba(124, 58, 237, 0.15)';
      ctx.lineWidth = 1.5;
      for (const edge of edges) {
        const n1 = nodeMap.get(edge.source);
        const n2 = nodeMap.get(edge.target);
        if (n1 && n2) {
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.stroke();
        }
      }

      // Draw Nodes
      for (const node of nodes) {
        const isSelected = selectedNode?.id === node.id;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);

        if (node.type === 'MEMORY') {
          ctx.fillStyle = isSelected ? '#c084fc' : '#7c3aed';
          ctx.shadowColor = '#7c3aed';
          ctx.shadowBlur = isSelected ? 12 : 4;
        } else if (node.type === 'PERSON') {
          ctx.fillStyle = isSelected ? '#6ee7b7' : '#059669';
          ctx.shadowColor = '#059669';
          ctx.shadowBlur = isSelected ? 12 : 4;
        } else {
          ctx.fillStyle = isSelected ? '#93c5fd' : '#2563eb';
          ctx.shadowColor = '#2563eb';
          ctx.shadowBlur = isSelected ? 12 : 4;
        }

        ctx.fill();
        ctx.shadowBlur = 0;

        // Label render
        ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)';
        ctx.font = isSelected ? 'bold 11px Inter, sans-serif' : '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y - node.radius - 6);
      }

      ctx.restore();
      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [loading, nodes, edges, zoom, panX, panY, selectedNode]);

  // Interactivity Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const w = canvas.width;
    const h = canvas.height;

    // Convert screen coordinates to canvas space
    const clickX = (e.clientX - rect.left - w / 2 - panX) / zoom;
    const clickY = (e.clientY - rect.top - h / 2 - panY) / zoom;

    // Check hit node
    let hitNode: GraphNode | null = null;
    for (const node of nodes) {
      const dx = node.x - clickX;
      const dy = node.y - clickY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < node.radius + 5) {
        hitNode = node;
        break;
      }
    }

    if (hitNode) {
      dragNodeRef.current = hitNode;
      setSelectedNode(hitNode);
    } else {
      isPanningRef.current = true;
      startPanRef.current = { x: e.clientX - panX, y: e.clientY - panY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragNodeRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const w = canvas.width;
      const h = canvas.height;

      // Update dragged node position directly
      dragNodeRef.current.x = (e.clientX - rect.left - w / 2 - panX) / zoom;
      dragNodeRef.current.y = (e.clientY - rect.top - h / 2 - panY) / zoom;
    } else if (isPanningRef.current) {
      setPanX(e.clientX - startPanRef.current.x);
      setPanY(e.clientY - startPanRef.current.y);
    }
  };

  const handleMouseUp = () => {
    dragNodeRef.current = null;
    isPanningRef.current = false;
  };

  const resetView = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setSelectedNode(null);
  };

  const presets = [
    { id: 'graph', label: 'Immersive Graph', icon: Network },
    { id: 'explorer', label: 'Layer Explorer', icon: Layers },
    { id: 'timeline', label: 'Time Stream', icon: Milestone },
    { id: 'board', label: 'Memory Grid', icon: Grid },
    { id: 'people', label: 'People Map', icon: Users },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto animate-fade-in h-[calc(100vh-12rem)] font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Semantic Memory Cosmos</h1>
          <p className="text-sm text-memora-text-muted font-light">
            Interactive visual map showing connected topics and entities in your index.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex bg-[#0f0f16]/60 border border-memora-border rounded-xl p-1 shrink-0 overflow-x-auto no-scrollbar max-w-full">
          {presets.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setLayoutPreset(p.id as any)}
                title={p.label}
                className={`p-2 rounded-lg flex items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer active:scale-95 ${
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
        <div className="flex-1 glass rounded-2xl flex flex-col items-center justify-center p-8 gap-4 select-none">
          <Network className="text-memora-accent animate-spin" size={48} />
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-white tracking-widest uppercase font-semibold">Initializing Graph Space</span>
            <span className="text-2xl font-extrabold text-memora-accent font-mono mt-1">{progress}%</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
          {/* Canvas Wrapper */}
          <div className="flex-1 glass rounded-2xl border border-white/5 relative overflow-hidden flex flex-col">
            {/* Control HUD overlay */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <button 
                onClick={() => setZoom((z) => Math.min(z + 0.15, 3))}
                title="Zoom In"
                className="p-2 rounded-lg bg-[#07070b]/80 border border-memora-border text-memora-text-muted hover:text-white hover:border-white/25 transition-all cursor-pointer active:scale-95"
              >
                <ZoomIn size={14} />
              </button>
              <button 
                onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
                title="Zoom Out"
                className="p-2 rounded-lg bg-[#07070b]/80 border border-memora-border text-memora-text-muted hover:text-white hover:border-white/25 transition-all cursor-pointer active:scale-95"
              >
                <ZoomOut size={14} />
              </button>
              <button 
                onClick={resetView}
                title="Reset View"
                className="p-2 rounded-lg bg-[#07070b]/80 border border-memora-border text-memora-text-muted hover:text-white hover:border-white/25 transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-full cursor-grab active:cursor-grabbing block"
            />
          </div>

          {/* Node details Sidebar */}
          {selectedNode && (
            <div className="w-full md:w-80 glass rounded-2xl border border-white/5 p-6 flex flex-col gap-4 animate-fade-in shrink-0 overflow-y-auto max-h-full md:max-h-none">
              <div className="flex justify-between items-start gap-2">
                <span className="text-[10px] bg-memora-border text-memora-text-muted px-2 py-0.5 rounded font-mono uppercase font-bold tracking-wider">
                  {selectedNode.type}
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-memora-text-muted hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>

              <h2 className="text-lg font-bold text-white">{selectedNode.label}</h2>
              <div className="h-px bg-memora-border w-full"></div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-memora-text-muted">Entity ID:</span>
                  <span className="font-mono text-[10px] text-white truncate max-w-[10rem]">{selectedNode.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-memora-text-muted">Physics coordinates:</span>
                  <span className="font-mono text-[10px] text-white">
                    {Math.round(selectedNode.x)}, {Math.round(selectedNode.y)}
                  </span>
                </div>
              </div>

              <div className="bg-[#050508]/60 border border-memora-border p-4 rounded-xl text-xs text-memora-text-muted leading-relaxed">
                Click and drag nodes inside the canvas space to reorganize, and use zoom controls to traverse deep hierarchies.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
