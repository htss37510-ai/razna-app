import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, FileSpreadsheet, Trash2, Package, Hash, Clock, FileText, Share2, AlertTriangle, Image as ImageIcon, ShoppingCart, Save } from 'lucide-react';
import { useStateValue } from '../StateContext';
import { toEnglishDigits } from '../utils';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import InvoiceTemplate from './InvoiceTemplate';
import './../App.css';

const OrdersDrawer = () => {
  const invoiceRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const context = useStateValue();
  
  if (!context) return null;

  const { 
    drugs, cart, setCart, orderInfo, setOrderInfo, removeFromCart, 
    updateCartQty, updateCartBonus, totalItems, totalTypes,
    isDrawerOpen, setIsDrawerOpen, saveOrder, isOrderSaved, setIsOrderSaved, clearCart
  } = context;

  // Memoize drugs lookup map
  const drugsMap = useMemo(() => {
    if (!drugs) return new Map();
    return new Map((drugs || []).map(d => [String(d.id), d]));
  }, [drugs]);

  // Filter and map ordered drugs
  const orderedDrugs = useMemo(() => {
    if (!cart || !drugsMap) return [];
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
  }, [cart, drugsMap]);

  const validateFields = () => {
    if (!orderInfo.delegateName || !orderInfo.pharmacyName || !orderInfo.pharmacyAddress || !orderInfo.stockName) {
      alert('يرجى ملء كافة الحقول الإجبارية (اسم المندوب، الصيدلية، العنوان، المذخر) للمتابعة.');
      return false;
    }
    return true;
  };

  const handleCloseDrawer = () => {
    if (orderedDrugs.length > 0) {
      if (window.confirm('هل تريد مسح السلة قبل الخروج؟')) {
        clearCart();
      }
    }
    setIsDrawerOpen(false);
  };

  const handleClearCart = () => {
    if (window.confirm('هل أنت متأكد من مسح كافة المواد من السلة؟')) {
      clearCart();
    }
  };

  const handleSaveOrder = () => {
    if (orderedDrugs.length === 0) {
      alert('السلة فارغة!');
      return;
    }
    if (!validateFields()) return;
    if (isOrderSaved) {
       alert('تم حفظ هذه الطلبية مسبقاً! قم بالتعديل على السلة لحفظها كأمر جديد، أو امسح السلة للبدء بطلبية جديدة.');
       return;
    }
    saveOrder(orderedDrugs);
    setIsOrderSaved(true);
    alert('تم حفظ الطلبية في الأرشيف بنجاح وتقدر ترسلها الآن.');
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
      const element = invoiceRef.current;
      if (!element) throw new Error("Template not found");
      
      const canvas = await html2canvas(element, { 
        scale: 2, useCORS: true, backgroundColor: '#ffffff',
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
      
      const fileName = `Order_${(orderInfo?.pharmacyName || 'New').replace(/[^a-z0-9]/gi, '_')}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: pdf.output('datauristring').split(',')[1],
          directory: Directory.Cache
        });
        await Share.share({ title: 'تصدير PDF', url: result.uri });
      } else {
        pdf.save(fileName);
      }
    } catch (error) {
      alert('خطأ أثناء إنشاء PDF');
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
        scale: 3, useCORS: true, backgroundColor: '#ffffff',
        height: element.scrollHeight || element.offsetHeight
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const fileName = `Order_${(orderInfo?.pharmacyName || 'New').replace(/[^a-z0-9]/gi, '_')}.jpg`;

      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: imgData.split(',')[1],
          directory: Directory.Cache
        });
        await Share.share({ title: 'حفظ JPG', url: result.uri });
      } else {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = fileName;
        link.click();
      }
    } catch (error) { 
      alert('خطأ في إنشاء الصورة'); 
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
        csv += `${i + 1},"${d.bonus}","${d.qty}","${(d.nameEn || d.name || '')} / ${(d.nameAr || '')}"\n`;
      });
      const fileName = `Order_${(orderInfo?.pharmacyName || 'New').replace(/[^a-z0-9]/gi, '_')}.csv`;
      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.writeFile({ path: fileName, data: csv, directory: Directory.Cache, encoding: Encoding.UTF8 });
        await Share.share({ title: 'تصدير Excel', url: result.uri });
      } else {
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const a = document.createElement('a');
        a.href = url; a.download = fileName; a.click();
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
        // Align name and qty roughly with spaces
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
      alert('تم نسخ النص');
    }
  };

  return (
    <>
      <div 
        className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} 
        onClick={handleCloseDrawer} 
      />
      <div className={`orders-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <button className="close-drawer-btn" onClick={handleCloseDrawer}>
            <X size={24} />
          </button>
          <h2>مراجعة الطلبية</h2>
          <div className="drawer-actions-top">
             {orderedDrugs.length > 0 && (
                <button className="clear-cart-mini" onClick={handleClearCart}>
                  مسح السلة
                </button>
             )}
          </div>
        </div>

        <div className="drawer-content">
          <div className="order-info-mini card">
            <div className="form-group-mini" style={{ gridColumn: 'span 2' }}>
              <label>اسم المندوب <span style={{ color: 'red' }}>*</span></label>
              <input type="text" name="delegateName" value={orderInfo.delegateName || ''} onChange={handleInfoChange} placeholder="اسم المندوب..." />
            </div>
            <div className="form-group-mini">
              <label>صيدلية <span style={{ color: 'red' }}>*</span></label>
              <input type="text" name="pharmacyName" value={orderInfo.pharmacyName || ''} onChange={handleInfoChange} placeholder="اسم الصيدلية..." />
            </div>
            <div className="form-group-mini">
              <label>العنوان <span style={{ color: 'red' }}>*</span></label>
              <input type="text" name="pharmacyAddress" value={orderInfo.pharmacyAddress || ''} onChange={handleInfoChange} placeholder="عنوان الصيدلية..." />
            </div>
            <div className="form-group-mini">
              <label>المذخر <span style={{ color: 'red' }}>*</span></label>
              <input type="text" name="stockName" value={orderInfo.stockName || ''} onChange={handleInfoChange} placeholder="اسم المستودع..." />
            </div>
          </div>

          <div className="drawer-stats">
            <div className="stat-pill"><Hash size={16} /> <span>{totalTypes}</span></div>
            <div className="stat-pill"><Package size={16} /> <span>{totalItems}</span></div>
            <div className="stat-pill"><Clock size={16} /> <span>{new Date().getHours()}:{String(new Date().getMinutes()).padStart(2,'0')}</span></div>
          </div>

          <div className="drawer-actions-grid">
            <button 
              className="save-btn mini" 
              onClick={handleSaveOrder} 
              disabled={isOrderSaved}
              style={{ background: isOrderSaved ? '#2196f3' : '#4caf50', color: 'white', gridColumn: 'span 2', opacity: isOrderSaved ? 0.7 : 1, cursor: isOrderSaved ? 'not-allowed' : 'pointer' }}
            >
              <Save size={18} /> <span>{isOrderSaved ? 'تم الحفظ بنجاح' : 'حفظ الطلبية'}</span>
            </button>
            <button className="export-pdf-btn mini" onClick={exportToPDF} disabled={isExporting}>
              <FileText size={18} /> <span>PDF</span>
            </button>
            <button className="export-jpg-btn mini" onClick={exportToJPG} disabled={isExporting}>
              <ImageIcon size={18} /> <span>JPG</span>
            </button>
            <button className="share-btn mini" onClick={shareOrder}>
              <Share2 size={18} /> <span>مشاركة</span>
            </button>
            <button className="export-excel-btn mini" onClick={exportToCSV}>
              <FileSpreadsheet size={18} /> <span>Excel</span>
            </button>
          </div>

          <div className="drawer-table-wrapper">
            {orderedDrugs.length > 0 ? (
              <table className="drawer-table">
                <thead>
                  <tr>
                    <th>دواء</th>
                    <th>كمية</th>
                    <th>بونص</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orderedDrugs.map((drug) => (
                    <tr key={drug.id}>
                      <td>
                        <div className="drawer-drug-name">
                           <span className="en">{drug.nameEn || drug.name}</span>
                           <span className="ar">{drug.nameAr}</span>
                        </div>
                      </td>
                      <td>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          className="drawer-input" 
                          value={drug.qty} 
                          onChange={(e) => {
                            const normalized = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '');
                            updateCartQty(drug.id, normalized);
                          }} 
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="drawer-input bonus" 
                          value={drug.bonus} 
                          onChange={(e) => updateCartBonus(drug.id, e.target.value)} 
                        />
                      </td>
                      <td>
                        <button className="remove-item-btn" onClick={() => removeFromCart(drug.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-drawer">
                <ShoppingCart size={48} className="empty-icon" />
                <p>السلة فارغة</p>
              </div>
            )}
          </div>
        </div>

        {/* Hidden Invoice Template */}
        <div style={{ position: 'fixed', left: '-9999px', top: '0', width: '800px', pointerEvents: 'none', opacity: 0 }}>
          <InvoiceTemplate ref={invoiceRef} orderInfo={orderInfo} orderedDrugs={orderedDrugs} />
        </div>
      </div>
    </>
  );
};

export default OrdersDrawer;
