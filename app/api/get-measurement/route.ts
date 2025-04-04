import { NextRequest, NextResponse } from "next/server";
import { getFromIPFS } from "../../../lib/ipfs-service";

/**
 * API Route to retrieve noise measurement data from IPFS
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get CID from query parameters
    const url = new URL(req.url);
    const cid = url.searchParams.get('cid');
    
    if (!cid) {
      return NextResponse.json(
        { success: false, error: "No CID provided" },
        { status: 400 }
      );
    }

    // Fetch measurement data from IPFS
    const measurementData = await getFromIPFS(cid);
    
    // Return measurement data
    return NextResponse.json({
      success: true,
      data: measurementData
    });
    
  } catch (error) {
    console.error("Error fetching from IPFS:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error fetching measurement" 
      },
      { status: 500 }
    );
  }
} 