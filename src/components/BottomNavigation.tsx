import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

type View = 'map' | 'run' | 'profile' | 'leaderboard' | 'treadmill';

interface BottomNavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export default function BottomNavigation({ currentView, onViewChange }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1 p-2">
        <Button
          variant={currentView === 'map' ? 'default' : 'ghost'}
          className={`flex flex-col items-center gap-1 h-auto py-2 ${
            currentView === 'map' ? 'bg-primary text-primary-foreground' : ''
          }`}
          onClick={() => onViewChange('map')}
        >
          <Icon name="Map" size={20} />
          <span className="text-xs">Карта</span>
        </Button>
        <Button
          variant={currentView === 'run' ? 'default' : 'ghost'}
          className={`flex flex-col items-center gap-1 h-auto py-2 ${
            currentView === 'run' ? 'bg-primary text-primary-foreground' : ''
          }`}
          onClick={() => onViewChange('run')}
        >
          <Icon name="Activity" size={20} />
          <span className="text-xs">Бежать</span>
        </Button>
        <Button
          variant={currentView === 'leaderboard' ? 'default' : 'ghost'}
          className={`flex flex-col items-center gap-1 h-auto py-2 ${
            currentView === 'leaderboard' ? 'bg-primary text-primary-foreground' : ''
          }`}
          onClick={() => onViewChange('leaderboard')}
        >
          <Icon name="Trophy" size={20} />
          <span className="text-xs">Рейтинг</span>
        </Button>
        <Button
          variant={currentView === 'profile' ? 'default' : 'ghost'}
          className={`flex flex-col items-center gap-1 h-auto py-2 ${
            currentView === 'profile' ? 'bg-primary text-primary-foreground' : ''
          }`}
          onClick={() => onViewChange('profile')}
        >
          <Icon name="User" size={20} />
          <span className="text-xs">Профиль</span>
        </Button>
      </div>
    </nav>
  );
}
