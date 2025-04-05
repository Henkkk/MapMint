"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Script from 'next/script';

// Google Maps API is loaded for geocoding and places autocomplete

type FormData = {
  title: string;
  description: string;
  image: File | null;
  location: { lat: number; lng: number };
  address: string;
  range: number; // in kilometers
  endDate: string;
  rewards: {
    worldcoin: number;
  };
};

// Declare Google Maps types
declare global {
  interface Window {
    initMap: () => void;
    google: {
      maps: {
        Geocoder: new () => any;
        places: {
          Autocomplete: new (inputElement: HTMLInputElement, options?: any) => any;
          AutocompleteService: new () => any;
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
            OVER_QUERY_LIMIT: string;
            REQUEST_DENIED: string;
            INVALID_REQUEST: string;
            UNKNOWN_ERROR: string;
          };
        };
        GeocoderStatus: {
          OK: string;
          ZERO_RESULTS: string;
          OVER_QUERY_LIMIT: string;
          REQUEST_DENIED: string;
          INVALID_REQUEST: string;
          UNKNOWN_ERROR: string;
        };
      };
    };
  }
}

export default function CreateProjectPage() {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const geocoder = useRef<any>(null);
  const autocomplete = useRef<any>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    image: null,
    location: { lat: 25.0330, lng: 121.5654 }, // Default to Taipei
    address: '',
    range: 1,
    endDate: '',
    rewards: {
      worldcoin: 0.1
    }
  });
  
  // Initialize geocoder and autocomplete when API loads
  useEffect(() => {
    if (!apiLoaded || !addressInputRef.current) return;
    
    try {
      // Define the initialization function (required for callback)
      window.initMap = () => {
        try {
          // Initialize geocoder
          geocoder.current = new window.google.maps.Geocoder();
          
          // Initialize autocomplete
          if (addressInputRef.current) {
            autocomplete.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
              types: ['geocode', 'establishment'],
              fields: ['address_components', 'formatted_address', 'geometry', 'name']
            });
            
            // Add place_changed event listener
            autocomplete.current.addListener('place_changed', () => {
              const place = autocomplete.current.getPlace();
              
              if (!place.geometry) {
                // User entered the name of a place that was not suggested and pressed Enter
                setGeocodeError("Please select a location from the dropdown");
                return;
              }
              
              // Get the selected place details
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const address = place.formatted_address || place.name;
              
              // Update form data
              setFormData(prev => ({
                ...prev,
                location: { lat, lng },
                address: address
              }));
              
              setGeocodeError(null);
            });
          }
        } catch (error) {
          console.error("Error initializing Google services:", error);
        }
      };
    } catch (error) {
      console.error("Error setting up Google services:", error);
    }
  }, [apiLoaded]);
  
  // Function to geocode address to coordinates
  const geocodeAddress = () => {
    if (!geocoder.current || !formData.address.trim()) return;
    
    setGeocoding(true);
    setGeocodeError(null);
    
    geocoder.current.geocode({ address: formData.address }, (results: any[], status: string) => {
      if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        // Update form data
        setFormData(prev => ({
          ...prev,
          location: { lat, lng },
          address: results[0].formatted_address
        }));
        
      } else {
        console.error("Geocoding failed:", status);
        setGeocodeError(
          status === window.google.maps.GeocoderStatus.ZERO_RESULTS 
            ? "No locations found for this address" 
            : "Failed to find this location"
        );
      }
      
      setGeocoding(false);
    });
  };
  
  // Check if user is verified on load
  useEffect(() => {
    const checkVerification = () => {
      const cookies = document.cookie.split(';');
      const verifiedCookie = cookies.find(cookie => cookie.trim().startsWith('world-id-verified='));
      const verified = verifiedCookie?.includes('true') || false;
      setIsVerified(verified);
      
      // Redirect to verification page if not verified
      if (!verified) {
        if (confirm("World ID verification is required to create a project. Go to verification page?")) {
          router.push('/verify');
        } else {
          router.back();
        }
      }
      
      setLoading(false);
    };
    
    checkVerification();
    
    // Set default end date to 30 days from now
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 30);
    setFormData(prev => ({
      ...prev,
      endDate: defaultEndDate.toISOString().split('T')[0]
    }));
    
    // Get user's current location for the project
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setFormData(prev => ({
            ...prev,
            location: { lat, lng }
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, [router]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle nested objects
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      // Type-safe approach for nested objects
      if (parent === 'rewards') {
        setFormData(prev => ({
          ...prev,
          rewards: {
            ...prev.rewards,
            [child]: parseFloat(value)
          }
        }));
      } else if (parent === 'location') {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            [child]: parseFloat(value)
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      address: e.target.value
    }));
    
    setGeocodeError(null);
  };
  
  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    geocodeAddress();
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Here you would typically save the project to your backend
    alert("Project creation feature is coming soon!");
    console.log("Project data:", formData);
    
    // Navigate back to map
    router.push('/');
  };
  
  const goBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Only show the form if verified
  if (!isVerified) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">World ID Verification Required</h2>
          <p className="text-yellow-800 mb-6">You must verify your World ID before creating a project.</p>
          <button
            onClick={() => router.push('/verify')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Verify with World ID
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      {/* Load Google Maps API for geocoding and places */}
      <Script
        src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBXF5UM_K6GNpagXSZFjJopMVJnPOJIYkI&libraries=places&callback=initMap"
        onLoad={() => setApiLoaded(true)}
      />
      
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <button onClick={goBack} className="mr-4 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Create New Project</h1>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          {/* <div className="mb-4 flex items-center">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs flex items-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Verified with World ID
              </div>
              <span className="text-xs text-gray-500">Required for project creation</span>
           </div> */}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project title"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Describe your project"
                required
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Image
              </label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {imagePreview && (
                <div className="mt-2 relative h-40 w-full">
                  <Image 
                    src={imagePreview}
                    alt="Project preview"
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              
              {/* Address search form with autocomplete */}
              <div className="mb-3">
                <form onSubmit={handleAddressSubmit} className="flex gap-2">
                  <div className="flex-grow relative">
                    <input
                      ref={addressInputRef}
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Type to search for a location"
                      required
                    />
                    <div className="absolute right-2 top-2 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {geocodeError && (
                      <p className="text-red-500 text-xs mt-1">{geocodeError}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Start typing to see suggestions
                    </p>
                  </div>
                  <button 
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition flex-shrink-0"
                    disabled={geocoding || !formData.address.trim()}
                  >
                    {geocoding ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      "Verify"
                    )}
                  </button>
                </form>
              </div>
              
              <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded-md mb-3">
                {formData.address ? (
                  <div>
                    <p className="font-medium">Selected Location:</p>
                    <p className="mt-1">{formData.address}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Coordinates: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
                    </p>
                  </div>
                ) : (
                  <p>Enter an address to set your project location</p>
                )}
              </div>
              
              {/* Hidden coordinate inputs for advanced users */}
              <details className="text-sm mt-2">
                <summary className="cursor-pointer text-blue-500 mb-2">Advanced: Set coordinates manually</summary>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      name="location.lat"
                      value={formData.location.lat}
                      onChange={handleInputChange}
                      step="0.000001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Latitude"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      name="location.lng"
                      value={formData.location.lng}
                      onChange={handleInputChange}
                      step="0.000001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Longitude"
                      required
                    />
                  </div>
                </div>
              </details>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection Range (km)
              </label>
              <input
                type="range"
                name="range"
                min="0.1"
                max="10"
                step="0.1"
                value={formData.range}
                onChange={handleInputChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0.1 km</span>
                <span>{formData.range} km</span>
                <span>10 km</span>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                World ID Reward (WLD)
              </label>
              <input
                type="number"
                name="rewards.worldcoin"
                value={formData.rewards.worldcoin}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
                max="10"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition"
            >
              Create Project
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 