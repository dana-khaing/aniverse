import Link from "next/link";
import { CircleCheck, HeartHandshake } from "lucide-react";
import { PublicHeader } from "@/components/catalog/public-header";
export default function TipSuccessPage(){return <><PublicHeader/><main className="payment-result"><CircleCheck/><p>TIP RECEIVED</p><h1>Thank you for supporting animation.</h1><span>Stripe is confirming your payment. Your note will appear in the supporter feed after the verified webhook arrives.</span><div><Link href="/browse"><HeartHandshake/>Discover more stories</Link><Link href="/library">Return to library</Link></div></main></>}
