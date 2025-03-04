'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-[#0f0f0f]/80 backdrop-blur-sm sticky top-0 z-50 border-b border-[#333]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              AutoRD
            </Link>
            <div className="hidden md:flex ml-10 space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors duration-200">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors duration-200">Pricing</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors duration-200">About</a>
            </div>
          </div>
          <div className="hidden md:flex items-center">
            <Link href="/signup" className="ml-8 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
              Sign up for free
            </Link>
          </div>
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1a1a1a] border-b border-[#333]">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a href="#features" className="block px-3 py-2 text-gray-300 hover:text-white transition-colors duration-200">Features</a>
            <a href="#pricing" className="block px-3 py-2 text-gray-300 hover:text-white transition-colors duration-200">Pricing</a>
            <a href="#about" className="block px-3 py-2 text-gray-300 hover:text-white transition-colors duration-200">About</a>
            <Link href="/signup" className="block px-3 py-2 text-blue-400 hover:text-blue-300 transition-colors duration-200">
              Sign up for free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
} 