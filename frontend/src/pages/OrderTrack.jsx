import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, Clock, ChefHat, Sparkles, UtensilsCrossed, 
  ArrowLeft, Bell, AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { socket } from '../services/socket';

export const OrderTrack = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const statusSteps = [
    { key: 'Placed', title: 'Docket Received', desc: 'Sent to kitchen display', icon: CheckCircle2 },
    { key: 'Preparing', title: 'Kitchen Preparing', desc: 'Chef is cooking your order', icon: ChefHat },
    { key: 'Ready', title: 'Ready to Serve', desc: 'Hot & ready on counter', icon: Sparkles },
    { key: 'Served', title: 'Served at Table', desc: 'Bon Appétit! Enjoy your meal', icon: UtensilsCrossed },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'Placed': return 0;
      case 'Preparing': return 1;
      case 'Ready': return 2;
      case 'Served': return 3;
      default: return 0;
    }
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const data = await api.getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Fetch order error:', err);
        setError('Order not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();

    if (socket) {
      socket.emit('joinOrderRoom', orderId);
      socket.on('orderStatusUpdated', (updatedOrder) => {
        if (updatedOrder._id === orderId) {
          setOrder(updatedOrder);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('orderStatusUpdated');
      }
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-[#F0EBE1] flex flex-col items-center justify-center p-6 text-center text-[#1C1B19]">
        <div className="w-8 h-8 border-2 border-[#B8834A] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="font-mono text-xs text-[#B8834A] font-semibold">CONNECTING TO KITCHEN TRACKER...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F0EBE1] text-[#1C1B19] p-6">
        <div className="max-w-md mx-auto my-12 p-6 bg-[#E8E2D7] rounded-sm border border-[#D8D0C3] text-center">
          <AlertCircle className="w-10 h-10 text-[#A8432F] mx-auto mb-3" />
          <h2 className="font-serif font-bold text-lg text-[#1C1B19]">Order Not Found</h2>
          <p className="font-mono text-xs text-[#1C1B19]/70 mt-1 mb-6">{error || 'Invalid docket ID.'}</p>
          <Link 
            to="/"
            className="px-4 py-2 rounded-sm bg-[#1C1B19] text-[#F0EBE1] font-mono text-xs font-bold inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);

  return (
    <div className="min-h-screen bg-[#F0EBE1] text-[#1C1B19] py-8 px-4">
      <div className="max-w-xl mx-auto">
        
        {/* Back Link */}
        <Link 
          to={`/table/${order.table?.number || 1}`}
          className="inline-flex items-center gap-2 font-mono text-xs text-[#1C1B19]/70 hover:text-[#B8834A] transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Order Additional Items
        </Link>

        {/* Docket Receipt Container */}
        <div className="bg-[#E8E2D7] rounded-sm p-6 sm:p-8 border border-[#D8D0C3] relative mb-6 font-sans">
          
          {/* Header Ticket Details */}
          <div className="border-b-2 border-[#1C1B19] pb-4 mb-6 flex justify-between items-start font-mono">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8834A] bg-[#F0EBE1] border border-[#B8834A]/40 px-2 py-0.5 rounded-sm">
                LIVE DOCKET #{order._id.substring(order._id.length - 6)}
              </span>
              <h1 className="font-serif font-black text-2xl text-[#1C1B19] mt-2">
                Table #{order.table?.number || 'N/A'}
              </h1>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#1C1B19]/60 uppercase">TOTAL BILL</span>
              <p className="font-mono text-xl font-extrabold text-[#1C1B19]">₹{order.totalAmount}</p>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 font-mono">
              <span className="text-xs font-bold text-[#1C1B19] flex items-center gap-1.5 uppercase">
                <Bell className="w-3.5 h-3.5 text-[#B8834A]" />
                Kitchen Status Timeline
              </span>
              <span className="text-xs text-[#B8834A] font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {order.status === 'Served' ? 'SERVED' : 'EST. ~15 MINS'}
              </span>
            </div>

            <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D8D0C3]">
              {statusSteps.map((step, idx) => {
                const isDone = currentStep >= idx;
                const isCurrent = currentStep === idx;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex items-start gap-4 relative z-10">
                    <div 
                      className={`w-7 h-7 rounded-sm flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-[#B8834A] text-[#1C1B19] scale-110 font-bold shadow-sm'
                          : isDone
                          ? 'bg-[#6B7A5E] text-[#F0EBE1]'
                          : 'bg-[#F0EBE1] text-[#1C1B19]/30 border border-[#D8D0C3]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>

                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-serif font-bold text-sm ${isDone ? 'text-[#1C1B19]' : 'text-[#1C1B19]/40'}`}>
                          {step.title}
                        </h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-[#B8834A] text-[#1C1B19] font-mono text-[9px] font-extrabold uppercase tracking-wider rounded-sm animate-stamp">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#1C1B19]/70 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Itemized Order List */}
          <div className="bg-[#F0EBE1] p-4 rounded-sm border border-[#D8D0C3] font-mono text-xs">
            <div className="border-b border-[#D8D0C3] pb-2 mb-3 text-[10px] text-[#1C1B19]/60 font-bold uppercase">
              ORDERED ITEMS
            </div>
            <div className="divide-y divide-dashed divide-[#D8D0C3]">
              {order.items.map((item, index) => (
                <div key={index} className="py-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#B8834A]">
                      {item.quantity}x
                    </span>
                    <span className="font-serif font-bold text-[#1C1B19]">
                      {item.menuItem?.name || item.name || 'Dish'}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-[#1C1B19]">
                    ₹{(item.menuItem?.price || 200) * item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
