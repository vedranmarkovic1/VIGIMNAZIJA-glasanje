import React from 'react';
import { Poll, PollStatistics } from '../types';
import { Download, X, Shield, FileCheck, FileText } from 'lucide-react';
import { downloadOfficialPdfReport, downloadVotersPdfReport } from '../lib/pdfGenerator';
import { useAuth } from '../context/AuthContext';
import { usePoll } from '../context/PollContext';

interface OfficialPdfReportModalProps {
  poll: Poll;
  stats: PollStatistics;
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialPdfReportModal: React.FC<OfficialPdfReportModalProps> = ({
  poll,
  stats,
  isOpen,
  onClose,
}) => {
  const { currentUser, users } = useAuth();
  const { votes } = usePoll();

  if (!isOpen) return null;

  const role = currentUser?.role;
  const canDownloadVotersReport =
    role === 'president' ||
    role === 'vice_president_even' ||
    role === 'vice_president_odd' ||
    role === 'secretary' ||
    role === 'support';

  const president = users.find((u) => u.role === 'president');
  const secretary = users.find((u) => u.role === 'secretary');
  const teacherAdvisor = users.find((u) => u.role === 'teacher_advisor');

  const presidentName = president ? `${president.name} ${president.surname}` : 'Predsednik parlamenta';
  const secretaryName = secretary ? `${secretary.name} ${secretary.surname}` : 'Zapisničar';
  const teacherAdvisorName = teacherAdvisor ? `${teacherAdvisor.name} ${teacherAdvisor.surname}` : 'Nastavnik-saradnik';

  const creatorUser = users.find((u) => u.id === poll.created_by);
  const creatorDisplayName = creatorUser
    ? `${creatorUser.name} ${creatorUser.surname}`
    : (poll.created_by_name || 'Predsednik parlamenta');

  const handleDownloadPdf = async () => {
    await downloadOfficialPdfReport(poll, stats, stats.registeredVoters, users);
  };

  const handleDownloadVotersPdf = async () => {
    await downloadVotersPdfReport(poll, users, votes);
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const protocolNumber = `UP-VI-${poll.id.replace(/[^0-9]/g, '').slice(-4) || '2026'}/09`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm p-4 sm:p-6 lg:p-10 flex justify-center items-start">
      {/* Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-300 my-4">
        
        {/* Action Bar (Hidden on print) */}
        <div className="no-print bg-[#0b2240] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-blue-900">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-5 h-5 text-blue-300" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">Zvanični PDF zapisnik o glasanju</h3>
              <p className="text-xs text-blue-200">Formatiran prema propisima Učeničkog parlamenta</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {canDownloadVotersReport && (
              <button
                onClick={handleDownloadVotersPdf}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all border border-slate-600"
                title="Preuzmi spisak svih glasača sa brojevima telefona (PDF)"
              >
                <FileText className="w-4 h-4 text-blue-300" />
                <span>Spisak glasača (PDF)</span>
              </button>
            )}
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 bg-[#004b87] hover:bg-[#003560] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all border border-blue-400"
            >
              <Download className="w-4 h-4" />
              <span>Preuzmi PDF na uređaj</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-blue-900/60 rounded-lg transition-colors"
              title="Zatvori prozor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="p-8 sm:p-12 text-slate-900 font-serif leading-relaxed bg-white print:p-0 print:m-0">
          
          {/* Header */}
          <div className="border-b-4 border-double border-slate-900 pb-5 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs tracking-widest uppercase font-sans font-bold text-slate-600">
                  REPUBLIKA SRBIJA • GRAD BEOGRAD
                </div>
                <div className="text-lg sm:text-xl font-bold font-sans text-slate-950 uppercase tracking-wide mt-1">
                  ŠESTA BEOGRADSKA GIMNAZIJA
                </div>
                <div className="text-sm font-sans font-semibold text-[#004b87] tracking-wider uppercase">
                  UČENIČKI PARLAMENT
                </div>
                <div className="text-xs font-sans text-slate-500 mt-1">
                  Ulica Milana Rakića 33, 11000 Beograd • e-Parlament sistem
                </div>
              </div>
              <div className="text-right font-sans text-xs text-slate-600 space-y-1">
                <div>Delovodni br: <span className="font-mono font-bold text-slate-900">{protocolNumber}</span></div>
                <div>Datum izveštaja: <span className="font-semibold text-slate-800">{new Date().toLocaleDateString('sr-RS')}</span></div>
                <div>Klasifikacija: <span className="font-semibold text-emerald-800">JAVNI ZAPISNIK</span></div>
              </div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center my-8">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 font-sans uppercase">
              ZAPISNIK O REZULTATIMA ELEKTRONSKOG GLASANJA
            </h1>
            <p className="text-xs text-slate-600 font-sans mt-1">
              Sačinjen na osnovu automatski verifikovanih digitalnih zapisa informacionog sistema e-Parlament
            </p>
          </div>

          {/* Section 1: Opšte informacije o glasanju */}
          <div className="mb-6 font-sans">
            <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs uppercase tracking-wider text-slate-800 border-l-4 border-[#004b87] mb-3">
              1. OPŠTE INFORMACIJE O GLASANJU
            </div>
            <table className="w-full text-xs border border-slate-300">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-1/3 py-2 px-3 bg-slate-50 font-semibold text-slate-700">Naslov sednice / tačke:</td>
                  <td className="py-2 px-3 font-bold text-slate-900">{poll.title || 'Nije specificiran poseban naslov (Redovna tačka dnevnog reda)'}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700">Formulisano pitanje za glasanje:</td>
                  <td className="py-2 px-3 text-slate-900 font-medium italic">„{poll.question}”</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700">Tip sesije glasanja:</td>
                  <td className="py-2 px-3 text-slate-900 font-semibold">
                    {poll.type === 'classic' ? 'Klasično glasanje (Za / Protiv / Uzdržan)' : 'Višestruki izbor (Izbor kandidata ili predloga)'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700">Predlagač / Pokretač:</td>
                  <td className="py-2 px-3 text-slate-900">{creatorDisplayName}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Vremenski zapisnik */}
          <div className="mb-6 font-sans">
            <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs uppercase tracking-wider text-slate-800 border-l-4 border-[#004b87] mb-3">
              2. VREMENSKI ZAPISNIK I DNEVNIK DOGAĐAJA
            </div>
            <table className="w-full text-xs border border-slate-300">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-1/3 py-2 px-3 bg-slate-50 font-semibold text-slate-700">Vreme kreiranja tačke u sistemu:</td>
                  <td className="py-2 px-3 font-mono">{formatDate(poll.created_at)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700">Tačno vreme otvaranja birališta (unlocked):</td>
                  <td className="py-2 px-3 font-mono font-bold text-blue-900">{formatDate(poll.unlocked_at)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700">Tačno vreme zatvaranja birališta (closed):</td>
                  <td className="py-2 px-3 font-mono font-bold text-rose-900">{formatDate(poll.closed_at)}</td>
                </tr>
                <tr className="bg-blue-50/50">
                  <td className="py-2 px-3 font-bold text-blue-950">Ukupno trajanje sesije glasanja:</td>
                  <td className="py-2 px-3 font-bold text-[#004b87] font-mono text-sm">
                    {stats.durationFormatted} ({stats.durationSeconds} sekundi)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Kvorum i odziv birača */}
          <div className="mb-6 font-sans">
            <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs uppercase tracking-wider text-slate-800 border-l-4 border-[#004b87] mb-3">
              3. VERIFIKACIJA KVORUMA I ODZIV ČLANOVA PARLAMENTA
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-3">
              <div className="border border-slate-200 p-2.5 rounded bg-slate-50">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Ukupno članova parlamenta (Sistem)</div>
                <div className="text-lg font-bold text-slate-900">{stats.registeredVoters}</div>
              </div>
              <div className="border border-slate-200 p-2.5 rounded bg-slate-50">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Uživo na sistemu</div>
                <div className="text-lg font-bold text-slate-900">{stats.onlineVoters}</div>
              </div>
              <div className="border border-slate-200 p-2.5 rounded bg-slate-50">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Glasalo (Ubačeni glasovi)</div>
                <div className="text-lg font-bold text-blue-900">{stats.totalVotes}</div>
              </div>
              <div className="border border-slate-200 p-2.5 rounded bg-blue-50 border-blue-200">
                <div className="text-[11px] text-blue-800 uppercase font-bold">Potreban kvorum (50%)</div>
                <div className="text-lg font-extrabold text-[#004b87]">
                  {Math.ceil(stats.registeredVoters / 2)} glasova
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 border border-slate-200 rounded">
              <strong>Konstatacija kvoruma:</strong> Prema Poslovniku o radu Učeničkog parlamenta, kvorum čini najmanje polovina registrovanih učenika u sistemu ({Math.ceil(stats.registeredVoters / 2)} od ukupno {stats.registeredVoters}). 
              Na ovoj sednici ubačeno je <strong>{stats.totalVotes} glasova</strong> ({stats.turnoutPercentage}%), te se konstatuje da je 
              {stats.totalVotes >= Math.ceil(stats.registeredVoters / 2) ? (
                <span className="text-emerald-700 font-bold"> kvorum punopravan i odluka je pravosnažna.</span>
              ) : (
                <span className="text-rose-700 font-bold"> kvorum NIJE ispunjen.</span>
              )}
            </div>
          </div>

          {/* Section 4: Rezultati glasanja */}
          <div className="mb-8 font-sans">
            <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs uppercase tracking-wider text-slate-800 border-l-4 border-[#004b87] mb-3">
              4. ZVANIČNI REZULTATI GLASANJA
            </div>
            <table className="w-full text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                  <th className="py-2.5 px-3 text-left w-12 border-r border-slate-300">R. br.</th>
                  <th className="py-2.5 px-3 text-left border-r border-slate-300">Ponuđena opcija / Kandidat</th>
                  <th className="py-2.5 px-3 text-center w-28 border-r border-slate-300">Broj glasova</th>
                  <th className="py-2.5 px-3 text-center w-28 border-r border-slate-300">Procenat</th>
                  <th className="py-2.5 px-3 text-left w-44">Grafički udeo</th>
                </tr>
              </thead>
              <tbody>
                {stats.results.map((res, index) => (
                  <tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-500 border-r border-slate-300 text-center">
                      {index + 1}.
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-300">
                      {res.option}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 border-r border-slate-300">
                      {res.count}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#004b87] border-r border-slate-300">
                      {res.percentage}%
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-[#004b87] h-2.5 rounded-full"
                          style={{ width: `${res.percentage}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <td colSpan={2} className="py-2 px-3 text-right uppercase border-r border-slate-300">
                    Ukupan broj ubačenih glasova:
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-950 border-r border-slate-300">
                    {stats.totalVotes}
                  </td>
                  <td className="py-2 px-3 text-center font-bold text-slate-950 border-r border-slate-300">
                    100.0%
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer: Official Signatures */}
          <div className="mt-14 pt-8 border-t border-slate-300 font-sans text-xs">
            <div className="text-center font-semibold text-slate-600 mb-8 uppercase tracking-widest text-[11px]">
              POTPISI I VERIFIKACIJA ČLANOVA RADNOG PREDSEDNIŠTVA
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center pt-2">
              {/* President */}
              <div className="flex flex-col items-center">
                <div className="w-44 border-b-2 border-dashed border-slate-400 mb-2 pb-6">
                  <span className="text-[11px] font-medium text-slate-400 italic">(svojeručni potpis)</span>
                </div>
                <div className="font-bold text-slate-900 text-xs">{presidentName}</div>
                <div className="text-slate-500 text-[11px]">Predsednik parlamenta</div>
              </div>

              {/* Secretary */}
              <div className="flex flex-col items-center">
                <div className="w-44 border-b-2 border-dashed border-slate-400 mb-2 pb-6">
                  <span className="text-[11px] font-medium text-slate-400 italic">(svojeručni potpis)</span>
                </div>
                <div className="font-bold text-slate-900 text-xs">{secretaryName}</div>
                <div className="text-slate-500 text-[11px]">Zapisničar</div>
              </div>

              {/* Teacher-Advisor */}
              <div className="flex flex-col items-center">
                <div className="w-44 border-b-2 border-dashed border-slate-400 mb-2 pb-6">
                  <span className="text-[11px] font-medium text-slate-400 italic">(svojeručni potpis)</span>
                </div>
                <div className="font-bold text-slate-900 text-xs">{teacherAdvisorName}</div>
                <div className="text-slate-500 text-[11px]">Nastavnik-saradnik</div>
              </div>
            </div>

            {/* Verification note */}
            <div className="mt-10 flex items-center justify-between text-[10px] text-slate-500 pt-4 border-t border-slate-200">
              <div>
                Elektronski overeno i arhivirano pod jedinstvenim ID: <span className="font-mono text-slate-700">{poll.id}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600 font-semibold">
                <Shield className="w-3.5 h-3.5 text-blue-700" />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
