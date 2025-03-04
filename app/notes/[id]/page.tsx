'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Link from 'next/link';
import { Button } from '../../components/ui/button';

interface Note {
  id?: string;
  userId: string;
  title: string;
  content: string;
  date: Timestamp;
  type: 'general';
  isGeneral: boolean;
  link?: string;
}

export default function NotePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch note data
  useEffect(() => {
    const fetchNote = async () => {
      if (!user || !params.id) return;
      
      setIsLoading(true);
      try {
        const noteRef = doc(db, 'updates', params.id as string);
        const noteSnap = await getDoc(noteRef);
        
        if (noteSnap.exists()) {
          const noteData = noteSnap.data() as Omit<Note, 'id'>;
          
          // Verify that the note belongs to the current user
          if (noteData.userId !== user.uid) {
            setError('You do not have permission to view this note');
            setNote(null);
          } else {
            setNote({
              id: noteSnap.id,
              ...noteData
            });
            setError(null);
          }
        } else {
          setError('Note not found');
          setNote(null);
        }
      } catch (err) {
        console.error('Error fetching note:', err);
        setError('Failed to load note');
        setNote(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNote();
  }, [user, params.id]);

  // Format content for display
  const formatContent = (content: string) => {
    const parts = content.split('--- EXTRACTED CONTENT ---');
    
    if (parts.length > 1) {
      return (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Your Notes</h3>
            <div className="whitespace-pre-wrap">{parts[0].trim()}</div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Extracted Content</h3>
            <div className="whitespace-pre-wrap bg-[#1a1a1a] p-4 rounded-md text-gray-300 font-mono text-sm">
              {parts[1].trim()}
            </div>
          </div>
        </>
      );
    }
    
    return <div className="whitespace-pre-wrap">{content}</div>;
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="p-6">
        <div className="bg-[#1a1a1a] p-6 rounded-lg text-center">
          <p className="text-red-400 mb-4">{error || 'Note not found'}</p>
          <Link href="/notes">
            <Button variant="default">Back to Notes</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/notes" className="text-blue-400 hover:text-blue-300 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Notes
        </Link>
      </div>
      
      <div className="bg-[#1a1a1a] rounded-lg border border-[#333] p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{note.title}</h1>
            <div className="flex items-center text-sm text-gray-400">
              <span>{note.date.toDate().toLocaleString()}</span>
              {note.link && (
                <a 
                  href={note.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="ml-4 text-blue-400 hover:text-blue-300 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {note.link.includes('youtube.com') || note.link.includes('youtu.be') 
                    ? 'View on YouTube' 
                    : 'Visit Source'}
                </a>
              )}
            </div>
          </div>
          
          <Link href={`/notes/edit/${note.id}`}>
            <Button variant="outline" className="border-[#333] hover:bg-[#333]">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Note
            </Button>
          </Link>
        </div>
        
        <div className="prose prose-invert max-w-none">
          {formatContent(note.content)}
        </div>
      </div>
    </div>
  );
} 