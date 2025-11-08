(() => {
  if (window.__GA4_OVERLAY_ACTIVE__) {
    console.log("🔁 GA4 overlay already running – skipping reinjection");
    return;
  }
  window.__GA4_OVERLAY_ACTIVE__ = true;

  console.log("%c🧠 GA4/GTM Overlay Active", "color: teal; font-weight:bold;");

  // ─── PANEL SETUP ───────────────────────────────
  const panel = document.createElement("div");
  Object.assign(panel.style, {
    position: "fixed",
    top: "60px",
    right: "20px",
    zIndex: 999999999,
    background: "rgba(0,0,0,0.95)",
    color: "#0f0",
    padding: "10px",
    maxHeight: "70vh",
    width: "380px",
    overflowY: "auto",
    fontFamily: "monospace",
    fontSize: "12px",
    borderRadius: "8px",
    border: "1px solid #0f0",
    boxShadow: "0 0 15px rgba(0,255,0,0.3)",
  });
  document.body.appendChild(panel);

  const header = document.createElement("div");
  header.textContent = "🟢 GA4/GTM Event Log";
  Object.assign(header.style, {
    fontWeight: "bold",
    marginBottom: "8px",
    textAlign: "center",
    color: "#fff",
  });
  panel.appendChild(header);

  // ─── CONTROLS ───────────────────────────────
  const controls = document.createElement("div");
  Object.assign(controls.style, {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: "8px",
    gap: "4px",
  });

  const filterBtn = document.createElement("button");
  const summaryBtn = document.createElement("button");
  const clearBtn = document.createElement("button");
  const saveBtn = document.createElement("button");

  const buttonStyle = {
    flex: "1 1 45%",
    background: "#111",
    color: "#0f0",
    border: "1px solid #0f0",
    borderRadius: "4px",
    cursor: "pointer",
    padding: "4px 0",
  };

  [filterBtn, summaryBtn, clearBtn, saveBtn].forEach((b) =>
    Object.assign(b.style, buttonStyle)
  );

  filterBtn.textContent = "📋 Events Only";
  summaryBtn.textContent = "📊 Summary";
  clearBtn.textContent = "🧹 Clear";
  saveBtn.textContent = "💾 Save";

  [filterBtn, summaryBtn, clearBtn, saveBtn].forEach((b) =>
    controls.appendChild(b)
  );
  panel.appendChild(controls);

  const logArea = document.createElement("div");
  panel.appendChild(logArea);

  let eventOnly = false;
  const allLogs = [];
  const summary = {};

  // ─── SAFE STRINGIFY ───────────────────────────────
  function safeStringify(obj) {
    const seen = new WeakSet();
    return JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) return "[Circular]";
          seen.add(value);
        }
        if (value instanceof HTMLElement)
          return `[HTMLElement: ${value.tagName}]`;
        if (typeof value === "function") return "[Function]";
        return value;
      },
      2
    );
  }

  // ─── LOG + RENDER ───────────────────────────────
  function logEvent(obj) {
    const time = new Date().toLocaleTimeString();
    const evt = obj.event || "(no event)";
    allLogs.push({ time, path: location.pathname, evt, obj });

    if (evt) {
      const page = location.pathname;
      if (!summary[page]) summary[page] = new Set();
      summary[page].add(evt);
    }

    renderLogs();
  }

  function renderLogs() {
    logArea.innerHTML = "";
    const filtered = eventOnly
      ? allLogs.filter((x) => x.evt && x.evt !== "(no event)")
      : allLogs;

    filtered.forEach((x) => {
      const line = document.createElement("div");
      line.style.marginBottom = "4px";
      line.style.color = "#00ff88";

      const text = eventOnly
        ? `${x.evt}`
        : `[${x.time}] ${x.path} → ${x.evt}\n${safeStringify(x.obj)}`;

      line.textContent = text;
      logArea.appendChild(line);
    });
    logArea.scrollTop = logArea.scrollHeight;
  }

  // ─── SUMMARY (screen + console) ───────────────────────────────
  function showSummary() {
    console.clear();
    console.log("%c📊 GA4 Event Summary", "color: yellow; font-weight:bold;");
    let summaryHTML = `<div style="margin-top:6px;border-top:1px solid #0f0;padding-top:6px">`;
    for (const [page, events] of Object.entries(summary)) {
      console.log(`%c${page}`, "color: cyan;");
      summaryHTML += `<div style="margin-bottom:4px;color:#fff"><b>${page}</b><ul>`;
      Array.from(events).forEach((e) => {
        console.log("  -", e);
        summaryHTML += `<li style="color:#0f0">${e}</li>`;
      });
      summaryHTML += `</ul></div>`;
    }
    summaryHTML += `</div>`;
    const summaryDiv = document.createElement("div");
    summaryDiv.innerHTML = summaryHTML;
    Object.assign(summaryDiv.style, {
      maxHeight: "200px",
      overflowY: "auto",
      marginTop: "8px",
      borderTop: "1px solid #0f0",
      paddingTop: "4px",
    });
    panel.appendChild(summaryDiv);
    alert("📊 Summary printed in console and shown on screen!");
  }

  // ─── SAVE AS JSON ───────────────────────────────
	function saveSession() {
	  const data = {
		timestamp: new Date().toISOString(),
		logs: allLogs,
		summary: Object.fromEntries(
		  Object.entries(summary).map(([p, s]) => [p, Array.from(s)])
		),
	  };
	  const json = JSON.stringify(data, null, 2);

	  // Create a new tab or window with the JSON string
	  const newTab = window.open();
	  newTab.document.write(
		`<pre style="white-space:pre-wrap;font-family:monospace">${json}</pre>`
	  );
	  newTab.document.title = `GA4_Session_${Date.now()}`;
	  alert("💾 JSON opened in a new tab — right-click → Save As → .json file");
	}


  // ─── BUTTONS ───────────────────────────────
  filterBtn.onclick = () => {
    eventOnly = !eventOnly;
    filterBtn.textContent = eventOnly ? "🧩 Show All" : "📋 Events Only";
    renderLogs();
  };
  summaryBtn.onclick = showSummary;
  clearBtn.onclick = () => {
    allLogs.length = 0;
    logArea.innerHTML = "";
  };
  saveBtn.onclick = saveSession;

  // ─── POPUP (stacked) ───────────────────────────────
  let popupCount = 0;
  function showPopup(text, bg) {
    const el = document.createElement("div");
    el.textContent = text;
    Object.assign(el.style, {
      position: "fixed",
      top: `${10 + popupCount * 28}px`,
      right: "10px",
      zIndex: 9999999999,
      padding: "6px 12px",
      background: bg || "rgba(0,0,0,0.85)",
      color: "#fff",
      fontFamily: "monospace",
      fontSize: "12px",
      borderRadius: "6px",
      boxShadow: "0 0 6px rgba(255,255,255,0.3)",
      transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
    });
    document.body.appendChild(el);
    popupCount++;
    setTimeout(() => (el.style.opacity = "0"), 1500);
    setTimeout(() => {
      el.remove();
      popupCount--;
    }, 2500);
  }

  // ─── HOOK DATALAYER ───────────────────────────────
  function hookDataLayer() {
    if (!window.dataLayer || !window.dataLayer.push) return false;
    if (window.dataLayer.__patched) return true;

    const origPush = window.dataLayer.push;
    window.dataLayer.push = function () {
      const args = Array.from(arguments);
      const arg0 = args[0] || {};
      logEvent(arg0);
      showPopup(arg0.event || "dataLayer.push");
      return origPush.apply(this, args);
    };

    window.dataLayer.__patched = true;
    logEvent({ event: "✅ dataLayer hook active" });
    showPopup("✅ dataLayer hook active", "rgba(0,128,0,0.8)");
    return true;
  }

  let timer = setInterval(() => {
    if (hookDataLayer()) clearInterval(timer);
  }, 1000);
})();

// ─── AUTO REINJECT ON SPA OR PAGE NAVIGATION ───────────────────────────────
window.addEventListener("popstate", () => {
  setTimeout(() => {
    if (!window.__GA4_OVERLAY_ACTIVE__) location.reload();
  }, 800);
});

window.addEventListener("beforeunload", () => {
  sessionStorage.setItem("__GA4_RELOAD_OVERLAY__", "1");
});

if (sessionStorage.getItem("__GA4_RELOAD_OVERLAY__") === "1") {
  sessionStorage.removeItem("__GA4_RELOAD_OVERLAY__");
  setTimeout(() => {
    fetch('https://raw.githubusercontent.com/silentpacific/no-gtm-datalayer-event-visualizer/main/ga4-overlay.js')
      .then(r => r.text())
      .then(eval)
      .catch(console.error);
  }, 1000);
}

