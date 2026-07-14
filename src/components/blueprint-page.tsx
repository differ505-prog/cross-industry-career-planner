"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type MilestoneStatus = "done" | "deferred";

interface StackRule {
  axis: string;
  rule: string;
  why: string;
}

interface ExecutionTab {
  tab: string;
  name: string;
  description: string;
}

interface ExecutionLane {
  slot: string;
  label: string;
  description: string;
  tabs?: ExecutionTab[];
}

interface SchemaSpec {
  label: string;
  format: string;
}

interface MilestoneSubTask {
  id: string;
  name: string;
  items: string[];
}

interface MilestoneItem {
  id: string;
  title: string;
  executor?: string;
  status: MilestoneStatus;
  summary: string;
  validation?: string;
  tasks?: MilestoneSubTask[];
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

interface BlueprintStackDeclaration {
  kind: "stack_declaration";
  title: string;
  caption: string;
  rules: StackRule[];
}

interface BlueprintExecutionFlow {
  kind: "execution_flow";
  title: string;
  caption: string;
  lanes: ExecutionLane[];
}

interface BlueprintSchema {
  kind: "schema_block";
  title: string;
  caption: string;
  schemas: SchemaSpec[];
}

interface BlueprintMilestones {
  kind: "milestones";
  title: string;
  caption: string;
  items: MilestoneItem[];
}

interface GameMilestone {
  title: string;
  metric: string;
  condition: string;
}

interface GameLevel {
  level: string;
  title: string;
  summary: string;
  tasks: string[];
  milestone: GameMilestone | null;
}

interface BlueprintGameGuide {
  kind: "game_guide";
  title: string;
  subtitle: string;
  intro: string;
  levels: GameLevel[];
}

type BlueprintBlock =
  | BlueprintHero
  | BlueprintPrinciple
  | BlueprintStackDeclaration
  | BlueprintExecutionFlow
  | BlueprintSchema
  | BlueprintMilestones
  | BlueprintGameGuide;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const statusMeta: Record<MilestoneStatus, { label: string; chip: string; bar: string; node: string }> = {
  done: {
    label: "已完成",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-500",
    node: "bg-emerald-500",
  },
  deferred: {
    label: "待開發",
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    bar: "bg-amber-400",
    node: "bg-amber-400",
  },
};

export function BlueprintPage({ blocks }: { blocks: BlueprintBlock[] }) {
  const hero = blocks.find((b): b is BlueprintHero => b.kind === "hero")!;
  const principle = blocks.find((b): b is BlueprintPrinciple => b.kind === "principle_block");
  const stack = blocks.find(
    (b): b is BlueprintStackDeclaration => b.kind === "stack_declaration",
  )!;
  const flow = blocks.find(
    (b): b is BlueprintExecutionFlow => b.kind === "execution_flow",
  )!;
  const schema = blocks.find((b): b is BlueprintSchema => b.kind === "schema_block");
  const milestones = blocks.find((b): b is BlueprintMilestones => b.kind === "milestones")!;
  const gameGuide = blocks.find((b): b is BlueprintGameGuide => b.kind === "game_guide");
  const doneCount = milestones.items.filter((m) => m.status === "done").length;

  return (
    <motion.main className="min-h-screen bg-[#fbf8f3] px-5 py-10 text-ink sm:px-8 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <motion.div variants={itemVariants} className="mb-8 flex items-center gap-3 text-xs">
          <Link
            href="/"
            className="rounded-full border border-stone-200 bg-white px-3 py-1 text-stone-500 transition hover:border-stone-300 hover:text-ink"
          >
            ← 回到主站
          </Link>
          <span className="uppercase tracking-[0.28em] text-stone-400">Roadmap</span>
        </motion.div>

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

        {/* 技術架構宣告 */}
        <motion.section variants={itemVariants} className="mb-14">
          <SectionTitle>{stack.title}</SectionTitle>
          <p className="mt-3 text-sm text-stone-500">{stack.caption}</p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200/70 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.18em] text-stone-500">
                <tr>
                  <th className="px-5 py-3 font-medium">面向</th>
                  <th className="px-5 py-3 font-medium">規定</th>
                  <th className="px-5 py-3 font-medium">為什麼這樣</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {stack.rules.map((r, i) => (
                  <tr key={i} className="text-stone-700">
                    <td className="px-5 py-3 font-medium text-ink">{r.axis}</td>
                    <td className="px-5 py-3">{r.rule}</td>
                    <td className="px-5 py-3">{r.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* UI 三欄 + Tabs */}
        <motion.section variants={itemVariants} className="mb-14">
          <SectionTitle>{flow.title}</SectionTitle>
          <p className="mt-3 text-sm text-stone-500">{flow.caption}</p>
          <div className="mt-6 space-y-4">
            {flow.lanes.map((lane, i) => (
              <div
                key={i}
                className="rounded-2xl border border-stone-200/70 bg-white p-5"
              >
                <div className="flex items-baseline gap-3">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-stone-400">
                    {lane.slot}
                  </span>
                  <h3 className="text-base font-semibold text-ink">{lane.label}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {lane.description}
                </p>
                {lane.tabs && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {lane.tabs.map((t, j) => (
                      <div
                        key={j}
                        className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-3"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-700">
                          {t.tab}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-ink">{t.name}</p>
                        <p className="mt-1 text-[12px] leading-relaxed text-stone-600">
                          {t.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.section>

        {/* JSON Schema */}
        {schema && (
          <motion.section variants={itemVariants} className="mb-14">
            <SectionTitle>{schema.title}</SectionTitle>
            <p className="mt-3 text-sm text-stone-500">{schema.caption}</p>
            <div className="mt-5 space-y-3">
              {schema.schemas.map((s, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-stone-200/70 bg-white p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                    {s.label}
                  </p>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-stone-900 px-3 py-2 text-[12px] leading-relaxed text-amber-100 sm:text-[13px]">
                    <code>{s.format}</code>
                  </pre>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* 里程碑 */}
        <motion.section variants={itemVariants} className="mb-14">
          <SectionTitle>{milestones.title}</SectionTitle>
          <p className="mt-3 text-sm text-stone-500">{milestones.caption}</p>

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

          <ol className="relative mt-8 space-y-6 border-l border-stone-200 pl-6">
            {milestones.items.map((m, i) => {
              const meta = statusMeta[m.status];
              return (
                <motion.li key={m.id} variants={itemVariants} className="relative">
                  <span
                    className={`absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-[#fbf8f3] ${meta.node}`}
                  />
                  <div className="rounded-xl border border-stone-200/70 bg-white p-5 shadow-sm transition hover:shadow-soft">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">
                          {m.id}
                          {m.executor && <span className="ml-2 text-stone-400">· {m.executor}</span>}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-ink sm:text-lg">
                          {m.title}
                        </h3>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${meta.chip}`}>
                        {meta.label}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-stone-600">{m.summary}</p>

                    {m.validation && (
                      <div className="mt-3 rounded-lg border border-emerald-200/60 bg-emerald-50/50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
                          🎯 量化驗收目標
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-stone-700">
                          {m.validation}
                        </p>
                      </div>
                    )}

                    {m.tasks && m.tasks.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                          子任務
                        </p>
                        {m.tasks.map((t) => (
                          <div
                            key={t.id}
                            className="rounded-lg border border-stone-200/60 bg-stone-50/50 p-3"
                          >
                            <p className="text-[12px] font-semibold text-ink">
                              {t.id}：{t.name}
                            </p>
                            <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-stone-700">
                              {t.items.map((item, k) => (
                                <li key={k} className="flex gap-2">
                                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {m.deferredReason && (
                      <p className="mt-3 rounded-lg border border-amber-200/60 bg-amber-50/40 p-3 text-[13px] leading-relaxed text-amber-800">
                        <span className="mr-1">⏸</span>
                        <span className="font-semibold">為什麼延遲：</span>
                        {m.deferredReason}
                      </p>
                    )}

                    {m.proof && (
                      <p className="mt-3 text-[12px] leading-relaxed text-emerald-700">
                        <span className="mr-1">▸</span>驗證：{m.proof}
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

        {/* 任務管理 SaaS 實戰破關指南 */}
        {gameGuide && (
          <motion.section variants={itemVariants} className="mb-14">
            <SectionTitle>{gameGuide.title}</SectionTitle>
            <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-amber-700">
              {gameGuide.subtitle}
            </p>
            <div className="mt-5 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/70 to-white p-5 text-sm leading-relaxed text-stone-700">
              {gameGuide.intro}
            </div>

            <ol className="relative mt-8 space-y-8 border-l border-stone-200 pl-6">
              {gameGuide.levels.map((level, i) => (
                <motion.li key={level.level} variants={itemVariants} className="relative">
                  <span
                    className={`absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-[#fbf8f3] bg-amber-500`}
                  />
                  <div className="rounded-xl border border-stone-200/70 bg-white p-5 shadow-sm transition hover:shadow-soft">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">
                          {level.level}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-ink sm:text-lg">
                          {level.title}
                        </h3>
                      </div>
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-stone-600">{level.summary}</p>

                    <div className="mt-4 space-y-2">
                      {level.tasks.map((task, j) => {
                        if (task.startsWith("[ ]")) {
                          return (
                            <div key={j} className="flex gap-2 rounded-lg border border-stone-200/60 bg-stone-50/50 p-3">
                              <span className="mt-1 h-4 w-4 shrink-0 rounded border border-stone-300 bg-white" />
                              <span className="text-[13px] leading-relaxed text-stone-700">{task.slice(4)}</span>
                            </div>
                          );
                        }
                        if (task.startsWith("(🎯")) {
                          return (
                            <div key={j} className="rounded-lg border border-blue-200/60 bg-blue-50/40 p-3">
                              <span className="text-[12px] leading-relaxed text-stone-600">{task}</span>
                            </div>
                          );
                        }
                        if (task.startsWith("⚠️") || task.startsWith("🛡️") || task.startsWith("👑") || task.startsWith("🧽") || task.startsWith("🧪") || task.startsWith("🚀") || task.startsWith("🕸️") || task.startsWith("📈") || task.startsWith("⚡") || task.startsWith("🤝") || task.startsWith("🦅") || task.startsWith("📱") || task.startsWith("💻")) {
                          return (
                            <div key={j} className="rounded-lg border border-amber-200/60 bg-amber-50/40 p-3">
                              <span className="text-[12px] font-semibold text-amber-800">{task.split("\n")[0]}</span>
                              {task.includes("\n") && (
                                <div className="mt-1.5 space-y-1">
                                  {task.split("\n").slice(1).map((line, k) => (
                                    <p key={k} className="text-[12px] leading-relaxed text-stone-700">
                                      {line}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return (
                          <div key={j} className="text-[13px] leading-relaxed text-stone-700">
                            {task}
                          </div>
                        );
                      })}
                    </div>

                    {level.milestone && (
                      <div className="mt-4 rounded-xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-white p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
                          {level.milestone.title}
                        </p>
                        <p className="mt-1.5 text-[12px] font-semibold text-ink">{level.milestone.metric}</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-stone-700">
                          {level.milestone.condition}
                        </p>
                      </div>
                    )}
                  </div>
                  {i === gameGuide.levels.length - 1 && (
                    <span className="absolute -left-[26px] top-3 h-3 w-3 rounded-full bg-[#fbf8f3]" />
                  )}
                </motion.li>
              ))}
            </ol>
          </motion.section>
        )}

        <motion.section
          variants={itemVariants}
          className="mt-16 border-t border-stone-200 pt-8 text-[13px] text-stone-500"
        >
          <p>這頁是這個專案的「未來地圖」，不是寫完就丟。每完成一個里程碑會回來更新狀態。</p>
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