'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp, 
  orderBy, 
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";

interface Note {
  id?: string;
  userId: string;
  title: string;
  content: string;
  date: Timestamp;
  type: 'general' | 'earnings' | 'news' | 'filing';
  isGeneral: boolean;
  link?: string;
  companySymbol?: string;
  companyName?: string;
}

export default function NotesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newNote, setNewNote] = useState<Partial<Note>>({
    title: '',
    content: '',
    type: 'general',
    isGeneral: false,
    link: ''
  });
  const [trackedCompanies, setTrackedCompanies] = useState<{symbol: string, name: string}[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionSource, setExtractionSource] = useState<'youtube' | 'web' | null>(null);
  const [extractedContent, setExtractedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch tracked companies
  useEffect(() => {
    if (!user) return;

    const fetchTrackedCompanies = async () => {
      try {
        const q = query(
          collection(db, 'trackedCompanies'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const companies = querySnapshot.docs.map(doc => ({
          symbol: doc.data().symbol,
          name: doc.data().name
        }));
        
        setTrackedCompanies(companies);
      } catch (error) {
        console.error('Error fetching tracked companies:', error);
      }
    };

    fetchTrackedCompanies();
  }, [user]);

  // Fetch notes
  useEffect(() => {
    const fetchNotesFromFirebase = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const notesRef = collection(db, 'updates'); // Still using 'updates' collection for now
        const q = query(
          notesRef,
          where('userId', '==', user.uid),
          orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedNotes: Note[] = [];
        
        querySnapshot.forEach((doc) => {
          fetchedNotes.push({
            id: doc.id,
            ...doc.data() as Omit<Note, 'id'>
          });
        });
        
        setNotes(fetchedNotes);
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotesFromFirebase();
  }, [user]);

  // Function to fetch notes (can be called after adding a new note)
  const fetchNotes = async () => {
    if (!user) return;
    
    try {
      const notesRef = collection(db, 'updates'); // Still using 'updates' collection for now
      const q = query(
        notesRef,
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedNotes: Note[] = [];
      
      querySnapshot.forEach((doc) => {
        fetchedNotes.push({
          id: doc.id,
          ...doc.data() as Omit<Note, 'id'>
        });
      });
      
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'isGeneral') {
      const isGeneral = value === 'true';
      setNewNote({
        ...newNote,
        isGeneral,
        type: isGeneral ? 'general' : newNote.type || 'general',
        companySymbol: isGeneral ? '' : newNote.companySymbol,
        companyName: isGeneral ? '' : newNote.companyName
      });
    } else if (name === 'companySymbol') {
      const selectedCompany = trackedCompanies.find(c => c.symbol === value);
      setNewNote({
        ...newNote,
        companySymbol: value,
        companyName: selectedCompany?.name || ''
      });
    } else {
      setNewNote({
        ...newNote,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      // Combine user notes with extracted content if available
      let finalContent = newNote.content || '';
      
      if (extractedContent) {
        finalContent = `${finalContent}\n\n--- EXTRACTED CONTENT ---\n\n${extractedContent}`;
      }
      
      const noteData: Omit<Note, 'id'> = {
        userId: user.uid,
        title: newNote.title || '',
        content: finalContent,
        date: newNote.date || Timestamp.now(),
        type: 'general',
        isGeneral: true
      };
      
      // Add link if provided
      if (newNote.link) {
        noteData.link = newNote.link;
      }
      
      if (isEditing && editingNote?.id) {
        // Update existing document
        await updateDoc(doc(db, 'updates', editingNote.id), noteData);
      } else {
        // Add new document
        await addDoc(collection(db, 'updates'), noteData);
      }
      
      // Reset form and states
      setNewNote({
        title: '',
        content: '',
        type: 'general',
        isGeneral: true,
        link: ''
      });
      setExtractedContent('');
      setExtractionSource(null);
      setShowAddForm(false);
      setIsEditing(false);
      setEditingNote(null);
      
      // Refresh notes
      fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    
    try {
      await deleteDoc(doc(db, 'updates', id));
      setNotes(notes.filter(note => note.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  // Function to get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Function to get day of week (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Function to navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const prevMonth = new Date(prev);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      return prevMonth;
    });
  };

  // Function to navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const nextMonth = new Date(prev);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    });
  };

  // Function to go to current month
  const goToCurrentMonth = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  // Group notes by date for calendar view
  const getNotesForDate = (date: Date) => {
    return notes.filter(note => {
      const noteDate = note.date.toDate();
      return (
        noteDate.getDate() === date.getDate() &&
        noteDate.getMonth() === date.getMonth() &&
        noteDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Render calendar view
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Create calendar grid
    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-24 bg-[#1a1a1a] bg-opacity-50 border border-[#333]"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayNotes = getNotesForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      
      calendarDays.push(
        <div 
          key={`day-${day}`} 
          className={`h-24 bg-[#1a1a1a] border border-[#333] p-1 overflow-hidden flex flex-col group ${
            isToday ? 'ring-2 ring-blue-500 ring-inset' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-sm font-semibold ${isToday ? 'text-blue-400' : 'text-gray-300'}`}>
              {day}
            </span>
            <div className="flex items-center space-x-1">
              {dayNotes.length > 0 && (
                <span className="text-xs bg-blue-600 text-white px-1.5 rounded-full">
                  {dayNotes.length}
                </span>
              )}
              <button 
                onClick={() => {
                  openNoteModal(Timestamp.fromDate(new Date(year, month, day)));
                }}
                className="w-6 h-6 rounded-full bg-[#333] hover:bg-[#444] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Add note"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {dayNotes.map((note) => note.id && (
              <div 
                key={note.id} 
                className="text-xs p-1 mt-1 rounded truncate flex items-center"
                style={{
                  backgroundColor: note.type === 'earnings' ? 'rgba(59, 130, 246, 0.2)' : 
                                  note.type === 'news' ? 'rgba(16, 185, 129, 0.2)' : 
                                  note.type === 'filing' ? 'rgba(245, 158, 11, 0.2)' : 
                                  note.type === 'general' ? 'rgba(139, 92, 246, 0.2)' :
                                  'rgba(156, 163, 175, 0.2)'
                }}
              >
                <span className="truncate flex-1">{note.title}</span>
                {note.link && (
                  <span className="ml-1 flex-shrink-0">
                    {note.link.includes('youtube.com') || note.link.includes('youtu.be') ? (
                      <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <button 
              onClick={goToPreviousMonth}
              className="p-1 rounded-full hover:bg-[#333]"
              aria-label="Previous month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold">
              {monthNames[month]} {year}
            </h2>
            <button 
              onClick={goToNextMonth}
              className="p-1 rounded-full hover:bg-[#333]"
              aria-label="Next month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button 
            onClick={goToCurrentMonth}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Today
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarDays}
        </div>
      </div>
    );
  };

  // Render table view
  const renderTableView = () => {
    return (
      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#333] bg-[#222] text-sm font-medium text-gray-400">
          <div className="col-span-3">Title</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Company</div>
          <div className="col-span-3">Content</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        
        {/* Table Rows */}
        <div className="divide-y divide-[#333]">
          {notes.map(note => (
            <div key={note.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-[#222] transition-colors items-center">
              <div className="col-span-3 font-medium text-white">
                <div className="flex items-center">
                  <span className="truncate">{note.title}</span>
                  {note.link && (
                    <a 
                      href={note.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="ml-2 text-blue-400 hover:text-blue-300 flex items-center"
                      title={note.link}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
                {note.link && (
                  <div className="text-xs text-gray-400 truncate mt-1">
                    {note.link.includes('youtube.com') || note.link.includes('youtu.be') 
                      ? 'YouTube Transcript' 
                      : 'Web Content'}
                  </div>
                )}
              </div>
              
              <div className="col-span-2">
                <span className="text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: note.type === 'earnings' ? 'rgba(59, 130, 246, 0.2)' : 
                                    note.type === 'news' ? 'rgba(16, 185, 129, 0.2)' : 
                                    note.type === 'filing' ? 'rgba(245, 158, 11, 0.2)' : 
                                    note.type === 'general' ? 'rgba(139, 92, 246, 0.2)' :
                                    'rgba(156, 163, 175, 0.2)',
                    color: note.type === 'earnings' ? 'rgb(59, 130, 246)' : 
                           note.type === 'news' ? 'rgb(16, 185, 129)' : 
                           note.type === 'filing' ? 'rgb(245, 158, 11)' : 
                           note.type === 'general' ? 'rgb(139, 92, 246)' :
                           'rgb(156, 163, 175)'
                  }}
                >
                  {note.isGeneral ? 'General' : note.type.charAt(0).toUpperCase() + note.type.slice(1)}
                </span>
              </div>
              
              <div className="col-span-2">
                {!note.isGeneral && note.companySymbol ? (
                  <div className="flex items-center">
                    <span className="font-mono text-xs bg-[#333] px-1.5 py-0.5 rounded">
                      {note.companySymbol}
                    </span>
                    <span className="ml-2 text-xs text-gray-400 truncate">
                      {note.companyName}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">—</span>
                )}
              </div>
              
              <div className="col-span-3 text-sm text-gray-300 truncate">
                {note.content}
              </div>
              
              <div className="col-span-1 text-xs text-gray-400">
                {note.date.toDate().toLocaleDateString()}
              </div>
              
              <div className="col-span-1 text-right flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(note)}
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                  title="Edit"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(note.id as string)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Function to extract content from URLs
  const extractContent = async () => {
    if (!newNote.link) {
      setExtractionError('Please enter a URL first');
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);
    
    try {
      const url = newNote.link;
      let endpoint: string;
      let params: Record<string, string> = {};
      
      // Determine if it's a YouTube URL or a web page
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        setExtractionSource('youtube');
        endpoint = 'youtube/transcript';
        params = { url, text: 'true' };
      } else {
        setExtractionSource('web');
        endpoint = 'web/scrape';
        params = { url };
      }
      
      const response = await fetch('/api/supadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint, params }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract content');
      }
      
      // Store the extracted content separately
      if (extractionSource === 'youtube') {
        setExtractedContent(data.content || '');
        // Keep the current content as is (for user notes)
        setNewNote({
          ...newNote,
          title: newNote.title || 'YouTube Transcript',
        });
      } else {
        setExtractedContent(data.content || '');
        setNewNote({
          ...newNote,
          title: newNote.title || data.name || 'Web Page Content',
        });
      }
    } catch (error) {
      console.error('Error extracting content:', error);
      setExtractionError(error instanceof Error ? error.message : 'Failed to extract content');
    } finally {
      setIsExtracting(false);
    }
  };

  // Function to open the note modal
  const openNoteModal = (date?: Timestamp) => {
    // If a date is provided, set it in the newNote state
    if (date) {
      setNewNote({
        ...newNote,
        date: date
      });
    } else {
      // If no date provided, use current date
      setNewNote({
        ...newNote,
        date: Timestamp.now()
      });
    }
    
    setShowAddForm(true);
  };

  // Function to handle edit
  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setNewNote({
      title: note.title,
      content: note.content,
      companySymbol: note.companySymbol || '',
      companyName: note.companyName || '',
      type: note.type,
      isGeneral: note.isGeneral,
      link: note.link || '',
      date: note.date
    });
    
    // If the note has a link, check if it's from YouTube or web
    if (note.link) {
      if (note.link.includes('youtube.com') || note.link.includes('youtu.be')) {
        setExtractionSource('youtube');
      } else {
        setExtractionSource('web');
      }
      
      // Try to separate user notes from extracted content
      const contentParts = note.content.split('--- EXTRACTED CONTENT ---');
      if (contentParts.length > 1) {
        setNewNote(prev => ({
          ...prev,
          content: contentParts[0].trim()
        }));
        setExtractedContent(contentParts[1].trim());
      }
    }
    
    setIsEditing(true);
    setShowAddForm(true);
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Research Notes</h1>
        <div className="flex items-center space-x-4">
          <Tabs 
            defaultValue={viewMode} 
            onValueChange={(value) => setViewMode(value as 'list' | 'calendar')}
          >
            <TabsList className="bg-[#1a1a1a] border border-[#333]">
              <TabsTrigger 
                value="list"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Table
              </TabsTrigger>
              <TabsTrigger 
                value="calendar"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Calendar
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            onClick={() => openNoteModal()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Note
          </Button>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] p-6 rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {isEditing ? 'Edit Note' : `Add Note for ${newNote.date?.toDate().toLocaleDateString()}`}
              </h2>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setIsEditing(false);
                  setEditingNote(null);
                  setNewNote({
                    title: '',
                    content: '',
                    type: 'general',
                    isGeneral: true,
                    link: ''
                  });
                  setExtractedContent('');
                  setExtractionSource(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="isGeneral" value="true" />
              <input type="hidden" name="type" value="general" />
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={newNote.title}
                  onChange={handleInputChange}
                  className="w-full bg-[#2a2a2a] border border-[#333] rounded px-3 py-2 text-white"
                  placeholder="Note title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Link (Optional)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    name="link"
                    value={newNote.link || ''}
                    onChange={handleInputChange}
                    className="flex-1 bg-[#2a2a2a] border border-[#333] rounded px-3 py-2 text-white"
                    placeholder="https://example.com/announcement or YouTube URL"
                  />
                  <button
                    type="button"
                    onClick={extractContent}
                    disabled={isExtracting || !newNote.link}
                    className="bg-[#333] hover:bg-[#444] disabled:opacity-50 text-white px-3 py-2 rounded-md transition-colors flex items-center"
                  >
                    {isExtracting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    ) : (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                    Extract Content
                  </button>
                </div>
                {extractionError && (
                  <p className="text-red-500 text-sm mt-1">{extractionError}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {extractedContent ? 'Your Notes' : 'Content'}
                </label>
                <textarea
                  name="content"
                  value={newNote.content}
                  onChange={handleInputChange}
                  className="w-full bg-[#2a2a2a] border border-[#333] rounded px-3 py-2 text-white h-32"
                  placeholder={extractedContent ? "Add your notes about this content..." : "Note details..."}
                  required
                />
                {extractedContent && (
                  <p className="text-gray-400 text-xs mt-1">
                    Your notes will be combined with the extracted content when saved.
                  </p>
                )}
              </div>
              
              {/* Preview of extracted content if available */}
              {extractedContent && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Extracted Content
                  </label>
                  <div className="w-full bg-[#222] border border-[#333] rounded px-3 py-2 text-gray-300 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {extractedContent}
                    </pre>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    {extractedContent.length} characters extracted
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  {isEditing ? 'Save Changes' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-[#1a1a1a] p-6 rounded-lg text-center">
          <p className="text-gray-400">No notes yet. Start by adding a note or tracking companies.</p>
          <Button 
            onClick={() => openNoteModal()}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Add Your First Note
          </Button>
        </div>
      ) : (
        viewMode === 'list' ? renderTableView() : renderCalendar()
      )}
    </div>
  );
}