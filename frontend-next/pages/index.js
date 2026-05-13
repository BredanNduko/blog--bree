import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Folio Blog</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div id="root"></div>
      <script src="/js/main.js" defer></script>
    </>
  );
}

export async function getServerSideProps() {
  await import('../lib/database').then(({ getDb }) => getDb());
  return { props: {} };
}