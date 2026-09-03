import { redirect } from "next/navigation";

export default async function StudioPage({ params }: { params: Promise<{ studio: string }> }) {
  const { studio } = await params;
  redirect(`/en/studios/${encodeURIComponent(decodeURIComponent(studio))}`);
}
