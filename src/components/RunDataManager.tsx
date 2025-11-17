import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS } from '@/config/api';
import type { RunStats, GPSPosition } from './RunLogic';

export interface RunHistory {
  id: string;
  date: string;
  territory: string;
  distance: number;
  time: number;
  avgSpeed: number;
  positions: GPSPosition[];
  avgPace: number;
  maxSpeed: number;
  calories: number;
  avgHeartRate?: number;
  heartRateZones?: {
    zone1: number;
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
}

interface UseRunDataManagerReturn {
  runHistory: RunHistory[];
  saveRunToHistory: (territory: string, stats: RunStats, positions: GPSPosition[], heartRateHistory: number[]) => Promise<void>;
}

export const useRunDataManager = (): UseRunDataManagerReturn => {
  const { isAuthenticated, token } = useAuth();
  const [runHistory, setRunHistory] = useState<RunHistory[]>([]);

  useEffect(() => {
    if (isAuthenticated && token) {
      loadRunsFromServer();
    } else {
      const savedHistory = localStorage.getItem('runHistory');
      if (savedHistory) {
        try {
          setRunHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to load run history', e);
        }
      }
    }
  }, [isAuthenticated, token]);

  const loadRunsFromServer = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.runs, {
        method: 'GET',
        headers: {
          'X-Auth-Token': token
        }
      });
      
      const data = await response.json();
      if (data.success && data.runs) {
        setRunHistory(data.runs);
      }
    } catch (error) {
      console.error('Failed to load runs from server:', error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateHeartRateZones = (hrHistory: number[]) => {
    if (hrHistory.length === 0) return undefined;
    
    const zones = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
    hrHistory.forEach(hr => {
      if (hr < 114) zones.zone1++;
      else if (hr < 133) zones.zone2++;
      else if (hr < 152) zones.zone3++;
      else if (hr < 171) zones.zone4++;
      else zones.zone5++;
    });
    
    const total = hrHistory.length;
    return {
      zone1: Math.round((zones.zone1 / total) * 100),
      zone2: Math.round((zones.zone2 / total) * 100),
      zone3: Math.round((zones.zone3 / total) * 100),
      zone4: Math.round((zones.zone4 / total) * 100),
      zone5: Math.round((zones.zone5 / total) * 100),
    };
  };

  const saveRunToHistory = async (territory: string, stats: RunStats, positions: GPSPosition[], heartRateHistory: number[]) => {
    const avgSpeed = stats.distance > 0 ? (stats.distance / (stats.time / 3600)) : 0;
    const avgPace = avgSpeed > 0 ? 60 / avgSpeed : 0;
    const maxSpeed = positions.length > 1 ? Math.max(...positions.map((_, idx) => {
      if (idx === 0) return 0;
      const prev = positions[idx - 1];
      const curr = positions[idx];
      const dist = calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
      const time = (curr.timestamp - prev.timestamp) / 1000 / 3600;
      return time > 0 ? dist / time : 0;
    })) : avgSpeed;
    
    const calories = Math.round(stats.distance * 65);
    const avgHeartRate = heartRateHistory.length > 0 
      ? Math.round(heartRateHistory.reduce((sum, hr) => sum + hr, 0) / heartRateHistory.length)
      : undefined;

    const newRun: RunHistory = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      territory,
      distance: stats.distance,
      time: stats.time,
      avgSpeed,
      avgPace,
      maxSpeed,
      calories,
      avgHeartRate,
      heartRateZones: calculateHeartRateZones(heartRateHistory),
      positions: positions,
    };

    const updatedHistory = [newRun, ...runHistory].slice(0, 50);
    setRunHistory(updatedHistory);
    
    if (isAuthenticated && token) {
      try {
        await fetch(API_ENDPOINTS.runs, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token
          },
          body: JSON.stringify({
            territory: newRun.territory,
            distance: newRun.distance,
            time: newRun.time,
            avgSpeed: newRun.avgSpeed,
            avgPace: newRun.avgPace,
            maxSpeed: newRun.maxSpeed,
            calories: newRun.calories,
            avgHeartRate: newRun.avgHeartRate,
            heartRateZones: newRun.heartRateZones,
            positions: newRun.positions
          })
        });
      } catch (error) {
        console.error('Failed to save run to server:', error);
      }
    } else {
      localStorage.setItem('runHistory', JSON.stringify(updatedHistory));
    }
  };

  return {
    runHistory,
    saveRunToHistory,
  };
};
