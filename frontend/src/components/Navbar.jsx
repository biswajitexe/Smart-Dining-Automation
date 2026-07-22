import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UtensilsCrossed, LogOut, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { tableNumber } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const isCustomerPage = location.pathname.startsWith('/table') || location.pathname.startsWith('/order-track');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header 
      className={`sticky top-0 z-40 transition-colors duration-200 ${
        isCustomerPage 
          ? 'bg-[#F0EBE1] text-[#1C1B19] border-b border-[#D8D0C3]' 
          : 'bg-[#1C1B19] text-[#F0EBE1] border-b border-[#383430]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Restaurant Logo & Title */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-sm bg-[#B8834A] flex items-center justify-center text-[#1C1B19] shadow-sm">
            <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-base tracking-wide leading-none">
              Smart<span className="text-[#B8834A]">Dining</span>
            </h1>
            <p className="font-mono text-[9px] text-[#B8834A] uppercase tracking-widest mt-1">
              Kitchen Automation
            </p>
          </div>
        </Link>

        {/* Center Table Badge */}
        {tableNumber && isCustomerPage && (
          <div className="flex items-center gap-2 bg-[#E8E2D7] border border-[#B8834A]/40 px-3 py-1 rounded-sm">
            <span className="w-2 h-2 rounded-full bg-[#B8834A]"></span>
            <span className="font-mono text-xs font-bold text-[#1C1B19]">
              TABLE #{tableNumber}
            </span>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link 
                to="/admin/dashboard" 
                className="hidden sm:flex items-center gap-1.5 font-mono text-xs font-semibold bg-[#252320] hover:bg-[#2D2A26] text-[#F0EBE1] px-3 py-1.5 rounded-sm border border-[#383430] transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#B8834A]" />
                KDS Board
              </Link>

              <div className="flex items-center gap-2 bg-[#252320] px-2.5 py-1.5 rounded-sm border border-[#383430]">
                <User className="w-3.5 h-3.5 text-[#B8834A]" />
                <span className="font-mono text-xs text-[#F0EBE1] hidden md:inline">
                  {user?.username}
                </span>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1 text-[#F0EBE1]/60 hover:text-[#A8432F] transition ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="font-mono text-xs font-bold bg-[#B8834A] hover:bg-[#9E6E3B] text-[#1C1B19] px-3.5 py-1.5 rounded-sm transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Staff Login
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};
