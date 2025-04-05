"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DataItem {
  type: 'noise' | 'wifi' | 'light';
  timestamp: string;
  data: any;
}

interface CollectedDataContextType {
  collectedData: DataItem[];
  addData: (data: DataItem) => void;
  clearData: () => void;
  getDataByType: (type: string) => DataItem[];
  hasDataOfType: (type: string) => boolean;
}

const CollectedDataContext = createContext<CollectedDataContextType | undefined>(undefined);

export function CollectedDataProvider({ children }: { children: ReactNode }) {
  const [collectedData, setCollectedData] = useState<DataItem[]>([]);

  const addData = (data: DataItem) => {
    setCollectedData(prev => [...prev, data]);
  };

  const clearData = () => {
    setCollectedData([]);
  };

  const getDataByType = (type: string) => {
    return collectedData.filter(item => item.type === type);
  };

  const hasDataOfType = (type: string) => {
    return collectedData.some(item => item.type === type);
  };

  return (
    <CollectedDataContext.Provider value={{ 
      collectedData, 
      addData, 
      clearData, 
      getDataByType,
      hasDataOfType
    }}>
      {children}
    </CollectedDataContext.Provider>
  );
}

export function useCollectedData() {
  const context = useContext(CollectedDataContext);
  if (context === undefined) {
    throw new Error('useCollectedData must be used within a CollectedDataProvider');
  }
  return context;
} 