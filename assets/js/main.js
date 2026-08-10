import { renderShell, buildChunkElement } from "./render.js";
import { initPrintGuard, registerPrintRestoreCallback } from "./print-guard.js";
import { initVirtualScroll, remount } from "./virtual-scroll.js";

async function boot() {
  initPrintGuard();

  const res = await fetch("assets/data/resume.json", { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load résumé data (${res.status})`);
  const data = await res.json();

  renderShell(data);

  const vsRoot = document.getElementById("virtual-scroll-root");
  const paintWidth = Math.min(
    640,
    Math.max(280, (vsRoot?.clientWidth || 640) - 8)
  );

  await initVirtualScroll({
    container: vsRoot,
    chunks: data.mainChunks,
    data,
    buildChunk: buildChunkElement,
    paintWidth,
  });

  registerPrintRestoreCallback(() => {
    remount();
  });
}

boot().catch((err) => {
  console.error(err);
  const root = document.getElementById("cv-root");
  if (root) {
    root.hidden = false;
    root.innerHTML = `<p style="padding:2rem">Could not load résumé. <a href="https://badenmorgan.github.io/cv/">${err.message}</a></p>`;
  }
});
