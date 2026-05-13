import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Folio Blog</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/css/main.css" />
      </Head>
      <div id="root">
        <header style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
          <h1>Folio Blog</h1>
          <nav>
            <a href="/">Home</a> | <a href="/admin">Admin</a>
          </nav>
        </header>
        <main style={{ padding: '20px' }}>
          <p>Welcome to the blog. Loading content...</p>
        </main>
      </div>
      <script src="/js/main.js" defer></script>
    </>
  );
}