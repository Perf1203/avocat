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

  // --- Colors from Template ---
  const headerBgColor = '#2C5282'; // A darker blue from the theme
  const titleColor = '#FFFFFF';
  const labelColor = '#4A5568'; // A muted gray
  const textColor = '#2D3748'; // Darker text
  const tableHeaderBg = '#EBF8FF'; // Light blue
  const tableHeaderColor = '#2C5282';
  const borderColor = '#E2E8F0';

  // --- Header ---
  doc.setFillColor(headerBgColor);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 50, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(titleColor);
  doc.text('FACTURĂ', 20, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.text(websiteName, doc.internal.pageSize.getWidth() - 20, 30, { align: 'right' });


  // --- Parties Info ---
  const partiesY = 70;
  
  // FROM
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(labelColor);
  doc.text('DE LA:', 20, partiesY);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor);
  doc.text(websiteName, 20, partiesY + 7);
  // You can add more company details here if available
  // doc.text('Adresa companiei', 20, partiesY + 14);


  // TO
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(labelColor);
  doc.text('FACTURAT CĂTRE:', 80, partiesY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor);
  doc.text(clientName, 80, partiesY + 7);
  if (conversation.guestEmail) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor);
    doc.text(conversation.guestEmail, 80, partiesY + 14);
  }

  // INVOICE DETAILS
  const detailsX = doc.internal.pageSize.getWidth() - 70;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(labelColor);
  doc.text('NR. FACTURĂ:', detailsX, partiesY);
  doc.text('DATA FACTURII:', detailsX, partiesY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);
  doc.text(invoiceNumber, doc.internal.pageSize.getWidth() - 20, partiesY, { align: 'right' });
  doc.text(formatDate(invoiceDate), doc.internal.pageSize.getWidth() - 20, partiesY + 7, { align: 'right' });


  // --- Table of Services ---
  const tableBody = confirmedPayments.map((payment: any) => {
      totalAmount += payment.amount;
      const paymentDate = formatDate(payment.confirmedAt, 'dd/MM/yyyy HH:mm');
      // Using "Consultanta" to avoid character encoding issues in PDF
      return [
        `Consultanta Online - ${paymentDate}`,
        '1',
        `${payment.amount.toFixed(2)} €`,
        `${payment.amount.toFixed(2)} €`,
      ];
  });

  doc.autoTable({
    startY: partiesY + 30,
    head: [['DESCRIERE', 'CANT.', 'PREȚ UNITAR', 'TOTAL']],
    body: tableBody,
    theme: 'grid',
    headStyles: { 
        fillColor: tableHeaderBg,
        textColor: tableHeaderColor,
        fontSize: 10,
        fontStyle: 'bold',
        cellPadding: 3,
    },
    styles: { 
        fontSize: 10,
        cellPadding: 3,
        lineColor: borderColor,
        lineWidth: 0.1,
    },
    didParseCell: function(data) {
        if (data.section === 'head') {
            data.cell.styles.halign = 'center';
        }
        if (data.column.index === 0 && data.section === 'body') {
            data.cell.styles.halign = 'left';
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
  doc.setTextColor(labelColor);
  doc.text('Subtotal:', totalSectionX - 50, finalY + 15, { align: 'right' });
  doc.text(`${totalAmount.toFixed(2)} €`, totalSectionX, finalY + 15, { align: 'right' });

  doc.setDrawColor(borderColor);
  doc.line(totalSectionX - 80, finalY + 22, totalSectionX, finalY + 22);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor);
  doc.text('Total General:', totalSectionX - 50, finalY + 30, { align: 'right' });
  doc.text(`${totalAmount.toFixed(2)} €`, totalSectionX, finalY + 30, { align: 'right' });

  // --- Footer ---
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(borderColor);
  doc.line(20, pageHeight - 35, doc.internal.pageSize.getWidth() - 20, pageHeight - 35);
  doc.setFontSize(9);
  doc.setTextColor('#94a3b8');
  doc.text(`Vă mulțumim pentru încredere!`, doc.internal.pageSize.getWidth() / 2, pageHeight - 25, { align: 'center' });
  doc.text(`Factură generată pentru ${clientName} de către ${websiteName}.`, doc.internal.pageSize.getWidth() / 2, pageHeight - 20, { align: 'center' });


  // --- Save the PDF ---
  doc.save(`Factura-${clientName.replace(/\s/g, '_')}-${invoiceNumber}.pdf`);
};
