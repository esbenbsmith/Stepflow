import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default function HomeDanish({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; municipality?: string }>;
}) {
  return <Dashboard locale="da" searchParams={searchParams} />;
}
