
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppRoute, Product, CartItem, Order, ProductOption } from './types';
import { INITIAL_PRODUCTS, CATEGORIES } from './constants';
import StorefrontLayout from './components/StorefrontLayout';
import AdminLayout from './components/AdminLayout';
import AIChatBubble from './components/AIChatBubble';
import { generateProductDescription, analyzeSalesTrends, generateMarketingEmail } from './services/geminiService';

const App: React.FC = () => {
  // --- Core State ---
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.STORE);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
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
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  
  // Generic "Add Item" Modal State
  const [showGenericModal, setShowGenericModal] = useState(false);
  const [genericModalType, setGenericModalType] = useState<'discount' | 'blog' | 'flash' | null>(null);
  const [genericInputs, setGenericInputs] = useState({ field1: '', field2: '', field3: '' });

  // Newsletter AI State
  const [newsletterTopic, setNewsletterTopic] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  // Admin Product Editing State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [tempOptions, setTempOptions] = useState<ProductOption[]>([]);
  
  // Temporary State for Adding Items (FAQ, etc)
  const [newItemInput, setNewItemInput] = useState({ title: '', content: '' });
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // --- User Data ---
  const [userAddress, setUserAddress] = useState({
    name: 'Shourya Singh',
    line: 'Rastogi nagar, 441/574, Lucknow, Uttar pradesh 226003',
    phone: '7068528064'
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
    
    // Admin Persistence
    localStorage.setItem('fyx_settings', JSON.stringify(settings));
    localStorage.setItem('fyx_faqs', JSON.stringify(faqs));
    localStorage.setItem('fyx_discounts', JSON.stringify(discounts));
    localStorage.setItem('fyx_blog', JSON.stringify(blogPosts));
    localStorage.setItem('fyx_flash', JSON.stringify(flashSales));
  }, [products, orders, wishlist, cart, storeCategories, settings, faqs, discounts, blogPosts, flashSales]);

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
    setWishlist(prev => {
      const exists = prev.includes(productId);
      showToast(exists ? "Removed from wishlist." : "Added to wishlist.");
      return exists ? prev.filter(id => id !== productId) : [...prev, productId];
    });
  };

  const finalCheckout = () => {
    if (cart.length === 0) return;
    const orderNum = `FYX-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: orderNum,
      customerName: userAddress.name,
      items: [...cart],
      total: cartTotal + settings.shippingFee, 
      shipping: settings.shippingFee,
      status: 'confirmed',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      address: userAddress.line,
      phone: userAddress.phone,
      paymentMethod: checkoutPayment
    };
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setViewingOrder(newOrder);
    setCheckoutStep(1);
    setCurrentRoute(AppRoute.ORDER_SUCCESS);
  };

  // --- Admin Handlers ---
  const openEditProduct = (product: Product | null) => {
    if (product) {
      setEditingProduct({...product});
      setTempOptions(product.options ? [...product.options] : []);
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

  const saveProduct = () => {
    if (!editingProduct || !editingProduct.name) {
      showToast("Product name is required!");
      return;
    }
    
    const finalProduct: Product = {
      ...editingProduct,
      options: tempOptions
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

  const addFAQ = () => {
    if(newItemInput.title && newItemInput.content) {
      setFaqs([...faqs, { id: Date.now(), question: newItemInput.title, answer: newItemInput.content }]);
      setNewItemInput({ title: '', content: '' });
      showToast('FAQ Added');
    }
  };

  // --- Generic Modal Handlers ---
  const openGenericModal = (type: 'discount' | 'blog' | 'flash') => {
    setGenericModalType(type);
    setGenericInputs({ field1: '', field2: '', field3: '' });
    setShowGenericModal(true);
  }

  const handleGenericSubmit = () => {
    if (!genericInputs.field1) return;

    if (genericModalType === 'discount') {
        const newDiscount = {
            code: genericInputs.field1,
            type: 'Percentage',
            value: Number(genericInputs.field2) || 10,
            usage: 0,
            status: 'Active'
        };
        setDiscounts([newDiscount, ...discounts]);
        showToast('Discount Code Created');
    } else if (genericModalType === 'blog') {
        const newPost = {
            id: Date.now(),
            title: genericInputs.field1,
            author: genericInputs.field2 || 'Admin',
            date: new Date().toLocaleDateString(),
            status: 'Published'
        };
        setBlogPosts([newPost, ...blogPosts]);
        showToast('Blog Post Published');
    } else if (genericModalType === 'flash') {
        const newSale = {
            id: Date.now(),
            name: genericInputs.field1,
            discount: genericInputs.field2 || '10%',
            endsIn: genericInputs.field3 || '24 Hours',
            status: 'Active'
        };
        setFlashSales([newSale, ...flashSales]);
        showToast('Flash Sale Campaign Started');
    }
    setShowGenericModal(false);
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

  // --- STOREFRONT VIEWS ---
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
            src="https://images.unsplash.com/photo-1507646227248-01b941a4883e?auto=format&fit=crop&q=80&w=2000" 
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
  
  const renderWishlist = () => (
    <div className="px-6 py-10 min-h-screen bg-white animate-slide-up pb-24">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => setCurrentRoute(AppRoute.STORE)}><i className="fa-solid fa-arrow-left"></i></button>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">My Wishlist.</h2>
      </div>
      {wishlistItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <i className="fa-regular fa-heart text-5xl text-gray-200 mb-6"></i>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Your wishlist is empty</p>
          <button onClick={() => setCurrentRoute(AppRoute.STORE)} className="mt-8 bg-black text-white px-8 py-3 rounded-xl text-xs font-black uppercase">Start Shopping</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {wishlistItems.map(p => (
            <div key={p.id} className="group cursor-pointer" onClick={() => navigateToProduct(p)}>
              <div className="aspect-[3/4] rounded-2xl overflow-hidden relative mb-4">
                <img src={p.image} className="w-full h-full object-cover" />
                <button onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center"><i className="fa-solid fa-xmark text-xs"></i></button>
              </div>
              <h3 className="font-bold text-sm uppercase tracking-tight">{p.name}</h3>
              <p className="text-sm font-black mt-1">₹{p.price}</p>
              <button className="w-full mt-4 bg-gray-100 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-black hover:text-white transition">Add to Bag</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMyOrders = () => (
    <div className="px-6 py-10 min-h-screen bg-white animate-slide-up pb-24">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => setCurrentRoute(AppRoute.PROFILE)}><i className="fa-solid fa-arrow-left"></i></button>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">My Orders.</h2>
      </div>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <i className="fa-solid fa-box-open text-5xl text-gray-200 mb-6"></i>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(o => (
            <div key={o.id} onClick={() => { setViewingOrder(o); setCurrentRoute(AppRoute.ORDER_DETAIL); }} className="bg-gray-50 p-6 rounded-[24px] cursor-pointer hover:bg-gray-100 transition">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="bg-black text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">#{o.orderNumber}</span>
                  <p className="text-[10px] font-bold text-gray-400 mt-2">{o.date}</p>
                </div>
                <i className="fa-solid fa-chevron-right text-gray-300"></i>
              </div>
              <div className="flex items-center space-x-4 mb-6 overflow-x-auto no-scrollbar">
                {o.items.map((item, idx) => (
                  <img key={idx} src={item.image} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ))}
                {o.items.length > 3 && <span className="text-xs font-bold text-gray-400">+{o.items.length - 3}</span>}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">{o.status}</span>
                <span className="font-black text-lg">₹{o.total}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderOrderDetail = () => {
    if (!viewingOrder) return null;
    return (
      <div className="px-6 py-10 min-h-screen bg-white animate-slide-up pb-24">
        <div className="flex items-center space-x-4 mb-8">
          <button onClick={() => setCurrentRoute(AppRoute.MY_ORDERS)}><i className="fa-solid fa-arrow-left"></i></button>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">Order Details</h2>
        </div>
        <div className="space-y-8">
          <div className="bg-gray-50 p-6 rounded-[24px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg uppercase tracking-tight">#{viewingOrder.orderNumber}</h3>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase">{viewingOrder.status}</span>
            </div>
            <div className="space-y-4">
              {viewingOrder.items.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <img src={item.image} className="w-16 h-16 rounded-xl object-cover" />
                  <div>
                    <p className="font-bold text-sm uppercase">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{Object.entries(item.selectedOptions || {}).map(([k,v]) => `${k}: ${v}`).join(' • ')}</p>
                    {item.uploadedImages && item.uploadedImages.length > 0 && <p className="text-[10px] font-black text-blue-500 mt-1">{item.uploadedImages.length} Custom Images Attached</p>}
                    <p className="text-xs font-black mt-2">₹{item.price} x {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Delivery Address</h4>
            <div className="bg-white border rounded-[20px] p-6">
              <p className="font-bold text-sm uppercase mb-1">{viewingOrder.customerName}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{viewingOrder.address}</p>
              <p className="text-xs text-gray-500 font-bold mt-2">{viewingOrder.phone}</p>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Payment Summary</h4>
            <div className="bg-white border rounded-[20px] p-6 space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-500"><span>Payment Method</span><span>{viewingOrder.paymentMethod}</span></div>
              <div className="flex justify-between text-xs font-bold text-gray-500"><span>Shipping</span><span>₹{viewingOrder.shipping}</span></div>
              <div className="flex justify-between text-lg font-black italic pt-2 border-t"><span>Total</span><span>₹{viewingOrder.total}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="px-6 py-10 min-h-screen bg-white animate-slide-up">
      <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-8">My Profile.</h2>
      <div className="bg-gray-900 text-white rounded-[32px] p-8 mb-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex items-center space-x-6">
          <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-black">SS</div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight">{userAddress.name}</h3>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">shourya@fyx.com</p>
            <span className="inline-block mt-3 bg-[#d9c5b2] text-black text-[9px] font-black px-3 py-1 rounded-full uppercase">Platinum Member</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
      </div>
      <div className="space-y-2">
        {[{ icon: 'fa-box', label: 'My Orders', action: () => setCurrentRoute(AppRoute.MY_ORDERS) },{ icon: 'fa-heart', label: 'Wishlist', action: () => setCurrentRoute(AppRoute.WISHLIST) },{ icon: 'fa-location-dot', label: 'Address Book', action: () => setShowAddressModal(true) },].map((item) => (
          <button key={item.label} onClick={item.action} className="w-full bg-gray-50 p-6 rounded-2xl flex items-center justify-between hover:bg-gray-100 transition">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-500"><i className={`fa-solid ${item.icon}`}></i></div>
              <span className="font-bold text-sm uppercase tracking-wide">{item.label}</span>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-gray-300"></i>
          </button>
        ))}
      </div>
      <div className="mt-10 pt-10 border-t border-dashed space-y-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Settings</p>
        <button onClick={() => setCurrentRoute(AppRoute.ADMIN_DASHBOARD)} className="w-full bg-white border-2 border-black p-5 rounded-2xl flex items-center justify-between group hover:bg-black hover:text-white transition">
          <div className="flex items-center space-x-4">
            <i className="fa-solid fa-gauge-high text-xl"></i>
            <span className="font-black text-xs uppercase tracking-widest">Admin Dashboard</span>
          </div>
          <i className="fa-solid fa-arrow-right transform group-hover:translate-x-1 transition"></i>
        </button>
        <button className="w-full p-5 rounded-2xl flex items-center space-x-4 text-red-500 font-bold text-xs uppercase hover:bg-red-50 transition">
          <i className="fa-solid fa-right-from-bracket"></i>
          <span>Log Out</span>
        </button>
      </div>
      <p className="text-center mt-12 text-[10px] text-gray-300 font-bold uppercase tracking-widest">FYX App v2.4.1</p>
    </div>
  );

  const renderAdminView = () => {
    switch (currentRoute) {
      case AppRoute.ADMIN_PRODUCTS:
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">Inventory</h3>
              <button onClick={() => openEditProduct(null)} className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                + Add New
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {products.map(p => (
                 <div key={p.id} className="bg-white p-4 rounded-3xl shadow-sm border flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                       <img src={p.image} className="w-16 h-16 rounded-xl object-cover bg-gray-50" />
                       <div className="flex gap-2">
                          <button onClick={() => openEditProduct(p)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-black hover:text-white transition"><i className="fa-solid fa-pen text-xs"></i></button>
                          <button onClick={() => setProducts(products.filter(i => i.id !== p.id))} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition"><i className="fa-solid fa-trash text-xs"></i></button>
                       </div>
                    </div>
                    <div>
                       <h4 className="font-bold text-sm uppercase truncate">{p.name}</h4>
                       <p className="text-xs text-gray-400 font-medium">Stock: {p.stock} • ₹{p.price}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        );

      case AppRoute.ADMIN_CATEGORIES:
        return (
          <div className="space-y-8 animate-fade-in">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Categories</h3>
            <div className="bg-white p-6 rounded-[24px] border shadow-sm">
               <div className="flex gap-4 mb-8">
                  <input 
                     type="text" 
                     placeholder="New Category Name" 
                     className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold outline-none border focus:border-black"
                     value={newCategoryName}
                     onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <button 
                     onClick={() => {
                        if (newCategoryName && !storeCategories.includes(newCategoryName)) {
                           setStoreCategories([...storeCategories, newCategoryName]);
                           setNewCategoryName('');
                           showToast(`Category "${newCategoryName}" added`);
                        }
                     }}
                     className="bg-black text-white px-6 rounded-xl font-black text-xs uppercase"
                  >Add</button>
               </div>
               <div className="space-y-3">
                  {storeCategories.map(cat => (
                     <div key={cat} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                        <span className="font-bold uppercase text-sm">{cat}</span>
                        <button onClick={() => setStoreCategories(storeCategories.filter(c => c !== cat))} className="text-gray-300 hover:text-red-500"><i className="fa-solid fa-trash"></i></button>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        );

      case AppRoute.ADMIN_FAQ:
        return (
           <div className="space-y-8 animate-fade-in">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">FAQ Manager</h3>
              <div className="bg-white p-6 rounded-[24px] border shadow-sm space-y-4">
                 <div className="flex gap-4">
                    <input type="text" placeholder="Question" className="flex-1 bg-gray-50 rounded-xl p-3 text-sm font-bold outline-none" value={newItemInput.title} onChange={e => setNewItemInput({...newItemInput, title: e.target.value})} />
                    <input type="text" placeholder="Answer" className="flex-1 bg-gray-50 rounded-xl p-3 text-sm font-bold outline-none" value={newItemInput.content} onChange={e => setNewItemInput({...newItemInput, content: e.target.value})} />
                    <button onClick={addFAQ} className="bg-black text-white px-6 rounded-xl font-black text-xs uppercase">Add</button>
                 </div>
                 <div className="space-y-3">
                    {faqs.map(faq => (
                       <div key={faq.id} className="p-4 bg-gray-50 rounded-xl border">
                          <div className="flex justify-between items-start">
                             <div>
                                <h4 className="font-bold text-sm">{faq.question}</h4>
                                <p className="text-xs text-gray-500 mt-1">{faq.answer}</p>
                             </div>
                             <button onClick={() => setFaqs(faqs.filter(f => f.id !== faq.id))} className="text-red-500"><i className="fa-solid fa-trash text-xs"></i></button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        );

      case AppRoute.ADMIN_NEWSLETTER:
         return (
            <div className="space-y-8 animate-fade-in">
               <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter">AI Email Marketing</h3>
               </div>
               
               <div className="bg-white p-6 rounded-[24px] border shadow-sm space-y-4">
                   <p className="text-xs font-bold text-gray-400 uppercase">Draft New Campaign</p>
                   <div className="flex gap-4">
                       <input 
                         type="text" 
                         placeholder="Campaign Topic (e.g. Summer Sale starting tomorrow)" 
                         className="flex-1 bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none"
                         value={newsletterTopic}
                         onChange={(e) => setNewsletterTopic(e.target.value)}
                       />
                       <button 
                         onClick={handleGenerateEmail}
                         disabled={isGeneratingEmail}
                         className="bg-black text-white px-6 rounded-xl font-black text-xs uppercase disabled:opacity-50"
                       >
                         {isGeneratingEmail ? 'Writing...' : 'Draft with AI'}
                       </button>
                   </div>
                   {generatedEmail && (
                       <div className="bg-gray-50 p-6 rounded-xl border border-dashed relative">
                           <button onClick={() => setGeneratedEmail('')} className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
                           <pre className="whitespace-pre-wrap font-sans text-sm text-gray-600">{generatedEmail}</pre>
                           <button onClick={() => showToast("Email Sent to Subscribers!")} className="mt-4 bg-green-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg">Send Campaign</button>
                       </div>
                   )}
               </div>

               <h4 className="text-xl font-black italic uppercase tracking-tighter mt-8">Subscribers</h4>
               <div className="bg-white rounded-[24px] border shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                     <thead className="bg-gray-50 border-b">
                        <tr>
                           <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Email</th>
                           <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Date Joined</th>
                           <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y">
                        {subscribers.map((sub, i) => (
                           <tr key={i}>
                              <td className="px-6 py-4 font-bold text-sm">{sub.email}</td>
                              <td className="px-6 py-4 text-xs font-medium text-gray-500">{sub.date}</td>
                              <td className="px-6 py-4">
                                 <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${sub.status === 'Subscribed' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>{sub.status}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         );

      case AppRoute.ADMIN_BLOG:
         return (
            <div className="space-y-8 animate-fade-in">
               <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Blog Posts</h3>
                  <button onClick={() => openGenericModal('blog')} className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">+ Write New</button>
               </div>
               <div className="space-y-4">
                  {blogPosts.map(post => (
                     <div key={post.id} className="bg-white p-6 rounded-[24px] border shadow-sm flex justify-between items-center">
                        <div>
                           <h4 className="font-bold text-lg">{post.title}</h4>
                           <p className="text-xs text-gray-400 font-bold uppercase mt-1">By {post.author} • {post.date}</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${post.status === 'Published' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>{post.status}</span>
                           <button onClick={() => setBlogPosts(blogPosts.filter(p => p.id !== post.id))} className="text-red-500"><i className="fa-solid fa-trash"></i></button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         );

      case AppRoute.ADMIN_FLASH_SALES:
         return (
            <div className="space-y-8 animate-fade-in">
               <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Flash Sales</h3>
                  <button onClick={() => openGenericModal('flash')} className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">+ Campaign</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flashSales.map(sale => (
                     <div key={sale.id} className="bg-white p-6 rounded-[24px] border shadow-sm relative">
                        <button onClick={() => setFlashSales(flashSales.filter(s => s.id !== sale.id))} className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
                        <div className="flex justify-between items-start mb-4">
                           <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${sale.status === 'Active' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{sale.status}</span>
                           <span className="text-2xl font-black">{sale.discount}</span>
                        </div>
                        <h4 className="font-black text-lg uppercase italic">{sale.name}</h4>
                        <p className="text-xs text-gray-400 font-bold uppercase mt-2">Ends in: {sale.endsIn}</p>
                     </div>
                  ))}
               </div>
            </div>
         );

      case AppRoute.ADMIN_ORDERS:
        return (
          <div className="space-y-8 animate-fade-in">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Orders</h3>
            <div className="space-y-4">
              {orders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-[24px] border shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                     <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">{o.status}</span>
                     <span className="text-[10px] font-bold text-gray-400">{o.date}</span>
                  </div>
                  <div className="flex justify-between items-end">
                     <div>
                        <p className="font-black text-lg uppercase tracking-tight">{o.customerName}</p>
                        <p className="text-xs text-gray-400 font-bold uppercase mt-1">#{o.orderNumber}</p>
                     </div>
                     <p className="font-black italic text-xl">₹{o.total}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case AppRoute.ADMIN_CUSTOMERS:
      case AppRoute.ADMIN_SEGMENTS:
         return (
            <div className="space-y-8 animate-fade-in">
               <h3 className="text-2xl font-black italic uppercase tracking-tighter">Customers & Segments</h3>
               <div className="bg-white rounded-[24px] border shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                     <thead className="bg-gray-50 border-b">
                        <tr>
                           <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Name</th>
                           <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Contact</th>
                           <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Orders</th>
                           <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Spent</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y">
                        {customers.map(c => (
                           <tr key={c.id}>
                              <td className="px-6 py-4">
                                 <p className="font-bold text-sm uppercase">{c.name}</p>
                                 <p className="text-[10px] font-bold text-green-500 uppercase">{c.status}</p>
                              </td>
                              <td className="px-6 py-4">
                                 <p className="text-xs font-bold">{c.email}</p>
                                 <p className="text-[10px] text-gray-400">{c.phone}</p>
                              </td>
                              <td className="px-6 py-4 font-bold text-sm">{c.orders}</td>
                              <td className="px-6 py-4 font-bold text-sm text-right">₹{c.spent}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         );

      case AppRoute.ADMIN_SUPPORT:
      case AppRoute.ADMIN_CHAT:
         return (
            <div className="space-y-8 animate-fade-in">
               <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Support Desk</h3>
                  <div className="flex space-x-2">
                     <span className="bg-red-50 text-red-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase">2 Open</span>
                  </div>
               </div>
               <div className="space-y-4">
                  {tickets.map(t => (
                     <div key={t.id} className="bg-white p-6 rounded-[24px] border border-l-4 border-l-black shadow-sm">
                        <div className="flex justify-between mb-2">
                           <span className="text-[10px] font-black uppercase text-gray-400">#{t.id}</span>
                           <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${t.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{t.status}</span>
                        </div>
                        <h4 className="font-bold text-lg mb-2">{t.subject}</h4>
                        <div className="flex justify-between items-end">
                           <p className="text-xs font-bold text-gray-500">From: {t.user}</p>
                           <button className="bg-black text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase">Reply</button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         );

      case AppRoute.ADMIN_DISCOUNTS:
         return (
            <div className="space-y-8 animate-fade-in">
               <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Discounts</h3>
                  <button onClick={() => openGenericModal('discount')} className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">+ Code</button>
               </div>
               <div className="space-y-4">
                  {discounts.map((d, i) => (
                     <div key={i} className="bg-white p-6 rounded-[24px] border shadow-sm flex justify-between items-center">
                        <div>
                           <div className="flex items-center space-x-3">
                              <h4 className="font-black text-xl uppercase tracking-tight">{d.code}</h4>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${d.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>{d.status}</span>
                           </div>
                           <p className="text-xs font-bold text-gray-400 mt-1">{d.type} • {d.value}{d.type === 'Percentage' ? '%' : ' INR'} Off</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="text-right">
                              <p className="text-2xl font-black italic">{d.usage}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Uses</p>
                           </div>
                           <button onClick={() => setDiscounts(discounts.filter((_, idx) => idx !== i))} className="text-red-500 ml-4"><i className="fa-solid fa-trash"></i></button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         );

      case AppRoute.ADMIN_SITE_SETTINGS:
      case AppRoute.ADMIN_SHIPPING:
      case AppRoute.ADMIN_EMAIL_TEMPLATES:
      case AppRoute.ADMIN_TAX:
         return (
            <div className="space-y-8 animate-fade-in">
               <h3 className="text-2xl font-black italic uppercase tracking-tighter">Configuration</h3>
               <div className="bg-white p-8 rounded-[32px] border shadow-sm space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Store Name</label>
                     <input type="text" value={settings.siteName} onChange={e => setSettings({...settings, siteName: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl font-bold text-sm outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Shipping Fee</label>
                        <input type="number" value={settings.shippingFee} onChange={e => setSettings({...settings, shippingFee: Number(e.target.value)})} className="w-full bg-gray-50 p-4 rounded-xl font-bold text-sm outline-none" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Free Ship Limit</label>
                        <input type="number" value={settings.freeShippingThreshold} onChange={e => setSettings({...settings, freeShippingThreshold: Number(e.target.value)})} className="w-full bg-gray-50 p-4 rounded-xl font-bold text-sm outline-none" />
                     </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                     <span className="font-bold text-sm uppercase">Maintenance Mode</span>
                     <button onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})} className={`w-12 h-6 rounded-full relative transition ${settings.maintenanceMode ? 'bg-black' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
                     </button>
                  </div>
                  <button onClick={() => showToast("Configuration Saved")} className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs">Save Configuration</button>
               </div>
            </div>
         );

      case AppRoute.ADMIN_THEME:
      case AppRoute.ADMIN_LAYOUT:
      case AppRoute.ADMIN_POPUPS:
      case AppRoute.ADMIN_PAGES:
         return (
            <div className="space-y-8 animate-fade-in">
               <h3 className="text-2xl font-black italic uppercase tracking-tighter">Visual Design</h3>
               <div className="bg-white p-8 rounded-[32px] border shadow-sm space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Primary Color</label>
                        <div className="flex items-center space-x-3">
                           <input type="color" value={settings.primaryColor} onChange={e => setSettings({...settings, primaryColor: e.target.value})} className="w-10 h-10 rounded-xl border-none" />
                           <span className="font-bold text-sm">{settings.primaryColor}</span>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Font Family</label>
                         <select value={settings.fontFamily} onChange={e => setSettings({...settings, fontFamily: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none">
                            <option value="Inter">Inter</option>
                            <option value="Roboto">Roboto</option>
                            <option value="Poppins">Poppins</option>
                         </select>
                     </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-dashed flex flex-col items-center text-center space-y-3">
                     <i className="fa-solid fa-cloud-arrow-up text-2xl text-gray-400"></i>
                     <p className="text-xs font-bold text-gray-500">Upload Store Logo</p>
                  </div>
                  <button onClick={() => showToast("Theme Settings Updated")} className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs">Update Theme</button>
               </div>
            </div>
         );

      default: // Dashboard
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-[#1a1614] p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                  <p className="text-[10px] font-black text-[#d9c5b2] uppercase tracking-widest mb-2">Total Revenue</p>
                  <h3 className="text-4xl font-black italic tracking-tighter">₹{orders.reduce((s,o)=>s+o.total,0).toLocaleString()}</h3>
                  <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10">
                     <div className="flex items-center space-x-2 mb-2">
                        <i className="fa-solid fa-wand-magic-sparkles text-[#d9c5b2] text-xs"></i>
                        <span className="text-[10px] font-bold uppercase tracking-widest">AI Insight</span>
                     </div>
                     <p className="text-xs font-medium text-gray-300 leading-relaxed">"{adminStatsMsg}"</p>
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-40 h-40 bg-[#d9c5b2] rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-[24px] border shadow-sm">
                  <i className="fa-solid fa-box text-2xl mb-4 text-gray-300"></i>
                  <h4 className="text-2xl font-black">{orders.length}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Orders</p>
               </div>
               <div className="bg-white p-6 rounded-[24px] border shadow-sm">
                  <i className="fa-solid fa-users text-2xl mb-4 text-gray-300"></i>
                  <h4 className="text-2xl font-black">{customers.length}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Users</p>
               </div>
            </div>
          </div>
        );
    }
  };

  const renderCurrentView = () => {
    if (currentRoute.startsWith('admin')) {
      return (
        <AdminLayout onNavigate={setCurrentRoute} currentRoute={currentRoute}>
          {renderAdminView()}
        </AdminLayout>
      );
    }

    return (
      <StorefrontLayout onNavigate={setCurrentRoute} currentRoute={currentRoute} cartCount={cartCount} wishlistCount={wishlist.length}>
        {currentRoute === AppRoute.STORE && renderStore()}
        {currentRoute === AppRoute.PRODUCT_DETAIL && renderProductDetail()}
        {currentRoute === AppRoute.PROFILE && renderProfile()}
        {currentRoute === AppRoute.WISHLIST && renderWishlist()}
        {currentRoute === AppRoute.MY_ORDERS && renderMyOrders()}
        {currentRoute === AppRoute.ORDER_DETAIL && renderOrderDetail()}
        {currentRoute === AppRoute.CART && (
          <div className="px-6 py-10 min-h-screen bg-white animate-slide-up pb-24">
            <h2 className="text-4xl font-black italic uppercase mb-10 tracking-tighter">My Bag.</h2>
            {cart.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-[40px]">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                   <i className="fa-solid fa-bag-shopping text-2xl text-gray-300"></i>
                </div>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Bag is empty</p>
                <button onClick={()=>setCurrentRoute(AppRoute.STORE)} className="mt-8 text-black font-black text-xs uppercase underline">Go Shopping</button>
              </div>
            ) : (
              <div className="space-y-6">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-6 animate-fade-in">
                    <img src={item.image} className="w-24 h-32 rounded-2xl object-cover bg-gray-50" />
                    <div className="flex-1 py-1 flex flex-col justify-between">
                      <div>
                         <div className="flex justify-between items-start">
                           <h4 className="font-bold text-sm uppercase tracking-tight leading-tight max-w-[140px]">{item.name}</h4>
                           <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
                         </div>
                         <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                           {item.selectedOptions ? Object.entries(item.selectedOptions).map(([k,v]) => `${v}`).join(' / ') : ''}
                         </p>
                         {item.uploadedImages && item.uploadedImages.length > 0 && (
                            <div className="flex mt-2 space-x-1">
                               {item.uploadedImages.slice(0, 3).map((img, i) => (
                                  <img key={i} src={img} className="w-6 h-6 rounded object-cover border" />
                               ))}
                               {item.uploadedImages.length > 3 && <span className="text-[9px] font-bold text-gray-400">+{item.uploadedImages.length - 3}</span>}
                            </div>
                         )}
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="font-black">₹{item.price}</span>
                         <span className="bg-gray-100 text-[10px] font-bold px-2 py-1 rounded-lg">x{item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="fixed bottom-16 md:bottom-0 left-0 w-full bg-white border-t p-6 z-40">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-sm font-bold text-gray-500 uppercase">Total</span>
                    <span className="text-3xl font-black italic tracking-tighter">₹{(cartTotal + settings.shippingFee).toFixed(2)}</span>
                  </div>
                  <button onClick={() => { setCheckoutStep(1); setCurrentRoute(AppRoute.CHECKOUT); }} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl">
                     Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {currentRoute === AppRoute.CHECKOUT && (
          <div className="px-6 py-10 min-h-screen bg-white animate-slide-up pb-24">
             {/* Header */}
             <div className="flex items-center space-x-4 mb-10">
                <button onClick={() => setCurrentRoute(AppRoute.CART)}><i className="fa-solid fa-arrow-left"></i></button>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Checkout</h2>
             </div>
             
             {/* Steps */}
             <div className="space-y-8">
                {/* Step 1: Address */}
                <div className={`transition-opacity duration-300 ${checkoutStep !== 1 ? 'opacity-50' : 'opacity-100'}`}>
                   <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${checkoutStep > 1 ? 'bg-black text-white' : 'bg-gray-100'}`}>1</div>
                      <h3 className="font-black uppercase text-sm">Shipping</h3>
                   </div>
                   {checkoutStep === 1 && (
                      <div className="bg-gray-50 p-6 rounded-[24px] space-y-4 animate-fade-in">
                         <div className="flex justify-between">
                            <span className="font-bold text-sm">{userAddress.name}</span>
                            <button onClick={() => setShowAddressModal(true)} className="text-xs font-bold text-blue-600">Edit</button>
                         </div>
                         <p className="text-xs text-gray-500 leading-relaxed">{userAddress.line}</p>
                         <p className="text-xs text-gray-500 font-bold">{userAddress.phone}</p>
                         <button onClick={() => setCheckoutStep(2)} className="w-full bg-black text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest mt-4">Continue</button>
                      </div>
                   )}
                </div>

                {/* Step 2: Payment */}
                <div className={`transition-opacity duration-300 ${checkoutStep !== 2 ? 'opacity-50' : 'opacity-100'}`}>
                   <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${checkoutStep > 2 ? 'bg-black text-white' : 'bg-gray-100'}`}>2</div>
                      <h3 className="font-black uppercase text-sm">Payment</h3>
                   </div>
                   {checkoutStep === 2 && (
                      <div className="space-y-3 animate-fade-in">
                         {['Credit/Debit Card', 'UPI (PhonePe/GPay)', 'Cash on Delivery'].map(m => (
                            <div key={m} onClick={() => setCheckoutPayment(m)} className={`p-4 rounded-xl border flex justify-between items-center cursor-pointer ${checkoutPayment === m ? 'border-black bg-black text-white' : 'border-gray-200'}`}>
                               <span className="text-xs font-bold uppercase">{m}</span>
                               {checkoutPayment === m && <i className="fa-solid fa-check text-xs"></i>}
                            </div>
                         ))}
                         <div className="flex space-x-3 mt-4">
                            <button onClick={() => setCheckoutStep(1)} className="px-6 py-4 rounded-xl border font-black text-[10px] uppercase">Back</button>
                            <button onClick={() => setCheckoutStep(3)} className="flex-1 bg-black text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest">Review</button>
                         </div>
                      </div>
                   )}
                </div>

                {/* Step 3: Review */}
                <div className={`transition-opacity duration-300 ${checkoutStep !== 3 ? 'opacity-50' : 'opacity-100'}`}>
                   <div className="flex items-center space-x-3 mb-4">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black">3</div>
                      <h3 className="font-black uppercase text-sm">Confirm</h3>
                   </div>
                   {checkoutStep === 3 && (
                      <div className="animate-fade-in">
                         <div className="bg-gray-50 p-6 rounded-[24px] space-y-4 mb-6">
                            <div className="flex justify-between text-xs font-bold text-gray-500"><span>Items Total</span><span>₹{cartTotal}</span></div>
                            <div className="flex justify-between text-xs font-bold text-gray-500"><span>Delivery</span><span>₹{settings.shippingFee}</span></div>
                            <div className="flex justify-between text-lg font-black italic"><span>Total Pay</span><span>₹{cartTotal + settings.shippingFee}</span></div>
                         </div>
                         <button onClick={finalCheckout} className="w-full bg-black text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Place Order</button>
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}
        {currentRoute === AppRoute.ORDER_SUCCESS && (
          <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center animate-slide-up">
            <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mb-8 shadow-xl animate-bounce"><i className="fa-solid fa-check text-4xl"></i></div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Order Placed</h2>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-12">ID: {viewingOrder?.orderNumber}</p>
            <button onClick={() => setCurrentRoute(AppRoute.STORE)} className="bg-black text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Continue Shopping</button>
          </div>
        )}
        <AIChatBubble />
      </StorefrontLayout>
    );
  };

  return (
    <div className="font-sans antialiased text-gray-900 bg-white">
      {renderCurrentView()}

      {/* Address Edit Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl p-8 space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black italic uppercase">Edit Address</h3>
                <button onClick={() => setShowAddressModal(false)}><i className="fa-solid fa-xmark"></i></button>
             </div>
             <div className="space-y-4">
               <input type="text" placeholder="Full Name" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={userAddress.name} onChange={(e) => setUserAddress({...userAddress, name: e.target.value})} />
               <textarea placeholder="Address Line" rows={3} className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none resize-none" value={userAddress.line} onChange={(e) => setUserAddress({...userAddress, line: e.target.value})} />
               <input type="text" placeholder="Phone Number" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={userAddress.phone} onChange={(e) => setUserAddress({...userAddress, phone: e.target.value})} />
             </div>
             <button onClick={() => setShowAddressModal(false)} className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest">Save Details</button>
           </div>
        </div>
      )}

      {/* Generic Add Item Modal (Blog, Discount, Flash) */}
      {showGenericModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl p-8 space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black italic uppercase">
                    {genericModalType === 'discount' && 'Add Discount'}
                    {genericModalType === 'blog' && 'New Blog Post'}
                    {genericModalType === 'flash' && 'New Flash Sale'}
                </h3>
                <button onClick={() => setShowGenericModal(false)}><i className="fa-solid fa-xmark"></i></button>
             </div>
             <div className="space-y-4">
                {genericModalType === 'discount' && (
                    <>
                        <input type="text" placeholder="Code (e.g. SAVE10)" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={genericInputs.field1} onChange={e => setGenericInputs({...genericInputs, field1: e.target.value})} />
                        <input type="number" placeholder="Percentage Value" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={genericInputs.field2} onChange={e => setGenericInputs({...genericInputs, field2: e.target.value})} />
                    </>
                )}
                {genericModalType === 'blog' && (
                    <>
                        <input type="text" placeholder="Post Title" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={genericInputs.field1} onChange={e => setGenericInputs({...genericInputs, field1: e.target.value})} />
                        <input type="text" placeholder="Author Name" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={genericInputs.field2} onChange={e => setGenericInputs({...genericInputs, field2: e.target.value})} />
                    </>
                )}
                {genericModalType === 'flash' && (
                    <>
                        <input type="text" placeholder="Campaign Name" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={genericInputs.field1} onChange={e => setGenericInputs({...genericInputs, field1: e.target.value})} />
                        <input type="text" placeholder="Discount Label (e.g. 50% OFF)" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={genericInputs.field2} onChange={e => setGenericInputs({...genericInputs, field2: e.target.value})} />
                        <input type="text" placeholder="Duration (e.g. 2 Days)" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-sm outline-none" value={genericInputs.field3} onChange={e => setGenericInputs({...genericInputs, field3: e.target.value})} />
                    </>
                )}
             </div>
             <button onClick={handleGenericSubmit} className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest">Save Item</button>
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
                                newOpts[idx].name = e.target.value;
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
                              newOpts[idx].values = e.target.value.split(',').map(s => s.trim());
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

      {toast.visible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-black text-white px-8 py-4 rounded-full font-bold text-[10px] uppercase shadow-2xl animate-fade-in flex items-center space-x-3">
           <i className="fa-solid fa-circle-check text-green-400"></i>
           <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
