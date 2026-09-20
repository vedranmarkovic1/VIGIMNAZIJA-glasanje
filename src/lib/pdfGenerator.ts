import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Poll, PollStatistics } from '../types';

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
  totalStudents: number
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

  let currentY = 51;

  // SECTION 1: Opšte informacije o glasanju
  autoTable(doc, {
    startY: currentY,
    head: [['1. OPŠTE INFORMACIJE O GLASANJU', '']],
    body: [
      ['Naslov sednice / tačke dnevnog reda:', poll.title || 'Redovna tačka dnevnog reda'],
      ['Pitanje o kome se parlament izjašnjavao:', `"${poll.question}"`],
      ['Tip glasanja:', poll.type === 'classic' ? 'Klasično izjašnjavanje (ZA / PROTIV / UZDRŽAN/A)' : 'Višestruki izbor kandidata'],
      ['Predlagač tačke:', poll.created_by_name || 'Predsednik parlamenta'],
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
  doc.text('Mihailo Savić', x1, currentY + 7.5, { align: 'center' });
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
  doc.text('Jelena Todorović', x2, currentY + 7.5, { align: 'center' });
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
  doc.text('Prof. dr Branka Milić', x3, currentY + 7.5, { align: 'center' });
  doc.setFont(fontName, 'normal');
  doc.text('Nastavnik-saradnik', x3, currentY + 11, { align: 'center' });

  // Official Stamp placeholder
  currentY += 15;
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(200, 200, 200);
  doc.line(15, currentY, pageWidth - 15, currentY);
  doc.setFontSize(7.5);
  doc.setTextColor(130, 130, 130);
  doc.text('M.P. Zvanični pečat Šeste beogradske gimnazije', 15, currentY + 4);
  doc.text(`Identifikator glasanja: ${poll.id}`, pageWidth - 15, currentY + 4, { align: 'right' });

  // Direct download to user's device!
  const fileName = `Zapisnik_UP_Sesta_Gimnazija_${poll.id}.pdf`;
  doc.save(fileName);
};
