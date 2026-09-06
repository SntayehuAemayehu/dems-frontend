// frontend/src/components/i18n/LanguageSelector.jsx
// UPDATED - Matches sidebar style

import React, { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';

const LanguageSelector = () => {
  const [languages, setLanguages] = useState([]);
  const [currentLang, setCurrentLang] = useState('en');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const defaultLanguages = [
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'am', name: 'Amharic', flag: '🇪🇹' },
      { code: 'or', name: 'Oromo', flag: '🇪🇹' },
      { code: 'ti', name: 'Tigrinya', flag: '🇪🇹' },
      { code: 'so', name: 'Somali', flag: '🇪🇹' },
    ];
    setLanguages(defaultLanguages);
    
    const savedLang = localStorage.getItem('language') || 'en';
    setCurrentLang(savedLang);
    
    // Try to fetch from backend
    const fetchLanguages = async () => {
      try {
        const response = await api.get('/analytics/i18n/languages/');
        if (response.data && response.data.languages) {
          setLanguages(response.data.languages);
        }
      } catch (error) {
        console.log('Using default languages');
      }
    };
    fetchLanguages();
  }, []);

  const changeLanguage = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem('language', langCode);
    setShowDropdown(false);
    
    document.documentElement.lang = langCode;
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: langCode }));
    
    const lang = languages.find(l => l.code === langCode);
    toast.success(`Language changed to ${lang?.name || langCode}`);
  };

  const current = languages.find(l => l.code === currentLang) || languages[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          cursor: 'pointer',
          color: '#475569',
          fontSize: '13px',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#3b82f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
        }}
      >
        <span style={{ fontSize: '16px' }}>{current?.flag}</span>
        <span style={{ fontWeight: 500, fontSize: '12px' }}>
          {current?.code?.toUpperCase()}
        </span>
        <ChevronDown size={14} style={{ 
          transition: 'transform 0.3s ease',
          transform: showDropdown ? 'rotate(180deg)' : 'none'
        }} />
      </button>

      {showDropdown && (
        <>
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99,
            }}
            onClick={() => setShowDropdown(false)}
          />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'white',
            borderRadius: '10px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0',
            zIndex: 100,
            minWidth: '180px',
            padding: '6px',
          }}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '8px 12px',
                  background: currentLang === lang.code ? '#f0fdf4' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: currentLang === lang.code ? '#16a34a' : '#0f172a',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = currentLang === lang.code ? '#dcfce7' : '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = currentLang === lang.code ? '#f0fdf4' : 'transparent';
                }}
              >
                <span style={{ fontSize: '20px' }}>{lang.flag}</span>
                <span style={{ flex: 1 }}>{lang.name}</span>
                {currentLang === lang.code && (
                  <Check size={16} color="#16a34a" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;