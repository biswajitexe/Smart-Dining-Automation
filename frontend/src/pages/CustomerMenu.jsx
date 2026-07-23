import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Plus, Minus, X, ChevronRight, 
  Clock, CheckCircle, Utensils, AlertCircle, Bell,
  QrCode, Zap, Check
} from 'lucide-react';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { socket } from '../services/socket';

export const CustomerMenu = () => {
  const { tableNumber: urlTableNumber } = useParams();
  const navigate = useNavigate();
  const { 
    cart, setTableNumber, addToCart, updateQuantity, 
    clearCart, totalAmount, totalCount 
  } = useCart();

  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [tableValid, setTableValid] = useState(true);

  // Call Waiter & Payment Modals
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paying, setPaying] = useState(false);

  const categories = ['All', 'Starters', 'Main Course', 'Beverages', 'Desserts'];
  const tableNum = parseInt(urlTableNumber) || 1;

  useEffect(() => {
    setTableNumber(tableNum);

    const initMenu = async () => {
      try {
        setLoading(true);
        const [items, tableData] = await Promise.all([
          api.getMenu(true),
          api.getTableByNumber(tableNum).catch(() => null)
        ]);

        setMenuItems(items);
        if (!tableData) {
          setTableValid(false);
        }
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError('Failed to load menu.');
      } finally {
        setLoading(false);
      }
    };

    initMenu();
  }, [urlTableNumber, setTableNumber, tableNum]);

  const handleCallWaiter = () => {
    if (socket) {
      socket.emit('callWaiter', { tableNumber: tableNum });
    }
    setWaiterCalled(true);
    setTimeout(() => setWaiterCalled(false), 5000);
  };

  const handleSimulatePayment = async () => {
    setPaying(true);
    setTimeout(async () => {
      setPaying(false);
      setPaymentSuccess(true);

      // Auto place order if cart not empty
      if (cart.length > 0) {
        try {
          const orderPayload = {
            tableNumber: tableNum,
            items: cart.map(item => ({
              menuItem: item.menuItem._id,
              name: item.menuItem.name,
              quantity: item.quantity,
              notes: item.notes || ''
            }))
          };
          const createdOrder = await api.placeOrder(orderPayload);
          if (createdOrder?._id) {
            const paidOrder = await api.payOrder(createdOrder._id);
            if (socket) {
              socket.emit('newOrder', paidOrder || { ...createdOrder, paymentStatus: 'Paid' });
              socket.emit('orderUpdated', paidOrder || { ...createdOrder, paymentStatus: 'Paid' });
            }
          }
          setTimeout(() => {
            clearCart();
            setIsPaymentModalOpen(false);
            setPaymentSuccess(false);
            if (createdOrder?._id) {
              navigate(`/order-track/${createdOrder._id}`);
            }
          }, 1500);
        } catch (e) {
          clearCart();
          setIsPaymentModalOpen(false);
          setPaymentSuccess(false);
        }
      } else {
        setTimeout(() => {
          setIsPaymentModalOpen(false);
          setPaymentSuccess(false);
        }, 1500);
      }
    }, 1200);
  };

  const filteredItems = activeCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  const getItemQuantity = (itemId) => {
    const found = cart.find(i => i.menuItem._id === itemId);
    return found ? found.quantity : 0;
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setPlacingOrder(true);

    try {
      const orderPayload = {
        tableNumber: tableNum,
        items: cart.map(item => ({
          menuItem: item.menuItem._id,
          name: item.menuItem.name,
          quantity: item.quantity,
          notes: item.notes || ''
        }))
      };

      const createdOrder = await api.placeOrder(orderPayload);
      clearCart();
      setIsCartOpen(false);
      navigate(`/order-track/${createdOrder._id || 'ord_1001'}`);
    } catch (err) {
      console.error('Place order error:', err);
      alert(err.message || 'Failed to place order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-[#F0EBE1] flex flex-col items-center justify-center p-6 text-center text-[#1C1B19]">
        <div className="w-8 h-8 border-2 border-[#B8834A] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="font-mono text-xs text-[#B8834A] font-semibold">PREPARING MENU...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EBE1] text-[#1C1B19] pb-32 relative">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        
        {/* Menu Header Banner */}
        <div className="border-b-2 border-[#1C1B19] pb-6 mb-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="font-mono text-[10px] font-bold text-[#B8834A] uppercase tracking-widest">
                TABLE SERVICE DOCKET • #{tableNum}
              </span>
              <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-[#1C1B19] tracking-tight mt-1">
                À La Carte Menu
              </h1>
            </div>
            <div className="text-right hidden sm:block">
              <span className="font-mono text-xs text-[#1C1B19]/70 uppercase">INSTANT KITCHEN DOCKET</span>
            </div>
          </div>
        </div>

        {/* Waiter Alert Toast Notification */}
        {waiterCalled && (
          <div className="mb-6 p-3 rounded-sm bg-[#B8834A] text-[#1C1B19] font-mono text-xs flex items-center justify-between shadow-md animate-bounce">
            <div className="flex items-center gap-2 font-bold">
              <Bell className="w-4 h-4 text-[#1C1B19] fill-[#1C1B19]" />
              <span>WAITER NOTIFIED FOR TABLE #{tableNum}! STAFF WILL ARRIVE SHORTLY.</span>
            </div>
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
        )}

        {!tableValid && (
          <div className="mb-6 p-3 rounded-sm bg-[#A8432F]/10 border border-[#A8432F]/40 text-[#A8432F] font-mono text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Table #{tableNum} registered under default guest docket.</span>
          </div>
        )}

        {/* Menu Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-[#D8D0C3] pb-0 mb-8 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 font-serif text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px rounded-t-sm ${
                activeCategory === cat
                  ? 'border-[#B8834A] bg-[#E8E2D7] text-[#1C1B19] font-bold'
                  : 'border-transparent text-[#1C1B19]/60 hover:text-[#1C1B19] hover:bg-[#E8E2D7]/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dish Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const qty = getItemQuantity(item._id);
            const isSoldOut = item.availability === false;

            return (
              <div 
                key={item._id}
                className={`bg-[#E8E2D7] rounded-sm p-4 border transition-all duration-200 flex gap-4 relative group ${
                  isSoldOut 
                    ? 'border-[#A8432F]/40 opacity-75 grayscale-30' 
                    : 'border-[#D8D0C3] hover:border-[#B8834A]'
                }`}
              >
                {/* Sold Out Diagonal Ribbon Badge */}
                {isSoldOut && (
                  <div className="absolute top-2 right-2 bg-[#A8432F] text-[#F0EBE1] font-mono text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-xs tracking-widest z-10 shadow-sm animate-pulse">
                    SOLD OUT
                  </div>
                )}

                {/* Dish Photo */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#D8D0C3] shrink-0 overflow-hidden rounded-sm relative">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#1C1B19]/40">
                      <Utensils className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Dish Description & Controls */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 pr-12 sm:pr-0">
                      <h3 className="font-serif font-bold text-[#1C1B19] text-base leading-snug">
                        {item.name}
                      </h3>
                    </div>
                    <p className="text-[#1C1B19]/70 text-xs mt-1 line-clamp-2 leading-relaxed font-sans">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#D8D0C3]">
                    <span className="font-mono font-bold text-[#1C1B19] text-sm">
                      ₹{item.price}
                    </span>

                    {/* Quantity Selector */}
                    {isSoldOut ? (
                      <span className="font-mono text-[10px] font-bold text-[#A8432F] uppercase bg-[#A8432F]/10 px-2 py-1 border border-[#A8432F]/30 rounded-xs">
                        UNAVAILABLE
                      </span>
                    ) : qty > 0 ? (
                      <div className="flex items-center gap-1.5 bg-[#F0EBE1] border border-[#B8834A] p-0.5 rounded-sm">
                        <button
                          onClick={() => updateQuantity(item._id, qty - 1)}
                          className="w-6 h-6 rounded-sm bg-[#E8E2D7] hover:bg-[#D8D0C3] flex items-center justify-center text-[#1C1B19] transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-mono text-xs font-extrabold text-[#B8834A]">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, qty + 1)}
                          className="w-6 h-6 rounded-sm bg-[#B8834A] hover:bg-[#9E6E3B] flex items-center justify-center text-[#1C1B19] transition"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="px-3 py-1 rounded-sm bg-[#1C1B19] hover:bg-[#B8834A] text-[#F0EBE1] hover:text-[#1C1B19] font-mono text-xs font-bold transition flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        ADD
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-[#E8E2D7] rounded-sm border border-[#D8D0C3]">
            <p className="font-serif text-sm text-[#1C1B19]/60">No dishes listed under this category.</p>
          </div>
        )}

      </div>

      {/* Floating Call Waiter Button (Bell Icon) */}
      <div className="fixed bottom-24 left-4 z-40">
        <button
          onClick={handleCallWaiter}
          className="bg-[#B8834A] hover:bg-[#9E6E3B] text-[#1C1B19] p-3.5 rounded-full shadow-2xl border-2 border-[#1C1B19] flex items-center gap-2 font-mono text-xs font-extrabold uppercase tracking-wider transition-transform active:scale-95"
          title="Call Waiter to Table"
        >
          <Bell className="w-5 h-5 fill-[#1C1B19]" />
          <span className="hidden sm:inline">CALL WAITER</span>
        </button>
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-30">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#1C1B19] hover:bg-[#252320] text-[#F0EBE1] p-4 rounded-sm border border-[#B8834A] shadow-xl flex items-center justify-between font-mono transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#B8834A] text-[#1C1B19] flex items-center justify-center rounded-sm">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-[#B8834A] uppercase tracking-wider">
                  {totalCount} {totalCount === 1 ? 'ITEM' : 'ITEMS'} IN DOCKET
                </p>
                <p className="text-base font-extrabold text-[#F0EBE1]">
                  TOTAL: ₹{totalAmount}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#1C1B19] bg-[#B8834A] px-3 py-1.5 rounded-sm uppercase tracking-wider">
              VIEW BILL
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#1C1B19]/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#F0EBE1] text-[#1C1B19] h-full flex flex-col shadow-2xl border-l-2 border-[#1C1B19] animate-in slide-in-from-right duration-200">
            
            {/* Guest Check Header */}
            <div className="p-6 border-b-2 border-[#1C1B19] flex items-center justify-between bg-[#E8E2D7]">
              <div>
                <span className="font-mono text-[10px] font-bold text-[#B8834A] uppercase tracking-widest">
                  RESTAURANT GUEST CHECK
                </span>
                <h2 className="font-serif font-extrabold text-xl text-[#1C1B19]">
                  Table #{tableNum} Order
                </h2>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-sm bg-[#1C1B19] text-[#F0EBE1] flex items-center justify-center hover:bg-[#B8834A] hover:text-[#1C1B19] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Itemized List */}
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs">
              <div className="border-b border-[#D8D0C3] pb-2 mb-4 flex justify-between text-[#1C1B19]/60 uppercase font-bold text-[10px]">
                <span>ITEM DESCRIPTION</span>
                <span>AMOUNT</span>
              </div>

              {cart.map((item) => (
                <div key={item.menuItem._id} className="py-2.5 flex items-center justify-between gap-2 border-b border-dashed border-[#D8D0C3]">
                  <div className="flex-1">
                    <p className="font-serif font-bold text-sm text-[#1C1B19]">
                      {item.menuItem.name}
                    </p>
                    <p className="text-[11px] text-[#1C1B19]/70">
                      ₹{item.menuItem.price} × {item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-[#1C1B19]">
                      ₹{item.menuItem.price * item.quantity}
                    </span>

                    <div className="flex items-center gap-1 bg-[#E8E2D7] border border-[#D8D0C3] p-0.5 rounded-sm">
                      <button
                        onClick={() => updateQuantity(item.menuItem._id, item.quantity - 1)}
                        className="w-5 h-5 bg-[#F0EBE1] text-[#1C1B19] flex items-center justify-center rounded-sm"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center font-bold text-[#B8834A]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.menuItem._id, item.quantity + 1)}
                        className="w-5 h-5 bg-[#B8834A] text-[#1C1B19] flex items-center justify-center rounded-sm"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Receipt Running Total & Actions Footer */}
            <div className="p-6 bg-[#E8E2D7] border-t-2 border-[#1C1B19] font-mono space-y-3">
              <div className="flex justify-between items-center text-xs text-[#1C1B19]/70">
                <span>ESTIMATED PREP</span>
                <span className="font-bold text-[#B8834A] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> ~15 MINS
                </span>
              </div>

              <div className="flex justify-between items-center text-[#1C1B19]">
                <span className="font-serif font-bold text-base">TOTAL BILL</span>
                <span className="font-mono font-extrabold text-2xl text-[#1C1B19]">₹{totalAmount}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="py-3 rounded-sm bg-[#B8834A] hover:bg-[#9E6E3B] text-[#1C1B19] font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-[#1C1B19]"
                >
                  <QrCode className="w-4 h-4" />
                  PAY VIA UPI
                </button>

                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="py-3 rounded-sm bg-[#1C1B19] hover:bg-[#252320] text-[#F0EBE1] font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-[#1C1B19] disabled:opacity-50"
                >
                  {placingOrder ? (
                    <div className="w-4 h-4 border-2 border-[#F0EBE1] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-[#B8834A]" />
                      SEND DOCKET
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Mock UPI Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1B19]/80 backdrop-blur-xs p-4">
          <div className="bg-[#252320] border-2 border-[#B8834A] p-6 sm:p-8 rounded-sm max-w-sm w-full text-center font-mono text-[#F0EBE1] relative shadow-2xl">
            <button 
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-3 right-3 text-[#F0EBE1]/60 hover:text-[#F0EBE1]"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] text-[#B8834A] font-bold uppercase tracking-widest">
              INSTANT TABLE SETTLEMENT
            </span>
            <h3 className="font-serif font-black text-2xl text-[#F0EBE1] mt-1 mb-4">
              Pay ₹{totalAmount}
            </h3>

            {paymentSuccess ? (
              <div className="py-8 my-2">
                <div className="w-20 h-20 bg-[#6B7A5E] text-[#F0EBE1] rounded-full mx-auto flex items-center justify-center border-4 border-[#F0EBE1] animate-stamp">
                  <Check className="w-10 h-10 stroke-[3]" />
                </div>
                <h4 className="font-serif font-bold text-xl text-[#6B7A5E] mt-4">PAYMENT RECEIVED!</h4>
                <p className="text-xs text-[#F0EBE1]/70 mt-1">DOCKET SENT TO KITCHEN BOARD</p>
              </div>
            ) : (
              <>
                {/* Mock QR Stand */}
                <div className="bg-[#F0EBE1] p-4 rounded-sm inline-block mb-6 shadow-inner border border-[#B8834A]">
                  <div className="w-48 h-48 bg-[#1C1B19] p-3 rounded-sm flex flex-col items-center justify-center text-center">
                    <QrCode className="w-32 h-32 text-[#F0EBE1]" />
                    <span className="text-[10px] text-[#B8834A] font-bold mt-2 tracking-wider uppercase">
                      SCAN VIA ANY UPI APP
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSimulatePayment}
                  disabled={paying}
                  className="w-full py-3 rounded-sm bg-[#B8834A] hover:bg-[#9E6E3B] text-[#1C1B19] font-mono font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  {paying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#1C1B19] border-t-transparent rounded-full animate-spin"></div>
                      VERIFYING SETTLEMENT...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-[#1C1B19]" />
                      SIMULATE UPI PAYMENT (TEST)
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
