import React, { useState, useEffect } from 'react';
import { Shield, AlertOctagon, Users, Radio } from 'lucide-react';
import { registerUser, loginUser, getFactionsOnce } from '../services/firebase';

export default function SignUp({ onComplete }) {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [factionId, setFactionId] = useState('free-roamer');
  const [factions, setFactions] = useState([]);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load available factions for the select list
    getFactionsOnce().then(data => {
      setFactions(data);
    }).catch(err => {
      console.warn("Could not load factions", err);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginUser(email, password);
        // App.jsx will detect auth change and call onComplete or render main view automatically
      } else {
        if (!username) {
          throw new Error('Username is required for registration.');
        }
        await registerUser(email, password, username, factionId);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Ensure Firebase is configured.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crt-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="crt-overlay" />
      <div className="crt-vignette" />
      <div className="crt-flicker" />

      <div className="cyber-panel primary-glow" style={{ width: '100%', maxWidth: '400px', padding: '24px', position: 'relative', zIndex: 10 }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Shield style={{ width: '32px', height: '32px', color: 'var(--color-primary)', margin: '0 auto 12px auto' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '20px', letterSpacing: '0.1em' }}>
            SECTOR-42 // TSOC
          </h1>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
            USER AUTHENTICATION UPLINK
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '10px', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '16px', borderRadius: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertOctagon style={{ width: '14px', height: '14px' }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>OPERATOR EMAIL</label>
            <input 
              type="email" 
              className="cyber-input" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px', fontSize: '12px' }}
              placeholder="operator@sector42.net"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>ACCESS CODE (PASSWORD)</label>
            <input 
              type="password" 
              className="cyber-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px', fontSize: '12px' }}
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>CALLSIGN (USERNAME)</label>
                <input 
                  type="text" 
                  className="cyber-input" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required={!isLogin}
                  style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                  placeholder="e.g. Sentinel-7"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>FACTION ALLIANCE</label>
                <select 
                  className="cyber-input" 
                  value={factionId} 
                  onChange={e => setFactionId(e.target.value)}
                  style={{ width: '100%', padding: '8px', fontSize: '12px', background: 'var(--bg-black)' }}
                >
                  <option value="free-roamer">Free Roamer (No Syndicate)</option>
                  {factions.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {factionId === 'free-roamer' ? <Radio style={{ width: '10px', height: '10px' }} /> : <Users style={{ width: '10px', height: '10px' }} />}
                  {factionId === 'free-roamer' 
                    ? 'Operate independently. Scores are not tracked on the global network.' 
                    : 'Join syndicate network. Contribute resources to climb the leaderboard.'}
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="cyber-btn" 
            disabled={loading}
            style={{ padding: '12px', fontSize: '12px', fontWeight: 'bold', marginTop: '8px', justifyContent: 'center' }}
          >
            {loading ? 'INITIALIZING UPLINK...' : (isLogin ? 'INITIATE LOGIN' : 'ESTABLISH CONNECTION')}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
          {isLogin ? "No active assignment?" : "Already registered?"}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer', marginLeft: '6px', fontFamily: 'inherit', fontSize: 'inherit' }}
          >
            {isLogin ? 'Request assignment (Sign up)' : 'Return to login'}
          </button>
        </div>

      </div>
    </div>
  );
}
