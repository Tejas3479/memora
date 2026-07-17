import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { FolderPlus, FolderClosed } from 'lucide-react';

export default function FoldersPage() {
  const [tree, setTree] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/folders').then(setTree).catch(console.error);
  }, []);

  const renderFolderNode = (node: any) => {
    return (
      <div key={node.id} className="flex flex-col gap-2 pl-4 border-l border-memora-border/60 ml-2 mt-1">
        <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-memora-surface hover:text-memora-accent cursor-pointer group transition-all duration-200">
          <FolderClosed size={16} className="text-memora-accent shrink-0" />
          <span className="text-sm text-white font-medium group-hover:text-memora-accent transition-colors">{node.name}</span>
          {node.description && <span className="text-xs text-memora-text-muted truncate">({node.description})</span>}
        </div>
        {node.children && node.children.length > 0 && (
          <div className="flex flex-col gap-1 ml-2">
            {node.children.map((c: any) => renderFolderNode(c))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Memory Folders</h1>
          <p className="text-sm text-memora-text-muted">Organize captured data slices into nesting directory structures.</p>
        </div>
        <button className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-sm hover:bg-memora-accent-hover active:scale-95 transition-all duration-200 cursor-pointer shadow-lg shadow-memora-accent-glow flex items-center gap-1.5">
          <FolderPlus size={16} />
          Create Folder
        </button>
      </div>

      <div className="glass p-6 rounded-2xl border border-white/5 border-t border-white/12 flex flex-col gap-3">
        {tree.map((node) => renderFolderNode(node))}

        {tree.length === 0 && (
          <div className="text-center text-memora-text-muted py-8 flex flex-col items-center gap-3 select-none">
            <FolderClosed size={32} className="text-memora-border animate-pulse" />
            <div className="text-xs">No folders created yet. Build a folder to organize your timeline!</div>
          </div>
        )}
      </div>
    </div>
  );
}
