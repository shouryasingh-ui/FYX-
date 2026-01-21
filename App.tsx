import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppRoute, Product, CartItem, Order, ProductOption, Promotion, Review } from './types';
import { INITIAL_PRODUCTS, CATEGORIES } from './constants';
import StorefrontLayout from './components/StorefrontLayout';
import AdminLayout from './components/AdminLayout';
import AIChatBubble from './components/AIChatBubble';
import { generateProductDescription, analyzeSalesTrends, generateProductImage } from './services/geminiService';

const ADMIN_EMAIL = 'shourya@fyx.com';
const MERCHANT_UPI_ID = '7068528064@pthdfc';

interface UserData {
  profile: any;
  cart: CartItem[];
  wishlist: string[];
}

const App: React.FC = () => {
  // --- Core State ---
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.STORE);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- Auth State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginStep, setLoginStep] = useState<'method-select' | 'phone-input' | 'email-input' | 'otp' | 'google-loading'>('method-select');
  const [loginInput, setLoginInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [usersDb, setUsersDb] = useState<Record<string, UserData>>({});

  // --- Admin Data State ---
  const [storeCategories, setStoreCategories] = useState<string[]>(CATEGORIES);
  const [promotions, setPromotions] = useState<Promotion[]>([
    { id: '1', type: 'banner', title: 'Free Shipping', content: 'FREE SHIPPING ON ALL ORDERS ABOVE ₹999', status: 'Active', displayRule: 'immediate', closable: true },
  ]);
  
  const [settings, setSettings] = useState({
    siteName: 'FYX',
    shippingFee: 29,
    freeShippingThreshold: 999,
    contactEmail: 'support@fyx.com',
    currency: 'INR'
  });

  const [aiAnalysis, setAiAnalysis] = useState<string>('Crunching numbers...');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  // --- View State ---
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price_low' | 'price_high'>('featured');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [adminViewingOrder, setAdminViewingOrder] = useState<Order | null>(null);
  const [dismissedPromotions, setDismissedPromotions] = useState<string[]>([]);
  const [showProofModal, setShowProofModal] = useState<string | null>(null);
  const [viewingCustomImage, setViewingCustomImage] = useState<string | null>(null);
  
  // --- Checkout Flow State ---
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'review' | 'payment'>('details');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'upi' | 'cod'>('upi');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);

  // --- Product Detail Specific State ---
  const [pDetailSelections, setPDetailSelections] = useState<Record<string, string>>({});
  const [pDetailQty, setPDetailQty] = useState(1);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [reviewInput, setReviewInput] = useState({ rating: 5, text: '' });

  // --- Form State ---
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // --- User Profile ---
  const initialUserAddress = {
    name: '',
    email: '',
    phone: '',
    gender: 'Other',
    userType: 'Default',
    houseNo: '',
    street: '',
    city: '',
    pincode: '',
    state: '',
    line: ''
  };
  const [userAddress, setUserAddress] = useState(initialUserAddress);
  const [editAddressForm, setEditAddressForm] = useState(initialUserAddress);
  
  const featuredRef = useRef<HTMLDivElement>(null);

  // --- Hydration ---
  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem('fyx_products');
      const savedOrders = localStorage.getItem('fyx_orders'); 
      const savedCats = localStorage.getItem('fyx_categories');
      const savedUsersDb = localStorage.getItem('fyx_users_db');
      const savedSessionId = localStorage.getItem('fyx_current_session');
      const savedSettings = localStorage.getItem('fyx_settings');
      const savedPromotions = localStorage.getItem('fyx_promotions');

      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (savedOrders) setOrders(JSON.parse(savedOrders));
      if (savedCats) setStoreCategories(JSON.parse(savedCats));
      if (savedPromotions) setPromotions(JSON.parse(savedPromotions));
      
      const parsedDb = savedUsersDb ? JSON.parse(savedUsersDb) : {};
      setUsersDb(parsedDb);

      if (savedSessionId && parsedDb[savedSessionId]) {
          const sessionData = parsedDb[savedSessionId];
          setUserAddress(sessionData.profile);
          setCart(sessionData.cart || []);
          setWishlist(sessionData.wishlist || []);
          setIsLoggedIn(true);
      }
      
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    } catch (e) { console.error(e); }
  }, []);

  // --- Persistence Logic ---
  useEffect(() => {
    localStorage.setItem('fyx_products', JSON.stringify(products));
    localStorage.setItem('fyx_orders', JSON.stringify(orders));
    localStorage.setItem('fyx_categories', JSON.stringify(storeCategories));
    localStorage.setItem('fyx_settings', JSON.stringify(settings));
    localStorage.setItem('fyx_promotions', JSON.stringify(promotions));

    if (isLoggedIn && (userAddress.email || userAddress.phone)) {
      const userId = (userAddress.email || userAddress.phone).trim().toLowerCase();
      const updatedEntry = { profile: userAddress, cart, wishlist };
      
      setUsersDb(prev => {
        const next = { ...prev, [userId]: updatedEntry };
        localStorage.setItem('fyx_users_db', JSON.stringify(next));
        return next;
      });
      localStorage.setItem('fyx_current_session', userId);
    }
  }, [products, orders, cart, wishlist, userAddress, isLoggedIn, settings, promotions, storeCategories]);

  // --- AI Analysis Trigger ---
  useEffect(() => {
    if (currentRoute === AppRoute.ADMIN_DASHBOARD) {
      const revenue = orders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + o.total, 0);
      analyzeSalesTrends(orders.length, revenue).then(setAiAnalysis);
    }
  }, [currentRoute, orders]);

  // --- Handlers ---
  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const activeBanner = useMemo(() => 
    promotions.find(p => p.type === 'banner' && p.status === 'Active' && !dismissedPromotions.includes(p.id)) || null
  , [promotions, dismissedPromotions]);

  const closePromotion = (id: string) => setDismissedPromotions(prev => [...prev, id]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  
  const myOrders = useMemo(() => {
    if (!isLoggedIn) return [];
    return orders.filter(o => o.phone === userAddress.phone || (userAddress.email && o.customerName.includes(userAddress.email)));
  }, [orders, userAddress, isLoggedIn]);

  const homeDisplayProducts = useMemo(() => {
    let result = [...products];
    if (selectedCategory !== 'All') result = result.filter(p => p.category === selectedCategory);
    if (sortBy === 'price_low') return result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_high') return result.sort((a, b) => b.price - a.price);
    return result;
  }, [products, selectedCategory, sortBy]);

  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.category.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // --- Auth Flow ---
  const handleGoogleLogin = () => {
    setLoginStep('google-loading');
    setTimeout(() => {
        const email = "user@gmail.com";
        const existing = usersDb[email];
        if (existing) {
          setUserAddress(existing.profile); 
          setCart(existing.cart || []); 
          setWishlist(existing.wishlist || []);
        } else {
          setUserAddress({ ...initialUserAddress, email, name: "Google User" });
        }
        setIsLoggedIn(true); 
        setLoginStep('method-select'); 
        showToast("Authenticated with Google");
        if (cart.length > 0) setCurrentRoute(AppRoute.CART);
    }, 1200);
  };

  const handleEmailLoginSubmit = () => {
    if (!loginInput.includes('@')) {
      showToast("Please enter a valid email");
      return;
    }
    setLoginStep('google-loading');
    setTimeout(() => {
      const email = loginInput.trim().toLowerCase();
      const existing = usersDb[email];
      if (existing) {
        setUserAddress(existing.profile);
        setCart(existing.cart || []);
        setWishlist(existing.wishlist || []);
      } else {
        const isActuallyAdmin = email === ADMIN_EMAIL;
        setUserAddress({ 
          ...initialUserAddress, 
          email, 
          name: isActuallyAdmin ? "Shourya Singh" : `User ${email.split('@')[0]}` 
        });
      }
      setIsLoggedIn(true);
      setLoginStep('method-select');
      setLoginInput('');
      showToast(email === ADMIN_EMAIL ? "Administrator session started" : "Email identity verified");
      setCurrentRoute(AppRoute.PROFILE);
    }, 800);
  };

  const handleVerifyOtp = () => {
    if (otpInput === '1234') {
        const userId = loginInput.trim();
        const existing = usersDb[userId];
        if (existing) {
          setUserAddress(existing.profile); 
          setCart(existing.cart || []); 
          setWishlist(existing.wishlist || []);
        } else {
          setUserAddress({ ...initialUserAddress, phone: userId, name: `Member ${userId.slice(-4)}` });
        }
        setIsLoggedIn(true); 
        setLoginStep('method-select'); 
        setOtpInput(''); 
        setLoginInput(''); 
        showToast("Phone identity verified");
        if (cart.length > 0) setCurrentRoute(AppRoute.CART);
    } else { 
        showToast("Invalid OTP"); 
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false); 
    setUserAddress(initialUserAddress); 
    setCart([]); 
    setWishlist([]);
    localStorage.removeItem('fyx_current_session'); 
    setCurrentRoute(AppRoute.STORE);
    showToast("Logged out");
  };

  const handleOpenEditProfile = () => {
    setEditAddressForm({ ...userAddress });
    setShowEditProfileModal(true);
  };

  const saveProfileChanges = () => {
    if (!editAddressForm.name.trim()) {
      showToast("Name is required");
      return;
    }
    const fullLine = [
      editAddressForm.houseNo, 
      editAddressForm.street, 
      editAddressForm.city, 
      editAddressForm.pincode,
      editAddressForm.state
    ].filter(Boolean).join(', ');
    
    const updated = { ...editAddressForm, line: fullLine };
    setUserAddress(updated);
    setShowEditProfileModal(false);
    showToast("Profile updated");
  };

  // --- Admin Logic ---
  const handleGenerateAIDesc = async () => {
    if (!editingProduct?.name) { showToast("Enter product name first"); return; }
    setIsGeneratingDesc(true);
    const desc = await generateProductDescription(editingProduct.name, editingProduct.category, editingProduct.price);
    setEditingProduct(p => p ? ({...p, description: desc}) : null);
    setIsGeneratingDesc(false);
    showToast("AI Description Generated");
  };

  const handleAIGenerateImage = async () => {
    if (!imagePrompt.trim()) { showToast("Please describe the image first"); return; }
    setIsGeneratingImg(true);
    const imgUrl = await generateProductImage(imagePrompt);
    if (imgUrl) {
      setEditingProduct(p => p ? ({...p, image: imgUrl}) : null);
      showToast("AI Image Generated Successfully");
    } else {
      showToast("Failed to generate image");
    }
    setIsGeneratingImg(false);
  };

  const handleUpdateOrderStatus = (id: string, status: any) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    if (viewingOrder?.id === id) setViewingOrder(prev => prev ? { ...prev, status } : null);
    if (adminViewingOrder?.id === id) setAdminViewingOrder(prev => prev ? { ...prev, status } : null);
    showToast(`Order status updated to ${status}`);
  };

  const addOption = () => {
    setEditingProduct(p => {
      if (!p) return null;
      const options = p.options || [];
      return { ...p, options: [...options, { name: 'New Option', values: ['Value 1', 'Value 2'] }] };
    });
  };

  const removeOption = (idx: number) => {
    setEditingProduct(p => {
      if (!p) return null;
      const options = [...(p.options || [])];
      options.splice(idx, 1);
      return { ...p, options };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      const filesArray = Array.from(files) as File[];
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === filesArray.length) {
            setUploadedImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPaymentScreenshot(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitReview = () => {
    if (!reviewInput.text.trim()) return;
    if (!isLoggedIn) { showToast("Please login to review"); return; }
    
    const newReview: Review = {
      id: Date.now().toString(),
      userName: userAddress.name,
      rating: reviewInput.rating,
      text: reviewInput.text,
      date: 'Just now'
    };

    setProducts(prev => prev.map(p => 
      p.id === selectedProduct?.id 
        ? { ...p, reviews: [newReview, ...(p.reviews || [])] } 
        : p
    ));
    setReviewInput({ rating: 5, text: '' });
    showToast("Review submitted");
  };

  const finalCheckout = () => {
    if (cart.length === 0) return;
    if (checkoutPaymentMethod === 'upi' && (!paymentScreenshot || !isPaymentConfirmed)) {
      showToast("Please complete the payment and upload the proof");
      return;
    }

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: `FYX-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      customerName: userAddress.name,
      items: [...cart],
      total: cartTotal + settings.shippingFee,
      shipping: settings.shippingFee,
      status: 'confirmed',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      address: userAddress.line || 'In-store pickup / No address provided',
      phone: userAddress.phone,
      paymentMethod: checkoutPaymentMethod.toUpperCase(),
      paymentDetails: {
        screenshot: paymentScreenshot || undefined
      }
    };
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setViewingOrder(newOrder);
    setPaymentScreenshot(null);
    setIsPaymentConfirmed(false);
    setCheckoutStep('details');
    setCurrentRoute(AppRoute.ORDER_SUCCESS);
  };

  const handleCancelOrder = (id: string) => {
    if (!window.confirm("Cancel this order?")) return;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
    if (viewingOrder?.id === id) setViewingOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
    if (adminViewingOrder?.id === id) setAdminViewingOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
    showToast("Order cancelled");
  };

  const triggerUpiPay = () => {
    const amount = cartTotal + settings.shippingFee;
    const upiUrl = `upi://pay?pa=${MERCHANT_UPI_ID}&pn=FYX%20Store&am=${amount}&cu=INR&tn=Payment%20for%20FYX%20Order`;
    window.location.href = upiUrl;
  };

  // --- Admin Specific Logic ---
  const handleAddCategory = () => {
    const name = prompt("Enter category name:");
    if (name && !storeCategories.includes(name)) {
      setStoreCategories([...storeCategories, name]);
      showToast("Category added");
    }
  };

  const handleRemoveCategory = (cat: string) => {
    if (window.confirm(`Delete ${cat}?`)) {
      setStoreCategories(storeCategories.filter(c => c !== cat));
      showToast("Category removed");
    }
  };

  const handleTogglePromotion = (id: string) => {
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' } : p));
  };

  // --- UI Renders ---
  const renderHome = () => (
    <div className="flex flex-col animate-slide-up">
      <section className="relative h-[85vh] md:h-screen w-full bg-black overflow-hidden">
        <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover opacity-60" alt="Hero" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="text-white text-[10px] md:text-xs font-black uppercase tracking-[0.4em] mb-6">PREMIUM QUALITY PRODUCTS</p>
          <h1 className="text-6xl md:text-9xl font-[900] italic uppercase tracking-tighter text-white mb-12">FYX YOUR STYLE.</h1>
          <button onClick={() => featuredRef.current?.scrollIntoView({ behavior: 'smooth' })} className="bg-white text-black px-12 py-4 rounded-full font-black text-xs uppercase tracking-[0.1em] shadow-2xl hover:bg-gray-100 transition">EXPLORE COLLECTION</button>
        </div>
      </section>

      <section className="py-8 border-b border-gray-100 sticky top-14 md:top-16 bg-white/95 backdrop-blur-sm z-40 overflow-x-auto no-scrollbar">
        <div className="flex space-x-6 px-6 pb-2 min-w-max">
          <div onClick={() => setSelectedCategory('All')} className="flex flex-col items-center space-y-2 cursor-pointer">
            <div className={`w-[70px] h-[70px] rounded-full border-2 p-1 ${selectedCategory === 'All' ? 'border-black' : 'border-gray-100'}`}>
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-white"><i className="fa-solid fa-star"></i></div>
            </div>
            <span className="text-[10px] font-bold uppercase">All</span>
          </div>
          {storeCategories.map(cat => (
            <div key={cat} onClick={() => setSelectedCategory(cat)} className="flex flex-col items-center space-y-2 cursor-pointer">
              <div className={`w-[70px] h-[70px] rounded-full border-2 p-1 ${selectedCategory === cat ? 'border-black' : 'border-gray-100'}`}>
                <img src={`https://picsum.photos/seed/${cat}/200/200`} className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="text-[10px] font-bold uppercase">{cat.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </section>

      <section ref={featuredRef} className="px-4 py-8 bg-gray-50 min-h-screen">
         <div className="flex justify-between items-end mb-8 px-2">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">{selectedCategory === 'All' ? 'Featured Collection' : selectedCategory}</h2>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-white border text-xs font-bold uppercase rounded-lg px-3 py-2 outline-none">
                 <option value="featured">Featured</option>
                 <option value="price_low">Price: Low to High</option>
                 <option value="price_high">Price: High to Low</option>
            </select>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {homeDisplayProducts.map(p => (
              <div key={p.id} className="group cursor-pointer bg-white p-2 rounded-2xl shadow-sm hover:shadow-xl transition" onClick={() => { 
                setSelectedProduct(p); 
                setPDetailSelections({}); 
                setPDetailQty(1); 
                setUploadedImages([]);
                setCurrentRoute(AppRoute.PRODUCT_DETAIL); 
              }}>
                <div className="aspect-[4/5] rounded-xl overflow-hidden relative mb-4">
                    <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    <button onClick={(e) => { e.stopPropagation(); if(isLoggedIn) setWishlist(prev => prev.includes(p.id) ? prev.filter(i => i !== p.id) : [...prev, p.id]); else setCurrentRoute(AppRoute.PROFILE); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                      <i className={`fa-${wishlist.includes(p.id) ? 'solid text-red-500' : 'regular'} fa-heart text-xs`}></i>
                    </button>
                    {p.discountBadge && <span className="absolute bottom-2 left-2 bg-black text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">{p.discountBadge}</span>}
                </div>
                <div className="px-2 pb-2">
                    <h3 className="font-bold text-sm truncate uppercase tracking-tight">{p.name}</h3>
                    <div className="flex items-center gap-2">
                       <p className="font-black text-sm">₹{p.price}</p>
                       {p.oldPrice && <p className="text-[10px] text-gray-400 line-through">₹{p.oldPrice}</p>}
                    </div>
                </div>
              </div>
            ))}
         </div>
      </section>
    </div>
  );

  const renderSearch = () => (
    <div className="p-6 bg-gray-50 min-h-screen animate-slide-up">
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Find Your Product</h2>
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            autoFocus
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="Search by name or category..." 
            className="w-full bg-white border border-gray-200 rounded-2xl py-5 pl-12 pr-6 text-sm font-bold shadow-sm outline-none focus:border-black transition"
          />
        </div>

        {!searchQuery.trim() ? (
          <div className="text-center py-20 opacity-30">
            <i className="fa-solid fa-wand-magic-sparkles text-5xl mb-4"></i>
            <p className="text-xs font-black uppercase tracking-widest">Awaiting Input...</p>
          </div>
        ) : filteredSearchResults.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 font-bold uppercase tracking-widest">No matching results found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {filteredSearchResults.map(p => (
              <div key={p.id} className="group cursor-pointer bg-white p-2 rounded-2xl shadow-sm hover:shadow-xl transition" onClick={() => { 
                setSelectedProduct(p); 
                setPDetailSelections({}); 
                setPDetailQty(1); 
                setUploadedImages([]);
                setCurrentRoute(AppRoute.PRODUCT_DETAIL); 
              }}>
                <div className="aspect-[4/5] rounded-xl overflow-hidden relative mb-4">
                  <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <button onClick={(e) => { e.stopPropagation(); if(isLoggedIn) setWishlist(prev => prev.includes(p.id) ? prev.filter(i => i !== p.id) : [...prev, p.id]); else setCurrentRoute(AppRoute.PROFILE); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                    <i className={`fa-${wishlist.includes(p.id) ? 'solid text-red-500' : 'regular'} fa-heart text-xs`}></i>
                  </button>
                </div>
                <div className="px-2 pb-2">
                  <h3 className="font-bold text-sm truncate uppercase tracking-tight">{p.name}</h3>
                  <p className="font-black text-sm">₹{p.price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => {
    if (!isLoggedIn) return (
      <div className="p-6 min-h-screen flex flex-col justify-center max-w-md mx-auto animate-slide-up">
        <h1 className="text-4xl font-black italic uppercase text-center mb-10 tracking-tighter">FYX.</h1>
        {loginStep === 'method-select' ? (
          <div className="space-y-4">
             <button onClick={handleGoogleLogin} className="w-full border p-4 rounded-xl flex items-center justify-center space-x-3 hover:bg-gray-50 transition shadow-sm">
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="Google" />
                <span className="font-bold text-sm">Continue with Google</span>
             </button>
             <button onClick={() => setLoginStep('phone-input')} className="w-full bg-black text-white p-4 rounded-xl flex items-center justify-center space-x-3 shadow-lg">
                <i className="fa-solid fa-mobile-screen-button"></i>
                <span className="font-black text-xs uppercase tracking-widest">Phone Login</span>
             </button>
             <div className="text-center text-[10px] font-black text-gray-300 uppercase py-2">OR</div>
             <button onClick={() => setLoginStep('email-input')} className="w-full border p-4 rounded-xl flex items-center justify-center space-x-3 hover:bg-gray-50 transition shadow-sm">
                <i className="fa-solid fa-envelope text-gray-400"></i>
                <span className="font-bold text-sm">Continue with Email</span>
             </button>
          </div>
        ) : loginStep === 'phone-input' ? (
          <div className="space-y-6">
            <button onClick={() => setLoginStep('method-select')} className="text-gray-400 text-xs font-black uppercase"><i className="fa-solid fa-arrow-left mr-2"></i>Back</button>
            <input type="tel" value={loginInput} onChange={(e) => setLoginInput(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Mobile Number" className="w-full bg-gray-50 p-4 rounded-xl font-bold border-2 focus:border-black outline-none transition" />
            <button onClick={() => { setIsOtpLoading(true); setTimeout(() => { setIsOtpLoading(false); setLoginStep('otp'); alert('Verification Code: 1234'); }, 800); }} disabled={loginInput.length < 10} className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 shadow-lg">Get OTP</button>
          </div>
        ) : loginStep === 'email-input' ? (
          <div className="space-y-6">
            <button onClick={() => setLoginStep('method-select')} className="text-gray-400 text-xs font-black uppercase"><i className="fa-solid fa-arrow-left mr-2"></i>Back</button>
            <input type="email" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} placeholder="Email Address" className="w-full bg-gray-50 p-4 rounded-xl font-bold border-2 focus:border-black outline-none transition" />
            <button onClick={handleEmailLoginSubmit} disabled={!loginInput.trim()} className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">Login</button>
          </div>
        ) : loginStep === 'otp' ? (
          <div className="space-y-6">
            <button onClick={() => setLoginStep('phone-input')} className="text-gray-400 text-xs font-black uppercase"><i className="fa-solid fa-arrow-left mr-2"></i>Back</button>
            <input type="text" value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Enter 1234" className="w-full bg-gray-50 p-4 rounded-xl text-center text-4xl font-black border-2 focus:border-black outline-none tracking-[0.5em] transition" />
            <button onClick={handleVerifyOtp} disabled={otpInput.length < 4} className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 shadow-lg">Verify & Login</button>
          </div>
        ) : (
          <div className="text-center py-20 flex flex-col items-center">
             <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin mb-4"></div>
             <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Authenticating...</p>
          </div>
        )}
      </div>
    );
    return (
      <div className="p-6 bg-gray-50 min-h-screen pb-24 animate-slide-up">
         <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Hi, {userAddress.name.split(' ')[0]}</h1>
            <button onClick={handleLogout} className="text-red-500 font-black text-xs uppercase tracking-widest border border-red-100 px-4 py-1.5 rounded-full hover:bg-red-50 transition">Logout</button>
         </div>
         <div className="bg-[#1a1614] text-white p-8 rounded-[32px] shadow-xl mb-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-start mb-6">
               <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-black border border-white/20">{userAddress.name.charAt(0)}</div>
                  <div>
                    <h3 className="font-bold text-lg">{userAddress.name || 'Set your name'}</h3>
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{userAddress.email || userAddress.phone}</p>
                  </div>
               </div>
               <button onClick={handleOpenEditProfile} className="text-[10px] font-black uppercase border border-white/20 px-4 py-2 rounded-xl hover:bg-white/10 transition">Edit Profile</button>
            </div>
            <p className="text-xs text-white/70 font-medium"><i className="fa-solid fa-location-dot mr-2 opacity-50 text-red-400"></i>{userAddress.line || "No shipping address saved."}</p>
         </div>

         <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4">My Orders</h3>
         <div className="space-y-4">
            {myOrders.length === 0 ? (<div className="text-center py-10 bg-white rounded-3xl border-2 border-dashed border-gray-100"><p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">No order history found</p></div>) : (
               myOrders.map(order => (
                  <div key={order.id} onClick={() => { setViewingOrder(order); setCurrentRoute(AppRoute.ORDER_DETAIL); }} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition">
                     <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><i className="fa-solid fa-box"></i></div><div><p className="font-black text-[10px] uppercase">{order.orderNumber}</p><p className="text-[9px] text-gray-400 font-bold">{order.date}</p></div></div>
                     <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${order.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>{order.status}</span>
                  </div>
               ))
            )}
         </div>
         {userAddress.email === ADMIN_EMAIL && (<button onClick={() => setCurrentRoute(AppRoute.ADMIN_DASHBOARD)} className="mt-8 w-full bg-black text-white p-5 rounded-2xl flex items-center justify-between shadow-2xl transition hover:bg-gray-900"><div className="flex items-center gap-3"><i className="fa-solid fa-shield-halved"></i><span className="font-black text-xs uppercase tracking-widest">Admin Console</span></div><i className="fa-solid fa-chevron-right"></i></button>)}
      </div>
    );
  };

  const renderCheckout = () => {
    const total = cartTotal + settings.shippingFee;
    
    return (
      <div className="p-6 bg-[#F9FAFB] min-h-screen animate-fade-in pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-10">
            <button onClick={() => checkoutStep === 'details' ? setCurrentRoute(AppRoute.CART) : setCheckoutStep(prev => prev === 'review' ? 'details' : 'review')} className="text-black text-xl hover:opacity-70 transition">
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <h1 className="text-2xl font-[900] italic uppercase tracking-tighter">CHECKOUT</h1>
          </div>

          <div className="flex items-center justify-between mb-8 px-4">
             {['details', 'review', 'payment'].map((step, i) => (
                <div key={step} className="flex flex-col items-center gap-2">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${checkoutStep === step ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {i + 1}
                   </div>
                   <span className={`text-[8px] font-black uppercase tracking-widest ${checkoutStep === step ? 'text-black' : 'text-gray-400'}`}>{step}</span>
                </div>
             ))}
          </div>

          {checkoutStep === 'details' && (
            <div className="space-y-8 animate-slide-up">
              <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-sm font-[900] uppercase tracking-tighter text-black">1. DELIVERY ADDRESS</h2>
                  <button onClick={() => handleOpenEditProfile()} className="text-[10px] font-black uppercase tracking-widest text-[#2563EB] hover:underline">EDIT</button>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-lg text-black">{userAddress.name || 'Your Name'}</p>
                  <p className="text-sm text-gray-500 font-medium">{userAddress.houseNo || 'House No'} {userAddress.street || 'Street'}</p>
                  <p className="text-sm text-gray-500 font-medium">{userAddress.phone || 'Phone Number'}</p>
                </div>
              </div>
              <button 
                onClick={() => { if(!userAddress.name || !userAddress.phone) { showToast("Please update your details first"); handleOpenEditProfile(); } else setCheckoutStep('review'); }}
                className="w-full bg-black text-white py-5 rounded-3xl font-[900] uppercase text-xs tracking-widest shadow-xl hover:scale-[1.01] transition"
              >
                CONTINUE TO REVIEW
              </button>
            </div>
          )}

          {checkoutStep === 'review' && (
            <div className="space-y-8 animate-slide-up">
              <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <h2 className="text-sm font-[900] uppercase tracking-tighter text-black mb-8">2. REVIEW ORDER ITEMS</h2>
                <div className="space-y-6">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex gap-6 border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                       <img src={item.image} className="w-20 h-20 rounded-xl object-cover" />
                       <div className="flex-1 space-y-1">
                          <p className="font-black text-sm uppercase">{item.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{Object.values(item.selectedOptions || {}).join(' | ')}</p>
                          {item.uploadedImages && item.uploadedImages.length > 0 && (
                            <div className="flex gap-2 mt-2">
                               {item.uploadedImages.map((img, i) => (
                                 <img key={i} src={img} className="w-8 h-8 rounded-md object-cover border border-gray-100 cursor-pointer" onClick={() => setViewingCustomImage(img)} />
                               ))}
                               <span className="text-[8px] font-black uppercase text-blue-500 self-end mb-1">Custom Assets attached</span>
                            </div>
                          )}
                          <div className="flex justify-between items-end mt-2">
                             <span className="text-[10px] font-black bg-gray-50 px-2 py-1 rounded">QTY: {item.quantity}</span>
                             <span className="font-black text-sm">₹{item.price * item.quantity}</span>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t space-y-3">
                   <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest"><span>Subtotal</span><span>₹{cartTotal}</span></div>
                   <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest"><span>Shipping</span><span>₹{settings.shippingFee}</span></div>
                   <div className="flex justify-between text-xl font-black uppercase tracking-tighter pt-2 border-t border-gray-50"><span>Order Total</span><span>₹{total}</span></div>
                </div>
              </div>
              <button 
                onClick={() => setCheckoutStep('payment')}
                className="w-full bg-black text-white py-5 rounded-3xl font-[900] uppercase text-xs tracking-widest shadow-xl hover:scale-[1.01] transition"
              >
                PROCEED TO PAYMENT
              </button>
            </div>
          )}

          {checkoutStep === 'payment' && (
            <div className="space-y-8 animate-slide-up">
              <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <h2 className="text-sm font-[900] uppercase tracking-tighter text-black mb-8">3. PAYMENT METHOD</h2>
                <div className="space-y-4 mb-8">
                  <div onClick={() => setCheckoutPaymentMethod('upi')} className={`p-6 border rounded-2xl flex items-center justify-between cursor-pointer transition ${checkoutPaymentMethod === 'upi' ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${checkoutPaymentMethod === 'upi' ? 'border-black' : 'border-gray-300'}`}>
                        {checkoutPaymentMethod === 'upi' && <div className="w-2.5 h-2.5 bg-black rounded-full"></div>}
                      </div>
                      <span className="font-bold text-sm text-black">UPI (PhonePe/GPay)</span>
                    </div>
                  </div>
                  <div onClick={() => setCheckoutPaymentMethod('cod')} className={`p-6 border rounded-2xl flex items-center justify-between cursor-pointer transition ${checkoutPaymentMethod === 'cod' ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${checkoutPaymentMethod === 'cod' ? 'border-black' : 'border-gray-300'}`}>
                        {checkoutPaymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-black rounded-full"></div>}
                      </div>
                      <span className="font-bold text-sm text-black">Cash on Delivery</span>
                    </div>
                  </div>
                </div>

                {checkoutPaymentMethod === 'upi' && (
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-8 space-y-10">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#2563EB] shadow-sm"><i className="fa-solid fa-mobile-screen-button text-xl"></i></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pay to Merchant</p>
                        <p className="text-base font-black text-black">{MERCHANT_UPI_ID}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <p className="text-[9px] font-[900] uppercase text-gray-400 mb-4 tracking-widest text-center">STEP 1: MAKE PAYMENT</p>
                        <button onClick={triggerUpiPay} className="w-full bg-[#2563EB] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-[#1E40AF] transition active:scale-95">PAY ₹{total} VIA UPI APP</button>
                      </div>
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <p className="text-[9px] font-[900] uppercase text-gray-400 mb-4 tracking-widest text-center">STEP 2: UPLOAD PROOF</p>
                        <div className="flex items-center justify-center gap-4">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <span className="bg-[#EFF6FF] text-[#2563EB] px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border border-[#DBEAFE]">Choose file</span>
                            <span className="text-xs text-gray-400 font-medium truncate max-w-[150px]">{paymentScreenshot ? 'Proof Attached' : 'No file chosen'}</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotUpload} />
                          </label>
                        </div>
                      </div>
                      <div className="bg-[#EFF6FF] p-6 rounded-2xl border border-[#DBEAFE] flex items-center space-x-4">
                        <input type="checkbox" id="confirm-pay" checked={isPaymentConfirmed} onChange={(e) => setIsPaymentConfirmed(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                        <label htmlFor="confirm-pay" className="text-sm font-bold text-[#1E40AF] cursor-pointer">I have completed the payment</label>
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={finalCheckout} disabled={checkoutPaymentMethod === 'upi' && (!paymentScreenshot || !isPaymentConfirmed)} className={`w-full mt-10 py-5 rounded-3xl font-[900] uppercase text-[12px] tracking-[0.1em] shadow-2xl transition-all duration-300 ${checkoutPaymentMethod !== 'upi' || (paymentScreenshot && isPaymentConfirmed) ? 'bg-black text-white hover:bg-gray-900 scale-[1.01]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                  {checkoutPaymentMethod === 'cod' ? 'CONFIRM ORDER (COD)' : 'PLACE ORDER'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOrderDetailUI = (order: Order, isAdmin: boolean = false) => {
    const statusSteps = ['confirmed', 'processing', 'shipped', 'delivered'];
    const currentStatusIdx = statusSteps.indexOf(order.status);
    
    return (
      <div className="p-4 md:p-8 bg-[#F5F5F5] min-h-screen animate-fade-in pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <button onClick={() => isAdmin ? setAdminViewingOrder(null) : setCurrentRoute(AppRoute.PROFILE)} className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2 hover:text-black transition">
              <i className="fa-solid fa-arrow-left"></i>
              {isAdmin ? 'BACK TO ORDERS' : 'ORDER HISTORY'}
            </button>
            {isAdmin && (
              <div className="flex gap-2">
                 <button onClick={() => setShowProofModal(order.paymentDetails?.screenshot || null)} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-gray-50">VIEW PROOF</button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
             {/* Reference & Date Header */}
             <div className="p-10 border-b border-gray-50">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">REFERENCE NUMBER</p>
                    <h2 className="text-3xl font-[900] italic uppercase tracking-tighter text-black leading-none">{order.orderNumber}</h2>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ORDER PLACED ON</p>
                    <p className="text-base font-bold text-black">{order.date} • {order.time}</p>
                  </div>
                </div>
             </div>

             {/* Progress Stepper */}
             <div className="p-10 bg-gray-50/30 border-b border-gray-100">
                <div className="flex items-center justify-between relative max-w-2xl mx-auto px-4">
                   <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-200 z-0"></div>
                   {statusSteps.map((s, i) => {
                      const isActive = i <= currentStatusIdx;
                      const icons = ['fa-check', 'fa-gear', 'fa-truck', 'fa-house-circle-check'];
                      return (
                        <div key={s} className="relative z-10 flex flex-col items-center gap-3">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 shadow-sm ${isActive ? 'bg-[#1a1614] border-[#1a1614] text-white scale-110' : 'bg-white border-gray-100 text-gray-300'}`}>
                              <i className={`fa-solid ${icons[i]} text-xs`}></i>
                           </div>
                           <span className={`text-[9px] font-black uppercase tracking-widest text-center transition-colors ${isActive ? 'text-black' : 'text-gray-400'}`}>{s}</span>
                        </div>
                      );
                   })}
                </div>
             </div>

             {/* Item Summary */}
             <div className="p-10 space-y-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b pb-4">ITEM SUMMARY</h3>
                {order.items.map((item, idx) => (
                   <div key={idx} className="flex gap-8 items-center group">
                      <div className="w-24 h-24 rounded-[20px] overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0 shadow-sm">
                         <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="font-black text-lg uppercase tracking-tighter text-black">{item.name}</p>
                         <div className="flex items-center gap-4 mt-2">
                            <span className="text-[10px] font-black bg-gray-100 px-3 py-1 rounded-full text-gray-500">QTY: {item.quantity}</span>
                            <span className="text-[11px] font-black text-black">₹{item.price * item.quantity}</span>
                         </div>
                         {item.uploadedImages && item.uploadedImages.length > 0 && (
                           <div className="mt-4 flex gap-2">
                             {item.uploadedImages.map((img, i) => (
                               <img key={i} src={img} className="w-12 h-12 rounded-xl border border-gray-100 object-cover cursor-pointer hover:opacity-80" onClick={() => setViewingCustomImage(img)} />
                             ))}
                           </div>
                         )}
                      </div>
                   </div>
                ))}
             </div>

             {/* Delivery & Payment Details */}
             <div className="p-10 bg-gray-50/50 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">DELIVERY ADDRESS</p>
                      <p className="text-lg font-black text-black">{order.customerName}</p>
                      <p className="text-sm text-gray-500 font-medium mt-2 leading-relaxed">{order.address}</p>
                      <p className="text-sm text-gray-500 font-medium mt-1">Contact: {order.phone}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">PAYMENT METHOD</p>
                      <div className="flex items-center gap-3">
                        <span className="bg-[#1a1614] text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-[0.1em]">{order.paymentMethod}</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">STATUS: PAID</span>
                      </div>
                      
                      {/* CANCEL ORDER BUTTON - REQUESTED IN SCREENSHOT SLOT */}
                      {!isAdmin && order.status === 'confirmed' && (
                        <div className="mt-8 pt-8 border-t border-gray-100">
                           <button 
                             onClick={() => handleCancelOrder(order.id)} 
                             className="w-full py-5 rounded-2xl bg-white border-2 border-red-100 text-red-500 font-black uppercase text-[11px] tracking-[0.2em] shadow-sm hover:bg-red-50 hover:border-red-200 transition duration-300"
                           >
                             CANCEL ORDER
                           </button>
                        </div>
                      )}
                   </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-5">
                   <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
                      <span>SUBTOTAL</span>
                      <span>₹{order.total - order.shipping}</span>
                   </div>
                   <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
                      <span>SHIPPING</span>
                      <span>₹{order.shipping}</span>
                   </div>
                   <div className="flex justify-between text-2xl font-[900] border-t border-gray-50 pt-5 uppercase tracking-tighter text-black">
                      <span>TOTAL</span>
                      <span>₹{order.total}</span>
                   </div>
                </div>
             </div>

             {isAdmin && (
               <div className="p-10 border-t border-gray-100 bg-gray-50 flex gap-4">
                  <select 
                     value={order.status} 
                     onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)} 
                     className="flex-1 bg-white border border-gray-200 rounded-2xl px-8 py-5 text-sm font-black uppercase outline-none focus:border-black transition shadow-sm"
                  >
                     <option value="confirmed">Mark as Confirmed</option>
                     <option value="processing">Mark as Processing</option>
                     <option value="shipped">Mark as Shipped</option>
                     <option value="delivered">Mark as Delivered</option>
                     <option value="cancelled">Cancel Order</option>
                  </select>
               </div>
             )}
          </div>
        </div>
      </div>
    );
  };

  const renderAdminCategories = () => (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic uppercase">Categories</h2>
        <button onClick={handleAddCategory} className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl">+ Add New Category</button>
      </div>
      <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <th className="p-8">Category Name</th>
              <th className="p-8">Assigned Products</th>
              <th className="p-8 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {storeCategories.map(cat => (
              <tr key={cat} className="hover:bg-gray-50/50 transition">
                <td className="p-8 font-black text-sm uppercase">{cat}</td>
                <td className="p-8 text-xs font-bold text-gray-400">{products.filter(p => p.category === cat).length} Products</td>
                <td className="p-8 text-right">
                  <button onClick={() => handleRemoveCategory(cat)} className="text-red-300 hover:text-red-500 transition p-2"><i className="fa-solid fa-trash-can"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAdminCustomers = () => (
    <div className="animate-fade-in space-y-8">
      <h2 className="text-2xl font-black italic uppercase">Registered Users</h2>
      <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <th className="p-8">Customer Name</th>
              <th className="p-8">Contact Info</th>
              <th className="p-8">Orders</th>
              <th className="p-8 text-right">Loyalty Tier</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {Object.entries(usersDb).map(([id, data]) => (
              <tr key={id} className="hover:bg-gray-50/50 transition">
                <td className="p-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-xs">{data.profile.name?.charAt(0)}</div>
                    <span className="font-black text-sm uppercase">{data.profile.name || 'Anonymous'}</span>
                  </div>
                </td>
                <td className="p-8 text-xs font-bold text-gray-400 uppercase">{data.profile.email || data.profile.phone}</td>
                <td className="p-8 text-xs font-bold text-black">{orders.filter(o => o.phone === data.profile.phone || o.customerName.includes(data.profile.email)).length} Orders</td>
                <td className="p-8 text-right"><span className="text-[9px] font-black px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full uppercase tracking-widest">Gold Member</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAdminSettings = () => (
    <div className="animate-fade-in space-y-12">
      <h2 className="text-2xl font-black italic uppercase">Site Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Store Configuration</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">STORE NAME</label>
              <input type="text" value={settings.siteName} onChange={(e) => setSettings({...settings, siteName: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl font-bold border border-transparent focus:border-black outline-none transition" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">SUPPORT EMAIL</label>
              <input type="email" value={settings.contactEmail} onChange={(e) => setSettings({...settings, contactEmail: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl font-bold border border-transparent focus:border-black outline-none transition" />
            </div>
          </div>
        </div>
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Shipping & Logistics</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">FLAT SHIPPING FEE (₹)</label>
              <input type="number" value={settings.shippingFee} onChange={(e) => setSettings({...settings, shippingFee: Number(e.target.value)})} className="w-full bg-gray-50 p-4 rounded-xl font-bold border border-transparent focus:border-black outline-none transition" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">FREE SHIPPING THRESHOLD (₹)</label>
              <input type="number" value={settings.freeShippingThreshold} onChange={(e) => setSettings({...settings, freeShippingThreshold: Number(e.target.value)})} className="w-full bg-gray-50 p-4 rounded-xl font-bold border border-transparent focus:border-black outline-none transition" />
            </div>
          </div>
        </div>
      </div>
      <button onClick={() => showToast("Settings synced with cloud")} className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:bg-gray-900 transition">Apply Global Changes</button>
    </div>
  );

  const renderAdminPromotions = () => (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic uppercase">Banners & Popups</h2>
        <button onClick={() => showToast("Add promotion logic here")} className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl">+ New Promotion</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {promotions.map(p => (
          <div key={p.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                 <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full">{p.type}</span>
                 <div className={`w-3 h-3 rounded-full ${p.status === 'Active' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              </div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">{p.title}</h3>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">{p.content}</p>
            </div>
            <div className="mt-8 flex gap-4">
              <button onClick={() => handleTogglePromotion(p.id)} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition shadow-sm ${p.status === 'Active' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-green-50 text-green-500 border border-green-100'}`}>
                {p.status === 'Active' ? 'Deactivate' : 'Activate'}
              </button>
              <button className="px-6 py-4 rounded-2xl bg-gray-50 text-gray-400 hover:text-black transition"><i className="fa-solid fa-pen"></i></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {currentRoute.startsWith('admin') ? (
        <AdminLayout onNavigate={setCurrentRoute} currentRoute={currentRoute}>
            {currentRoute === AppRoute.ADMIN_DASHBOARD && (
              <div className="animate-fade-in space-y-8 pb-20">
                <div className="bg-black rounded-[40px] p-10 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px]"></div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Systems Overview</h2>
                  <div className="mt-6 flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                     <i className="fa-solid fa-wand-magic-sparkles text-yellow-400 mt-1"></i>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">AI Sales Trend Analysis</p>
                        <p className="text-sm font-medium leading-relaxed italic">"{aiAnalysis}"</p>
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   {[
                     { label: 'Revenue', val: `₹${orders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + o.total, 0)}`, icon: 'fa-indian-rupee-sign' },
                     { label: 'Total Orders', val: orders.length, icon: 'fa-box' },
                     { label: 'Inventory Assets', val: products.length, icon: 'fa-cube' },
                     { label: 'Active Users', val: Object.keys(usersDb).length, icon: 'fa-users' }
                   ].map((stat, i) => (
                     <div key={i} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between">
                        <div><p className="text-[10px] font-black uppercase text-gray-400 mb-1">{stat.label}</p><p className="text-3xl font-black">{stat.val}</p></div>
                        <i className={`fa-solid ${stat.icon} text-gray-200 text-3xl`}></i>
                     </div>
                   ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                      <h3 className="text-xl font-black uppercase italic tracking-tighter mb-6">Recent Sales</h3>
                      <div className="space-y-4">
                         {orders.slice(0, 5).map(o => (
                            <div key={o.id} onClick={() => { setAdminViewingOrder(o); }} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-2xl transition cursor-pointer">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-black">{o.customerName.charAt(0)}</div>
                                  <div><p className="font-bold text-sm uppercase tracking-tight">{o.customerName}</p><p className="text-[10px] text-gray-400 font-bold">{o.date}</p></div>
                               </div>
                               <p className="font-black text-sm">₹{o.total}</p>
                            </div>
                         ))}
                      </div>
                   </div>
                   <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                      <h3 className="text-xl font-black uppercase italic tracking-tighter mb-6">Top Categories</h3>
                      <div className="space-y-6">
                        {storeCategories.slice(0, 4).map(cat => (
                          <div key={cat} className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span>{cat}</span>
                              <span className="text-gray-400">{Math.floor(Math.random() * 50) + 10}% Performance</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                              <div className="h-full bg-black rounded-full" style={{ width: `${Math.floor(Math.random() * 70) + 30}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </div>
            )}
            {currentRoute === AppRoute.ADMIN_PRODUCTS && (
              <div className="animate-fade-in pb-20">
                 <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black italic uppercase">Inventory Control</h2><button onClick={() => { setEditingProduct({ id: Date.now().toString(), name: '', price: 0, category: storeCategories[0], image: '', stock: 0, description: '' }); setShowProductModal(true); }} className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition">+ Add New Asset</button></div>
                 <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-gray-100">
                    <table className="w-full text-left">
                       <thead className="bg-gray-50 border-b"><tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest"><th className="p-8">Product Details</th><th className="p-8">Category</th><th className="p-8">Price</th><th className="p-8 text-right">Actions</th></tr></thead>
                       <tbody className="divide-y">
                          {products.map(p => (
                             <tr key={p.id} className="hover:bg-gray-50/50 transition">
                                <td className="p-8 flex items-center gap-4">
                                   <img src={p.image} className="w-14 h-14 rounded-2xl object-cover bg-gray-100 shadow-sm" />
                                   <div><p className="font-black text-sm uppercase tracking-tight">{p.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{p.id}</p></div>
                                </td>
                                <td className="p-8"><span className="text-[10px] font-black uppercase px-3 py-1 bg-gray-100 rounded-full">{p.category}</span></td>
                                <td className="p-8 font-black text-sm">₹{p.price}</td>
                                <td className="p-8 text-right"><button onClick={() => { setEditingProduct(p); setShowProductModal(true); }} className="text-gray-300 hover:text-black transition p-2"><i className="fa-solid fa-pen-to-square"></i></button></td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
            )}
            {currentRoute === AppRoute.ADMIN_ORDERS && (
              <div className="animate-fade-in pb-20">
                 {adminViewingOrder ? renderOrderDetailUI(adminViewingOrder, true) : (
                    <>
                       <h2 className="text-2xl font-black italic uppercase mb-8">Verification Desk</h2>
                       <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-gray-100">
                          <table className="w-full text-left">
                             <thead className="bg-gray-50 border-b"><tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest"><th className="p-8">Order ID</th><th className="p-8">Customer / Payment</th><th className="p-8">Status</th><th className="p-8 text-right">Actions</th></tr></thead>
                             <tbody className="divide-y">
                                {orders.map(o => (
                                   <tr key={o.id} className="hover:bg-gray-50/50 transition cursor-pointer" onClick={() => setAdminViewingOrder(o)}>
                                      <td className="p-8 font-black text-sm">{o.orderNumber}</td>
                                      <td className="p-8">
                                         <p className="font-bold text-sm uppercase">{o.customerName}</p>
                                         <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Method: {o.paymentMethod || 'N/A'}</p>
                                      </td>
                                      <td className="p-8">
                                         <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${o.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' : o.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {o.status}
                                         </span>
                                      </td>
                                      <td className="p-8 text-right">
                                         <button className="bg-black text-white w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 transition"><i className="fa-solid fa-chevron-right text-xs"></i></button>
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </>
                 )}
              </div>
            )}
            {currentRoute === AppRoute.ADMIN_CATEGORIES && renderAdminCategories()}
            {currentRoute === AppRoute.ADMIN_CUSTOMERS && renderAdminCustomers()}
            {currentRoute === AppRoute.ADMIN_SITE_SETTINGS && renderAdminSettings()}
            {currentRoute === AppRoute.ADMIN_POPUPS && renderAdminPromotions()}
            {/* Fallback for other routes */}
            {![AppRoute.ADMIN_DASHBOARD, AppRoute.ADMIN_PRODUCTS, AppRoute.ADMIN_ORDERS, AppRoute.ADMIN_CATEGORIES, AppRoute.ADMIN_CUSTOMERS, AppRoute.ADMIN_SITE_SETTINGS, AppRoute.ADMIN_POPUPS].includes(currentRoute) && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 text-3xl mb-4"><i className="fa-solid fa-toolbox"></i></div>
                 <h2 className="text-xl font-black uppercase italic tracking-tighter">Under Construction</h2>
                 <p className="text-xs font-bold text-gray-400 mt-2">This feature is being finalized for production.</p>
              </div>
            )}
        </AdminLayout>
      ) : (
        <StorefrontLayout onNavigate={setCurrentRoute} cartCount={cartCount} wishlistCount={wishlist.length} currentRoute={currentRoute} activeBanner={activeBanner} onCloseBanner={() => closePromotion(activeBanner!.id)}>
          {currentRoute === AppRoute.STORE && renderHome()}
          {currentRoute === AppRoute.SEARCH && renderSearch()}
          {currentRoute === AppRoute.CART && (
            <div className="p-6 bg-gray-50 min-h-screen animate-slide-up">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8">My Shopping Bag</h2>
              {cart.length === 0 ? (<div className="text-center py-20"><p className="text-gray-400 font-bold uppercase tracking-widest mb-4">Bag is empty</p><button onClick={() => setCurrentRoute(AppRoute.STORE)} className="bg-black text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest">Shop Now</button></div>) : (
                <div className="space-y-4 max-w-2xl mx-auto pb-24">
                  {cart.map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl flex gap-4 border border-gray-100 shadow-sm">
                      <img src={item.image} className="w-20 h-20 rounded-xl object-cover" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div><h3 className="font-bold text-xs uppercase">{item.name}</h3><p className="text-[9px] text-gray-400 font-bold uppercase">{Object.values(item.selectedOptions || {}).join(' | ')}</p></div>
                        <div className="flex justify-between items-end"><p className="font-black text-sm">₹{item.price * item.quantity}</p><button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Remove</button></div>
                      </div>
                    </div>
                  ))}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between text-sm font-bold text-gray-400 uppercase tracking-widest"><span>Subtotal</span><span>₹{cartTotal}</span></div>
                    <div className="flex justify-between text-xl font-black border-t pt-4 uppercase tracking-tighter"><span>Total</span><span>₹{cartTotal + settings.shippingFee}</span></div>
                    <button onClick={() => { setCheckoutStep('details'); setCurrentRoute(AppRoute.CHECKOUT); }} className="w-full bg-black text-white py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-lg mt-4">Checkout</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {currentRoute === AppRoute.CHECKOUT && renderCheckout()}
          {currentRoute === AppRoute.ORDER_SUCCESS && <div className="p-6 min-h-screen flex flex-col items-center justify-center animate-slide-up"><div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-8 shadow-inner animate-bounce"><i className="fa-solid fa-check"></i></div><h1 className="text-4xl font-black italic uppercase mb-2 tracking-tighter">Order Placed!</h1><p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-10">Ref: {viewingOrder?.orderNumber}</p><button onClick={() => setCurrentRoute(AppRoute.STORE)} className="bg-black text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">Back to Store</button></div>}
          {currentRoute === AppRoute.ORDER_DETAIL && viewingOrder && renderOrderDetailUI(viewingOrder)}
          {currentRoute === AppRoute.PROFILE && renderProfile()}
          {currentRoute === AppRoute.PRODUCT_DETAIL && selectedProduct && (
            <div className="pb-32 animate-slide-up bg-white min-h-screen">
              <div className="h-[60vh] relative overflow-hidden bg-gray-100">
                <button onClick={() => setCurrentRoute(AppRoute.STORE)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/80 z-20 flex items-center justify-center hover:bg-white transition shadow-sm"><i className="fa-solid fa-arrow-left"></i></button>
                <img src={selectedProduct.image} className="w-full h-full object-cover" />
                {selectedProduct.discountBadge && <div className="absolute top-4 right-4 bg-black text-white px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">{selectedProduct.discountBadge}</div>}
              </div>
              <div className="px-6 py-12 -mt-12 bg-white rounded-t-[48px] relative z-10 space-y-10 shadow-2xl">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">{selectedProduct.category}</p>
                    <h1 className="text-5xl font-[900] italic uppercase tracking-tighter leading-tight max-w-[250px]">{selectedProduct.name}</h1>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black">₹{selectedProduct.price}</p>
                    {selectedProduct.oldPrice && <p className="text-sm text-gray-400 line-through">₹{selectedProduct.oldPrice}</p>}
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{selectedProduct.description}</p>
                
                {selectedProduct.options?.map((opt, i) => (
                  <div key={i} className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{opt.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {opt.values.map(val => (
                        <button key={val} onClick={() => setPDetailSelections(prev => ({...prev, [opt.name]: val}))} className={`px-6 py-3 rounded-2xl border-2 font-black text-[10px] uppercase transition-all duration-300 ${pDetailSelections[opt.name] === val ? 'bg-black text-white border-black scale-105 shadow-xl' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}>{val}</button>
                      ))}
                    </div>
                  </div>
                ))}

                {selectedProduct.allowCustomImages && (
                  <div className="space-y-4 p-6 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Customization Assets</p>
                      <label className="bg-black text-white px-4 py-2 rounded-xl font-black text-[8px] uppercase tracking-widest cursor-pointer hover:bg-gray-800 transition">
                        + Upload Photos
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                    {uploadedImages.length > 0 ? (
                      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {uploadedImages.map((img, idx) => (
                          <div key={idx} className="relative group min-w-[80px]">
                            <img src={img} className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
                            <button onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px]"><i className="fa-solid fa-xmark"></i></button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[9px] text-gray-400 italic">No files attached yet. Recommended for personalized products.</p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-6 pt-6">
                  <div className="flex items-center bg-gray-50 px-6 py-4 rounded-[20px] shadow-inner">
                    <button onClick={() => setPDetailQty(q => Math.max(1, q-1))} className="w-8 font-black text-gray-400 hover:text-black transition">-</button>
                    <span className="w-10 text-center font-black text-sm">{pDetailQty}</span>
                    <button onClick={() => setPDetailQty(q => q+1)} className="w-8 font-black text-gray-400 hover:text-black transition">+</button>
                  </div>
                  <button 
                    onClick={() => { 
                      setCart(prev => [...prev, { ...selectedProduct, quantity: pDetailQty, selectedOptions: pDetailSelections, uploadedImages }]); 
                      setCurrentRoute(AppRoute.CART); 
                      showToast("Asset added to bag"); 
                    }} 
                    className="flex-1 bg-black text-white py-5 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-gray-900 transition-all hover:scale-[1.02]"
                  >
                    Add to Bag
                  </button>
                </div>
              </div>
            </div>
          )}
        </StorefrontLayout>
      )}

      {/* MODALS */}
      {viewingCustomImage && (
        <div className="fixed inset-0 bg-black/90 z-[150] flex items-center justify-center p-4" onClick={() => setViewingCustomImage(null)}>
           <div className="relative max-w-4xl max-h-full">
              <img src={viewingCustomImage} className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" alt="Customization" />
              <button onClick={() => setViewingCustomImage(null)} className="absolute -top-12 right-0 text-white text-3xl hover:opacity-70"><i className="fa-solid fa-xmark"></i></button>
           </div>
        </div>
      )}

      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[48px] p-10 w-full max-w-lg shadow-2xl space-y-8 animate-slide-up">
            <h2 className="text-3xl font-[900] italic uppercase tracking-tighter text-black">EDIT PROFILE</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Full Name" value={editAddressForm.name} onChange={(e) => setEditAddressForm({...editAddressForm, name: e.target.value})} className="w-full bg-[#F8F9FA] p-5 rounded-2xl font-bold border border-transparent focus:border-gray-200 outline-none transition text-sm text-black placeholder:text-gray-400" />
              <input type="email" placeholder="shourya@fyx.com" value={editAddressForm.email} onChange={(e) => setEditAddressForm({...editAddressForm, email: e.target.value})} className="w-full bg-[#F8F9FA] p-5 rounded-2xl font-bold border border-transparent focus:border-gray-200 outline-none transition text-sm text-black placeholder:text-gray-400" />
              <input type="tel" placeholder="Phone" value={editAddressForm.phone} onChange={(e) => setEditAddressForm({...editAddressForm, phone: e.target.value})} className="w-full bg-[#F8F9FA] p-5 rounded-2xl font-bold border border-transparent focus:border-gray-200 outline-none transition text-sm text-black placeholder:text-gray-400" />
              <div className="grid grid-cols-2 gap-4">
                 <div className="relative">
                    <select value={editAddressForm.gender || 'Other'} onChange={(e) => setEditAddressForm({...editAddressForm, gender: e.target.value})} className="w-full bg-[#F8F9FA] p-5 rounded-2xl font-bold border border-transparent outline-none appearance-none text-sm text-black"><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
                    <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                 </div>
                 <div className="relative">
                    <select value={editAddressForm.userType || 'Default'} onChange={(e) => setEditAddressForm({...editAddressForm, userType: e.target.value})} className="w-full bg-[#F8F9FA] p-5 rounded-2xl font-bold border border-transparent outline-none appearance-none text-sm text-black"><option value="Default">Default</option><option value="Business">Business</option></select>
                    <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                 </div>
              </div>
              <div className="pt-4 space-y-4">
                 <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">ADDRESS DETAILS</p>
                 <input type="text" placeholder="House No / Flat" value={editAddressForm.houseNo} onChange={(e) => setEditAddressForm({...editAddressForm, houseNo: e.target.value})} className="w-full bg-[#F8F9FA] p-5 rounded-2xl font-bold border border-transparent focus:border-gray-200 outline-none transition text-sm text-black placeholder:text-gray-400" />
                 <input type="text" placeholder="Street / Area" value={editAddressForm.street} onChange={(e) => setEditAddressForm({...editAddressForm, street: e.target.value})} className="w-full bg-[#F8F9FA] p-5 rounded-2xl font-bold border border-transparent focus:border-gray-200 outline-none transition text-sm text-black placeholder:text-gray-400" />
                 <div className="grid grid-cols-2 gap-4">
                   <input type="text" placeholder="City" value={editAddressForm.city} onChange={(e) => setEditAddressForm({...editAddressForm, city: e.target.value})} className="w-full bg-[#F8F9FA] p-5 rounded-2xl font-bold border border-transparent focus:border-gray-200 outline-none transition text-sm text-black placeholder:text-gray-400" />
                   <input type="text" placeholder="Pincode" value={editAddressForm.pincode} onChange={(e) => setEditAddressForm({...editAddressForm, pincode: e.target.value})} className="w-full bg-[#F8F9FA] p-5 rounded-2xl font-bold border border-transparent focus:border-gray-200 outline-none transition text-sm text-black placeholder:text-gray-400" />
                 </div>
                 <input type="text" placeholder="State" value={editAddressForm.state || ''} onChange={(e) => setEditAddressForm({...editAddressForm, state: e.target.value})} className="w-full bg-[#F8F9FA] p-5 rounded-2xl font-bold border border-transparent focus:border-gray-200 outline-none transition text-sm text-black placeholder:text-gray-400" />
              </div>
            </div>
            <div className="flex gap-6 pt-6">
               <button onClick={() => setShowEditProfileModal(false)} className="flex-1 py-5 font-bold uppercase text-xs border border-gray-100 rounded-3xl hover:bg-gray-50 transition tracking-widest text-black shadow-sm">CANCEL</button>
               <button onClick={saveProfileChanges} className="flex-1 bg-black text-white py-5 font-[900] uppercase text-xs rounded-3xl shadow-xl hover:scale-[1.02] transition tracking-widest">SAVE CHANGES</button>
            </div>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[40px] p-10 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-8 shadow-2xl no-scrollbar relative">
              <h2 className="text-3xl font-[900] italic uppercase tracking-tighter mb-4">EDIT PRODUCT</h2>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">PRODUCT NAME</label>
                <input type="text" value={editingProduct?.name || ''} onChange={(e) => setEditingProduct(p => p ? ({...p, name: e.target.value}) : null)} className="w-full bg-gray-50/50 p-5 rounded-2xl font-bold border border-gray-100 focus:border-black outline-none transition" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">PRICE (₹)</label>
                  <input type="number" value={editingProduct?.price || ''} onChange={(e) => setEditingProduct(p => p ? ({...p, price: Number(e.target.value)}) : null)} className="w-full bg-gray-50/50 p-5 rounded-2xl font-bold border border-gray-100 focus:border-black outline-none transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">OLD PRICE (OPTIONAL)</label>
                  <input type="number" value={editingProduct?.oldPrice || ''} onChange={(e) => setEditingProduct(p => p ? ({...p, oldPrice: Number(e.target.value)}) : null)} className="w-full bg-gray-50/50 p-5 rounded-2xl font-bold border border-gray-100 focus:border-black outline-none transition text-gray-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">CATEGORY</label>
                <div className="relative"><select value={editingProduct?.category || ''} onChange={(e) => setEditingProduct(p => p ? ({...p, category: e.target.value}) : null)} className="w-full bg-gray-50/50 p-5 rounded-2xl font-bold border border-gray-100 focus:border-black outline-none transition appearance-none">{storeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select><i className="fa-solid fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i></div>
              </div>
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">DESCRIPTION</label>
                <textarea value={editingProduct?.description || ''} onChange={(e) => setEditingProduct(p => p ? ({...p, description: e.target.value}) : null)} className="w-full bg-gray-50/50 p-5 rounded-3xl font-bold border border-gray-100 focus:border-black outline-none min-h-[160px] transition text-sm leading-relaxed" />
                <button onClick={handleGenerateAIDesc} disabled={isGeneratingDesc} className="absolute right-4 bottom-4 bg-black text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition flex items-center gap-2 disabled:opacity-50 shadow-xl">{isGeneratingDesc ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>} AI WRITE</button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">IMAGE</label>
                <div className="flex gap-4">
                  <input type="text" value={editingProduct?.image || ''} onChange={(e) => setEditingProduct(p => p ? ({...p, image: e.target.value}) : null)} placeholder="https://..." className="flex-1 bg-gray-50/50 p-5 rounded-2xl font-bold border border-gray-100 focus:border-black outline-none transition text-sm" />
                  <button className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition"><i className="fa-solid fa-upload"></i></button>
                </div>
              </div>

              {/* VARIANT MANAGEMENT SECTION */}
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">PRODUCT VARIANTS (OPTIONS)</label>
                   <button onClick={addOption} className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition tracking-tighter">+ ADD VARIANT</button>
                </div>
                <div className="space-y-4">
                  {editingProduct?.options?.map((opt, oIdx) => (
                    <div key={oIdx} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 relative group">
                       <button onClick={() => removeOption(oIdx)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><i className="fa-solid fa-trash-can text-xs"></i></button>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1">
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">OPTION NAME (E.G. SIZE)</p>
                           <input 
                             type="text" 
                             value={opt.name} 
                             onChange={(e) => {
                               const newOpts = [...(editingProduct?.options || [])];
                               newOpts[oIdx].name = e.target.value;
                               setEditingProduct({ ...editingProduct!, options: newOpts });
                             }}
                             className="w-full bg-white p-3 rounded-xl border border-gray-100 font-bold text-xs outline-none focus:border-black transition"
                           />
                         </div>
                         <div className="space-y-1">
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">VALUES (COMMA SEPARATED)</p>
                           <input 
                             type="text" 
                             value={opt.values.join(', ')} 
                             onChange={(e) => {
                               const newOpts = [...(editingProduct?.options || [])];
                               newOpts[oIdx].values = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
                               setEditingProduct({ ...editingProduct!, options: newOpts });
                             }}
                             className="w-full bg-white p-3 rounded-xl border border-gray-100 font-bold text-xs outline-none focus:border-black transition"
                           />
                         </div>
                       </div>
                    </div>
                  ))}
                  {(!editingProduct?.options || editingProduct.options.length === 0) && (
                    <p className="text-[9px] text-gray-400 italic text-center py-4 bg-gray-50/30 rounded-2xl border border-dashed border-gray-100">No variants configured for this product.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-6 pt-10 sticky bottom-0 bg-white pb-2">
                 <button onClick={() => setShowProductModal(false)} className="flex-1 py-5 font-[900] uppercase text-[12px] border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition tracking-widest text-black">CANCEL</button>
                 <button onClick={() => { setProducts(prev => prev.some(p => p.id === editingProduct?.id) ? prev.map(p => p.id === editingProduct?.id ? editingProduct! : p) : [...prev, editingProduct!]); setShowProductModal(false); showToast("Inventory synchronized"); }} className="flex-1 bg-black text-white py-5 font-[900] uppercase text-[12px] rounded-2xl shadow-2xl hover:scale-[1.02] transition tracking-[0.1em]">SAVE PRODUCT</button>
              </div>
           </div>
        </div>
      )}

      {showProofModal && (
        <div className="fixed inset-0 bg-black/90 z-[120] flex items-center justify-center p-4 md:p-10 animate-fade-in" onClick={() => setShowProofModal(null)}>
           <div className="relative max-w-4xl max-h-full">
              <img src={showProofModal} className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" alt="Proof" />
              <button onClick={() => setShowProofModal(null)} className="absolute -top-12 right-0 text-white text-3xl hover:opacity-70"><i className="fa-solid fa-xmark"></i></button>
           </div>
        </div>
      )}

      {toast.visible && (<div className="fixed top-24 right-6 bg-black text-white px-6 py-4 rounded-2xl shadow-2xl z-[110] flex items-center space-x-3 animate-slide-in-right border border-white/10"><div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div><span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span></div>)}
      <AIChatBubble />
    </>
  );
};

export default App;