import Document,{siteMetadata,siteViewport} from '../../components/Document';
import '../../registration/registration.css';
export const metadata=siteMetadata;
export const viewport=siteViewport;
export default function OfficeLayout({children}){return <Document surface="registration-office">{children}</Document>}
