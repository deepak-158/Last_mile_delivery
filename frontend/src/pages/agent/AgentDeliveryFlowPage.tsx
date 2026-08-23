import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { orderApi } from '../../api/endpoints';
import DeliveroMap from '../../components/DeliveroMap';
import { formatCurrency } from '../../utils/helpers';
import { Bike, MapPin, Flag, User, Phone } from 'lucide-react';

export default function AgentDeliveryFlowPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        if (orderId) {
          const res = await orderApi.getById(orderId);
          setOrder(res.data);
        } else {
          const res = await orderApi.getAll();
          const list = res.data || [];
          const active = list.find((o: any) => o.status !== 'DELIVERED' && o.status !== 'FAILED');
          setOrder(active || list[0]);
        }
      } catch (err) {
        console.error('Failed to load active delivery:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleUpdateStatus = async (nextStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      await orderApi.updateStatus(order.id, { status: nextStatus });
      const refreshed = await orderApi.getById(order.id);
      setOrder(refreshed.data);
      if (nextStatus === 'DELIVERED') {
        alert('Consignment marked as DELIVERED in the database! Courier share credited.');
        navigate('/agent/orders');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update order status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="delivero-card p-12 text-center text-slate-400 text-xs max-w-4xl mx-auto my-12">
        <span className="inline-block w-6 h-6 border-2 border-[#5046e4] border-t-transparent rounded-full animate-spin mr-2" />
        Loading delivery assignment...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="delivero-card p-12 text-center space-y-3 max-w-xl mx-auto my-12">
        <Bike className="w-12 h-12 text-slate-300 stroke-1 mx-auto" />
        <h3 className="text-base font-extrabold text-slate-900">No Active Assignment</h3>
        <p className="text-xs text-slate-500">You do not have any pending consignments to dispatch right now.</p>
        <Link to="/agent/orders" className="btn-primary inline-block text-xs font-bold shadow-sm mt-2">
          View All Deliveries
        </Link>
      </div>
    );
  }

  const courierEarning = Math.round((order.computedCharge || 0) * 0.7);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/agent/orders" className="text-xs font-bold text-slate-500 hover:text-slate-900">
            ← Orders
          </Link>
          <span className="text-slate-300">•</span>
          <h1 className="text-xl font-extrabold text-slate-900 font-mono">
            Consignment #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <span className="badge badge-in-transit text-3xs font-bold">{order.status}</span>
        </div>
        <span className="font-mono text-emerald-600 font-black text-sm">
          Courier Share: {formatCurrency(courierEarning)}
        </span>
      </div>

      {/* Overview Card */}
      <div className="delivero-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="text-3xs font-bold uppercase text-emerald-700 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Pickup Origin
            </span>
            <p className="font-bold text-slate-900">{order.pickupCity} ({order.pickupPincode})</p>
            <p className="text-slate-600">{order.pickupAddress}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="text-3xs font-bold uppercase text-purple-700 flex items-center gap-1">
              <Flag className="w-3 h-3" /> Drop Destination
            </span>
            <p className="font-bold text-slate-900">{order.dropCity} ({order.dropPincode})</p>
            <p className="text-slate-600">{order.dropAddress}</p>
            <p className="text-3xs text-slate-400 font-mono mt-1">Receiver: {order.receiverName} ({order.receiverPhone})</p>
          </div>
        </div>

        {/* Live Vector Map */}
        <DeliveroMap
          className="h-64"
          pickupAddress={order.pickupCity || order.pickupAddress}
          dropAddress={order.dropCity || order.dropAddress}
        />

        {/* Customer Contact Card */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5046e4] text-white flex items-center justify-center font-bold text-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{order.receiverName || 'Consignee'}</p>
              <p className="text-3xs text-slate-500 font-mono">{order.receiverPhone}</p>
            </div>
          </div>

          <button
            onClick={() => setShowCallModal(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Phone className="w-3.5 h-3.5" /> Call Customer
          </button>
        </div>

        {/* Lifecycle Action Buttons */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase text-slate-400">Update Real-Time Delivery State</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleUpdateStatus('PICKED_UP')}
              disabled={updating}
              className="py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 shadow-xs"
            >
              1. Mark as Picked Up
            </button>

            <button
              onClick={() => handleUpdateStatus('OUT_FOR_DELIVERY')}
              disabled={updating}
              className="py-3 px-4 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-xs font-bold text-[#5046e4] shadow-xs"
            >
              2. Out for Delivery
            </button>

            <button
              onClick={() => handleUpdateStatus('DELIVERED')}
              disabled={updating}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-black text-white shadow-md"
            >
              3. Complete & Settle Handover
            </button>
          </div>
        </div>
      </div>

      {showCallModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="delivero-card p-6 max-w-xs w-full text-center space-y-3 animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5046e4] mx-auto flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-slate-900">Calling Customer</h4>
            <p className="text-xs font-bold text-slate-800">{order.receiverName}</p>
            <p className="text-xs text-[#5046e4] font-mono">{order.receiverPhone}</p>
            <button onClick={() => setShowCallModal(false)} className="btn-secondary text-xs mt-2 w-full font-bold">
              End Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
