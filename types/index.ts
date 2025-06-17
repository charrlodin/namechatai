// Shared types for the application

export type SocialHandle = {
  platform: 'twitter' | 'instagram' | 'facebook';
  handle: string;
};

export type BusinessName = {
  name: string;
  pronunciation?: string;
  description: string;
  socialHandles: {
    twitter: string;
    instagram: string;
    facebook: string;
    domains?: string[];
    domain?: string; // For backward compatibility
  };
};
