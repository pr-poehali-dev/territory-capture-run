import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';

interface RunStatsCardProps {
  avgPace?: number;
  avgHeartRate?: number;
  maxSpeed?: number;
  calories?: number;
  heartRateZones?: {
    zone1: number;
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
}

export default function RunStatsCard({ 
  avgPace, 
  avgHeartRate, 
  maxSpeed,
  calories,
  heartRateZones 
}: RunStatsCardProps) {
  const getHeartRateZoneColor = (zone: number): string => {
    switch (zone) {
      case 1: return 'bg-gray-400';
      case 2: return 'bg-blue-400';
      case 3: return 'bg-green-500';
      case 4: return 'bg-yellow-500';
      case 5: return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getHeartRateZoneName = (zone: number): string => {
    switch (zone) {
      case 1: return 'Разминка (50-60%)';
      case 2: return 'Легкая (60-70%)';
      case 3: return 'Аэробная (70-80%)';
      case 4: return 'Пороговая (80-90%)';
      case 5: return 'Максимальная (90-100%)';
      default: return '';
    }
  };

  const getHeartRateZoneDescription = (zone: number): string => {
    switch (zone) {
      case 1: return 'Восстановление, разминка';
      case 2: return 'Жиросжигание, выносливость';
      case 3: return 'Улучшение работы сердца';
      case 4: return 'Повышение производительности';
      case 5: return 'Максимальная нагрузка';
      default: return '';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Icon name="Activity" size={20} className="text-primary" />
          Подробная статистика
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {avgPace !== undefined && avgPace > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Gauge" size={16} className="text-secondary" />
                <span className="text-xs text-muted-foreground">Средний темп</span>
              </div>
              <div className="text-xl font-bold text-secondary">
                {avgPace.toFixed(1)} <span className="text-sm">мин/км</span>
              </div>
            </div>
          )}
          
          {maxSpeed !== undefined && maxSpeed > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Zap" size={16} className="text-primary" />
                <span className="text-xs text-muted-foreground">Макс. скорость</span>
              </div>
              <div className="text-xl font-bold text-primary">
                {maxSpeed.toFixed(1)} <span className="text-sm">км/ч</span>
              </div>
            </div>
          )}
          
          {calories !== undefined && calories > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Flame" size={16} className="text-orange-500" />
                <span className="text-xs text-muted-foreground">Калории</span>
              </div>
              <div className="text-xl font-bold text-orange-500">
                {calories} <span className="text-sm">ккал</span>
              </div>
            </div>
          )}
          
          {avgHeartRate !== undefined && avgHeartRate > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Heart" size={16} className="text-red-500" />
                <span className="text-xs text-muted-foreground">Средний пульс</span>
              </div>
              <div className="text-xl font-bold text-red-500">
                {avgHeartRate} <span className="text-sm">уд/мин</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {heartRateZones && (
        <Card className="p-4">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Icon name="Heart" size={20} className="text-red-500" />
            Пульсовые зоны
          </h3>
          
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((zone) => {
              const percentage = heartRateZones[`zone${zone}` as keyof typeof heartRateZones];
              if (percentage === 0) return null;
              
              return (
                <div key={zone}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getHeartRateZoneColor(zone)}`}></div>
                      <span className="text-sm font-medium">{getHeartRateZoneName(zone)}</span>
                    </div>
                    <span className="text-sm font-bold">{percentage}%</span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2" 
                    style={{
                      // @ts-ignore
                      '--progress-background': getHeartRateZoneColor(zone).replace('bg-', '')
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{getHeartRateZoneDescription(zone)}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} className="text-accent mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Пульсовые зоны помогают оптимизировать тренировки. Зона 2-3 идеальна для развития выносливости, 
                зона 4-5 для интенсивных интервальных тренировок.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
