import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderApi } from '../../api/endpoints';
import { useAuth } from '../../contexts/AuthContext';
import DeliveroMap from '../../components/DeliveroMap';
import { formatCurrency, STATUS_COLORS, STATUS_LABELS } from '../../utils/helpers';

export default function CustomerHomePage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackInputId, setTrackInputId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await orderApi.getAll();
        setOrders(res.data || []);
      } catch (err) {
        console.error('Failed to load customer orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackInputId.trim()) {
      navigate(`/customer/track?id=${encodeURIComponent(trackInputId.trim())}`);
    } else {
      navigate('/customer/track');
    }
  };

  const inTransitCount = orders.filter((o) => o.status === 'IN_TRANSIT').length;
  const outForDeliveryCount = orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const failedCount = orders.filter((o) => o.status === 'FAILED' || o.status === 'CANCELLED' || o.status === 'RESCHEDULED').length;
  const totalCount = orders.length;

  const activeOrder = orders.find((o) => o.status === 'IN_TRANSIT' || o.status === 'OUT_FOR_DELIVERY' || o.status === 'PICKED_UP' || o.status === 'ACCEPTED');

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-16">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Welcome back, {user?.name || 'Customer'}! 👋
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track your parcel consignments, book pickups, and manage deliveries.
          </p>
        </div>

        <Link to="/customer/orders/new" className="btn-primary py-2.5 px-5 text-xs font-black shadow-md flex items-center gap-2">
          <span>⚡</span> Book New Parcel
        </Link>
      </div>

      {/* 5 Real KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Link to="/customer/orders" className="delivero-card p-4 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-[#5046e4] flex items-center justify-center text-sm">
              📦
            </span>
            <span className="text-3xs font-bold text-[#5046e4] group-hover:translate-x-0.5 transition-transform">
              View all →
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono mt-2">{totalCount}</p>
          <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Orders</p>
        </Link>

        <Link to="/customer/orders" className="delivero-card p-4 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
              🚚
            </span>
            <span className="text-3xs font-bold text-amber-600 group-hover:translate-x-0.5 transition-transform">
              Track now →
            </span>
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono mt-2">{inTransitCount}</p>
          <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">In Transit</p>
        </Link>

        <Link to="/customer/orders" className="delivero-card p-4 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm">
              🛵
            </span>
            <span className="text-3xs font-bold text-purple-600 group-hover:translate-x-0.5 transition-transform">
              Track now →
            </span>
          </div>
          <p className="text-2xl font-black text-purple-600 font-mono mt-2">{outForDeliveryCount}</p>
          <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Out for Delivery</p>
        </Link>

        <Link to="/customer/orders" className="delivero-card p-4 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
              ✅
            </span>
            <span className="text-3xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
              View all →
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600 font-mono mt-2">{deliveredCount}</p>
          <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Delivered</p>
        </Link>

        <Link to="/customer/orders" className="delivero-card p-4 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-sm">
              ❌
            </span>
            <span className="text-3xs font-bold text-rose-600 group-hover:translate-x-0.5 transition-transform">
              View all →
            </span>
          </div>
          <p className="text-2xl font-black text-rose-600 font-mono mt-2">{failedCount}</p>
          <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Failed / Rescheduled</p>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Track Your Order Card */}
          <div className="delivero-card p-6 space-y-4 shadow-sm">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Track Your Consignment</h3>
              <p className="text-3xs text-slate-500 mt-0.5">Enter your Order ID / AWB number to track real-time delivery status</p>
            </div>

            <form onSubmit={handleTrackSubmit} className="space-y-3">
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs">🔍</span>
                <input
                  type="text"
                  value={trackInputId}
                  onChange={(e) => setTrackInputId(e.target.value)}
                  placeholder="Enter Order ID (e.g. DL48291)"
                  className="input-field pl-9 font-mono uppercase text-xs"
                />
              </div>

              <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold shadow-sm">
                Track Order
              </button>
            </form>
          </div>

          {/* Fast Delivery Promotional Card */}
          <div className="delivero-card p-6 bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-white border-indigo-100 flex items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="text-3xs font-bold uppercase tracking-wider text-[#5046e4] bg-white px-2 py-0.5 rounded-md border border-indigo-100">
                Express Logistics
              </span>
              <h4 className="text-sm font-black text-slate-900 leading-tight">
                Reliable & secure parcel delivery right to your doorstep
              </h4>
              <Link to="/customer/orders/new" className="text-xs font-bold text-[#5046e4] hover:underline inline-block pt-1">
                Book Parcel Now →
              </Link>
            </div>

            <div className="w-20 h-20 rounded-2xl bg-[#5046e4]/10 flex items-center justify-center text-4xl shrink-0">
              🛵
            </div>
          </div>
        </div>

        {/* Right Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Consignment Widget */}
          {activeOrder ? (
            <div className="delivero-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-3xs font-bold uppercase text-slate-400">Active Consignment</span>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    #{activeOrder.id.slice(0, 8).toUpperCase()}
                    <span className={`badge ${STATUS_COLORS[activeOrder.status] || 'badge-in-transit'} text-3xs`}>
                      {STATUS_LABELS[activeOrder.status] || activeOrder.status}
                    </span>
                  </h3>
                </div>

                <Link to={`/customer/orders/${activeOrder.id}`} className="text-xs font-bold text-[#5046e4] hover:underline">
                  Full Details →
                </Link>
              </div>

              {/* Vector GPS Map */}
              <div className="h-44 rounded-2xl overflow-hidden border border-slate-200">
                <DeliveroMap
                  pickupAddress={activeOrder.pickupCity || activeOrder.pickupAddress || 'Origin'}
                  dropAddress={activeOrder.dropCity || activeOrder.dropAddress || 'Destination'}
                />
              </div>

              {/* Step Progress Timeline */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-3xs font-bold text-slate-600 mb-2">
                  <span className={activeOrder.status !== 'PENDING' ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}>
                    ✓ Pickup
                  </span>
                  <span className={activeOrder.status === 'IN_TRANSIT' || activeOrder.status === 'OUT_FOR_DELIVERY' || activeOrder.status === 'DELIVERED' ? 'text-indigo-600 font-extrabold' : 'text-slate-400'}>
                    ● In Transit
                  </span>
                  <span className={activeOrder.status === 'OUT_FOR_DELIVERY' || activeOrder.status === 'DELIVERED' ? 'text-purple-600 font-extrabold' : 'text-slate-400'}>
                    🛵 Out for Delivery
                  </span>
                  <span className={activeOrder.status === 'DELIVERED' ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}>
                    ○ Delivered
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5046e4] rounded-full transition-all duration-500"
                    style={{
                      width: activeOrder.status === 'DELIVERED' ? '100%' : activeOrder.status === 'OUT_FOR_DELIVERY' ? '75%' : activeOrder.status === 'IN_TRANSIT' ? '50%' : '25%'
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="delivero-card p-8 text-center space-y-3">
              <span className="text-4xl block">📦</span>
              <h4 className="font-extrabold text-sm text-slate-900">No Active Dispatches</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You do not have any active packages in transit right now. Book a new parcel delivery to get started!
              </p>
              <Link to="/customer/orders/new" className="btn-primary inline-block text-xs font-bold shadow-sm mt-2">
                ⚡ Book New Parcel
              </Link>
            </div>
          )}

          {/* Recent Orders List */}
          <div className="delivero-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Recent Consignments</h3>
              <Link to="/customer/orders" className="text-xs font-bold text-[#5046e4] hover:underline">
                View all →
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="py-6 text-center text-slate-400 text-xs">Loading database records...</div>
              ) : orders.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">No orders recorded in your history.</div>
              ) : (
                orders.slice(0, 5).map((ord) => (
                  <Link
                    key={ord.id}
                    to={`/customer/orders/${ord.id}`}
                    className="py-3 flex items-center justify-between hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-[#5046e4] flex items-center justify-center text-sm transition-colors">
                        📦
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          #{ord.id.slice(0, 8).toUpperCase()} • <span className="text-slate-600 font-medium">{ord.pickupCity || 'Origin'} ➔ {ord.dropCity || 'Drop'}</span>
                        </p>
                        <p className="text-3xs text-slate-400 mt-0.5">
                          {ord.orderType || 'B2C'} • {ord.actualWeight}kg • {formatCurrency(ord.computedCharge)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`badge ${STATUS_COLORS[ord.status] || 'badge-pending'} text-3xs`}>
                        {STATUS_LABELS[ord.status] || ord.status}
                      </span>
                      <span className="text-slate-400 group-hover:text-[#5046e4] transition-colors text-xs">→</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
