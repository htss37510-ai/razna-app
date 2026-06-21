import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useStateValue } from '../StateContext';
import './../App.css';

const Header = () => {
  const { totalItems, setIsDrawerOpen } = useStateValue();
  const navigate = useNavigate();

  return (
    <header className="main-header">
      <div className="header-content">
        <div className="logo-section" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="logo-box">
             <img 
               src="/logo.png" 
               alt="الرزان" 
               className="brand-logo" 
               onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} 
             />
             <div className="logo-fallback" style={{display: 'none'}}>
               <span className="logo-a">A</span>
               <span className="logo-r">R</span>
             </div>
          </div>
          <div className="company-info">
            <h1>الرزان</h1>
            <p>مجموعة الرزان العلمية لدعاية الأدوية</p>
          </div>
        </div>

        <div 
          onClick={() => setIsDrawerOpen(true)} 
          className="header-cart-link" 
          title="الطلبات" 
          style={{ cursor: 'pointer' }}
        >
          <ShoppingCart size={24} />
          {totalItems > 0 && <span className="header-cart-badge">{totalItems}</span>}
        </div>
      </div>
    </header>
  );
};

export default Header;
