import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderApi } from '../../api/endpoints';
import {
  formatCurrency,
  formatDate,
  getOrderCharge,
  getOrderActualWeight,
  getOrderBillableWeight,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../../utils/helpers';
import DeliveroMap from '../../components/DeliveroMap';
import TaxInvoiceView from '../../components/TaxInvoiceView';

export default function CustomerOrderDetailViewPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'tracking' | 'invoice'>('tracking');

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await orderApi.getById(id);
        setOrder(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-slate-400 text-xs">
        <span className="inline-block w-8 h-8 border-3 border-[#5046e4] border-t-transparent rounded-full animate-spin mb-3" />
        <p>Loading consignment details from database...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center delivero-card space-y-3">
        <span className="text-3xl">⚠️</span>
        <h3 className="text-base font-bold text-slate-900">Order Not Found</h3>
        <p className="text-xs text-slate-500">{error || 'The requested order could not be located.'}</p>
        <Link to="/customer/orders" className="btn-primary inline-block text-xs font-bold">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const charge = getOrderCharge(order);
  const actualWeight = getOrderActualWeight(order);
  const billableWeight = getOrderBillableWeight(order);
  const volumetricWeight = Number(order.volumetricWeightKg ?? order.volumetricWeight ?? 0);

  const handlePrintInvoice = () => {
    setViewMode('invoice');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/customer/orders" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-1">
            ← Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-slate-900 font-mono">Consignment #{order.id.slice(0, 8).toUpperCase()}</h1>
            <span className={`badge ${STATUS_COLORS[order.status] || 'badge-pending'} text-3xs font-bold`}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
          <p className="text-3xs text-slate-400 font-mono mt-0.5">Created on {formatDate(order.createdAt)}</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('tracking')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'tracking' ? 'bg-white text-[#5046e4] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🛰️ Live Tracking
            </button>
            <button
              type="button"
              onClick={() => setViewMode('invoice')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'invoice' ? 'bg-white text-[#5046e4] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📄 Tax Invoice
            </button>
          </div>

          <button
            onClick={handlePrintInvoice}
            className="btn-secondary text-xs flex items-center gap-1.5 shadow-sm font-bold cursor-pointer"
          >
            <span>🖨️</span> Print Invoice
          </button>
        </div>
      </div>

      {/* Conditionally Render View Mode */}
      {viewMode === 'invoice' ? (
        <TaxInvoiceView order={order} onClose={() => setViewMode('tracking')} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Col: Addresses & Timeline (2 cols) */}
          <div className="delivero-card p-6 lg:col-span-2 space-y-6">
            {/* Addresses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-3xs font-bold text-emerald-700 uppercase">📍 Pickup Origin</span>
                <p className="font-bold text-xs text-slate-900 mt-1">{order.senderName || 'Sender'}</p>
                <p className="text-3xs text-slate-600 font-medium">{order.pickupAddress}</p>
                <p className="text-3xs font-mono font-bold text-slate-700 mt-0.5">
                  {order.pickupPincode ? `PIN: ${order.pickupPincode}` : ''}
                </p>
                <p className="text-3xs text-slate-400 mt-0.5">📞 {order.senderPhone || 'Not provided'}</p>
              </div>

              <div>
                <span className="text-3xs font-bold text-purple-700 uppercase">🏁 Drop Destination</span>
                <p className="font-bold text-xs text-slate-900 mt-1">{order.receiverName || 'Receiver'}</p>
                <p className="text-3xs text-slate-600 font-medium">{order.dropAddress}</p>
                <p className="text-3xs font-mono font-bold text-slate-700 mt-0.5">
                  {order.dropPincode ? `PIN: ${order.dropPincode}` : ''}
                </p>
                <p className="text-3xs text-slate-400 mt-0.5">📞 {order.receiverPhone || 'Not provided'}</p>
              </div>
            </div>

            {/* Assigned Delivery Courier */}
            {order.assignedAgent ? (
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#5046e4] text-white flex items-center justify-center font-bold text-sm">
                    🛵
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{order.assignedAgent.user?.name}</h4>
                    <p className="text-3xs text-slate-500 font-mono">{order.assignedAgent.user?.phone || '+91 9876543210'}</p>
                    <span className="text-3xs text-emerald-600 font-bold">Assigned Delivery Partner</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a href={`tel:${order.assignedAgent.user?.phone || ''}`} className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-bold text-indigo-700 shadow-xs">
                    📞 Call Courier
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold">
                ⏳ Awaiting courier assignment. Automated dispatch engine is allocating the nearest available agent.
              </div>
            )}

            {/* Map */}
            <DeliveroMap
              key={order.id}
              className="h-56"
              pickupCoords={order.pickupLatitude ? { lat: order.pickupLatitude, lng: order.pickupLongitude } : undefined}
              dropCoords={order.dropLatitude ? { lat: order.dropLatitude, lng: order.dropLongitude } : undefined}
              pickupAddress={order.pickupAddress}
              dropAddress={order.dropAddress}
            />

            {/* Immutable Order Status History Audit Trail */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Immutable Tracking History ({order.statusHistory?.length || 0} events)
              </h3>
              <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 text-xs">
                {order.statusHistory?.map((h: any, idx: number) => (
                  <div key={h.id || idx} className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#5046e4]" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{h.status}</span>
                      <span className="text-3xs text-slate-400 font-mono">{formatDate(h.createdAt || h.timestamp)}</span>
                    </div>
                    <p className="text-3xs text-slate-500 mt-0.5">
                      Actor: <span className="font-semibold text-slate-700">{h.actor?.name || h.actor || 'System'}</span> • {h.notes || 'Status updated'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Bill & Technical Package Specs (1 col) */}
          <div className="delivero-card p-6 space-y-6 h-fit">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-3 border-b border-slate-100 pb-2">Package Specifications</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Actual Weight</span>
                  <span className="font-bold text-slate-900 font-mono">{actualWeight} kg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Dimensions (LxBxH)</span>
                  <span className="font-bold text-slate-900 font-mono">{order.lengthCm} × {order.breadthCm} × {order.heightCm} cm</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Volumetric Weight</span>
                  <span className="font-bold text-slate-900 font-mono">{volumetricWeight} kg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Billable Weight</span>
                  <span className="font-black text-[#5046e4] font-mono">{billableWeight} kg</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Order / Tariff Type</span>
                  <span className="font-bold text-slate-900">{order.orderType}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-3 border-b border-slate-100 pb-2">Billing & Payment</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Payment Mode</span>
                  <span className="font-bold text-slate-900">{order.paymentType}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-100 text-base font-black">
                  <span className="text-slate-900">Total Computed Fare</span>
                  <span className="font-mono text-[#5046e4] text-lg">{formatCurrency(charge)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setViewMode('invoice')}
                className="text-xs text-[#5046e4] font-bold hover:underline cursor-pointer"
              >
                View Full GST Tax Invoice Breakdown →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
