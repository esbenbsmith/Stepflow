import { StatutesPage } from "@/components/StatutesPage";

export const dynamic = "force-dynamic";

export default function Statutes({
  searchParams,
}: {
  searchParams: Promise<{ include?: string; exclude?: string; year?: string; municipality?: string }>;
}) {
  return <StatutesPage locale="en" searchParams={searchParams} />;
}
