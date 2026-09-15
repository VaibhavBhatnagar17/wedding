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
    args = [CHROME, "--headless=new", f"--remote-debugging-port={PORT}",
            "--disable-gpu", "--hide-scrollbars", "--no-first-run",
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
    p = subprocess.Popen([sys.executable, "-m", "http.server", str(HTTP_PORT)],
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

    def shot(name, url, w=1440, h=900, full=True, settle=3.0, before=None):
        tab.call("Emulation.setDeviceMetricsOverride", width=w, height=h,
                 deviceScaleFactor=1, mobile=False)
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
    shot("01-gate", "/index.html", full=False)
    shot("02-hero", "/index.html?open=1", h=950, full=False)
    shot("03-invite-full", "/index.html?open=1", h=900)
    shot("04-portal-lookup", "/guest.html", full=False)
    shot("05-portal-me", "/guest.html#p=9876500007")
    shot("06-planner", "/planner.html", h=1000)
    # the doors mid-swing
    shot("07-gate-opening", "/index.html", full=False, settle=2.6,
         before="document.getElementById('gate-ring').click()")
    shot("08-portal-me-top", "/guest.html#p=9876500007", h=1000, full=False, settle=3.4)

    print("mobile")
    shot("20-m-gate", "/index.html", w=414, h=896, full=False)
    shot("21-m-hero", "/index.html?open=1", w=414, h=896, full=False)
    shot("22-m-invite", "/index.html?open=1", w=414, h=896)
    shot("23-m-portal", "/guest.html#p=9876500007", w=414, h=896)
    shot("24-m-lookup", "/guest.html", w=414, h=896, full=False)


def task_check(tab):
    fails = []

    def check(label, cond, detail=""):
        print(("  PASS  " if cond else "  FAIL  ") + label + ("" if cond else "  " + str(detail)))
        if not cond:
            fails.append(label)

    print("invitation")
    tab.call("Runtime.enable")
    tab.goto(base() + "/index.html?open=1", settle=3.2)
    tab.eval("window.scrollTo(0,document.body.scrollHeight);")
    time.sleep(1.2)
    tab.eval("window.scrollTo(0,0);")
    time.sleep(0.6)

    check("function cards render", tab.eval("document.querySelectorAll('.fn').length") == 5,
          tab.eval("document.querySelectorAll('.fn').length"))
    check("timeline days render", tab.eval("document.querySelectorAll('.day').length") >= 2)
    check("timeline rows render", tab.eval("document.querySelectorAll('.tl li').length") > 20)
    check("travel cards render", tab.eval("document.querySelectorAll('#travel-grid .info').length") == 6)
    check("countdown ticking", tab.eval("Number(document.querySelector('.cd b').textContent) > 0"))
    check("rsvp form present", tab.eval("!!document.getElementById('rsvp-form')"))
    check("garland strands", tab.eval("document.querySelectorAll('#hero-garland .strand').length") >= 9)
    check("door svg drawn", tab.eval("document.querySelectorAll('#door-l svg').length") == 1)
    # The reveal safety net runs from DOMContentLoaded, so poll rather than
    # guess at a sleep: the guarantee is that nothing stays invisible.
    tab.wait_for("document.querySelectorAll('[data-reveal]').length > 0 && "
                 "Array.from(document.querySelectorAll('[data-reveal]'))"
                 ".every(function(e){return getComputedStyle(e).opacity !== '0'})")
    hidden = tab.eval(
        "Array.from(document.querySelectorAll('[data-reveal]'))"
        ".filter(function(e){return getComputedStyle(e).opacity==='0'})"
        ".map(function(e){return e.className||e.tagName}).slice(0,5)")
    check("no element left invisible", not hidden, hidden)

    errs = tab.console_errors()
    check("no console errors", len(errs) == 0, errs[:3])

    print("gate")
    tab.goto(base() + "/index.html", settle=2.4)
    check("gate is showing", tab.eval("!document.getElementById('gate').classList.contains('is-done')"))
    tab.eval("document.getElementById('gate-ring').click()")
    time.sleep(0.4)
    check("doors swing on tap", tab.eval("document.getElementById('gate').classList.contains('is-open')"))
    time.sleep(2.4)
    check("gate clears away", tab.eval("document.getElementById('gate').classList.contains('is-done')"))
    check("body unlocked", tab.eval("!document.body.classList.contains('is-locked')"))

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
    check("guest name shown", tab.eval("document.getElementById('me-name').textContent") == "Rajesh Bhatnagar")
    check("key cards render", tab.eval("document.querySelectorAll('#me-keys .key').length") >= 2)
    check("my functions render", tab.eval("document.querySelectorAll('#me-fns .myfn__row').length") == 5)
    check("guide sections render", tab.eval("document.querySelectorAll('#me-guide .gitem').length") == 4)
    check("albums render", tab.eval("document.querySelectorAll('#me-albums .album').length") == 4)
    check("rsvp editor renders", tab.eval("document.querySelectorAll('#me-rsvp .seg button').length") == 3)
    check("number remembered", tab.eval("localStorage.getItem('vm-guest-phone')") == "9876500001")

    # a reception-only guest should see faded rows
    tab.goto(base() + "/guest.html?t=2#p=9876500015", settle=3.4)
    check("reception-only guest sees fewer functions",
          tab.eval("document.querySelectorAll('#me-fns .myfn__row.is-skip').length") == 4,
          tab.eval("document.querySelectorAll('#me-fns .myfn__row.is-skip').length"))

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
        code = task_shots(tab) if task == "shots" else task_check(tab)
    finally:
        for p in (chrome, srv):
            try:
                p.terminate()
            except Exception:
                pass
    sys.exit(code or 0)


if __name__ == "__main__":
    main()
