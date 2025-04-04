"use client";
import { useState, useRef, useEffect } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

export const BackgroundNoiseBlock = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<{ 
    blob: Blob; 
    url: string; 
    timestamp: string;
    duration?: string;
  }[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastVerificationCheck = useRef<number>(0);

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

  // Cleanup function for audio and progress tracking
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const startRecording = async () => {
    // Force check verification before recording
    await checkVerification(true);
    
    if (!isVerified) {
      alert("You need to verify with World ID first!");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const recordedDuration = formatTime(recordingTime);
        
        setRecordings((prev) => [...prev, { 
          blob: audioBlob, 
          url: audioUrl,
          timestamp: formatDate(new Date()),
          duration: recordedDuration
        }]);
        
        // Reset recording time
        setRecordingTime(0);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
      };

      // Start timer for recording
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      
      // Clear recording interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const deleteRecording = (index: number) => {
    // If this recording is currently playing, stop it
    if (playingIndex === index) {
      stopPlaying();
    }
    
    // Update playing index if needed
    if (playingIndex !== null && playingIndex > index) {
      setPlayingIndex(playingIndex - 1);
    }
    
    // Remove the recording by filtering
    setRecordings(prev => prev.filter((_, i) => i !== index));
    
    // Revoke the object URL to free up memory
    URL.revokeObjectURL(recordings[index].url);
  };

  const playRecording = (url: string, index: number) => {
    // Stop any currently playing audio
    stopPlaying();
    
    // Reset progress and time
    setProgress(0);
    setCurrentTime("0:00");
    setDuration("0:00");
    
    // Create and play new audio
    const audio = new Audio(url);
    
    audio.addEventListener('loadedmetadata', () => {
      // Set duration once loaded
      setDuration(formatTime(audio.duration));
      
      // Start tracking progress once audio is loaded
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      progressIntervalRef.current = setInterval(() => {
        if (audio) {
          const currentProgress = (audio.currentTime / audio.duration) * 100;
          setProgress(currentProgress);
          setCurrentTime(formatTime(audio.currentTime));
          
          // If audio finished, clean up
          if (currentProgress >= 100) {
            stopPlaying();
          }
        }
      }, 100);
    });
    
    audio.onended = () => {
      stopPlaying();
    };
    
    audio.onpause = () => {
      setPlayingIndex(null);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
    
    audioRef.current = audio;
    setPlayingIndex(index);
    
    audio.play().catch(err => {
      console.error("Error playing audio:", err);
      stopPlaying();
    });
  };

  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    setPlayingIndex(null);
    setProgress(0);
    setCurrentTime("0:00");
  };

  return (
    <div className="w-full max-w-md p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Background Noise Collector</h2>
      
      {!isVerified && (
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded">
          Please verify with World ID to use this feature
        </div>
      )}
      
      <div className="flex flex-col gap-2 mb-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={!isVerified}
            className={`px-4 py-2 rounded ${
              isVerified 
                ? "bg-blue-500 text-white hover:bg-blue-600" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Collect Noise
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <span className="h-3 w-3 bg-red-500 rounded-full animate-pulse mr-2"></span>
              <span className="text-sm">Recording: {formatTime(recordingTime)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
              <div 
                className="bg-red-500 h-1 rounded-full" 
                style={{ width: `${Math.min((recordingTime / 30) * 100, 100)}%` }}
              ></div>
            </div>
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
              </svg>
              Stop Recording
            </button>
          </div>
        )}
      </div>

      {recordings.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-3">Your Collection:</h3>
          <ul className="space-y-4">
            {recordings.map((recording, index) => (
              <li 
                key={index} 
                className={`p-3 rounded-lg ${playingIndex === index ? 'bg-gray-100 border border-green-300' : 'bg-gray-50'} transition-all duration-300`}
              >
                <div className="mb-2">
                  <h4 className="font-medium">Noise Recording {index + 1}</h4>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <span className="mr-3">Collected: {recording.timestamp}</span>
                    {recording.duration && <span>Length: {recording.duration}</span>}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {playingIndex === index && (
                      <div className="flex items-center space-x-1">
                        <span className="inline-block h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="inline-block h-2 w-2 bg-green-500 rounded-full animate-pulse delay-150"></span>
                        <span className="inline-block h-2 w-2 bg-green-500 rounded-full animate-pulse delay-300"></span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {playingIndex === index ? (
                      <button
                        onClick={stopPlaying}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
                        </svg>
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => playRecording(recording.url, index)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <polygon points="5,3 19,12 5,21" strokeWidth="2" />
                        </svg>
                        Play
                      </button>
                    )}
                    <button
                      onClick={() => deleteRecording(index)}
                      className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
                {playingIndex === index && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-green-500 h-1.5 rounded-full transition-all duration-100" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>{currentTime}</span>
                      <span>{duration}</span>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 