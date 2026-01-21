import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppRoute, Product, CartItem, Order, ProductOption, Promotion, Review } from './types';
import { INITIAL_PRODUCTS, CATEGORIES } from './constants';
import StorefrontLayout from './components/StorefrontLayout';
import AdminLayout from './components/AdminLayout';
import AIChatBubble from './components/AIChatBubble';
import { generateProductDescription, analyzeSalesTrends, generateMarketingEmail, generateProductImage } from './services/geminiService';

const ADMIN_EMAIL = 'shourya@fyx.com';

// Interface for User Data Persistence
interface UserData {
  profile: any;
  cart: CartItem[];
  wishlist: string[];
}

const App: React.FC = () => {
  // --- Core State ---
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.STORE);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  
  // These are now "Active Session" states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]); // Global Orders (Store Database)
  
  // --- Auth State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginStep, setLoginStep] = useState<'input' | 'otp'>('input');
  const [loginInput, setLoginInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [showGoogleLoginModal, setShowGoogleLoginModal] = useState(false);

  // --- Database State (The "Backend") ---
  const [usersDb, setUsersDb] = useState<Record<string, UserData>>({});

  // --- Admin Data State ---
  const [storeCategories, setStoreCategories] = useState<string[]>(CATEGORIES);
  const [customers, setCustomers] = useState([
    { id: '1', name: 'Shourya Singh', email: 'shourya@fyx.com', phone: '7068528064', spent: 12500, orders: 8, status: 'Active' },
    { id: '2', name: 'Rahul Verma', email: 'rahul.v@gmail.com', phone: '9876543210', spent: 4500, orders: 3, status: 'Active' },
    { id: '3', name: 'Priya Sharma', email: 'priya.s@outlook.com', phone: '8765432109', spent: 0, orders: 0, status: 'New' },
  ]);
  const [tickets, setTickets] = useState([
    { id: 'T-2024-001', user: 'Rahul Verma', subject: 'Order delivery delayed', status: 'Open', priority: 'High', date: '2 hrs ago' },
    { id: 'T-2024-002', user: 'Shourya Singh', subject: 'Inquiry about bulk order', status: 'Resolved', priority: 'Medium', date: '1 day ago' },
  ]);
  const [discounts, setDiscounts] = useState([
    { code: 'WELCOME10', type: 'Percentage', value: 10, usage: 145, status: 'Active' },
    { code: 'FREESHIP', type: 'Fixed', value: 29, usage: 89, status: 'Active' },
    { code: 'SUMMER25', type: 'Percentage', value: 25, usage: 12, status: 'Expired' },
  ]);
  const [promotions, setPromotions] = useState<Promotion[]>([
    { id: '1', type: 'banner', title: 'Free Shipping', content: 'Free Shipping on all orders above ₹999', status: 'Active', displayRule: 'immediate', closable: true },
    { id: '2', type: 'popup', title: 'Welcome Offer', content: 'Get 10% OFF on your first purchase!', ctaText: 'Shop Now', status: 'Active', displayRule: 'delay', delaySeconds: 5, closable: true }
  ]);
  
  // New Admin States
  const [faqs, setFaqs] = useState([
    { id: 1, question: "How do I track my order?", answer: "You can track your order from the 'My Orders' section in your profile." },
    { id: 2, question: "What is the return policy?", answer: "We accept returns within 7 days of delivery for damaged items." }
  ]);
  const [subscribers, setSubscribers] = useState([
    { email: "john@example.com", date: "2024-01-15", status: "Subscribed" },
    { email: "sarah@test.com", date: "2024-02-20", status: "Subscribed" },
    { email: "mike@demo.com", date: "2024-03-10", status: "Unsubscribed" }
  ]);
  const [blogPosts, setBlogPosts] = useState([
    { id: 1, title: "Summer Style Guide 2024", author: "Admin", date: "May 15, 2024", status: "Published" },
    { id: 2, title: "The Art of Gift Giving", author: "Sarah J.", date: "June 2, 2024", status: "Draft" }
  ]);
  const [flashSales, setFlashSales] = useState([
    { id: 1, name: "Monsoon Madness", discount: "40%", endsIn: "2 Days", status: "Active" },
    { id: 2, name: "Weekend Special", discount: "20%", endsIn: "Ended", status: "Inactive" }
  ]);
  
  const [settings, setSettings] = useState({
    siteName: 'FYX',
    maintenanceMode: false,
    shippingFee: 29,
    freeShippingThreshold: 999,
    supportEmail: 'support@fyx.com',
    primaryColor: '#000000',
    fontFamily: 'Inter',
    enableBlog: true,
    taxRate: 18
  });

  // Additional Admin Mock Data (Converted to Mutable State)
  const [chatSessions] = useState([
    { id: 1, user: 'Alice (Guest)', lastMsg: 'Is the black tee in stock?', time: '2m ago', unread: true },
    { id: 2, user: 'Rahul Verma', lastMsg: 'Thanks for the help!', time: '1h ago', unread: false }
  ]);
  const [shippingRules, setShippingRules] = useState([
    { id: 1, name: 'Standard Shipping', cost: 29, condition: 'Orders < ₹999' },
    { id: 2, name: 'Free Shipping', cost: 0, condition: 'Orders >= ₹999' }
  ]);
  const [taxRules, setTaxRules] = useState([
    { id: 1, name: 'GST', rate: 18, region: 'India' }
  ]);
  const [cmsPages, setCmsPages] = useState([
    { id: 1, title: 'About Us', slug: '/about', status: 'Published', lastModified: '2 days ago' },
    { id: 2, title: 'Privacy Policy', slug: '/privacy', status: 'Published', lastModified: '1 month ago' },
    { id: 3, title: 'Terms of Service', slug: '/terms', status: 'Published', lastModified: '1 month ago' }
  ]);
  const [emailTemplates, setEmailTemplates] = useState([
    { id: 1, name: 'Welcome Email', subject: 'Welcome to FYX Family!', type: 'Automated' },
    { id: 2, name: 'Order Confirmation', subject: 'Order #{{order_id}} Confirmed', type: 'Transactional' },
    { id: 3, name: 'Abandoned Cart', subject: 'You left something behind...', type: 'Automated' }
  ]);
  const [customerSegments, setCustomerSegments] = useState([
    { id: 1, name: 'Big Spenders', criteria: 'Spent > ₹10,000', count: 45 },
    { id: 2, name: 'New Signups', criteria: 'Joined < 30 days', count: 128 },
    { id: 3, name: 'Inactive', criteria: 'No order in 90 days', count: 340 }
  ]);

  // --- View State ---
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price_low' | 'price_high'>('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [adminStatsMsg, setAdminStatsMsg] = useState('Generating store analysis...');
  const [activePopup, setActivePopup] = useState<Promotion | null>(null);
  const [dismissedPromotions, setDismissedPromotions] = useState<string[]>([]);
  
  // Review Form State
  const [reviewInput, setReviewInput] = useState({ rating: 5, text: '' });
  
  // --- Form State ---
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [adminViewingOrder, setAdminViewingOrder] = useState<Order | null>(null);

  // AI Image State
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Generic "Add Item" Modal State
  const [showGenericModal, setShowGenericModal] = useState(false);
  const [genericModalType, setGenericModalType] = useState<'discount' | 'blog' | 'flash' | null>(null);
  const [genericInputs, setGenericInputs] = useState({ field1: '', field2: '', field3: '' });

  // Newsletter AI State
  const [newsletterTopic, setNewsletterTopic] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  // Checkout State
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [enteredUpiId, setEnteredUpiId] = useState('');
  const [upiPaymentConfirmed, setUpiPaymentConfirmed] = useState(false);

  // Admin Product Editing State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [tempOptions, setTempOptions] = useState<ProductOption[]>([]);
  
  // Temporary State for Adding Items (FAQ, etc)
  const [newItemInput, setNewItemInput] = useState({ title: '', content: '' });
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // --- Map & Address State ---
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 }); // Default New Delhi

  // --- User Data ---
  const initialUserAddress = {
    name: 'Guest User',
    email: '',
    line: '',
    phone: '',
    altPhone: '',
    gender: 'Other',
    dob: '',
    houseNo: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    addressType: 'Home' as 'Home' | 'Work' | 'Other'
  };
  const [userAddress, setUserAddress] = useState(initialUserAddress);

  // --- Refs ---
  const featuredRef = useRef<HTMLDivElement>(null);

  // --- Customization State (Dynamic) ---
  const [pDetailSelections, setPDetailSelections] = useState<Record<string, string>>({});
  const [pDetailImages, setPDetailImages] = useState<string[]>([]);
  const [pDetailQty, setPDetailQty] = useState(1);
  const [checkoutPayment, setCheckoutPayment] = useState('Credit/Debit Card');

  // --- Persistence Hydration ---
  useEffect(() => {
    try {
      // Global Data
      const savedProducts = localStorage.getItem('fyx_products');
      const savedOrders = localStorage.getItem('fyx_orders'); // Global Orders
      const savedCats = localStorage.getItem('fyx_categories');
      const savedCustomers = localStorage.getItem('fyx_customers');
      
      // Cart Backup (Guest/Persist)
      const savedCartBackup = localStorage.getItem('fyx_cart_backup');

      // User DB
      const savedUsersDb = localStorage.getItem('fyx_users_db');
      
      // Session
      const savedSessionEmail = localStorage.getItem('fyx_current_session');

      // Admin Persistance
      const savedSettings = localStorage.getItem('fyx_settings');
      const savedFaqs = localStorage.getItem('fyx_faqs');
      const savedDiscounts = localStorage.getItem('fyx_discounts');
      const savedBlog = localStorage.getItem('fyx_blog');
      const savedFlash = localStorage.getItem('fyx_flash');
      const savedPromotions = localStorage.getItem('fyx_promotions');

      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (savedOrders) setOrders(JSON.parse(savedOrders));
      if (savedCats) setStoreCategories(JSON.parse(savedCats));
      if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
      
      // Load Cart logic
      let cartLoaded = false;

      if (savedUsersDb) {
          const parsedDb = JSON.parse(savedUsersDb);
          setUsersDb(parsedDb);

          // If there is an active session, auto-login
          if (savedSessionEmail && parsedDb[savedSessionEmail]) {
              const userData = parsedDb[savedSessionEmail];
              setUserAddress(userData.profile);
              setCart(userData.cart);
              setWishlist(userData.wishlist);
              setIsLoggedIn(true);
              cartLoaded = true;
          }
      }
      
      // If no user session loaded the cart, try loading the backup (guest cart)
      if (!cartLoaded && savedCartBackup) {
          setCart(JSON.parse(savedCartBackup));
      }

      if (savedSettings) setSettings(JSON.parse(savedSettings));
      if (savedFaqs) setFaqs(JSON.parse(savedFaqs));
      if (savedDiscounts) setDiscounts(JSON.parse(savedDiscounts));
      if (savedBlog) setBlogPosts(JSON.parse(savedBlog));
      if (savedFlash) setFlashSales(JSON.parse(savedFlash));
      if (savedPromotions) setPromotions(JSON.parse(savedPromotions));
    } catch (e) {
      console.error("Error hydrating state", e);
    }
  }, []);

  // --- Persistence Saving ---
  useEffect(() => {
    // 1. Save Global Data
    localStorage.setItem('fyx_products', JSON.stringify(products));
    localStorage.setItem('fyx_orders', JSON.stringify(orders)); // Master Order List
    localStorage.setItem('fyx_categories', JSON.stringify(storeCategories));
    localStorage.setItem('fyx_customers', JSON.stringify(customers));
    
    // Always save current cart to backup (for persistence across refresh/logout)
    localStorage.setItem('fyx_cart_backup', JSON.stringify(cart));

    localStorage.setItem('fyx_settings', JSON.stringify(settings));
    localStorage.setItem('fyx_faqs', JSON.stringify(faqs));
    localStorage.setItem('fyx_discounts', JSON.stringify(discounts));
    localStorage.setItem('fyx_blog', JSON.stringify(blogPosts));
    localStorage.setItem('fyx_flash', JSON.stringify(flashSales));
    localStorage.setItem('fyx_promotions', JSON.stringify(promotions));

    // 2. Save User Data if Logged In
    if (isLoggedIn && userAddress.email) {
        const updatedDb = {
            ...usersDb,
            [userAddress.email]: {
                profile: userAddress,
                cart: cart,
                wishlist: wishlist
            }
        };
        setUsersDb(updatedDb);
        localStorage.setItem('fyx_users_db', JSON.stringify(updatedDb));
        localStorage.setItem('fyx_current_session', userAddress.email);
    } else if (!isLoggedIn) {
        // Ensure no session is active if logged out
        localStorage.removeItem('fyx_current_session');
    }

  }, [products, orders, wishlist, cart, storeCategories, settings, faqs, discounts, blogPosts, flashSales, userAddress, isLoggedIn, customers, promotions, usersDb]);

  // --- Promotions Logic ---
  const activeBanner = useMemo(() => {
    const banners = promotions.filter(p => p.type === 'banner' && p.status === 'Active' && !dismissedPromotions.includes(p.id));
    return banners.length > 0 ? banners[0] : null;
  }, [promotions, dismissedPromotions]);

  useEffect(() => {
    // Handle Popup Display Logic
    const activePopups = promotions.filter(p => p.type === 'popup' && p.status === 'Active' && !dismissedPromotions.includes(p.id));
    
    if (activePopups.length > 0 && !activePopup && !currentRoute.startsWith('admin')) {
      const popup = activePopups[0];
      if (popup.displayRule === 'immediate') {
        setActivePopup(popup);
      } else if (popup.displayRule === 'delay' && popup.delaySeconds) {
        const timer = setTimeout(() => {
          setActivePopup(popup);
        }, popup.delaySeconds * 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [promotions, dismissedPromotions, activePopup, currentRoute]);

  const closePromotion = (id: string) => {
    setDismissedPromotions(prev => [...prev, id]);
    if (activePopup?.id === id) setActivePopup(null);
  };

  // --- Derived Data ---
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const wishlistItems = useMemo(() => products.filter(p => wishlist.includes(p.id)), [products, wishlist]);
  
  // Data for Home Page (Category Filter Only)
  const homeDisplayProducts = useMemo(() => {
    let result = products;
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    // Apply Sorting
    return result.sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      return 0; // Default featured (original order)
    });
  }, [products, selectedCategory, sortBy]);

  // Data for Search Page (Search Query Filter)
  const filteredProducts = useMemo(() => {
    let result = products;
    if (searchQuery) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result;
  }, [products, searchQuery]);

  // Orders Filtered for Current User
  const myOrders = useMemo(() => {
      if (!isLoggedIn) return [];
      return orders.filter(o => {
          // Normalize to handle potential formatting diffs
          const orderPhone = o.phone?.replace(/\D/g, '') || '';
          const userPhone = userAddress.phone?.replace(/\D/g, '') || '';
          return o.customerName === userAddress.name || (userAddress.email && o.customerName.includes(userAddress.email)) || (userPhone && orderPhone === userPhone);
      });
  }, [orders, userAddress, isLoggedIn]);

  // --- Action Handlers ---
  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const resetAllData = () => {
    if(window.confirm("Are you sure? This will delete all local data and reset the app.")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  const navigateToProduct = (product: Product) => {
    setSelectedProduct(product);
    setPDetailQty(1);
    
    const defaults: Record<string, string> = {};
    if (product.options) {
      product.options.forEach(opt => {
        if (opt.values.length > 0) defaults[opt.name] = opt.values[0];
      });
    }
    setPDetailSelections(defaults);
    setPDetailImages([]);
    
    setCurrentRoute(AppRoute.PRODUCT_DETAIL);
    window.scrollTo(0, 0);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPDetailImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handlePaymentScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentScreenshot(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const addToCartDetailed = () => {
    if (!selectedProduct) return;
    
    const item: CartItem = { 
      ...selectedProduct, 
      quantity: pDetailQty,
      selectedOptions: pDetailSelections,
      uploadedImages: pDetailImages
    };
    setCart(prev => [...prev, item]);
    showToast(`${selectedProduct.name} added to your bag.`);
    setCurrentRoute(AppRoute.CART);
  };

  const toggleWishlist = (productId: string) => {
    // Auth Check
    if (!isLoggedIn) {
       showToast("Please login or sign up to save items");
       setCurrentRoute(AppRoute.PROFILE);
       return;
    }

    setWishlist(prev => {
      const exists = prev.includes(productId);
      showToast(exists ? "Removed from wishlist." : "Added to wishlist.");
      return exists ? prev.filter(id => id !== productId) : [...prev, productId];
    });
  };

  const submitReview = () => {
    if (!selectedProduct || !reviewInput.text) return;
    if (!isLoggedIn) { showToast("Please login to review"); return; }

    const newReview: Review = {
      id: Date.now().toString(),
      userName: userAddress.name || 'Anonymous',
      rating: reviewInput.rating,
      text: reviewInput.text,
      date: 'Just now'
    };

    const updatedProduct = {
      ...selectedProduct,
      reviews: [newReview, ...(selectedProduct.reviews || [])]
    };

    // Update Global State
    setProducts(prev => prev.map(p => p.id === selectedProduct.id ? updatedProduct : p));
    // Update Local View State
    setSelectedProduct(updatedProduct);
    
    setReviewInput({ rating: 5, text: '' });
    showToast("Review Submitted!");
  };

  const finalCheckout = () => {
    if (!isLoggedIn) {
       showToast("Please login to place an order");
       setCurrentRoute(AppRoute.PROFILE);
       return;
    }
    if (cart.length === 0) return;

    const totalAmount = cartTotal + settings.shippingFee;

    const orderNum = `FYX-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: orderNum,
      customerName: userAddress.name, // Use name or Email for identification
      items: [...cart],
      total: totalAmount, 
      shipping: settings.shippingFee,
      status: 'processing',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      address: userAddress.line, // Uses the composite address line
      phone: userAddress.phone,
      paymentMethod: checkoutPayment,
      paymentDetails: checkoutPayment === 'UPI (PhonePe/GPay)' ? {
         upiId: '7068528064@pthdfc',
         screenshot: paymentScreenshot || undefined
      } : undefined
    };
    
    // Update customer stats in Admin
    setCustomers(prev => prev.map(c => {
       if (c.email === userAddress.email || c.phone === userAddress.phone) {
           return { ...c, orders: c.orders + 1, spent: c.spent + newOrder.total };
       }
       return c;
    }));

    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setViewingOrder(newOrder);
    setCheckoutStep(1);
    setPaymentScreenshot(null);
    setEnteredUpiId('');
    setUpiPaymentConfirmed(false);
    setCurrentRoute(AppRoute.ORDER_SUCCESS);
  };

  const handleCancelOrder = (orderId: string) => {
    if(!window.confirm("Are you sure you want to cancel this order?")) return;
    
    // Update Global Orders
    setOrders(prevOrders => prevOrders.map(o => 
      o.id === orderId ? { ...o, status: 'cancelled' } : o
    ));
    
    // Update Customer Stats (Revert spent amount if necessary)
    // Find the order to get the total
    const orderToCancel = orders.find(o => o.id === orderId);
    if (orderToCancel) {
        setCustomers(prev => prev.map(c => {
            const isOrderCustomer = (c.email === userAddress.email) || (c.name === orderToCancel.customerName); 
            if (isOrderCustomer) {
                return { ...c, orders: Math.max(0, c.orders - 1), spent: Math.max(0, c.spent - orderToCancel.total) };
            }
            return c;
        }));
    }

    // Update Local View State Immediately
    if (viewingOrder && viewingOrder.id === orderId) {
        setViewingOrder({ ...viewingOrder, status: 'cancelled' });
    }
    
    showToast("Order has been cancelled");
  };
  
  // --- Auth Handlers ---
  const handleSendOtp = () => {
    if (!loginInput) {
      showToast("Please enter email or mobile number");
      return;
    }
    setIsOtpLoading(true);
    // Simulate API delay
    setTimeout(() => {
        setIsOtpLoading(false);
        setLoginStep('otp');
        // Explicitly show the OTP to the user since there is no backend
        alert(`FYX Verification Code: 1234\n\nPlease use this code to log in.`); 
    }, 1500);
  };

  const handleVerifyOtp = () => {
    if (otpInput !== '1234') {
      showToast("Incorrect Code. Try 1234");
      return;
    }
    
    // Determine user identity
    const isEmail = loginInput.includes('@');
    const newUserPhone = !isEmail ? loginInput : '';
    const newUserEmail = isEmail ? loginInput : '';
    
    setIsLoggedIn(true);
    
    setUserAddress(prev => ({
      ...prev,
      email: newUserEmail || prev.email,
      phone: newUserPhone || prev.phone,
      name: prev.name === 'Guest User' ? (isEmail ? newUserEmail.split('@')[0] : `User ${newUserPhone.slice(-4)}`) : prev.name
    }));

    showToast("Logged in successfully");
    setLoginStep('input');
    setOtpInput('');
    setLoginInput('');
    
    if (cart.length > 0) {
        setCurrentRoute(AppRoute.CART);
    }
  };

  const handleGoogleLoginMock = (email: string, name: string) => {
    // 1. Check if user exists in our local "Database"
    const existingUser = usersDb[email];

    if (existingUser) {
        // 2. RESTORE DATA
        setUserAddress(existingUser.profile);
        setCart(existingUser.cart);
        setWishlist(existingUser.wishlist);
        showToast(`Welcome back, ${name}! Your data has been recovered.`);
    } else {
        // 3. CREATE NEW USER
        const newUserProfile = {
            ...initialUserAddress,
            email: email,
            name: name,
        };
        setUserAddress(newUserProfile);
        // Retain existing cart if it exists (Guest to User persistence)
        // Only clear if wishlist needs clearing, but usually cart is kept.
        setWishlist([]);
        showToast(`Welcome, ${name}! Account created.`);
        
        // Add to customers list for Admin
        setCustomers(prev => {
           if (prev.some(c => c.email === email)) return prev;
           return [...prev, {
              id: Date.now().toString(),
              name: name,
              email: email,
              phone: '-',
              spent: 0,
              orders: 0,
              status: 'Active'
           }];
        });
    }
    
    setIsLoggedIn(true);
    setShowGoogleLoginModal(false);

    if (cart.length > 0) setCurrentRoute(AppRoute.CART);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    
    // Clear active session view state BUT KEEP CART for persistence
    setUserAddress(initialUserAddress);
    // setCart([]); // Keep cart items for guest/backup persistence
    setWishlist([]); // Clear wishlist as it is personal
    
    showToast("Logged out successfully");
  };

  // --- Address Logic ---
  const saveProfileChanges = () => {
      // Construct the full address line for display compatibility
      const fullAddress = [
          userAddress.houseNo, 
          userAddress.street, 
          userAddress.landmark, 
          userAddress.city ? `${userAddress.city} - ${userAddress.pincode}` : userAddress.pincode,
          userAddress.state
      ].filter(Boolean).join(', ');

      setUserAddress(prev => ({ ...prev, line: fullAddress }));
      setShowEditProfileModal(false);
      showToast("Profile Updated Successfully");
  };

  const confirmMapLocation = () => {
      // Simulate reverse geocoding
      setUserAddress(prev => ({
          ...prev,
          houseNo: '102',
          street: 'Tech Park Main Road',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
          landmark: 'Near Metro Station'
      }));
      setShowMapPicker(false);
      showToast("Location Selected");
  };

  // --- Admin Logic ---
  const handleUpdateOrderStatus = (orderId: string, newStatus: any) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    showToast(`Order status updated to ${newStatus}`);
    if (adminViewingOrder && adminViewingOrder.id === orderId) {
        setAdminViewingOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName && !storeCategories.includes(newCategoryName)) {
      setStoreCategories([...storeCategories, newCategoryName]);
      setNewCategoryName('');
      showToast('Category added successfully');
    }
  };

  const handleDeleteCategory = (cat: string) => {
    setStoreCategories(storeCategories.filter(c => c !== cat));
    showToast('Category removed');
  };

  const openEditProduct = (product: Product | null) => {
    // Reset AI Image states
    setAiImagePrompt('');
    setGeneratedImage(null);
    setIsGeneratingImage(false);

    if (product) {
      setEditingProduct({...product});
      setTempOptions(product.options ? product.options.map(o => ({
        ...o, 
        values: [...o.values]
      })) : []);
    } else {
      setEditingProduct({
        id: Date.now().toString(),
        name: '',
        description: '',
        price: 0,
        category: storeCategories[0],
        image: 'https://picsum.photos/800/800',
        stock: 100,
        featured: false,
        options: [],
        allowCustomImages: false
      } as Product);
      setTempOptions([]);
    }
    setShowProductModal(true);
  };

  const openPromotionModal = (promotion: Promotion | null) => {
    if (promotion) {
      setEditingPromotion({ ...promotion });
    } else {
      setEditingPromotion({
        id: Date.now().toString(),
        type: 'banner',
        title: '',
        content: '',
        status: 'Active',
        displayRule: 'immediate',
        closable: true,
        delaySeconds: 5
      } as Promotion);
    }
    setShowPromotionModal(true);
  };

  const savePromotion = () => {
    if (!editingPromotion?.title || !editingPromotion?.content) {
      showToast('Title and content are required');
      return;
    }

    if (promotions.some(p => p.id === editingPromotion.id)) {
      setPromotions(promotions.map(p => p.id === editingPromotion.id ? editingPromotion : p));
      showToast('Promotion updated');
    } else {
      setPromotions([...promotions, editingPromotion]);
      showToast('Promotion created');
    }
    setShowPromotionModal(false);
  };

  const handleDeletePromotion = (id: string) => {
    setPromotions(promotions.filter(p => p.id !== id));
    showToast('Promotion deleted');
  };

  const handleGenerateDescription = async () => {
    if (!editingProduct?.name || !editingProduct?.category) {
        showToast("Enter Name and Category first");
        return;
    }
    setIsGeneratingDesc(true);
    const desc = await generateProductDescription(editingProduct.name, editingProduct.category, editingProduct.price);
    setEditingProduct(prev => ({ ...(prev || {}), description: desc } as Product));
    setIsGeneratingDesc(false);
  };

  const handleGenerateEmail = async () => {
    if (!newsletterTopic) return;
    setIsGeneratingEmail(true);
    const email = await generateMarketingEmail(newsletterTopic, "WELCOME10");
    setGeneratedEmail(email);
    setIsGeneratingEmail(false);
  };

  const handleGenerateImage = async () => {
    if (!aiImagePrompt) { showToast("Enter a prompt first"); return; }
    setIsGeneratingImage(true);
    const img = await generateProductImage(aiImagePrompt);
    if (img) {
        setGeneratedImage(img);
    } else {
        showToast("Failed to generate image. Try again.");
    }
    setIsGeneratingImage(false);
  };

  const applyGeneratedImage = () => {
    if (generatedImage) {
        setEditingProduct(prev => ({ ...(prev || {}), image: generatedImage } as Product));
        setGeneratedImage(null);
        showToast("AI Image Applied!");
    }
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setEditingProduct(prev => ({ ...(prev || {}), image: reader.result as string } as Product));
        };
        reader.readAsDataURL(e.target.files[0]);
    }
  };

  const saveProduct = () => {
    if (!editingProduct || !editingProduct.name) {
      showToast("Product name is required!");
      return;
    }
    const cleanedOptions = tempOptions.map(opt => ({
       ...opt,
       name: opt.name.trim(),
       values: opt.values.map(v => v.trim()).filter(v => v !== '')
    })).filter(opt => opt.name !== '' && opt.values.length > 0);
    
    const finalProduct: Product = {
      ...editingProduct,
      options: cleanedOptions
    };

    if (products.some(p => p.id === finalProduct.id)) {
      setProducts(products.map(p => p.id === finalProduct.id ? finalProduct : p));
      showToast('Product updated successfully');
    } else {
      setProducts([...products, finalProduct]);
      showToast('New product created');
    }
    setShowProductModal(false);
  };

  const openGenericModal = (type: 'discount' | 'blog' | 'flash') => {
    setGenericModalType(type);
    setGenericInputs({ field1: '', field2: '', field3: '' });
    setShowGenericModal(true);
  };

  const handleAddDiscount = () => {
    if(genericInputs.field1 && genericInputs.field2) {
       setDiscounts([...discounts, {
         code: genericInputs.field1,
         type: 'Percentage',
         value: Number(genericInputs.field2),
         usage: 0,
         status: 'Active'
       }]);
       setGenericInputs({field1: '', field2: '', field3: ''});
       setShowGenericModal(false);
       showToast("Discount Code Created");
    }
  };

  const handleAddFlashSale = () => {
      if(genericInputs.field1) {
          setFlashSales([...flashSales, {
              id: Date.now(),
              name: genericInputs.field1,
              discount: genericInputs.field2 || '10%',
              endsIn: genericInputs.field3 || '24 Hours',
              status: 'Active'
          }]);
          setGenericInputs({field1: '', field2: '', field3: ''});
          setShowGenericModal(false);
          showToast("Flash Sale Started");
      }
  };

  const handleAddBlog = () => {
      if(genericInputs.field1) {
          setBlogPosts([...blogPosts, {
              id: Date.now(),
              title: genericInputs.field1,
              author: genericInputs.field2 || 'Admin',
              date: new Date().toLocaleDateString(),
              status: 'Published'
          }]);
          setGenericInputs({field1: '', field2: '', field3: ''});
          setShowGenericModal(false);
          showToast("Post Published");
      }
  };

  // --- AI Store Analyst ---
  useEffect(() => {
    if (currentRoute === AppRoute.ADMIN_DASHBOARD) {
      const fetchAnalysis = async () => {
        const totalRev = orders.reduce((s, o) => s + o.total, 0);
        const analysis = await analyzeSalesTrends(orders.length, totalRev);
        setAdminStatsMsg(analysis);
      };
      fetchAnalysis();
    }
  }, [currentRoute, orders]);

  // --- STOREFRONT RENDERERS ---
  const renderHome = () => (
    <div className="flex flex-col animate-slide-up">
      {/* Hero Section - Always show on Home */}
      <section className="relative h-[65vh] md:h-[80vh] w-full bg-gray-100 overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover transition duration-1000 group-hover:scale-105" 
          alt="Hero" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        <div className="absolute bottom-10 left-6 md:left-12 max-w-lg text-white">
          <p className="text-[#d9c5b2] text-xs font-black uppercase tracking-[0.2em] mb-4">New Collection</p>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none mb-6">Redefine <br/>Your Style.</h1>
          <button onClick={() => featuredRef.current?.scrollIntoView({ behavior: 'smooth' })} className="bg-white text-black px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition">
            Shop Collection
          </button>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-40">
        <div className="flex overflow-x-auto no-scrollbar space-x-6 px-6 pb-2">
          <div onClick={() => setSelectedCategory('All')} className="flex flex-col items-center space-y-2 min-w-[70px] cursor-pointer">
            <div className={`w-[70px] h-[70px] rounded-full border-2 p-1 ${selectedCategory === 'All' ? 'border-red-500' : 'border-gray-200'}`}>
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-white">
                <i className="fa-solid fa-star text-xl"></i>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide">All</span>
          </div>
          {storeCategories.map(cat => (
            <div key={cat} onClick={() => setSelectedCategory(cat)} className="flex flex-col items-center space-y-2 min-w-[70px] cursor-pointer group">
              <div className={`w-[70px] h-[70px] rounded-full border-2 p-1 transition ${selectedCategory === cat ? 'border-red-500' : 'border-gray-200 group-hover:border-gray-400'}`}>
                <img src={`https://picsum.photos/seed/${cat}/200/200`} className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{cat.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section ref={featuredRef} className="px-4 py-8 bg-gray-50 min-h-screen">
         <div className="flex justify-between items-end mb-8 px-2">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">
               {selectedCategory === 'All' ? 'Featured Collection' : selectedCategory}
            </h2>
            <div className="flex items-center gap-4">
               {/* Sort Dropdown */}
               <select 
                 value={sortBy}
                 onChange={(e) => setSortBy(e.target.value as any)}
                 className="bg-white border border-gray-200 text-xs font-bold uppercase rounded-lg px-3 py-2 outline-none focus:border-black"
               >
                 <option value="featured">Featured</option>
                 <option value="price_low">Price: Low to High</option>
                 <option value="price_high">Price: High to Low</option>
               </select>
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden md:inline">{homeDisplayProducts.length} Items</span>
            </div>
         </div>
         
         {homeDisplayProducts.length === 0 ? (
            <div className="text-center py-20">
               <i className="fa-solid fa-ghost text-4xl text-gray-300 mb-4"></i>
               <p className="text-gray-400 font-bold uppercase tracking-widest">No products found</p>
            </div>
         ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {homeDisplayProducts.map(p => (
                  <div key={p.id} className="group cursor-pointer bg-white p-2 rounded-2xl shadow-sm hover:shadow-xl transition duration-300" onClick={() => navigateToProduct(p)}>
                    <div className="aspect-[4/5] rounded-xl overflow-hidden relative bg-gray-100 mb-4">
                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" loading="lazy" />
                        {p.discountBadge && <div className="absolute top-2 left-2 bg-black text-white text-[8px] font-bold px-2 py-1 rounded-md uppercase">{p.discountBadge}</div>}
                        <button onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-black hover:bg-red-500 hover:text-white transition">
                          <i className={`fa-${wishlist.includes(p.id) ? 'solid' : 'regular'} fa-heart text-xs`}></i>
                        </button>
                    </div>
                    <div className="px-2 pb-2">
                        <h3 className="font-bold text-sm truncate uppercase tracking-tight">{p.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm font-black">₹{p.price}</span>
                          {p.oldPrice && <span className="text-xs text-gray-400 line-through">₹{p.oldPrice}</span>}
                        </div>
                    </div>
                  </div>
                ))}
            </div>
         )}
      </section>
    </div>
  );

  const renderSearch = () => (
    <div className="flex flex-col animate-slide-up min-h-screen">
      <div className="px-6 py-4 bg-white sticky top-0 z-50 border-b border-gray-100">
         <div className="bg-gray-100 rounded-2xl flex items-center px-4 py-3">
            <i className="fa-solid fa-magnifying-glass text-gray-400 mr-3"></i>
            <input 
              autoFocus
              type="text" 
              placeholder="Search for products..." 
              className="bg-transparent border-none outline-none w-full text-sm font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && <button onClick={() => setSearchQuery('')}><i className="fa-solid fa-xmark text-gray-400"></i></button>}
         </div>
      </div>

      <section className="px-4 py-8 bg-gray-50 flex-grow">
         <div className="flex justify-between items-end mb-8 px-2">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">
               {searchQuery ? `Results for "${searchQuery}"` : "Browse All"}
            </h2>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{filteredProducts.length} Items</span>
         </div>
         
         {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
               <i className="fa-solid fa-ghost text-4xl text-gray-300 mb-4"></i>
               <p className="text-gray-400 font-bold uppercase tracking-widest">No matching products found</p>
            </div>
         ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {filteredProducts.map(p => (
                  <div key={p.id} className="group cursor-pointer bg-white p-2 rounded-2xl shadow-sm hover:shadow-xl transition duration-300" onClick={() => navigateToProduct(p)}>
                    <div className="aspect-[4/5] rounded-xl overflow-hidden relative bg-gray-100 mb-4">
                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" loading="lazy" />
                        {p.discountBadge && <div className="absolute top-2 left-2 bg-black text-white text-[8px] font-bold px-2 py-1 rounded-md uppercase">{p.discountBadge}</div>}
                        <button onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-black hover:bg-red-500 hover:text-white transition">
                          <i className={`fa-${wishlist.includes(p.id) ? 'solid' : 'regular'} fa-heart text-xs`}></i>
                        </button>
                    </div>
                    <div className="px-2 pb-2">
                        <h3 className="font-bold text-sm truncate uppercase tracking-tight">{p.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm font-black">₹{p.price}</span>
                          {p.oldPrice && <span className="text-xs text-gray-400 line-through">₹{p.oldPrice}</span>}
                        </div>
                    </div>
                  </div>
                ))}
            </div>
         )}
      </section>
    </div>
  );
  
  const renderProductDetail = () => {
    if (!selectedProduct) return null;
    
    // Recommendations logic: same category, exclude current
    const recommendations = products.filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id).slice(0, 4);

    return (
      <div className="pb-24 animate-slide-up bg-white min-h-screen">
        <div className="relative">
           <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20">
              <button onClick={() => setCurrentRoute(AppRoute.STORE)} className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-center"><i className="fa-solid fa-arrow-left"></i></button>
              <button onClick={() => toggleWishlist(selectedProduct.id)} className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-center"><i className={`fa-${wishlist.includes(selectedProduct.id) ? 'solid' : 'regular'} fa-heart text-red-500`}></i></button>
           </div>
           <div className="h-[50vh] md:h-[60vh] bg-gray-100 overflow-hidden"><img src={selectedProduct.image} className="w-full h-full object-cover" /></div>
        </div>
        <div className="px-6 py-8 -mt-8 rounded-t-[40px] bg-white relative z-10">
           <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-8"></div>
           <div className="space-y-6">
              <div className="flex justify-between items-start">
                 <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{selectedProduct.category}</p><h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{selectedProduct.name}</h1></div>
                 <div className="text-right"><p className="text-2xl font-black">₹{selectedProduct.price}</p>{selectedProduct.oldPrice && <p className="text-xs text-gray-400 line-through font-bold">₹{selectedProduct.oldPrice}</p>}</div>
              </div>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">{selectedProduct.description}</p>
              
              <div className="space-y-6 pt-4">
                 {selectedProduct.options?.map((option, idx) => (
                   <div key={idx}>
                      <p className="text-xs font-black uppercase mb-3">{option.name}</p>
                      <div className="flex space-x-3 overflow-x-auto no-scrollbar">
                         {option.values.map(val => (
                           <button 
                              key={val} 
                              onClick={() => setPDetailSelections(prev => ({...prev, [option.name]: val}))} 
                              className={`px-6 py-3 rounded-xl border font-bold text-xs whitespace-nowrap transition ${pDetailSelections[option.name] === val ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500'}`}
                           >
                              {val}
                           </button>
                         ))}
                      </div>
                   </div>
                 ))}
                 {selectedProduct.allowCustomImages && (
                   <div className="p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                      <div className="flex justify-between items-center mb-4">
                         <p className="text-xs font-black uppercase">Upload Custom Photos</p>
                         <span className="text-[10px] bg-black text-white px-2 py-1 rounded">Unlimited</span>
                      </div>
                      <div className="flex flex-wrap gap-4 mb-4">
                         {pDetailImages.map((img, i) => (
                           <div key={i} className="w-16 h-16 rounded-lg overflow-hidden relative shadow-sm">
                             <img src={img} className="w-full h-full object-cover" />
                             <button onClick={() => setPDetailImages(pDetailImages.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-bl-lg"><i className="fa-solid fa-xmark text-[10px]"></i></button>
                           </div>
                         ))}
                         <label className="w-16 h-16 rounded-lg border-2 border-gray-300 border-dashed flex items-center justify-center cursor-pointer hover:border-black hover:text-black text-gray-400 transition">
                            <i className="fa-solid fa-plus text-xl"></i>
                            <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                         </label>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold">Add images for your custom print. We support JPG, PNG.</p>
                   </div>
                 )}
              </div>

              {/* Reviews Section */}
              <div className="pt-8 border-t border-gray-100">
                 <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4">Reviews</h3>
                 <div className="space-y-4 mb-6">
                    {(!selectedProduct.reviews || selectedProduct.reviews.length === 0) ? (
                        <p className="text-sm text-gray-400 font-medium">No reviews yet. Be the first!</p>
                    ) : (
                        selectedProduct.reviews.map(review => (
                            <div key={review.id} className="bg-gray-50 p-4 rounded-2xl">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-sm">{review.userName}</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">{review.date}</span>
                                </div>
                                <div className="flex items-center mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <i key={i} className={`fa-solid fa-star text-[10px] mr-1 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}></i>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-600 font-medium">{review.text}</p>
                            </div>
                        ))
                    )}
                 </div>
                 
                 {/* Add Review Form */}
                 {isLoggedIn ? (
                     <div className="bg-white border border-gray-200 p-4 rounded-2xl">
                         <p className="text-xs font-black uppercase mb-3">Write a Review</p>
                         <div className="flex gap-2 mb-3">
                             {[1, 2, 3, 4, 5].map(star => (
                                 <button key={star} onClick={() => setReviewInput(prev => ({...prev, rating: star}))} className="focus:outline-none transition transform active:scale-110">
                                     <i className={`fa-solid fa-star text-lg ${star <= reviewInput.rating ? 'text-yellow-400' : 'text-gray-300'}`}></i>
                                 </button>
                             ))}
                         </div>
                         <textarea 
                            value={reviewInput.text} 
                            onChange={(e) => setReviewInput(prev => ({...prev, text: e.target.value}))}
                            placeholder="Share your thoughts..." 
                            className="w-full bg-gray-50 p-3 rounded-xl text-sm outline-none border focus:border-black mb-3 min-h-[80px]"
                         />
                         <button onClick={submitReview} className="bg-black text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest">Submit</button>
                     </div>
                 ) : (
                     <button onClick={() => setCurrentRoute(AppRoute.PROFILE)} className="w-full py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50">Log in to write a review</button>
                 )}
              </div>

              {/* You Might Also Like */}
              {recommendations.length > 0 && (
                  <div className="pt-8 border-t border-gray-100">
                      <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4">You Might Also Like</h3>
                      <div className="grid grid-cols-2 gap-4">
                          {recommendations.map(rec => (
                              <div key={rec.id} onClick={() => { navigateToProduct(rec); window.scrollTo(0,0); }} className="cursor-pointer group">
                                  <div className="aspect-[4/5] rounded-xl overflow-hidden bg-gray-100 mb-2">
                                      <img src={rec.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                  </div>
                                  <h4 className="font-bold text-xs truncate uppercase">{rec.name}</h4>
                                  <p className="text-xs font-black">₹{rec.price}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
           </div>
        </div>
        <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 pb-8 z-50 flex items-center space-x-4 animate-slide-up">
           <div className="flex items-center space-x-4 bg-gray-50 px-4 py-3 rounded-xl"><button onClick={() => setPDetailQty(Math.max(1, pDetailQty-1))} className="text-lg font-bold">-</button><span className="text-sm font-black w-4 text-center">{pDetailQty}</span><button onClick={() => setPDetailQty(pDetailQty+1)} className="text-lg font-bold">+</button></div>
           <button onClick={addToCartDetailed} className="flex-1 bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg">Add to Bag</button>
        </div>
      </div>
    );
  };

  const renderCart = () => (
    <div className="p-6 animate-slide-up bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8">Shopping Bag <span className="text-gray-400 text-lg not-italic">({cartCount})</span></h2>
      {cart.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 font-bold uppercase tracking-widest mb-4">Your bag is empty</p>
          <button onClick={() => setCurrentRoute(AppRoute.STORE)} className="bg-black text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest">Shop Now</button>
        </div>
      ) : (
        <div className="space-y-4 pb-24">
          {cart.map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl flex gap-4 shadow-sm">
              <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                <img src={item.image} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm uppercase">{item.name}</h3>
                  <p className="text-xs text-gray-500 font-medium">Qty: {item.quantity}</p>
                </div>
                <div className="flex justify-between items-end">
                  <p className="font-black text-lg">₹{item.price * item.quantity}</p>
                  <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-xs font-bold text-red-500 uppercase tracking-wide">Remove</button>
                </div>
              </div>
            </div>
          ))}
          <div className="bg-white p-6 rounded-2xl space-y-4 shadow-sm mt-8">
            <div className="flex justify-between text-sm font-medium text-gray-500"><span>Subtotal</span><span>₹{cartTotal}</span></div>
            <div className="flex justify-between text-sm font-medium text-gray-500"><span>Shipping</span><span>₹{settings.shippingFee}</span></div>
            <div className="flex justify-between text-xl font-black border-t pt-4"><span>Total</span><span>₹{cartTotal + settings.shippingFee}</span></div>
            <button onClick={() => setCurrentRoute(AppRoute.CHECKOUT)} className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg mt-4">Checkout</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderWishlist = () => (
    <div className="p-6 animate-slide-up bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8">Wishlist</h2>
      {wishlistItems.length === 0 ? (
        <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest">Empty Wishlist</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {wishlistItems.map(p => (
            <div key={p.id} className="bg-white p-2 rounded-2xl shadow-sm" onClick={() => navigateToProduct(p)}>
               <div className="aspect-square rounded-xl overflow-hidden relative mb-2">
                 <img src={p.image} className="w-full h-full object-cover" />
                 <button onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }} className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-red-500"><i className="fa-solid fa-trash text-xs"></i></button>
               </div>
               <div className="px-2 pb-2">
                  <h3 className="font-bold text-xs uppercase truncate">{p.name}</h3>
                  <p className="font-black text-sm">₹{p.price}</p>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCheckout = () => (
    <div className="p-6 animate-slide-up bg-gray-50 min-h-screen pb-24">
       <div className="flex items-center mb-6">
          <button onClick={() => setCurrentRoute(AppRoute.CART)} className="mr-4"><i className="fa-solid fa-arrow-left"></i></button>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">Checkout</h2>
       </div>
       <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-black uppercase text-sm">1. Delivery Address</h3>
                {checkoutStep > 1 && <button onClick={() => setCheckoutStep(1)} className="text-xs text-blue-600 font-bold uppercase">Edit</button>}
             </div>
             {checkoutStep === 1 ? (
                <div className="space-y-4">
                   <input type="text" placeholder="Full Name" value={userAddress.name} onChange={(e) => setUserAddress({...userAddress, name: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl text-sm font-bold outline-none border focus:border-black" />
                   <input type="text" placeholder="Address Line" value={userAddress.line} onChange={(e) => setUserAddress({...userAddress, line: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl text-sm font-bold outline-none border focus:border-black" />
                   <input type="text" placeholder="Phone Number" value={userAddress.phone} onChange={(e) => setUserAddress({...userAddress, phone: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl text-sm font-bold outline-none border focus:border-black" />
                   <button onClick={() => setCheckoutStep(2)} className="w-full bg-black text-white py-3 rounded-xl font-black uppercase text-xs">Continue</button>
                </div>
             ) : (
                <div className="text-sm font-medium text-gray-500">
                   <p className="text-black font-bold">{userAddress.name}</p>
                   <p>{userAddress.line}</p>
                   <p>{userAddress.phone}</p>
                </div>
             )}
          </div>
          <div className={`bg-white p-6 rounded-2xl shadow-sm transition-opacity ${checkoutStep < 2 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
             <h3 className="font-black uppercase text-sm mb-4">2. Payment Method</h3>
             <div className="space-y-3">
                {['Credit/Debit Card', 'UPI (PhonePe/GPay)', 'Cash on Delivery'].map(method => (
                   <label key={method} className="flex items-center space-x-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="payment" checked={checkoutPayment === method} onChange={() => setCheckoutPayment(method)} className="accent-black" />
                      <span className="text-sm font-bold">{method}</span>
                   </label>
                ))}
             </div>
             {checkoutPayment === 'UPI (PhonePe/GPay)' && (
                 <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-4 border border-blue-100">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border shadow-sm">
                            <i className="fa-solid fa-mobile-screen-button text-blue-600"></i>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500">Pay to Merchant</p>
                            <p className="text-sm font-black">7068528064@pthdfc</p>
                        </div>
                     </div>
                     
                     <div className="bg-white p-3 rounded-lg border border-gray-100">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Step 1: Make Payment</p>
                        <a 
                          href={`upi://pay?pa=7068528064@pthdfc&pn=FYX_Store&am=${cartTotal + settings.shippingFee}&cu=INR&tn=Order Payment`}
                          className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-bold text-xs uppercase hover:bg-blue-700 transition"
                        >
                          Pay ₹{cartTotal + settings.shippingFee} via UPI App
                        </a>
                        <p className="text-[9px] text-gray-400 mt-2 text-center">Tap to open PhonePe, GPay, Paytm, etc.</p>
                     </div>

                     <div className="bg-white p-3 rounded-lg border border-gray-100">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Step 2: Upload Proof</p>
                        <input type="file" accept="image/*" onChange={handlePaymentScreenshot} className="block w-full text-xs text-slate-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-[10px] file:font-semibold
                          file:bg-violet-50 file:text-violet-700
                          hover:file:bg-violet-100
                        "/>
                        {paymentScreenshot && (
                           <div className="mt-2 relative w-16 h-16 rounded-lg overflow-hidden border">
                              <img src={paymentScreenshot} className="w-full h-full object-cover" />
                              <button onClick={() => setPaymentScreenshot(null)} className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-bl"><i className="fa-solid fa-xmark text-[8px]"></i></button>
                           </div>
                        )}
                     </div>

                     <label className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl cursor-pointer border border-blue-100">
                        <input type="checkbox" checked={upiPaymentConfirmed} onChange={(e) => setUpiPaymentConfirmed(e.target.checked)} className="w-4 h-4 accent-black" />
                        <span className="text-xs font-bold text-blue-900">I have completed the payment</span>
                     </label>
                 </div>
             )}
          </div>
       </div>
       <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 pb-8 z-50">
          <div className="flex justify-between items-center mb-4 text-sm font-black">
             <span>Total to Pay</span>
             <span>₹{cartTotal + settings.shippingFee}</span>
          </div>
          <button 
            onClick={finalCheckout} 
            disabled={checkoutStep < 2 || (checkoutPayment === 'UPI (PhonePe/GPay)' && !upiPaymentConfirmed)} 
            className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Place Order
          </button>
       </div>
    </div>
  );

  const renderOrderSuccess = () => (
     <div className="min-h-screen bg-[#6ee7b7] flex flex-col items-center justify-center text-white p-6 text-center animate-fade-in relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[10%] -left-[10%] w-[60vh] h-[60vh] bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute top-[40%] -right-[10%] w-[50vh] h-[50vh] bg-emerald-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
            {/* Success Icon */}
            <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center mb-6 shadow-lg border border-white/30">
               <i className="fa-solid fa-check text-4xl text-white"></i>
            </div>
            
            {/* Header Text */}
            <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2 text-white drop-shadow-sm">Order Placed!</h1>
            <p className="text-white/90 font-bold text-sm mb-10 tracking-wide">Order #{viewingOrder?.orderNumber}</p>
            
            {/* Details Card */}
            <div className="bg-white/15 backdrop-blur-md rounded-[32px] p-8 w-full mb-10 border border-white/20 shadow-xl">
               <div className="text-left mb-6">
                   <p className="text-[10px] font-black uppercase text-white/60 mb-2 tracking-widest">Total Amount</p>
                   <p className="text-4xl font-black text-white tracking-tight">₹{viewingOrder?.total}</p>
               </div>
               <div className="text-left">
                   <p className="text-[10px] font-black uppercase text-white/60 mb-2 tracking-widest">Delivering To</p>
                   <p className="font-bold text-sm text-white leading-relaxed opacity-90 line-clamp-2">{viewingOrder?.address}</p>
               </div>
            </div>
            
            {/* Action Buttons */}
            <button 
                onClick={() => setCurrentRoute(AppRoute.ORDER_DETAIL)} 
                className="w-full max-w-[280px] py-4 rounded-full border border-white/60 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-[#6ee7b7] hover:border-white transition-all duration-300 shadow-sm mb-6 bg-white/5 backdrop-blur-sm"
            >
                View Order Details
            </button>
            
            <button 
                onClick={() => setCurrentRoute(AppRoute.STORE)} 
                className="text-[10px] font-black uppercase tracking-[0.15em] text-white/80 hover:text-white border-b border-white/30 hover:border-white pb-1 transition-all"
            >
                Continue Shopping
            </button>
        </div>
     </div>
  );
  
  const renderOrderDetail = () => {
        if (!viewingOrder) return null;
        
        // Visual Tracking Stepper Logic
        const steps = ['processing', 'shipped', 'delivered'];
        const currentStepIndex = viewingOrder.status === 'cancelled' ? -1 : steps.indexOf(viewingOrder.status) === -1 ? 0 : steps.indexOf(viewingOrder.status);
        
        return (
            <div className="p-6 animate-slide-up bg-gray-50 min-h-screen pb-24">
                <div className="flex items-center mb-6">
                    <button onClick={() => setCurrentRoute(AppRoute.PROFILE)} className="mr-4"><i className="fa-solid fa-arrow-left"></i></button>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Order #{viewingOrder.orderNumber}</h2>
                </div>
                
                {/* Visual Order Tracker */}
                {viewingOrder.status !== 'cancelled' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
                        <div className="flex justify-between items-center relative">
                            {/* Connector Lines */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-0"></div>
                            <div className="absolute top-1/2 left-0 h-1 bg-green-500 -z-0 transition-all duration-500" style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}></div>
                            
                            {steps.map((step, idx) => {
                                const isCompleted = idx <= currentStepIndex;
                                return (
                                    <div key={step} className="relative z-10 flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
                                            <i className={`fa-solid ${idx === 0 ? 'fa-box' : idx === 1 ? 'fa-truck-fast' : 'fa-check'}`}></i>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase mt-2 tracking-widest ${isCompleted ? 'text-black' : 'text-gray-300'}`}>{step}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Status Badge (Fallback/Supplementary) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500 font-bold mb-1">Placed on {viewingOrder.date}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{viewingOrder.items.length} Items</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        viewingOrder.status === 'delivered' ? 'bg-green-100 text-green-600' : 
                        viewingOrder.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-600'
                    }`}>
                        {viewingOrder.status}
                    </span>
                </div>

                {/* Items */}
                <div className="space-y-4 mb-6">
                    {viewingOrder.items.map((item, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm">
                            <div className="flex gap-4 mb-3">
                                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                    <img src={item.image} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm uppercase">{item.name}</h3>
                                    <p className="text-xs text-gray-500 font-medium">Qty: {item.quantity}</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {item.selectedOptions && Object.entries(item.selectedOptions).map(([key, val]) => (
                                            <span key={key} className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-600 font-bold">{key}: {val}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Custom Images */}
                            {item.uploadedImages && item.uploadedImages.length > 0 && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Your Custom Uploads</p>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                        {item.uploadedImages.map((img, i) => (
                                            <img key={i} src={img} className="w-12 h-12 rounded-lg object-cover border" />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="text-right mt-2 border-t pt-2">
                                <p className="font-black text-sm">₹{item.price * item.quantity}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Delivery Address</p>
                        <p className="font-bold text-sm leading-relaxed">{viewingOrder.address}</p>
                        <p className="text-xs font-bold text-gray-500 mt-1">Contact: {viewingOrder.phone}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Payment Details</p>
                        <p className="font-bold text-sm">{viewingOrder.paymentMethod}</p>
                        {viewingOrder.paymentDetails?.upiId && <p className="text-xs text-gray-500 mt-1">UPI: {viewingOrder.paymentDetails.upiId}</p>}
                    </div>
                </div>
                
                {/* Summary */}
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between text-sm font-medium text-gray-500 mb-2"><span>Subtotal</span><span>₹{viewingOrder.total - viewingOrder.shipping}</span></div>
                    <div className="flex justify-between text-sm font-medium text-gray-500 mb-2"><span>Shipping</span><span>₹{viewingOrder.shipping}</span></div>
                    <div className="flex justify-between text-xl font-black border-t pt-4"><span>Total Paid</span><span>₹{viewingOrder.total}</span></div>
                </div>

                {/* Cancel Button */}
                {viewingOrder.status === 'processing' && (
                    <div className="mt-6 pb-8">
                        <button 
                            type="button"
                            onClick={() => handleCancelOrder(viewingOrder.id)}
                            className="w-full border-2 border-red-100 text-red-500 font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-red-50 transition text-xs active:scale-95"
                        >
                            Cancel Order
                        </button>
                        <p className="text-center text-[10px] text-gray-400 mt-2 font-medium">
                            Orders can only be cancelled while they are still processing.
                        </p>
                    </div>
                )}
            </div>
        );
  };

  const renderProfile = () => {
    if (!isLoggedIn) {
      return (
        <div className="p-6 animate-slide-up bg-white min-h-screen flex flex-col justify-center max-w-md mx-auto">
          <div className="text-center mb-10">
             <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">FYX.</h1>
             <p className="text-gray-500 font-medium text-sm">Your premium style destination.</p>
          </div>

          {loginStep === 'input' ? (
            <div className="space-y-6 animate-fade-in">
               <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Mobile Number or Email</label>
                  <input 
                    type="text" 
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="e.g. 9876543210 or name@example.com"
                    className="w-full bg-gray-50 p-4 rounded-xl text-lg font-bold outline-none border-2 border-transparent focus:border-black transition placeholder:text-gray-300"
                  />
               </div>
               <button 
                  onClick={handleSendOtp} 
                  disabled={isOtpLoading}
                  className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition shadow-lg flex items-center justify-center disabled:opacity-70"
               >
                  {isOtpLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Continue'}
               </button>
               <div className="flex items-center gap-4 my-6">
                  <div className="h-px bg-gray-100 flex-1"></div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Or Login With</span>
                  <div className="h-px bg-gray-100 flex-1"></div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setShowGoogleLoginModal(true)} className="border border-gray-200 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition">
                     <i className="fa-brands fa-google text-red-500"></i>
                     <span className="text-xs font-bold">Google</span>
                  </button>
                   <button onClick={() => showToast("Apple Login Simulated")} className="border border-gray-200 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition">
                     <i className="fa-brands fa-apple"></i>
                     <span className="text-xs font-bold">Apple</span>
                  </button>
               </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
               <div className="text-center mb-6">
                  <p className="text-sm font-bold text-gray-400">Enter OTP sent to</p>
                  <p className="text-lg font-black">{loginInput} <button onClick={() => setLoginStep('input')} className="text-xs text-blue-600 underline ml-2">Edit</button></p>
               </div>
               <div>
                  <input 
                    type="text" 
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Enter 4-digit OTP"
                    className="w-full bg-gray-50 p-4 rounded-xl text-center text-2xl font-black outline-none border-2 border-transparent focus:border-black transition tracking-widest"
                  />
                  <p className="text-center text-[10px] text-green-600 font-bold mt-2 bg-green-50 py-1 rounded">
                     <i className="fa-solid fa-circle-check mr-1"></i> Demo OTP Sent: 1234
                  </p>
               </div>
               <button onClick={handleVerifyOtp} className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition shadow-lg mt-6">
                  Verify & Login
               </button>
               <p className="text-center text-[10px] font-bold text-gray-400 mt-4">
                  Didn't receive code? <button className="text-black underline" onClick={handleSendOtp}>Resend</button>
               </p>
            </div>
          )}

          <p className="text-center text-[10px] text-gray-400 mt-10 leading-relaxed max-w-xs mx-auto">
             By continuing, you agree to FYX's <span className="underline cursor-pointer">Terms of Use</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      );
    }

    return (
      <div className="p-6 animate-slide-up bg-gray-50 min-h-screen pb-24">
         {/* Header */}
         <div className="flex justify-between items-end mb-8">
            <div>
               <h1 className="text-3xl font-black italic uppercase tracking-tighter">Hello, {userAddress.name.split(' ')[0]}</h1>
               <p className="text-xs font-bold text-gray-400">Welcome back to your premium space.</p>
            </div>
            <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-black hover:bg-red-50 hover:text-red-500 transition">
               <i className="fa-solid fa-right-from-bracket text-sm"></i>
            </button>
         </div>

         {/* Stats Row */}
         <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
               <p className="text-2xl font-black">{myOrders.length}</p>
               <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">Orders</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
               <p className="text-2xl font-black">{wishlist.length}</p>
               <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">Wishlist</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
               <div className="inline-flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full mb-1">
                  <i className="fa-solid fa-crown text-yellow-600 text-xs"></i>
               </div>
               <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">Gold Member</p>
            </div>
         </div>

         {/* Membership Card */}
         <div className="bg-[#1a1614] text-white p-6 rounded-3xl shadow-lg mb-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <div className="flex justify-between items-start mb-6">
               <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-black border border-white/20">
                     {userAddress.name.charAt(0)}
                  </div>
                  <div>
                     <h3 className="font-bold text-lg leading-none mb-1">{userAddress.name}</h3>
                     <p className="text-xs text-white/50 font-medium">{userAddress.email}</p>
                  </div>
               </div>
               <button onClick={() => setShowEditProfileModal(true)} className="bg-white/10 hover:bg-white hover:text-black transition px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider backdrop-blur-sm border border-white/10">Edit</button>
            </div>
            <div className="space-y-2">
               <div className="flex items-start gap-3">
                  <i className="fa-solid fa-location-dot text-white/40 text-xs mt-1"></i>
                  <div>
                     <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-0.5">Shipping Address</p>
                     <p className="text-xs font-medium leading-relaxed text-white/90 line-clamp-2">{userAddress.line || "No address set"}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 pt-2">
                  <i className="fa-solid fa-phone text-white/40 text-xs"></i>
                  <p className="text-xs font-medium text-white/90">{userAddress.phone || "No phone set"}</p>
               </div>
            </div>
         </div>

         {/* Order History */}
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-black uppercase italic tracking-tighter">Recent Orders</h3>
            {myOrders.length > 0 && <button className="text-[10px] font-black uppercase text-gray-400 underline">View All</button>}
         </div>
         
         <div className="space-y-4">
            {myOrders.length === 0 ? (
               <div className="text-center py-10 bg-gray-100 rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">No orders placed yet</p>
                  <button onClick={() => setCurrentRoute(AppRoute.STORE)} className="text-xs font-black underline">Start Shopping</button>
               </div>
            ) : (
               myOrders.map(order => (
                  <div key={order.id} onClick={() => { setViewingOrder(order); setCurrentRoute(AppRoute.ORDER_DETAIL); }} className="bg-white p-5 rounded-3xl shadow-sm cursor-pointer hover:shadow-md transition border border-gray-50 group">
                     <div className="flex justify-between items-center mb-4">
                        <div>
                           <p className="font-black text-xs text-gray-900 mb-0.5">{order.orderNumber}</p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase">{order.date}</p>
                        </div>
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wide ${
                           order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                           order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                           'bg-yellow-100 text-yellow-700'
                        }`}>
                           {order.status}
                        </span>
                     </div>
                     
                     {/* Product Thumbnails */}
                     <div className="flex gap-2 overflow-hidden mb-4">
                        {order.items.slice(0, 4).map((item, i) => (
                           <div key={i} className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
                              <img src={item.image} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" />
                           </div>
                        ))}
                        {order.items.length > 4 && (
                           <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-400 border border-gray-100">
                              +{order.items.length - 4}
                           </div>
                        )}
                     </div>

                     <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{order.items.length} Items</p>
                        <div className="flex items-center gap-2">
                           <p className="font-black text-sm">₹{order.total}</p>
                           <i className="fa-solid fa-chevron-right text-[10px] text-gray-300"></i>
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>

         {/* Quick Actions Grid */}
         <div className="mt-8 grid grid-cols-2 gap-3">
            {userAddress.email === ADMIN_EMAIL && (
               <button onClick={() => setCurrentRoute(AppRoute.ADMIN_DASHBOARD)} className="col-span-2 bg-black text-white p-4 rounded-2xl flex items-center justify-between group shadow-lg">
                  <div className="flex items-center space-x-3">
                     <i className="fa-solid fa-gauge-high"></i>
                     <span className="font-black text-xs uppercase tracking-widest">Admin Dashboard</span>
                  </div>
                  <i className="fa-solid fa-arrow-right transform group-hover:translate-x-1 transition"></i>
               </button>
            )}
            
            <button className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition shadow-sm">
               <i className="fa-solid fa-headset text-xl text-gray-800"></i>
               <span className="font-bold text-[10px] uppercase tracking-wide">Help Center</span>
            </button>
            
            <button className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition shadow-sm">
               <i className="fa-solid fa-map-location-dot text-xl text-gray-800"></i>
               <span className="font-bold text-[10px] uppercase tracking-wide">Addresses</span>
            </button>
         </div>
      </div>
    );
  };

  const renderAdminSiteSettings = () => (
     <div className="animate-fade-in max-w-2xl">
        <h2 className="text-xl font-black italic uppercase mb-6">General Settings</h2>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
           <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Store Name</label>
              <input type="text" value={settings.siteName} onChange={(e) => setSettings({...settings, siteName: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
           </div>
           <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Support Email</label>
              <input type="text" value={settings.supportEmail} onChange={(e) => setSettings({...settings, supportEmail: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
           </div>
           <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
               <span className="font-bold text-sm">Maintenance Mode</span>
               <button onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})} className={`w-12 h-6 rounded-full transition relative ${settings.maintenanceMode ? 'bg-black' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
               </button>
           </div>
           <div className="pt-4 border-t flex justify-between gap-4">
               <button onClick={resetAllData} className="border border-red-200 text-red-500 hover:bg-red-50 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition">
                   Reset App Data
               </button>
               <button onClick={() => showToast("Settings Saved")} className="bg-black text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition">Save Changes</button>
           </div>
        </div>
     </div>
  );

  const renderAdminDashboard = () => (
    <div className="animate-fade-in space-y-8">
      <div className="bg-gradient-to-r from-gray-900 to-black rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
           <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Daily Insight</h2>
           <p className="text-gray-400 font-medium max-w-2xl text-lg leading-relaxed">{adminStatsMsg}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Total Revenue', val: `₹${orders.reduce((acc, o) => acc + o.total, 0)}`, icon: 'fa-indian-rupee-sign', color: 'text-green-500' },
           { label: 'Active Orders', val: orders.filter(o => o.status === 'processing').length, icon: 'fa-box', color: 'text-blue-500' },
           { label: 'Total Customers', val: customers.length, icon: 'fa-users', color: 'text-purple-500' },
           { label: 'Low Stock Items', val: products.filter(p => p.stock < 10).length, icon: 'fa-triangle-exclamation', color: 'text-red-500' }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{stat.label}</p>
                 <p className="text-2xl font-black">{stat.val}</p>
              </div>
              <div className={`w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center ${stat.color}`}>
                 <i className={`fa-solid ${stat.icon} text-lg`}></i>
              </div>
           </div>
         ))}
      </div>
    </div>
  );

  const renderAdminProducts = () => (
    <div className="animate-fade-in">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black italic uppercase">Inventory</h2>
          <button onClick={() => openEditProduct(null)} className="bg-black text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg hover:scale-105 transition">
             <i className="fa-solid fa-plus mr-2"></i> Add Product
          </button>
       </div>
       <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left">
             <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                   <th className="p-4 text-[10px] font-black uppercase text-gray-400">Product</th>
                   <th className="p-4 text-[10px] font-black uppercase text-gray-400">Category</th>
                   <th className="p-4 text-[10px] font-black uppercase text-gray-400">Price</th>
                   <th className="p-4 text-[10px] font-black uppercase text-gray-400">Stock</th>
                   <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                   <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 flex items-center gap-3">
                         <img src={p.image} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                         <span className="font-bold text-sm">{p.name}</span>
                      </td>
                      <td className="p-4 text-xs font-medium text-gray-500">{p.category}</td>
                      <td className="p-4 text-sm font-black">₹{p.price}</td>
                      <td className="p-4 text-xs font-bold">{p.stock} Units</td>
                      <td className="p-4 text-right">
                         <button onClick={() => openEditProduct(p)} className="text-gray-400 hover:text-black transition"><i className="fa-solid fa-pen-to-square"></i></button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderAdminCategories = () => (
    <div className="animate-fade-in max-w-4xl">
       <h2 className="text-2xl font-black italic uppercase mb-6">Categories</h2>
       <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8">
          <div className="flex gap-4">
             <input 
               type="text" 
               value={newCategoryName}
               onChange={(e) => setNewCategoryName(e.target.value)}
               placeholder="New Category Name" 
               className="flex-1 bg-gray-50 p-4 rounded-xl font-bold text-sm outline-none border focus:border-black"
             />
             <button onClick={handleAddCategory} className="bg-black text-white px-8 rounded-xl font-black text-xs uppercase shadow-lg">Add</button>
          </div>
       </div>
       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {storeCategories.map(cat => (
             <div key={cat} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                <span className="font-bold text-sm">{cat}</span>
                <button onClick={() => handleDeleteCategory(cat)} className="text-red-400 hover:text-red-600"><i className="fa-solid fa-trash"></i></button>
             </div>
          ))}
       </div>
    </div>
  );

  const renderAdminOrders = () => (
    <div className="animate-fade-in">
       <h2 className="text-2xl font-black italic uppercase mb-6">Recent Orders</h2>
       <div className="space-y-4">
          {orders.map(order => (
             <div key={order.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                   <div>
                      <h3 className="font-black text-lg">{order.orderNumber}</h3>
                      <p className="text-xs text-gray-500 font-bold">{order.customerName} • {order.items.length} Items • {order.date}</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <select 
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="bg-gray-50 border-none text-xs font-black uppercase rounded-lg py-2 px-3 outline-none cursor-pointer hover:bg-gray-100"
                      >
                         <option value="processing">Processing</option>
                         <option value="shipped">Shipped</option>
                         <option value="delivered">Delivered</option>
                         <option value="cancelled">Cancelled</option>
                      </select>
                      <button onClick={() => { setViewingOrder(order); setCurrentRoute(AppRoute.ORDER_DETAIL); }} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-black hover:text-white transition"><i className="fa-solid fa-eye text-xs"></i></button>
                   </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                   {order.items.map((item, idx) => (
                      <div key={idx} className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden border">
                         <img src={item.image} className="w-full h-full object-cover" />
                      </div>
                   ))}
                </div>
             </div>
          ))}
       </div>
    </div>
  );

  const renderAdminCustomers = () => (
    <div className="animate-fade-in">
       <h2 className="text-2xl font-black italic uppercase mb-6">Customers</h2>
       <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left">
             <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                   <th className="p-4 text-[10px] font-black uppercase text-gray-400">Name</th>
                   <th className="p-4 text-[10px] font-black uppercase text-gray-400">Contact</th>
                   <th className="p-4 text-[10px] font-black uppercase text-gray-400">Orders</th>
                   <th className="p-4 text-[10px] font-black uppercase text-gray-400">Total Spent</th>
                   <th className="p-4 text-[10px] font-black uppercase text-gray-400">Status</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                {customers.map(c => (
                   <tr key={c.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-bold text-sm">{c.name}</td>
                      <td className="p-4">
                         <p className="text-xs font-bold">{c.email}</p>
                         <p className="text-[10px] text-gray-400">{c.phone}</p>
                      </td>
                      <td className="p-4 text-xs font-bold">{c.orders}</td>
                      <td className="p-4 text-sm font-black">₹{c.spent}</td>
                      <td className="p-4"><span className="bg-green-100 text-green-600 px-2 py-1 rounded text-[10px] font-black uppercase">{c.status}</span></td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderAdminSupport = () => (
    <div className="animate-fade-in">
       <h2 className="text-2xl font-black italic uppercase mb-6">Support Tickets</h2>
       <div className="grid gap-4">
          {tickets.map(t => (
             <div key={t.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${t.status === 'Open' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                      <h3 className="font-bold text-sm">{t.subject}</h3>
                   </div>
                   <p className="text-xs text-gray-500 font-medium">From: {t.user} • {t.date}</p>
                </div>
                <div className="text-right">
                   <span className="block text-[10px] font-black uppercase bg-gray-100 px-2 py-1 rounded mb-2">{t.id}</span>
                   <button className="text-xs font-bold underline">View Thread</button>
                </div>
             </div>
          ))}
       </div>
    </div>
  );

  const renderAdminChat = () => (
     <div className="animate-fade-in h-[600px] flex bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="w-1/3 border-r border-gray-100 bg-gray-50 flex flex-col">
           <div className="p-4 border-b border-gray-200">
              <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">Active Chats</h3>
           </div>
           <div className="flex-1 overflow-y-auto">
              {chatSessions.map(c => (
                 <div key={c.id} className="p-4 hover:bg-white cursor-pointer border-b border-gray-100">
                    <div className="flex justify-between mb-1">
                       <span className="font-bold text-sm">{c.user}</span>
                       <span className="text-[10px] text-gray-400">{c.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{c.lastMsg}</p>
                 </div>
              ))}
           </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
           <i className="fa-regular fa-comments text-4xl mb-4"></i>
           <p className="font-bold text-sm">Select a conversation</p>
        </div>
     </div>
  );

  const renderAdminDiscounts = () => (
    <div className="animate-fade-in">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black italic uppercase">Discounts</h2>
          <button onClick={() => openGenericModal('discount')} className="bg-black text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg hover:scale-105 transition">
             Create Code
          </button>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {discounts.map(d => (
             <div key={d.code} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-50 transition"></div>
                <h3 className="text-xl font-black tracking-tight mb-1 relative z-10">{d.code}</h3>
                <p className="text-xs font-bold text-gray-500 mb-4 relative z-10">{d.value}% Off • {d.type}</p>
                <div className="flex justify-between items-end relative z-10">
                   <div>
                      <p className="text-[10px] font-black uppercase text-gray-300">Usage</p>
                      <p className="font-bold">{d.usage} times</p>
                   </div>
                   <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${d.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{d.status}</span>
                </div>
             </div>
          ))}
       </div>
    </div>
  );

  const renderAdminFAQ = () => (
     <div className="animate-fade-in max-w-3xl">
        <h2 className="text-2xl font-black italic uppercase mb-6">FAQ Management</h2>
        <div className="space-y-4">
           {faqs.map(faq => (
              <div key={faq.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                 <h3 className="font-bold text-sm mb-2">Q: {faq.question}</h3>
                 <p className="text-sm text-gray-500">A: {faq.answer}</p>
                 <div className="mt-4 flex gap-4">
                    <button className="text-[10px] font-black uppercase text-gray-400 hover:text-black">Edit</button>
                    <button className="text-[10px] font-black uppercase text-red-400 hover:text-red-600">Delete</button>
                 </div>
              </div>
           ))}
        </div>
     </div>
  );

  const renderAdminNewsletter = () => (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
       <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
             <h3 className="font-black text-lg mb-4">AI Campaign Generator</h3>
             <div className="space-y-4">
                <input 
                  type="text" 
                  value={newsletterTopic}
                  onChange={(e) => setNewsletterTopic(e.target.value)}
                  placeholder="Campaign Topic (e.g. Monsoon Sale)" 
                  className="w-full bg-gray-50 p-4 rounded-xl font-bold text-sm outline-none border focus:border-black"
                />
                <button onClick={handleGenerateEmail} disabled={isGeneratingEmail} className="bg-black text-white px-8 py-3 rounded-xl font-black text-xs uppercase shadow-lg disabled:opacity-50">
                   {isGeneratingEmail ? 'Generating...' : 'Generate Draft'}
                </button>
                {generatedEmail && (
                   <div className="bg-gray-50 p-6 rounded-2xl mt-4 border border-dashed border-gray-300">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-600 leading-relaxed">{generatedEmail}</pre>
                      <button className="mt-4 text-xs font-bold underline">Use this Draft</button>
                   </div>
                )}
             </div>
          </div>
       </div>
       <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
             <h3 className="font-black text-sm mb-4">Recent Subscribers</h3>
             <div className="space-y-4">
                {subscribers.map((sub, i) => (
                   <div key={i} className="flex justify-between items-center">
                      <div className="truncate pr-2">
                         <p className="font-bold text-xs truncate">{sub.email}</p>
                         <p className="text-[10px] text-gray-400">{sub.date}</p>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${sub.status === 'Subscribed' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );

  const renderAdminPopups = () => (
     <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-black italic uppercase">Popups & Banners</h2>
           <button onClick={() => openPromotionModal(null)} className="bg-black text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg hover:scale-105 transition">
              Create New
           </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {promotions.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative">
                 <div className="flex justify-between items-start mb-4">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-black uppercase">{p.type}</span>
                    <div className="flex gap-2">
                       <button onClick={() => openPromotionModal(p)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-black hover:text-white transition"><i className="fa-solid fa-pen text-xs"></i></button>
                       <button onClick={() => handleDeletePromotion(p.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition"><i className="fa-solid fa-trash text-xs"></i></button>
                    </div>
                 </div>
                 <h3 className="font-black text-lg mb-1">{p.title}</h3>
                 <p className="text-xs text-gray-500 font-medium mb-4 line-clamp-2">{p.content}</p>
                 <div className="flex justify-between items-center border-t pt-4">
                    <span className={`text-[10px] font-black uppercase ${p.status === 'Active' ? 'text-green-500' : 'text-gray-400'}`}>{p.status}</span>
                    <span className="text-[10px] font-bold text-gray-400">{p.displayRule}</span>
                 </div>
              </div>
           ))}
        </div>
     </div>
  );

  const renderAdminTheme = () => (
      <div className="animate-fade-in max-w-2xl">
          <h2 className="text-xl font-black italic uppercase mb-6">Theme Settings</h2>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Primary Color</label>
                  <div className="flex gap-4 items-center">
                      <input type="color" value={settings.primaryColor} onChange={(e) => setSettings({...settings, primaryColor: e.target.value})} className="w-12 h-12 rounded-xl cursor-pointer border-none" />
                      <span className="font-bold text-sm">{settings.primaryColor}</span>
                  </div>
              </div>
              <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Font Family</label>
                  <select value={settings.fontFamily} onChange={(e) => setSettings({...settings, fontFamily: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none">
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Poppins">Poppins</option>
                  </select>
              </div>
              <button onClick={() => showToast("Theme Updated")} className="bg-black text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">Save Theme</button>
          </div>
      </div>
  );

  const renderAdminEmailTemplates = () => (
      <div className="animate-fade-in">
          <h2 className="text-2xl font-black italic uppercase mb-6">Email Templates</h2>
          <div className="space-y-4">
              {emailTemplates.map(t => (
                  <div key={t.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                      <div>
                          <h3 className="font-bold text-sm">{t.name}</h3>
                          <p className="text-xs text-gray-500">Subject: {t.subject}</p>
                      </div>
                      <span className="bg-gray-100 px-3 py-1 rounded text-[10px] font-black uppercase text-gray-500">{t.type}</span>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderAdminShipping = () => (
      <div className="animate-fade-in max-w-3xl">
          <h2 className="text-2xl font-black italic uppercase mb-6">Shipping Rules</h2>
          <div className="space-y-4">
              {shippingRules.map(rule => (
                  <div key={rule.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                      <div>
                          <h3 className="font-bold text-sm">{rule.name}</h3>
                          <p className="text-xs text-gray-500">{rule.condition}</p>
                      </div>
                      <p className="font-black text-sm">₹{rule.cost}</p>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderAdminTax = () => (
      <div className="animate-fade-in max-w-3xl">
          <h2 className="text-2xl font-black italic uppercase mb-6">Tax Rules</h2>
          <div className="space-y-4">
              {taxRules.map(rule => (
                  <div key={rule.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                      <div>
                          <h3 className="font-bold text-sm">{rule.name}</h3>
                          <p className="text-xs text-gray-500">Region: {rule.region}</p>
                      </div>
                      <p className="font-black text-sm">{rule.rate}%</p>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderAdminBlog = () => (
      <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase">Blog Posts</h2>
              <button onClick={() => openGenericModal('blog')} className="bg-black text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg">New Post</button>
          </div>
          <div className="grid gap-4">
              {blogPosts.map(post => (
                  <div key={post.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                      <div>
                          <h3 className="font-bold text-lg">{post.title}</h3>
                          <p className="text-xs text-gray-500">By {post.author} • {post.date}</p>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${post.status === 'Published' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{post.status}</span>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderAdminPages = () => (
      <div className="animate-fade-in">
          <h2 className="text-2xl font-black italic uppercase mb-6">Custom Pages</h2>
          <div className="space-y-4">
              {cmsPages.map(page => (
                  <div key={page.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                      <div>
                          <h3 className="font-bold text-sm">{page.title}</h3>
                          <p className="text-xs text-gray-500">{page.slug}</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">Last Modified: {page.lastModified}</span>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderAdminFlashSales = () => (
      <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase">Flash Sales</h2>
              <button onClick={() => openGenericModal('flash')} className="bg-black text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg">Create Campaign</button>
          </div>
          <div className="grid gap-4">
              {flashSales.map(sale => (
                  <div key={sale.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                      <div>
                          <h3 className="font-black text-lg">{sale.name}</h3>
                          <p className="text-xs text-gray-500 font-bold">{sale.discount} Discount • Ends in {sale.endsIn}</p>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${sale.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{sale.status}</span>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderAdminSegments = () => (
      <div className="animate-fade-in">
          <h2 className="text-2xl font-black italic uppercase mb-6">Customer Segments</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {customerSegments.map(seg => (
                  <div key={seg.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <h3 className="font-black text-lg mb-2">{seg.name}</h3>
                      <p className="text-xs text-gray-500 mb-4">{seg.criteria}</p>
                      <p className="text-2xl font-black">{seg.count} <span className="text-xs font-bold text-gray-400">Users</span></p>
                  </div>
              ))}
          </div>
      </div>
  );

  return (
    <>
      {currentRoute.startsWith('admin') ? (
        <AdminLayout onNavigate={setCurrentRoute} currentRoute={currentRoute}>
            {currentRoute === AppRoute.ADMIN_DASHBOARD && renderAdminDashboard()}
            {currentRoute === AppRoute.ADMIN_PRODUCTS && renderAdminProducts()}
            {currentRoute === AppRoute.ADMIN_CATEGORIES && renderAdminCategories()}
            {currentRoute === AppRoute.ADMIN_ORDERS && renderAdminOrders()}
            {currentRoute === AppRoute.ADMIN_CUSTOMERS && renderAdminCustomers()}
            {currentRoute === AppRoute.ADMIN_SUPPORT && renderAdminSupport()}
            {currentRoute === AppRoute.ADMIN_CHAT && renderAdminChat()}
            {currentRoute === AppRoute.ADMIN_DISCOUNTS && renderAdminDiscounts()}
            {currentRoute === AppRoute.ADMIN_FAQ && renderAdminFAQ()}
            {currentRoute === AppRoute.ADMIN_NEWSLETTER && renderAdminNewsletter()}
            {currentRoute === AppRoute.ADMIN_LAYOUT && renderAdminSiteSettings()}
            {currentRoute === AppRoute.ADMIN_SITE_SETTINGS && renderAdminSiteSettings()}
            {currentRoute === AppRoute.ADMIN_THEME && renderAdminTheme()}
            {currentRoute === AppRoute.ADMIN_POPUPS && renderAdminPopups()}
            {currentRoute === AppRoute.ADMIN_EMAIL_TEMPLATES && renderAdminEmailTemplates()}
            {currentRoute === AppRoute.ADMIN_SHIPPING && renderAdminShipping()}
            {currentRoute === AppRoute.ADMIN_TAX && renderAdminTax()}
            {currentRoute === AppRoute.ADMIN_BLOG && renderAdminBlog()}
            {currentRoute === AppRoute.ADMIN_PAGES && renderAdminPages()}
            {currentRoute === AppRoute.ADMIN_FLASH_SALES && renderAdminFlashSales()}
            {currentRoute === AppRoute.ADMIN_SEGMENTS && renderAdminSegments()}
            
            {!Object.values(AppRoute).filter(r => r.startsWith('admin') && currentRoute === r).length && (
              <div className="flex items-center justify-center h-full text-gray-400 font-bold uppercase tracking-widest">Select a Module</div>
            )}
        </AdminLayout>
      ) : (
        <StorefrontLayout 
          onNavigate={setCurrentRoute} 
          cartCount={cartCount} 
          wishlistCount={wishlist.length}
          currentRoute={currentRoute}
          activeBanner={activeBanner}
          onCloseBanner={() => activeBanner && closePromotion(activeBanner.id)}
        >
          {currentRoute === AppRoute.STORE && renderHome()}
          {currentRoute === AppRoute.SEARCH && renderSearch()}
          {currentRoute === AppRoute.PRODUCT_DETAIL && renderProductDetail()}
          {currentRoute === AppRoute.CART && renderCart()}
          {currentRoute === AppRoute.WISHLIST && renderWishlist()}
          {currentRoute === AppRoute.CHECKOUT && renderCheckout()}
          {currentRoute === AppRoute.ORDER_SUCCESS && renderOrderSuccess()}
          {currentRoute === AppRoute.ORDER_DETAIL && renderOrderDetail()}
          {currentRoute === AppRoute.PROFILE && renderProfile()}
          {currentRoute === AppRoute.MY_ORDERS && renderProfile()}
        </StorefrontLayout>
      )}
      
      {/* Global Modals */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
               <h2 className="text-2xl font-black italic uppercase mb-6">{editingProduct?.id ? 'Edit Product' : 'New Product'}</h2>
               <div className="space-y-4">
                  <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Product Name</label>
                      <input type="text" value={editingProduct?.name || ''} onChange={(e) => setEditingProduct(prev => ({...prev!, name: e.target.value}))} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Price (₹)</label>
                          <input type="number" value={editingProduct?.price || ''} onChange={(e) => setEditingProduct(prev => ({...prev!, price: Number(e.target.value)}))} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Old Price (Optional)</label>
                          <input type="number" value={editingProduct?.oldPrice || ''} onChange={(e) => setEditingProduct(prev => ({...prev!, oldPrice: Number(e.target.value)}))} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                      </div>
                  </div>
                  <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Category</label>
                      <select value={editingProduct?.category || ''} onChange={(e) => setEditingProduct(prev => ({...prev!, category: e.target.value}))} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black">
                          {storeCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Description</label>
                      <div className="relative">
                        <textarea value={editingProduct?.description || ''} onChange={(e) => setEditingProduct(prev => ({...prev!, description: e.target.value}))} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black min-h-[100px]" />
                        <button onClick={handleGenerateDescription} disabled={isGeneratingDesc} className="absolute bottom-2 right-2 bg-black text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-md disabled:opacity-50">
                            {isGeneratingDesc ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <span><i className="fa-solid fa-wand-magic-sparkles mr-1"></i> AI Write</span>}
                        </button>
                      </div>
                  </div>
                  <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Image</label>
                      <div className="flex gap-2 mb-2">
                        <input type="text" value={editingProduct?.image || ''} onChange={(e) => setEditingProduct(prev => ({...prev!, image: e.target.value}))} placeholder="Image URL" className="flex-1 bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                        <label className="bg-gray-100 px-4 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-200">
                           <i className="fa-solid fa-upload"></i>
                           <input type="file" accept="image/*" onChange={handleProductImageUpload} className="hidden" />
                        </label>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-dashed border-gray-300">
                          <div className="flex gap-2">
                              <input type="text" value={aiImagePrompt} onChange={(e) => setAiImagePrompt(e.target.value)} placeholder="Describe image for AI generation..." className="flex-1 bg-white p-2 rounded-lg text-sm outline-none border" />
                              <button onClick={handleGenerateImage} disabled={isGeneratingImage} className="bg-black text-white px-3 rounded-lg text-xs font-bold whitespace-nowrap">{isGeneratingImage ? '...' : 'Generate'}</button>
                          </div>
                          {generatedImage && (
                              <div className="mt-2 relative">
                                  <img src={generatedImage} className="w-full h-32 object-cover rounded-lg" />
                                  <button onClick={applyGeneratedImage} className="absolute bottom-2 right-2 bg-green-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase">Use Image</button>
                              </div>
                          )}
                      </div>
                  </div>
               </div>
               <div className="mt-8 flex gap-4">
                  <button onClick={() => setShowProductModal(false)} className="flex-1 py-3 rounded-xl font-bold text-xs uppercase border border-gray-200 hover:bg-gray-50">Cancel</button>
                  <button onClick={saveProduct} className="flex-1 bg-black text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg">Save Product</button>
               </div>
           </div>
        </div>
      )}

      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
               <h2 className="text-2xl font-black italic uppercase mb-6">Edit Profile</h2>
               <div className="space-y-4">
                  <input type="text" value={userAddress.name} onChange={(e) => setUserAddress({...userAddress, name: e.target.value})} placeholder="Full Name" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                  <input type="email" value={userAddress.email} onChange={(e) => setUserAddress({...userAddress, email: e.target.value})} placeholder="Email" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                  <input type="text" value={userAddress.phone} onChange={(e) => setUserAddress({...userAddress, phone: e.target.value})} placeholder="Phone" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                  <div className="grid grid-cols-2 gap-4">
                      <select value={userAddress.gender} onChange={(e) => setUserAddress({...userAddress, gender: e.target.value})} className="bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none">
                          <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                      <input type="date" value={userAddress.dob} onChange={(e) => setUserAddress({...userAddress, dob: e.target.value})} className="bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none" />
                  </div>
                  <div className="border-t pt-4">
                      <p className="text-xs font-black uppercase text-gray-400 mb-2">Address Details</p>
                      <input type="text" value={userAddress.houseNo} onChange={(e) => setUserAddress({...userAddress, houseNo: e.target.value})} placeholder="House No / Flat" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black mb-2" />
                      <input type="text" value={userAddress.street} onChange={(e) => setUserAddress({...userAddress, street: e.target.value})} placeholder="Street / Area" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black mb-2" />
                      <div className="grid grid-cols-2 gap-2 mb-2">
                          <input type="text" value={userAddress.city} onChange={(e) => setUserAddress({...userAddress, city: e.target.value})} placeholder="City" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                          <input type="text" value={userAddress.pincode} onChange={(e) => setUserAddress({...userAddress, pincode: e.target.value})} placeholder="Pincode" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                      </div>
                      <input type="text" value={userAddress.state} onChange={(e) => setUserAddress({...userAddress, state: e.target.value})} placeholder="State" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                  </div>
               </div>
               <div className="mt-8 flex gap-4">
                  <button onClick={() => setShowEditProfileModal(false)} className="flex-1 py-3 rounded-xl font-bold text-xs uppercase border border-gray-200 hover:bg-gray-50">Cancel</button>
                  <button onClick={saveProfileChanges} className="flex-1 bg-black text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg">Save Changes</button>
               </div>
           </div>
        </div>
      )}

      {/* Generic Modal */}
      {showGenericModal && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl p-8 w-full max-w-md">
                  <h2 className="text-2xl font-black italic uppercase mb-6">{genericModalType === 'discount' ? 'New Discount' : genericModalType === 'flash' ? 'Flash Sale' : 'New Blog Post'}</h2>
                  <div className="space-y-4">
                      {genericModalType === 'discount' && (
                          <>
                              <input type="text" value={genericInputs.field1} onChange={(e) => setGenericInputs({...genericInputs, field1: e.target.value})} placeholder="Discount Code (e.g. SUMMER10)" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                              <input type="number" value={genericInputs.field2} onChange={(e) => setGenericInputs({...genericInputs, field2: e.target.value})} placeholder="Percentage Value" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                          </>
                      )}
                      {genericModalType === 'flash' && (
                          <>
                              <input type="text" value={genericInputs.field1} onChange={(e) => setGenericInputs({...genericInputs, field1: e.target.value})} placeholder="Campaign Name" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                              <input type="text" value={genericInputs.field2} onChange={(e) => setGenericInputs({...genericInputs, field2: e.target.value})} placeholder="Discount (e.g. 50% Off)" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                              <input type="text" value={genericInputs.field3} onChange={(e) => setGenericInputs({...genericInputs, field3: e.target.value})} placeholder="Duration (e.g. 24 Hours)" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                          </>
                      )}
                      {genericModalType === 'blog' && (
                          <>
                              <input type="text" value={genericInputs.field1} onChange={(e) => setGenericInputs({...genericInputs, field1: e.target.value})} placeholder="Post Title" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                              <input type="text" value={genericInputs.field2} onChange={(e) => setGenericInputs({...genericInputs, field2: e.target.value})} placeholder="Author Name" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                          </>
                      )}
                  </div>
                  <div className="mt-8 flex gap-4">
                      <button onClick={() => setShowGenericModal(false)} className="flex-1 py-3 rounded-xl font-bold text-xs uppercase border border-gray-200 hover:bg-gray-50">Cancel</button>
                      <button onClick={() => {
                          if (genericModalType === 'discount') handleAddDiscount();
                          else if (genericModalType === 'flash') handleAddFlashSale();
                          else if (genericModalType === 'blog') handleAddBlog();
                      }} className="flex-1 bg-black text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg">Create</button>
                  </div>
              </div>
          </div>
      )}

      {showPromotionModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl p-8 w-full max-w-lg">
               <h2 className="text-2xl font-black italic uppercase mb-6">Edit Promotion</h2>
               <div className="space-y-4">
                   <select value={editingPromotion?.type} onChange={(e) => setEditingPromotion(prev => ({...prev!, type: e.target.value as any}))} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none">
                       <option value="banner">Top Banner</option>
                       <option value="popup">Popup Modal</option>
                   </select>
                   <input type="text" value={editingPromotion?.title || ''} onChange={(e) => setEditingPromotion(prev => ({...prev!, title: e.target.value}))} placeholder="Internal Title" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                   <textarea value={editingPromotion?.content || ''} onChange={(e) => setEditingPromotion(prev => ({...prev!, content: e.target.value}))} placeholder="Content / Message" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
                   <input type="text" value={editingPromotion?.ctaText || ''} onChange={(e) => setEditingPromotion(prev => ({...prev!, ctaText: e.target.value}))} placeholder="CTA Text (Optional)" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border focus:border-black" />
               </div>
               <div className="mt-8 flex gap-4">
                   <button onClick={() => setShowPromotionModal(false)} className="flex-1 py-3 rounded-xl font-bold text-xs uppercase border border-gray-200 hover:bg-gray-50">Cancel</button>
                   {editingPromotion?.id && promotions.some(p => p.id === editingPromotion.id) && (
                       <button onClick={() => {handleDeletePromotion(editingPromotion!.id); setShowPromotionModal(false);}} className="flex-1 bg-red-100 text-red-500 py-3 rounded-xl font-black text-xs uppercase">Delete</button>
                   )}
                   <button onClick={savePromotion} className="flex-1 bg-black text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg">Save</button>
               </div>
           </div>
        </div>
      )}

      {showGoogleLoginModal && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center">
                  <i className="fa-brands fa-google text-4xl text-red-500 mb-4"></i>
                  <h3 className="text-xl font-black mb-6">Choose an Account</h3>
                  <div className="space-y-3">
                      <button onClick={() => handleGoogleLoginMock('shourya@fyx.com', 'Shourya Singh')} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl border transition">
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">S</div>
                          <div className="text-left">
                              <p className="text-sm font-bold">Shourya Singh</p>
                              <p className="text-xs text-gray-500">shourya@fyx.com</p>
                          </div>
                      </button>
                      <button onClick={() => handleGoogleLoginMock('rahul.v@gmail.com', 'Rahul Verma')} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl border transition">
                          <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">R</div>
                          <div className="text-left">
                              <p className="text-sm font-bold">Rahul Verma</p>
                              <p className="text-xs text-gray-500">rahul.v@gmail.com</p>
                          </div>
                      </button>
                      <button onClick={() => handleGoogleLoginMock('new.user@gmail.com', 'New User')} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl border transition">
                          <div className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center font-bold">N</div>
                          <div className="text-left">
                              <p className="text-sm font-bold">New User</p>
                              <p className="text-xs text-gray-500">new.user@gmail.com</p>
                          </div>
                      </button>
                  </div>
                  <button onClick={() => setShowGoogleLoginModal(false)} className="mt-6 text-xs font-bold text-gray-400 uppercase">Cancel</button>
              </div>
          </div>
      )}

      {activePopup && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => closePromotion(activePopup.id)}></div>
              <div className="bg-white rounded-3xl p-8 max-w-md w-full relative z-10 animate-scale-up text-center">
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">{activePopup.title}</h3>
                  <p className="text-gray-500 font-medium mb-8">{activePopup.content}</p>
                  {activePopup.ctaText && (
                      <button onClick={() => { closePromotion(activePopup.id); if(activePopup.ctaLink) setCurrentRoute(AppRoute.STORE); }} className="bg-black text-white px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:scale-105 transition">
                          {activePopup.ctaText}
                      </button>
                  )}
                  {activePopup.closable && (
                      <button onClick={() => closePromotion(activePopup.id)} className="absolute top-4 right-4 text-gray-400 hover:text-black">
                          <i className="fa-solid fa-xmark text-xl"></i>
                      </button>
                  )}
              </div>
          </div>
      )}

      {toast.visible && (
        <div className="fixed top-24 right-6 bg-black text-white px-6 py-4 rounded-xl shadow-2xl z-[110] flex items-center space-x-3 animate-slide-in-right">
           <i className="fa-solid fa-circle-check text-green-400"></i>
           <span className="text-xs font-bold uppercase tracking-wide">{toast.message}</span>
        </div>
      )}

      <AIChatBubble />
    </>
  );
};

export default App;