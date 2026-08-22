import React, { useState, useEffect } from 'react';
import { orderApi } from '../../api/endpoints';
import DeliveroMap from '../../components/DeliveroMap';
import { formatCurrency, STATUS_COLORS, STATUS_LABELS } from '../../utils/helpers';

export default function AdminLiveTrackingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await orderApi.getAll();
        const list = res.data || [];
        setOrders(list);
        if (list.length > 0) {
          const active = list.find((o: any) => o.status === 'IN_TRANSIT' || o.status === 'OUT_FOR_DELIVERY' || o.status === 'PICKED_UP');
          setSelectedOrder(active || list[0]);
        }
      } catch (err) {
        console.error('Failed to load tracking dispatches:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'In Transit') return o.status === 'IN_TRANSIT' || o.status === 'OUT_FOR_DELIVERY';
    if (activeFilter === 'Pending') return o.status === 'PENDING' || o.status === 'ACCEPTED';
    if (activeFilter === 'Delivered') return o.status === 'DELIVERED';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Live Fleet & Order Tracking</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time geospatial fleet tracking and consignment monitoring from database</p>
        </div>
      </div>

      {/* Split View Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Orders Queue (1 col) */}
        <div className="delivero-card p-4 flex flex-col h-[620px]">
          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 border-b border-slate-100 text-3xs font-bold">
            {[
              { key: 'All', label: `All (${orders.length})` },
              { key: 'In Transit', label: `In Transit (${orders.filter((o) => o.status === 'IN_TRANSIT' || o.status === 'OUT_FOR_DELIVERY').length})` },
              { key: 'Pending', label: `Pending (${orders.filter((o) => o.status === 'PENDING').length})` },
              { key: 'Delivered', label: `Delivered (${orders.filter((o) => o.status === 'DELIVERED').length})` },
            ].map((pill) => (
              <button
                key={pill.key}
                onClick={() => setActiveFilter(pill.key)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeFilter === pill.key
                    ? 'bg-[#5046e4] text-white font-black'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading live fleet records...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No consignments in this state.</div>
            ) : (
              filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedOrder?.id === ord.id
                      ? 'border-[#5046e4] bg-indigo-50/50 shadow-xs'
                      : 'border-slate-200/70 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-900">#{ord.id.slice(0, 8).toUpperCase()}</span>
                    <span className={`badge ${STATUS_COLORS[ord.status] || 'badge-pending'} text-3xs`}>
                      {STATUS_LABELS[ord.status] || ord.status}
                    </span>
                  </div>

                  <div className="text-3xs text-slate-500 mt-2 space-y-0.5">
                    <p><span className="font-semibold text-slate-700">Customer:</span> {ord.receiverName || ord.user?.name || 'Customer'}</p>
                    <p><span className="font-semibold text-slate-700">Courier:</span> {ord.assignedAgent?.user?.name || 'Unassigned'}</p>
                    <p><span className="font-semibold text-slate-700">Route:</span> {ord.pickupCity} ➔ {ord.dropCity}</p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-3xs">
                    <span className="text-slate-400 font-mono">{ord.orderType || 'B2C'} • {ord.actualWeight}kg</span>
                    <span className="font-mono font-bold text-[#5046e4]">{formatCurrency(ord.computedCharge)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Map & Active Node Inspector (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <DeliveroMap
            key={selectedOrder?.id || 'admin-live-map'}
            className="h-[440px]"
            pickupCoords={selectedOrder?.pickupLatitude ? { lat: selectedOrder.pickupLatitude, lng: selectedOrder.pickupLongitude } : undefined}
            dropCoords={selectedOrder?.dropLatitude ? { lat: selectedOrder.dropLatitude, lng: selectedOrder.dropLongitude } : undefined}
            pickupAddress={selectedOrder ? `${selectedOrder.pickupCity || 'Origin'} (${selectedOrder.pickupPincode})` : 'Origin Hub'}
            dropAddress={selectedOrder ? `${selectedOrder.dropCity || 'Destination'} (${selectedOrder.dropPincode})` : 'Destination'}
            etaMinutes={selectedOrder?.status === 'DELIVERED' ? 0 : 25}
          />

          {/* Active Node Info */}
          {selectedOrder ? (
            <div className="delivero-card p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-3xs font-bold text-slate-400 uppercase">Selected Consignment</span>
                  <h4 className="font-extrabold text-sm text-slate-900 font-mono">
                    #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`badge ${STATUS_COLORS[selectedOrder.status] || 'badge-pending'} text-xs`}>
                    {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {formatCurrency(selectedOrder.computedCharge)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-3xs font-bold uppercase text-slate-400">Assigned Courier</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedOrder.assignedAgent?.user?.name || 'Queued for Assignment'}</p>
                  <p className="text-3xs text-slate-500 font-mono">{selectedOrder.assignedAgent?.user?.phone || 'No phone'}</p>
                </div>

                <div>
                  <span className="text-3xs font-bold uppercase text-emerald-700">Origin</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedOrder.pickupCity} ({selectedOrder.pickupPincode})</p>
                  <p className="text-3xs text-slate-500 truncate">{selectedOrder.pickupAddress}</p>
                </div>

                <div>
                  <span className="text-3xs font-bold uppercase text-purple-700">Destination</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedOrder.dropCity} ({selectedOrder.dropPincode})</p>
                  <p className="text-3xs text-slate-500 truncate">{selectedOrder.dropAddress}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="delivero-card p-6 text-center text-slate-400 text-xs">
              Select an order from the left to inspect live geospatial route details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
