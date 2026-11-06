import { useState, useEffect } from 'react';

// Replace with your actual backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export function useLivePulse() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPulse = async () => {
      try {
        const token = localStorage.getItem('access_token'); // Your JWT token
        
        const response = await fetch(`${API_BASE_URL}/analytics/live-pulse/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const json = await response.json();
          setData(json);
        }
      } catch (error) {
        console.error('Live pulse error:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately on mount
    fetchPulse();

    // Then poll every 10 seconds
    const interval = setInterval(fetchPulse, 10000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  return { data, loading };
}