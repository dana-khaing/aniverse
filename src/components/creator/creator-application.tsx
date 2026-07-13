"use client";

import Link from "next/link";
import { CheckCircle2, Send } from "lucide-react";
import {
  emptyCreatorApplication,
  useLocalDemoState,
} from "@/lib/local-demo";

export function CreatorApplicationForm() {
  const [application, setApplication] = useLocalDemoState(
    "aniverse.creator-application",
    emptyCreatorApplication,
  );

  if (application.status === "approved") {
    return <div className="creator-success"><CheckCircle2/><h2>You are approved</h2><p>Your creator workspace and publishing tools are ready.</p><Link href="/creator">Open creator studio</Link></div>;
  }

  if (application.status === "submitted") {
    return <div className="creator-success"><Send/><h2>Application submitted</h2><p>An administrator can review this application in the local admin queue.</p><Link href="/admin/creators">Open approval queue</Link></div>;
  }

  return <form className="creator-form" onSubmit={(event) => {
    event.preventDefault();
    setApplication((current) => ({...current,status:"submitted",submittedAt:new Date().toISOString()}));
  }}>
    <label>Channel or studio name<input required value={application.channelName} onChange={(event)=>setApplication({...application,channelName:event.target.value})}/></label>
    <label>Legal name<input required value={application.legalName} onChange={(event)=>setApplication({...application,legalName:event.target.value})}/></label>
    <label>Portfolio URL<input type="url" placeholder="https://" value={application.portfolioUrl} onChange={(event)=>setApplication({...application,portfolioUrl:event.target.value})}/></label>
    <label>Rights and ownership summary<textarea required rows={6} value={application.rightsSummary} onChange={(event)=>setApplication({...application,rightsSummary:event.target.value})} placeholder="Tell us what you create and confirm you control the distribution rights."/></label>
    {application.status === "rejected" ? <p className="form-alert">Revise the application and submit it again.</p> : null}
    <button><Send size={16}/>Submit application</button>
  </form>;
}
