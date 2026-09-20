import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PollProvider } from './context/PollContext';
import { OfficialHeader } from './components/OfficialHeader';
import { Navbar } from './components/Navbar';
import { RealtimeNotificationModal } from './components/RealtimeNotificationModal';

import { LoginPage } from './pages/LoginPage';
import { ForcePasswordChangeScreen } from './components/ForcePasswordChangeScreen';
import { DashboardPage } from './pages/DashboardPage';
import { ArchivePage } from './pages/ArchivePage';
import { CreateClassicPollPage } from './pages/CreateClassicPollPage';
import { CreateMultiplePollPage } from './pages/CreateMultiplePollPage';
import { ScoresPage } from './pages/ScoresPage';
import { UserManagementPage } from './pages/UserManagementPage';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.hash.replace('#', '') || '/dashboard';
  });

  // Sync with browser hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setCurrentPath(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If not logged in, show login page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f0f6fc] flex flex-col justify-between">
        <OfficialHeader />
        <LoginPage onLoginSuccess={() => navigate('/dashboard')} />
        <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200">
          Šesta beogradska gimnazija • Učenički parlament • Sistem e-Glasanja 2026
        </footer>
      </div>
    );
  }

  // If user must change temporary password, force password change screen before anything else
  if (currentUser.status === 'must_change_password') {
    return (
      <div className="min-h-screen bg-[#f0f6fc] flex flex-col justify-between">
        <OfficialHeader />
        <ForcePasswordChangeScreen onComplete={() => navigate('/dashboard')} />
        <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200">
          Šesta beogradska gimnazija • Učenički parlament • Sistem e-Glasanja 2026
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f6fc] flex flex-col justify-between text-slate-800">
      <div>
        <OfficialHeader />
        <Navbar
          currentPath={currentPath}
          onNavigate={navigate}
        />

        <main className="pb-16 px-2 sm:px-0">
          {currentPath === '/login' && <LoginPage onLoginSuccess={() => navigate('/dashboard')} />}
          {currentPath === '/dashboard' && <DashboardPage onNavigate={navigate} />}
          {currentPath === '/archive' && <ArchivePage />}
          {currentPath === '/create-classic' && <CreateClassicPollPage onNavigate={navigate} />}
          {currentPath === '/create-multiple' && <CreateMultiplePollPage onNavigate={navigate} />}
          {currentPath === '/scores' && <ScoresPage />}
          {currentPath === '/users' && <UserManagementPage onNavigate={navigate} />}
        </main>
      </div>

      {/* Real-time automatic unmissable popup for students */}
      <RealtimeNotificationModal onNavigateToPoll={() => navigate('/dashboard')} />

      <footer className="py-5 bg-white border-t border-slate-200 no-print text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-semibold text-slate-700">
            © 2026 Šesta beogradska gimnazija • Učenički parlament
          </div>
          <div className="text-slate-400">
            Zvanični sistem elektronskog glasanja parlamenta
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <PollProvider>
        <AppContent />
      </PollProvider>
    </AuthProvider>
  );
};

export default App;
