import React, { useState } from 'react';
import { Database, CheckCircle2, Copy, Check, X, AlertTriangle } from 'lucide-react';
import { SUPABASE_URL, SUPABASE_ANON_KEY, updateSupabaseCredentials } from '../lib/supabase';

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  errorMessage?: string;
}

export const SUPABASE_SETUP_SQL = `-- 1. TABELA KORISNIKA
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  phone TEXT,
  grade_class TEXT,
  role TEXT NOT NULL CHECK (role IN ('support', 'president', 'vice_president_even', 'vice_president_odd', 'secretary', 'teacher_advisor', 'student')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('must_change_password', 'active')),
  temporary_password TEXT,
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA GLASANJA (POLLS)
CREATE TABLE IF NOT EXISTS public.polls (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('classic', 'multiple')),
  title TEXT,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'active', 'closed')),
  created_by TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  unlocked_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- 3. TABELA UBAČENIH GLASOVA (USER_VOTES)
CREATE TABLE IF NOT EXISTS public.user_votes (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  selected_option TEXT NOT NULL,
  casted_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_poll_user_vote UNIQUE (poll_id, user_id)
);

-- 4. UKLJUČIVANJE REAL-TIME REPLIKACIJE
ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- 5. POLISE ZA PRISTUP (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dozvoli sve za users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Dozvoli sve za polls" ON public.polls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Dozvoli sve za user_votes" ON public.user_votes FOR ALL USING (true) WITH CHECK (true);

-- 6. INICIJALNI ČLANOVI
INSERT INTO public.users (id, username, password, name, surname, phone, grade_class, role, status, is_online)
VALUES
  ('usr-support-1', 'podrska', 'password123', 'Petar', 'Jovanović', '064/123-4567', 'IT podrška', 'support', 'active', false),
  ('usr-pres-1', 'predsednik', 'password123', 'Mihailo', 'Savić', '060/987-6543', 'IV-2', 'president', 'active', false),
  ('usr-vp-even', 'zamenik.parna', 'password123', 'Milica', 'Popović', '062/345-6789', 'III-4', 'vice_president_even', 'active', false),
  ('usr-vp-odd', 'zamenik.neparna', 'password123', 'Luka', 'Stanković', '063/876-5432', 'IV-1', 'vice_president_odd', 'active', false),
  ('usr-sec-1', 'zapisnicar', 'password123', 'Jelena', 'Todorović', '061/234-5678', 'III-2', 'secretary', 'active', false),
  ('usr-adv-1', 'prof.branka', 'password123', 'Branka', 'Milić', '065/456-7890', 'Profesor sociologije', 'teacher_advisor', 'active', false),
  ('usr-stud-1', 'stefan.djordjevic', 'password123', 'Stefan', 'Đorđević', '064/111-2233', 'IV-3', 'student', 'active', false),
  ('usr-stud-2', 'teodora.nikolic', 'password123', 'Teodora', 'Nikolić', '069/222-3344', 'III-1', 'student', 'active', false),
  ('usr-stud-3', 'dunja.petrovic', 'password123', 'Dunja', 'Petrović', '063/333-4455', 'II-4', 'student', 'active', false),
  ('usr-stud-new', 'milena.bozic', 'TempP@ss2026', 'Milena', 'Božić', '064/999-0011', 'IV-4', 'student', 'must_change_password', false)
ON CONFLICT (id) DO NOTHING;`;

export const SupabaseStatusModal: React.FC<SupabaseStatusModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  errorMessage,
}) => {
  const [urlInput, setUrlInput] = useState(SUPABASE_URL);
  const [keyInput, setKeyInput] = useState(SUPABASE_ANON_KEY);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseCredentials(urlInput, keyInput);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-[#0b2240] text-white px-6 py-4 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base">Supabase status baze i SQL konfiguracija</h3>
              <p className="text-xs text-blue-200">Upravljanje parametrima realne produkcijske baze</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {/* Status Box */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isConnected
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}>
            {isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold text-sm">
                {isConnected ? 'Supabase baza je uspešno povezana i sinhronizovana!' : 'Povezivanje sa Supabase bazom...'}
              </div>
              <p className="leading-relaxed text-[11px]">
                {isConnected
                  ? 'Aplikacija komunicira direktno sa Vašom bazom u realnom vremenu. Svi podaci o korisnicima, glasovima i sednicama se trajno čuvaju na Vašem Supabase serveru.'
                  : errorMessage || 'Ukoliko tabele još nisu kreirane, pokrenite donju SQL skriptu u Vašem Supabase SQL Editoru.'}
              </p>
            </div>
          </div>

          {/* Current Config */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                Povezani projekat:
              </span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-[#004b87] font-semibold hover:underline text-[11px]"
              >
                {isEditing ? 'Odustani od izmene' : 'Izmeni parametre'}
              </button>
            </div>
            
            <div className="font-mono text-[11px] text-slate-600 break-all bg-white p-2.5 rounded-lg border border-slate-200">
              URL: <span className="font-semibold text-slate-900">{SUPABASE_URL}</span>
            </div>

            {isEditing && (
              <form onSubmit={handleSaveCredentials} className="pt-2 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Supabase Project URL:
                  </label>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-[#004b87] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Supabase Anon API Key:
                  </label>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-[#004b87] focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004b87] text-white rounded-lg font-bold text-xs shadow hover:bg-[#003763]"
                >
                  Sačuvaj i osveži vezu
                </button>
              </form>
            )}
          </div>

          {/* SQL Script Quick Copy Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-700" />
                <span>SQL skripta za kreiranje tabela:</span>
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#004b87] text-white text-xs font-bold hover:bg-[#003865] transition-all shadow-sm"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Kopirano u memoriju!' : 'Kopiraj kompletan SQL'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Ako već niste, otvorite <strong>Supabase Dashboard -&gt; SQL Editor -&gt; New query</strong>, nalepite skriptu i kliknite <strong>Run</strong>.
            </p>

            <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[10px] max-h-40 overflow-y-auto leading-relaxed border border-slate-800">
              {SUPABASE_SETUP_SQL}
            </pre>
          </div>

          {/* Close */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
            >
              Zatvori
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
