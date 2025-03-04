'use client';

import { useEffect, useState } from 'react';
import { getApiUsage } from '../lib/api';

export default function ApiUsageIndicator() {
  const [usage, setUsage] = useState({ count: 0, limit: 250, resetDate: '' });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Update usage on mount and every minute
    const updateUsage = () => {
      const currentUsage = getApiUsage();
      setUsage(currentUsage);
      
      // Show indicator if we're using more than 50% of the limit
      setVisible(currentUsage.count > currentUsage.limit * 0.5);
    };
    
    updateUsage();
    const interval = setInterval(updateUsage, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  if (!visible) return null;
  
  // Calculate percentage used
  const percentUsed = Math.min(100, Math.round((usage.count / usage.limit) * 100));
  
  // Determine color based on usage
  let color = 'bg-green-500';
  if (percentUsed > 80) color = 'bg-red-500';
  else if (percentUsed > 60) color = 'bg-yellow-500';
  
  // Format reset date
  const resetDate = new Date(usage.resetDate);
  const resetTime = resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div className="fixed bottom-4 right-4 bg-[#1a1a1a] border border-[#333] rounded-lg p-3 shadow-lg z-50">
      <h4 className="text-sm font-medium mb-1">API Usage</h4>
      <div className="w-full bg-[#333] rounded-full h-2.5 mb-1">
        <div 
          className={`h-2.5 rounded-full ${color}`} 
          style={{ width: `${percentUsed}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs">
        <span>{usage.count} / {usage.limit}</span>
        <span>Resets at {resetTime}</span>
      </div>
    </div>
  );
} 