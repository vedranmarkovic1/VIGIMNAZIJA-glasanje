import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePoll } from '../context/PollContext';
import { Vote, ArrowLeft, CheckCircle2, Lock, AlertCircle, Info } from 'lucide-react';

interface CreateClassicPollPageProps {
  onNavigate: (path: string) => void;
}

export const CreateClassicPollPage: React.FC<CreateClassicPollPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { createClassicPoll } = usePoll();

  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [successPollId, setSuccessPollId] = useState<string | null>(null);

  if (!currentUser) return null;

  const role = currentUser.role;
  const canCreate = role === 'president' || role === 'vice_president_even' || role === 'vice_president_odd' || role === 'support';

  if (!canCreate) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 text-sm font-semibold">
          Nemate ovlašćenje za kreiranje novih tačaka glasanja. Ova funkcija je rezervisana za predsedništvo parlamenta i podršku.
        </div>
        <button
          onClick={() => onNavigate('/dashboard')}
          className="px-4 py-2 bg-[#004b87] text-white text-xs font-bold rounded-xl"
        >
          Nazad na kontrolnu tablu
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!question.trim()) {
      setError('Tekst pitanja (Za šta se glasa) je obavezan.');
      return;
    }

    const roleLabels: Record<string, string> = {
      president: 'Predsednik',
      vice_president_even: 'Zamenik za parnu smenu',
      vice_president_odd: 'Zamenik za neparnu smenu',
      secretary: 'Zapisničar',
      support: 'Korisnička podrška',
      teacher_advisor: 'Nastavnik-saradnik',
      student: 'Učenik',
    };
    const createdByName = `${currentUser.name} ${currentUser.surname} (${roleLabels[currentUser.role] || currentUser.role})`;

    const poll = await createClassicPoll(title, question, currentUser.id, createdByName);
    setSuccessPollId(poll.id);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb / Back Button */}
      <button
        onClick={() => onNavigate('/dashboard')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#004b87] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Nazad na kontrolnu tablu</span>
      </button>

      {/* Page Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b2240] to-[#004b87] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Vote className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-blue-200">
                NOVA TAČKA DNEVNOG REDA
              </div>
              <h1 className="text-xl font-extrabold text-white">
                Kreiranje klasičnog glasanja (ZA / PROTIV / UZDRŽAN/A)
              </h1>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successPollId ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Glasanje je uspešno kreirano u statusu „Zaključano”
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Tačka je spremna u bazi. Kada na sednici dođe red za izjašnjavanje, kliknite na <strong>„Otključaj glasanje”</strong> na kontrolnoj tabli i učenicima će se automatski otvoriti glasački prozor.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => onNavigate('/dashboard')}
                className="px-5 py-2.5 rounded-xl bg-[#004b87] text-white text-xs font-bold shadow hover:bg-[#003865]"
              >
                Idi na kontrolnu tablu i otključaj
              </button>
              <button
                onClick={() => {
                  setTitle('');
                  setQuestion('');
                  setSuccessPollId(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Kreiraj još jedno glasanje
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Title field */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Naslov glasanja <span className="text-slate-400 font-normal lowercase">(neobavezno)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="npr. Pitanje o toaletima ili Usvajanje plana za ekskurziju"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#004b87] focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Kratak naziv teme radi lakšeg pronalaženja u arhivi i zapisnicima.
              </p>
            </div>

            {/* Question textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Za šta se glasa (Formulisano pitanje) <span className="text-rose-600 font-bold">*</span>
              </label>
              <textarea
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Unesite precizno pitanje ili tekst odluke o kojoj se delegati izjašnjavaju..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#004b87] focus:outline-none leading-relaxed"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Ovaj tekst će se prikazati delegatima i biće unet u zvanični izveštaj.
              </p>
            </div>

            {/* Fixed options preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Predefinisane opcije za klasično glasanje:</span>
              </div>
              <p className="text-xs text-slate-500">
                Učenicima će na ekranu biti ponuđena 3 krupna izbora u skladu sa Poslovnikom:
              </p>
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-center font-bold text-emerald-900 text-xs">
                  ✓ ZA
                </div>
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-center font-bold text-rose-900 text-xs">
                  ✕ PROTIV
                </div>
                <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 text-center font-bold text-slate-800 text-xs">
                  — UZDRŽAN/A
                </div>
              </div>
            </div>

            {/* Status note */}
            <div className="flex items-start gap-2.5 text-xs text-amber-900 bg-amber-50 p-3.5 rounded-xl border border-amber-200">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Novo glasanje se kreira u statusu <strong>„Zaključano” (locked)</strong>. Delegati neće moći da glasaju sve dok predsedavajući na kontrolnoj tabli ne klikne na „Otključaj glasanje”.
              </span>
            </div>

            {/* Submit */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/dashboard')}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Otkaži
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#004b87] hover:bg-[#003865] text-white text-xs font-bold shadow-md transition-all"
              >
                Sačuvaj glasanje u pripremi
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
