import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Search, Sparkles, Pin, Trash2, BookOpen, Calendar } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchNotes, createNote, deleteNote, updateNote } from '../../services/noteService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import type { Note } from '../../types/aiProposal';

export default function DevNotesPage() {
  const { openAIDrawer, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', 'developer'],
    queryFn: () => fetchNotes(),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return createNote({ title, content, is_pinned: isPinned });
    },
    onSuccess: (newN) => {
      setIsModalOpen(false);
      setTitle('');
      setContent('');
      setIsPinned(false);
      setSelectedNote(newN);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      showToast('Engineering note created!', 'success');
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, is_pinned }: { id: number; is_pinned: boolean }) => {
      return updateNote(id, { is_pinned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return deleteNote(id);
    },
    onSuccess: () => {
      if (selectedNote?.id) setSelectedNote(null);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      showToast('Note deleted', 'info');
    },
  });

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  const activeNote = selectedNote || filtered[0] || null;

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <LoadingSkeleton variant="card" className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <LoadingSkeleton variant="card" className="md:col-span-5 h-96" />
          <LoadingSkeleton variant="card" className="md:col-span-7 h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <FileText className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-semibold text-blue-400">
              ENGINEERING NOTEBOOK &amp; ADRS
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">
            Developer Notes
          </h1>
          <p className="text-xs md:text-sm text-text-muted">
            Architecture decision records, tech specifications, code snippets, and sprint
            documentation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              openAIDrawer(
                'Draft an Architectural Decision Record (ADR) for caching with Redis vs in-memory LRU'
              )
            }
            icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
          >
            AI Draft ADR
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="!bg-blue-600 hover:!bg-blue-700 text-white"
            onClick={() => setIsModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Note
          </Button>
        </div>
      </div>

      {/* Split View: Notes list on left (4 cols), Note reader on right (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Note List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-bg-surface border border-border-base rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-border-hover"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <Card className="p-8 text-center text-xs text-text-muted">No notes found.</Card>
            ) : (
              filtered.map((note) => {
                const isSelected = activeNote?.id === note.id;
                return (
                  <Card
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`p-3.5 border transition-all cursor-pointer select-none group ${
                      isSelected
                        ? 'bg-bg-elevated border-blue-500/50 shadow-sm'
                        : 'bg-bg-surface border-border-base hover:border-border-hover'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {note.is_pinned && (
                          <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400" />
                        )}
                        <h4 className="text-xs font-bold text-text-primary truncate">
                          {note.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePinMutation.mutate({
                              id: note.id,
                              is_pinned: !note.is_pinned,
                            });
                          }}
                          className="p-1 text-text-faint hover:text-amber-400 rounded"
                          title={note.is_pinned ? 'Unpin' : 'Pin to top'}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(note.id);
                          }}
                          className="p-1 text-text-faint hover:text-danger rounded"
                          title="Delete note"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-text-muted line-clamp-2 mt-1">
                      {note.content.replace(/#|\*|`/g, '')}
                    </p>

                    <div className="mt-2 text-[10px] text-text-faint font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(note.created_at).toLocaleDateString()}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Note Reader & Markdown display */}
        <div className="lg:col-span-7">
          {activeNote ? (
            <Card className="p-6 space-y-4 border border-border-base min-h-[480px]">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-border-base">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-text-primary">{activeNote.title}</h2>
                    {activeNote.is_pinned && (
                      <Badge variant="warning" size="sm">
                        Pinned
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-mono text-text-faint mt-1 block">
                    Created {new Date(activeNote.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() =>
                      togglePinMutation.mutate({
                        id: activeNote.id,
                        is_pinned: !activeNote.is_pinned,
                      })
                    }
                    icon={<Pin className="w-3.5 h-3.5" />}
                  >
                    {activeNote.is_pinned ? 'Unpin' : 'Pin'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-danger hover:text-danger"
                    onClick={() => deleteMutation.mutate(activeNote.id)}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Note Content display */}
              <div className="prose prose-invert max-w-none text-xs text-text-secondary leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
                {activeNote.content}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center text-xs text-text-muted min-h-[300px] flex items-center justify-center">
              Select or create a note to view content.
            </Card>
          )}
        </div>
      </div>

      {/* New Note Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Engineering Note"
        description="Document architecture decisions, research, or technical specifications"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            createMutation.mutate();
          }}
          className="space-y-4 pt-2"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary block">Note Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. ADR 002: TanStack Query Cache Invalidation Rules"
              className="w-full bg-bg-base border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary block">
              Content (Markdown supported) *
            </label>
            <textarea
              rows={8}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write specifications, context, consequences, code blocks..."
              className="w-full bg-bg-base border border-border-base rounded-xl p-3 text-xs text-text-primary font-mono focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pinNote"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded bg-bg-base border-border-base text-developer-500"
            />
            <label htmlFor="pinNote" className="text-xs text-text-secondary cursor-pointer">
              Pin this note to top of list
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-border-base">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="!bg-blue-600 hover:!bg-blue-700"
              disabled={!title.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
