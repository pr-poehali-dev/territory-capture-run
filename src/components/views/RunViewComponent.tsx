import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import MapView from '@/components/MapView';

interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface RunStats {
  distance: number;
  speed: number;
  time: number;
  isRunning: boolean;
}

interface RunViewComponentProps {
  positions: GPSPosition[];
  runStats: RunStats;
  gpsEnabled: boolean;
  gpsError: string | null;
  onStartRun: () => void;
  onStopRun: () => void;
}

export default function RunViewComponent({
  positions,
  runStats,
  gpsEnabled,
  gpsError,
  onStartRun,
  onStopRun,
}: RunViewComponentProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {positions.length > 0 ? (
        <MapView positions={positions} isRunning={runStats.isRunning} />
      ) : (
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
      )}

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
          Цель: 3 км для захвата территории (любая активность засчитывается)
        </p>
      </Card>

      {runStats.isRunning ? (
        <Button
          onClick={onStopRun}
          className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          size="lg"
        >
          <Icon name="Square" size={20} className="mr-2" />
          Завершить пробежку
        </Button>
      ) : (
        <Button onClick={onStartRun} className="w-full bg-primary hover:bg-primary/90" size="lg">
          <Icon name="Play" size={20} className="mr-2" />
          Начать пробежку
        </Button>
      )}
    </div>
  );
}