import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePoll } from '../context/PollContext';
import { Layers, ArrowLeft, Plus, Trash2, CheckCircle2, Lock, AlertCircle } from 'lucide-react';

interface CreateMultiplePollPageProps {
  onNavigate: (path: string) => void;
}

export const CreateMultiplePollPage: React.FC<CreateMultiplePollPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { createMultiplePoll } = usePoll();

  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>([
    'Kandidat / Predlog 1',
    'Kandidat / Predlog 2',
    'Kandidat / Predlog 3'
  ]);
  const [error, setError] = useState('');
  const [successPollId, setSuccessPollId] = useState<string | null>(null);

  if (!currentUser) return null;

  const role = currentUser.role;
  const canCreate = role === 'president' || role === 'vice_president_even' || role === 'vice_president_odd' || role === 'support';

  if (!canCreate) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 text-sm font-semibold">
          Nemate ovlašćenje za kreiranje glasanja. Funkcija je rezervisana za predsedništvo parlamenta i podršku.
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

  const handleOptionChange = (index: number, val: string) => {
    setOptions((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleAddOption = () => {
    setOptions((prev) => [...prev, `Kandidat / Predlog ${prev.length + 1}`]);
  };

  const handleDeleteOption = (index: number) => {
    if (options.length <= 2) {
      setError('Moraju postojati najmanje dve opcije ili kandidata za višestruki izbor.');
      return;
    }
    setError('');
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!question.trim()) {
      setError('Tekst pitanja je obavezan.');
      return;
    }

    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      setError('Unesite najmanje dve validne opcije ili imena kandidata.');
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

    const poll = await createMultiplePoll(title, question, cleanOptions, currentUser.id, createdByName);
    setSuccessPollId(poll.id);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => onNavigate('/dashboard')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#004b87] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Nazad na kontrolnu tablu</span>
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b2240] via-[#004b87] to-[#1e3a8a] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Layers className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-blue-200">
                NOVA TAČKA DNEVNOG REDA
              </div>
              <h1 className="text-xl font-extrabold text-white">
                Kreiranje glasanja sa više opcija / kandidata
              </h1>
            </div>
          </div>
        </div>

        {successPollId ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Glasanje sa više kandidata je uspešno kreirano!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Sačuvano je u stanju „Zaključano”. Možete ga otključati sa kontrolne table u željenom trenutku tokom sednice.
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
                  setOptions(['Predlog 1', 'Predlog 2', 'Predlog 3']);
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

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Naslov glasanja <span className="text-slate-400 font-normal lowercase">(neobavezno)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="npr. Izbor delegata za Gradski učenički parlament ili Izbor lokacije ekskurzije"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#004b87] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Pitanje za delegate <span className="text-rose-600 font-bold">*</span>
              </label>
              <textarea
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Unesite formulisano pitanje na koje delegati odgovaraju izborom jedne od opcija..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#004b87] focus:outline-none leading-relaxed"
                required
              />
            </div>

            {/* DYNAMIC CANDIDATE FIELDS WITH DELETE BUTTONS */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Kandidati / Opcije za glasanje <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Dodajte željeni broj opcija ili koristite dugme „Briši” za uklanjanje nepotrebnih.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[#004b87] hover:bg-blue-100 text-xs font-bold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Dodaj kandidata</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {options.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-300 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Naziv opcije ili ime kandidata #${idx + 1}`}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#004b87] focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(idx)}
                      disabled={options.length <= 2}
                      title="Briši ovog kandidata / opciju"
                      className={`flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        options.length <= 2
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-400'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Briši</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-amber-900 bg-amber-50 p-3.5 rounded-xl border border-amber-200">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Glasanje se kreira u statusu <strong>„Zaključano”</strong>. Otključavanjem na tabli učenicima se prikazuju radio dugmad i kartice sa ponuđenim opcijama.
              </span>
            </div>

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
                Sačuvaj višestruko glasanje
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
