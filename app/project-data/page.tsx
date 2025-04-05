"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getProjectFromIPFS } from '../../lib/ipfs-service';

interface Submission {
  projectCID: string;
  timestamp: string;
  userAddress?: string;
  data: Array<{
    type: 'noise' | 'wifi' | 'light';
    timestamp: string;
    data: any;
  }>;
}

export default function ProjectDataPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectCID = searchParams.get('project');
  
  const [isVerified, setIsVerified] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [distributions, setDistributions] = useState<Array<{address: string, amount: number}>>([]);
  
  // Check if user is verified and project owner
  useEffect(() => {
    const checkVerification = async () => {
      try {
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
          return;
        }
        
        // Check if user owns the project
        if (!projectCID) {
          setError("No project selected");
          setLoading(false);
          return;
        }
        
        // Get project data
        const projectDataStr = localStorage.getItem(`project-${projectCID}`);
        if (!projectDataStr) {
          setError("Project not found");
          setLoading(false);
          return;
        }
        
        const projectData = JSON.parse(projectDataStr);
        setProjectData(projectData);
        
        // Get user address
        const addressCookie = cookies.find(cookie => cookie.trim().startsWith('world-id-address='));
        const userAddress = addressCookie ? decodeURIComponent(addressCookie.split('=')[1]) : '';
        
        // Check if user is the owner
        const isOwner = projectData.createdBy === userAddress;
        setIsOwner(isOwner);
        
        if (!isOwner) {
          setError("You don't have permission to view this project's data");
          setLoading(false);
          return;
        }
        
        // Load submissions
        const allSubmissions = JSON.parse(localStorage.getItem('submissions') || '[]');
        const projectSubmissions = allSubmissions.filter((s: Submission) => s.projectCID === projectCID);
        setSubmissions(projectSubmissions);
        
        // Load distributions if project is completed
        if (projectData.status === 'completed') {
          const distributionsData = localStorage.getItem(`project-${projectCID}-distributions`);
          if (distributionsData) {
            setDistributions(JSON.parse(distributionsData));
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error checking project ownership:", error);
        setError("Failed to load project data");
        setLoading(false);
      }
    };
    
    checkVerification();
  }, [projectCID, router]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const getDataTypeLabel = (type: string) => {
    switch (type) {
      case 'noise': return 'Background Noise';
      case 'wifi': return 'WiFi Speed';
      case 'light': return 'Light Intensity';
      default: return type;
    }
  };
  
  const formatDataSummary = (item: any) => {
    if (item.type === 'noise') {
      return `${item.data.average}dB (Min: ${item.data.min}dB, Max: ${item.data.max}dB)`;
    } else if (item.type === 'wifi') {
      return `Download: ${item.data.download}Mbps, Upload: ${item.data.upload}Mbps`;
    } else if (item.type === 'light') {
      return `Level: ${item.data.level} lux`;
    }
    return 'Data collected';
  };
  
  const handleEndProject = () => {
    try {
      if (confirm("Are you sure you want to end this project? This action cannot be undone.")) {
        if (projectData && projectCID) {
          projectData.status = 'completed';
          localStorage.setItem(`project-${projectCID}`, JSON.stringify(projectData));
          
          // Calculate and distribute rewards if there are submissions
          if (submissions && submissions.length > 0) {
            console.log("Found", submissions.length, "submissions for project");
            // Calculate reward per user based on their contribution
            const totalReward = projectData.rewards.worldcoin;
            const contributionCounts: {[address: string]: number} = {};
            const contributorAddresses: string[] = [];
            
            // Count contributions by each user
            submissions.forEach((submission: Submission) => {
              const userAddress = submission.userAddress || getCookieValue('world-id-address');
              if (userAddress) {
                if (!contributionCounts[userAddress]) {
                  contributionCounts[userAddress] = 0;
                  contributorAddresses.push(userAddress);
                }
                contributionCounts[userAddress] += submission.data.length; // Count each data item as a contribution
              }
            });
            
            // Calculate total contribution points
            const totalContributions = Object.values(contributionCounts).reduce((sum, count) => sum + count, 0);
            
            if (totalContributions > 0 && contributorAddresses.length > 0) {
              // Calculate and distribute rewards
              const newDistributions: {address: string, amount: number}[] = [];
              contributorAddresses.forEach(address => {
                const userContributionRatio = contributionCounts[address] / totalContributions;
                const rewardAmount = parseFloat((totalReward * userContributionRatio).toFixed(6));
                newDistributions.push({
                  address,
                  amount: rewardAmount
                });
              });
              
              // Store distributions in localStorage
              localStorage.setItem(`project-${projectCID}-distributions`, JSON.stringify(newDistributions));
              setDistributions(newDistributions);
              
              // Show distribution details
              const distributionMessage = 'Project completed! Rewards distributed:\n\n' + 
                newDistributions.map(d => `${d.address.substring(0, 8)}...${d.address.substring(d.address.length - 6)}: ${d.amount} WLD`).join('\n');
              
              alert(distributionMessage);
            } else {
              console.log("No valid contributions found");
              alert("Project successfully completed! No valid contributions to reward.");
            }
          } else {
            console.log("No submissions found for project");
            alert("Project successfully completed! No data submissions to reward.");
          }
          
          setProjectData({ ...projectData });
        }
      }
    } catch (error) {
      console.error("Error ending project:", error);
      alert("An error occurred. Please try again.");
    }
  };
  
  // Helper function to get cookie value
  const getCookieValue = (name: string): string => {
    const cookies = document.cookie.split(';');
    const cookie = cookies.find(c => c.trim().startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
  };
  
  const goBack = () => {
    router.push('/');
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

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <button onClick={goBack} className="mr-4 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Project Data</h1>
        </div>
        
        {projectData && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-semibold">{projectData.title}</h2>
              <span className={`px-2 py-1 rounded-full text-xs ${
                projectData.status === 'active' ? 'bg-green-100 text-green-800' :
                projectData.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {projectData.status.charAt(0).toUpperCase() + projectData.status.slice(1)}
              </span>
            </div>
            
            {projectData.imageUrl && projectData.imageUrl !== 'IMAGE_DATA_STORED_ELSEWHERE' && (
              <div className="mb-4 rounded-lg overflow-hidden relative h-48 w-full">
                <Image
                  src={projectData.imageUrl}
                  alt={projectData.title}
                  fill
                  style={{objectFit: 'cover'}}
                  sizes="(max-width: 768px) 100vw, 700px"
                />
              </div>
            )}
            
            <p className="text-gray-700 mb-4">{projectData.description}</p>
            
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <span className="text-gray-500">Location:</span>
                <div>{projectData.address}</div>
              </div>
              <div>
                <span className="text-gray-500">Range:</span>
                <div>{projectData.range} km</div>
              </div>
              <div>
                <span className="text-gray-500">End Date:</span>
                <div>{new Date(projectData.endDate).toLocaleDateString()}</div>
              </div>
              <div>
                <span className="text-gray-500">Reward:</span>
                <div>{projectData.rewards.worldcoin} WLD</div>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4 mt-2">
              <h3 className="font-medium mb-2">Data Collection Types:</h3>
              <div className="flex flex-wrap gap-2">
                {projectData.dataToCollect?.backgroundNoise && (
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Background Noise</span>
                )}
                {projectData.dataToCollect?.wifiSpeed && (
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">WiFi Speed</span>
                )}
                {projectData.dataToCollect?.lightIntensity && (
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Light Intensity</span>
                )}
              </div>
            </div>
            
            {projectData.status === 'active' && (
              <button
                onClick={handleEndProject}
                className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>End Project</span>
              </button>
            )}
          </div>
        )}
        
        {/* Display reward distributions for completed projects */}
        {projectData && projectData.status === 'completed' && distributions.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-3">Reward Distributions</h2>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contributor</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (WLD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {distributions.map((dist, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {dist.address.substring(0, 6)}...{dist.address.substring(dist.address.length - 4)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {dist.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-2 text-sm font-medium">Total</td>
                    <td className="px-4 py-2 text-sm font-medium text-right">
                      {distributions.reduce((sum, d) => sum + d.amount, 0).toFixed(6)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
        
        <h2 className="text-xl font-semibold mb-4">Collected Data</h2>
        
        {submissions.length > 0 ? (
          <div className="space-y-4">
            {submissions.map((submission, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-xs text-gray-500 mb-2">
                  Submitted: {formatDate(submission.timestamp)}
                </div>
                
                <div className="space-y-3">
                  {submission.data.map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-md">
                      <div className="font-medium">{getDataTypeLabel(item.type)}</div>
                      <div className="text-sm">{formatDataSummary(item)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Collected: {formatDate(item.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
            <p className="text-yellow-800">No data has been submitted for this project yet.</p>
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