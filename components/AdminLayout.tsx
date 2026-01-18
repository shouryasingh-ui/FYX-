
import React, { useState } from 'react';
import { AppRoute } from '../types';

interface AdminLayoutProps {
  children: React.ReactNode;
  onNavigate: (route: AppRoute) => void;
  currentRoute: AppRoute;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, onNavigate, currentRoute }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { icon: 'fa-table-cells-large', label: 'Dashboard', route: AppRoute.ADMIN_DASHBOARD },
    { icon: 'fa-box', label: 'Products', route: AppRoute.ADMIN_PRODUCTS },
    { icon: 'fa-tags', label: 'Categories', route: AppRoute.ADMIN_CATEGORIES },
    { icon: 'fa-cart-shopping', label: 'Orders', route: AppRoute.ADMIN_ORDERS },
    { icon: 'fa-users', label: 'Customers', route: AppRoute.ADMIN_CUSTOMERS },
    { icon: 'fa-comment-dots', label: 'Support Tickets', route: AppRoute.ADMIN_SUPPORT },
    { icon: 'fa-comments', label: 'Live Chat', route: AppRoute.ADMIN_CHAT },
    { icon: 'fa-ticket', label: 'Discount Codes', route: AppRoute.ADMIN_DISCOUNTS },
    { icon: 'fa-circle-question', label: 'FAQ Management', route: AppRoute.ADMIN_FAQ },
    { icon: 'fa-envelope', label: 'Newsletter', route: AppRoute.ADMIN_NEWSLETTER },
    { icon: 'fa-gear', label: 'Layout Settings', route: AppRoute.ADMIN_LAYOUT },
    { icon: 'fa-gear', label: 'Site Settings', route: AppRoute.ADMIN_SITE_SETTINGS },
    { icon: 'fa-gear', label: 'Theme Settings', route: AppRoute.ADMIN_THEME },
    { icon: 'fa-gear', label: 'Popups & Banners', route: AppRoute.ADMIN_POPUPS },
    { icon: 'fa-envelope-open-text', label: 'Email Templates', route: AppRoute.ADMIN_EMAIL_TEMPLATES },
    { icon: 'fa-box-archive', label: 'Shipping Rules', route: AppRoute.ADMIN_SHIPPING },
    { icon: 'fa-gear', label: 'Tax Rules', route: AppRoute.ADMIN_TAX },
    { icon: 'fa-gear', label: 'Blog Posts', route: AppRoute.ADMIN_BLOG },
    { icon: 'fa-gear', label: 'Custom Pages', route: AppRoute.ADMIN_PAGES },
    { icon: 'fa-tag', label: 'Flash Sales', route: AppRoute.ADMIN_FLASH_SALES },
    { icon: 'fa-users-rectangle', label: 'Customer Segments', route: AppRoute.ADMIN_SEGMENTS },
  ];

  const handleNavigate = (route: AppRoute) => {
    onNavigate(route);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#f1f1f1] relative">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed h-full z-[50] w-[280px] bg-[#1a1614] text-[#9d938b] flex flex-col 
        transition-transform duration-300 ease-in-out border-r border-[#2d2621]
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex flex-col h-full overflow-y-auto no-scrollbar">
          {/* Top Navigation Back to Store */}
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <span className="text-2xl font-black text-white tracking-tighter italic">FYX.</span>
            <button onClick={() => setIsSidebarOpen(false)} className="text-white p-2 text-xl">
               <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <button 
            onClick={() => onNavigate(AppRoute.STORE)}
            className="flex items-center space-x-2 text-sm text-[#9d938b] hover:text-white transition group mb-8"
          >
            <div className="w-8 h-8 rounded-lg bg-[#2d2621] flex items-center justify-center group-hover:bg-[#3d3631]">
              <i className="fa-solid fa-arrow-left text-xs"></i>
            </div>
            <span className="font-medium">Exit Admin</span>
          </button>

          <div className="hidden lg:flex mb-10 items-center justify-between">
            <h1 className="text-2xl font-black text-white tracking-tighter italic">FYX.</h1>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  onClick={() => handleNavigate(item.route)}
                  className={`
                    w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                    ${isActive 
                      ? 'bg-[#d9c5b2] text-[#1a1614] shadow-lg shadow-[#d9c5b2]/10' 
                      : 'hover:bg-[#2d2621] hover:text-white'
                    }
                  `}
                >
                  <i className={`fa-solid ${item.icon} w-5 text-center`}></i>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-10 border-t border-[#2d2621]">
            <div className="flex items-center space-x-4 px-2">
              <div className="w-10 h-10 rounded-xl bg-[#2d2621] flex items-center justify-center text-white font-black">
                S
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">Shourya Singh</p>
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Super Admin</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-[280px] min-h-screen flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden h-20 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-[30]">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#1a1614] hover:bg-gray-100 transition"
            >
              <i className="fa-solid fa-bars-staggered"></i>
            </button>
            <h2 className="text-xl font-black tracking-tighter italic">FYX. Admin</h2>
          </div>
          <div className="flex items-center space-x-4">
             <div className="w-10 h-10 rounded-full bg-[#f1f1f1] flex items-center justify-center overflow-hidden">
               <i className="fa-solid fa-user text-gray-400"></i>
             </div>
          </div>
        </header>

        {/* Desktop Title Bar (Optional but nice) */}
        <header className="hidden lg:flex h-24 items-center justify-between px-12 bg-[#f1f1f1]">
           <div>
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 mb-1">FYX System v2.0</h2>
              <h1 className="text-2xl font-black text-[#1a1614] tracking-tighter uppercase italic">
                {menuItems.find(m => m.route === currentRoute)?.label || 'Administration'}
              </h1>
           </div>
           <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Server</span>
              </div>
              <button className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black transition shadow-sm">
                 <i className="fa-regular fa-bell"></i>
              </button>
           </div>
        </header>

        {/* Content Wrapper */}
        <div className="p-6 sm:p-10 lg:p-12 max-w-[1600px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
