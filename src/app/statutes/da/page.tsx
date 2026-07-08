import { StatutesPage } from "@/components/StatutesPage";

export const dynamic = "force-dynamic";

export default function StatutesDanish({
  searchParams,
}: {
  searchParams: Promise<{ include?: string; exclude?: string; year?: string; municipality?: string }>;
}) {
  return <StatutesPage locale="da" searchParams={searchParams} />;
}
