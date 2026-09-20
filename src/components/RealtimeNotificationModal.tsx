import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePoll } from '../context/PollContext';
import { BellRing, CheckCircle2, ArrowRight, X } from 'lucide-react';

export const RealtimeNotificationModal: React.FC<{ onNavigateToPoll?: () => void }> = ({ onNavigateToPoll }) => {
  const { currentUser } = useAuth();
  const { activePoll, hasUserVoted } = usePoll();
  const [isOpen, setIsOpen] = useState(false);
  const [notifiedPollId, setNotifiedPollId] = useState<string | null>(null);

  // Play subtle pleasant chime via Web Audio API
  const playAlertSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      playTone(523.25, 0, 0.25); // C5
      playTone(659.25, 0.15, 0.25); // E5
      playTone(783.99, 0.3, 0.4); // G5
    } catch (e) {
      console.warn('Audio feedback not available', e);
    }
  };

  useEffect(() => {
    const handlePollUnlocked = (e: Event) => {
      const customEvent = e as CustomEvent<{ pollId: string }>;
      const pollId = customEvent.detail?.pollId;

      // Show popup if user is logged in
      if (currentUser && currentUser.role === 'student') {
        setNotifiedPollId(pollId);
        setIsOpen(true);
        playAlertSound();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'parlament_last_unlocked_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (currentUser && currentUser.role === 'student' && parsed.pollId !== notifiedPollId) {
            setNotifiedPollId(parsed.pollId);
            setIsOpen(true);
            playAlertSound();
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('parlament:poll-unlocked', handlePollUnlocked);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('parlament:poll-unlocked', handlePollUnlocked);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser, notifiedPollId]);

  // If user already voted on the active poll, close modal
  useEffect(() => {
    if (activePoll && currentUser && hasUserVoted(activePoll.id, currentUser.id)) {
      setIsOpen(false);
    }
  }, [activePoll, currentUser, hasUserVoted]);

  if (!isOpen || !activePoll) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 no-print">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border-2 border-blue-600 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        {/* Top priority banner */}
        <div className="bg-gradient-to-r from-[#004b87] to-[#0062b1] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl animate-bounce">
              <BellRing className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-blue-200 bg-blue-900/50 px-2 py-0.5 rounded-full border border-blue-400/30">
                UŽIVO OBAVEŠTENJE
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Glasanje je upravo otvoreno!
              </h3>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Zatvori obaveštenje"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-4">
            <div className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
              {activePoll.type === 'classic' ? 'Klasično glasanje (ZA / PROTIV / UZDRŽAN/A)' : 'Višestruki izbor (Kandidati / Predlozi)'}
            </div>
            {activePoll.title && (
              <h4 className="font-bold text-slate-900 text-base mb-1">
                {activePoll.title}
              </h4>
            )}
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              „{activePoll.question}”
            </p>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Predsedavajući parlamenta je otključao sesiju glasanja. Kao član parlamenta sa pravom glasa, Vaš glas je zvaničan i evidentira se u sekundu.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors"
            >
              Glasaću kasnije
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                if (onNavigateToPoll) onNavigateToPoll();
              }}
              className="px-5 py-2.5 rounded-lg bg-[#004b87] hover:bg-[#003865] text-white text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <span>Pristupi glasanju sada</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
