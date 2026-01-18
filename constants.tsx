
import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Photo Magazine',
    description: 'Stories that inspire in high-quality print. Upload your favorite memories and we will compile them into a beautiful glossy magazine.',
    price: 899.00,
    oldPrice: 999.00,
    discountBadge: '-10%',
    category: 'Magazine',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
    stock: 100,
    featured: true,
    allowCustomImages: true,
    options: [
      { name: 'Paper Finish', values: ['Glossy', 'Matte'] },
      { name: 'Pages', values: ['20 Pages', '40 Pages', '60 Pages'] }
    ]
  },
  {
    id: '2',
    name: 'Sleek iPhone Case',
    description: 'Protect in style with premium matte finish.',
    price: 249.00,
    oldPrice: 299.00,
    discountBadge: '-17%',
    category: 'Phone Cover',
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=800',
    stock: 50,
    featured: true,
    options: [
      { name: 'Model', values: ['iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 15 Pro'] },
      { name: 'Finish', values: ['Matte', 'Glossy'] }
    ]
  },
  {
    id: '3',
    name: 'Custom Gift Box',
    description: 'Perfect for every occasion and celebration.',
    price: 99.00,
    oldPrice: 149.00,
    discountBadge: '-34%',
    category: 'Gift Accessories',
    image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=800',
    stock: 200,
    featured: true,
    options: [
       { name: 'Ribbon Color', values: ['Red', 'Gold', 'Silver'] }
    ]
  },
  {
    id: '4',
    name: 'Classic Round T-Shirt',
    description: 'Wear your creativity with comfort. 100% Cotton.',
    price: 349.00,
    oldPrice: 399.00,
    discountBadge: '-13%',
    category: 'Men\'s T-Shirts',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',
    stock: 150,
    featured: true,
    options: [
      { name: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL'] },
      { name: 'Color', values: ['Black', 'White', 'Navy Blue', 'Grey'] }
    ]
  },
  {
    id: '5',
    name: 'Classic Round T-Shirt',
    description: 'Style meets comfort for every day. Premium fabric.',
    price: 329.00,
    oldPrice: 379.00,
    discountBadge: '-13%',
    category: 'Women\'s T-Shirts',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800',
    stock: 80,
    featured: true,
    options: [
      { name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL'] },
      { name: 'Color', values: ['Black', 'White', 'Pink', 'Lavender'] }
    ]
  },
  {
    id: '6',
    name: 'Abstract Art Poster',
    description: 'Art that speaks to your unique style. High definition printing.',
    price: 249.00,
    oldPrice: 299.00,
    discountBadge: '-17%',
    category: 'Posters',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800',
    stock: 300,
    featured: true,
    options: [
      { name: 'Size', values: ['A5', 'A4', 'A3'] },
      { name: 'Material', values: ['Glossy Paper', 'Matte Paper', 'Canvas Texture'] }
    ]
  },
  {
    id: '7',
    name: 'Ceramic Coffee Mug',
    description: 'Start your day with warm memories.',
    price: 249.00,
    oldPrice: 299.00,
    discountBadge: '-17%',
    category: 'Mugs',
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800',
    stock: 120,
    featured: true,
    options: [
      { name: 'Color', values: ['White', 'Black'] }
    ]
  },
  {
    id: '8',
    name: 'Classic Wooden Frame',
    description: 'Preserve your precious moments elegantly with handcrafted wood.',
    price: 399.00,
    oldPrice: 499.00,
    discountBadge: '-20%',
    category: 'Photo Frames',
    image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&q=80&w=800',
    stock: 90,
    featured: true,
    options: [
      { name: 'Size', values: ['5x7', '8x10', 'A4', 'A3'] },
      { name: 'Material', values: ['Oak Wood', 'Black Metal', 'White Wood'] }
    ]
  }
];

export const CATEGORIES = [
  'Photo Frames',
  'Posters',
  'Mugs',
  'Men\'s T-Shirts',
  'Women\'s T-Shirts',
  'Phone Covers',
  'Magazine',
  'Gift Accessories'
];
