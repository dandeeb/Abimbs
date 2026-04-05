export interface Product {
  id: string;
  name: string;
  price: string;
  category: 'Turkey Wears' | 'Ankara Styles' | 'Casual Outfits' | 'Luxury Wears';
  image: string;
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
}

export const BRAND_INFO = {
  name: 'Abimbs Fashion Gallery',
  tagline: 'Dealers in all types of turkey wears',
  phone: '+234 806 773 7518',
  whatsapp: '2348067737518', // International format for WhatsApp
  email: 'info@abimbsfashion.com',
  address: 'Lagos, Nigeria',
  tiktok: 'https://www.tiktok.com/@abimbsfashiongallery?_r=1&_t=ZS-95IQYXeVhIb',
  instagram: 'https://www.instagram.com/dfashionplace3?igsh=MWxmdXN3dzhkMHpj',
};

export const CATEGORIES = ['All', 'Turkey Wears', 'Ankara Styles', 'Casual Outfits', 'Luxury Wears'] as const;

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Elegant Silk Turkey Gown',
    price: '₦25,000',
    category: 'Turkey Wears',
    image: 'https://picsum.photos/seed/turkey-gown-1/600/800',
  },
  {
    id: '2',
    name: 'Vibrant Ankara Maxi Dress',
    price: '₦18,500',
    category: 'Ankara Styles',
    image: 'https://picsum.photos/seed/ankara-dress-1/600/800',
  },
  {
    id: '3',
    name: 'Chic Casual Two-Piece',
    price: '₦12,000',
    category: 'Casual Outfits',
    image: 'https://picsum.photos/seed/casual-wear-1/600/800',
  },
  {
    id: '4',
    name: 'Luxury Evening Sequin Dress',
    price: '₦45,000',
    category: 'Luxury Wears',
    image: 'https://picsum.photos/seed/luxury-gown-1/600/800',
  },
  {
    id: '5',
    name: 'Floral Turkey Summer Dress',
    price: '₦22,000',
    category: 'Turkey Wears',
    image: 'https://picsum.photos/seed/turkey-gown-2/600/800',
  },
  {
    id: '6',
    name: 'Ankara Peplum Top & Skirt',
    price: '₦20,000',
    category: 'Ankara Styles',
    image: 'https://picsum.photos/seed/ankara-dress-2/600/800',
  },
  {
    id: '7',
    name: 'Satin Luxury Wrap Dress',
    price: '₦35,000',
    category: 'Luxury Wears',
    image: 'https://picsum.photos/seed/luxury-gown-2/600/800',
  },
  {
    id: '8',
    name: 'Casual Denim Fashion Set',
    price: '₦15,000',
    category: 'Casual Outfits',
    image: 'https://picsum.photos/seed/casual-wear-2/600/800',
  },
];

export const DELIVERY_OPTIONS = [
  {
    id: 'standard',
    label: 'Standard Delivery',
    timeline: '5–7 working days',
    fee: 0,
    icon: '🚚'
  },
  {
    id: 'express',
    label: 'Express Delivery',
    timeline: '1–2 working days',
    fee: 3000,
    icon: '⚡'
  }
];

export const DELIVERY_NOTICE = "Please note: Orders are processed based on the delivery option selected. Choose Express Delivery if you need your order urgently.";
