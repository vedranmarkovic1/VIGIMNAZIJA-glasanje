import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, CheckCircle, AlertCircle, Eye, EyeOff, LogOut, ShieldCheck } from 'lucide-react';

interface ForcePasswordChangeScreenProps {
  onComplete: () => void;
}

export const ForcePasswordChangeScreen: React.FC<ForcePasswordChangeScreenProps> = ({ onComplete }) => {
  const { currentUser, completePasswordChange, logout } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Nova lozinka mora imati najmanje 6 karaktera.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Nova lozinka i ponovljena lozinka se ne podudaraju.');
      return;
    }

    setSubmitting(true);
    try {
      await completePasswordChange(newPassword);
      onComplete();
    } catch (err) {
      setError('Došlo je do greške pri čuvanju lozinke. Pokušajte ponovo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* School branding */}
        <div className="text-center">
          <div className="mx-auto w-28 h-28 flex items-center justify-center mb-3">
            <img
              src="/parlament-logo.png"
              alt="Učenički parlament - Šesta beogradska gimnazija"
              className="w-full h-full object-contain drop-shadow-xl"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Šesta beogradska gimnazija
          </h1>
          <p className="text-xs font-bold text-[#004b87] uppercase tracking-wider mt-1">
            Učenički parlament • Sistem e-Glasanja
          </p>
        </div>

        {/* Change password card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-[#004b87] overflow-hidden">
          <div className="bg-[#0b2240] px-6 py-5 text-white flex items-center gap-3 border-b-2 border-[#004b87]">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <KeyRound className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Prva prijava: Promena lozinke</h2>
              <p className="text-xs text-blue-200 mt-0.5">Postavite trajnu lozinku za Vaš nalog</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
            {/* User Info Box */}
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-xs text-slate-700">
              <div className="font-bold text-slate-900 text-sm">
                {currentUser.name} {currentUser.surname}
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Korisničko ime: <strong className="font-mono text-blue-900">{currentUser.username}</strong></span>
                <span>Odeljenje: <strong>{currentUser.grade_class || 'Nije uneto'}</strong></span>
              </div>
              <p className="text-[11px] text-blue-800 pt-1 border-t border-blue-200/60 mt-1">
                Vaš nalog je otvoren sa privremenom lozinkom. Molimo Vas da unesete Vašu novu ličnu lozinku koju ćete ubuduće koristiti.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nova trajna lozinka
              </label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Najmanje 6 karaktera"
                  className="block w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004b87] focus:border-transparent transition-all"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ponovite novu lozinku
              </label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ponovite istu novu lozinku"
                  className="block w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004b87] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-[#004b87] hover:bg-[#003763] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{submitting ? 'Čuvanje nove lozinke...' : 'Sačuvaj novu lozinku i pristupi sistemu'}</span>
              </button>

              <button
                type="button"
                onClick={() => logout()}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Odjavi se sa sistema</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Vaša lozinka se bezbedno čuva u bazi parlamenta</span>
        </div>
      </div>
    </div>
  );
};
