import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BottomNav } from './components/BottomNav';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Screen } from './types';
import { Loading } from './components/ui/Loading';
import { Login } from './pages/Login'; // Keep Login eager for fast TTFB for unauth users, or lazy it too? Better eager for LCP.

// Lazy Imports for Main Pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const DailyLog = lazy(() => import('./pages/DailyLog').then(module => ({ default: module.DailyLog })));
const Goals = lazy(() => import('./pages/Goals').then(module => ({ default: module.Goals })));
const Agreements = lazy(() => import('./pages/Agreements').then(module => ({ default: module.Agreements })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));

// Lazy Imports for Feature Pages
const TimeCapsule = lazy(() => import('./pages/TimeCapsule').then(module => ({ default: module.TimeCapsule })));
const SpecialDates = lazy(() => import('./pages/SpecialDates').then(module => ({ default: module.SpecialDates })));
const Journal = lazy(() => import('./pages/Journal').then(module => ({ default: module.Journal })));
const Milestones = lazy(() => import('./pages/Milestones').then(module => ({ default: module.Milestones })));
const Export = lazy(() => import('./pages/Export').then(module => ({ default: module.Export })));
const AICoach = lazy(() => import('./pages/AICoach').then(module => ({ default: module.AICoach })));
const MonthlyReview = lazy(() => import('./pages/MonthlyReview').then(module => ({ default: module.MonthlyReview })));
const Meditation = lazy(() => import('./pages/Meditation').then(module => ({ default: module.Meditation })));
const Gallery = lazy(() => import('./pages/Gallery').then(module => ({ default: module.Gallery })));
const Quiz = lazy(() => import('./pages/Quiz').then(module => ({ default: module.Quiz })));
const VisionBoard = lazy(() => import('./pages/VisionBoard').then(module => ({ default: module.VisionBoard })));
const Roulette = lazy(() => import('./pages/Roulette').then(module => ({ default: module.Roulette })));

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
    return <Loading fullScreen message="Carregando Amor..." />;
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
      case Screen.Roulette: return <Roulette onNavigate={setCurrentScreen} />;
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
    Screen.VisionBoard,
    Screen.Roulette
  ].includes(currentScreen);

  return (
    <div className="min-h-screen">
      <Suspense fallback={<Loading fullScreen message="Carregando..." />}>
        {renderScreen()}
      </Suspense>
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