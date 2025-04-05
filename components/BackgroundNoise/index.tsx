"use client";
import { useState, useRef, useEffect } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import { useMeasurementStorage } from "../../contexts/MeasurementStorageContext";
import { IPFSMeasurementData } from "../../lib/ipfs-service";

export const BackgroundNoiseBlock = () => {
  const [isListening, setIsListening] = useState(false);
  const [currentDB, setCurrentDB] = useState<number | null>(null);
  const [maxDB, setMaxDB] = useState<number | null>(null);
  const [minDB, setMinDB] = useState<number | null>(null);
  const [avgDB, setAvgDB] = useState<number | null>(null);
  const [noiseLevel, setNoiseLevel] = useState<'quiet' | 'moderate' | 'noisy' | 'loud' | null>(null);
  const [measurements, setMeasurements] = useState<{ 
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
  }[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [measurementTime, setMeasurementTime] = useState(0);
  const [locationData, setLocationData] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Audio context refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const measurementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dBValuesRef = useRef<number[]>([]);
  const lastVerificationCheck = useRef<number>(0);
  const locationWatchId = useRef<number | null>(null);

  // Add IPFS storage state
  const { savedMeasurements, isSaving, saveMeasurement: saveToIPFSStorage } = useMeasurementStorage();
  const [savingMeasurementIndex, setSavingMeasurementIndex] = useState<number | null>(null);

  // Format time in minutes:seconds
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format date for timestamp
  const formatDate = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  // Calculate noise level category based on dB
  const getNoiseLevelCategory = (db: number): 'quiet' | 'moderate' | 'noisy' | 'loud' => {
    if (db < 40) return 'quiet';
    if (db < 60) return 'moderate';
    if (db < 80) return 'noisy';
    return 'loud';
  };

  // Get color based on noise level
  const getNoiseColor = (level: 'quiet' | 'moderate' | 'noisy' | 'loud' | null): string => {
    switch (level) {
      case 'quiet': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'noisy': return 'bg-orange-500';
      case 'loud': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Get description based on noise level
  const getNoiseLevelDescription = (level: 'quiet' | 'moderate' | 'noisy' | 'loud' | null): string => {
    switch (level) {
      case 'quiet': return 'Quiet environment (< 40dB)';
      case 'moderate': return 'Moderate noise (40-60dB)';
      case 'noisy': return 'Noisy environment (60-80dB)';
      case 'loud': return 'Loud environment (> 80dB)';
      default: return 'Not measuring';
    }
  };

  // Format coordinates for display
  const formatCoordinates = (lat: number, lng: number): string => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // Check if user is verified - with throttling to prevent excessive API calls
  const checkVerification = async (force = false) => {
    // Skip if we checked too recently (within the last 5 seconds)
    const now = Date.now();
    if (!force && now - lastVerificationCheck.current < 5000) {
      return;
    }
    
    try {
      const response = await fetch("/api/check-verification");
      const data = await response.json();
      setIsVerified(data.verified);
      lastVerificationCheck.current = now;
    } catch (error) {
      console.error("Error checking verification:", error);
    }
  };

  // Add an event listener for the custom world-id-verified event
  useEffect(() => {
    const handleVerified = () => {
      setIsVerified(true);
    };
    
    window.addEventListener('world-id-verified', handleVerified);
    
    // Initial check on component mount
    checkVerification();
    
    // Listen for storage events (cookie changes)
    const handleStorageChange = () => {
      checkVerification(true);
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('world-id-verified', handleVerified);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Cleanup function for audio context and timers
  useEffect(() => {
    return () => {
      stopListening();
      stopLocationTracking();
    };
  }, []);

  // Start tracking user location
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    
    setLocationError(null);
    
    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationData({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationError(`Location error: ${error.message}`);
      },
      { enableHighAccuracy: true }
    );
    
    // Watch position for updates
    locationWatchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocationData({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.error("Error watching location:", error);
        setLocationError(`Location update error: ${error.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
  };
  
  // Stop tracking user location
  const stopLocationTracking = () => {
    if (locationWatchId.current !== null) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }
  };

  const startListening = async () => {
    // Force check verification before starting
    await checkVerification(true);
    
    if (!isVerified) {
      alert("You need to verify with World ID first!");
      return;
    }

    setErrorMessage(null);
    
    try {
      // Start location tracking
      startLocationTracking();
      
      // Reset values
      setCurrentDB(null);
      setMaxDB(null);
      setMinDB(null);
      setAvgDB(null);
      setNoiseLevel(null);
      dBValuesRef.current = [];
      
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log("Microphone access granted. Creating AudioContext...");
      
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.8;
      
      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Create data array for frequency data
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Save references
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      microphoneStreamRef.current = stream;
      dataArrayRef.current = dataArray;
      
      const updateDecibels = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;
        
        // Get frequency data
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        
        // Calculate volume
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i];
        }
        
        // Calculate average
        const average = sum / dataArrayRef.current.length;
        
        // Convert to decibels (rough approximation)
        // Mapping 0-255 to 0-100dB range
        const db = Math.round((average / 255) * 100);
        
        // Update state
        setCurrentDB(db);
        dBValuesRef.current.push(db);
        
        // Update min/max
        setMaxDB(prev => prev === null ? db : Math.max(prev, db));
        setMinDB(prev => prev === null ? db : Math.min(prev, db));
        
        // Calculate running average
        const avgDb = Math.round(dBValuesRef.current.reduce((sum, val) => sum + val, 0) / dBValuesRef.current.length);
        setAvgDB(avgDb);
        
        // Determine noise level
        const level = getNoiseLevelCategory(db);
        setNoiseLevel(level);
        
        // Continue measuring
        animationFrameRef.current = requestAnimationFrame(updateDecibels);
      };
      
      // Start measuring
      updateDecibels();
      
      // Start timer
      setMeasurementTime(0);
      measurementIntervalRef.current = setInterval(() => {
        setMeasurementTime(prev => prev + 1);
      }, 1000);
      
      // Update state
      setIsListening(true);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setErrorMessage(`Microphone access error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Update saveMeasurement function to use IPFS storage
  const saveToIPFS = async (index: number) => {
    if (savingMeasurementIndex !== null) {
      return; // Don't allow multiple saves at once
    }
    
    const measurement = measurements[index];
    if (!measurement) return;
    
    setSavingMeasurementIndex(index);
    
    try {
      // Prepare measurement data for IPFS
      const ipfsMeasurement: IPFSMeasurementData = {
        timestamp: measurement.timestamp,
        average: measurement.average,
        max: measurement.max,
        min: measurement.min,
        duration: measurement.duration,
        level: measurement.level,
        location: measurement.location,
        metadata: {
          appVersion: "1.0.0",
          deviceInfo: navigator.userAgent,
          tags: ["noise", "worldcoin", "mini-app"]
        }
      };
      
      // Save to IPFS and World Chain
      const result = await saveToIPFSStorage(ipfsMeasurement);
      
      if (result) {
        // Update UI to show success
        alert(`Measurement saved to IPFS! CID: ${result.cid.substring(0, 10)}...`);
      } else {
        alert("Failed to save measurement to IPFS");
      }
    } catch (error) {
      console.error("Error saving to IPFS:", error);
      alert("Error saving to IPFS");
    } finally {
      setSavingMeasurementIndex(null);
    }
  };

  // Modify stopListening function to automatically save to IPFS
  const stopListening = () => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop measurement timer
    if (measurementIntervalRef.current) {
      clearInterval(measurementIntervalRef.current);
      measurementIntervalRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(err => {
        console.error("Error closing audio context:", err);
      });
    }
    
    // Stop microphone
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      microphoneStreamRef.current = null;
    }
    
    // Save the measurement if we have data
    if (dBValuesRef.current.length > 0 && avgDB !== null) {
      const avg = avgDB;
      const max = maxDB || avg;
      const min = minDB || avg;
      const level = getNoiseLevelCategory(avg);
      
      const newMeasurement = {
        timestamp: formatDate(new Date()),
        average: avg,
        max: max,
        min: min,
        duration: formatTime(measurementTime),
        level,
        ...(locationData && { location: locationData })
      };
      
      setMeasurements(prev => [...prev, newMeasurement]);

      // Auto-save to IPFS if verified and configured
      if (isVerified && locationData) {
        // Save to IPFS in the background
        setTimeout(() => {
          const newIndex = measurements.length; // Index of the measurement we just added
          saveToIPFS(newIndex);
        }, 1000);
      }
    }
    
    // Stop location tracking
    stopLocationTracking();
    
    setIsListening(false);
  };

  const deleteMeasurement = (index: number) => {
    setMeasurements(prev => prev.filter((_, i) => i !== index));
  };

  // Let's modify the saveMeasurement function to a new name to avoid confusion
  const downloadMeasurement = (index: number) => {
    const measurement = measurements[index];
    
    // Create text content
    let content = `Noise Measurement
Timestamp: ${measurement.timestamp}
Duration: ${measurement.duration}
Average: ${measurement.average} dB
Max: ${measurement.max} dB
Min: ${measurement.min} dB
Noise Level: ${measurement.level}
`;

    // Add location if available
    if (measurement.location) {
      content += `Location: ${formatCoordinates(measurement.location.latitude, measurement.location.longitude)}
Accuracy: ${measurement.location.accuracy.toFixed(1)} meters
`;
    }
    
    // Add Google Maps link if location is available
    if (measurement.location) {
      content += `Google Maps: https://www.google.com/maps?q=${measurement.location.latitude},${measurement.location.longitude}
`;
    }
    
    // Create download link with text content
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = `noise-level-${measurement.timestamp.replace(/[^a-zA-Z0-9]/g, '-')}.txt`;
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Open location in Google Maps
  const openInMaps = (latitude: number, longitude: number) => {
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
  };

  return (
    <div className="w-full max-w-md p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Noise Level Detector</h2>
      
      {!isVerified && (
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded">
          Please verify with World ID to use this feature
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-4 p-2 bg-red-100 text-red-800 rounded">
          {errorMessage}
        </div>
      )}
      
      {locationError && (
        <div className="mb-4 p-2 bg-orange-100 text-orange-800 rounded">
          {locationError}
        </div>
      )}
      
      <div className="flex flex-col gap-2 mb-4">
        {!isListening ? (
          <button
            onClick={startListening}
            disabled={!isVerified}
            className={`px-4 py-2 rounded ${
              isVerified 
                ? "bg-blue-500 text-white hover:bg-blue-600" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Contribute Data
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="mb-1 flex justify-between items-center">
                <span className="font-medium">Current Noise Level:</span>
                <span className="flex items-center">
                  <span className={`inline-block h-3 w-3 ${getNoiseColor(noiseLevel)} rounded-full mr-2`}></span>
                  <span>{currentDB !== null ? `${currentDB} dB` : 'Calculating...'}</span>
                </span>
              </div>
              
              {/* Meter display */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className={`h-3 rounded-full transition-all duration-100 ${getNoiseColor(noiseLevel)}`} 
                  style={{ width: `${currentDB !== null ? Math.min(currentDB, 100) : 0}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-600">{getNoiseLevelDescription(noiseLevel)}</p>
              
              {/* Stats display */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="p-2 bg-white rounded text-center">
                  <div className="text-xs text-gray-500">Min</div>
                  <div className="font-medium">{minDB !== null ? `${minDB} dB` : '-'}</div>
                </div>
                <div className="p-2 bg-white rounded text-center">
                  <div className="text-xs text-gray-500">Avg</div>
                  <div className="font-medium">{avgDB !== null ? `${avgDB} dB` : '-'}</div>
                </div>
                <div className="p-2 bg-white rounded text-center">
                  <div className="text-xs text-gray-500">Max</div>
                  <div className="font-medium">{maxDB !== null ? `${maxDB} dB` : '-'}</div>
                </div>
              </div>
            </div>
            
            {/* Location display */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="mb-1">
                <span className="font-medium">Current Location:</span>
              </div>
              
              {locationData ? (
                <div className="text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span>{formatCoordinates(locationData.latitude, locationData.longitude)}</span>
                    <button 
                      onClick={() => openInMaps(locationData.latitude, locationData.longitude)}
                      className="text-blue-500 underline text-xs"
                    >
                      View on Map
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Accuracy: ±{locationData.accuracy.toFixed(1)} meters</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Obtaining location...</p>
              )}
            </div>
            
            <div className="flex items-center">
              <span className="h-3 w-3 bg-blue-500 rounded-full animate-pulse mr-2"></span>
              <span className="text-sm">Measuring for: {formatTime(measurementTime)}</span>
            </div>
            
            <button
              onClick={stopListening}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
              </svg>
              Stop Measuring
            </button>
          </div>
        )}
      </div>

      {measurements.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-3">Your Measurements:</h3>
          
          {/* Add explanation about IPFS storage */}
          <p className="text-xs text-gray-500 mb-2">
            Measurements are stored locally and can be permanently saved to IPFS and World Chain.
          </p>
          
          <ul className="space-y-4">
            {measurements.map((measurement, index) => (
              <li 
                key={index} 
                className="p-3 rounded-lg bg-gray-50 transition-all duration-300"
              >
                <div className="mb-2">
                  <h4 className="font-medium flex items-center">
                    <span className={`inline-block h-3 w-3 ${getNoiseColor(measurement.level)} rounded-full mr-2`}></span>
                    Noise Measurement {index + 1}
                  </h4>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <span className="mr-3">Measured: {measurement.timestamp}</span>
                    <span>Duration: {measurement.duration}</span>
                  </div>
                  
                  {measurement.location && (
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span className="mr-3">Location: {formatCoordinates(measurement.location.latitude, measurement.location.longitude)}</span>
                      <button 
                        onClick={() => measurement.location && openInMaps(measurement.location.latitude, measurement.location.longitude)}
                        className="text-blue-500 underline"
                      >
                        View on Map
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
                  <div className="p-2 bg-white rounded text-center">
                    <div className="text-xs text-gray-500">Min</div>
                    <div className="font-medium">{measurement.min} dB</div>
                  </div>
                  <div className="p-2 bg-white rounded text-center">
                    <div className="text-xs text-gray-500">Avg</div>
                    <div className="font-medium">{measurement.average} dB</div>
                  </div>
                  <div className="p-2 bg-white rounded text-center">
                    <div className="text-xs text-gray-500">Max</div>
                    <div className="font-medium">{measurement.max} dB</div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  {/* Add IPFS Save button */}
                  <button
                    onClick={() => saveToIPFS(index)}
                    disabled={savingMeasurementIndex === index || isSaving}
                    className={`w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition flex items-center justify-center gap-1 ${
                      (savingMeasurementIndex === index || isSaving) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {savingMeasurementIndex === index ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>Save to IPFS</span>
                      </>
                    )}
                  </button>
                  
                  {/* Keep existing buttons */}
                  <button
                    onClick={() => downloadMeasurement(index)}
                    className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center justify-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => deleteMeasurement(index)}
                    className="w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition flex items-center justify-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Display list of IPFS-stored measurements */}
      {savedMeasurements.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-medium mb-3">Permanently Stored Measurements:</h3>
          <ul className="space-y-4">
            {savedMeasurements.map((savedMeasurement, index) => (
              <li key={index} className="p-3 rounded-lg bg-gray-100">
                <div className="mb-2">
                  <h4 className="font-medium flex items-center">
                    <span className={`inline-block h-3 w-3 ${getNoiseColor(savedMeasurement.data.level)} rounded-full mr-2`}></span>
                    IPFS Measurement 
                  </h4>
                  <div className="text-xs text-gray-600 mt-1">
                    <div>Stored: {new Date(savedMeasurement.timestamp).toLocaleString()}</div>
                    <div className="mt-1">IPFS CID: <span className="font-mono">{savedMeasurement.cid.substring(0, 8)}...{savedMeasurement.cid.substring(savedMeasurement.cid.length - 4)}</span></div>
                    {savedMeasurement.worldChainTxHash && (
                      <div className="mt-1">Chain Tx: <span className="font-mono">{savedMeasurement.worldChainTxHash.substring(0, 8)}...{savedMeasurement.worldChainTxHash.substring(savedMeasurement.worldChainTxHash.length - 4)}</span></div>
                    )}
                  </div>
                  
                  {savedMeasurement.data.location && (
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <span className="mr-3">Location: {formatCoordinates(savedMeasurement.data.location.latitude, savedMeasurement.data.location.longitude)}</span>
                      <button 
                        onClick={() => savedMeasurement.data.location && openInMaps(savedMeasurement.data.location.latitude, savedMeasurement.data.location.longitude)}
                        className="text-blue-500 underline"
                      >
                        View on Map
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
                  <div className="p-2 bg-white rounded text-center">
                    <div className="text-xs text-gray-500">Min</div>
                    <div className="font-medium">{savedMeasurement.data.min} dB</div>
                  </div>
                  <div className="p-2 bg-white rounded text-center">
                    <div className="text-xs text-gray-500">Avg</div>
                    <div className="font-medium">{savedMeasurement.data.average} dB</div>
                  </div>
                  <div className="p-2 bg-white rounded text-center">
                    <div className="text-xs text-gray-500">Max</div>
                    <div className="font-medium">{savedMeasurement.data.max} dB</div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 mb-2">
                  <button
                    onClick={() => window.open(`https://ipfs.infura.io/ipfs/${savedMeasurement.cid}`, '_blank')}
                    className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center justify-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>View on IPFS</span>
                  </button>
                  
                  {savedMeasurement.worldChainTxHash && (
                    <button
                      onClick={() => window.open(`https://explorer.worldcoin.org/tx/${savedMeasurement.worldChainTxHash}`, '_blank')}
                      className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition flex items-center justify-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>View on World Chain</span>
                    </button>
                  )}
                </div>
                
                <div className="text-xs text-gray-500">
                  Storage Status: 
                  {savedMeasurement.status === 'uploading' && <span className="text-yellow-600"> Uploading...</span>}
                  {savedMeasurement.status === 'stored' && <span className="text-green-600"> Stored permanently</span>}
                  {savedMeasurement.status === 'failed' && <span className="text-red-600"> Failed to store</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 