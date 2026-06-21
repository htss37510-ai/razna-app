import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutGrid, Info, MapPin, Phone, Mail, Globe, Link as LinkIcon, Search, Plus, ShoppingCart, Download, Upload, Home as HomeIcon, RefreshCcw, ClipboardList } from 'lucide-react';
import { useStateValue } from '../StateContext';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import './../App.css';

// Import logos
import aswarLogo from '../assets/logos/aswar.jpg';
import aurobindoLogo from '../assets/logos/aurobindo.jpg';
import glandLogo from '../assets/logos/gland.jpg';
import atabayLogo from '../assets/logos/atabay.jpg';
import vemLogo from '../assets/logos/vem.jpg';

const Home = () => {
  const { drugs, cart, orderInfo, orderHistory, importAllData } = useStateValue();
  const fileInputRef = useRef(null);

  const handleBackup = async () => {
    const dataToBackup = {
      drugs,
      cart,
      orderInfo,
      orderHistory
    };
    const jsonString = JSON.stringify(dataToBackup, null, 2);
    const filename = `backup_${new Date().toISOString().split('T')[0]}.json`;

    try {
      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.writeFile({
          path: filename,
          data: jsonString,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        await Share.share({
          title: 'نسخة احتياطية للبيانات',
          text: 'ملف النسخة الاحتياطية لنظام الأدوية',
          url: result.uri,
          dialogTitle: 'مشاركة النسخة الاحتياطية',
        });
      } else {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Backup failed:', error);
      alert('حدث خطأ أثناء إنشاء النسخة الاحتياطية أو مشاركتها');
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (window.confirm('هل أنت متأكد من استيراد هذه البيانات؟ سيتم تحديث البيانات الحالية.')) {
          importAllData(importedData);
          alert('تم استيراد البيانات بنجاح!');
        }
      } catch (error) {
        alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية. الرجاء التأكد من صحة الملف.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="home-page fade-in">
      <div className="welcome-section">
        <h1>مرحباً بك في نظام إدارة الأدوية</h1>
        <p>قم بإدارة وتنظيم قائمة الأدوية بسهولة وفعالية</p>

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
          <button 
            onClick={handleBackup}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Download size={20} /> نسخ احتياطي
          </button>
          <button 
            onClick={() => fileInputRef.current.click()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Upload size={20} /> استيراد
          </button>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleImport} 
            style={{ display: 'none' }} 
          />
        </div>
      </div>

      <div className="cards-grid">
        <Link to="/catalog" className="nav-card primary-card">
          <div className="card-content">
            <div className="text-side">
              <h2>قائمة الأدوية</h2>
              <p>تصفح الأدوية، عدل البيانات، واختر الكميات المطلوبة</p>
            </div>
            <div className="icon-side">
              <LayoutGrid size={48} />
            </div>
          </div>
        </Link>

        <Link to="/orders" className="nav-card orders-link-card">
          <div className="card-content">
            <div className="text-side">
              <h2>مراجعة الطلبات</h2>
              <p>عرض وتصدير قائمة الأدوية المطلوبة حالياً</p>
            </div>
            <div className="icon-side" style={{ background: '#4caf50' }}>
              <ShoppingCart size={48} />
            </div>
          </div>
        </Link>
        
        <Link to="/inventory" className="nav-card inventory-link-card">
          <div className="card-content">
            <div className="text-side">
              <h2>جرد الطلبات</h2>
              <p>عرض وتصدير جرد للطلبيات السابقة</p>
            </div>
            <div className="icon-side" style={{ background: '#ff9800' }}>
              <ClipboardList size={48} />
            </div>
          </div>
        </Link>

        <div className="info-card">
          <div className="card-header">
            <LinkIcon size={24} className="accent-icon" />
            <h2>معلومات</h2>
          </div>
          <div className="info-content">
            <div className="info-item">
              <span className="label">الشركات المصنعة:</span>
              <div className="logo-grid">
                <div className="logo-item"><img src={aswarLogo} alt="Aswar" className="logo-img" title="Aswar AL-khaleej" /></div>
                <div className="logo-item"><img src={aurobindoLogo} alt="Aurobindo" className="logo-img" /></div>
                <div className="logo-item"><img src={glandLogo} alt="Gland" className="logo-img" /></div>
                <div className="logo-item"><img src={atabayLogo} alt="Atabay" className="logo-img" /></div>
                <div className="logo-item"><img src={vemLogo} alt="Vem" className="logo-img" /></div>
              </div>
            </div>
            <div className="info-item">
              <span className="label">العنوان:</span>
              <span className="value">بغداد - ساحة النصر - حي البتاويين - شارع المشجر</span>
            </div>
            <div className="info-item">
              <span className="label">الهواتف:</span>
              <span className="value">07833049150 - 07800444246</span>
            </div>
            <div className="info-item">
              <span className="label">البريد الإلكتروني:</span>
              <span className="value">Info@alrazanbureau.com</span>
            </div>
            <div className="info-item">
              <span className="label">الموقع الإلكتروني:</span>
              <span className="value">www.alrazanbureau.com</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
