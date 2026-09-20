import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePoll } from '../context/PollContext';
import { UserCheck, Zap, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export const RoleSwitcher: React.FC<{ onNavigateToDashboard?: () => void }> = ({ onNavigateToDashboard }) => {
  const { currentUser, switchUser } = useAuth();
  const { polls, unlockPoll } = usePoll();
  const [isOpen, setIsOpen] = useState(false);

  const demoPresets = [
    { roleLabel: 'Predsednik', sub: 'Mihailo Savić (IV-2)', id: 'usr-pres-1', color: 'bg-indigo-600' },
    { roleLabel: 'Podrška', sub: 'Petar Jovanović (Admin)', id: 'usr-support-1', color: 'bg-rose-600' },
    { roleLabel: 'Učenik (aktivan)', sub: 'Stefan Đorđević (IV-3)', id: 'usr-stud-1', color: 'bg-emerald-600' },
    { roleLabel: 'Učenik (privremena lozinka)', sub: 'Milena Božić (IV-4)', id: 'usr-stud-new', color: 'bg-amber-600' },
    { roleLabel: 'Zapisničar', sub: 'Jelena Todorović (III-2)', id: 'usr-sec-1', color: 'bg-blue-600' },
    { roleLabel: 'Nastavnik-saradnik', sub: 'Prof. Branka Milić', id: 'usr-adv-1', color: 'bg-purple-600' },
  ];

  const handleTestUnlockAndSwitch = () => {
    // Find a locked poll or create/unlock one
    const lockedPoll = polls.find((p) => p.status === 'locked') || polls[0];
    if (lockedPoll) {
      unlockPoll(lockedPoll.id);
    }
    // Switch to student
    switchUser('usr-stud-1');
    if (onNavigateToDashboard) onNavigateToDashboard();
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 no-print flex flex-col items-end">
      {isOpen && (
        <div className="mb-2 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-300 p-4 animate-in slide-in-from-bottom-5 duration-200 text-xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Brza promena uloge (Test panel)</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>
          </div>

          <p className="text-slate-500 mb-2.5 leading-relaxed">
            Izaberite ulogu za testiranje dozvola, glasanja ili prikaza:
          </p>

          <div className="space-y-1.5 mb-3">
            {demoPresets.map((preset) => {
              const isActive = currentUser?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => switchUser(preset.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left ${
                    isActive
                      ? 'bg-blue-50 border-2 border-blue-600 font-semibold text-blue-900 shadow-sm'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${preset.color}`} />
                    <div>
                      <div className="font-semibold">{preset.roleLabel}</div>
                      <div className="text-[10px] text-slate-500">{preset.sub}</div>
                    </div>
                  </div>
                  {isActive ? (
                    <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                      Aktivno
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">Prebaci</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Real-Time Demo Shortcut */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleTestUnlockAndSwitch}
              title="Automatski otključava glasanje i odmah prebacuje na učenika radi prikaza instant modal prozora bez osvežavanja"
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2 px-3 rounded-xl shadow-md transition-all text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simuliraj: Otključaj i prebaci na učenika</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#004b87] hover:bg-[#003865] text-white px-4 py-2.5 rounded-full shadow-xl border border-blue-400 font-medium text-xs transition-all hover:scale-105 active:scale-95"
      >
        <UserCheck className="w-4 h-4 text-amber-300" />
        <span className="font-semibold">Uloga:</span>
        <span className="bg-white/20 px-2 py-0.5 rounded-md font-bold">
          {currentUser ? (
            currentUser.role === 'president' ? 'Predsednik' :
            currentUser.role === 'vice_president_even' ? 'Zamenik' :
            currentUser.role === 'vice_president_odd' ? 'Zamenik' :
            currentUser.role === 'secretary' ? 'Zapisničar' :
            currentUser.role === 'teacher_advisor' ? 'Nastavnik-saradnik' :
            currentUser.role === 'student' ? 'Učenik' : 'Podrška'
          ) : 'Niko'}
        </span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
