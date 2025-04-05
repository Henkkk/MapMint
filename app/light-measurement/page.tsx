"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LightMeasurementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectCID = searchParams.get('project');
  
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState<any>(null);
  
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

  // Fetch project data if ID is provided
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectCID) {
        setLoading(false);
        return;
      }

      try {
        // Try to get from localStorage first (demo purposes)
        const localData = localStorage.getItem(`project-${projectCID}`);
        if (localData) {
          const parsedData = JSON.parse(localData);
          setProjectData(parsedData);
          
          // Redirect if light measurement is not enabled for this project
          if (!parsedData.dataToCollect?.lightIntensity) {
            alert("Light intensity measurement is not enabled for this project.");
            router.back();
          }
        } else {
          // Would fetch from IPFS in real implementation
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching project data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectCID, router]);
  
  const goBack = () => {
    router.push(`/contribute?project=${projectCID}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Light Intensity Measurement</h1>
        
        {isVerified ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="mb-4">
              Welcome to the light intensity measurement page. This feature allows you to contribute
              ambient light level data from your current location.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h2 className="font-bold text-lg mb-2">How it works:</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Grant light sensor permission when prompted</li>
                <li>Press "Start Measuring" to begin light measurement</li>
                <li>Keep your device stable for accurate reading</li>
                <li>Review and submit your data to earn rewards</li>
              </ol>
            </div>
            
            <button 
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition"
              onClick={() => alert("Light measurement functionality will be implemented here.")}
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
          Back
        </button>
      </div>
    </div>
  );
} 