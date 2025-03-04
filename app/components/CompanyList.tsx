'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { getCompanies, getFollowedCompanies, followCompany, unfollowCompany } from '../lib/firebaseUtils';

interface Company {
  id: string;
  name: string;
  ticker: string;
  sector?: string;
}

export default function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const allCompanies = await getCompanies() as Company[];
        setCompanies(allCompanies);
        
        if (user) {
          const followed = await getFollowedCompanies(user.uid);
          setFollowedIds(followed.map((company: { id: string }) => company.id));
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [user]);

  const handleFollowToggle = async (companyId: string) => {
    if (!user) return;
    
    try {
      if (followedIds.includes(companyId)) {
        await unfollowCompany(user.uid, companyId);
        setFollowedIds(prev => prev.filter(id => id !== companyId));
      } else {
        await followCompany(user.uid, companyId);
        setFollowedIds(prev => [...prev, companyId]);
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    }
  };

  if (loading) {
    return <div>Loading companies...</div>;
  }

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-4">Companies</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map(company => (
          <div key={company.id} className="border p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold">{company.ticker}</h3>
                <p>{company.name}</p>
                {company.sector && <p className="text-sm text-gray-500">{company.sector}</p>}
              </div>
              {user && (
                <button
                  onClick={() => handleFollowToggle(company.id)}
                  className={`px-3 py-1 rounded ${
                    followedIds.includes(company.id)
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {followedIds.includes(company.id) ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 