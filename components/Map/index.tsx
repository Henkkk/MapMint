"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapPin, mapPins, getPinsByDistance, loadProjectPins, projectPins, ProjectPin } from '../../lib/map-pins';
import { useRouter } from 'next/navigation';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import Image from 'next/image';

// Map Component using Google Maps
export const MapView = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [nearbyPins, setNearbyPins] = useState<(MapPin | ProjectPin)[]>([]);
  const [selectedPin, setSelectedPin] = useState<MapPin | ProjectPin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [drawerTranslateY, setDrawerTranslateY] = useState(0);
  const [activeTab, setActiveTab] = useState('map');
  const mapRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef(0);
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
  
  // Load project pins from localStorage
  useEffect(() => {
    const loadProjects = async () => {
      await loadProjectPins();
      // Update nearby pins if user location is already set
      if (userLocation) {
        const nearby = getPinsByDistance(userLocation[0], userLocation[1], 5);
        setNearbyPins(nearby);
      }
    };
    
    loadProjects();
  }, [userLocation]);
  
  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          console.log("User location set:", newPosition);
          setUserLocation(newPosition);
          
          // Find pins within 5km of user location
          const nearby = getPinsByDistance(newPosition[0], newPosition[1], 5);
          setNearbyPins(nearby);
          
          setIsLoading(false);
          
          // Disable geocoding to avoid API key authorization error
          // if (isLoaded && window.google) {
          //   const geocoder = new window.google.maps.Geocoder();
          //   geocoder.geocode(
          //     { 
          //       location: { lat: newPosition[0], lng: newPosition[1] } 
          //     },
          //     (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
          //       if (status === "OK" && results && results[0]) {
          //         setLocationAddress(results[0].formatted_address);
          //       } else {
          //         setLocationAddress('Address not found');
          //       }
          //     }
          //   );
          // }
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
  const handlePinClick = (pin: MapPin | ProjectPin) => {
    setSelectedPin(pin);
    setDrawerOpen(true);
  };
  
  // Start measuring at selected pin location
  const startMeasuring = (pin: MapPin | ProjectPin) => {
    try {
      // Check if user is verified with World ID
      const cookies = document.cookie.split(';');
      const verifiedCookie = cookies.find(cookie => cookie.trim().startsWith('world-id-verified='));
      const isVerified = verifiedCookie?.includes('true') || false;
      
      if (!isVerified) {
        // Show verification prompt with more detail
        alert("You must verify with World ID before contributing data. You will now be redirected to the verification page.");
        router.push('/verify');
        return;
      }
      
      // If verified, redirect based on pin type
      if (isProjectPin(pin)) {
        // For project pins, go to contribute page with project CID
        router.push(`/contribute?project=${pin.cid}`);
      } else {
        // For regular map pins, go directly to noise measurement
        router.push('/noise-measurement');
      }
    } catch (error) {
      console.error("Error in startMeasuring:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // Check if a pin is a MapPin (has priority property)
  const isMapPin = (pin: MapPin | ProjectPin): pin is MapPin => {
    return 'priority' in pin;
  };

  // Check if a pin is a ProjectPin (has range property)
  const isProjectPin = (pin: MapPin | ProjectPin): pin is ProjectPin => {
    return 'range' in pin;
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
    // Reset drawer position
    setDrawerTranslateY(0);
  };

  // Handle touch start on drawer
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientY;
  }, []);

  // Handle touch move on drawer
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touchY = e.touches[0].clientY;
    const deltaY = touchY - touchStartRef.current;
    
    // Only allow downward swipes
    if (deltaY > 0) {
      setDrawerTranslateY(deltaY);
    }
  }, []);

  // Handle touch end on drawer
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // If dragged more than 100px down or flicked quickly, close the drawer
    if (drawerTranslateY > 100 || e.changedTouches[0].clientY - touchStartRef.current > 50) {
      closeDrawer();
    } else {
      // Otherwise snap back
      setDrawerTranslateY(0);
    }
  }, [drawerTranslateY]);

  // Handle mouse events for desktop (similar to touch events)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    touchStartRef.current = e.clientY;
    
    // Add mouse move and up listeners to document
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - touchStartRef.current;
      if (deltaY > 0) {
        setDrawerTranslateY(deltaY);
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (drawerTranslateY > 100 || e.clientY - touchStartRef.current > 50) {
        closeDrawer();
      } else {
        setDrawerTranslateY(0);
      }
      
      // Remove listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [drawerTranslateY, closeDrawer]);

  // Handle navigation to profile
  const navigateToProfile = () => {
    router.push('/profile');
  };

  // Handle navigation to create project
  const navigateToCreateProject = () => {
    try {
      // Check if user is verified with World ID
      const cookies = document.cookie.split(';');
      const verifiedCookie = cookies.find(cookie => cookie.trim().startsWith('world-id-verified='));
      const isVerified = verifiedCookie?.includes('true') || false;
      
      if (!isVerified) {
        // Show verification required message
        alert("You must verify with World ID before creating a project. You will now be redirected to the verification page.");
        router.push('/verify');
        return;
      }
      
      // If verified, proceed to project creation
      router.push('/create-project');
    } catch (error) {
      console.error("Error navigating to create project:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full relative overflow-hidden">
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
                    url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                    scaledSize: new google.maps.Size(50, 50)
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
              
              {/* Project pins */}
              {projectPins.map((pin) => (
                <Marker
                  key={pin.id}
                  position={{ lat: pin.position[0], lng: pin.position[1] }}
                  onClick={() => handlePinClick(pin)}
                  icon={{
                    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                    fillColor: '#10b981', // Green color for project pins
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#ffffff',
                    scale: 2.2,
                    anchor: new google.maps.Point(12, 22),
                  }}
                />
              ))}
            </GoogleMap>
            
            {/* User location display */}
            {/* {userLocation && (
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
            )} */}
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
                    <div className="flex items-center justify-center gap-1">
                      <span>Contribute Data</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
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
        style={{ 
          transform: drawerOpen 
            ? `translateY(${drawerTranslateY}px)` 
            : 'translateY(100%)',
          transition: drawerTranslateY > 0 ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeDrawer}
        />
        
        {/* Drawer content */}
        <div 
          ref={drawerRef}
          className="relative bg-white rounded-t-xl shadow-lg z-40 max-h-[80vh] overflow-y-auto"
        >
          {/* Drawer handle - touch/click area for swipe */}
          <div 
            className="flex justify-center p-2 cursor-grab"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
          
          {/* Pin details */}
          {selectedPin && (
            <div className="px-6 py-4">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-4 h-4 rounded-full ${
                    isProjectPin(selectedPin) ? 'bg-green-500' :
                    selectedPin.priority === 'high' ? 'bg-red-500' :
                    selectedPin.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <h2 className="text-xl font-bold">{selectedPin.title}</h2>
                </div>
                
                {isProjectPin(selectedPin) && selectedPin.imageUrl && (
                  <div className="mb-4 rounded-lg overflow-hidden relative h-48 w-full">
                    <Image
                      src={selectedPin.imageUrl}
                      alt={selectedPin.title}
                      fill
                      style={{objectFit: 'cover'}}
                      sizes="(max-width: 768px) 100vw, 700px"
                    />
                  </div>
                )}
                
                <p className="text-gray-700 mb-4">{selectedPin.description}</p>
                
                <div className="flex justify-between items-center mb-3">
                  {isMapPin(selectedPin) && (
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedPin.priority === 'high' ? 'bg-red-100 text-red-800' :
                      selectedPin.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedPin.priority.charAt(0).toUpperCase() + selectedPin.priority.slice(1)} Priority
                    </span>
                  )}
                  
                  {isProjectPin(selectedPin) && (
                    <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      Project Range: {selectedPin.range.toFixed(1)} km
                    </span>
                  )}
                  
                  {isMapPin(selectedPin) && selectedPin.rewards && (
                    <div className="flex items-center">
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {selectedPin.rewards.points} Points
                      </span>
                      
                      {selectedPin.rewards.worldcoin && (
                        <span className="ml-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" fill="none" />
                            <path d="M12 6v12M6 12h12" strokeWidth="2" stroke="currentColor" strokeLinecap="round" />
                          </svg>
                          {selectedPin.rewards.worldcoin} WLD
                        </span>
                      )}
                    </div>
                  )}
                  
                  {isProjectPin(selectedPin) && selectedPin.rewards && (
                    <div className="flex items-center">
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" fill="none" />
                          <path d="M12 6v12M6 12h12" strokeWidth="2" stroke="currentColor" strokeLinecap="round" />
                        </svg>
                        {selectedPin.rewards.worldcoin} WLD
                      </span>
                    </div>
                  )}
                </div>
                
                {isMapPin(selectedPin) && selectedPin.requirements && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium mb-2">Requirements</h3>
                    <div className="text-sm">
                      <div className="mb-1">Minimum Measurements: {selectedPin.requirements.minMeasurements}</div>
                      {selectedPin.requirements.timeOfDay && (
                        <div>Best time to measure: <span className="font-medium">{selectedPin.requirements.timeOfDay.charAt(0).toUpperCase() + selectedPin.requirements.timeOfDay.slice(1)}</span></div>
                      )}
                    </div>
                  </div>
                )}
                
                {isProjectPin(selectedPin) && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium mb-2">Project Details</h3>
                    <div className="text-sm">
                      <div className="mb-1">End Date: {new Date(selectedPin.endDate).toLocaleDateString()}</div>
                      <div>Status: <span className="font-medium">{selectedPin.status.charAt(0).toUpperCase() + selectedPin.status.slice(1)}</span></div>
                      
                      {selectedPin.dataToCollect && (
                        <div className="mt-3">
                          <div className="font-medium mb-1">Data to Collect:</div>
                          <ul className="list-disc list-inside pl-1">
                            {selectedPin.dataToCollect.backgroundNoise && (
                              <li>Background Noise</li>
                            )}
                            {selectedPin.dataToCollect.wifiSpeed && (
                              <li>WiFi Speed</li>
                            )}
                            {selectedPin.dataToCollect.lightIntensity && (
                              <li>Light Intensity</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => startMeasuring(selectedPin)}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span>Contribute Data</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      {!drawerOpen && (
        <div className="fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 z-30">
          <div className="flex justify-around items-center h-24">
            <button 
              onClick={() => setActiveTab('map')}
              className="flex flex-col items-center justify-center w-full h-full text-blue-500"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
                />
              </svg>
              <span className="text-xs mt-1 font-medium">Map</span>
            </button>

            <button 
              onClick={() => navigateToCreateProject()}
              className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-blue-500"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 4v16m8-8H4" 
                />
              </svg>
              <span className="text-xs mt-1 font-medium">Create</span>
            </button>
            
            <button 
              onClick={navigateToProfile}
              className="flex flex-col items-center justify-center w-full h-full text-gray-500"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
              <span className="text-xs mt-1 font-medium">Profile</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 