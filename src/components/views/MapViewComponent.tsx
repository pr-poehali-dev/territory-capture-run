import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Territory {
  id: number;
  name: string;
  area: number;
  status: 'available' | 'captured' | 'inProgress';
  owner?: string;
}

interface MapViewComponentProps {
  territories: Territory[];
  onStartRun: (territoryName: string) => void;
  onStartTreadmill: () => void;
}

export default function MapViewComponent({ 
  territories, 
  onStartRun, 
  onStartTreadmill 
}: MapViewComponentProps) {
  return (
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

      <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Icon name="Dumbbell" size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold">Беговая дорожка</h3>
              <p className="text-sm text-muted-foreground">Тренировка в зале</p>
            </div>
          </div>
          <Button onClick={onStartTreadmill} className="bg-primary hover:bg-primary/90">
            <Icon name="Play" size={16} className="mr-2" />
            Начать
          </Button>
        </div>
      </Card>

      <div>
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <Icon name="Flag" size={24} className="text-primary" />
          Доступные территории
        </h2>
        <div className="space-y-2">
          {territories.map((territory) => (
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
                  <Button onClick={() => onStartRun(territory.name)} className="bg-primary hover:bg-primary/90">
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
}
