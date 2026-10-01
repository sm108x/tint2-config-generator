// tint2 Config Generator — state, controls, live preview, and tint2rc export.

const state = {
  panel: {
    edge: "bottom",        // top | bottom | left | right
    align: "center",       // start | center | end
    monitor: "all",        // all | 1 | 2 | 3
    layer: "top",          // bottom | normal | top
    lengthVal: 100, lengthUnit: "%",
    thickness: 30,
    marginX: 0, marginY: 0,
    paddingX: 2, paddingY: 2, spacing: 2,
    radius: 6, borderWidth: 0, borderSides: "all",
    borderColor: "#ffffff", borderAlpha: 20,
    bgColor: "#1e1e2e", bgAlpha: 85,
  },
  items: [
    { code: "L", name: "Launcher", enabled: false },
    { code: "T", name: "Taskbar", enabled: true },
    { code: "P", name: "Pager", enabled: false },
    { code: "F", name: "Free space", enabled: false },
    { code: "C", name: "Clock", enabled: true },
    { code: "B", name: "Battery", enabled: false },
    { code: "S", name: "Systray", enabled: true },
  ],
  font: { family: "Sans", size: 10 },
  taskbar: {
    mode: "single_desktop", showIcon: true, showText: true, centered: false,
    maxWidth: 140, paddingX: 4, paddingY: 2,
    fontColor: "#ffffff", fontAlpha: 100,
    activeColor: "#ffffff", activeAlpha: 18,
    normalAlpha: 6,
  },
  clock: {
    format1: "%H:%M", format2: "%A %d %B",
    paddingX: 4, paddingY: 0,
    fontColor: "#ffffff", fontAlpha: 100,
    clickCmd: "",
  },
  battery: {
    hideWhenFull: false, lowStatus: 15,
    lowCmd: 'notify-send "Battery low"',
    fontColor: "#ffffff", fontAlpha: 100,
  },
  systray: {
    paddingX: 2, paddingY: 2, spacing: 2,
    iconSize: 16, sort: "ascending", monitor: 1,
  },
  launcher: {
    apps: "/usr/share/applications/firefox.desktop\n/usr/share/applications/org.gnome.Nautilus.desktop",
    iconSize: 24, paddingX: 2, paddingY: 2,
  },
};

// ---------- helpers ----------

function getPath(obj, path) {
  return path.split(".").reduce((o, k) => o[k], obj);
}
function setPath(obj, path, val) {
  const parts = path.split(".");
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
  o[parts[parts.length - 1]] = val;
}
function colorAlpha(hex, alpha) {
  return `${hex} ${alpha}`;
}
function fmtLength(val, unit) {
  return unit === "%" ? `${val}%` : `${val}`;
}
function borderSidesStr(mode) {
  switch (mode) {
    case "all": return "TBLR";
    case "top": return "T";
    case "bottom": return "B";
    case "left": return "L";
    case "right": return "R";
    default: return "";
  }
}

// ---------- controls (left column) ----------

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

function labeledRow(fields) {
  return `<div class="row">${fields.join("")}</div>`;
}

function field(labelText, inputHtml) {
  return `<div><label>${labelText}</label>${inputHtml}</div>`;
}

function textInput(path, opts = {}) {
  const v = getPath(state, path);
  return `<input type="text" data-path="${path}" value="${v}" ${opts.attrs || ""}/>`;
}
function numberInput(path, opts = {}) {
  const v = getPath(state, path);
  return `<input type="number" data-path="${path}" data-parse="number" value="${v}" ${opts.attrs || ""}/>`;
}
function selectInput(path, options) {
  const v = getPath(state, path);
  const opts = options
    .map(([val, label]) => `<option value="${val}" ${val === v ? "selected" : ""}>${label}</option>`)
    .join("");
  return `<select data-path="${path}">${opts}</select>`;
}
function colorAlphaRow(colorPath, alphaPath) {
  const c = getPath(state, colorPath);
  const a = getPath(state, alphaPath);
  return `<div class="colorrow">
    <input type="color" data-path="${colorPath}" value="${c}"/>
    <input type="number" data-path="${alphaPath}" data-parse="number" min="0" max="100" value="${a}"/>
    <small class="hint">alpha %</small>
  </div>`;
}
function checkbox(path, labelText) {
  const v = getPath(state, path);
  return `<label class="check"><input type="checkbox" data-path="${path}" data-parse="bool" ${v ? "checked" : ""}/> ${labelText}</label>`;
}

function buildControlsHTML() {
  return `
  <fieldset>
    <legend>Panel</legend>
    ${labeledRow([
      field("Edge", selectInput("panel.edge", [["top","Top"],["bottom","Bottom"],["left","Left"],["right","Right"]])),
      field("Align", selectInput("panel.align", [["start","Start"],["center","Center"],["end","End"]])),
    ])}
    ${labeledRow([
      field("Monitor", selectInput("panel.monitor", [["all","All"],["1","1"],["2","2"],["3","3"]])),
      field("Layer", selectInput("panel.layer", [["bottom","Bottom"],["normal","Normal"],["top","Top"]])),
    ])}
    ${labeledRow([
      field("Length", numberInput("panel.lengthVal")),
      field("Unit", selectInput("panel.lengthUnit", [["%","%"],["px","px"]])),
      field("Thickness (px)", numberInput("panel.thickness")),
    ])}
    ${labeledRow([
      field("Margin X", numberInput("panel.marginX")),
      field("Margin Y", numberInput("panel.marginY")),
    ])}
    ${labeledRow([
      field("Padding X", numberInput("panel.paddingX")),
      field("Padding Y", numberInput("panel.paddingY")),
      field("Item spacing", numberInput("panel.spacing")),
    ])}
    ${labeledRow([
      field("Corner radius", numberInput("panel.radius")),
      field("Border width", numberInput("panel.borderWidth")),
      field("Border sides", selectInput("panel.borderSides", [["all","All"],["top","Top"],["bottom","Bottom"],["left","Left"],["right","Right"],["none","None"]])),
    ])}
    <label>Border color</label>
    ${colorAlphaRow("panel.borderColor", "panel.borderAlpha")}
    <label>Background color</label>
    ${colorAlphaRow("panel.bgColor", "panel.bgAlpha")}
  </fieldset>

  <fieldset>
    <legend>Panel items (order + enable)</legend>
    <div class="itemlist" id="itemlist"></div>
    <small class="hint">Use ▲▼ to reorder. Order here becomes panel_items left-to-right.</small>
  </fieldset>

  <fieldset>
    <legend>Font</legend>
    ${labeledRow([
      field("Family", textInput("font.family")),
      field("Size", numberInput("font.size")),
    ])}
  </fieldset>

  <fieldset>
    <legend>Taskbar</legend>
    ${labeledRow([
      field("Mode", selectInput("taskbar.mode", [["single_desktop","Current desktop"],["all_desktops","All desktops"]])),
      field("Max task width", numberInput("taskbar.maxWidth")),
    ])}
    ${checkbox("taskbar.showIcon", "Show icon")}
    ${checkbox("taskbar.showText", "Show text")}
    ${checkbox("taskbar.centered", "Center task text")}
    ${labeledRow([
      field("Padding X", numberInput("taskbar.paddingX")),
      field("Padding Y", numberInput("taskbar.paddingY")),
    ])}
    <label>Font color</label>
    ${colorAlphaRow("taskbar.fontColor", "taskbar.fontAlpha")}
    <label>Active task highlight</label>
    ${colorAlphaRow("taskbar.activeColor", "taskbar.activeAlpha")}
    <label>Normal task background alpha</label>
    ${numberInput("taskbar.normalAlpha", { attrs: 'min="0" max="100"' })}
  </fieldset>

  <fieldset>
    <legend>Clock</legend>
    ${labeledRow([
      field("Line 1 format", textInput("clock.format1")),
      field("Line 2 format", textInput("clock.format2")),
    ])}
    ${labeledRow([
      field("Padding X", numberInput("clock.paddingX")),
      field("Padding Y", numberInput("clock.paddingY")),
    ])}
    <label>Font color</label>
    ${colorAlphaRow("clock.fontColor", "clock.fontAlpha")}
    <label>Left-click command</label>
    ${textInput("clock.clickCmd", { attrs: 'placeholder="e.g. gsimplecal"' })}
  </fieldset>

  <fieldset>
    <legend>Battery</legend>
    ${checkbox("battery.hideWhenFull", "Hide when charge above 95%")}
    ${labeledRow([
      field("Low status %", numberInput("battery.lowStatus")),
    ])}
    <label>Low battery command</label>
    ${textInput("battery.lowCmd")}
    <label>Font color</label>
    ${colorAlphaRow("battery.fontColor", "battery.fontAlpha")}
  </fieldset>

  <fieldset>
    <legend>Systray</legend>
    ${labeledRow([
      field("Icon size (px)", numberInput("systray.iconSize")),
      field("Monitor", selectInput("systray.monitor", [["1","1"],["2","2"],["3","3"]])),
    ])}
    ${labeledRow([
      field("Padding X", numberInput("systray.paddingX")),
      field("Padding Y", numberInput("systray.paddingY")),
      field("Spacing", numberInput("systray.spacing")),
    ])}
    <label>Sort order</label>
    ${selectInput("systray.sort", [["ascending","Ascending"],["descending","Descending"],["left2right","Left to right"],["right2left","Right to left"]])}
  </fieldset>

  <fieldset>
    <legend>Launcher</legend>
    <label>App .desktop files (one per line)</label>
    <textarea data-path="launcher.apps" rows="4">${state.launcher.apps}</textarea>
    ${labeledRow([
      field("Icon size (px)", numberInput("launcher.iconSize")),
      field("Padding X", numberInput("launcher.paddingX")),
      field("Padding Y", numberInput("launcher.paddingY")),
    ])}
  </fieldset>
  `;
}

function renderItemList() {
  const list = document.getElementById("itemlist");
  list.innerHTML = "";
  state.items.forEach((item, idx) => {
    const row = el(`
      <div class="itemrow ${item.enabled ? "" : "disabled"}">
        <input type="checkbox" ${item.enabled ? "checked" : ""} />
        <span class="name">${item.name} (${item.code})</span>
        <button data-dir="-1" ${idx === 0 ? "disabled" : ""}>▲</button>
        <button data-dir="1" ${idx === state.items.length - 1 ? "disabled" : ""}>▼</button>
      </div>
    `);
    row.querySelector('input[type="checkbox"]').addEventListener("change", (e) => {
      item.enabled = e.target.checked;
      renderItemList();
      updateAll();
    });
    row.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dir = parseInt(btn.dataset.dir, 10);
        const swapIdx = idx + dir;
        if (swapIdx < 0 || swapIdx >= state.items.length) return;
        [state.items[idx], state.items[swapIdx]] = [state.items[swapIdx], state.items[idx]];
        renderItemList();
        updateAll();
      });
    });
    list.appendChild(row);
  });
}

function bindControls(root) {
  root.querySelectorAll("[data-path]").forEach((input) => {
    const path = input.dataset.path;
    const parse = input.dataset.parse;
    const handler = () => {
      let val;
      if (input.type === "checkbox") val = input.checked;
      else if (parse === "number") val = Number(input.value);
      else val = input.value;
      setPath(state, path, val);
      updateAll();
    };
    const evt = input.tagName === "SELECT" || input.type === "checkbox" || input.type === "color" ? "change" : "input";
    input.addEventListener(evt, handler);
  });
}

// ---------- live preview ----------

function sampleItemNode(code) {
  switch (code) {
    case "L": {
      const wrap = document.createElement("div");
      wrap.className = "titem launcher";
      for (let i = 0; i < 3; i++) {
        const ic = document.createElement("div");
        ic.className = "icon";
        wrap.appendChild(ic);
      }
      return wrap;
    }
    case "T": {
      const wrap = document.createElement("div");
      wrap.className = "titem taskbar";
      const samples = ["Terminal", "Browser", "Editor"];
      samples.forEach((label, i) => {
        const t = document.createElement("div");
        t.className = "task" + (i === 0 ? " active" : "");
        t.style.color = state.taskbar.fontColor;
        t.style.fontFamily = state.font.family;
        t.style.fontSize = state.font.size + "px";
        t.textContent = state.taskbar.showText ? label : "";
        if (state.taskbar.showIcon) {
          const ic = document.createElement("span");
          ic.style.display = "inline-block";
          ic.style.width = "10px";
          ic.style.height = "10px";
          ic.style.marginRight = "4px";
          ic.style.borderRadius = "2px";
          ic.style.background = "rgba(255,255,255,0.5)";
          t.prepend(ic);
        }
        t.style.background = i === 0
          ? `${state.taskbar.activeColor}${Math.round(state.taskbar.activeAlpha * 2.55).toString(16).padStart(2,"0")}`
          : `#ffffff${Math.round(state.taskbar.normalAlpha * 2.55).toString(16).padStart(2,"0")}`;
        wrap.appendChild(t);
      });
      return wrap;
    }
    case "P": {
      const wrap = document.createElement("div");
      wrap.className = "titem pager";
      for (let i = 0; i < 4; i++) {
        const d = document.createElement("div");
        d.style.width = "14px";
        d.style.height = "14px";
        d.style.borderRadius = "2px";
        d.style.background = i === 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.12)";
        wrap.appendChild(d);
      }
      return wrap;
    }
    case "C": {
      const wrap = document.createElement("div");
      wrap.className = "titem clock";
      wrap.style.color = state.clock.fontColor;
      wrap.style.fontFamily = state.font.family;
      wrap.style.fontSize = state.font.size + "px";
      wrap.style.flexDirection = "column";
      wrap.style.alignItems = "center";
      wrap.style.lineHeight = "1.1";
      const l1 = document.createElement("div");
      l1.textContent = sampleTime(state.clock.format1);
      const l2 = document.createElement("div");
      l2.style.fontSize = Math.max(8, state.font.size - 2) + "px";
      l2.style.opacity = "0.75";
      l2.textContent = sampleTime(state.clock.format2);
      wrap.appendChild(l1);
      if (state.clock.format2.trim()) wrap.appendChild(l2);
      return wrap;
    }
    case "B": {
      const wrap = document.createElement("div");
      wrap.className = "titem battery";
      wrap.style.color = state.battery.fontColor;
      wrap.style.fontFamily = state.font.family;
      wrap.style.fontSize = state.font.size + "px";
      const ic = document.createElement("span");
      ic.className = "icon";
      ic.style.width = "18px";
      ic.style.height = "10px";
      wrap.appendChild(ic);
      const t = document.createElement("span");
      t.textContent = "82%";
      wrap.appendChild(t);
      return wrap;
    }
    case "S": {
      const wrap = document.createElement("div");
      wrap.className = "titem systray";
      for (let i = 0; i < 3; i++) {
        const ic = document.createElement("div");
        ic.className = "icon";
        ic.style.width = state.systray.iconSize * 0.7 + "px";
        ic.style.height = state.systray.iconSize * 0.7 + "px";
        wrap.appendChild(ic);
      }
      return wrap;
    }
    case "F": {
      const wrap = document.createElement("div");
      wrap.className = "titem freespace";
      wrap.style.flex = "1 1 auto";
      return wrap;
    }
    default:
      return document.createElement("div");
  }
}

function sampleTime(fmt) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return fmt
    .replace(/%H/g, pad(now.getHours()))
    .replace(/%M/g, pad(now.getMinutes()))
    .replace(/%A/g, days[now.getDay()])
    .replace(/%d/g, pad(now.getDate()))
    .replace(/%B/g, months[now.getMonth()]);
}

function renderPreview() {
  const stage = document.getElementById("preview-stage");
  const desktop = document.getElementById("desktop");
  desktop.innerHTML = "";

  const p = state.panel;
  const orientation = (p.edge === "top" || p.edge === "bottom") ? "horizontal" : "vertical";
  const stageRect = stage.getBoundingClientRect();

  const panelEl = document.createElement("div");
  panelEl.className = "tpanel";

  const lengthPx = p.lengthUnit === "%"
    ? (orientation === "horizontal" ? stageRect.width : stageRect.height) * p.lengthVal / 100
    : p.lengthVal;
  const thicknessPx = p.thickness;

  if (orientation === "horizontal") {
    panelEl.style.width = lengthPx + "px";
    panelEl.style.height = thicknessPx + "px";
    panelEl.style.flexDirection = "row";
    if (p.edge === "top") panelEl.style.top = p.marginY + "px";
    else panelEl.style.bottom = p.marginY + "px";
    if (p.align === "start") panelEl.style.left = p.marginX + "px";
    else if (p.align === "end") panelEl.style.right = p.marginX + "px";
    else panelEl.style.left = (stageRect.width - lengthPx) / 2 + "px";
  } else {
    panelEl.style.height = lengthPx + "px";
    panelEl.style.width = thicknessPx + "px";
    panelEl.style.flexDirection = "column";
    if (p.edge === "left") panelEl.style.left = p.marginX + "px";
    else panelEl.style.right = p.marginX + "px";
    if (p.align === "start") panelEl.style.top = p.marginY + "px";
    else if (p.align === "end") panelEl.style.bottom = p.marginY + "px";
    else panelEl.style.top = (stageRect.height - lengthPx) / 2 + "px";
  }

  panelEl.style.padding = `${p.paddingY}px ${p.paddingX}px`;
  panelEl.style.gap = p.spacing + "px";
  panelEl.style.borderRadius = p.radius + "px";
  panelEl.style.background = hexToRgba(p.bgColor, p.bgAlpha);
  if (p.borderWidth > 0 && p.borderSides !== "none") {
    panelEl.style.border = `${p.borderWidth}px solid ${hexToRgba(p.borderColor, p.borderAlpha)}`;
  }

  state.items.filter((it) => it.enabled).forEach((it) => {
    panelEl.appendChild(sampleItemNode(it.code));
  });

  desktop.appendChild(panelEl);
}

function hexToRgba(hex, alphaPct) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alphaPct / 100})`;
}

// ---------- tint2rc generation ----------

function generateConfig() {
  const p = state.panel;
  const enabledItems = state.items.filter((it) => it.enabled);
  const itemCodes = enabledItems.map((it) => it.code).join("");
  const orientation = (p.edge === "top" || p.edge === "bottom") ? "horizontal" : "vertical";

  const vAlign = orientation === "horizontal"
    ? p.edge
    : (p.align === "start" ? "top" : p.align === "end" ? "bottom" : "center");
  const hAlign = orientation === "horizontal"
    ? (p.align === "start" ? "left" : p.align === "end" ? "right" : "center")
    : p.edge;

  const panelSize = orientation === "horizontal"
    ? `${fmtLength(p.lengthVal, p.lengthUnit)} ${p.thickness}`
    : `${p.thickness} ${fmtLength(p.lengthVal, p.lengthUnit)}`;

  const lines = [];
  lines.push("#---- generated by tint2-config-generator ----");
  lines.push("");
  lines.push("# Panel");
  lines.push(`panel_monitor = ${p.monitor}`);
  lines.push(`panel_position = ${vAlign} ${hAlign} ${orientation}`);
  lines.push(`panel_size = ${panelSize}`);
  lines.push(`panel_margin = ${p.marginX} ${p.marginY}`);
  lines.push(`panel_padding = ${p.paddingX} ${p.paddingY} ${p.spacing}`);
  lines.push(`panel_background_id = 1`);
  lines.push(`panel_layer = ${p.layer}`);
  lines.push(`panel_items = ${itemCodes}`);
  lines.push("");

  lines.push("# Background 1 — panel");
  lines.push(`rounded = ${p.radius}`);
  lines.push(`border_width = ${p.borderWidth}`);
  lines.push(`border_sides = ${borderSidesStr(p.borderSides)}`);
  lines.push(`border_color = ${colorAlpha(p.borderColor, p.borderAlpha)}`);
  lines.push(`background_color = ${colorAlpha(p.bgColor, p.bgAlpha)}`);
  lines.push("");

  lines.push("# Background 2 — task (normal)");
  lines.push(`rounded = 3`);
  lines.push(`border_width = 0`);
  lines.push(`background_color = ${colorAlpha("#ffffff", state.taskbar.normalAlpha)}`);
  lines.push("");

  lines.push("# Background 3 — task (active)");
  lines.push(`rounded = 3`);
  lines.push(`border_width = 0`);
  lines.push(`background_color = ${colorAlpha(state.taskbar.activeColor, state.taskbar.activeAlpha)}`);
  lines.push("");

  if (itemCodes.includes("T")) {
    const t = state.taskbar;
    lines.push("# Taskbar");
    lines.push(`taskbar_mode = ${t.mode}`);
    lines.push(`taskbar_padding = ${t.paddingX} ${t.paddingY} 2`);
    lines.push(`taskbar_background_id = 1`);
    lines.push(`taskbar_active_background_id = 1`);
    lines.push(`task_text = ${t.showText ? 1 : 0}`);
    lines.push(`task_icon = ${t.showIcon ? 1 : 0}`);
    lines.push(`task_centered = ${t.centered ? 1 : 0}`);
    lines.push(`task_maximum_size = ${t.maxWidth} 35`);
    lines.push(`task_padding = ${t.paddingX} ${t.paddingY}`);
    lines.push(`task_font = ${state.font.family} ${state.font.size}`);
    lines.push(`task_font_color = ${colorAlpha(t.fontColor, t.fontAlpha)}`);
    lines.push(`task_background_id = 2`);
    lines.push(`task_active_background_id = 3`);
    lines.push("");
  }

  if (itemCodes.includes("P")) {
    lines.push("# Pager");
    lines.push(`pager_padding = 2 2 2`);
    lines.push(`pager_background_id = 2`);
    lines.push(`pager_active_background_id = 3`);
    lines.push("");
  }

  if (itemCodes.includes("C")) {
    const c = state.clock;
    lines.push("# Clock");
    lines.push(`time1_format = ${c.format1}`);
    if (c.format2.trim()) lines.push(`time2_format = ${c.format2}`);
    lines.push(`clock_font = ${state.font.family} ${state.font.size}`);
    lines.push(`clock_font_color = ${colorAlpha(c.fontColor, c.fontAlpha)}`);
    lines.push(`clock_padding = ${c.paddingX} ${c.paddingY}`);
    if (c.clickCmd.trim()) lines.push(`clock_lclick_command = ${c.clickCmd}`);
    lines.push("");
  }

  if (itemCodes.includes("B")) {
    const b = state.battery;
    lines.push("# Battery");
    lines.push(`battery_hide = ${b.hideWhenFull ? 95 : 0}`);
    lines.push(`battery_low_status = ${b.lowStatus}`);
    lines.push(`battery_low_cmd = ${b.lowCmd}`);
    lines.push(`bat1_font = ${state.font.family} ${state.font.size}`);
    lines.push(`bat1_font_color = ${colorAlpha(b.fontColor, b.fontAlpha)}`);
    lines.push(`bat2_font = ${state.font.family} ${Math.max(6, state.font.size - 2)}`);
    lines.push(`bat2_font_color = ${colorAlpha(b.fontColor, b.fontAlpha)}`);
    lines.push("");
  }

  if (itemCodes.includes("S")) {
    const s = state.systray;
    lines.push("# Systray");
    lines.push(`systray_padding = ${s.paddingX} ${s.paddingY} ${s.spacing}`);
    lines.push(`systray_sort = ${s.sort}`);
    lines.push(`systray_icon_size = ${s.iconSize}`);
    lines.push(`systray_monitor = ${s.monitor}`);
    lines.push("");
  }

  if (itemCodes.includes("L")) {
    const l = state.launcher;
    lines.push("# Launcher");
    lines.push(`launcher_padding = ${l.paddingX} ${l.paddingY} 2`);
    lines.push(`launcher_icon_size = ${l.iconSize}`);
    l.apps.split("\n").map((s) => s.trim()).filter(Boolean).forEach((app) => {
      lines.push(`launcher_item_app = ${app}`);
    });
    lines.push("");
  }

  return lines.join("\n");
}

// ---------- wiring ----------

function updateAll() {
  renderPreview();
  document.getElementById("output").textContent = generateConfig();
}

function init() {
  const controls = document.getElementById("controls");
  controls.innerHTML = buildControlsHTML();
  bindControls(controls);
  renderItemList();

  document.getElementById("btn-copy").addEventListener("click", async () => {
    const text = document.getElementById("output").textContent;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      // clipboard API may be unavailable (e.g. insecure context); fall back silently.
    }
  });

  document.getElementById("btn-download").addEventListener("click", () => {
    const text = document.getElementById("output").textContent;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tint2rc";
    a.click();
    URL.revokeObjectURL(url);
  });

  window.addEventListener("resize", renderPreview);

  updateAll();
}

document.addEventListener("DOMContentLoaded", init);
