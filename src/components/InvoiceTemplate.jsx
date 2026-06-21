import React, { forwardRef } from 'react';

const InvoiceTemplate = forwardRef(({ orderInfo = {}, orderedDrugs = [] }, ref) => {
  let today = "";
  try {
    today = new Date().toLocaleDateString('en-GB');
  } catch (e) {
    try {
      today = new Date().toISOString().split('T')[0];
    } catch (err) {
      today = "---";
    }
  }

  // Ensure orderedDrugs is always an array
  const safeDrugs = Array.isArray(orderedDrugs) ? orderedDrugs : [];

  return (
    <div 
      ref={ref} 
      className="invoice-capture-area"
      style={{
        width: '800px',
        padding: '40px',
        backgroundColor: 'white',
        color: 'black',
        fontFamily: 'Arial, sans-serif',
        direction: 'rtl',
        minHeight: '100px',
        // Use flex column to allow natural height growth
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', direction: 'ltr' }}>
        <div>
          <h1 style={{ fontSize: '36px', margin: '0 0 10px 0', fontWeight: 'bold' }}>Order</h1>
          <div style={{ display: 'flex', gap: '8px', fontSize: '18px', marginBottom: '4px' }}>
            <span>{(orderInfo && orderInfo.companyName) || 'مكتب الرزان العلمي'}</span>
            <span style={{ fontWeight: 'bold' }}>Comp</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '18px' }}>
            <span>{(orderInfo && orderInfo.delegateName) || '---'}</span>
            <span style={{ fontWeight: 'bold' }}>Sales</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', marginTop: '10px' }}>
          <div style={{ display: 'flex', gap: '15px', fontSize: '18px', justifyContent: 'flex-end' }}>
            <span style={{ fontWeight: 'bold' }}>Order Date</span>
            <span>{today}</span>
          </div>
        </div>
      </div>

      {/* Pharmacy Name */}
      <div style={{ textAlign: 'center', margin: '20px 0', paddingBottom: '10px' }}>
        <h2 style={{ fontSize: '32px', margin: '0 0 5px 0', fontWeight: 'bold' }}>
          صيدلية : {(orderInfo && orderInfo.pharmacyName) || '---'}
        </h2>
        <div style={{ fontSize: '20px', color: '#555' }}>
          {(orderInfo && orderInfo.pharmacyAddress) || ''}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1 }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          marginBottom: '20px',
          fontSize: '18px',
          border: '2px solid black'
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid black' }}>
              <th style={{ border: '1px solid black', padding: '12px 10px', width: '50px', textAlign: 'center', fontWeight: 'bold' }}>#</th>
              <th style={{ border: '1px solid black', padding: '12px 10px', textAlign: 'center', fontWeight: 'bold' }}>Item</th>
              <th style={{ border: '1px solid black', padding: '12px 10px', textAlign: 'center', fontWeight: 'bold' }}>اسم الشركة</th>
              <th style={{ border: '1px solid black', padding: '12px 10px', width: '80px', textAlign: 'center', fontWeight: 'bold' }}>QTY</th>
              <th style={{ border: '1px solid black', padding: '12px 10px', width: '80px', textAlign: 'center', fontWeight: 'bold' }}>Bonus</th>
            </tr>
          </thead>
          <tbody>
            {safeDrugs.map((drug, index) => {
              if (!drug) return null;
              const displayName = drug.nameEn || drug.name || '---';
              const displayNameAr = drug.nameAr ? `./ ${drug.nameAr}` : '';
              return (
                <tr key={drug.id || index} style={{ pageBreakInside: 'avoid' }}>
                  <td style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ border: '1px solid black', padding: '10px', direction: 'ltr', textAlign: 'left' }}>
                    {displayName}{displayNameAr}
                  </td>
                  <td style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>{drug.companyName || drug.company || drug.supplier || ''}</td>
                  <td style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>{drug.qty || '0'}</td>
                  <td style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>{drug.bonus || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '10px' }}>
        <h2 style={{ fontSize: '24px', margin: 0, fontWeight: 'bold' }}>
          يجهز من مذخر:
        </h2>
        <div style={{ fontSize: '22px', marginTop: '10px' }}>
          {orderInfo && orderInfo.stockName ? orderInfo.stockName.split('/').map((s, i) => (
            <div key={i}>{s.trim()}</div>
          )) : '---'}
        </div>
      </div>
    </div>
  );
});

export default InvoiceTemplate;
