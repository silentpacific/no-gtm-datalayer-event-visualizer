(() => {
  if (window.__SEO_A11Y_OVERLAY_ACTIVE__) {
    document.querySelectorAll('.seo-a11y-overlay, #seo-a11y-panel').forEach(e => e.remove());
    delete window.__SEO_A11Y_OVERLAY_ACTIVE__;
    alert('🧹 SEO + Accessibility Overlay removed');
    return;
  }
  window.__SEO_A11Y_OVERLAY_ACTIVE__ = true;
  console.log("%c🔎 SEO + Accessibility Overlay Active", "color:lime;font-weight:bold;");

  // ─── GLOBAL STATE ───────────────────────────────
  const results = { images: [], labels: [], roles: [], seo: [], summary: {} };

  // ─── STYLES ─────────────────────────────────────
  const css = `
    .seo-a11y-overlay {position:absolute;pointer-events:none;z-index:999999;}
    .seo-a11y-badge {position:absolute;top:-14px;left:0;font-size:10px;
      font-family:monospace;padding:1px 3px;border-radius:2px;color:#fff;}
    #seo-a11y-panel {position:fixed;top:60px;right:20px;width:400px;
      max-height:75vh;overflow-y:auto;background:rgba(0,0,0,0.92);
      color:#0f0;font-family:monospace;font-size:12px;padding:10px;
      border:1px solid #0f0;border-radius:8px;z-index:9999999;cursor:move;}
    #seo-a11y-panel button {background:#111;color:#0f0;border:1px solid #0f0;
      border-radius:4px;cursor:pointer;padding:4px 6px;margin:2px;font-family:monospace;}
    #seo-a11y-tabs button.active {background:#0f0;color:#000;}
    #seo-a11y-content {margin-top:6px;}
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ─── PANEL UI ───────────────────────────────────
  const panel = document.createElement("div");
  panel.id = "seo-a11y-panel";
  panel.innerHTML = `
    <div style="font-weight:bold;text-align:center;margin-bottom:6px;color:#fff">🧭 SEO + Accessibility Inspector</div>
    <div id="seo-a11y-tabs">
      <button data-tab="accessibility" class="active">Accessibility</button>
      <button data-tab="seo">SEO</button>
      <button data-tab="summary">Summary</button>
      <button id="copyBtn">📋 Copy</button>
      <button id="saveBtn">💾 Save</button>
    </div>
    <div id="seo-a11y-content"></div>
  `;
  document.body.appendChild(panel);

  // ─── DRAGGABLE ──────────────────────────────────
  let drag = false, offX = 0, offY = 0;
  panel.addEventListener("mousedown", e => { drag = true; offX = e.offsetX; offY = e.offsetY; });
  document.addEventListener("mouseup", () => drag = false);
  document.addEventListener("mousemove", e => {
    if (!drag) return;
    panel.style.left = e.clientX - offX + "px";
    panel.style.top = e.clientY - offY + "px";
    panel.style.right = "auto";
  });

  // ─── UTILITY HELPERS ────────────────────────────
  const addOutline = (el, color, label) => {
    const r = el.getBoundingClientRect();
    const box = document.createElement("div");
    Object.assign(box.style, {
      left: window.scrollX + r.left + "px",
      top: window.scrollY + r.top + "px",
      width: r.width + "px",
      height: r.height + "px",
      border: `2px solid ${color}`,
      background: "rgba(255,0,0,0.05)"
    });
    box.className = "seo-a11y-overlay";
    const b = document.createElement("div");
    b.className = "seo-a11y-badge";
    b.style.background = color;
    b.textContent = label;
    box.appendChild(b);
    document.body.appendChild(box);
  };
  const addResult = (cat, msg, el) => {
    results[cat].push({ msg, html: el.outerHTML.slice(0, 200) });
    results.summary[cat] = (results.summary[cat] || 0) + 1;
  };

  // ─── SCAN ACCESSIBILITY ─────────────────────────
  document.querySelectorAll("img,a,button,input,[role]").forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 20 || r.height < 10) return;
    const issues = [];
    if (el.tagName === "IMG" && !el.alt) {
      addOutline(el, "red", "missing alt");
      addResult("images", "missing alt", el);
    }
    if ((el.tagName === "A" || el.tagName === "BUTTON") &&
        !el.getAttribute("aria-label") && !el.textContent.trim()) {
      addOutline(el, "orange", "no label");
      addResult("labels", "no label", el);
    }
    if (el.hasAttribute("role") && !el.getAttribute("aria-label")) {
      addOutline(el, "purple", "role w/o label");
      addResult("roles", "role w/o label", el);
    }
  });

  // ─── SCAN SEO TAGS ──────────────────────────────
  const seoFindings = [];
  const title = document.title || "";
  if (!title) seoFindings.push("❌ Missing <title>");
  else if (title.length > 65) seoFindings.push(`⚠️ Title too long (${title.length})`);
  const desc = document.querySelector('meta[name="description"]');
  if (!desc) seoFindings.push("❌ Missing meta description");
  else if (desc.content.length > 160) seoFindings.push(`⚠️ Description too long (${desc.content.length})`);
  const canon = document.querySelector('link[rel="canonical"]');
  if (!canon) seoFindings.push("❌ Missing canonical");
  const h1s = document.querySelectorAll("h1");
  if (h1s.length === 0) seoFindings.push("❌ Missing H1");
  else if (h1s.length > 1) seoFindings.push(`⚠️ Multiple H1s (${h1s.length})`);
  const og = document.querySelector('meta[property="og:title"]');
  if (!og) seoFindings.push("⚠️ Missing OpenGraph tags");
  const tw = document.querySelector('meta[name="twitter:card"]');
  if (!tw) seoFindings.push("⚠️ Missing Twitter card tags");
  const robots = document.querySelector('meta[name="robots"]');
  if (robots && robots.content.includes("noindex")) seoFindings.push("⚠️ Robots: noindex");
  results.seo = seoFindings;
  results.summary.seo = seoFindings.length;

  // ─── DISPLAY LOGIC ───────────────────────────────
  const content = document.getElementById("seo-a11y-content");
  const renderTab = (tab) => {
    let html = "";
    if (tab === "accessibility") {
      html += `<b>Images:</b> ${results.summary.images || 0}<br>`;
      html += `<b>No label:</b> ${results.summary.labels || 0}<br>`;
      html += `<b>Role w/o label:</b> ${results.summary.roles || 0}<br>`;
    } else if (tab === "seo") {
      html += `<b>SEO Findings:</b><ul>` + results.seo.map(x => `<li>${x}</li>`).join("") + "</ul>";
    } else {
      html += `<b>Summary:</b><br>`;
      Object.entries(results.summary).forEach(([k,v]) => html += `${k}: ${v}<br>`);
      html += `<hr><small>${new Date().toLocaleString()}</small>`;
    }
    content.innerHTML = html;
  };

  renderTab("accessibility");

  document.querySelectorAll("#seo-a11y-tabs button[data-tab]").forEach(btn => {
    btn.addEventListener("click", e => {
      document.querySelectorAll("#seo-a11y-tabs button").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      renderTab(e.target.dataset.tab);
    });
  });

  // ─── COPY TO CLIPBOARD ───────────────────────────
  document.getElementById("copyBtn").onclick = () => {
    const text = JSON.stringify(results, null, 2);
    navigator.clipboard.writeText(text).then(() => alert("📋 Copied summary to clipboard"));
  };

  // ─── SAVE JSON REPORT ────────────────────────────
  document.getElementById("saveBtn").onclick = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `seo_a11y_report_${Date.now()}.json`;
    a.click();
  };

  alert("✅ SEO + Accessibility overlay active.\nClick bookmark again to remove.");
})();
