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

interface Update {
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

export default function UpdatesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUpdate, setNewUpdate] = useState<Partial<Update>>({
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
  const [editingUpdate, setEditingUpdate] = useState<Update | null>(null);

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

  // Fetch updates
  useEffect(() => {
    const fetchUpdatesFromFirebase = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const updatesRef = collection(db, 'updates');
        const q = query(
          updatesRef,
          where('userId', '==', user.uid),
          orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedUpdates: Update[] = [];
        
        querySnapshot.forEach((doc) => {
          fetchedUpdates.push({
            id: doc.id,
            ...doc.data() as Omit<Update, 'id'>
          });
        });
        
        setUpdates(fetchedUpdates);
      } catch (error) {
        console.error('Error fetching updates:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUpdatesFromFirebase();
  }, [user]);

  // Function to fetch updates (can be called after adding a new update)
  const fetchUpdates = async () => {
    if (!user) return;
    
    try {
      const updatesRef = collection(db, 'updates');
      const q = query(
        updatesRef,
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedUpdates: Update[] = [];
      
      querySnapshot.forEach((doc) => {
        fetchedUpdates.push({
          id: doc.id,
          ...doc.data() as Omit<Update, 'id'>
        });
      });
      
      setUpdates(fetchedUpdates);
    } catch (error) {
      console.error('Error fetching updates:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'isGeneral') {
      const isGeneral = value === 'true';
      setNewUpdate({
        ...newUpdate,
        isGeneral,
        type: isGeneral ? 'general' : newUpdate.type || 'general',
        companySymbol: isGeneral ? '' : newUpdate.companySymbol,
        companyName: isGeneral ? '' : newUpdate.companyName
      });
    } else if (name === 'companySymbol') {
      const selectedCompany = trackedCompanies.find(c => c.symbol === value);
      setNewUpdate({
        ...newUpdate,
        companySymbol: value,
        companyName: selectedCompany?.name || ''
      });
    } else {
      setNewUpdate({
        ...newUpdate,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      // Combine user notes with extracted content if available
      let finalContent = newUpdate.content || '';
      
      if (extractedContent) {
        finalContent = `${finalContent}\n\n--- EXTRACTED CONTENT ---\n\n${extractedContent}`;
      }
      
      const updateData: Omit<Update, 'id'> = {
        userId: user.uid,
        title: newUpdate.title || '',
        content: finalContent,
        date: newUpdate.date || Timestamp.now(),
        type: 'general',
        isGeneral: true
      };
      
      // Add link if provided
      if (newUpdate.link) {
        updateData.link = newUpdate.link;
      }
      
      if (isEditing && editingUpdate?.id) {
        // Update existing document
        await updateDoc(doc(db, 'updates', editingUpdate.id), updateData);
      } else {
        // Add new document
        await addDoc(collection(db, 'updates'), updateData);
      }
      
      // Reset form and states
      setNewUpdate({
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
      setEditingUpdate(null);
      
      // Refresh updates
      fetchUpdates();
    } catch (error) {
      console.error('Error saving update:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    
    try {
      await deleteDoc(doc(db, 'updates', id));
      setUpdates(updates.filter(update => update.id !== id));
    } catch (error) {
      console.error('Error deleting update:', error);
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

  // Group updates by date for calendar view
  const getUpdatesForDate = (date: Date) => {
    return updates.filter(update => {
      const updateDate = update.date.toDate();
      return (
        updateDate.getDate() === date.getDate() &&
        updateDate.getMonth() === date.getMonth() &&
        updateDate.getFullYear() === date.getFullYear()
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
      const dayUpdates = getUpdatesForDate(date);
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
              {dayUpdates.length > 0 && (
                <span className="text-xs bg-blue-600 text-white px-1.5 rounded-full">
                  {dayUpdates.length}
                </span>
              )}
              <button 
                onClick={() => {
                  openUpdateModal(Timestamp.fromDate(new Date(year, month, day)));
                }}
                className="w-6 h-6 rounded-full bg-[#333] hover:bg-[#444] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Add update"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {dayUpdates.map((update) => update.id && (
              <div 
                key={update.id} 
                className="text-xs p-1 mt-1 rounded truncate flex items-center"
                style={{
                  backgroundColor: update.type === 'earnings' ? 'rgba(59, 130, 246, 0.2)' : 
                                  update.type === 'news' ? 'rgba(16, 185, 129, 0.2)' : 
                                  update.type === 'filing' ? 'rgba(245, 158, 11, 0.2)' : 
                                  update.type === 'general' ? 'rgba(139, 92, 246, 0.2)' :
                                  'rgba(156, 163, 175, 0.2)'
                }}
              >
                <span className="truncate flex-1">{update.title}</span>
                {update.link && (
                  <span className="ml-1 flex-shrink-0">
                    {update.link.includes('youtube.com') || update.link.includes('youtu.be') ? (
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

  // Add this function to render the table view
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
          {updates.map(update => (
            <div key={update.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-[#222] transition-colors items-center">
              <div className="col-span-3 font-medium text-white">
                <div className="flex items-center">
                  <span className="truncate">{update.title}</span>
                  {update.link && (
                    <a 
                      href={update.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="ml-2 text-blue-400 hover:text-blue-300 flex items-center"
                      title={update.link}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
                {update.link && (
                  <div className="text-xs text-gray-400 truncate mt-1">
                    {update.link.includes('youtube.com') || update.link.includes('youtu.be') 
                      ? 'YouTube Transcript' 
                      : 'Web Content'}
                  </div>
                )}
              </div>
              
              <div className="col-span-2">
                <span className="text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: update.type === 'earnings' ? 'rgba(59, 130, 246, 0.2)' : 
                                    update.type === 'news' ? 'rgba(16, 185, 129, 0.2)' : 
                                    update.type === 'filing' ? 'rgba(245, 158, 11, 0.2)' : 
                                    update.type === 'general' ? 'rgba(139, 92, 246, 0.2)' :
                                    'rgba(156, 163, 175, 0.2)',
                    color: update.type === 'earnings' ? 'rgb(59, 130, 246)' : 
                           update.type === 'news' ? 'rgb(16, 185, 129)' : 
                           update.type === 'filing' ? 'rgb(245, 158, 11)' : 
                           update.type === 'general' ? 'rgb(139, 92, 246)' :
                           'rgb(156, 163, 175)'
                  }}
                >
                  {update.isGeneral ? 'General' : update.type.charAt(0).toUpperCase() + update.type.slice(1)}
                </span>
              </div>
              
              <div className="col-span-2">
                {!update.isGeneral && update.companySymbol ? (
                  <div className="flex items-center">
                    <span className="font-mono text-xs bg-[#333] px-1.5 py-0.5 rounded">
                      {update.companySymbol}
                    </span>
                    <span className="ml-2 text-xs text-gray-400 truncate">
                      {update.companyName}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">—</span>
                )}
              </div>
              
              <div className="col-span-3 text-sm text-gray-300 truncate">
                {update.content}
              </div>
              
              <div className="col-span-1 text-xs text-gray-400">
                {update.date.toDate().toLocaleDateString()}
              </div>
              
              <div className="col-span-1 text-right flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(update)}
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                  title="Edit"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(update.id as string)}
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

  // Add this function to extract content from URLs
  const extractContent = async () => {
    if (!newUpdate.link) {
      setExtractionError('Please enter a URL first');
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);
    
    try {
      const url = newUpdate.link;
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
        setNewUpdate({
          ...newUpdate,
          title: newUpdate.title || 'YouTube Transcript',
        });
      } else {
        setExtractedContent(data.content || '');
        setNewUpdate({
          ...newUpdate,
          title: newUpdate.title || data.name || 'Web Page Content',
        });
      }
    } catch (error) {
      console.error('Error extracting content:', error);
      setExtractionError(error instanceof Error ? error.message : 'Failed to extract content');
    } finally {
      setIsExtracting(false);
    }
  };

  // Function to open the update modal (replaces both showForm and showAddForm)
  const openUpdateModal = (date?: Timestamp) => {
    // If a date is provided, set it in the newUpdate state
    if (date) {
      setNewUpdate({
        ...newUpdate,
        date: date
      });
    } else {
      // If no date provided, use current date
      setNewUpdate({
        ...newUpdate,
        date: Timestamp.now()
      });
    }
    
    setShowAddForm(true); // Use the existing modal
  };

  // Function to handle edit (simplified)
  const handleEdit = (update: Update) => {
    setEditingUpdate(update);
    setNewUpdate({
      title: update.title,
      content: update.content,
      companySymbol: update.companySymbol || '',
      companyName: update.companyName || '',
      type: update.type,
      isGeneral: update.isGeneral,
      link: update.link || '',
      date: update.date
    });
    
    // If the update has a link, check if it's from YouTube or web
    if (update.link) {
      if (update.link.includes('youtube.com') || update.link.includes('youtu.be')) {
        setExtractionSource('youtube');
      } else {
        setExtractionSource('web');
      }
      
      // Try to separate user notes from extracted content
      const contentParts = update.content.split('--- EXTRACTED CONTENT ---');
      if (contentParts.length > 1) {
        setNewUpdate(prev => ({
          ...prev,
          content: contentParts[0].trim()
        }));
        setExtractedContent(contentParts[1].trim());
      }
    }
    
    setIsEditing(true);
    setShowAddForm(true); // Use the existing modal instead of showForm
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
        <h1 className="text-2xl font-bold">Company Updates</h1>
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
            onClick={() => openUpdateModal()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Update
          </Button>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] p-6 rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {isEditing ? 'Edit Update' : `Add Update for ${newUpdate.date?.toDate().toLocaleDateString()}`}
              </h2>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setIsEditing(false);
                  setEditingUpdate(null);
                  setNewUpdate({
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
                  value={newUpdate.title}
                  onChange={handleInputChange}
                  className="w-full bg-[#2a2a2a] border border-[#333] rounded px-3 py-2 text-white"
                  placeholder="Update title"
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
                    value={newUpdate.link || ''}
                    onChange={handleInputChange}
                    className="flex-1 bg-[#2a2a2a] border border-[#333] rounded px-3 py-2 text-white"
                    placeholder="https://example.com/announcement or YouTube URL"
                  />
                  <button
                    type="button"
                    onClick={extractContent}
                    disabled={isExtracting || !newUpdate.link}
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
                  value={newUpdate.content}
                  onChange={handleInputChange}
                  className="w-full bg-[#2a2a2a] border border-[#333] rounded px-3 py-2 text-white h-32"
                  placeholder={extractedContent ? "Add your notes about this content..." : "Update details..."}
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
                  {isEditing ? 'Save Changes' : 'Save Update'}
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
      ) : updates.length === 0 ? (
        <div className="bg-[#1a1a1a] p-6 rounded-lg text-center">
          <p className="text-gray-400">No updates yet. Start by adding an update or tracking companies.</p>
        </div>
      ) : (
        viewMode === 'list' ? renderTableView() : renderCalendar()
      )}
    </div>
  );
} 