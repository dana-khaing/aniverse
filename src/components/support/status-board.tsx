"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2 } from "lucide-react";

type Incident = { id:string; title:string; body:string; severity:string; status:string; affected_services:string[]; updated_at:string };

export function StatusBoard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const controller = new AbortController(); void fetch("/api/v1/status", { signal: controller.signal }).then(response => response.ok ? response.json() : Promise.reject()).then((data:{incidents:Incident[]}) => setIncidents(data.incidents)).catch(() => undefined).finally(() => setLoaded(true)); return () => controller.abort(); }, []);
  const active = incidents.filter(item => item.status !== "resolved");
  return <section className="status-board"><header className={active.length ? "degraded" : "operational"}>{active.length ? <Activity/> : <CheckCircle2/>}<div><p>PLATFORM STATUS</p><h2>{active.length ? "Some systems need attention" : "All systems operational"}</h2></div></header><div className="service-grid">{["Web app","Authentication","Playback","Creator Studio","Community","Notifications"].map(service => <article key={service}><b>{service}</b><span>{active.some(item => item.affected_services.includes(service)) ? "Affected" : "Operational"}</span></article>)}</div><div className="incident-list"><h2>Incident history</h2>{incidents.length ? incidents.map(item => <article key={item.id}><header><b>{item.title}</b><i>{item.status}</i></header><p>{item.body}</p><span>{item.severity} · {item.affected_services.join(", ")} · Updated {new Date(item.updated_at).toLocaleString()}</span></article>) : loaded ? <p>No published incidents.</p> : <p>Loading status…</p>}</div></section>;
}
