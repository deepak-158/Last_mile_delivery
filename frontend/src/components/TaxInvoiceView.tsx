import React from 'react';
import {
  formatCurrency,
  formatDate,
  getOrderCharge,
  getOrderActualWeight,
  getOrderBillableWeight,
} from '../utils/helpers';

interface TaxInvoiceViewProps {
  order: any;
  onClose?: () => void;
}

export default function TaxInvoiceView({ order, onClose }: TaxInvoiceViewProps) {
  if (!order) return null;

  const totalCharge = getOrderCharge(order);
  const actualWeight = getOrderActualWeight(order);
  const billableWeight = getOrderBillableWeight(order);
  const volumetricWeight = Number(order.volumetricWeightKg ?? order.volumetricWeight ?? 0);

  // Derive tax components (18% GST standard logistics SAC 996511)
  const taxableValue = Math.round((totalCharge / 1.18) * 100) / 100;
  const totalGst = Math.round((totalCharge - taxableValue) * 100) / 100;
  const isInterState = order.pickupZoneId !== order.dropZoneId;
  const cgst = isInterState ? 0 : Math.round((totalGst / 2) * 100) / 100;
  const sgst = isInterState ? 0 : Math.round((totalGst / 2) * 100) / 100;
  const igst = isInterState ? totalGst : 0;

  const codSurcharge = Number(order.codSurcharge || (order.paymentType === 'COD' ? 50 : 0));

  const invoiceNumber = `INV-${new Date(order.createdAt || Date.now()).getFullYear()}-${order.id.slice(0, 8).toUpperCase()}`;
  const awbNumber = `DLV-${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="bg-white text-slate-900 font-sans p-4 sm:p-6 rounded-2xl border border-slate-300 shadow-xl max-w-4xl mx-auto printable-invoice">
      {/* Top Action Toolbar (Hidden in Print) */}
      <div className="no-print flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Official Tax Invoice & Waybill</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-[#5046e4] text-white text-xs font-bold rounded-xl hover:bg-[#4338ca] shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>🖨️</span> Print / Save as PDF
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Corporate Letterhead */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 pb-3 border-b-2 border-slate-900">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-6 h-6 rounded bg-[#5046e4] text-white flex items-center justify-center font-black text-xs">
              ✦
            </div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              DELIVERO <span className="text-2xs text-[#5046e4] font-bold">LOGISTICS PVT. LTD.</span>
            </h1>
          </div>
          <p className="text-3xs text-slate-600 leading-snug font-medium">
            Tower B, 4th Floor, Delivero Tech Park, Cyber City, Gurugram, Haryana - 122002<br />
            <strong>GSTIN:</strong> 06AABCD1234E1Z5 • <strong>CIN:</strong> U63090HR2024PTC109821<br />
            <strong>Courier Lic:</strong> DLV/EXP/REG-2024/8892 • <strong>Email:</strong> billing@delivero.com
          </p>
        </div>

        <div className="text-left sm:text-right w-full sm:w-auto">
          <span className="inline-block px-2 py-0.5 bg-slate-900 text-white text-3xs font-extrabold tracking-wider rounded uppercase mb-1">
            TAX INVOICE & CONSIGNMENT NOTE
          </span>
          <p className="text-2xs font-mono font-bold text-slate-900">INVOICE #: <span className="text-[#5046e4]">{invoiceNumber}</span></p>
          <p className="text-3xs text-slate-500 font-mono">Date: {formatDate(order.createdAt || new Date().toISOString())}</p>
          <p className="text-3xs text-slate-500 font-mono">AWB: <strong>{awbNumber}</strong></p>
        </div>
      </div>

      {/* Consignment Barcode Simulation & Meta Strip */}
      <div className="my-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-2xs">
        <div>
          <span className="text-3xs font-bold text-slate-400 uppercase">Order Type</span>
          <p className="font-extrabold text-slate-900">{order.orderType === 'B2B' ? 'B2B Enterprise Freight' : 'B2C Retail Express'}</p>
        </div>
        <div>
          <span className="text-3xs font-bold text-slate-400 uppercase">Payment Terms</span>
          <p className="font-extrabold text-slate-900">{order.paymentType} {order.paymentType === 'PREPAID' ? '(Wallet / Digital)' : '(Cash On Delivery)'}</p>
        </div>
        <div>
          <span className="text-3xs font-bold text-slate-400 uppercase">Place of Supply</span>
          <p className="font-extrabold text-slate-900 font-mono">{order.dropPincode || 'Delhi NCR'}</p>
        </div>
        <div>
          <span className="text-3xs font-bold text-slate-400 uppercase">Reverse Charge</span>
          <p className="font-extrabold text-slate-900">No (N/A)</p>
        </div>
        <div className="font-mono text-center border border-slate-300 px-2 py-0.5 bg-white rounded">
          <div className="tracking-[3px] font-black text-3xs text-slate-800">|||| | | |||| || | ||</div>
          <span className="text-3xs text-slate-500 font-bold">{awbNumber}</span>
        </div>
      </div>

      {/* Shipper & Consignee Address Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
        {/* Shipper / Consignor */}
        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
          <span className="text-3xs font-bold text-emerald-700 uppercase tracking-wider block mb-0.5">
            📦 Billed From / Consignor (Sender)
          </span>
          <p className="text-xs font-bold text-slate-900">{order.senderName || 'Authorized Consignor'}</p>
          <p className="text-3xs text-slate-600 mt-0.5 leading-snug">{order.pickupAddress}</p>
          <p className="text-3xs font-mono font-bold text-slate-800 mt-0.5">PIN: {order.pickupPincode}</p>
          <p className="text-3xs text-slate-500">📞 Phone: {order.senderPhone || 'N/A'}</p>
        </div>

        {/* Consignee */}
        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
          <span className="text-3xs font-bold text-indigo-700 uppercase tracking-wider block mb-0.5">
            🏁 Billed To / Consignee (Recipient)
          </span>
          <p className="text-xs font-bold text-slate-900">{order.receiverName || 'Authorized Consignee'}</p>
          <p className="text-3xs text-slate-600 mt-0.5 leading-snug">{order.dropAddress}</p>
          <p className="text-3xs font-mono font-bold text-slate-800 mt-0.5">PIN: {order.dropPincode}</p>
          <p className="text-3xs text-slate-500">📞 Phone: {order.receiverPhone || 'N/A'}</p>
        </div>
      </div>

      {/* Technical Package Dimensions & Weight Table */}
      <div className="mb-3">
        <h4 className="text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1">Package Dimensions & Tariff Weights</h4>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-2xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-1.5">Dimensions (L × B × H)</th>
                <th className="p-1.5">Actual Scale Weight</th>
                <th className="p-1.5">Volumetric Weight ((L×B×H)/5000)</th>
                <th className="p-1.5 text-right font-black text-[#5046e4]">Billable Charged Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="p-1.5 text-slate-800">{order.lengthCm} × {order.breadthCm} × {order.heightCm} cm</td>
                <td className="p-1.5 text-slate-800">{actualWeight} kg</td>
                <td className="p-1.5 text-slate-800">{volumetricWeight} kg</td>
                <td className="p-1.5 text-right font-black text-slate-900 text-xs">{billableWeight} kg</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Itemized Financial Charges Table */}
      <div className="mb-3">
        <h4 className="text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1">Itemized Freight & Logistics Services</h4>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-2xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-1.5">#</th>
                <th className="p-1.5">Service Description</th>
                <th className="p-1.5 font-mono">SAC Code</th>
                <th className="p-1.5 text-center">Tax Rate</th>
                <th className="p-1.5 text-right">Taxable Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-1.5 font-mono text-slate-400">1</td>
                <td className="p-1.5">
                  <strong className="text-slate-900">Doorstep Logistics & Freight Handling</strong>
                  <p className="text-3xs text-slate-500">{order.orderType} express transit • Billable weight: {billableWeight}kg</p>
                </td>
                <td className="p-1.5 font-mono text-slate-600">996511</td>
                <td className="p-1.5 text-center font-mono">18.00%</td>
                <td className="p-1.5 text-right font-mono font-bold text-slate-900">{formatCurrency(taxableValue)}</td>
              </tr>
              {codSurcharge > 0 && (
                <tr>
                  <td className="p-1.5 font-mono text-slate-400">2</td>
                  <td className="p-1.5">
                    <strong className="text-slate-900">Cash On Delivery (COD) Collection & Verification Fee</strong>
                    <p className="text-3xs text-slate-500">Secure doorstep cash handling fee</p>
                  </td>
                  <td className="p-1.5 font-mono text-slate-600">996511</td>
                  <td className="p-1.5 text-center font-mono">18.00%</td>
                  <td className="p-1.5 text-right font-mono font-bold text-slate-900">{formatCurrency(codSurcharge)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Computation Summary & Grand Total */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-t-2 border-slate-900 pt-3">
        {/* Terms & Declarations */}
        <div className="max-w-xs space-y-1 text-3xs text-slate-500 leading-snug">
          <p className="font-bold text-slate-700 uppercase">Declaration & Terms:</p>
          <p>1. We declare that this invoice shows the actual price of the freight services described and that all particulars are true and correct.</p>
          <p>2. Subject to Gurugram / Delhi jurisdiction. Computer-generated tax document.</p>
        </div>

        {/* Totals Box */}
        <div className="w-full sm:w-64 space-y-1.5 text-2xs">
          <div className="flex justify-between text-slate-600">
            <span>Taxable Value:</span>
            <span className="font-mono font-bold text-slate-900">{formatCurrency(taxableValue)}</span>
          </div>

          {isInterState ? (
            <div className="flex justify-between text-slate-600">
              <span>Integrated GST (IGST @ 18%):</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(igst)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-slate-600">
                <span>Central GST (CGST @ 9%):</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(cgst)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>State GST (SGST @ 9%):</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(sgst)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between pt-1.5 border-t-2 border-slate-900 text-sm font-black">
            <span className="text-slate-900">Total Invoice Amount:</span>
            <span className="font-mono text-[#5046e4] text-base">{formatCurrency(totalCharge)}</span>
          </div>

          <div className="pt-2 text-right">
            <p className="text-3xs text-slate-400 font-bold uppercase">For DELIVERO LOGISTICS PVT. LTD.</p>
            <div className="h-6 flex items-end justify-end">
              <span className="font-mono text-3xs text-indigo-600 font-bold">[Digitally Authenticated]</span>
            </div>
            <p className="text-3xs text-slate-500 font-semibold">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
