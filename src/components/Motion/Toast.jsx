<Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      background: isDarkMode ? '#1e293b' : '#ffffff',
      color: isDarkMode ? '#f1f5f9' : '#0f172a',
      borderRadius: 12,
      padding: '12px 16px',
      boxShadow: '0 20px 40px -10px rgba(0,0,0,.2)',
      border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
    },
    success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
    error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
  }}
/>