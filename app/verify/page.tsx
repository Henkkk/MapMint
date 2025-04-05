"use client";

import { VerifyBlock } from '../../components/Verify';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function VerifyPage() {
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Check if already verified and listen for verification event
  useEffect(() => {
    const handleVerified = (event: Event) => {
      setVerified(true);
      // Auto-return after 2 seconds
      setTimeout(() => {
        router.back();
      }, 2000);
    };
    
    // Add event listener for WorldID verification
    window.addEventListener('world-id-verified', handleVerified);
    
    // Check if already verified
    const checkVerification = () => {
      const cookies = document.cookie.split(';');
      const verifiedCookie = cookies.find(cookie => cookie.trim().startsWith('world-id-verified='));
      const isVerified = verifiedCookie?.includes('true') || false;
      
      if (isVerified) {
        console.log("User is already verified with World ID");
        setVerified(true);
      }
      
      setLoading(false);
    };
    
    checkVerification();
    
    return () => {
      window.removeEventListener('world-id-verified', handleVerified);
    };
  }, [router]);
  
  // Manual verification testing function (for development only)
  const manuallySetVerified = () => {
    if (process.env.NODE_ENV === 'development') {
      document.cookie = "world-id-verified=true; path=/; max-age=3600";
      window.dispatchEvent(new CustomEvent('world-id-verified', { detail: true }));
      localStorage.setItem('world-id-verified', 'true');
      setVerified(true);
      setTimeout(() => router.back(), 1000);
    }
  };
  
  const goBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-16 px-4">
      <h1 className="text-2xl font-bold mb-8">World ID Verification</h1>
      
      <div className="w-full max-w-md">
        <VerifyBlock />
      </div>
      
      {verified && (
        <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg">
          ✅ Successfully verified! Returning to map...
        </div>
      )}
      
      {!verified && (
        <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 rounded-lg">
          You must complete World ID verification to contribute data.
        </div>
      )}
      
      {process.env.NODE_ENV === 'development' && !verified && (
        <button
          onClick={manuallySetVerified}
          className="mt-4 px-4 py-2 bg-purple-500 text-white rounded"
        >
          Dev Mode: Force Verification
        </button>
      )}
      
      <button
        onClick={goBack}
        className="mt-8 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
      >
        Return to Map
      </button>
    </div>
  );
} 