import jsPDF from 'jspdf';
import type { Learner } from '../types';

export function generateDelegateBadgesPDF(learners: Learner[], eventName: string = 'TN Assembly') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Grid layout: 2 columns x 4 rows = 8 badges per A4 page
  const badgeWidth = 90;
  const badgeHeight = 62;
  const startX = 10;
  const startY = 10;
  const gapX = 10;
  const gapY = 8;

  learners.forEach((learner, idx) => {
    if (idx > 0 && idx % 8 === 0) {
      doc.addPage();
    }

    const posOnPage = idx % 8;
    const col = posOnPage % 2;
    const row = Math.floor(posOnPage / 2);

    const x = startX + col * (badgeWidth + gapX);
    const y = startY + row * (badgeHeight + gapY);

    // Outer Badge Border & Background
    doc.setLineWidth(0.5);
    doc.setDrawColor(180, 150, 60); // Gold border
    doc.setFillColor(252, 252, 254);
    doc.roundedRect(x, y, badgeWidth, badgeHeight, 3, 3, 'FD');

    // Header Banner (TN Assembly Green)
    doc.setFillColor(15, 81, 50); // Deep Emerald
    doc.rect(x, y, badgeWidth, 12, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TAMIL NADU YOUTH LEGISLATIVE ASSEMBLY', x + badgeWidth / 2, y + 5, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(eventName.toUpperCase(), x + badgeWidth / 2, y + 9.5, { align: 'center' });

    // Learner Name
    doc.setTextColor(20, 20, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(learner.full_name, x + 6, y + 18);

    // Dept & Academic Year
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 110);
    doc.text(`${learner.department || 'General'} • ${learner.academic_year || '1st Year'}`, x + 6, y + 22);

    // Bench & Party Pill
    const isRuling = learner.bench === 'Ruling';
    const benchColor = isRuling ? [22, 101, 52] : [153, 27, 27]; // Green vs Red
    doc.setFillColor(benchColor[0], benchColor[1], benchColor[2]);
    doc.roundedRect(x + 6, y + 25, 28, 5, 1, 1, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text((learner.bench || 'DELEGATE').toUpperCase(), x + 20, y + 28.5, { align: 'center' });

    // Party Name
    doc.setTextColor(40, 40, 60);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(learner.party_name ? `Party: ${learner.party_name}` : 'Party: Unassigned', x + 37, y + 28.5);

    // Role & Constituency Box
    doc.setDrawColor(220, 220, 230);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(x + 6, y + 32, badgeWidth - 12, 14, 2, 2, 'FD');

    // Role
    doc.setTextColor(15, 81, 50);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(learner.role || 'Member of Legislative Assembly (MLA)', x + 9, y + 37);

    // Constituency
    doc.setTextColor(60, 60, 80);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(learner.constituency_name ? `Const: ${learner.constituency_name}` : 'Const: Unassigned', x + 9, y + 42);

    // Access Code Banner at Bottom
    doc.setFillColor(240, 242, 245);
    doc.rect(x, y + badgeHeight - 11, badgeWidth, 11, 'F');
    doc.setDrawColor(200, 200, 210);
    doc.line(x, y + badgeHeight - 11, x + badgeWidth, y + badgeHeight - 11);

    doc.setTextColor(100, 100, 120);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('ACCESS CODE:', x + 6, y + badgeHeight - 4);

    doc.setTextColor(15, 81, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(learner.access_code, x + 34, y + badgeHeight - 3.5);

    // Committee badge right aligned
    if (learner.committee_name) {
      doc.setTextColor(100, 110, 130);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(learner.committee_name.substring(0, 18), x + badgeWidth - 6, y + badgeHeight - 4, { align: 'right' });
    }
  });

  doc.save(`${eventName.replace(/\s+/g, '_')}_Delegate_Badges.pdf`);
}
