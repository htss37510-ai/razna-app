import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FileSpreadsheet, FileText, Calendar, Clock, Filter, Search, ClipboardList, RefreshCcw, Trash2, AlertTriangle, X, Edit, Share2 } from 'lucide-react';
import { useStateValue } from '../StateContext';
import { toEnglishDigits } from '../utils';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import './../App.css';

const Inventory = () => {
  const navigate = useNavigate();
  const context = useStateValue();
  const [filterPeriod, setFilterPeriod] = useState('all'); // 'day', 'week', 'month', 'all'
  const [delegateFilter, setDelegateFilter] = useState('');
  const [pharmacyFilter, setPharmacyFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [drugFilter, setDrugFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  const [selectedEditOrder, setSelectedEditOrder] = useState(null);
  const [reportInfo, setReportInfo] = useState({
    governorate: '',
    area: ''
  });
  const [isExporting, setIsExporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteStartDate, setDeleteStartDate] = useState('');
  const [deleteEndDate, setDeleteEndDate] = useState('');
  const inventoryReportRef = useRef(null);

  if (!context) {
    return (
      <div className="orders-page" style={{ padding: '40px', textAlign: 'center' }}>
        <RefreshCcw size={64} style={{ color: '#aaa', margin: '0 auto 20px' }} />
        <h2>جاري تحميل البيانات...</h2>
      </div>
    );
  }

  const { orderHistory } = context;

  // Filter orders based on period and delegate
  const filteredOrders = useMemo(() => {
    let result = [...(orderHistory || [])];

    // Filter by delegate
    if (delegateFilter.trim()) {
      const q = delegateFilter.toLowerCase().trim();
      result = result.filter(o => 
        (o.delegateName || '').toLowerCase().includes(q)
      );
    }

    // Filter by pharmacy
    if (pharmacyFilter.trim()) {
      const q = pharmacyFilter.toLowerCase().trim();
      result = result.filter(o => 
        (o.pharmacyName || '').toLowerCase().includes(q)
      );
    }

    // Filter by warehouse
    if (warehouseFilter.trim()) {
      const q = warehouseFilter.toLowerCase().trim();
      result = result.filter(o => 
        (o.stockName || '').toLowerCase().includes(q)
      );
    }

    // Filter by drug name
    if (drugFilter.trim()) {
      const q = drugFilter.toLowerCase().trim();
      result = result.filter(o => 
        o.drugs && o.drugs.some(d => 
          (d.nameEn || d.name || '').toLowerCase().includes(q) || 
          (d.nameAr || '').toLowerCase().includes(q)
        )
      );
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(o => new Date(o.date) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(o => new Date(o.date) <= end);
    }

    return result;
  }, [orderHistory, startDate, endDate, delegateFilter, pharmacyFilter, warehouseFilter, drugFilter]);

  // Aggregate drugs for inventory reporting
  const aggregatedInventory = useMemo(() => {
    const map = new Map();
    
    filteredOrders.forEach(order => {
      if (Array.isArray(order.drugs)) {
        order.drugs.forEach(drug => {
          const id = drug.id || drug.name;
          const currentQty = parseInt(drug.qty) || 0;
          if (map.has(id)) {
            const existing = map.get(id);
            existing.qty += currentQty;
            // Optionally merge bonuses if needed, but usually inventory refers to qty
          } else {
            map.set(id, {
              ...drug,
              qty: currentQty
            });
          }
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => (a.nameEn || a.name).localeCompare(b.nameEn || b.name));
  }, [filteredOrders]);

  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setReportInfo(prev => ({ ...prev, [name]: value }));
  };

  const getPeriodText = () => {
    if (startDate && endDate) {
      return `من ${new Date(startDate).toLocaleDateString('ar-EG')} إلى ${new Date(endDate).toLocaleDateString('ar-EG')}`;
    }
    if (startDate) return `من ${new Date(startDate).toLocaleDateString('ar-EG')}`;
    if (endDate) return `حتى ${new Date(endDate).toLocaleDateString('ar-EG')}`;
    return 'كل الأوقات';
  };

  const setPeriod = (period) => {
    setFilterPeriod(period);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (period === 'day') {
      setStartDate(today);
      setEndDate(today);
    } else if (period === 'week') {
      const lastWeek = new Date();
      lastWeek.setDate(now.getDate() - 7);
      setStartDate(lastWeek.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (period === 'month') {
      const lastMonth = new Date();
      lastMonth.setMonth(now.getMonth() - 1);
      setStartDate(lastMonth.toISOString().split('T')[0]);
      setEndDate(today);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleOpenDeleteModal = () => {
    setDeleteStartDate(startDate);
    setDeleteEndDate(endDate);
    setDeleteModalOpen(true);
  };

  const handleDeleteOrders = () => {
    if (deletePassword !== '1122as1122as@A') {
      alert('كلمة المرور غير صحيحة!');
      return;
    }
    
    let toDelete = [...(orderHistory || [])];
    if (deleteStartDate) {
      const start = new Date(deleteStartDate);
      start.setHours(0, 0, 0, 0);
      toDelete = toDelete.filter(o => new Date(o.date) >= start);
    }
    if (deleteEndDate) {
      const end = new Date(deleteEndDate);
      end.setHours(23, 59, 59, 999);
      toDelete = toDelete.filter(o => new Date(o.date) <= end);
    }

    if (toDelete.length === 0) {
      alert('لا توجد طلبيات للحذف في هذه الفترة المحددة!');
      return;
    }

    if (window.confirm(`هل أنت متأكد من حذف ${toDelete.length} طلبية؟`)) {
      const idsToDelete = toDelete.map(o => o.id);
      context.deleteOrders(idsToDelete);
      alert('تم حذف الطلبيات بنجاح!');
      setDeleteModalOpen(false);
      setDeletePassword('');
    }
  };

  const handleDeleteSingleOrder = (order) => {
    if (window.confirm(`هل تريد حذف الطلبية المقدمة من ${order.pharmacyName || 'هذه الصيدلية'}؟`)) {
      context.deleteOrders([order.id]);
      alert('تم حذف الطلبية بنجاح.');
    }
  };

  const handleEditQty = (drugId, newQty) => {
    if (!selectedEditOrder) return;
    const normalizedQty = toEnglishDigits(newQty).replace(/[^0-9]/g, '');
    const updatedDrugs = selectedEditOrder.drugs.map(d => 
      String(d.id) === String(drugId) ? { ...d, qty: parseInt(normalizedQty) || 0 } : d
    );
    setSelectedEditOrder({ ...selectedEditOrder, drugs: updatedDrugs });
  };

  const handleRemoveDrug = (drugId) => {
    if (!selectedEditOrder) return;
    if (window.confirm('هل أنت متأكد من حذف هذا الدواء من الطلبية؟')) {
      const updatedDrugs = selectedEditOrder.drugs.filter(d => d.id !== drugId);
      if (updatedDrugs.length === 0) {
        if (window.confirm('الطلبية ستصبح فارغة، هل تريد حذف الطلبية بالكامل؟')) {
          context.deleteOrders([selectedEditOrder.id]);
          setSelectedEditOrder(null);
          return;
        }
      }
      setSelectedEditOrder({ ...selectedEditOrder, drugs: updatedDrugs });
    }
  };

  const handleSaveEdit = () => {
    if (!selectedEditOrder) return;
    context.updateOrder(selectedEditOrder);
    alert('تم تحديث الطلبية بنجاح.');
    setSelectedEditOrder(null);
  };

  const handleShareOrder = async (order) => {
    if (!order || !order.drugs || order.drugs.length === 0) {
      alert('الطلبية فارغة أو غير موجودة!');
      return;
    }

    try {
      // Build the share text
      let text = `صيدلية: ${order.pharmacyName || ''}\n`;
      text += `عنوان: ${order.pharmacyAddress || ''}\n`;
      text += `التاريخ: ${new Date(order.date).toLocaleString()}\n\n`;

      // Group drugs by company/manufacturer
      const grouped = order.drugs.reduce((acc, d) => {
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
          text += `${name.padEnd(30)} ${qty}${bonus} p\n`;
        });
        text += '\n';
      });

      text += `المذاخر\n`;
      if (order.stockName) {
        const stocks = order.stockName.split('/');
        stocks.forEach(s => {
          if (s.trim()) text += `${s.trim()}\n`;
        });
      }

      if (Capacitor.isNativePlatform() || navigator.share) {
        await Share.share({ title: 'طلب أدوية (سابق)', text: text });
      } else {
        await navigator.clipboard.writeText(text);
        alert('تم نسخ تفاصيل الطلب');
      }
    } catch (e) {
      console.error("Share error:", e);
      alert('خطأ أثناء المشاركة');
    }
  };

  const exportToCSV = async () => {
    try {
      if (aggregatedInventory.length === 0) { alert('لا توجد بيانات ليتم تصديرها!'); return; }
      
      let csv = "\uFEFFجرد الطلبات\n";
      csv += `الفترة:,${getPeriodText()}\n`;
      csv += `المندوب:,${delegateFilter || 'الكل'}\n`;
      csv += `المحافظة:,${reportInfo.governorate}\n`;
      csv += `المنطقة:,${reportInfo.area}\n\n`;
      
      csv += "#,Item,Total QTY\n";
      aggregatedInventory.forEach((d, i) => {
        const name = (d.nameEn || d.name || '').replace(/"/g, '""');
        const nameAr = (d.nameAr || '').replace(/"/g, '""');
        csv += `${i + 1},"${name} / ${nameAr}","${d.qty}"\n`;
      });
      
      const fileName = `Inventory_${new Date().toISOString().split('T')[0]}.csv`;
      
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

  const exportToPDF = async () => {
    if (aggregatedInventory.length === 0) { alert('لا توجد بيانات ليتم تصديرها!'); return; }
    if (isExporting) return;
    setIsExporting(true);

    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      const element = inventoryReportRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const doc = new jsPDF({ 
        orientation: 'portrait', 
        unit: 'mm', 
        format: [pdfWidth, pdfHeight > 297 ? pdfHeight + 10 : 297] // A4 min height or wrap around content
      });
      
      doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      const fileName = `Inventory_${new Date().toISOString().split('T')[0]}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        const result = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Cache
        });
        await Share.share({ title: 'تصدير الجرد PDF', url: result.uri });
      } else {
        doc.save(fileName);
      }
    } catch (error) {
      console.error('PDF Error:', error);
      alert('خطأ أثناء إنشاء PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="orders-page fade-in">
      <div className="orders-header card">
        <button className="nav-icon-btn" onClick={() => navigate('/')} title="الرئيسية">
          <Home size={24} />
        </button>
        <h1>جرد الطلبيات</h1>
      </div>

      <div className="order-info-section card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>فلاتر الجرد</h2>
          <div className="period-filters" style={{ display: 'flex', gap: '10px' }}>
            <button 
              className={`period-btn ${filterPeriod === 'day' ? 'active' : ''}`}
              onClick={() => setPeriod('day')}
            >يوم</button>
            <button 
              className={`period-btn ${filterPeriod === 'week' ? 'active' : ''}`}
              onClick={() => setPeriod('week')}
            >أسبوع</button>
            <button 
              className={`period-btn ${filterPeriod === 'month' ? 'active' : ''}`}
              onClick={() => setPeriod('month')}
            >شهر</button>
            <button 
              className={`period-btn ${filterPeriod === 'all' ? 'active' : ''}`}
              onClick={() => setPeriod('all')}
            >الكل</button>
            <button 
              onClick={handleOpenDeleteModal}
              style={{ background: '#e53935', color: 'white', padding: '5px 15px', borderRadius: '6px', marginRight: 'auto', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: 'bold' }}
              title="حذف الطلبيات"
            >
              <Trash2 size={16} /> حذف الطلبيات
            </button>
          </div>
        </div>
        
        <div className="info-form">
          <div className="form-group">
            <label>اسم المندوب</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={delegateFilter} 
                onChange={(e) => setDelegateFilter(e.target.value)} 
                placeholder="بحث عن مندوب..."
                style={{ paddingRight: '35px' }}
              />
              <Search size={18} style={{ position: 'absolute', right: '10px', top: '12px', color: '#999' }} />
            </div>
          </div>
          <div className="form-group">
            <label>اسم الصيدلية</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={pharmacyFilter} 
                onChange={(e) => setPharmacyFilter(e.target.value)} 
                placeholder="بحث عن صيدلية..."
                style={{ paddingRight: '35px' }}
              />
              <Search size={18} style={{ position: 'absolute', right: '10px', top: '12px', color: '#999' }} />
            </div>
          </div>
          <div className="form-group">
            <label>بحث عن مذخر</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={warehouseFilter} 
                onChange={(e) => setWarehouseFilter(e.target.value)} 
                placeholder="اسم المذخر..."
                style={{ paddingRight: '35px' }}
              />
              <Search size={18} style={{ position: 'absolute', right: '10px', top: '12px', color: '#999' }} />
            </div>
          </div>
          <div className="form-group">
            <label>بحث عن دواء</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={drugFilter} 
                onChange={(e) => setDrugFilter(e.target.value)} 
                placeholder="اسم الدواء..."
                style={{ paddingRight: '35px' }}
              />
              <Search size={18} style={{ position: 'absolute', right: '10px', top: '12px', color: '#999' }} />
            </div>
          </div>
          <div className="form-group">
            <label>التاريخ من</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>التاريخ إلى</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>المحافظة (للتصدير)</label>
            <input type="text" name="governorate" value={reportInfo.governorate} onChange={handleInfoChange} placeholder="اسم المحافظة..." />
          </div>
          <div className="form-group">
            <label>المنطقة (للتصدير)</label>
            <input type="text" name="area" value={reportInfo.area} onChange={handleInfoChange} placeholder="اسم المنطقة..." />
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card card" style={{ flex: 1 }}>
          <ClipboardList size={24} color="#ff9800" />
          <div className="stat-data"><span>{filteredOrders.length}</span><label>عدد الطلبيات المنجزة</label></div>
        </div>
        <div className="stat-card card">
          <Calendar size={24} color="#2196f3" />
          <div className="stat-data"><span>{getPeriodText()}</span><label>الفترة المحددة</label></div>
        </div>
      </div>

      <div className="table-container card">
        <div className="table-header">
          <h2>قائمة الطلبيات السابقة</h2>
          <div className="orders-actions">
            <button className="export-pdf-btn" disabled={isExporting} onClick={exportToPDF}>
              <FileText size={18} /> {isExporting ? 'جاري..' : 'جرد PDF'}
            </button>
            <button className="export-excel-btn" onClick={exportToCSV}>
              <FileSpreadsheet size={18} /> جرد Excel
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ت</th>
                <th>التاريخ</th>
                <th>المندوب</th>
                <th>الصيدلية</th>
                <th>المذخر</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? filteredOrders.map((order, index) => (
                <tr key={order.id || index}>
                  <td>{index + 1}</td>
                  <td style={{ direction: 'ltr', textAlign: 'right', fontSize: '0.85rem' }}>
                    {order.date ? new Date(order.date).toLocaleDateString() : 'غير معروف'}
                  </td>
                  <td>{order.delegateName || '-'}</td>
                  <td style={{ fontWeight: '500' }}>{order.pharmacyName || '-'}</td>
                  <td>{order.stockName || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="action-btn" 
                        style={{ padding: '6px', background: '#2196f3', color: 'white', borderRadius: '6px', border: 'none' }}
                        onClick={() => setSelectedViewOrder(order)}
                        title="عرض التفاصيل"
                      >
                        <FileText size={16} />
                      </button>
                      <button 
                        className="action-btn" 
                        style={{ padding: '6px', background: '#9c27b0', color: 'white', borderRadius: '6px', border: 'none' }}
                        onClick={() => handleShareOrder(order)}
                        title="مشاركة الطلبية"
                      >
                        <Share2 size={16} />
                      </button>
                      <button 
                        className="action-btn" 
                        style={{ padding: '6px', background: '#4caf50', color: 'white', borderRadius: '6px', border: 'none' }}
                        onClick={() => setSelectedEditOrder(JSON.parse(JSON.stringify(order)))}
                        title="تعديل الطلبية"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="action-btn" 
                        style={{ padding: '6px', background: '#f44336', color: 'white', borderRadius: '6px', border: 'none' }}
                        onClick={() => handleDeleteSingleOrder(order)}
                        title="حذف الطلبية"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="empty-msg">لا توجد طلبيات مطابقة للبحث</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden layout for complete and styled PDF generation with Arabic text support */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', width: '210mm', opacity: 0 }}>
        <div ref={inventoryReportRef} style={{ background: 'white', padding: '30px', direction: 'rtl', width: '100%', minHeight: '297mm', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '15px' }}>
            <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '28px' }}>تقرير جرد كميات الأدوية</h1>
            <p style={{ margin: '8px 0 0', color: '#7f8c8d', fontSize: '16px' }}>تاريخ النشر: {new Date().toLocaleDateString('en-GB')}</p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '16px', flexWrap: 'wrap' }}>
            <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', minWidth: '45%' }}>
              <strong>اسم المندوب:</strong> {delegateFilter || 'الكل'}
            </div>
            <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', minWidth: '45%' }}>
              <strong>الفترة المحددة:</strong> {getPeriodText()}
            </div>
            <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', minWidth: '45%', marginTop: '15px' }}>
              <strong>المحافظة:</strong> {reportInfo.governorate || 'غير محدد'}
            </div>
            <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', minWidth: '45%', marginTop: '15px' }}>
              <strong>المنطقة:</strong> {reportInfo.area || 'غير محدد'}
            </div>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ background: '#34495e', color: 'white', fontSize: '16px' }}>
                <th style={{ padding: '12px', border: '1px solid #ddd', width: '60px', textAlign: 'center' }}>ت</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>اسم الدواء</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', width: '120px', textAlign: 'center' }}>الكمية الكلية</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedInventory.map((item, index) => (
                <tr key={index} style={{ background: index % 2 === 0 ? '#f9f9f9' : 'white', fontSize: '15px' }}>
                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right', direction: 'ltr' }}>
                    <span style={{ fontWeight: 'bold' }}>{item.nameEn || item.name}</span> {item.nameAr ? `(${item.nameAr})` : ''}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', fontSize: '18px', color: '#e74c3c' }}>{item.qty}</td>
                </tr>
              ))}
              {aggregatedInventory.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ padding: '20px', textAlign: 'center', border: '1px solid #ddd' }}>لا يوجد بيانات متطابقة</td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '14px', color: '#95a5a6' }}>
            تم بناء هذا التقرير نظامياً بواسطة برنامج مبيعات الرزان
          </div>
        </div>
      </div>

      {deleteModalOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>تأكيد حذف البيانات</h2>
              <button className="modal-close-btn" onClick={() => setDeleteModalOpen(false)}><X size={20} /></button>
            </div>
            
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ background: '#fff5f5', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                  <AlertTriangle size={40} color="#e53935" />
                </div>
                <h3 style={{ color: '#2d3748', fontSize: '1.2rem', margin: '0 0 10px' }}>هل أنت متأكد من الحذف؟</h3>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>سيتم مسح الطلبيات المحددة نهائياً من سجل الجرد.</p>
              </div>

              <div className="delete-alert-box">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: '#718096' }}>من تاريخ</label>
                    <input type="date" value={deleteStartDate} onChange={(e) => setDeleteStartDate(e.target.value)} style={{ padding: '5px', fontSize: '0.9rem' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: '#718096' }}>إلى تاريخ</label>
                    <input type="date" value={deleteEndDate} onChange={(e) => setDeleteEndDate(e.target.value)} style={{ padding: '5px', fontSize: '0.9rem' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderTop: '1px solid #feb2b2', paddingTop: '10px' }}>
                  <span style={{ color: '#718096' }}>نطاق الحذف:</span>
                  <span style={{ fontWeight: 'bold', color: '#e53935' }}>
                    {deleteStartDate && deleteEndDate ? `${deleteStartDate} - ${deleteEndDate}` : 'كل الأوقات'}
                  </span>
                </div>
              </div>

              <div className="password-input-group">
                <label>أدخل كلمة مرور الحماية</label>
                <input 
                  type="password" 
                  className="password-input"
                  placeholder="••••••••••••"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="modal-actions">
                <button className="modal-btn modal-btn-cancel" onClick={() => setDeleteModalOpen(false)}>إلغاء</button>
                <button className="modal-btn modal-btn-delete" onClick={handleDeleteOrders}>تأكيد الحذف النهائي</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEditOrder && (
        <div className="modal-overlay" onClick={() => setSelectedEditOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit size={24} color="#4caf50" /> تعديل الطلبية السابقة
              </h2>
              <button className="modal-close-btn" onClick={() => setSelectedEditOrder(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="order-item-header" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', padding: '15px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #c6f6d5' }}>
                 <div><strong>الصيدلية:</strong> {selectedEditOrder.pharmacyName}</div>
                 <div><strong>المذخر:</strong> {selectedEditOrder.stockName}</div>
                 <div><strong>المندوب:</strong> {selectedEditOrder.delegateName}</div>
                 <div><strong>التاريخ:</strong> {new Date(selectedEditOrder.date).toLocaleString()}</div>
              </div>

              <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="orders-table">
                  <thead>
                     <tr>
                        <th>#</th>
                        <th>الدواء</th>
                        <th style={{ width: '100px' }}>الكمية</th>
                        <th style={{ width: '60px' }}>حذف</th>
                     </tr>
                  </thead>
                  <tbody>
                    {selectedEditOrder.drugs && selectedEditOrder.drugs.map((drug, i) => (
                      <tr key={drug.id || i}>
                        <td>{i + 1}</td>
                        <td style={{ textAlign: 'right' }}>
                           <div style={{ fontWeight: 'bold' }}>{drug.nameEn || drug.name}</div>
                           <div style={{ fontSize: '0.8rem', color: '#666' }}>{drug.nameAr}</div>
                        </td>
                        <td>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            className="inline-qty-input" 
                            style={{ width: '80px', textAlign: 'center', padding: '5px' }}
                            value={drug.qty} 
                            onChange={(e) => handleEditQty(drug.id, e.target.value)} 
                          />
                        </td>
                        <td>
                          <button 
                            className="remove-btn" 
                            onClick={() => handleRemoveDrug(drug.id)}
                            style={{ color: '#e53935' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-actions" style={{ marginTop: '25px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                 <button className="modal-btn modal-btn-cancel" onClick={() => setSelectedEditOrder(null)}>إلغاء</button>
                 <button 
                   className="modal-btn" 
                   onClick={handleSaveEdit}
                   style={{ background: '#4caf50', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                 >
                   حفظ التعديلات
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedViewOrder && (
        <div className="modal-overlay" onClick={() => setSelectedViewOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>تفاصيل الطلبية السابقة</h2>
              <button className="modal-close-btn" onClick={() => setSelectedViewOrder(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="order-item-header" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', padding: '15px', background: '#f7fafc', borderRadius: '10px' }}>
                 <div><strong>الصيدلية:</strong> {selectedViewOrder.pharmacyName}</div>
                 <div><strong>المذخر:</strong> {selectedViewOrder.stockName}</div>
                 <div><strong>المندوب:</strong> {selectedViewOrder.delegateName}</div>
                 <div><strong>التاريخ:</strong> {new Date(selectedViewOrder.date).toLocaleString()}</div>
              </div>

              <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="orders-table">
                  <thead>
                     <tr>
                        <th>#</th>
                        <th>الدواء</th>
                        <th>الكمية</th>
                        <th>بونص</th>
                     </tr>
                  </thead>
                  <tbody>
                    {selectedViewOrder.drugs && selectedViewOrder.drugs.map((drug, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td style={{ textAlign: 'right' }}>
                           <div style={{ fontWeight: 'bold' }}>{drug.nameEn || drug.name}</div>
                           <div style={{ fontSize: '0.8rem', color: '#666' }}>{drug.nameAr}</div>
                        </td>
                        <td style={{ fontWeight: 'bold', color: '#2c3e50' }}>{drug.qty}</td>
                        <td style={{ color: '#e53935' }}>{drug.bonus || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '20px', textAlign: 'left' }}>
                 <button className="modal-btn modal-btn-cancel" onClick={() => setSelectedViewOrder(null)}>إغلاق</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
