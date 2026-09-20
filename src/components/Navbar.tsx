import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Vote,
  FileText,
  BarChart3,
  PlusCircle,
  Users,
  LogOut,
  Menu,
  X,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
}) => {
  const { currentUser, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newPollDropdownOpen, setNewPollDropdownOpen] = useState(false);

  if (!currentUser) return null;

  const role = currentUser.role;

  const isPresidentOrVice =
    role === 'president' ||
    role === 'vice_president_even' ||
    role === 'vice_president_odd';

  const isSupport = role === 'support';
  const isSecretary = role === 'secretary';
  const isTeacherAdvisor = role === 'teacher_advisor';

  const canViewScores =
    isPresidentOrVice ||
    isSupport ||
    isSecretary ||
    isTeacherAdvisor;

  const canCreatePolls =
    isPresidentOrVice || isSupport;

  const canManageUsers =
    isSupport || isPresidentOrVice;

  const getRoleBadge = () => {
    switch (role) {
      case 'support':
        return {
          title: 'Korisnička podrška',
          color:
            'bg-rose-500/15 text-rose-300 border-rose-400/30',
        };

      case 'president':
        return {
          title: 'Predsednik',
          color:
            'bg-indigo-500/15 text-indigo-200 border-indigo-400/30',
        };

      case 'vice_president_even':
        return {
          title: 'Zamenik (parna)',
          color:
            'bg-indigo-500/15 text-indigo-200 border-indigo-400/30',
        };

      case 'vice_president_odd':
        return {
          title: 'Zamenik (neparna)',
          color:
            'bg-indigo-500/15 text-indigo-200 border-indigo-400/30',
        };

      case 'secretary':
        return {
          title: 'Zapisničar',
          color:
            'bg-blue-500/15 text-blue-200 border-blue-400/30',
        };

      case 'teacher_advisor':
        return {
          title: 'Nastavnik-saradnik',
          color:
            'bg-purple-500/15 text-purple-200 border-purple-400/30',
        };

      case 'student':
        return {
          title: 'Učenik',
          color:
            'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
        };

      default:
        return {
          title: 'Korisnik',
          color:
            'bg-slate-500/15 text-slate-200 border-slate-400/30',
        };
    }
  };

  const roleMeta = getRoleBadge();

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    setNewPollDropdownOpen(false);
  };

  const navButtonClass = (active: boolean) =>
    `flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
      active
        ? 'bg-[#004b87] text-white shadow-sm ring-1 ring-blue-400/40'
        : 'text-slate-200 hover:bg-white/10 hover:text-white'
    }`;

  const mobileNavButtonClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-semibold transition-all duration-200 ${
      active
        ? 'bg-[#004b87] text-white shadow-md ring-1 ring-blue-400/30'
        : 'text-slate-200 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <nav className="sticky top-0 z-30 border-b border-blue-900/80 bg-[#0b2240] text-white shadow-xl no-print">

      <div className="mx-auto w-full max-w-[1900px] px-4 sm:px-6 lg:px-8">

        {/* =========================================================
            DESKTOP NAVBAR
            ========================================================= */}
        <div className="relative flex min-h-[108px] items-center py-2">

          {/* =======================================================
              CENTRALNA NAVIGACIJA
              ======================================================= */}
          <div className="hidden w-full items-center justify-center xl:flex">

            {/* =====================================================
                ZVANIČNI LOGO STRANICE (NA LEVOJ STRANI KONTROLNE TABLE)
                ===================================================== */}
            <div
              onClick={() => handleNavClick('/dashboard')}
              className="relative z-10 mr-4 flex h-[105px] w-[105px] shrink-0 items-center justify-center cursor-pointer select-none group transition-transform duration-200 hover:scale-105"
              title="Šesta beogradska gimnazija — Učenički parlament"
            >
              <img
                src="/parlament-logo.png"
                alt="Zvanični logo Učeničkog parlamenta"
                className="h-full w-full object-contain filter drop-shadow-xl"
              />
            </div>

            {/* =====================================================
                KONTROLNA TABLA
                ===================================================== */}
            <button
              onClick={() =>
                handleNavClick('/dashboard')
              }
              className={navButtonClass(
                currentPath === '/dashboard'
              )}
            >
              <Vote className="h-4 w-4 shrink-0 text-blue-300" />
              <span>Kontrolna tabla</span>
            </button>

            {/* =====================================================
                NOVO GLASANJE
                ===================================================== */}
            {canCreatePolls && (
              <div className="relative">

                <button
                  onClick={() =>
                    setNewPollDropdownOpen(
                      !newPollDropdownOpen
                    )
                  }
                  className={navButtonClass(
                    currentPath === '/create-classic' ||
                    currentPath === '/create-multiple'
                  )}
                  aria-expanded={newPollDropdownOpen}
                >
                  <PlusCircle className="h-4 w-4 shrink-0 text-emerald-400" />

                  <span>Novo glasanje</span>

                  <ChevronDown
                    className={`h-4 w-4 text-slate-300 transition-transform ${
                      newPollDropdownOpen
                        ? 'rotate-180'
                        : ''
                    }`}
                  />
                </button>

                {newPollDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() =>
                        setNewPollDropdownOpen(false)
                      }
                    />

                    <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 text-xs text-slate-800 shadow-2xl">

                      <button
                        onClick={() =>
                          handleNavClick('/create-classic')
                        }
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-blue-50"
                      >
                        <Vote className="h-5 w-5 shrink-0 text-blue-600" />

                        <div>
                          <div className="font-bold">
                            Klasično glasanje
                          </div>

                          <div className="mt-0.5 text-[11px] text-slate-400">
                            ZA / PROTIV / UZDRŽAN/A
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          handleNavClick('/create-multiple')
                        }
                        className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left transition-colors hover:bg-blue-50"
                      >
                        <Layers className="h-5 w-5 shrink-0 text-indigo-600" />

                        <div>
                          <div className="font-bold">
                            Višestruki izbor
                          </div>

                          <div className="mt-0.5 text-[11px] text-slate-400">
                            Kandidati i dinamičke opcije
                          </div>
                        </div>
                      </button>

                    </div>
                  </>
                )}
              </div>
            )}

            {/* =====================================================
                REZULTATI I IZVEŠTAJI
                ===================================================== */}
            {canViewScores && (
              <button
                onClick={() =>
                  handleNavClick('/scores')
                }
                className={navButtonClass(
                  currentPath === '/scores'
                )}
              >
                <BarChart3 className="h-4 w-4 shrink-0 text-amber-300" />
                <span>Rezultati i izveštaji</span>
              </button>
            )}

            {/* =====================================================
                ARHIVA
                ===================================================== */}
            <button
              onClick={() =>
                handleNavClick('/archive')
              }
              className={navButtonClass(
                currentPath === '/archive'
              )}
            >
              <FileText className="h-4 w-4 shrink-0 text-purple-300" />
              <span>Arhiva / Zapisnik</span>
            </button>

            {/* =====================================================
                NALOZI
                ===================================================== */}
            {canManageUsers && (
              <button
                onClick={() =>
                  handleNavClick('/users')
                }
                className={navButtonClass(
                  currentPath === '/users'
                )}
              >
                <Users className="h-4 w-4 shrink-0 text-emerald-300" />
                <span>Nalozi</span>
              </button>
            )}

          </div>

          {/* =======================================================
              DESNA STRANA — KORISNIK
              ======================================================= */}
          <div className="absolute right-0 hidden items-center xl:flex">

            <div className="flex items-center gap-3 border-l border-blue-800/80 pl-4">

              {/* Avatar */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-700/60 bg-blue-950/80 text-sm font-bold text-blue-200 shadow-inner">
                {currentUser.name.charAt(0)}
                {currentUser.surname.charAt(0)}
              </div>

              {/* Podaci korisnika */}
              <div className="min-w-0 max-w-[190px]">

                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <span className="truncate">
                    {currentUser.name} {currentUser.surname}
                  </span>

                  {currentUser.grade_class && (
                    <span className="shrink-0 text-[10px] font-normal text-blue-300">
                      ({currentUser.grade_class})
                    </span>
                  )}
                </div>

                <div className="mt-1">
                  <span
                    className={`inline-block rounded-full border px-2 py-1 text-[10px] font-semibold leading-none ${roleMeta.color}`}
                  >
                    {roleMeta.title}
                  </span>
                </div>

              </div>

              {/* Odjava */}
              <button
                onClick={logout}
                title="Odjavi se sa sistema"
                aria-label="Odjavi se sa sistema"
                className="ml-1 rounded-xl border border-slate-700 p-2.5 text-slate-300 transition-all hover:border-rose-800 hover:bg-rose-950/40 hover:text-white"
              >
                <LogOut className="h-4 w-4 text-rose-400" />
              </button>

            </div>
          </div>

          {/* =======================================================
              TABLET / MOBILE HEADER
              ======================================================= */}
          <div className="flex w-full items-center justify-between xl:hidden py-1">
            <div
              onClick={() => handleNavClick('/dashboard')}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <div className="h-14 w-14 shrink-0">
                <img
                  src="/parlament-logo.png"
                  alt="Zvanični logo"
                  className="h-full w-full object-contain filter drop-shadow-md"
                />
              </div>
              <div>
                <div className="font-bold text-xs text-white leading-tight">Učenički parlament</div>
                <div className="text-[10px] text-blue-300 font-medium">Šesta beogradska gimnazija</div>
              </div>
            </div>

            <button
              onClick={() =>
                setMobileMenuOpen(!mobileMenuOpen)
              }
              className="rounded-xl border border-blue-700/60 bg-blue-900/60 p-2.5 text-slate-200 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/60"
              aria-label="Meni"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* =============================================================
          MOBILE DRAWER
          ============================================================= */}
      {mobileMenuOpen && (
        <div className="border-t border-blue-900 bg-[#081729] px-4 pb-6 pt-4 shadow-inner sm:px-6 xl:hidden">

          <div className="mx-auto w-full max-w-3xl space-y-4">

            {/* Profil */}
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-800/80 bg-blue-950/70 p-4">

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-sm font-bold text-white">
                  {currentUser.name.charAt(0)}
                  {currentUser.surname.charAt(0)}
                </div>

                <div className="min-w-0">

                  <div className="truncate text-sm font-bold text-white">
                    {currentUser.name} {currentUser.surname}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2">

                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] font-semibold leading-none ${roleMeta.color}`}
                    >
                      {roleMeta.title}
                    </span>

                    {currentUser.grade_class && (
                      <span className="text-[11px] text-slate-400">
                        {currentUser.grade_class}
                      </span>
                    )}

                  </div>

                </div>
              </div>

              <button
                onClick={logout}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-800 bg-rose-950/50 px-3 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-900/60"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Odjava</span>
              </button>

            </div>

            {/* Mobilna navigacija */}
            <div className="space-y-1.5">

              <button
                onClick={() =>
                  handleNavClick('/dashboard')
                }
                className={mobileNavButtonClass(
                  currentPath === '/dashboard'
                )}
              >
                <Vote className="h-5 w-5 shrink-0 text-blue-300" />
                <span>Kontrolna tabla</span>
              </button>

              {canCreatePolls && (
                <>
                  <button
                    onClick={() =>
                      handleNavClick('/create-classic')
                    }
                    className={mobileNavButtonClass(
                      currentPath === '/create-classic'
                    )}
                  >
                    <PlusCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                    <span>
                      Novo klasično glasanje (ZA/PROTIV)
                    </span>
                  </button>

                  <button
                    onClick={() =>
                      handleNavClick('/create-multiple')
                    }
                    className={mobileNavButtonClass(
                      currentPath === '/create-multiple'
                    )}
                  >
                    <Layers className="h-5 w-5 shrink-0 text-indigo-400" />
                    <span>
                      Novo glasanje (Kandidati)
                    </span>
                  </button>
                </>
              )}

              {canViewScores && (
                <button
                  onClick={() =>
                    handleNavClick('/scores')
                  }
                  className={mobileNavButtonClass(
                    currentPath === '/scores'
                  )}
                >
                  <BarChart3 className="h-5 w-5 shrink-0 text-amber-300" />
                  <span>Rezultati i izveštaji</span>
                </button>
              )}

              <button
                onClick={() =>
                  handleNavClick('/archive')
                }
                className={mobileNavButtonClass(
                  currentPath === '/archive'
                )}
              >
                <FileText className="h-5 w-5 shrink-0 text-purple-300" />
                <span>Arhiva / Zapisnik</span>
              </button>

              {canManageUsers && (
                <button
                  onClick={() =>
                    handleNavClick('/users')
                  }
                  className={mobileNavButtonClass(
                    currentPath === '/users'
                  )}
                >
                  <Users className="h-5 w-5 shrink-0 text-emerald-300" />
                  <span>Nalozi članova</span>
                </button>
              )}

            </div>
          </div>
        </div>
      )}
    </nav>
  );
};