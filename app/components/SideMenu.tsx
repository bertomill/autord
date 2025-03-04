'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface SideMenuProps {
  isMobileMenuOpen: boolean;
  closeMobileMenu: () => void;
}

export default function SideMenu({ isMobileMenuOpen, closeMobileMenu }: SideMenuProps) {
  const pathname = usePathname();
  
  // Close menu when pathname changes
  useEffect(() => {
    // This is a separate effect that only depends on pathname
    // It won't run when isMobileMenuOpen or closeMobileMenu change
  }, [pathname]);
  
  // Set up navigation event listener
  useEffect(() => {
    // Function to handle navigation events
    const handleNavigation = () => {
      if (isMobileMenuOpen) {
        closeMobileMenu();
      }
    };
    
    // Listen for clicks on links
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.getAttribute('href')?.startsWith('/')) {
        handleNavigation();
      }
    };
    
    document.addEventListener('click', handleLinkClick);
    
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      {/* No backdrop or overlay to keep the rest of the screen fully visible */}
      
      {/* Desktop sidebar - always visible on lg screens */}
      <aside className="hidden lg:flex flex-col h-screen bg-[#0f0f0f] text-white border-r border-[#333] w-[220px]">
        <div className="p-4 border-b border-[#333]">
          <h1 className="text-xl font-semibold">AutoRD</h1>
          <p className="text-sm text-[#94a3b8]">Research Documentation</p>
        </div>
        
        <nav className="flex-1 p-2 overflow-y-auto">
          <SidebarLinks isActive={isActive} />
        </nav>
      </aside>
      
      {/* Mobile sidebar - conditionally visible */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 w-[280px] bg-[#0f0f0f] text-white border-r border-[#333] shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:hidden
        `}
        style={{ boxShadow: isMobileMenuOpen ? '0 0 15px rgba(0, 0, 0, 0.5)' : 'none' }}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-[#333] flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold">AutoRD</h1>
              <p className="text-sm text-[#94a3b8]">Research Documentation</p>
            </div>
            <button 
              className="text-gray-400 hover:text-white"
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav className="flex-1 p-2 overflow-y-auto">
            <SidebarLinks isActive={isActive} />
          </nav>
        </div>
      </div>
    </>
  );
}

// Extracted sidebar links to avoid duplication
function SidebarLinks({ isActive }: { isActive: (path: string) => boolean }) {
  return (
    <ul className="space-y-1">
      <li>
        <Link 
          href="/" 
          className={`flex items-center px-3 py-2 rounded-md ${
            isActive('/') ? 'bg-[#333] text-white' : 'text-gray-300 hover:bg-[#222] hover:text-white'
          }`}
        >
          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </Link>
      </li>
      <li>
        <Link 
          href="/companies" 
          className={`flex items-center px-3 py-2 rounded-md ${
            isActive('/companies') ? 'bg-[#333] text-white' : 'text-gray-300 hover:bg-[#222] hover:text-white'
          }`}
        >
          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Companies
        </Link>
      </li>
      <li>
        <Link 
          href="/genstudio" 
          className={`flex items-center px-3 py-2 rounded-md ${
            isActive('/genstudio') ? 'bg-[#333] text-white' : 'text-gray-300 hover:bg-[#222] hover:text-white'
          }`}
        >
          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          GenStudio
        </Link>
      </li>
      <li>
        <Link 
          href="/notes" 
          className={`flex items-center px-3 py-2 rounded-md ${
            isActive('/notes') || isActive('/updates') ? 'bg-[#333] text-white' : 'text-gray-300 hover:bg-[#222] hover:text-white'
          }`}
        >
          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Notes
        </Link>
      </li>
      <li>
        <Link 
          href="/templates" 
          className={`flex items-center px-3 py-2 rounded-md ${
            isActive('/templates') ? 'bg-[#333] text-white' : 'text-gray-300 hover:bg-[#222] hover:text-white'
          }`}
        >
          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h3.172a2 2 0 011.414.586l1.828 1.828A2 2 0 0013.828 7H18a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
          </svg>
          Templates
        </Link>
      </li>
    </ul>
  );
}