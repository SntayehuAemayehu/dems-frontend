import React, { useState } from 'react';

const CAMPUSES = [
  {
    id: 'tulu-awuliya',
    name: 'Main Campus – Tulu Awuliya',
    query: '10.9854535,39.2631819',
  },
  {
    id: 'mekane-selam',
    name: 'Mekane Selam Campus',
    query: '10.7498601,38.737398',
  },
];

const ContactPage = () => {
  const [active, setActive] = useState(CAMPUSES[0]);

  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(active.query)}&z=15&output=embed`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(active.query)}`;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '100px 16px 40px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Mekdela Amba University – Location
      </h1>
      <p style={{ marginBottom: 16 }}>Choose a campus to see it on the map.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {CAMPUSES.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #2563eb',
              background: active.id === c.id ? '#2563eb' : 'transparent',
              color: active.id === c.id ? '#fff' : '#2563eb',
              cursor: 'pointer',
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      <iframe
        key={active.id}
        title={active.name}
        src={mapSrc}
        width="100%"
        height="450"
        style={{ border: 0, borderRadius: 12 }}
        loading="lazy"
        allowFullScreen
      />

      <p style={{ marginTop: 12 }}>
        <a href={directionsUrl} target="_blank" rel="noreferrer">
          Open in Google Maps / get directions →
        </a>
      </p>
    </div>
  );
};

export default ContactPage;