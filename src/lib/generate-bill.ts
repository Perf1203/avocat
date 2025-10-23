'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

const formatDate = (date: any) => {
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

    return format(dateObj, 'dd/MM/yyyy HH:mm');
};

export const generateBill = (conversation: any, websiteName: string) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const clientName = conversation.guestName || 'Vizitator';
  const invoiceDate = new Date();
  const invoiceNumber = `FACT-${Date.now()}`;
  
  const confirmedPayments = conversation.payments || [];
  let totalAmount = 0;
  
  const primaryColor = '#222831'; // Corresponds to HSL 215 39.3% 20.2%
  const accentColor = '#FFC107'; // A sample accent color for contrast
  const lightGrayColor = '#f7f7f7';
  const textColor = '#444444';

  // --- Header Section ---
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 40, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor('#FFFFFF');
  doc.text(websiteName, 20, 25);
  
  doc.setFontSize(18);
  doc.setTextColor('#FFFFFF');
  doc.text('FACTURĂ', doc.internal.pageSize.getWidth() - 20, 25, { align: 'right' });


  // --- Client and Invoice Details Section ---
  doc.setFontSize(11);
  doc.setTextColor(textColor);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Facturat către:', 20, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(clientName, 20, 68);
  if (conversation.guestEmail) {
    doc.text(conversation.guestEmail, 20, 74);
  }

  const detailsX = doc.internal.pageSize.getWidth() - 20;
  doc.setFont('helvetica', 'bold');
  doc.text('Număr Factură:', detailsX, 60, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceNumber, detailsX, 68, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Data Facturării:', detailsX, 76, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(format(invoiceDate, 'dd MMMM yyyy', { locale: ro }), detailsX, 84, { align: 'right' });


  // --- Table of Services ---
  const tableBody = confirmedPayments.map((payment: any, index: number) => {
      totalAmount += payment.amount;
      const paymentDate = formatDate(payment.confirmedAt);
      return [
        index + 1,
        `Consultanță Online - ${paymentDate}`,
        '1',
        `${payment.amount.toFixed(2)} €`,
        `${payment.amount.toFixed(2)} €`,
      ];
  });

  doc.autoTable({
    startY: 100,
    head: [['#', 'Descriere Serviciu', 'Cant.', 'Preț Unitar', 'Total']],
    body: tableBody,
    theme: 'grid',
    headStyles: { 
        fillColor: primaryColor,
        textColor: '#FFFFFF',
        fontSize: 10,
        fontStyle: 'bold'
    },
    styles: { 
        fontSize: 10,
        cellPadding: 3,
        lineColor: '#dee2e6'
    },
    alternateRowStyles: {
        fillColor: lightGrayColor
    }
  });


  // --- Totals Section ---
  const finalY = doc.autoTable.previous.finalY;
  const totalSectionY = finalY + 15;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 150, totalSectionY, { align: 'right' });
  doc.text(`${totalAmount.toFixed(2)} €`, 200, totalSectionY, { align: 'right' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Total de Plată:', 150, totalSectionY + 8, { align: 'right' });
  doc.text(`${totalAmount.toFixed(2)} €`, 200, totalSectionY + 8, { align: 'right' });


  // --- Footer Section ---
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setLineWidth(0.2);
  doc.setDrawColor(primaryColor);
  doc.line(20, pageHeight - 30, doc.internal.pageSize.getWidth() - 20, pageHeight - 30);
  
  doc.setFontSize(9);
  doc.setTextColor('#888888');
  doc.text('Vă mulțumim pentru încrederea acordată!', 20, pageHeight - 22);
  doc.text(`Factură generată de ${websiteName}`, doc.internal.pageSize.getWidth() - 20, pageHeight - 22, { align: 'right' });


  // --- Save the PDF ---
  doc.save(`factura-${clientName.replace(/\s/g, '_')}-${invoiceNumber}.pdf`);
};
