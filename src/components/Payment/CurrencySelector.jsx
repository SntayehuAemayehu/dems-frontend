// src/components/Payments/CurrencySelector.jsx
// COMPLETE CURRENCY SELECTOR COMPONENT

import React, { useState, useEffect } from 'react';
import { DollarSign, ChevronDown } from 'lucide-react';
import api from '../../api/api';

const CurrencySelector = () => {
  const [currencies, setCurrencies] = useState([]);
  const [currentCurrency, setCurrentCurrency] = useState('ETB');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Fetch currencies from backend or use defaults
    const defaultCurrencies = [
      { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', country: 'Ethiopia', flag: '🇪🇹' },
      { code: 'USD', name: 'US Dollar', symbol: '$', country: 'United States', flag: '🇺🇸' },
      { code: 'EUR', name: 'Euro', symbol: '€', country: 'European Union', flag: '🇪🇺' },
      { code: 'GBP', name: 'British Pound', symbol: '£', country: 'United Kingdom', flag: '🇬🇧' },
    ];
    setCurrencies(defaultCurrencies);
    
    const saved = localStorage.getItem('currency') || 'ETB';
    setCurrentCurrency(saved);
  }, []);

  const changeCurrency = (code) => {
    setCurrentCurrency(code);
    localStorage.setItem('currency', code);
    setShowDropdown(false);
    
    // Dispatch event for other components to update
    window.dispatchEvent(new CustomEvent('currencyChanged', { detail: code }));
  };

  const current = currencies.find(c => c.code === currentCurrency) || currencies[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          background: '#f1f5f9',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          color: '#475569',
          fontSize: '14px',
        }}
      >
        <DollarSign size={16} />
        {current?.flag} {current?.symbol}
        <ChevronDown size={14} />
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid #e2e8f0',
          zIndex: 100,
          minWidth: '200px',
          padding: '8px',
        }}>
          {currencies.map((currency) => (
            <button
              key={currency.code}
              onClick={() => changeCurrency(currency.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                background: currentCurrency === currency.code ? '#f0f9ff' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#0f172a',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.background = currentCurrency === currency.code ? '#f0f9ff' : 'transparent'}
            >
              <span style={{ fontSize: '20px' }}>{currency.flag}</span>
              <div>
                <div style={{ fontWeight: 'bold' }}>{currency.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{currency.symbol} ({currency.code})</div>
              </div>
              {currentCurrency === currency.code && <span style={{ marginLeft: 'auto', color: '#3b82f6' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;