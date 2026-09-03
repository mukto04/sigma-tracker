'use client';

import React, { useState, useRef } from 'react';
import { updateCompanyLogo, updateUserAvatar, changePassword } from '@/app/actions/settings';

export function ImageUploadForm({ id, type, currentImage }: { id: string, type: 'company' | 'user', currentImage?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage('File too large. Maximum size is 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setLoading(true);
      setMessage('');
      
      let res;
      if (type === 'company') {
        res = await updateCompanyLogo(id, base64);
      } else {
        res = await updateUserAvatar(id, base64);
      }
      
      if (res?.error) {
        setMessage(res.error);
      } else {
        setMessage('Image updated successfully!');
      }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
      <div style={{ 
        width: '80px', height: '80px', borderRadius: type === 'user' ? '50%' : '8px', 
        backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        backgroundImage: currentImage ? `url(${currentImage})` : 'none',
        backgroundSize: 'cover', backgroundPosition: 'center'
      }}>
        {!currentImage && <span style={{ color: '#94a3b8', fontSize: '1.5rem' }}>{type === 'user' ? '👤' : '🏢'}</span>}
      </div>
      <div>
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600, color: '#334155', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          {loading ? 'Uploading...' : `Upload New ${type === 'company' ? 'Logo' : 'Profile Picture'}`}
        </button>
        {message && <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: message.includes('success') ? '#16a34a' : '#ef4444' }}>{message}</div>}
      </div>
    </div>
  );
}

export function ChangePasswordForm({ userId }: { userId: string }) {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const res = await changePassword(userId, oldPass, newPass);
    if (res?.error) {
      setMessage(res.error);
    } else {
      setMessage('Password changed successfully!');
      setOldPass('');
      setNewPass('');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Current Password</label>
        <input 
          type="password" 
          required 
          value={oldPass} 
          onChange={e => setOldPass(e.target.value)}
          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>New Password</label>
        <input 
          type="password" 
          required 
          minLength={6}
          value={newPass} 
          onChange={e => setNewPass(e.target.value)}
          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
        />
      </div>
      <button 
        type="submit" 
        disabled={loading}
        style={{ alignSelf: 'flex-start', padding: '0.6rem 1.25rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
      >
        {loading ? 'Updating...' : 'Change Password'}
      </button>
      {message && <div style={{ fontSize: '0.875rem', color: message.includes('success') ? '#16a34a' : '#ef4444' }}>{message}</div>}
    </form>
  );
}
