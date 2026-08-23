/**
 * Delivero Logistics - Official Consignment Delivery PDF Receipt Generator
 */
import { jsPDF } from 'jspdf';

export interface ReceiptOrderData {
  orderNumber: string;
  id?: string;
  createdAt?: string;
  deliveredAt?: string;
  senderName?: string;
  senderPhone?: string;
  pickupAddress?: string;
  pickupPincode?: string;
  pickupCity?: string;
  receiverName?: string;
  receiverPhone?: string;
  dropAddress?: string;
  dropPincode?: string;
  dropCity?: string;
  orderType?: string;
  paymentType?: string;
  actualWeightKg?: number;
  volumetricWeightKg?: number;
  billableWeightKg?: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
  baseCharge?: number;
  codSurcharge?: number;
  totalCharge?: number;
  assignedAgentName?: string;
  deliveryOtp?: string;
}

export const pdfReceiptGenerator = {
  /**
   * Build a jsPDF document for a delivered consignment receipt
   */
  generateReceiptDoc(data: ReceiptOrderData): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor = [80, 70, 228]; // #5046e4 Delivero Indigo
    const darkSlate = [15, 23, 42]; // #0f172a
    const textGray = [100, 116, 139]; // #64748b
    const emeraldGreen = [16, 185, 129]; // #10b981
    const lightBg = [248, 250, 252]; // #f8fafc

    // 1. Top Decorative Brand Banner
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DELIVERO LOGISTICS EXPRESS', 15, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Consignment Delivery Receipt & Tax Invoice', 130, 15);

    // 2. Receipt Meta Box
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(15, 30, 180, 24, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, 30, 180, 24, 3, 3, 'S');

    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Tracking ID: #${data.orderNumber || data.id?.slice(0, 8) || 'LM000000'}`, 20, 39);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    const bookingDate = data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('en-IN');
    doc.text(`Booking Date: ${bookingDate}`, 20, 47);

    // Status Badge
    doc.setFillColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    doc.roundedRect(140, 36, 48, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('STATUS: DELIVERED', 145, 44);

    // 3. Sender & Receiver Columns
    // Consignor Box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 60, 87, 44, 2, 2, 'S');
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 60, 87, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text('ORIGIN / CONSIGNOR', 18, 65.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Name: ${data.senderName || 'Valued Sender'}`, 18, 74);
    doc.text(`Phone: ${data.senderPhone || 'N/A'}`, 18, 80);
    const originAddr = doc.splitTextToSize(`Address: ${data.pickupAddress || data.pickupCity || 'Local Warehouse'} - ${data.pickupPincode || ''}`, 80);
    doc.text(originAddr, 18, 86);

    // Consignee Box
    doc.roundedRect(108, 60, 87, 44, 2, 2, 'S');
    doc.setFillColor(241, 245, 249);
    doc.rect(108, 60, 87, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('DESTINATION / CONSIGNEE', 111, 65.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Name: ${data.receiverName || 'Recipient'}`, 111, 74);
    doc.text(`Phone: ${data.receiverPhone || 'N/A'}`, 111, 80);
    const dropAddr = doc.splitTextToSize(`Address: ${data.dropAddress || data.dropCity || 'Customer Address'} - ${data.dropPincode || ''}`, 80);
    doc.text(dropAddr, 111, 86);

    // 4. Package Dimensions & Logistics Specifications Table
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, 112, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CONSIGNMENT SPECIFICATION', 18, 117.5);
    doc.text('DETAILS', 120, 117.5);

    const specs = [
      ['Service Mode & Category', `${data.orderType || 'B2C'} Standard Last-Mile Express`],
      ['Payment Type & Method', `${data.paymentType || 'PREPAID'} (Settled Online)`],
      ['Dimensions (L x W x H)', `${data.lengthCm || 10} cm x ${data.breadthCm || 10} cm x ${data.heightCm || 10} cm`],
      ['Actual Weight vs Volumetric Weight', `${data.actualWeightKg || 1} kg (Volumetric: ${data.volumetricWeightKg || 1} kg)`],
      ['Billable Charged Weight', `${data.billableWeightKg || 1} kg`],
      ['Assigned Delivery Courier Agent', `${data.assignedAgentName || 'Rajesh Kumar (Verified Fleet)'}`],
    ];

    let currentY = 126;
    specs.forEach((item, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, currentY - 5, 180, 7, 'F');
      }
      doc.setTextColor(textGray[0], textGray[1], textGray[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(item[0], 18, currentY);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(item[1], 120, currentY);
      currentY += 7;
    });

    // 5. Billing & Tariff Breakdown Table
    currentY += 4;
    doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.rect(15, currentY, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('FARE BREAKDOWN & CHARGES', 18, currentY + 5.5);
    doc.text('AMOUNT (INR)', 155, currentY + 5.5);

    currentY += 13;
    const baseAmt = Number(data.baseCharge || 50).toFixed(2);
    const codAmt = Number(data.codSurcharge || 0).toFixed(2);
    const totalAmt = Number(data.totalCharge || 50).toFixed(2);
    const gstAmt = (Number(totalAmt) * 0.18 / 1.18).toFixed(2);

    const billingRows = [
      ['Base Freight & Road Distance Tariff', `₹${baseAmt}`],
      ['COD Handling Surcharge', `₹${codAmt}`],
      ['Estimated GST (18% Included)', `₹${gstAmt}`],
    ];

    billingRows.forEach((row, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, currentY - 4.5, 180, 6.5, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textGray[0], textGray[1], textGray[2]);
      doc.text(row[0], 18, currentY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(row[1], 160, currentY);
      currentY += 7;
    });

    // Total Amount Highlight Box
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(15, currentY + 2, 180, 13, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL AMOUNT PAID', 20, currentY + 10.5);
    doc.setFontSize(12);
    doc.text(`₹${totalAmt}`, 160, currentY + 10.5);

    // 6. Security Signature & Handover Verification Block
    currentY += 24;
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(15, currentY, 180, 28, 2, 2, 'S');

    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Handover Verification Note:', 18, currentY + 6);
    doc.text('Consignment was delivered and verified by recipient via Security Delivery PIN.', 18, currentY + 11);
    doc.text('Delivero Logistics 24x7 Support: support@lastmile.dev | Web: lastmiledelivery-b0bdd.web.app', 18, currentY + 16);

    // Courier Signature line
    doc.line(135, currentY + 18, 185, currentY + 18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text('Authorized Delivery Officer', 138, currentY + 23);

    // 7. Footer
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('This is a computer-generated digital tax invoice receipt. No physical signature is required.', 45, 285);

    return doc;
  },

  /**
   * Trigger direct PDF download in browser
   */
  downloadReceipt(data: ReceiptOrderData) {
    const doc = this.generateReceiptDoc(data);
    const filename = `Delivero_Receipt_${data.orderNumber || 'Order'}.pdf`;
    doc.save(filename);
  },

  /**
   * Get PDF Base64 string / Data URI
   */
  getReceiptDataUri(data: ReceiptOrderData): string {
    const doc = this.generateReceiptDoc(data);
    return doc.output('datauristring');
  },
};
