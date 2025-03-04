'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SideMenu from './SideMenu';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prevState => !prevState);
  };
  
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {user && (
        <SideMenu 
          isMobileMenuOpen={isMobileMenuOpen} 
          closeMobileMenu={closeMobileMenu} 
        />
      )}
      <div 
        className={`${user ? 'flex-1' : 'w-full'} flex flex-col`}
        onClick={() => isMobileMenuOpen && closeMobileMenu()}
      >
        {user && (
          <header className="flex items-center justify-between p-3 sm:p-4 border-b border-[#333] bg-[#0f0f0f] sticky top-0 z-20">
            <div className="flex items-center">
              <button 
                onClick={toggleMobileMenu}
                className="lg:hidden text-gray-400 hover:text-white mr-3"
                aria-label="Toggle menu"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg sm:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">AutoRD</h1>
            </div>
            
            <div className="flex items-center">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-300 truncate max-w-[120px] md:max-w-[160px]">{user.email}</p>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#3a3a3c] flex items-center justify-center text-sm">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <button 
                  onClick={() => signOut()}
                  className="text-xs text-[#94a3b8] hover:text-white px-2 py-1 rounded hover:bg-[#333] transition-colors whitespace-nowrap"
                >
                  Sign out
                </button>
              </div>
            </div>
          </header>
        )}
        <main className="flex-1 bg-[#0f0f0f]">
          {children}
        </main>
      </div>
    </div>
  );
} 