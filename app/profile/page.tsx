import dynamic from "next/dynamic";

// Dynamically import the Profile component with no SSR
const ProfileView = dynamic(() => import("@/components/Profile").then((mod) => mod.ProfileView), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[85vh] flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
        <p className="text-lg font-medium">Loading Profile...</p>
      </div>
    </div>
  )
});

export default function ProfilePage() {
  return (
    <main className="flex flex-col items-center px-0 py-0 min-h-screen">
      <ProfileView />
    </main>
  );
} 