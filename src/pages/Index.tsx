import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

type View = 'map' | 'run' | 'profile' | 'leaderboard';

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
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

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

  const startRun = () => {
    if (!navigator.geolocation) {
      setGpsError('GPS не поддерживается вашим устройством');
      return;
    }

    setGpsError(null);
    setPositions([]);
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
    setRunStats((prev) => ({ ...prev, isRunning: false }));
    setGpsEnabled(false);
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

  const renderMapView = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="relative h-[300px] bg-gradient-to-br from-secondary/20 to-accent/20 rounded-xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon name="MapPin" size={64} className="text-primary opacity-50" />
        </div>
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-white/90">
            <Icon name="MapPin" size={14} className="mr-1" />
            Москва
          </Badge>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <Icon name="Flag" size={24} className="text-primary" />
          Доступные территории
        </h2>
        <div className="space-y-2">
          {mockTerritories.map((territory) => (
            <Card
              key={territory.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{territory.name}</h3>
                    {territory.status === 'captured' && (
                      <Badge variant="secondary" className="bg-accent text-accent-foreground">
                        <Icon name="Check" size={12} className="mr-1" />
                        Захвачено
                      </Badge>
                    )}
                    {territory.status === 'inProgress' && (
                      <Badge className="bg-primary text-primary-foreground">
                        <Icon name="Activity" size={12} className="mr-1" />
                        В процессе
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Icon name="Maximize2" size={14} />
                      {territory.area} км²
                    </span>
                    {territory.owner && (
                      <span className="flex items-center gap-1">
                        <Icon name="User" size={14} />
                        {territory.owner}
                      </span>
                    )}
                  </div>
                </div>
                {territory.status === 'available' && (
                  <Button onClick={startRun} className="bg-primary hover:bg-primary/90">
                    <Icon name="Play" size={16} className="mr-2" />
                    Начать
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRunView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="relative h-[200px] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl overflow-hidden flex items-center justify-center">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center relative">
              {runStats.isRunning && (
                <>
                  <div className="absolute inset-0 rounded-full bg-primary animate-pulse-ring"></div>
                  <div className="absolute inset-0 rounded-full bg-primary animate-pulse-ring animation-delay-1000"></div>
                </>
              )}
              <Icon name="Activity" size={40} className="text-white z-10" />
            </div>
          </div>
        </div>
      </div>

      {gpsError && (
        <Card className="p-4 bg-destructive/10 border-destructive">
          <div className="flex items-center gap-2 text-destructive">
            <Icon name="AlertCircle" size={20} />
            <span className="text-sm font-medium">{gpsError}</span>
          </div>
        </Card>
      )}

      {gpsEnabled && (
        <Card className="p-3 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 text-green-700">
            <Icon name="Satellite" size={16} />
            <span className="text-xs font-medium">GPS активен • Точность: {positions[positions.length - 1]?.accuracy.toFixed(0)} м</span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <Icon name="Route" size={24} className="mx-auto mb-2 text-secondary" />
          <div className="text-2xl font-bold text-secondary">
            {runStats.distance.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">Расстояние (км)</div>
        </Card>
        <Card className="p-4 text-center">
          <Icon name="Gauge" size={24} className="mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold text-primary">
            {runStats.speed.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">Скорость (км/ч)</div>
        </Card>
        <Card className="p-4 text-center">
          <Icon name="Clock" size={24} className="mx-auto mb-2 text-accent" />
          <div className="text-2xl font-bold text-accent">
            {Math.floor(runStats.time / 60)}:{(runStats.time % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-muted-foreground">Время</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Прогресс захвата</span>
          <span className="text-sm text-muted-foreground">
            {Math.min(Math.round((runStats.distance / 3) * 100), 100)}%
          </span>
        </div>
        <Progress value={runStats.distance > 0 ? Math.min((runStats.distance / 3) * 100, 100) : 0} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          Цель: 3 км для захвата территории (скорость от 7 км/ч)
        </p>
      </Card>

      {runStats.isRunning ? (
        <Button
          onClick={stopRun}
          className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          size="lg"
        >
          <Icon name="Square" size={20} className="mr-2" />
          Завершить пробежку
        </Button>
      ) : (
        <Button onClick={startRun} className="w-full bg-primary hover:bg-primary/90" size="lg">
          <Icon name="Play" size={20} className="mr-2" />
          Начать пробежку
        </Button>
      )}
    </div>
  );

  const renderProfileView = () => (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-20 h-20 bg-gradient-to-br from-primary to-accent">
            <AvatarFallback className="text-2xl font-bold text-white">ТЫ</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">Твой профиль</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-primary">
                <Icon name="Trophy" size={12} className="mr-1" />
                Ранг 3
              </Badge>
              <Badge variant="secondary">
                <Icon name="Target" size={12} className="mr-1" />
                Активный
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-3xl font-bold text-primary">12.8</div>
            <div className="text-sm text-muted-foreground">км² захвачено</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-3xl font-bold text-secondary">4</div>
            <div className="text-sm text-muted-foreground">территории</div>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Icon name="Award" size={20} className="text-accent" />
          Достижения
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: 'Medal', name: 'Первая территория', unlocked: true },
            { icon: 'Flame', name: 'Серия: 7 дней', unlocked: true },
            { icon: 'Target', name: '10 км²', unlocked: false },
            { icon: 'Zap', name: 'Спринтер', unlocked: true },
            { icon: 'Mountain', name: 'Покоритель', unlocked: false },
            { icon: 'Crown', name: 'Чемпион', unlocked: false },
          ].map((achievement, idx) => (
            <Card
              key={idx}
              className={`p-3 text-center ${
                achievement.unlocked ? 'bg-gradient-to-br from-primary/10 to-accent/10' : 'opacity-50'
              }`}
            >
              <Icon
                name={achievement.icon as any}
                size={32}
                className={`mx-auto mb-2 ${
                  achievement.unlocked ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <div className="text-xs font-medium">{achievement.name}</div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Icon name="History" size={20} className="text-secondary" />
          История пробежек
        </h3>
        <div className="space-y-2">
          {[
            { date: 'Сегодня', territory: 'Центральный район', distance: 5.8, time: '42:15' },
            { date: 'Вчера', territory: 'Набережная', distance: 3.2, time: '24:30' },
            { date: '2 дня назад', territory: 'Парк Горького', distance: 2.5, time: '18:45' },
          ].map((run, idx) => (
            <Card key={idx} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{run.territory}</div>
                  <div className="text-xs text-muted-foreground">{run.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-secondary">{run.distance} км</div>
                  <div className="text-xs text-muted-foreground">{run.time}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLeaderboardView = () => (
    <div className="space-y-4 animate-fade-in">
      <Card className="p-4 bg-gradient-to-r from-primary to-accent text-white">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Icon name="Trophy" size={24} />
          Недельный рейтинг
        </h2>
        <p className="text-sm opacity-90">До конца сезона: 3 дня 12 часов</p>
        <Progress value={70} className="h-2 mt-2 bg-white/30" />
      </Card>

      <div className="space-y-2">
        {mockLeaderboard.map((runner) => (
          <Card
            key={runner.id}
            className={`p-4 transition-all ${
              runner.name === 'Ты'
                ? 'border-2 border-primary shadow-lg scale-105'
                : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  runner.rank === 1
                    ? 'bg-yellow-500 text-white'
                    : runner.rank === 2
                    ? 'bg-gray-400 text-white'
                    : runner.rank === 3
                    ? 'bg-orange-600 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {runner.rank}
              </div>
              <Avatar className="w-12 h-12 bg-gradient-to-br from-secondary to-accent">
                <AvatarFallback className="text-white font-bold">{runner.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-bold">{runner.name}</div>
                <div className="text-sm text-muted-foreground">
                  {runner.territories} территорий
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">{runner.totalArea}</div>
                <div className="text-xs text-muted-foreground">км²</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-accent/10 border-accent">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="Gift" size={20} className="text-accent" />
          <h3 className="font-bold">Награды сезона</h3>
        </div>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Icon name="Medal" size={14} />
            1 место: Годовая подписка на спортивный зал
          </li>
          <li className="flex items-center gap-2">
            <Icon name="Medal" size={14} />
            2 место: Фитнес-трекер премиум-класса
          </li>
          <li className="flex items-center gap-2">
            <Icon name="Medal" size={14} />
            3 место: Набор спортивной экипировки
          </li>
        </ul>
      </Card>
    </div>
  );

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
          {currentView === 'map' && renderMapView()}
          {currentView === 'run' && renderRunView()}
          {currentView === 'profile' && renderProfileView()}
          {currentView === 'leaderboard' && renderLeaderboardView()}
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
      </div>
    </div>
  );
}