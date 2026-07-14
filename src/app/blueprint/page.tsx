import blueprintData from "@/data/blueprint.json";
import { BlueprintPage } from "@/components/blueprint-page";

export const metadata = {
  title: "未來藍圖 · Nexus OS 技能矩陣樞紐",
  description:
    "這個專案接下來要怎麼走——技術架構、介面演進、5 個里程碑的現在 vs 接下來。",
};

export default function BlueprintRoute() {
  return <BlueprintPage blocks={blueprintData as any} />;
}
