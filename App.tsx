
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppRoute, Product, CartItem, Order, ProductOption, Promotion, Review } from './types';
import { INITIAL_PRODUCTS, CATEGORIES } from './constants';
import StorefrontLayout from './components/StorefrontLayout';
import AdminLayout from './components/AdminLayout';
import AIChatBubble from './components/AIChatBubble';
import { generateProductDescription, analyzeSalesTrends, generateProductImage, generateMarketingEmail } from './services/geminiService';

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
    currency: 'INR',
    taxRate: 18,
    logoUrl: '',
    headerAnnouncement: 'NEW SEASON ARRIVALS • SHOP NOW',
    primaryColor: '#000000',
    secondaryColor: '#f1f1f1'
  });

  // --- Extended Admin Features State ---
  const [supportTickets, setSupportTickets] = useState([
    { id: 'T1', user: 'Aditi Sharma', subject: 'Refund Query', status: 'Open', date: '2024-01-20', priority: 'High' },
    { id: 'T2', user: 'Rohan Gupta', subject: 'Delayed Shipping', status: 'Resolved', date: '2024-01-18', priority: 'Medium' }
  ]);
  const [discountCodes, setDiscountCodes] = useState([
    { id: 'D1', code: 'WELCOME10', type: 'Percentage', value: 10, status: 'Active' },
    { id: 'D2', code: 'FREESHIP', type: 'Flat', value: 0, status: 'Active' }
  ]);
  const [faqs, setFaqs] = useState([
    { id: 'F1', q: 'What is the return policy?', a: 'Returns are accepted within 7 days of delivery.' },
    { id: 'F2', q: 'How long does shipping take?', a: 'Standard shipping takes 3-5 business days.' }
  ]);
  const [blogPosts, setBlogPosts] = useState([
    { id: 'B1', title: 'Summer Collection 2025', author: 'Admin', date: '2025-01-01', status: 'Published' },
    { id: 'B2', title: 'The Art of Minimalist Living', author: 'Editor', date: '2025-01-15', status: 'Draft' }
  ]);
  const [customPages, setCustomPages] = useState([
    { id: 'P1', title: 'About Us', slug: 'about-us', status: 'Active' },
    { id: 'P2', title: 'Contact Support', slug: 'contact', status: 'Active' }
  ]);
  const [flashSales, setFlashSales] = useState([
    { id: 'S1', title: 'Midnight Madness', endTime: '2025-12-31T23:59:59', status: 'Active' }
  ]);
  const [emailTemplates, setEmailTemplates] = useState([
    { id: 'E1', name: 'Order Confirmation', subject: 'Your FYX Order is Confirmed!' },
    { id: 'E2', name: 'Welcome Email', subject: 'Welcome to the FYX Family' }
  ]);
  const [newsletterDraft, setNewsletterDraft] = useState({ topic: '', content: '' });

  const [aiAnalysis, setAiAnalysis] = useState<string>('Crunching numbers...');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
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

  // --- Admin Modal States ---
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [showPromoModal, setShowPromoModal] = useState(false);
  const [newPromoForm, setNewPromoForm] = useState({ title: '', content: '', type: 'banner' as 'banner' | 'popup' });

  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [newDiscountForm, setNewDiscountForm] = useState({ code: '', value: 10, type: 'Percentage' });

  const [showFaqModal, setShowFaqModal] = useState(false);
  const [newFaqForm, setNewFaqForm] = useState({ q: '', a: '' });

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
      const savedTickets = localStorage.getItem('fyx_tickets');
      const savedDiscounts = localStorage.getItem('fyx_discounts');
      const savedFaqs = localStorage.getItem('fyx_faqs');
      const savedBlog = localStorage.getItem('fyx_blog');
      const savedPages = localStorage.getItem('fyx_pages');
      const savedSales = localStorage.getItem('fyx_sales');

      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (savedOrders) setOrders(JSON.parse(savedOrders));
      if (savedCats) setStoreCategories(JSON.parse(savedCats));
      if (savedPromotions) setPromotions(JSON.parse(savedPromotions));
      if (savedTickets) setSupportTickets(JSON.parse(savedTickets));
      if (savedDiscounts) setDiscountCodes(JSON.parse(savedDiscounts));
      if (savedFaqs) setFaqs(JSON.parse(savedFaqs));
      if (savedBlog) setBlogPosts(JSON.parse(savedBlog));
      if (savedPages) setCustomPages(JSON.parse(savedPages));
      if (savedSales) setFlashSales(JSON.parse(savedSales));
      
      const parsedDb = savedUsersDb ? JSON.parse(savedUsersDb) : {};
      setUsersDb(parsedDb);

      if (savedSessionId && parsedDb[savedSessionId]) {
          const sessionData = parsedDb[savedSessionId] as UserData;
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
    localStorage.setItem('fyx_tickets', JSON.stringify(supportTickets));
    localStorage.setItem('fyx_discounts', JSON.stringify(discountCodes));
    localStorage.setItem('fyx_faqs', JSON.stringify(faqs));
    localStorage.setItem('fyx_blog', JSON.stringify(blogPosts));
    localStorage.setItem('fyx_pages', JSON.stringify(customPages));
    localStorage.setItem('fyx_sales', JSON.stringify(flashSales));

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
  }, [products, orders, cart, wishlist, userAddress, isLoggedIn, settings, promotions, storeCategories, supportTickets, discountCodes, faqs, blogPosts, customPages, flashSales]);

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

  const handleGenerateAINewsletter = async () => {
    if (!newsletterDraft.topic) { showToast("Enter a topic first"); return; }
    setIsGeneratingEmail(true);
    const content = await generateMarketingEmail(newsletterDraft.topic);
    setNewsletterDraft(prev => ({ ...prev, content }));
    setIsGeneratingEmail(false);
    showToast("Newsletter AI Draft Ready");
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
    setViewingOrder(prev => (prev && prev.id === id ? { ...prev, status } : prev));
    setAdminViewingOrder(prev => (prev && prev.id === id ? { ...prev, status } : prev));
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

  const updateOptionName = (idx: number, name: string) => {
    setEditingProduct(p => {
      if (!p) return null;
      const options = [...(p.options || [])];
      options[idx].name = name;
      return { ...p, options };
    });
  };

  const updateOptionValues = (idx: number, valuesStr: string) => {
    const values = valuesStr.split(',').map(v => v.trim()).filter(Boolean);
    setEditingProduct(p => {
      if (!p) return null;
      const options = [...(p.options || [])];
      options[idx].values = values;
      return { ...p, options };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct(p => p ? ({...p, image: reader.result as string}) : null);
        showToast("Image uploaded");
      };
      reader.readAsDataURL(file);
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
    if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) return;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
    setViewingOrder(prev => (prev && prev.id === id ? { ...prev, status: 'cancelled' } : prev));
    setAdminViewingOrder(prev => (prev && prev.id === id ? { ...prev, status: 'cancelled' } : prev));
    showToast("Order has been cancelled successfully");
  };

  const triggerUpiPay = () => {
    const amount = cartTotal + settings.shippingFee;
    const upiUrl = `upi://pay?pa=${MERCHANT_UPI_ID}&pn=FYX%20Store&am=${amount}&cu=INR&tn=Payment%20for%20FYX%20Order`;
    window.location.href = upiUrl;
  };

  // --- Admin Specific Logic ---
  const handleAddCategory = () => {
    setNewCategoryName('');
    setShowCategoryModal(true);
  };

  const confirmAddCategory = () => {
    if (newCategoryName && !storeCategories.includes(newCategoryName)) {
      setStoreCategories([...storeCategories, newCategoryName]);
      setShowCategoryModal(false);
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

  const confirmAddPromotion = () => {
    if (newPromoForm.title && newPromoForm.content) {
      setPromotions([...promotions, { 
        id: Date.now().toString(), 
        type: newPromoForm.type, 
        title: newPromoForm.title, 
        content: newPromoForm.content, 
        status: 'Active', 
        displayRule: 'immediate', 
        closable: true 
      }]);
      setShowPromoModal(false);
      showToast("Promotion created");
    } else {
      showToast("Please fill in required fields");
    }
  };

  const confirmAddDiscount = () => {
    if (newDiscountForm.code) {
      setDiscountCodes([...discountCodes, {
        id: Date.now().toString(),
        code: newDiscountForm.code.toUpperCase(),
        type: newDiscountForm.type,
        value: newDiscountForm.value,
        status: 'Active'
      }]);
      setShowDiscountModal(false);
      showToast("Coupon created");
    }
  };

  const confirmAddFaq = () => {
    if (newFaqForm.q && newFaqForm.a) {
      setFaqs([...faqs, { id: Date.now().toString(), q: newFaqForm.q, a: newFaqForm.a }]);
      setShowFaqModal(false);
      showToast("FAQ added");
    }
  };

  // --- New Admin Modules Renderers ---
  const renderAdminSupport = () => (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic uppercase">Support Tickets</h2>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Queue: {supportTickets.filter(t => t.status === 'Open').length} Active</span>
        </div>
      </div>
      <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <th className="p-8">Ticket Info</th>
              <th className="p-8">Priority</th>
              <th className="p-8">Status</th>
              <th className="p-8 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {supportTickets.map(t => (
              <tr key={t.id} className="hover:bg-gray-50/50 transition">
                <td className="p-8">
                   <p className="font-black text-sm uppercase">{t.subject}</p>
                   <p className="text-[10px] text-gray-400 font-bold uppercase">{t.user} • {t.date}</p>
                </td>
                <td className="p-8">
                   <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${t.priority === 'High' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>{t.priority}</span>
                </td>
                <td className="p-8">
                   <span className={`text-[9px] font-black uppercase tracking-widest ${t.status === 'Open' ? 'text-orange-500' : 'text-gray-400'}`}>{t.status}</span>
                </td>
                <td className="p-8 text-right">
                  <button onClick={() => {
                    setSupportTickets(prev => prev.map(pt => pt.id === t.id ? { ...pt, status: pt.status === 'Open' ? 'Resolved' : 'Open' } : pt));
                    showToast("Ticket status updated");
                  }} className="text-gray-400 hover:text-black transition p-2"><i className="fa-solid fa-check-circle"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAdminChat = () => (
    <div className="animate-fade-in space-y-8">
      <h2 className="text-2xl font-black italic uppercase">Live Customer Conversations</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-[600px]">
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50"><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Active Sessions</p></div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {Object.keys(usersDb).map((uid, i) => (
              <div key={uid} className={`p-6 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${i === 0 ? 'bg-black text-white' : ''}`}>
                <p className="font-black text-xs uppercase">{usersDb[uid].profile.name || uid}</p>
                <p className={`text-[8px] font-bold uppercase tracking-widest ${i === 0 ? 'text-white/50' : 'text-gray-400'}`}>Active 2m ago</p>
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-2 bg-white rounded-[40px] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
             <div>
                <p className="font-black text-sm uppercase">Customer Session</p>
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Connected • Live Encryption</p>
             </div>
             <button className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-red-500">Close Room</button>
          </div>
          <div className="flex-1 p-8 overflow-y-auto no-scrollbar space-y-6">
             <div className="bg-gray-100 p-4 rounded-3xl rounded-tl-none max-w-[80%] text-xs font-medium leading-relaxed">Hello, I have a question regarding my recent order #FYX-8291. Is it shipped?</div>
             <div className="bg-black text-white p-4 rounded-3xl rounded-tr-none max-w-[80%] ml-auto text-xs font-medium leading-relaxed">Hi! Let me check the database for you. It's currently in the processing stage and should ship tomorrow.</div>
          </div>
          <div className="p-6 border-t border-gray-50 flex gap-4">
             <input type="text" placeholder="Type administrative response..." className="flex-1 bg-gray-50 p-4 rounded-2xl text-xs font-bold outline-none" />
             <button className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center hover:scale-105 transition"><i className="fa-solid fa-paper-plane"></i></button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminDiscounts = () => (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic uppercase">Discount Codes</h2>
        <button onClick={() => {
          setNewDiscountForm({ code: '', value: 10, type: 'Percentage' });
          setShowDiscountModal(true);
        }} className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition">+ New Coupon</button>
      </div>
      <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <th className="p-8">Code</th>
              <th className="p-8">Incentive</th>
              <th className="p-8">Status</th>
              <th className="p-8 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {discountCodes.map(d => (
              <tr key={d.id} className="hover:bg-gray-50/50 transition">
                <td className="p-8 font-black text-sm uppercase tracking-tighter italic">{d.code}</td>
                <td className="p-8 font-bold text-xs">{d.type === 'Percentage' ? `${d.value}% Off` : `₹${d.value} Flat`}</td>
                <td className="p-8"><span className={`text-[9px] font-black uppercase tracking-widest ${d.status === 'Active' ? 'text-emerald-500' : 'text-red-500'}`}>{d.status}</span></td>
                <td className="p-8 text-right">
                  <button onClick={() => setDiscountCodes(discountCodes.filter(dc => dc.id !== d.id))} className="text-red-300 hover:text-red-500 transition p-2"><i className="fa-solid fa-trash-can"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAdminFAQ = () => (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic uppercase">FAQ Management</h2>
        <button onClick={() => {
          setNewFaqForm({ q: '', a: '' });
          setShowFaqModal(true);
        }} className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition">+ Add FAQ</button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {faqs.map(f => (
          <div key={f.id} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-3 hover:shadow-md transition">
             <div className="flex justify-between items-start">
               <p className="font-black text-sm uppercase tracking-tight">Q: {f.q}</p>
               <button onClick={() => setFaqs(faqs.filter(fx => fx.id !== f.id))} className="text-red-300 hover:text-red-500 transition p-2"><i className="fa-solid fa-xmark"></i></button>
             </div>
             <p className="text-xs text-gray-500 leading-relaxed font-medium">A: {f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAdminNewsletter = () => (
    <div className="animate-fade-in space-y-8">
      <h2 className="text-2xl font-black italic uppercase">Newsletter Studio</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">CAMPAIGN TOPIC</label>
                 <input 
                   type="text" 
                   value={newsletterDraft.topic} 
                   onChange={(e) => setNewsletterDraft({...newsletterDraft, topic: e.target.value})} 
                   placeholder="e.g. Summer Collection Launch"
                   className="w-full bg-gray-50 p-5 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-black transition" 
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">EMAIL CONTENT</label>
                 <textarea 
                   rows={10} 
                   value={newsletterDraft.content} 
                   onChange={(e) => setNewsletterDraft({...newsletterDraft, content: e.target.value})} 
                   className="w-full bg-gray-50 p-5 rounded-3xl font-medium text-sm outline-none focus:ring-2 focus:ring-black transition no-scrollbar"
                 />
               </div>
               <div className="flex gap-4">
                  <button 
                    onClick={handleGenerateAINewsletter} 
                    disabled={isGeneratingEmail}
                    className="flex-1 bg-white border border-gray-200 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition shadow-sm flex items-center justify-center gap-2"
                  >
                    {isGeneratingEmail ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles text-purple-500"></i>}
                    Draft with AI
                  </button>
                  <button onClick={() => { showToast("Newsletter dispatched to " + Object.keys(usersDb).length + " users"); setNewsletterDraft({topic: '', content: ''}); }} className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.02] transition">Blast Campaign</button>
               </div>
            </div>
         </div>
         <div className="space-y-8">
            <div className="bg-[#1a1614] p-8 rounded-[40px] text-white space-y-4">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Total Reach</p>
               <p className="text-4xl font-[900] italic tracking-tighter uppercase">{Object.keys(usersDb).length}</p>
               <p className="text-[9px] font-bold text-white/60">Verified Subscribers in Database</p>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
               <h3 className="text-xs font-black uppercase tracking-widest">Recent Performance</h3>
               <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase"><span>Open Rate</span><span className="text-emerald-500">42.5%</span></div>
                  <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden"><div className="w-[42%] h-full bg-emerald-500"></div></div>
                  <div className="flex justify-between text-[10px] font-black uppercase"><span>Click Rate</span><span className="text-blue-500">12.1%</span></div>
                  <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden"><div className="w-[12%] h-full bg-blue-500"></div></div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );

  const renderAdminLayoutSettings = () => (
    <div className="animate-fade-in space-y-8">
      <h2 className="text-2xl font-black italic uppercase">Interface Configuration</h2>
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 space-y-10">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
               <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">STORE LOGO URL</label>
               <input type="text" value={settings.logoUrl} onChange={(e) => setSettings({...settings, logoUrl: e.target.value})} placeholder="https://..." className="w-full bg-gray-50 p-5 rounded-2xl font-bold outline-none" />
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">HEADER ANNOUNCEMENT</label>
               <input type="text" value={settings.headerAnnouncement} onChange={(e) => setSettings({...settings, headerAnnouncement: e.target.value})} className="w-full bg-gray-50 p-5 rounded-2xl font-bold outline-none" />
            </div>
         </div>
         <div className="space-y-4">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">NAVIGATION LINKS</p>
            <div className="flex gap-4">
               <button className="bg-gray-50 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-gray-100">Shop All</button>
               <button className="bg-gray-50 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-gray-100">New Arrivals</button>
               <button className="bg-black text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest">+ Add Link</button>
            </div>
         </div>
         <button onClick={() => showToast("Layout synchronized")} className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase tracking-widest hover:scale-[1.01] transition shadow-xl">Apply Layout Changes</button>
      </div>
    </div>
  );

  const renderAdminTheme = () => (
    <div className="animate-fade-in space-y-8">
      <h2 className="text-2xl font-black italic uppercase">Brand Identity</h2>
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 space-y-12">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
               <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">COLOR PALETTE</p>
               <div className="flex items-center gap-6">
                  <div className="space-y-2">
                     <p className="text-[8px] font-black uppercase text-gray-400">PRIMARY</p>
                     <div className="w-16 h-16 rounded-2xl shadow-inner border-4 border-white ring-1 ring-gray-100 cursor-pointer" style={{ backgroundColor: settings.primaryColor }}></div>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[8px] font-black uppercase text-gray-400">SECONDARY</p>
                     <div className="w-16 h-16 rounded-2xl shadow-inner border-4 border-white ring-1 ring-gray-100 cursor-pointer" style={{ backgroundColor: settings.secondaryColor }}></div>
                  </div>
               </div>
            </div>
            <div className="space-y-6">
               <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">TYPOGRAPHY SET</p>
               <select className="w-full bg-gray-50 p-5 rounded-2xl font-black text-xs uppercase tracking-widest outline-none border border-gray-100">
                  <option>Inter (Modern Sans)</option>
                  <option>Playfair Display (Premium Serif)</option>
                  <option>Roboto Mono (Technical)</option>
               </select>
            </div>
         </div>
         <div className="p-10 rounded-[32px] bg-gray-50 space-y-6">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">INTERFACE PREVIEW</p>
            <div className="flex flex-col items-center gap-4">
               <div className="h-6 w-32 bg-black rounded-full"></div>
               <div className="h-40 w-full bg-white rounded-3xl border border-gray-200"></div>
            </div>
         </div>
         <button onClick={() => showToast("Theme colors updated")} className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl">Publish Branding</button>
      </div>
    </div>
  );

  const renderAdminEmailTemplates = () => (
    <div className="animate-fade-in space-y-8">
      <h2 className="text-2xl font-black italic uppercase">Transactional Mailers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {emailTemplates.map(t => (
          <div key={t.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-black transition duration-300">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">TEMPLATE ID: {t.id}</p>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-1">{t.name}</h3>
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-6">Subject: {t.subject}</p>
            </div>
            <div className="flex gap-4">
              <button className="flex-1 py-4 bg-gray-50 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition">View Preview</button>
              <button className="px-6 py-4 bg-black text-white rounded-2xl transition hover:scale-105"><i className="fa-solid fa-pen-to-square"></i></button>
            </div>
          </div>
        ))}
        <button className="border-4 border-dashed border-gray-100 rounded-[40px] p-8 flex flex-col items-center justify-center text-gray-300 hover:text-black hover:border-black transition">
           <i className="fa-solid fa-plus text-2xl mb-2"></i>
           <p className="text-[10px] font-black uppercase tracking-widest">New Template</p>
        </button>
      </div>
    </div>
  );

  const renderAdminBlog = () => (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic uppercase">Editorial Control</h2>
        <button onClick={() => showToast("Blog editor coming soon in v2.1")} className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition">+ New Article</button>
      </div>
      <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <th className="p-8">Title / Author</th>
              <th className="p-8">Post Date</th>
              <th className="p-8">Status</th>
              <th className="p-8 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {blogPosts.map(b => (
              <tr key={b.id} className="hover:bg-gray-50/50 transition">
                <td className="p-8">
                   <p className="font-black text-sm uppercase">{b.title}</p>
                   <p className="text-[10px] text-gray-400 font-bold uppercase">{b.author}</p>
                </td>
                <td className="p-8 text-xs font-bold">{b.date}</td>
                <td className="p-8">
                   <span className={`text-[9px] font-black uppercase tracking-widest ${b.status === 'Published' ? 'text-emerald-500' : 'text-gray-400'}`}>{b.status}</span>
                </td>
                <td className="p-8 text-right">
                  <button className="text-gray-300 hover:text-black transition p-2"><i className="fa-solid fa-ellipsis-vertical"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAdminPages = () => (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic uppercase">Custom Webpages</h2>
        <button onClick={() => showToast("Page builder coming soon")} className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition">+ Build Page</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {customPages.map(p => (
          <div key={p.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex items-center justify-between group hover:border-black transition duration-300">
            <div>
               <h3 className="font-black text-lg uppercase tracking-tighter italic">{p.title}</h3>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Slug: /{p.slug}</p>
            </div>
            <div className="flex gap-2">
               <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-black transition"><i className="fa-solid fa-link text-xs"></i></button>
               <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-black transition"><i className="fa-solid fa-pen text-xs"></i></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAdminFlashSales = () => (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic uppercase">Flash Sale Events</h2>
        <button onClick={() => showToast("Flash sale manager loading...")} className="bg-red-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-red-600 transition">+ Ignite Sale</button>
      </div>
      {flashSales.map(s => (
        <div key={s.id} className="bg-black text-white p-10 rounded-[48px] relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px]"></div>
           <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start">
                 <div>
                    <span className="text-[10px] font-black bg-red-500 text-white px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block animate-pulse">Live Now</span>
                    <h3 className="text-4xl font-[900] italic uppercase tracking-tighter">{s.title}</h3>
                 </div>
                 <button className="text-[10px] font-black uppercase tracking-widest border border-white/20 px-6 py-3 rounded-2xl hover:bg-white/10 transition">Terminate Early</button>
              </div>
              <div className="grid grid-cols-4 gap-4 max-w-md">
                 {['Days', 'Hours', 'Mins', 'Secs'].map(unit => (
                    <div key={unit} className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
                       <p className="text-2xl font-black tracking-tighter">00</p>
                       <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{unit}</p>
                    </div>
                 ))}
              </div>
              <div className="pt-4 border-t border-white/10">
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Assigned Digital Assets (12)</p>
                 <div className="flex -space-x-4">
                    {products.slice(0, 5).map(p => <img key={p.id} src={p.image} className="w-12 h-12 rounded-full border-4 border-black object-cover" />)}
                 </div>
              </div>
           </div>
        </div>
      ))}
    </div>
  );

  const renderAdminCategories = () => (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Collection Taxonomy</h2>
        <button onClick={handleAddCategory} className="bg-black text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition">+ Add Category</button>
      </div>
      <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-gray-100">
        <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {storeCategories.map(cat => (
            <div key={cat} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between group hover:bg-white hover:border-black transition duration-300">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-gray-100 shadow-sm text-gray-300 group-hover:text-black transition">
                     <i className="fa-solid fa-folder-open"></i>
                  </div>
                  <span className="font-black text-sm uppercase tracking-tight italic">{cat}</span>
               </div>
               <button onClick={() => handleRemoveCategory(cat)} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 transition">
                  <i className="fa-solid fa-trash-can text-xs"></i>
               </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAdminPromotions = () => (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Marketing Promos</h2>
        <button onClick={() => {
          setNewPromoForm({ title: '', content: '', type: 'banner' });
          setShowPromoModal(true);
        }} className="bg-black text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition">+ New Campaign</button>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {promotions.map(p => (
          <div key={p.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex items-center justify-between group hover:border-black transition duration-300">
             <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                   <i className={`fa-solid ${p.type === 'banner' ? 'fa-window-maximize' : 'fa-rectangle-ad'} text-xl`}></i>
                </div>
                <div>
                   <p className="font-black text-sm uppercase tracking-tight">{p.title}</p>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 truncate max-w-md">{p.content}</p>
                </div>
             </div>
             <div className="flex items-center gap-6">
                <button 
                  onClick={() => handleTogglePromotion(p.id)}
                  className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition ${p.status === 'Active' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-red-50 border-red-100 text-red-500'}`}
                >
                  {p.status}
                </button>
                <button onClick={() => {
                  setPromotions(promotions.filter(item => item.id !== p.id));
                  showToast("Promotion deleted");
                }} className="text-gray-300 hover:text-red-500 transition p-2">
                  <i className="fa-solid fa-trash-can"></i>
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOrderDetailUI = (order: Order, isAdmin: boolean = false) => (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => isAdmin ? setAdminViewingOrder(null) : setCurrentRoute(AppRoute.PROFILE)} 
          className="text-gray-400 text-xs font-black uppercase flex items-center gap-2 hover:text-black transition"
        >
          <i className="fa-solid fa-arrow-left"></i> Back to list
        </button>
        {isAdmin && (
          <div className="flex gap-4">
            <select 
              value={order.status} 
              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
              className="bg-white border rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-black"
            >
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-10 pb-6 border-b border-gray-50">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Transaction Receipt</p>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">{order.orderNumber}</h2>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{order.date}</p>
                  <p className="text-sm font-black text-emerald-500 uppercase tracking-widest">{order.status}</p>
               </div>
            </div>

            <div className="space-y-6">
               {order.items.map((item, idx) => (
                 <div key={idx} className="flex gap-6 pb-6 border-b border-gray-50 last:border-0">
                    <img src={item.image} className="w-20 h-20 rounded-2xl object-cover" />
                    <div className="flex-1">
                       <h3 className="font-black text-sm uppercase mb-1">{item.name}</h3>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">
                         {Object.entries(item.selectedOptions || {}).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                       </p>
                       
                       {item.uploadedImages && item.uploadedImages.length > 0 && (
                          <div className="flex gap-2 mb-3">
                            {item.uploadedImages.map((img, i) => (
                              <img 
                                key={i} 
                                src={img} 
                                className="w-12 h-12 rounded-lg object-cover border border-gray-100 cursor-pointer hover:opacity-80" 
                                onClick={() => setViewingCustomImage(img)}
                              />
                            ))}
                          </div>
                       )}

                       <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-gray-500">Qty: {item.quantity}</p>
                          <p className="font-black text-sm">₹{item.price * item.quantity}</p>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
          
          {order.paymentDetails?.screenshot && (
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
               <h3 className="text-xs font-black uppercase tracking-widest mb-6">Payment Confirmation</h3>
               <img 
                 src={order.paymentDetails.screenshot} 
                 className="w-full h-auto rounded-3xl cursor-pointer hover:opacity-90 transition" 
                 onClick={() => setShowProofModal(order.paymentDetails?.screenshot || null)} 
               />
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-widest mb-6">Delivery details</h3>
            <div className="space-y-4">
               <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">CONSIGNEE</p>
                  <p className="text-sm font-black uppercase tracking-tight">{order.customerName}</p>
               </div>
               <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">PHONE</p>
                  <p className="text-sm font-black uppercase tracking-tight">{order.phone}</p>
               </div>
               <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">ADDRESS</p>
                  <p className="text-xs font-bold text-gray-500 leading-relaxed uppercase">{order.address}</p>
               </div>
            </div>
          </div>

          <div className="bg-black text-white p-10 rounded-[40px] shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 opacity-40">Financial Summary</h3>
            <div className="space-y-4">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                  <span>Subtotal</span>
                  <span>₹{order.total - order.shipping}</span>
               </div>
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                  <span>Logistics</span>
                  <span>₹{order.shipping}</span>
               </div>
               <div className="flex justify-between text-2xl font-black italic tracking-tighter pt-4 border-t border-white/10 uppercase">
                  <span>Total</span>
                  <span>₹{order.total}</span>
               </div>
            </div>
            {order.status !== 'cancelled' && order.status !== 'delivered' && !isAdmin && (
              <button 
                onClick={() => handleCancelOrder(order.id)}
                className="w-full mt-10 py-4 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:border-red-500 transition duration-300"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminCustomers = () => (
    <div className="animate-fade-in space-y-8">
      <h2 className="text-3xl font-black italic uppercase tracking-tighter">Customer Directory</h2>
      <div className="bg-white rounded-[48px] overflow-hidden shadow-2xl border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-[#FBFBFB] border-b border-gray-100">
            <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <th className="p-10">Customer Info</th>
              <th className="p-10">Contact Path</th>
              <th className="p-10 text-right">Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {Object.keys(usersDb).map(userId => {
              const user = usersDb[userId].profile;
              return (
                <tr key={userId} className="hover:bg-gray-50/50 transition">
                  <td className="p-10">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-black text-lg shadow-lg">
                          {user.name?.charAt(0) || 'U'}
                       </div>
                       <div>
                          <p className="font-black text-base uppercase tracking-tight text-black">{user.name || 'Anonymous'}</p>
                          <p className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.2em]">{user.userType || 'MEMBER'}</p>
                       </div>
                    </div>
                  </td>
                  <td className="p-10">
                    <p className="text-xs font-bold text-gray-500 lowercase">{user.email}</p>
                    <p className="text-[10px] font-black text-black mt-1 uppercase tracking-widest">{user.phone}</p>
                  </td>
                  <td className="p-10 text-right">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-gray-100 px-4 py-1.5 rounded-full text-gray-400">View History</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAdminSettings = () => (
    <div className="animate-fade-in space-y-12">
      <h2 className="text-3xl font-black italic uppercase tracking-tighter">System Parameters</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
           <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Global Configuration</h3>
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400">SITE IDENTIFIER</label>
                 <input type="text" value={settings.siteName} onChange={(e) => setSettings({...settings, siteName: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none border border-transparent focus:border-black transition" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400">SUPPORT ALIAS (EMAIL)</label>
                 <input type="email" value={settings.contactEmail} onChange={(e) => setSettings({...settings, contactEmail: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none border border-transparent focus:border-black transition" />
              </div>
           </div>
        </div>
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
           <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Regional & Locale</h3>
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400">DEFAULT CURRENCY</label>
                 <select value={settings.currency} onChange={(e) => setSettings({...settings, currency: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none border border-transparent focus:border-black transition">
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400">TIMEZONE (GMT)</label>
                 <input type="text" value="+5:30" disabled className="w-full bg-gray-100 p-4 rounded-xl font-bold outline-none cursor-not-allowed opacity-50" />
              </div>
           </div>
        </div>
      </div>
      <button onClick={() => showToast("Site parameters synchronized")} className="w-full bg-black text-white py-6 rounded-[28px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.01] transition duration-300">Synchronize Settings</button>
    </div>
  );

  const renderAdminShippingTax = () => (
    <div className="animate-fade-in space-y-12">
      <h2 className="text-2xl font-black italic uppercase">Logistics & Compliance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
           <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Shipping Rules</h3>
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400">BASE DELIVERY FEE (₹)</label>
                 <input type="number" value={settings.shippingFee} onChange={(e) => setSettings({...settings, shippingFee: Number(e.target.value)})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400">FREE SHIPPING MINIMUM (₹)</label>
                 <input type="number" value={settings.freeShippingThreshold} onChange={(e) => setSettings({...settings, freeShippingThreshold: Number(e.target.value)})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none" />
              </div>
           </div>
        </div>
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
           <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Financial Compliance</h3>
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400">GST / VAT RATE (%)</label>
                 <input type="number" value={settings.taxRate} onChange={(e) => setSettings({...settings, taxRate: Number(e.target.value)})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400">CURRENCY SYMBOL</label>
                 <input type="text" value={settings.currency} onChange={(e) => setSettings({...settings, currency: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none" />
              </div>
           </div>
        </div>
      </div>
      <button onClick={() => showToast("Logistics database updated")} className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-[1.01] transition">Confirm Rules</button>
    </div>
  );

  const renderAdminSegments = () => (
    <div className="animate-fade-in space-y-8">
      <h2 className="text-2xl font-black italic uppercase">Customer Segments</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'High Value', count: 12, color: 'emerald' },
           { label: 'Cart Abandoners', count: 45, color: 'orange' },
           { label: 'New Signups', count: 89, color: 'blue' }
         ].map(s => (
           <div key={s.label} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{s.label}</p>
                <p className="text-3xl font-black">{s.count}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl bg-${s.color}-50 flex items-center justify-center text-${s.color}-500`}>
                 <i className="fa-solid fa-users-viewfinder"></i>
              </div>
           </div>
         ))}
      </div>
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
         <h3 className="text-xs font-black uppercase tracking-widest mb-6">Segmentation Breakdown</h3>
         <div className="space-y-6">
            <div className="flex items-center gap-4">
               <div className="flex-1 h-3 bg-gray-50 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-400 w-[40%]"></div>
                  <div className="h-full bg-orange-400 w-[25%]"></div>
                  <div className="h-full bg-blue-400 w-[35%]"></div>
               </div>
            </div>
            <div className="flex gap-8">
               <div className="flex items-center gap-2 text-[10px] font-black uppercase"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Loyalists</div>
               <div className="flex items-center gap-2 text-[10px] font-black uppercase"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Prospects</div>
               <div className="flex items-center gap-2 text-[10px] font-black uppercase"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Passives</div>
            </div>
         </div>
      </div>
    </div>
  );

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
            <i className="fa-solid fa-wand-magic-sparkles text-5_5xl mb-4"></i>
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

  const renderCheckout = () => (
    <div className="p-6 bg-gray-50 min-h-screen pb-32 animate-slide-up">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex items-center justify-center gap-10">
           {['details', 'review', 'payment'].map((step, i) => (
             <div key={step} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest border-2 transition ${checkoutStep === step ? 'bg-black text-white border-black scale-110' : i < ['details', 'review', 'payment'].indexOf(checkoutStep) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-300 border-gray-100'}`}>
                   {i < ['details', 'review', 'payment'].indexOf(checkoutStep) ? <i className="fa-solid fa-check"></i> : i + 1}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${checkoutStep === step ? 'text-black' : 'text-gray-300'}`}>{step}</span>
             </div>
           ))}
        </div>

        {checkoutStep === 'details' && (
          <div className="bg-white p-10 rounded-[48px] shadow-2xl space-y-8 animate-fade-in">
             <h2 className="text-2xl font-black italic uppercase tracking-tighter">Shipping Information</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                   <input type="text" value={userAddress.name} onChange={(e) => setUserAddress({...userAddress, name: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none border border-transparent focus:border-black transition" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                   <input type="tel" value={userAddress.phone} onChange={(e) => setUserAddress({...userAddress, phone: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none border border-transparent focus:border-black transition" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shipping Address</label>
                <textarea rows={3} value={userAddress.line} onChange={(e) => setUserAddress({...userAddress, line: e.target.value})} placeholder="House No, Street, City, Pincode, State" className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none border border-transparent focus:border-black transition" />
             </div>
             <button onClick={() => { if(!userAddress.name || !userAddress.phone || !userAddress.line) { showToast("Complete all details"); return; } setCheckoutStep('review'); }} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.01] transition">Continue to Review</button>
          </div>
        )}

        {checkoutStep === 'review' && (
          <div className="bg-white p-10 rounded-[48px] shadow-2xl space-y-8 animate-fade-in">
             <h2 className="text-2xl font-black italic uppercase tracking-tighter">Review Order</h2>
             <div className="space-y-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0">
                     <div className="flex gap-4">
                        <img src={item.image} className="w-12 h-12 rounded-xl object-cover" />
                        <div><p className="font-black text-xs uppercase">{item.name}</p><p className="text-[9px] text-gray-400 font-bold">Qty: {item.quantity}</p></div>
                     </div>
                     <p className="font-black text-sm">₹{item.price * item.quantity}</p>
                  </div>
                ))}
             </div>
             <div className="pt-6 border-t border-gray-50 space-y-4">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase"><span>Subtotal</span><span>₹{cartTotal}</span></div>
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase"><span>Shipping</span><span>₹{settings.shippingFee}</span></div>
                <div className="flex justify-between text-2xl font-black italic uppercase tracking-tighter pt-4"><span>Total Amount</span><span>₹{cartTotal + settings.shippingFee}</span></div>
             </div>
             <div className="flex gap-4 pt-4">
                <button onClick={() => setCheckoutStep('details')} className="flex-1 py-4 font-black uppercase text-[10px] tracking-widest border border-gray-100 rounded-2xl hover:bg-gray-50 transition">Modify details</button>
                <button onClick={() => setCheckoutStep('payment')} className="flex-1 bg-black text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.01] transition">Proceed to Payment</button>
             </div>
          </div>
        )}

        {checkoutStep === 'payment' && (
          <div className="bg-white p-10 rounded-[48px] shadow-2xl space-y-10 animate-fade-in">
             <div className="text-center space-y-2">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Secure Payment</h2>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">End-to-End Encrypted Transaction</p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setCheckoutPaymentMethod('upi')} className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all duration-300 ${checkoutPaymentMethod === 'upi' ? 'bg-black text-white border-black shadow-xl scale-105' : 'bg-gray-50 border-transparent text-gray-400'}`}>
                   <i className="fa-solid fa-mobile-screen-button text-2xl"></i>
                   <span className="text-[10px] font-black uppercase tracking-widest">UPI Payment</span>
                </button>
                <button onClick={() => setCheckoutPaymentMethod('cod')} className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all duration-300 ${checkoutPaymentMethod === 'cod' ? 'bg-black text-white border-black shadow-xl scale-105' : 'bg-gray-50 border-transparent text-gray-400'}`}>
                   <i className="fa-solid fa-hand-holding-dollar text-2xl"></i>
                   <span className="text-[10px] font-black uppercase tracking-widest">Cash on Delivery</span>
                </button>
             </div>

             {checkoutPaymentMethod === 'upi' && (
               <div className="space-y-8 p-8 bg-gray-50 rounded-[40px] border border-gray-100 animate-fade-in">
                  <div className="text-center space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total payable amount</p>
                     <p className="text-5xl font-black italic tracking-tighter">₹{cartTotal + settings.shippingFee}</p>
                     <button onClick={triggerUpiPay} className="bg-[#1a1614] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition flex items-center gap-3 mx-auto">
                        <i className="fa-solid fa-paper-plane text-xs"></i> Open Payment App
                     </button>
                  </div>
                  
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center mb-6">Upload Transaction Proof</p>
                     <div className="relative group">
                        <input type="file" accept="image/*" onChange={handleScreenshotUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className={`w-full h-40 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition ${paymentScreenshot ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200 group-hover:border-black'}`}>
                           {paymentScreenshot ? (
                             <div className="flex flex-col items-center gap-2">
                                <i className="fa-solid fa-circle-check text-emerald-500 text-2xl"></i>
                                <p className="text-[10px] font-black uppercase text-emerald-600">Proof Captured</p>
                             </div>
                           ) : (
                             <>
                                <i className="fa-solid fa-cloud-arrow-up text-gray-300 text-2xl"></i>
                                <p className="text-[10px] font-black uppercase text-gray-400">Select Image From Gallery</p>
                             </>
                           )}
                        </div>
                     </div>
                     <label className="flex items-center gap-4 p-4 cursor-pointer">
                        <input type="checkbox" checked={isPaymentConfirmed} onChange={(e) => setIsPaymentConfirmed(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">I confirm that I have transferred the amount</span>
                     </label>
                  </div>
               </div>
             )}

             <button 
                onClick={finalCheckout}
                className="w-full bg-black text-white py-6 rounded-[32px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:scale-[1.01] transition duration-300"
              >
                Place Final Order
             </button>
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

  return (
    <>
      {currentRoute.startsWith('admin') ? (
        <AdminLayout onNavigate={setCurrentRoute} currentRoute={currentRoute}>
            {currentRoute === AppRoute.ADMIN_DASHBOARD && (
              <div className="animate-fade-in space-y-8 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-[#1a1614] rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-10">
                        <div>
                          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-1">Systems Overview</h2>
                          <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Real-time performance monitoring</p>
                        </div>
                        <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-md">
                           <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">System Healthy</p>
                        </div>
                      </div>
                      <div className="h-40 w-full relative mb-6">
                        <svg viewBox="0 0 100 20" className="w-full h-full">
                          <path d="M0,15 Q10,12 20,16 T40,10 T60,14 T80,5 T100,12" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                          <path d="M0,18 Q15,10 30,15 T60,8 T90,14 T100,5" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" className="drop-shadow-2xl" />
                        </svg>
                        <div className="absolute bottom-0 left-0 w-full flex justify-between text-[8px] font-black uppercase tracking-widest text-white/30 pt-4">
                           <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>
                      </div>
                      <div className="mt-6 flex items-start gap-4 p-5 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                        <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 flex items-center justify-center text-yellow-400">
                          <i className="fa-solid fa-wand-magic-sparkles text-sm"></i>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">AI Intelligence Insight</p>
                            <p className="text-sm font-medium leading-relaxed italic text-white/80">"{aiAnalysis}"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm flex flex-col justify-between">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory Status</p>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">Stock Health</h3>
                     </div>
                     <div className="space-y-6 my-8">
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Healthy</span>
                           <span className="text-sm font-black">{products.filter(p => (p.stock || 0) >= 20).length}</span>
                        </div>
                        <div className="flex justify-between items-center text-orange-500">
                           <span className="text-xs font-bold uppercase tracking-widest">Low Stock</span>
                           <span className="text-sm font-black">{products.filter(p => (p.stock || 0) < 20 && (p.stock || 0) > 0).length}</span>
                        </div>
                        <div className="flex justify-between items-center text-red-500">
                           <span className="text-xs font-bold uppercase tracking-widest">Out of Stock</span>
                           <span className="text-sm font-black">{products.filter(p => (p.stock || 0) === 0).length}</span>
                        </div>
                     </div>
                     <button onClick={() => setCurrentRoute(AppRoute.ADMIN_PRODUCTS)} className="w-full bg-gray-50 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition">Manage Catalog</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   {[
                     { label: 'Today Revenue', val: `₹${orders.filter(o => o.status !== 'cancelled' && o.date === new Date().toLocaleDateString()).reduce((acc, o) => acc + o.total, 0)}`, icon: 'fa-indian-rupee-sign', color: 'text-emerald-500' },
                     { label: 'Active Orders', val: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length, icon: 'fa-box', color: 'text-blue-500' },
                     { label: 'Inventory Items', val: products.length, icon: 'fa-cube', color: 'text-purple-500' },
                     { label: 'Total Customers', val: Object.keys(usersDb).length, icon: 'fa-users', color: 'text-orange-500' }
                   ].map((stat, i) => (
                     <div key={i} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 group hover:border-black transition duration-300">
                        <div className="flex justify-between items-start mb-4">
                           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-gray-50 ${stat.color}`}>
                              <i className={`fa-solid ${stat.icon} text-sm`}></i>
                           </div>
                        </div>
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">{stat.label}</p>
                        <p className="text-3xl font-[900] tracking-tighter uppercase italic">{stat.val}</p>
                     </div>
                   ))}
                </div>
              </div>
            )}
            {currentRoute === AppRoute.ADMIN_PRODUCTS && (
              <div className="animate-fade-in pb-20">
                 <div className="flex justify-between items-center mb-10">
                    <div>
                      <h2 className="text-3xl font-black italic uppercase tracking-tighter">Inventory Control</h2>
                    </div>
                    <button onClick={() => { setEditingProduct({ id: Date.now().toString(), name: '', price: 0, category: storeCategories[0], image: '', stock: 100, description: '', options: [], allowCustomImages: true }); setShowProductModal(true); }} className="bg-[#1a1614] text-white px-10 py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:scale-105 hover:bg-black transition duration-300">+ Add New Asset</button>
                 </div>
                 <div className="bg-white rounded-[48px] overflow-hidden shadow-2xl border border-gray-100">
                    <table className="w-full text-left">
                       <thead className="bg-[#FBFBFB] border-b border-gray-100">
                          <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <th className="p-10">Asset Details</th>
                            <th className="p-10">Category</th>
                            <th className="p-10">Market Value</th>
                            <th className="p-10 text-right">Operations</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {products.map(p => (
                             <tr key={p.id} className="hover:bg-gray-50/50 transition duration-300 group">
                                <td className="p-10 flex items-center gap-6">
                                   <div className="w-16 h-16 rounded-[20px] overflow-hidden bg-gray-50 border border-gray-100 shadow-sm relative">
                                      <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                   </div>
                                   <div>
                                      <p className="font-black text-base uppercase tracking-tight text-black leading-none mb-1">{p.name}</p>
                                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">ID: {p.id.slice(0,8)}</p>
                                   </div>
                                </td>
                                <td className="p-10"><span className="text-[10px] font-black uppercase px-4 py-1.5 bg-gray-100 rounded-xl text-gray-600 tracking-widest">{p.category}</span></td>
                                <td className="p-10 font-black text-sm text-black">₹{p.price}</td>
                                <td className="p-10 text-right">
                                   <button onClick={() => { setEditingProduct(p); setShowProductModal(true); }} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-300 hover:bg-black hover:text-white transition duration-300"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                                </td>
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
                       <div className="mb-10">
                          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Order Ledger</h2>
                       </div>
                       <div className="bg-white rounded-[48px] overflow-hidden shadow-2xl border border-gray-100">
                          <table className="w-full text-left">
                             <thead className="bg-[#FBFBFB] border-b">
                                <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                   <th className="p-10">Reference</th>
                                   <th className="p-10">Consignee</th>
                                   <th className="p-10">Status</th>
                                   <th className="p-10 text-right">Execution</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-50">
                                {orders.map(o => (
                                   <tr key={o.id} className="hover:bg-gray-50/50 transition cursor-pointer group" onClick={() => setAdminViewingOrder(o)}>
                                      <td className="p-10">
                                         <p className="font-black text-base italic uppercase tracking-tighter text-black">{o.orderNumber}</p>
                                         <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-widest">{o.date}</p>
                                      </td>
                                      <td className="p-10"><p className="font-black text-sm uppercase tracking-tight text-black">{o.customerName}</p></td>
                                      <td className="p-10">
                                         <span className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                            o.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                            o.status === 'cancelled' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                            'bg-gray-50 text-gray-500 border border-gray-100'
                                         }`}>
                                            {o.status}
                                         </span>
                                      </td>
                                      <td className="p-10 text-right">
                                         <button className="bg-[#1a1614] text-white w-10 h-10 rounded-xl flex items-center justify-center hover:scale-110 transition duration-300 shadow-lg"><i className="fa-solid fa-chevron-right text-[10px]"></i></button>
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
            {currentRoute === AppRoute.ADMIN_SUPPORT && renderAdminSupport()}
            {currentRoute === AppRoute.ADMIN_DISCOUNTS && renderAdminDiscounts()}
            {currentRoute === AppRoute.ADMIN_FAQ && renderAdminFAQ()}
            {currentRoute === AppRoute.ADMIN_NEWSLETTER && renderAdminNewsletter()}
            {currentRoute === AppRoute.ADMIN_SHIPPING && renderAdminShippingTax()}
            {currentRoute === AppRoute.ADMIN_TAX && renderAdminShippingTax()}
            {currentRoute === AppRoute.ADMIN_SEGMENTS && renderAdminSegments()}
            {currentRoute === AppRoute.ADMIN_CHAT && renderAdminChat()}
            {currentRoute === AppRoute.ADMIN_LAYOUT && renderAdminLayoutSettings()}
            {currentRoute === AppRoute.ADMIN_THEME && renderAdminTheme()}
            {currentRoute === AppRoute.ADMIN_EMAIL_TEMPLATES && renderAdminEmailTemplates()}
            {currentRoute === AppRoute.ADMIN_BLOG && renderAdminBlog()}
            {currentRoute === AppRoute.ADMIN_PAGES && renderAdminPages()}
            {currentRoute === AppRoute.ADMIN_FLASH_SALES && renderAdminFlashSales()}
            {/* Fallback for other routes */}
            {![AppRoute.ADMIN_DASHBOARD, AppRoute.ADMIN_PRODUCTS, AppRoute.ADMIN_ORDERS, AppRoute.ADMIN_CATEGORIES, AppRoute.ADMIN_CUSTOMERS, AppRoute.ADMIN_SITE_SETTINGS, AppRoute.ADMIN_POPUPS, AppRoute.ADMIN_SUPPORT, AppRoute.ADMIN_DISCOUNTS, AppRoute.ADMIN_FAQ, AppRoute.ADMIN_NEWSLETTER, AppRoute.ADMIN_SHIPPING, AppRoute.ADMIN_TAX, AppRoute.ADMIN_SEGMENTS, AppRoute.ADMIN_CHAT, AppRoute.ADMIN_LAYOUT, AppRoute.ADMIN_THEME, AppRoute.ADMIN_EMAIL_TEMPLATES, AppRoute.ADMIN_BLOG, AppRoute.ADMIN_PAGES, AppRoute.ADMIN_FLASH_SALES].includes(currentRoute) && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 text-3xl mb-4"><i className="fa-solid fa-toolbox"></i></div>
                 <h2 className="text-xl font-black uppercase italic tracking-tighter">Under Finalization</h2>
                 <p className="text-xs font-bold text-gray-400 mt-2">The system is calibrating this module for production.</p>
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
                    <h1 className="text-5_5xl font-[900] italic uppercase tracking-tighter leading-tight max-w-[250px]">{selectedProduct.name}</h1>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black">₹{selectedProduct.price}</p>
                    {selectedProduct.oldPrice && <p className="text-sm text-gray-400 line-through">₹{selectedProduct.oldPrice}</p>}
                  </div>
                </div>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{selectedProduct.description}</p>
                
                {/* Variant Options UI */}
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

                {/* FIX: Restored the Custom Image Upload UI for storefront */}
                {selectedProduct.allowCustomImages && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Upload Custom Designs</p>
                    <div className="grid grid-cols-4 gap-4">
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="aspect-square rounded-xl overflow-hidden relative group border border-gray-100 shadow-sm">
                          <img src={img} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition shadow-lg"
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      ))}
                      {uploadedImages.length < 4 && (
                        <label className="aspect-square rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-black transition group">
                          <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              // Fixed: Explicitly handle FileList to prevent 'unknown' type inference on file iteration
                              if (e.target.files) {
                                Array.from(e.target.files).forEach(file => {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setUploadedImages(prev => [...prev, reader.result as string].slice(0, 4));
                                  };
                                  reader.readAsDataURL(file);
                                });
                              }
                            }}
                          />
                          <i className="fa-solid fa-plus text-gray-300 group-hover:text-black transition"></i>
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1 text-center">Add Image</span>
                        </label>
                      )}
                    </div>
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

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl space-y-6 animate-slide-up">
            <h2 className="text-2xl font-[900] italic uppercase tracking-tighter">NEW CATEGORY</h2>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">CATEGORY NAME</label>
               <input 
                 type="text" 
                 value={newCategoryName}
                 onChange={(e) => setNewCategoryName(e.target.value)}
                 className="w-full bg-gray-50 p-5 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-black transition" 
                 placeholder="e.g. Hoodies"
               />
            </div>
            <div className="flex gap-4 pt-4">
               <button onClick={() => setShowCategoryModal(false)} className="flex-1 py-4 font-bold uppercase text-xs border border-gray-100 rounded-2xl hover:bg-gray-50 transition">Cancel</button>
               <button onClick={confirmAddCategory} className="flex-1 bg-black text-white py-4 font-[900] uppercase text-xs rounded-2xl shadow-xl hover:scale-[1.02] transition">Create</button>
            </div>
          </div>
        </div>
      )}

      {showPromoModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl space-y-6 animate-slide-up">
            <h2 className="text-2xl font-[900] italic uppercase tracking-tighter">NEW CAMPAIGN</h2>
            <div className="space-y-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">TITLE</label>
                 <input type="text" value={newPromoForm.title} onChange={(e) => setNewPromoForm({...newPromoForm, title: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">CONTENT</label>
                 <textarea value={newPromoForm.content} onChange={(e) => setNewPromoForm({...newPromoForm, content: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none" rows={3} />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">TYPE</label>
                 <select value={newPromoForm.type} onChange={(e) => setNewPromoForm({...newPromoForm, type: e.target.value as any})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none">
                    <option value="banner">Banner (Top Bar)</option>
                    <option value="popup">Popup (Modal)</option>
                 </select>
               </div>
            </div>
            <div className="flex gap-4 pt-4">
               <button onClick={() => setShowPromoModal(false)} className="flex-1 py-4 font-bold uppercase text-xs border border-gray-100 rounded-2xl hover:bg-gray-50 transition">Cancel</button>
               <button onClick={confirmAddPromotion} className="flex-1 bg-black text-white py-4 font-[900] uppercase text-xs rounded-2xl shadow-xl hover:scale-[1.02] transition">Launch</button>
            </div>
          </div>
        </div>
      )}

      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl space-y-6 animate-slide-up">
            <h2 className="text-2xl font-[900] italic uppercase tracking-tighter">NEW COUPON</h2>
            <div className="space-y-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">CODE</label>
                 <input type="text" value={newDiscountForm.code} onChange={(e) => setNewDiscountForm({...newDiscountForm, code: e.target.value.toUpperCase()})} className="w-full bg-gray-50 p-4 rounded-xl font-black text-lg outline-none uppercase tracking-widest" placeholder="SALE2025" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">TYPE</label>
                   <select value={newDiscountForm.type} onChange={(e) => setNewDiscountForm({...newDiscountForm, type: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none">
                      <option value="Percentage">Percentage (%)</option>
                      <option value="Flat">Flat Amount (₹)</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">VALUE</label>
                   <input type="number" value={newDiscountForm.value} onChange={(e) => setNewDiscountForm({...newDiscountForm, value: Number(e.target.value)})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none" />
                 </div>
               </div>
            </div>
            <div className="flex gap-4 pt-4">
               <button onClick={() => setShowDiscountModal(false)} className="flex-1 py-4 font-bold uppercase text-xs border border-gray-100 rounded-2xl hover:bg-gray-50 transition">Cancel</button>
               <button onClick={confirmAddDiscount} className="flex-1 bg-black text-white py-4 font-[900] uppercase text-xs rounded-2xl shadow-xl hover:scale-[1.02] transition">Create Coupon</button>
            </div>
          </div>
        </div>
      )}

      {showFaqModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl space-y-6 animate-slide-up">
            <h2 className="text-2xl font-[900] italic uppercase tracking-tighter">ADD FAQ</h2>
            <div className="space-y-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">QUESTION</label>
                 <input type="text" value={newFaqForm.q} onChange={(e) => setNewFaqForm({...newFaqForm, q: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">ANSWER</label>
                 <textarea value={newFaqForm.a} onChange={(e) => setNewFaqForm({...newFaqForm, a: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none" rows={4} />
               </div>
            </div>
            <div className="flex gap-4 pt-4">
               <button onClick={() => setShowFaqModal(false)} className="flex-1 py-4 font-bold uppercase text-xs border border-gray-100 rounded-2xl hover:bg-gray-50 transition">Cancel</button>
               <button onClick={confirmAddFaq} className="flex-1 bg-black text-white py-4 font-[900] uppercase text-xs rounded-2xl shadow-xl hover:scale-[1.02] transition">Add Entry</button>
            </div>
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-[900] italic uppercase tracking-tighter">EDIT PRODUCT</h2>
                <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-black transition">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>

              {/* Product Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">PRODUCT NAME</label>
                <input 
                  type="text" 
                  value={editingProduct?.name || ''} 
                  onChange={(e) => setEditingProduct(p => p ? ({...p, name: e.target.value}) : null)} 
                  className="w-full bg-[#F8F9FA] p-5 rounded-2xl font-bold outline-none border-none transition" 
                />
              </div>

              {/* Price Row */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">PRICE (₹)</label>
                  <input 
                    type="number" 
                    value={editingProduct?.price || ''} 
                    onChange={(e) => setEditingProduct(p => p ? ({...p, price: Number(e.target.value)}) : null)} 
                    className="w-full bg-[#F8F9FA] p-5 rounded-2xl font-bold outline-none border-none transition" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">OLD PRICE (OPTIONAL)</label>
                  <input 
                    type="number" 
                    value={editingProduct?.oldPrice || ''} 
                    onChange={(e) => setEditingProduct(p => p ? ({...p, oldPrice: Number(e.target.value)}) : null)} 
                    className="w-full bg-[#F8F9FA] p-5 rounded-2xl font-bold outline-none border-none transition" 
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">CATEGORY</label>
                <select 
                  value={editingProduct?.category || ''} 
                  onChange={(e) => setEditingProduct(p => p ? ({...p, category: e.target.value}) : null)}
                  className="w-full bg-[#F8F9FA] p-5 rounded-2xl font-bold outline-none border-none transition appearance-none cursor-pointer"
                >
                  {storeCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">DESCRIPTION</label>
                <div className="relative">
                  <textarea 
                    value={editingProduct?.description || ''} 
                    onChange={(e) => setEditingProduct(p => p ? ({...p, description: e.target.value}) : null)} 
                    className="w-full bg-[#F8F9FA] p-5 rounded-3xl font-bold border-none outline-none min-h-[160px] transition text-sm leading-relaxed no-scrollbar" 
                  />
                  <button 
                    onClick={handleGenerateAIDesc} 
                    disabled={isGeneratingDesc} 
                    className="absolute right-4 bottom-4 bg-black text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition flex items-center gap-2 disabled:opacity-50 shadow-xl"
                  >
                    {isGeneratingDesc ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>} 
                    AI WRITE
                  </button>
                </div>
              </div>

              {/* Image Input & Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">IMAGE</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={editingProduct?.image || ''} 
                    onChange={(e) => setEditingProduct(p => p ? ({...p, image: e.target.value}) : null)} 
                    placeholder="https://..."
                    className="flex-1 bg-[#F8F9FA] p-5 rounded-2xl font-bold border-none outline-none transition" 
                  />
                  <label className="w-16 h-[60px] bg-[#F8F9FA] rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-100 transition">
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <i className="fa-solid fa-upload text-gray-400"></i>
                  </label>
                </div>
              </div>

              {/* AI Image Generation Section */}
              <div className="p-6 rounded-[32px] border-2 border-dashed border-gray-100 space-y-4">
                <div className="flex gap-4 items-center">
                  <input 
                    type="text" 
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe image for AI generation..."
                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-gray-300"
                  />
                  <button 
                    onClick={handleAIGenerateImage}
                    disabled={isGeneratingImg}
                    className="bg-black text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition shadow-lg disabled:opacity-50"
                  >
                    {isGeneratingImg ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Generate'}
                  </button>
                </div>
              </div>

              {/* Variant Option Section */}
              <div className="space-y-4 pt-4 border-t border-gray-50">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Product Variants</h3>
                  <button 
                    onClick={addOption}
                    className="text-[10px] font-black uppercase text-blue-500 tracking-widest hover:opacity-70"
                  >
                    + Add Option
                  </button>
                </div>
                {editingProduct?.options?.map((opt, idx) => (
                  <div key={idx} className="bg-[#F8F9FA] p-6 rounded-3xl space-y-4 relative group">
                    <button 
                      onClick={() => removeOption(idx)}
                      className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Option Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Size"
                          value={opt.name}
                          onChange={(e) => updateOptionName(idx, e.target.value)}
                          className="w-full bg-white px-4 py-3 rounded-xl font-bold text-xs border border-transparent focus:border-black outline-none transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Values (Comma Separated)</label>
                        <input 
                          type="text" 
                          placeholder="S, M, L, XL"
                          value={opt.values.join(', ')}
                          onChange={(e) => updateOptionValues(idx, e.target.value)}
                          className="w-full bg-white px-4 py-3 rounded-xl font-bold text-xs border border-transparent focus:border-black outline-none transition"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-6 pt-10 sticky bottom-0 bg-white pb-2 z-20">
                 <button 
                    onClick={() => setShowProductModal(false)} 
                    className="flex-1 py-5 font-[900] uppercase text-[12px] border-2 border-gray-100 rounded-3xl hover:bg-gray-50 transition tracking-widest text-black"
                  >
                    CANCEL
                  </button>
                 <button 
                    onClick={() => { 
                      setProducts(prev => prev.some(p => p.id === editingProduct?.id) ? prev.map(p => p.id === editingProduct?.id ? editingProduct! : p) : [...prev, editingProduct!]); 
                      setShowProductModal(false); 
                      showToast("Inventory synchronized"); 
                    }} 
                    className="flex-1 bg-black text-white py-5 font-[900] uppercase text-[12px] rounded-3xl shadow-2xl hover:scale-[1.02] transition tracking-[0.1em]"
                  >
                    SAVE PRODUCT
                  </button>
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
