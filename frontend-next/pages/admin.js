export default function Admin() {
  return (
    <div dangerouslySetInnerHTML={{
      __html: require('fs').readFileSync(require('path').join(process.cwd(), 'public', 'admin.html'), 'utf8')
    }} />
  );
}

export async function getServerSideProps() {
  await import('../lib/database').then(({ getDb }) => getDb());
  return { props: {} };
}