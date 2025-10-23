'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const formatDate = (date: any) => {
    if (date instanceof Date) {
        return format(date, 'dd/MM/yy HH:mm');
    }
    if (date instanceof Timestamp) {
        return format(date.toDate(), 'dd/MM/yy HH:mm');
    }
    // Handle case where date might be a string from older data
    if (typeof date === 'string') {
        return format(new Date(date), 'dd/MM/yy HH:mm');
    }
    return 'Data invalidă';
};

export const generateBill = (conversation: any, websiteName: string) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const clientName = conversation.guestName || 'Vizitator';
  const invoiceDate = new Date();
  const invoiceNumber = `FACT-${Date.now()}`;
  
  const confirmedPayments = conversation.payments || [];
  let totalAmount = 0;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${websiteName}`, 14, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Servicii de Consultanță Juridică', 14, 28);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURĂ', 200, 22, { align: 'right' });

  // Client and Invoice Details
  doc.setLineWidth(0.5);
  doc.line(14, 35, 200, 35);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Client:', 14, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(clientName, 30, 45);
  if (conversation.guestEmail) {
    doc.text(conversation.guestEmail, 30, 50);
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Număr Factură:', 140, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceNumber, 170, 45);

  doc.setFont('helvetica', 'bold');
  doc.text('Data Facturării:', 140, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(format(invoiceDate, 'dd MMMM yyyy', { locale: ro }), 170, 50);

  // Table
  const tableBody = confirmedPayments.map((payment: any) => {
      totalAmount += payment.amount;
      const paymentDate = formatDate(payment.confirmedAt);
      return [
        `Consultanță (${paymentDate})`,
        '1',
        `${payment.amount.toFixed(2)} €`,
        `${payment.amount.toFixed(2)} €`,
      ];
  });

  doc.autoTable({
    startY: 65,
    head: [['Descriere Serviciu', 'Cantitate', 'Preț Unitar', 'Total']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [34, 40, 49] }, // --primary color
    styles: { fontSize: 10 },
  });

  // Totals
  const finalY = doc.autoTable.previous.finalY;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total de Plată:', 140, finalY + 15);
  doc.setFont('helvetica', 'bold');
  doc.text(`${totalAmount.toFixed(2)} €`, 200, finalY + 15, { align: 'right' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Vă mulțumim pentru încrederea acordată!', 14, 280);
  doc.text(`Factură generată de ${websiteName}`, 200, 280, { align: 'right' });

  // Save the PDF
  doc.save(`factura-${clientName.replace(/\s/g, '_')}-${invoiceNumber}.pdf`);
};
