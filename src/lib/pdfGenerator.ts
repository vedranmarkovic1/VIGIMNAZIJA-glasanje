import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Poll, PollStatistics, User, UserVote } from '../types';

interface PdfAssets {
  regularFont: string;
  boldFont: string;
  logo: string;
}

let cachedAssets: PdfAssets | null = null;

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function loadPdfAssets(): Promise<PdfAssets | null> {
  if (cachedAssets) return cachedAssets;

  try {
    const [regularFont, boldFont, logo] = await Promise.all([
      fetchAsBase64('/fonts/arial.ttf'),
      fetchAsBase64('/fonts/arialbd.ttf'),
      fetchAsBase64('/parlament-logo.png'),
    ]);

    cachedAssets = { regularFont, boldFont, logo };
    return cachedAssets;
  } catch (err) {
    console.warn('Greška pri učitavanju fontova/logoa za PDF, koristiće se rezervni mod:', err);
    return null;
  }
}

export const downloadOfficialPdfReport = async (
  poll: Poll,
  stats: PollStatistics,
  totalStudents: number,
  users: User[] = []
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const assets = await loadPdfAssets();
  let fontName = 'helvetica';

  if (assets) {
    // Register Arial with full UTF-8 Unicode support for Serbian letters (Č, Ć, Ž, Đ, Š)
    doc.addFileToVFS('Arial.ttf', assets.regularFont);
    doc.addFont('Arial.ttf', 'Arial', 'normal');

    doc.addFileToVFS('Arial-Bold.ttf', assets.boldFont);
    doc.addFont('Arial-Bold.ttf', 'Arial', 'bold');

    fontName = 'Arial';
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const protocolNumber = `UP-VI-${poll.id.replace(/[^0-9]/g, '').slice(-4) || '2026'}/09`;
  const reportDate = new Date().toLocaleDateString('sr-RS');

  // Format dates
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 1. Header with official circular logo
  if (assets?.logo) {
    try {
      doc.addImage(`data:image/png;base64,${assets.logo}`, 'PNG', 15, 12, 18, 18);
    } catch (e) {
      console.warn('Could not render logo in PDF:', e);
    }
  }

  const textLeftX = assets?.logo ? 36 : 15;

  doc.setFont(fontName, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 34, 64); // Dark Navy
  doc.text('ŠESTA BEOGRADSKA GIMNAZIJA', textLeftX, 18);

  doc.setFontSize(9.5);
  doc.setTextColor(0, 75, 135); // Royal Blue
  doc.text('UČENIČKI PARLAMENT', textLeftX, 23);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Ulica Milana Rakića 33, 11000 Beograd', textLeftX, 28);

  // Right side protocol info
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(`Delovodni broj: ${protocolNumber}`, pageWidth - 15, 17, { align: 'right' });
  doc.text(`Datum sednice: ${reportDate}`, pageWidth - 15, 22, { align: 'right' });

  // Double Divider line
  doc.setDrawColor(11, 34, 64);
  doc.setLineWidth(0.7);
  doc.line(15, 33, pageWidth - 15, 33);
  doc.setLineWidth(0.2);
  doc.line(15, 34.2, pageWidth - 15, 34.2);

  // Title
  doc.setFont(fontName, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(11, 34, 64);
  doc.text('ZAPISNIK O REZULTATIMA ELEKTRONSKOG GLASANJA', pageWidth / 2, 42, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont(fontName, 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Verifikovano putem zvaničnog informacionog sistema e-Parlament', pageWidth / 2, 46.5, { align: 'center' });

  // Lookup dynamic officials from database users
  const president = users.find((u) => u.role === 'president');
  const secretary = users.find((u) => u.role === 'secretary');
  const teacherAdvisor = users.find((u) => u.role === 'teacher_advisor');

  const presidentName = president ? `${president.name} ${president.surname}` : '';
  const secretaryName = secretary ? `${secretary.name} ${secretary.surname}` : '';
  const teacherAdvisorName = teacherAdvisor ? `${teacherAdvisor.name} ${teacherAdvisor.surname}` : '';

  const creatorUser = users.find((u) => u.id === poll.created_by);
  const creatorDisplayName = creatorUser
    ? `${creatorUser.name} ${creatorUser.surname}`
    : (poll.created_by_name || 'Predsedništvo parlamenta');

  let currentY = 51;

  // SECTION 1: Opšte informacije o glasanju
  autoTable(doc, {
    startY: currentY,
    head: [['1. OPŠTE INFORMACIJE O GLASANJU', '']],
    body: [
      ['Naslov sednice / tačke dnevnog reda:', poll.title || 'Redovna tačka dnevnog reda'],
      ['Pitanje o kome se parlament izjašnjavao:', `"${poll.question}"`],
      ['Tip glasanja:', poll.type === 'classic' ? 'Klasično izjašnjavanje (ZA / PROTIV / UZDRŽAN/A)' : 'Višestruki izbor kandidata'],
      ['Predlagač tačke:', creatorDisplayName],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [0, 75, 135],
      textColor: 255,
      font: fontName,
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 70, font: fontName, fontStyle: 'bold', textColor: [60, 60, 60] },
      1: { cellWidth: 'auto', font: fontName, textColor: [20, 20, 20] },
    },
    styles: { font: fontName, fontSize: 8.5, cellPadding: 2.5 },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  currentY = doc.lastAutoTable.finalY + 5;

  // SECTION 2: Vremenski zapisnik
  autoTable(doc, {
    startY: currentY,
    head: [['2. VREMENSKI ZAPISNIK', '']],
    body: [
      ['Vreme unosa tačke u sistem:', formatDate(poll.created_at)],
      ['Tačno vreme otvaranja birališta (unlocked):', formatDate(poll.unlocked_at)],
      ['Tačno vreme zatvaranja birališta (closed):', formatDate(poll.closed_at)],
      ['Ukupno trajanje glasanja:', `${stats.durationFormatted} (${stats.durationSeconds} sekundi)`],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [0, 75, 135],
      textColor: 255,
      font: fontName,
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 70, font: fontName, fontStyle: 'bold', textColor: [60, 60, 60] },
      1: { cellWidth: 'auto', font: fontName, textColor: [20, 20, 20] },
    },
    styles: { font: fontName, fontSize: 8.5, cellPadding: 2.5 },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  currentY = doc.lastAutoTable.finalY + 5;

  // SECTION 3: Kvorum i odziv birača (Kvorum je polovina registrovanih učenika)
  const studentCount = totalStudents > 0 ? totalStudents : stats.registeredVoters;
  const requiredQuorum = Math.ceil(studentCount / 2);
  const quorumMet = stats.totalVotes >= requiredQuorum;

  autoTable(doc, {
    startY: currentY,
    head: [['3. VERIFIKACIJA KVORUMA (Pravilo: najmanje 50% registrovanih učenika)', '']],
    body: [
      ['Ukupan broj registrovanih učenika u sistemu:', `${studentCount} učenika`],
      ['Potreban broj glasova za punopravan kvorum (50%):', `${requiredQuorum} učenika`],
      ['Ukupno evidentiranih glasova na sednici:', `${stats.totalVotes} glasova (${stats.turnoutPercentage}%)`],
      [
        'Zvanična ocena kvoruma:',
        quorumMet
          ? `KVORUM JE ISPUNJEN (${stats.totalVotes} od potrebnih ${requiredQuorum}). Odluka je pravosnažna.`
          : `KVORUM NIJE ISPUNJEN (${stats.totalVotes} od potrebnih ${requiredQuorum}).`,
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [0, 75, 135],
      textColor: 255,
      font: fontName,
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 70, font: fontName, fontStyle: 'bold', textColor: [60, 60, 60] },
      1: { cellWidth: 'auto', font: fontName, textColor: quorumMet ? [0, 100, 0] : [180, 0, 0], fontStyle: 'bold' },
    },
    styles: { font: fontName, fontSize: 8.5, cellPadding: 2.5 },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  currentY = doc.lastAutoTable.finalY + 5;

  // SECTION 4: Rezultati glasanja
  const resultsBody = stats.results.map((r, i) => [
    `${i + 1}.`,
    r.option,
    `${r.count}`,
    `${r.percentage}%`,
  ]);
  resultsBody.push(['', 'UKUPNO GLASOVA:', `${stats.totalVotes}`, '100.0%']);

  autoTable(doc, {
    startY: currentY,
    head: [['R. br.', 'Ponuđena opcija / Kandidat', 'Broj glasova', 'Procenat']],
    body: resultsBody,
    theme: 'striped',
    headStyles: {
      fillColor: [11, 34, 64],
      textColor: 255,
      font: fontName,
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center', font: fontName },
      1: { cellWidth: 'auto', font: fontName, fontStyle: 'bold' },
      2: { cellWidth: 35, halign: 'center', font: fontName, fontStyle: 'bold' },
      3: { cellWidth: 30, halign: 'center', font: fontName, fontStyle: 'bold', textColor: [0, 75, 135] },
    },
    styles: { font: fontName, fontSize: 8.5, cellPadding: 2.5 },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  currentY = doc.lastAutoTable.finalY + 16;

  // SECTION 5: Signatures
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text('POTPISI I VERIFIKACIJA ČLANOVA RADNOG PREDSEDNIŠTVA', pageWidth / 2, currentY, { align: 'center' });

  currentY += 13;

  const colWidth = (pageWidth - 30) / 3;

  // President
  const x1 = 15 + colWidth / 2;
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(x1 - 22, currentY, x1 + 22, currentY);
  doc.setFontSize(8);
  doc.setFont(fontName, 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('(svojeručni potpis)', x1, currentY + 3.5, { align: 'center' });
  doc.setFont(fontName, 'bold');
  doc.setTextColor(20, 20, 20);
  if (presidentName) {
    doc.text(presidentName, x1, currentY + 7.5, { align: 'center' });
  }
  doc.setFont(fontName, 'normal');
  doc.text('Predsednik parlamenta', x1, currentY + 11, { align: 'center' });

  // Secretary
  const x2 = 15 + colWidth + colWidth / 2;
  doc.line(x2 - 22, currentY, x2 + 22, currentY);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('(svojeručni potpis)', x2, currentY + 3.5, { align: 'center' });
  doc.setFont(fontName, 'bold');
  doc.setTextColor(20, 20, 20);
  if (secretaryName) {
    doc.text(secretaryName, x2, currentY + 7.5, { align: 'center' });
  }
  doc.setFont(fontName, 'normal');
  doc.text('Zapisničar', x2, currentY + 11, { align: 'center' });

  // Teacher-advisor
  const x3 = 15 + 2 * colWidth + colWidth / 2;
  doc.line(x3 - 22, currentY, x3 + 22, currentY);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('(svojeručni potpis)', x3, currentY + 3.5, { align: 'center' });
  doc.setFont(fontName, 'bold');
  doc.setTextColor(20, 20, 20);
  if (teacherAdvisorName) {
    doc.text(teacherAdvisorName, x3, currentY + 7.5, { align: 'center' });
  }
  doc.setFont(fontName, 'normal');
  doc.text('Nastavnik-saradnik', x3, currentY + 11, { align: 'center' });

  // Bottom line & Document ID (No M.P. - no stamp)
  currentY += 15;
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(200, 200, 200);
  doc.line(15, currentY, pageWidth - 15, currentY);
  doc.setFontSize(7.5);
  doc.setTextColor(130, 130, 130);
  doc.text('Zvanični elektronski zapisnik Učeničkog parlamenta', 15, currentY + 4);
  doc.text(`Identifikator glasanja: ${poll.id}`, pageWidth - 15, currentY + 4, { align: 'right' });

  // Direct download to user's device!
  const fileName = `Zapisnik_UP_Sesta_Gimnazija_${poll.id}.pdf`;
  doc.save(fileName);
};

export const downloadVotersPdfReport = async (
  poll: Poll,
  users: User[],
  votes: UserVote[]
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const assets = await loadPdfAssets();
  let fontName = 'helvetica';

  if (assets) {
    // Register Arial with full UTF-8 Unicode support for Serbian letters (Č, Ć, Ž, Đ, Š)
    doc.addFileToVFS('Arial.ttf', assets.regularFont);
    doc.addFont('Arial.ttf', 'Arial', 'normal');

    doc.addFileToVFS('Arial-Bold.ttf', assets.boldFont);
    doc.addFont('Arial-Bold.ttf', 'Arial', 'bold');

    fontName = 'Arial';
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const protocolNumber = `UP-VI-${poll.id.replace(/[^0-9]/g, '').slice(-4) || '2026'}/09`;
  const reportDate = new Date().toLocaleDateString('sr-RS');

  // 1. Header with official circular logo
  if (assets?.logo) {
    try {
      doc.addImage(`data:image/png;base64,${assets.logo}`, 'PNG', 15, 12, 18, 18);
    } catch (e) {
      console.warn('Could not render logo in PDF:', e);
    }
  }

  const textLeftX = assets?.logo ? 36 : 15;

  doc.setFont(fontName, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 34, 64);
  doc.text('ŠESTA BEOGRADSKA GIMNAZIJA', textLeftX, 18);

  doc.setFontSize(10);
  doc.setTextColor(0, 75, 135);
  doc.text('UČENIČKI PARLAMENT', textLeftX, 23.5);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Ulica Milana Rakića 33, 11000 Beograd', textLeftX, 28.5);

  // Right side protocol info
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(`Delovodni broj: ${protocolNumber}`, pageWidth - 15, 18, { align: 'right' });
  doc.text(`Datum: ${reportDate}`, pageWidth - 15, 23.5, { align: 'right' });

  // Divider line
  doc.setDrawColor(11, 34, 64);
  doc.setLineWidth(0.6);
  doc.line(15, 33, pageWidth - 15, 33);

  // Title
  doc.setFont(fontName, 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(11, 34, 64);
  doc.text('IZVEŠTAJ GLASAČA', pageWidth / 2, 42, { align: 'center' });

  // Agenda item / question
  let currentY = 50;

  if (poll.title) {
    doc.setFont(fontName, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    const splitTitle = doc.splitTextToSize(`Tačka dnevnog reda: ${poll.title}`, pageWidth - 30);
    doc.text(splitTitle, 15, currentY);
    currentY += splitTitle.length * 4.5 + 1;
  }

  doc.setFont(fontName, 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 40, 40);
  const splitQuestion = doc.splitTextToSize(`Pitanje: „${poll.question}”`, pageWidth - 30);
  doc.text(splitQuestion, 15, currentY);
  currentY += splitQuestion.length * 4.5 + 4;

  // Filter voters for this poll
  const pollVotes = votes.filter((v) => v.poll_id === poll.id);
  const voterIds = new Set(pollVotes.map((v) => v.user_id));
  let votersList = users.filter((u) => voterIds.has(u.id));

  // Fallback to all student delegates if poll has 0 recorded votes (e.g. attendance roll)
  if (votersList.length === 0) {
    votersList = users.filter((u) => u.role === 'student');
  }

  // Sort by class (I-1, I-2, ...), then by surname and name
  votersList.sort((a, b) => {
    const classA = a.grade_class || '';
    const classB = b.grade_class || '';
    const classCompare = classA.localeCompare(classB, 'sr', { numeric: true });
    if (classCompare !== 0) return classCompare;
    const surnameCompare = (a.surname || '').localeCompare(b.surname || '', 'sr');
    if (surnameCompare !== 0) return surnameCompare;
    return (a.name || '').localeCompare(b.name || '', 'sr');
  });

  const tableBody = votersList.map((voter, index) => [
    (index + 1).toString(),
    `${voter.name} ${voter.surname}`,
    voter.grade_class || '—',
    voter.phone || '—',
    '', // Mesto za svojeručni potpis glasača
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['R. br.', 'Ime i prezime glasača', 'Odeljenje', 'Broj telefona', 'Potpis glasača']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 75, 135],
      textColor: 255,
      font: fontName,
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    styles: {
      font: fontName,
      fontSize: 8,
      cellPadding: 2,
      minCellHeight: 7.5,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 52, halign: 'left' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 38, halign: 'center' },
      4: { cellWidth: 'auto', halign: 'center' },
    },
    margin: { top: 20, bottom: 25, left: 15, right: 15 },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  let finalY = doc.lastAutoTable.finalY + 8;

  // If near the bottom, add a new page for signatures
  if (finalY > pageHeight - 35) {
    doc.addPage();
    finalY = 25;
  }

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text(`Ukupno evidentiranih glasača: ${votersList.length}`, 15, finalY);

  finalY += 12;

  // Lookup dynamic officials from database users
  const president = users.find((u) => u.role === 'president');
  const secretary = users.find((u) => u.role === 'secretary');

  const presidentName = president ? `${president.name} ${president.surname}` : '';
  const secretaryName = secretary ? `${secretary.name} ${secretary.surname}` : '';

  // Bottom verification signatures
  const colWidth = (pageWidth - 30) / 2;
  const sig1X = 15 + colWidth / 2;
  const sig2X = 15 + colWidth + colWidth / 2;

  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);

  // Left signature: Predsednik
  doc.line(sig1X - 28, finalY, sig1X + 28, finalY);
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text('(svojeručni potpis)', sig1X, finalY + 3.5, { align: 'center' });
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  if (presidentName) {
    doc.text(presidentName, sig1X, finalY + 7.5, { align: 'center' });
  }
  doc.setFont(fontName, 'normal');
  doc.text('Predsednik parlamenta', sig1X, finalY + 11, { align: 'center' });

  // Right signature: Zapisničar
  doc.line(sig2X - 28, finalY, sig2X + 28, finalY);
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text('(svojeručni potpis)', sig2X, finalY + 3.5, { align: 'center' });
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  if (secretaryName) {
    doc.text(secretaryName, sig2X, finalY + 7.5, { align: 'center' });
  }
  doc.setFont(fontName, 'normal');
  doc.text('Zapisničar', sig2X, finalY + 11, { align: 'center' });

  // Direct download
  const cleanId = poll.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(-6) || 'sednica';
  const fileName = `Spisak_Glasaca_UP_Sesta_Gimnazija_${cleanId}.pdf`;
  doc.save(fileName);
};

export const downloadBulkCredentialsPdf = async (
  createdUsers: Array<{ user: User; tempPass: string }>,
  allUsers: User[] = []
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const assets = await loadPdfAssets();
  let fontName = 'helvetica';

  if (assets) {
    doc.addFileToVFS('Arial.ttf', assets.regularFont);
    doc.addFont('Arial.ttf', 'Arial', 'normal');

    doc.addFileToVFS('Arial-Bold.ttf', assets.boldFont);
    doc.addFont('Arial-Bold.ttf', 'Arial', 'bold');

    fontName = 'Arial';
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const reportDate = new Date().toLocaleDateString('sr-RS');
  const protocolNumber = `UP-NAL-${Date.now().toString().slice(-4)}/2026`;

  // 1. Header with official circular logo
  if (assets?.logo) {
    try {
      doc.addImage(`data:image/png;base64,${assets.logo}`, 'PNG', 15, 12, 18, 18);
    } catch (e) {
      console.warn('Could not render logo in PDF:', e);
    }
  }

  const textLeftX = assets?.logo ? 36 : 15;

  doc.setFont(fontName, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 34, 64);
  doc.text('ŠESTA BEOGRADSKA GIMNAZIJA', textLeftX, 18);

  doc.setFontSize(10);
  doc.setTextColor(0, 75, 135);
  doc.text('UČENIČKI PARLAMENT', textLeftX, 23.5);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Ulica Milana Rakića 33, 11000 Beograd', textLeftX, 28.5);

  // Right side info
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(`Delovodni broj: ${protocolNumber}`, pageWidth - 15, 18, { align: 'right' });
  doc.text(`Datum izdavanja: ${reportDate}`, pageWidth - 15, 23.5, { align: 'right' });

  // Divider line
  doc.setDrawColor(11, 34, 64);
  doc.setLineWidth(0.6);
  doc.line(15, 33, pageWidth - 15, 33);

  // Document Title
  doc.setFont(fontName, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(11, 34, 64);
  doc.text('SPISAK KREIRANIH NALOGA I PRIVREMENIH LOZINKI', pageWidth / 2, 42, { align: 'center' });

  // Note on security & mandatory password change
  doc.setFont(fontName, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  const noteText = 'POVERLJIV DOKUMENT: Svaki učenik/delegat parlamenta obavezan je da pri prvoj prijavi u sistem promeni privremenu lozinku u trajnu ličnu lozinku.';
  doc.text(noteText, pageWidth / 2, 47, { align: 'center' });

  // Sort created users by grade_class, then by surname and name
  const sortedUsers = [...createdUsers].sort((a, b) => {
    const classA = a.user.grade_class || '';
    const classB = b.user.grade_class || '';
    const classCompare = classA.localeCompare(classB, 'sr', { numeric: true });
    if (classCompare !== 0) return classCompare;
    const surnameCompare = (a.user.surname || '').localeCompare(b.user.surname || '', 'sr');
    if (surnameCompare !== 0) return surnameCompare;
    return (a.user.name || '').localeCompare(b.user.name || '', 'sr');
  });

  const tableBody = sortedUsers.map((item, index) => [
    (index + 1).toString(),
    `${item.user.name} ${item.user.surname}`,
    item.user.grade_class || '—',
    item.user.username,
    item.tempPass,
    item.user.phone || '—',
    '', // Mesto za potpis o preuzimanju
  ]);

  autoTable(doc, {
    startY: 52,
    head: [['R. br.', 'Ime i prezime učenika', 'Odeljenje', 'Korisničko ime', 'Privremena lozinka', 'Broj telefona', 'Potpis o preuzimanju']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 75, 135],
      textColor: 255,
      font: fontName,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    styles: {
      font: fontName,
      fontSize: 7.5,
      cellPadding: 2,
      minCellHeight: 7,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 38, halign: 'left' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 24, halign: 'center' },
      6: { cellWidth: 'auto', halign: 'center' },
    },
    margin: { top: 20, bottom: 25, left: 15, right: 15 },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  let finalY = doc.lastAutoTable.finalY + 8;

  // If near the bottom, add a new page for signatures
  if (finalY > pageHeight - 35) {
    doc.addPage();
    finalY = 25;
  }

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text(`Ukupno izdato naloga: ${createdUsers.length}`, 15, finalY);

  finalY += 12;

  // Lookup dynamic officials from database users
  const president = allUsers.find((u) => u.role === 'president');
  const secretary = allUsers.find((u) => u.role === 'secretary');

  const presidentName = president ? `${president.name} ${president.surname}` : '';
  const secretaryName = secretary ? `${secretary.name} ${secretary.surname}` : '';

  // Bottom verification signatures
  const colWidth = (pageWidth - 30) / 2;
  const sig1X = 15 + colWidth / 2;
  const sig2X = 15 + colWidth + colWidth / 2;

  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);

  // Left signature: Predsednik
  doc.line(sig1X - 28, finalY, sig1X + 28, finalY);
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text('(svojeručni potpis)', sig1X, finalY + 3.5, { align: 'center' });
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  if (presidentName) {
    doc.text(presidentName, sig1X, finalY + 7.5, { align: 'center' });
  }
  doc.setFont(fontName, 'normal');
  doc.text('Predsednik parlamenta', sig1X, finalY + 11, { align: 'center' });

  // Right signature: Zapisničar
  doc.line(sig2X - 28, finalY, sig2X + 28, finalY);
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text('(svojeručni potpis)', sig2X, finalY + 3.5, { align: 'center' });
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  if (secretaryName) {
    doc.text(secretaryName, sig2X, finalY + 7.5, { align: 'center' });
  }
  doc.setFont(fontName, 'normal');
  doc.text('Zapisničar', sig2X, finalY + 11, { align: 'center' });

  // Direct download
  const dateFormatted = new Date().toISOString().slice(0, 10);
  const fileName = `Spisak_Privremenih_Lozinki_UP_Sesta_${dateFormatted}.pdf`;
  doc.save(fileName);
};


