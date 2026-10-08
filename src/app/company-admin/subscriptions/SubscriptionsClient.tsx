'use client';

import { useEffect, useState } from 'react';
import BillingActions from '../settings/BillingActions';

type Payment = { id: string; amount: number; currency: string; status: string; description: string; dueAt: string | null; paidAt: string | null; createdAt: string };
type Subscription = { id: string; plan: string; seatCount: number; unitAmount: number; currency: string; interval: string; status: string; paymentMethodLabel: string | null; stripeCustomerId: string | null; currentPeriodEnd: string | null; payments: Payment[] };
type Data = { billing: { stripeConfigured: boolean }; company: { purchaseDate: string | null; subscriptions: Subscription[] } };

const card: React.CSSProperties = { background: '#fff', border: '1px solid #dbe5f1', borderRadius: '10px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)' };
const money = (amount: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
const formatDate = (value: string | null) => value ? new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not available';

export default function SubscriptionsClient() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/company-admin/settings', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load subscriptions.')))
      .then((json) => setData(json as Data))
      .catch((err: Error) => setError(err.message));
  }, []);
  if (error) return <p style={{ color: '#b91c1c' }}>{error}</p>;
  if (!data) return <p style={{ color: '#64748b' }}>Loading subscriptions...</p>;
  const subscription = data.company.subscriptions[0];
  if (!subscription) return <div style={{ ...card, padding: '2rem' }}><h1 style={{ margin: 0, color: '#102b4e' }}>Your Subscriptions</h1><p style={{ color: '#64748b' }}>No subscription is assigned to this workspace yet.</p></div>;

  const due = subscription.payments.find((payment) => payment.status === 'Pending');
  const isActive = subscription.status === 'Active';
  const total = subscription.seatCount * subscription.unitAmount;
  return <div style={{ maxWidth: '1280px', margin: '0 auto', color: '#102b4e' }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'start', borderBottom: '1px solid #dbe5f1', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}><div><h1 style={{ margin: 0, fontSize: '1.55rem' }}>Your Subscriptions</h1><p style={{ margin: '0.45rem 0 0', color: '#56709a' }}>Manage your active plan, payment method, and billing history.</p></div><span style={{ color: '#15803d', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}>System operational</span></header>
    <section style={{ ...card, overflow: 'hidden', marginBottom: '3rem' }}>
      <div style={{ padding: '2rem 2.5rem 1.5rem', display: 'flex', justifyContent: 'space-between', gap: '1.5rem', alignItems: 'start', flexWrap: 'wrap' }}><div><div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}><h2 style={{ margin: 0, fontSize: '1.45rem' }}>{subscription.plan} Plan</h2><span style={{ color: isActive ? '#2563eb' : '#b45309', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase' }}>{subscription.status}</span></div><p style={{ margin: '0.7rem 0 0', color: '#56709a', fontSize: '0.9rem' }}>Purchased on {formatDate(data.company.purchaseDate)}</p></div><BillingActions hasOutstandingPayment={Boolean(due)} hasCustomer={Boolean(subscription.stripeCustomerId)} stripeConfigured={data.billing.stripeConfigured} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', borderTop: '1px solid #dbe5f1', borderBottom: '1px solid #dbe5f1' }}>{[['Seats available', `${subscription.seatCount} Employees`], ['Billing interval', subscription.interval === 'month' ? 'Monthly cycle' : subscription.interval], ['Subscription price', `${money(total, subscription.currency)}/mo`]].map(([label, value], index) => <div key={label} style={{ padding: '1.5rem 2rem', borderRight: index < 2 ? '1px solid #dbe5f1' : undefined }}><div style={{ color: '#56709a', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.8rem' }}>{label}</div><strong style={{ fontSize: '1.2rem' }}>{value}</strong></div>)}</div>
      <div style={{ background: '#eff6ff', padding: '1.35rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}><div><div style={{ color: '#2563eb', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Default payment method</div><strong>{subscription.paymentMethodLabel || (subscription.stripeCustomerId ? 'Card on file' : 'No card added')}</strong></div><span style={{ color: due ? '#b45309' : '#56709a', fontWeight: 600 }}>{due ? `${money(due.amount, due.currency)} payment due` : isActive ? `Renews ${formatDate(subscription.currentPeriodEnd)}` : 'Add a card to activate your subscription'}</span></div>
    </section>
    <section><div style={{ marginBottom: '1.25rem' }}><h2 style={{ margin: 0, fontSize: '1.3rem' }}>Payment History</h2><p style={{ margin: '0.4rem 0 0', color: '#56709a' }}>Your complete billing and subscription transaction log.</p></div><div style={{ ...card, overflowX: 'auto' }}><table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse', fontSize: '0.9rem' }}><thead><tr style={{ textAlign: 'left', color: '#56709a', fontSize: '0.7rem', textTransform: 'uppercase' }}><th style={{ padding: '1rem 1.5rem' }}>Payment date</th><th>Plan</th><th>Employees</th><th>Amount</th><th>Status</th></tr></thead><tbody>{subscription.payments.map((payment) => <tr key={payment.id} style={{ borderTop: '1px solid #dbe5f1' }}><td style={{ padding: '1.2rem 1.5rem', fontWeight: 700 }}>{formatDate(payment.paidAt || payment.dueAt || payment.createdAt)}<div style={{ color: '#56709a', fontWeight: 400, fontSize: '0.8rem', marginTop: '0.25rem' }}>{payment.description}</div></td><td>{subscription.plan} Plan<div style={{ color: '#56709a', fontSize: '0.8rem', marginTop: '0.25rem' }}>Monthly billing</div></td><td>{subscription.seatCount}</td><td style={{ fontWeight: 700 }}>{money(payment.amount, payment.currency)}</td><td><span style={{ color: payment.status === 'Paid' ? '#15803d' : '#b45309', fontWeight: 800 }}>{payment.status}</span></td></tr>)}</tbody></table></div></section>
  </div>;
}
