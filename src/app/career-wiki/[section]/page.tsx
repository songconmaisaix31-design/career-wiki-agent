import { notFound } from "next/navigation";

import { CareerWikiWorkspace, type CareerWikiSection } from "@/components/career-wiki/career-wiki-workspace";
import { ResumeTailorHarness, type ResumeTailorHarnessSection } from "@/components/career-wiki/resume-tailor-harness";
import { getCareerWikiData } from "@/lib/career-wiki/repository";
import { getTestHarnessData } from "@/lib/career-wiki/test-harness-repository";

export const dynamic = "force-dynamic";

const sections: CareerWikiSection[] = ["profile", "projects", "skills", "jd-analyzer", "learning-tasks"];
const harnessSections: ResumeTailorHarnessSection[] = ["wiki-import", "resume-baseline", "resume-tests", "resume-tailor"];

export default async function CareerWikiSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (harnessSections.includes(section as ResumeTailorHarnessSection)) {
    const data = await getTestHarnessData();
    return <ResumeTailorHarness initialSection={section as ResumeTailorHarnessSection} initialData={data} />;
  }
  if (!sections.includes(section as CareerWikiSection)) notFound();
  const data = await getCareerWikiData();
  return <CareerWikiWorkspace initialSection={section as CareerWikiSection} initialData={data} />;
}
