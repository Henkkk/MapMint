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

// Sample pins for various areas that need noise data collection
export const mapPins: MapPin[] = [
  {
    id: 'pin-001',
    position: [25.033964, 121.564468], // Taipei 101 area
    title: 'Taipei 101 District',
    description: 'Collect noise data around the busy Taipei 101 commercial district.',
    priority: 'high',
    status: 'pending',
    rewards: {
      points: 100,
      worldcoin: 0.1
    },
    requirements: {
      minMeasurements: 3,
      timeOfDay: 'evening'
    }
  },
  {
    id: 'pin-002',
    position: [25.046661, 121.517606], // Taipei Main Station
    title: 'Taipei Main Station',
    description: 'Measure noise levels around the transportation hub at different times.',
    priority: 'high',
    status: 'pending',
    rewards: {
      points: 120,
      worldcoin: 0.15
    },
    requirements: {
      minMeasurements: 5,
      timeOfDay: 'any'
    }
  },
  {
    id: 'pin-003',
    position: [25.027154, 121.543846], // Da'an Forest Park
    title: 'Da\'an Forest Park',
    description: 'Collect quiet area baseline measurements in the park.',
    priority: 'medium',
    status: 'pending',
    rewards: {
      points: 80
    },
    requirements: {
      minMeasurements: 2,
      timeOfDay: 'morning'
    }
  },
  {
    id: 'pin-004',
    position: [25.058582, 121.535226], // Shilin Night Market
    title: 'Shilin Night Market',
    description: 'Measure noise pollution in the busy night market area.',
    priority: 'high',
    status: 'pending',
    rewards: {
      points: 150,
      worldcoin: 0.2
    },
    requirements: {
      minMeasurements: 4,
      timeOfDay: 'night'
    }
  },
  {
    id: 'pin-005',
    position: [25.014661, 121.533418], // Gongguan area
    title: 'Gongguan District',
    description: 'Collect noise data near the university and shopping area.',
    priority: 'medium',
    status: 'pending',
    rewards: {
      points: 90,
      worldcoin: 0.05
    },
    requirements: {
      minMeasurements: 3,
      timeOfDay: 'afternoon'
    }
  },
  {
    id: 'pin-006',
    position: [25.040455, 121.558456], // Songshan MRT
    title: 'Songshan Station Area',
    description: 'Measure transit noise levels around the MRT station.',
    priority: 'low',
    status: 'pending',
    rewards: {
      points: 70
    },
    requirements: {
      minMeasurements: 2
    }
  },
  {
    id: 'pin-007',
    position: [25.079477, 121.578559], // Neihu Technology Park
    title: 'Neihu Tech Park',
    description: 'Collect data on urban technology district sound levels.',
    priority: 'medium',
    status: 'pending',
    rewards: {
      points: 85
    },
    requirements: {
      minMeasurements: 3,
      timeOfDay: 'afternoon'
    }
  }
];

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
  return mapPins.filter(pin => {
    const distance = getDistanceFromLatLonInKm(lat, lng, pin.position[0], pin.position[1]);
    return distance <= maxDistanceKm;
  });
};

// Calculate distance between two coordinates in kilometers using the Haversine formula
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
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