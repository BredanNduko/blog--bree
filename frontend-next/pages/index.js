import Head from 'next/head';
import fs from 'fs';
import path from 'path';

export default function Home() {
  return (
    <>
      <Head>
        <title>Folio Blog</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div dangerouslySetInnerHTML={{ 
        __html: fs.readFileSync(path.join(process.cwd(), 'public', 'index.html'), 'utf8') 
      }} />
    </>
  );
}

export async function getServerSideProps() {
  // Initialize database on first load
  await import('../lib/database').then(({ getDb }) => getDb());
  return { props: {} };
}