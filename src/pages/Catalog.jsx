import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Home as HomeIcon, RefreshCcw, Building2, X, Trash2 } from 'lucide-react';
import './../App.css';
import { useStateValue } from '../StateContext';
import { initialDrugs } from '../data/initialDrugs';
import DrugCard from '../components/DrugCard';
import DrugForm from '../components/DrugForm';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const Catalog = () => {
  const navigate = useNavigate();
  const { drugs, setDrugs, addDrug, updateDrug, deleteDrug, totalItems, cart, setCart, orderInfo, setOrderInfo, importAllData, setIsDrawerOpen, clearCart } = useStateValue();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDrug, setEditingDrug] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  const uniqueCompanies = React.useMemo(() => {
    return [...new Set(drugs.map(drug => drug.companyName).filter(Boolean))].sort();
  }, [drugs]);

  console.log("Loaded drugs count:", drugs.length);

  const filteredDrugs = drugs.filter(drug => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = (drug.nameEn || drug.name || '').toLowerCase().includes(q) ||
      (drug.nameAr || '').toLowerCase().includes(q) ||
      (drug.ingredient || drug.material || '').toLowerCase().includes(q);
    
    const matchesCompany = !selectedCompany || drug.companyName === selectedCompany;
    
    return matchesSearch && matchesCompany;
  });

  const handleSaveDrug = (drugData) => {
    if (editingDrug) {
      updateDrug(drugData);
    } else {
      addDrug(drugData);
    }
    setShowModal(false);
    setEditingDrug(null);
  };

  const handleDeleteDrug = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الدواء؟')) {
      deleteDrug(id);
      setShowModal(false);
      setEditingDrug(null);
    }
  };

  const handleClearCart = () => {
    if (window.confirm('هل أنت متأكد من مسح كافة المواد من السلة؟')) {
      clearCart();
    }
  };

  const handleExport = async () => {
    const dataObj = { drugs, cart, orderInfo };
    const jsonData = JSON.stringify(dataObj, null, 2);
    const fileName = `razan_backup_${new Date().toISOString().slice(0,10)}.json`;

    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: jsonData,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });
        await Share.share({
          title: 'تصدير نسخة احتياطية',
          text: 'نسخة احتياطية لكافة بيانات الأدوية من تطبيق الرزان',
          url: result.uri
        });
      } catch (error) {
        alert('حدث خطأ أثناء تصدير الملف: ' + error.message);
      }
    } else {
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (imported.drugs || imported.cart || imported.orderInfo) {
            importAllData(imported);
            alert('تم استيراد البيانات بنجاح');
          } else {
            alert('الملف المختار ليس بالتنسيق الصحيح');
          }
        } catch (err) {
          alert('خطأ في تنسيق الملف');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReset = async () => {
    if (window.confirm('هل تريد إعادة تعيين الكتالوج إلى الأدوية الافتراضية من الملف؟ سيتم حذف أي أدوية قمت بإضافتها يدوياً.')) {
      const { fetchDrugs } = await import('../data/initialDrugs');
      const data = await fetchDrugs();
      const newDrugs = (data && data.length > 0) ? data : initialDrugs;
      setDrugs(newDrugs);
      
      try {
        await Filesystem.writeFile({
          path: 'razan_drugs.json',
          data: JSON.stringify(newDrugs),
          directory: Directory.Data,
          encoding: Encoding.UTF8
        });
      } catch (e) {}

      setTimeout(() => {
        window.location.reload(); 
      }, 100);
    }
  };

  return (
    <>
      <div className="catalog-page fade-in">
        <div className="catalog-header">
          <div className="header-top">
            <button className="nav-icon-btn" onClick={() => navigate('/')} title="الرئيسية">
              <HomeIcon size={24} />
            </button>
            <h1>قائمة الأدوية</h1>
            <div className="header-actions">
              <button className="action-btn reset" onClick={handleReset} title="إعادة تعيين القائمة">
                <RefreshCcw size={20} /> <span>إعادة تعيين</span>
              </button>
              <button className="action-btn clear" onClick={handleClearCart} title="مسح السلة">
                <Trash2 size={20} /> <span>مسح السلة</span>
              </button>
            </div>
          </div>

          <div className="search-bar-row">
            <div className="search-wrapper">
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                placeholder="البحث عن دواء بالاسم أو المادة..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="add-btn" onClick={() => setShowCompanyModal(true)} style={{ background: '#3f51b5' }}>
              <Building2 size={20} /> <span>الشركات</span>
              {selectedCompany && <span className="cart-badge-inline" style={{ background: '#ff9800', fontSize: '10px' }}>1</span>}
            </button>
            <button className="orders-btn" onClick={() => setIsDrawerOpen(true)}>
              <ShoppingCart size={20} /> <span>الطلبات</span>
              {totalItems > 0 && <span className="cart-badge-inline">{totalItems}</span>}
            </button>
          </div>
        </div>

        <div className="drugs-grid">
          {filteredDrugs.map(drug => (
            <DrugCard 
              key={drug.id} 
              drug={drug} 
              onEdit={(d) => { setEditingDrug(d); setShowModal(true); }}
            />
          ))}
        </div>
      </div>

      {showModal && (
        <DrugForm 
          drug={editingDrug}
          onSave={handleSaveDrug}
          onDelete={handleDeleteDrug}
          onCancel={() => { setShowModal(false); setEditingDrug(null); }}
        />
      )}

      {showCompanyModal && (
        <div className="modal-overlay" onClick={() => setShowCompanyModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>تصفية حسب الشركة</h2>
              <button className="modal-close-btn" onClick={() => setShowCompanyModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '10px' }}>
              <div 
                className={`company-item ${!selectedCompany ? 'active' : ''}`}
                onClick={() => { setSelectedCompany(null); setShowCompanyModal(false); }}
                style={{ padding: '15px', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer', background: !selectedCompany ? 'var(--primary)' : '#f8f9fa', color: !selectedCompany ? 'white' : 'inherit', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}
              >
                <span>جميع الشركات</span>
                {!selectedCompany && <span>✓</span>}
              </div>
              {uniqueCompanies.map(company => (
                <div 
                  key={company}
                  className={`company-item ${selectedCompany === company ? 'active' : ''}`}
                  onClick={() => { setSelectedCompany(company); setShowCompanyModal(false); }}
                  style={{ padding: '15px', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer', background: selectedCompany === company ? 'var(--primary)' : '#f8f9fa', color: selectedCompany === company ? 'white' : 'inherit', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>{company}</span>
                  {selectedCompany === company && <span>✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};


export default Catalog;
