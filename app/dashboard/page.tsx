/**
 * Dashboard page for authenticated users
 */
'use client';

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { isLoaded, userId, sessionId } = useAuth();
  const router = useRouter();
  
  // Redirect to home if not authenticated
  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/');
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded || !userId) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back!</CardTitle>
            <CardDescription>Your Name Check AI dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300 mb-4">
              You're now logged in with Clerk authentication. This is your personal dashboard where you can manage your account and access premium features.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
              Back to Home
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Account</CardTitle>
            <CardDescription>Manage your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300 mb-4">
              User ID: {userId}
            </p>
            <p className="text-sm text-gray-300 mb-4">
              Session ID: {sessionId}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => {
              // Use type assertion for Clerk global
              const clerkWindow = window as any;
              clerkWindow.Clerk?.openUserProfile();
            }}>
              Edit Profile
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Premium Features</CardTitle>
            <CardDescription>Access exclusive tools</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300 mb-4">
              As a registered user, you have access to premium name checking features and advanced analytics.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="accent" className="w-full">
              Explore Features
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
