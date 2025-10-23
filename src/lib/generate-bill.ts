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
        return 'Data invalida';
    }

    if (isNaN(dateObj.getTime())) {
        return 'Data invalida';
    }

    return format(dateObj, dateFormat, { locale: ro });
};

// Function to normalize Romanian characters
const normalizeText = (text: string): string => {
    if (!text) return '';
    return text
        .replace(/ă/g, 'a')
        .replace(/â/g, 'a')
        .replace(/î/g, 'i')
        .replace(/ș/g, 's')
        .replace(/ț/g, 't')
        .replace(/Ă/g, 'A')
        .replace(/Â/g, 'A')
        .replace(/Î/g, 'I')
        .replace(/Ș/g, 'S')
        .replace(/Ț/g, 'T');
};


export const generateBill = (conversation: any, websiteName: string) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const clientName = conversation.guestName || 'Vizitator';
  const invoiceDate = new Date();
  const invoiceNumber = `FACT-${Date.now()}`;
  
  const confirmedPayments = conversation.payments || [];
  let totalAmount = 0;

  // --- Colors from Template ---
  const primaryColor = '#2C5282'; 
  const secondaryColor = '#7ba8c1';
  const textColor = '#2D3748';
  const lightGray = '#F7F9FC';
  const midGray = '#E2E8F0';
  const darkGray = '#4A5568';
  

  // --- Header with Wave ---
  doc.setFillColor(primaryColor);
  doc.path([
    { op: 'm', c: [0, 0] },
    { op: 'l', c: [doc.internal.pageSize.getWidth(), 0] },
    { op: 'l', c: [doc.internal.pageSize.getWidth(), 60] },
    { op: 'l', c: [0, 80] },
    { op: 'l', c: [0, 0] },
    { op: 'f'}
  ]).stroke();

  // --- Header Content ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor('#FFFFFF');
  doc.text(normalizeText('FACTURĂ'), 20, 35);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(normalizeText(websiteName), doc.internal.pageSize.getWidth() - 20, 35, { align: 'right' });


  // --- Parties & Details Info ---
  const partiesY = 100;
  
  // FROM
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(secondaryColor);
  doc.text(normalizeText('DE LA:'), 20, partiesY);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor);
  doc.text(normalizeText(websiteName), 20, partiesY + 7);


  // TO
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(secondaryColor);
  doc.text(normalizeText('FACTURAT CĂTRE:'), 80, partiesY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor);
  doc.text(normalizeText(clientName), 80, partiesY + 7);
  if (conversation.guestEmail) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor);
    doc.text(normalizeText(conversation.guestEmail), 80, partiesY + 14);
  }
  
  // INVOICE DETAILS
  const detailsLabelX = doc.internal.pageSize.getWidth() - 70;
  const detailsValueX = doc.internal.pageSize.getWidth() - 20;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(secondaryColor);
  doc.text(normalizeText('NR. FACTURA:'), detailsLabelX, partiesY, { align: 'left' });
  doc.text(normalizeText('DATA FACTURII:'), detailsLabelX, partiesY + 7, { align: 'left' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);
  doc.text(invoiceNumber, detailsValueX, partiesY, { align: 'right' });
  doc.text(normalizeText(formatDate(invoiceDate)), detailsValueX, partiesY + 7, { align: 'right' });



  // --- Table of Services ---
  const tableBody = confirmedPayments.map((payment: any) => {
      totalAmount += payment.amount;
      const paymentDate = normalizeText(formatDate(payment.confirmedAt, 'dd/MM/yyyy HH:mm'));
      return [
        `Consultanta Online - ${paymentDate}`,
        '1',
        `${payment.amount.toFixed(2)} €`,
        `${payment.amount.toFixed(2)} €`,
      ];
  });

  doc.autoTable({
    startY: partiesY + 30,
    head: [[normalizeText('DESCRIERE'), 'CANT.', normalizeText('PREȚ UNITAR'), 'TOTAL']],
    body: tableBody,
    theme: 'grid',
    headStyles: { 
        fillColor: primaryColor,
        textColor: '#FFFFFF',
        fontSize: 10,
        fontStyle: 'bold',
    },
    styles: { 
        fontSize: 10,
        lineColor: midGray,
        lineWidth: 0.1,
    },
    didParseCell: function(data) {
        if (data.section === 'head' || data.section === 'foot') {
            data.cell.styles.halign = 'center';
        }
        if (data.column.index > 0 && data.section === 'body') {
            data.cell.styles.halign = 'right';
        }
    }
  });

  // --- Totals Section ---
  const finalY = doc.autoTable.previous.finalY;
  const totalSectionX = doc.internal.pageSize.getWidth() - 20;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray);
  doc.text(normalizeText('Subtotal:'), totalSectionX - 50, finalY + 15, { align: 'right' });
  doc.text(`${totalAmount.toFixed(2)} €`, totalSectionX, finalY + 15, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor);
  doc.text(normalizeText('Total General:'), totalSectionX - 50, finalY + 25, { align: 'right' });
  doc.text(`${totalAmount.toFixed(2)} €`, totalSectionX, finalY + 25, { align: 'right' });

  // --- Footer ---
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(midGray);
  doc.line(20, pageHeight - 35, doc.internal.pageSize.getWidth() - 20, pageHeight - 35);
  doc.setFontSize(9);
  doc.setTextColor(darkGray);
  doc.text(normalizeText('Vă mulțumim pentru încredere!'), doc.internal.pageSize.getWidth() / 2, pageHeight - 25, { align: 'center' });
  doc.text(normalizeText(`Factură generată pentru ${clientName} de către ${websiteName}.`), doc.internal.pageSize.getWidth() / 2, pageHeight - 20, { align: 'center' });


  // --- Save the PDF ---
  doc.save(`Factura-${clientName.replace(/\s/g, '_')}-${invoiceNumber}.pdf`);
};
