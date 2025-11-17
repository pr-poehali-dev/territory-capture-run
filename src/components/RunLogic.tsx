import { useState, useRef, useEffect } from 'react';

export interface RunStats {
  distance: number;
  speed: number;
  time: number;
  isRunning: boolean;
  heartRate?: number;
  avgPace?: number;
  calories?: number;
}

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export type RunMode = 'outdoor' | 'treadmill';

interface UseRunLogicReturn {
  runStats: RunStats;
  gpsEnabled: boolean;
  gpsError: string | null;
  positions: GPSPosition[];
  runMode: RunMode;
  treadmillSpeed: number;
  heartRate: number;
  heartRateHistory: number[];
  currentZone: number;
  lastAnnouncement: string;
  currentTerritory: string;
  startRun: (territory?: string) => void;
  startTreadmillRun: () => void;
  stopRun: () => void;
  updateTreadmillSpeed: (newSpeed: number) => void;
}

export const useRunLogic = (
  onRunComplete: (territory: string, stats: RunStats, positions: GPSPosition[], heartRateHistory: number[]) => void
): UseRunLogicReturn => {
  const [runStats, setRunStats] = useState<RunStats>({
    distance: 0,
    speed: 0,
    time: 0,
    isRunning: false,
  });
  const [gpsEnabled, setGpsEnabled] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [positions, setPositions] = useState<GPSPosition[]>([]);
  const [currentTerritory, setCurrentTerritory] = useState<string>('');
  const [runMode, setRunMode] = useState<RunMode>('outdoor');
  const [treadmillSpeed, setTreadmillSpeed] = useState<number>(8.0);
  const [heartRate, setHeartRate] = useState<number>(0);
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>([]);
  const [currentZone, setCurrentZone] = useState<number>(0);
  const [lastAnnouncement, setLastAnnouncement] = useState<string>('');
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastZoneRef = useRef<number>(0);
  const speechEnabledRef = useRef<boolean>(true);

  const speak = (text: string) => {
    if (!speechEnabledRef.current || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
    setLastAnnouncement(text);
  };

  const getZoneFromHeartRate = (hr: number): number => {
    if (hr < 114) return 1;
    if (hr < 133) return 2;
    if (hr < 152) return 3;
    if (hr < 171) return 4;
    return 5;
  };

  const getZoneName = (zone: number): string => {
    const names = [
      'разминка',
      'лёгкая зона',
      'аэробная зона', 
      'анаэробная зона',
      'максимальная зона'
    ];
    return names[zone - 1] || 'неизвестная зона';
  };

  const checkHeartRateZoneChange = (hr: number) => {
    const newZone = getZoneFromHeartRate(hr);
    setCurrentZone(newZone);
    
    if (lastZoneRef.current !== 0 && newZone !== lastZoneRef.current) {
      const zoneName = getZoneName(newZone);
      speak(`Переход в ${zoneName}. Пульс ${hr}.`);
    }
    lastZoneRef.current = newZone;
  };

  const checkDistanceMilestones = (distance: number) => {
    const km = Math.floor(distance);
    if (km > 0 && distance >= km && distance < km + 0.01) {
      speak(`Пройден ${km} километр!`);
    }
    
    if (distance >= 3 && distance < 3.01) {
      speak('Цель достигнута! Три километра пройдено!');
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

  const simulateHeartRate = (speed: number, time: number): number => {
    const baseHR = 70;
    const maxHR = 190;
    const speedFactor = Math.min(speed / 15, 1);
    const timeFactor = Math.min(time / 1800, 0.3);
    const targetHR = baseHR + (maxHR - baseHR) * speedFactor + 20 * timeFactor;
    const variation = (Math.random() - 0.5) * 10;
    return Math.round(Math.max(60, Math.min(maxHR, targetHR + variation)));
  };

  const startTreadmillRun = () => {
    setRunMode('treadmill');
    setGpsError(null);
    setPositions([]);
    setHeartRateHistory([]);
    setCurrentZone(0);
    lastZoneRef.current = 0;
    setCurrentTerritory('Беговая дорожка');
    setRunStats({ distance: 0, speed: treadmillSpeed, time: 0, isRunning: true });
    startTimeRef.current = Date.now();
    speak('Тренировка на беговой дорожке начата. Удачи!');

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const distanceTraveled = (treadmillSpeed * elapsed) / 3600;
      const hr = simulateHeartRate(treadmillSpeed, elapsed);
      
      setHeartRate(hr);
      setHeartRateHistory(prev => [...prev, hr]);
      checkHeartRateZoneChange(hr);
      checkDistanceMilestones(distanceTraveled);
      
      setRunStats((prev) => ({ 
        ...prev, 
        time: elapsed,
        distance: distanceTraveled,
        speed: treadmillSpeed,
        heartRate: hr,
        avgPace: treadmillSpeed > 0 ? 60 / treadmillSpeed : 0,
        calories: Math.round(distanceTraveled * 65)
      }));
    }, 1000);
  };

  const startRun = (territory?: string) => {
    setRunMode('outdoor');
    
    if (!navigator.geolocation) {
      setGpsError('GPS не поддерживается вашим устройством');
      return;
    }

    setGpsError(null);
    setPositions([]);
    setHeartRateHistory([]);
    setCurrentZone(0);
    lastZoneRef.current = 0;
    setCurrentTerritory(territory || 'Неизвестная территория');
    setRunStats({ distance: 0, speed: 0, time: 0, isRunning: true });
    startTimeRef.current = Date.now();
    speak('Пробежка начата. Поехали!');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setGpsEnabled(true);
        const newPos: GPSPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        setPositions((prev) => {
          const updated = [...prev, newPos];
          
          if (updated.length >= 2) {
            const lastPos = updated[updated.length - 2];
            const dist = calculateDistance(
              lastPos.latitude,
              lastPos.longitude,
              newPos.latitude,
              newPos.longitude
            );

            const totalDistance = updated.reduce((acc, pos, idx) => {
              if (idx === 0) return 0;
              const prevPos = updated[idx - 1];
              return acc + calculateDistance(
                prevPos.latitude,
                prevPos.longitude,
                pos.latitude,
                pos.longitude
              );
            }, 0);

            const timeDiff = (newPos.timestamp - lastPos.timestamp) / 1000 / 3600;
            const speed = timeDiff > 0 ? dist / timeDiff : 0;

            setRunStats((prev) => ({
              ...prev,
              distance: totalDistance,
              speed: speed,
            }));
            
            checkDistanceMilestones(totalDistance);
          }

          return updated;
        });
      },
      (error) => {
        setGpsEnabled(false);
        setGpsError(
          error.code === 1
            ? 'Доступ к GPS запрещен. Разрешите доступ к геолокации.'
            : error.code === 2
            ? 'GPS недоступен. Проверьте настройки устройства.'
            : 'Тайм-аут GPS. Попробуйте снова.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const hr = simulateHeartRate(runStats.speed, elapsed);
      setHeartRate(hr);
      setHeartRateHistory(prev => [...prev, hr]);
      checkHeartRateZoneChange(hr);
      setRunStats((prev) => ({ 
        ...prev, 
        time: elapsed,
        heartRate: hr,
        avgPace: prev.speed > 0 ? 60 / prev.speed : 0,
        calories: Math.round(prev.distance * 65)
      }));
    }, 1000);
  };

  const stopRun = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (runStats.distance > 0) {
      const finalDistance = runStats.distance.toFixed(2);
      const finalTime = Math.floor(runStats.time / 60);
      speak(`Пробежка завершена! Дистанция ${finalDistance} километров. Время ${finalTime} минут. Отличная работа!`);
      onRunComplete(currentTerritory, runStats, positions, heartRateHistory);
    }
    
    setRunStats((prev) => ({ ...prev, isRunning: false }));
    setGpsEnabled(false);
    setCurrentZone(0);
    lastZoneRef.current = 0;
  };

  const updateTreadmillSpeed = (newSpeed: number) => {
    setTreadmillSpeed(newSpeed);
    if (runStats.isRunning && runMode === 'treadmill') {
      setRunStats((prev) => ({ ...prev, speed: newSpeed }));
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    runStats,
    gpsEnabled,
    gpsError,
    positions,
    runMode,
    treadmillSpeed,
    heartRate,
    heartRateHistory,
    currentZone,
    lastAnnouncement,
    currentTerritory,
    startRun,
    startTreadmillRun,
    stopRun,
    updateTreadmillSpeed,
  };
};
