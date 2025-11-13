import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

interface Runner {
  id: number;
  name: string;
  totalArea: number;
  territories: number;
  avatar: string;
  rank: number;
}

interface LeaderboardViewComponentProps {
  leaderboard: Runner[];
}

export default function LeaderboardViewComponent({ leaderboard }: LeaderboardViewComponentProps) {
  return (
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
        {leaderboard.map((runner) => (
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
}
