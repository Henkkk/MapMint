"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import { IPFSProjectData, uploadProjectToIPFS } from '../../lib/ipfs-service';

// Add custom CSS to ensure the Places Autocomplete dropdown is visible
const placesAutocompleteStyles = `
  .pac-container {
    z-index: 9999 !important;
    border-radius: 0.375rem;
    margin-top: 4px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb;
  }
  
  .pac-item {
    padding: 8px 10px;
    cursor: pointer;
  }
  
  .pac-item:hover {
    background-color: #f3f4f6;
  }
  
  .pac-item-selected {
    background-color: #f3f4f6;
  }
  
  .pac-icon {
    margin-top: 3px;
  }
  
  .pac-item-query {
    font-size: 0.875rem;
    color: #111827;
  }
`;

// Google Maps API is loaded for geocoding and places autocomplete

type FormData = {
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

type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

// Declare Google Maps types
declare global {
  interface Window {
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
  const autoCompleteRef = useRef<any>(null);
  const placesService = useRef<any>(null);
  const autocompleteSvc = useRef<any>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
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
  const [submitting, setSubmitting] = useState(false);
  
  // Add an effect to check if Google Maps is fully loaded
  useEffect(() => {
    if (apiLoaded && typeof window !== 'undefined' && (!window.google || !window.google.maps)) {
      // If apiLoaded is true but window.google.maps is not available,
      // we need to poll until it's available
      console.log("Waiting for Google Maps to be fully initialized...");
      
      const checkGoogleMaps = () => {
        if (window.google && window.google.maps) {
          console.log("Google Maps successfully initialized");
        } else {
          console.log("Google Maps not yet initialized, retrying...");
          setTimeout(checkGoogleMaps, 300);
        }
      };
      
      checkGoogleMaps();
    }
  }, [apiLoaded]);
  
  // Initialize Google Maps services after the script is loaded
  useEffect(() => {
    if (!apiLoaded) return;
    
    // Safety check to ensure the Google Maps API is fully loaded
    if (typeof window === 'undefined' || !window.google || !window.google.maps) {
      console.log("Google Maps API not yet available, waiting...");
      return;
    }
    
    try {
      console.log("Initializing Google Maps services");
      
      // Initialize geocoder
      if (window.google.maps.Geocoder) {
        geocoder.current = new window.google.maps.Geocoder();
        console.log("Geocoder initialized");
      }
      
      // Initialize autocomplete services
      if (window.google.maps.places) {
        if (window.google.maps.places.AutocompleteService) {
          autocompleteSvc.current = new window.google.maps.places.AutocompleteService();
        }
        
        if (window.google.maps.places.PlacesService) {
          const dummyElement = document.createElement('div');
          placesService.current = new window.google.maps.places.PlacesService(dummyElement);
        }
      }
    } catch (error) {
      console.error("Error initializing Google services:", error);
    }
  }, [apiLoaded]);
  
  // Setup autocomplete when input is available and API is loaded
  useEffect(() => {
    if (!apiLoaded) return;
    
    // Ensure all required objects are available
    if (
      typeof window === 'undefined' || 
      !window.google || 
      !window.google.maps || 
      !window.google.maps.places ||
      !addressInputRef.current
    ) {
      console.log("Requirements for Places Autocomplete not met, waiting...");
      return;
    }
    
    try {
      console.log("Setting up Places Autocomplete");
      
      // Clean up any existing autocomplete
      if (autoCompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autoCompleteRef.current);
      }
      
      // Initialize the autocomplete
      autoCompleteRef.current = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          componentRestrictions: { country: 'tw' }, // Restrict to Taiwan
          fields: ['address_components', 'geometry', 'name', 'formatted_address'],
          types: ['address', 'establishment', 'geocode']
        }
      );
      
      // Add the place_changed event listener
      window.google.maps.event.addListener(autoCompleteRef.current, 'place_changed', () => {
        try {
          const place = autoCompleteRef.current.getPlace();
          console.log("Selected place:", place);
          
          if (!place || !place.geometry) {
            console.error("No geometry for selected place");
            setGeocodeError("Please select a place from the dropdown");
            return;
          }
          
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          console.log(`Selected coordinates: ${lat}, ${lng}`);
          
          // Update the form data with the selected place information
          setFormData(prev => ({
            ...prev,
            location: { lat, lng },
            address: place.formatted_address || place.name || ''
          }));
          
          setGeocodeError(null);
        } catch (error) {
          console.error("Error handling place selection:", error);
          setGeocodeError("Error selecting place. Please try again.");
        }
      });
      
      console.log("Places Autocomplete setup completed");
    } catch (error) {
      console.error("Error setting up Places Autocomplete:", error);
    }
    
    // Prevent form submission on Enter key
    const preventFormSubmit = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && document.activeElement === addressInputRef.current) {
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', preventFormSubmit);
    
    return () => {
      window.removeEventListener('keydown', preventFormSubmit);
      
      // Clean up the autocomplete when the component unmounts
      if (autoCompleteRef.current && window.google && window.google.maps && window.google.maps.event) {
        try {
          window.google.maps.event.clearInstanceListeners(autoCompleteRef.current);
        } catch (error) {
          console.error("Error cleaning up autocomplete:", error);
        }
      }
    };
  }, [apiLoaded]);
  
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
    const value = e.target.value;
    
    // Only update the address part, not the location coordinates
    // This keeps the coordinates set by the Places Autocomplete
    setFormData(prev => ({
      ...prev,
      address: value
    }));
    
    setGeocodeError(null);
    console.log("Address changed manually:", value);
  };
  
  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No longer needed as we're using the Places Autocomplete widget
  };
  
  const handleClearAddress = () => {
    setFormData(prev => ({
      ...prev,
      address: ''
    }));
    setGeocodeError(null);
    
    // Focus the input after clearing
    if (addressInputRef.current) {
      addressInputRef.current.focus();
    }
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
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Get the user's World ID verified address from cookie
      const cookies = document.cookie.split(';');
      const addressCookie = cookies.find(cookie => cookie.trim().startsWith('world-id-address='));
      const userAddress = addressCookie ? decodeURIComponent(addressCookie.split('=')[1]) : '';
      
      // Create project data object
      const projectData: IPFSProjectData = {
        title: formData.address.split(',')[0] || 'New Project',
        description: formData.description,
        imageUrl: imagePreview || undefined,
        location: formData.location,
        address: formData.address,
        range: formData.range,
        endDate: formData.endDate,
        rewards: {
          worldcoin: formData.rewards.worldcoin
        },
        createdBy: userAddress,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      // Upload to IPFS
      const cid = await uploadProjectToIPFS(projectData);
      console.log("Project stored on IPFS with CID:", cid);
      
      // Save CID to localStorage for demo purposes
      // In a real app, this would be stored in a database or on-chain
      const storedProjects = localStorage.getItem('projectCIDs') || '[]';
      const projectCIDs = JSON.parse(storedProjects);
      projectCIDs.push(cid);
      localStorage.setItem('projectCIDs', JSON.stringify(projectCIDs));
      
      // Also cache the project data for quick access
      localStorage.setItem(`project-${cid}`, JSON.stringify(projectData));
      
      alert("Project created successfully!");
      
      // Navigate back to map
      router.push('/');
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
      {/* Add the style tag for Places Autocomplete styles */}
      <style dangerouslySetInnerHTML={{ __html: placesAutocompleteStyles }} />
      
      {/* Load Google Maps API for geocoding and places */}
      <Script
        src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBXF5UM_K6GNpagXSZFjJopMVJnPOJIYkI&libraries=places"
        strategy="lazyOnload"
        onReady={() => {
          console.log("Google Maps API loaded and ready");
          setApiLoaded(true);
        }}
        onError={(e) => {
          console.error("Google Maps API failed to load", e);
        }}
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
                Location
              </label>
              
              {/* Address input with Google Places Autocomplete */}
              <div className="mb-3">
                <div className="relative">
                  <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                    <div className="pl-3 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      ref={addressInputRef}
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleAddressChange}
                      onFocus={() => {
                        console.log("Address input focused");
                        setAddressFocused(true);
                      }}
                      onBlur={() => {
                        console.log("Address input blurred");
                        setAddressFocused(false);
                      }}
                      className="w-full px-2 py-3 border-0 focus:outline-none pac-target-input"
                      placeholder="Where do you want data collected?"
                      required
                      id="google-places-autocomplete"
                    />
                    {formData.address && (
                      <button
                        type="button"
                        onClick={handleClearAddress}
                        className="pr-3 text-gray-400 hover:text-gray-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {geocodeError && (
                    <p className="text-red-500 text-xs mt-1">{geocodeError}</p>
                  )}
                </div>
                
                {!addressFocused && formData.address && (
                  <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded-md mt-2">
                    <div className="font-medium">Selected Location:</div>
                    <div className="mt-1">{formData.address}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Coordinates: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
                    </div>
                  </div>
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
                Reward (WLD)
              </label>
              <input
                type="number"
                name="rewards.worldcoin"
                value={formData.rewards.worldcoin}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
                max="1000000000"
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