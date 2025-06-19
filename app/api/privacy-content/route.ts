/**
 * API route to serve privacy.md content
 */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Get the absolute path to the privacy.md file
    const filePath = path.join(process.cwd(), 'lib', 'privacy.md');
    
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Return the content as plain text
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error reading privacy.md:', error);
    return new NextResponse('Failed to load privacy content', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
