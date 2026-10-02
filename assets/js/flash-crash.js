/* Flash crash simulator: a toy limit-order-book market populated by LLM trading agents.
 * The engine (Sim) has no DOM dependencies; the UI at the bottom binds it to #fc-app. */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Engine
  // ---------------------------------------------------------------------------

  var TICK = 0.05;          // price increment
  var NL = 6000;            // book levels (max price = NL * TICK)
  var FAIR = 100;           // fundamental value
  var N_AGENTS = 48;
  var CAPITAL = 1000;       // starting equity per agent
  var DT = 0.25;            // simulated seconds per step
  var MAINT = 0.5;          // maintenance margin, as a fraction of initial margin
  var BAND = 0.05;          // circuit breaker band around a ~10 s moving reference
  var REF_RATE = 0.025;
  var HALT_STEPS = 60;

  // Market makers: depth per level, quoting window (levels), refill and cancel rates
  var D0 = 12, K = 50, REPL = 0.10, PULL = 0.45;
  // Fundamental traders' resting orders, far from fair value
  var VD = 8, V_START = 0.08, V_RAMP = 0.12, REPL_V = 0.01;
  var VLO = Math.round(FAIR * 0.5 / TICK), VHI = Math.round(FAIR * 1.5 / TICK);
  var VOL_REF = 1.6, INV_REF = 700, SKEW = 0.012, CONF_MIN = 0.1;

  // Entries are worked patiently (small clips, capped slippage); stops and margin calls are market orders.
  var SHORT_THR = 1.5, SHORT_SIZE = 0.5, ENTRY_CHUNK = 0.15, ENTRY_SLIP = 0.01, EXIT_CHUNK = 0.25, LIQ_CHUNK = 0.4;
  // The shared model: every agent assigned to it reacts identically.
  var SHARED = { kind: 1, lb: 12, thr: 0.012, stop: 0.03, lag: 24, noise: 0.002, gull: 1, letter: 'A' };
  var LETTERS = ['B', 'C', 'D', 'E', 'F'];
  var MOM_SHARE = 0.35;     // share of non-A agents that chase momentum (the rest fade moves)

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }
  // Resting depth from fundamental traders, as a function of distance from fair value.
  function valueDepth(dev) { return dev > V_START ? VD * Math.min(1, (dev - V_START) / V_RAMP) : 0; }

  function Sim(opts) {
    opts = opts || {};
    this.seed = opts.seed != null ? opts.seed : (Date.now() ^ (Math.random() * 1e9)) >>> 0;
    this.homog = opts.homog != null ? opts.homog : 0.75;
    this.lev = opts.lev != null ? opts.lev : 5;
    this.cb = !!opts.cb;
    this.reset();
  }

  Sim.prototype.gauss = function () {
    var u = 0; while (u === 0) u = this.r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * this.r());
  };

  Sim.prototype.reset = function () {
    this.r = mulberry32(this.seed);
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0; // next reset gets a fresh market
    this.t = 0; this.t0 = null;
    this.baseDepth = 0; this.mmAlarm = false;
    this.peakLongs = this.peakShared = this.peakCluster = null;
    this.bids = new Float64Array(NL);
    this.asks = new Float64Array(NL);
    var c = Math.round(FAIR / TICK);
    this.bb = c - 1; this.ba = c + 1;
    this.lo = c; this.hi = c;
    this.conf = 1; this.inv = 0; this.vol = 0.5;
    this.midL = c; this.mref = c; this.lastRef = c; this.ref = FAIR;
    this.halt = 0; this.hitBand = false;
    this.cmd = 0;               // user command for hijacked agents: +1 buy, -1 sell
    this.news = 0; this.debunkAt = -1;
    this.hist = { p: [], vb: [], vs: [], vy: [], halt: [], depth: [], ref: [] };
    this.events = [];
    this.liqCount = 0;
    this.crash = null; this.debriefs = []; this.crashFloor = 0;
    this.flow = { b: 0, s: 0, y: 0 };

    var idx = [];
    for (var i = 0; i < N_AGENTS; i++) idx.push(i);
    for (i = idx.length - 1; i > 0; i--) { var j = Math.floor(this.r() * (i + 1)); var tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp; }
    this.order = idx;
    this.agents = [];
    for (i = 0; i < N_AGENTS; i++) {
      this.agents.push({
        id: i + 1, hijacked: false, dead: false, liq: false,
        cash: CAPITAL, pos: 0, lev: 1, target: 0, size: 0, peak: 0, trough: 0, cool: 0, losses: 0, entryEq: CAPITAL,
        last: 0, lastSide: 0,
        own: {
          kind: this.r() < MOM_SHARE ? 1 : -1,   // momentum or mean-reversion
          lb: 6 + Math.floor(this.r() * 35),
          thr: 0.014 + this.r() * 0.03,
          stop: 0.02 + this.r() * 0.08,
          lag: 5 + Math.floor(this.r() * 55),
          noise: 0.002,
          gull: this.r() * 0.6,
          letter: LETTERS[Math.floor(this.r() * LETTERS.length)]
        },
        p: null
      });
    }
    this.setHomog(this.homog);

    // Fill the book, then let it run quietly so the chart starts with history.
    for (i = 0; i < 40; i++) this.mmStep(true);
    for (i = 0; i < 500; i++) this.step();
    this.baseDepth = this.depthWithin(0.02);
    this.events = [];
    this.t0 = this.t;
  };

  Sim.prototype.setHomog = function (h) {
    this.homog = h;
    var k = Math.round(h * N_AGENTS);
    for (var n = 0; n < N_AGENTS; n++) {
      var a = this.agents[this.order[n]];
      a.p = n < k ? SHARED : a.own;
    }
  };

  // The price everyone sees (mref, in levels). See updateMid.
  Sim.prototype.price = function () { return this.mref * TICK; };

  Sim.prototype.nextAsk = function (L) { for (var i = L; i < NL; i++) if (this.asks[i] > 0) return i; return NL - 1; };
  Sim.prototype.nextBid = function (L) { for (var i = L; i > 0; i--) if (this.bids[i] > 0) return i; return 0; };

  // Marketable order. side: +1 buy, -1 sell; slip: max distance from the current price
  // the trader will pay (omit for a pure market order). Returns quantity filled.
  Sim.prototype.exec = function (side, qty, mine, slip) {
    if (this.halt > 0 || !(qty > 1e-6)) return 0;
    var rem = qty, filled = 0, notional = 0, L, q;
    var px = slip != null ? this.mref * (1 + side * slip) : null;
    if (side > 0) {
      var band = this.cb ? Math.floor(this.ref * (1 + BAND) / TICK) : NL - 2;
      var lim = px != null ? Math.min(band, Math.floor(px)) : band;
      while (rem > 1e-6) {
        L = this.ba;
        if (L > lim) { if (L > band) this.hitBand = this.cb; break; }
        if (L >= NL - 1) break;
        q = Math.min(this.asks[L], rem);
        this.asks[L] -= q; rem -= q; filled += q; notional += q * L;
        if (this.asks[L] <= 1e-6) { this.asks[L] = 0; this.ba = this.nextAsk(L + 1); }
      }
      this.inv -= filled;
      this.flow.b += filled;
    } else {
      var bandS = this.cb ? Math.ceil(this.ref * (1 - BAND) / TICK) : 1;
      var limS = px != null ? Math.max(bandS, Math.ceil(px)) : bandS;
      while (rem > 1e-6) {
        L = this.bb;
        if (L < limS) { if (L < bandS) this.hitBand = this.cb; break; }
        if (L <= 0) break;
        q = Math.min(this.bids[L], rem);
        this.bids[L] -= q; rem -= q; filled += q; notional += q * L;
        if (this.bids[L] <= 1e-6) { this.bids[L] = 0; this.bb = this.nextBid(L - 1); }
      }
      this.inv += filled;
      this.flow.s += filled;
    }
    if (mine) this.flow.y += filled;
    this.lastPx = filled > 0 ? notional / filled * TICK : 0;
    return filled;
  };

  // midL is the book's mid. mref chases it on every call, and updateMid runs after each agent's turn, so
  // during trading mref is effectively the live mid; the single partial update after market makers
  // re-quote smooths the recorded price a little. mref freezes while trading is halted.
  Sim.prototype.updateMid = function () {
    var hasB = this.bids[this.bb] > 0, hasA = this.asks[this.ba] > 0;
    if (hasB && hasA) this.midL = (this.bb + this.ba) / 2;
    else if (hasA) this.midL = this.ba - 1;
    else if (hasB) this.midL = this.bb + 1;
    if (this.halt === 0) this.mref += (this.midL - this.mref) * (this.ba - this.bb <= 30 ? 0.5 : 0.15);
  };

  Sim.prototype.mmStep = function (init) {
    var tgt = 1 - 0.12 * Math.max(0, this.vol / VOL_REF - 1) - 0.15 * Math.pow(this.inv / INV_REF, 2);
    tgt = clamp(tgt, CONF_MIN, 1);
    if (init) this.conf = 1;
    else if (this.halt > 0) this.conf += (Math.max(tgt, 0.85) - this.conf) * 0.05;
    else this.conf += (tgt - this.conf) * (tgt < this.conf ? 0.3 : 0.03);
    this.inv *= 0.97;

    var conf = this.conf;
    var hs = 1 + Math.round((1 - conf) * 10);
    var center = this.mref - clamp(this.inv * SKEW, -8, 8);
    var wlo = Math.max(1, Math.floor(center - K - 2)), whi = Math.min(NL - 2, Math.ceil(center + K + 2));
    var lo = Math.min(this.lo, wlo), hi = Math.max(this.hi, whi);
    var repl = init ? 1 : REPL;
    var nlo = NL, nhi = 0;
    if (init) { lo = Math.min(lo, VLO); hi = Math.max(hi, VHI); }
    for (var L = lo; L <= hi; L++) {
      var dA = L - center, dB = center - L, T, Tv, cur;
      // asks: market maker quotes near the mid, plus patient value sellers far above fair value
      Tv = L > this.bb ? valueDepth(L * TICK / FAIR - 1) : 0;
      T = (dA >= hs && dA <= K && L > this.bb) ? D0 * conf * (0.4 + 0.6 * Math.min(1, (dA - hs) / 15)) : 0;
      cur = this.asks[L];
      cur = cur < T + Tv ? cur + (T + Tv - cur) * (T > 0 ? repl : init ? 1 : REPL_V) : cur - (cur - T - Tv) * PULL;
      if (cur < 0.05) cur = 0;
      this.asks[L] = cur;
      if (cur > 0 && L < this.ba) this.ba = L;
      // bids
      Tv = L < this.ba ? valueDepth(1 - L * TICK / FAIR) : 0;
      T = (dB >= hs && dB <= K && L < this.ba) ? D0 * conf * (0.4 + 0.6 * Math.min(1, (dB - hs) / 15)) : 0;
      cur = this.bids[L];
      cur = cur < T + Tv ? cur + (T + Tv - cur) * (T > 0 ? repl : init ? 1 : REPL_V) : cur - (cur - T - Tv) * PULL;
      if (cur < 0.05) cur = 0;
      this.bids[L] = cur;
      if (cur > 0 && L > this.bb) this.bb = L;
      if (this.asks[L] > 0 || this.bids[L] > 0) { if (L < nlo) nlo = L; if (L > nhi) nhi = L; }
    }
    this.lo = nlo <= nhi ? nlo : wlo; this.hi = nlo <= nhi ? nhi : whi;
    if (!(this.asks[this.ba] > 0)) this.ba = this.nextAsk(this.ba);
    if (!(this.bids[this.bb] > 0)) this.bb = this.nextBid(this.bb);
    this.updateMid();
  };

  Sim.prototype.depthWithin = function (frac) {
    var m = this.midL, w = Math.round(m * frac), s = 0;
    for (var L = Math.max(1, Math.floor(m - w)); L <= Math.min(NL - 2, Math.ceil(m + w)); L++) s += this.bids[L] + this.asks[L];
    return s;
  };

  Sim.prototype.momentum = function (lb) {
    var h = this.hist.p, n = h.length;
    if (n <= lb) return 0;
    return h[n - 1] / h[n - 1 - lb] - 1;
  };

  Sim.prototype.log = function (kind, text, extra) {
    var e = { t: this.t, kind: kind, text: text };
    if (extra) for (var k in extra) e[k] = extra[k];
    this.events.push(e);
    if (this.events.length > 200) this.events.shift();
  };

  Sim.prototype.trade = function (a, side, qty, slip) {
    var f = this.exec(side, qty, a.hijacked, slip);
    if (f > 0) {
      a.cash -= side * f * this.lastPx;
      a.pos += side * f;
      if (Math.abs(a.pos) < 0.05) { a.cash += a.pos * this.lastPx; a.pos = 0; }
      a.last = this.t; a.lastSide = side;
    }
    return f;
  };

  Sim.prototype.agentStep = function (a, p, entries, exits) {
    if (a.dead) return;
    var P = a.p;
    var eq = a.cash + a.pos * p;
    var notional = Math.abs(a.pos) * p;

    if (a.liq || (a.pos !== 0 && eq <= MAINT * notional / a.lev)) {
      if (!a.liq) {
        a.liq = true; this.liqCount++;
        this.log('liq', 'Agent ' + a.id + (a.hijacked ? ' (yours)' : '') + ' margin-called: forced ' + (a.pos > 0 ? 'sale' : 'cover') + ' of ' + Math.round(Math.abs(a.pos)), { agent: a.id });
      }
      this.trade(a, a.pos > 0 ? -1 : 1, Math.min(Math.abs(a.pos), Math.max(1, Math.abs(a.pos) * LIQ_CHUNK)));
      if (a.pos === 0) { a.dead = true; a.liq = false; a.target = 0; }
      return;
    }

    var maxPos = this.lev * clamp(eq, 0, CAPITAL) / p;

    if (a.hijacked) {
      if (this.cmd !== 0 && maxPos > 0) {
        var want = this.cmd * maxPos, d = want - a.pos;
        if (d * this.cmd > maxPos * 0.01) { a.lev = this.lev; this.trade(a, this.cmd, Math.min(Math.abs(d), Math.max(1, maxPos * 0.06))); }
      }
      return;
    }

    if (a.cool > 0) a.cool--;

    var s = P.kind * this.momentum(P.lb) + this.news * P.gull + (P === SHARED ? this.commonNoise : this.gauss() * P.noise);
    var exit = false;
    // trailing stops, then momentum reversal
    if (a.target > 0) {
      if (p > a.peak) a.peak = p;
      exit = p <= a.peak * (1 - P.stop) || s < -P.thr;
    } else if (a.target < 0) {
      if (p < a.trough) a.trough = p;
      exit = p >= a.trough * (1 + P.stop) || s > P.thr;
    }
    if (exit) {
      a.target = 0;
      if (a.cash + a.pos * p < a.entryEq) a.losses++;
      a.cool = P.lag * (1 + a.losses);
      exits.push(a);
    }

    if (a.target === 0 && a.pos === 0 && a.cool === 0) {
      if (s > P.thr) { a.target = 1; a.peak = p; entries.push(a); }
      else if (s < -P.thr * SHORT_THR) { a.target = -1; a.trough = p; entries.push(a); }
      if (a.target) { a.entryEq = eq; a.lev = this.lev; a.size = maxPos * (a.target < 0 ? SHORT_SIZE : 1); }
    }

    if (a.target === 0) {
      if (a.pos !== 0) this.trade(a, a.pos > 0 ? -1 : 1, Math.min(Math.abs(a.pos), Math.max(1, a.size * EXIT_CHUNK)));
    } else {
      var dd = a.target * a.size - a.pos;
      if (dd * a.target > a.size * 0.02) this.trade(a, a.target, Math.min(Math.abs(dd), a.size * ENTRY_CHUNK), ENTRY_SLIP);
    }
  };

  Sim.prototype.step = function () {
    this.t++;
    this.flow = { b: 0, s: 0, y: 0 };
    this.hitBand = false;
    var p = this.price(), i;

    if (this.halt > 0) {
      this.halt--;
      if (this.halt === 0) { this.updateMid(); this.ref = this.price(); this.log('cb', 'Trading resumes'); }
    }

    // news
    if (this.debunkAt === this.t) {
      this.news = -0.045;
      this.log('news', 'Correction: \u201cACME denies takeover report; headline was fabricated.\u201d', { mark: 'debunked' });
    }
    this.news *= 0.975;
    if (Math.abs(this.news) < 1e-4) this.news = 0;

    // noise traders (they don't cross a blown-out spread)
    for (i = 0; i < 2 && this.ba - this.bb < 10; i++) {
      var q = -Math.log(1 - this.r()) * 3;
      this.exec(this.r() < 0.5 ? 1 : -1, q, false, 0.005);
    }
    // value traders
    var mis = (FAIR - p) / FAIR;
    if (Math.abs(mis) > 0.004) {
      var vq = mis > 0 ? Math.min(90, 380 * mis) : Math.min(50, 180 * -mis);
      this.exec(mis > 0 ? 1 : -1, vq, false, Math.abs(mis));
    }

    // agents, in random order
    this.commonNoise = this.gauss() * SHARED.noise;
    var entries = [], exits = [];
    var ord = this.agents.slice();
    for (i = ord.length - 1; i > 0; i--) { var j = Math.floor(this.r() * (i + 1)); var tmp = ord[i]; ord[i] = ord[j]; ord[j] = tmp; }
    for (i = 0; i < ord.length; i++) { this.updateMid(); this.agentStep(ord[i], this.price(), entries, exits); }

    if (entries.length >= 3) {
      var dir = entries[0].target;
      var nA = entries.filter(function (a) { return a.p === SHARED; }).length;
      this.log(dir > 0 ? 'herd-buy' : 'herd-sell', entries.length + ' agents ' + (dir > 0 ? 'pile in long' : 'go short') + ' at ' + this.price().toFixed(2) + (nA >= entries.length / 2 ? ' (same model, same signal)' : ''));
    }
    var outL = exits.filter(function (a) { return a.pos > 0; }).length, outS = exits.length - outL;
    if (outL >= 3) this.log('cascade', 'Stop cascade: ' + outL + ' agents dump at once near ' + this.price().toFixed(2));
    if (outS >= 3) this.log('squeeze', 'Short squeeze: ' + outS + ' agents buy back at once near ' + this.price().toFixed(2));

    this.updateMid();
    this.mmStep(false);
    this.vol += (Math.min(30, Math.abs(this.mref - this.lastRef)) - this.vol) * 0.1;
    this.lastRef = this.mref;

    p = this.price();
    // circuit breaker
    if (this.cb && this.halt === 0) {
      if (this.hitBand || p >= this.ref * (1 + BAND) - TICK || p <= this.ref * (1 - BAND) + TICK) {
        this.halt = HALT_STEPS;
        this.log('cb', 'Circuit breaker: price hit the \u00b15% band, trading paused');
      } else {
        this.ref += (p - this.ref) * REF_RATE;
      }
    } else if (!this.cb) {
      this.ref += (p - this.ref) * REF_RATE;
    }

    // liquidity alarms
    var depth = this.baseDepth ? this.depthWithin(0.02) / this.baseDepth : 1;
    if (this.baseDepth) {
      if (!this.mmAlarm && depth < 0.35) { this.mmAlarm = true; this.log('mm', 'Market makers pull quotes: liquidity down to ' + Math.round(depth * 100) + '%'); }
      else if (this.mmAlarm && depth > 0.7) { this.mmAlarm = false; this.log('mm', 'Market makers return: liquidity back to ' + Math.round(depth * 100) + '%'); }
    }

    var h = this.hist;
    h.p.push(p); h.vb.push(this.flow.b); h.vs.push(this.flow.s); h.vy.push(this.flow.y);
    h.halt.push(this.halt > 0 ? 1 : 0); h.depth.push(depth); h.ref.push(this.ref);
    this.trackCrash(p, depth);
  };

  Sim.prototype.longCount = function () {
    var n = 0;
    for (var i = 0; i < this.agents.length; i++) { var a = this.agents[i]; if (!a.hijacked && !a.dead && a.pos > 0) n++; }
    return n;
  };

  // Trailing-stop levels of autonomous long agents, for the chart and the debrief.
  Sim.prototype.stops = function () {
    var out = [];
    for (var i = 0; i < this.agents.length; i++) {
      var a = this.agents[i];
      if (a.hijacked || a.dead || a.target <= 0 || a.pos <= 0) continue;
      out.push(a.peak * (1 - a.p.stop));
    }
    return out;
  };
  Sim.prototype.stopCluster = function () {
    var s = this.stops(), best = 0, at = 0;
    for (var i = 0; i < s.length; i++) {
      var c = 0;
      for (var j = 0; j < s.length; j++) if (Math.abs(s[j] - s[i]) <= s[i] * 0.0025) c++;
      if (c > best) { best = c; at = s[i]; }
    }
    return { n: best, at: at };
  };

  Sim.prototype.trackCrash = function (p, depth) {
    var h = this.hist.p, n = h.length;
    if (!this.crash) {
      var from = Math.max(this.crashFloor || 0, n - 160), pk = 0, pkI = n - 1;
      for (var i = from; i < n; i++) if (h[i] > pk) { pk = h[i]; pkI = i; }
      if ((pk - p) / pk > 0.08 && this.t0 != null) {
        this.crash = { peak: pk, peakStep: pkI, trough: p, troughStep: n - 1, minDepth: depth,
          liq0: this.liqCount, yours: this.agents.filter(function (a) { return a.hijacked; }).length,
          followers: this.peakLongs != null ? this.peakLongs : this.longCount(),
          followersShared: this.peakShared || 0,
          cluster: this.peakCluster || { n: 0, at: 0 }, homog: this.homog, cb: this.cb, lev: this.lev,
          news: this.debunkAt >= 0 && Math.abs(this.t - this.debunkAt) < 120 };
        this.log('crash', 'Flash crash: down ' + ((1 - p / pk) * 100).toFixed(1) + '% from the high and falling');
      }
    } else {
      var c = this.crash;
      if (p < c.trough) { c.trough = p; c.troughStep = n - 1; }
      if (depth < c.minDepth) c.minDepth = depth;
      var settling = this.agents.some(function (a) { return a.liq; });
      if (!settling && (p > c.trough + 0.5 * (c.peak - c.trough) || n - 1 - c.troughStep > 60)) {
        c.liq = this.liqCount - c.liq0;
        c.secs = (c.troughStep - c.peakStep) * DT;
        c.drop = c.trough / c.peak - 1;
        c.yoursDead = this.agents.filter(function (a) { return a.hijacked && a.dead; }).length;
        c.after = p;
        this.log('rebound', 'Bottomed at ' + c.trough.toFixed(2) + ' (\u2212' + Math.abs(c.drop * 100).toFixed(1) + '% from the high); back to ' + p.toFixed(2));
        this.debriefs.push(c);
        this.crash = null;
        this.crashFloor = n;
      }
    }
    // remember crowding at the most recent local high, so the debrief can report it
    if (!this.crash) {
      var m = Math.max(this.crashFloor || 0, n - 160), top = 0;
      for (var k = m; k < n; k++) if (h[k] > top) top = h[k];
      if (p >= top - 1e-9) {
        this.peakLongs = this.longCount();
        this.peakShared = this.agents.filter(function (a) { return !a.hijacked && !a.dead && a.pos > 0 && a.p === SHARED; }).length;
        this.peakCluster = this.stopCluster();
      }
    }
  };

  // ---- user actions ----
  Sim.prototype.toggleHijack = function (id) {
    var a = this.agents[id - 1];
    if (!a || a.dead) return;
    a.hijacked = !a.hijacked;
    if (!a.hijacked) {
      a.target = a.pos > 0 ? 1 : a.pos < 0 ? -1 : 0;
      a.size = Math.abs(a.pos); a.entryEq = a.cash + a.pos * this.price();
      a.peak = a.trough = this.price(); a.cool = 0;
    }
    else { a.target = 0; }
  };
  Sim.prototype.hijackRandom = function (n) {
    var free = this.agents.filter(function (a) { return !a.hijacked && !a.dead; });
    for (var i = 0; i < n && free.length; i++) {
      var k = Math.floor(this.r() * free.length);
      this.toggleHijack(free[k].id); free.splice(k, 1);
    }
  };
  Sim.prototype.releaseAll = function () {
    for (var i = 0; i < this.agents.length; i++) if (this.agents[i].hijacked) this.toggleHijack(this.agents[i].id);
  };
  Sim.prototype.plantNews = function () {
    this.news = 0.035;
    this.debunkAt = this.t + 90;
    this.log('news', 'Injected headline: \u201cACME to be acquired at $135 a share, sources say.\u201d', { mark: 'fake headline' });
  };
  Sim.prototype.yours = function () { return this.agents.filter(function (a) { return a.hijacked; }); };

  Sim.TICK = TICK; Sim.FAIR = FAIR; Sim.DT = DT; Sim.N = N_AGENTS; Sim.BAND = BAND; Sim.CAPITAL = CAPITAL;
  Sim.SHARED = SHARED;

  if (typeof module !== 'undefined' && module.exports) { module.exports = { Sim: Sim }; return; }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  var HZ = 20, SLOW_HZ = 6, WINDOW = 320, CLOCK0 = 14 * 3600 + 30 * 60;
  var MINUS = '−';
  var MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

  function rgb(c) {
    c = (c || '').trim();
    if (c.charAt(0) === '#') {
      if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    }
    var m = c.match(/[\d.]+/g);
    return m && m.length >= 3 ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
  }
  function rgba(c, a) { var r = rgb(c); return 'rgba(' + r[0] + ',' + r[1] + ',' + r[2] + ',' + a + ')'; }
  function signed(x, d) { return (x < 0 ? MINUS : '+') + Math.abs(x).toFixed(d == null ? 2 : d); }
  function pct(x, d) { return (x < 0 ? MINUS : '+') + Math.abs(x * 100).toFixed(d == null ? 1 : d) + '%'; }
  // t is a step count measured from the moment the market opens for the visitor
  function clock(t) {
    var s = CLOCK0 + Math.floor(t * DT), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60;
    return h + ':' + (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss;
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }

  function fit(cv) {
    var r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }

  function initUI(root) {
    function $(id) { return root.querySelector('#fc-' + id); }
    var el = {
      px: $('px'), chg: $('chg'), clock: $('clock'), status: $('status'), slow: $('slow'), pause: $('pause'),
      chart: $('chart'), book: $('book'), grid: $('grid'), tip: $('tip'), agentsMeta: $('agents-meta'), liq: $('liq'),
      sYours: $('s-yours'), sLong: $('s-long'), sCalls: $('s-calls'), sDepth: $('s-depth'),
      coach: $('coach'), buy: $('buy'), news: $('news'), take: $('take'), release: $('release'), reset: $('reset'),
      homog: $('homog'), homogOut: $('homog-out'), lev: $('lev'), levOut: $('lev-out'), cb: $('cb'),
      debrief: $('debrief'), log: $('log'), meter: $('meter')
    };
    var sim = new Sim({ homog: el.homog.value / 100, lev: +el.lev.value, cb: el.cb.checked });
    var C = {};
    var ui = { paused: false, visible: true, slowUntil: 0, slow: false, shown: 0, tipFor: null,
      yLo: 95, yHi: 105, base: null, runs: [], buyAt: null, releasedAt: null, lastDebriefT: null, logKey: null, holdBy: 0 };

    // ---- agents grid ----
    var cells = [];
    for (var i = 0; i < Sim.N; i++) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'fc-agent'; b.setAttribute('data-id', i + 1);
      b.innerHTML = '<span></span>';
      el.grid.appendChild(b); cells.push(b);
    }

    function readColors() {
      var cs = getComputedStyle(root);
      ['bg', 'panel', 'ink', 'muted', 'line', 'grid', 'up', 'down', 'you', 'fair', 'on-up', 'on-down'].forEach(function (k) {
        C[k] = cs.getPropertyValue('--fc-' + k).trim() || '#888';
      });
    }

    function captureBase() {
      var m = Math.round(sim.midL), w = Math.round(m * 0.05), cb = [], ca = [], s = 0, d;
      for (d = 0; d <= w; d++) { s += sim.bids[m - d] || 0; cb.push(s); }
      s = 0;
      for (d = 0; d <= w; d++) { s += sim.asks[m + d] || 0; ca.push(s); }
      ui.base = { b: cb, a: ca, max: Math.max(cb[cb.length - 1], ca[ca.length - 1]) };
    }

    function yours() { return sim.yours(); }
    function unitSize() { return sim.lev * Sim.CAPITAL / FAIR; }

    // Fraction of your agents' buying (or selling) power already used.
    function powerUsed(dir) {
      var ys = yours().filter(function (a) { return !a.dead; });
      if (!ys.length) return 0;
      var s = 0;
      ys.forEach(function (a) {
        var eq = a.cash + a.pos * sim.price();
        var max = sim.lev * Math.min(Math.max(eq, 0), Sim.CAPITAL) / sim.price();
        s += max > 0 ? Math.max(0, Math.min(1, dir * a.pos / max)) : 1;
      });
      return s / ys.length;
    }

    // ---- chart ----
    function drawChart() {
      var f = fit(el.chart), ctx = f.ctx, W = f.w, H = f.h;
      var h = sim.hist, n = h.p.length, start = Math.max(0, n - WINDOW), i, x, y;
      var padR = 62, padB = 18, gap = 8;
      var plotL = 4, plotR = W - padR, plotW = plotR - plotL, plotT = 12;
      var volH = Math.round((H - plotT - padB) * 0.16);
      var plotB = H - padB - volH - gap, plotH = plotB - plotT;

      var lo = FAIR * 0.965, hi = FAIR * 1.035;
      for (i = start; i < n; i++) { if (h.p[i] < lo) lo = h.p[i]; if (h.p[i] > hi) hi = h.p[i]; }
      var sp = hi - lo; lo -= sp * 0.07; hi += sp * 0.07;
      ui.yLo = lo < ui.yLo ? lo : ui.yLo + (lo - ui.yLo) * 0.08;
      ui.yHi = hi > ui.yHi ? hi : ui.yHi + (hi - ui.yHi) * 0.08;
      var yLo = ui.yLo, yHi = ui.yHi;
      function Y(p) { return plotT + (yHi - p) / (yHi - yLo) * plotH; }
      function X(k) { return plotL + (k - (n - WINDOW)) / (WINDOW - 1) * plotW; }
      var bw = plotW / WINDOW;

      ctx.font = '11px ' + MONO; ctx.textBaseline = 'middle';

      // halts
      for (i = start; i < n; i++) {
        if (!h.halt[i]) continue;
        var j = i; while (j < n && h.halt[j]) j++;
        ctx.fillStyle = rgba(C.you, 0.1);
        ctx.fillRect(X(i), plotT, X(j - 1) - X(i) + bw, plotH);
        if (X(j - 1) - X(i) > 44) { ctx.fillStyle = C.you; ctx.textAlign = 'left'; ctx.fillText('paused', X(i) + 4, plotB - 8); }
        i = j;
      }

      // grid
      var steps = [0.5, 1, 2, 2.5, 5, 10, 20], st = 1;
      for (i = 0; i < steps.length; i++) { st = steps[i]; if ((yHi - yLo) / st <= 6) break; }
      ctx.lineWidth = 1; ctx.textAlign = 'left';
      var tagY = n ? Math.max(plotT + 8, Math.min(plotB - 8, Y(h.p[n - 1]))) : -99;
      for (var g = Math.ceil(yLo / st) * st; g <= yHi; g += st) {
        y = Math.round(Y(g)) + 0.5;
        ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(plotL, y); ctx.lineTo(plotR, y); ctx.stroke();
        if (Math.abs(y - tagY) > 13) { ctx.fillStyle = C.muted; ctx.fillText(g.toFixed(st < 1 ? 1 : 0), plotR + 20, y); }
      }

      // time ticks every 30 simulated seconds
      ctx.textAlign = 'center'; ctx.fillStyle = C.muted;
      var every = Math.round(30 / DT), off = sim.t0 % every;
      for (i = Math.ceil((start - off) / every) * every + off - 1; i < n; i += every) {
        if (i < start) continue;
        x = X(i);
        if (x < plotL + 24 || x > plotR - 24) continue;
        ctx.fillText(clock(i + 1 - sim.t0), x, H - padB / 2 + 1);
      }

      // circuit-breaker band
      if (sim.cb) {
        ctx.setLineDash([2, 4]); ctx.strokeStyle = rgba(C.you, 0.75); ctx.lineWidth = 1;
        [1 + Sim.BAND, 1 - Sim.BAND].forEach(function (k) {
          ctx.beginPath();
          for (var q = start; q < n; q++) { var yy = Y(h.ref[q] * k); q === start ? ctx.moveTo(X(q), yy) : ctx.lineTo(X(q), yy); }
          ctx.stroke();
        });
        ctx.setLineDash([]);
      }

      // fair value
      y = Math.round(Y(FAIR)) + 0.5;
      ctx.setLineDash([5, 4]); ctx.strokeStyle = C.fair; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(plotL, y); ctx.lineTo(plotR, y); ctx.stroke(); ctx.setLineDash([]);
      var fairY = y;

      // markers for things you did and what they caused
      var rowEnd = [-1e9, -1e9, -1e9];
      sim.events.forEach(function (e) {
        if (!e.mark) return;
        var k = e.t - 1; if (k < start) return;
        var xx = Math.round(X(k)) + 0.5, col = e.kind === 'crash' ? C.down : C.you;
        ctx.strokeStyle = rgba(col, 0.6); ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(xx, plotT); ctx.lineTo(xx, plotB); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = '600 11px ' + MONO;
        var tw = ctx.measureText(e.mark).width;
        ctx.textAlign = xx + 4 + tw > plotR ? 'right' : 'left';
        var lx = xx + (ctx.textAlign === 'left' ? 4 : -4), x0 = ctx.textAlign === 'left' ? lx : lx - tw;
        // first row where the label does not collide with the previous one
        var row = 0;
        while (row < rowEnd.length - 1 && x0 < rowEnd[row] + 6) row++;
        rowEnd[row] = x0 + tw;
        var ly = plotT + 6 + row * 14;
        ctx.fillStyle = rgba(C.bg, 0.85);
        ctx.fillRect(x0 - 2, ly - 7, tw + 4, 14);
        ctx.fillStyle = col; ctx.fillText(e.mark, lx, ly);
        ctx.font = '11px ' + MONO;
      });

      // price
      if (n > 1) {
        var grad = ctx.createLinearGradient(0, plotT, 0, plotB);
        grad.addColorStop(0, rgba(C.ink, 0.10)); grad.addColorStop(1, rgba(C.ink, 0));
        ctx.beginPath();
        for (i = start; i < n; i++) { x = X(i); y = Y(h.p[i]); i === start ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.lineTo(X(n - 1), plotB); ctx.lineTo(X(start), plotB); ctx.closePath();
        ctx.fillStyle = grad; ctx.fill();
        ctx.beginPath();
        for (i = start; i < n; i++) { x = X(i); y = Y(h.p[i]); i === start ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.stroke();
      }

      // fair-value label, on top of the price line
      ctx.font = '11px ' + MONO; ctx.textAlign = 'left';
      var fw = ctx.measureText('fair value').width;
      ctx.fillStyle = rgba(C.bg, 0.85); ctx.fillRect(plotL + 4, fairY - 16, fw + 4, 14);
      ctx.fillStyle = C.fair; ctx.fillText('fair value', plotL + 6, fairY - 9);

      // crash annotations
      var crashes = sim.debriefs.slice(-3);
      if (sim.crash) crashes = crashes.concat([sim.crash]);
      crashes.forEach(function (c) {
        if (c.troughStep < start) return;
        var xt = X(c.troughStep), yt = Y(c.trough), xp = X(Math.max(c.peakStep, start)), yp = Y(c.peak);
        ctx.strokeStyle = C.down; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(xp, yp); ctx.lineTo(xt, yp); ctx.lineTo(xt, yt); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = C.down; ctx.beginPath(); ctx.arc(xt, yt, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.font = '700 12px ' + MONO; ctx.textAlign = xt > plotR - 70 ? 'right' : 'left';
        ctx.fillText(pct(c.trough / c.peak - 1), xt + (ctx.textAlign === 'left' ? 7 : -7), Math.min(plotB - 10, yt + 2));
        ctx.font = '11px ' + MONO;
      });

      // stop-loss map: where the autonomous longs will sell
      var stops = sim.stops();
      if (stops.length) {
        ctx.fillStyle = rgba(C.down, 0.5);
        stops.forEach(function (sv) { var yy = Y(sv); if (yy > plotT && yy < plotB) ctx.fillRect(plotR + 3, yy - 1, 12, 2); });
        var cl = sim.stopCluster();
        if (cl.n >= 4 && Y(cl.at) > plotT + 8 && Y(cl.at) < plotB - 8) {
          var txt = cl.n + ' stop-losses →', yy2 = Y(cl.at);
          ctx.font = '600 11px ' + MONO; ctx.textAlign = 'right';
          var tw2 = ctx.measureText(txt).width;
          ctx.fillStyle = rgba(C.bg, 0.85); ctx.fillRect(plotR - tw2 - 6, yy2 - 8, tw2 + 4, 16);
          ctx.fillStyle = C.down; ctx.fillText(txt, plotR - 3, yy2);
          ctx.font = '11px ' + MONO;
        }
      }

      // last price tag
      if (n) {
        var lp = h.p[n - 1], ly2 = Math.max(plotT + 8, Math.min(plotB - 8, Y(lp)));
        ctx.fillStyle = lp >= FAIR ? C.up : C.down;
        ctx.fillRect(plotR + 16, ly2 - 9, padR - 16, 18);
        ctx.fillStyle = lp >= FAIR ? C['on-up'] : C['on-down']; ctx.font = '700 11px ' + MONO; ctx.textAlign = 'left';
        ctx.fillText(lp.toFixed(2), plotR + 19, ly2 + 0.5);
        ctx.font = '11px ' + MONO;
      }

      // volume
      var vT = plotB + gap, vB = H - padB, vH = vB - vT, vmax = 250;
      for (i = start; i < n; i++) vmax = Math.max(vmax, h.vb[i] + h.vs[i]);
      for (i = start; i < n; i++) {
        var tot = h.vb[i] + h.vs[i]; if (tot <= 0.5) continue;
        var bh = Math.max(1, tot / vmax * vH), x0 = X(i) - bw / 2;
        ctx.fillStyle = rgba(h.vb[i] >= h.vs[i] ? C.up : C.down, 0.55);
        ctx.fillRect(x0, vB - bh, Math.max(1, bw), bh);
        if (h.vy[i] > 0.5) { var yh = Math.max(1, h.vy[i] / vmax * vH); ctx.fillStyle = C.you; ctx.fillRect(x0, vB - yh, Math.max(1, bw), yh); }
      }
      ctx.fillStyle = C.muted; ctx.textAlign = 'left'; ctx.fillText('volume', plotL + 2, vT + 5);
    }

    // ---- order book depth ----
    function drawBook() {
      var f = fit(el.book), ctx = f.ctx, W = f.w, H = f.h;
      if (!ui.base) return;
      var padT = 6, padB = 18, padX = 4;
      var m = sim.midL, w = ui.base.b.length - 1;
      var ymax = ui.base.max * 1.15;
      function X(L) { return padX + (L - (m - w)) / (2 * w) * (W - 2 * padX); }
      function Y(v) { return H - padB - Math.min(1, v / ymax) * (H - padT - padB); }
      var base = Math.round(m), d, cum;

      // what a normal book looks like, centred on today's mid
      ctx.setLineDash([3, 3]); ctx.strokeStyle = C.muted; ctx.lineWidth = 1;
      ctx.beginPath();
      for (d = w; d >= 0; d--) { var xx = X(m - d), yy = Y(ui.base.b[d]); d === w ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
      for (d = 0; d <= w; d++) ctx.lineTo(X(m + d), Y(ui.base.a[d]));
      ctx.stroke(); ctx.setLineDash([]);

      function side(dir, arr, col) {
        ctx.beginPath(); ctx.moveTo(X(base), Y(0)); cum = 0;
        for (d = 0; d <= w; d++) { var L = base + dir * d; cum += arr[L] || 0; ctx.lineTo(X(L), Y(cum)); }
        ctx.lineTo(X(base + dir * w), Y(0)); ctx.closePath();
        ctx.fillStyle = rgba(col, 0.22); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
      }
      side(-1, sim.bids, C.up);
      side(1, sim.asks, C.down);

      ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(X(m), padT); ctx.lineTo(X(m), H - padB); ctx.stroke();
      ctx.font = '11px ' + MONO; ctx.fillStyle = C.muted; ctx.textBaseline = 'middle';
      ctx.textAlign = 'left'; ctx.fillText(MINUS + '5%', padX, H - padB / 2);
      ctx.textAlign = 'center'; ctx.fillText(sim.price().toFixed(2), X(m), H - padB / 2);
      ctx.textAlign = 'right'; ctx.fillText('+5%', W - padX, H - padB / 2);
      ctx.textAlign = 'left'; ctx.fillStyle = C.up; ctx.fillText('bids', padX + 2, padT + 8);
      ctx.textAlign = 'right'; ctx.fillStyle = C.down; ctx.fillText('asks', W - padX - 2, padT + 8);
    }

    // ---- agents ----
    function renderAgents() {
      var unit = unitSize(), nA = 0;
      for (var k = 0; k < cells.length; k++) {
        var a = sim.agents[k], c = cells[k], cls = 'fc-agent', fill = Math.min(1, Math.abs(a.pos) / unit);
        if (a.p === Sim.SHARED) nA++;
        if (a.dead) cls += ' is-dead';
        else if (a.pos > 0.5) cls += ' is-long';
        else if (a.pos < -0.5) cls += ' is-short';
        if (!a.dead && fill > 0.55) cls += ' is-full';
        if (a.hijacked) cls += ' is-you';
        if (a.liq) cls += ' is-liq';
        if (!a.dead && a.last > 0 && sim.t - a.last <= 1) cls += ' is-trading';
        if (c.className !== cls) {
          c.className = cls;
          c.setAttribute('aria-pressed', a.hijacked ? 'true' : 'false');
          c.setAttribute('aria-label', 'Agent ' + a.id + ', model ' + a.p.letter + ', ' +
            (a.dead ? 'liquidated' : a.pos > 0.5 ? 'long' : a.pos < -0.5 ? 'short' : 'flat') + (a.hijacked ? ', under your control' : ''));
        }
        c.style.setProperty('--f', (0.3 + 0.7 * fill).toFixed(2));
        if (c.firstChild.textContent !== a.p.letter) c.firstChild.textContent = a.p.letter;
      }
      el.agentsMeta.textContent = nA + ' of ' + Sim.N + ' run model A';
    }

    function updateTip() {
      if (ui.tipFor == null) { el.tip.hidden = true; return; }
      var a = sim.agents[ui.tipFor - 1], c = cells[ui.tipFor - 1], p = sim.price();
      var eq = a.cash + a.pos * p, rows = [];
      rows.push('<b>Agent ' + a.id + '</b> · model ' + a.p.letter + (a.p === Sim.SHARED ? ' (shared)' : ''));
      rows.push(a.p.kind > 0 ? 'chases momentum' : 'fades moves');
      if (a.dead) rows.push('liquidated');
      else if (a.pos > 0.5) rows.push('long ' + Math.abs(a.pos).toFixed(0) + ' shares');
      else if (a.pos < -0.5) rows.push('short ' + Math.abs(a.pos).toFixed(0) + ' shares');
      else rows.push('flat');
      if (!a.dead && !a.hijacked && a.target > 0 && a.pos > 0.5) rows.push('stop-loss ' + (a.peak * (1 - a.p.stop)).toFixed(2));
      if (!a.dead && !a.hijacked && a.target < 0 && a.pos < -0.5) rows.push('stop-loss ' + (a.trough * (1 + a.p.stop)).toFixed(2));
      rows.push('equity $' + Math.round(eq).toLocaleString('en-US') + ' (' + pct(eq / Sim.CAPITAL - 1, 0) + ')');
      rows.push(a.hijacked ? '<span class="fc-tip-you">under your control · click to release</span>' : a.dead ? '' : 'click to take control');
      el.tip.innerHTML = rows.filter(Boolean).join('<br>');
      var rr = root.getBoundingClientRect(), cr = c.getBoundingClientRect();
      el.tip.hidden = false;
      var tw = el.tip.offsetWidth, cx = cr.left + cr.width / 2 - rr.left;
      cx = Math.max(tw / 2 + 6, Math.min(rr.width - tw / 2 - 6, cx));
      el.tip.style.left = cx + 'px';
      el.tip.style.top = (cr.top - rr.top) + 'px';
    }

    // ---- text ----
    function setText(node, txt) { if (node.textContent !== txt) node.textContent = txt; }

    function coachText() {
      var ys = yours(), alive = ys.filter(function (a) { return !a.dead; }).length;
      var longs = sim.longCount();
      if (ui.paused) return 'Paused. Press Resume to continue.';
      if (sim.halt > 0) return 'Circuit breaker: trading is paused for ' + Math.ceil(sim.halt * DT) + ' s while market makers rebuild the book. Pending sell orders are still waiting.';
      if (sim.crash) return 'Flash crash. Stop-losses and margin calls are selling into an order book that market makers have abandoned.';
      if (sim.cmd > 0) {
        if (powerUsed(1) > 0.97) return 'Your agents are out of buying power. Let go and watch who is left holding the position.';
        return 'Buying… ' + plural(alive, 'agent') + ' under your control ' + (alive === 1 ? 'is' : 'are') + ' lifting the offer. Watch the other agents.';
      }
      if (longs >= 8) {
        var cl = sim.stopCluster();
        return longs + ' agents are now long' + (cl.n >= 4 ? ', and ' + cl.n + ' of them would sell at the same price, ' + cl.at.toFixed(2) : '') + '. Let go and wait.';
      }
      if (sim.news > 0.004) return 'A fabricated headline is in every agent’s news feed. Every model A agent reads it the same way.';
      if (sim.debunkAt > sim.t) return 'The headline will be debunked in ' + Math.ceil((sim.debunkAt - sim.t) * DT) + ' s.';
      if (ui.tapped && !ui.herd && sim.t - ui.releasedAt < 120) return 'Keep the button pressed: your agents buy only while you hold it.';
      if (ui.releasedAt != null && !ui.herd && sim.t - ui.releasedAt > 30) return 'Not enough to tip the herd. Take over more agents, raise the share on model A, or plant a fake headline.';
      if (ui.lastDebriefT != null && sim.t - ui.lastDebriefT < 600) return 'Run it again with fewer agents on the same model, or with the circuit breaker on, and compare.';
      if (sim.agents.filter(function (a) { return a.dead; }).length >= 12) return 'Many agents were liquidated. Press Reset market for a fresh start.';
      if (!alive) return '① Click agents to take control of them, or just hold BUY to grab eight at random.';
      return '② ' + plural(alive, 'agent') + ' under your control. Press and hold BUY (or the B key).';
    }

    function renderLog() {
      var ev = sim.events, out = [], k;
      for (k = ev.length - 1; k >= 0 && out.length < 6; k--) {
        var e = ev[k];
        if (e.kind === 'liq') {
          var n = 0, mine = 0, t = e.t;
          while (k >= 0 && ev[k].kind === 'liq' && t - ev[k].t <= 4) { n++; if (/yours/.test(ev[k].text)) mine++; k--; }
          k++;
          out.push({ t: t, kind: 'liq', text: n === 1 ? e.text : plural(n, 'agent') + ' margin-called and force-sold' + (mine ? ' (' + mine + ' yours)' : '') });
        } else out.push(e);
      }
      var key = out.map(function (e) { return e.t + e.text; }).join('|');
      if (key === ui.logKey) return;
      ui.logKey = key;
      el.log.innerHTML = out.map(function (e) {
        return '<li class="k-' + e.kind + '"><time>' + clock(e.t - sim.t0) + '</time><span>' + e.text + '</span></li>';
      }).join('') || '<li class="k-empty"><span>Nothing has happened yet. The market is quiet.</span></li>';
    }

    function renderTop() {
      var p = sim.price(), d = p / FAIR - 1;
      setText(el.px, p.toFixed(2));
      setText(el.chg, signed(p - FAIR) + ' (' + pct(d, 2) + ') vs fair value');
      el.chg.className = 'fc-chg ' + (d >= 0 ? 'is-up' : 'is-down');
      setText(el.clock, clock(sim.t - sim.t0));
      var st = 'Live', sc = 'fc-pill is-live';
      if (ui.paused) { st = 'Paused'; sc = 'fc-pill'; }
      else if (sim.halt > 0) { st = 'Trading paused · ' + Math.ceil(sim.halt * DT) + 's'; sc = 'fc-pill is-halt'; }
      else if (sim.crash) { st = 'Flash crash'; sc = 'fc-pill is-crash'; }
      setText(el.status, st); if (el.status.className !== sc) el.status.className = sc;
      el.slow.hidden = !(ui.slow && !ui.paused);
      setText(el.pause, ui.paused ? 'Resume' : 'Pause');

      var ys = yours(), dead = ys.filter(function (a) { return a.dead; }).length;
      setText(el.sYours, dead ? (ys.length - dead) + ' left · ' + dead + ' liquidated' : String(ys.length));
      var longs = 0, shorts = 0;
      sim.agents.forEach(function (a) { if (!a.hijacked && !a.dead) { if (a.pos > 0.5) longs++; else if (a.pos < -0.5) shorts++; } });
      setText(el.sLong, longs + ' long · ' + shorts + ' short');
      setText(el.sCalls, String(sim.liqCount));
      var dep = sim.hist.depth[sim.hist.depth.length - 1] || 1;
      setText(el.sDepth, Math.round(Math.min(1, dep) * 100) + '%');
      el.sDepth.className = dep < 0.4 ? 'is-down' : '';
      setText(el.liq, 'market-maker depth ' + Math.round(Math.min(1, dep) * 100) + '% of normal');

      setText(el.coach, coachText());
      el.meter.style.width = (powerUsed(1) * 100).toFixed(1) + '%';
      el.buy.classList.toggle('is-held', sim.cmd > 0);
      el.news.disabled = sim.debunkAt > sim.t || Math.abs(sim.news) > 0.004;
      el.take.disabled = !sim.agents.some(function (a) { return !a.hijacked && !a.dead; });
      el.release.disabled = !ys.some(function (a) { return !a.dead; });
    }

    function renderDebrief(c) {
      var nY = c.yours, items = [];
      if (nY > 0) items.push('You controlled <b>' + nY + ' of ' + Sim.N + '</b> agents (' + Math.round(nY / Sim.N * 100) + '%).');
      else if (c.news) items.push('You did not control a single agent. A fabricated headline pumped the price, and its correction set off the crash.');
      else items.push('None of the agents were under your control when it happened.');
      if (c.followers >= 3) items.push('<b>' + c.followers + '</b> other agents were long at the top' +
        (c.followersShared >= c.followers / 2 ? ', ' + c.followersShared + ' of them on model A, reacting to the same signal at the same moment' : '') + '.');
      if (c.cluster.n >= 3) items.push('<b>' + c.cluster.n + ' stop-losses</b> sat within 0.25% of ' + c.cluster.at.toFixed(2) + ', so they fired together.');
      items.push('Market makers pulled <b>' + Math.round((1 - Math.min(1, c.minDepth)) * 100) + '%</b> of their quotes' +
        (c.liq ? '; <b>' + c.liq + '</b> agents were margin-called' + (c.yoursDead ? ' (' + c.yoursDead + ' of yours)' : '') : '') + '.');
      items.push('Nothing about ACME changed. Fair value was $100 the whole time; the price is back at ' + c.after.toFixed(2) + '.');

      ui.runs.unshift(c);
      if (ui.runs.length > 6) ui.runs.pop();
      var rows = ui.runs.map(function (r) {
        return '<tr><td>' + Math.round(r.homog * 100) + '%</td><td>' + r.lev + '×</td><td>' + (r.cb ? 'on' : 'off') + '</td><td>' + r.yours +
          '</td><td class="is-down">' + pct(r.drop) + '</td><td>' + r.liq + '</td></tr>';
      }).join('');

      var acts = [];
      if (c.homog > 0.3) acts.push('<button type="button" class="fc-btn" data-act="diverse">Run again, 20% on model A</button>');
      if (!c.cb) acts.push('<button type="button" class="fc-btn" data-act="cb">Run again, circuit breaker on</button>');
      acts.push('<button type="button" class="fc-btn fc-btn-quiet" data-act="close">Close</button>');

      el.debrief.innerHTML =
        '<div class="fc-debrief-h"><span class="fc-debrief-drop">' + pct(c.drop) + '</span> in ' + c.secs.toFixed(1) + ' seconds' +
        '<span class="fc-debrief-sub">' + c.peak.toFixed(2) + ' → ' + c.trough.toFixed(2) + '</span></div>' +
        '<ul>' + items.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' +
        '<div class="fc-debrief-acts">' + acts.join('') + '</div>' +
        '<div class="fc-runs"><table><thead><tr><th>Model A</th><th>Lev.</th><th>Breaker</th><th>Yours</th><th>Drop</th><th>Margin calls</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
      el.debrief.hidden = false;
    }

    function render() {
      drawChart(); drawBook(); renderAgents(); renderTop(); renderLog();
      if (ui.tipFor != null) updateTip();
    }

    // ---- simulation loop ----
    function afterStep() {
      var h = sim.hist.p, n = h.length;
      if (n > 5 && Math.abs(h[n - 1] / h[n - 5] - 1) > 0.012) ui.slowUntil = sim.t + 16;
      ui.slow = sim.t < ui.slowUntil && sim.halt === 0;
      var e = sim.events[sim.events.length - 1];
      if (e && e.t === sim.t && e.kind === 'herd-buy') ui.herd = true;
      if (sim.debriefs.length > ui.shown) {
        ui.shown = sim.debriefs.length;
        ui.lastDebriefT = sim.t;
        renderDebrief(sim.debriefs[ui.shown - 1]);
      }
    }

    var last = performance.now(), acc = 0;
    function frame(now) {
      var dt = Math.min(0.25, (now - last) / 1000); last = now;
      if (!ui.paused && ui.visible && !document.hidden) {
        acc += dt * (ui.slow ? SLOW_HZ : HZ);
        var steps = 0;
        while (acc >= 1 && steps < 5) { sim.step(); afterStep(); acc -= 1; steps++; }
        if (acc > 5) acc = 0;
        if (steps) render();
      }
      requestAnimationFrame(frame);
    }

    // ---- actions ----
    function you(text, mark) { sim.log('you', text, mark ? { mark: mark } : null); }

    function startCmd(dir) {
      if (sim.cmd === dir) return;
      if (ui.paused) ui.paused = false;
      var alive = yours().filter(function (a) { return !a.dead; });
      if (!alive.length) {
        sim.hijackRandom(8);
        alive = yours().filter(function (a) { return !a.dead; });
        you('You took over ' + plural(alive.length, 'agent') + ' at random');
      }
      if (!alive.length) return;
      sim.cmd = dir;
      ui.buyAt = sim.t; ui.releasedAt = null; ui.herd = false; ui.tapped = false;
      you('You order ' + plural(alive.length, 'agent') + ' (' + alive.map(function (a) { return '#' + a.id; }).join(', ') + ') to buy', 'you: buy');
      render();
    }
    function stopCmd(dir) {
      if (!sim.cmd || (dir && sim.cmd !== dir)) return;
      sim.cmd = 0;
      ui.releasedAt = sim.t;
      ui.tapped = sim.t - ui.buyAt < 8;
      you('You let go', 'let go');
      render();
    }

    function bindHold(btn, dir) {
      btn.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        e.preventDefault();
        ui.holdBy = dir;
        startCmd(dir);
      });
      btn.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) startCmd(dir); }
      });
      btn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); stopCmd(dir); } });
      btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }
    bindHold(el.buy, 1);
    // release wherever the pointer ends up
    ['pointerup', 'pointercancel'].forEach(function (t) {
      window.addEventListener(t, function () { if (ui.holdBy) { var d = ui.holdBy; ui.holdBy = 0; stopCmd(d); } });
    });

    document.addEventListener('keydown', function (e) {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || !ui.visible) return;
      var t = e.target;
      if (t && (t.isContentEditable || /^(TEXTAREA|SELECT)$/.test(t.tagName) || (t.tagName === 'INPUT' && !/^(range|checkbox)$/.test(t.type)))) return;
      var k = (e.key || '').toLowerCase();
      if (k === 'b') { e.preventDefault(); startCmd(1); }
    });
    document.addEventListener('keyup', function (e) {
      var k = (e.key || '').toLowerCase();
      if (k === 'b') stopCmd(1);
    });
    window.addEventListener('blur', function () { stopCmd(0); });

    el.grid.addEventListener('click', function (e) {
      var c = e.target.closest('.fc-agent'); if (!c) return;
      sim.toggleHijack(+c.getAttribute('data-id'));
      ui.tipFor = +c.getAttribute('data-id');
      render();
    });
    el.grid.addEventListener('pointerover', function (e) {
      var c = e.target.closest('.fc-agent'); if (!c) return;
      ui.tipFor = +c.getAttribute('data-id'); updateTip();
    });
    el.grid.addEventListener('pointerleave', function () { ui.tipFor = null; updateTip(); });
    el.grid.addEventListener('focusin', function (e) {
      var c = e.target.closest('.fc-agent'); if (!c) return;
      ui.tipFor = +c.getAttribute('data-id'); updateTip();
    });
    el.grid.addEventListener('focusout', function () { ui.tipFor = null; updateTip(); });

    el.take.addEventListener('click', function () {
      sim.hijackRandom(8);
      var n = yours().filter(function (a) { return !a.dead; }).length;
      you('You now control ' + plural(n, 'agent'));
      render();
    });
    el.release.addEventListener('click', function () {
      if (sim.cmd) stopCmd(0);
      sim.releaseAll();
      you('You released your agents; they trade on their own again');
      render();
    });
    el.news.addEventListener('click', function () {
      if (ui.paused) ui.paused = false;
      sim.plantNews();
      ui.buyAt = sim.t; ui.releasedAt = null; ui.herd = false;
      render();
    });

    function reset() {
      sim.cmd = 0;
      sim.homog = el.homog.value / 100; sim.lev = +el.lev.value; sim.cb = el.cb.checked;
      sim.reset();
      captureBase();
      ui.yLo = 95; ui.yHi = 105; ui.shown = 0; ui.slowUntil = 0; ui.slow = false;
      ui.buyAt = ui.releasedAt = ui.lastDebriefT = null; ui.herd = false; ui.logKey = null;
      render();
    }
    el.reset.addEventListener('click', function () { reset(); el.debrief.hidden = true; });
    el.pause.addEventListener('click', function () { ui.paused = !ui.paused; render(); });

    function syncKnobs() {
      el.homogOut.textContent = el.homog.value + '%';
      el.levOut.textContent = el.lev.value + '×';
    }
    el.homog.addEventListener('input', function () { syncKnobs(); sim.setHomog(el.homog.value / 100); render(); });
    el.lev.addEventListener('input', function () { syncKnobs(); sim.lev = +el.lev.value; render(); });
    el.cb.addEventListener('change', function () {
      sim.cb = el.cb.checked;
      if (sim.cb) sim.ref = sim.price(); else sim.halt = 0;
      render();
    });

    el.debrief.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'close') { el.debrief.hidden = true; return; }
      if (act === 'diverse') el.homog.value = 20;
      if (act === 'cb') el.cb.checked = true;
      syncKnobs(); reset();
      el.debrief.hidden = true;
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // ---- environment ----
    readColors();
    new MutationObserver(function () { readColors(); render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onScheme = function () { setTimeout(function () { readColors(); render(); }, 50); };
      if (mq.addEventListener) mq.addEventListener('change', onScheme); else if (mq.addListener) mq.addListener(onScheme);
    }
    if (window.ResizeObserver) new ResizeObserver(function () { render(); }).observe(root);
    else window.addEventListener('resize', render);
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) { ui.visible = es[0].isIntersecting; if (!ui.visible) stopCmd(0); }, { threshold: 0.05 }).observe(root);
    }

    syncKnobs();
    captureBase();
    render();
    requestAnimationFrame(frame);
  }

  window.FlashCrashSim = Sim;
  var rootEl = document.getElementById('fc-app');
  if (rootEl) initUI(rootEl);
})();
