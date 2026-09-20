import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePoll } from '../context/PollContext';
import {
  Vote,
  Unlock,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PlusCircle,
  HelpCircle,
  BarChart2,
  Layers,
  ChevronRight
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { currentUser, users, onlineUsersCount } = useAuth();
  const {
    polls,
    activePoll,
    unlockPoll,
    closePoll,
    castVote,
    hasUserVoted,
    getUserVote,
    getPollStatistics
  } = usePoll();

  const [voteSubmitting, setVoteSubmitting] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [voteConfirmationPending, setVoteConfirmationPending] = useState<string | null>(null);

  if (!currentUser) return null;

  const role = currentUser.role;
  const isPresidentOrVice = role === 'president' || role === 'vice_president_even' || role === 'vice_president_odd';
  const isSupport = role === 'support';
  const isAdmin = isPresidentOrVice || isSupport;
  const isStudent = role === 'student';

  // Find locked polls that can be unlocked
  const lockedPolls = polls.filter((p) => p.status === 'locked');

  // Quorum calculation (50% rule)
  const studentUsers = users.filter((u) => u.role === 'student');
  const totalStudents = studentUsers.length > 0 ? studentUsers.length : users.length;
  const requiredQuorum = Math.ceil(totalStudents / 2);

  // Active poll check for student
  const studentHasVoted = activePoll ? hasUserVoted(activePoll.id, currentUser.id) : false;
  const studentVote = activePoll && studentHasVoted ? getUserVote(activePoll.id, currentUser.id) : null;

  // Active poll stats for admin preview
  const activeStats = activePoll ? getPollStatistics(activePoll.id, users.length, onlineUsersCount) : null;
  const quorumMet = activeStats ? activeStats.totalVotes >= requiredQuorum : false;

  const handleVoteSubmit = async (option: string) => {
    if (!activePoll) return;
    setVoteSubmitting(true);
    setVoteError('');

    const res = await castVote(activePoll.id, currentUser.id, option);
    if (!res.success) {
      setVoteError(res.error || 'Greška pri evidentiranju glasa.');
    } else {
      setVoteConfirmationPending(null);
    }
    setVoteSubmitting(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0b2240] via-[#004b87] to-[#005fa3] rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Zvanični logo na levoj strani kontrolne table */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
              <img
                src="/parlament-logo.png"
                alt="Zvanični grb Učeničkog parlamenta"
                className="w-full h-full object-contain filter drop-shadow-xl"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 border border-white/20 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Zvanična sednica Učeničkog parlamenta
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
                Dobrodošli, {currentUser.name} {currentUser.surname}
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-2xl leading-relaxed">
                {isAdmin
                  ? 'UPRAVLJANJE SEDNICOM'
                  : isStudent
                  ? 'KONTROLNA TABLA'
                  : 'Pristup stečen u svojstvu zvaničnog posmatrača i verifikatora zapisnika (Zapisničar / Nastavnik-saradnik).'}
              </p>
            </div>
          </div>

          {/* Quick shortcuts for Admin */}
          {isAdmin && (
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => onNavigate('/create-classic')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-xs font-bold text-white transition-all shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-emerald-300" />
                <span>+ Klasično glasanje</span>
              </button>
              <button
                onClick={() => onNavigate('/create-multiple')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-xs font-bold text-white transition-all shadow-sm"
              >
                <Layers className="w-4 h-4 text-amber-300" />
                <span>+ Višestruki izbor</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ADMIN CONTROLS SECTION (President, Vice-presidents, Support) */}
      {isAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Vote className="w-5 h-5 text-[#004b87]" />
              <span>Upravljanje glasanjem na sednici</span>
            </h2>
          </div>

          {/* If there is an ACTIVE poll right now */}
          {activePoll ? (
            <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-500 overflow-hidden">
              {/* Header banner */}
              <div className="bg-emerald-600 text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  <span className="text-xs uppercase tracking-widest font-extrabold bg-emerald-700/80 px-2 py-0.5 rounded">
                    GLASANJE JE OTVORENO UŽIVO
                  </span>
                  <span className="text-xs text-emerald-100 hidden sm:inline">
                    Učenici mogu glasati sa svojih ekrana
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <Clock className="w-4 h-4" />
                  <span>Otključano: {new Date(activePoll.unlocked_at || '').toLocaleTimeString('sr-RS')}</span>
                </div>
              </div>

              {/* Main Content & Real-time tally */}
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <div className="text-xs font-bold text-[#004b87] uppercase tracking-wider mb-1">
                    {activePoll.type === 'classic' ? 'Klasično izjašnjavanje (ZA / PROTIV / UZDRŽAN/A)' : 'Višestruki izbor kandidata'}
                  </div>
                  {activePoll.title && (
                    <h3 className="text-xl font-bold text-slate-950 mb-2">
                      {activePoll.title}
                    </h3>
                  )}
                  <div className="text-base text-slate-800 font-serif bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                    „{activePoll.question}”
                  </div>
                </div>

                {/* Real-time live vote stats for President */}
                {activeStats && (
                  <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-blue-900">
                        Odziv članova parlamenta i verifikacija kvoruma:
                      </div>
                      <div className="flex items-center gap-2">
                        {quorumMet ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Kvorum ispunjen (50%+)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Čeka se kvorum ({activeStats.totalVotes}/{requiredQuorum})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 flex justify-between">
                      <span>Pristiglo glasova: <strong className="text-blue-950 font-bold">{activeStats.totalVotes}</strong></span>
                      <span>Potrebno za kvorum (50%): <strong className="text-[#004b87]">{requiredQuorum} učenika</strong></span>
                    </div>

                    <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-[#004b87] h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (activeStats.totalVotes / totalStudents) * 100)}%` }}
                      />
                    </div>

                    {/* Breakdown bars */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {activeStats.results.map((r, i) => (
                        <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                          <div className="text-xs font-semibold text-slate-700 truncate">{r.option}</div>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-lg font-extrabold text-slate-900">{r.count}</span>
                            <span className="text-xs font-bold text-[#004b87]">{r.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Control Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <div className="text-xs text-slate-500 mr-auto flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Zatvaranjem se automatski zaključava biralište i kreira zvanični zapisnik.</span>
                  </div>

                  <button
                    onClick={() => closePoll(activePoll.id)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Zatvori glasanje i zaključi rezultate</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* If no poll is currently active, show locked polls ready to unlock */
            <div className="space-y-4">
              {lockedPolls.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-amber-500" />
                      <h3 className="font-bold text-slate-900 text-base">
                        Zaključana glasanja pripremljena za otključavanje ({lockedPolls.length})
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500">
                      Klikom na „Otključaj glasanje” učenicima će se automatski prikazati biralište
                    </span>
                  </div>

                  <div className="space-y-3">
                    {lockedPolls.map((poll) => (
                      <div
                        key={poll.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase">
                              Zaključano
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              {poll.type === 'classic' ? 'Klasično' : 'Višestruki izbor'}
                            </span>
                          </div>
                          {poll.title && (
                            <h4 className="font-bold text-slate-900 text-sm">{poll.title}</h4>
                          )}
                          <p className="text-xs text-slate-700 italic">„{poll.question}”</p>
                          <div className="text-[11px] text-slate-400">
                            Kreirao: {poll.created_by_name} • {new Date(poll.created_at).toLocaleString('sr-RS')}
                          </div>
                        </div>

                        <button
                          onClick={() => unlockPoll(poll.id)}
                          className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#004b87] hover:bg-[#003660] text-white font-bold text-xs shadow-md transition-all"
                        >
                          <Unlock className="w-4 h-4" />
                          <span>Otključaj glasanje</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#004b87] flex items-center justify-center mx-auto">
                    <Vote className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">Nema pripremljenih glasanja na čekanju</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Kreirajte novu tačku dnevnog reda za klasično ili višestruko glasanje kako biste omogućili delegatima izjašnjavanje.
                  </p>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => onNavigate('/create-classic')}
                      className="px-4 py-2 rounded-xl bg-[#004b87] text-white font-semibold text-xs shadow"
                    >
                      Kreiraj klasično glasanje
                    </button>
                    <button
                      onClick={() => onNavigate('/create-multiple')}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                    >
                      Kreiraj višestruki izbor
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STUDENT VIEW SECTION */}
      {isStudent && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Vote className="w-5 h-5 text-[#004b87]" />
              <span>AKTIVNOSTI</span>
            </h2>
            <span className="text-xs text-slate-500">
              Pravo glasa: <span className="font-bold text-emerald-700">Verifikovano</span>
            </span>
          </div>

          {activePoll ? (
            studentHasVoted ? (
              /* ALREADY VOTED SUCCESS STATE */
              <div className="bg-white rounded-2xl shadow-xl border border-emerald-300 p-8 text-center space-y-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                    Glas je uspešno evidentiran
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
                    Uspešno ste glasali, sačekajte proglašenje rezultata
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Vaš glas je digitalno potpisan, zaštićen od izmena i unet u zapisnik sa tačnim vremenom u sekundu.
                  </p>
                </div>

                {/* Vote receipt card */}
                {studentVote && (
                  <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-left space-y-2">
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
                      Potvrda o ubačenom glasu:
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Glasano za opciju:</span>
                      <span className="font-extrabold text-[#004b87]">{studentVote.selected_option}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tačno vreme:</span>
                      <span className="font-mono text-slate-800">
                        {new Date(studentVote.casted_at).toLocaleTimeString('sr-RS', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>ID glasačkog zapisa:</span>
                      <span className="font-mono">{studentVote.id}</span>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => onNavigate('/archive')}
                    className="inline-flex items-center gap-1.5 text-xs text-[#004b87] font-bold hover:underline"
                  >
                    <span>Pogledajte ličnu arhivu glasanja</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* ACTIVE POLL TO VOTE ON */
              <div className="bg-white rounded-2xl shadow-xl border-2 border-[#004b87] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#004b87] to-[#0062b1] px-6 py-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-2 py-0.5 rounded">
                      AKTIVNA TAČKA GLASANJA
                    </span>
                  </div>
                  <span className="text-xs text-blue-100 font-medium">
                    {activePoll.type === 'classic' ? 'Klasično glasanje' : 'Višestruki izbor'}
                  </span>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    {activePoll.title && (
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                        {activePoll.title}
                      </h3>
                    )}
                    <div className="text-base sm:text-lg text-slate-800 font-serif bg-blue-50/50 p-5 rounded-2xl border border-blue-100 leading-relaxed font-medium">
                      „{activePoll.question}”
                    </div>
                  </div>

                  {voteError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl">
                      {voteError}
                    </div>
                  )}

                  {/* VOTING OPTIONS */}
                  {activePoll.type === 'classic' ? (
                    /* 3 LARGE DISTINCTIVE BUTTONS: ZA, PROTIV, UZDRŽAN/A */
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Izaberite svoj glas:
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* ZA */}
                        <button
                          type="button"
                          onClick={() => setVoteConfirmationPending('ZA')}
                          className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center group ${
                            voteConfirmationPending === 'ZA'
                              ? 'bg-emerald-600 text-white border-emerald-700 ring-4 ring-emerald-200 shadow-xl'
                              : 'bg-emerald-50/50 border-emerald-300 text-emerald-950 hover:bg-emerald-100 hover:border-emerald-500 hover:shadow-md'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                            voteConfirmationPending === 'ZA' ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'
                          }`}>
                            ✓
                          </div>
                          <span className="text-xl font-black tracking-wider">ZA</span>
                          <span className={`text-[11px] font-medium ${
                            voteConfirmationPending === 'ZA' ? 'text-emerald-100' : 'text-emerald-700'
                          }`}>
                            Podržavam predlog
                          </span>
                        </button>

                        {/* PROTIV */}
                        <button
                          type="button"
                          onClick={() => setVoteConfirmationPending('PROTIV')}
                          className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center group ${
                            voteConfirmationPending === 'PROTIV'
                              ? 'bg-rose-600 text-white border-rose-700 ring-4 ring-rose-200 shadow-xl'
                              : 'bg-rose-50/50 border-rose-300 text-rose-950 hover:bg-rose-100 hover:border-rose-500 hover:shadow-md'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                            voteConfirmationPending === 'PROTIV' ? 'bg-white text-rose-700' : 'bg-rose-600 text-white'
                          }`}>
                            ✕
                          </div>
                          <span className="text-xl font-black tracking-wider">PROTIV</span>
                          <span className={`text-[11px] font-medium ${
                            voteConfirmationPending === 'PROTIV' ? 'text-rose-100' : 'text-rose-700'
                          }`}>
                            Ne podržavam predlog
                          </span>
                        </button>

                        {/* UZDRŽAN/A */}
                        <button
                          type="button"
                          onClick={() => setVoteConfirmationPending('UZDRŽAN/A')}
                          className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center group ${
                            voteConfirmationPending === 'UZDRŽAN/A'
                              ? 'bg-slate-700 text-white border-slate-900 ring-4 ring-slate-200 shadow-xl'
                              : 'bg-slate-100/80 border-slate-300 text-slate-800 hover:bg-slate-200 hover:border-slate-500 hover:shadow-md'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                            voteConfirmationPending === 'UZDRŽAN/A' ? 'bg-white text-slate-800' : 'bg-slate-600 text-white'
                          }`}>
                            —
                          </div>
                          <span className="text-xl font-black tracking-wider">UZDRŽAN/A</span>
                          <span className={`text-[11px] font-medium ${
                            voteConfirmationPending === 'UZDRŽAN/A' ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            Uzdržavam se od glasanja
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* MULTIPLE CHOICE OPTIONS */
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Izaberite jednog kandidata ili opciju:
                      </div>

                      <div className="space-y-2.5">
                        {activePoll.options.map((opt, i) => {
                          const isSelected = voteConfirmationPending === opt;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setVoteConfirmationPending(opt)}
                              className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-blue-50 border-[#004b87] text-blue-950 font-bold shadow-md ring-2 ring-blue-300'
                                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isSelected ? 'border-[#004b87] bg-[#004b87] text-white' : 'border-slate-400'
                                }`}>
                                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                </div>
                                <span className="text-sm font-medium">{opt}</span>
                              </div>
                              <span className="text-xs text-slate-400 font-mono">#{i + 1}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* VOTE CONFIRMATION FOOTER */}
                  {voteConfirmationPending && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-center gap-2.5 text-xs text-amber-900">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                          Potvrdite svoj izbor: <strong>„{voteConfirmationPending}”</strong>. 
                          Nakon potvrde, izmena nije moguća!
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setVoteConfirmationPending(null)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-white text-xs font-semibold"
                        >
                          Otkaži
                        </button>
                        <button
                          type="button"
                          disabled={voteSubmitting}
                          onClick={() => handleVoteSubmit(voteConfirmationPending)}
                          className="px-5 py-2 rounded-lg bg-[#004b87] hover:bg-[#003865] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Zvanično potvrdi glas</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            /* CALM "NO ACTIVE POLLS" STATE */
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-[#004b87] flex items-center justify-center mx-auto">
                <HelpCircle className="w-8 h-8 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Nema aktivnih glasanja u toku</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  Sednica je u toku ili je u toku rasprava. Čim predsedavajući otključa sledeću tačku dnevnog reda, biralište će se <strong>automatski pojaviti na Vašem ekranu</strong>.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Povezani ste na e-Parlament mrežu uživo</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OBSERVER VIEW (Secretary, Teacher-Advisor) */}
      {(role === 'secretary' || role === 'teacher_advisor') && (
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-[#004b87]">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Režim nadzora i vođenja zapisnika ({role === 'secretary' ? 'Zapisničar' : 'Nastavnik-saradnik'})
              </h3>
              <p className="text-xs text-slate-500">
                Pratite tok sednice, a za analitiku, grafikone i preuzimanje zvaničnog PDF izveštaja pređite na stranicu „Rezultati i izveštaji”.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('/scores')}
              className="px-4 py-2.5 rounded-xl bg-[#004b87] text-white font-bold text-xs shadow hover:bg-[#003865] transition-all flex items-center gap-2"
            >
              <BarChart2 className="w-4 h-4" />
              <span>Otvori rezultate i PDF zapisnik</span>
            </button>
            <button
              onClick={() => onNavigate('/archive')}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
            >
              Pogledaj arhivu sednica
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
