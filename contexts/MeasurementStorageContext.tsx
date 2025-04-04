"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { IPFSMeasurementData } from '../lib/ipfs-service';

// Type for a saved measurement with its IPFS CID and blockchain info
export interface SavedMeasurement {
  cid: string;
  worldChainTxHash?: string;
  timestamp: string;
  data: IPFSMeasurementData;
  status: 'uploading' | 'stored' | 'failed';
  error?: string;
}

// Context type definition
interface MeasurementStorageContextType {
  savedMeasurements: SavedMeasurement[];
  isSaving: boolean;
  saveMeasurement: (measurement: IPFSMeasurementData) => Promise<SavedMeasurement | null>;
  loadMeasurement: (cid: string) => Promise<IPFSMeasurementData | null>;
  clearSavedMeasurements: () => void;
}

// Create the context
const MeasurementStorageContext = createContext<MeasurementStorageContextType | undefined>(undefined);

// Provider component
export function MeasurementStorageProvider({ children }: { children: ReactNode }) {
  const [savedMeasurements, setSavedMeasurements] = useState<SavedMeasurement[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Save a measurement to IPFS and World Chain
  const saveMeasurement = async (measurement: IPFSMeasurementData): Promise<SavedMeasurement | null> => {
    try {
      setIsSaving(true);
      
      // First add a placeholder with 'uploading' status
      const placeholderMeasurement: SavedMeasurement = {
        cid: 'pending',
        timestamp: new Date().toISOString(),
        data: measurement,
        status: 'uploading'
      };
      
      setSavedMeasurements(prev => [...prev, placeholderMeasurement]);
      
      // Call the API to save to IPFS and World Chain
      const response = await fetch('/api/store-measurement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ measurement }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        // Update the placeholder with error
        const failedMeasurement: SavedMeasurement = {
          ...placeholderMeasurement,
          status: 'failed',
          error: result.error || 'Unknown error saving measurement'
        };
        
        setSavedMeasurements(prev => 
          prev.map(m => m === placeholderMeasurement ? failedMeasurement : m)
        );
        
        return null;
      }
      
      // Update with success info
      const savedMeasurement: SavedMeasurement = {
        cid: result.cid,
        worldChainTxHash: result.worldChainTxHash,
        timestamp: new Date().toISOString(),
        data: measurement,
        status: 'stored'
      };
      
      setSavedMeasurements(prev => 
        prev.map(m => m === placeholderMeasurement ? savedMeasurement : m)
      );
      
      // Also store in localStorage for persistence across sessions
      try {
        const storedMeasurements = JSON.parse(localStorage.getItem('savedMeasurements') || '[]');
        localStorage.setItem('savedMeasurements', JSON.stringify([...storedMeasurements, savedMeasurement]));
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
      }
      
      return savedMeasurement;
      
    } catch (error) {
      console.error('Error in saveMeasurement:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Load a measurement from IPFS by CID
  const loadMeasurement = async (cid: string): Promise<IPFSMeasurementData | null> => {
    try {
      const response = await fetch(`/api/get-measurement?cid=${cid}`);
      const result = await response.json();
      
      if (!result.success) {
        console.error('Error loading measurement:', result.error);
        return null;
      }
      
      return result.data;
    } catch (error) {
      console.error('Error in loadMeasurement:', error);
      return null;
    }
  };

  // Clear all saved measurements
  const clearSavedMeasurements = () => {
    setSavedMeasurements([]);
    localStorage.removeItem('savedMeasurements');
  };

  // Load saved measurements from localStorage on initial mount
  React.useEffect(() => {
    try {
      const storedMeasurements = JSON.parse(localStorage.getItem('savedMeasurements') || '[]');
      if (Array.isArray(storedMeasurements) && storedMeasurements.length > 0) {
        setSavedMeasurements(storedMeasurements);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, []);

  // Context value
  const contextValue: MeasurementStorageContextType = {
    savedMeasurements,
    isSaving,
    saveMeasurement,
    loadMeasurement,
    clearSavedMeasurements
  };

  return (
    <MeasurementStorageContext.Provider value={contextValue}>
      {children}
    </MeasurementStorageContext.Provider>
  );
}

// Custom hook to use the context
export function useMeasurementStorage() {
  const context = useContext(MeasurementStorageContext);
  if (context === undefined) {
    throw new Error('useMeasurementStorage must be used within a MeasurementStorageProvider');
  }
  return context;
} 