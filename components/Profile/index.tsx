"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Define types for contribution and project data
interface Submission {
  projectCID: string;
  timestamp: string;
  data: any[];
  userAddress?: string;
}

interface Distribution {
  address: string;
  amount: number;
}

interface ProjectData {
  title: string;
  createdBy?: string;
  createdAt: string;
  rewards: {
    worldcoin: number;
  };
  status: 'active' | 'completed' | 'expired';
}

interface ContributionItem {
  id: string;
  name: string;
  date: string;
  amount: string;
  status: string;
}

export const ProfileView = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('history');
  const [totalEarned, setTotalEarned] = useState(0);
  const [balance, setBalance] = useState(0);
  const [contributionHistory, setContributionHistory] = useState<ContributionItem[]>([]);
  const [createdTasks, setCreatedTasks] = useState<ContributionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Get user's World ID address from cookie
        const cookies = document.cookie.split(';');
        const addressCookie = cookies.find(cookie => cookie.trim().startsWith('world-id-address='));
        const userAddress = addressCookie ? decodeURIComponent(addressCookie.split('=')[1]) : '';
        
        if (!userAddress) {
          setLoading(false);
          return;
        }
        
        // Fetch contribution history
        const submissions = JSON.parse(localStorage.getItem('submissions') || '[]') as Submission[];
        const userSubmissions = submissions.filter(s => s.userAddress === userAddress);
        
        // Get project details for each submission
        const contributionProjects: ContributionItem[] = [];
        let totalEarned = 0;
        let currentBalance = 0;
        
        for (const submission of userSubmissions) {
          try {
            // Get project data
            const projectDataStr = localStorage.getItem(`project-${submission.projectCID}`);
            if (projectDataStr) {
              const projectData = JSON.parse(projectDataStr) as ProjectData;
              
              // Check if there are distributions for this project
              const distributionsStr = localStorage.getItem(`project-${submission.projectCID}-distributions`);
              let status = 'Pending';
              let amount = '0 $WORLD';
              
              if (distributionsStr) {
                const distributions = JSON.parse(distributionsStr) as Distribution[];
                const userDistribution = distributions.find(d => d.address === userAddress);
                
                if (userDistribution) {
                  status = 'Paid';
                  amount = `${userDistribution.amount} $WORLD`;
                  totalEarned += userDistribution.amount;
                  currentBalance += userDistribution.amount;
                }
              } else if (projectData.status === 'active') {
                status = 'Pending';
                // Estimate amount based on project rewards and contribution count
                const estimatedAmount = Math.floor(projectData.rewards.worldcoin / 5); // Simple estimate
                amount = `~${estimatedAmount} $WORLD`;
              }
              
              contributionProjects.push({
                id: submission.projectCID,
                name: projectData.title,
                date: new Date(submission.timestamp).toLocaleDateString(),
                amount: amount,
                status: status
              });
            }
          } catch (error) {
            console.error("Error loading project data for submission:", error);
          }
        }
        
        setContributionHistory(contributionProjects);
        setTotalEarned(totalEarned);
        setBalance(currentBalance);
        
        // Fetch created projects
        const allProjectCIDs = JSON.parse(localStorage.getItem('projectCIDs') || '[]') as string[];
        const userProjects: ContributionItem[] = [];
        
        for (const cid of allProjectCIDs) {
          try {
            const projectDataStr = localStorage.getItem(`project-${cid}`);
            if (projectDataStr) {
              const projectData = JSON.parse(projectDataStr) as ProjectData;
              
              // Check if the user is the creator
              if (projectData.createdBy === userAddress) {
                userProjects.push({
                  id: cid,
                  name: projectData.title,
                  date: new Date(projectData.createdAt).toLocaleDateString(),
                  amount: `${projectData.rewards.worldcoin} $WORLD`,
                  status: projectData.status === 'active' ? 'Active' : 
                          projectData.status === 'completed' ? 'Completed' : 'Expired'
                });
              }
            }
          } catch (error) {
            console.error("Error loading project data:", error);
          }
        }
        
        setCreatedTasks(userProjects);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Handle navigation back to map
  const navigateToMap = () => {
    router.push('/');
  };

  // Determine which content to show based on active tab
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      );
    }
    
    if (activeTab === 'history') {
      return (
        <div className="space-y-4">
          {contributionHistory.length > 0 ? (
            contributionHistory.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow p-4 border">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-lg">{project.name}</h4>
                    <p className="text-sm text-gray-600">{project.date}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-green-500 font-medium">{project.amount}</div>
                    <div className={`text-sm ${project.status === 'Pending' ? 'text-yellow-500' : 'text-gray-500'}`}>
                      {project.status}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              No contribution history found. Start contributing to earn rewards!
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          {createdTasks.length > 0 ? (
            createdTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow p-4 border">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-lg">{task.name}</h4>
                    <p className="text-sm text-gray-600">{task.date}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-green-500 font-medium">{task.amount}</div>
                    <div className={`text-sm ${
                      task.status === 'Active' ? 'text-blue-500' : 
                      task.status === 'Completed' ? 'text-green-500' : 'text-gray-500'
                    }`}>
                      {task.status}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              No projects created yet. Create your first data collection project!
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="h-full w-full relative overflow-auto bg-white">
      {/* Profile header */}
      <div className="p-6 pb-2">
        <h1 className="text-3xl font-bold">Profile</h1>
      </div>

      {/* Stats section */}
      <div className="px-4 py-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border">
            <div className="text-5xl font-bold text-green-500">{totalEarned}</div>
            <div className="text-gray-500 text-sm">$WORLD</div>
            <div className="text-gray-600">Total Earned</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border">
            <div className="text-5xl font-bold text-green-500">{balance}</div>
            <div className="text-gray-500 text-sm">$WORLD</div>
            <div className="text-gray-600">Balance</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-6 rounded-full ${
              activeTab === 'history'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-black'
            }`}
          >
            Contribute History
          </button>
          <button
            onClick={() => setActiveTab('created')}
            className={`py-3 px-6 rounded-full ${
              activeTab === 'created'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-black'
            }`}
          >
            Projects Created
          </button>
        </div>
      </div>

      {/* Projects/Tasks List */}
      <div className="px-4 py-2 pb-32">
        {renderTabContent()}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 z-30">
        <div className="flex justify-around items-center h-24">
          <button 
            onClick={navigateToMap}
            className="flex flex-col items-center justify-center w-full h-full text-gray-500"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
              />
            </svg>
            <span className="text-xs mt-1 font-medium">Map</span>
          </button>
          
          <button 
            className="flex flex-col items-center justify-center w-full h-full text-blue-500"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
            <span className="text-xs mt-1 font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}; 