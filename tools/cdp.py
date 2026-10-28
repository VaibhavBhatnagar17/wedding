#!/usr/bin/env python3
"""Minimal Chrome DevTools Protocol driver — no third-party packages.

Enough of the WebSocket protocol to talk to headless Chrome, so we can take
true full-page screenshots (which --screenshot cannot do when a section is
sized in vh) and script real interactions.

Usage:
    python3 tools/cdp.py shots        # write /tmp/shots/*.png
    python3 tools/cdp.py check        # assert the pages render, print console errors
"""

import base64
import json
import os
import random
import re
import socket
import struct
import subprocess
import sys
import time
import urllib.request

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT = 9222
HTTP_PORT = 8899
OUT = "/tmp/shots"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ───────────────────────── websocket ─────────────────────────

class WS:
    def __init__(self, url):
        m = re.match(r"ws://([^:/]+):(\d+)(/.*)", url)
        host, port, path = m.group(1), int(m.group(2)), m.group(3)
        self.sock = socket.create_connection((host, port), timeout=30)
        key = base64.b64encode(bytes(random.getrandbits(8) for _ in range(16))).decode()
        req = (
            f"GET {path} HTTP/1.1\r\nHost: {host}:{port}\r\n"
            "Upgrade: websocket\r\nConnection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n"
        )
        self.sock.sendall(req.encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.sock.recv(4096)
        if b"101" not in buf.split(b"\r\n")[0]:
            raise RuntimeError("websocket upgrade failed: " + buf[:200].decode(errors="replace"))
        self.buf = buf.split(b"\r\n\r\n", 1)[1]

    def _read(self, n):
        while len(self.buf) < n:
            chunk = self.sock.recv(65536)
            if not chunk:
                raise RuntimeError("socket closed")
            self.buf += chunk
        out, self.buf = self.buf[:n], self.buf[n:]
        return out

    def send(self, text):
        payload = text.encode()
        header = bytearray([0x81])  # FIN + text
        n = len(payload)
        if n < 126:
            header.append(0x80 | n)
        elif n < 65536:
            header.append(0x80 | 126)
            header += struct.pack(">H", n)
        else:
            header.append(0x80 | 127)
            header += struct.pack(">Q", n)
        mask = bytes(random.getrandbits(8) for _ in range(4))
        header += mask
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
        self.sock.sendall(bytes(header) + masked)

    def recv(self):
        """Returns one complete text message, reassembling fragments."""
        chunks = []
        while True:
            b1, b2 = self._read(2)
            fin = b1 & 0x80
            opcode = b1 & 0x0F
            n = b2 & 0x7F
            if n == 126:
                n = struct.unpack(">H", self._read(2))[0]
            elif n == 127:
                n = struct.unpack(">Q", self._read(8))[0]
            data = self._read(n)
            if opcode == 0x8:      # close
                raise RuntimeError("websocket closed by peer")
            if opcode == 0x9:      # ping -> pong
                continue
            chunks.append(data)
            if fin:
                break
        return b"".join(chunks).decode(errors="replace")

    def close(self):
        try:
            self.sock.close()
        except Exception:
            pass


# ───────────────────────── cdp session ─────────────────────────

class Tab:
    def __init__(self, ws_url):
        self.ws = WS(ws_url)
        self.n = 0
        self.events = []

    def call(self, method, **params):
        self.n += 1
        mid = self.n
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})
            if "method" in msg:
                self.events.append(msg)

    def eval(self, expr, await_promise=False):
        r = self.call("Runtime.evaluate", expression=expr, returnByValue=True,
                      awaitPromise=await_promise)
        if r.get("exceptionDetails"):
            raise RuntimeError("JS error: " + json.dumps(r["exceptionDetails"])[:400])
        return r.get("result", {}).get("value")

    def console_errors(self):
        out = []
        for e in self.events:
            if e["method"] == "Runtime.consoleAPICalled" and e["params"]["type"] == "error":
                out.append(" ".join(str(a.get("value", a.get("description", "")))
                                    for a in e["params"]["args"]))
            if e["method"] == "Runtime.exceptionThrown":
                d = e["params"]["exceptionDetails"]
                out.append(d.get("text", "") + " " +
                           str(d.get("exception", {}).get("description", ""))[:300])
        return out

    def wait_for(self, expr, timeout=12.0, poll=0.25):
        """Polls a JS expression until it is truthy. Returns the last value."""
        end = time.time() + timeout
        val = None
        while time.time() < end:
            val = self.eval(expr)
            if val:
                return val
            time.sleep(poll)
        return val

    def goto(self, url, settle=2.2):
        # Always fetch fresh; a cached stylesheet silently invalidates the run.
        try:
            self.call("Network.enable")
            self.call("Network.setCacheDisabled", cacheDisabled=True)
        except Exception:
            pass
        self.call("Page.navigate", url=url)
        time.sleep(settle)

    def screenshot(self, path, width=1440, height=900, full=True):
        self.call("Emulation.setDeviceMetricsOverride",
                  width=width, height=height, deviceScaleFactor=1, mobile=False)
        time.sleep(0.35)
        args = {"format": "png"}
        if full:
            args["captureBeyondViewport"] = True
        r = self.call("Page.captureScreenshot", **args)
        with open(path, "wb") as f:
            f.write(base64.b64decode(r["data"]))
        return path


def start_chrome():
    # Software WebGL (SwiftShader) rather than --disable-gpu, so the 3D flight
    # over Udaipur actually renders in headless runs instead of falling back.
    args = [CHROME, "--headless=new", f"--remote-debugging-port={PORT}",
            "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist",
            "--hide-scrollbars", "--no-first-run",
            "--user-data-dir=/tmp/cdp-profile", "--window-size=1440,900"]
    p = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(60):
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/version", timeout=1)
            return p
        except Exception:
            time.sleep(0.4)
    raise RuntimeError("Chrome did not start")


def new_tab():
    """Newer Chrome wants PUT for /json/new; fall back to the tab it opened with."""
    try:
        req = urllib.request.Request(
            f"http://127.0.0.1:{PORT}/json/new?about:blank", method="PUT")
        raw = urllib.request.urlopen(req, timeout=10).read()
        return Tab(json.loads(raw)["webSocketDebuggerUrl"])
    except Exception:
        raw = urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list", timeout=10).read()
        pages = [t for t in json.loads(raw) if t.get("type") == "page"]
        if not pages:
            raise RuntimeError("no page target available")
        return Tab(pages[0]["webSocketDebuggerUrl"])


def serve():
    p = subprocess.Popen([sys.executable, os.path.join(ROOT, "tools", "serve.py"), str(HTTP_PORT)],
                         cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.5)
    return p


def base():
    return f"http://127.0.0.1:{HTTP_PORT}"


# ───────────────────────── tasks ─────────────────────────

def task_shots(tab):
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith(".png"):
            os.remove(os.path.join(OUT, f))

    # Earlier runs may have left mutated RSVP state in the profile.
    tab.goto(base() + "/index.html?open=1", settle=1.5)
    tab.eval("localStorage.clear(); sessionStorage.clear();")

    def shot(name, url, w=1440, h=900, full=True, settle=3.0, before=None, fresh=False):
        tab.call("Emulation.setDeviceMetricsOverride", width=w, height=h,
                 deviceScaleFactor=1, mobile=False)
        if fresh:
            # The gate only shows on a first visit, and an earlier shot in this
            # run may have set the "already opened" flag. Clear it, then reload.
            tab.goto(base() + url, settle=0.6)
            tab.eval("sessionStorage.clear(); localStorage.clear();")
        tab.goto(base() + url, settle=settle)
        if before:
            tab.eval(before)
            time.sleep(0.85)
        # Reveal animations are scroll-triggered; walk down the page so they fire.
        if full:
            tab.eval("""(function(){
              var h=document.documentElement.scrollHeight, y=0;
              var id=setInterval(function(){ y+=400; window.scrollTo(0,y);
                if(y>h){clearInterval(id); window.scrollTo(0,0);} }, 30);
            })()""")
            time.sleep(2.4)
        tab.screenshot(f"{OUT}/{name}.png", width=w, height=h, full=full)
        print("  " + name)

    print("desktop")
    shot("01-gate", "/index.html", full=False, fresh=True)
    shot("02-hero", "/index.html?open=1", h=950, full=False)
    shot("03-invite-full", "/index.html?open=1", h=900)
    shot("04-portal-lookup", "/guest.html", full=False)
    shot("05-portal-me", "/guest.html#p=9876500007")
    shot("06-planner", "/planner.html", h=1000)
    # the doors mid-swing
    shot("07-gate-opening", "/index.html", full=False, settle=2.6, fresh=True,
         before="document.getElementById('gate-ring').click()")
    shot("08-portal-me-top", "/guest.html#p=9876500007", h=1000, full=False, settle=3.4)

    # Wide and short is where the old stretched door art fell apart, so shoot it.
    print("wide / short")
    shot("10-gate-wide", "/index.html", w=1024, h=540, full=False, fresh=True)
    shot("11-gate-ultrawide", "/index.html", w=1800, h=620, full=False, fresh=True)
    shot("12-hero-wide", "/index.html?open=1", w=1024, h=540, full=False)

    print("hindi")
    shot("13-hindi-hero", "/index.html?open=1", h=950, full=False,
         before="W.i18n.set('hi')")
    shot("14-hindi-full", "/index.html?open=1", h=900, before="W.i18n.set('hi')")
    tab.eval("W.i18n.set('en')")

    print("flight")
    for name, t in (("15-fly-palace", 4.4), ("16-fly-hills", 12.6), ("17-fly-khumani", 18.5), ("18-fly-landed", 99)):
        tab.call("Emulation.setDeviceMetricsOverride", width=1440, height=900, deviceScaleFactor=1, mobile=False)
        tab.goto(base() + "/index.html?open=1", settle=1.6)
        tab.eval("document.getElementById('venue').scrollIntoView()")
        tab.wait_for("/is-live|is-static/.test(document.getElementById('venue').className)", timeout=20)
        tab.eval("""(function(t){var v=document.getElementById('fly-film');v.pause();
          v.currentTime=Math.min(t, (v.duration||22)-0.05);})(%s)""" % t)
        time.sleep(2.0)
        tab.screenshot(f"{OUT}/{name}.png", width=1440, height=900, full=False)
        print("  " + name)

    print("live day")
    shot("19-live-ribbon", "/index.html?open=1&now=2027-02-01T20:10", h=900, full=False,
         before="document.getElementById('ev-sagaai').scrollIntoView({block:'center'})")

    print("mobile")
    shot("20-m-gate", "/index.html", w=414, h=896, full=False, fresh=True)
    shot("21-m-hero", "/index.html?open=1", w=414, h=896, full=False)
    shot("22-m-invite", "/index.html?open=1", w=414, h=896)
    shot("23-m-portal", "/guest.html#p=9876500007", w=414, h=896)
    shot("24-m-lookup", "/guest.html", w=414, h=896, full=False)


def task_zoom(tab):
    """Shoot one section at a time, framed on the section itself.

    The full-page shots are useful for rhythm but far too small to judge type
    and spacing, which is what most design work actually needs to look at."""
    out = OUT + "/zoom"
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        if f.endswith(".png"):
            os.remove(os.path.join(out, f))

    targets = [
        ("programme", "/index.html?open=1", "#programme"),
        ("venue", "/index.html?open=1", "#venue-info"),
        ("stay", "/index.html?open=1", "#stay"),
        ("travel", "/index.html?open=1", "#travel"),
        ("faq", "/index.html?open=1", "#faq"),
        ("help", "/index.html?open=1", "#help"),
        ("rsvp", "/index.html?open=1", "#rsvp"),
    ]
    for w, tag in ((1440, "d"), (414, "m")):
        tab.call("Emulation.setDeviceMetricsOverride", width=w, height=900,
                 deviceScaleFactor=1, mobile=False)
        for name, url, sel in targets:
            tab.goto(base() + url, settle=1.4)
            # Scroll the whole page first so every reveal has fired, then frame
            # the section — otherwise the shot catches it still hidden.
            tab.eval("""(function(){
              var h=document.documentElement.scrollHeight, y=0;
              var id=setInterval(function(){ y+=500; window.scrollTo(0,y);
                if(y>h){clearInterval(id);} }, 25);
            })()""")
            time.sleep(2.2)
            box = tab.eval("""(function(){
              var e=document.querySelector(%r); if(!e) return null;
              var r=e.getBoundingClientRect();
              return {y: r.top + window.scrollY, h: r.height};
            })()""" % sel)
            if not box:
                print("  skip " + name)
                continue
            tab.eval("window.scrollTo(0, %d)" % int(box["y"]))
            time.sleep(0.6)
            h = min(int(box["h"]), 2200)
            tab.call("Emulation.setDeviceMetricsOverride", width=w, height=h,
                     deviceScaleFactor=1, mobile=False)
            time.sleep(0.5)
            tab.screenshot(f"{out}/{tag}-{name}.png", width=w, height=h, full=False)
            print(f"  {tag}-{name}")
            tab.call("Emulation.setDeviceMetricsOverride", width=w, height=900,
                     deviceScaleFactor=1, mobile=False)


def task_check(tab):
    fails = []

    def check(label, cond, detail=""):
        print(("  PASS  " if cond else "  FAIL  ") + label + ("" if cond else "  " + str(detail)))
        if not cond:
            fails.append(label)

    print("invitation")
    tab.call("Runtime.enable")
    tab.goto(base() + "/index.html?open=1", settle=3.2)
    tab.eval("localStorage.removeItem('vm-lang'); W.i18n.set('en');")
    tab.eval("""(function(){var h=document.documentElement.scrollHeight,y=0;
      var id=setInterval(function(){y+=700;window.scrollTo(0,y);
        if(y>h){clearInterval(id);window.scrollTo(0,0);}},20);})()""")
    time.sleep(2.6)

    n_prog = tab.eval("W.invite.programme.length")
    check("three days render (1, 2 and the 3 Feb checkout)", tab.eval("document.querySelectorAll('.pday').length") == 3)
    check("every programme event renders", tab.eval("document.querySelectorAll('.ev').length") == n_prog,
          (tab.eval("document.querySelectorAll('.ev').length"), n_prog))
    check("every painted moment on this card", tab.eval("document.querySelectorAll('.ev--art img').length")
          == tab.eval("W.invite.programme.filter(function(e){return e.art}).length") == 10)
    tab.wait_for("Array.from(document.querySelectorAll('.ev--art img')).every(function(i){return i.complete && i.naturalWidth>0})", timeout=12)
    check("every painting loads", tab.eval(
        "Array.from(document.querySelectorAll('.ev--art img')).every(function(i){return i.complete && i.naturalWidth>0})"))
    day1 = tab.eval("Array.from(document.querySelectorAll('#day-2027-02-01 .ev__time')).map(function(t){return t.textContent})")
    check("day 1 opens with the 8 am room opening", day1[0] == "8:00 am", day1[:2])
    check("the after-party runs past midnight and sorts last", day1[-1] == "11:00 pm – 1:00 am", day1[-2:])
    check("both sets of parents on the card", tab.eval("document.querySelectorAll('.parents__side b').length") == 2)
    check("venue directions point at the hotel rooftop",
          "24.6263,73.7139" in (tab.eval("(document.querySelector('#venue-body a[href*=\"maps/dir\"]')||{}).href") or ""))
    check("the hotel can be called from the page",
          tab.eval("document.querySelectorAll('a[href^=\"tel:\"]').length") >= 4)
    check("stay cards render", tab.eval("document.querySelectorAll('#stay-grid .card').length") == 6)
    check("travel, weather and Udaipur cards render", tab.eval("document.querySelectorAll('#travel-grid .card').length") == 6)
    check("nothing tells guests what to wear",
          tab.eval("!document.getElementById('dress') && !document.querySelector('.ev__dress, a[href=\"#dress\"]') && !/what to wear/i.test(document.body.innerText)"))
    check("the questions render", tab.eval("document.querySelectorAll('#faq-list .qa').length") == tab.eval("W.content.faq.length") == 9)
    check("the help desk renders", tab.eval("document.querySelectorAll('#help-grid .helpc').length") == 4)
    tab.eval("var q=document.getElementById('faq-q'); q.value='parking'; q.dispatchEvent(new Event('input'));")
    shown = tab.eval("Array.from(document.querySelectorAll('#faq-list .qa')).filter(function(d){return !d.hidden}).length")
    check("question search narrows the list", 0 < shown < 4, shown)
    tab.eval("var q=document.getElementById('faq-q'); q.value=''; q.dispatchEvent(new Event('input'));")

    # ── layout and typography ──
    off = tab.eval("""(function(){
      var h=document.querySelector('#programme .sec__head');
      var t=h.querySelector('h2').getBoundingClientRect();
      var p=h.querySelector('p').getBoundingClientRect();
      return {titleLeft: Math.round(t.left), paraLeft: Math.round(p.left),
              titleSize: parseFloat(getComputedStyle(h.querySelector('h2')).fontSize)};
    })()""")
    check("section head is asymmetric, not centred", off["paraLeft"] > off["titleLeft"] + 200, off)
    check("section titles are display-scale", off["titleSize"] >= 56, off["titleSize"])
    check("headings split into characters",
          tab.eval("document.querySelectorAll('[data-split=\"chars\"] .c-in').length") > 30)
    check("split headings keep an accessible label",
          tab.eval("document.querySelector('#programme [data-split=\"chars\"]').getAttribute('aria-label')")
          == "Two days, in order")
    check("split characters are hidden from assistive tech",
          tab.eval("Array.from(document.querySelectorAll('[data-split=\"chars\"] .c-word'))"
                   ".every(function(w){return w.getAttribute('aria-hidden')==='true'})"))
    check("script names are wiped, not split",
          tab.eval("document.querySelectorAll('.names__n .c-in, .names__n .w-in').length") == 0
          and tab.eval("document.querySelector('.names__n').getAttribute('data-reveal')") == "ink")
    # The wipe's own clip-path hides the names from IntersectionObserver; if
    # only the 2.6 s safety timer reveals them, a returning guest sees a blank card.
    # So the timer is dropped here, and the page's own copy from boot waited out.
    tab.wait_for("performance.now() > performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd + 2800", timeout=10)
    tab.eval("document.querySelector('.names').scrollIntoView({block:'center'})")
    inked = tab.eval("""new Promise(function(res){
      var ns=Array.from(document.querySelectorAll('.names__n'));
      ns.forEach(function(n){ n.style.transition='none'; n.classList.remove('is-revealed');
        void n.offsetWidth; n.style.transition=''; });
      var st=window.setTimeout;
      window.setTimeout=function(f, ms){ return ms===2600 ? 0 : st.apply(window, arguments); };
      W.motion.initReveal(document.querySelector('.names'));
      window.setTimeout=st;
      var t0=performance.now();
      (function poll(){
        if (ns.every(function(n){ return n.classList.contains('is-revealed'); })) return res(true);
        if (performance.now()-t0 > 5000) return res(false);
        st(poll, 100);
      })();
    })""", await_promise=True)
    check("the names are written on arrival, not after the safety timer", inked)
    alt = tab.eval("""(function(){var a=document.querySelectorAll('.ev--art');
      var x=Array.from(a).slice(0,2).map(function(e){return Math.round(e.querySelector('.ev__art').getBoundingClientRect().left)});
      return x;})()""")
    check("paintings alternate sides on a wide screen", alt[0] != alt[1], alt)
    check("grain overlay does not swallow clicks",
          tab.eval("getComputedStyle(document.body,'::after').pointerEvents") == "none")
    check("countdown ticking", tab.eval("Number(document.querySelector('.cd b').textContent) > 0"))
    check("rsvp form present", tab.eval("!!document.getElementById('rsvp-form')"))
    check("garland strands", tab.eval("document.querySelectorAll('#hero-garland .strand').length") >= 9)
    check("door carving drawn", tab.eval("document.querySelectorAll('#door-l svg').length") == 2)
    check("the wax seal is drawn in two halves", tab.eval("document.querySelectorAll('.seal__half svg').length") == 2)
    check("no door svg stretches",
          tab.eval("Array.from(document.querySelectorAll('#door-l svg,#door-r svg'))"
                   ".every(function(s){return s.getAttribute('preserveAspectRatio')"
                   "&&s.getAttribute('preserveAspectRatio').indexOf('meet')>-1})"))
    check("nothing guest-facing mentions vendor noise",
          not tab.eval("/legal cut-?off|sound OFF|D\u00e9cor team|negotiated rate|booking link|do not announce|quietly/i"
                       ".test(document.body.innerText)"),
          tab.eval("(document.body.innerText.match(/legal cut-?off|sound OFF|negotiated rate|booking link|do not announce|quietly/i)||[])[0]"))
    check("Kota, Indore and Neemuch are in the road directions",
          tab.eval("['Kota','Indore','Neemuch'].every(function(c)"
                   "{return document.body.innerText.indexOf(c)>-1})"))
    check("no Mehndi function in the programme",
          not tab.eval("/\\bMehndi\\b/i.test(document.getElementById('prog').innerText)"))
    tab.wait_for("Array.from(document.querySelectorAll('[data-reveal]'))"
                 ".every(function(e){return getComputedStyle(e).opacity !== '0'})")
    hidden = tab.eval(
        "Array.from(document.querySelectorAll('[data-reveal]'))"
        ".filter(function(e){return getComputedStyle(e).opacity==='0'})"
        ".map(function(e){return e.className||e.tagName}).slice(0,5)")
    check("no element left invisible", not hidden, hidden)

    # ── calendar ──
    ics = tab.eval("W.util.buildICS(W.invite.calendarEvents(),'x')")
    alarms = tab.eval("W.data.programme.filter(function(e){return e.alarm}).length")
    check("calendar has one entry per event", ics.count("BEGIN:VEVENT") == n_prog)
    check("key events carry a reminder", ics.count("BEGIN:VALARM") == alarms and alarms >= 8, (ics.count("BEGIN:VALARM"), alarms))
    check("the after-party ends at 1 am on 2 Feb in the calendar", "DTEND:20270202T010000" in ics)

    # ── Hindi ──
    tab.eval("W.i18n.set('hi')")
    time.sleep(0.8)
    hi = tab.eval("""(function(){
      var h=document.querySelector('#programme h2');
      var eb=getComputedStyle(document.querySelector('.eyebrow')).letterSpacing;
      return {lang: document.documentElement.lang, title: h.textContent,
              split: h.querySelectorAll('.c-in').length, eyebrow: eb,
              haldi: document.querySelector('#ev-haldi .ev__title').textContent,
              rsvp: document.querySelector('#rsvp-form .field span').textContent,
              names: document.querySelector('.names__n').textContent};
    })()""")
    check("Hindi switches the page language", hi["lang"] == "hi", hi)
    check("Hindi headings are whole, never split into letters", hi["split"] == 0 and "क्रम" in hi["title"], hi)
    check("Devanagari is never letter-spaced", hi["eyebrow"] in ("normal", "0px"), hi["eyebrow"])
    check("programme, card and form are in Hindi",
          hi["haldi"] == "हल्दी" and "नाम" in hi["rsvp"] and "वैभव" in hi["names"], hi)
    check("the footer names are in Hindi", tab.eval("document.querySelector('.foot__names').textContent") == "वैभव और महक")
    small = tab.eval("""(function(){
      var out=[], all=document.querySelectorAll('body *');
      for (var i=0;i<all.length;i++){ var e=all[i];
        if (e.closest('.gate') || e.closest('[hidden]') || e.tagName==='OPTION') continue;
        var t=''; for (var c=e.firstChild;c;c=c.nextSibling) if (c.nodeType===3) t+=c.textContent;
        if (!/[\\u0900-\\u097F]/.test(t)) continue;
        var r=e.getBoundingClientRect(); if (!r.width) continue;
        var fs=parseFloat(getComputedStyle(e).fontSize);
        if (fs < 14) out.push(fs + 'px ' + (e.className||e.tagName) + ': ' + t.trim().slice(0,24));
      }
      return out;
    })()""")
    check("no Hindi text is set below 14px", not small, small[:4])
    tab.eval("W.i18n.set('en')")
    time.sleep(0.6)
    check("switching back restores English", tab.eval("document.querySelector('#ev-haldi .ev__title').textContent") == "Haldi")

    errs = tab.console_errors()
    check("no console errors", len(errs) == 0, errs[:3])

    print("two cards")
    stale = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "build-sides.py"), "--check"],
                           capture_output=True, text=True)
    check("mahak.html is rebuilt from index.html", stale.returncode == 0, (stale.stdout + stale.stderr).strip())
    card_js = """(function(){
      var q=function(s){return document.querySelector(s)};
      return {side: W.side, first: q('.names .names__n').textContent, gate: q('.gate__names').textContent,
              parent: q('.parents__side span').textContent, mono: q('.nav__mono').textContent.trim(),
              ganesh: !!q('#ev-ganesh'), tel: !!q('#ev-tel'), sehra: !!q('#ev-sehra'),
              duties: !!q('#duties, .duties'),
              roles: document.querySelectorAll('#prog .ev__role').length,
              rsvp: q('#rsvp-form select[name=side]').value, title: document.title,
              og: (q('meta[property="og:image"]')||{}).content || '',
              ogt: (q('meta[property="og:title"]')||{}).content || ''};
    })()"""
    tab.goto(base() + "/index.html?open=1", settle=2.6)
    g = tab.eval(card_js)
    check("Vaibhav's family's card names him first and shows the sehra",
          g["side"] == "groom" and g["first"] == "Vaibhav" and g["parent"] == "Son of" and g["mono"] == "V & M"
          and g["sehra"] and not g["ganesh"] and not g["tel"], g)
    check("our family's part sits on its events, with no separate list, and replies default to the groom's side",
          not g["duties"] and g["roles"] >= 5 and g["rsvp"] == "Groom" and g["og"].endswith("/og.jpg"), g)
    tab.goto(base() + "/mahak.html?open=1", settle=2.6)
    b = tab.eval(card_js)
    check("Mahak's family's card names her first, everywhere",
          b["side"] == "bride" and b["first"] == "Mahak" and b["gate"] == "Mahak & Vaibhav" and b["parent"] == "Daughter of"
          and b["mono"] == "M & V" and b["title"].startswith("Mahak & Vaibhav") and b["ogt"].startswith("Mahak & Vaibhav"), b)
    check("it shows the Ganesh puja and tel, not the sehra, and has its own preview",
          b["ganesh"] and b["tel"] and not b["sehra"] and not b["duties"] and b["rsvp"] == "Bride"
          and b["og"].endswith("/og-mahak.jpg"), b)
    tab.eval("W.i18n.set('hi')")
    time.sleep(0.8)
    bh = tab.eval("({first: document.querySelector('.names .names__n').textContent, foot: document.querySelector('.foot__names').textContent, role: document.querySelector('#prog .ev__role b').textContent})")
    check("and in Hindi too", "महक" in bh["first"] and bh["foot"] == "महक और वैभव" and "परिवार" in bh["role"], bh)
    tab.eval("W.i18n.set('en')")
    tab.goto(base() + "/index.html?side=bride&open=1", settle=2.2)
    check("?side=bride shows Mahak's card on any address", tab.eval("W.side") == "bride"
          and tab.eval("document.querySelector('.names .names__n').textContent") == "Mahak")
    errs = tab.console_errors()
    check("the two cards have no console errors", len(errs) == 0, errs[:3])

    print("live day")
    tab.goto(base() + "/index.html?open=1&now=2027-02-01T20:10", settle=2.6)
    live = tab.eval("""(function(){var n=document.getElementById('now');
      return {hidden: n.hidden, text: n.innerText, cur: !!document.querySelector('#ev-sagaai.is-now')};})()""")
    check("the ribbon shows what is happening now", not live["hidden"] and "Sagaai" in live["text"], live)
    check("and what is next", "Sangeet" in live["text"], live)
    check("the current event is highlighted in the programme", live["cur"], live)
    tab.goto(base() + "/index.html?open=1&now=2026-12-01T10:00", settle=2.0)
    check("the ribbon stays hidden before the wedding", tab.eval("document.getElementById('now').hidden"))

    print("flight")
    tab.goto(base() + "/index.html?open=1", settle=2.4)
    tab.eval("document.getElementById('venue').scrollIntoView()")
    state = tab.wait_for("(function(){var c=document.getElementById('venue').className;"
                         "return /is-live|is-static/.test(c)?c:null})()", timeout=20)
    check("the flight starts, or falls back to the painting", bool(state), state)
    if state and "is-live" in state:
        film = tab.eval("(function(){var v=document.getElementById('fly-film');return {src:v.currentSrc,poster:v.poster}})()")
        check("a wide screen gets the wide film, with its first frame as the poster",
              film["src"].endswith("/assets/flight/flight-wide.mp4") and film["poster"].endswith("flight-wide-poster.jpg"), film)
        rolled = tab.wait_for("document.getElementById('fly-film').currentTime > 1", timeout=15)
        check("the film rolls by itself when it comes into view", bool(rolled))
        tab.wait_for("document.querySelectorAll('.fly__pin').length === 4", timeout=8)
        check("landmark pins are placed", tab.eval("document.querySelectorAll('.fly__pin').length") == 4)
        seek = """(function(t){var v=document.getElementById('fly-film');v.pause();
          return new Promise(function(r){v.addEventListener('seeked',function(){setTimeout(function(){r(true)},900)},{once:true});v.currentTime=t;});})(%s)"""
        # At the palace Lake Pichola's label used to sit in the caption, and
        # Fateh Sagar's hung half off the left edge.
        clash, cut, caps = [], [], []
        for t in (4.4, 8.6, 12.6, 18.5):
            tab.eval(seek % t, await_promise=True)
            r = tab.eval("""(function(){
              var c=document.querySelector('#fly-caps .fly__cap.is-on'), r=c?c.getBoundingClientRect():null;
              var nav=document.getElementById('nav').getBoundingClientRect().bottom, out={clash:[],cut:[],cap:c?c.getAttribute('data-leg'):null};
              Array.from(document.querySelectorAll('.fly__pin:not(.is-off) span')).forEach(function(s){
                var b=s.getBoundingClientRect();
                if(!r || (b.right>r.left && b.left<r.right && b.bottom>r.top && b.top<r.bottom)) out.clash.push(s.textContent);
                if(b.left<0 || b.right>innerWidth || b.top<nav) out.cut.push(s.textContent);
              });
              return out;})()""")
            clash += [f"{l} at {t}s" for l in r["clash"]]
            cut += [f"{l} at {t}s" for l in r["cut"]]
            caps.append(r["cap"])
        check("each landmark's caption comes up with it", caps == ["1", "2", "3", "4"], caps)
        check("no landmark label sits on the caption", not clash, clash)
        check("no landmark label is cut off by an edge or the nav", not cut, cut)
        home = tab.eval("""(function(){var p=document.querySelector('.fly__pin--home');var b=p.getBoundingClientRect(),s=document.getElementById('fly').getBoundingClientRect();
          return {on:!p.classList.contains('is-off'), x:(b.left-s.left)/s.width, y:(b.top-s.top)/s.height}})()""")
        check("over the hotel, its pin is lit near the middle of the frame",
              home["on"] and abs(home["x"] - 0.5) < 0.12 and abs(home["y"] - 0.5) < 0.15, home)
        tab.eval("(function(){var v=document.getElementById('fly-film');v.currentTime=v.duration-0.3;v.play();})()")
        landed = tab.wait_for("/is-landed/.test(document.getElementById('venue').className)", timeout=6)
        again = tab.eval("(function(){var b=document.getElementById('fly-again');return b.hidden?null:b.textContent})()")
        check("the flight lands on the painted hotel and offers to fly again", bool(landed) and again == "Fly again", again)
        tab.eval("document.getElementById('fly-again').click()")
        time.sleep(1.2)
        re = tab.eval("(function(){var v=document.getElementById('fly-film');return {t:v.currentTime,landed:/is-landed/.test(document.getElementById('venue').className),paused:v.paused}})()")
        check("flying again starts from the old city", re["t"] < 3 and not re["landed"] and not re["paused"], re)
        tab.eval("window.scrollTo(0, 0)")
        time.sleep(0.8)
        check("the film pauses when scrolled away", tab.eval("document.getElementById('fly-film').paused"))
        tab.eval("W.i18n.set('hi')")
        time.sleep(0.5)
        hi = tab.eval("[document.querySelector('.fly__pin--home span').textContent, document.getElementById('fly-again').textContent]")
        check("the labels and button switch to Hindi", hi == ["होटल खुमानी", "फिर से उड़ान"], hi)
        tab.eval("W.i18n.set('en')")
        tab.call("Emulation.setDeviceMetricsOverride", width=414, height=896, deviceScaleFactor=1, mobile=False)
        tab.goto(base() + "/index.html?open=1", settle=2.0)
        tab.eval("document.getElementById('venue').scrollIntoView()")
        tall = tab.wait_for("(function(){var s=document.getElementById('fly-film').currentSrc;return s||null})()", timeout=10)
        check("a phone gets the tall film", bool(tall) and tall.endswith("/assets/flight/flight-tall.mp4"), tall)
        tab.call("Emulation.setDeviceMetricsOverride", width=1440, height=900, deviceScaleFactor=1, mobile=False)
    errs = tab.console_errors()
    check("the flight has no console errors", len(errs) == 0, errs[:3])

    print("gate")
    tab.goto(base() + "/index.html", settle=0.8)
    tab.eval("sessionStorage.clear()")
    tab.goto(base() + "/index.html", settle=2.4)
    check("gate is showing", tab.eval("!document.getElementById('gate').classList.contains('is-done')"))
    ink = "Array.from(document.querySelectorAll('.names__n')).map(function(n){return getComputedStyle(n).clipPath})"
    # Long enough after the reveal for an unheld 1.6 s wipe to have finished.
    tab.wait_for("document.querySelectorAll('.names__n.is-revealed').length === 2", timeout=6)
    time.sleep(1.8)
    check("the names wait behind the doors, even once revealed",
          tab.eval("document.querySelectorAll('.names__n.is-revealed').length") == 2
          and all("102%" in c for c in tab.eval(ink)), tab.eval(ink))
    corner = tab.eval("""(function(){var b=document.querySelector('.gate__lang').getBoundingClientRect();
      return {top: Math.round(b.top), right: Math.round(innerWidth - b.right), w: Math.round(b.width)};})()""")
    check("the language button sits in the gate's top-right corner",
          corner["w"] > 0 and corner["top"] < 60 and corner["right"] < 60, corner)
    tab.eval("document.querySelector('.gate__lang').click()")
    time.sleep(0.6)
    g = tab.eval("""(function(){var n=document.querySelector('.gate__names');
      return {names: n.textContent, ff: getComputedStyle(n).fontFamily,
              open: document.getElementById('gate').classList.contains('is-open')};})()""")
    check("the gate names switch to Hindi, and the gate stays shut",
          g["names"] == "वैभव और महक" and "Tiro" in g["ff"] and not g["open"], g)
    tab.eval("document.querySelector('.gate__lang').click()")
    time.sleep(0.6)
    check("and back to English", tab.eval("document.querySelector('.gate__names').textContent") == "Vaibhav & Mahak")
    tab.eval("document.getElementById('gate-ring').click()")
    time.sleep(0.3)
    check("the seal breaks on tap", tab.eval("document.getElementById('gate-ring').classList.contains('is-broken')"))
    time.sleep(0.6)
    check("doors swing after the seal", tab.eval("document.getElementById('gate').classList.contains('is-open')"))
    time.sleep(2.4)
    check("gate clears away", tab.eval("document.getElementById('gate').classList.contains('is-done')"))
    check("body unlocked", tab.eval("!document.body.classList.contains('is-locked')"))
    check("the names are written as the doors part", not any("102%" in c for c in tab.eval(ink)), tab.eval(ink))

    print("portal lookup")
    tab.events.clear()
    tab.goto(base() + "/guest.html", settle=2.6)
    tab.eval("localStorage.removeItem('vm-guest-phone')")
    tab.goto(base() + "/guest.html", settle=2.6)
    check("lookup visible", tab.eval("!document.getElementById('lookup').classList.contains('is-gone')"))

    # a number that isn't on the list
    tab.eval("""(function(){
      document.getElementById('phone').value='9999999999';
      document.getElementById('lookup-form').dispatchEvent(new Event('submit',{cancelable:true}));
    })()""")
    time.sleep(1.4)
    check("unknown number is refused", "could not find" in (tab.eval(
        "document.getElementById('lookup-err').textContent") or "").lower())

    # a real one
    tab.eval("""(function(){
      document.getElementById('phone').value='98765 00001';
      document.getElementById('lookup-form').dispatchEvent(new Event('submit',{cancelable:true}));
    })()""")
    time.sleep(1.8)
    check("portal opens", tab.eval("document.getElementById('me').classList.contains('is-live')"))
    check("guest name shown", tab.eval("document.getElementById('me-name').textContent") == "Ved Prakash Bhatnagar")
    check("key cards render", tab.eval("document.querySelectorAll('#me-keys .key').length") >= 2)
    check("my functions render", tab.eval("document.querySelectorAll('#me-fns .myfn__row').length") == 4)
    check("guide sections render", tab.eval("document.querySelectorAll('#me-guide .gitem').length") == tab.eval("W.data.guide.length") == 4)
    check("albums render", tab.eval("document.querySelectorAll('#me-albums .album').length") == 5)
    check("rsvp editor renders", tab.eval("document.querySelectorAll('#me-rsvp .seg button').length") == 3)
    check("number remembered", tab.eval("localStorage.getItem('vm-guest-phone')") == "9876500001")

    # A reception-only guest should see exactly one row and nothing greyed out,
    # because listing the rest only tells them what they are missing.
    tab.goto(base() + "/guest.html?t=2#p=9876500015", settle=3.4)
    check("reception-only guest sees only their own function",
          tab.eval("document.querySelectorAll('#me-fns .myfn__row').length") == 1,
          tab.eval("document.querySelectorAll('#me-fns .myfn__row').length"))
    check("uninvited functions are absent, not greyed",
          tab.eval("document.querySelectorAll('#me-fns .myfn__row.is-skip').length") == 0)
    check("the one row shown is the reception",
          "Reception" in (tab.eval("document.getElementById('me-fns').innerText") or ""))

    # guest updates their own reply
    tab.eval("""(function(){
      var b=document.querySelectorAll('#me-rsvp .seg button')[2]; b.click();
      document.querySelector('#me-rsvp form').dispatchEvent(new Event('submit',{cancelable:true}));
    })()""")
    time.sleep(1.2)
    check("rsvp save confirms", tab.eval("!!document.querySelector('#me-rsvp .done')"))

    errs = tab.console_errors()
    check("portal has no console errors", len(errs) == 0, errs[:3])

    print("planner")
    tab.events.clear()
    tab.goto(base() + "/planner.html", settle=3.0)
    check("planner sidebar renders", tab.eval("document.querySelectorAll('.side__nav a').length") > 5,
          tab.eval("document.querySelectorAll('.side__nav a').length"))
    check("planner view renders",
          (tab.eval("var m=document.getElementById('main'); m?m.childElementCount:0") or 0) > 0)
    errs = tab.console_errors()
    check("planner has no console errors", len(errs) == 0, errs[:3])

    print("narrow screens")
    # Multi-column grids are the usual cause of a page that scrolls sideways on a
    # phone, so both grid-heavy pages get measured at 360px. Decorative art is
    # deliberately oversized and clipped, so it is excluded by name.
    for page in ("/index.html?open=1", "/guest.html#p=9876500007"):
        tab.call("Emulation.setDeviceMetricsOverride", width=360, height=780,
                 deviceScaleFactor=1, mobile=True)
        tab.goto(base() + page, settle=2.6)
        tab.eval("""(function(){var h=document.documentElement.scrollHeight,y=0;
          var id=setInterval(function(){y+=500;window.scrollTo(0,y);
            if(y>h){clearInterval(id);window.scrollTo(0,0);}},25);})()""")
        time.sleep(2.0)
        res = tab.eval("""(function(){
          var vw = window.innerWidth, over = [];
          var skip = /mandala|feather|petals|garland|strand|hero__|foot__|gate|jaali|door/;
          document.querySelectorAll('body *').forEach(function(e){
            // getAttribute, not .className — on SVG nodes className is an
            // SVGAnimatedString and stringifies to [object SVGAnimatedString].
            var c = e.getAttribute('class') || '';
            if (skip.test(c) || e.closest('[aria-hidden="true"]')) return;
            var r = e.getBoundingClientRect();
            if (r.width > 1 && r.right > vw + 1.5) {
              over.push((c.split(' ')[0] || e.tagName) + '@' + Math.round(r.right));
            }
          });
          return {doc: document.documentElement.scrollWidth, vw: vw, over: over.slice(0, 6)};
        })()""")
        name = page.split("/")[1].split("?")[0].split("#")[0]
        check(f"{name} does not scroll sideways at 360px",
              res["doc"] <= res["vw"] + 1, res)
        check(f"{name} keeps its content inside the viewport at 360px",
              not res["over"], res["over"])
    tab.call("Emulation.clearDeviceMetricsOverride")

    print()
    if fails:
        print(f"{len(fails)} FAILED: " + ", ".join(fails))
        return 1
    print("all checks passed")
    return 0


def main():
    task = sys.argv[1] if len(sys.argv) > 1 else "check"
    srv = serve()
    chrome = start_chrome()
    code = 0
    try:
        tab = new_tab()
        tab.call("Page.enable")
        tab.call("Runtime.enable")
        runner = {"shots": task_shots, "zoom": task_zoom}.get(task, task_check)
        code = runner(tab)
    finally:
        for p in (chrome, srv):
            try:
                p.terminate()
            except Exception:
                pass
    sys.exit(code or 0)


if __name__ == "__main__":
    main()
