"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapPin, mapPins, getPinsByDistance } from '../../lib/map-pins';
import { useRouter } from 'next/navigation';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

// Map Component using Google Maps
export const MapView = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [nearbyPins, setNearbyPins] = useState<MapPin[]>([]);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const mapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });
  
  // Default center position (Taipei City)
  const defaultCenter = {
    lat: 25.033964,
    lng: 121.564468
  };
  
  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          setUserLocation(newPosition);
          
          // Find pins within 5km of user location
          const nearby = getPinsByDistance(newPosition[0], newPosition[1], 5);
          setNearbyPins(nearby);
          
          setIsLoading(false);
          
          // Get address from coordinates
          if (isLoaded && window.google) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode(
              { 
                location: { lat: newPosition[0], lng: newPosition[1] } 
              },
              (results, status) => {
                if (status === "OK" && results && results[0]) {
                  setLocationAddress(results[0].formatted_address);
                } else {
                  setLocationAddress('Address not found');
                }
              }
            );
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoading(false);
        }
      );
    } else {
      setIsLoading(false);
    }
  }, [isLoaded]);
  
  // Handle pin click
  const handlePinClick = (pin: MapPin) => {
    setSelectedPin(pin);
    setDrawerOpen(true);
  };
  
  // Start measuring at selected pin location
  const startMeasuring = (pin: MapPin) => {
    router.push('/noise-measurement');
  };

  // Map load callback
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  // Map unload callback
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Google Maps styles
  const mapContainerStyle = {
    width: '100%',
    height: '100%',
  };

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
  };

  // Close drawer
  const closeDrawer = () => {
    setDrawerOpen(false);
  };
  
  return (
    <div className="h-[85vh] w-full relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-80">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-2"></div>
            <p>Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Google Map */}
      <div className="w-full h-full relative" ref={mapRef}>
        {!isLoading && isLoaded ? (
          <>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={userLocation ? { lat: userLocation[0], lng: userLocation[1] } : defaultCenter}
              zoom={13}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={mapOptions}
            >
              {/* User location marker */}
              {userLocation && (
                <Marker
                  position={{ lat: userLocation[0], lng: userLocation[1] }}
                  icon={{
                    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                    fillColor: '#2563eb',
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#ffffff',
                    scale: 1.5,
                    anchor: new google.maps.Point(12, 22),
                  }}
                  title="Your location"
                />
              )}
              
              {/* Map pins */}
              {mapPins.map((pin) => {
                const color = pin.priority === 'high' ? '#ef4444' : 
                             pin.priority === 'medium' ? '#eab308' : 
                             '#3b82f6';
                
                return (
                  <Marker
                    key={pin.id}
                    position={{ lat: pin.position[0], lng: pin.position[1] }}
                    onClick={() => handlePinClick(pin)}
                    icon={{
                      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                      fillColor: color,
                      fillOpacity: 1,
                      strokeWeight: 2,
                      strokeColor: '#ffffff',
                      scale: 2,
                      anchor: new google.maps.Point(12, 22),
                    }}
                  />
                );
              })}
            </GoogleMap>
            
            {/* User location display */}
            {userLocation && (
              <div className="absolute top-3 right-3 bg-white p-3 rounded-lg shadow-lg z-10 max-w-[300px]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <h3 className="font-semibold text-sm">Your Location</h3>
                </div>
                <div className="text-xs text-gray-700 mb-1">
                  <span className="font-medium">Coordinates: </span>
                  {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
                </div>
                {locationAddress && (
                  <div className="text-xs text-gray-700 overflow-hidden text-ellipsis">
                    <span className="font-medium">Address: </span>
                    {locationAddress}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p>Loading Google Maps...</p>
          </div>
        )}
        
        {/* Fallback content - only shown if map doesn't load */}
        {isLoading && (
          <div className="absolute inset-0 z-1 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mapPins.map((pin) => (
                <div 
                  key={pin.id} 
                  className="p-4 bg-white border rounded-lg shadow hover:shadow-md transition cursor-pointer"
                  onClick={() => handlePinClick(pin)}
                >
                  <div className="flex items-start mb-2">
                    <div className={`w-3 h-3 rounded-full mt-1 mr-2 ${
                      pin.priority === 'high' ? 'bg-red-500' :
                      pin.priority === 'medium' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div>
                      <h4 className="font-bold">{pin.title}</h4>
                      <p className="text-sm text-gray-600">{pin.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className={`px-2 py-1 rounded-full ${
                      pin.priority === 'high' ? 'bg-red-100 text-red-800' :
                      pin.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {pin.priority.charAt(0).toUpperCase() + pin.priority.slice(1)} Priority
                    </span>
                    
                    {pin.rewards && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        {pin.rewards.points} pts
                        {pin.rewards.worldcoin && ` + ${pin.rewards.worldcoin} WLD`}
                      </span>
                    )}
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      startMeasuring(pin);
                    }}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  >
                    Start Measuring
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Drawer for pin details */}
      <div 
        className={`fixed inset-x-0 bottom-0 z-40 transform transition-transform duration-300 ${
          drawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeDrawer}
        />
        
        {/* Drawer content */}
        <div className="relative bg-white rounded-t-xl shadow-lg z-40 max-h-[80vh] overflow-y-auto">
          {/* Drawer handle */}
          <div className="flex justify-center p-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
          
          {/* Pin details */}
          {selectedPin && (
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-4 h-4 rounded-full ${
                  selectedPin.priority === 'high' ? 'bg-red-500' :
                  selectedPin.priority === 'medium' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}></div>
                <h2 className="text-xl font-bold">{selectedPin.title}</h2>
              </div>
              
              <p className="text-base mb-4">{selectedPin.description}</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2 text-gray-700">Project Details</h3>
                
                <div className="flex justify-between items-center mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    selectedPin.priority === 'high' ? 'bg-red-100 text-red-800' :
                    selectedPin.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedPin.priority.charAt(0).toUpperCase() + selectedPin.priority.slice(1)} Priority
                  </span>
                  
                  {selectedPin.rewards && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Rewards:</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {selectedPin.rewards.points} pts
                        {selectedPin.rewards.worldcoin && ` + ${selectedPin.rewards.worldcoin} WLD`}
                      </span>
                    </div>
                  )}
                </div>
                
                {selectedPin.requirements && (
                  <div className="text-sm text-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span><span className="font-semibold">Required:</span> {selectedPin.requirements.minMeasurements} measurements</span>
                    </div>
                    
                    {selectedPin.requirements.timeOfDay && selectedPin.requirements.timeOfDay !== 'any' && (
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span><span className="font-semibold">Best time:</span> {selectedPin.requirements.timeOfDay}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => startMeasuring(selectedPin)}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
              >
                Start Measuring
              </button>
              
              <button 
                onClick={closeDrawer}
                className="w-full px-4 py-3 mt-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 