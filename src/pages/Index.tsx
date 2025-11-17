import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import RunDetailModal from '@/components/RunDetailModal';
import TreadmillView from '@/components/TreadmillView';
import MapViewComponent from '@/components/views/MapViewComponent';
import RunViewComponent from '@/components/views/RunViewComponent';
import ProfileViewComponent from '@/components/views/ProfileViewComponent';
import LeaderboardViewComponent from '@/components/views/LeaderboardViewComponent';
import { API_ENDPOINTS } from '@/config/api';

type View = 'map' | 'run' | 'profile' | 'leaderboard' | 'treadmill';
type RunMode = 'outdoor' | 'treadmill';

interface Territory {
  id: number;
  name: string;
  area: number;
  status: 'available' | 'captured' | 'inProgress';
  owner?: string;
}

interface Runner {
  id: number;
  name: string;
  totalArea: number;
  territories: number;
  avatar: string;
  rank: number;
}

interface RunStats {
  distance: number;
  speed: number;
  time: number;
  isRunning: boolean;
  heartRate?: number;
  avgPace?: number;
  calories?: number;
}

interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface RunHistory {
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

const mockTerritories: Territory[] = [
  { id: 1, name: 'Парк Горького', area: 2.5, status: 'available' },
  { id: 2, name: 'Центральный район', area: 5.8, status: 'captured', owner: 'Ты' },
  { id: 3, name: 'Набережная', area: 3.2, status: 'inProgress' },
  { id: 4, name: 'Университетский городок', area: 4.1, status: 'available' },
  { id: 5, name: 'Спортивный квартал', area: 1.9, status: 'captured', owner: 'Алексей М.' },
];

const mockLeaderboard: Runner[] = [
  { id: 1, name: 'Анна К.', totalArea: 18.5, territories: 7, avatar: 'АК', rank: 1 },
  { id: 2, name: 'Дмитрий П.', totalArea: 15.2, territories: 5, avatar: 'ДП', rank: 2 },
  { id: 3, name: 'Ты', totalArea: 12.8, territories: 4, avatar: 'ТЫ', rank: 3 },
  { id: 4, name: 'Елена С.', totalArea: 10.3, territories: 3, avatar: 'ЕС', rank: 4 },
  { id: 5, name: 'Игорь В.', totalArea: 8.7, territories: 3, avatar: 'ИВ', rank: 5 },
];

export default function Index() {
  const { user, token, isAuthenticated, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('map');
  const [runStats, setRunStats] = useState<RunStats>({
    distance: 0,
    speed: 0,
    time: 0,
    isRunning: false,
  });
  const [gpsEnabled, setGpsEnabled] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [positions, setPositions] = useState<GPSPosition[]>([]);
  const [runHistory, setRunHistory] = useState<RunHistory[]>([]);
  const [currentTerritory, setCurrentTerritory] = useState<string>('');
  const [selectedRun, setSelectedRun] = useState<RunHistory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const saveRunToHistory = async (territory: string) => {
    const avgSpeed = runStats.distance > 0 ? (runStats.distance / (runStats.time / 3600)) : 0;
    const avgPace = avgSpeed > 0 ? 60 / avgSpeed : 0;
    const maxSpeed = positions.length > 1 ? Math.max(...positions.map((_, idx) => {
      if (idx === 0) return 0;
      const prev = positions[idx - 1];
      const curr = positions[idx];
      const dist = calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
      const time = (curr.timestamp - prev.timestamp) / 1000 / 3600;
      return time > 0 ? dist / time : 0;
    })) : avgSpeed;
    
    const calories = Math.round(runStats.distance * 65);
    const avgHeartRate = heartRateHistory.length > 0 
      ? Math.round(heartRateHistory.reduce((sum, hr) => sum + hr, 0) / heartRateHistory.length)
      : undefined;

    const newRun: RunHistory = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      territory,
      distance: runStats.distance,
      time: runStats.time,
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
    setCurrentView('treadmill');
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
    setCurrentView('run');
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
      saveRunToHistory(currentTerritory);
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

  const handleRunClick = (run: RunHistory) => {
    setSelectedRun(run);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto pb-20">
        <header className="sticky top-0 z-10 bg-gradient-to-r from-primary via-secondary to-accent p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Icon name="Zap" size={28} />
                RunTerritory
              </h1>
              <p className="text-sm opacity-90">Захватывай территории бегом!</p>
            </div>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">{user?.name || user?.email || user?.phone}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <Icon name="LogOut" size={16} />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Icon name="LogIn" size={16} className="mr-1" />
                Вход
              </Button>
            )}
          </div>
        </header>

        <main className="p-4">
          {currentView === 'map' && (
            <MapViewComponent
              territories={mockTerritories}
              onStartRun={startRun}
              onStartTreadmill={startTreadmillRun}
            />
          )}
          {currentView === 'run' && (
            <RunViewComponent
              positions={positions}
              runStats={runStats}
              gpsEnabled={gpsEnabled}
              gpsError={gpsError}
              onStartRun={() => startRun()}
              onStopRun={stopRun}
            />
          )}
          {currentView === 'treadmill' && (
            <TreadmillView
              distance={runStats.distance}
              speed={runStats.speed}
              time={runStats.time}
              isRunning={runStats.isRunning}
              heartRate={runStats.heartRate}
              avgPace={runStats.avgPace}
              calories={runStats.calories}
              onSpeedChange={updateTreadmillSpeed}
              onStop={stopRun}
            />
          )}
          {currentView === 'profile' && (
            <ProfileViewComponent
              runHistory={runHistory}
              onRunClick={handleRunClick}
            />
          )}
          {currentView === 'leaderboard' && (
            <LeaderboardViewComponent leaderboard={mockLeaderboard} />
          )}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-lg">
          <div className="max-w-md mx-auto grid grid-cols-4 gap-1 p-2">
            <Button
              variant={currentView === 'map' ? 'default' : 'ghost'}
              className={`flex flex-col items-center gap-1 h-auto py-2 ${
                currentView === 'map' ? 'bg-primary text-primary-foreground' : ''
              }`}
              onClick={() => setCurrentView('map')}
            >
              <Icon name="Map" size={20} />
              <span className="text-xs">Карта</span>
            </Button>
            <Button
              variant={currentView === 'run' ? 'default' : 'ghost'}
              className={`flex flex-col items-center gap-1 h-auto py-2 ${
                currentView === 'run' ? 'bg-primary text-primary-foreground' : ''
              }`}
              onClick={() => setCurrentView('run')}
            >
              <Icon name="Activity" size={20} />
              <span className="text-xs">Бежать</span>
            </Button>
            <Button
              variant={currentView === 'leaderboard' ? 'default' : 'ghost'}
              className={`flex flex-col items-center gap-1 h-auto py-2 ${
                currentView === 'leaderboard' ? 'bg-primary text-primary-foreground' : ''
              }`}
              onClick={() => setCurrentView('leaderboard')}
            >
              <Icon name="Trophy" size={20} />
              <span className="text-xs">Рейтинг</span>
            </Button>
            <Button
              variant={currentView === 'profile' ? 'default' : 'ghost'}
              className={`flex flex-col items-center gap-1 h-auto py-2 ${
                currentView === 'profile' ? 'bg-primary text-primary-foreground' : ''
              }`}
              onClick={() => setCurrentView('profile')}
            >
              <Icon name="User" size={20} />
              <span className="text-xs">Профиль</span>
            </Button>
          </div>
        </nav>

        <RunDetailModal 
          run={selectedRun} 
          open={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
        
        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    </div>
  );
}