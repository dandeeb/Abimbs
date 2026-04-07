import React, { useState, useEffect, Component, ErrorInfo, ReactNode, FormEvent } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  MessageCircle, 
  Phone, 
  Instagram, 
  Video,
  Menu, 
  X, 
  ChevronRight, 
  Star, 
  Send,
  ArrowRight,
  LayoutDashboard,
  Plus,
  Trash2,
  Edit,
  LogOut,
  LogIn,
  User as UserIcon,
  CheckCircle,
  AlertCircle,
  MapPin
} from 'lucide-react';
import { BRAND_INFO, CATEGORIES, Product, Testimonial, DELIVERY_OPTIONS, DELIVERY_NOTICE } from './constants';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  logOut, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  public static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      if (this.state.error && this.state.error.message) {
        try {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) errorMessage = parsed.error;
        } catch (e) {
          errorMessage = this.state.error.message;
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-nude p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-2xl font-bold mb-4">Application Error</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary w-full"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

function MainApp() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [siteContent, setSiteContent] = useState<any>({
    heroTitle: 'Elegance in Every Stitch.',
    heroSubtitle: 'Discover our curated collection of high-quality Turkey wears, Ankara styles, and luxury outfits designed for the modern woman.',
    aboutText: 'Abimbs Fashion Gallery is a premier destination for high-quality female fashion. We specialize in authentic Turkey wears, exquisite Ankara styles, and luxury outfits that make every woman feel confident and beautiful.',
    whatsappNumber: BRAND_INFO.whatsapp,
    instagramUrl: BRAND_INFO.instagram,
    tiktokUrl: BRAND_INFO.tiktok
  });
  const [loading, setLoading] = useState(true);
  
  // Delivery & Checkout States
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<Product | null>(null);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  // Admin Form States
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: '',
    category: 'Turkey Wears',
    image: ''
  });
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editableContent, setEditableContent] = useState<any>(null);
  const [isUpdatingContent, setIsUpdatingContent] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user is admin
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const isAdminRole = userDoc.exists() && userDoc.data().role === 'admin';
          const isDefaultAdmin = currentUser.email === "pauldan1116@gmail.com";
          setIsAdmin(isAdminRole || isDefaultAdmin);
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(currentUser.email === "pauldan1116@gmail.com");
        }
      } else {
        setIsAdmin(false);
      }
    });

    // Fetch Products
    const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    // Fetch Testimonials
    const qTestimonials = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
    const unsubscribeTestimonials = onSnapshot(qTestimonials, (snapshot) => {
      const tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
      setTestimonials(tests);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'testimonials');
    });

    // Fetch Orders
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      const ords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ords);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    // Fetch Site Content
    const unsubscribeContent = onSnapshot(doc(db, 'site_content', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setSiteContent(snapshot.data());
        setEditableContent(snapshot.data());
      } else {
        // Initialize with defaults if not exists
        setEditableContent({
          heroTitle: 'Elegance in Every Stitch.',
          heroSubtitle: 'Discover our curated collection of high-quality Turkey wears, Ankara styles, and luxury outfits designed for the modern woman.',
          aboutText: 'Abimbs Fashion Gallery is a premier destination for high-quality female fashion. We specialize in authentic Turkey wears, exquisite Ankara styles, and luxury outfits that make every woman feel confident and beautiful.',
          whatsappNumber: BRAND_INFO.whatsapp,
          instagramUrl: BRAND_INFO.instagram,
          tiktokUrl: BRAND_INFO.tiktok
        });
      }
    }, (error) => {
      console.error("Error fetching site content:", error);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribeAuth();
      unsubscribeProducts();
      unsubscribeTestimonials();
      unsubscribeOrders();
      unsubscribeContent();
    };
  }, []);

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const handleWhatsAppOrder = (product: Product) => {
    setSelectedProductForOrder(product);
    setSelectedDeliveryId(null);
    setOrderConfirmed(false);
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      message: formData.get('message') as string,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'messages'), data);
      alert("Message sent successfully! We'll get back to you soon.");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };

  const confirmWhatsAppOrder = async () => {
    if (!selectedProductForOrder || !selectedDeliveryId) return;
    
    const delivery = DELIVERY_OPTIONS.find(d => d.id === selectedDeliveryId);
    if (!delivery) return;

    const basePrice = parseInt(selectedProductForOrder.price.replace(/[^0-9]/g, ''));
    const totalPrice = basePrice + delivery.fee;
    const formattedTotal = `₦${totalPrice.toLocaleString()}`;

    // Store order record in Firestore
    try {
      await addDoc(collection(db, 'orders'), {
        productName: selectedProductForOrder.name,
        productPrice: selectedProductForOrder.price,
        deliveryType: delivery.label,
        deliveryFee: delivery.fee,
        totalAmount: totalPrice,
        userEmail: user?.email || 'Guest',
        status: 'Pending',
        paymentStatus: 'Unpaid',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error storing order:", error);
      // We still proceed to WhatsApp even if storing fails, but we log it
    }

    const message = `Hello Abimbs Fashion Gallery, I want to order ${selectedProductForOrder.name}.
Delivery option selected: ${delivery.label} (${delivery.timeline}).
Total Price: ${formattedTotal}
Please confirm availability.`;

    window.open(`https://wa.me/${siteContent.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    setOrderConfirmed(true);
  };

  const handleGeneralWhatsApp = () => {
    const message = `Hello Abimbs Fashion Gallery, I'm interested in your collections.`;
    window.open(`https://wa.me/${siteContent.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Admin Actions
  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct), {
          ...newProduct,
          updatedAt: serverTimestamp()
        });
        setEditingProduct(null);
      } else {
        await addDoc(collection(db, 'products'), {
          ...newProduct,
          createdAt: serverTimestamp()
        });
      }
      setNewProduct({ name: '', price: '', category: 'Turkey Wears', image: '' });
    } catch (error) {
      handleFirestoreError(error, editingProduct ? OperationType.UPDATE : OperationType.CREATE, 'products');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!isAdmin || !window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleEditProduct = (product: Product) => {
    setNewProduct({
      name: product.name,
      price: product.price,
      category: product.category,
      image: product.image
    });
    setEditingProduct(product.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateContent = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editableContent) return;
    setIsUpdatingContent(true);
    try {
      await updateDoc(doc(db, 'site_content', 'main'), {
        ...editableContent,
        updatedAt: serverTimestamp()
      });
      alert("Site content updated successfully!");
    } catch (error) {
      // If document doesn't exist, create it
      try {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'site_content', 'main'), {
          ...editableContent,
          updatedAt: serverTimestamp()
        });
        alert("Site content initialized and updated!");
      } catch (innerError) {
        handleFirestoreError(innerError, OperationType.UPDATE, 'site_content/main');
      }
    } finally {
      setIsUpdatingContent(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, field: 'status' | 'paymentStatus', value: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        [field]: value,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'content'>('products');

  return (
    <Routes>
      <Route path="/admin" element={
        isAdmin ? (
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="glass-nav py-4 sticky top-0 z-50">
              <div className="container mx-auto px-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Link 
                    to="/"
                    className="text-gray-600 hover:text-brand-gold"
                  >
                    <ArrowRight className="rotate-180" />
                  </Link>
                  <h1 className="text-xl font-bold font-display">Admin Dashboard</h1>
                </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex bg-gray-100 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab('products')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-white shadow-sm text-brand-gold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Products
                </button>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-white shadow-sm text-brand-gold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Orders
                </button>
                <button 
                  onClick={() => setActiveTab('content')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'content' ? 'bg-white shadow-sm text-brand-gold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Site Content
                </button>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 hidden md:block">{user?.email}</span>
                <button onClick={logOut} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-6 py-12 flex-1">
          {activeTab === 'products' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Product Form */}
              <div className="lg:col-span-1">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    {editingProduct ? <Edit size={24} /> : <Plus size={24} />}
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Product Name</label>
                      <input 
                        required
                        type="text" 
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none"
                        placeholder="e.g. Silk Turkey Gown"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Price</label>
                      <input 
                        required
                        type="text" 
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none"
                        placeholder="e.g. ₦25,000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                      <select 
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({...newProduct, category: e.target.value as any})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none"
                      >
                        {CATEGORIES.filter(c => c !== 'All').map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Image URL</label>
                      <input 
                        required
                        type="url" 
                        value={newProduct.image}
                        onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>
                    <div className="pt-4 flex gap-2">
                      <button type="submit" className="btn-primary flex-1 py-2 rounded-xl">
                        {editingProduct ? 'Update Product' : 'Save Product'}
                      </button>
                      {editingProduct && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingProduct(null);
                            setNewProduct({ name: '', price: '', category: 'Turkey Wears', image: '' });
                          }}
                          className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Product List */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Manage Products ({products.length})</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                          <th className="px-6 py-4 font-bold">Product</th>
                          <th className="px-6 py-4 font-bold">Category</th>
                          <th className="px-6 py-4 font-bold">Price</th>
                          <th className="px-6 py-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img src={product.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                <span className="font-medium">{product.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold px-2 py-1 bg-brand-nude text-brand-gold rounded-full uppercase">
                                {product.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold">{product.price}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleEditProduct(product)}
                                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Edit size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'orders' ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold">Order Management ({orders.length})</h2>
                <p className="text-sm text-gray-500">Manage customer orders and payment statuses. Paystack integration will update these automatically in the future.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                      <th className="px-6 py-4 font-bold">Date</th>
                      <th className="px-6 py-4 font-bold">Product</th>
                      <th className="px-6 py-4 font-bold">Customer</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold">Payment</th>
                      <th className="px-6 py-4 font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Just now'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{order.productName}</span>
                            <span className="text-xs text-gray-400">{order.deliveryType}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{order.userEmail}</td>
                        <td className="px-6 py-4">
                          <select 
                            value={order.status || 'Pending'}
                            onChange={(e) => handleUpdateOrderStatus(order.id, 'status', e.target.value)}
                            className={`text-xs font-bold px-2 py-1 rounded-full border-none outline-none cursor-pointer ${
                              order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                              order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                              'bg-brand-gold/10 text-brand-gold'
                            }`}
                          >
                            {["Pending", "Paid", "Shipped", "Delivered", "Cancelled"].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={order.paymentStatus || 'Unpaid'}
                            onChange={(e) => handleUpdateOrderStatus(order.id, 'paymentStatus', e.target.value)}
                            className={`text-xs font-bold px-2 py-1 rounded-full border-none outline-none cursor-pointer ${
                              order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {["Unpaid", "Paid"].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 font-bold">₦{order.totalAmount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Edit size={24} />
                  Edit Frontend Content
                </h2>
                <form onSubmit={handleUpdateContent} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Hero Title</label>
                      <input 
                        required
                        type="text" 
                        value={editableContent?.heroTitle || ''}
                        onChange={(e) => setEditableContent({...editableContent, heroTitle: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Hero Subtitle</label>
                      <textarea 
                        required
                        rows={2}
                        value={editableContent?.heroSubtitle || ''}
                        onChange={(e) => setEditableContent({...editableContent, heroSubtitle: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-1">About Us Text</label>
                      <textarea 
                        required
                        rows={4}
                        value={editableContent?.aboutText || ''}
                        onChange={(e) => setEditableContent({...editableContent, aboutText: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp Number (e.g. 234806...)</label>
                      <input 
                        required
                        type="text" 
                        value={editableContent?.whatsappNumber || ''}
                        onChange={(e) => setEditableContent({...editableContent, whatsappNumber: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Instagram URL</label>
                      <input 
                        type="url" 
                        value={editableContent?.instagramUrl || ''}
                        onChange={(e) => setEditableContent({...editableContent, instagramUrl: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">TikTok URL</label>
                      <input 
                        type="url" 
                        value={editableContent?.tiktokUrl || ''}
                        onChange={(e) => setEditableContent({...editableContent, tiktokUrl: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none"
                      />
                    </div>
                  </div>
                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={isUpdatingContent}
                      className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2"
                    >
                      {isUpdatingContent ? 'Updating...' : 'Save Site Content'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
        ) : <Navigate to="/" />
      } />
      <Route path="/" element={
        <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'glass-nav py-3 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <a href="#" className="text-2xl font-display font-bold tracking-tighter text-brand-gold">
            ABIMBS <span className="text-gray-900">FASHION</span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8 items-center">
            {['Home', 'Collection', 'About', 'Contact'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                className="text-sm font-medium hover:text-brand-gold transition-colors"
              >
                {item}
              </a>
            ))}
            {!user ? (
              <button 
                onClick={signInWithGoogle}
                className="text-sm font-medium flex items-center gap-2 hover:text-brand-gold transition-colors"
              >
                <LogIn size={18} />
                Login
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleGeneralWhatsApp}
                  className="bg-brand-gold text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-opacity-90 transition-all"
                >
                  <MessageCircle size={18} />
                  WhatsApp
                </button>
                <button onClick={logOut} className="text-gray-400 hover:text-red-500">
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden text-gray-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-white shadow-xl border-t border-brand-nude md:hidden"
            >
              <div className="flex flex-col p-6 space-y-4">
                {['Home', 'Collection', 'About', 'Contact'].map((item) => (
                  <a 
                    key={item} 
                    href={`#${item.toLowerCase()}`} 
                    onClick={() => setIsMenuOpen(false)}
                    className="text-lg font-medium border-b border-brand-nude pb-2"
                  >
                    {item}
                  </a>
                ))}
                {!user ? (
                  <button 
                    onClick={signInWithGoogle}
                    className="w-full py-3 rounded-xl font-medium flex justify-center items-center gap-2 border border-brand-nude"
                  >
                    <LogIn size={20} />
                    Login with Google
                  </button>
                ) : (
                  <button 
                    onClick={handleGeneralWhatsApp}
                    className="bg-brand-gold text-white w-full py-3 rounded-xl font-medium flex justify-center items-center gap-2"
                  >
                    <MessageCircle size={20} />
                    Chat on WhatsApp
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center overflow-hidden bg-brand-nude">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/turkey-fashion-woman/1920/1080" 
            alt="Woman in Turkey Wear" 
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-nude via-brand-nude/60 to-transparent"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="inline-block text-brand-gold font-semibold tracking-widest uppercase mb-4">
              Premium Turkey Wears
            </span>
            <h1 className="text-6xl md:text-8xl font-bold leading-tight mb-6">
              {siteContent.heroTitle.split(' ').slice(0, -2).join(' ')} <br /> 
              <span className="text-brand-gold italic">{siteContent.heroTitle.split(' ').slice(-2).join(' ')}</span>
            </h1>
            <p className="text-lg text-gray-700 mb-10 max-w-lg">
              {siteContent.heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#collection" className="btn-primary flex items-center gap-2">
                Shop Now <ArrowRight size={20} />
              </a>
              <a href="#contact" className="btn-outline">
                Contact Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories & Products */}
      <section id="collection" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Collection</h2>
            <div className="w-24 h-1 bg-brand-gold mx-auto mb-8"></div>
            
            {/* Filter */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              {CATEGORIES.map((cat) => (activeCategory === cat ? (
                <button 
                  key={cat}
                  className="bg-brand-gold text-white px-6 py-2 rounded-full text-sm font-medium transition-all"
                >
                  {cat}
                </button>
              ) : (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="bg-brand-nude text-gray-700 px-6 py-2 rounded-full text-sm font-medium hover:bg-brand-pink transition-all"
                >
                  {cat}
                </button>
              )))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              <div className="col-span-full py-20 text-center text-gray-400">
                <div className="animate-spin w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full mx-auto mb-4"></div>
                Loading collection...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full py-20 text-center text-gray-400">
                No products found in this category.
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.div 
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-brand-nude mb-4">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => handleWhatsAppOrder(product)}
                          className="bg-white text-gray-900 p-4 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform"
                        >
                          <ShoppingBag size={24} />
                        </button>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-brand-gold font-bold uppercase tracking-wider">{product.category}</span>
                      <h3 className="text-xl font-display font-semibold mt-1">{product.name}</h3>
                      <p className="text-lg font-bold text-gray-900 mt-2">{product.price}</p>
                      
                      {/* Delivery Info Badge */}
                      <div className="mt-3 flex flex-wrap justify-center gap-2">
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1">
                          🚚 Standard: 5-7 days
                        </span>
                        <span className="text-[10px] font-bold bg-brand-gold/10 text-brand-gold px-2 py-1 rounded flex items-center gap-1">
                          ⚡ Express: 1-2 days
                        </span>
                      </div>

                      <button 
                        onClick={() => handleWhatsAppOrder(product)}
                        className="mt-4 w-full py-2 border border-brand-gold text-brand-gold rounded-lg text-sm font-medium hover:bg-brand-gold hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <ShoppingBag size={16} />
                        Order Now
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-brand-nude/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 relative">
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://picsum.photos/seed/turkey-fashion-model/800/1000" 
                  alt="About Abimbs" 
                  className="w-full h-auto"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-brand-pink rounded-2xl -z-0 hidden md:block"></div>
              <div className="absolute -top-8 -left-8 w-32 h-32 border-4 border-brand-gold rounded-2xl -z-0 hidden md:block"></div>
            </div>
            <div className="flex-1">
              <span className="text-brand-gold font-bold uppercase tracking-widest">Our Story</span>
              <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-8">Redefining Style & Quality</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                {siteContent.aboutText}
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-3xl font-bold text-brand-gold">100%</h4>
                  <p className="text-sm text-gray-600 uppercase font-bold tracking-wider">Quality Turkey Wears</p>
                </div>
                <div>
                  <h4 className="text-3xl font-bold text-brand-gold">5k+</h4>
                  <p className="text-sm text-gray-600 uppercase font-bold tracking-wider">Happy Clients</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold">What Our Clients Say</h2>
            <div className="w-24 h-1 bg-brand-gold mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.length === 0 ? (
              <div className="col-span-full text-center text-gray-400">No testimonials yet.</div>
            ) : (
              testimonials.map((t) => (
                <div key={t.id} className="bg-brand-nude/20 p-8 rounded-3xl border border-brand-nude">
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={16} className="fill-brand-gold text-brand-gold" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic mb-6">"{t.text}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-pink flex items-center justify-center font-bold text-brand-gold">
                      {t.name[0]}
                    </div>
                    <h4 className="font-bold">{t.name}</h4>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Instagram Gallery (Social Proof) */}
      <section className="py-24 bg-brand-nude/10">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-bold">Instagram Gallery</h2>
              <p className="text-gray-600 mt-2">Follow us on Instagram</p>
            </div>
            <a href={siteContent.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-brand-gold font-bold flex items-center gap-2 hover:underline">
              View Instagram <Instagram size={20} />
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden group relative">
                <img 
                  src={`https://picsum.photos/seed/insta${i}/500/500`} 
                  alt="Instagram Post" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-brand-gold/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Instagram className="text-white" size={32} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="lg:w-1/3">
              <span className="text-brand-gold font-bold uppercase tracking-widest">Contact Us</span>
              <h2 className="text-4xl font-bold mt-4 mb-8">Get In Touch</h2>
              <p className="text-gray-600 mb-12 leading-relaxed">
                Have questions about our turkey wears or need help with an order? Send us a message and we'll get back to you as soon as possible.
              </p>
              
              <div className="space-y-8">
                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-brand-nude flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-all duration-300">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">WhatsApp</h4>
                    <p className="text-gray-600 mt-1">+{siteContent.whatsappNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-brand-nude flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-all duration-300">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Showroom</h4>
                    <p className="text-gray-600 mt-1">{BRAND_INFO.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-brand-nude flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-all duration-300">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">WhatsApp</h4>
                    <p className="text-gray-600 mt-1">Chat with us anytime</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-2/3">
              <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100">
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                      <input 
                        required
                        name="name"
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl border border-brand-nude focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                      <input 
                        required
                        name="email"
                        type="email" 
                        className="w-full px-4 py-3 rounded-xl border border-brand-nude focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                    <textarea 
                      required
                      name="message"
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-brand-nude focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all"
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>
                  <button type="submit" className="w-full bg-brand-gold text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all">
                    Send Message <Send size={20} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <h3 className="text-2xl font-display font-bold text-brand-gold mb-6">ABIMBS FASHION</h3>
              <p className="text-gray-400 leading-relaxed">
                {siteContent.heroSubtitle}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Quick Links</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#home" className="hover:text-brand-gold transition-colors">Home</a></li>
                <li><a href="#collection" className="hover:text-brand-gold transition-colors">Collection</a></li>
                <li><a href="#about" className="hover:text-brand-gold transition-colors">About Us</a></li>
                <li><a href="#contact" className="hover:text-brand-gold transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Categories</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#" className="hover:text-brand-gold transition-colors">Turkey Wears</a></li>
                <li><a href="#" className="hover:text-brand-gold transition-colors">Ankara Styles</a></li>
                <li><a href="#" className="hover:text-brand-gold transition-colors">Casual Outfits</a></li>
                <li><a href="#" className="hover:text-brand-gold transition-colors">Luxury Wears</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Connect</h4>
              <div className="flex gap-4 mb-6">
                <a href={siteContent.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-gold transition-colors">
                  <Instagram size={20} />
                </a>
                <a href={siteContent.tiktokUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-gold transition-colors">
                  <Video size={20} />
                </a>
                <a href={`https://wa.me/${siteContent.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-gold transition-colors">
                  <MessageCircle size={20} />
                </a>
              </div>
              <p className="text-gray-400 text-sm">
                {BRAND_INFO.address}
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} {BRAND_INFO.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <button 
        onClick={handleGeneralWhatsApp}
        className="fixed bottom-8 right-8 z-50 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95"
      >
        <MessageCircle size={32} />
      </button>

      {/* Checkout Modal */}
      <AnimatePresence>
        {selectedProductForOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProductForOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setSelectedProductForOrder(null)}
                className="absolute top-6 right-6 z-10 bg-white/80 backdrop-blur p-2 rounded-full shadow-md hover:bg-white transition-colors"
              >
                <X size={20} />
              </button>

              {/* Product Preview */}
              <div className="w-full md:w-2/5 h-64 md:h-auto relative">
                <img 
                  src={selectedProductForOrder.image} 
                  alt={selectedProductForOrder.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6 md:hidden">
                  <h3 className="text-white text-2xl font-bold">{selectedProductForOrder.name}</h3>
                </div>
              </div>

              {/* Checkout Details */}
              <div className="flex-1 p-8 md:p-10 overflow-y-auto max-h-[80vh] md:max-h-none">
                {!orderConfirmed ? (
                  <>
                    <div className="hidden md:block mb-6">
                      <span className="text-brand-gold font-bold text-xs uppercase tracking-widest">{selectedProductForOrder.category}</span>
                      <h3 className="text-3xl font-bold mt-1">{selectedProductForOrder.name}</h3>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <ShoppingBag size={16} /> Select Delivery Option
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {DELIVERY_OPTIONS.map((option) => (
                            <label 
                              key={option.id}
                              className={`relative flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                selectedDeliveryId === option.id 
                                  ? 'border-brand-gold bg-brand-gold/5 ring-1 ring-brand-gold' 
                                  : 'border-gray-100 hover:border-brand-nude'
                              }`}
                            >
                              <input 
                                type="radio" 
                                name="delivery" 
                                className="hidden"
                                checked={selectedDeliveryId === option.id}
                                onChange={() => setSelectedDeliveryId(option.id)}
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-gray-900 flex items-center gap-2">
                                    {option.icon} {option.label}
                                  </span>
                                  <span className="font-bold text-brand-gold">
                                    {option.fee === 0 ? 'FREE' : `+ ₦${option.fee.toLocaleString()}`}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">{option.timeline}</p>
                              </div>
                              {selectedDeliveryId === option.id && (
                                <CheckCircle className="text-brand-gold ml-3" size={20} />
                              )}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Price Summary */}
                      <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Product Price</span>
                          <span className="font-medium">{selectedProductForOrder.price}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Delivery Fee</span>
                          <span className="font-medium">
                            {selectedDeliveryId 
                              ? `₦${DELIVERY_OPTIONS.find(d => d.id === selectedDeliveryId)?.fee.toLocaleString()}` 
                              : '—'}
                          </span>
                        </div>
                        <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                          <span className="font-bold text-gray-900">Total Amount</span>
                          <span className="text-2xl font-bold text-brand-gold">
                            {selectedDeliveryId 
                              ? `₦${(parseInt(selectedProductForOrder.price.replace(/[^0-9]/g, '')) + (DELIVERY_OPTIONS.find(d => d.id === selectedDeliveryId)?.fee || 0)).toLocaleString()}`
                              : selectedProductForOrder.price}
                          </span>
                        </div>
                      </div>

                      {/* Warning Message */}
                      <div className="flex gap-3 p-4 bg-brand-nude/30 rounded-xl border border-brand-nude">
                        <AlertCircle className="text-brand-gold shrink-0" size={20} />
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {DELIVERY_NOTICE}
                        </p>
                      </div>

                      <button 
                        disabled={!selectedDeliveryId}
                        onClick={confirmWhatsAppOrder}
                        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg ${
                          selectedDeliveryId 
                            ? 'bg-green-500 text-white hover:bg-green-600 shadow-green-100' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <MessageCircle size={24} />
                        Confirm Order via WhatsApp
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10">
                    <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle size={40} />
                    </div>
                    <h3 className="text-3xl font-bold mb-4">Thank you for your order 😊</h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      Your delivery will take <span className="font-bold text-brand-gold">
                        {DELIVERY_OPTIONS.find(d => d.id === selectedDeliveryId)?.timeline}
                      </span> based on your selected delivery option.
                    </p>
                    <button 
                      onClick={() => setSelectedProductForOrder(null)}
                      className="btn-outline w-full"
                    >
                      Close Window
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
      } />
    </Routes>
  );
}
