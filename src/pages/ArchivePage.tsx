import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePoll } from '../context/PollContext';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  UserCheck
} from 'lucide-react';

export const ArchivePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { polls, getUserVote, hasUserVoted } = usePoll();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'voted' | 'not_voted'>('all');

  if (!currentUser) return null;

  const formatDateTimeSeconds = (isoString?: string | null) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Sort chronological descending
  const sortedPolls = [...polls].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const filteredPolls = sortedPolls.filter((poll) => {
    const hasVoted = hasUserVoted(poll.id, currentUser.id);

    if (filterType === 'voted' && !hasVoted) return false;
    if (filterType === 'not_voted' && hasVoted) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      poll.question.toLowerCase().includes(term) ||
      (poll.title && poll.title.toLowerCase().includes(term)) ||
      poll.created_by_name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-[#0b2240] text-white rounded-2xl p-6 sm:p-8 shadow-xl border-b-4 border-[#004b87] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/80 text-blue-200 text-xs font-semibold border border-blue-700 mb-2">
            <FileText className="w-3.5 h-3.5 text-blue-300" />
            <span>Zvanična evidencija i dnevnik članova parlamenta</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Arhiva glasanja i verifikacija učešća
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl leading-relaxed">
            Hronološki registar svih prethodnih zasedanja i elektronskih glasanja.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pretraži arhivu..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/60 text-xs focus:outline-none focus:bg-white/15 focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-[#004b87] text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Sva glasanja ({sortedPolls.length})
          </button>
          <button
            onClick={() => setFilterType('voted')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'voted'
                ? 'bg-[#004b87] text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Gde sam glasao/la ({sortedPolls.filter((p) => hasUserVoted(p.id, currentUser.id)).length})
          </button>
          <button
            onClick={() => setFilterType('not_voted')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'not_voted'
                ? 'bg-[#004b87] text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Bez mog glasa ({sortedPolls.filter((p) => !hasUserVoted(p.id, currentUser.id)).length})
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Prikazano: <strong>{filteredPolls.length}</strong> zapisa
        </span>
      </div>

      {/* List of Sessions */}
      {filteredPolls.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm space-y-2">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">Nema pronađenih zapisa u arhivi</h3>
          <p className="text-xs text-slate-500">Pokušajte sa drugačijim kriterijumima pretrage ili filtera.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPolls.map((poll) => {
            const hasVoted = hasUserVoted(poll.id, currentUser.id);
            const userVote = hasVoted ? getUserVote(poll.id, currentUser.id) : null;

            return (
              <div
                key={poll.id}
                className="bg-white rounded-2xl shadow-md border border-slate-200/90 p-5 sm:p-6 hover:shadow-lg transition-all space-y-4"
              >
                {/* Top status line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Poll Status badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                        poll.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : poll.status === 'locked'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {poll.status === 'active' ? 'Uživo u toku' : poll.status === 'locked' ? 'Zaključano' : 'Završeno / Arhivirano'}
                    </span>

                    <span className="text-[11px] font-semibold text-slate-500">
                      Tip: {poll.type === 'classic' ? 'Klasično (ZA/PROTIV)' : 'Višestruki izbor'}
                    </span>

                    <span className="text-[11px] text-slate-400">
                      ID: <span className="font-mono">{poll.id}</span>
                    </span>
                  </div>

                  {/* Participation Badge */}
                  <div>
                    {hasVoted ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Glasao/la na ovoj sednici</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Niste evidentirani kao glasač</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Poll Details */}
                <div className="space-y-1.5">
                  {poll.title && (
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                      {poll.title}
                    </h3>
                  )}
                  <p className="text-sm text-slate-800 font-serif leading-relaxed italic">
                    „{poll.question}”
                  </p>
                </div>

                {/* Timing & Personal Ballot Execution Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* General Timestamps */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Dnevnik sesije:</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kreirano u sistemu:</span>
                      <span className="font-mono text-slate-800">{formatDateTimeSeconds(poll.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Biralište otvoreno:</span>
                      <span className="font-mono text-blue-900 font-semibold">{formatDateTimeSeconds(poll.unlocked_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Biralište zatvoreno:</span>
                      <span className="font-mono text-slate-800">{formatDateTimeSeconds(poll.closed_at)}</span>
                    </div>
                  </div>

                  {/* Personal Vote Stamp */}
                  <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                    hasVoted ? 'bg-blue-50/70 border-blue-200' : 'bg-slate-50/50 border-slate-200'
                  }`}>
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-200 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Vaš verifikovani glasački zapis:</span>
                    </div>
                    {hasVoted && userVote ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Vaša izabrana opcija:</span>
                          <span className="font-extrabold text-[#004b87]">{userVote.selected_option}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Tačan trenutak:</span>
                          <span className="font-mono font-bold text-emerald-900">
                            {formatDateTimeSeconds(userVote.casted_at)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Kontrolni hash zapisa:</span>
                          <span className="font-mono">{userVote.id}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-slate-500 italic py-2">
                        Niste učestvovali u ovom glasanju (odsutni ili uzdržani pre otvaranja birališta).
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
