"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NoiseMeasurementPage() {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  
  // Check if user is verified on load
  useEffect(() => {
    const checkVerification = () => {
      const cookies = document.cookie.split(';');
      const verifiedCookie = cookies.find(cookie => cookie.trim().startsWith('world-id-verified='));
      const verified = verifiedCookie?.includes('true') || false;
      setIsVerified(verified);
      
      // Redirect to verification page if not verified
      if (!verified) {
        if (confirm("You need to verify with World ID first. Go to verification page?")) {
          router.push('/verify');
        } else {
          router.back();
        }
      }
    };
    
    checkVerification();
  }, [router]);
  
  const goBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Noise Measurement</h1>
        
        {isVerified ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="mb-4">
              Welcome to the noise measurement page. This feature allows you to contribute
              noise level data from your current location.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h2 className="font-bold text-lg mb-2">How it works:</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Grant microphone permissions when prompted</li>
                <li>Hold your device naturally for 30 seconds</li>
                <li>The app will measure ambient noise levels</li>
                <li>Review and submit your data to earn rewards</li>
              </ol>
            </div>
            
            <button 
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition"
              onClick={() => alert("Noise measurement functionality will be implemented here.")}
            >
              Start Measuring
            </button>
          </div>
        ) : (
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <p className="text-yellow-800">Verification required to access this feature.</p>
          </div>
        )}
        
        <button
          onClick={goBack}
          className="mt-6 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
        >
          Back to Map
        </button>
      </div>
    </div>
  );
} 