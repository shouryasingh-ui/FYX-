export interface ProductOption {
  name: string;
  values: string[];
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  text: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  discountBadge?: string;
  category: string;
  image: string;
  stock: number;
  featured?: boolean;
  options?: ProductOption[];
  allowCustomImages?: boolean;
  reviews?: Review[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedOptions?: Record<string, string>;
  uploadedImages?: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  items: CartItem[];
  total: number;
  shipping: number;
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  time: string;
  address: string;
  phone: string;
  paymentMethod: string;
  paymentDetails?: {
    upiId?: string;
    screenshot?: string;
  };
}

export interface Promotion {
  id: string;
  type: 'popup' | 'banner';
  title: string;
  content: string;
  image?: string;
  ctaText?: string;
  ctaLink?: string; // Route or URL
  status: 'Active' | 'Inactive';
  displayRule: 'immediate' | 'delay' | 'exit-intent';
  delaySeconds?: number;
  closable: boolean;
}

export enum AppRoute {
  STORE = 'store',
  SEARCH = 'search',
  PRODUCT_DETAIL = 'product-detail',
  CART = 'cart',
  CHECKOUT = 'checkout',
  ORDER_SUCCESS = 'order-success',
  WISHLIST = 'wishlist',
  PROFILE = 'profile',
  MY_ORDERS = 'my-orders',
  ORDER_DETAIL = 'order-detail',
  // Admin Sections
  ADMIN_DASHBOARD = 'admin-dashboard',
  ADMIN_PRODUCTS = 'admin-products',
  ADMIN_CATEGORIES = 'admin-categories',
  ADMIN_ORDERS = 'admin-orders',
  ADMIN_CUSTOMERS = 'admin-customers',
  ADMIN_SUPPORT = 'admin-support',
  ADMIN_CHAT = 'admin-chat',
  ADMIN_DISCOUNTS = 'admin-discounts',
  ADMIN_FAQ = 'admin-faq',
  ADMIN_NEWSLETTER = 'admin-newsletter',
  ADMIN_LAYOUT = 'admin-layout',
  ADMIN_SITE_SETTINGS = 'admin-site-settings',
  ADMIN_THEME = 'admin-theme',
  ADMIN_POPUPS = 'admin-popups',
  ADMIN_EMAIL_TEMPLATES = 'admin-email-templates',
  ADMIN_SHIPPING = 'admin-shipping',
  ADMIN_TAX = 'admin-tax',
  ADMIN_BLOG = 'admin-blog',
  ADMIN_PAGES = 'admin-pages',
  ADMIN_FLASH_SALES = 'admin-flash-sales',
  ADMIN_SEGMENTS = 'admin-segments'
}