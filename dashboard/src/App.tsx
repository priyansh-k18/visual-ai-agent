import { useState, useEffect } from 'react';
import { MousePointer2, Keyboard, Navigation, Image as ImageIcon, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('apiToken') || '');
  const [activities, setActivities] = useState<any[]>([]);
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // These endpoints need to be implemented on the backend
      const res = await fetch('http://localhost:3000/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities);
        setScreenshots(data.screenshots);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    localStorage.setItem('apiToken', token);
    if (token) fetchDashboard();
  }, [token]);

  const getIcon = (type: string) => {
    switch(type) {
      case 'click': return <MousePointer2 size={18} />;
      case 'keyboard': return <Keyboard size={18} />;
      case 'navigation': return <Navigation size={18} />;
      default: return <Search size={18} />;
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Visual AI Agent</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="password"
            className="input-field" 
            style={{ marginBottom: 0, width: '200px' }}
            placeholder="JWT Token"
            value={token}
            onChange={e => setToken(e.target.value)}
          />
          <button className="btn" onClick={fetchDashboard}>Refresh</button>
        </div>
      </header>

      <div className="grid">
        <div className="card glass-panel">
          <h2 className="card-title"><Search size={20} /> Recent Activity</h2>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="timeline">
              {activities.length === 0 ? <div className="timeline-meta">No activity found</div> : null}
              {activities.map((act) => (
                <div key={act.id} className="timeline-item">
                  <div className="timeline-icon">
                    {getIcon(act.type)}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-title">{act.type.toUpperCase()} - {act.title || act.url}</div>
                    <div className="timeline-meta">
                      {format(new Date(Number(act.timestamp)), 'MMM d, yyyy HH:mm:ss')}
                      {act.text && ` • "${act.text}"`}
                      {act.keyCount && ` • ${act.keyCount} keys`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card glass-panel">
          <h2 className="card-title"><ImageIcon size={20} /> Latest Captures</h2>
          <div className="screenshot-grid">
            {screenshots.map(shot => (
              <div key={shot.id} className="screenshot-card">
                <img src={`http://localhost:3000${shot.imagePath}`} alt={shot.title} className="screenshot-img" />
                <div className="screenshot-overlay">
                  <div>{format(new Date(Number(shot.timestamp)), 'HH:mm:ss')}</div>
                  <div style={{ color: '#60a5fa' }}>{shot.visionAnalysis?.summary?.substring(0, 40)}...</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
