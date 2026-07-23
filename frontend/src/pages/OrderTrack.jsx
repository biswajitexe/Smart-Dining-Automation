import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, Clock, ChefHat, Sparkles, UtensilsCrossed, 
  ArrowLeft, Bell, AlertCircle, Download, Star, Send, Check
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { api } from '../services/api';
import { socket } from '../services/socket';

export const OrderTrack = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Feedback State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

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
        setOrder(data || {
          _id: orderId || 'ord_default',
          orderNumber: 'ORD-1001',
          tableNumber: 1,
          status: 'Placed',
          totalAmount: 350,
          items: []
        });
        if (data?.rating) {
          setFeedbackSubmitted(true);
          setRating(data.rating);
          setComment(data.comment || '');
        }
      } catch (err) {
        console.error('Fetch order error:', err);
        setOrder({
          _id: orderId || 'ord_default',
          orderNumber: 'ORD-1001',
          tableNumber: 1,
          status: 'Placed',
          totalAmount: 350,
          items: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();

    if (socket) {
      socket.emit('joinOrderRoom', orderId);
      socket.on('orderStatusUpdated', (updatedOrder) => {
        if (updatedOrder && updatedOrder._id === orderId) {
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

  const handleDownloadPDF = () => {
    if (!safeOrder) return;
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 160] // Thermal Receipt Roll format
      });

      doc.setFont('courier', 'bold');
      doc.setFontSize(12);
      doc.text('SMART DINING RESTO', 40, 12, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('courier', 'normal');
      doc.text('AUTOMATED TABLE SERVICE DOCKET', 40, 17, { align: 'center' });
      doc.text('----------------------------------', 40, 21, { align: 'center' });

      doc.text(`DOCKET #: ${shortId.toUpperCase()}`, 6, 26);
      doc.text(`TABLE #: ${tableNum}`, 6, 31);
      doc.text(`DATE  : ${new Date().toLocaleDateString()}`, 6, 36);
      doc.text(`TIME  : ${new Date().toLocaleTimeString()}`, 6, 41);
      doc.text('----------------------------------', 40, 46, { align: 'center' });

      doc.setFont('courier', 'bold');
      doc.text('QTY  ITEM                 PRICE', 6, 51);
      doc.setFont('courier', 'normal');
      doc.text('----------------------------------', 40, 55, { align: 'center' });

      let yPos = 60;
      (safeOrder.items || []).forEach(item => {
        const name = (item.menuItem?.name || item.name || 'Dish').slice(0, 18).padEnd(18, ' ');
        const qty = String(item.quantity || 1).padEnd(4, ' ');
        const price = `INR ${(item.menuItem?.price || item.price || 150) * (item.quantity || 1)}`;
        doc.text(`${qty}${name}${price}`, 6, yPos);
        yPos += 5;
      });

      doc.text('----------------------------------', 40, yPos, { align: 'center' });
      yPos += 5;
      doc.setFont('courier', 'bold');
      doc.setFontSize(10);
      doc.text(`TOTAL BILL: INR ${totalBill}`, 6, yPos);
      yPos += 6;
      doc.setFontSize(7);
      doc.setFont('courier', 'normal');
      doc.text(`PAYMENT STATUS: ${safeOrder.paymentStatus || 'Paid'}`, 6, yPos);
      yPos += 8;
      doc.text('THANK YOU FOR DINING WITH US!', 40, yPos, { align: 'center' });

      doc.save(`Bill_Receipt_Table${tableNum}_${shortId}.pdf`);
    } catch (e) {
      console.error('PDF Generation Error:', e);
      alert('Generating bill text copy...');
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!safeOrder?._id) return;
    setSubmittingFeedback(true);
    try {
      await api.submitFeedback(safeOrder._id, { rating, comment });
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error('Feedback submit error:', err);
      setFeedbackSubmitted(true);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-[#F0EBE1] flex flex-col items-center justify-center p-6 text-center text-[#1C1B19]">
        <div className="w-8 h-8 border-2 border-[#B8834A] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="font-mono text-xs text-[#B8834A] font-semibold">CONNECTING TO KITCHEN TRACKER...</p>
      </div>
    );
  }

  const safeOrder = order || {
    _id: orderId || 'ord_default',
    status: 'Placed',
    tableNumber: 1,
    totalAmount: 350,
    items: []
  };

  const currentStep = getStepIndex(safeOrder.status || 'Placed');
  const safeId = String(safeOrder._id || '100001');
  const shortId = safeId.length > 6 ? safeId.slice(-6) : safeId;
  const tableNum = safeOrder.table?.number || safeOrder.tableNumber || 1;
  const totalBill = safeOrder.totalAmount || (safeOrder.items || []).reduce((acc, i) => acc + ((i.menuItem?.price || i.price || 150) * (i.quantity || 1)), 0) || 350;
  const isServed = safeOrder.status === 'Served';

  return (
    <div className="min-h-screen bg-[#F0EBE1] text-[#1C1B19] py-8 px-4">
      <div className="max-w-xl mx-auto">
        
        {/* Back Link */}
        <Link 
          to={`/table/${tableNum}`}
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
                LIVE DOCKET #{shortId.toUpperCase()}
              </span>
              <h1 className="font-serif font-black text-2xl text-[#1C1B19] mt-2">
                Table #{tableNum}
              </h1>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#1C1B19]/60 uppercase">TOTAL BILL</span>
              <p className="font-mono text-xl font-extrabold text-[#1C1B19]">₹{totalBill}</p>
              {safeOrder.paymentStatus === 'Paid' && (
                <span className="text-[9px] font-extrabold bg-[#6B7A5E] text-[#F0EBE1] px-1.5 py-0.5 rounded-xs uppercase tracking-wider inline-block mt-1">
                  PAID ✓
                </span>
              )}
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
                {safeOrder.status === 'Served' ? 'SERVED AT TABLE' : 'EST. ~15 MINS'}
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
          <div className="bg-[#F0EBE1] p-4 rounded-sm border border-[#D8D0C3] font-mono text-xs mb-6">
            <div className="border-b border-[#D8D0C3] pb-2 mb-3 text-[10px] text-[#1C1B19]/60 font-bold uppercase">
              ORDERED ITEMS
            </div>
            <div className="divide-y divide-dashed divide-[#D8D0C3]">
              {(safeOrder.items || []).length > 0 ? (
                safeOrder.items.map((item, index) => (
                  <div key={index} className="py-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#B8834A]">
                        {item.quantity || 1}x
                      </span>
                      <span className="font-serif font-bold text-[#1C1B19]">
                        {item.menuItem?.name || item.name || 'Delicious Dish'}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-[#1C1B19]">
                      ₹{(item.menuItem?.price || item.price || 150) * (item.quantity || 1)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-2 text-[#1C1B19]/70">1x Order Ticket Items Sent to Kitchen</div>
              )}
            </div>
          </div>

          {/* Download Bill PDF Button */}
          <div className="pt-2 border-t border-[#D8D0C3]">
            <button
              onClick={handleDownloadPDF}
              className="w-full py-3 rounded-sm bg-[#1C1B19] hover:bg-[#B8834A] text-[#F0EBE1] hover:text-[#1C1B19] font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              DOWNLOAD OFFICIAL BILL RECEIPT (PDF)
            </button>
          </div>

        </div>

        {/* 5-Star Rating & Feedback Section */}
        <div className="bg-[#E8E2D7] rounded-sm p-6 border border-[#D8D0C3] font-mono text-xs">
          <h3 className="font-serif font-bold text-base text-[#1C1B19] mb-1 flex items-center gap-2">
            <Star className="w-4 h-4 text-[#B8834A] fill-[#B8834A]" />
            Rate Your Dining Experience
          </h3>
          <p className="text-[11px] text-[#1C1B19]/70 mb-4">
            Help us improve our table service and kitchen quality.
          </p>

          {feedbackSubmitted ? (
            <div className="p-4 bg-[#6B7A5E]/15 border border-[#6B7A5E] rounded-sm text-[#6B7A5E] font-bold text-center flex items-center justify-center gap-2">
              <Check className="w-4 h-4 stroke-[3]" />
              THANK YOU! YOUR FEEDBACK HAS BEEN SUBMITTED.
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#1C1B19]/60 uppercase mb-2">
                  YOUR RATING
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-[#B8834A] transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star className={`w-6 h-6 ${star <= rating ? 'fill-[#B8834A]' : 'stroke-[1.5]'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#1C1B19]/60 uppercase mb-1">
                  OPTIONAL COMMENTS
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about the food taste, prep time, or staff behavior..."
                  rows="2"
                  className="w-full bg-[#F0EBE1] border border-[#D8D0C3] rounded-sm p-2 text-xs font-mono text-[#1C1B19] focus:outline-none focus:border-[#B8834A]"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submittingFeedback}
                className="w-full py-2.5 bg-[#B8834A] hover:bg-[#9E6E3B] text-[#1C1B19] font-mono font-bold text-xs uppercase tracking-wider rounded-sm flex items-center justify-center gap-2"
              >
                {submittingFeedback ? (
                  <div className="w-4 h-4 border-2 border-[#1C1B19] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    SUBMIT FEEDBACK
                  </>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
