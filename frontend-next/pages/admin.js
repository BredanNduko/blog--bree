import Head from 'next/head';

export default function Admin() {
  return (
    <>
      <Head>
        <title>Admin - Folio Blog</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div id="root"></div>
      <script src="/js/admin.js" defer></script>
    </>
  );
}

export async function getServerSideProps() {
  await import('../lib/database').then(({ getDb }) => getDb());
  return { props: {} };
}