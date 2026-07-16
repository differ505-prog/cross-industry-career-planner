"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { VibeListData, VibeListLevel, VibeListTask } from "@/data/types";
import { writeToClipboard, type CopyStatus } from "@/lib/clipboard";
import { buildVibeListStats } from "@/lib/progress";
import { serializeVibeList, serializeVibeListLevel } from "@/lib/blueprint-copy";

const STORAGE_KEY = "cross-industry-career-planner-progress-v4";

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

interface VibeListPageProps {
  data: VibeListData;
}

export function VibeListPage({ data }: VibeListPageProps) {
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);
  const [wholeStatus, setWholeStatus] = useState<CopyStatus>("idle");

  // mount 時從 localStorage 讀
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          // 只挑出 vibelist task id (l-*) 的 key
          const filtered: Record<string, boolean> = {};
          for (const [k, v] of Object.entries(parsed)) {
            if (k.startsWith("l-") && v === true) filtered[k] = true;
          }
          setCompletedTasks(filtered);
        }
      }
    } catch {
      // parse 失敗就當空白
    }
    setHydrated(true);
  }, []);

  // 任一變動就寫回 localStorage（但只寫 vibelist 的 key，避免影響其他產業）
  useEffect(() => {
    if (!hydrated) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const existing = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      // 移除所有舊的 l- key
      const stripped: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(existing)) {
        if (!k.startsWith("l-")) stripped[k] = v;
      }
      // 合併這次的
      const merged = { ...stripped, ...completedTasks };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // 忽略寫入失敗
    }
  }, [completedTasks, hydrated]);

  const stats = useMemo(
    () => buildVibeListStats(data.levels, completedTasks),
    [data.levels, completedTasks],
  );

  const toggle = (taskId: string) => {
    setCompletedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleCopyWhole = () => {
    const md = serializeVibeList(data, {
      completedTasks,
      includeCheckedState: true,
    });
    void writeToClipboard(md, setWholeStatus);
  };

  return (
    <motion.main className="min-h-screen bg-[#fbf8f3] px-5 py-10 text-ink sm:px-8 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <motion.div variants={itemVariants} className="mb-8 flex items-center gap-3 text-xs">
          <Link
            href="/"
            className="text-stone-500 underline-offset-2 hover:text-stone-700 hover:underline"
          >
            ← 回到主站
          </Link>
          <span className="text-stone-300">·</span>
          <Link
            href="/blueprint"
            className="text-amber-700 underline-offset-2 hover:underline"
          >
            看 Nexus OS 未來藍圖
          </Link>
        </motion.div>

        {/* Hero */}
        <motion.section
          variants={itemVariants}
          className="rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 via-white to-amber-50/40 p-7 shadow-sm sm:p-10"
        >
          <p className="text-[11px] uppercase tracking-[0.24em] text-indigo-700">
            {data.shortLabel}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {data.name}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            {data.overview}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopyWhole}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
            >
              {wholeStatus === "success"
                ? "已複製整份藍圖"
                : wholeStatus === "error"
                  ? "複製失敗，請重試"
                  : "複製整份藍圖（Markdown）"}
            </button>
            <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[12px] text-stone-600">
              進度 {stats.done} / {stats.total}（{stats.rate}%）
            </span>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-stone-500">
            複製後可直接貼給 LLM（例如：「請優化這份藍圖的結構與建議，回傳相同格式的 Markdown」），再貼回 IDE。
          </p>
        </motion.section>

        {/* Intro */}
        <motion.section
          variants={itemVariants}
          className="mt-10 rounded-2xl border border-indigo-200/50 bg-indigo-50/30 p-5 text-sm leading-relaxed text-stone-700"
        >
          {data.intro}
        </motion.section>

        {/* Legend */}
        {data.legend.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-500"
          >
            {data.legend.map((line, i) => (
              <span key={i}>· {line}</span>
            ))}
          </motion.div>
        )}

        {/* Levels */}
        <ol className="relative mt-10 space-y-8 border-l border-stone-200 pl-6">
          {data.levels.map((level, i) => (
            <LevelNode
              key={level.id}
              level={level}
              isLast={i === data.levels.length - 1}
              completedTasks={completedTasks}
              onToggle={toggle}
            />
          ))}
        </ol>

        <motion.section
          variants={itemVariants}
          className="mt-16 border-t border-stone-200 pt-8 text-[13px] text-stone-500"
        >
          <p>這份是 SaaS 商業化的「破關地圖」，不是寫完就丟。每完成一個任務勾起來，進度會自動存到 localStorage。</p>
          <p className="mt-2">
            <Link href="/" className="text-indigo-700 underline-offset-2 hover:underline">
              → 回到主站看現況
            </Link>
          </p>
        </motion.section>
      </div>
    </motion.main>
  );
}

interface LevelNodeProps {
  level: VibeListLevel;
  isLast: boolean;
  completedTasks: Record<string, boolean>;
  onToggle: (taskId: string) => void;
}

function LevelNode({ level, isLast, completedTasks, onToggle }: LevelNodeProps) {
  const [status, setStatus] = useState<CopyStatus>("idle");

  const handleCopyLevel = () => {
    const md = serializeVibeListLevel(level, "VibeList", completedTasks, true);
    void writeToClipboard(md, setStatus);
  };

  return (
    <motion.li variants={itemVariants} className="relative">
      <span className="absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-indigo-500 ring-4 ring-[#fbf8f3]" />
      <div className="rounded-xl border border-stone-200/70 bg-white p-5 shadow-sm transition hover:shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">
              {level.label}
            </p>
            <h2 className="mt-1 text-base font-semibold text-ink sm:text-lg">
              {level.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCopyLevel}
            className="shrink-0 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-medium text-stone-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98]"
            title="複製本 Level 內容（Markdown）"
          >
            {status === "success" ? "已複製" : status === "error" ? "失敗" : "複製本 Level"}
          </button>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-stone-600">{level.summary}</p>

        <div className="mt-4 space-y-2">
          {level.tasks.map((task) => (
            <TaskRow key={task.id} task={task} completed={Boolean(completedTasks[task.id])} onToggle={onToggle} />
          ))}
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
      {isLast && (
        <span className="absolute -left-[26px] top-3 h-3 w-3 rounded-full bg-[#fbf8f3]" />
      )}
    </motion.li>
  );
}

interface TaskRowProps {
  task: VibeListTask;
  completed: boolean;
  onToggle: (taskId: string) => void;
}

function TaskRow({ task, completed, onToggle }: TaskRowProps) {
  if (task.kind === "theory") {
    return (
      <div className="rounded-lg border border-blue-200/60 bg-blue-50/40 p-3">
        {task.lines.map((line, i) => (
          <p key={i} className={`text-[12px] leading-relaxed text-stone-600 ${i > 0 ? "mt-1" : ""}`}>
            {line}
          </p>
        ))}
      </div>
    );
  }

  if (task.kind === "highlight") {
    return (
      <div className="rounded-lg border border-amber-200/60 bg-amber-50/40 p-3">
        <p className="text-[12px] font-semibold text-amber-800">{task.title}</p>
        {task.lines.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {task.lines.map((line, i) => (
              <p key={i} className="text-[12px] leading-relaxed text-stone-700">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  // single 或 single-with-lines — 可勾選
  const content = task.kind === "single" ? task.content : task.content;
  const subLines = task.kind === "single-with-lines" ? task.lines : null;

  return (
    <button
      type="button"
      onClick={() => onToggle(task.id)}
      className="block w-full rounded-lg border border-stone-200/60 bg-stone-50/50 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40"
    >
      <div className="flex gap-3">
        <span
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
            completed
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-stone-300 bg-white"
          }`}
        >
          {completed && (
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 6.5l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span
          className={`text-[13px] leading-relaxed text-stone-700 ${
            completed ? "text-stone-400 line-through" : ""
          }`}
        >
          {content}
        </span>
      </div>
      {subLines && subLines.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-stone-200/60 pl-7 pt-2">
          {subLines.map((line, i) => (
            <li key={i} className="text-[12px] leading-relaxed text-stone-600">
              · {line}
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}