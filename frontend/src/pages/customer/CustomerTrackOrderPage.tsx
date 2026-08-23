import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { orderApi } from '../../api/endpoints';
import DeliveroMap from '../../components/DeliveroMap';
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS } from '../../utils/helpers';
import { pdfReceiptGenerator } from '../../utils/pdfReceiptGenerator';
import {
  Search,
  Zap,
  Check,
  Phone,
  FileText,
  Download,
  MapPin,
  Flag,
  Bike,
  PhoneCall,
} from 'lucide-react';

export default function CustomerTrackOrderPage() {
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');

  const [order, setOrder] = useState<any | null>(null);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [searchId, setSearchId] = useState(queryId || '');
  const [loading, setLoading] = useState(true);
  const [showCall, setShowCall] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await orderApi.getAll();
        const list = res.data || [];
        setAllOrders(list);

        if (queryId) {
          const found = list.find((o: any) => o.id === queryId || o.id.toLowerCase().includes(queryId.toLowerCase()));
          if (found) {
            setOrder(found);
          } else {
            // Try fetching by ID
            try {
              const single = await orderApi.getById(queryId);
              setOrder(single.data);
            } catch {
              setError(`No consignment found with tracking ID #${queryId}`);
            }
          }
        } else if (list.length > 0) {
          // Default to latest active or latest order
          const active = list.find((o: any) => o.status === 'IN_TRANSIT' || o.status === 'OUT_FOR_DELIVERY' || o.status === 'PICKED_UP');
          setOrder(active || list[0]);
        }
      } catch (err: any) {
        console.error('Failed to load tracking data:', err);
        setError('Failed to fetch tracking data.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [queryId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const found = allOrders.find((o) => o.id === searchId.trim() || o.id.toLowerCase().includes(searchId.trim().toLowerCase()));
      if (found) {
        setOrder(found);
      } else {
        const res = await orderApi.getById(searchId.trim());
        setOrder(res.data);
      }
    } catch {
      setError(`No order found matching #${searchId.trim()}`);
    } finally {
      setLoading(false);
    }
  };

  const getStepActive = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 1;
      case 'ACCEPTED':
      case 'PICKED_UP':
        return 2;
      case 'IN_TRANSIT':
        return 3;
      case 'OUT_FOR_DELIVERY':
        return 4;
      case 'DELIVERED':
        return 5;
      default:
        return 1;
    }
  };

  const currentStep = order ? getStepActive(order.status) : 1;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/customer/orders" className="text-xs font-bold text-slate-500 hover:text-slate-900">
            ← My Orders
          </Link>
          <span className="text-slate-300">•</span>
          <h1 className="text-xl font-extrabold text-slate-900 font-mono">
            {order ? `Consignment #${order.id.slice(0, 8).toUpperCase()}` : 'Live GPS Consignment Tracking'}
          </h1>
        </div>

        {/* Search by tracking ID form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Search Order ID / AWB"
            className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono"
          />
          <button type="submit" className="btn-primary text-xs py-1.5 px-3 font-bold">
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-slide-down">
          {error}
        </div>
      )}

      {loading ? (
        <div className="delivero-card p-12 text-center text-slate-400 text-xs">
          <span className="inline-block w-6 h-6 border-2 border-[#5046e4] border-t-transparent rounded-full animate-spin mr-2" />
          Loading consignment tracking data...
        </div>
      ) : !order ? (
        <div className="delivero-card p-12 text-center space-y-3">
          <Search className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
          <h3 className="text-base font-extrabold text-slate-900">No Consignment Selected</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any active orders recorded yet. Book your first parcel to track live delivery progression.
          </p>
          <Link to="/customer/orders/new" className="btn-primary inline-flex items-center gap-1.5 text-xs font-bold shadow-sm mt-2">
            <Zap className="w-4 h-4" /> Book New Delivery
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Col: Real Status Timeline (1 col) */}
          <div className="delivero-card p-6 space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-3xs font-bold text-slate-400 uppercase">Live Milestone Tracker</span>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
                <span className={`badge ${STATUS_COLORS[order.status] || 'badge-in-transit'} text-3xs`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </h3>
            </div>

            <div className="space-y-6 text-xs relative">
              <div className="flex items-start gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-3xs font-bold shrink-0 ${
                  currentStep >= 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {currentStep >= 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
                </span>
                <div>
                  <p className="font-bold text-slate-900">Order Placed & Confirmed</p>
                  <p className="text-3xs text-slate-400 font-mono">{formatDate(order.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-3xs font-bold shrink-0 ${
                  currentStep >= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {currentStep >= 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
                </span>
                <div>
                  <p className="font-bold text-slate-900">Courier Assigned & Picked Up</p>
                  <p className="text-3xs text-slate-400 font-mono">
                    {order.assignedAgent?.user?.name ? `Assigned to ${order.assignedAgent.user.name}` : 'Awaiting Courier Allocation'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-3xs font-bold shrink-0 ${
                  currentStep >= 3 ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                }`}>
                  {currentStep >= 3 ? <Check className="w-3.5 h-3.5" /> : '3'}
                </span>
                <div>
                  <p className={`font-bold ${currentStep === 3 ? 'text-[#5046e4]' : 'text-slate-900'}`}>In Transit (Freight Route)</p>
                  <p className="text-3xs text-slate-400 font-mono">Geodesic Hub Routing</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-3xs font-bold shrink-0 ${
                  currentStep >= 4 ? 'bg-purple-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                }`}>
                  {currentStep >= 4 ? <Check className="w-3.5 h-3.5" /> : '4'}
                </span>
                <div>
                  <p className="font-bold text-slate-900">Out for Delivery</p>
                  <p className="text-3xs text-slate-400 font-mono">Courier en-route to destination</p>
                </div>
              </div>

              <div className={`flex items-start gap-3 ${currentStep < 5 ? 'opacity-40' : ''}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-3xs font-bold shrink-0 ${
                  currentStep === 5 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {currentStep === 5 ? <Check className="w-3.5 h-3.5" /> : '5'}
                </span>
                <div>
                  <p className="font-bold text-slate-700">Delivered & Fulfilled</p>
                  <p className="text-3xs text-slate-400 font-mono">{order.status === 'DELIVERED' ? 'Successfully Handed Over' : 'Pending Final Handover'}</p>
                </div>
              </div>
            </div>

            {/* Price Breakdown Summary */}
            <div className="pt-4 border-t border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span>Freight Fare:</span>
                <span className="font-bold text-slate-900 font-mono">{formatCurrency(order.computedCharge)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Billable Weight:</span>
                <span className="font-bold text-slate-900 font-mono">{order.actualWeight} kg</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Payment Mode:</span>
                <span className="font-bold text-[#5046e4]">{order.paymentType}</span>
              </div>
            </div>
          </div>

          {/* Right Col: Map & Assigned Delivery Agent (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <DeliveroMap
              className="h-80"
              pickupAddress={order.pickupCity || order.pickupAddress}
              dropAddress={order.dropCity || order.dropAddress}
            />

            {/* Delivery Courier Partner Card */}
            {order.assignedAgent ? (
              <div className="delivero-card p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#5046e4] text-white flex items-center justify-center font-black text-lg shadow-sm">
                    {order.assignedAgent.user?.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">{order.assignedAgent.user?.name}</h4>
                      <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Dispatch
                      </span>
                    </div>
                    <p className="text-3xs text-slate-400">Assigned Last-Mile Courier Partner</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCall(true)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Courier
                  </button>
                </div>
              </div>
            ) : (
              <div className="delivero-card p-4 text-xs text-center text-slate-500 flex items-center justify-center gap-2">
                <Bike className="w-4 h-4 text-[#5046e4]" /> Order is currently queued for automated courier dispatch in {order.pickupCity || 'Pickup Zone'}.
              </div>
            )}

            {/* Delivered Tax Receipt Card */}
            {order.status === 'DELIVERED' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h4 className="text-xs font-black text-emerald-900">Official Consignment Delivery Receipt</h4>
                    <p className="text-3xs text-emerald-700 font-medium">Digital tax invoice with itemized freight breakdown and GST</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => pdfReceiptGenerator.downloadReceipt(order)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF Receipt
                </button>
              </div>
            )}

            {/* Origin and Destination Address Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="delivero-card p-4 text-xs space-y-1">
                <span className="text-3xs font-bold uppercase text-emerald-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Pickup Origin
                </span>
                <p className="font-bold text-slate-900">{order.pickupCity} ({order.pickupPincode})</p>
                <p className="text-3xs text-slate-500 font-medium">{order.pickupAddress}</p>
              </div>

              <div className="delivero-card p-4 text-xs space-y-1">
                <span className="text-3xs font-bold uppercase text-purple-700 flex items-center gap-1">
                  <Flag className="w-3 h-3" /> Drop Destination
                </span>
                <p className="font-bold text-slate-900">{order.dropCity} ({order.dropPincode})</p>
                <p className="text-3xs text-slate-500 font-medium">{order.dropAddress}</p>
                <p className="text-3xs text-slate-400 font-mono mt-1">Receiver: {order.receiverName} ({order.receiverPhone})</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Dialog */}
      {showCall && order?.assignedAgent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="delivero-card p-6 max-w-xs w-full text-center animate-scale-in space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-[#5046e4] mx-auto flex items-center justify-center">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-slate-900">Calling Courier Partner</h4>
            <p className="text-xs font-bold text-slate-800">{order.assignedAgent.user?.name}</p>
            <p className="text-xs text-[#5046e4] font-mono">{order.assignedAgent.user?.phone || '+91 9876543210'}</p>
            <button onClick={() => setShowCall(false)} className="btn-secondary text-xs mt-2 w-full font-bold">
              End Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
