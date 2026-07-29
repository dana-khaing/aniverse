"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, FileCheck2, LoaderCircle } from "lucide-react";
import { legalVersion } from "@/lib/legal";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Record={id:number;consent_type:string;document_version:string;granted:boolean;source:string;recorded_at:string};
export function LegalConsentGate(){
  const[required,setRequired]=useState<string[]>([]);const[accepted,setAccepted]=useState(false);const[busy,setBusy]=useState(false);const[message,setMessage]=useState("");
  useEffect(()=>{if(!isSupabaseConfigured())return;const controller=new AbortController();void fetch("/api/v1/legal/consents",{cache:"no-store",signal:controller.signal}).then(async response=>response.ok?response.json():Promise.reject()).then((data:{records:Record[]})=>{const missing=["terms","privacy"].filter(type=>!data.records.some(record=>record.consent_type===type&&record.document_version===legalVersion&&record.granted));setRequired(missing)}).catch(()=>undefined);return()=>controller.abort()},[]);
  async function save(){setBusy(true);for(const type of required){const response=await fetch("/api/v1/legal/consents",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type,version:legalVersion,granted:true,source:"version_gate"})});if(!response.ok){setMessage("Your acknowledgement could not be recorded.");setBusy(false);return}}setRequired([]);setBusy(false)}
  if(!required.length)return null;
  return <div className="consent-gate" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="consent-title"><FileCheck2/><p>UPDATED POLICIES</p><h2 id="consent-title">Review AniVerse terms</h2><span>We updated the {required.join(" and ")} documents. Review and acknowledge version {legalVersion} to continue using your account.</span><div><Link href="/terms" target="_blank">Terms of Service</Link><Link href="/privacy" target="_blank">Privacy Policy</Link></div><label><input type="checkbox" checked={accepted} onChange={event=>setAccepted(event.target.checked)}/>I have reviewed and agree to the current Terms and acknowledge the Privacy Policy.</label><button disabled={!accepted||busy} onClick={()=>void save()}>{busy?<LoaderCircle className="spin"/>:<CheckCircle2/>}Continue</button>{message&&<small role="alert">{message}</small>}</section></div>
}

export function ConsentHistory(){
  const cloud=isSupabaseConfigured();const[records,setRecords]=useState<Record[]>(cloud?[]:[{id:1,consent_type:"terms",document_version:legalVersion,granted:true,source:"signup",recorded_at:"2026-07-27T12:00:00Z"},{id:2,consent_type:"privacy",document_version:legalVersion,granted:true,source:"signup",recorded_at:"2026-07-27T12:00:00Z"}]);const[loading,setLoading]=useState(cloud);
  const load=useCallback(async()=>{const response=await fetch("/api/v1/legal/consents",{cache:"no-store"});if(response.ok){const data=await response.json()as{records:Record[]};setRecords(data.records)}setLoading(false)},[]);
  useEffect(()=>{if(!cloud)return;const timer=setTimeout(()=>void load(),0);return()=>clearTimeout(timer)},[cloud,load]);
  return <div className="consent-history"><header><FileCheck2/><div><b>Legal consent history</b><span>Required consent can be withdrawn only by deleting your account.</span></div>{loading&&<LoaderCircle className="spin"/>}</header>{records.map(record=><article key={record.id}><div><b>{record.consent_type.replace("_"," ")}</b><span>Version {record.document_version} · {record.source.replace("_"," ")}</span></div><i>{record.granted?"Granted":"Withdrawn"}</i><time>{new Date(record.recorded_at).toLocaleString()}</time></article>)}</div>
}
