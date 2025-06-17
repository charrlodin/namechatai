'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Globe, Copy, Facebook, Instagram, Twitter, Loader2 } from 'lucide-react'

// Define types for the component props
export interface DomainInfo {
  name: string;
  available?: boolean;
  price?: string;
  isChecking?: boolean;
  error?: string;
  checked?: boolean;
}

export interface SocialHandle {
  platform: 'twitter' | 'instagram' | 'facebook';
  handle: string;
}

export interface BusinessNameCardProps {
  name: string;
  available: boolean;
  pronunciation: string;
  description: string;
  domains: DomainInfo[];
  socialHandles: SocialHandle[];
}

export function BusinessNameCard({
  name,
  available,
  pronunciation,
  description,
  domains,
  socialHandles
}: BusinessNameCardProps) {
  // State to track domain availability checks
  // Initialize domains with checked=false to hide availability status until checked
  const [domainStates, setDomainStates] = useState<DomainInfo[]>(
    domains.map(domain => ({ ...domain, checked: false, available: undefined }))
  );

  // Check domain availability using our API
  const checkDomainAvailability = async (domainName: string, index: number) => {
    // Update domain state to show loading
    setDomainStates(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isChecking: true, error: undefined };
      return updated;
    });
    
    try {
      // Step 1: Check domain availability
      const availabilityResponse = await fetch('/api/check-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: domainName }),
      });
      
      const availabilityData = await availabilityResponse.json();
      
      // Check if the response contains an error
      if (!availabilityResponse.ok || availabilityData.error) {
        // Handle API error with the error message from the response if available
        throw new Error(availabilityData.error || 'Failed to check domain availability');
      }
      
      // If domain is available, get pricing information
      let priceInfo = { price: undefined, currency: 'USD' };
      
      if (availabilityData.available) {
        try {
          // Get user's location (could be enhanced with IP geolocation)
          const userLocation = navigator.language || 'en-US';
          
          // Step 2: Get pricing information
          const priceResponse = await fetch('/api/get-domain-price', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              domain: domainName,
              userLocation
            }),
          });
          
          const priceData = await priceResponse.json();
          
          if (priceResponse.ok && !priceData.error && priceData.price) {
            priceInfo = {
              price: priceData.price.toFixed(2),
              currency: priceData.currency || 'USD'
            };
          }
        } catch (priceError) {
          console.error('Error fetching price:', priceError);
          // Continue with availability info even if pricing fails
        }
      }
      
      // Update domain state with availability and pricing info
      setDomainStates(prev => {
        const updated = [...prev];
        updated[index] = { 
          ...updated[index], 
          available: availabilityData.available,
          price: priceInfo.price ? `${priceInfo.currency === 'USD' ? '$' : ''}${priceInfo.price}` : undefined,
          isChecking: false,
          checked: true, // Mark as checked
        };
        return updated;
      });
    } catch (error) {
      console.error('Error checking domain:', error);
      
      // Update domain state with error
      setDomainStates(prev => {
        const updated = [...prev];
        updated[index] = { 
          ...updated[index], 
          isChecking: false, 
          error: error instanceof Error ? error.message : 'Check failed',
          checked: true // Mark as checked even on error
        };
        return updated;
      });
    }
  };

  // Helper function to get platform-specific styling
  const getPlatformStyle = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return {
          icon: <Twitter className="h-4 w-4 text-[#1DA1F2]" />,
          bgClass: "bg-[#1DA1F2]/10",
          label: "X (TWITTER)"
        };
      case 'instagram':
        return {
          icon: <Instagram className="h-4 w-4 text-[#E1306C]" />,
          bgClass: "bg-gradient-to-br from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#FCAF45]/10",
          label: "INSTAGRAM"
        };
      case 'facebook':
        return {
          icon: <Facebook className="h-4 w-4 text-[#1877F2]" />,
          bgClass: "bg-[#1877F2]/10",
          label: "FACEBOOK"
        };
      default:
        return {
          icon: <Twitter className="h-4 w-4 text-gray-400" />,
          bgClass: "bg-gray-800",
          label: "SOCIAL"
        };
    }
  };

  return (
    <Card className="overflow-hidden border border-gray-800 rounded-lg bg-black/40">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium">{name}</h3>
          {/* Availability badge hidden until real API integration */}
          {/* 
          <span className={`text-xs ${available ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'} px-2 py-0.5 rounded-sm`}>
            {available ? 'Available' : 'Unavailable'}
          </span>
          */}
        </div>
        <p className="text-xs text-gray-400 mb-1">Pronounced: {pronunciation}</p>
        <p className="text-sm text-gray-300 mb-4">
          {description}
        </p>
        
        <div className="mt-4">
          <div className="text-xs uppercase text-gray-500 mb-2">Domain Availability</div>
          <div className="space-y-2">
            {domainStates.map((domain, i) => (
              <div
                key={i}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm">{domain.name}</span>
                  {domain.checked && domain.available === true && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-sm flex items-center gap-1">
                        <Check className="h-3 w-3" /> Available
                      </span>
                      {domain.price && (
                        <span className="text-xs bg-orange-500/30 text-orange-400 px-2 py-0.5 rounded-sm font-medium">
                          {domain.price}
                        </span>
                      )}
                    </div>
                  )}
                  {domain.checked && domain.available === false && (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-sm">
                      Taken
                    </span>
                  )}
                  {domain.checked && domain.error && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-sm">
                      {domain.error}
                    </span>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-3 border-gray-800 bg-transparent hover:bg-gray-800 text-xs"
                  onClick={() => checkDomainAvailability(domain.name, i)}
                  disabled={domain.isChecking}
                >
                  {domain.isChecking ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Checking...
                    </>
                  ) : domain.checked ? (
                    'Recheck'
                  ) : (
                    'Check'
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        <h4 className="text-xs text-gray-400 mb-2">Suggested Social Media Handles</h4>
        <div className="space-y-2">
          {socialHandles.map((social, index) => {
            const style = getPlatformStyle(social.platform);
            return (
              <div key={index} className="flex items-center justify-between bg-black/30 border border-gray-800 rounded p-2">
                <div className="flex items-center gap-2">
                  <div className={`${style.bgClass} p-1.5 rounded-full`}>
                    {style.icon}
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">{style.label}</div>
                    <div className="text-sm">{social.handle}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label={`Copy ${social.platform} handle`}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
