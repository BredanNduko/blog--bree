import Head from 'next/head';

export default function Admin() {
  return (
    <>
      <Head>
        <title>Admin - Folio Blog</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/css/admin.css" />
      </Head>
      <div id="admin-root">
        <header style={{ padding: '20px', background: '#333', color: 'white' }}>
          <h1>Admin Panel</h1>
        </header>
        <main style={{ padding: '20px' }}>
          <p>Login to access the admin panel.</p>
        </main>
      </div>
      <script src="/js/admin.js" defer></script>
    </>
  );
}