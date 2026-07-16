// VibeList 進度統計
import type { VibeListData, VibeListTask } from "@/data/types";

export interface VibeListStats {
  total: number;
  done: number;
  rate: number;
}

// VibeList 中「可勾選」的 task id 集合
export function collectCheckableIds(levels: VibeListData["levels"]): string[] {
  const ids: string[] = [];
  for (const lv of levels) {
    for (const t of lv.tasks) {
      if (isCheckable(t)) ids.push(t.id);
    }
  }
  return ids;
}

export function buildVibeListStats(
  levels: VibeListData["levels"],
  completedTasks: Record<string, boolean>,
): VibeListStats {
  const checkable = collectCheckableIds(levels);
  const done = checkable.filter((id) => completedTasks[id]).length;
  return {
    total: checkable.length,
    done,
    rate: checkable.length === 0 ? 0 : Math.round((done / checkable.length) * 100),
  };
}

export function isCheckable(task: VibeListTask): boolean {
  return task.kind === "single" || task.kind === "single-with-lines";
}