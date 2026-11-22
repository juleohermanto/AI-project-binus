import Header from '../components/Header';

export default function Garden() {
  return (
    <>
      <Header />
      <main className="page" style={{ paddingTop: 42 }}>
        <h1 className="serif" style={{ fontSize: 40 }}>My garden</h1>
        <p style={{ marginTop: 8, color: 'var(--muted)' }}>Design coming soon.</p>
      </main>
    </>
  );
}