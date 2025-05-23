// Map pin data representing areas that need noise data collection
export interface MapPin {
  id: string;
  position: [number, number]; // [latitude, longitude]
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  rewards?: {
    points: number;
    worldcoin?: number;
  };
  requirements?: {
    minMeasurements: number;
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
  };
}

// Project pin interface for showing user projects on the map
export interface ProjectPin {
  id: string;
  position: [number, number]; // [latitude, longitude]
  title: string;
  description: string;
  cid: string; // IPFS content ID
  imageUrl?: string; // Project image URL
  range: number; // collection range in km
  rewards?: {
    worldcoin: number;
  };
  dataToCollect?: {
    backgroundNoise: boolean;
    wifiSpeed: boolean;
    lightIntensity: boolean;
  };
  endDate: string;
  status: 'active' | 'completed' | 'expired';
}

// Sample pins for various areas that need noise data collection
export const mapPins: MapPin[] = [];

// Projects created by users
export let projectPins: ProjectPin[] = [];

// Load project pins from localStorage
export const loadProjectPins = async () => {
  try {
    if (typeof window === 'undefined') return; // Skip on server-side
    
    const projectCIDsStr = localStorage.getItem('projectCIDs');
    if (!projectCIDsStr) return;
    
    const projectCIDs = JSON.parse(projectCIDsStr);
    if (!Array.isArray(projectCIDs) || projectCIDs.length === 0) return;
    
    // Only load projects that actually exist in localStorage
    projectPins = projectCIDs
      .map((cid, index) => {
        // Try to get cached project data
        const cachedDataStr = localStorage.getItem(`project-${cid}`);
        if (cachedDataStr) {
          try {
            const cachedData = JSON.parse(cachedDataStr);
            return {
              id: cachedData.id || `project-${index}`,
              position: [cachedData.location.lat, cachedData.location.lng],
              title: cachedData.title || 'Project',
              description: cachedData.description || 'User created project',
              cid,
              imageUrl: cachedData.imageUrl,
              range: typeof cachedData.range === 'number' ? cachedData.range : 1,
              rewards: cachedData.rewards,
              dataToCollect: cachedData.dataToCollect || {
                backgroundNoise: true,
                wifiSpeed: false,
                lightIntensity: false
              },
              endDate: cachedData.endDate,
              status: cachedData.status || 'active'
            };
          } catch (e) {
            console.error('Error parsing cached project data:', e);
            return null;
          }
        }
        return null;
      })
      .filter(Boolean) as ProjectPin[]; // Filter out nulls
    
    console.log(`Loaded ${projectPins.length} project pins`);
  } catch (error) {
    console.error('Error loading project pins:', error);
    projectPins = [];
  }
};

// Get all pins including projects
export const getAllPins = (): (MapPin | ProjectPin)[] => {
  return [...mapPins, ...projectPins];
};

// Get pins by status
export const getPendingPins = () => mapPins.filter(pin => pin.status === 'pending');
export const getInProgressPins = () => mapPins.filter(pin => pin.status === 'in-progress');
export const getCompletedPins = () => mapPins.filter(pin => pin.status === 'completed');

// Get pins by priority
export const getHighPriorityPins = () => mapPins.filter(pin => pin.priority === 'high');
export const getMediumPriorityPins = () => mapPins.filter(pin => pin.priority === 'medium');
export const getLowPriorityPins = () => mapPins.filter(pin => pin.priority === 'low');

// Get pins by distance from current location
export const getPinsByDistance = (lat: number, lng: number, maxDistanceKm: number = 5) => {
  const pins = getAllPins().filter(pin => {
    const distance = getDistanceFromLatLonInKm(lat, lng, pin.position[0], pin.position[1]);
    return distance <= maxDistanceKm;
  });
  return pins;
};

// Calculate distance between two coordinates in kilometers using the Haversine formula
export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
} 