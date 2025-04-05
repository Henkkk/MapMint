"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCollectedData } from '../../contexts/CollectedDataContext';

export default function NoiseMeasurementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectCID = searchParams.get('project');
  const { addData, hasDataOfType } = useCollectedData();
  
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState<any>(null);
  const [measuring, setMeasuring] = useState(false);
  const [measurementResult, setMeasurementResult] = useState<{
    min: number;
    max: number;
    average: number;
    level: string;
  } | null>(null);
  const [measurementCompleted, setMeasurementCompleted] = useState(false);
  const [measurementSaved, setMeasurementSaved] = useState(false);
  
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
          
          // Redirect if noise measurement is not enabled for this project
          if (!parsedData.dataToCollect?.backgroundNoise) {
            alert("Noise measurement is not enabled for this project.");
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
    
    // Check if we already have noise data
    if (hasDataOfType('noise')) {
      setMeasurementSaved(true);
    }
  }, [projectCID, router, hasDataOfType]);
  
  const goBack = () => {
    if (projectCID) {
      router.push(`/contribute?project=${projectCID}`);
    } else {
      router.back();
    }
  };
  
  const startMeasuring = () => {
    setMeasuring(true);
    
    // Simulate noise measurement for demo
    setTimeout(() => {
      const min = Math.floor(Math.random() * 30) + 20; // 20-50 dB
      const max = min + Math.floor(Math.random() * 40) + 10; // min + 10-50 dB
      const average = Math.floor((min + max) / 2);
      
      let level = 'quiet';
      if (average > 70) level = 'loud';
      else if (average > 50) level = 'noisy';
      else if (average > 30) level = 'moderate';
      
      setMeasurementResult({
        min,
        max,
        average,
        level
      });
      
      setMeasuring(false);
      setMeasurementCompleted(true);
    }, 3000);
  };
  
  const saveNoiseData = () => {
    if (!measurementResult) return;
    
    // Add to collected data context
    addData({
      type: 'noise',
      timestamp: new Date().toISOString(),
      data: {
        min: measurementResult.min,
        max: measurementResult.max,
        average: measurementResult.average,
        level: measurementResult.level,
        location: {
          latitude: 25.033,
          longitude: 121.565,
          accuracy: 10
        }
      }
    });
    
    setMeasurementSaved(true);
    
    // Notify user
    alert("Noise measurement data saved! You can now submit all collected data from the contribute page.");
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
        <h1 className="text-2xl font-bold mb-6">Noise Measurement</h1>
        
        {isVerified ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            {!measurementCompleted ? (
              <>
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
                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition flex items-center justify-center"
                  onClick={startMeasuring}
                  disabled={measuring}
                >
                  {measuring ? (
                    <>
                      <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-l-2 border-white rounded-full"></div>
                      Measuring...
                    </>
                  ) : (
                    "Start Measuring"
                  )}
                </button>
              </>
            ) : (
              <div>
                <div className="text-center mb-6">
                  <div className="inline-block bg-green-100 p-4 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold mt-4 mb-1">Measurement Complete</h2>
                  <p className="text-gray-500">Your noise level has been measured successfully.</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-medium mb-3">Results:</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded shadow text-center">
                      <div className="text-xs text-gray-500 mb-1">MIN</div>
                      <div className="text-xl font-bold">{measurementResult?.min} dB</div>
                    </div>
                    <div className="bg-white p-3 rounded shadow text-center">
                      <div className="text-xs text-gray-500 mb-1">AVG</div>
                      <div className="text-xl font-bold">{measurementResult?.average} dB</div>
                    </div>
                    <div className="bg-white p-3 rounded shadow text-center">
                      <div className="text-xs text-gray-500 mb-1">MAX</div>
                      <div className="text-xl font-bold">{measurementResult?.max} dB</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <div className="inline-block px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      Category: {measurementResult?.level ? measurementResult.level.charAt(0).toUpperCase() + measurementResult.level.slice(1) : 'Unknown'}
                    </div>
                  </div>
                </div>
                
                {!measurementSaved ? (
                  <button
                    onClick={saveNoiseData}
                    className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition"
                  >
                    Save Measurement
                  </button>
                ) : (
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-green-700 mb-2">Measurement saved successfully!</p>
                    <p className="text-sm text-green-600">You can now return to the contribute page to submit all collected data.</p>
                  </div>
                )}
                
                {!measurementSaved && (
                  <button
                    onClick={startMeasuring}
                    className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                  >
                    Measure Again
                  </button>
                )}
              </div>
            )}
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