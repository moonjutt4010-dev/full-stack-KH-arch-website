import Header from "./Header";
import Footer from "./Footer";
export default function PublicPage({eyebrow,title,description,children}:{eyebrow:string;title:string;description:string;children:React.ReactNode}) {
 return <><Header /><main><section className="page-heading"><div className="eyebrow"><span className="small-line" />{eyebrow}</div><h1>{title}</h1><p>{description}</p></section>{children}</main><Footer /></>;
}
