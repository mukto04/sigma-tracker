export const runtime = 'edge';

export default function NotFound() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      background: '#0d0d0d', 
      color: '#fff',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '4rem', margin: 0 }}>404</h1>
      <p style={{ color: '#737373' }}>Page not found</p>
      <a href="/" style={{ color: '#3b82f6', marginTop: '1rem' }}>Go Home</a>
    </div>
  );
}
