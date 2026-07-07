import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; municipality?: string }>;
}) {
  return <Dashboard locale="en" searchParams={searchParams} />;
}
