"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DataItem {
  type: 'noise' | 'wifi' | 'light';
  timestamp: string;
  data: any;
}

interface DataSubmissionProps {
  projectCID: string;
  projectTitle: string;
  collectedData: DataItem[];
  onClose: () => void;
}

export default function DataSubmission({ 
  projectCID, 
  projectTitle, 
  collectedData, 
  onClose 
}: DataSubmissionProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (collectedData.length === 0) {
      setError("No data to submit. Please collect data first.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // For demo purposes, simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real implementation, this would call an API to submit data to IPFS or blockchain
      console.log("Submitting data to project:", projectCID);
      console.log("Data:", collectedData);

      // Get the user's World ID verified address from cookie
      const cookies = document.cookie.split(';');
      const addressCookie = cookies.find(cookie => cookie.trim().startsWith('world-id-address='));
      const userAddress = addressCookie ? decodeURIComponent(addressCookie.split('=')[1]) : '';

      // Save submission record in localStorage for demo purposes
      const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
      submissions.push({
        projectCID,
        timestamp: new Date().toISOString(),
        data: collectedData,
        userAddress
      });
      localStorage.setItem('submissions', JSON.stringify(submissions));

      setSuccess(true);
      
      // Reset after success
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      console.error("Error submitting data:", err);
      setError("Failed to submit data. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getDataTypeLabel = (type: string) => {
    switch (type) {
      case 'noise': return 'Background Noise';
      case 'wifi': return 'WiFi Speed';
      case 'light': return 'Light Intensity';
      default: return type;
    }
  };

  const formatDataSummary = (item: DataItem) => {
    if (item.type === 'noise') {
      return `Avg: ${item.data.average}dB, Min: ${item.data.min}dB, Max: ${item.data.max}dB`;
    } else if (item.type === 'wifi') {
      return `Download: ${item.data.download}Mbps, Upload: ${item.data.upload}Mbps`;
    } else if (item.type === 'light') {
      return `Level: ${item.data.level} lux`;
    }
    return 'Data collected';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Submit Data</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Submission Successful!</h3>
              <p className="text-gray-500 mb-4">Your data has been submitted to the project.</p>
              <div className="animate-pulse">Redirecting to map...</div>
            </div>
          ) : (
            <>
              <p className="mb-4">
                You're about to submit your collected data to the project: <span className="font-semibold">{projectTitle}</span>
              </p>

              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium mb-2">Data Summary:</h3>
                {collectedData.length > 0 ? (
                  <ul className="space-y-2">
                    {collectedData.map((item, index) => (
                      <li key={index} className="bg-white p-3 rounded border border-blue-100">
                        <div className="font-medium">{getDataTypeLabel(item.type)}</div>
                        <div className="text-sm text-gray-500">{formatDataSummary(item)}</div>
                        <div className="text-xs text-gray-400 mt-1">Collected: {new Date(item.timestamp).toLocaleString()}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No data has been collected yet.</p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center"
                  disabled={submitting || collectedData.length === 0}
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Data'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 