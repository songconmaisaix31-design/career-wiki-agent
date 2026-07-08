import { notFound } from "next/navigation";

import { CareerWikiWorkspace, type CareerWikiSection } from "@/components/career-wiki/career-wiki-workspace";
import { getCareerWikiData } from "@/lib/career-wiki/repository";

export const dynamic = "force-dynamic";

const sections: CareerWikiSection[] = ["profile", "projects", "skills", "jd-analyzer", "learning-tasks"];

export default async function CareerWikiSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as CareerWikiSection)) notFound();
  const data = await getCareerWikiData();
  return <CareerWikiWorkspace initialSection={section as CareerWikiSection} initialData={data} />;
}

