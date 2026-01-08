import React, { useState, useEffect } from 'react';
import { BottomNav } from './components/BottomNav';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Screen } from './types';
import { Login } from './pages/Login';
import { DailyLog } from './pages/DailyLog';
import { Dashboard } from './pages/Dashboard';
import { Goals } from './pages/Goals';
import { Agreements } from './pages/Agreements';
import { Settings } from './pages/Settings';
import { TimeCapsule } from './pages/TimeCapsule';
import { SpecialDates } from './pages/SpecialDates';
import { Journal } from './pages/Journal';
import { Milestones } from './pages/Milestones';
import { Export } from './pages/Export';
import { AICoach } from './pages/AICoach';
import { MonthlyReview } from './pages/MonthlyReview';
import { Meditation } from './pages/Meditation';
import { Gallery } from './pages/Gallery';
import { Quiz } from './pages/Quiz';
import { VisionBoard } from './pages/VisionBoard';

// Fake Biometric Lock Screen Component
const LockScreen: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-background-light dark:bg-background-dark flex flex-col items-center justify-center animate-[fadeIn_0.3s_ease-out]">
      <div className="flex flex-col items-center gap-6">
        <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
          <span className="material-symbols-rounded text-6xl text-primary">fingerprint</span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold">Love Planner Bloqueado</h2>
          <p className="text-sm text-text-muted mt-1">Toque para desbloquear com FaceID/Biometria</p>
        </div>
        <button
          onClick={onUnlock}
          className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          Desbloquear
        </button>
      </div>
    </div>
  );
};

// Inner component to handle routing based on Auth state
const MainApp: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-rounded text-6xl text-primary animate-pulse">favorite</span>
          <p className="text-text-muted font-bold animate-pulse">Carregando Amor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Wrap authenticated app in AppProvider which now takes user ID to scope data
  return (
    <AppProvider currentUser={user}>
      <AuthenticatedLayout />
    </AppProvider>
  );
};

const AuthenticatedLayout: React.FC = () => {
  const { preferences } = useApp();
  // Initialize current screen based on user preferences (defaulting to DailyLog if not set)
  const [currentScreen, setCurrentScreen] = useState<Screen>(preferences.defaultScreen || Screen.DailyLog);
  const [isLocked, setIsLocked] = useState(false);
  const [hasCheckedLock, setHasCheckedLock] = useState(false);

  useEffect(() => {
    if (!hasCheckedLock) {
      if (preferences.biometrics) {
        setIsLocked(true);
      }
      setHasCheckedLock(true);
    }
  }, [preferences.biometrics, hasCheckedLock]);

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.DailyLog: return <DailyLog onSaved={() => setCurrentScreen(Screen.Dashboard)} />;
      case Screen.Dashboard: return <Dashboard onNavigate={setCurrentScreen} />;
      case Screen.Goals: return <Goals />;
      case Screen.Agreements: return <Agreements />;
      case Screen.Settings: return <Settings />;
      case Screen.TimeCapsule: return <TimeCapsule onBack={() => setCurrentScreen(Screen.Dashboard)} />;
      case Screen.SpecialDates: return <SpecialDates onBack={() => setCurrentScreen(Screen.Dashboard)} />;
      case Screen.Journal: return <Journal onBack={() => setCurrentScreen(Screen.Dashboard)} />;
      case Screen.Milestones: return <Milestones onNavigate={setCurrentScreen} />;
      case Screen.Export: return <Export onBack={() => setCurrentScreen(Screen.Dashboard)} />;
      case Screen.AICoach: return <AICoach onBack={() => setCurrentScreen(Screen.Dashboard)} />;
      case Screen.MonthlyReview: return <MonthlyReview onBack={() => setCurrentScreen(Screen.Dashboard)} />;
      case Screen.Meditation: return <Meditation onNavigate={setCurrentScreen} />;
      case Screen.Gallery: return <Gallery onNavigate={setCurrentScreen} />;
      case Screen.Quiz: return <Quiz onNavigate={setCurrentScreen} />;
      case Screen.VisionBoard: return <VisionBoard onNavigate={setCurrentScreen} />;
      default: return <Dashboard onNavigate={setCurrentScreen} />;
    }
  };

  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  // Hide bottom nav on full-screen auxiliary pages
  const shouldHideBottomNav = [
    // Screen.DailyLog, // Removed to keep nav visible
    Screen.TimeCapsule,
    Screen.SpecialDates,
    Screen.Journal,
    Screen.Milestones,
    Screen.Export,
    Screen.AICoach,
    Screen.MonthlyReview,
    Screen.Meditation,
    Screen.Gallery,
    Screen.Quiz,
    Screen.VisionBoard
  ].includes(currentScreen);

  return (
    <div className="min-h-screen">
      {renderScreen()}
      {!shouldHideBottomNav && (
        <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      )}
    </div>
  );
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;