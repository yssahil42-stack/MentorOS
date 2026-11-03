import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Search,
  Sparkles,
  Pin,
  Trash2,
  BookOpen,
  Calendar,
  CheckCircle2,
  Copy,
  ExternalLink,
  Tag,
  GraduationCap,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
} from '../../services/noteService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import type { Note } from '../../types/aiProposal';

export default function StudentNotesPage() {
  const { openAIDrawer, openCaptureModal, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pinned'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // New Note Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPinned, setNewPinned] = useState(false);

  // Fetch strictly role: 'student' notes
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', 'student'],
    queryFn: () => fetchNotes(undefined, 'student'),
  });

  const createNoteMutation = useMutation({
    mutationFn: async () => {
      return createNote({
        title: newTitle,
        content: newContent,
        is_pinned: newPinned,
        role: 'student',
      });
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewPinned(false);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Learning note saved! 📝', 'success');
    },
    onError: () => {
      showToast('Failed to save note', 'error');
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async (note: Note) => {
      return updateNote(note.id, { is_pinned: !note.is_pinned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      showToast('Note pinned status updated', 'info');
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => deleteNote(id),
    onSuccess: () => {
      setSelectedNote(null);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Note deleted', 'info');
    },
  });

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterType === 'all' || (filterType === 'pinned' && n.is_pinned);
    return matchesSearch && matchesFilter;
  });

  const pinnedNotes = notes.filter((n) => n.is_pinned);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface border border-border-base p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-student-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-student-500/15 border border-student-500/25 text-student-400">
                <FileText className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-student-500/10 text-student-300 border border-student-500/20">
                LECTURE &amp; STUDY VAULT
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
              Learning Notes &amp; Revision Guides
            </h1>
            <p className="text-sm text-text-secondary max-w-2xl">
              Compile lecture concepts, formula sheets, lab records, and use the AI assistant to synthesize exam cheat sheets.
            </p>
          </div>

          <div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="!bg-solar-500 hover:!bg-solar-600 shadow-glow-solar"
              icon={<Plus className="w-4 h-4" />}
            >
              New Note
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-student-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Total Study Notes</span>
            <FileText className="w-4 h-4 text-student-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">
            {notes.length}
          </div>
          <p className="text-2xs text-text-muted mt-1">In your personal vault</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Pinned Cheat Sheets</span>
            <Pin className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">
            {pinnedNotes.length}
          </div>
          <p className="text-2xs text-amber-400 mt-1">High priority for revision</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Subject Coverage</span>
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-text-primary">
            4 Modules
          </div>
          <p className="text-2xs text-emerald-400 mt-1">Active semester</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>AI Summarization</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-sm font-bold text-text-primary">
            1-Click Available
          </div>
          <p className="text-2xs text-indigo-400 mt-1">Extract core exam takeaways</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-bg-surface p-4 rounded-xl border border-border-base">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, formulas, or concepts..."
            className="w-full pl-9 pr-4 py-2 bg-bg-base/80 border border-border-base rounded-xl text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-student-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-student-500/20 text-student-300 border border-student-500/30'
                : 'bg-bg-base text-text-muted hover:text-text-primary border border-border-base'
            }`}
          >
            All Notes ({notes.length})
          </button>
          <button
            onClick={() => setFilterType('pinned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              filterType === 'pinned'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-bg-base text-text-muted hover:text-text-primary border border-border-base'
            }`}
          >
            <Pin className="w-3.5 h-3.5" /> Pinned Cheat Sheets ({pinnedNotes.length})
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : filteredNotes.length === 0 ? (
        <div className="card p-12 text-center border-dashed border-border-base">
          <FileText className="w-12 h-12 text-student-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-text-primary">No learning notes found</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto mt-1 mb-4">
            Record lecture summaries, formula cheat sheets, or create study guides with AI.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openCaptureModal('ai')}
              icon={<Sparkles className="w-4 h-4 text-student-400" />}
            >
              Ask AI to Create Notes
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Note Manually
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className={`p-5 flex flex-col justify-between hover:border-student-500/40 transition-all group ${
                note.is_pinned
                  ? 'border-amber-500/30 bg-amber-500/[0.02]'
                  : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-student-500/10 text-student-400">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <span className="text-2xs font-mono font-semibold px-2 py-0.5 rounded bg-bg-base text-text-muted">
                      NOTE #{note.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => togglePinMutation.mutate(note)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        note.is_pinned
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-text-faint hover:text-amber-400'
                      }`}
                      title={note.is_pinned ? 'Unpin note' : 'Pin cheat sheet'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteNoteMutation.mutate(note.id)}
                      className="p-1.5 text-text-faint hover:text-red-400 rounded-lg hover:bg-bg-elevated transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3
                  onClick={() => setSelectedNote(note)}
                  className="text-sm font-bold text-text-primary mt-3 cursor-pointer group-hover:text-student-400 transition-colors line-clamp-2"
                >
                  {note.title}
                </h3>

                <p className="text-xs text-text-muted mt-2 line-clamp-4 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border-base/60 flex items-center justify-between text-2xs text-text-faint">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-student-400" />
                  {new Date(note.created_at).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
                      showToast('Note copied to clipboard!', 'success');
                    }}
                    className="p-1 text-text-faint hover:text-text-primary"
                    title="Copy note"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-2xs text-student-400 hover:text-student-300 p-1"
                    onClick={() =>
                      openAIDrawer(
                        `Explain and generate exam practice questions based on note: "${note.title}". Content: ${note.content}`
                      )
                    }
                    icon={<Sparkles className="w-3 h-3" />}
                  >
                    AI Quiz
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Note Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Learning Note / Cheat Sheet"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTitle.trim()) return;
            createNoteMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Note / Concept Title *
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Distributed Consensus: Paxos vs Raft"
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-student-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Content / Formulas / Key Takeaways *
            </label>
            <textarea
              rows={8}
              required
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={`Write your lecture notes, markdown definitions, code blocks, or exam formulas here...

* Key Definition:
* Formula:
* Example Problem:`}
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-student-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pinNote"
              checked={newPinned}
              onChange={(e) => setNewPinned(e.target.checked)}
              className="rounded text-student-500 bg-bg-surface border-border-base"
            />
            <label htmlFor="pinNote" className="text-xs text-text-secondary cursor-pointer">
              Pin to Top as Quick Revision Cheat Sheet
            </label>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCreateModalOpen(false);
                openAIDrawer('Generate a comprehensive study note outline for a computer science or engineering topic');
              }}
              icon={<Sparkles className="w-3.5 h-3.5 text-student-400" />}
              className="text-student-400"
            >
              Ask AI for Outline
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="!bg-student-500 hover:!bg-student-600 shadow-glow-solar"
                disabled={!newTitle.trim() || !newContent.trim() || createNoteMutation.isPending}
              >
                {createNoteMutation.isPending ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Note Detail Modal */}
      {selectedNote && (
        <Modal
          isOpen={!!selectedNote}
          onClose={() => setSelectedNote(null)}
          title={selectedNote.title}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-2xs text-text-muted pb-2 border-b border-border-base">
              <span>Added: {new Date(selectedNote.created_at).toLocaleString()}</span>
              {selectedNote.is_pinned && (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <Pin className="w-3 h-3" /> Pinned Cheat Sheet
                </span>
              )}
            </div>

            <div className="bg-bg-base/70 p-4 rounded-xl border border-border-base font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto text-text-secondary">
              {selectedNote.content}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  openAIDrawer(
                    `Generate 3 practice exam questions and detailed answers based on: "${selectedNote.title}"`
                  )
                }
                icon={<Sparkles className="w-3.5 h-3.5 text-student-400" />}
              >
                AI Practice Quiz
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNoteMutation.mutate(selectedNote.id)}
                  className="text-red-400 hover:text-red-300"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedNote(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
