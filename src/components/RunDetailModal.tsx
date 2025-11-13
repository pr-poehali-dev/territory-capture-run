import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import MapView from './MapView';
import RunStatsCard from './RunStatsCard';

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

interface RunDetailModalProps {
  run: RunHistory | null;
  open: boolean;
  onClose: () => void;
}

export default function RunDetailModal({ run, open, onClose }: RunDetailModalProps) {
  if (!run) return null;

  const runDate = new Date(run.date);
  const timeLabel = `${Math.floor(run.time / 60)}:${(run.time % 60).toString().padStart(2, '0')}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Route" size={24} className="text-primary" />
            {run.territory}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {runDate.toLocaleDateString('ru-RU', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>

          {run.positions.length > 0 && (
            <MapView positions={run.positions} isRunning={false} />
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-secondary/10 rounded-lg">
              <Icon name="Route" size={20} className="mx-auto mb-1 text-secondary" />
              <div className="text-xl font-bold text-secondary">{run.distance.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">км</div>
            </div>
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <Icon name="Clock" size={20} className="mx-auto mb-1 text-primary" />
              <div className="text-xl font-bold text-primary">{timeLabel}</div>
              <div className="text-xs text-muted-foreground">время</div>
            </div>
            <div className="text-center p-3 bg-accent/10 rounded-lg">
              <Icon name="Gauge" size={20} className="mx-auto mb-1 text-accent" />
              <div className="text-xl font-bold text-accent">{run.avgSpeed.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">км/ч</div>
            </div>
          </div>

          <RunStatsCard
            avgPace={run.avgPace}
            avgHeartRate={run.avgHeartRate}
            maxSpeed={run.maxSpeed}
            calories={run.calories}
            heartRateZones={run.heartRateZones}
          />

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-muted-foreground flex items-center gap-2">
                <Icon name="MapPin" size={16} />
                GPS точек
              </span>
              <span className="font-semibold">{run.positions.length}</span>
            </div>
            {run.positions.length > 0 && (
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Icon name="Target" size={16} />
                  Точность
                </span>
                <span className="font-semibold">
                  {(run.positions.reduce((sum, p) => sum + p.accuracy, 0) / run.positions.length).toFixed(0)} м
                </span>
              </div>
            )}
          </div>

          <Button onClick={onClose} className="w-full">
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}