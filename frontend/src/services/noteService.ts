import { api } from './api';
import type { Note, CreateNoteRequest } from '../types/aiProposal';

export function fetchNotes(projectId?: number, role?: string): Promise<Note[]> {
  return api.get<Note[]>('/notes', { params: { project_id: projectId, role } });
}

export function createNote(data: CreateNoteRequest): Promise<Note> {
  return api.post<Note>('/notes', data);
}

export function updateNote(id: number, data: Partial<CreateNoteRequest>): Promise<Note> {
  return api.patch<Note>(`/notes/${id}`, data);
}

export async function deleteNote(id: number): Promise<void> {
  await api.delete(`/notes/${id}`);
}
