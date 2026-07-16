import vibelistData from "@/data/vibelist.json";
import { VibeListPage } from "@/components/vibelist-page";
import type { VibeListData } from "@/data/types";

export const metadata = {
  title: "VibeList — 任務管理 SaaS 商業化藍圖",
  description:
    "從 Vibe Coding 到百萬營收的 9 階段商業化實戰指南。可勾選進度、一鍵複製 Markdown。",
};

export default function VibeListRoute() {
  return <VibeListPage data={vibelistData as VibeListData} />;
}