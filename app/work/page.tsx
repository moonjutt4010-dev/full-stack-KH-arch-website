/* Reference photography is intentionally identified; these are not client projects. */
/* eslint-disable @next/next/no-img-element */
import PublicPage from "@/components/PublicPage";
import Link from "next/link";
export const metadata={title:"Design studies"};
const studies=[
 ["The quiet residence","Residential","photo-1600210492486-724fe5c67fb0","A direction for contemporary living: generous light, tactile surfaces, and a close relationship between interior and landscape."],
 ["Spaces for connection","Commercial","photo-1497366754035-f200968a6e72","Exploring the shared spaces of work. Flexible layouts, natural materials, and moments of calm create room for people to connect."],
 ["A softer interior","Interior design","photo-1600607687920-4e2a09cf159d","A study in atmosphere. Soft contrasts, warm textures, and carefully chosen details bring a quieter rhythm to everyday life."],
];
export default function WorkPage(){return <PublicPage eyebrow="A PERSPECTIVE ON PLACE" title="Spaces with a story." description="Explore three concept directions. These design studies use reference photography and are not presented as completed client commissions."><section className="section-wrap">{studies.map(([name,type,img,description],i)=><article className="study" id={`study-${i+1}`} key={name}><img src={`https://images.unsplash.com/${img}?auto=format&fit=crop&w=1100&q=85`} alt={`${type} reference: ${name}`} loading="lazy" width={1100} height={750}/><div className="body-copy"><div className="eyebrow">0{i+1} / {type.toUpperCase()} CONCEPT</div><h2>{name}</h2><p>{description}</p><Link href="/contact" className="text-link">Explore a similar direction →</Link><p className="image-note">Reference image via Unsplash.</p></div></article>)}</section></PublicPage>;}
