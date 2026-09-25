const basePath=process.env.NEXT_PUBLIC_BASE_PATH || '';
export const siteMetadata={
  title:'D.R.O.G.S',
  description:'D.R.O.G.S annual leadership commitment',
  icons:{icon:`${basePath}/assets/mitre-transparent.png`},
};
export const siteViewport={themeColor:'#0d242b'};
export default function Document({children,surface}){
  return <html lang="en"><body data-surface={surface}>
    {children}
    <noscript><p>Please enable JavaScript to use D.R.O.G.S.</p></noscript>
  </body></html>;
}
