import React from 'react';
import NewPurchasesTable from '../NewPurchasesTable';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const styles = {
  container: {
    backgroundColor: '#0a0f1c', // Deep dark blue background
    minHeight: '100vh',
    padding: '2rem',
    fontFamily: '"Inter", sans-serif',
    color: '#e2e8f0',
  }
};

export default function PurchasesPage() {
  return (
    <div style={styles.container}>
      <NewPurchasesTable />
    </div>
  );
}
