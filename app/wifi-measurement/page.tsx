"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCollectedData } from '../../contexts/CollectedDataContext';
import { getDistanceFromLatLonInKm } from '../../lib/map-pins';

export default function WiFiMeasurementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectCID = searchParams.get('project');
  const { addData, hasDataOfType } = useCollectedData();
  
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    download: number;
    upload: number;
    ping: number;
  } | null>(null);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testSaved, setTestSaved] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isInRange, setIsInRange] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
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

  // Get user's current location and check if it's in range of the project location
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userPos = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            
            setUserLocation(userPos);
            
            // Check if project data is loaded and has position
            if (projectData && projectData.location) {
              const projectLat = projectData.location.lat;
              const projectLng = projectData.location.lng;
              
              // Calculate distance between user and project
              const distance = getDistanceFromLatLonInKm(
                userPos.latitude, 
                userPos.longitude, 
                projectLat, 
                projectLng
              );
              
              // Check if user is within project range
              const inRange = distance <= (projectData.range || 1); // Default to 1km if range not specified
              setIsInRange(inRange);
              
              if (!inRange) {
                setLocationError(`You are not in range of this data collection point. You need to be within ${projectData.range || 1}km of the project location to contribute data.`);
              }
            }
          },
          (error) => {
            console.error("Error getting location:", error);
            setLocationError("Unable to get your current location. Please enable location services and try again.");
          }
        );
      } else {
        setLocationError("Geolocation is not supported by your browser. Unable to verify your position.");
      }
    };
    
    if (projectData) {
      getUserLocation();
    }
  }, [projectData]);

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
          
          // Redirect if WiFi measurement is not enabled for this project
          if (!parsedData.dataToCollect?.wifiSpeed) {
            alert("WiFi speed measurement is not enabled for this project.");
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
    
    // Check if we already have WiFi data
    if (hasDataOfType('wifi')) {
      setTestSaved(true);
    }
  }, [projectCID, router, hasDataOfType]);
  
  const goBack = () => {
    router.push(`/contribute?project=${projectCID}`);
  };
  
  const startTest = () => {
    // Check if user is in range before starting measurement
    if (!isInRange) {
      alert(locationError || "You must be near the project location to collect data.");
      return;
    }
    
    setTesting(true);
    
    // Simulate WiFi speed test for demo purposes
    setTimeout(() => {
      // Generate random values for demo
      const download = Math.floor(Math.random() * 80) + 20; // 20-100 Mbps
      const upload = Math.floor(Math.random() * 50) + 10; // 10-60 Mbps
      const ping = Math.floor(Math.random() * 50) + 10; // 10-60 ms
      
      setTestResult({
        download,
        upload,
        ping
      });
      
      setTesting(false);
      setTestCompleted(true);
    }, 3000);
  };
  
  const saveWifiData = () => {
    if (!testResult || !userLocation) return;
    
    // Add to collected data context
    addData({
      type: 'wifi',
      timestamp: new Date().toISOString(),
      data: {
        download: testResult.download,
        upload: testResult.upload,
        ping: testResult.ping,
        isp: 'Demo ISP',
        location: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          accuracy: 10
        }
      }
    });
    
    setTestSaved(true);
    
    // Notify user
    alert("WiFi speed data saved! You can now submit all collected data from the contribute page.");
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
        <h1 className="text-2xl font-bold mb-6">WiFi Speed Measurement</h1>
        
        {isVerified ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            {locationError && !isInRange && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-red-700">{locationError}</p>
                </div>
              </div>
            )}
            
            {!testCompleted ? (
              <>
                <p className="mb-4">
                  Welcome to the WiFi speed measurement page. This feature allows you to contribute
                  WiFi speed data from your current location.
                </p>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h2 className="font-bold text-lg mb-2">How it works:</h2>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Press "Start Test" to begin WiFi speed measurement</li>
                    <li>The test will check your download and upload speeds</li>
                    <li>Results will be displayed once the test completes</li>
                    <li>Review and submit your data to earn rewards</li>
                  </ol>
                </div>
                
                <button 
                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition flex items-center justify-center"
                  onClick={startTest}
                  disabled={testing}
                >
                  {testing ? (
                    <>
                      <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-l-2 border-white rounded-full"></div>
                      Testing Speed...
                    </>
                  ) : (
                    "Start Test"
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
                  <h2 className="text-lg font-bold mt-4 mb-1">Test Complete</h2>
                  <p className="text-gray-500">Your WiFi speed has been tested successfully.</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-medium mb-3">Results:</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded shadow text-center">
                      <div className="text-xs text-gray-500 mb-1">DOWNLOAD</div>
                      <div className="text-xl font-bold">{testResult?.download} Mbps</div>
                    </div>
                    <div className="bg-white p-3 rounded shadow text-center">
                      <div className="text-xs text-gray-500 mb-1">UPLOAD</div>
                      <div className="text-xl font-bold">{testResult?.upload} Mbps</div>
                    </div>
                    <div className="bg-white p-3 rounded shadow text-center">
                      <div className="text-xs text-gray-500 mb-1">PING</div>
                      <div className="text-xl font-bold">{testResult?.ping} ms</div>
                    </div>
                  </div>
                </div>
                
                {!testSaved ? (
                  <button
                    onClick={saveWifiData}
                    className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition"
                  >
                    Save Test Results
                  </button>
                ) : (
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-green-700 mb-2">Test results saved successfully!</p>
                    <p className="text-sm text-green-600">You can now return to the contribute page to submit all collected data.</p>
                  </div>
                )}
                
                {!testSaved && (
                  <button
                    onClick={startTest}
                    className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                  >
                    Test Again
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