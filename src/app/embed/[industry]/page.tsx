import { CareerPlannerApp } from "@/components/career-planner-app";
import industriesData from "@/data/industries.json";
import { notFound } from "next/navigation";

interface EmbedPageProps {
  params: Promise<{ industry: string }>;
  searchParams: Promise<{ view?: string; theme?: string; readonly?: string; title?: string }>;
}

export default async function EmbedIndustryPage({ params, searchParams }: EmbedPageProps) {
  const { industry } = await params;
  const sp = await searchParams;
  const ind = industriesData.find((i) => i.id === industry);
  if (!ind) notFound();

  const title = sp.title?.trim() || `${ind.shortLabel} 檢核表`;

  return (
    <div className="min-h-screen bg-[#fbf8f3] p-4 text-ink">
      <div className="mx-auto max-w-5xl rounded-2xl border border-stone-200/70 bg-white/85 p-4 shadow-soft sm:p-6">
        <p className="text-[10px] uppercase tracking-[0.32em] text-stone-400">
          跨產業生涯與專案任務步驟 · 嵌入視圖
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {title}
        </h1>
        <p className="mt-1 text-xs text-stone-500">
          即時讀取自
          <code className="mx-1 rounded bg-stone-100 px-1 py-0.5 text-[10px]">
            src/data/industries.json
          </code>
          與
          <code className="mx-1 rounded bg-stone-100 px-1 py-0.5 text-[10px]">
            src/data/workflows.json
          </code>
          ；只要此專案內容更新，嵌入處即時跟進。
        </p>
      </div>
      <div className="mx-auto mt-4 max-w-5xl">
        <CareerPlannerApp embedded />
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return industriesData.map((i) => ({ industry: i.id }));
}

export const metadata = {
  title: "嵌入視圖",
  robots: { index: false, follow: false },
};
