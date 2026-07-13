"use client";

type SkillMaturity = "seed" | "practicing" | "verified" | "expert";
type SkillCategory = "operations" | "communication" | "content" | "tech" | "design";

export interface SkillsPanelSkill {
  id: string;
  name: string;
  category: SkillCategory;
  maturity: SkillMaturity;
  oneLiner: string;
  sourceTaskIds: string[];
  appliesToIndustryIds: string[];
}

export interface SkillTaskRef {
  industryId: string;
  industryShortLabel: string;
  taskId: string;
  taskTitle: string;
}

interface IndustryLite {
  id: string;
  shortLabel: string;
}

const CATEGORY_LABEL: Record<SkillCategory, string> = {
  operations: "營運",
  communication: "溝通",
  content: "內容",
  tech: "技術",
  design: "設計",
};

const MATURITY_RANK: Record<SkillMaturity, number> = {
  seed: 0,
  practicing: 1,
  verified: 2,
  expert: 3,
};

const MATURITY_LABEL: Record<SkillMaturity, string> = {
  seed: "種子",
  practicing: "練習中",
  verified: "已驗收",
  expert: "複產業專家",
};

const MATURITY_DOT: Record<SkillMaturity, string> = {
  seed: "○",
  practicing: "◐",
  verified: "●",
  expert: "★",
};

const MATURITY_BAR: Record<SkillMaturity, number> = {
  seed: 1,
  practicing: 2,
  verified: 3,
  expert: 4,
};

export function SkillsPanel({
  skills,
  industries,
  taskRefs,
  onJumpToIndustry,
}: {
  skills: SkillsPanelSkill[];
  industries: IndustryLite[];
  taskRefs: SkillTaskRef[];
  onJumpToIndustry: (industryId: string) => void;
}) {
  const sorted = [...skills].sort(
    (a, b) => MATURITY_RANK[b.maturity] - MATURITY_RANK[a.maturity]
  );
  const total = sorted.length;
  const expertCount = sorted.filter((s) => s.maturity === "expert").length;
  const verifiedCount = sorted.filter((s) => s.maturity === "verified").length;
  const practicingCount = sorted.filter((s) => s.maturity === "practicing").length;
  const seedCount = sorted.filter((s) => s.maturity === "seed").length;

  const grouped = new Map<SkillCategory, SkillsPanelSkill[]>();
  sorted.forEach((s) => {
    const list = grouped.get(s.category) ?? [];
    list.push(s);
    grouped.set(s.category, list);
  });

  return (
    <section className="rounded-[28px] border border-white/80 bg-white/68 p-6 shadow-soft backdrop-blur-md sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-400">核心資產</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">跨產業技能積累</h3>
          <p className="mt-2 max-w-xl text-sm leading-7 text-stone-600">
            這是把四個產業任務抽象出來的「可遷移能力」。送審 prompt 時會自動帶入，覆核者會據此避免重複教基本功。
          </p>
        </div>
        <p className="text-xs text-stone-500">共 {total} 項</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-xs text-stone-600">
        <span className="rounded-full bg-[#f6f1e9] px-3 py-1">
          ★ 複產業專家 {expertCount}
        </span>
        <span className="rounded-full bg-[#f6f1e9] px-3 py-1">
          ● 已驗收 {verifiedCount}
        </span>
        <span className="rounded-full bg-[#f6f1e9] px-3 py-1">
          ◐ 練習中 {practicingCount}
        </span>
        <span className="rounded-full bg-[#f6f1e9] px-3 py-1">
          ○ 種子 {seedCount}
        </span>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[...grouped.entries()].map(([category, items]) => (
          <div
            key={category}
            className="rounded-[20px] border border-stone-200/70 bg-white/85 p-4"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
              {CATEGORY_LABEL[category]}
            </p>
            <ul className="mt-3 space-y-3">
              {items.map((s) => {
                const targets = s.appliesToIndustryIds
                  .map((id) => industries.find((i) => i.id === id)?.shortLabel ?? id)
                  .join(" · ");
                const filled = MATURITY_BAR[s.maturity];
                const cells = [1, 2, 3, 4].map(
                  (n) => (n <= filled ? "bg-stone-700" : "bg-stone-200")
                );
                const linkedRefs = s.sourceTaskIds
                  .map((tid) => taskRefs.find((r) => r.taskId === tid))
                  .filter((r): r is SkillTaskRef => Boolean(r));
                return (
                  <li key={s.id} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-ink">
                        <span className="mr-1.5 text-stone-500">{MATURITY_DOT[s.maturity]}</span>
                        {s.name}
                      </p>
                      <span className="shrink-0 text-[11px] text-stone-500">
                        {MATURITY_LABEL[s.maturity]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {cells.map((cls, i) => (
                        <span key={i} className={["h-1.5 flex-1 rounded-full", cls].join(" ")} />
                      ))}
                    </div>
                    <p className="text-xs leading-6 text-stone-600">{s.oneLiner}</p>
                    <p className="text-[11px] text-stone-500">↗ 適用：{targets}</p>
                    {linkedRefs.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {linkedRefs.map((ref) => (
                          <button
                            key={`${ref.industryId}/${ref.taskId}`}
                            type="button"
                            onClick={() => onJumpToIndustry(ref.industryId)}
                            className="rounded-full border border-stone-200 bg-white/80 px-2 py-0.5 text-[10px] text-stone-600 transition hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white"
                            title={ref.taskTitle}
                          >
                            <span className="font-medium text-stone-700">
                              {ref.industryShortLabel}
                            </span>
                            <span className="mx-1 text-stone-300">·</span>
                            <span className="truncate">
                              {ref.taskTitle.length > 18
                                ? ref.taskTitle.slice(0, 18) + "…"
                                : ref.taskTitle}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}