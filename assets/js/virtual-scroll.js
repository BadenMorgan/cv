/**
 * Viewport virtualization: only ~current chunk ±1 exist as real DOM;
 * others are height spacers so scroll position is preserved.
 */

let state = {
  container: null,
  chunks: [],
  heights: [],
  data: null,
  buildChunk: null,
  paintWidth: 640,
  buffer: 1,
  mounted: new Map(),
  onScroll: null,
  onResize: null,
};

function totalHeight() {
  return state.heights.reduce((a, b) => a + b, 0);
}

function offsetOf(index) {
  let y = 0;
  for (let i = 0; i < index; i++) y += state.heights[i];
  return y;
}

function measureChunk(el) {
  return Math.max(el.getBoundingClientRect().height, 48);
}

function visibleRange() {
  const scrollY = window.scrollY || window.pageYOffset;
  const viewH = window.innerHeight;
  const mainTop = state.container.getBoundingClientRect().top + scrollY;
  const viewTop = scrollY - mainTop;
  const viewBottom = viewTop + viewH;

  let acc = 0;
  let first = 0;
  let last = state.chunks.length - 1;

  for (let i = 0; i < state.heights.length; i++) {
    const next = acc + state.heights[i];
    if (next > viewTop) {
      first = i;
      break;
    }
    acc = next;
  }

  acc = 0;
  for (let i = 0; i < state.heights.length; i++) {
    acc += state.heights[i];
    if (acc >= viewBottom) {
      last = i;
      break;
    }
  }

  first = Math.max(0, first - state.buffer);
  last = Math.min(state.chunks.length - 1, last + state.buffer);
  return { first, last };
}

function clearMounted() {
  for (const [, node] of state.mounted) {
    node.remove();
  }
  state.mounted.clear();
}

function paint() {
  if (!state.container) return;
  const { first, last } = visibleRange();
  const keep = new Set();

  for (let i = first; i <= last; i++) {
    keep.add(i);
    if (state.mounted.has(i)) continue;
    const el = state.buildChunk(state.chunks[i], state.data, state.paintWidth);
    el.style.position = "absolute";
    el.style.left = "0";
    el.style.right = "0";
    el.style.top = `${offsetOf(i)}px`;
    state.container.querySelector(".virtual-scroll-window").appendChild(el);
    state.mounted.set(i, el);

    // Refine height after images/layout settle
    requestAnimationFrame(() => {
      if (!state.mounted.has(i)) return;
      const h = measureChunk(el);
      if (Math.abs(h - state.heights[i]) > 2) {
        state.heights[i] = h;
        syncSpacer();
        repositionMounted();
      }
    });
  }

  for (const [i, node] of [...state.mounted]) {
    if (!keep.has(i)) {
      node.remove();
      state.mounted.delete(i);
    }
  }
}

function repositionMounted() {
  for (const [i, el] of state.mounted) {
    el.style.top = `${offsetOf(i)}px`;
  }
}

function syncSpacer() {
  const spacer = state.container.querySelector(".virtual-scroll-spacer");
  if (spacer) spacer.style.height = `${totalHeight()}px`;
}

async function estimateHeights() {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;visibility:hidden;left:-9999px;width:" +
    state.paintWidth +
    "px;";
  document.body.appendChild(probe);

  for (let i = 0; i < state.chunks.length; i++) {
    const el = state.buildChunk(state.chunks[i], state.data, state.paintWidth);
    probe.appendChild(el);
    // Allow image paint attempts to start; use provisional height
    await new Promise((r) => requestAnimationFrame(r));
    state.heights[i] = measureChunk(el);
    probe.innerHTML = "";
  }

  probe.remove();
}

export async function initVirtualScroll({
  container,
  chunks,
  data,
  buildChunk,
  paintWidth,
}) {
  destroyVirtualScroll();

  state.container = container;
  state.chunks = chunks;
  state.data = data;
  state.buildChunk = buildChunk;
  state.paintWidth = paintWidth || Math.min(640, container.clientWidth || 640);
  state.heights = new Array(chunks.length).fill(240);
  state.mounted = new Map();

  container.innerHTML = `
    <div class="virtual-scroll-spacer" aria-hidden="true"></div>
    <div class="virtual-scroll-window"></div>
  `;

  await estimateHeights();
  syncSpacer();
  paint();

  state.onScroll = () => paint();
  state.onResize = () => {
    state.paintWidth = Math.min(640, container.clientWidth || 640);
    remount();
  };
  window.addEventListener("scroll", state.onScroll, { passive: true });
  window.addEventListener("resize", state.onResize);
}

export async function remount() {
  if (!state.container) return;
  clearMounted();
  await estimateHeights();
  syncSpacer();
  paint();
}

export function destroyVirtualScroll() {
  if (state.onScroll) window.removeEventListener("scroll", state.onScroll);
  if (state.onResize) window.removeEventListener("resize", state.onResize);
  clearMounted();
  state = {
    container: null,
    chunks: [],
    heights: [],
    data: null,
    buildChunk: null,
    paintWidth: 640,
    buffer: 1,
    mounted: new Map(),
    onScroll: null,
    onResize: null,
  };
}
