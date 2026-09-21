import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Unesite korisničko ime.');
      return;
    }

    setLoading(true);
    const res = await login(username, password);
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Neuspešna prijava. Proverite podatke.');
      return;
    }

    if (!res.requirePasswordChange) {
      onLoginSuccess();
    }
    // If requirePasswordChange is true, AppContent immediately detects currentUser.status === 'must_change_password' and renders ForcePasswordChangeScreen
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header Branding with Official School Parliament Logo */}
        <div className="text-center">
          <div className="mx-auto w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-200">
            <img
              src="/parlament-logo.png"
              alt="eParlament - Učenički parlament Šeste beogradske gimnazije (VI gimnazija)"
              className="w-full h-full object-contain drop-shadow-xl"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#004b87] text-[11px] font-bold tracking-wide uppercase mb-2">
            <span>eParlament • VI gimnazija</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Šesta beogradska gimnazija
          </h1>
          <p className="text-xs font-bold text-[#004b87] uppercase tracking-wider mt-1">
            Učenički parlament • Sistem elektronskog glasanja
          </p>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
            Zvanični portal eParlament za elektronsko glasanje učenika VI beogradske gimnazije
          </p>
        </div>

        {/* Clean Production Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-7 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-sm font-bold text-slate-800">
            <ShieldCheck className="w-5 h-5 text-[#004b87]" />
            <span>Prijava na sistem</span>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Korisničko ime
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Unesite Vaše korisničko ime"
                  className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004b87] focus:border-transparent transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Lozinka
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Unesite lozinku"
                  className="block w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004b87] focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#004b87] hover:bg-[#003763] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <span>{loading ? 'Prijavljivanje...' : 'Prijavi se na sistem'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Security badge footer */}
        <div className="text-center text-xs text-slate-400 space-y-1">
          <div>ŠESTA BEOGRADSKA GIMNAZIJA</div>
          <div>SISTEM ELEKTRONSKOG GLASANJA PARLAMENTA</div>
        </div>
      </div>
    </div>
  );
};
