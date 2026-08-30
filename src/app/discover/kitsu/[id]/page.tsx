import { redirect } from "next/navigation";

export default async function DefaultKitsuDiscoveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/en/discover/kitsu/${id}`);
}
