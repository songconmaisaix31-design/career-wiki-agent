import { OneClickCareerWorkspace } from "@/components/career-wiki/one-click-career-workspace";
import { getTestHarnessData } from "@/lib/career-wiki/test-harness-repository";

export const dynamic = "force-dynamic";

export default async function CareerWikiQuickStartPage() {
  return <OneClickCareerWorkspace initialData={await getTestHarnessData()} />;
}
