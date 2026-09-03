'use client';

import React, { useState, useTransition } from 'react';
import { softDeleteCompany, restoreCompany, hardDeleteCompany, editCompany } from './actions';
import { Button } from '@/components/ui/Button';

export default function CompanyActionButtons({ company }: { company: any }) {
  const [isPending, startTransition] = useTransition();
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  
  // Calculate remaining days for the edit modal
  let initialRemainingDays = 30;
  if (company.endDate) {
    const diffTime = new Date(company.endDate).getTime() - Date.now();
    initialRemainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (initialRemainingDays < 0) initialRemainingDays = 0;
  }
  
  const [editForm, setEditForm] = useState({
    name: company.name,
    employeeCount: company.paidSeats,
    validityDays: initialRemainingDays
  });

  const isDeleted = company.subscriptionStatus === 'Deleted';

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to move ${company.name} to the Trash Bin?`)) return;
    startTransition(async () => {
      await softDeleteCompany(company.id);
    });
  };

  const handleRestore = () => {
    startTransition(async () => {
      await restoreCompany(company.id);
    });
  };

  const handleHardDelete = () => {
    if (!confirm(`WARNING: This will permanently delete ${company.name} and all associated users. Are you sure?`)) return;
    startTransition(async () => {
      await hardDeleteCompany(company.id);
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await editCompany(company.id, editForm.name, editForm.employeeCount, editForm.validityDays);
      setEditModalOpen(false);
    });
  };

  const actionBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2rem',
    opacity: isPending ? 0.5 : 0.8,
    transition: 'opacity 0.2s',
  };

  return (
    <>
      {isDeleted ? (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            style={{...actionBtnStyle, fontSize: '1rem', background: '#3b82f6', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px'}} 
            onClick={handleRestore} 
            disabled={isPending}
            title="Restore"
          >
            ↺ Restore
          </button>
          <button 
            style={{...actionBtnStyle, fontSize: '1rem', background: '#ef4444', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px'}} 
            onClick={handleHardDelete} 
            disabled={isPending}
            title="Permanent Delete"
          >
            🗑️ Drop
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={actionBtnStyle} onClick={() => setEditModalOpen(true)} disabled={isPending} title="Edit">
            ✏️
          </button>
          <button style={actionBtnStyle} onClick={handleDelete} disabled={isPending} title="Delete">
            🗑️
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#111827', padding: '2rem', borderRadius: '16px', 
            width: '400px', border: '1px solid #1f2937', color: 'white'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>Edit Company Details</h3>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Company Name</label>
                <input 
                  type="text" 
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', outline: 'none' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Employee Count (Seats)</label>
                <input 
                  type="number" 
                  min="1"
                  value={editForm.employeeCount} 
                  onChange={e => setEditForm({...editForm, employeeCount: parseInt(e.target.value) || 1})}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Remaining Validity (Days)</label>
                <input 
                  type="number" 
                  min="0"
                  value={editForm.validityDays} 
                  onChange={e => setEditForm({...editForm, validityDays: parseInt(e.target.value) || 0})}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setEditModalOpen(false)}
                  style={{ background: 'transparent', border: '1px solid #334155', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <Button type="submit" disabled={isPending} style={{ backgroundColor: '#3b82f6', padding: '0.5rem 1.5rem' }}>
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
