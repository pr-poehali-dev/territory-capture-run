import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface TreadmillViewProps {
  distance: number;
  speed: number;
  time: number;
  isRunning: boolean;
  heartRate?: number;
  avgPace?: number;
  calories?: number;
  onSpeedChange: (speed: number) => void;
  onStop: () => void;
}

export default function TreadmillView({ 
  distance, 
  speed, 
  time, 
  isRunning,
  heartRate,
  avgPace,
  calories,
  onSpeedChange,
  onStop 
}: TreadmillViewProps) {
  const speedPresets = [6.0, 7.0, 8.0, 9.0, 10.0, 12.0];

  const increaseSpeed = () => {
    if (speed < 20) {
      onSpeedChange(Number((speed + 0.5).toFixed(1)));
    }
  };

  const decreaseSpeed = () => {
    if (speed > 1) {
      onSpeedChange(Number((speed - 0.5).toFixed(1)));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <Icon name="Dumbbell" size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Беговая дорожка</h2>
            <p className="text-sm text-muted-foreground">Тренировка в зале</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={decreaseSpeed}
            disabled={!isRunning || speed <= 1}
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full"
          >
            <Icon name="Minus" size={20} />
          </Button>
          
          <div className="text-center">
            <div className="text-5xl font-bold text-primary">{speed.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground mt-1">км/ч</div>
          </div>

          <Button
            onClick={increaseSpeed}
            disabled={!isRunning || speed >= 20}
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full"
          >
            <Icon name="Plus" size={20} />
          </Button>
        </div>

        <div className="grid grid-cols-6 gap-2 mt-4">
          {speedPresets.map((preset) => (
            <Button
              key={preset}
              onClick={() => onSpeedChange(preset)}
              disabled={!isRunning}
              variant={speed === preset ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
            >
              {preset}
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <Icon name="Route" size={24} className="mx-auto mb-2 text-secondary" />
          <div className="text-2xl font-bold text-secondary">
            {distance.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">Расстояние (км)</div>
        </Card>
        
        <Card className="p-4 text-center">
          <Icon name="Clock" size={24} className="mx-auto mb-2 text-accent" />
          <div className="text-2xl font-bold text-accent">
            {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-muted-foreground">Время</div>
        </Card>
      </div>

      {heartRate && heartRate > 0 && (
        <Card className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                <Icon name="Heart" size={24} className="text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600">{heartRate}</div>
                <div className="text-xs text-muted-foreground">уд/мин</div>
              </div>
            </div>
            <div className="text-right">
              <Badge className="bg-red-500">
                {heartRate < 114 ? 'Зона 1' : heartRate < 133 ? 'Зона 2' : heartRate < 152 ? 'Зона 3' : heartRate < 171 ? 'Зона 4' : 'Зона 5'}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">
                {heartRate < 114 ? 'Разминка' : heartRate < 133 ? 'Легкая' : heartRate < 152 ? 'Аэробная' : heartRate < 171 ? 'Пороговая' : 'Максимальная'}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="space-y-3">
          {calories !== undefined && calories > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Icon name="Flame" size={16} />
                Калории
              </span>
              <span className="font-semibold">{calories} ккал</span>
            </div>
          )}
          
          {avgPace !== undefined && avgPace > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Icon name="Activity" size={16} />
                Средний темп
              </span>
              <span className="font-semibold">{avgPace.toFixed(1)} мин/км</span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Icon name="TrendingUp" size={16} />
              Темп бега
            </span>
            <span className="font-semibold">
              {speed < 7 ? 'Легкий' : speed < 10 ? 'Средний' : 'Интенсивный'}
            </span>
          </div>
        </div>
      </Card>

      <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={20} className="text-accent mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Режим беговой дорожки</p>
            <p>Используйте кнопки +/- для изменения скорости во время бега. Расстояние рассчитывается автоматически.</p>
          </div>
        </div>
      </div>

      <Button
        onClick={onStop}
        className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        size="lg"
      >
        <Icon name="Square" size={20} className="mr-2" />
        Завершить тренировку
      </Button>
    </div>
  );
}