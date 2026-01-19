
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppRoute, Product, CartItem, Order, ProductOption } from './types';
import { INITIAL_PRODUCTS, CATEGORIES } from './constants';
import StorefrontLayout from './components/StorefrontLayout';
import AdminLayout from './components/AdminLayout';
import AIChatBubble from './components/AIChatBubble';
import { generateProductDescription, analyzeSalesTrends, generateMarketingEmail, generateProductImage } from './services/geminiService';

const ADMIN_EMAIL = 'officialshouryasingh@gmail.com';

const App: React.FC = () => {
  // --- Core State ---
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.STORE);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // --- Auth State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginStep, setLoginStep] = useState<'input' | 'otp'>('input');
  const [loginInput, setLoginInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [showGoogleLoginModal, setShowGoogleLoginModal] = useState(false);

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

  // --- View State ---
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [adminStatsMsg, setAdminStatsMsg] = useState('Generating store analysis...');
  
  // --- Form State ---
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
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
  const [userAddress, setUserAddress] = useState({
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
  });

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
      const savedProducts = localStorage.getItem('fyx_products');
      const savedOrders = localStorage.getItem('fyx_orders');
      const savedWishlist = localStorage.getItem('fyx_wishlist');
      const savedCart = localStorage.getItem('fyx_cart');
      const savedCats = localStorage.getItem('fyx_categories');
      const savedUser = localStorage.getItem('fyx_user');
      const savedAuth = localStorage.getItem('fyx_auth');
      const savedCustomers = localStorage.getItem('fyx_customers');
      
      // Admin Persistance
      const savedSettings = localStorage.getItem('fyx_settings');
      const savedFaqs = localStorage.getItem('fyx_faqs');
      const savedDiscounts = localStorage.getItem('fyx_discounts');
      const savedBlog = localStorage.getItem('fyx_blog');
      const savedFlash = localStorage.getItem('fyx_flash');

      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (savedOrders) setOrders(JSON.parse(savedOrders));
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedCats) setStoreCategories(JSON.parse(savedCats));
      if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          // Migrate old user data to new structure if needed
          setUserAddress(prev => ({ ...prev, ...parsedUser }));
      }
      if (savedAuth === 'true') setIsLoggedIn(true);
      if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
      
      if (savedSettings) setSettings(JSON.parse(savedSettings));
      if (savedFaqs) setFaqs(JSON.parse(savedFaqs));
      if (savedDiscounts) setDiscounts(JSON.parse(savedDiscounts));
      if (savedBlog) setBlogPosts(JSON.parse(savedBlog));
      if (savedFlash) setFlashSales(JSON.parse(savedFlash));
    } catch (e) {
      console.error("Error hydrating state", e);
    }
  }, []);

  // --- Persistence Saving ---
  useEffect(() => {
    localStorage.setItem('fyx_products', JSON.stringify(products));
    localStorage.setItem('fyx_orders', JSON.stringify(orders));
    localStorage.setItem('fyx_wishlist', JSON.stringify(wishlist));
    localStorage.setItem('fyx_cart', JSON.stringify(cart));
    localStorage.setItem('fyx_categories', JSON.stringify(storeCategories));
    localStorage.setItem('fyx_user', JSON.stringify(userAddress));
    localStorage.setItem('fyx_auth', isLoggedIn.toString());
    localStorage.setItem('fyx_customers', JSON.stringify(customers));
    
    // Admin Persistence
    localStorage.setItem('fyx_settings', JSON.stringify(settings));
    localStorage.setItem('fyx_faqs', JSON.stringify(faqs));
    localStorage.setItem('fyx_discounts', JSON.stringify(discounts));
    localStorage.setItem('fyx_blog', JSON.stringify(blogPosts));
    localStorage.setItem('fyx_flash', JSON.stringify(flashSales));
  }, [products, orders, wishlist, cart, storeCategories, settings, faqs, discounts, blogPosts, flashSales, userAddress, isLoggedIn, customers]);

  // --- Derived Data ---
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const wishlistItems = useMemo(() => products.filter(p => wishlist.includes(p.id)), [products, wishlist]);
  
  const filteredProducts = useMemo(() => {
    let result = products;
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }
    if (searchQuery) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result;
  }, [products, selectedCategory, searchQuery]);

  // --- Action Handlers ---
  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
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
    
    // Auth Check
    if (!isLoggedIn) {
       showToast("Please login or sign up to add to bag");
       setCurrentRoute(AppRoute.PROFILE);
       return;
    }

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

  const finalCheckout = () => {
    if (!isLoggedIn) {
       showToast("Please login to place an order");
       setCurrentRoute(AppRoute.PROFILE);
       return;
    }
    if (cart.length === 0) return;
    const orderNum = `FYX-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: orderNum,
      customerName: userAddress.name,
      items: [...cart],
      total: cartTotal + settings.shippingFee, 
      shipping: settings.shippingFee,
      status: 'processing',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      address: userAddress.line, // Uses the composite address line
      phone: userAddress.phone,
      paymentMethod: checkoutPayment,
      paymentDetails: checkoutPayment === 'UPI (PhonePe/GPay)' ? {
         upiId: enteredUpiId,
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
    setCurrentRoute(AppRoute.ORDER_SUCCESS);
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
    setIsLoggedIn(true);
    
    const isEmail = loginInput.includes('@');
    const newUserPhone = !isEmail ? loginInput : '';
    const newUserEmail = isEmail ? loginInput : '';

    // Update user profile with login info
    setUserAddress(prev => ({
      ...prev,
      email: newUserEmail || prev.email,
      phone: newUserPhone || prev.phone,
      name: prev.name === 'Guest User' ? (isEmail ? newUserEmail.split('@')[0] : `User ${newUserPhone.slice(-4)}`) : prev.name
    }));

    // Register User in Admin Panel if new
    setCustomers(prev => {
       const exists = prev.find(c => (newUserEmail && c.email === newUserEmail) || (newUserPhone && c.phone === newUserPhone));
       if (exists) return prev;
       
       return [...prev, {
          id: Date.now().toString(),
          name: isEmail ? newUserEmail.split('@')[0] : `User ${newUserPhone}`,
          email: newUserEmail || '-',
          phone: newUserPhone || '-',
          spent: 0,
          orders: 0,
          status: 'New'
       }];
    });
    
    showToast("Logged in successfully");
    setLoginStep('input');
    setOtpInput('');
    setLoginInput('');
    
    // If cart has items, redirect there to finish checkout
    if (cart.length > 0) {
        setCurrentRoute(AppRoute.CART);
    }
  };

  const handleGoogleLoginMock = (email: string, name: string) => {
    setUserAddress(prev => ({
        ...prev,
        email: email,
        name: name,
        // Keep phone if already exists, else empty
    }));
    
    setIsLoggedIn(true);
    setShowGoogleLoginModal(false);
    showToast(`Welcome, ${name}!`);
    
    // Register Customer if not exists
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

    if (cart.length > 0) setCurrentRoute(AppRoute.CART);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserAddress({
       name: 'Guest User',
       email: '',
       phone: '',
       altPhone: '',
       line: '',
       gender: 'Other',
       dob: '',
       houseNo: '',
       street: '',
       landmark: '',
       city: '',
       state: '',
       pincode: '',
       addressType: 'Home'
    });
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
  const renderStore = () => (
    <div className="flex flex-col animate-slide-up">
      {/* Search Bar */}
      <div className="px-6 py-4 bg-white sticky top-0 z-50">
         <div className="bg-gray-100 rounded-2xl flex items-center px-4 py-3">
            <i className="fa-solid fa-magnifying-glass text-gray-400 mr-3"></i>
            <input 
              type="text" 
              placeholder="Search for products..." 
              className="bg-transparent border-none outline-none w-full text-sm font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && <button onClick={() => setSearchQuery('')}><i className="fa-solid fa-xmark text-gray-400"></i></button>}
         </div>
      </div>

      {/* Hero */}
      {!searchQuery && (
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
      )}

      {/* Categories */}
      <section className="py-8 border-b border-gray-100 sticky top-[72px] bg-white/95 backdrop-blur-sm z-40">
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

      {/* Products */}
      <section ref={featuredRef} className="px-4 py-8 bg-gray-50 min-h-screen">
         <div className="flex justify-between items-end mb-8 px-2">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">
               {searchQuery ? `Searching "${searchQuery}"` : selectedCategory}
            </h2>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{filteredProducts.length} Items</span>
         </div>
         
         {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
               <i className="fa-solid fa-ghost text-4xl text-gray-300 mb-4"></i>
               <p className="text-gray-400 font-bold uppercase tracking-widest">No products found</p>
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
                 <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
                     <p className="text-xs font-bold text-gray-500">Scan QR or enter UPI ID to pay.</p>
                     <input type="text" placeholder="Enter UPI ID" value={enteredUpiId} onChange={(e) => setEnteredUpiId(e.target.value)} className="w-full bg-white border p-3 rounded-xl text-sm outline-none" />
                     <div className="text-center">
                        <p className="text-[10px] font-bold uppercase mb-2">Upload Payment Screenshot</p>
                        <input type="file" onChange={handlePaymentScreenshot} className="text-xs" />
                     </div>
                 </div>
             )}
          </div>
       </div>
       <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 pb-8 z-50">
          <div className="flex justify-between items-center mb-4 text-sm font-black">
             <span>Total to Pay</span>
             <span>₹{cartTotal + settings.shippingFee}</span>
          </div>
          <button onClick={finalCheckout} disabled={checkoutStep < 2} className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg disabled:opacity-50">Place Order</button>
       </div>
    </div>
  );

  const renderOrderSuccess = () => (
     <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center text-white p-6 text-center animate-fade-in">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-xl">
           <i className="fa-solid fa-check text-4xl text-green-500"></i>
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Order Placed!</h1>
        <p className="text-lg font-medium mb-8">Order #{viewingOrder?.orderNumber}</p>
        <div className="bg-white/20 backdrop-blur-md p-6 rounded-2xl w-full max-w-sm mb-8 text-left">
           <p className="text-xs font-bold uppercase opacity-70 mb-1">Total Amount</p>
           <p className="text-2xl font-black mb-4">₹{viewingOrder?.total}</p>
           <p className="text-xs font-bold uppercase opacity-70 mb-1">Delivering To</p>
           <p className="font-bold text-sm">{viewingOrder?.address}</p>
        </div>
        <button onClick={() => setCurrentRoute(AppRoute.ORDER_DETAIL)} className="bg-white/20 backdrop-blur-md text-white border-2 border-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-lg hover:bg-white hover:text-green-600 transition mb-4">View Order Details</button>
        <button onClick={() => setCurrentRoute(AppRoute.STORE)} className="text-xs font-bold uppercase tracking-widest underline hover:no-underline">Continue Shopping</button>
     </div>
  );
  
  const renderOrderDetail = () => {
        if (!viewingOrder) return null;
        return (
            <div className="p-6 animate-slide-up bg-gray-50 min-h-screen pb-24">
                <div className="flex items-center mb-6">
                    <button onClick={() => setCurrentRoute(AppRoute.PROFILE)} className="mr-4"><i className="fa-solid fa-arrow-left"></i></button>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Order #{viewingOrder.orderNumber}</h2>
                </div>
                {/* Status Badge */}
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500 font-bold mb-1">Placed on {viewingOrder.date}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{viewingOrder.items.length} Items</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${viewingOrder.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{viewingOrder.status}</span>
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
      <div className="p-6 animate-slide-up bg-gray-50 min-h-screen">
         <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8">My Account</h2>
         <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 flex justify-between items-center">
            <div className="flex items-center space-x-4">
               <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-black text-gray-400">
                  {userAddress.name.charAt(0)}
               </div>
               <div>
                  <h3 className="font-bold text-lg">{userAddress.name}</h3>
                  <p className="text-xs text-gray-500 font-medium">{userAddress.email}</p>
                  <p className="text-xs text-gray-400 font-medium">{userAddress.phone}</p>
               </div>
            </div>
            <button onClick={() => setShowEditProfileModal(true)} className="bg-gray-100 hover:bg-black hover:text-white transition px-4 py-2 rounded-xl text-[10px] font-black uppercase">Edit Profile</button>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 space-y-3">
            <p className="text-xs font-black uppercase text-gray-400 mb-2">Personal Details</p>
            <div className="grid grid-cols-2 gap-4">
               <div><p className="text-[10px] font-bold text-gray-400 uppercase">Gender</p><p className="text-sm font-bold">{userAddress.gender}</p></div>
               <div><p className="text-[10px] font-bold text-gray-400 uppercase">Birthday</p><p className="text-sm font-bold">{userAddress.dob}</p></div>
            </div>
            <div className="pt-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Address ({userAddress.addressType})</p>
                <p className="text-sm font-bold leading-relaxed">{userAddress.line}</p>
            </div>
         </div>
         <h3 className="text-xl font-black uppercase italic tracking-tight mb-4">Order History</h3>
         <div className="space-y-4">
            {orders.length === 0 ? <p className="text-gray-400 font-bold text-sm">No orders yet.</p> : orders.map(order => (
               <div key={order.id} onClick={() => { setViewingOrder(order); setCurrentRoute(AppRoute.ORDER_DETAIL); }} className="bg-white p-4 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                     <div><p className="font-black text-sm">{order.orderNumber}</p><p className="text-xs text-gray-500">{order.date}</p></div>
                     <span className="bg-green-100 text-green-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase">{order.status}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between items-center"><p className="text-xs font-bold text-gray-500">{order.items.length} Items</p><p className="font-black">₹{order.total}</p></div>
               </div>
            ))}
         </div>
         <div className="mt-10 pt-10 border-t border-dashed border-gray-300 space-y-4 pb-24">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Settings</p>
          
          {/* Admin Dashboard Button - Only Visible to Admin */}
          {userAddress.email === ADMIN_EMAIL && (
            <button onClick={() => setCurrentRoute(AppRoute.ADMIN_DASHBOARD)} className="w-full bg-white border-2 border-black p-5 rounded-2xl flex items-center justify-between group hover:bg-black hover:text-white transition shadow-sm">
                <div className="flex items-center space-x-4"><i className="fa-solid fa-gauge-high text-xl"></i><span className="font-black text-xs uppercase tracking-widest">Admin Dashboard</span></div>
                <i className="fa-solid fa-arrow-right transform group-hover:translate-x-1 transition"></i>
            </button>
          )}

          <button onClick={handleLogout} className="w-full p-5 rounded-2xl flex items-center space-x-4 text-red-500 font-bold text-xs uppercase hover:bg-red-50 transition"><i className="fa-solid fa-right-from-bracket"></i><span>Log Out</span></button>
        </div>
      </div>
    );
  };

  // --- ADMIN RENDERERS ---
  const renderAdminDashboard = () => (
     <div className="animate-fade-in space-y-8">
        <div className="bg-[#1a1614] text-white p-6 rounded-3xl shadow-xl">
           <div className="flex justify-between items-start mb-4">
              <div><p className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-1">AI Analyst Insight</p><p className="text-lg font-medium leading-relaxed max-w-2xl">{adminStatsMsg}</p></div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center animate-pulse"><i className="fa-solid fa-wand-magic-sparkles text-yellow-400"></i></div>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"><p className="text-xs font-black uppercase text-gray-400 mb-2">Total Sales</p><h3 className="text-4xl font-black">₹{orders.reduce((acc, o) => acc + o.total, 0).toLocaleString()}</h3></div>
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"><p className="text-xs font-black uppercase text-gray-400 mb-2">Total Orders</p><h3 className="text-4xl font-black">{orders.length}</h3></div>
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"><p className="text-xs font-black uppercase text-gray-400 mb-2">Customers</p><h3 className="text-4xl font-black">{customers.length}</h3></div>
        </div>
     </div>
  );

  const renderAdminProducts = () => (
     <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-black italic uppercase">Product Inventory</h2>
           <button onClick={() => openEditProduct(null)} className="bg-black text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-gray-800 transition">+ Add Product</button>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                 <tr>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Product</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Price</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Category</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                       <td className="p-4 flex items-center space-x-3"><img src={p.image} className="w-10 h-10 rounded-lg object-cover bg-gray-200" /><span className="font-bold text-sm">{p.name}</span></td>
                       <td className="p-4 font-bold text-sm">₹{p.price}</td>
                       <td className="p-4 text-xs font-medium text-gray-500">{p.category}</td>
                       <td className="p-4 text-right"><button onClick={() => openEditProduct(p)} className="text-black font-bold text-xs underline hover:no-underline">Edit</button></td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
     </div>
  );

  // ... (keeping other admin render functions like renderAdminCategories, renderAdminOrders, etc. unchanged for brevity but assuming they are part of the file as per original structure) ...
  const renderAdminCategories = () => (
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-black italic uppercase">Store Categories</h2>
           <div className="flex space-x-2">
             <input type="text" placeholder="New Category Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="bg-white px-4 py-2 rounded-xl text-sm font-bold outline-none border border-gray-200 focus:border-black" />
             <button onClick={handleAddCategory} className="bg-black text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition">Add</button>
           </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {storeCategories.map(cat => (
             <div key={cat} className="bg-white p-6 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm">
                <span className="font-bold text-sm">{cat}</span>
                <button onClick={() => handleDeleteCategory(cat)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><i className="fa-solid fa-trash text-sm"></i></button>
             </div>
           ))}
        </div>
      </div>
  );

  const renderAdminOrders = () => (
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-black italic uppercase">Customer Orders</h2>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                 <tr>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Order ID</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Total</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {orders.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-gray-400 font-bold">No orders found</td></tr> : orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                       <td className="p-4 font-black text-xs">{order.orderNumber}</td>
                       <td className="p-4 text-sm font-bold">{order.customerName}</td>
                       <td className="p-4 font-bold text-sm">₹{order.total}</td>
                       <td className="p-4"><span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{order.status}</span></td>
                       <td className="p-4 text-xs font-medium text-gray-500">{order.date}</td>
                       <td className="p-4 text-right relative group flex justify-end items-center gap-2">
                          <select 
                            value={order.status} 
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="bg-gray-100 text-xs font-bold rounded p-1 outline-none cursor-pointer"
                          >
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                          <button onClick={() => setAdminViewingOrder(order)} className="text-blue-600 text-xs font-bold underline">View</button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
  );

  const renderAdminCustomers = () => (
      <div className="animate-fade-in">
        <h2 className="text-xl font-black italic uppercase mb-6">Registered Customers</h2>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                 <tr>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Name</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Contact</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Spent</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Orders</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {customers.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition">
                       <td className="p-4 font-bold text-sm">{c.name}</td>
                       <td className="p-4"><p className="text-xs font-bold">{c.email}</p><p className="text-[10px] text-gray-400">{c.phone}</p></td>
                       <td className="p-4 font-bold text-sm">₹{c.spent}</td>
                       <td className="p-4 text-xs font-medium">{c.orders} Orders</td>
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
         <h2 className="text-xl font-black italic uppercase mb-6">Support Tickets</h2>
         <div className="grid grid-cols-1 gap-4">
             {tickets.map(t => (
                 <div key={t.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                     <div>
                         <div className="flex items-center space-x-2 mb-1">
                             <span className={`w-2 h-2 rounded-full ${t.priority === 'High' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                             <span className="text-[10px] font-black uppercase text-gray-400">{t.id} • {t.date}</span>
                         </div>
                         <h3 className="font-bold text-sm">{t.subject}</h3>
                         <p className="text-xs text-gray-500">From: {t.user}</p>
                     </div>
                     <button className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${t.status === 'Open' ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                         {t.status === 'Open' ? 'Resolve' : 'Resolved'}
                     </button>
                 </div>
             ))}
         </div>
      </div>
  );

  const renderAdminDiscounts = () => (
      <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black italic uppercase">Discount Codes</h2>
              <button onClick={() => openGenericModal('discount')} className="bg-black text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest">+ Create Code</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {discounts.map(d => (
                  <div key={d.code} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-bl-xl uppercase">{d.status}</div>
                      <h3 className="text-2xl font-black mb-1">{d.code}</h3>
                      <p className="text-sm font-medium text-gray-500 mb-4">{d.type === 'Percentage' ? `${d.value}% Off` : `₹${d.value} Flat Off`}</p>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{d.usage} Uses</div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderAdminFAQ = () => (
      <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black italic uppercase">FAQ Management</h2>
              <div className="flex space-x-2">
                 <input type="text" placeholder="Question" value={newItemInput.title} onChange={(e) => setNewItemInput({...newItemInput, title: e.target.value})} className="bg-white px-4 py-2 rounded-xl text-sm font-bold outline-none border border-gray-200" />
                 <input type="text" placeholder="Answer" value={newItemInput.content} onChange={(e) => setNewItemInput({...newItemInput, content: e.target.value})} className="bg-white px-4 py-2 rounded-xl text-sm font-bold outline-none border border-gray-200" />
                 <button onClick={() => { if(newItemInput.title) { setFaqs([...faqs, {id: Date.now(), question: newItemInput.title, answer: newItemInput.content}]); setNewItemInput({title:'', content:''}); } }} className="bg-black text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest">Add</button>
              </div>
          </div>
          <div className="space-y-4">
              {faqs.map(f => (
                  <div key={f.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-sm mb-2">Q: {f.question}</h3>
                      <p className="text-sm text-gray-500">A: {f.answer}</p>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderAdminNewsletter = () => (
      <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
              <h2 className="text-xl font-black italic uppercase mb-6">Subscribers</h2>
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden max-h-[400px] overflow-y-auto no-scrollbar">
                  <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b"><tr><th className="p-4 text-[10px] font-black uppercase text-gray-400">Email</th><th className="p-4 text-[10px] font-black uppercase text-gray-400">Status</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                          {subscribers.map((s, i) => (
                              <tr key={i}><td className="p-4 font-bold text-sm">{s.email}</td><td className="p-4 text-xs">{s.status}</td></tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-black italic uppercase mb-4">AI Email Generator</h2>
              <p className="text-sm text-gray-500 mb-6">Generate high-converting marketing emails in seconds.</p>
              <div className="space-y-4">
                  <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Campaign Topic</label>
                      <input type="text" value={newsletterTopic} onChange={(e) => setNewsletterTopic(e.target.value)} placeholder="e.g. Summer Sale Announcement" className="w-full bg-gray-50 p-3 rounded-xl text-sm font-bold outline-none border focus:border-black" />
                  </div>
                  <button onClick={handleGenerateEmail} disabled={isGeneratingEmail} className="w-full bg-black text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-800 transition disabled:opacity-50">
                      {isGeneratingEmail ? 'Generating Magic...' : 'Generate Email'}
                  </button>
                  {generatedEmail && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl border">
                          <p className="text-xs font-mono whitespace-pre-wrap">{generatedEmail}</p>
                          <button onClick={() => {navigator.clipboard.writeText(generatedEmail); showToast("Copied to clipboard")}} className="mt-2 text-[10px] font-bold text-blue-600 uppercase">Copy Content</button>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );

  const renderAdminFlashSales = () => (
      <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black italic uppercase">Flash Sales</h2>
              <button onClick={() => openGenericModal('flash')} className="bg-black text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest">+ New Campaign</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {flashSales.map(sale => (
                  <div key={sale.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                      <div>
                          <h3 className="font-bold text-lg">{sale.name}</h3>
                          <p className="text-sm text-gray-500">{sale.discount} Off • Ends in {sale.endsIn}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${sale.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{sale.status}</span>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderAdminBlog = () => (
      <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black italic uppercase">Blog Posts</h2>
              <button onClick={() => openGenericModal('blog')} className="bg-black text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest">+ Write Post</button>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
             <table className="w-full text-left">
                 <thead className="bg-gray-50 border-b"><tr><th className="p-4 text-[10px] font-black uppercase text-gray-400">Title</th><th className="p-4 text-[10px] font-black uppercase text-gray-400">Author</th><th className="p-4 text-[10px] font-black uppercase text-gray-400">Date</th><th className="p-4 text-[10px] font-black uppercase text-gray-400">Status</th></tr></thead>
                 <tbody className="divide-y divide-gray-100">
                     {blogPosts.map(post => (
                         <tr key={post.id}>
                             <td className="p-4 font-bold text-sm">{post.title}</td>
                             <td className="p-4 text-xs font-medium">{post.author}</td>
                             <td className="p-4 text-xs text-gray-500">{post.date}</td>
                             <td className="p-4"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-black uppercase">{post.status}</span></td>
                         </tr>
                     ))}
                 </tbody>
             </table>
          </div>
      </div>
  );

  const renderContent = () => {
    // ... existing content (Admin Route Guard and Switch Cases) ...
    if (currentRoute.includes('admin')) {
      if (userAddress.email !== ADMIN_EMAIL) {
         return (
             <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
                 <i className="fa-solid fa-lock text-4xl text-gray-300 mb-4"></i>
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Restricted Access</h2>
                 <p className="text-gray-500 font-medium mb-6">You do not have permission to view the admin dashboard.</p>
                 <button onClick={() => setCurrentRoute(AppRoute.STORE)} className="bg-black text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition">Return to Store</button>
             </div>
         );
      }

      switch (currentRoute) {
        case AppRoute.ADMIN_DASHBOARD: return renderAdminDashboard();
        case AppRoute.ADMIN_PRODUCTS: return renderAdminProducts();
        case AppRoute.ADMIN_CATEGORIES: return renderAdminCategories();
        case AppRoute.ADMIN_ORDERS: return renderAdminOrders();
        case AppRoute.ADMIN_CUSTOMERS: return renderAdminCustomers();
        case AppRoute.ADMIN_SUPPORT: return renderAdminSupport();
        case AppRoute.ADMIN_DISCOUNTS: return renderAdminDiscounts();
        case AppRoute.ADMIN_FAQ: return renderAdminFAQ();
        case AppRoute.ADMIN_NEWSLETTER: return renderAdminNewsletter();
        case AppRoute.ADMIN_FLASH_SALES: return renderAdminFlashSales();
        case AppRoute.ADMIN_BLOG: return renderAdminBlog();
        // Fallback for remaining minor settings pages or placeholders
        case AppRoute.ADMIN_SITE_SETTINGS: 
        case AppRoute.ADMIN_THEME:
        case AppRoute.ADMIN_POPUPS:
        case AppRoute.ADMIN_EMAIL_TEMPLATES:
        case AppRoute.ADMIN_SHIPPING:
        case AppRoute.ADMIN_TAX:
        case AppRoute.ADMIN_PAGES:
        case AppRoute.ADMIN_SEGMENTS:
        case AppRoute.ADMIN_CHAT:
        case AppRoute.ADMIN_LAYOUT:
           return <div className="p-10 text-center font-bold text-gray-400">Section Configuration Available in v2.1</div>;
        default: return <div className="p-10 text-center font-bold text-gray-400">Section Under Construction</div>;
      }
    }
    switch (currentRoute) {
      case AppRoute.PRODUCT_DETAIL: return renderProductDetail();
      case AppRoute.CART: return renderCart();
      case AppRoute.WISHLIST: return renderWishlist();
      case AppRoute.CHECKOUT: return renderCheckout();
      case AppRoute.ORDER_SUCCESS: return renderOrderSuccess();
      case AppRoute.PROFILE: return renderProfile();
      case AppRoute.ORDER_DETAIL: return renderOrderDetail();
      default: return renderStore();
    }
  };
  
  const isAdminUser = userAddress.email === ADMIN_EMAIL;
  const isStartAdmin = currentRoute.toString().startsWith('admin');

  return (
    <>
      {isStartAdmin && isAdminUser ? (
         <AdminLayout onNavigate={setCurrentRoute} currentRoute={currentRoute}>
            {renderContent()}
         </AdminLayout>
      ) : (
         <StorefrontLayout 
            onNavigate={setCurrentRoute} 
            cartCount={cartCount} 
            wishlistCount={wishlist.length} 
            currentRoute={currentRoute}
         >
            {renderContent()}
         </StorefrontLayout>
      )}

      <AIChatBubble />

      {/* ... (Existing Modals: Edit Profile, Map Picker, Google Login, Admin Order Detail) ... */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-[32px] w-full max-w-xl overflow-hidden shadow-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black italic uppercase">Update Profile</h3>
                <button onClick={() => setShowEditProfileModal(false)}><i className="fa-solid fa-xmark"></i></button>
             </div>
             
             <div className="space-y-4">
               {/* Personal Info */}
               <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Full Name</label>
                  <input type="text" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={userAddress.name} onChange={(e) => setUserAddress({...userAddress, name: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Phone Number</label>
                      <input type="tel" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={userAddress.phone} onChange={(e) => setUserAddress({...userAddress, phone: e.target.value})} />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Alt. Phone (Optional)</label>
                      <input type="tel" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={userAddress.altPhone} onChange={(e) => setUserAddress({...userAddress, altPhone: e.target.value})} />
                   </div>
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Email Address</label>
                  <input type="email" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={userAddress.email} onChange={(e) => setUserAddress({...userAddress, email: e.target.value})} />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Gender</label>
                      <select className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={userAddress.gender} onChange={(e) => setUserAddress({...userAddress, gender: e.target.value})}>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                      </select>
                  </div>
                  <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Birth Date</label>
                      <input type="date" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={userAddress.dob} onChange={(e) => setUserAddress({...userAddress, dob: e.target.value})} />
                  </div>
               </div>

               {/* Address Section */}
               <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                      <p className="text-xs font-black uppercase">Shipping Address</p>
                      <button onClick={() => setShowMapPicker(true)} className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition flex items-center gap-1">
                          <i className="fa-solid fa-map-location-dot"></i> Select on Map
                      </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="col-span-1">
                          <input type="text" placeholder="House No / Flat" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={userAddress.houseNo} onChange={(e) => setUserAddress({...userAddress, houseNo: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                          <input type="text" placeholder="Area / Street / Sector" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={userAddress.street} onChange={(e) => setUserAddress({...userAddress, street: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                          <input type="text" placeholder="Landmark (Optional)" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={userAddress.landmark} onChange={(e) => setUserAddress({...userAddress, landmark: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                          <input type="text" placeholder="Pincode" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={userAddress.pincode} onChange={(e) => setUserAddress({...userAddress, pincode: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                          <input type="text" placeholder="City" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={userAddress.city} onChange={(e) => setUserAddress({...userAddress, city: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                          <input type="text" placeholder="State" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={userAddress.state} onChange={(e) => setUserAddress({...userAddress, state: e.target.value})} />
                      </div>
                  </div>

                  {/* Address Type Chips */}
                  <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Save Address As</p>
                      <div className="flex gap-3">
                          {['Home', 'Work', 'Other'].map(type => (
                              <button 
                                key={type}
                                onClick={() => setUserAddress({...userAddress, addressType: type as any})}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition border ${userAddress.addressType === type ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'}`}
                              >
                                  {type}
                              </button>
                          ))}
                      </div>
                  </div>
               </div>
             </div>
             
             <button onClick={saveProfileChanges} className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest">Save All Changes</button>
           </div>
        </div>
      )}

      {showMapPicker && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-white w-full h-full md:w-[80vw] md:h-[80vh] md:rounded-3xl overflow-hidden relative flex flex-col">
                {/* Simulated Map Header */}
                <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
                    <div className="bg-white px-4 py-3 rounded-xl shadow-lg pointer-events-auto flex items-center gap-3 w-full max-w-md">
                        <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
                        <input type="text" placeholder="Search location..." className="flex-1 text-sm font-bold outline-none" />
                    </div>
                    <button onClick={() => setShowMapPicker(false)} className="bg-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center pointer-events-auto hover:bg-gray-100 transition">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Map Background (Visual Simulation) */}
                <div className="flex-1 bg-[#e5e7eb] relative flex items-center justify-center cursor-move active:cursor-grabbing group">
                    {/* Placeholder Grid Pattern to look like a map */}
                    <div className="absolute inset-0 opacity-20" style={{ 
                        backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
                        backgroundSize: '40px 40px' 
                    }}></div>
                    <div className="absolute inset-0 bg-cover bg-center opacity-50 mix-blend-multiply pointer-events-none" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')" }}></div>
                    
                    {/* Central Pin */}
                    <div className="relative -mt-8 animate-bounce">
                        <i className="fa-solid fa-location-dot text-5xl text-red-600 drop-shadow-2xl"></i>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-2 bg-black/30 rounded-full blur-[2px]"></div>
                    </div>
                    
                    <div className="absolute bottom-32 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-xs font-bold shadow-sm pointer-events-none">
                        Move map to adjust location
                    </div>
                </div>

                {/* Bottom Sheet Action */}
                <div className="bg-white p-6 border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)] relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-center md:text-left">
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Selected Location</p>
                            <p className="text-lg font-bold">102, Tech Park Main Road</p>
                            <p className="text-sm text-gray-500">Bangalore, Karnataka, 560001</p>
                        </div>
                        <button onClick={confirmMapLocation} className="w-full md:w-auto bg-black text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition">
                            Confirm Location
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {showGoogleLoginModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[24px] w-full max-w-sm overflow-hidden shadow-2xl p-8">
              <div className="text-center mb-6">
                 <i className="fa-brands fa-google text-4xl text-red-500 mb-3"></i>
                 <h3 className="text-xl font-bold">Sign in with Google</h3>
                 <p className="text-sm text-gray-500">Choose an account to continue to FYX</p>
              </div>
              
              <div className="space-y-3">
                 <button onClick={() => handleGoogleLoginMock(ADMIN_EMAIL, 'Shourya Singh')} className="w-full flex items-center space-x-4 p-3 border rounded-xl hover:bg-gray-50 transition text-left group">
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg">S</div>
                    <div>
                       <p className="text-sm font-bold text-gray-800">Shourya Singh</p>
                       <p className="text-xs text-gray-500">{ADMIN_EMAIL}</p>
                       <span className="text-[9px] font-black text-purple-600 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Admin Account</span>
                    </div>
                 </button>
                 
                 <button onClick={() => handleGoogleLoginMock('rahul.verma@gmail.com', 'Rahul Verma')} className="w-full flex items-center space-x-4 p-3 border rounded-xl hover:bg-gray-50 transition text-left">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">R</div>
                    <div>
                       <p className="text-sm font-bold text-gray-800">Rahul Verma</p>
                       <p className="text-xs text-gray-500">rahul.verma@gmail.com</p>
                    </div>
                 </button>

                 <button onClick={() => handleGoogleLoginMock(`guest.${Math.floor(Math.random()*1000)}@gmail.com`, 'New Customer')} className="w-full flex items-center space-x-4 p-3 border rounded-xl hover:bg-gray-50 transition text-left">
                    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-lg"><i className="fa-solid fa-user"></i></div>
                    <div>
                       <p className="text-sm font-bold text-gray-800">Use another account</p>
                       <p className="text-xs text-gray-500">Sign in with a different email</p>
                    </div>
                 </button>
              </div>

              <div className="mt-6 text-center">
                 <button onClick={() => setShowGoogleLoginModal(false)} className="text-xs font-bold text-gray-400 hover:text-black">Cancel</button>
              </div>
           </div>
        </div>
      )}
      
      {adminViewingOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-8 border-b flex justify-between items-center bg-gray-50">
                 <div>
                    <h3 className="text-xl font-black italic uppercase">Order #{adminViewingOrder.orderNumber}</h3>
                    <p className="text-xs text-gray-500 font-bold">{adminViewingOrder.date} • {adminViewingOrder.items.length} Items</p>
                 </div>
                 <button onClick={() => setAdminViewingOrder(null)}><i className="fa-solid fa-xmark"></i></button>
              </div>
              <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                 {/* ... (Admin Order Details Content) ... */}
                 <div className="grid grid-cols-2 gap-8">
                     <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Customer Details</p>
                        <p className="font-bold text-sm">{adminViewingOrder.customerName}</p>
                        <p className="text-xs text-gray-500">{adminViewingOrder.phone}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Shipping Address</p>
                        <p className="font-bold text-sm leading-relaxed">{adminViewingOrder.address}</p>
                     </div>
                 </div>

                 <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-4">Ordered Items</p>
                    <div className="space-y-4">
                       {adminViewingOrder.items.map((item, idx) => (
                          <div key={idx} className="flex gap-4 p-4 border rounded-xl bg-gray-50">
                             <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                                <img src={item.image} className="w-full h-full object-cover" />
                             </div>
                             <div className="flex-1">
                                <h4 className="font-bold text-sm">{item.name}</h4>
                                <p className="text-xs text-gray-500">Qty: {item.quantity} • ₹{item.price}</p>
                                {item.uploadedImages && item.uploadedImages.length > 0 && (
                                   <div className="mt-2">
                                      <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Customer Uploads:</p>
                                      <div className="flex gap-2">
                                         {item.uploadedImages.map((img, i) => (
                                            <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block w-10 h-10 rounded border hover:opacity-80 transition">
                                               <img src={img} className="w-full h-full object-cover" />
                                            </a>
                                         ))}
                                      </div>
                                   </div>
                                )}
                             </div>
                             <div className="text-right">
                                <p className="font-black text-sm">₹{item.price * item.quantity}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
                 
                 <div className="bg-gray-50 p-6 rounded-2xl border">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-4">Payment Information</p>
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-xs font-bold">{adminViewingOrder.paymentMethod}</span>
                       <span className="font-black text-lg">Total: ₹{adminViewingOrder.total}</span>
                    </div>
                    {adminViewingOrder.paymentDetails?.screenshot && (
                       <div>
                          <p className="text-[10px] font-bold uppercase mb-2">Payment Screenshot</p>
                          <img src={adminViewingOrder.paymentDetails.screenshot} className="max-w-full h-48 object-contain border rounded-xl bg-white" />
                       </div>
                    )}
                 </div>
              </div>
              <div className="p-6 border-t bg-gray-50 flex justify-end">
                 <button onClick={() => setAdminViewingOrder(null)} className="bg-black text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest">Close</button>
              </div>
           </div>
        </div>
      )}

      {/* Admin Product Management Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
             <div className="p-8 border-b flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-black italic uppercase">Manage Product Data</h3>
                <button onClick={() => setShowProductModal(false)}><i className="fa-solid fa-xmark"></i></button>
             </div>
             <div className="p-8 space-y-6 overflow-y-auto no-scrollbar">
                
                {/* Image Section */}
                <div className="flex gap-6 items-start">
                    <div className="w-32 h-32 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 flex-shrink-0">
                        <img src={editingProduct?.image || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Upload or Generate Image</label>
                            <div className="flex gap-2">
                                <label className="flex-1 cursor-pointer bg-black text-white py-2 rounded-xl text-[10px] font-bold uppercase text-center hover:opacity-80 transition">
                                    <i className="fa-solid fa-cloud-arrow-up mr-2"></i> Upload File
                                    <input type="file" className="hidden" accept="image/*" onChange={handleProductImageUpload} />
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="Or paste Image URL" 
                                    className="flex-1 bg-gray-50 px-3 rounded-xl text-xs font-bold outline-none border focus:border-black"
                                    value={editingProduct?.image}
                                    onChange={(e) => setEditingProduct(prev => ({ ...(prev || {}), image: e.target.value } as Product))}
                                />
                            </div>
                        </div>
                        
                        {/* AI Image Generation */}
                        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                            <p className="text-[10px] font-black uppercase text-purple-600 mb-2">AI Image Generator</p>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    type="text" 
                                    placeholder="Describe image (e.g. A neon blue coffee mug on a wooden table)" 
                                    className="flex-1 bg-white px-3 py-2 rounded-lg text-xs font-bold outline-none border border-purple-200 focus:border-purple-500"
                                    value={aiImagePrompt}
                                    onChange={(e) => setAiImagePrompt(e.target.value)}
                                />
                                <button 
                                    onClick={handleGenerateImage}
                                    disabled={isGeneratingImage}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-purple-700 transition disabled:opacity-50"
                                >
                                    {isGeneratingImage ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Generate'}
                                </button>
                            </div>
                            {generatedImage && (
                                <div className="flex items-center gap-4 mt-3 bg-white p-2 rounded-lg border border-purple-100">
                                    <img src={generatedImage} className="w-12 h-12 rounded-lg object-cover" />
                                    <div className="flex-1">
                                        <p className="text-[10px] text-gray-500 font-bold">Image generated successfully!</p>
                                    </div>
                                    <button onClick={applyGeneratedImage} className="text-[10px] font-black uppercase text-green-600 hover:underline">Apply</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400">Name</label>
                    <input type="text" className="w-full bg-gray-50 rounded-xl p-3 font-bold text-sm outline-none border focus:border-black" onChange={(e) => setEditingProduct(prev => ({ ...(prev || {}), name: e.target.value } as Product))} value={editingProduct?.name || ''} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400">Price</label>
                    <input type="number" className="w-full bg-gray-50 rounded-xl p-3 font-bold text-sm outline-none border focus:border-black" onChange={(e) => setEditingProduct(prev => ({ ...(prev || {}), price: Number(e.target.value) } as Product))} value={editingProduct?.price || 0} />
                  </div>
                </div>
                
                <div className="space-y-2 relative">
                   <div className="flex justify-between items-center">
                       <label className="text-[10px] font-black uppercase text-gray-400">Description</label>
                       <button 
                        onClick={handleGenerateDescription}
                        disabled={isGeneratingDesc}
                        className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 disabled:opacity-50"
                       >
                         {isGeneratingDesc ? 'Generating...' : '✨ Generate with AI'}
                       </button>
                   </div>
                   <textarea rows={3} className="w-full bg-gray-50 rounded-xl p-3 font-bold text-sm outline-none border focus:border-black resize-none" onChange={(e) => setEditingProduct(prev => ({ ...(prev || {}), description: e.target.value } as Product))} value={editingProduct?.description || ''}></textarea>
                </div>

                <div className="space-y-4 border-t pt-4">
                   <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-gray-400">Custom Options (Variants)</label>
                      <button onClick={() => setTempOptions([...tempOptions, { name: 'New Option', values: ['Value 1'] }])} className="text-[10px] bg-black text-white px-3 py-1 rounded font-bold uppercase">+ Add Variant</button>
                   </div>
                   {tempOptions.map((opt, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-xl border space-y-3">
                         <div className="flex justify-between">
                            <input 
                              type="text" 
                              value={opt.name} 
                              onChange={(e) => {
                                const newOpts = [...tempOptions];
                                newOpts[idx] = { ...newOpts[idx], name: e.target.value };
                                setTempOptions(newOpts);
                              }}
                              className="bg-transparent font-black text-xs uppercase outline-none w-1/2"
                              placeholder="OPTION NAME (E.G. SIZE)"
                            />
                            <button onClick={() => setTempOptions(tempOptions.filter((_, i) => i !== idx))} className="text-red-500 text-xs font-bold">Remove</button>
                         </div>
                         <input 
                           type="text" 
                           value={opt.values.join(', ')} 
                           onChange={(e) => {
                              const newOpts = [...tempOptions];
                              newOpts[idx] = { ...newOpts[idx], values: e.target.value.split(',') };
                              setTempOptions(newOpts);
                           }}
                           className="w-full bg-white p-2 rounded border text-xs font-bold outline-none"
                           placeholder="Values separated by comma (e.g. S, M, L)"
                         />
                      </div>
                   ))}
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
                   <div>
                      <p className="font-bold text-xs uppercase">Allow Customer Uploads</p>
                      <p className="text-[10px] text-gray-400">Enable if users need to upload images (e.g. Magazines)</p>
                   </div>
                   <button 
                     onClick={() => setEditingProduct(prev => ({...prev, allowCustomImages: !prev?.allowCustomImages} as Product))}
                     className={`w-10 h-6 rounded-full relative transition ${editingProduct?.allowCustomImages ? 'bg-green-500' : 'bg-gray-300'}`}
                   >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${editingProduct?.allowCustomImages ? 'left-5' : 'left-1'}`}></div>
                   </button>
                </div>
             </div>
             <div className="p-6 border-t bg-gray-50">
                <button onClick={saveProduct} className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">Save All Changes</button>
             </div>
          </div>
        </div>
      )}

      {/* Generic Item Modal (Discount, Blog, Flash Sale) */}
      {showGenericModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl p-8 space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black italic uppercase">
                    {genericModalType === 'discount' && 'New Discount Code'}
                    {genericModalType === 'blog' && 'New Blog Post'}
                    {genericModalType === 'flash' && 'New Flash Sale'}
                 </h3>
                 <button onClick={() => setShowGenericModal(false)}><i className="fa-solid fa-xmark"></i></button>
              </div>
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">
                        {genericModalType === 'discount' && 'Discount Code'}
                        {genericModalType === 'blog' && 'Post Title'}
                        {genericModalType === 'flash' && 'Campaign Name'}
                    </label>
                    <input type="text" value={genericInputs.field1} onChange={(e) => setGenericInputs({...genericInputs, field1: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl text-sm font-bold outline-none border focus:border-black" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">
                        {genericModalType === 'discount' && 'Value (%)'}
                        {genericModalType === 'blog' && 'Author'}
                        {genericModalType === 'flash' && 'Discount Label'}
                    </label>
                    <input type="text" value={genericInputs.field2} onChange={(e) => setGenericInputs({...genericInputs, field2: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl text-sm font-bold outline-none border focus:border-black" />
                 </div>
                 {genericModalType === 'flash' && (
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Duration</label>
                        <input type="text" value={genericInputs.field3} onChange={(e) => setGenericInputs({...genericInputs, field3: e.target.value})} placeholder="e.g. 24 Hours" className="w-full bg-gray-50 p-3 rounded-xl text-sm font-bold outline-none border focus:border-black" />
                    </div>
                 )}
              </div>
              <button 
                 onClick={() => {
                    if(genericModalType === 'discount') handleAddDiscount();
                    if(genericModalType === 'flash') handleAddFlashSale();
                    if(genericModalType === 'blog') handleAddBlog();
                 }}
                 className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg"
              >
                 Create
              </button>
           </div>
        </div>
      )}

      {toast.visible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-black text-white px-8 py-4 rounded-full font-bold text-[10px] uppercase shadow-2xl animate-fade-in flex items-center space-x-3">
           <i className="fa-solid fa-circle-check text-green-400"></i>
           <span>{toast.message}</span>
        </div>
      )}
    </>
  );
};

export default App;
