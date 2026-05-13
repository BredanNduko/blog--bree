import fs from 'fs';
import path from 'path';
import Head from 'next/head';

export default function Admin({ html }) {
  return (
    <>
      <Head>
        <title>Admin - Folio Blog</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

export async function getServerSideProps() {
  const htmlPath = path.join(process.cwd(), 'public', 'admin.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  
  await import('../lib/database').then(({ getDb }) => getDb());
  
  return { props: { html } };
}