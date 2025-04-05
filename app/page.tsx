import { BackgroundNoiseBlock } from "@/components/BackgroundNoise";
import { VerifyBlock } from "@/components/Verify";
import { PayBlock } from "@/components/Pay";
import dynamic from "next/dynamic";

// Dynamically import the Map component with no SSR
const MapView = dynamic(() => import("@/components/Map").then((mod) => mod.MapView), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[85vh] flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
        <p className="text-lg font-medium">Loading Map...</p>
        <p className="text-sm text-gray-500">Please allow location access for the best experience</p>
      </div>
    </div>
  )
});

export default function Home() {
  return (
    <main className="flex flex-col items-center px-4 py-2 md:px-6 min-h-screen">
      <div className="w-full max-w-5xl mb-8">
        {/* <h1 className="text-2xl md:text-3xl font-bold mb-2">MapMint Noise Mapping</h1>
        <p className="text-gray-600 mb-6">
          Help collect noise data in your city. Find pins on the map that need noise measurements.
        </p> */}
        
        {/* Map View */}
        <MapView />
      </div>

      {/* Hidden for now, will be navigated to from the map */}
      <div className="hidden">
        <div className="grid grid-cols-1 gap-6 mb-6">
          <VerifyBlock />
        </div>
        <div className="grid grid-cols-1 gap-6">
          <BackgroundNoiseBlock />
        </div>
        <div className="grid grid-cols-1 gap-6 mt-6">
          <PayBlock />
        </div>
      </div>
    </main>
  );
}
