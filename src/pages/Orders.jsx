import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FileSpreadsheet, Trash2, Package, Hash, Clock, FileText, Share2, AlertTriangle, RefreshCcw, Image as ImageIcon, Save } from 'lucide-react';

import { useStateValue } from '../StateContext';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import InvoiceTemplate from '../components/InvoiceTemplate';
import './../App.css';

const Orders = () => {
  const navigate = useNavigate();
  const invoiceRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const context = useStateValue();
  
  // Debug log to check if component mounts
  useEffect(() => {
    console.log("Orders component mounted");
  }, []);

  if (!context) {
    return (
      <div className="orders-page" style={{ padding: '40px', textAlign: 'center' }}>
        <AlertTriangle size={64} color="#e53935" />
        <h2>خطأ في ربط البيانات</h2>
        <button onClick={() => window.location.reload()} className="reset-btn">تحديث</button>
      </div>
    );
  }

  const { drugs, cart, orderInfo, setOrderInfo, removeFromCart, updateCartQty, updateCartBonus, totalItems, totalTypes, saveOrder } = context;

  // 1. Memoize drugs lookup map separately
  const drugsMap = useMemo(() => {
    if (!drugs) return new Map();
    try {
      return new Map((drugs || []).map(d => [String(d.id), d]));
    } catch (e) {
      console.error("Drugs Map Error:", e);
      return new Map();
    }
  }, [drugs]);

  // 2. Filter and map ordered drugs (much faster when Map is pre-built)
  const orderedDrugs = useMemo(() => {
    if (!cart || !drugsMap) return [];
    try {
      return Object.keys(cart).map(id => {
        const drug = drugsMap.get(String(id));
        if (!drug) return null;
        return { 
          ...drug, 
          qty: cart[id]?.qty || 0, 
          bonus: cart[id]?.bonus || '',
          addedAt: new Date().toISOString().split('T')[0]
        };
      }).filter(Boolean);
    } catch (e) { 
      console.error("Mapping error:", e);
      return []; 
    }
  }, [cart, drugsMap]);

  const validateFields = () => {
    if (!orderInfo.delegateName || !orderInfo.pharmacyName || !orderInfo.pharmacyAddress || !orderInfo.stockName) {
      alert('يرجى ملء كافة الحقول الإجبارية (اسم المندوب، الصيدلية، العنوان، المذخر) للمتابعة.');
      return false;
    }
    return true;
  };

  const handleBack = () => {
    if (orderedDrugs.length > 0) {
      if (window.confirm('هل تريد مسح السلة قبل الخروج والعودة؟')) {
        context.setCart({});
        context.setOrderInfo(prev => ({
          ...prev,
          delegateName: '',
          pharmacyName: '',
          pharmacyAddress: '',
          stockName: ''
        }));
        context.setIsOrderSaved(false);
      }
    }
    navigate('/catalog');
  };

  const handleClearCart = () => {
    if (window.confirm('هل أنت متأكد من مسح كافة المواد من السلة؟')) {
      context.setCart({});
      context.setOrderInfo(prev => ({
        ...prev,
        delegateName: '',
        pharmacyName: '',
        pharmacyAddress: '',
        stockName: ''
      }));
      context.setIsOrderSaved(false);
    }
  };

  const handleSaveOrder = () => {
    if (orderedDrugs.length === 0) {
      alert('السلة فارغة!');
      return;
    }
    if (!validateFields()) return;
    if (context.isOrderSaved) {
      alert('تم حفظ هذه الطلبية مسبقاً! قم بالتعديل على السلة لحفظها كأمر جديد، أو امسح السلة للبدء بطلبية جديدة.');
      return;
    }
    saveOrder(orderedDrugs);
    context.setIsOrderSaved(true);
    alert('تم حفظ الطلبية بنجاح في سجل الجرد وتستطيع إرسالها الآن كملف.');
  };

  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setOrderInfo(prev => ({ ...prev, [name]: value }));
  };

  const exportToPDF = async () => {
    if (orderedDrugs.length === 0) { alert('السلة فارغة!'); return; }
    if (!validateFields()) return;
    if (isExporting) return;
    setIsExporting(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Ensure the template is rendered and let it settle
      const element = invoiceRef.current;
      if (!element) throw new Error("Template not found");
      
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 800,
        // Allow canvas to be as tall as necessary
        height: element.scrollHeight || element.offsetHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
      
      const fileName = `Order_${(orderInfo?.pharmacyName || 'New').replace(/[^a-z0-9]/gi, '_').substring(0, 30)}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = pdf.output('datauristring').split(',')[1];
        const result = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Cache
        });
        await Share.share({ title: 'تصدير الطلبية PDF', url: result.uri });
      } else {
        pdf.save(fileName);
      }
    } catch (error) {
      console.error('PDF Error:', error);
      alert('خطأ أثناء إنشاء PDF: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJPG = async () => {
    if (orderedDrugs.length === 0) { alert('السلة فارغة!'); return; }
    if (!validateFields()) return;
    if (isExporting) return;
    setIsExporting(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = invoiceRef.current;
      if (!element) throw new Error("Template not found");

      const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        windowWidth: 800,
        height: element.scrollHeight || element.offsetHeight
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const fileName = `Order_${(orderInfo?.pharmacyName || 'New').replace(/[^a-z0-9]/gi, '_').substring(0, 30)}.jpg`;

      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: imgData.split(',')[1],
          directory: Directory.Cache
        });
        await Share.share({ title: 'حفظ الطلبية JPG', url: result.uri });
      } else {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = fileName;
        link.click();
      }
    } catch (error) { 
      console.error('JPG Error:', error);
      alert('خطأ في إنشاء الصورة: ' + error.message); 
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async () => {
    try {
      if (orderedDrugs.length === 0) { alert('السلة فارغة!'); return; }
      if (!validateFields()) return;
      let csv = "\uFEFF#,Bonus,QTY,Item\n";
      orderedDrugs.forEach((d, i) => {
        const name = (d.nameEn || d.name || '').replace(/"/g, '""');
        const nameAr = (d.nameAr || '').replace(/"/g, '""');
        csv += `${i + 1},"${d.bonus}","${d.qty}","${name} / ${nameAr}"\n`;
      });
      
      const fileName = `Order_${(orderInfo?.pharmacyName || 'New').replace(/[^a-z0-9]/gi, '_').substring(0, 30)}.csv`;
      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.writeFile({ path: fileName, data: csv, directory: Directory.Cache, encoding: Encoding.UTF8 });
        await Share.share({ title: 'تصدير Excel', url: result.uri });
      } else {
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const a = document.createElement('a');
        a.href = url; a.download = fileName; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } catch (e) {
      alert("خطأ في تصدير Excel");
    }
  };

  const shareOrder = async () => {
    if (orderedDrugs.length === 0) { alert('السلة فارغة!'); return; }
    if (!validateFields()) return;

    // Build the share text
    let text = `صيدلية: ${orderInfo.pharmacyName || ''}\n`;
    text += `عنوان: ${orderInfo.pharmacyAddress || ''}\n\n`;

    // Group drugs by company/manufacturer
    const grouped = orderedDrugs.reduce((acc, d) => {
      const company = d.companyName || d.company || d.supplier || 'أخرى';
      if (!acc[company]) acc[company] = [];
      acc[company].push(d);
      return acc;
    }, {});

    Object.keys(grouped).forEach(company => {
      text += `${company}\n`;
      grouped[company].forEach(d => {
        const name = d.nameEn || d.name || d.nameAr || '';
        const qty = d.qty || 0;
        const bonus = d.bonus ? ` + ${d.bonus}` : '';
        // Align name and qty roughly with spaces as requested
        text += `${name.padEnd(30)} ${qty}${bonus} p\n`;
      });
      text += '\n'; // Blank line after each company
    });

    // Warehouses section
    text += `المذاخر\n`;
    if (orderInfo.stockName) {
      const stocks = orderInfo.stockName.split('/');
      stocks.forEach(s => {
        if (s.trim()) text += `${s.trim()}\n`;
      });
    }

    try {
      if (Capacitor.isNativePlatform() || navigator.share) {
        await Share.share({ title: 'طلب أدوية', text: text });
      } else {
        await navigator.clipboard.writeText(text);
        alert('تم نسخ تفاصيل الطلب');
      }
    } catch (e) {
      alert('تم نسخ النص للحافظة');
    }
  };

  // Safe time formatting
  const getTimeString = () => {
    try {
      const now = new Date();
      return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    } catch (e) { return "--:--"; }
  };

  // Safe render with error handling
  try {
    return (
      <div className="orders-page fade-in">
      <div className="orders-header card">
        <button className="nav-icon-btn" onClick={handleBack} title="العودة">
          <Home size={24} />
        </button>
        <h1>مراجعة الطلبية</h1>
      </div>

      <div className="order-info-section card">
        <h2>معلومات الطلبية</h2>
        <div className="info-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>اسم المندوب <span style={{ color: 'red' }}>*</span></label>
              <input type="text" name="delegateName" value={orderInfo.delegateName || ''} onChange={handleInfoChange} />
            </div>
            <div className="form-group">
              <label>عنوان الصيدليه <span style={{ color: 'red' }}>*</span></label>
              <input type="text" name="pharmacyAddress" value={orderInfo.pharmacyAddress || ''} onChange={handleInfoChange} placeholder="العنوان..." />
            </div>
          </div>
          <div className="form-group">
            <label>اسم الصيدلية <span style={{ color: 'red' }}>*</span></label>
            <input type="text" name="pharmacyName" value={orderInfo.pharmacyName || ''} onChange={handleInfoChange} placeholder="اسم الصيدلية..." />
          </div>
          <div className="form-group">
            <label>اسم المذخر <span style={{ color: 'red' }}>*</span></label>
            <input type="text" name="stockName" value={orderInfo.stockName || ''} onChange={handleInfoChange} placeholder="اسم المستودع..." />
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card card">
          <Hash size={24} />
          <div className="stat-data"><span>{totalTypes || 0}</span><label>الأنواع</label></div>
        </div>
        <div className="stat-card card">
          <Package size={24} />
          <div className="stat-data"><span>{totalItems || 0}</span><label>إجمالي الكمية</label></div>
        </div>
        <div className="stat-card card">
          <Clock size={24} />
          <div className="stat-data"><span>{getTimeString()}</span><label>الوقت</label></div>
        </div>
      </div>

      <div className="table-container card">
        <div className="table-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2>قائمة المطلوبات</h2>
            {orderedDrugs.length > 0 && (
              <button 
                className="action-btn reset" 
                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                onClick={handleClearCart}
              >
                <Trash2 size={16} /> مسح السلة
              </button>
            )}
          </div>
          <div className="orders-actions">
            <button 
              className="save-btn" 
              onClick={handleSaveOrder} 
              disabled={context.isOrderSaved}
              style={{ background: context.isOrderSaved ? '#2196f3' : '#4caf50', color: 'white', opacity: context.isOrderSaved ? 0.7 : 1, cursor: context.isOrderSaved ? 'not-allowed' : 'pointer' }}
            >
              <Save size={18} /> {context.isOrderSaved ? 'تم حفظ الطلبية بنجاح' : 'حفظ الطلبية (للجرد)'}
            </button>
            <button className="export-pdf-btn" disabled={isExporting} onClick={exportToPDF}>
              <FileText size={18} /> {isExporting ? 'جاري..' : 'PDF'}
            </button>
            <button className="export-jpg-btn" disabled={isExporting} onClick={exportToJPG}>
              <ImageIcon size={18} /> {isExporting ? 'جاري..' : 'JPG'}
            </button>
            <button className="share-btn" onClick={shareOrder}>
              <Share2 size={18} /> مشاركة
            </button>
            <button className="export-excel-btn" onClick={exportToCSV}>
              <FileSpreadsheet size={18} /> Excel
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ت</th>
                <th>بونص</th>
                <th>الكمية</th>
                <th>اسم الدواء</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {orderedDrugs.length > 0 ? orderedDrugs.map((drug, index) => (
                <tr key={drug.id || index}>
                  <td>{index + 1}</td>
                  <td>
                    <input 
                      type="text" 
                      className="inline-bonus-input" 
                      value={drug.bonus || ''} 
                      onChange={(e) => updateCartBonus(drug.id, e.target.value)} 
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      className="inline-qty-input" 
                      value={drug.qty || ''} 
                      onChange={(e) => updateCartQty(drug.id, e.target.value.replace(/[^0-9]/g, ''))} 
                    />
                  </td>
                  <td>
                    <div className="td-drug">
                      {drug.image ? <img src={drug.image} alt="" /> : <div className="mini-placeholder">R</div>}
                      <div className="drug-info-cell">
                        <span className="d-name">{drug.nameEn || drug.name}</span>
                        <span className="d-arabic">{drug.nameAr || ''}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button className="remove-btn" onClick={() => removeFromCart(drug.id)}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="empty-msg">السلة فارغة</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Hidden Invoice Template - using opacity instead of visibility:hidden for better capture */}
      <div style={{ 
        position: 'fixed', 
        left: '-9999px', 
        top: '0', 
        width: '800px', 
        pointerEvents: 'none', 
        background: 'white', 
        opacity: 0,
        zIndex: -1 
      }}>
        <InvoiceTemplate 
          ref={invoiceRef} 
          orderInfo={orderInfo || {}} 
          orderedDrugs={orderedDrugs} 
        />
      </div>
    </div>
    );
  } catch (e) {
    console.error("Orders Render Crash:", e);
    return (
      <div className="orders-page" style={{ padding: '40px', textAlign: 'center' }}>
        <AlertTriangle size={64} color="#e53935" />
        <h2>عذراً، حدث خطأ في عرض الطلبية</h2>
        <p>يرجى التأكد من الأدوية المضافة أو تحديث التطبيق.</p>
        <button onClick={() => window.location.reload()} className="reset-btn">تحديث</button>
      </div>
    );
  }
};

export default Orders;
