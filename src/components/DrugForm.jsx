import React, { useState } from 'react';
import { X, Save, Trash2, Upload } from 'lucide-react';

const DrugForm = ({ drug, onSave, onCancel, onDelete }) => {
  const [formData, setFormData] = useState(drug || {
    nameEn: '',
    nameAr: '',
    ingredient: '',
    details: '',
    companyName: '',
    image: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const compressImage = (base64Str, maxWidth = 800, maxHeight = 800) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality
      };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result);
        setFormData(prev => ({ ...prev, image: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content card fade-in">
        <div className="modal-header">
          <h2>{drug ? 'تعديل بيانات الدواء' : 'إضافة دواء جديد'}</h2>
          <button className="close-btn" onClick={onCancel}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="drug-form">
          <div className="form-group">
            <label>اسم الدواء (English)</label>
            <input 
              type="text" 
              name="nameEn" 
              value={formData.nameEn || formData.name || ''} 
              onChange={handleChange} 
              required 
              style={{direction: 'ltr'}}
            />
          </div>

          <div className="form-group">
            <label>اسم الدواء (عربي)</label>
            <input 
              type="text" 
              name="nameAr" 
              value={formData.nameAr || ''} 
              onChange={handleChange} 
            />
          </div>

          <div className="form-group">
            <label>المادة العلمية / التركيبة</label>
            <input 
              type="text" 
              name="ingredient" 
              value={formData.ingredient || formData.material || ''} 
              onChange={handleChange} 
              style={{direction: 'ltr'}}
            />
          </div>

          <div className="form-group">
            <label>التفاصيل / المكونات</label>
            <textarea 
              name="details" 
              value={formData.details} 
              onChange={handleChange} 
              rows="3"
              style={{direction: 'ltr'}}
            ></textarea>
          </div>

          <div className="form-group">
            <label>اسم الشركة (Company)</label>
            <input 
              type="text" 
              name="companyName" 
              value={formData.companyName || ''} 
              onChange={handleChange} 
              placeholder="مثال: اسوار الخليج / Gland"
            />
          </div>

          <div className="form-group">
            <label>صورة الدواء</label>
            <div className="image-input-wrapper">
              <input 
                type="text" 
                name="image" 
                placeholder="رابط الصورة (اختياري)" 
                value={formData.image} 
                onChange={handleChange} 
              />
              <span className="or">أو</span>
              <label className="upload-label">
                <Upload size={18} /> رفع صورة
                <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
              </label>
            </div>
            {formData.image && (
              <div className="preview-container">
                <img src={formData.image} alt="Preview" className="image-preview" />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              <Save size={18} /> حفظ البيانات
            </button>
            {drug && (
              <button type="button" className="btn-danger" onClick={() => onDelete(drug.id)}>
                <Trash2 size={18} /> حذف الدواء
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onCancel}>إلغاء</button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          animation: fadeInOverlay 0.3s ease-out;
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-content {
          width: 100%;
          max-width: 500px;
          padding: 30px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          animation: modalAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          max-height: 90vh;
          overflow-y: auto;
        }
        @keyframes modalAppear {
          from { transform: scale(0.9) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }
        .close-btn {
          background: transparent;
          color: var(--text-light);
          padding: 5px;
          border-radius: 50%;
        }
        .close-btn:hover {
          background: #f0f0f0;
          color: var(--accent);
        }
        .drug-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: var(--text-dark);
        }
        .image-input-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .or {
          font-weight: bold;
          color: var(--text-light);
        }
        .upload-label {
          background: #eee;
          padding: 10px 15px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          white-space: nowrap;
          transition: var(--transition);
        }
        .upload-label:hover {
          background: #e0e0e0;
        }
        .preview-container {
          margin-top: 15px;
          text-align: center;
        }
        .image-preview {
          max-width: 100%;
          max-height: 150px;
          border-radius: 8px;
          border: 1px solid #ddd;
        }
        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }
        .btn-primary {
          background: var(--primary);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          flex-grow: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: bold;
        }
        .btn-danger {
          background: var(--accent);
          color: white;
          padding: 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-secondary {
          background: var(--secondary);
          color: var(--text-dark);
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: bold;
        }

      `}</style>
    </div>
  );
};

export default DrugForm;
