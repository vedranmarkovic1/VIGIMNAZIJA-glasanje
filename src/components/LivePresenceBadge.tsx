import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';

export const LivePresenceBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { onlineUsersCount, onlineRolesBreakdown, users } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const onlineUsersList = users.filter((u) => u.is_online);

  return (
    <div className="relative inline-block text-left no-print">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        type="button"
        title="Kliknite za detaljan spisak prisutnih članova na sistemu"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all shadow-sm ${
          onlineUsersCount > 0
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
            : 'bg-slate-100 text-slate-700 border-slate-300'
        }`}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>

        <Users className="w-4 h-4 text-emerald-700" />

        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span>Uživo na sistemu:</span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-bold">
            {onlineUsersCount}
          </span>
        </div>

        {!compact && (
          <div className="hidden md:flex items-center gap-1 pl-1 text-[11px] text-emerald-800">
            {onlineRolesBreakdown.slice(0, 3).map((r, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded bg-emerald-200/60 font-medium text-emerald-950"
              >
                {r.count} {r.label}
              </span>
            ))}
            {onlineRolesBreakdown.length > 3 && (
              <span className="text-emerald-700 font-medium">
                +{onlineRolesBreakdown.slice(3).reduce((acc, c) => acc + c.count, 0)} ostalih
              </span>
            )}
          </div>
        )}

        {showDropdown ? (
          <ChevronUp className="w-3.5 h-3.5 text-emerald-700 ml-0.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-emerald-700 ml-0.5" />
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-slate-200 shadow-xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Prijavljeni na e-Parlament
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {onlineUsersCount} od {users.length} članova
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {onlineRolesBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1 rounded bg-blue-50 border border-blue-100 text-blue-900 font-medium text-[11px]"
                >
                  {item.label}: <span className="font-bold">{item.count}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Trenutno aktivni nalozi:
            </p>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {onlineUsersList.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <div>
                      <div className="font-medium text-slate-800">
                        {u.name} {u.surname}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {u.grade_class || u.username}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {u.role === 'president' && 'Predsednik'}
                    {u.role === 'vice_president_even' && 'Zamenik'}
                    {u.role === 'vice_president_odd' && 'Zamenik'}
                    {u.role === 'secretary' && 'Zapisničar'}
                    {u.role === 'teacher_advisor' && 'Nastavnik-saradnik'}
                    {u.role === 'student' && 'Učenik'}
                    {u.role === 'support' && 'Podrška'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
