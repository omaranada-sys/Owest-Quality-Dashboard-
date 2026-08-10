(() => {
  const cfg = window.OWEST_CONFIG || {};
  let jsonpCounter = 0;
  let timer = null;

  const normalize = (s) => String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ");

  const aliases = {
    "units released readiness": ["units released readiness", "units released"],
    "client notifications for handover": ["client notifications for handover", "client notifications"],
    "units successfully handed over": ["units successfully handed over", "units handed over"],
    "overall quality index": ["overall quality index", "quality index"],
    "overall readiness rate": ["overall readiness rate", "readiness"],
    "handover - zero snags": ["handover - zero snags", "zero snags"],
    "inspection performance trend": ["inspection performance trend", "inspection trend"],
    "contractor quality performance score": ["contractor quality performance score", "contractor quality"],
    "total number of ncrs": ["total number of ncrs", "total ncrs"],
    "total opened ncrs": ["total opened ncrs", "open ncrs"],
    "ncr closure rate": ["ncr closure rate", "ncr closure"],
    "areas of concern": ["areas of concern"]
  };

  function addStatusPill() {
    if (document.getElementById("liveSheetStatus")) return;
    const pill = document.createElement("div");
    pill.id = "liveSheetStatus";
    pill.style.cssText = [
      "position:fixed","right:12px","bottom:12px","z-index:9999",
      "padding:7px 10px","border-radius:999px",
      "background:#00245f","color:#fff","font:600 11px system-ui",
      "box-shadow:0 4px 16px rgba(0,0,0,.15)"
    ].join(";");
    pill.textContent = "Connecting to Google Sheet…";
    document.body.appendChild(pill);
  }

  function setStatus(text, ok=true) {
    addStatusPill();
    const pill = document.getElementById("liveSheetStatus");
    pill.textContent = text;
    pill.style.background = ok ? "#00245f" : "#8b1e2d";
  }

  function jsonp(url) {
    return new Promise((resolve, reject) => {
      const cb = "__owestSheetCb" + (++jsonpCounter);
      const script = document.createElement("script");
      const cleanup = () => {
        try { delete window[cb]; } catch {}
        script.remove();
      };
      window[cb] = (data) => { cleanup(); resolve(data); };
      script.onerror = () => { cleanup(); reject(new Error("JSONP load failed")); };
      const sep = url.includes("?") ? "&" : "?";
      script.src = url + sep + "callback=" + encodeURIComponent(cb) + "&_=" + Date.now();
      document.head.appendChild(script);
      setTimeout(() => {
        if (window[cb]) {
          cleanup();
          reject(new Error("Google Sheet sync timed out"));
        }
      }, 12000);
    });
  }

  function parseValue(v) {
    if (typeof v === "number") return v;
    const s = String(v ?? "").trim();
    const num = parseFloat(s.replace(/,/g, ""));
    return Number.isFinite(num) ? num : s;
  }

  function formatLikeSheet(v) {
    if (v === null || v === undefined) return "";
    return String(v);
  }

  function rowMap(rows) {
    const map = {};
    rows.forEach(r => {
      if (!r || r.length < 2) return;
      map[normalize(r[0])] = r[1];
    });
    return map;
  }

  function findMetric(map, canonical) {
    const names = aliases[canonical] || [canonical];
    for (const n of names) {
      if (Object.prototype.hasOwnProperty.call(map, normalize(n))) return map[normalize(n)];
    }
    return undefined;
  }

  function replaceTextExact(root, oldValue, newValue) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const targets = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeValue && node.nodeValue.trim() === oldValue) targets.push(node);
    }
    targets.forEach(n => n.nodeValue = n.nodeValue.replace(oldValue, newValue));
  }

  function updateDashboard(primaryRows) {
    const map = rowMap(primaryRows);
    const values = {
      released: findMetric(map, "units released readiness"),
      notified: findMetric(map, "client notifications for handover"),
      handed: findMetric(map, "units successfully handed over"),
      quality: findMetric(map, "overall quality index"),
      readiness: findMetric(map, "overall readiness rate"),
      zeroSnags: findMetric(map, "handover - zero snags"),
      inspection: findMetric(map, "inspection performance trend"),
      contractor: findMetric(map, "contractor quality performance score"),
      totalNcr: findMetric(map, "total number of ncrs"),
      openNcr: findMetric(map, "total opened ncrs"),
      closure: findMetric(map, "ncr closure rate"),
      concerns: findMetric(map, "areas of concern")
    };

    // KPI top cards
    const cards = [...document.querySelectorAll(".kpi")];
    cards.forEach(card => {
      const label = normalize(card.querySelector(".kpi-label")?.textContent);
      const val = card.querySelector(".kpi-value");
      if (!val) return;
      if (label.includes("units released") && values.released !== undefined) val.textContent = formatLikeSheet(values.released);
      if (label.includes("client notifications") && values.notified !== undefined) val.textContent = formatLikeSheet(values.notified);
      if (label.includes("units handed over") && values.handed !== undefined) val.textContent = formatLikeSheet(values.handed);
      if (label.includes("quality index") && values.quality !== undefined) val.textContent = formatLikeSheet(values.quality);
    });

    // Refresh chart config if present.
    if (window.chartConfigs) {
      if (window.chartConfigs.readinessPie) {
        const items = window.chartConfigs.readinessPie.items;
        items.forEach(item => {
          if (item.name.includes("Readiness") && values.readiness !== undefined) item.value = parseFloat(values.readiness);
          if (item.name.includes("Quality Index") && values.quality !== undefined) item.value = parseFloat(values.quality);
          if (item.name.includes("Zero Snags") && values.zeroSnags !== undefined) item.value = parseFloat(values.zeroSnags);
        });
        const nums = items.map(x => Number(x.value)).filter(Number.isFinite);
        if (nums.length) {
          const avg = Math.round(nums.reduce((a,b)=>a+b,0)/nums.length);
          window.chartConfigs.readinessPie.defaultCenter.value = avg + "%";
          const badge = document.querySelector(".charts-row .panel:first-child .badge");
          if (badge) badge.textContent = avg + "% AVG";
        }
      }
      if (window.chartConfigs.funnelPie) {
        const items = window.chartConfigs.funnelPie.items;
        items.forEach(item => {
          if (item.name.includes("Released") && values.released !== undefined) item.value = parseFloat(values.released);
          if (item.name.includes("Notified") && values.notified !== undefined) item.value = parseFloat(values.notified);
          if (item.name.includes("Handed Over") && values.handed !== undefined) item.value = parseFloat(values.handed);
        });
        if (values.handed !== undefined) window.chartConfigs.funnelPie.defaultCenter.value = String(values.handed);
        const sum = items.reduce((a,x)=>a+(Number(x.value)||0),0);
        const badge = document.querySelector(".charts-row .panel:nth-child(2) .badge");
        if (badge) badge.textContent = sum + " STEPS";
      }
      if (typeof window.drawAll === "function") window.drawAll();
    }

    // Legend values and lower cards: update by visible labels.
    const legendItems = [...document.querySelectorAll(".legend-item")];
    legendItems.forEach(item => {
      const txt = normalize(item.textContent);
      const strong = item.querySelector("strong");
      if (!strong) return;
      if (txt.includes("readiness") && values.readiness !== undefined) strong.textContent = formatLikeSheet(values.readiness);
      else if (txt.includes("quality") && values.quality !== undefined) strong.textContent = formatLikeSheet(values.quality);
      else if (txt.includes("zero snags") && values.zeroSnags !== undefined) strong.textContent = formatLikeSheet(values.zeroSnags);
      else if (txt.includes("released") && values.released !== undefined) strong.textContent = formatLikeSheet(values.released);
      else if (txt.includes("notified") && values.notified !== undefined) strong.textContent = formatLikeSheet(values.notified);
      else if (txt.includes("handed over") && values.handed !== undefined) strong.textContent = formatLikeSheet(values.handed);
    });

    const minis = [...document.querySelectorAll(".mini")];
    minis.forEach(m => {
      const label = normalize(m.querySelector(".t")?.textContent);
      const n = m.querySelector(".n");
      if (!n) return;
      if (label.includes("total ncr") && values.totalNcr !== undefined) n.textContent = formatLikeSheet(values.totalNcr);
      else if (label.includes("open ncr") && values.openNcr !== undefined) n.textContent = formatLikeSheet(values.openNcr);
      else if (label.includes("inspection") && values.inspection !== undefined) n.textContent = formatLikeSheet(values.inspection);
      else if (label.includes("areas of concern") && values.concerns !== undefined) n.textContent = formatLikeSheet(values.concerns);
    });

    // NCR closure center.
    if (values.closure !== undefined) {
      const el = document.querySelector(".ncr-center strong");
      if (el) el.textContent = formatLikeSheet(values.closure);
    }

    // Contractor score center; sheet contains "91 / 100", so take the numeric part.
    if (values.contractor !== undefined) {
      const score = parseFloat(String(values.contractor));
      const el = document.querySelector(".contractor-score-inner strong");
      if (el && Number.isFinite(score)) el.textContent = score;
    }

    // Report date is generated by the dashboard itself; refresh before print is already handled.
  }

  async function refresh() {
    if (!cfg.APPS_SCRIPT_URL || cfg.APPS_SCRIPT_URL.includes("PASTE_YOUR")) {
      setStatus("Add Apps Script URL in config.js", false);
      return;
    }
    try {
      const url = cfg.APPS_SCRIPT_URL +
        (cfg.APPS_SCRIPT_URL.includes("?") ? "&" : "?") +
        "tab=" + encodeURIComponent(cfg.PRIMARY_TAB || "Quality Dashboard");
      const data = await jsonp(url);
      if (!data || !data.ok) throw new Error(data?.error || "Invalid response");
      updateDashboard(data.rows || []);
      setStatus("Live • synced " + new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", second:"2-digit"}));
    } catch (err) {
      console.error(err);
      setStatus("Sheet sync error", false);
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    addStatusPill();
    refresh();
    timer = setInterval(refresh, Math.max(2000, Number(cfg.REFRESH_MS) || 5000));
  });

  window.addEventListener("beforeunload", () => {
    if (timer) clearInterval(timer);
  });
})();
