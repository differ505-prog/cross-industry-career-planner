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
type CopyState = "idle" | "success" | "error";

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

function buildStats(items: ChecklistItem[], completedTasks: Record<string, boolean>) {
  const oneTimeItems = items.filter((item) => item.status !== "recurring");
  const recurringItems = items.filter((item) => item.status === "recurring");
  const oneTimeDone = oneTimeItems.filter((item) => completedTasks[item.id]).length;
  const recurringDone = recurringItems.filter((item) => completedTasks[item.id]).length;

  return {
    oneTimeTotal: oneTimeItems.length,
    oneTimeDone,
    oneTimeRate: percentage(oneTimeDone, oneTimeItems.length),
    recurringTotal: recurringItems.length,
    recurringDone,
  };
}

function typeLabel(status: ItemStatus) {
  return status === "recurring" ? "重複型任務" : "一次性任務";
}

function cycleLabel(status: ItemStatus, checked: boolean) {
  if (status === "recurring") {
    return checked ? "本輪已執行" : "待執行";
  }

  return checked ? "已完成" : "未完成";
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

function itemStateLabel(item: ChecklistItem, completedTasks: Record<string, boolean>) {
  const checked = Boolean(completedTasks[item.id]);
  return item.status === "recurring"
    ? checked
      ? "本輪已執行"
      : "待執行"
    : checked
      ? "已完成"
      : "未完成";
}

function itemTypeLabel(item: ChecklistItem) {
  return item.status === "recurring" ? "重複型任務" : "一次性任務";
}

function formatChecklistItems(items: ChecklistItem[], completedTasks: Record<string, boolean>, depth = 0): string[] {
  return items.flatMap((item) => {
    const prefix = `${"  ".repeat(depth)}-`;
    const lines = [
      `${prefix} ${item.title}`,
      `${"  ".repeat(depth + 1)}類型：${itemTypeLabel(item)}`,
      `${"  ".repeat(depth + 1)}狀態：${itemStateLabel(item, completedTasks)}`,
    ];

    if (item.children?.length) {
      lines.push(...formatChecklistItems(item.children, completedTasks, depth + 1));
    }

    return lines;
  });
}

function groupChecklistItemsByState(
  items: ChecklistItem[],
  completedTasks: Record<string, boolean>,
  depth = 0
): {
  completed: string[];
  incomplete: string[];
} {
  return items.reduce(
    (groups, item) => {
      const prefix = `${"  ".repeat(depth)}-`;
      const line = `${prefix} ${item.title}（${itemTypeLabel(item)}｜${itemStateLabel(item, completedTasks)}）`;

      if (completedTasks[item.id]) {
        groups.completed.push(line);
      } else {
        groups.incomplete.push(line);
      }

      if (item.children?.length) {
        const childGroups = groupChecklistItemsByState(item.children, completedTasks, depth + 1);
        groups.completed.push(...childGroups.completed);
        groups.incomplete.push(...childGroups.incomplete);
      }

      return groups;
    },
    {
      completed: [] as string[],
      incomplete: [] as string[],
    }
  );
}

function buildReviewPrompt({
  industry,
  workflow,
  completedTasks,
  stats,
}: {
  industry: Industry;
  workflow: WorkflowProject;
  completedTasks: Record<string, boolean>;
  stats: ReturnType<typeof buildStats>;
}) {
  const completedSummary: string[] = [];
  const incompleteSummary: string[] = [];

  workflow.sections.forEach((section, index) => {
    const sectionLabel = `階段 ${index + 1}：${section.title}`;
    const groupedItems = groupChecklistItemsByState(section.items, completedTasks);

    if (groupedItems.completed.length > 0) {
      completedSummary.push(sectionLabel, ...groupedItems.completed);
    }

    if (groupedItems.incomplete.length > 0) {
      incompleteSummary.push(sectionLabel, ...groupedItems.incomplete);
    }
  });

  const lines = [
    "請你扮演高階顧問 / 高階 LLM 審核者，針對以下檢核表做全面覆核。",
    "請先把「目前已完成任務」視為既有成果與現況基線，除非你判斷方向明顯錯誤，否則不要要求全面重做；若需調整，請優先用「微調、補強、重排、驗證」的角度提出建議。",
    "",
    "請完成以下任務：",
    "1. 先給這份檢核表一個綜合評分，滿分 10 分，可出現小數點一位。",
    "2. 說明評分理由，至少涵蓋：完整性、可執行性、商業可行性、優先順序、風險控制。",
    "3. 點出目前檢核表的盲點、缺漏、重複或順序不合理之處。",
    "4. 提出具體優化建議，並依高優先、中優先、低優先排序。",
    "5. 如果你認為有些項目應該改成一次性任務、重複型任務，或反過來，也請直接指出。",
    "6. 請把你的建議轉化成可直接貼給 IDE 執行的提示詞，而不只是評論。",
    "7. 每一組 IDE 提示詞都要清楚包含：目標、上下文、具體修改、驗收標準。",
    "",
    "請用繁體中文回答，內容務必務實、直接、可執行。",
    "請嚴格使用以下輸出結構：",
    "【綜合評分】",
    "- 先輸出 1 行總分與一句總評。",
    "【關鍵判斷】",
    "- 用 3 至 5 點說明你對這份檢核表的核心判斷。",
    "【風險與盲點】",
    "- 用高 / 中 / 低優先級整理問題。",
    "【給 IDE 的提示詞】",
    "- 至少提供 3 組提示詞，依高優先、中優先、低優先排序。",
    "- 每組提示詞都必須是可直接貼給 IDE 的完整指令，不要寫成摘要。",
    "- 若你認為某些已完成任務仍需調整，請在提示詞中明確標示為「微調 / 補強 / 驗證」，不要寫成從零重做。",
    "",
    `檢核表名稱：${industry.name}`,
    `概述：${industry.overview}`,
    "",
    "補充說明：",
    ...(industry.details.length > 0 ? industry.details.map((detail) => `- ${detail}`) : ["- 無"]),
    "",
    "圖例：",
    ...(industry.legend.length > 0 ? industry.legend.map((line) => `- ${line}`) : ["- 無"]),
    "",
    "來源連結：",
    ...(industry.resourceLinks.length > 0
      ? industry.resourceLinks.map((link) => `- ${link.label}：${link.url}`)
      : ["- 無"]),
    "",
    "目前進度摘要：",
    `- 一次性任務完成率：${stats.oneTimeRate}% (${stats.oneTimeDone}/${stats.oneTimeTotal})`,
    `- 重複型任務本輪已執行：${stats.recurringDone}/${stats.recurringTotal}`,
    "",
    "目前已完成任務摘要：",
    ...(completedSummary.length > 0 ? completedSummary : ["- 無"]),
    "",
    "目前待補強 / 待執行任務摘要：",
    ...(incompleteSummary.length > 0 ? incompleteSummary : ["- 無"]),
    "",
    "完整檢核表內容：",
  ];

  workflow.sections.forEach((section, index) => {
    lines.push("");
    lines.push(`階段 ${index + 1}：${section.title}`);
    if (section.summary) {
      lines.push(`摘要：${section.summary}`);
    }
    lines.push(...formatChecklistItems(section.items, completedTasks));
  });

  if (workflow.faq.length > 0) {
    lines.push("", "FAQ：");
    workflow.faq.forEach((faq, index) => {
      lines.push(`${index + 1}. ${faq.question}`);
      lines.push(`   ${faq.answer}`);
    });
  }

  return lines.join("\n");
}

export function CareerPlannerApp() {
  const [selectedIndustryId, setSelectedIndustryId] = useState(industries[0]?.id ?? "");
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(defaultCompletionMap);
  const [copyState, setCopyState] = useState<CopyState>("idle");

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
    return buildStats(allItems, completedTasks);
  }, [completedTasks, selectedWorkflow.sections]);

  const projectProgress = useMemo(() => {
    return Object.fromEntries(
      industries.map((industry) => {
        const allItems = workflows[industry.id].sections.flatMap((section) => collectItems(section.items));
        return [industry.id, buildStats(allItems, completedTasks)];
      })
    ) as Record<
      string,
      {
        oneTimeTotal: number;
        oneTimeDone: number;
        oneTimeRate: number;
        recurringTotal: number;
        recurringDone: number;
      }
    >;
  }, [completedTasks]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks((current) => ({
      ...current,
      [taskId]: !current[taskId],
    }));
  };

  const handleCopyForReview = async () => {
    const reviewPrompt = buildReviewPrompt({
      industry: selectedIndustry,
      workflow: selectedWorkflow,
      completedTasks,
      stats,
    });

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(reviewPrompt);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = reviewPrompt;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopyState("success");
      window.setTimeout(() => setCopyState("idle"), 2200);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2200);
    }
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
                const progress = projectProgress[industry.id];

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
                      <span className="text-sm font-medium text-stone-500">{progress.oneTimeRate}%</span>
                    </div>
                    <p className="mt-3 text-base font-medium text-ink">{industry.name}</p>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{industry.overview}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                      <span>一次性 {progress.oneTimeDone}/{progress.oneTimeTotal}</span>
                      <span>重複型 {progress.recurringDone}/{progress.recurringTotal}</span>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-white/80">
                      <div
                        className={["h-2 rounded-full bg-gradient-to-r transition-all duration-500", theme.progress].join(" ")}
                        style={{ width: `${progress.oneTimeRate}%` }}
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
                    <button
                      type="button"
                      onClick={handleCopyForReview}
                      className={[
                        "rounded-full px-4 py-2 text-sm transition",
                        copyState === "success"
                          ? `${selectedTheme.soft} ${selectedTheme.text} border ${selectedTheme.border}`
                          : copyState === "error"
                            ? "border border-red-200 bg-red-50 text-red-600"
                            : "border border-stone-200 bg-white/80 text-stone-700 hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white",
                      ].join(" ")}
                    >
                      {copyState === "success"
                        ? "已複製覆核內容"
                        : copyState === "error"
                          ? "複製失敗，請重試"
                          : "一鍵複製給高階 LLM 覆核"}
                    </button>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-stone-500">
                    複製內容會包含目前整張檢核表、已完成與待補強摘要、FAQ，以及要求高階 LLM 回傳「可直接貼給 IDE」的提示詞。
                  </p>
                </div>

                <div className="rounded-[28px] border border-white/80 bg-white/72 p-6 shadow-soft backdrop-blur-md">
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-400">互動進度</p>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-4xl font-semibold tracking-tight text-ink">{stats.oneTimeRate}%</p>
                      <p className="mt-2 text-sm text-stone-600">一次性任務完成率</p>
                    </div>
                    <div className={["rounded-full px-3 py-1 text-xs font-medium", selectedTheme.chip].join(" ")}>
                      一次性 {stats.oneTimeDone}/{stats.oneTimeTotal}
                    </div>
                  </div>

                  <div className="mt-6 h-3 rounded-full bg-[#efe7dd]">
                    <div
                      className={["h-3 rounded-full bg-gradient-to-r transition-all duration-500", selectedTheme.progress].join(" ")}
                      style={{ width: `${stats.oneTimeRate}%` }}
                    />
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-[#f6f1e9] p-4 text-stone-600">
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-400">一次性任務</p>
                      <p className="mt-2 text-2xl font-semibold text-ink">{stats.oneTimeDone}</p>
                      <p className="mt-1 text-xs text-stone-500">共 {stats.oneTimeTotal} 項</p>
                    </div>
                    <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 p-4 text-stone-600">
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-400">重複型任務</p>
                      <p className="mt-2 text-2xl font-semibold text-ink">{stats.recurringDone}</p>
                      <p className="mt-1 text-xs text-stone-500">本輪已執行 / 共 {stats.recurringTotal} 項</p>
                    </div>
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
  return buildStats(allItems, completedTasks);
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
              <span>一次性進度</span>
              <span>{sectionStats.oneTimeRate}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/90">
              <div
                className={["h-2 rounded-full bg-gradient-to-r transition-all duration-500", theme.progress].join(" ")}
                style={{ width: `${sectionStats.oneTimeRate}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-stone-500">
              重複型本輪已執行 {sectionStats.recurringDone}/{sectionStats.recurringTotal}
            </p>
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
  const childCount = item.children?.length ?? 0;
  const childLabel = depth === 0 ? `含 ${childCount} 項子任務` : `含 ${childCount} 項子步驟`;
  const [open, setOpen] = useState(depth === 0 && hasChildren);
  const checked = Boolean(completedTasks[item.id]);
  const isRecurring = item.status === "recurring";

  return (
    <div className={depth > 0 ? "ml-4 border-l border-stone-200/80 pl-4 sm:ml-6" : ""}>
      <div
        className={[
          "overflow-hidden rounded-[20px] border transition duration-300",
          isRecurring
            ? checked
              ? `${theme.soft} ${theme.border} border-dashed`
              : "border-dashed border-stone-300 bg-[#faf7f2]"
            : checked
              ? `${theme.soft} ${theme.border}`
              : "border-stone-200/80 bg-white",
        ].join(" ")}
      >
        <div className="flex items-start gap-4 px-4 py-4 sm:px-5">
          {isRecurring ? (
            <button
              type="button"
              onClick={() => onToggleTask(item.id)}
              className={[
                "mt-0.5 inline-flex min-w-[88px] items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium transition",
                checked
                  ? `${theme.soft} ${theme.text} border ${theme.border}`
                  : "border border-dashed border-stone-300 bg-white text-stone-600 hover:bg-stone-50",
              ].join(" ")}
              aria-label={`${checked ? "取消本輪執行" : "標記本輪已執行"} ${item.title}`}
            >
              {checked ? "本輪已執行" : "標記執行"}
            </button>
          ) : (
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggleTask(item.id)}
              className="mt-0.5 h-5 w-5 cursor-pointer rounded border-stone-300 text-stone-700 focus:ring-stone-400"
              aria-label={`完成 ${item.title}`}
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={[
                  "text-base font-medium",
                  isRecurring ? (checked ? "text-ink" : "text-ink") : checked ? "text-stone-500 line-through" : "text-ink",
                ].join(" ")}
              >
                {item.title}
              </p>
              <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs text-stone-500">
                {typeLabel(item.status)}
              </span>
              <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs text-stone-500">
                {cycleLabel(item.status, checked)}
              </span>
              {hasChildren ? (
                <span className="rounded-full border border-stone-200 bg-stone-50/90 px-2.5 py-1 text-xs text-stone-500">
                  {childLabel}
                </span>
              ) : null}
            </div>
          </div>

          {hasChildren ? (
            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              className={[
                "inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-white",
                theme.text,
              ].join(" ")}
              aria-label={open ? "收合子任務" : "展開子任務"}
            >
              <span>{open ? "收合" : "展開"}</span>
              <span className="text-sm leading-none">{open ? "−" : "+"}</span>
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
