import fs from 'fs';
import path from 'path';
import Head from 'next/head';

export default function Home({ html }) {
  return (
    <>
      <Head>
        <title>Folio Blog</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

export async function getServerSideProps() {
  const htmlPath = path.join(process.cwd(), 'public', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  
  await import('../lib/database').then(({ getDb }) => getDb());
  
  return { props: { html } };
}