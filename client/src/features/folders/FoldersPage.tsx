import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Folder, FolderPlus, Plus, ChevronRight, FolderClosed } from 'lucide-react';

export default function FoldersPage() {
  const [tree, setTree] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/folders').then(setTree).catch(console.error);
  }, []);

  const renderFolderNode = (node: any) => {
    return (
      <div key={node.id} className="flex flex-col gap-2 pl-4 border-l border-memora-border/60">
        <div className="flex items-center gap-3 py-1.5 hover:text-memora-accent cursor-pointer group">
          <FolderClosed size={16} className="text-memora-accent" />
          <span className="text-sm text-white font-medium group-hover:text-memora-accent">{node.name}</span>
          {node.description && <span className="text-xs text-memora-text-muted">({node.description})</span>}
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
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white font-sans">Memory Folders</h1>
          <p className="text-sm text-memora-text-muted">Organize captured data slices into nesting directory structures.</p>
        </div>
        <button className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-sm hover:bg-memora-accent-hover flex items-center gap-1.5">
          <FolderPlus size={16} />
          Create Folder
        </button>
      </div>

      <div className="glass p-6 rounded-xl flex flex-col gap-4">
        {tree.map((node) => renderFolderNode(node))}

        {tree.length === 0 && (
          <div className="text-center text-memora-text-muted py-8 flex flex-col items-center gap-2">
            <FolderClosed size={32} className="text-memora-border" />
            <div className="text-sm">No folders created yet. Build a folder to organize your timeline!</div>
          </div>
        )}
      </div>
    </div>
  );
}
