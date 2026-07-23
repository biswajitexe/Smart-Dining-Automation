import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Utensils, QrCode, TrendingUp, Plus, 
  Clock, ChefHat, Sparkles, Trash2, Edit3, 
  Printer, RefreshCw, CheckCircle2, DollarSign,
  ShoppingBag, Stamp, CheckSquare, Bell, Star, X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { socket } from '../services/socket';

export const AdminDashboard = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('kds'); // 'kds', 'menu', 'tables', 'analytics'
  
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Waiter Assistance Real-Time Alerts
  const [waiterAlerts, setWaiterAlerts] = useState([]);

  // Modals & Forms
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [menuForm, setMenuForm] = useState({
    name: '', price: '', category: 'Starters', image: '', description: '', availability: true
  });

  const [newTableNumber, setNewTableNumber] = useState('');
  const [selectedQRTable, setSelectedQRTable] = useState(null);

  // Audio alert trigger for incoming orders / waiter calls
  const playNewOrderNotification = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}
  };

  useEffect(() => {
    loadAllData(true);

    // 5-second Background Silent Poller (No loading spinner)
    const poller = setInterval(() => {
      loadAllData(false);
    }, 5000);

    if (socket) {
      socket.on('newOrder', (newOrder) => {
        setOrders((prev) => {
          const idx = prev.findIndex(o => o._id === newOrder._id);
          if (idx > -1) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...newOrder };
            return updated;
          }
          return [newOrder, ...prev];
        });
        playNewOrderNotification();
      });

      socket.on('orderUpdated', (updatedOrder) => {
        setOrders((prev) => {
          const idx = prev.findIndex(o => o._id === updatedOrder._id);
          if (idx > -1) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...updatedOrder };
            return updated;
          }
          return [updatedOrder, ...prev];
        });
      });

      socket.on('waiterAssistanceRequested', (data) => {
        setWaiterAlerts((prev) => [data, ...prev]);
        playNewOrderNotification();
      });
    }

    return () => {
      clearInterval(poller);
      if (socket) {
        socket.off('newOrder');
        socket.off('orderUpdated');
        socket.off('waiterAssistanceRequested');
      }
    };
  }, [token]);

  const dismissWaiterAlert = (tableNumber) => {
    setWaiterAlerts((prev) => prev.filter((a) => a.tableNumber !== tableNumber));
    if (socket) {
      socket.emit('dismissWaiterAlert', { tableNumber });
    }
  };

  const loadAllData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [fetchedOrders, fetchedMenu, fetchedTables, fetchedAnalytics] = await Promise.all([
        api.getAdminOrders('', token),
        api.getMenu(false),
        api.getTables(),
        api.getAnalytics(token).catch(() => null)
      ]);

      setOrders((prev) => {
        const map = new Map();
        prev.forEach(o => map.set(o._id, o));
        (fetchedOrders || []).forEach(o => {
          const existing = map.get(o._id);
          map.set(o._id, existing ? { ...existing, ...o } : o);
        });
        return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));
      });

      setMenuItems(fetchedMenu);
      setTables(fetchedTables);
      setAnalytics(fetchedAnalytics);
    } catch (err) {
      console.error('Failed to load KDS data:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus, token);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
      loadAllData();
    } catch (err) {
      alert('Failed to update ticket status');
    }
  };

  // Menu Management & Smart Inventory Toggle
  const handleOpenMenuModal = (item = null) => {
    if (item) {
      setEditingMenuItem(item);
      setMenuForm({
        name: item.name,
        price: item.price,
        category: item.category,
        image: item.image || '',
        description: item.description || '',
        availability: item.availability
      });
    } else {
      setEditingMenuItem(null);
      setMenuForm({
        name: '', price: '', category: 'Starters', image: '', description: '', availability: true
      });
    }
    setIsMenuModalOpen(true);
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    try {
      if (editingMenuItem) {
        await api.updateMenuItem(editingMenuItem._id, menuForm, token);
      } else {
        await api.createMenuItem(menuForm, token);
      }
      setIsMenuModalOpen(false);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error saving menu item');
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await api.updateMenuItem(item._id, { availability: !item.availability }, token);
      loadAllData();
    } catch (err) {
      alert('Error updating availability');
    }
  };

  const handleDeleteMenuItem = async (id) => {
    if (!window.confirm('Delete dish from menu?')) return;
    try {
      await api.deleteMenuItem(id, token);
      loadAllData();
    } catch (err) {
      alert('Error deleting menu item');
    }
  };

  // Table Actions
  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!newTableNumber) return;
    try {
      await api.createTable({ number: parseInt(newTableNumber) }, token);
      setNewTableNumber('');
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error creating table');
    }
  };

  const handleDeleteTable = async (id) => {
    if (!window.confirm('Delete dining table?')) return;
    try {
      await api.deleteTable(id, token);
      loadAllData();
    } catch (err) {
      alert('Error deleting table');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-[#1C1B19] flex flex-col items-center justify-center p-6 text-center text-[#F0EBE1]">
        <div className="w-8 h-8 border-2 border-[#B8834A] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="font-mono text-xs text-[#B8834A] font-bold">LOADING KITCHEN DISPLAY SYSTEM...</p>
      </div>
    );
  }

  // Filter orders into KDS Swim-Lanes
  const placedOrders = orders.filter(o => o.status === 'Placed');
  const preparingOrders = orders.filter(o => o.status === 'Preparing');
  const readyOrders = orders.filter(o => o.status === 'Ready');
  const servedOrders = orders.filter(o => o.status === 'Served');

  return (
    <div className="min-h-screen bg-[#1C1B19] text-[#F0EBE1] p-4 sm:p-6 font-sans">
      
      {/* Real-time Waiter Assistance Alert Banners */}
      {waiterAlerts.length > 0 && (
        <div className="space-y-2 mb-6">
          {waiterAlerts.map((alert, idx) => (
            <div 
              key={idx}
              className="bg-[#B8834A] text-[#1C1B19] p-3 rounded-sm font-mono text-xs flex justify-between items-center shadow-lg border-2 border-[#F0EBE1] animate-bounce"
            >
              <div className="flex items-center gap-2 font-black text-sm">
                <Bell className="w-5 h-5 fill-[#1C1B19]" />
                <span>⚠️ TABLE #{alert.tableNumber} NEEDS ASSISTANCE AT TABLE!</span>
              </div>
              <button
                onClick={() => dismissWaiterAlert(alert.tableNumber)}
                className="px-3 py-1 bg-[#1C1B19] text-[#F0EBE1] font-bold text-[10px] uppercase rounded-xs hover:bg-[#383430]"
              >
                ACKNOWLEDGE & DISMISS ✓
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Top KDS Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#383430] pb-6 mb-6">
        <div>
          <span className="font-mono text-[10px] text-[#B8834A] uppercase tracking-widest font-bold">
            RESTO-KDS • KITCHEN DISPLAY SYSTEM
          </span>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#F0EBE1] mt-0.5 tracking-tight flex items-center gap-2">
            Kitchen Ticket Rail
          </h1>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-[#252320] p-1 rounded-sm border border-[#383430] font-mono text-xs">
          <button
            onClick={() => setActiveTab('kds')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm font-bold transition ${
              activeTab === 'kds'
                ? 'bg-[#B8834A] text-[#1C1B19]'
                : 'text-[#F0EBE1]/70 hover:text-[#F0EBE1]'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            TICKET RAIL ({orders.filter(o => o.status !== 'Served').length})
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm font-bold transition ${
              activeTab === 'tables'
                ? 'bg-[#B8834A] text-[#1C1B19]'
                : 'text-[#F0EBE1]/70 hover:text-[#F0EBE1]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            TABLES ({tables.length})
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm font-bold transition ${
              activeTab === 'menu'
                ? 'bg-[#B8834A] text-[#1C1B19]'
                : 'text-[#F0EBE1]/70 hover:text-[#F0EBE1]'
            }`}
          >
            <Utensils className="w-4 h-4" />
            MENU CATALOG ({menuItems.length})
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm font-bold transition ${
              activeTab === 'analytics'
                ? 'bg-[#B8834A] text-[#1C1B19]'
                : 'text-[#F0EBE1]/70 hover:text-[#F0EBE1]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            REVENUE & REVIEWS
          </button>
        </div>
      </div>

      {/* TAB 1: KITCHEN TICKET RAIL (SWIM-LANES) */}
      {activeTab === 'kds' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* SWIM-LANE 1: PLACED (Rust Red) */}
            <div className="bg-[#252320]/60 p-4 rounded-sm border border-[#383430] flex flex-col">
              <div className="flex justify-between items-center pb-3 border-b-2 border-[#A8432F] mb-4 font-mono">
                <span className="text-xs font-black text-[#A8432F] flex items-center gap-2 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A8432F] animate-ping"></span>
                  1. DOCKETS PLACED ({placedOrders.length})
                </span>
                <span className="text-[10px] text-[#F0EBE1]/50">NEW INCOMING</span>
              </div>

              <div className="space-y-4 flex-1">
                {placedOrders.map((order) => (
                  <TicketDocket 
                    key={order._id} 
                    order={order} 
                    laneColor="rust" 
                    onStatusUpdate={handleUpdateOrderStatus} 
                  />
                ))}

                {placedOrders.length === 0 && (
                  <div className="text-center py-10 font-mono text-xs text-[#F0EBE1]/40 border border-dashed border-[#383430] p-4">
                    NO NEW ORDERS PLACED
                  </div>
                )}
              </div>
            </div>

            {/* SWIM-LANE 2: PREPARING (Copper Metallic) */}
            <div className="bg-[#252320]/60 p-4 rounded-sm border border-[#383430] flex flex-col">
              <div className="flex justify-between items-center pb-3 border-b-2 border-[#B8834A] mb-4 font-mono">
                <span className="text-xs font-black text-[#B8834A] flex items-center gap-2 uppercase tracking-wider">
                  <ChefHat className="w-4 h-4" />
                  2. KITCHEN PREPARING ({preparingOrders.length})
                </span>
                <span className="text-[10px] text-[#F0EBE1]/50">ON GRILL/STOVE</span>
              </div>

              <div className="space-y-4 flex-1">
                {preparingOrders.map((order) => (
                  <TicketDocket 
                    key={order._id} 
                    order={order} 
                    laneColor="copper" 
                    onStatusUpdate={handleUpdateOrderStatus} 
                  />
                ))}

                {preparingOrders.length === 0 && (
                  <div className="text-center py-10 font-mono text-xs text-[#F0EBE1]/40 border border-dashed border-[#383430] p-4">
                    NO DOCKETS PREPARING
                  </div>
                )}
              </div>
            </div>

            {/* SWIM-LANE 3: READY TO SERVE (Sage Green) */}
            <div className="bg-[#252320]/60 p-4 rounded-sm border border-[#383430] flex flex-col">
              <div className="flex justify-between items-center pb-3 border-b-2 border-[#6B7A5E] mb-4 font-mono">
                <span className="text-xs font-black text-[#6B7A5E] flex items-center gap-2 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  3. READY FOR TABLE ({readyOrders.length})
                </span>
                <span className="text-[10px] text-[#F0EBE1]/50">PICKUP COUNTER</span>
              </div>

              <div className="space-y-4 flex-1">
                {readyOrders.map((order) => (
                  <TicketDocket 
                    key={order._id} 
                    order={order} 
                    laneColor="sage" 
                    onStatusUpdate={handleUpdateOrderStatus} 
                  />
                ))}

                {readyOrders.length === 0 && (
                  <div className="text-center py-10 font-mono text-xs text-[#F0EBE1]/40 border border-dashed border-[#383430] p-4">
                    NO ORDERS WAITING PICKUP
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Served Orders Summary Bar */}
          {servedOrders.length > 0 && (
            <div className="mt-8 pt-4 border-t border-[#383430] font-mono text-xs text-[#F0EBE1]/60 flex items-center justify-between">
              <span>COMPLETED / SERVED TODAY: <strong className="text-[#F0EBE1]">{servedOrders.length} DOCKETS</strong></span>
              <button 
                onClick={loadAllData} 
                className="text-[#B8834A] hover:underline font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> REFRESH KDS BOARD
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TABLE MANAGEMENT */}
      {activeTab === 'tables' && (
        <div>
          <div className="bg-[#252320] p-6 rounded-sm border border-[#383430] mb-8 max-w-lg">
            <h2 className="font-serif font-bold text-lg text-[#F0EBE1] mb-3 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#B8834A]" />
              Register Table & Generate QR Code
            </h2>
            <form onSubmit={handleCreateTable} className="flex gap-3">
              <input
                type="number"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                placeholder="Table Number (e.g. 6)"
                required
                className="flex-1 bg-[#1C1B19] border border-[#383430] rounded-sm px-4 py-2 text-xs font-mono text-[#F0EBE1] placeholder-[#F0EBE1]/40 focus:outline-none focus:border-[#B8834A]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-sm bg-[#B8834A] hover:bg-[#9E6E3B] text-[#1C1B19] font-mono text-xs font-bold uppercase tracking-wider"
              >
                CREATE TABLE
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map((tbl) => (
              <div key={tbl._id} className="bg-[#252320] p-4 rounded-sm border border-[#383430] text-center flex flex-col justify-between font-mono">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${tbl.status === 'active' ? 'bg-[#B8834A]' : 'bg-[#383430]'}`}></span>
                    <button onClick={() => handleDeleteTable(tbl._id)} className="text-[#F0EBE1]/40 hover:text-[#A8432F]">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="font-serif text-2xl font-black text-[#F0EBE1]">#{tbl.number}</h3>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 mt-1 inline-block ${
                    tbl.status === 'active' ? 'bg-[#B8834A]/20 text-[#B8834A]' : 'bg-[#1C1B19] text-[#F0EBE1]/50'
                  }`}>
                    {tbl.status}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedQRTable(tbl)}
                  className="mt-4 py-1.5 rounded-sm bg-[#1C1B19] hover:bg-[#383430] text-[#F0EBE1] text-xs font-bold flex items-center justify-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#B8834A]" /> QR CODE
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MENU MANAGEMENT & SMART INVENTORY */}
      {activeTab === 'menu' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif font-bold text-xl text-[#F0EBE1]">Dishes & Smart Inventory</h2>
            <button
              onClick={() => handleOpenMenuModal(null)}
              className="px-4 py-2 rounded-sm bg-[#B8834A] text-[#1C1B19] font-mono text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> ADD NEW DISH
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
            {menuItems.map((item) => (
              <div key={item._id} className="bg-[#252320] p-4 rounded-sm flex gap-4 border border-[#383430] relative">
                <div className="w-20 h-20 bg-[#1C1B19] overflow-hidden shrink-0 rounded-sm">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-serif font-bold text-[#F0EBE1] text-sm">{item.name}</h4>
                      <span className="font-mono font-bold text-[#B8834A] text-xs">₹{item.price}</span>
                    </div>
                    <p className="text-[10px] text-[#F0EBE1]/60 mt-1 font-mono uppercase">{item.category}</p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#383430] font-mono text-[10px]">
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`font-bold px-2 py-1 rounded-xs uppercase tracking-wider transition ${
                        item.availability 
                          ? 'bg-[#6B7A5E]/20 text-[#6B7A5E] hover:bg-[#6B7A5E]/40 border border-[#6B7A5E]' 
                          : 'bg-[#A8432F]/20 text-[#A8432F] hover:bg-[#A8432F]/40 border border-[#A8432F]'
                      }`}
                    >
                      {item.availability ? 'AVAILABLE ✓' : 'MARK AS SOLD OUT 🚫'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button onClick={() => handleOpenMenuModal(item)} className="text-[#F0EBE1]/60 hover:text-[#B8834A]">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteMenuItem(item._id)} className="text-[#F0EBE1]/60 hover:text-[#A8432F]">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REVENUE ANALYTICS & REVIEWS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6 font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-[#252320] p-6 rounded-sm border border-[#B8834A]/40">
              <p className="text-[#B8834A] text-xs font-bold uppercase">TOTAL SALES REVENUE</p>
              <h3 className="font-serif text-3xl font-black text-[#F0EBE1] mt-2">₹{analytics.totalSales}</h3>
            </div>
            <div className="bg-[#252320] p-6 rounded-sm border border-[#383430]">
              <p className="text-[#F0EBE1]/60 text-xs font-bold uppercase">TOTAL DOCKETS PROCESSED</p>
              <h3 className="font-serif text-3xl font-black text-[#F0EBE1] mt-2">{analytics.orderCount}</h3>
            </div>
            <div className="bg-[#252320] p-6 rounded-sm border border-[#383430]">
              <p className="text-[#F0EBE1]/60 text-xs font-bold uppercase flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-[#B8834A] fill-[#B8834A]" /> AVERAGE DINER RATING
              </p>
              <h3 className="font-serif text-3xl font-black text-[#F0EBE1] mt-2">{analytics.avgRating || 4.8} / 5.0</h3>
            </div>
          </div>

          {/* Customer Reviews & Feedback Section */}
          <div className="bg-[#252320] p-6 rounded-sm border border-[#383430]">
            <h3 className="font-serif font-bold text-lg text-[#F0EBE1] mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-[#B8834A] fill-[#B8834A]" />
              Recent Customer Ratings & Feedback
            </h3>

            <div className="space-y-3">
              {(analytics.recentFeedbacks || []).length > 0 ? (
                analytics.recentFeedbacks.map((fb, i) => (
                  <div key={i} className="p-4 bg-[#1C1B19] rounded-sm border border-[#383430] flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[#B8834A]">TABLE #{fb.tableNumber}</span>
                        <div className="flex text-[#B8834A]">
                          {[...Array(fb.rating)].map((_, s) => (
                            <Star key={s} className="w-3 h-3 fill-[#B8834A]" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[#F0EBE1]/80 font-sans italic">"{fb.comment || 'Great food and fast table service!'}"</p>
                    </div>
                    <span className="text-[10px] text-[#F0EBE1]/40">{new Date(fb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-[#F0EBE1]/40 border border-dashed border-[#383430]">
                  NO FEEDBACK REVIEWS RECORDED YET
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* QR MODAL */}
      {selectedQRTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1B19]/80 backdrop-blur-xs p-4">
          <div className="bg-[#252320] border border-[#383430] p-8 rounded-sm max-w-sm w-full text-center font-mono">
            <h3 className="font-serif text-2xl font-black text-[#F0EBE1]">Table #{selectedQRTable.number}</h3>
            <p className="text-xs text-[#B8834A] mt-1 mb-6">SCAN TO OPEN DIGITAL MENU</p>
            <div className="bg-white p-4 rounded-sm inline-block mb-6 shadow-md">
              <img src={selectedQRTable.qrCode} alt={`QR Table ${selectedQRTable.number}`} className="w-48 h-48 mx-auto" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex-1 py-2 bg-[#B8834A] text-[#1C1B19] font-bold text-xs">PRINT QR</button>
              <button onClick={() => setSelectedQRTable(null)} className="px-4 py-2 bg-[#1C1B19] text-[#F0EBE1] font-bold text-xs">CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {/* MENU ITEM MODAL */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1B19]/80 backdrop-blur-xs p-4">
          <div className="bg-[#252320] border border-[#383430] p-6 rounded-sm max-w-md w-full font-mono text-xs">
            <h3 className="font-serif font-bold text-lg text-[#F0EBE1] mb-4">
              {editingMenuItem ? 'Edit Dish Details' : 'Add New Menu Item'}
            </h3>
            <form onSubmit={handleSaveMenuItem} className="space-y-3">
              <div>
                <label className="block text-[#F0EBE1]/70 mb-1">DISH NAME</label>
                <input type="text" value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} required className="w-full bg-[#1C1B19] border border-[#383430] rounded-sm p-2 text-[#F0EBE1]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#F0EBE1]/70 mb-1">PRICE (₹)</label>
                  <input type="number" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} required className="w-full bg-[#1C1B19] border border-[#383430] rounded-sm p-2 text-[#F0EBE1]" />
                </div>
                <div>
                  <label className="block text-[#F0EBE1]/70 mb-1">CATEGORY</label>
                  <select value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} className="w-full bg-[#1C1B19] border border-[#383430] rounded-sm p-2 text-[#F0EBE1]">
                    <option value="Starters">Starters</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[#F0EBE1]/70 mb-1">IMAGE URL</label>
                <input type="text" value={menuForm.image} onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })} className="w-full bg-[#1C1B19] border border-[#383430] rounded-sm p-2 text-[#F0EBE1]" />
              </div>
              <div>
                <label className="block text-[#F0EBE1]/70 mb-1">DESCRIPTION</label>
                <textarea value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} rows="2" className="w-full bg-[#1C1B19] border border-[#383430] rounded-sm p-2 text-[#F0EBE1]"></textarea>
              </div>
              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setIsMenuModalOpen(false)} className="px-4 py-2 bg-[#1C1B19] text-[#F0EBE1]">CANCEL</button>
                <button type="submit" className="px-4 py-2 bg-[#B8834A] text-[#1C1B19] font-bold">SAVE DISH</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// KITCHEN TICKET DOCKET COMPONENT (Real Kitchen Order Receipt Style)
const TicketDocket = ({ order, laneColor, onStatusUpdate }) => {
  const getBadgeStyle = () => {
    switch (laneColor) {
      case 'rust': return 'bg-[#A8432F] text-[#F0EBE1]';
      case 'copper': return 'bg-[#B8834A] text-[#1C1B19]';
      case 'sage': return 'bg-[#6B7A5E] text-[#F0EBE1]';
      default: return 'bg-[#383430] text-[#F0EBE1]';
    }
  };

  return (
    <div className="ticket-docket p-4 shadow-md font-mono relative transition-transform hover:-translate-y-0.5">
      
      {/* Top Ticket Punch Hole & Header */}
      <div className="flex justify-between items-center pb-3 border-b border-dashed border-[#383430] mb-3">
        <div className="flex items-center gap-2">
          <div className="ticket-punch-hole"></div>
          <span className="font-serif font-black text-base text-[#F0EBE1]">
            TBL #{order.table?.number || order.tableNumber || 1}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {order.paymentStatus === 'Paid' && (
            <span className="text-[9px] font-extrabold bg-[#6B7A5E] text-[#F0EBE1] px-1.5 py-0.5 rounded-xs uppercase tracking-wider">
              PAID ✓
            </span>
          )}
          <span className="text-[10px] text-[#B8834A] font-bold">
            #{String(order._id || '10001').slice(-5).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Ticket Items Checklist */}
      <div className="space-y-2 mb-4">
        {(order.items || []).map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border border-[#B8834A] rounded-xs flex items-center justify-center text-[10px] font-bold text-[#B8834A]">
                {item.quantity}
              </span>
              <span className="font-serif font-bold text-[#F0EBE1]">
                {item.menuItem?.name || item.name || 'Dish'}
              </span>
            </div>
            <span className="text-[#F0EBE1]/60 text-[11px]">
              ₹{(item.menuItem?.price || item.price || 200) * item.quantity}
            </span>
          </div>
        ))}
      </div>

      {/* Status Stamp & Quick Action Buttons */}
      <div className="pt-2 border-t border-[#383430] flex items-center justify-between">
        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-xs animate-stamp ${getBadgeStyle()}`}>
          {order.status}
        </span>

        <div className="flex gap-1">
          {order.status === 'Placed' && (
            <button
              onClick={() => onStatusUpdate(order._id, 'Preparing')}
              className="px-2.5 py-1 bg-[#B8834A] hover:bg-[#9E6E3B] text-[#1C1B19] font-bold text-[10px] uppercase rounded-xs transition"
            >
              PREPARE ➔
            </button>
          )}

          {order.status === 'Preparing' && (
            <button
              onClick={() => onStatusUpdate(order._id, 'Ready')}
              className="px-2.5 py-1 bg-[#6B7A5E] hover:bg-[#58664D] text-[#F0EBE1] font-bold text-[10px] uppercase rounded-xs transition"
            >
              READY ➔
            </button>
          )}

          {order.status === 'Ready' && (
            <button
              onClick={() => onStatusUpdate(order._id, 'Served')}
              className="px-2.5 py-1 bg-[#383430] hover:bg-[#4A4640] text-[#F0EBE1] font-bold text-[10px] uppercase rounded-xs transition"
            >
              SERVE ✓
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
