"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export const ProfileView = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [totalPoints, setTotalPoints] = useState(0);
  const [measurements, setMeasurements] = useState(0);

  // Simulate fetching profile data
  useEffect(() => {
    // In a real app, you would fetch this data from your API
    setTotalPoints(235);
    setMeasurements(12);
  }, []);

  // Handle navigation back to map
  const navigateToMap = () => {
    router.push('/');
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full relative overflow-auto bg-gray-50">
      {/* Profile header */}
      <div className="bg-white px-4 py-6 shadow">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {session?.user?.name ? session.user.name.substring(0, 1).toUpperCase() : 'U'}
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold">
              {session?.user?.name || 'Anonymous User'}
            </h2>
            <p className="text-gray-600">Data Collector</p>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="px-4 py-6">
        <h3 className="text-lg font-semibold mb-4">Your Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-blue-500">{totalPoints}</div>
            <div className="text-gray-600 text-sm">Total Points</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-green-500">{measurements}</div>
            <div className="text-gray-600 text-sm">Measurements</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 py-4">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="bg-white rounded-lg shadow divide-y">
          <div className="p-4">
            <div className="flex justify-between">
              <div>
                <h4 className="font-medium">Taipei Main Station</h4>
                <p className="text-sm text-gray-600">Noise measurement</p>
              </div>
              <div className="text-green-500 font-medium">+25 pts</div>
            </div>
          </div>
          <div className="p-4">
            <div className="flex justify-between">
              <div>
                <h4 className="font-medium">Da'an Forest Park</h4>
                <p className="text-sm text-gray-600">Noise measurement</p>
              </div>
              <div className="text-green-500 font-medium">+15 pts</div>
            </div>
          </div>
          <div className="p-4">
            <div className="flex justify-between">
              <div>
                <h4 className="font-medium">Shilin Night Market</h4>
                <p className="text-sm text-gray-600">Noise measurement</p>
              </div>
              <div className="text-green-500 font-medium">+30 pts</div>
            </div>
          </div>
        </div>
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