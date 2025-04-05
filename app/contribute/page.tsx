"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getProjectFromIPFS } from '../../lib/ipfs-service';
import { useCollectedData } from '../../contexts/CollectedDataContext';
import DataSubmission from '../../components/DataSubmission';

interface DataType {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: React.ReactNode;
  enabled: boolean;
}

export default function ContributePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectCID = searchParams.get('project');
  const { collectedData, hasDataOfType } = useCollectedData();

  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
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
        setError("No project selected. Please select a project from the map.");
        setLoading(false);
        return;
      }

      try {
        // Try to get from localStorage first (demo purposes)
        const localData = localStorage.getItem(`project-${projectCID}`);
        if (localData) {
          setProjectData(JSON.parse(localData));
        } else {
          // Fetch from IPFS if not in localStorage
          const data = await getProjectFromIPFS(projectCID);
          setProjectData(data);
        }
      } catch (error) {
        console.error("Error fetching project data:", error);
        setError("Failed to load project data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectCID]);

  const getDataTypes = (): DataType[] => {
    if (!projectData || !projectData.dataToCollect) {
      return [];
    }

    return [
      {
        id: 'backgroundNoise',
        name: 'Background Noise',
        description: 'Measure ambient noise levels with your device microphone',
        route: '/noise-measurement',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        ),
        enabled: projectData.dataToCollect.backgroundNoise
      },
      {
        id: 'wifiSpeed',
        name: 'WiFi Speed',
        description: 'Test and report your connection speed in this location',
        route: '/wifi-measurement',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        ),
        enabled: projectData.dataToCollect.wifiSpeed
      },
      {
        id: 'lightIntensity',
        name: 'Light Intensity',
        description: 'Measure ambient light levels with your device sensor',
        route: '/light-measurement',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
        enabled: projectData.dataToCollect.lightIntensity
      }
    ];
  };

  const goBack = () => {
    router.back();
  };

  const handleSelectDataType = (route: string) => {
    router.push(`${route}?project=${projectCID}`);
  };

  const checkCollectedDataStatus = (dataTypes: DataType[]) => {
    const enabledTypes = dataTypes.filter(type => type.enabled);
    
    // Map the context data types to the project data types
    const mappedTypes = {
      backgroundNoise: 'noise',
      wifiSpeed: 'wifi',
      lightIntensity: 'light'
    };

    // Check which enabled data types have been collected
    const collectedTypes = enabledTypes.filter(type => 
      hasDataOfType(mappedTypes[type.id as keyof typeof mappedTypes])
    );

    return {
      total: enabledTypes.length,
      collected: collectedTypes.length,
      isComplete: collectedTypes.length > 0
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 p-6 rounded-lg border border-red-200 mb-6">
            <h2 className="text-lg font-bold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={goBack}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  const dataTypes = getDataTypes();
  const enabledDataTypes = dataTypes.filter(type => type.enabled);
  const dataStatus = checkCollectedDataStatus(dataTypes);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Contribute Data</h1>
        
        {isVerified ? (
          <>
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-lg font-semibold mb-1">{projectData.title}</h2>
              <p className="text-gray-600 mb-4">{projectData.address}</p>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm">{projectData.description}</p>
              </div>
              
              <div className="flex items-center text-sm text-gray-700 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ends: {new Date(projectData.endDate).toLocaleDateString()}
              </div>
              
              <div className="flex items-center text-sm text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Reward: {projectData.rewards.worldcoin} WLD
              </div>
            </div>
            
            {collectedData.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-green-800 mb-1">Data Collection Progress</h3>
                    <p className="text-sm text-green-700">
                      You've collected data for {dataStatus.collected} out of {dataStatus.total} data types
                    </p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Submit Collected Data
                </button>
              </div>
            )}
            
            <h2 className="font-medium text-lg mb-3">Select data type to contribute:</h2>
            
            {enabledDataTypes.length > 0 ? (
              <div className="space-y-3">
                {enabledDataTypes.map((dataType) => {
                  // Map the context data types to the project data types
                  const mappedType = 
                    dataType.id === 'backgroundNoise' ? 'noise' : 
                    dataType.id === 'wifiSpeed' ? 'wifi' : 
                    dataType.id === 'lightIntensity' ? 'light' : '';
                  
                  const isCollected = hasDataOfType(mappedType);
                  
                  return (
                    <button
                      key={dataType.id}
                      onClick={() => handleSelectDataType(dataType.route)}
                      className={`w-full bg-white p-4 rounded-lg border ${isCollected ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:bg-blue-50 hover:border-blue-200'} transition flex items-start text-left`}
                    >
                      <div className={`mr-4 mt-1 ${isCollected ? 'text-green-500' : 'text-blue-500'}`}>
                        {isCollected ? (
                          <div className="relative">
                            {dataType.icon}
                            <div className="absolute -right-1 -bottom-1 bg-green-100 rounded-full p-0.5">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        ) : dataType.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{dataType.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{dataType.description}</p>
                        {isCollected && (
                          <span className="inline-block mt-2 text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                            ✓ Data collected
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-yellow-800">No data types are enabled for this project.</p>
              </div>
            )}
          </>
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

      {/* Data Submission Modal */}
      {showSubmitModal && (
        <DataSubmission
          projectCID={projectCID || ''}
          projectTitle={projectData?.title || 'Project'}
          collectedData={collectedData}
          onClose={() => setShowSubmitModal(false)}
        />
      )}
    </div>
  );
} 