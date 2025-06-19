/**
 * API route to serve terms.md content
 */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Get the absolute path to the terms.md file
    const filePath = path.join(process.cwd(), 'lib', 'terms.md');
    
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Return the content as plain text
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error reading terms.md:', error);
    return new NextResponse('Failed to load terms content', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
