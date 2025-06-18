// A component to display rate limit information to users
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useQuota } from '@/lib/quota-context';

interface RateLimitIndicatorProps {
  type: 'generate' | 'domain-check';
  className?: string;
  // Optional props to override context values (for testing or special cases)
  remaining?: number;
  total?: number;
}

export function RateLimitIndicator({ 
  type,
  className = '',
  remaining: propRemaining,
  total: propTotal
}: RateLimitIndicatorProps) {
  // Get quota data from context
  const { quotas } = useQuota();
  
  // Use props if provided, otherwise use context values
  const remaining = propRemaining !== undefined ? propRemaining : quotas[type].remaining;
  const total = propTotal !== undefined ? propTotal : quotas[type].total;
  // Calculate percentage remaining
  const percentRemaining = Math.max(0, Math.min(100, (remaining / total) * 100));
  
  // Determine color based on remaining percentage
  const getColorClass = () => {
    if (percentRemaining > 60) return 'bg-green-500';
    if (percentRemaining > 30) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  // Format the label based on type
  const getLabel = () => {
    if (type === 'generate') {
      return 'Name Generations';
    } else {
      return 'Domain Checks';
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>Daily {getLabel()} Quota</span>
        <Badge variant="outline" className="font-mono">
          {remaining}/{total}
        </Badge>
      </div>
      <Progress 
        value={percentRemaining} 
        className={`h-1.5 ${getColorClass()}`}
      />
    </div>
  );
}
