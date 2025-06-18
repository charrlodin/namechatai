'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { registerQuotaReset, registerQuotaUpdate } from '@/lib/api-helpers';

// Define the shape of our quota context
interface QuotaContextType {
  quotas: {
    generate: {
      remaining: number;
      total: number;
    };
    'domain-check': {
      remaining: number;
      total: number;
    };
  };
  updateQuota: (type: 'generate' | 'domain-check', remaining: number, total: number) => void;
  resetQuota: (type: 'generate' | 'domain-check') => void;
}

// Create the context with default values
const QuotaContext = createContext<QuotaContextType>({
  quotas: {
    generate: {
      remaining: 5, // Default values
      total: 5,
    },
    'domain-check': {
      remaining: 10, // Default values
      total: 10,
    },
  },
  updateQuota: () => {},
  resetQuota: () => {},
});

// QuotaSync component to register the quota functions with api-helpers
function QuotaSync({ 
  resetQuota, 
  updateQuota 
}: { 
  resetQuota: (type: 'generate' | 'domain-check') => void;
  updateQuota: (type: 'generate' | 'domain-check', remaining: number, total: number) => void;
}) {
  // Register the quota functions with api-helpers
  useEffect(() => {
    registerQuotaReset(resetQuota);
    registerQuotaUpdate(updateQuota);
    // No cleanup needed as we want the functions to remain registered
  }, [resetQuota, updateQuota]);
  
  // This component doesn't render anything
  return null;
}

// Export the provider component
export function QuotaProvider({ children }: { children: React.ReactNode }) {
  const [quotas, setQuotas] = useState({
    generate: {
      remaining: 5, // Default values
      total: 5,
    },
    'domain-check': {
      remaining: 10, // Default values
      total: 10,
    },
  });

  // Function to update quota values
  const updateQuota = (type: 'generate' | 'domain-check', remaining: number, total: number) => {
    setQuotas(prev => ({
      ...prev,
      [type]: {
        remaining,
        total,
      },
    }));
  };

  // Function to reset quota to zero (for quota exceeded)
  const resetQuota = (type: 'generate' | 'domain-check') => {
    setQuotas(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        remaining: 0,
      },
    }));
  };

  // Initialize quotas from API on mount
  useEffect(() => {
    // Fetch initial quota data from API
    const fetchQuotaData = async () => {
      try {
        const response = await fetch('/api/quota');
        if (response.ok) {
          const data = await response.json();
          // Update state with quota data from API
          setQuotas(data);
        }
      } catch (error) {
        console.error('Failed to fetch quota information:', error);
      }
    };

    fetchQuotaData();
  }, []);

  return (
    <QuotaContext.Provider value={{ quotas, updateQuota, resetQuota }}>
      <QuotaSync resetQuota={resetQuota} updateQuota={updateQuota} />
      {children}
    </QuotaContext.Provider>
  );
}

// Custom hook to use the quota context
export function useQuota() {
  return useContext(QuotaContext);
}
