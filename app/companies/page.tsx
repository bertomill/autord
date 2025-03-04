'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { searchCompanies } from '../lib/api';

interface Company {
  symbol: string;
  name: string;
  type: string;
  region: string;
  isTracked?: boolean;
}

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [trackedCompanies, setTrackedCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tracked companies from localStorage on component mount
  useEffect(() => {
    const savedCompanies = localStorage.getItem('trackedCompanies');
    if (savedCompanies) {
      setTrackedCompanies(JSON.parse(savedCompanies));
    }
  }, []);

  // Save tracked companies to localStorage when they change
  useEffect(() => {
    localStorage.setItem('trackedCompanies', JSON.stringify(trackedCompanies));
  }, [trackedCompanies]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const results = await searchCompanies(searchQuery);
      
      // Map results to our Company interface
      const companies = results.map((result) => ({
        symbol: result.symbol,
        name: result.name,
        type: result.type || '',
        region: result.exchange || '',
        isTracked: trackedCompanies.some(company => company.symbol === result.symbol)
      }));
      
      setSearchResults(companies);
    } catch (err) {
      setError('Failed to search companies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTrackCompany = (company: Company) => {
    if (trackedCompanies.some(c => c.symbol === company.symbol)) {
      // Remove from tracked companies
      setTrackedCompanies(trackedCompanies.filter(c => c.symbol !== company.symbol));
      
      // Update search results
      setSearchResults(searchResults.map(c => 
        c.symbol === company.symbol ? { ...c, isTracked: false } : c
      ));
    } else {
      // Add to tracked companies
      setTrackedCompanies([...trackedCompanies, { ...company, isTracked: true }]);
      
      // Update search results
      setSearchResults(searchResults.map(c => 
        c.symbol === company.symbol ? { ...c, isTracked: true } : c
      ));
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-[#0f0f0f] text-white min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">Companies</h1>
      
      {/* Search section */}
      <div className="mb-8">
        <h2 className="text-xl mb-4">Search Companies</h2>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search by company name or symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#1a1a1a] border-[#333] text-white"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button 
            onClick={handleSearch}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        
        {error && (
          <div className="mt-4 bg-[#450a0a]/20 border border-[#b91c1c] text-[#fca5a5] p-4 rounded-md">
            {error}
          </div>
        )}
        
        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg mb-2">Search Results</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((company) => (
                <div 
                  key={company.symbol} 
                  className="bg-[#1a1a1a] border border-[#333] p-4 rounded-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{company.name}</div>
                      <div className="text-sm text-[#60a5fa]">${company.symbol}</div>
                      <div className="text-xs text-[#94a3b8] mt-1">{company.type} • {company.region}</div>
                    </div>
                    <Button
                      variant={company.isTracked ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => toggleTrackCompany(company)}
                      className={company.isTracked ? 
                        "bg-[#ef4444] hover:bg-[#dc2626] text-white" : 
                        "bg-[#1a1a1a] hover:bg-[#333] text-white border-[#333]"
                      }
                    >
                      {company.isTracked ? 'Untrack' : 'Track'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Tracked companies section */}
      <div>
        <h2 className="text-xl mb-4">Tracked Companies</h2>
        {trackedCompanies.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-md text-center">
            <p className="text-[#94a3b8]">You&apos;re not tracking any companies yet.</p>
            <p className="text-[#94a3b8] mt-2">Search for companies above to track their earnings calls.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trackedCompanies.map((company) => (
              <div 
                key={company.symbol} 
                className="bg-[#1a1a1a] border border-[#333] p-4 rounded-md"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{company.name}</div>
                    <div className="text-sm text-[#60a5fa]">${company.symbol}</div>
                    <div className="text-xs text-[#94a3b8] mt-1">{company.type} • {company.region}</div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => toggleTrackCompany(company)}
                    className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
                  >
                    Untrack
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 