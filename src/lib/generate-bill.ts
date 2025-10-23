'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

const formatDate = (date: any, dateFormat = 'dd MMMM yyyy') => {
    let dateObj: Date;
    if (date instanceof Date) {
        dateObj = date;
    } else if (date instanceof Timestamp) {
        dateObj = date.toDate();
    } else if (typeof date === 'string' || typeof date === 'number') {
        dateObj = new Date(date);
    } else {
        return 'Data invalidă';
    }

    if (isNaN(dateObj.getTime())) {
        return 'Data invalidă';
    }

    return format(dateObj, dateFormat, { locale: ro });
};

export const generateBill = (conversation: any, websiteName: string) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const clientName = conversation.guestName || 'Vizitator';
  const invoiceDate = new Date();
  const invoiceNumber = `FACT-${Date.now()}`;
  
  const confirmedPayments = conversation.payments || [];
  let totalAmount = 0;

  // --- Colors from Template (approximated) ---
  const headerBg = '#7ba8c1';
  const titleColor = '#1e5773';
  const labelColor = '#5a9ab8';
  const textColor = '#4a5568';
  const strongTextColor = '#2d3748';
  const lightGray = '#f8fafc';
  const tableHeaderBg = '#e6f2f7';

  // --- Header with Wave ---
  doc.setFillColor(headerBg);
  const wave = [
    { op: 'm', c: [0, 0] },
    { op: 'l', c: [doc.internal.pageSize.getWidth(), 0] },
    { op: 'l', c: [doc.internal.pageSize.getWidth(), 60] },
    { op: 'l', c: [0, 80] },
    { op: 'l', c: [0, 0] },
    { op: 'f'}
  ];
  doc.path(wave);
  
  // --- Header Content ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor('#FFFFFF');
  doc.text('FACTURĂ', 20, 35);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(18);
  doc.setTextColor('#FFFFFF');
  doc.text(`#${invoiceNumber}`, 20, 45);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(websiteName, doc.internal.pageSize.getWidth() - 20, 35, { align: 'right' });


  // --- Parties Info ---
  const partiesY = 90;
  
  // FROM
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(labelColor);
  doc.text('DE LA', 20, partiesY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);
  doc.text(websiteName, 20, partiesY + 7);
  // Add more "FROM" details if available
  // doc.text('Adresă Companie', 20, partiesY + 14);
  // doc.text('contact@avocatlaw.ro', 20, partiesY + 21);

  // TO
  doc.text('CĂTRE', 80, partiesY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(strongTextColor);
  doc.text(clientName, 80, partiesY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);
  if (conversation.guestEmail) {
    doc.text(conversation.guestEmail, 80, partiesY + 14);
  }

  // INVOICE DETAILS
  const detailsX = doc.internal.pageSize.getWidth() - 60;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(labelColor);
  doc.text('NR. FACTURĂ:', detailsX, partiesY);
  doc.text('DATA FACTURII:', detailsX, partiesY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(strongTextColor);
  doc.text(invoiceNumber, doc.internal.pageSize.getWidth() - 20, partiesY, { align: 'right' });
  doc.text(formatDate(invoiceDate), doc.internal.pageSize.getWidth() - 20, partiesY + 7, { align: 'right' });


  // --- Table of Services ---
  const tableBody = confirmedPayments.map((payment: any, index: number) => {
      totalAmount += payment.amount;
      const paymentDate = formatDate(payment.confirmedAt, 'dd/MM/yyyy HH:mm');
      return [
        `Consultanță Online - ${paymentDate}`,
        '1',
        `${payment.amount.toFixed(2)} €`,
        `${payment.amount.toFixed(2)} €`,
      ];
  });

  doc.autoTable({
    startY: partiesY + 40,
    head: [['DESCRIERE', 'CANT.', 'PREȚ UNITAR', 'TOTAL']],
    body: tableBody,
    theme: 'grid',
    headStyles: { 
        fillColor: tableHeaderBg,
        textColor: labelColor,
        fontSize: 10,
        fontStyle: 'bold',
        cellPadding: 3,
    },
    styles: { 
        fontSize: 10,
        cellPadding: 3,
        lineColor: '#dee2e6'
    },
    didParseCell: function(data) {
        if (data.column.index > 0 && data.section === 'body') {
            data.cell.styles.halign = 'center';
        }
        if (data.column.index > 1 && data.section === 'head') {
            data.cell.styles.halign = 'center';
        }
        if (data.column.index === 3) {
            data.cell.styles.halign = 'right';
        }
    }
  });

  // --- Totals Section ---
  const finalY = doc.autoTable.previous.finalY;
  const totalSectionX = doc.internal.pageSize.getWidth() - 20;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor);
  doc.text('Subtotal:', totalSectionX - 40, finalY + 15, { align: 'right' });
  doc.text(`${totalAmount.toFixed(2)} €`, totalSectionX, finalY + 15, { align: 'right' });
  
  doc.setDrawColor(strongTextColor);
  doc.line(140, finalY + 22, totalSectionX, finalY + 22);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(strongTextColor);
  doc.text('Total General:', totalSectionX - 40, finalY + 30, { align: 'right' });
  doc.text(`${totalAmount.toFixed(2)} €`, totalSectionX, finalY + 30, { align: 'right' });

  // --- Footer ---
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor('#e2e8f0');
  doc.line(20, pageHeight - 35, doc.internal.pageSize.getWidth() - 20, pageHeight - 35);
  doc.setFontSize(9);
  doc.setTextColor('#94a3b8');
  const footerText = `Factură generată pentru ${clientName} de către ${websiteName}`;
  doc.text(footerText, doc.internal.pageSize.getWidth() / 2, pageHeight - 25, { align: 'center' });

  // --- Save the PDF ---
  doc.save(`Factura-${clientName.replace(/\s/g, '_')}-${invoiceNumber}.pdf`);
};
