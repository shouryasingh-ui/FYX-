
import React, { useState } from 'react';
import { AppRoute } from '../types';

interface StorefrontLayoutProps {
  children: React.ReactNode;
  onNavigate: (route: AppRoute) => void;
  cartCount: number;
  wishlistCount: number;
  currentRoute: AppRoute;
}

const StorefrontLayout: React.FC<StorefrontLayoutProps> = ({ 
  children, 
  onNavigate, 
  cartCount, 
  wishlistCount,
  currentRoute 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Bottom Navigation Items
  const navItems = [
    { icon: 'fa-house', label: 'Home', route: AppRoute.STORE },
    { icon: 'fa-magnifying-glass', label: 'Search', route: AppRoute.STORE }, // Maps to store for now, effectively "Browse"
    { icon: 'fa-heart', label: 'Wishlist', route: AppRoute.WISHLIST, count: wishlistCount },
    { icon: 'fa-bag-shopping', label: 'Bag', route: AppRoute.CART, count: cartCount },
    { icon: 'fa-user', label: 'Account', route: AppRoute.PROFILE },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans relative">
      
      {/* Top Header (Desktop & Mobile) */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-[60] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate(AppRoute.STORE)}>
            <span className="text-2xl font-[900] tracking-tighter text-black uppercase italic">FYX.</span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-bold text-gray-500 uppercase tracking-widest">
            <button onClick={() => onNavigate(AppRoute.STORE)} className="hover:text-black transition">Shop</button>
            <button onClick={() => onNavigate(AppRoute.STORE)} className="hover:text-black transition">About</button>
            <button onClick={() => onNavigate(AppRoute.PROFILE)} className="hover:text-black transition">Support</button>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-6">
            <button onClick={() => onNavigate(AppRoute.WISHLIST)} className="relative hover:opacity-60 transition">
              <i className="fa-regular fa-heart text-xl"></i>
              {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{wishlistCount}</span>}
            </button>
            <button onClick={() => onNavigate(AppRoute.CART)} className="relative hover:opacity-60 transition">
              <i className="fa-solid fa-bag-shopping text-xl"></i>
              {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{cartCount}</span>}
            </button>
            <button onClick={() => onNavigate(AppRoute.PROFILE)} className="hover:opacity-60 transition">
              <i className="fa-regular fa-user text-xl"></i>
            </button>
          </div>

          {/* Mobile Cart Icon (Top Right) */}
          <div className="md:hidden">
             <button onClick={() => onNavigate(AppRoute.CART)} className="relative p-2">
              <i className="fa-solid fa-bag-shopping text-xl"></i>
              {cartCount > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">{cartCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow animate-fade-in">
        {children}
      </main>

      {/* Newsletter Section */}
      <section className="bg-[#f8f8f8] py-20 px-6 relative overflow-hidden border-t border-gray-100">
         <div className="max-w-3xl mx-auto text-center relative z-10">
            <div className="w-16 h-16 bg-[#e5e5e5] rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
               <i className="fa-regular fa-envelope text-2xl text-black"></i>
            </div>
            <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-4">Join the FYX Family</h2>
            <p className="text-gray-500 font-medium mb-8 leading-relaxed max-w-lg mx-auto">
               Subscribe to our newsletter and get exclusive access to new arrivals, special offers, and a <span className="text-black font-bold">15% discount</span> on your first order.
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

            <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-gray-400">
               <div className="flex items-center gap-2">
                  <i className="fa-solid fa-gift text-black"></i>
                  <span>15% Off First Order</span>
               </div>
               <div className="flex items-center gap-2">
                  <i className="fa-solid fa-star text-black"></i>
                  <span>Exclusive Offers</span>
               </div>
               <div className="flex items-center gap-2">
                  <i className="fa-regular fa-envelope text-black"></i>
                  <span>No Spam, Ever</span>
               </div>
            </div>
         </div>
         
         {/* Decorative Background Elements */}
         <div className="absolute top-0 left-0 w-64 h-64 bg-gray-200 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
         <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#d9c5b2] rounded-full blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1614] text-white pt-20 pb-24 md:pb-10 px-6 sm:px-10 lg:px-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <h3 className="text-4xl font-black tracking-tighter italic">FYX.</h3>
            <p className="text-gray-400 text-sm font-medium leading-relaxed">
              Premium customizable products that help you express your unique style. Transform your space and wardrobe with personalized Photo Frames, Posters, Magazines, Gift Accessories, Mugs, and t-shirts.
            </p>
            <div className="flex space-x-4">
               {['fa-instagram', 'fa-twitter', 'fa-facebook-f', 'fa-pinterest-p'].map(icon => (
                 <button key={icon} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white hover:text-black transition">
                    <i className={`fa-brands ${icon} text-sm`}></i>
                 </button>
               ))}
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#9d938b] mb-8">Shop</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              {['Photo Frames', 'Posters', 'Mugs', 'Men\'s T-Shirts', 'Women\'s T-Shirts', 'Phone Covers', 'Magazine', 'Gift Accessories'].map(item => (
                 <li key={item}><button className="hover:text-white transition">{item}</button></li>
              ))}
            </ul>
          </div>

          {/* Help Column */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#9d938b] mb-8">Help</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              <li><button className="hover:text-white transition">FAQ</button></li>
              <li><button className="hover:text-white transition">Contact Support</button></li>
              <li><button className="hover:text-white transition">Track Order</button></li>
              <li><button className="hover:text-white transition">Shipping Info</button></li>
              <li><button className="hover:text-white transition">Returns</button></li>
            </ul>
          </div>

          {/* Stay Updated Column */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#9d938b] mb-8">Stay Updated</h4>
            <p className="text-gray-400 text-sm mb-6">Subscribe for exclusive offers and updates.</p>
            <div className="flex items-center bg-white/10 rounded-xl p-1 focus-within:ring-1 focus-within:ring-white/50 transition">
               <input 
                 type="email" 
                 placeholder="Your email" 
                 className="bg-transparent border-none px-4 py-2 text-sm text-white placeholder-gray-500 w-full outline-none" 
               />
               <button className="bg-white text-black font-black text-[10px] uppercase tracking-widest px-4 py-3 rounded-lg hover:bg-gray-200 transition">
                 SUB
               </button>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase text-gray-500 gap-4">
          <p>© 2025 FYX. All rights reserved. | Secure payments with SSL encryption</p>
          <div className="flex space-x-6">
             <button className="hover:text-white transition">Privacy Policy</button>
             <button className="hover:text-white transition">Terms of Service</button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar - The "App" Feel */}
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

      {/* Floating Buttons (Hidden on mobile to avoid cluttering nav) */}
      <div className="hidden md:flex fixed bottom-10 right-10 z-[70] flex-col space-y-4">
        <button className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition">
          <i className="fa-brands fa-whatsapp text-2xl"></i>
        </button>
      </div>
    </div>
  );
};

export default StorefrontLayout;
