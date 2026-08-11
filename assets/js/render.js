const ICON_MAP = {
  "id-card": "fa-id-card",
  cubes: "fa-cubes",
  "person-hiking": "fa-person-hiking",
  "screwdriver-wrench": "fa-screwdriver-wrench",
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Draw sensitive text to a canvas and return CSS background dimensions. */
export function paintTextBlock(block, opts = {}) {
  const width = opts.width || 640;
  const fontSize = opts.fontSize || 14;
  const lineHeight = opts.lineHeight || fontSize * 1.45;
  const padding = opts.padding || 2;
  const color = opts.color || "#222222";
  const bulletIndent = 18;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = `${fontSize}px "Times New Roman", Times, serif`;

  const allLines = [];
  if (block.kind === "paragraphs") {
    for (const para of block.paragraphs) {
      const wrapped = wrapText(ctx, para, width - padding * 2);
      allLines.push(...wrapped.map((t) => ({ t, bullet: false })));
      allLines.push({ t: "", bullet: false });
    }
    if (allLines.length && allLines[allLines.length - 1].t === "") {
      allLines.pop();
    }
  } else {
    for (const item of block.items) {
      const wrapped = wrapText(ctx, item, width - padding * 2 - bulletIndent);
      wrapped.forEach((t, i) => {
        allLines.push({ t, bullet: i === 0 });
      });
      allLines.push({ t: "", bullet: false });
    }
    if (allLines.length && allLines[allLines.length - 1].t === "") {
      allLines.pop();
    }
  }

  const height = Math.max(
    lineHeight,
    padding * 2 + allLines.length * lineHeight
  );
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.ceil(width * dpr);
  canvas.height = Math.ceil(height * dpr);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px "Times New Roman", Times, serif`;
  ctx.textBaseline = "top";

  let y = padding;
  for (const row of allLines) {
    if (row.t === "" && !row.bullet) {
      y += lineHeight * 0.35;
      continue;
    }
    const x = row.bullet || block.kind === "bullets" ? padding + bulletIndent : padding;
    if (row.bullet) {
      ctx.beginPath();
      ctx.arc(padding + 6, y + fontSize * 0.45, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillText(row.t, x, y);
    y += lineHeight;
  }

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width,
    height: Math.ceil(y + padding),
  };
}

function ariaForBlock(block) {
  if (block.kind === "paragraphs") return block.paragraphs.join(" ");
  return block.items.join(" ");
}

function fallbackHtml(block) {
  if (block.kind === "paragraphs") {
    return block.paragraphs
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("");
  }
  const items = block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("");
  return `<ul>${items}</ul>`;
}

export function createTextAsImageEl(blockId, block, paintOpts) {
  const el = document.createElement("div");
  el.className = "text-as-image";
  el.dataset.blockId = blockId;
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", ariaForBlock(block));

  try {
    const painted = paintTextBlock(block, paintOpts);
    el.style.backgroundImage = `url("${painted.dataUrl}")`;
    el.style.width = "100%";
    el.style.maxWidth = `${painted.width}px`;
    el.style.height = `${painted.height}px`;
  } catch (err) {
    console.warn("text-as-image fallback to DOM text", blockId, err);
    el.classList.add("text-as-image--fallback");
    el.removeAttribute("role");
    el.innerHTML = `<div class="text-as-image-fallback">${fallbackHtml(block)}</div>`;
    return el;
  }

  // Optional upgrade to committed PNG (same aspect) when present.
  const committed = `assets/text-images/${blockId}.png`;
  const img = new Image();
  img.onload = () => {
    const w = paintOpts?.width || 640;
    el.style.backgroundImage = `url("${committed}")`;
    el.style.height = `${(img.naturalHeight / img.naturalWidth) * w}px`;
  };
  img.src = committed;
  return el;
}

function sideSection(title, iconKey, bodyHtml) {
  const iconClass = ICON_MAP[iconKey] || "fa-circle";
  return `<section class="side-section cv-block" data-part="side-${escapeHtml(title)}">
    <h2 class="side-section-title">${escapeHtml(title)}</h2>
    <hr class="side-section-rule" />
    <div class="circle-icon" aria-hidden="true"><i class="fa-solid ${iconClass}"></i></div>
    ${bodyHtml}
  </section>`;
}

export function renderSidebar(data) {
  const { person, sidebar } = data;
  const details = sidebar.details.items
    .map((item) => {
      const value = item.href
        ? `<a href="${escapeHtml(item.href)}">${escapeHtml(item.value)}</a>`
        : escapeHtml(item.value);
      return `<p class="side-detail"><span>${escapeHtml(item.label)}:</span> ${value}</p>`;
    })
    .join("");

  const lines = (arr) =>
    arr.map((l) => `<p class="side-line">${escapeHtml(l)}</p>`).join("");

  const photo = person.photo
    ? `<img class="profile-photo" src="${escapeHtml(person.photo)}" alt="" width="108" height="108" />`
    : `<div class="profile-photo profile-photo--initials" aria-hidden="true">${escapeHtml(person.initials || "BM")}</div>`;

  return `<aside class="cv-sidebar">
    <div class="cv-sidebar-inner">
      ${photo}
      <h1 class="sidebar-name">${person.nameLines.map(escapeHtml).join("<br />")}</h1>
      <hr class="sidebar-rule" />
      <p class="sidebar-tagline">${escapeHtml(person.tagline)}</p>
      ${sideSection("Details", sidebar.details.icon, details)}
      ${sideSection("Expertise", sidebar.expertise.icon, lines(sidebar.expertise.lines))}
      ${sideSection("Strengths", sidebar.strengths.icon, lines(sidebar.strengths.lines))}
      ${sideSection("Skills & Tools", sidebar.skills.icon, lines(sidebar.skills.lines))}
      ${sidebar.updated ? `<p class="sidebar-colophon">${escapeHtml(sidebar.updated)}</p>` : ""}
    </div>
  </aside>`;
}

function titleDateRow(titleHtml, dateHtml, titleClass = "") {
  return `<div class="title-date-row">
    <div class="title-date-row__title ${titleClass}">${titleHtml}</div>
    <div class="title-date-row__date">${dateHtml}</div>
  </div>`;
}

export function buildChunkElement(chunk, data, paintWidth) {
  const section = document.createElement("section");
  section.className = "cv-block cv-chunk";
  section.dataset.chunkId = chunk.id;
  section.dataset.part = chunk.id;

  if (chunk.type === "profile") {
    if (chunk.title) {
      section.innerHTML = `<h2 class="main-section-title">${escapeHtml(chunk.title)}</h2><hr class="main-section-rule" />`;
    }
    const block = data.textBlocks[chunk.textBlockId];
    section.appendChild(
      createTextAsImageEl(chunk.textBlockId, block, {
        width: paintWidth,
        fontSize: 13,
        color: "#222222",
      })
    );
    return section;
  }

  if (chunk.type === "experience-company") {
    let html = "";
    if (chunk.showSectionTitle && chunk.title) {
      html += `<h2 class="main-section-title">${escapeHtml(chunk.title)}</h2><hr class="main-section-rule" />`;
    }
    html += titleDateRow(
      `<span class="company-name">${escapeHtml(chunk.company)}</span>`,
      escapeHtml(chunk.dates)
    );
    html += `<p class="company-meta">${escapeHtml(chunk.meta)}</p>`;
    section.innerHTML = html;

    for (const role of chunk.roles) {
      const roleEl = document.createElement("div");
      roleEl.className = "role-block";
      roleEl.innerHTML = titleDateRow(
        `<span class="role-title">${escapeHtml(role.title)}</span>`,
        escapeHtml(role.dates)
      );
      const duties = data.textBlocks[role.dutiesBlockId];
      roleEl.appendChild(
        createTextAsImageEl(role.dutiesBlockId, duties, {
          width: paintWidth,
          fontSize: 12.5,
          color: "#222222",
        })
      );
      section.appendChild(roleEl);
    }
    return section;
  }

  if (chunk.type === "education") {
    let html = `<h2 class="main-section-title">${escapeHtml(chunk.title)}</h2><hr class="main-section-rule" />`;
    for (const deg of chunk.degrees) {
      html += titleDateRow(
        `<span class="role-title">${escapeHtml(deg.qualification)}</span>`,
        escapeHtml(deg.years)
      );
      html += `<p class="degree-institution">${escapeHtml(deg.institution)}</p>`;
    }
    section.innerHTML = html;
    return section;
  }

  section.textContent = `Unknown chunk ${chunk.type}`;
  return section;
}

function encodePath(path) {
  return String(path)
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

function renderPdfButton(pdf) {
  if (!pdf?.href) return "";
  const href = encodePath(pdf.href);
  const filename = pdf.filename || "resume.pdf";
  const label = pdf.label || "Download PDF";
  return `<a class="pdf-download" href="${escapeHtml(href)}" download="${escapeHtml(filename)}" aria-label="${escapeHtml(label)}">
    <i class="fa-solid fa-arrow-down" aria-hidden="true"></i>
    <span class="pdf-download__label">${escapeHtml(label)}</span>
  </a>`;
}

export function renderShell(data) {
  const root = document.getElementById("cv-root");
  root.innerHTML = `${renderSidebar(data)}<div class="cv-main"><div id="virtual-scroll-root" class="virtual-scroll-viewport"></div></div>${renderPdfButton(data.pdf)}`;
  root.hidden = false;
  return root;
}
