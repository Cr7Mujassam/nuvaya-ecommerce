import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axiosClient.post('/admin/auth/login', { username, password });
      sessionStorage.setItem('nuvaya_admin_jwt', data.token);
      navigate('/admin');
    } catch {
      setError('Invalid admin credentials');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '90px auto', padding: 28, background: '#fff', borderRadius: 14, border: '1px solid var(--border-sand)' }}>
      <h1 style={{ fontSize: '1.9rem', marginBottom: 6 }}>NUVAYA Admin</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 20 }}>Sign in to manage catalog, orders & WhatsApp store settings.</p>
      {error && <div style={{ color: '#9E2A2B', marginBottom: 12, fontSize: '0.88rem' }}>{error}</div>}
      <form onSubmit={handleLogin} style={{ display: 'grid', gap: 14 }}>
        <input required placeholder="Admin Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border-sand)' }} />
        <input required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border-sand)' }} />
        <button type="submit" className="btn-primary">Sign In</button>
      </form>
    </div>
  );
}
