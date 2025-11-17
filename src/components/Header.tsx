import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import AnimatedLogo from '@/components/AnimatedLogo';

interface HeaderProps {
  isAuthenticated: boolean;
  userDisplay?: string;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export default function Header({ isAuthenticated, userDisplay, onLoginClick, onLogoutClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-gradient-to-r from-primary via-secondary to-accent p-4 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AnimatedLogo />
            RunTerritory
          </h1>
          <p className="text-sm opacity-90">Захватывай территории бегом!</p>
        </div>
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">{userDisplay}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogoutClick}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <Icon name="LogOut" size={16} />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onLoginClick}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <Icon name="LogIn" size={16} className="mr-1" />
            Вход
          </Button>
        )}
      </div>
    </header>
  );
}
