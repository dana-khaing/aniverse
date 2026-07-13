"use client";

import { Check, RotateCcw, X } from "lucide-react";
import { emptyCreatorApplication, useLocalDemoState } from "@/lib/local-demo";

export function CreatorQueue() {
  const [application, setApplication] = useLocalDemoState("aniverse.creator-application", emptyCreatorApplication);
  return <section className="admin-queue">
    <div className="queue-head"><div><p>TRUST & PUBLISHING</p><h1>Creator applications</h1></div><button onClick={()=>setApplication(emptyCreatorApplication)}><RotateCcw size={15}/>Reset demo</button></div>
    {application.status === "draft" ? <div className="studio-empty"><h2>No submitted applications</h2><p>Complete the creator application to populate this queue.</p></div> : <article className="application-card"><header><span>{application.channelName.slice(0,2).toUpperCase()||"CR"}</span><div><h2>{application.channelName||"Creator application"}</h2><p>{application.legalName} · {application.status}</p></div></header><a href={application.portfolioUrl||"#"}>{application.portfolioUrl||"No portfolio supplied"}</a><p>{application.rightsSummary||"No rights summary supplied."}</p><footer><button className="reject" onClick={()=>setApplication({...application,status:"rejected"})}><X size={15}/>Reject</button><button onClick={()=>setApplication({...application,status:"approved"})}><Check size={15}/>Approve creator</button></footer></article>}
  </section>;
}
