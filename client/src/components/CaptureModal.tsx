import React, { useState, useEffect, useRef } from 'react';
import { useCreateMemoryMutation, useUploadFileMutation, useFoldersQuery } from '../hooks/useQueries.js';
import { X, FileText, UploadCloud, Globe, CheckCircle, AlertCircle, Music } from 'lucide-react';

interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CaptureModal({ isOpen, onClose }: CaptureModalProps) {
  const [tab, setTab] = useState<'note' | 'file' | 'link'>('note');
  const { data: folders = [] } = useFoldersQuery();
  const createMemoryMutation = useCreateMemoryMutation();
  const uploadFileMutation = useUploadFileMutation();

  // Note State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState('');

  // Link State
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkNotes, setLinkNotes] = useState('');

  // File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle('');
    setContent('');
    setFolderId('');
    setLinkUrl('');
    setLinkTitle('');
    setLinkNotes('');
    setSelectedFile(null);
    setStatusMessage(null);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      await createMemoryMutation.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        source: 'NOTE',
        folderId: folderId || undefined,
      });
      setStatusMessage({ text: 'Memory note saved and indexed successfully!', type: 'success' });
      setTimeout(() => {
        resetForm();
        onClose();
      }, 800);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to save note', type: 'error' });
    }
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    try {
      await createMemoryMutation.mutateAsync({
        title: linkTitle.trim() || linkUrl.trim(),
        content: linkNotes.trim() || `Bookmarked web page: ${linkUrl}`,
        source: 'WEB',
        url: linkUrl.trim(),
        folderId: folderId || undefined,
      });
      setStatusMessage({ text: 'Web capture saved and indexed successfully!', type: 'success' });
      setTimeout(() => {
        resetForm();
        onClose();
      }, 800);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to save link', type: 'error' });
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (folderId) formData.append('folderId', folderId);

      await uploadFileMutation.mutateAsync(formData);
      setStatusMessage({ text: `File "${selectedFile.name}" uploaded and indexed!`, type: 'success' });
      setTimeout(() => {
        resetForm();
        onClose();
      }, 900);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Upload failed', type: 'error' });
    }
  };

  const isPending = createMemoryMutation.isPending || uploadFileMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="glass p-6 rounded-2xl border border-white/15 w-full max-w-lg flex flex-col gap-5 shadow-2xl shadow-black/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-memora-border/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-memora-accent/20 text-memora-accent">
              <FileText size={18} />
            </div>
            <h2 className="text-lg font-bold text-white">Capture Memory</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-memora-text-muted hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-2 p-1 bg-[#09090e]/80 border border-memora-border rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('note')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === 'note' ? 'bg-memora-accent text-white shadow-md shadow-memora-accent/30' : 'text-memora-text-muted hover:text-white'
            }`}
          >
            <FileText size={14} />
            Quick Note
          </button>
          <button
            type="button"
            onClick={() => setTab('file')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === 'file' ? 'bg-memora-accent text-white shadow-md shadow-memora-accent/30' : 'text-memora-text-muted hover:text-white'
            }`}
          >
            <UploadCloud size={14} />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setTab('link')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === 'link' ? 'bg-memora-accent text-white shadow-md shadow-memora-accent/30' : 'text-memora-text-muted hover:text-white'
            }`}
          >
            <Globe size={14} />
            Web Link
          </button>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2 text-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab 1: Note Form */}
        {tab === 'note' && (
          <form onSubmit={handleSaveNote} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-memora-text-muted">Note Title</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Distributed Consensus Brainstorm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-memora-bg border border-memora-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-memora-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-memora-text-muted">Content / Markdown</label>
              <textarea
                rows={4}
                required
                placeholder="Write your memory note, thoughts, or architectural decisions..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-memora-bg border border-memora-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-memora-accent font-sans leading-relaxed"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-memora-text-muted">Folder (Optional)</label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="bg-memora-bg border border-memora-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-memora-accent"
              >
                <option value="">None (General Timeline)</option>
                {folders.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2.5 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-memora-border text-memora-text-muted hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !title.trim() || !content.trim()}
                className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-xs hover:bg-memora-accent-hover disabled:opacity-50 cursor-pointer shadow-lg shadow-memora-accent-glow"
              >
                {isPending ? 'Indexing Note...' : 'Save to Memory'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: File & Media Upload */}
        {tab === 'file' && (
          <form onSubmit={handleUploadFile} className="flex flex-col gap-3.5">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-memora-border hover:border-memora-accent/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer bg-memora-bg/40 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,image/*,audio/*,.mp3,.wav,.m4a,.ogg"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="p-3 rounded-full bg-memora-accent/15 text-memora-accent">
                {selectedFile?.type.startsWith('audio/') ? <Music size={24} /> : <UploadCloud size={24} />}
              </div>
              {selectedFile ? (
                <div className="flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-white">{selectedFile.name}</span>
                  <span className="text-[11px] text-memora-text-muted">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-1">
                  <span className="text-xs font-semibold text-white">Click to choose file</span>
                  <span className="text-[11px] text-memora-text-muted">Supports PDF, Word DOCX, Images, and Audio Voice Memos</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-memora-text-muted">Assign Folder (Optional)</label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="bg-memora-bg border border-memora-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-memora-accent"
              >
                <option value="">None (General Timeline)</option>
                {folders.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2.5 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-memora-border text-memora-text-muted hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !selectedFile}
                className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-xs hover:bg-memora-accent-hover disabled:opacity-50 cursor-pointer shadow-lg shadow-memora-accent-glow"
              >
                {isPending ? 'Uploading & Indexing...' : 'Upload & Ingest'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Web Link */}
        {tab === 'link' && (
          <form onSubmit={handleSaveLink} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-memora-text-muted">URL Address</label>
              <input
                type="url"
                required
                autoFocus
                placeholder="https://example.com/spec.html"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="bg-memora-bg border border-memora-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-memora-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-memora-text-muted">Title (Optional)</label>
              <input
                type="text"
                placeholder="Auto-detected from URL if blank"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="bg-memora-bg border border-memora-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-memora-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-memora-text-muted">Notes or Summary (Optional)</label>
              <textarea
                rows={3}
                placeholder="Key takeaways, why this page matters..."
                value={linkNotes}
                onChange={(e) => setLinkNotes(e.target.value)}
                className="bg-memora-bg border border-memora-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-memora-accent font-sans leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2.5 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-memora-border text-memora-text-muted hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !linkUrl.trim()}
                className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-xs hover:bg-memora-accent-hover disabled:opacity-50 cursor-pointer shadow-lg shadow-memora-accent-glow"
              >
                {isPending ? 'Saving Link...' : 'Bookmark & Index'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}