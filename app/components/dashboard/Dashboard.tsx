'use client';

import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <header className="bg-[#1a1a1a] border-b border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                AutoRD
              </Link>
            </div>
            <div className="flex items-center">
              <span className="text-gray-300 mr-4">
                {user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1a1a1a] rounded-lg p-8 border border-[#333]">
          <h1 className="text-2xl font-bold text-white mb-6">Welcome to AutoRD</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Project Card */}
            <div className="bg-[#222] p-6 rounded-lg border border-[#333] hover:border-blue-500/50 transition-all duration-200 cursor-pointer">
              <div className="h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-4 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white">Create New Project</h3>
              <p className="mt-2 text-gray-400">Start a new innovation research project.</p>
            </div>
            
            {/* Recent Projects */}
            <div className="bg-[#222] p-6 rounded-lg border border-[#333]">
              <h3 className="text-lg font-medium text-white mb-4">Recent Projects</h3>
              <p className="text-gray-400">You haven&apos;t created any projects yet.</p>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-[#222] p-6 rounded-lg border border-[#333]">
              <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-blue-400 hover:text-blue-300 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Website analysis
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-400 hover:text-blue-300 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Market research
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-400 hover:text-blue-300 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Growth insights
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 