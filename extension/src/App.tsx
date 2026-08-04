import React, { useState, useEffect } from 'react';

export default function App() {
  const [token, setToken] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['apiToken'], (result: any) => {
      if (result.apiToken) {
        setToken(result.apiToken as string);
      }
    });
  }, []);

  const handleSave = () => {
    chrome.storage.local.set({ apiToken: token }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div style={{ width: '300px', padding: '16px', background: '#1e1e1e', color: '#fff', borderRadius: '8px' }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>Visual AI Agent</h2>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Backend API Token</label>
        <input 
          type="text" 
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter JWT Token"
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333', background: '#2d2d2d', color: '#fff', boxSizing: 'border-box' }}
        />
      </div>

      <button 
        onClick={handleSave}
        style={{ width: '100%', padding: '8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        {saved ? 'Saved!' : 'Save Token'}
      </button>

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#aaa', textAlign: 'center' }}>
        Activity and screenshots are recorded automatically in the background.
      </div>
    </div>
  );
}
