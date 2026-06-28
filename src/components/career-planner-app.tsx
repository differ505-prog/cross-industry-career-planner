"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import industriesData from "@/data/industries.json";
import workflowsData from "@/data/workflows.json";

type ThemeName = "sage" | "dusty" | "terracotta";
type ItemStatus = "done" | "pending" | "recurring";

interface ResourceLink {
  label: string;
  url: string;
}

interface Industry {
  id: string;
  name: string;
  shortLabel: string;
  theme: ThemeName;
  overview: string;
  details: string[];
  legend: string[];
  resourceLinks: ResourceLink[];
}

interface ChecklistItem {
  id: string;
  title: string;
  status: ItemStatus;
  children?: ChecklistItem[];
}

interface WorkflowSection {
  id: string;
  title: string;
  summary?: string;
  items: ChecklistItem[];
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface WorkflowProject {
  sections: WorkflowSection[];
  faq: FaqItem[];
}

type WorkflowMap = Record<string, WorkflowProject>;

const industries = industriesData as Industry[];
const workflows = workflowsData as WorkflowMap;
const STORAGE_KEY = "cross-industry-career-planner-progress-v3";

const themeStyles: Record<
  ThemeName,
  {
    chip: string;
    soft: string;
    border: string;
    progress: string;
    solid: string;
    text: string;
  }
> = {
  sage: {
    chip: "bg-sage-100 text-sage-600",
    soft: "bg-sage-50",
    border: "border-sage-200",
    progress: "from-sage-300 to-sage-500",
    solid: "bg-sage-500",
    text: "text-sage-600",
  },
  dusty: {
    chip: "bg-dusty-100 text-dusty-600",
    soft: "bg-dusty-50",
    border: "border-dusty-200",
    progress: "from-dusty-300 to-dusty-500",
    solid: "bg-dusty-500",
    text: "text-dusty-600",
  },
  terracotta: {
    chip: "bg-terracotta-100 text-terracotta-600",
    soft: "bg-terracotta-50",
    border: "border-terracotta-200",
    progress: "from-terracotta-300 to-terracotta-500",
    solid: "bg-terracotta-500",
    text: "text-terracotta-600",
  },
};

function percentage(done: number, total: number) {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

function collectItems(items: ChecklistItem[]): ChecklistItem[] {
  return items.flatMap((item) => [item, ...(item.children ? collectItems(item.children) : [])]);
}

function statusLabel(status: ItemStatus, checked: boolean) {
  if (checked) return "已完成";
  if (status === "recurring") return "日常作業";
  return "待辦事項";
}

function buildDefaultCompletionMap() {
  const map: Record<string, boolean> = {};

  Object.values(workflows).forEach((project) => {
    project.sections.forEach((section) => {
      collectItems(section.items).forEach((item) => {
        map[item.id] = item.status === "done";
      });
    });
  });

  return map;
}

const defaultCompletionMap = buildDefaultCompletionMap();

export function CareerPlannerApp() {
  const [selectedIndustryId, setSelectedIndustryId] = useState(industries[0]?.id ?? "");
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(defaultCompletionMap);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as Record<string, boolean>;
      setCompletedTasks({ ...defaultCompletionMap, ...parsed });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTasks));
  }, [completedTasks]);

  const selectedIndustry = useMemo(
    () => industries.find((industry) => industry.id === selectedIndustryId) ?? industries[0],
    [selectedIndustryId]
  );

  const selectedWorkflow = workflows[selectedIndustry.id];
  const selectedTheme = themeStyles[selectedIndustry.theme];

  const stats = useMemo(() => {
    const allItems = selectedWorkflow.sections.flatMap((section) => collectItems(section.items));
    const total = allItems.length;
    const done = allItems.filter((item) => completedTasks[item.id]).length;
    return { total, done, rate: percentage(done, total) };
  }, [completedTasks, selectedWorkflow.sections]);

  const projectProgress = useMemo(() => {
    return Object.fromEntries(
      industries.map((industry) => {
        const allItems = workflows[industry.id].sections.flatMap((section) => collectItems(section.items));
        const total = allItems.length;
        const done = allItems.filter((item) => completedTasks[item.id]).length;
        return [industry.id, percentage(done, total)];
      })
    ) as Record<string, number>;
  }, [completedTasks]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks((current) => ({
      ...current,
      [taskId]: !current[taskId],
    }));
  };

  return (
    <main className="min-h-screen px-4 py-4 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col overflow-hidden rounded-shell border border-white/70 bg-white/55 shadow-float backdrop-blur-xl lg:flex-row">
        <aside className="border-b border-stone-200/70 bg-[#f7f2ea]/90 p-5 lg:w-[320px] lg:border-b-0 lg:border-r lg:p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.32em] text-stone-500">Source Workspace</p>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">跨產業生涯與專案任務步驟</h1>
              <p className="text-sm leading-7 text-stone-600">目前僅呈現你提供的兩份來源資料，未再額外生成其他任務內容。</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {industries.map((industry) => {
                const theme = themeStyles[industry.theme];
                const isActive = selectedIndustry.id === industry.id;
                const progress = projectProgress[industry.id] ?? 0;

                return (
                  <button
                    key={industry.id}
                    type="button"
                    onClick={() => setSelectedIndustryId(industry.id)}
                    className={[
                      "rounded-[20px] border p-4 text-left transition-all duration-300",
                      isActive
                        ? `border-transparent ${theme.soft} shadow-soft`
                        : "border-stone-200/70 bg-white/60 hover:border-stone-300 hover:bg-white/80",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={["rounded-full px-3 py-1 text-xs font-medium", theme.chip].join(" ")}>
                        {industry.shortLabel}
                      </span>
                      <span className="text-sm font-medium text-stone-500">{progress}%</span>
                    </div>
                    <p className="mt-3 text-base font-medium text-ink">{industry.name}</p>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{industry.overview}</p>
                    <div className="mt-4 h-2 rounded-full bg-white/80">
                      <div
                        className={["h-2 rounded-full bg-gradient-to-r transition-all duration-500", theme.progress].join(" ")}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="flex-1 bg-gradient-to-b from-white/80 via-[#fbf8f3]/70 to-[#f5efe6]/70 p-5 sm:p-8 lg:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedIndustry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="space-y-8"
            >
              <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
                <div className="rounded-[28px] border border-white/80 bg-white/72 p-6 shadow-soft backdrop-blur-md sm:p-7">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={["rounded-full px-3 py-1 text-xs font-medium", selectedTheme.chip].join(" ")}>
                      {selectedIndustry.shortLabel}
                    </span>
                    <span className="text-xs uppercase tracking-[0.28em] text-stone-400">來源資料</span>
                  </div>

                  <div className="mt-5 space-y-3">
                    <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-[2rem]">
                      {selectedIndustry.name}
                    </h2>
                    <p className="text-sm leading-7 text-stone-600 sm:text-[15px]">{selectedIndustry.overview}</p>
                  </div>

                  {selectedIndustry.details.length > 0 ? (
                    <div className="mt-5 space-y-3 rounded-[20px] bg-[#f6f1e9] p-4">
                      {selectedIndustry.details.map((detail) => (
                        <p key={detail} className="text-sm leading-7 text-stone-700">
                          {detail}
                        </p>
                      ))}
                    </div>
                  ) : null}

                  {selectedIndustry.legend.length > 0 ? (
                    <div className="mt-5 rounded-[20px] bg-[#f6f1e9] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-400">圖例</p>
                      <div className="mt-3 space-y-2">
                        {selectedIndustry.legend.map((line) => (
                          <p key={line} className="text-sm leading-6 text-stone-700">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    {selectedIndustry.resourceLinks.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm text-stone-700 transition hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/80 bg-white/72 p-6 shadow-soft backdrop-blur-md">
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-400">互動進度</p>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-4xl font-semibold tracking-tight text-ink">{stats.rate}%</p>
                      <p className="mt-2 text-sm text-stone-600">依目前勾選狀態計算</p>
                    </div>
                    <div className={["rounded-full px-3 py-1 text-xs font-medium", selectedTheme.chip].join(" ")}>
                      {stats.done}/{stats.total} 已完成
                    </div>
                  </div>

                  <div className="mt-6 h-3 rounded-full bg-[#efe7dd]">
                    <div
                      className={["h-3 rounded-full bg-gradient-to-r transition-all duration-500", selectedTheme.progress].join(" ")}
                      style={{ width: `${stats.rate}%` }}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/80 bg-white/68 p-6 shadow-soft backdrop-blur-md sm:p-7">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-400">內容</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">階段與任務清單</h3>
                </div>

                <div className="relative mt-8 space-y-5 before:absolute before:bottom-4 before:left-[18px] before:top-4 before:w-px before:bg-stone-200/80 sm:before:left-[22px]">
                  {selectedWorkflow.sections.map((section, index) => (
                    <SectionCard
                      key={section.id}
                      index={index}
                      section={section}
                      completedTasks={completedTasks}
                      onToggleTask={toggleTask}
                      theme={selectedTheme}
                    />
                  ))}
                </div>
              </section>

              {selectedWorkflow.faq.length > 0 ? (
                <section className="rounded-[28px] border border-white/80 bg-white/68 p-6 shadow-soft backdrop-blur-md sm:p-7">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-stone-400">FAQ</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">原始 FAQ 內容</h3>
                  </div>
                  <div className="mt-6 space-y-4">
                    {selectedWorkflow.faq.map((faq) => (
                      <article key={faq.id} className="rounded-[20px] border border-stone-200/80 bg-white/85 p-5">
                        <h4 className="text-base font-semibold text-ink">{faq.question}</h4>
                        <p className="mt-3 text-sm leading-7 text-stone-700">{faq.answer}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}

function countSection(section: WorkflowSection, completedTasks: Record<string, boolean>) {
  const allItems = collectItems(section.items);
  const total = allItems.length;
  const done = allItems.filter((item) => completedTasks[item.id]).length;
  return { total, done, rate: percentage(done, total) };
}

function SectionCard({
  index,
  section,
  completedTasks,
  onToggleTask,
  theme,
}: {
  index: number;
  section: WorkflowSection;
  completedTasks: Record<string, boolean>;
  onToggleTask: (taskId: string) => void;
  theme: (typeof themeStyles)[ThemeName];
}) {
  const sectionStats = useMemo(() => countSection(section, completedTasks), [completedTasks, section]);

  return (
    <article className="relative pl-12 sm:pl-16">
      <div
        className={[
          "absolute left-0 top-6 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white shadow-soft sm:h-11 sm:w-11",
          theme.solid,
        ].join(" ")}
      >
        {index + 1}
      </div>

      <div className="rounded-[24px] border border-stone-200/70 bg-[#fffdf9]/82 p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <span className={["rounded-full px-3 py-1 text-xs font-medium", theme.chip].join(" ")}>
              階段 {index + 1}
            </span>
            <div>
              <h4 className="text-xl font-semibold tracking-tight text-ink">{section.title}</h4>
              {section.summary ? <p className="mt-2 text-sm leading-7 text-stone-600">{section.summary}</p> : null}
            </div>
          </div>

          <div className="min-w-[170px] rounded-2xl bg-[#f6f0e8] p-4">
            <div className="flex items-center justify-between text-sm text-stone-600">
              <span>階段進度</span>
              <span>{sectionStats.rate}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/90">
              <div
                className={["h-2 rounded-full bg-gradient-to-r transition-all duration-500", theme.progress].join(" ")}
                style={{ width: `${sectionStats.rate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {section.items.map((item) => (
            <ChecklistRow
              key={item.id}
              item={item}
              depth={0}
              completedTasks={completedTasks}
              onToggleTask={onToggleTask}
              theme={theme}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

function ChecklistRow({
  item,
  depth,
  completedTasks,
  onToggleTask,
  theme,
}: {
  item: ChecklistItem;
  depth: number;
  completedTasks: Record<string, boolean>;
  onToggleTask: (taskId: string) => void;
  theme: (typeof themeStyles)[ThemeName];
}) {
  const hasChildren = Boolean(item.children?.length);
  const [open, setOpen] = useState(depth === 0 && hasChildren);
  const checked = Boolean(completedTasks[item.id]);

  return (
    <div className={depth > 0 ? "ml-4 border-l border-stone-200/80 pl-4 sm:ml-6" : ""}>
      <div
        className={[
          "overflow-hidden rounded-[20px] border transition duration-300",
          checked ? `${theme.soft} ${theme.border}` : "border-stone-200/80 bg-white",
        ].join(" ")}
      >
        <div className="flex items-start gap-4 px-4 py-4 sm:px-5">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => onToggleTask(item.id)}
            className="mt-0.5 h-5 w-5 cursor-pointer rounded border-stone-300 text-stone-700 focus:ring-stone-400"
            aria-label={`完成 ${item.title}`}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={["text-base font-medium", checked ? "text-stone-500 line-through" : "text-ink"].join(" ")}>
                {item.title}
              </p>
              <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs text-stone-500">
                {statusLabel(item.status, checked)}
              </span>
            </div>
          </div>

          {hasChildren ? (
            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              className={["pt-0.5 text-lg leading-none", theme.text].join(" ")}
              aria-label={open ? "收合子任務" : "展開子任務"}
            >
              {open ? "−" : "+"}
            </button>
          ) : null}
        </div>

        <AnimatePresence initial={false}>
          {hasChildren && open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden border-t border-white/80"
            >
              <div className="space-y-3 px-4 py-4 sm:px-5">
                {item.children?.map((child) => (
                  <ChecklistRow
                    key={child.id}
                    item={child}
                    depth={depth + 1}
                    completedTasks={completedTasks}
                    onToggleTask={onToggleTask}
                    theme={theme}
                  />
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
