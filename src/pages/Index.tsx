import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import RunDetailModal from '@/components/RunDetailModal';
import TreadmillView from '@/components/TreadmillView';
import MapViewComponent from '@/components/views/MapViewComponent';
import RunViewComponent from '@/components/views/RunViewComponent';
import ProfileViewComponent from '@/components/views/ProfileViewComponent';
import LeaderboardViewComponent from '@/components/views/LeaderboardViewComponent';

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
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const savedHistory = localStorage.getItem('runHistory');
    if (savedHistory) {
      try {
        setRunHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load run history', e);
      }
    }
  }, []);

  const saveRunToHistory = (territory: string) => {
    const newRun: RunHistory = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      territory,
      distance: runStats.distance,
      time: runStats.time,
      avgSpeed: runStats.distance > 0 ? (runStats.distance / (runStats.time / 3600)) : 0,
      positions: positions,
    };

    const updatedHistory = [newRun, ...runHistory].slice(0, 50);
    setRunHistory(updatedHistory);
    localStorage.setItem('runHistory', JSON.stringify(updatedHistory));
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

  const startTreadmillRun = () => {
    setRunMode('treadmill');
    setGpsError(null);
    setPositions([]);
    setCurrentTerritory('Беговая дорожка');
    setRunStats({ distance: 0, speed: treadmillSpeed, time: 0, isRunning: true });
    startTimeRef.current = Date.now();
    setCurrentView('treadmill');

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const distanceTraveled = (treadmillSpeed * elapsed) / 3600;
      
      setRunStats((prev) => ({ 
        ...prev, 
        time: elapsed,
        distance: distanceTraveled,
        speed: treadmillSpeed
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
    setCurrentTerritory(territory || 'Неизвестная территория');
    setRunStats({ distance: 0, speed: 0, time: 0, isRunning: true });
    startTimeRef.current = Date.now();
    setCurrentView('run');

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
      setRunStats((prev) => ({ ...prev, time: elapsed }));
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
      saveRunToHistory(currentTerritory);
    }
    
    setRunStats((prev) => ({ ...prev, isRunning: false }));
    setGpsEnabled(false);
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Icon name="Zap" size={28} />
            RunTerritory
          </h1>
          <p className="text-sm opacity-90">Захватывай территории бегом!</p>
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
      </div>
    </div>
  );
}
