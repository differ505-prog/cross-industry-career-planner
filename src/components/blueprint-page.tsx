"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type MilestoneStatus = "done" | "deferred";

interface UiColumn {
  slot: string;
  label: string;
  description: string;
}

interface MilestoneItem {
  id: string;
  title: string;
  status: MilestoneStatus;
  summary: string;
  proof?: string;
  deferredReason?: string;
}

interface BlueprintHero {
  kind: "hero";
  title: string;
  subtitle: string;
  tagline: string;
  principle: string;
}

interface BlueprintPrinciple {
  kind: "principle_block";
  title: string;
  paragraphs: string[];
}

interface BlueprintTable {
  kind: "table_section";
  id: string;
  title: string;
  caption: string;
  columns: string[];
  rows: string[][];
}

interface BlueprintUiProgression {
  kind: "ui_progression";
  title: string;
  original: { heading: string; columns: UiColumn[] };
  current: { heading: string; columns: UiColumn[]; footnote: string };
}

interface BlueprintMilestones {
  kind: "milestones";
  title: string;
  caption: string;
  items: MilestoneItem[];
}

type BlueprintBlock =
  | BlueprintHero
  | BlueprintPrinciple
  | BlueprintTable
  | BlueprintUiProgression
  | BlueprintMilestones;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const statusMeta: Record<MilestoneStatus, { label: string; chip: string; bar: string }> = {
  done: {
    label: "已完成",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-500",
  },
  deferred: {
    label: "待開發",
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    bar: "bg-amber-400",
  },
};

export function BlueprintPage({ blocks }: { blocks: BlueprintBlock[] }) {
  const hero = blocks.find((b): b is BlueprintHero => b.kind === "hero");
  const principle = blocks.find((b): b is BlueprintPrinciple => b.kind === "principle_block");
  const stack = blocks.find((b): b is BlueprintTable => b.kind === "table_section" && b.id === "stack");
  const uiProgression = blocks.find((b): b is BlueprintUiProgression => b.kind === "ui_progression");
  const milestones = blocks.find((b): b is BlueprintMilestones => b.kind === "milestones");

  if (!hero || !stack || !uiProgression || !milestones) {
    return (
      <div className="min-h-screen bg-[#fbf8f3] p-8 text-ink">
        <p className="text-stone-500">blueprint.json 缺少必要區塊，請檢查資料檔。</p>
      </div>
    );
  }

  const doneCount = milestones.items.filter((m) => m.status === "done").length;

  return (
    <motion.main
      className="min-h-screen bg-[#fbf8f3] px-5 py-10 text-ink sm:px-8 sm:py-14"
    >
      <div className="mx-auto max-w-3xl">
        {/* 麵包屑 / 回首頁 */}
        <motion.div variants={itemVariants} className="mb-8 flex items-center gap-3 text-xs">
          <Link
            href="/"
            className="rounded-full border border-stone-200 bg-white px-3 py-1 text-stone-500 transition hover:border-stone-300 hover:text-ink"
          >
            ← 回到主站
          </Link>
          <span className="uppercase tracking-[0.28em] text-stone-400">Roadmap</span>
        </motion.div>

        {/* Hero */}
        <motion.section variants={itemVariants} className="mb-14">
          <p className="text-[11px] uppercase tracking-[0.36em] text-amber-700/80">
            {hero.subtitle}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-stone-600 sm:text-lg">
            {hero.tagline}
          </p>
          <div className="mt-7 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/70 to-white p-5 text-sm leading-relaxed text-stone-700 sm:text-base">
            <span className="mr-2 text-amber-700">●</span>
            {hero.principle}
          </div>
        </motion.section>

        {/* 整體定位 */}
        {principle && (
          <motion.section variants={itemVariants} className="mb-14">
            <SectionTitle>{principle.title}</SectionTitle>
            <div className="mt-5 space-y-3 text-[15px] leading-loose text-stone-700">
              {principle.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </motion.section>
        )}

        {/* 技術架構表 */}
        <motion.section variants={itemVariants} className="mb-14">
          <SectionTitle>{stack.title}</SectionTitle>
          <p className="mt-3 text-sm text-stone-500">{stack.caption}</p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200/70 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.18em] text-stone-500">
                <tr>
                  {stack.columns.map((c) => (
                    <th key={c} className="px-5 py-3 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {stack.rows.map((row, i) => (
                  <tr key={i} className="text-stone-700">
                    {row.map((cell, j) => (
                      <td key={j} className={`px-5 py-3 ${j === 0 ? "font-medium text-ink" : ""}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* UI 演進：早期藍圖 → 現在 */}
        <motion.section variants={itemVariants} className="mb-14">
          <SectionTitle>{uiProgression.title}</SectionTitle>

          {/* 早期 */}
          <div className="mt-7 rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 p-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-stone-400">
              {uiProgression.original.heading}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {uiProgression.original.columns.map((col) => (
                <ColumnCard key={col.slot} col={col} variant="ghost" />
              ))}
            </div>
          </div>

          {/* 箭頭 */}
          <div className="my-5 flex items-center justify-center gap-2 text-xs text-amber-700">
            <span className="h-px flex-1 bg-amber-200" />
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium">
              實作後長成 ↓
            </span>
            <span className="h-px flex-1 bg-amber-200" />
          </div>

          {/* 現在 */}
          <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/40 to-white p-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-amber-700">
              {uiProgression.current.heading}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {uiProgression.current.columns.map((col) => (
                <ColumnCard key={col.slot} col={col} variant="solid" />
              ))}
            </div>
            <p className="mt-4 rounded-xl bg-white/70 p-3 text-[13px] leading-relaxed text-stone-600">
              {uiProgression.current.footnote}
            </p>
          </div>
        </motion.section>

        {/* 里程碑 */}
        <motion.section variants={itemVariants} className="mb-14">
          <SectionTitle>{milestones.title}</SectionTitle>
          <p className="mt-3 text-sm text-stone-500">{milestones.caption}</p>

          {/* 進度小條 */}
          <div className="mt-5 flex items-center gap-3 text-sm text-stone-500">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-stone-200">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(doneCount / milestones.items.length) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full rounded-full bg-emerald-500"
              />
            </div>
            <span>
              <span className="font-semibold text-ink">{doneCount}</span> / {milestones.items.length} 已完成
            </span>
          </div>

          {/* 時間軸 */}
          <ol className="relative mt-8 space-y-6 border-l border-stone-200 pl-6">
            {milestones.items.map((m, i) => {
              const meta = statusMeta[m.status];
              return (
                <motion.li
                  key={m.id}
                  variants={itemVariants}
                  className="relative"
                >
                  {/* 節點 */}
                  <span
                    className={`absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-[#fbf8f3] ${
                      m.status === "done" ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                  />
                  <div className="rounded-xl border border-stone-200/70 bg-white p-5 shadow-sm transition hover:shadow-soft">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">
                          {m.id}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-ink sm:text-lg">
                          {m.title}
                        </h3>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${meta.chip}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-stone-600">
                      {m.summary}
                    </p>
                    {m.proof && (
                      <p className="mt-2 text-[12px] leading-relaxed text-emerald-700">
                        <span className="mr-1">▸</span>驗證：{m.proof}
                      </p>
                    )}
                    {m.deferredReason && (
                      <p className="mt-2 text-[12px] leading-relaxed text-amber-700">
                        <span className="mr-1">▸</span>為什麼暫緩：{m.deferredReason}
                      </p>
                    )}
                  </div>
                  {i === milestones.items.length - 1 && (
                    <span className="absolute -left-[26px] top-3 h-3 w-3 rounded-full bg-[#fbf8f3]" />
                  )}
                </motion.li>
              );
            })}
          </ol>
        </motion.section>

        {/* 頁尾 */}
        <motion.section
          variants={itemVariants}
          className="mt-16 border-t border-stone-200 pt-8 text-[13px] text-stone-500"
        >
          <p>
            這頁是這個專案的「未來地圖」，不是寫完就丟。每完成一個里程碑會回來更新狀態。
          </p>
          <p className="mt-2">
            <Link href="/" className="text-amber-700 underline-offset-2 hover:underline">
              → 回到主站看現況
            </Link>
          </p>
        </motion.section>
      </div>
    </motion.main>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-baseline gap-3 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
      <span className="inline-block h-5 w-1.5 rounded-full bg-amber-500" />
      {children}
    </h2>
  );
}

function ColumnCard({
  col,
  variant,
}: {
  col: UiColumn;
  variant: "ghost" | "solid";
}) {
  if (variant === "ghost") {
    return (
      <div className="rounded-xl border border-stone-200 bg-white/60 p-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">
          {col.slot}
        </p>
        <p className="mt-1.5 text-sm font-medium text-stone-700">{col.label}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-stone-500">
          {col.description}
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-amber-200/70 bg-white p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-amber-700">
        {col.slot}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-ink">{col.label}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-stone-600">
        {col.description}
      </p>
    </div>
  );
}
