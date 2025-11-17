import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import RunDetailModal from '@/components/RunDetailModal';
import TreadmillView from '@/components/TreadmillView';
import MapViewComponent from '@/components/views/MapViewComponent';
import RunViewComponent from '@/components/views/RunViewComponent';
import ProfileViewComponent from '@/components/views/ProfileViewComponent';
import LeaderboardViewComponent from '@/components/views/LeaderboardViewComponent';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { useRunLogic } from '@/components/RunLogic';
import { useRunDataManager, type RunHistory } from '@/components/RunDataManager';

type View = 'map' | 'run' | 'profile' | 'leaderboard' | 'treadmill';

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
  const { user, isAuthenticated, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('map');
  const [selectedRun, setSelectedRun] = useState<RunHistory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { runHistory, saveRunToHistory } = useRunDataManager();

  const {
    runStats,
    gpsEnabled,
    gpsError,
    positions,
    runMode,
    startRun,
    startTreadmillRun,
    stopRun,
    updateTreadmillSpeed,
  } = useRunLogic((territory, stats, positions, heartRateHistory) => {
    saveRunToHistory(territory, stats, positions, heartRateHistory);
  });

  const handleRunClick = (run: RunHistory) => {
    setSelectedRun(run);
    setIsModalOpen(true);
  };

  const handleStartRun = (territory?: string) => {
    startRun(territory);
    setCurrentView('run');
  };

  const handleStartTreadmill = () => {
    startTreadmillRun();
    setCurrentView('treadmill');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto pb-20">
        <Header
          isAuthenticated={isAuthenticated}
          userDisplay={user?.name || user?.email || user?.phone}
          onLoginClick={() => setIsAuthModalOpen(true)}
          onLogoutClick={logout}
        />

        <main className="p-4">
          {currentView === 'map' && (
            <MapViewComponent
              territories={mockTerritories}
              onStartRun={handleStartRun}
              onStartTreadmill={handleStartTreadmill}
            />
          )}
          {currentView === 'run' && (
            <RunViewComponent
              positions={positions}
              runStats={runStats}
              gpsEnabled={gpsEnabled}
              gpsError={gpsError}
              onStartRun={() => startRun()}
              onStopRun={stopRun}
            />
          )}
          {currentView === 'treadmill' && (
            <TreadmillView
              distance={runStats.distance}
              speed={runStats.speed}
              time={runStats.time}
              isRunning={runStats.isRunning}
              heartRate={runStats.heartRate}
              avgPace={runStats.avgPace}
              calories={runStats.calories}
              onSpeedChange={updateTreadmillSpeed}
              onStop={stopRun}
            />
          )}
          {currentView === 'profile' && (
            <ProfileViewComponent
              runHistory={runHistory}
              onRunClick={handleRunClick}
            />
          )}
          {currentView === 'leaderboard' && (
            <LeaderboardViewComponent leaderboard={mockLeaderboard} />
          )}
        </main>

        <BottomNavigation
          currentView={currentView}
          onViewChange={setCurrentView}
        />

        <RunDetailModal 
          run={selectedRun} 
          open={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
        
        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    </div>
  );
}
