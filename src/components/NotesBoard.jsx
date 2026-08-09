import React, { useState, useEffect, useRef } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Edit, Trash2, MoreVertical, X } from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'sonner';

const NotesBoard = ({ isOpen, onClose, groupId, groupName }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = userData?.role || 'engineer';
  const userId = userData?.id;

  const isAdminOrTester = userRole === 'admin' || userRole === 'tester' || userRole === 'super_admin';
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  // We need to decide which route to call based on the user's role (admin vs user)
  const apiRouteBase = (userRole === 'admin' || userRole === 'super_admin' || userRole === 'tester') 
    ? '/api/admin/notesBoard' 
    : '/api/user/notesBoard';

  const { data: notesData, loading: notesLoading, refresh: refreshNotes } = useGet(
    groupId && isOpen ? `${apiRouteBase}/group/${groupId}` : null,
    true,
    groupId
  );

  const { mutate, loading: actionLoading } = useMutation();

  useEffect(() => {
    if (notesData?.notes) {
      setNotes(notesData.notes);
    }
  }, [notesData]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const res = await mutate({
      method: 'POST',
      url: `/api/admin/notesBoard`,
      data: { group_id: groupId, notes: newNote }
    });

    if (res?.success) {
      setNewNote('');
      refreshNotes();
    }
  };

  const handleUpdateNote = async (id) => {
    if (!editNoteContent.trim()) return;
    
    const res = await mutate({
      method: 'PUT',
      url: `/api/admin/notesBoard/${id}`,
      data: { notes: editNoteContent }
    });

    if (res?.success) {
      setEditingNoteId(null);
      setEditNoteContent('');
      refreshNotes();
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    
    const res = await mutate({
      method: 'DELETE',
      url: `/api/admin/notesBoard/${id}`
    });

    if (res?.success) {
      refreshNotes();
    }
  };

  const canEditOrDelete = (note) => {
    return isAdmin || note.user_id === userId;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b border-border bg-card shrink-0">
          <DialogTitle className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-foreground flex items-center justify-between">
            <span>Notes Board - {groupName}</span>
          </DialogTitle>
        </DialogHeader>
        
        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#f8f9fa] dark:bg-background custom-scrollbar">
          {notesLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
              <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">speaker_notes_off</span>
              <p>No notes found for this group.</p>
            </div>
          ) : (
            notes.map((note) => (
              <div 
                key={note.id} 
                className={`flex w-full ${note.user_id === userId ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm border ${
                    note.user_id === userId 
                    ? 'bg-primary/10 border-primary/20 rounded-tr-sm' 
                    : 'bg-card border-border rounded-tl-sm'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground">
                        {note.author_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {note.author_name}
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground uppercase">
                        {note.author_role}
                      </span>
                    </div>
                    
                    {/* Actions Menu */}
                    {canEditOrDelete(note) && (
                      <div className="flex gap-1 shrink-0">
                        {editingNoteId !== note.id && (
                          <button 
                            onClick={() => { setEditingNoteId(note.id); setEditNoteContent(note.notes); }} 
                            className="text-muted-foreground hover:text-primary p-1 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteNote(note.id)} 
                          className="text-muted-foreground hover:text-red-500 p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editingNoteId === note.id ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <Textarea
                        value={editNoteContent}
                        onChange={(e) => setEditNoteContent(e.target.value)}
                        className="min-h-[80px] bg-background text-sm"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingNoteId(null)} className="h-7 text-xs">
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleUpdateNote(note.id)} disabled={actionLoading} className="h-7 text-xs bg-primary text-white">
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {note.notes}
                    </p>
                  )}
                  
                  <div className="flex justify-end mt-2">
                    <span className="text-[10px] text-muted-foreground">
                      {dayjs(note.createdAt).format('MMM DD, YYYY - hh:mm A')}
                      {note.updatedAt && note.updatedAt !== note.createdAt && ' (edited)'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area (Only for Admin & Tester) */}
        {isAdminOrTester && (
          <div className="p-4 border-t border-border bg-card shrink-0">
            <form onSubmit={handleAddNote} className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type a new note here..."
                  className="min-h-[60px] max-h-[120px] resize-y bg-background pr-12 focus-visible:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddNote(e);
                    }
                  }}
                />
              </div>
              <Button 
                type="submit" 
                disabled={!newNote.trim() || actionLoading} 
                className="h-[60px] w-[60px] rounded-xl bg-primary hover:bg-primary/90 text-white shrink-0"
              >
                {actionLoading && !editingNoteId ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">Press Enter to send, Shift + Enter for new line.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NotesBoard;
