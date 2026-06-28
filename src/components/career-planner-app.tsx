"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import industriesData from "@/data/industries.json";
import workflowsData from "@/data/workflows.json";

type ThemeName = "sage" | "dusty" | "terracotta";

interface ResourceLink {
  label: string;
  url: string;
}

interface Industry {
  id: string;
  name: string;
  shortLabel: string;
  theme: ThemeName;
  icon: string;
  overview: string;
  objective: string;
  resourceLinks: ResourceLink[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  deliverable: string;
  notes: string[];
  eta: string;
  priority: "high" | "medium" | "low";
}

interface Stage {
  id: string;
  title: string;
  summary: string;
  milestone: string;
  tasks: Task[];
}

type WorkflowMap = Record<string, Stage[]>;

const industries = industriesData as Industry[];
const workflows = workflowsData as WorkflowMap;
const STORAGE_KEY = "cross-industry-career-planner-progress";

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

function priorityLabel(priority: Task["priority"]) {
  if (priority === "high") return "高優先";
  if (priority === "medium") return "中優先";
  return "低優先";
}

function percentage(done: number, total: number) {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

export function CareerPlannerApp() {
  const [selectedIndustryId, setSelectedIndustryId] = useState(industries[0]?.id ?? "");
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      setCompletedTasks(JSON.parse(saved) as Record<string, boolean>);
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

  const selectedStages = useMemo(
    () => workflows[selectedIndustry.id] ?? [],
    [selectedIndustry]
  );

  const selectedTheme = themeStyles[selectedIndustry.theme];
  const totalTasks = selectedStages.reduce((sum, stage) => sum + stage.tasks.length, 0);
  const completedCount = selectedStages.reduce(
    (sum, stage) => sum + stage.tasks.filter((task) => completedTasks[task.id]).length,
    0
  );
  const completionRate = percentage(completedCount, totalTasks);

  const industryProgress = useMemo(() => {
    return Object.fromEntries(
      industries.map((industry) => {
        const stages = workflows[industry.id] ?? [];
        const total = stages.reduce((sum, stage) => sum + stage.tasks.length, 0);
        const done = stages.reduce(
          (sum, stage) => sum + stage.tasks.filter((task) => completedTasks[task.id]).length,
          0
        );

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
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.32em] text-stone-500">Career Navigator</p>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-ink">
                  跨產業生涯與專案任務步驟
                </h1>
                <p className="text-sm leading-7 text-stone-600">
                  以里程碑、時間軸與可勾選任務卡片，整理不同產業從起步到交付的關鍵節點。
                </p>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/80 bg-white/70 p-4 shadow-soft">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Design Direction</p>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                參照你提供的兩份來源，我把資訊架構改成「戰略階段 + 里程碑 + 持續任務」的工作台形式，
                同時保留 Japandi 的柔和留白與低飽和配色。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {industries.map((industry) => {
                const theme = themeStyles[industry.theme];
                const isActive = selectedIndustry.id === industry.id;
                const progress = industryProgress[industry.id] ?? 0;

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
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={[
                          "inline-flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold",
                          isActive ? "bg-white/90 text-ink" : theme.chip,
                        ].join(" ")}
                      >
                        {industry.icon}
                      </span>
                      <span className="text-sm font-medium text-stone-500">{progress}%</span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-base font-medium text-ink">{industry.name}</p>
                      <p className="text-sm leading-6 text-stone-600">{industry.overview}</p>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-white/80">
                      <div
                        className={[
                          "h-2 rounded-full bg-gradient-to-r transition-all duration-500",
                          theme.progress,
                        ].join(" ")}
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
                    <span className="text-xs uppercase tracking-[0.28em] text-stone-400">
                      Inspired By Action Blueprints
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-[2rem]">
                      {selectedIndustry.name}
                    </h2>
                    <p className="max-w-3xl text-sm leading-7 text-stone-600 sm:text-[15px]">
                      {selectedIndustry.objective}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[20px] bg-[#f6f1e9] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Workflow Logic</p>
                      <p className="mt-2 text-sm leading-7 text-stone-600">
                        介面採用「里程碑階段 + 可展開任務 + 即時完成度」三層架構，貼近你提供來源的工作節奏。
                      </p>
                    </div>
                    <div className="rounded-[20px] bg-[#f6f1e9] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Reference Links</p>
                      <div className="mt-3 flex flex-wrap gap-3">
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
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/80 bg-white/72 p-6 shadow-soft backdrop-blur-md">
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Global Progress</p>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-4xl font-semibold tracking-tight text-ink">{completionRate}%</p>
                      <p className="mt-2 text-sm text-stone-600">目前產業任務完成百分比</p>
                    </div>
                    <div className={["rounded-full px-3 py-1 text-xs font-medium", selectedTheme.chip].join(" ")}>
                      {completedCount}/{totalTasks} 已完成
                    </div>
                  </div>

                  <div className="mt-6 h-3 rounded-full bg-[#efe7dd]">
                    <div
                      className={[
                        "h-3 rounded-full bg-gradient-to-r transition-all duration-500",
                        selectedTheme.progress,
                      ].join(" ")}
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-stone-600">
                    <div className="rounded-2xl bg-[#f6f1e9] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Done</p>
                      <p className="mt-2 text-2xl font-semibold text-ink">{completedCount}</p>
                    </div>
                    <div className="rounded-2xl bg-[#f6f1e9] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Remaining</p>
                      <p className="mt-2 text-2xl font-semibold text-ink">
                        {Math.max(totalTasks - completedCount, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/80 bg-white/68 p-6 shadow-soft backdrop-blur-md sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Task Flow</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                      從起步到終點的階段式時間軸
                    </h3>
                  </div>
                  <p className="max-w-xl text-sm leading-7 text-stone-600">
                    每個階段保留里程碑語意，任務卡片可點擊展開細節，並透過 checkbox 即時更新全局進度。
                  </p>
                </div>

                <div className="relative mt-8 space-y-5 before:absolute before:bottom-4 before:left-[18px] before:top-4 before:w-px before:bg-stone-200/80 sm:before:left-[22px]">
                  {selectedStages.map((stage, index) => (
                    <StageCard
                      key={stage.id}
                      index={index}
                      stage={stage}
                      completedTasks={completedTasks}
                      onToggleTask={toggleTask}
                      theme={selectedTheme}
                    />
                  ))}
                </div>
              </section>
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}

function StageCard({
  index,
  stage,
  completedTasks,
  onToggleTask,
  theme,
}: {
  index: number;
  stage: Stage;
  completedTasks: Record<string, boolean>;
  onToggleTask: (taskId: string) => void;
  theme: (typeof themeStyles)[ThemeName];
}) {
  const [openTaskId, setOpenTaskId] = useState<string | null>(stage.tasks[0]?.id ?? null);

  const stageProgress = useMemo(() => {
    const done = stage.tasks.filter((task) => completedTasks[task.id]).length;
    return percentage(done, stage.tasks.length);
  }, [completedTasks, stage.tasks]);

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

      <div className="rounded-[24px] border border-stone-200/70 bg-[#fffdf9]/82 p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-float sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className={["rounded-full px-3 py-1 text-xs font-medium", theme.chip].join(" ")}>
                階段 {index + 1}
              </span>
              <span className="text-xs uppercase tracking-[0.24em] text-stone-400">{stage.milestone}</span>
            </div>
            <div>
              <h4 className="text-xl font-semibold tracking-tight text-ink">{stage.title}</h4>
              <p className="mt-2 text-sm leading-7 text-stone-600">{stage.summary}</p>
            </div>
          </div>

          <div className="min-w-[170px] rounded-2xl bg-[#f6f0e8] p-4">
            <div className="flex items-center justify-between text-sm text-stone-600">
              <span>階段進度</span>
              <span>{stageProgress}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/90">
              <div
                className={["h-2 rounded-full bg-gradient-to-r transition-all duration-500", theme.progress].join(" ")}
                style={{ width: `${stageProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {stage.tasks.map((task) => {
            const isDone = Boolean(completedTasks[task.id]);
            const isOpen = openTaskId === task.id;

            return (
              <div
                key={task.id}
                className={[
                  "overflow-hidden rounded-[20px] border transition duration-300",
                  isDone ? `${theme.soft} ${theme.border}` : "border-stone-200/80 bg-white",
                ].join(" ")}
              >
                <div className="flex items-start gap-4 px-4 py-4 sm:px-5">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => onToggleTask(task.id)}
                    className="mt-0.5 h-5 w-5 cursor-pointer rounded border-stone-300 text-stone-700 focus:ring-stone-400"
                    aria-label={`完成 ${task.title}`}
                  />

                  <button
                    type="button"
                    onClick={() => setOpenTaskId(isOpen ? null : task.id)}
                    className="flex min-w-0 flex-1 items-start justify-between gap-4 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={["text-base font-medium", isDone ? "text-stone-500 line-through" : "text-ink"].join(" ")}>
                          {task.title}
                        </p>
                        <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs text-stone-500">
                          {priorityLabel(task.priority)}
                        </span>
                        <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs text-stone-500">
                          {task.eta}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-stone-600">{task.description}</p>
                    </div>

                    <span className={["pt-0.5 text-lg leading-none", theme.text].join(" ")}>{isOpen ? "−" : "+"}</span>
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/80 px-5 py-4 sm:px-6">
                        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Deliverable</p>
                            <p className="mt-2 text-sm leading-7 text-stone-700">{task.deliverable}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Notes</p>
                            <ul className="mt-2 space-y-2 text-sm leading-6 text-stone-700">
                              {task.notes.map((note) => (
                                <li key={note} className="rounded-2xl bg-white/75 px-3 py-2">
                                  {note}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
