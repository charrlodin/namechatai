// Shared types for the application

export type DomainInfo = {
  name: string;
  available?: boolean;
  price?: string;
  isChecking?: boolean;
  error?: string;
  checked?: boolean;
};

export type SocialHandle = {
  platform: 'twitter' | 'instagram' | 'facebook';
  handle: string;
};

export type BusinessName = {
  name: string;
  pronunciation?: string;
  description: string;
  available?: boolean; // Whether the business name is available
  domains?: DomainInfo[]; // For domain availability display
  socialHandles: {
    twitter: string;
    instagram: string;
    facebook: string;
    domains?: string[];
    domain?: string; // For backward compatibility
  };
};
