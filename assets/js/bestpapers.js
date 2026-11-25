/* Best papers of the top four security conferences: filters the server-rendered
   list (one li.bp-item per award) by venue, award, year, topic, type of paper
   and a search over titles and authors. Keeps the filters in the query string
   so a filtered view can be shared. No dependencies. */
(function () {
  "use strict";
  const root = document.getElementById("bpl");
  if (!root) return;
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const items = $$(".bp-item"), years = $$(".bp-year");
  const S = { v: "", a: "", y: "", topic: "", type: "", q: "" };
  const KEYS = Object.keys(S);
  const ctl = { a: $("#bp-award"), y: $("#bp-year"), topic: $("#bp-topic"), type: $("#bp-type"), q: $("#bp-q") };
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  // Cache each item's fields and the original text of the parts that get highlighted.
  const D = items.map(li => {
    const t = li.querySelector(".bp-title a"), au = li.querySelector(".bp-authors");
    return { li, v: li.dataset.v, a: li.dataset.a, y: li.closest(".bp-year").dataset.year, topic: li.dataset.topic, type: li.dataset.type,
      tEl: t, tTxt: t.textContent, auEl: au, auTxt: au ? au.textContent : "",
      hay: norm(t.textContent + " " + (au ? au.textContent : "") + " " + li.dataset.topic + " " + li.dataset.type) };
  });

  // Topic and type options with totals.
  function fill(sel, key, label) {
    const m = new Map(); D.forEach(d => m.set(d[key], (m.get(d[key]) || 0) + 1));
    [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).forEach(([k, n]) => {
      const o = document.createElement("option"); o.value = k; o.textContent = `${k} (${n})`; sel.append(o);
    });
  }
  fill(ctl.topic, "topic"); fill(ctl.type, "type");
  [...new Set(D.map(d => d.y))].sort((a, b) => b - a).forEach(y => { const o = document.createElement("option"); o.value = y; o.textContent = y; ctl.y.append(o); });

  const match = (d, skip) => (!S.v || d.v === S.v) && (!S.a || d.a === S.a || (S.a === "other" && d.a !== "best" && d.a !== "dist")) &&
    (!S.y || d.y === S.y) && (skip === "topic" || !S.topic || d.topic === S.topic) && (!S.type || d.type === S.type) &&
    (!S.q || S.q.split(/\s+/).every(w => d.hay.includes(w)));

  function hl(el, txt, words) {
    if (!el) return;
    if (!words.length) { el.textContent = txt; return; }
    const re = new RegExp("(" + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi");
    // Highlight on the plain text; accents in the query are already stripped, so match on the raw text only.
    el.innerHTML = esc(txt).replace(re, "<mark>$1</mark>");
  }

  function render() {
    const words = S.q ? S.q.split(/\s+/).filter(w => w.length > 1) : [];
    let shown = 0;
    D.forEach(d => { const ok = match(d); d.li.hidden = !ok; if (ok) { shown++; hl(d.tEl, d.tTxt, words); hl(d.auEl, d.auTxt, words); } });
    years.forEach(sec => {
      const n = sec.querySelectorAll(".bp-item:not([hidden])").length;
      sec.hidden = n === 0;
      sec.querySelector("h2 small").textContent = `${n} paper${n === 1 ? "" : "s"}`;
    });
    const best = D.filter(d => !d.li.hidden && d.a === "best").length;
    $("#bp-count").innerHTML = `Showing <b>${shown}</b> of ${D.length} award papers` + (shown ? ` (${best} Best Paper)` : "");
    $(".bp-empty").hidden = shown > 0;
    bars();
    ctl.topic.value = S.topic; ctl.type.value = S.type; ctl.a.value = S.a; ctl.y.value = S.y; if (document.activeElement !== ctl.q) ctl.q.value = S.qRaw || "";
    $$(".bp-venues button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === S.v)));
    const qs = new URLSearchParams(); KEYS.forEach(k => { const v = k === "q" ? S.qRaw : S[k]; if (v) qs.set(k, v); });
    const url = location.pathname + (qs.toString() ? "?" + qs : "") + location.hash;
    if (url !== location.pathname + location.search + location.hash) history.replaceState(null, "", url);
  }

  // Topic bars: counts under every filter except the topic itself; click to filter.
  function bars() {
    const m = new Map(); D.forEach(d => { if (match(d, "topic")) m.set(d.topic, (m.get(d.topic) || 0) + 1); });
    const rows = [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])), max = rows.length ? rows[0][1] : 1;
    $(".bp-bars").innerHTML = rows.map(([t, n]) =>
      `<button type="button" class="bp-bar" data-topic="${esc(t)}" aria-pressed="${t === S.topic}"><span class="nm">${esc(t)}</span><span class="tr"><b style="width:${(100 * n / max).toFixed(1)}%"></b></span><span class="ct">${n}</span></button>`).join("") ||
      `<p class="bp-bars-note">No papers match the other filters.</p>`;
  }

  function set(k, v) { S[k] = v; render(); }
  root.addEventListener("click", e => {
    const vb = e.target.closest(".bp-venues button"); if (vb) return set("v", vb.dataset.v);
    const bb = e.target.closest(".bp-bar"); if (bb) return set("topic", S.topic === bb.dataset.topic ? "" : bb.dataset.topic);
    const tb = e.target.closest("[data-show-type]");
    if (tb) { Object.assign(S, { v: "", a: "", y: "", topic: "", q: "", qRaw: "" }); set("type", tb.dataset.showType); $("#bp-list-top").scrollIntoView({ behavior: "smooth" }); return; }
    if (e.target.closest(".bp-reset")) { KEYS.forEach(k => S[k] = ""); S.qRaw = ""; render(); }
  });
  ["a", "y", "topic", "type"].forEach(k => ctl[k].addEventListener("change", () => set(k, ctl[k].value)));
  let tmr;
  ctl.q.addEventListener("input", () => { clearTimeout(tmr); tmr = setTimeout(() => { S.qRaw = ctl.q.value.trim(); S.q = norm(S.qRaw); render(); }, 120); });

  // Restore filters from the query string.
  const qs = new URLSearchParams(location.search);
  KEYS.forEach(k => { if (qs.get(k)) S[k] = qs.get(k); });
  if (S.q) { S.qRaw = S.q; S.q = norm(S.q); }
  root.classList.add("js");
  render();
})();
