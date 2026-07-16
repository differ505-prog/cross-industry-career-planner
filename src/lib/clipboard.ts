// 共用：寫入剪貼簿（含 fallback）
export type CopyStatus = "idle" | "success" | "error";

export async function writeToClipboard(
  text: string,
  setStatus: (s: CopyStatus) => void,
): Promise<void> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else if (typeof document !== "undefined") {
      // fallback：隱形 <textarea> + execCommand
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
    setStatus("success");
    window.setTimeout(() => setStatus("idle"), 2400);
  } catch {
    setStatus("error");
    window.setTimeout(() => setStatus("idle"), 2400);
  }
}