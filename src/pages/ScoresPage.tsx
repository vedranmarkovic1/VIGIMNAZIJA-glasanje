import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePoll } from '../context/PollContext';
import { Poll } from '../types';
import { downloadOfficialPdfReport, downloadVotersPdfReport } from '../lib/pdfGenerator';
import { OfficialPdfReportModal } from '../components/OfficialPdfReportModal';
import {
  BarChart3,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  Award,
  Search,
  Eye
} from 'lucide-react';

export const ScoresPage: React.FC = () => {
  const { currentUser, users, onlineUsersCount } = useAuth();
  const { polls, votes, getPollStatistics } = usePoll();

  const [expandedPollId, setExpandedPollId] = useState<string | null>(null);
  const [previewPoll, setPreviewPoll] = useState<Poll | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!currentUser) return null;

  const role = currentUser.role;
  const isPresidentOrVice = role === 'president' || role === 'vice_president_even' || role === 'vice_president_odd';
  const isSecretary = role === 'secretary';
  const isTeacherAdvisor = role === 'teacher_advisor';
  const isSupport = role === 'support';

  const canAccess = isPresidentOrVice || isSecretary || isTeacherAdvisor || isSupport;
  const canDownloadVotersReport = isPresidentOrVice || isSecretary || isSupport;

  if (!canAccess) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="p-5 bg-rose-50 text-rose-900 rounded-2xl border border-rose-200 text-sm font-semibold">
          Pristup stranici sa zvaničnim rezultatima i izveštajima je ograničen na predsedništvo, zapisničara, nastavnika-saradnika i podršku.
        </div>
      </div>
    );
  }

  // Count registered students (quorum rule: 50% of registered students)
  const studentUsers = users.filter((u) => u.role === 'student');
  const totalStudents = studentUsers.length > 0 ? studentUsers.length : users.length;
  const requiredQuorum = Math.ceil(totalStudents / 2);

  // Get only closed polls
  const closedPolls = polls
    .filter((p) => p.status === 'closed')
    .filter((p) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        p.question.toLowerCase().includes(term) ||
        (p.title && p.title.toLowerCase().includes(term)) ||
        p.created_by_name.toLowerCase().includes(term)
      );
    });

  const toggleExpand = (id: string) => {
    setExpandedPollId(expandedPollId === id ? null : id);
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadPdf = async (poll: Poll) => {
    const stats = getPollStatistics(poll.id, users.length, onlineUsersCount);
    await downloadOfficialPdfReport(poll, stats, totalStudents, users);
  };

  const handleDownloadVotersPdf = async (poll: Poll) => {
    await downloadVotersPdfReport(poll, users, votes);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#0b2240] text-white rounded-2xl p-6 sm:p-8 shadow-xl border-b-4 border-[#004b87] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/80 text-blue-200 text-xs font-semibold border border-blue-700 mb-2">
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>Zvanična evidencija sednica i verifikacija odluka</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            REZULTATI I IZVEŠTAJI
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl leading-relaxed">
            ARHIVA GLASANJA
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pretraži arhivirane tačke..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/60 text-xs focus:outline-none focus:bg-white/15 focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#004b87]" />
            <span>Završena glasanja ({closedPolls.length})</span>
          </h2>
          <div className="text-xs text-slate-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
            GLASAČI: <strong>{totalStudents} učenika</strong> • Potreban kvorum (50%): <strong>{requiredQuorum} glasova</strong>
          </div>
        </div>

        {closedPolls.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm space-y-3">
            <BarChart3 className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">Nema arhiviranih završenih glasanja</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Nakon što predsedavajući zaključi otvoreno glasanje na kontrolnoj tabli, rezultati i zvanični zapisnik će se odmah pojaviti ovde.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {closedPolls.map((poll) => {
              const isExpanded = expandedPollId === poll.id;
              const stats = getPollStatistics(poll.id, users.length, onlineUsersCount);
              const quorumMet = stats.totalVotes >= requiredQuorum;

              // Find leading option
              const winningOption = [...stats.results].sort((a, b) => b.count - a.count)[0];

              return (
                <div
                  key={poll.id}
                  className={`bg-white rounded-2xl shadow-md border transition-all overflow-hidden ${
                    isExpanded ? 'border-[#004b87] ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Summary Card Header */}
                  <div className="p-5 sm:p-6 cursor-pointer" onClick={() => toggleExpand(poll.id)}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 uppercase">
                            ZAKLJUČENO
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            {poll.type === 'classic' ? 'Klasično glasanje' : 'Višestruki izbor'}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(poll.closed_at)}
                          </span>

                          {quorumMet ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Kvorum ispunjen ({stats.totalVotes}/{requiredQuorum})</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Nema kvoruma ({stats.totalVotes}/{requiredQuorum})</span>
                            </span>
                          )}
                        </div>

                        {poll.title && (
                          <h3 className="font-bold text-slate-950 text-base sm:text-lg">
                            {poll.title}
                          </h3>
                        )}

                        <p className="text-xs sm:text-sm text-slate-700 font-serif line-clamp-2">
                          „{poll.question}”
                        </p>
                      </div>

                      {/* Right quick analytics & actions */}
                      <div className="flex flex-wrap items-center gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                        {/* Duration */}
                        <div className="px-3.5 py-2 rounded-xl bg-blue-50/80 border border-blue-200 text-left">
                          <div className="text-[10px] uppercase font-bold text-blue-800 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>Vreme trajanja:</span>
                          </div>
                          <div className="text-xs font-mono font-bold text-blue-950 mt-0.5">
                            {stats.durationFormatted}
                          </div>
                        </div>

                        {/* Votes */}
                        <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-left">
                          <div className="text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-500" />
                            <span>Odziv učenika:</span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {stats.totalVotes} glasova ({stats.turnoutPercentage}%)
                          </div>
                        </div>

                        {/* Direct PDF Download Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPdf(poll);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#004b87] hover:bg-[#003865] text-white text-xs font-bold shadow transition-all hover:scale-105 active:scale-95"
                          title="Kliknite za direktno preuzimanje PDF zapisnika na uređaj"
                        >
                          <Download className="w-4 h-4" />
                          <span>Preuzmi PDF izveštaj</span>
                        </button>

                        {/* Voters List PDF Button (President, Vice-presidents, Secretary, Support) */}
                        {canDownloadVotersReport && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadVotersPdf(poll);
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow transition-all hover:scale-105 active:scale-95 border border-slate-700"
                            title="Preuzmi spisak svih glasača sa brojevima telefona (PDF)"
                          >
                            <FileText className="w-4 h-4 text-blue-300" />
                            <span>Spisak glasača (PDF)</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDABLE DETAILED ANALYTICS */}
                  {isExpanded && (
                    <div className="px-5 pb-6 sm:px-6 sm:pb-8 pt-2 border-t border-slate-100 bg-slate-50/60 space-y-6">
                      
                      {/* Summary Banner */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <div className="text-xs text-slate-500 font-semibold uppercase">Pobednički izbor</div>
                          <div className="text-base font-extrabold text-[#004b87] mt-1">
                            {winningOption ? winningOption.option : 'Nema glasova'}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            Osvojeno {winningOption?.count || 0} od {stats.totalVotes} glasova ({winningOption?.percentage || 0}%)
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <div className="text-xs text-slate-500 font-semibold uppercase">Vremenski dnevnik</div>
                          <div className="text-xs text-slate-800 space-y-0.5 mt-1 font-mono">
                            <div>Otključano: {formatDate(poll.unlocked_at)}</div>
                            <div>Zatvoreno: {formatDate(poll.closed_at)}</div>
                          </div>
                          <div className="text-[11px] font-bold text-blue-900 mt-1">
                            Glasanje trajalo: {stats.durationFormatted}
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <div className="text-xs text-slate-500 font-semibold uppercase">Status kvoruma (Pravilo 50%)</div>
                          {quorumMet ? (
                            <div className="text-sm font-bold text-emerald-800 flex items-center gap-1.5 mt-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Kvorum je ispunjen</span>
                            </div>
                          ) : (
                            <div className="text-sm font-bold text-rose-800 flex items-center gap-1.5 mt-1">
                              <XCircle className="w-4 h-4 text-rose-600" />
                              <span>Nema kvoruma</span>
                            </div>
                          )}
                          <div className="text-xs text-slate-500 mt-0.5">
                            Glasalo {stats.totalVotes} od potrebnih {requiredQuorum} učenika (ukupno u sistemu: {totalStudents})
                          </div>
                        </div>
                      </div>

                      {/* Visual Chart */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Grafički prikaz raspodele glasova
                          </div>
                          <span className="text-xs text-slate-500">
                            Ukupno evidentirano: <strong>{stats.totalVotes}</strong> glasova
                          </span>
                        </div>

                        <div className="space-y-3.5">
                          {stats.results.map((res, index) => {
                            const isWinner = winningOption && winningOption.count > 0 && res.count === winningOption.count;

                            return (
                              <div key={index} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                      {index + 1}
                                    </span>
                                    <span className="text-slate-900">{res.option}</span>
                                    {isWinner && (
                                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-300">
                                        Većina
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-slate-600">{res.count} glasova</span>
                                    <span className="font-bold text-[#004b87] text-sm w-12 text-right">
                                      {res.percentage}%
                                    </span>
                                  </div>
                                </div>

                                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200">
                                  <div
                                    className={`h-3.5 rounded-full transition-all duration-500 ${
                                      isWinner
                                        ? 'bg-gradient-to-r from-[#004b87] to-blue-600'
                                        : 'bg-gradient-to-r from-slate-400 to-slate-500'
                                    }`}
                                    style={{ width: `${res.percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action Buttons footer */}
                      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setPreviewPoll(poll)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-all"
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                          <span>Pregledaj tekst zapisnika</span>
                        </button>

                        {canDownloadVotersReport && (
                          <button
                            type="button"
                            onClick={() => handleDownloadVotersPdf(poll)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-md transition-all border border-slate-700"
                          >
                            <FileText className="w-4 h-4 text-blue-300" />
                            <span>Preuzmi spisak glasača (PDF)</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(poll)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#004b87] hover:bg-[#003865] text-white text-xs font-bold shadow-md transition-all"
                        >
                          <Download className="w-4 h-4" />
                          <span>Preuzmi PDF datoteku na uređaj</span>
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Screen Preview Modal */}
      {previewPoll && (
        <OfficialPdfReportModal
          poll={previewPoll}
          stats={getPollStatistics(previewPoll.id, users.length, onlineUsersCount)}
          isOpen={true}
          onClose={() => setPreviewPoll(null)}
        />
      )}
    </div>
  );
};
