import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFoldersQuery, useCreateFolderMutation, useDeleteFolderMutation } from '../../hooks/useQueries.js';
import { FolderPlus, FolderClosed, Trash2, X, Plus } from 'lucide-react';

export default function FoldersPage() {
  const navigate = useNavigate();
  const { data: tree = [], isLoading } = useFoldersQuery();
  const createFolderMutation = useCreateFolderMutation();
  const deleteFolderMutation = useDeleteFolderMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderDesc, setFolderDesc] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(undefined);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    await createFolderMutation.mutateAsync({
      name: folderName.trim(),
      description: folderDesc.trim() || undefined,
      parentId: selectedParentId,
    });

    setFolderName('');
    setFolderDesc('');
    setSelectedParentId(undefined);
    setIsModalOpen(false);
  };

  const renderFolderNode = (node: any) => {
    return (
      <div key={node.id} className="flex flex-col gap-2 pl-4 border-l border-memora-border/60 ml-2 mt-1">
        <div 
          onClick={() => navigate(`/timeline?folderId=${node.id}`)}
          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-memora-surface hover:text-memora-accent cursor-pointer group transition-all duration-200"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FolderClosed size={16} className="text-memora-accent shrink-0" />
            <span className="text-sm text-white font-medium group-hover:text-memora-accent transition-colors truncate">{node.name}</span>
            {node.description && <span className="text-xs text-memora-text-muted truncate">({node.description})</span>}
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedParentId(node.id);
                setIsModalOpen(true);
              }}
              title="Add subfolder"
              className="p-1 hover:bg-memora-bg rounded text-memora-text-muted hover:text-white"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteFolderMutation.mutate(node.id);
              }}
              title="Delete folder"
              className="p-1 hover:bg-red-500/20 rounded text-memora-text-muted hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
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
        <button
          onClick={() => {
            setSelectedParentId(undefined);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-sm hover:bg-memora-accent-hover active:scale-95 transition-all duration-200 cursor-pointer shadow-lg shadow-memora-accent-glow flex items-center gap-1.5"
        >
          <FolderPlus size={16} />
          Create Folder
        </button>
      </div>

      <div className="glass p-6 rounded-2xl border border-white/5 border-t border-white/12 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <div className="h-10 shimmer rounded-lg"></div>
            <div className="h-10 shimmer rounded-lg ml-6"></div>
            <div className="h-10 shimmer rounded-lg ml-6"></div>
          </div>
        ) : tree.length > 0 ? (
          tree.map((node: any) => renderFolderNode(node))
        ) : (
          <div className="text-center text-memora-text-muted py-8 flex flex-col items-center gap-3 select-none">
            <FolderClosed size={32} className="text-memora-border animate-pulse" />
            <div className="text-xs">No folders created yet. Build a folder to organize your timeline!</div>
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass p-6 rounded-2xl border border-white/15 w-full max-w-md flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Create New Folder</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-memora-text-muted hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-memora-text-muted">Folder Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. AI Research"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="bg-memora-bg border border-memora-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-memora-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-memora-text-muted">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. LLMs and vector database notes"
                  value={folderDesc}
                  onChange={(e) => setFolderDesc(e.target.value)}
                  className="bg-memora-bg border border-memora-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-memora-accent"
                />
              </div>

              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-memora-border text-memora-text-muted hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createFolderMutation.isPending || !folderName.trim()}
                  className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-xs hover:bg-memora-accent-hover disabled:opacity-50 cursor-pointer"
                >
                  {createFolderMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
