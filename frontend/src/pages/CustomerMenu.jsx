import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Plus, Minus, X, ChevronRight, 
  Clock, CheckCircle, Utensils, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';

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

  const categories = ['All', 'Starters', 'Main Course', 'Beverages', 'Desserts'];

  useEffect(() => {
    const tableNum = parseInt(urlTableNumber) || 1;
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
  }, [urlTableNumber, setTableNumber]);

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
        tableNumber: parseInt(urlTableNumber) || 1,
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
      navigate(`/order-track/${createdOrder._id}`);
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
    <div className="min-h-screen bg-[#F0EBE1] text-[#1C1B19] pb-32">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        
        {/* Menu Header Banner */}
        <div className="border-b-2 border-[#1C1B19] pb-6 mb-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="font-mono text-[10px] font-bold text-[#B8834A] uppercase tracking-widest">
                TABLE SERVICE DOCKET • #{urlTableNumber || 1}
              </span>
              <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-[#1C1B19] tracking-tight mt-1">
                À La Carte Menu
              </h1>
            </div>
            <div className="text-right hidden sm:block">
              <span className="font-mono text-xs text-[#1C1B19]/70">INSTANT KITCHEN ORDER</span>
            </div>
          </div>
        </div>

        {!tableValid && (
          <div className="mb-6 p-3 rounded-sm bg-[#A8432F]/10 border border-[#A8432F]/40 text-[#A8432F] font-mono text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Table #{urlTableNumber} registered under default guest docket.</span>
          </div>
        )}

        {/* Menu Category Tabs (Physical Card Tab Style) */}
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
            return (
              <div 
                key={item._id}
                className="bg-[#E8E2D7] rounded-sm p-4 border border-[#D8D0C3] hover:border-[#B8834A] transition-all duration-200 flex gap-4 relative group"
              >
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
                    <div className="flex justify-between items-start gap-2">
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
                    {qty > 0 ? (
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

      {/* Cart Drawer (Right-sliding Guest Check / Receipt Docket) */}
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
                  Table #{urlTableNumber || 1} Order
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

            {/* Receipt Running Total Footer */}
            <div className="p-6 bg-[#E8E2D7] border-t-2 border-[#1C1B19] font-mono">
              <div className="flex justify-between items-center text-xs text-[#1C1B19]/70 mb-2">
                <span>ESTIMATED PREP</span>
                <span className="font-bold text-[#B8834A] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> ~15 MINS
                </span>
              </div>

              <div className="dotted-receipt-line my-3"></div>

              <div className="flex justify-between items-center mb-6 text-[#1C1B19]">
                <span className="font-serif font-bold text-base">TOTAL BILL</span>
                <span className="font-mono font-extrabold text-2xl text-[#1C1B19]">₹{totalAmount}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="w-full py-3.5 rounded-sm bg-[#1C1B19] hover:bg-[#B8834A] text-[#F0EBE1] hover:text-[#1C1B19] font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-[#1C1B19] disabled:opacity-50"
              >
                {placingOrder ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#F0EBE1] border-t-transparent rounded-full animate-spin"></div>
                    SENDING TO KITCHEN...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    SEND DOCKET TO KITCHEN
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
