'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TermsPage() {
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    // Fetch the terms content
    fetch('/api/terms-content')
      .then(response => response.text())
      .then(content => {
        // Convert markdown content to HTML
        const processedContent = content
          .replace(/^⸻$/gm, '<hr class="my-8 border-gray-800" />') // Replace dividers
          .replace(/^#+\s+(.+)$/gm, (_: string, heading: string) => 
            `<h2 class="text-2xl font-medium mb-4">${heading}</h2>`) // Replace headings
          .replace(/^([0-9]+)\.\s+(.+)$/gm, (_: string, num: string, heading: string) => 
            `<h3 class="text-xl font-medium mt-8 mb-4">${num}. ${heading}</h3>`) // Replace numbered headings
          .replace(/•\s+(.+)$/gm, (_: string, item: string) => 
            `<li class="ml-6 mb-2">• ${item}</li>`) // Replace bullet points
          .replace(/\[(.+?)\]/g, '<span class="text-orange-500">$1</span>') // Highlight placeholders
          .replace(/📧|🏠|📜/g, (emoji: string) => 
            `<span class="mr-2">${emoji}</span>`); // Add spacing after emojis
            
        setHtmlContent(processedContent);
      })
      .catch(error => {
        console.error('Failed to load terms content:', error);
        setHtmlContent('<p>Failed to load terms content. Please try again later.</p>');
      });
  }, []); // Add spacing after emojis

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header with breadcrumb */}
      <header className="border-b border-gray-800 py-4">
        <div className="container mx-auto px-4">
          <nav className="flex items-center" aria-label="Breadcrumb">
            <Link 
              href="/" 
              className="flex items-center text-gray-400 hover:text-white transition-colors"
              aria-label="Back to homepage"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span>Home</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Terms content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
          
          <div 
            className="prose prose-invert prose-orange max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
          
          <div className="mt-12 mb-8">
            <Link 
              href="/" 
              className="inline-flex items-center text-orange-500 hover:text-orange-400 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span>Back to homepage</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
