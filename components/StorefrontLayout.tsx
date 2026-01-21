import React, { useState } from 'react';
import { AppRoute, Promotion } from '../types';

interface StorefrontLayoutProps {
  children: React.ReactNode;
  onNavigate: (route: AppRoute) => void;
  cartCount: number;
  wishlistCount: number;
  currentRoute: AppRoute;
  activeBanner?: Promotion | null;
  onCloseBanner?: () => void;
}

const StorefrontLayout: React.FC<StorefrontLayoutProps> = ({ 
  children, 
  onNavigate, 
  cartCount, 
  wishlistCount,
  currentRoute,
  activeBanner,
  onCloseBanner
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { icon: 'fa-house', label: 'Home', route: AppRoute.STORE },
    { icon: 'fa-magnifying-glass', label: 'Search', route: AppRoute.SEARCH },
    { icon: 'fa-heart', label: 'Wishlist', route: AppRoute.WISHLIST, count: wishlistCount },
    { icon: 'fa-bag-shopping', label: 'Bag', route: AppRoute.CART, count: cartCount },
    { icon: 'fa-user', label: 'Account', route: AppRoute.PROFILE },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans relative">
      {/* Top Banner - Fixed to reference image */}
      {activeBanner && (
        <div className="bg-black text-white text-[10px] font-black py-2.5 px-6 text-center relative tracking-[0.15em] uppercase z-[61]">
           <div className="max-w-7xl mx-auto flex justify-center items-center">
              <span>{activeBanner.content}</span>
           </div>
           {activeBanner.closable && (
             <button 
               onClick={onCloseBanner}
               className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition"
               aria-label="Close banner"
             >
               <i className="fa-solid fa-xmark text-sm"></i>
             </button>
           )}
        </div>
      )}

      {/* Main Header - Clean white as per reference */}
      <nav className="bg-white sticky top-0 z-[60] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate(AppRoute.STORE)}>
            <span className="text-2xl font-[900] tracking-tighter text-black uppercase italic">FYX.</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <button onClick={() => onNavigate(AppRoute.CART)} className="relative hover:opacity-60 transition text-black">
              <i className="fa-solid fa-bag-shopping text-xl"></i>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] font-black w-3.5 h-3.5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow animate-fade-in">
        {children}
      </main>

      <section className="bg-[#f8f8f8] py-20 px-6 relative overflow-hidden border-t border-gray-100">
         <div className="max-w-3xl mx-auto text-center relative z-10">
            <div className="w-16 h-16 bg-[#e5e5e5] rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
               <i className="fa-regular fa-envelope text-2xl text-black"></i>
            </div>
            <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-4">Join the FYX Family</h2>
            <p className="text-gray-500 font-medium mb-8 leading-relaxed max-w-lg mx-auto">
               Subscribe to our newsletter and get exclusive access to new arrivals and a <span className="text-black font-bold">15% discount</span> on your first order.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-10">
               <input 
                 type="email" 
                 placeholder="Enter your email address" 
                 className="flex-1 bg-white border border-gray-200 rounded-xl px-6 py-4 text-sm font-bold outline-none focus:border-black transition"
               />
               <button className="bg-black text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#1a1614] transition shadow-lg transform hover:-translate-y-1">
                 Subscribe
               </button>
            </div>
         </div>
      </section>

      <footer className="bg-black text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
           <h3 className="text-3xl font-black tracking-tighter italic">FYX.</h3>
           <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <button className="hover:text-white transition">Privacy</button>
              <button className="hover:text-white transition">Terms</button>
              <button className="hover:text-white transition">Contact</button>
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">© 2025 FYX. Premium Quality.</p>
        </div>
      </footer>

      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 z-[80] pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
             const isActive = currentRoute === item.route;
             return (
              <button 
                key={item.label}
                onClick={() => onNavigate(item.route)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-black' : 'text-gray-400'}`}
              >
                <div className="relative">
                  <i className={`fa-solid ${item.icon} text-lg transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}></i>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                      {item.count}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wide">{item.label}</span>
              </button>
             );
          })}
        </div>
      </div>
    </div>
  );
};

export default StorefrontLayout;