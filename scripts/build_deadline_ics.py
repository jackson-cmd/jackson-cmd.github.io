#!/usr/bin/env python3
"""Build iCalendar feeds of upcoming paper deadlines for the conferences on
/resources/security-conference-deadlines/.

Exact dates come from sec-deadlines (security venues, preferred) and
ccf-deadlines (everything else). Writes:
  assets/cal/conference-deadlines.ics   all tracks
  assets/cal/security-deadlines.ics     security track only
  _data/deadline_feed.yml               counts and build date for the page

Run from the repository root:  python3 scripts/build_deadline_ics.py
(set CCF_DIR=<local clone of ccfddl/ccf-deadlines> to skip the GitHub API)
"""
import concurrent.futures as cf
import datetime as dt
import json
import os
import re
import sys
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

import yaml

ROOT = Path(__file__).resolve().parent.parent
JS = ROOT / "assets/js/deadlines.js"
OUT = ROOT / "assets/cal"
SEC_URL = "https://raw.githubusercontent.com/sec-deadlines/sec-deadlines.github.io/master/_data/conferences.yml"
CCF_TREE = "https://api.github.com/repos/ccfddl/ccf-deadlines/git/trees/main?recursive=1"
CCF_RAW = "https://raw.githubusercontent.com/ccfddl/ccf-deadlines/main/"
SITE = "https://jackson-cmd.github.io"
PAGE = SITE + "/resources/security-conference-deadlines/"
UA = {"User-Agent": "deadline-feed-builder"}

# Page abbreviation -> names used by the two sources (normalized).
ALIASES = {
    "S&P": ["sp", "spoakland", "ieeesp"],
    "EuroS&P": ["eurosp", "ieeeeurosp"],
    "USENIX Security": ["usenixsecurity", "uss", "usenixsec"],
    "CSFW": ["csfw", "csf"],
    "IEEE CEC": ["ieeecec", "cec"],
    "IFIP WG 11.9": ["ifipwg119", "ifip119", "ifipdf"],
    "IH&MMSec": ["ihmmsec"],
    "CT-RSA": ["ctrsa"],
    "SEC": ["ifipsec", "sec"],
    "PETS": ["pets", "popets"],
    "AsiaCCS": ["asiaccs"],
}


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower().split("(")[0])


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return r.read().decode("utf-8")


def page_conferences():
    text = JS.read_text(encoding="utf-8")
    pat = re.compile(r'abbr: "([^"]+)", name: "([^"]+)", track: "([A-Za-z]+)", ccf: "([^"]*)", core: "([^"]*)", rate: [^,]+, rateStr: "([^"]*)"')
    seen = {}
    for abbr, name, track, ccf, core, rate in pat.findall(text):
        seen.setdefault(abbr, dict(abbr=abbr, name=name, track=track, ccf=ccf, core=core, rate=rate))
    return list(seen.values())


def tzinfo(label):
    label = (label or "AoE").strip()
    if label.lower() in ("aoe", "anywhere on earth"):
        return dt.timezone(dt.timedelta(hours=-12))
    m = re.fullmatch(r"(?:UTC|GMT)\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?", label, re.I)
    if m:
        sign = 1 if m.group(1) == "+" else -1
        return dt.timezone(sign * dt.timedelta(hours=int(m.group(2)), minutes=int(m.group(3) or 0)))
    if label.upper() in ("UTC", "GMT"):
        return dt.timezone.utc
    fixed = {"PST": -8, "PDT": -7, "EST": -5, "EDT": -4, "CET": 1, "CEST": 2, "JST": 9, "KST": 9}
    if label.upper() in fixed:
        return dt.timezone(dt.timedelta(hours=fixed[label.upper()]))
    try:
        return ZoneInfo(label)
    except Exception:
        return dt.timezone(dt.timedelta(hours=-12))


def parse_when(s, tz):
    s = str(s).strip()
    if not re.match(r"\d{4}-\d{2}-\d{2}", s):
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            t = dt.datetime.strptime(s, fmt)
            if fmt == "%Y-%m-%d":
                t = t.replace(hour=23, minute=59)
            return t.replace(tzinfo=tz)
        except ValueError:
            continue
    return None


def sec_events():
    data = yaml.safe_load(get(SEC_URL)) or []
    out = {}
    for c in data:
        tz = tzinfo(c.get("timezone"))
        dls = c.get("deadline") or []
        if isinstance(dls, str):
            dls = [dls]
        evs = []
        for i, d in enumerate(dls):
            when = parse_when(d, tz)
            if when:
                evs.append(dict(when=when, kind="Paper deadline" + (f" (cycle {i + 1})" if len(dls) > 1 else ""),
                                year=c.get("year"), link=c.get("link"), comment=c.get("comment") or ""))
        out.setdefault(norm(c.get("name", "")), []).extend(evs)
    return out


def ccf_events():
    """Reads a local clone if CCF_DIR is set (no API rate limit), else fetches."""
    local = os.environ.get("CCF_DIR")
    if local:
        paths = [str(p) for p in Path(local, "conference").rglob("*.yml")]
    else:
        tree = json.loads(get(CCF_TREE))
        paths = [CCF_RAW + x["path"] for x in tree.get("tree", []) if x["path"].startswith("conference/") and x["path"].endswith(".yml")]
    out = {}

    def one(p):
        try:
            text = Path(p).read_text(encoding="utf-8") if local else get(p)
            return yaml.safe_load(text) or []
        except Exception:
            return []

    with cf.ThreadPoolExecutor(16) as ex:
        for items in ex.map(one, paths):
            for c in items:
                evs = []
                for conf in c.get("confs") or []:
                    tz = tzinfo(conf.get("timezone"))
                    for tl in conf.get("timeline") or []:
                        note = tl.get("comment") or ""
                        a = parse_when(tl.get("abstract_deadline", ""), tz)
                        if a:
                            evs.append(dict(when=a, kind="Abstract deadline", year=conf.get("year"), link=conf.get("link"), comment=note))
                        d = parse_when(tl.get("deadline", ""), tz)
                        if d:
                            evs.append(dict(when=d, kind="Paper deadline" + (f" ({note})" if note and len(note) < 40 else ""),
                                            year=conf.get("year"), link=conf.get("link"), comment=note))
                out.setdefault(norm(c.get("title", "")), []).extend(evs)
    return out


def esc(s):
    return str(s).replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def fold(line):
    b = line.encode("utf-8")
    if len(b) <= 74:
        return line
    parts, cur = [], b""
    for ch in line:
        e = ch.encode("utf-8")
        if len(cur) + len(e) > 73:
            parts.append(cur.decode("utf-8"))
            cur = b""
        cur += e
    parts.append(cur.decode("utf-8"))
    return "\r\n ".join(parts)


def calendar(name, events, stamp):
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//jackson-cmd.github.io//Conference deadlines//EN",
             "CALSCALE:GREGORIAN", "METHOD:PUBLISH", f"X-WR-CALNAME:{esc(name)}",
             "X-WR-CALDESC:" + esc("Upcoming paper deadlines. Source: " + PAGE),
             "REFRESH-INTERVAL;VALUE=DURATION:P1D", "X-PUBLISHED-TTL:P1D"]
    for c, e in events:
        end = e["when"].astimezone(dt.timezone.utc)
        start = end - dt.timedelta(minutes=30)
        local = e["when"].strftime("%Y-%m-%d %H:%M") + " " + (e["when"].tzname() or "")
        uid = re.sub(r"[^a-z0-9]+", "-", f"{c['abbr']}-{e['year']}-{e['kind']}-{end:%Y%m%d%H%M}".lower()) + "@jackson-cmd.github.io"
        desc = [f"{c['name']} {e['year'] or ''}".strip(), f"{e['kind']}: {local}",
                f"Track: {c['track']} | {c['core']} | {c['ccf']} | acceptance {c['rate']}"]
        if e["comment"]:
            desc.append(e["comment"])
        desc.append("Always confirm on the official call for papers.")
        desc.append("Calendar: " + PAGE)
        lines += ["BEGIN:VEVENT", f"UID:{uid}", f"DTSTAMP:{stamp:%Y%m%dT%H%M%SZ}",
                  f"DTSTART:{start:%Y%m%dT%H%M%SZ}", f"DTEND:{end:%Y%m%dT%H%M%SZ}",
                  "SUMMARY:" + esc(f"{c['abbr']} {e['year'] or ''} {e['kind']}".replace("  ", " ")),
                  "DESCRIPTION:" + esc("\n".join(desc))]
        if e.get("link"):
            lines.append("URL:" + str(e["link"]))
        lines += ["BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + esc(f"{c['abbr']} deadline in 7 days"),
                  "TRIGGER:-P7D", "END:VALARM", "END:VEVENT"]
    lines.append("END:VCALENDAR")
    return "\r\n".join(fold(x) for x in lines) + "\r\n"


def main():
    now = dt.datetime.now(dt.timezone.utc)
    lo, hi = now - dt.timedelta(days=1), now + dt.timedelta(days=550)
    confs = page_conferences()
    sec, ccf = sec_events(), ccf_events()
    picked, missing = [], []
    for c in confs:
        keys = ALIASES.get(c["abbr"], []) + [norm(c["abbr"])]
        evs = []
        if c["track"] == "Security":
            for k in keys:
                if sec.get(k):
                    evs = sec[k]
                    break
        if not [e for e in evs if lo <= e["when"] <= hi]:
            for k in keys:
                if ccf.get(k):
                    evs = ccf[k]
                    break
        upcoming = [e for e in evs if lo <= e["when"] <= hi]
        if not upcoming and evs:
            # Not announced yet: repeat the latest edition's dates one year on.
            last = max((e["year"] or 0) for e in evs)
            for e in evs:
                if (e["year"] or 0) != last:
                    continue
                when, yr = e["when"], (e["year"] or 0)
                while when < now:
                    try:
                        when = when.replace(year=when.year + 1)
                    except ValueError:  # 29 Feb
                        when = when.replace(year=when.year + 1, day=28)
                    yr += 1
                if when <= hi:
                    upcoming.append(dict(e, when=when, year=yr or None,
                                         kind="Expected " + e["kind"][0].lower() + e["kind"][1:],
                                         comment=f"Not announced yet; date estimated from the {last} edition."))
        evs = upcoming
        uniq = {}
        for e in evs:
            uniq[(e["kind"], e["when"].astimezone(dt.timezone.utc))] = e
        evs = sorted(uniq.values(), key=lambda e: e["when"])
        if evs:
            picked += [(c, e) for e in evs]
        else:
            missing.append(c["abbr"])
    picked.sort(key=lambda x: x[1]["when"].astimezone(dt.timezone.utc))
    OUT.mkdir(parents=True, exist_ok=True)
    allc = calendar("Conference deadlines (Security, AI, NLP)", picked, now)
    secc = calendar("Security conference deadlines", [x for x in picked if x[0]["track"] == "Security"], now)
    (OUT / "conference-deadlines.ics").write_text(allc, encoding="utf-8", newline="")
    (OUT / "security-deadlines.ics").write_text(secc, encoding="utf-8", newline="")
    covered = len(confs) - len(missing)
    meta = dict(updated=now.strftime("%Y-%m-%d"), events=len(picked),
                security_events=sum(1 for x in picked if x[0]["track"] == "Security"),
                conferences_with_dates=covered, conferences_total=len(confs))
    (ROOT / "_data/deadline_feed.yml").write_text(yaml.safe_dump(meta, sort_keys=False), encoding="utf-8")
    print(json.dumps(meta))
    print("no upcoming date in either source:", ", ".join(missing))


if __name__ == "__main__":
    sys.exit(main())
