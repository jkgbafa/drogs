import Document,{siteMetadata,siteViewport} from '../../components/Document';
import '../../../styles.css';
import '../../../role.css';
import '../../loading.css';
export const metadata=siteMetadata;
export const viewport=siteViewport;
export default function PortalLayout({children}){
  const basePath=process.env.NEXT_PUBLIC_BASE_PATH||'';
  return <Document surface="portal">
    <header className="site-header"><a className="brand" href="#home" aria-label="D.R.O.G.S home"><span className="logo-crop"><img src={`${basePath}/assets/mitre-transparent.png`} alt="" /></span><span><strong>D.R.O.G.S</strong></span></a><div className="cycle"><span />2027 annual cycle</div></header>
    {children}
    <footer><span>D.R.O.G.S</span><span>Annual leadership commitment</span></footer>
  </Document>;
}
