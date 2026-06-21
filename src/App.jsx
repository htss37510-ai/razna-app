import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { StateProvider } from './StateContext';
import Header from './components/Header';
import OrdersDrawer from './components/OrdersDrawer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical System Error:", error, errorInfo);
  }

  handleReset = async () => {
    localStorage.clear();
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      await Filesystem.deleteFile({ path: 'razan_drugs.json', directory: Directory.Data }).catch(() => {});
      await Filesystem.deleteFile({ path: 'razan_cart.json', directory: Directory.Data }).catch(() => {});
      await Filesystem.deleteFile({ path: 'razan_order_info.json', directory: Directory.Data }).catch(() => {});
      await Filesystem.deleteFile({ path: 'razan_order_history.json', directory: Directory.Data }).catch(() => {});
    } catch (e) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fff5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={80} color="#e53935" style={{ marginBottom: '20px' }} />
          <h1 style={{ color: '#c62828', marginBottom: '10px' }}>عذراً، حدث خطأ غير متوقع</h1>
          <p style={{ color: '#555', marginBottom: '30px', maxWidth: '400px' }}>قد يكون هناك خطأ في البيانات المحفوظة. يرجى محاولة إعادة التحديث أو تصفير البيانات إذا استمرت المشكلة.</p>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              onClick={() => window.location.reload()} 
              style={{ padding: '12px 24px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
            >
              <RefreshCcw size={20} /> تحديث الصفحة
            </button>
            <button 
              onClick={this.handleReset} 
              style={{ padding: '12px 24px', backgroundColor: '#e53935', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              تصفير البيانات (حل جذري)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <StateProvider>
        <Router>
          <Header />
          <OrdersDrawer />
          <main className="container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/inventory" element={<Inventory />} />
            </Routes>
          </main>
        </Router>
      </StateProvider>
    </ErrorBoundary>
  );
}

export default App;
