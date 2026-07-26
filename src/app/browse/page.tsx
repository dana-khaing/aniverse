import {
  LocalizedBrowsePage,
  type BrowseParams,
} from "@/components/catalog/localized-browse-page";

export default function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<BrowseParams>;
}) {
  return <LocalizedBrowsePage locale="en" searchParams={searchParams} />;
}
