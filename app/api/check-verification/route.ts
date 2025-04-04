import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  // In a real application, you would check the user's session 
  // to determine if they have been verified
  // For now, we'll use a simple cookie-based approach
  const cookieStore = cookies();
  const verificationCookie = cookieStore.get("world-id-verified");
  
  // Add cache control headers to prevent browsers from caching the response
  return NextResponse.json(
    {
      verified: verificationCookie?.value === "true",
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
} 