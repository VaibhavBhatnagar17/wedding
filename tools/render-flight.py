#!/usr/bin/env python3
"""Renders the drone flight over Udaipur into the videos the invitation plays.

Opens tools/flight-render.html in Chrome, steps the camera one frame at a
time, waits until every satellite and terrain tile has arrived, screenshots
the frame, then grades and encodes the frames with ffmpeg. Because every
frame is complete before it is captured, the film never shows the half-loaded
map a live 3D map does on a slow connection.

    python3.11 -m pip install imageio-ffmpeg     # once, for ffmpeg
    python3 tools/render-flight.py               # both shapes, ~20 min
    python3 tools/render-flight.py --shape wide --fps 6    # quick draft

Writes assets/flight/flight-{wide,tall}.mp4, a poster (the first frame) for
each, and assets/flight/flight.json with the caption and landmark position
for every frame, so the page can lay its own bilingual labels over the film.
"""

import argparse
import base64
import json
import os
import shutil
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cdp  # noqa: E402

OUT = os.path.join(cdp.ROOT, "assets", "flight")
FRAMES = "/tmp/flight-frames"
# How much larger than the film the canvas is; the edges are cropped away.
OVERSCAN = (1.12, 1.28)
SHAPES = {
    # film size as rendered, encoded size
    "wide": ((1920, 1080), (1600, 900)),
    "tall": ((900, 1600), (720, 1280)),
}
# Satellite detail is expensive to encode; this keeps each film to a few MB.
RATE = {"wide": "2.6M", "tall": "1.9M"}
# Warm the satellite colours towards the page's dusk palette and darken the
# corners, so the film sits in the maroon section rather than on top of it.
GRADE = ("eq=contrast=1.06:saturation=1.12:gamma=1.08:brightness=0.015,"
         "colorbalance=rs=0.05:gs=0.01:bs=-0.05:rm=0.03:bm=-0.03:rh=0.03:bh=-0.02,"
         "vignette=angle=PI/7")


def ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("ffmpeg not found: python3.11 -m pip install imageio-ffmpeg")


def start_chrome():
    # A real GPU, unlike the test runs: SwiftShader takes seconds per frame.
    args = [cdp.CHROME, "--headless=new", f"--remote-debugging-port={cdp.PORT}",
            "--use-angle=metal", "--ignore-gpu-blocklist", "--enable-gpu-rasterization",
            "--hide-scrollbars", "--no-first-run", "--user-data-dir=/tmp/flight-profile"]
    p = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(60):
        try:
            cdp.urllib.request.urlopen(f"http://127.0.0.1:{cdp.PORT}/json/version", timeout=1)
            return p
        except Exception:
            time.sleep(0.4)
    raise RuntimeError("Chrome did not start")


def render(tab, shape, fps, limit):
    (w, h), _ = SHAPES[shape]
    W, H = round(w * OVERSCAN[0] / 2) * 2, round(h * OVERSCAN[1] / 2) * 2
    clip = {"x": (W - w) // 2, "y": (H - h) // 2, "width": w, "height": h, "scale": 1}
    tab.call("Emulation.setDeviceMetricsOverride", width=W, height=H, deviceScaleFactor=1, mobile=False)
    look = 'portrait' if shape == 'tall' else 'landscape'
    tab.goto(f"{cdp.base()}/tools/flight-render.html?shape={look}&cw={w}&ch={h}", settle=1)
    tab.wait_for("window.ready && window.FILM", timeout=30)
    tab.eval("window.ready.then(() => true)", await_promise=True)
    seconds = tab.eval("FILM.seconds")
    landmarks = tab.eval("FILM.landmarks")
    n = int(round(seconds * fps)) + 1
    if limit:
        n = min(n, limit)
    d = os.path.join(FRAMES, shape)
    shutil.rmtree(d, ignore_errors=True)
    os.makedirs(d)
    meta = []
    t0 = time.time()
    for i in range(n):
        info = tab.eval(f"frame({i / fps})", await_promise=True)
        r = tab.call("Page.captureScreenshot", format="jpeg", quality=95, clip=clip)
        with open(os.path.join(d, f"{i:04d}.jpg"), "wb") as f:
            f.write(base64.b64decode(r["data"]))
        meta.append({"cap": info["cap"], "pins": info["pins"]})
        if i % 20 == 0 or i == n - 1:
            el = time.time() - t0
            print(f"  {shape} {i + 1}/{n}  {el / (i + 1):.2f}s/frame  tiles {'ok' if info['loaded'] else 'MISSING'}", flush=True)
    return meta, seconds, landmarks


def encode(shape, fps):
    _, (w, h) = SHAPES[shape]
    ff = ffmpeg()
    src = os.path.join(FRAMES, shape, "%04d.jpg")
    vf = f"scale={w}:{h}:flags=lanczos,{GRADE}"
    mp4 = os.path.join(OUT, f"flight-{shape}.mp4")
    # A keyframe every two seconds keeps a replay quick; no audio track.
    subprocess.run([ff, "-y", "-loglevel", "error", "-framerate", str(fps), "-i", src, "-vf", vf + ",format=yuv420p",
                    "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-maxrate", RATE[shape], "-bufsize", RATE[shape],
                    "-g", str(fps * 2), "-profile:v", "high",
                    "-movflags", "+faststart", "-an", mp4], check=True)
    frames = sorted(os.listdir(os.path.join(FRAMES, shape)))
    subprocess.run([ff, "-y", "-loglevel", "error", "-i", os.path.join(FRAMES, shape, frames[0]),
                    "-vf", vf, "-q:v", "6", os.path.join(OUT, f"flight-{shape}-poster.jpg")], check=True)
    print(f"  {mp4}: {os.path.getsize(mp4) / 1e6:.1f} MB")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--shape", choices=list(SHAPES) + ["both"], default="both")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--limit", type=int, default=0, help="stop after this many frames (testing)")
    ap.add_argument("--encode-only", action="store_true")
    a = ap.parse_args()
    shapes = list(SHAPES) if a.shape == "both" else [a.shape]
    os.makedirs(OUT, exist_ok=True)
    meta_path = os.path.join(OUT, "flight.json")
    data = json.load(open(meta_path)) if os.path.exists(meta_path) else {}

    if not a.encode_only:
        server, chrome = cdp.serve(), start_chrome()
        try:
            tab = cdp.new_tab()
            for s in shapes:
                meta, seconds, landmarks = render(tab, s, a.fps, a.limit)
                data["fps"], data["seconds"], data["landmarks"] = a.fps, seconds, landmarks
                data[s] = {"caps": [m["cap"] for m in meta], "pins": [m["pins"] for m in meta]}
        finally:
            chrome.terminate()
            server.terminate()
        with open(meta_path, "w") as f:
            json.dump(data, f, separators=(",", ":"))

    for s in shapes:
        encode(s, data.get("fps", a.fps))


if __name__ == "__main__":
    main()
