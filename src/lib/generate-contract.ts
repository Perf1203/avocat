
'use client';

import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

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

const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : date.toDate();
    return format(dateObj, 'PPP', { locale: ro });
};

export const generateContract = (conversation: any, websiteName: string, adminName: string) => {
    const doc = new jsPDF();
    const guestName = conversation.guestName || 'Vizitator';
    const contract = conversation.contract;

    // --- Colors & Fonts ---
    const primaryColor = '#2C5282';
    const textColor = '#2D3748';
    const grayColor = '#718096';

    // --- Header ---
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text(normalizeText('CONTRACT DE PRESTĂRI SERVICII'), doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

    const contractId = `Nr. ${conversation.id.substring(0, 8).toUpperCase()}`;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayColor);
    doc.text(contractId, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });

    // --- Parties ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor);
    doc.text(normalizeText('PĂRȚILE CONTRACTANTE'), 14, 45);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const partiesText = `Acest contract este încheiat între:\n\n1. PRESTATOR: ${normalizeText(websiteName)}, reprezentat de ${normalizeText(adminName)}.\n\n2. BENEFICIAR: ${normalizeText(guestName)}.`;
    doc.text(partiesText, 14, 55, { maxWidth: 180 });

    // --- Object of Contract ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor);
    doc.text(normalizeText('OBIECTUL CONTRACTULUI'), 14, 95);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const contractText = contract?.text || 'Termeni si conditii standard.';
    const splitText = doc.splitTextToSize(normalizeText(contractText), 180);
    doc.text(splitText, 14, 105);

    let finalY = doc.getTextDimensions(splitText).h + 105;


    // --- Signatures ---
    const signatureY = finalY + 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor);
    doc.text(normalizeText('SEMNĂTURI'), 14, signatureY);
    
    const signatureBoxWidth = 80;
    const signatureBoxHeight = 40;
    const guestSignatureX = doc.internal.pageSize.getWidth() - signatureBoxWidth - 14;

    // Admin Signature
    doc.setDrawColor(grayColor);
    doc.rect(14, signatureY + 10, signatureBoxWidth, signatureBoxHeight);
    if (contract.adminSignature) {
        doc.addImage(contract.adminSignature, 'PNG', 16, signatureY + 12, signatureBoxWidth - 4, signatureBoxHeight - 4);
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESTATOR,', 14, signatureY + 10 + signatureBoxHeight + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(normalizeText(adminName), 14, signatureY + 10 + signatureBoxHeight + 12);
    if(contract.adminSignedAt) {
      doc.setFontSize(9);
      doc.setTextColor(grayColor);
      doc.text(normalizeText(`Data: ${formatDate(contract.adminSignedAt)}`), 14, signatureY + 10 + signatureBoxHeight + 17);
    }
    
    // Guest Signature
    doc.rect(guestSignatureX, signatureY + 10, signatureBoxWidth, signatureBoxHeight);
    if (contract.guestSignature) {
        doc.addImage(contract.guestSignature, 'PNG', guestSignatureX + 2, signatureY + 12, signatureBoxWidth - 4, signatureBoxHeight - 4);
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BENEFICIAR,', guestSignatureX, signatureY + 10 + signatureBoxHeight + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(normalizeText(guestName), guestSignatureX, signatureY + 10 + signatureBoxHeight + 12);
     if(contract.guestSignedAt) {
      doc.setFontSize(9);
      doc.setTextColor(grayColor);
      doc.text(normalizeText(`Data: ${formatDate(contract.guestSignedAt)}`), guestSignatureX, signatureY + 10 + signatureBoxHeight + 17);
    }

    // --- Status ---
    let statusY = signatureY + 10 + signatureBoxHeight + 35;
    if (statusY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        statusY = 20;
    }

    if(contract.status === 'signed') {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#276749'); // Green
      doc.text('STATUS: SEMNAT', doc.internal.pageSize.getWidth() / 2, statusY, { align: 'center' });
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#C53030'); // Red
      doc.text(normalizeText('STATUS: AȘTEAPTĂ SEMNĂTURA'), doc.internal.pageSize.getWidth() / 2, statusY, { align: 'center' });
    }

    // --- Footer ---
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(primaryColor);
    doc.line(14, pageHeight - 20, doc.internal.pageSize.getWidth() - 14, pageHeight - 20);
    doc.setFontSize(8);
    doc.setTextColor(grayColor);
    doc.text(normalizeText(`Document generat la ${format(new Date(), 'PPP p', { locale: ro })}`), doc.internal.pageSize.getWidth() / 2, pageHeight - 12, { align: 'center' });

    // --- Save ---
    doc.save(`Contract-${guestName.replace(/\s/g, '_')}.pdf`);
};
