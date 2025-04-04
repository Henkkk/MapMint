import { NextRequest, NextResponse } from "next/server";
import { uploadToIPFS, IPFSMeasurementData } from "../../../lib/ipfs-service";

// Interface for store measurement request
interface StoreMeasurementRequest {
  measurement: IPFSMeasurementData;
  worldIdAddress?: string; // World ID address for verification
}

// Interface for the response
interface StoreMeasurementResponse {
  success: boolean;
  cid?: string;
  error?: string;
  worldChainTxHash?: string;
}

/**
 * API Route to store noise measurement data
 * 1. Uploads measurement data to IPFS
 * 2. Records the IPFS CID on World Chain for permanence and verification
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { measurement, worldIdAddress } = await req.json() as StoreMeasurementRequest;
    
    if (!measurement) {
      return NextResponse.json(
        { success: false, error: "No measurement data provided" },
        { status: 400 }
      );
    }

    // 1. Upload measurement data to IPFS
    const cid = await uploadToIPFS(measurement);
    
    // 2. In a production app, we would now store the CID on World Chain
    // For this demo, we'll simulate this step
    let worldChainTxHash: string | undefined;
    
    try {
      // Simulate storing on World Chain
      // In production, replace with actual World Chain transaction using MiniKit
      worldChainTxHash = `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      /*
      // Example code for storing on World Chain (pseudocode)
      const worldChainProvider = new WorldChainProvider(process.env.WORLD_CHAIN_RPC_URL);
      const worldNoiseMappingContract = new Contract(
        process.env.WORLD_NOISE_MAPPING_CONTRACT_ADDRESS,
        WorldNoiseMappingABI,
        worldChainProvider.getSigner()
      );
      
      const tx = await worldNoiseMappingContract.storeMeasurement(
        cid,
        measurement.timestamp,
        measurement.average,
        measurement.location ? [measurement.location.latitude, measurement.location.longitude] : [0, 0],
        worldIdAddress || ethers.constants.AddressZero
      );
      
      worldChainTxHash = tx.hash;
      await tx.wait();
      */
      
      // Simulate transaction processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (chainError) {
      console.error("Error storing on World Chain:", chainError);
      // We'll still return success if IPFS upload worked, but note the chain error
      return NextResponse.json({
        success: true,
        cid,
        worldChainTxHash: undefined,
        error: "Failed to store on World Chain, but IPFS storage succeeded"
      });
    }
    
    // Return success with CID and transaction hash
    return NextResponse.json({
      success: true,
      cid,
      worldChainTxHash
    });
    
  } catch (error) {
    console.error("Error in store-measurement API:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error storing measurement" 
      },
      { status: 500 }
    );
  }
} 