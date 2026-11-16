/* Security PI map: world / US-state choropleth with institution bubbles and a
   side panel listing researchers. Data: /assets/data/security_pis.json,
   base maps: world-atlas 110m and us-atlas 10m (TopoJSON). Needs d3 v7 and topojson. */
(function () {
  "use strict";
  const root = document.getElementById("pimap");
  if (!root) return;
  const base = root.dataset.base || "";
  const CC = { us: "United States", cn: "China", hk: "Hong Kong SAR", mo: "Macao SAR", de: "Germany", ch: "Switzerland", gb: "United Kingdom",
    sg: "Singapore", au: "Australia", ca: "Canada", nl: "Netherlands", kr: "South Korea", at: "Austria", be: "Belgium", il: "Israel",
    in: "India", it: "Italy", ae: "United Arab Emirates", sa: "Saudi Arabia", jp: "Japan", fr: "France" };
  const ST = { "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
    "District of Columbia": "DC", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
    "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN",
    "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM",
    "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA",
    "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
    "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY" };
  const W = 960, H = { world: 500, us: 600 };
  const $ = sel => root.querySelector(sel);
  const svg = d3.select($(".pm-map")), tip = $(".pm-tip"), panel = $(".pm-panel");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const css = n => getComputedStyle(root).getPropertyValue(n).trim();
  const S = { view: "world", topic: "", llm: false, fac: false, q: "", sel: null };
  let P, I, NUM2CC = {}, worldFeat, usFeat;

  Promise.all([
    fetch(base + "/assets/data/security_pis.json").then(r => r.json()),
    fetch(base + "/assets/data/world-110m.json").then(r => r.json()),
    fetch(base + "/assets/data/us-states-10m.json").then(r => r.json())
  ]).then(([data, world, us]) => {
    P = data.people; I = data.insts;
    Object.values(I).forEach(v => { if (v.num) NUM2CC[v.num] = v.cc; });
    worldFeat = topojson.feature(world, world.objects.countries).features.filter(f => f.properties.name !== "Antarctica");
    usFeat = topojson.feature(us, us.objects.states).features;
    const sel = $("#pm-topic");
    const tc = d3.rollup(P.filter(p => p.d), v => v.length, p => p.d);
    [...tc].sort((a, b) => b[1] - a[1]).forEach(([t, n]) => { const o = document.createElement("option"); o.value = t; o.textContent = `${t} (${n})`; sel.append(o); });
    bind(); render();
  }).catch(err => { panel.innerHTML = `<p class="pm-empty">The map data could not be loaded (${esc(err.message)}). The full list below still works.</p>`; });

  const ccOf = p => I[p.i].cc, stOf = p => I[p.i].st;
  function filtered() {
    const q = S.q.trim().toLowerCase();
    return P.filter(p => (!S.topic || p.d === S.topic) && (!S.llm || p.llm >= 3) && (!S.fac || p.csr) &&
      (!q || p.n.toLowerCase().includes(q) || I[p.i].name.toLowerCase().includes(q) || (I[p.i].city || "").toLowerCase().includes(q)));
  }
  function count(list, key) { const m = new Map(); list.forEach(p => { const k = key(p); if (k) m.set(k, (m.get(k) || 0) + 1); }); return m; }

  function stats(list) {
    const us = list.filter(p => ccOf(p) === "us").length;
    $(".pm-stats").innerHTML = `<span><b>${list.length}</b> researchers</span><span><b>${new Set(list.map(ccOf)).size}</b> countries and regions</span>` +
      `<span><b>${new Set(list.map(p => p.i)).size}</b> institutions</span><span>United States <b>${us}</b></span>` +
      `<span>2024–26 papers: <b>${d3.min(list, p => p.p) ?? 0}</b>–<b>${d3.max(list, p => p.p) ?? 0}</b></span>`;
  }

  function drawMap(list) {
    const isUS = S.view === "us", h = H[S.view];
    svg.attr("viewBox", `0 0 ${W} ${h}`).selectAll("*").remove();
    const feats = isUS ? usFeat : worldFeat;
    const proj = isUS ? d3.geoAlbersUsa().fitExtent([[10, 10], [W - 10, h - 10]], { type: "FeatureCollection", features: feats })
      : d3.geoNaturalEarth1().fitExtent([[6, 6], [W - 6, h - 6]], { type: "Sphere" });
    const path = d3.geoPath(proj);
    const counts = isUS ? count(list.filter(p => ccOf(p) === "us"), stOf) : count(list, p => I[p.i].num);
    const max = d3.max([...counts.values()]) || 1;
    const heat = d3.scaleSequentialSqrt(d3.interpolateRgb(css("--pm-heat-lo"), css("--pm-heat-hi"))).domain([0, max]);
    const key = f => isUS ? f.properties.name : f.id;
    const selKey = f => isUS ? f.properties.name : NUM2CC[f.id];
    const label = f => isUS ? f.properties.name : (CC[NUM2CC[f.id]] || f.properties.name);
    svg.append("g").selectAll("path").data(feats).join("path").attr("d", path)
      .attr("class", f => "pm-land" + (counts.get(key(f)) ? " hit" : "") + (S.sel && S.sel.type !== "inst" && S.sel.key === selKey(f) ? " sel" : ""))
      .style("fill", f => counts.get(key(f)) ? heat(counts.get(key(f))) : null)
      .on("mousemove", (e, f) => showTip(e, `${label(f)}: ${counts.get(key(f)) || 0}`)).on("mouseleave", hideTip)
      .on("click", (e, f) => {
        if (!counts.get(key(f))) return;
        if (!isUS && f.id === "840") { S.view = "us"; S.sel = null; return render(); }
        S.sel = isUS ? { type: "state", key: f.properties.name } : { type: "country", key: NUM2CC[f.id] }; render();
      });
    if (isUS) {
      svg.append("g").selectAll("text").data(feats.filter(f => counts.get(f.properties.name) >= 3)).join("text")
        .attr("class", "pm-stlabel").attr("text-anchor", "middle")
        .attr("transform", f => { const c = path.centroid(f); return `translate(${c[0]},${c[1] + 3})`; })
        .text(f => `${ST[f.properties.name] || ""} ${counts.get(f.properties.name)}`);
    }
    const ic = count(list.filter(p => !isUS || ccOf(p) === "us"), p => p.i);
    const bubbles = [...ic].map(([i, n]) => ({ i, n, xy: proj([I[i].lon, I[i].lat]) })).filter(b => b.xy).sort((a, b) => b.n - a.n);
    const r = d3.scaleSqrt().domain([1, d3.max(bubbles, b => b.n) || 1]).range(isUS ? [3.5, 18] : [2.5, 14]);
    svg.append("g").selectAll("circle").data(bubbles).join("circle")
      .attr("class", b => "pm-bub" + (S.sel && S.sel.type === "inst" && S.sel.key === b.i ? " sel" : ""))
      .attr("cx", b => b.xy[0]).attr("cy", b => b.xy[1]).attr("r", b => r(b.n))
      .on("mousemove", (e, b) => showTip(e, `${I[b.i].name} (${I[b.i].city}): ${b.n}`)).on("mouseleave", hideTip)
      .on("click", (e, b) => { e.stopPropagation(); S.sel = { type: "inst", key: b.i }; render(); });
    $(".pm-legend").innerHTML = `<span class="pm-ramp">0 <i></i> ${max}</span><span>Researchers per ${isUS ? "state" : "country"} (shade)</span>` +
      `<span><span class="pm-dot"></span>One institution; area = number of researchers</span>` +
      (isUS ? `<span>Labels show states with 3 or more</span>` : `<span>Click the United States for the state map</span>`);
  }
  function showTip(e, text) {
    const box = $(".pm-mapcard").getBoundingClientRect();
    tip.textContent = text; tip.hidden = false;
    tip.style.left = (e.clientX - box.left) + "px"; tip.style.top = (e.clientY - box.top) + "px";
  }
  function hideTip() { tip.hidden = true; }

  function rows(entries, label, attr) {
    const max = d3.max(entries, e => e[1]) || 1;
    return `<div class="pm-rows">` + entries.map(([k, n, small]) =>
      `<div class="pm-row" tabindex="0" role="button" data-${attr}="${esc(k)}"><span class="nm">${esc(label(k))}${small ? `<small>${esc(small)}</small>` : ""}</span>` +
      `<span class="ct">${n}</span><span class="bar"><b style="width:${(100 * n / max).toFixed(1)}%"></b></span></div>`).join("") + `</div>`;
  }
  function where(p) {
    const inst = I[p.i];
    if (inst.cc === "us") return `${inst.name} · ${inst.city}, ${ST[inst.st] || inst.st}`;
    const country = CC[inst.cc] || "";
    return `${inst.name} · ${inst.city && !country.startsWith(inst.city) ? inst.city + ", " : ""}${country}`;
  }
  function people(list, limit) {
    if (!list.length) return `<p class="pm-empty">Nobody matches the current filters.</p>`;
    return `<ol class="pm-people">` + list.slice(0, limit).map(p =>
      `<li class="pm-person"><span class="rk">#${p.r}</span><div class="who">` +
      `<a href="https://dblp.org/search?q=${encodeURIComponent(p.dblp)}" target="_blank" rel="noopener">${esc(p.n)}</a>` +
      `<div class="where">${esc(where(p))}</div>` +
      `<div class="nums">2024–26: <b>${p.p}</b> <span>(${p.y.join(" / ")}) · 2023–25: ${p.p23} · all years: ${p.tot}</span></div>` +
      `<div class="pm-chips">${p.d ? `<span class="pm-chip">${esc(p.d)}</span>` : ""}${p.llm ? `<span class="pm-chip llm">LLM-related ${p.llm}</span>` : ""}` +
      `${p.csr ? `<span class="pm-chip">CSRankings faculty</span>` : ""}</div>` +
      (p.top.length ? `<div class="tops">${esc(p.top.map(t => `${t[0]} ${t[1]}`).join(" · "))}</div>` : "") +
      p.notes.map(n => `<div class="pm-note">${esc(n)}</div>`).join("") + `</div></li>`).join("") + `</ol>` +
      (list.length > limit ? `<p class="pm-empty">Showing the first ${limit}. Use the filters or search to narrow the list.</p>` : "");
  }

  function drawPanel(list) {
    const isUS = S.view === "us";
    const scope = isUS ? list.filter(p => ccOf(p) === "us") : list;
    const crumbs = [`<button type="button" data-go="top">${isUS ? "United States" : "World"}</button>`];
    let title, meta, body;
    if (!S.sel) {
      title = isUS ? "By state" : "By country and region";
      const g = isUS ? count(scope, stOf) : count(scope, ccOf);
      meta = `${scope.length} researchers. Select a row to see institutions and people.`;
      body = rows([...g].sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, n, isUS ? ST[k] : ""]), k => isUS ? k : (CC[k] || k), isUS ? "state" : "cc");
      body += `<p class="pm-sect">Institutions with the most researchers</p>` +
        rows([...count(scope, p => p.i)].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, n]) => [k, n, I[k].city]), k => I[k].name, "inst");
      body += `<p class="pm-sect">${isUS ? "United States" : "All"}: first 30 by papers</p>` + people(scope, 30);
    } else if (S.sel.type !== "inst") {
      const inR = S.sel.type === "state" ? scope.filter(p => stOf(p) === S.sel.key) : scope.filter(p => ccOf(p) === S.sel.key);
      const name = S.sel.type === "state" ? S.sel.key : (CC[S.sel.key] || S.sel.key);
      crumbs.push(`<span>›</span><span>${esc(name)}</span>`);
      title = name; meta = `${inR.length} researchers at ${new Set(inR.map(p => p.i)).size} institutions`;
      body = `<p class="pm-sect">Institutions</p>` + rows([...count(inR, p => p.i)].sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, n, I[k].city]), k => I[k].name, "inst") +
        `<p class="pm-sect">Researchers</p>` + people(inR, 200);
    } else {
      const inst = I[S.sel.key], inI = scope.filter(p => p.i === S.sel.key);
      const region = inst.cc === "us" ? inst.st : (CC[inst.cc] || inst.cc);
      crumbs.push(`<span>›</span><button type="button" data-go="${inst.cc === "us" ? "state" : "cc"}" data-key="${esc(inst.cc === "us" ? inst.st : inst.cc)}">${esc(region)}</button>`);
      crumbs.push(`<span>›</span><span>${esc(inst.name)}</span>`);
      title = inst.name; meta = `${inst.city}${inst.cc === "us" ? ", " + inst.st : ""} · ${inI.length} researchers`;
      const tops = [...count(inI, p => p.d)].sort((a, b) => b[1] - a[1]);
      body = (tops.length ? `<div class="pm-chips">${tops.map(([d, n]) => `<span class="pm-chip">${esc(d)} ${n}</span>`).join("")}</div>` : "") + people(inI, 200);
    }
    panel.innerHTML = `<nav class="pm-crumb" aria-label="Location">${crumbs.join("")}</nav><h3>${esc(title)}</h3><p class="pm-meta">${esc(meta)}</p>${body}`;
  }

  function render() {
    const list = filtered();
    $("#pm-tab-world").setAttribute("aria-pressed", S.view === "world");
    $("#pm-tab-us").setAttribute("aria-pressed", S.view === "us");
    stats(list); drawMap(list); drawPanel(list);
  }

  function bind() {
    panel.addEventListener("click", e => {
      const t = e.target.closest("[data-state],[data-cc],[data-inst],[data-go]");
      if (!t) return;
      const toCountry = cc => { if (cc === "us") { S.view = "us"; S.sel = null; } else S.sel = { type: "country", key: cc }; };
      if (t.dataset.go === "top") S.sel = null;
      else if (t.dataset.go === "state") S.sel = { type: "state", key: t.dataset.key };
      else if (t.dataset.go === "cc") toCountry(t.dataset.key);
      else if (t.dataset.state) S.sel = { type: "state", key: t.dataset.state };
      else if (t.dataset.cc) toCountry(t.dataset.cc);
      else if (t.dataset.inst) { if (I[t.dataset.inst].cc === "us") S.view = "us"; S.sel = { type: "inst", key: t.dataset.inst }; }
      render();
    });
    panel.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("pm-row")) { e.preventDefault(); e.target.click(); } });
    $("#pm-tab-world").addEventListener("click", () => { S.view = "world"; S.sel = null; render(); });
    $("#pm-tab-us").addEventListener("click", () => { S.view = "us"; S.sel = null; render(); });
    $("#pm-topic").addEventListener("change", e => { S.topic = e.target.value; render(); });
    $("#pm-llm").addEventListener("change", e => { S.llm = e.target.checked; render(); });
    $("#pm-fac").addEventListener("change", e => { S.fac = e.target.checked; render(); });
    $("#pm-q").addEventListener("input", e => { S.q = e.target.value; render(); });
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
})();
