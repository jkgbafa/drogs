import Document,{siteMetadata,siteViewport} from '../../components/Document';
import '../../../admin/admin.css';
import '../../../admin/role.css';
import '../../loading.css';
export const metadata={...siteMetadata,title:'D.R.O.G.S Office'};
export const viewport=siteViewport;
export default function OfficeLayout({children}){return <Document surface="admin">{children}</Document>;}
