/**
 * Component to display rate limit information for guest users
 */
import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface RateLimitProps {
  type: 'generate' | 'domain-check';
  remaining?: number;
  total?: number;
  className?: string;
}

export function RateLimitIndicator({ 
  type, 
  remaining, 
  total, 
  className = '' 
}: RateLimitProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Only show the indicator if we have rate limit information
  useEffect(() => {
    if (remaining !== undefined && total !== undefined) {
      setIsVisible(true);
    }
  }, [remaining, total]);
  
  if (!isVisible || remaining === undefined || total === undefined) {
    return null;
  }
  
  // Determine color based on remaining quota
  const getColor = () => {
    const percentage = (remaining / total) * 100;
    if (percentage > 50) return 'text-green-500';
    if (percentage > 20) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // Get appropriate message based on type and remaining quota
  const getMessage = () => {
    if (type === 'generate') {
      return `${remaining}/${total} generations remaining today`;
    } else {
      return `${remaining}/${total} domain checks remaining today`;
    }
  };
  
  return (
    <div className={`flex items-center gap-1.5 text-sm ${getColor()} ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <span>{getMessage()}</span>
    </div>
  );
}
