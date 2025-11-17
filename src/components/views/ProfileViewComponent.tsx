import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

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

interface ProfileViewComponentProps {
  runHistory: RunHistory[];
  onRunClick: (run: RunHistory) => void;
}

export default function ProfileViewComponent({ runHistory, onRunClick }: ProfileViewComponentProps) {
  const { user, isAuthenticated } = useAuth();
  
  const getUserInitials = () => {
    if (user?.name) {
      const names = user.name.split(' ');
      return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) return user.email[0].toUpperCase();
    if (user?.phone) return user.phone.slice(-2);
    return 'U';
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-20 h-20 bg-gradient-to-br from-primary to-accent">
            <AvatarFallback className="text-2xl font-bold text-white">
              {isAuthenticated ? getUserInitials() : 'ГС'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">
              {isAuthenticated ? (user?.name || 'Твой профиль') : 'Гость'}
            </h2>
            {isAuthenticated && (
              <p className="text-sm text-muted-foreground">
                {user?.email || user?.phone}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-primary">
                <Icon name="Trophy" size={12} className="mr-1" />
                {runHistory.length} пробежек
              </Badge>
              {isAuthenticated && (
                <Badge variant="secondary">
                  <Icon name="Target" size={12} className="mr-1" />
                  Активный
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-3xl font-bold text-primary">
              {runHistory.reduce((sum, run) => sum + run.distance, 0).toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">км пройдено</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-3xl font-bold text-secondary">{runHistory.length}</div>
            <div className="text-sm text-muted-foreground">пробежек</div>
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
          {runHistory.length === 0 ? (
            <Card className="p-4 text-center">
              <Icon name="Calendar" size={32} className="mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">Пока нет пробежек</p>
              <p className="text-xs text-muted-foreground mt-1">Начните бегать, чтобы увидеть историю</p>
            </Card>
          ) : (
            runHistory.slice(0, 10).map((run) => {
              const runDate = new Date(run.date);
              const now = new Date();
              const diffDays = Math.floor((now.getTime() - runDate.getTime()) / (1000 * 60 * 60 * 24));
              
              let dateLabel = '';
              if (diffDays === 0) dateLabel = 'Сегодня';
              else if (diffDays === 1) dateLabel = 'Вчера';
              else if (diffDays < 7) dateLabel = `${diffDays} дня назад`;
              else dateLabel = runDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

              const timeLabel = `${Math.floor(run.time / 60)}:${(run.time % 60).toString().padStart(2, '0')}`;

              return (
                <Card 
                  key={run.id} 
                  className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onRunClick(run)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{run.territory}</div>
                      <div className="text-xs text-muted-foreground">{dateLabel}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-secondary">{run.distance.toFixed(2)} км</div>
                      <div className="text-xs text-muted-foreground">{timeLabel}</div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}