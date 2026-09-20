import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../types';
import { downloadBulkCredentialsPdf } from '../lib/pdfGenerator';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  KeyRound,
  Shield,
  Phone,
  AlertCircle,
  Search,
  RotateCcw,
  Trash2,
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  FileText,
  Sparkles
} from 'lucide-react';

import { SCHOOL_CLASSES_BY_GRADE } from '../data/schoolClasses';

interface UserManagementPageProps {
  onNavigate: (path: string) => void;
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({ onNavigate }) => {
  const {
    currentUser,
    users,
    registerStudent,
    registerStudentsBulk,
    updateUserRole,
    deleteUser,
    resetUserPassword
  } = useAuth();

  const [regMode, setRegMode] = useState<'single' | 'excel'>('excel');

  // Single student registration state
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [gradeClass, setGradeClass] = useState('I-1 — Društveno-jezički smer');
  const [error, setError] = useState('');

  // Bulk Excel import state
  const [parsedStudents, setParsedStudents] = useState<Array<{ name: string; surname: string; phone?: string; grade_class?: string }>>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [excelError, setExcelError] = useState('');
  const [bulkSuccessModal, setBulkSuccessModal] = useState<Array<{ user: User; tempPass: string }> | null>(null);
  const [bulkCopied, setBulkCopied] = useState(false);

  // Success state holding newly generated credentials
  const [newlyCreated, setNewlyCreated] = useState<{ user: User; tempPass: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Password reset modal state
  const [resetResult, setResetResult] = useState<{ user: User; tempPass: string } | null>(null);
  const [resetCopied, setResetCopied] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);

  // Delete confirmation modal state
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  if (!currentUser) return null;

  const role = currentUser.role;
  const isPresidentOrVice = role === 'president' || role === 'vice_president_even' || role === 'vice_president_odd';
  const isSupport = role === 'support';
  const canManage = isSupport || isPresidentOrVice;

  if (!canManage) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="p-5 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 text-sm font-semibold">
          Pristup administraciji korisničkih naloga i registraciji učenika je ograničen samo na korisničku podršku i predsedništvo.
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

    if (!name.trim() || !surname.trim()) {
      setError('Ime i prezime učenika su obavezni.');
      return;
    }

    const created = await registerStudent(name.trim(), surname.trim(), phone.trim(), gradeClass.trim());
    setNewlyCreated(created);
    setName('');
    setSurname('');
    setPhone('');
  };

  const handleCopyCredentials = () => {
    if (!newlyCreated) return;
    const text = `PRIJAVA ZA e-PARLAMENT (Šesta beogradska gimnazija)\nKorisnik: ${newlyCreated.user.name} ${newlyCreated.user.surname}\nKorisničko ime: ${newlyCreated.user.username}\nPrivremena lozinka: ${newlyCreated.tempPass}\n\nNapomena: Pri prvoj prijavi sistem će od Vas tražiti da postavite novu ličnu lozinku.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleResetPassword = async (targetUser: User) => {
    setResettingId(targetUser.id);
    const res = await resetUserPassword(targetUser.id);
    setResettingId(null);
    if (res.success && res.tempPassword) {
      setResetResult({ user: targetUser, tempPass: res.tempPassword });
      setResetCopied(false);
    } else {
      alert('Greška pri resetovanju lozinke: ' + (res.error || 'Pokušajte ponovo.'));
    }
  };

  const handleCopyResetCredentials = () => {
    if (!resetResult) return;
    const text = `RESETOVANA LOZINKA ZA e-PARLAMENT (Šesta beogradska gimnazija)\nKorisnik: ${resetResult.user.name} ${resetResult.user.surname}\nKorisničko ime: ${resetResult.user.username}\nNova privremena lozinka: ${resetResult.tempPass}\n\nNapomena: Pri sledećoj prijavi sistem će tražiti unos nove trajne lozinke.`;
    navigator.clipboard.writeText(text);
    setResetCopied(true);
    setTimeout(() => setResetCopied(false), 3000);
  };

  // Handler for parsing uploaded Excel file
  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setExcelError('');
      setIsParsing(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // Prefer sheet named "Spisak učenika" or first sheet
      const sheetName =
        workbook.SheetNames.find(
          (s) => s.toLowerCase().includes('ucenik') || s.toLowerCase().includes('spisak')
        ) || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        setExcelError('Radni list u Excel fajlu nije pronađen.');
        setIsParsing(false);
        return;
      }

      const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
      if (!rows || rows.length === 0) {
        setExcelError('Excel fajl je prazan.');
        setIsParsing(false);
        return;
      }

      // Locate header row containing 'ime' and 'prezime'
      let headerRowIndex = -1;
      let nameIdx = -1;
      let surnameIdx = -1;
      let phoneIdx = -1;
      let classIdx = -1;

      for (let r = 0; r < Math.min(rows.length, 15); r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;

        const nIdx = row.findIndex(
          (cell) => typeof cell === 'string' && cell.toLowerCase().trim() === 'ime'
        );
        const sIdx = row.findIndex(
          (cell) => typeof cell === 'string' && cell.toLowerCase().trim() === 'prezime'
        );

        if (nIdx !== -1 && sIdx !== -1) {
          headerRowIndex = r;
          nameIdx = nIdx;
          surnameIdx = sIdx;
          phoneIdx = row.findIndex(
            (cell) =>
              typeof cell === 'string' &&
              (cell.toLowerCase().includes('telefon') ||
                cell.toLowerCase().includes('tel') ||
                cell.toLowerCase().includes('broj'))
          );
          classIdx = row.findIndex(
            (cell) =>
              typeof cell === 'string' &&
              (cell.toLowerCase().includes('odeljenj') ||
                cell.toLowerCase().includes('smer') ||
                cell.toLowerCase().includes('razred'))
          );
          break;
        }
      }

      if (headerRowIndex === -1) {
        setExcelError('Nisu pronađene kolone "Ime" i "Prezime" u Excel tabeli.');
        setIsParsing(false);
        return;
      }

      const parsed: Array<{ name: string; surname: string; phone?: string; grade_class?: string }> = [];

      for (let r = headerRowIndex + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;

        const rawName = row[nameIdx];
        const rawSurname = row[surnameIdx];
        const rawPhone = phoneIdx !== -1 ? row[phoneIdx] : '';
        const rawClass = classIdx !== -1 ? row[classIdx] : '';

        const studentName = rawName ? String(rawName).trim() : '';
        const studentSurname = rawSurname ? String(rawSurname).trim() : '';
        const studentPhone = rawPhone ? String(rawPhone).trim() : '';
        const studentClass = rawClass ? String(rawClass).trim() : '';

        if (
          studentName &&
          studentSurname &&
          studentName.toLowerCase() !== 'ime' &&
          studentSurname.toLowerCase() !== 'prezime'
        ) {
          parsed.push({
            name: studentName,
            surname: studentSurname,
            phone: studentPhone,
            grade_class: studentClass,
          });
        }
      }

      if (parsed.length === 0) {
        setExcelError('Nisu pronađeni popunjeni podaci o učenicima u Excel tabeli.');
      } else {
        setParsedStudents(parsed);
      }
    } catch (err: any) {
      console.error('Excel parse error:', err);
      setExcelError('Greška pri čitanju Excel fajla: ' + (err?.message || 'Neispravan format.'));
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  // Handler for executing the bulk import and downloading credentials PDF
  const handleExecuteBulkImport = async () => {
    if (parsedStudents.length === 0) return;

    try {
      setIsImporting(true);
      setExcelError('');

      // 1. Bulk register in AuthContext & Supabase
      const results = await registerStudentsBulk(parsedStudents);

      // 2. Automatically generate and download the official PDF report with temporary passwords
      await downloadBulkCredentialsPdf(results, users);

      // 3. Show success modal with review and copy actions
      setBulkSuccessModal(results);
      setParsedStudents([]);
    } catch (err: any) {
      console.error('Bulk import error:', err);
      setExcelError('Greška pri grupnom unosu u bazu: ' + (err?.message || 'Pokušajte ponovo.'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleCopyBulkCredentials = () => {
    if (!bulkSuccessModal) return;
    const lines = bulkSuccessModal.map(
      (item, idx) =>
        `${idx + 1}. ${item.user.name} ${item.user.surname} (${item.user.grade_class || '—'}) | Korisničko ime: ${item.user.username} | Privremena lozinka: ${item.tempPass}`
    );
    const text = `SPISAK KREIRANIH NALOGA ZA e-PARLAMENT (Šesta beogradska gimnazija)\nDatum: ${new Date().toLocaleDateString('sr-RS')}\nUkupno: ${bulkSuccessModal.length} učenika\n\n${lines.join('\n')}\n\nNapomena: Svaki učenik je dužan da pri prvoj prijavi promeni privremenu lozinku u ličnu trajnu lozinku.`;
    navigator.clipboard.writeText(text);
    setBulkCopied(true);
    setTimeout(() => setBulkCopied(false), 3000);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    await deleteUser(userToDelete.id);
    setDeleting(false);
    setUserToDelete(null);
  };

  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.surname.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      (u.grade_class && u.grade_class.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-[#0b2240] text-white rounded-2xl p-6 sm:p-8 shadow-xl border-b-4 border-[#004b87] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/80 text-blue-200 text-xs font-semibold border border-blue-700 mb-2">
            <Shield className="w-3.5 h-3.5 text-blue-300" />
            <span>Administracija naloga članova e-Parlamenta</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Upravljanje nalozima i registracija učenika
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl leading-relaxed">
            UPRAVLJANJE NALOZIMA
          </p>
        </div>

        <div className="bg-white/10 border border-white/20 px-4 py-3 rounded-xl text-xs text-white">
          <div className="text-blue-200 font-medium">Ukupno registrovanih članova:</div>
          <div className="text-xl font-bold font-mono mt-0.5">{users.length} naloga</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* REGISTRATION FORM (1 col) */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Mode Switcher Tabs */}
          <div className="bg-gradient-to-r from-[#004b87] to-[#0062b1] p-3 text-white">
            <div className="grid grid-cols-2 gap-1.5 bg-black/20 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setRegMode('excel')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                  regMode === 'excel'
                    ? 'bg-white text-[#004b87] shadow'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Grupni unos (Excel)</span>
              </button>
              <button
                type="button"
                onClick={() => setRegMode('single')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                  regMode === 'single'
                    ? 'bg-white text-[#004b87] shadow'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Pojedinačni unos</span>
              </button>
            </div>
          </div>

          {regMode === 'excel' ? (
            /* EXCEL BULK IMPORT MODE */
            <div className="p-5 space-y-4">
              {/* Informational Intro */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-[#004b87] font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Automatizovano kreiranje naloga</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Preuzmite zvaničnu tabelu, unesite podatke o delegatima i učitajte fajl. Sistem će automatski uneti sve naloge u bazu i odmah generisati zvanični PDF izveštaj sa privremenim lozinkama.
                </p>
              </div>

              {/* Step 1: Download Template */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#004b87] text-white flex items-center justify-center text-[10px] font-mono font-bold">1</span>
                    Preuzmite Excel šablon
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">.xlsx format</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Zvanični šablon sadrži definisana polja za ime, prezime, telefon i odeljenje učenika.
                </p>
                <a
                  href="/SPISAK%20UCENIKA-PARLAMENT.xlsx"
                  download="SPISAK_UCENIKA_PARLAMENT.xlsx"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-[#004b87] font-bold text-xs border border-blue-300 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4 text-[#004b87]" />
                  <span>Preuzmi SPISAK UCENIKA-PARLAMENT.xlsx</span>
                </a>
              </div>

              {/* Step 2: Upload filled excel file */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50/60">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#004b87] text-white flex items-center justify-center text-[10px] font-mono font-bold">2</span>
                  Otpremite popunjen fajl
                </span>

                {excelError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{excelError}</span>
                  </div>
                )}

                <label className="border-2 border-dashed border-slate-300 hover:border-[#004b87] rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-white transition-all group">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#004b87] transition-colors" />
                  <div className="text-center">
                    <div className="text-xs font-bold text-slate-700 group-hover:text-[#004b87]">
                      {isParsing ? 'Učitavanje fajla...' : 'Izaberite ili prevucite Excel fajl'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Podržani formati: .xlsx, .xls</div>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    disabled={isParsing || isImporting}
                    onChange={handleExcelFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Step 3: Preview and Execute (if students parsed) */}
              {parsedStudents.length > 0 && (
                <div className="border-2 border-emerald-400 bg-emerald-50/50 rounded-xl p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Spremno za unos: {parsedStudents.length} učenika</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setParsedStudents([])}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      Poništi
                    </button>
                  </div>

                  {/* Preview list */}
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-emerald-200 bg-white p-2 space-y-1 text-xs">
                    {parsedStudents.slice(0, 5).map((st, i) => (
                      <div key={i} className="flex items-center justify-between py-1 px-2 rounded bg-slate-50 border border-slate-100 text-[11px]">
                        <span className="font-semibold text-slate-800">
                          {i + 1}. {st.name} {st.surname}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          {st.grade_class || '—'}
                        </span>
                      </div>
                    ))}
                    {parsedStudents.length > 5 && (
                      <div className="text-center text-[10px] text-slate-500 italic py-1">
                        ...i još {parsedStudents.length - 5} učenika
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={handleExecuteBulkImport}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Unos naloga u bazu...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>Uvezi sve učenike i preuzmi PDF sa lozinkama</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* SINGLE REGISTRATION MODE */
            newlyCreated ? (
              /* SUCCESS CREDENTIALS DISPLAY */
              <div className="p-6 space-y-4 animate-in fade-in">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-center space-y-1">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-emerald-950 text-sm">Učenik je uspešno registrovan!</h3>
                  <p className="text-[11px] text-emerald-800">
                    Prosledite sledeće pristupne podatke učeniku.
                  </p>
                </div>

                <div className="bg-slate-50 border-2 border-dashed border-blue-300 rounded-xl p-4 space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Ime i prezime:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {newlyCreated.user.name} {newlyCreated.user.surname}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Generisano korisničko ime:</span>
                    <span className="font-mono font-bold text-blue-900 text-sm bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                      {newlyCreated.user.username}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Privremena lozinka:</span>
                    <span className="font-mono font-bold text-amber-900 text-sm bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                      {newlyCreated.tempPass}
                    </span>
                  </div>

                  <div className="pt-1 text-[11px] text-slate-500 italic">
                    Status: <strong>Mora promeniti lozinku</strong> pri prvoj prijavi.
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#004b87] hover:bg-[#003865] text-white text-xs font-bold shadow transition-all"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Kopirano u privremenu memoriju!' : 'Kopiraj podatke za učenika'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewlyCreated(null)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                  >
                    Registruj još jednog učenika
                  </button>
                </div>
              </div>
            ) : (
              /* FORM */
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ime učenika <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="npr. Nikola"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#004b87] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Prezime učenika <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="npr. Jovanović"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#004b87] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Broj telefona <span className="text-slate-400 font-normal lowercase">(opciono)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="06X/XXX-XXXX"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#004b87] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Odeljenje i smer učenika <span className="text-slate-400 font-normal lowercase">(41 odeljenje)</span>
                  </label>
                  <select
                    value={gradeClass}
                    onChange={(e) => setGradeClass(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#004b87] focus:outline-none bg-white font-medium"
                  >
                    {SCHOOL_CLASSES_BY_GRADE.map((group) => (
                      <optgroup key={group.gradeName} label={`${group.gradeName} (ukupno ${group.totalClasses} odeljenja)`}>
                        {group.classes.map((cls) => (
                          <option key={cls.code} value={`${cls.code} (${cls.track})`}>
                            {cls.fullLabel}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Izaberite tačno odeljenje delegata prema zvaničnoj raspodeli Šeste beogradske gimnazije.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#004b87] hover:bg-[#003865] text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Generiši nalog i privremenu lozinku</span>
                  </button>
                </div>
              </form>
            )
          )}
        </div>

        {/* USERS TABLE & ROLE MANAGEMENT (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden space-y-4 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-[#004b87]" />
                <span>Registrovani članovi biračkog spiska</span>
              </h2>
              <p className="text-xs text-slate-500">
                Pregled statusa aktivacije, uloga i prisustva na sednici
              </p>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pretraži članove..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#004b87] focus:outline-none"
              />
            </div>
          </div>

          {/* Mobile Card View (shown on screens < md) */}
          <div className="md:hidden space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {user.name} {user.surname}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {user.grade_class || 'Nije uneto'} {user.phone && `• ${user.phone}`}
                    </div>
                  </div>

                  {user.is_online ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Uživo</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                      Odsutan
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Korisničko ime:</span>
                    <span className="font-mono font-bold text-slate-800">{user.username}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold text-right">Status naloga:</span>
                    {user.status === 'must_change_password' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <KeyRound className="w-3 h-3 text-amber-700" />
                        <span>Privremena lozinka</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Aktivan</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold mb-1">Uloga:</span>
                  {isSupport ? (
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800"
                    >
                      <option value="student">Učenik</option>
                      <option value="president">Predsednik</option>
                      <option value="vice_president_even">Zamenik (parna)</option>
                      <option value="vice_president_odd">Zamenik (neparna)</option>
                      <option value="secretary">Zapisničar</option>
                      <option value="teacher_advisor">Nastavnik-saradnik</option>
                      <option value="support">Korisnička podrška</option>
                    </select>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300 inline-block">
                      {user.role === 'president' && 'Predsednik'}
                      {user.role === 'vice_president_even' && 'Zamenik (parna)'}
                      {user.role === 'vice_president_odd' && 'Zamenik (neparna)'}
                      {user.role === 'secretary' && 'Zapisničar'}
                      {user.role === 'teacher_advisor' && 'Nastavnik-saradnik'}
                      {user.role === 'student' && 'Učenik'}
                      {user.role === 'support' && 'Podrška'}
                    </span>
                  )}
                </div>

                {/* Mobile actions for Reset Password and Delete */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleResetPassword(user)}
                    disabled={resettingId === user.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${resettingId === user.id ? 'animate-spin' : ''}`} />
                    <span>Resetuj lozinku</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserToDelete(user)}
                    disabled={user.id === currentUser.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Obriši</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (shown on md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Član / Odeljenje</th>
                  <th className="py-2.5 px-3">Korisničko ime</th>
                  <th className="py-2.5 px-3">Uloga</th>
                  <th className="py-2.5 px-3">Status naloga</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">
                        {user.name} {user.surname}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {user.grade_class || 'Nije uneto'} {user.phone && `• ${user.phone}`}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold">
                      {user.username}
                    </td>

                    <td className="py-2.5 px-3">
                      {isSupport ? (
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                          className="bg-slate-100 border border-slate-300 rounded px-2 py-1 text-[11px] font-semibold text-slate-800 focus:outline-none"
                        >
                          <option value="student">Učenik</option>
                          <option value="president">Predsednik</option>
                          <option value="vice_president_even">Zamenik (parna)</option>
                          <option value="vice_president_odd">Zamenik (neparna)</option>
                          <option value="secretary">Zapisničar</option>
                          <option value="teacher_advisor">Nastavnik-saradnik</option>
                          <option value="support">Korisnička podrška</option>
                        </select>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 uppercase">
                          {user.role === 'president' && 'Predsednik'}
                          {user.role === 'vice_president_even' && 'Zamenik'}
                          {user.role === 'vice_president_odd' && 'Zamenik'}
                          {user.role === 'secretary' && 'Zapisničar'}
                          {user.role === 'teacher_advisor' && 'Nastavnik-saradnik'}
                          {user.role === 'student' && 'Učenik'}
                          {user.role === 'support' && 'Podrška'}
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3">
                      {user.status === 'must_change_password' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <KeyRound className="w-3 h-3 text-amber-700" />
                          <span>Privremena lozinka</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Aktivan nalog</span>
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {user.is_online ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Uživo</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Odsutan</span>
                      )}
                    </td>

                    {/* Actions: Reset Password & Delete */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => handleResetPassword(user)}
                          disabled={resettingId === user.id}
                          title="Resetuj lozinku na privremenu"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-colors"
                        >
                          <RotateCcw className={`w-3 h-3 ${resettingId === user.id ? 'animate-spin' : ''}`} />
                          <span>Resetuj</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setUserToDelete(user)}
                          disabled={user.id === currentUser.id}
                          title={user.id === currentUser.id ? 'Ne možete obrisati sopstveni nalog' : 'Obriši nalog'}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Obriši</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* PASSWORD RESET SUCCESS MODAL */}
      {resetResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-amber-500 overflow-hidden">
            <div className="bg-[#0b2240] px-5 py-4 text-white flex items-center justify-between border-b-2 border-amber-500">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">Lozinka je uspešno resetovana</h3>
              </div>
              <button
                onClick={() => setResetResult(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 leading-relaxed">
                Učenik <strong>{resetResult.user.name} {resetResult.user.surname}</strong> moraće da postavi novu trajnu lozinku pri sledećoj prijavi.
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Korisničko ime:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{resetResult.user.username}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Nova privremena lozinka:</span>
                  <span className="font-mono font-bold text-amber-900 text-sm bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                    {resetResult.tempPass}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyResetCredentials}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#004b87] hover:bg-[#003865] text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all"
                >
                  {resetCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{resetCopied ? 'Kopirano u privremenu memoriju!' : 'Kopiraj pristupne podatke za učenika'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResetResult(null)}
                  className="w-full py-2 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-all"
                >
                  Zatvori
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-300 overflow-hidden">
            <div className="bg-[#0b2240] px-5 py-4 text-white flex items-center justify-between border-b-2 border-rose-600">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-sm">Brisanje korisničkog naloga</h3>
              </div>
              <button
                onClick={() => setUserToDelete(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 text-sm">
                Da li ste sigurni da želite da trajno obrišete nalog za učenika:
              </p>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="font-bold text-rose-950 text-sm">
                  {userToDelete.name} {userToDelete.surname}
                </div>
                <div className="text-rose-800 text-xs">
                  Korisničko ime: <span className="font-mono font-bold">{userToDelete.username}</span> • {userToDelete.grade_class || 'Nije uneto'}
                </div>
              </div>

              <p className="text-slate-500 text-[11px] leading-relaxed">
                ⚠️ Ova akcija je <strong>nepovratna</strong>. Korisnik će biti trajno obrisan iz baze podataka parlamenta i biračkog spiska.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                >
                  Otkaži
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleting ? 'Brisanje...' : 'Da, trajno obriši'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BULK IMPORT SUCCESS MODAL */}
      {bulkSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-emerald-300 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-[#004b87] to-[#0b2240] px-6 py-4 text-white flex items-center justify-between border-b-2 border-emerald-500 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Grupni unos učenika je uspešno završen!</h3>
                  <p className="text-[11px] text-blue-200">
                    Kreirano je ukupno {bulkSuccessModal.length} novih naloga u sistemu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBulkSuccessModal(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>PDF izveštaj sa privremenim lozinkama je automatski preuzet!</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Generisan je zvanični dokument sa podacima za prijavu i poljima za svojeručni potpis učenika o preuzimanju privremene lozinke.
                </p>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => downloadBulkCredentialsPdf(bulkSuccessModal, users)}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#004b87] hover:bg-[#003865] text-white text-xs font-bold shadow transition-all"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>Preuzmi PDF ponovo</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyBulkCredentials}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-sm transition-all"
                >
                  {bulkCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  <span>{bulkCopied ? 'Kopirano u privremenu memoriju!' : 'Kopiraj sve podatke (tekst)'}</span>
                </button>
              </div>

              {/* Credentials table preview */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Pregled kreiranih naloga ({bulkSuccessModal.length}):
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">R.br.</th>
                        <th className="py-2 px-3">Učenik</th>
                        <th className="py-2 px-3">Odeljenje</th>
                        <th className="py-2 px-3">Korisničko ime</th>
                        <th className="py-2 px-3">Privremena lozinka</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bulkSuccessModal.map((item, idx) => (
                        <tr key={item.user.id} className="hover:bg-blue-50/40">
                          <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {item.user.name} {item.user.surname}
                          </td>
                          <td className="py-2 px-3 text-slate-500 text-[11px]">
                            {item.user.grade_class || '—'}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-blue-900 text-[11px]">
                            {item.user.username}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-amber-800 bg-amber-50/50 rounded text-[11px]">
                            {item.tempPass}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setBulkSuccessModal(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
