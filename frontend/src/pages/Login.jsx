import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    const success = await login(username, password);
    if (success) {
      navigate('/admin/dashboard');
    }
  };

  const handleDemoFill = () => {
    setUsername('admin');
    setPassword('adminpassword');
  };

  return (
    <div className="min-h-[85vh] bg-[#1C1B19] text-[#F0EBE1] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#252320] p-8 rounded-sm border border-[#383430] shadow-2xl relative">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#B8834A] text-[#1C1B19] flex items-center justify-center mx-auto mb-4 rounded-sm">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="font-serif font-black text-2xl text-[#F0EBE1] tracking-tight">
            Kitchen Display Login
          </h1>
          <p className="font-mono text-xs text-[#B8834A] mt-1 uppercase tracking-widest">
            STAFF & KDS SYSTEM PORTAL
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-sm bg-[#A8432F]/20 border border-[#A8432F] text-[#A8432F] font-mono text-xs text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <div>
            <label className="block font-mono text-xs font-semibold text-[#F0EBE1]/70 mb-1.5 uppercase tracking-wider">
              USERNAME
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#B8834A] absolute left-3.5 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="w-full bg-[#1C1B19] border border-[#383430] rounded-sm py-2.5 pl-10 pr-4 text-xs font-mono text-[#F0EBE1] placeholder-[#F0EBE1]/30 focus:outline-none focus:border-[#B8834A]"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs font-semibold text-[#F0EBE1]/70 mb-1.5 uppercase tracking-wider">
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#B8834A] absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full bg-[#1C1B19] border border-[#383430] rounded-sm py-2.5 pl-10 pr-4 text-xs font-mono text-[#F0EBE1] placeholder-[#F0EBE1]/30 focus:outline-none focus:border-[#B8834A]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-sm bg-[#B8834A] hover:bg-[#9E6E3B] text-[#1C1B19] font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-[#1C1B19] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                AUTHENTICATE TO KDS BOARD
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>

        {/* Demo Helper */}
        <div className="mt-8 pt-6 border-t border-[#383430] text-center font-mono">
          <p className="text-[10px] text-[#F0EBE1]/50 mb-2 uppercase">DEFAULT SEEDED CREDENTIALS</p>
          <button
            onClick={handleDemoFill}
            className="text-xs text-[#B8834A] hover:underline font-bold"
          >
            AUTO-FILL ADMIN (`admin` / `adminpassword`)
          </button>
        </div>

      </div>
    </div>
  );
};
