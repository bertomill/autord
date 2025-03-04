'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';

export default function EditNotePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        // Redirect to the notes page with a query parameter to open the edit modal
        router.push(`/notes?edit=${params.id}`);
      }
    }
  }, [user, loading, router, params.id]);

  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
} 