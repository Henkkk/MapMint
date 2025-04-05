"use client";

import { BackgroundNoiseBlock } from "@/components/BackgroundNoise";
import { VerifyBlock } from "@/components/Verify";
import { useRouter } from "next/navigation";

export default function NoiseMeasurementPage() {
  const router = useRouter();
  
  return (
    <main className="flex flex-col items-center px-4 py-4 min-h-screen">
      <div className="w-full max-w-md mb-6">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center text-blue-500 hover:text-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Map
          </button>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Noise Measurement</h1>
        <p className="text-gray-600 mb-6">
          Measure noise levels at this location. Your data will help create a noise map of the city.
        </p>
      </div>
      
      <div className="w-full max-w-md mb-6">
        <VerifyBlock />
      </div>
      
      <div className="w-full max-w-md">
        <BackgroundNoiseBlock />
      </div>
    </main>
  );
} 