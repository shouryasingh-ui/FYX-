
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
    ],
    reviews: [
      { id: 'r1', userName: 'Aditi Sharma', rating: 5, text: 'Absolutely loved the print quality!', date: '2 days ago' },
      { id: 'r2', userName: 'Rohan Gupta', rating: 4, text: 'Great delivery speed, paper is nice.', date: '1 week ago' }
    ]
  },
  {
    id: '2',
    name: 'Sleek iPhone Case',
    description: 'Protect in style with premium matte finish. Durable and lightweight.',
    price: 249.00,
    oldPrice: 299.00,
    discountBadge: '-17%',
    category: 'Phone Covers',
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=800',
    stock: 50,
    featured: true,
    allowCustomImages: true,
    options: [
      { name: 'Phone Model', values: ['iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 15 Pro', 'Samsung S23', 'Samsung S24'] },
      { name: 'Finish', values: ['Matte', 'Glossy', 'Transparent'] }
    ],
    reviews: [
      { id: 'r3', userName: 'Mike T.', rating: 5, text: 'Fits perfectly.', date: '3 days ago' }
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
    allowCustomImages: true,
    options: [
       { name: 'Ribbon Color', values: ['Red', 'Gold', 'Silver', 'Blue'] },
       { name: 'Box Size', values: ['Small', 'Medium', 'Large'] }
    ]
  },
  {
    id: '4',
    name: 'Classic Men\'s Tee',
    description: 'Wear your creativity with comfort. 100% Cotton, pre-shrunk fabric.',
    price: 349.00,
    oldPrice: 399.00,
    discountBadge: '-13%',
    category: 'Men\'s T-Shirts',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',
    stock: 150,
    featured: true,
    allowCustomImages: true,
    options: [
      { name: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL'] },
      { name: 'Color', values: ['Black', 'White', 'Navy Blue', 'Heather Grey', 'Maroon'] }
    ]
  },
  {
    id: '5',
    name: 'Premium Women\'s Tee',
    description: 'Style meets comfort for every day. Premium combed cotton.',
    price: 329.00,
    oldPrice: 379.00,
    discountBadge: '-13%',
    category: 'Women\'s T-Shirts',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800',
    stock: 80,
    featured: true,
    allowCustomImages: true,
    options: [
      { name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL'] },
      { name: 'Color', values: ['Black', 'White', 'Pink', 'Lavender', 'Yellow'] }
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
    allowCustomImages: true,
    options: [
      { name: 'Size', values: ['A5 (5.8 x 8.3")', 'A4 (8.3 x 11.7")', 'A3 (11.7 x 16.5")', 'A2 (16.5 x 23.4")'] },
      { name: 'Material', values: ['Glossy Paper', 'Matte Paper', 'Canvas Texture'] }
    ]
  },
  {
    id: '7',
    name: 'Ceramic Coffee Mug',
    description: 'Start your day with warm memories. Microwave and dishwasher safe.',
    price: 249.00,
    oldPrice: 299.00,
    discountBadge: '-17%',
    category: 'Mugs',
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800',
    stock: 120,
    featured: true,
    allowCustomImages: true,
    options: [
      { name: 'Base Color', values: ['White', 'Black'] },
      { name: 'Capacity', values: ['325ml (Standard)', '450ml (Large)'] }
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
    allowCustomImages: true,
    options: [
      { name: 'Frame Size', values: ['6x8" (A5)', '8x12" (A4)', '12x16" (A3)'] },
      { name: 'Material', values: ['Oak Wood', 'Black Metal', 'White Wood', 'Walnut'] },
      { name: 'Mount', values: ['With Mount', 'No Mount'] }
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
