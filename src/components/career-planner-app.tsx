"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import industriesData from "@/data/industries.json";
import workflowsData from "@/data/workflows.json";
import skillsData from "@/data/skills.json";
import { SkillsPanel as SkillsPanelView } from "@/components/skills-panel";

type ThemeName = "sage" | "dusty" | "terracotta" | "slate";
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

type SkillMaturity = "seed" | "practicing" | "verified" | "expert";
type SkillCategory = "operations" | "communication" | "content" | "tech" | "design";

interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  maturity: SkillMaturity;
  oneLiner: string;
  sourceTaskIds: string[];
  appliesToIndustryIds: string[];
}
type CompletionState = {
  checked: boolean;
  partiallyChecked: boolean;
};

const industries = industriesData as Industry[];
const workflows = workflowsData as WorkflowMap;
const skills = skillsData.skills as Skill[];

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
  slate: {
    chip: "bg-slate-100 text-slate-600",
    soft: "bg-slate-50",
    border: "border-slate-200",
    progress: "from-slate-300 to-slate-500",
    solid: "bg-slate-500",
    text: "text-slate-600",
  },
};

function percentage(done: number, total: number) {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

function collectItems(items: ChecklistItem[]): ChecklistItem[] {
  return items.flatMap((item) => [item, ...(item.children ? collectItems(item.children) : [])]);
}

function collectTaskIds(item: ChecklistItem): string[] {
  return [item.id, ...(item.children ? item.children.flatMap((child) => collectTaskIds(child)) : [])];
}

function getItemCompletionState(item: ChecklistItem, completedTasks: Record<string, boolean>): CompletionState {
  if (!item.children?.length) {
    return {
      checked: Boolean(completedTasks[item.id]),
      partiallyChecked: false,
    };
  }

  const childStates: CompletionState[] = item.children.map((child) => getItemCompletionState(child, completedTasks));
  const checked = childStates.every((state) => state.checked);
  const partiallyChecked = !checked && childStates.some((state) => state.checked || state.partiallyChecked);

  return {
    checked,
    partiallyChecked,
  };
}

function buildStats(items: ChecklistItem[], completedTasks: Record<string, boolean>) {
  const oneTimeItems = items.filter((item) => item.status !== "recurring");
  const recurringItems = items.filter((item) => item.status === "recurring");
  const oneTimeDone = oneTimeItems.filter((item) => getItemCompletionState(item, completedTasks).checked).length;
  const recurringDone = recurringItems.filter((item) => getItemCompletionState(item, completedTasks).checked).length;

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
  const checked = getItemCompletionState(item, completedTasks).checked;
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

      if (getItemCompletionState(item, completedTasks).checked) {
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

function buildPortfolioReviewPrompt({
  industries,
  workflows,
  completedTasks,
  projectProgress,
  allSkills,
  focusIndustryId,
}: {
  industries: Industry[];
  workflows: WorkflowMap;
  completedTasks: Record<string, boolean>;
  projectProgress: Record<string, { oneTimeTotal: number; oneTimeDone: number; oneTimeRate: number; recurringTotal: number; recurringDone: number }>;
  allSkills: Skill[];
  focusIndustryId?: string;
}) {
  const lines: string[] = [
    "請你扮演高階總顧問 / CSO，針對以下「跨產業事業組合」做宏觀覆核。",
    "每個產業都有獨立的檢核表、戰略角色與節奏，請把它們當成一個投資組合來檢視：哪些是主要收入引擎、哪些是長線孵化、哪些應暫緩。",
    "",
    "請完成以下任務：",
    "1. 對每個產業單獨給一段「成熟度評語」（≤ 60 字），告訴我現在是「孵化期 / 衝刺期 / 收割期 / 暫緩期」哪一個。",
    "2. 指出 1~2 個最強的「跨產業槓桿點」：在某產業完成的某項任務，可如何復用到另一產業（例如：青曦的「報價 SOP」可遷移到築時；VanBase 的內容基建可助攻 OmniSonic 行銷）。",
    "3. 指出 1~2 個最大的「組合風險」：哪些任務同時進行會有資源衝突，或哪兩個產業最好不要同時衝刺。",
    "4. 給出「本季唯一最重要的下一步」三選一，告訴我該全部火力集中在哪一個產業。",
    "5. 請用繁體中文回答，務必務實、可執行；嚴禁代替我執行任務（不要寫文案、不要寫程式）。",
    "",
    "整體進度矩陣：",
  ];

  industries.forEach((industry) => {
    const progress = projectProgress[industry.id];
    const recurringNote =
      progress.recurringTotal > 0
        ? `、重複本輪 ${progress.recurringDone}/${progress.recurringTotal}`
        : "";
    lines.push(
      `- ${industry.name}（${industry.shortLabel}｜${industry.theme}）：一次性 ${progress.oneTimeDone}/${progress.oneTimeTotal}（${progress.oneTimeRate}%）${recurringNote}`
    );
  });

  lines.push("", "各產業明細：");

  // 跨產業技能積累區段 (Vibe Coding 跨域資產盤點)
  if (allSkills.length > 0) {
    const sortedSkills = [...allSkills].sort(
      (a, b) => MATURITY_RANK[b.maturity] - MATURITY_RANK[a.maturity]
    );
    const expertOrVerified = sortedSkills.filter(
      (s) => s.maturity === "expert" || s.maturity === "verified"
    );
    const practicing = sortedSkills.filter((s) => s.maturity === "practicing");
    const seed = sortedSkills.filter((s) => s.maturity === "seed");

    lines.push("");
    lines.push("---");
    lines.push("跨產業技能積累（核心資產盤點，使用者目前已掌握的能力）：");
    lines.push("");
    lines.push("用途說明：在評估任務難度與下一步建議時，請參考使用者已成熟的技能，");
    lines.push("避免重複教基本功；對「練習中」的技能，覆核方向應給『可驗收的小任務』；");
    lines.push("對僅『種子』狀態的技能，應只給方向、不冒進。");
    lines.push("");

    const renderGroup = (label: string, group: Skill[]) => {
      lines.push(`【${label}】(${group.length} 項)`);
      if (group.length === 0) {
        lines.push("- 無");
      } else {
        group.forEach((s) => {
          const targets = s.appliesToIndustryIds
            .map((id) => industries.find((i) => i.id === id)?.shortLabel ?? id)
            .join("、");
          lines.push(`- [${MATURITY_LABEL[s.maturity]}] ${s.name}（${s.category}）— ${s.oneLiner}`);
          lines.push(`    適用產業：${targets}`);
        });
      }
      lines.push("");
    };

    renderGroup("複產業專家 / 已驗收", expertOrVerified);
    renderGroup("練習中", practicing);
    renderGroup("僅種子", seed);
  }

  if (focusIndustryId) {
    const focus = industries.find((i) => i.id === focusIndustryId);
    if (focus) {
      const focusSkills = allSkills
        .filter((s) => s.appliesToIndustryIds.includes(focusIndustryId))
        .sort((a, b) => MATURITY_RANK[b.maturity] - MATURITY_RANK[a.maturity]);
      if (focusSkills.length > 0) {
        lines.push("");
        lines.push(`目前聚焦產業（${focus.shortLabel}）已有的技能槓桿：`);
        focusSkills.forEach((s) => {
          lines.push(`- [${MATURITY_LABEL[s.maturity]}] ${s.name}：${s.oneLiner}`);
        });
        lines.push("");
      }
    }
  }

  industries.forEach((industry) => {
    const project = workflows[industry.id];
    if (!project) return;
    const progress = projectProgress[industry.id];
    const allItems = project.sections.flatMap((section) => collectItems(section.items));
    const grouped = groupChecklistItemsByState(allItems, completedTasks);

    lines.push("");
    lines.push(`### ${industry.name}（${industry.shortLabel}）`);
    lines.push(`- 主題：${industry.theme}`);
    lines.push(`- 概述：${industry.overview}`);
    if (industry.details.length > 0) {
      lines.push("- 補充說明：");
      industry.details.forEach((d) => lines.push(`  - ${d}`));
    }
    lines.push(`- 一次完成率：${progress.oneTimeRate}%（${progress.oneTimeDone}/${progress.oneTimeTotal}）`);
    if (progress.recurringTotal > 0) {
      lines.push(`- 重複本輪：${progress.recurringDone}/${progress.recurringTotal}`);
    }
    lines.push("");
    lines.push("已完成任務：");
    if (grouped.completed.length > 0) {
      grouped.completed.forEach((line) => lines.push(`  ${line}`));
    } else {
      lines.push("  - 無");
    }
    lines.push("待補強任務（節錄前 8 項）：");
    if (grouped.incomplete.length === 0) {
      lines.push("  - 無");
    } else {
      grouped.incomplete.slice(0, 8).forEach((line) => lines.push(`  ${line}`));
      if (grouped.incomplete.length > 8) {
        lines.push(`  - …另有 ${grouped.incomplete.length - 8} 項省略`);
      }
    }
  });

  return lines.join("\n");
}

function buildReviewPrompt({
  industry,
  workflow,
  completedTasks,
  stats,
  allSkills,
}: {
  industry: Industry;
  workflow: WorkflowProject;
  completedTasks: Record<string, boolean>;
  stats: ReturnType<typeof buildStats>;
  allSkills: Skill[];
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
    "【核心角色斷言】請嚴格保持「框架設計者與系統審核者」的視角，你的任務是提出結構性與策略性建議，請勿下場代替使用者執行檢核表內的具體任務（如撰寫文案、產出社群貼文或撰寫文章等）。",
    "請先把「目前已完成任務」視為既有成果與現況基線，除非你判斷方向明顯錯誤，否則不要要求全面重做；若需調整，請優先用「微調、補強、重排、驗證」的角度提出建議。",
    "你可以重新調整整體公版的階段順序與任務排序，但請把「已完成任務」視為既有資產，優先提出保留、前移、後移、補強、拆分、合併等調整方案；除非存在重大邏輯錯誤，否則不要直接建議刪除後重做。",
    "",
    "請完成以下任務：",
    "1. 先給這份檢核表一個綜合評分，滿分 10 分，可出現小數點一位。",
    "2. 在評分旁邊直接標註「是否建議立即修改」，並只能從以下四種擇一：建議立即修改 / 建議本輪順手修正 / 可排入下輪優化 / 暫不建議修改。",
    "3. 另外補一個「修改急迫度」，並只能從以下三級擇一：高 / 中 / 低。",
    "4. 用一句話說明你做出上述判定的核心理由。",
    "5. 再說明評分理由，至少涵蓋：完整性、可執行性、商業可行性、優先順序、風險控制。",
    "6. 點出目前檢核表的盲點、缺漏、重複或順序不合理之處。",
    "7. 提出具體優化建議，並依高優先、中優先、低優先排序。",
    "8. 如果你認為有些項目應該改成一次性任務、重複型任務，或反過來，也請直接指出。",
    "9. 請先判斷每一項建議屬於「同意可直接落地」、「部分同意需改寫後落地」或「不同意不應落地」。",
    "10. 只有你同意的內容，才能轉化成可直接貼給 IDE 執行的提示詞；不同意的內容不要混進執行提示詞。",
    "11. 請把輸出分成三個獨立區塊：「內容與順序的修改提示詞」、「下次給 LLM 的提示詞修改建議」、「給 IDE 的網站架構設計修改提示詞」，不要混寫。",
    "12. 【核心防呆】其中「下次給 LLM 的提示詞修改建議」是一次「系統層級的閉環優化」。你只能提供修改方向、邊界控制與防呆限制，絕對不得在此直接生成下一版完整提示詞全文，也嚴禁直接生成任何網站文案、文章、社群貼文或程式碼實作。",
    "13. 第 1 類與第 3 類每一組提示詞都要清楚包含：目標、上下文、具體修改、驗收標準。",
    "14. 若你只部分同意某項建議，請先改寫成你真正同意的版本，再輸出成 IDE 提示詞，避免讓人誤以為你全盤認可原提案。",
    "15. 若你建議驗證 quote-studio 與「青曦標準提案 SOP」的一致性，請具體比對：報價單中的隱蔽工程（水電 / 泥作）是否與樹狀工程解剖圖的節點完整對應，以及付款階段（例如 30 / 30 / 30 / 10）是否與甘特圖里程碑吻合。",
    "16. 若你要生成「主動獵殺留言模版」或「社群誘餌回覆」相關建議，請限制為：語氣中立專業、80 字以內、不得直接推銷或硬塞網址、以提供收納 / 格局 / 預算建議為主，並優先用問句收尾引發對話。",
    "17. 若你要給 COPE 分發建議，請明確區分平台格式：Threads 偏高張力、具衝突感的短文；Google 商家動態偏在地化 SEO 關鍵字（如汐止室內設計 / 南港老屋翻新）的條列式說明。",
    "18. 若你看到「寫書 / 出版計畫」或長篇內容策略，請理解這在此專案脈絡中，不是脫離主戰場的空泛夢想，而是「一魚多吃」的母內容來源：同一份內容可同步拆解為官網文章、MVP 內容庫、社群分發素材與後續出版資產。請在這個前提下評估其優先級、拆分方式與執行節奏，而不是只把它視為單一的長期支線任務。",
    "19. 若某個項目標示為「已完成」或「主體已完成」，代表我們已經實際落地，不是紙上規劃；你應基於既有成果提出優化、驗證或重排建議，而不是把它當成未開始任務重寫。",
    "",
    "請用繁體中文回答，內容務必務實、直接、可執行。",
    "請嚴格使用以下輸出結構：",
    "【綜合評分】",
    "- 先輸出 1 行總分與一句總評。",
    "【是否建議立即修改】",
    "- 緊接在評分後輸出，且只能四選一：建議立即修改 / 建議本輪順手修正 / 可排入下輪優化 / 暫不建議修改。",
    "【修改急迫度】",
    "- 緊接在是否建議立即修改後輸出，且只能三選一：高 / 中 / 低。",
    "【判定理由】",
    "- 用一句話說明為什麼你給出這個修改建議與急迫度。",
    "【關鍵判斷】",
    "- 用 3 至 5 點說明你對這份檢核表的核心判斷。",
    "【採納判定】",
    "- 先列出你同意可直接落地、部分同意需改寫、不同意不應落地的重點。",
    "【風險與盲點】",
    "- 用高 / 中 / 低優先級整理問題。",
    "【不建議直接落地 / 避免誤會】",
    "- 這一區只寫你不同意或不建議直接照做的點，說明原因、風險與替代方向。",
    "- 這一區不得寫成 IDE 執行提示詞，避免後續誤貼實作。",
    "【給 IDE 的內容與順序修改提示詞】",
    "- 至少提供 3 組提示詞，依高優先、中優先、低優先排序。",
    "- 每組請用 Plaintext 區塊輸出，方便直接複製給 IDE。",
    "- 每組提示詞都必須是可直接貼給 IDE 的完整指令，不要寫成摘要。",
    "- 若你認為某些已完成任務仍需調整，請在提示詞中明確標示為「微調 / 補強 / 驗證」，不要寫成從零重做。",
    "【給 IDE 的下次 LLM 提示詞優化建議】",
    "- 【嚴格限制】絕對禁止在此區塊生成任何專案文案、文章或實作細節。",
    "- 這一區的唯一目的：讓高階 LLM 對 IDE 提出「閉環優化建議」，幫助 IDE 下次能更精準地控制 LLM。",
    "- 至少提供 3 點建議，請直接告訴 IDE：下次在發送任務 Prompt 時，應該要增加哪些具體的「字數限制、語氣框架、防呆指令或格式斷言（Assertion）」，來防堵 LLM 的發散與誤判。",
    "- 第二區只能修正「下次要複製貼給本工具的母提示詞」本身，不得改寫未來子任務 Prompt，例如留言模版、COPE 分發、網站文案、文章產出或 API 工作流。",
    "- 寫法範例：「下次在母提示詞開頭加入核心角色斷言，明確要求高階 LLM 保持框架設計者視角，不得越界代寫內容。」「下次在第二區新增禁止事項，明定不得輸出任何下游任務提示詞，只能修正母提示詞的角色、邊界、格式與驗收斷言。」",
    "【給 IDE 的網站架構設計修改提示詞】",
    "- 至少提供 2 組提示詞，聚焦網站資訊架構、區塊編排、元件拆分、互動流程、可擴充性或後續維護性。",
    "- 這一區只能談網站 / 產品 / 頁面架構設計，不要重複任務文案微調。",
    "- 每組請用 Plaintext 區塊輸出，方便直接複製給 IDE。",
    "- 每組提示詞同樣必須是可直接貼給 IDE 的完整指令，並附上預期改善目標。",
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
  ];

  // 跨產業技能槓桿段 — 讓覆核者知道使用者已掌握的能力，避免重複教基本功
  const relevantSkills = allSkills
    .filter((s) => s.appliesToIndustryIds.includes(industry.id))
    .sort((a, b) => MATURITY_RANK[b.maturity] - MATURITY_RANK[a.maturity]);

  if (relevantSkills.length > 0) {
    lines.push("---");
    lines.push("使用者在「此產業」已可槓桿的跨產業技能積累：");
    lines.push("（這些是從其他產業驗收帶過來的能力；在評估此產業任務時請相應調降基本功教學）");
    lines.push("");
    relevantSkills.forEach((s) => {
      lines.push(`- [${MATURITY_LABEL[s.maturity]}] ${s.name}（${s.category}）— ${s.oneLiner}`);
    });
    lines.push("");
  }

  lines.push("完整檢核表內容：");

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

export function CareerPlannerApp({ embedded = false }: { embedded?: boolean } = {}) {
  // 嵌入模式：可由 query string ?embedded=1 觸發（從 page.tsx 傳入）
  const [selectedIndustryId, setSelectedIndustryId] = useState(industries[0]?.id ?? "");
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(defaultCompletionMap);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [portfolioCopyState, setPortfolioCopyState] = useState<CopyState>("idle");

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

  const toggleTask = (item: ChecklistItem) => {
    setCompletedTasks((current) => {
      const nextChecked = !getItemCompletionState(item, current).checked;
      const nextState = { ...current };

      collectTaskIds(item).forEach((taskId) => {
        nextState[taskId] = nextChecked;
      });

      return nextState;
    });
  };

  const writeToClipboard = async (text: string, setState: (state: CopyState) => void) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setState("success");
      window.setTimeout(() => setState("idle"), 2400);
    } catch {
      setState("error");
      window.setTimeout(() => setState("idle"), 2400);
    }
  };

  const handleCopyForReview = () => {
    const reviewPrompt = buildReviewPrompt({
      industry: selectedIndustry,
      workflow: selectedWorkflow,
      completedTasks,
      stats,
      allSkills: skills,
    });
    void writeToClipboard(reviewPrompt, setCopyState);
  };

  const handleCopyPortfolio = () => {
    const portfolioPrompt = buildPortfolioReviewPrompt({
      industries,
      workflows,
      completedTasks,
      projectProgress,
      allSkills: skills,
      focusIndustryId: selectedIndustryId,
    });
    void writeToClipboard(portfolioPrompt, setPortfolioCopyState);
  };

  return (
    <main className="min-h-screen px-4 py-4 text-ink sm:px-6 lg:px-8">
      <div
        className={[
          "mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col overflow-hidden rounded-shell border border-white/70 bg-white/55 shadow-float backdrop-blur-xl",
          embedded ? "" : "lg:flex-row",
        ].join(" ")}
      >
        {!embedded && (
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
        )}

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
                    複製內容會包含目前整張檢核表、已完成與待補強摘要、FAQ，以及要求高階 LLM 先做採納判定，再分別回傳「內容調整」與「結構設計」兩類 IDE 提示詞。
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

              <section className="rounded-[28px] border border-white/80 bg-white/72 p-6 shadow-soft backdrop-blur-md sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.28em] text-stone-400">全站 CSO 打包</p>
                    <h3 className="text-2xl font-semibold tracking-tight text-ink">把四個產業一起送審</h3>
                    <p className="max-w-xl text-sm leading-7 text-stone-600">
                      適用於想要做「跨產業策略覆核」或「本季火力集中決策」的情境——按鈕會把四個產業的進度矩陣、各自的待辦節錄，彙整成可貼到任何外部 LLM 的 markdown。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPortfolio}
                    className={[
                      "shrink-0 rounded-full px-4 py-2 text-sm transition",
                      portfolioCopyState === "success"
                        ? "border border-stone-300 bg-[#ece5dc] text-ink"
                        : portfolioCopyState === "error"
                          ? "border border-red-200 bg-red-50 text-red-600"
                          : "border border-ink/15 bg-ink text-[#fbf8f3] hover:-translate-y-0.5 hover:bg-stone-700",
                    ].join(" ")}
                  >
                    {portfolioCopyState === "success"
                      ? "已複製全站摘要"
                      : portfolioCopyState === "error"
                        ? "複製失敗，請重試"
                        : "一鍵打包給 CSO"}
                  </button>
                </div>
              </section>

              <SkillsPanel
                skills={skills}
                industries={industries}
                onJumpToIndustry={(id) => {
                  setSelectedIndustryId(id);
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              />

              <IndustryMaturityPanel
                industries={industries}
                projectProgress={projectProgress}
                selectedIndustryId={selectedIndustry.id}
                onSelect={setSelectedIndustryId}
              />

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

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/60 bg-white/60 px-5 py-4 text-xs text-stone-500 backdrop-blur-sm">
          <span>Cross-Industry Career Planner · 自用工作台</span>
          <Link
            href="/blueprint"
            className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 font-medium text-amber-800 transition hover:bg-amber-100"
          >
            未來藍圖 →
          </Link>
        </footer>
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
  onToggleTask: (item: ChecklistItem) => void;
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
  onToggleTask: (item: ChecklistItem) => void;
  theme: (typeof themeStyles)[ThemeName];
}) {
  const hasChildren = Boolean(item.children?.length);
  const childCount = item.children?.length ?? 0;
  const childLabel = depth === 0 ? `含 ${childCount} 項子任務` : `含 ${childCount} 項子步驟`;
  const [open, setOpen] = useState(depth === 0 && hasChildren);
  const checkboxRef = useRef<HTMLInputElement>(null);
  const { checked, partiallyChecked } = getItemCompletionState(item, completedTasks);
  const isRecurring = item.status === "recurring";

  useEffect(() => {
    if (!checkboxRef.current) return;
    checkboxRef.current.indeterminate = partiallyChecked;
  }, [partiallyChecked]);

  return (
    <div className={depth > 0 ? "ml-4 border-l border-stone-200/80 pl-4 sm:ml-6" : ""}>
      <div
        className={[
          "overflow-hidden rounded-[20px] border transition duration-300",
          isRecurring
            ? checked
              ? `${theme.soft} ${theme.border} border-dashed opacity-80`
              : "border-dashed border-stone-300 bg-[#faf7f2]"
            : checked
              ? `${theme.soft} ${theme.border} opacity-70`
              : "border-stone-200/80 bg-white",
        ].join(" ")}
      >
        <div className="flex items-start gap-4 px-4 py-4 sm:px-5">
          {isRecurring ? (
            <button
              type="button"
              onClick={() => onToggleTask(item)}
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
              ref={checkboxRef}
              type="checkbox"
              checked={checked}
              onChange={() => onToggleTask(item)}
              className="mt-0.5 h-5 w-5 cursor-pointer rounded border-stone-300 text-stone-700 focus:ring-stone-400"
              aria-label={`完成 ${item.title}`}
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={[
                  "text-base font-medium",
                  isRecurring
                    ? checked
                      ? "text-stone-600"
                      : "text-ink"
                    : checked
                      ? "text-stone-500 line-through"
                      : "text-ink",
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

function ProgressRing({
  size = 64,
  strokeWidth = 6,
  rate,
  colorClass,
  trackClass,
  label,
  onClick,
}: {
  size?: number;
  strokeWidth?: number;
  rate: number;
  colorClass: string;
  trackClass: string;
  label: string;
  onClick?: () => void;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, rate));
  const dashOffset = circumference * (1 - clamped / 100);

  const interactiveProps = onClick
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick,
        onKeyDown: (event: React.KeyboardEvent<SVGSVGElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
          }
        },
      }
    : {};

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={onClick ? "cursor-pointer transition-transform hover:scale-105" : ""}
        aria-label={`${label} 完成率 ${clamped}%`}
        {...interactiveProps}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackClass}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={colorClass}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          className="fill-ink font-semibold"
          style={{ fontSize: size * 0.28 }}
        >
          {clamped}%
        </text>
      </svg>
      <span className="text-xs text-stone-600">{label}</span>
    </div>
  );
}

function IndustryMaturityPanel({
  industries,
  projectProgress,
  selectedIndustryId,
  onSelect,
}: {
  industries: Industry[];
  projectProgress: Record<
    string,
    {
      oneTimeTotal: number;
      oneTimeDone: number;
      oneTimeRate: number;
      recurringTotal: number;
      recurringDone: number;
    }
  >;
  selectedIndustryId: string;
  onSelect: (id: string) => void;
}) {
  const themeSolidClass: Record<ThemeName, string> = {
    sage: "stroke-sage-500",
    dusty: "stroke-dusty-500",
    terracotta: "stroke-terracotta-500",
    slate: "stroke-slate-500",
  };
  const themeTextClass: Record<ThemeName, string> = {
    sage: "text-sage-600",
    dusty: "text-dusty-600",
    terracotta: "text-terracotta-600",
    slate: "text-slate-600",
  };

  return (
    <section className="rounded-[28px] border border-white/80 bg-white/68 p-6 shadow-soft backdrop-blur-md sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-400">全站儀表板</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">四產業成熟度環</h3>
        </div>
        <p className="text-xs text-stone-500">點擊任一環切換檢核表</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
        {industries.map((industry) => {
          const progress = projectProgress[industry.id];
          const isActive = industry.id === selectedIndustryId;
          return (
            <div
              key={industry.id}
              className={[
                "flex flex-col items-center gap-2 rounded-2xl px-2 py-3 transition",
                isActive ? "bg-[#f6f1e9]" : "",
              ].join(" ")}
            >
              <ProgressRing
                rate={progress.oneTimeRate}
                colorClass={themeSolidClass[industry.theme]}
                trackClass="stroke-stone-200"
                label={industry.shortLabel}
                onClick={() => onSelect(industry.id)}
              />
              <span className={["text-[11px] font-medium", themeTextClass[industry.theme]].join(" ")}>
                {progress.oneTimeDone}/{progress.oneTimeTotal}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}


function SkillsPanel({
  skills,
  industries,
  onJumpToIndustry,
}: {
  skills: Skill[];
  industries: Industry[];
  onJumpToIndustry: (industryId: string) => void;
}) {
  const lite = industries.map((i) => ({ id: i.id, shortLabel: i.shortLabel }));

  // 建立 sourceTaskIds → SkillTaskRef[] 對映
  const idToTitle = new Map<string, { industryId: string; industryShortLabel: string; taskTitle: string }>();
  industries.forEach((ind) => {
    const proj = workflows[ind.id];
    if (!proj) return;
    const collect = (items: ChecklistItem[]) => {
      items.forEach((it) => {
        idToTitle.set(`${ind.id}/${it.id}`, {
          industryId: ind.id,
          industryShortLabel: ind.shortLabel,
          taskTitle: it.title,
        });
        if (it.children) collect(it.children);
      });
    };
    proj.sections.forEach((sec) => collect(sec.items));
  });

  const taskRefs: { industryId: string; industryShortLabel: string; taskId: string; taskTitle: string }[] = [];
  skills.forEach((s) => {
    s.sourceTaskIds.forEach((tid) => {
      const info = idToTitle.get(tid);
      if (info) {
        taskRefs.push({
          industryId: info.industryId,
          industryShortLabel: info.industryShortLabel,
          taskId: tid,
          taskTitle: info.taskTitle,
        });
      }
    });
  });

  return <SkillsPanelView skills={skills} industries={lite} taskRefs={taskRefs} onJumpToIndustry={onJumpToIndustry} />;
}



