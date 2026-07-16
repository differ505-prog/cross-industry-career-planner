// VibeList 序列化為 Markdown（純文字，方便貼給 LLM 優化再回貼）
import type { VibeListData, VibeListLevel, VibeListTask } from "@/data/types";

const fmtDate = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

function renderLevel(level: VibeListLevel, completedSet: Set<string>, opts: { checked: boolean }): string {
  const lines: string[] = [];
  lines.push(`## ${level.label}：${level.title}`);
  lines.push("");
  lines.push(`**摘要**：${level.summary}`);
  lines.push("");
  lines.push("### 任務");

  for (const task of level.tasks) {
    if (task.kind === "single") {
      const checked = opts.checked ? completedSet.has(task.id) : false;
      lines.push(`- [${checked ? "x" : " "}] ${task.content}`);
    } else if (task.kind === "single-with-lines") {
      const checked = opts.checked ? completedSet.has(task.id) : false;
      lines.push(`- [${checked ? "x" : " "}] ${task.content}`);
      for (const sub of task.lines) lines.push(`  - ${sub}`);
    } else if (task.kind === "theory") {
      lines.push("");
      for (const l of task.lines) lines.push(`> ${l}`);
    } else {
      // highlight
      lines.push("");
      lines.push(`**${task.title}**`);
      for (const l of task.lines) lines.push(`  - ${l}`);
    }
  }

  if (level.milestone) {
    lines.push("");
    lines.push("### " + level.milestone.title);
    lines.push(`- **指標**：${level.milestone.metric}`);
    lines.push(`- **達標**：${level.milestone.condition}`);
  }

  return lines.join("\n");
}

export interface VibeListCopyOptions {
  completedTasks?: Record<string, boolean>;
  includeCheckedState?: boolean; // 若 false 則全部 [ ]
}

export function serializeVibeList(
  data: VibeListData,
  options: VibeListCopyOptions = {},
): string {
  const { completedTasks = {}, includeCheckedState = false } = options;
  const completedSet = new Set(
    Object.entries(completedTasks).filter(([, v]) => v).map(([k]) => k),
  );
  const checked = includeCheckedState;

  const out: string[] = [];
  out.push(`# ${data.name}`);
  out.push("");
  out.push(`> ${data.overview}`);
  out.push("");
  out.push(`> 導出日期：${fmtDate()}`);
  out.push("");
  out.push("## 簡介");
  out.push("");
  out.push(data.intro);
  out.push("");

  for (const lv of data.levels) {
    out.push(renderLevel(lv, completedSet, { checked }));
    out.push("");
  }

  return out.join("\n").trim() + "\n";
}

export function serializeVibeListLevel(
  level: VibeListLevel,
  parentName: string,
  completedTasks: Record<string, boolean> = {},
  includeCheckedState = false,
): string {
  const completedSet = new Set(
    Object.entries(completedTasks).filter(([, v]) => v).map(([k]) => k),
  );
  const out: string[] = [];
  out.push(`# ${parentName} — ${level.label}：${level.title}`);
  out.push("");
  out.push(`> 導出日期：${fmtDate()}`);
  out.push("");
  out.push(renderLevel(level, completedSet, { checked: includeCheckedState }));
  return out.join("\n").trim() + "\n";
}