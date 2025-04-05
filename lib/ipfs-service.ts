/**
 * IPFS Service for storing noise measurement data
 * Uses HTTP API to interact with IPFS network
 */

const INFURA_IPFS_API = "https://ipfs.infura.io:5001/api/v0";
const INFURA_IPFS_GATEWAY = "https://ipfs.infura.io/ipfs";

/**
 * Interface for measurement data to be stored on IPFS
 */
export interface IPFSMeasurementData {
  timestamp: string;
  average: number;
  max: number;
  min: number;
  duration: string;
  level: 'quiet' | 'moderate' | 'noisy' | 'loud';
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  userAddress?: string; // World ID verified address
  metadata?: {
    appVersion: string;
    deviceInfo?: string;
    tags?: string[];
  };
}

/**
 * Interface for project data to be stored on IPFS
 */
export interface IPFSProjectData {
  id?: string;
  title: string;
  description: string;
  imageUrl?: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  range: number; // in kilometers
  endDate: string;
  rewards: {
    worldcoin: number;
  };
  dataToCollect?: {
    backgroundNoise: boolean;
    wifiSpeed: boolean;
    lightIntensity: boolean;
  };
  createdBy?: string; // World ID verified address
  createdAt: string;
  status: 'active' | 'completed' | 'expired';
}

/**
 * Upload data to IPFS
 * @param data The measurement data to store
 * @returns Promise with CID hash
 */
export async function uploadToIPFS(data: IPFSMeasurementData): Promise<string> {
  try {
    // For demo purposes, we'll use client-side only code through a public IPFS HTTP API
    // In production, you'd want to use a server-side authentication method
    
    // First convert data to JSON
    const jsonData = JSON.stringify(data);
    
    // Create form data with the file
    const formData = new FormData();
    formData.append('file', new Blob([jsonData], { type: 'application/json' }));
    
    // Upload to IPFS via a public gateway (like Infura, Pinata, etc.)
    // For simplicity, we're mocking this with a random CID
    // In production, you would make an actual API call here
    
    /*
    // Example using actual Infura IPFS API (requires API key)
    const response = await fetch(`${INFURA_IPFS_API}/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${process.env.INFURA_IPFS_PROJECT_ID}:${process.env.INFURA_IPFS_API_SECRET}`)}`,
      },
      body: formData
    });
    
    const result = await response.json();
    return result.Hash;
    */
    
    // For this demo, return a simulated CID
    // In production, replace with actual IPFS upload code
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    const mockCID = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    return mockCID;
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw new Error("Failed to upload to IPFS");
  }
}

/**
 * Upload project data to IPFS
 * @param data The project data to store
 * @returns Promise with CID hash
 */
export async function uploadProjectToIPFS(data: IPFSProjectData): Promise<string> {
  try {
    // Set creation timestamp if not provided
    if (!data.createdAt) {
      data.createdAt = new Date().toISOString();
    }
    
    // Generate an ID if not provided
    if (!data.id) {
      data.id = `project-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // First convert data to JSON
    const jsonData = JSON.stringify(data);
    
    // Create form data with the file
    const formData = new FormData();
    formData.append('file', new Blob([jsonData], { type: 'application/json' }));
    
    // For this demo, return a simulated CID
    // In production, replace with actual IPFS upload code
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    const mockCID = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    return mockCID;
  } catch (error) {
    console.error("Error uploading project to IPFS:", error);
    throw new Error("Failed to upload project to IPFS");
  }
}

/**
 * Get data from IPFS by CID
 * @param cid The IPFS content ID
 * @returns Promise with the measurement data
 */
export async function getFromIPFS(cid: string): Promise<IPFSMeasurementData> {
  try {
    // In production, replace with actual fetch from IPFS gateway
    const response = await fetch(`${INFURA_IPFS_GATEWAY}/${cid}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching from IPFS:", error);
    throw new Error("Failed to fetch from IPFS");
  }
}

/**
 * Get project data from IPFS by CID
 * @param cid The IPFS content ID
 * @returns Promise with the project data
 */
export async function getProjectFromIPFS(cid: string): Promise<IPFSProjectData> {
  try {
    // In production, replace with actual fetch from IPFS gateway
    const response = await fetch(`${INFURA_IPFS_GATEWAY}/${cid}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch project from IPFS: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching project from IPFS:", error);
    throw new Error("Failed to fetch project from IPFS");
  }
}

/**
 * Get IPFS gateway URL for a CID
 * @param cid The IPFS content ID
 * @returns IPFS gateway URL
 */
export function getIPFSUrl(cid: string): string {
  return `${INFURA_IPFS_GATEWAY}/${cid}`;
} 