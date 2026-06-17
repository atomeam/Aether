import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CrewInfo {
  agentId: string;
  crew: string;
  status: string;
  lastHeartbeat: string;
  roomId: string;
}

interface CrewContextType {
  activeCrew: string;
  setActiveCrew: (crew: string) => void;
  crews: CrewInfo[];
  setCrews: (crews: CrewInfo[]) => void;
  addCrew: (crew: CrewInfo) => void;
  updateCrewStatus: (agentId: string, status: string) => void;
}

const CrewContext = createContext<CrewContextType | undefined>(undefined);

export function CrewProvider({ children }: { children: ReactNode }) {
  const [activeCrew, setActiveCrew] = useState<string>('infrastructure');
  const [crews, setCrews] = useState<CrewInfo[]>([
    {
      agentId: 'ci-medic-001',
      crew: 'infrastructure',
      status: 'idle',
      lastHeartbeat: new Date().toISOString(),
      roomId: 'ci-medic-telemetry'
    },
    {
      agentId: 'trade-monitor-001',
      crew: 'trading',
      status: 'idle',
      lastHeartbeat: new Date().toISOString(),
      roomId: 'trading-telemetry'
    }
  ]);

  const addCrew = (crew: CrewInfo) => {
    setCrews(prev => [...prev, crew]);
  };

  const updateCrewStatus = (agentId: string, status: string) => {
    setCrews(prev => 
      prev.map(crew => 
        crew.agentId === agentId 
          ? { ...crew, status, lastHeartbeat: new Date().toISOString() }
          : crew
      )
    );
  };

  return (
    <CrewContext.Provider value={{
      activeCrew,
      setActiveCrew,
      crews,
      setCrews,
      addCrew,
      updateCrewStatus
    }}>
      {children}
    </CrewContext.Provider>
  );
}

export function useCrew() {
  const context = useContext(CrewContext);
  if (context === undefined) {
    throw new Error('useCrew must be used within a CrewProvider');
  }
  return context;
}