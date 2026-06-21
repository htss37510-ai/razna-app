import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialDrugs, fetchDrugs } from './data/initialDrugs';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const StateContext = createContext();

export const StateProvider = ({ children }) => {
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 1. Initial State for Drugs
  const [drugs, setDrugs] = useState(initialDrugs || []);

  // 2. Initial State for Cart
  const [cart, setCart] = useState({});

  // 3. Initial State for OrderInfo
  const [orderInfo, setOrderInfo] = useState({
    delegateName: 'عباس الربيعي',
    pharmacyName: '',
    pharmacyAddress: '',
    stockName: '',
    companyName: 'مكتب الرزان العلمي'
  });

  // 4. Initial State for Order History
  const [orderHistory, setOrderHistory] = useState([]);

  // Load data asynchronously and migrate from localStorage if needed
  useEffect(() => {
    const loadData = async () => {
      const loadOrMigrate = async (key, defaultVal) => {
        try {
          const result = await Filesystem.readFile({
            path: `${key}.json`,
            directory: Directory.Data,
            encoding: Encoding.UTF8
          });
          return JSON.parse(result.data);
        } catch (e) {
          // Not found or error: try migrating from localStorage
          const saved = localStorage.getItem(key);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              // Save it to filesystem now to complete migration
              await Filesystem.writeFile({
                path: `${key}.json`,
                data: saved,
                directory: Directory.Data,
                encoding: Encoding.UTF8
              });
              return parsed;
            } catch (err) {
              console.error(`Migration error for ${key}:`, err);
            }
          }
          return defaultVal;
        }
      };

      const loadedDrugs = await loadOrMigrate('razan_drugs', null);
      const loadedCart = await loadOrMigrate('razan_cart', {});
      const loadedInfo = await loadOrMigrate('razan_order_info', null);
      const loadedHistory = await loadOrMigrate('razan_order_history', []);

      // Validate and Set Drugs
      const defaultDrugs = initialDrugs || [];
      if (loadedDrugs && Array.isArray(loadedDrugs)) {
        const initialMap = new Map(defaultDrugs.map(d => [String(d.id), d]));
        const merged = [
          ...defaultDrugs,
          ...loadedDrugs.filter(d => d && d.id && !initialMap.has(String(d.id)))
        ];
        setDrugs(merged.filter(d => d && (d.name || d.nameEn)));
      }

      // Validate and Set Cart
      if (loadedCart && typeof loadedCart === 'object' && !Array.isArray(loadedCart)) {
        const cleaned = {};
        Object.keys(loadedCart).forEach(id => {
          const item = loadedCart[id];
          if (item) {
            cleaned[id] = {
              qty: Number(item.qty) || 0,
              bonus: String(item.bonus || '')
            };
          }
        });
        setCart(cleaned);
      }

      // Validate and Set Info
      if (loadedInfo && typeof loadedInfo === 'object' && !Array.isArray(loadedInfo)) {
        setOrderInfo(prev => ({ ...prev, ...loadedInfo, companyName: 'مكتب الرزان العلمي' }));
      }

      // Validate and Set History
      if (Array.isArray(loadedHistory)) {
        setOrderHistory(loadedHistory);
      }

      setIsDataLoaded(true);
    };

    loadData();
  }, []);

  // Persistent Savings using Filesystem
  useEffect(() => {
    if (!isDataLoaded) return;
    const save = async () => {
      try {
        await Filesystem.writeFile({
          path: 'razan_drugs.json',
          data: JSON.stringify(drugs),
          directory: Directory.Data,
          encoding: Encoding.UTF8
        });
      } catch (e) { console.error("Save Drugs Error:", e); }
    };
    save();
  }, [drugs, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const save = async () => {
      try {
        await Filesystem.writeFile({
          path: 'razan_cart.json',
          data: JSON.stringify(cart),
          directory: Directory.Data,
          encoding: Encoding.UTF8
        });
      } catch (e) { console.error("Save Cart Error:", e); }
    };
    save();
  }, [cart, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const save = async () => {
      try {
        await Filesystem.writeFile({
          path: 'razan_order_info.json',
          data: JSON.stringify(orderInfo),
          directory: Directory.Data,
          encoding: Encoding.UTF8
        });
      } catch (e) { console.error("Save Info Error:", e); }
    };
    save();
  }, [orderInfo, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const save = async () => {
      try {
        await Filesystem.writeFile({
          path: 'razan_order_history.json',
          data: JSON.stringify(orderHistory),
          directory: Directory.Data,
          encoding: Encoding.UTF8
        });
      } catch (e) { console.error("Save History Error:", e); }
    };
    save();
  }, [orderHistory, isDataLoaded]);

  const addToCart = (drugId, qty) => {
    if (!drugId) return;
    setCart(prev => ({
      ...prev,
      [drugId]: {
        qty: (prev[drugId]?.qty || 0) + (Number(qty) || 0),
        bonus: prev[drugId]?.bonus || ''
      }
    }));
  };

  const updateCartQty = (drugId, qty) => {
    if (qty <= 0) {
      const newCart = { ...cart };
      delete newCart[drugId];
      setCart(newCart);
    } else {
      setCart(prev => ({
        ...prev,
        [drugId]: { ...prev[drugId], qty: Number(qty) }
      }));
    }
  };

  const updateCartBonus = (drugId, bonus) => {
    setCart(prev => ({
      ...prev,
      [drugId]: { ...prev[drugId], bonus: String(bonus) }
    }));
  };

  const removeFromCart = (drugId) => {
    const newCart = { ...cart };
    delete newCart[drugId];
    setCart(newCart);
  };

  const addDrug = (drug) => {
    setDrugs(prev => [...prev, { ...drug, id: String(Date.now()) }]);
  };

  const updateDrug = (updatedDrug) => {
    setDrugs(prev => prev.map(d => d.id === updatedDrug.id ? updatedDrug : d));
  };

  const deleteDrug = (id) => {
    setDrugs(prev => prev.filter(d => d.id !== id));
  };

  const totalItems = Object.values(cart || {}).reduce((sum, item) => sum + (parseInt(item?.qty) || 0), 0);
  const totalTypes = Object.keys(cart || {}).length;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isOrderSaved, setIsOrderSaved] = useState(false);

  const saveOrder = (orderedDrugsList) => {
    if (!orderedDrugsList || orderedDrugsList.length === 0) return;
    
    const newOrder = {
      id: String(Date.now()),
      date: new Date().toISOString(),
      delegateName: orderInfo.delegateName || '',
      pharmacyName: orderInfo.pharmacyName || '',
      pharmacyAddress: orderInfo.pharmacyAddress || '',
      stockName: orderInfo.stockName || '',
      drugs: orderedDrugsList
    };

    setOrderHistory(prev => [newOrder, ...prev]);
  };

  const deleteOrders = (ids) => {
    if (!Array.isArray(ids)) return;
    setOrderHistory(prev => prev.filter(order => !ids.includes(order.id)));
  };

  const updateOrder = (updatedOrder) => {
    if (!updatedOrder || !updatedOrder.id) return;
    setOrderHistory(prev => prev.map(order => 
      order.id === updatedOrder.id ? updatedOrder : order
    ));
  };

  return (
    <StateContext.Provider value={{
      drugs, setDrugs,
      cart, setCart,
      orderInfo, setOrderInfo,
      orderHistory, setOrderHistory, saveOrder, deleteOrders, updateOrder,
      addToCart, updateCartQty, updateCartBonus, removeFromCart,
      addDrug, updateDrug, deleteDrug,
      totalItems, totalTypes,
      isDrawerOpen, setIsDrawerOpen,
      isOrderSaved, setIsOrderSaved,
      isDataLoaded,
      clearCart: () => {
        setCart({});
        setOrderInfo(prev => ({
          ...prev,
          delegateName: '',
          pharmacyName: '',
          pharmacyAddress: '',
          stockName: ''
        }));
        setIsOrderSaved(false);
      },
      importAllData: (data) => {
        if (data.drugs) setDrugs(data.drugs);
        if (data.cart) setCart(data.cart);
        if (data.orderInfo) setOrderInfo(prev => ({ ...prev, ...data.orderInfo }));
        if (data.orderHistory) setOrderHistory(data.orderHistory);
      }
    }}>
      {children}
    </StateContext.Provider>
  );
};

export const useStateValue = () => useContext(StateContext);
