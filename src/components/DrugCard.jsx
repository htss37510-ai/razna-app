import React, { useState } from 'react';
import { Plus, Minus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { useStateValue } from '../StateContext';
import { toEnglishDigits } from '../utils';

const DrugCard = ({ drug, onEdit }) => {
  const { cart, updateCartQty } = useStateValue();
  const cartItem = cart[drug.id] || cart[String(drug.id)] || cart[Number(drug.id)];
  const [localQty, setLocalQty] = useState(cartItem?.qty || 0);

  // Sync local quantity with global cart (e.g., when cart is cleared)
  React.useEffect(() => {
    setLocalQty(cartItem?.qty || 0);
  }, [cartItem?.qty]);

  const handleQtyChange = (val) => {
    const newVal = Math.max(0, parseInt(val) || 0);
    setLocalQty(newVal);
    updateCartQty(drug.id, newVal);
  };

  const increment = () => {
    const newVal = localQty + 1;
    setLocalQty(newVal);
    updateCartQty(drug.id, newVal);
  };

  const decrement = () => {
    const newVal = Math.max(0, localQty - 1);
    setLocalQty(newVal);
    updateCartQty(drug.id, newVal);
  };

  return (
    <div className="drug-card card fade-in">
      <div className="card-image">
        {drug.image ? (
          <img src={drug.image} alt={drug.nameEn || drug.name || ''} />
        ) : (
          <div className="image-placeholder">
            <ImageIcon size={48} />
          </div>
        )}
        <button className="edit-btn" onClick={() => onEdit(drug)}>
          <Edit size={16} />
        </button>
      </div>
      
      <div className="card-info">
        <h3 className="drug-name">{drug.nameEn || drug.name}</h3>
        <p className="arabic-name">{drug.nameAr || ''}</p>
        <p className="price-tag">
          السعر: {drug.price ? `${drug.price} د.ع` : 'غير محدد'}
        </p>
        {drug.companyName && (
          <p className="company-tag" style={{ color: '#666', fontSize: '0.85rem', direction: 'rtl', textAlign: 'right', fontWeight: 'bold' }}>
            الشركة: {drug.companyName}
          </p>
        )}
        <p className="material-name">{drug.ingredient || drug.material || ''}</p>
        <p className="details">{drug.details}</p>
      </div>

      <div className="card-actions">
        <div className="qty-controls">
          <button className="qty-btn" onClick={decrement}><Minus size={18} /></button>
          <input 
            type="text" 
            inputMode="numeric" 
            pattern="[0-9]*"
            value={localQty} 
            onChange={(e) => {
              const val = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '');
              handleQtyChange(val);
            }}
            className="qty-input"
          />
          <button className="qty-btn primary" onClick={increment}><Plus size={18} /></button>
        </div>
      </div>

      <style jsx>{`
        .drug-card {
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow: hidden;
          position: relative;
        }
        .card-image {
          height: 180px;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-placeholder {
          color: #ccc;
        }
        .edit-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: white;
          color: var(--text-dark);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow);
          opacity: 0;
          transition: var(--transition);
        }
        .drug-card:hover .edit-btn {
          opacity: 1;
        }
        .card-info {
          padding: 15px;
          flex-grow: 1;
        }
        .drug-name {
          font-size: 1.1rem;
          margin-bottom: 5px;
          direction: ltr; /* Drug names are usually English */
          text-align: right;
        }
        .arabic-name {
          color: var(--text-dark);
          font-size: 0.95rem;
          margin-bottom: 4px;
          direction: rtl;
          text-align: right;
        }
        .price-tag {
          color: #27ae60;
          font-weight: bold;
          font-size: 1rem;
          margin-bottom: 5px;
          direction: rtl;
          text-align: right;
        }
        .material-name {
          color: var(--primary);
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 5px;
          direction: ltr;
          text-align: right;
        }
        .details {
          font-size: 0.8rem;
          color: var(--text-light);
          direction: ltr;
          text-align: right;
        }
        .card-actions {
          padding: 15px;
          border-top: 1px solid #eee;
        }
        .qty-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f8f9fa;
          padding: 5px;
          border-radius: 10px;
        }
        .qty-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          color: var(--text-dark);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .qty-btn.primary {
          background: var(--primary);
          color: white;
        }
        .qty-input {
          flex-grow: 1;
          border: none;
          background: transparent;
          text-align: center;
          font-weight: bold;
          font-size: 1.1rem;
          padding: 0;
          width: 40px;
        }
        .qty-input::-webkit-inner-spin-button,
        .qty-input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default DrugCard;
