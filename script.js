/* ============================================================
   Sahil Vemuri — Portfolio (Jazz Jackrabbit 2 main-menu style)
   - Builds the tiled purple logo wallpaper.
   - Cream menu; the selected item's letters dance (rainbow + wobble).
   - Rainbow location label bottom-right tracks the current screen.
   - Mouse + keyboard navigation with retro blip sounds.
   ============================================================ */
(function () {
    "use strict";

    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var MENU = [
        { key: "blogs",    label: "Blogs" },
        { key: "projects", label: "Projects" },
        { key: "about",    label: "About" },
        { key: "contact",  label: "Contact Me" }
    ];

    var menuEl   = document.getElementById("menu");
    var screenEl = document.getElementById("screen");
    var backBtn  = document.getElementById("backBtn");
    var flashEl  = document.getElementById("flash");
    var soundBtn = document.getElementById("soundToggle");
    var locEl    = document.getElementById("location");
    var wallEl   = document.getElementById("wallpaper");

    var items = [];
    var selected = 0;
    var current = null;     // null = menu, else section key
    var busy = false;

    function rand(a, b) { return Math.random() * (b - a) + a; }
    function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

    /* Split text into per-letter spans (for the dancing effect). */
    function letterize(host, text, cls) {
        host.textContent = "";
        var idx = 0;
        text.split("").forEach(function (ch) {
            var span = el("span", cls + (ch === " " ? " space" : ""));
            span.textContent = ch === " " ? " " : ch;
            span.style.setProperty("--i", idx++);
            host.appendChild(span);
        });
    }

    /* ---------- retro blip sound (Web Audio, no assets) ---------- */
    var audioCtx = null, muted = false;
    function ensureAudio() {
        if (!audioCtx) {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (AC) audioCtx = new AC();
        }
        if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
        return audioCtx;
    }
    function blip(freq, dur, vol) {
        if (muted) return;
        var ctx = ensureAudio(); if (!ctx) return;
        var t = ctx.currentTime;
        var osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(vol || 0.11, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.08));
        osc.connect(gain).connect(ctx.destination);
        osc.start(t); osc.stop(t + (dur || 0.08) + 0.02);
    }
    function soundMove()   { blip(620, 0.07, 0.09); }
    function soundSelect() { blip(720, 0.09, 0.12); setTimeout(function(){ blip(1040, 0.12, 0.11); }, 70); }
    function soundBack()   { blip(500, 0.09, 0.10); setTimeout(function(){ blip(320, 0.12, 0.10); }, 70); }

    /* ---------- tiled logo wallpaper ---------- */
    function buildWallpaper() {
        var word = "Sahil Vemuri v2   ";
        var line = "";
        for (var k = 0; k < 10; k++) line += word;
        var rows = 26;
        var frag = document.createDocumentFragment();
        for (var i = 0; i < rows; i++) {
            var r = el("div", "wp-row");
            r.textContent = line;
            frag.appendChild(r);
        }
        wallEl.appendChild(frag);
    }

    /* ---------- location label (bottom-right, always dancing) ---------- */
    function setLocation(text) { letterize(locEl, text, "dchar"); }

    /* ---------- wavy menu ---------- */
    function buildMenu() {
        MENU.forEach(function (m, idx) {
            var btn = el("button", "menu-item");
            btn.type = "button";
            btn.setAttribute("data-key", m.key);
            btn.setAttribute("aria-label", m.label);
            letterize(btn, m.label, "char");

            btn.addEventListener("mouseenter", function () {
                if (current !== null) return;
                if (selected !== idx) { setSelected(idx); soundMove(); }
            });
            btn.addEventListener("click", function () { open(m.key); });

            menuEl.appendChild(btn);
            items.push(btn);
        });
        setSelected(0);
    }

    function setSelected(idx) {
        selected = (idx + items.length) % items.length;
        items.forEach(function (b, i) { b.classList.toggle("selected", i === selected); });
    }

    /* ---------- screen transitions ---------- */
    function flash() {
        if (prefersReduced) return;
        flashEl.classList.remove("go");
        void flashEl.offsetWidth;
        flashEl.classList.add("go");
    }
    function showSection(key) {
        document.querySelectorAll(".section").forEach(function (s) {
            s.classList.toggle("active", s.getAttribute("data-key") === key);
        });
    }
    function labelFor(key) {
        for (var i = 0; i < MENU.length; i++) if (MENU[i].key === key) return MENU[i].label;
        return "Main Menu";
    }

    function open(key) {
        if (busy || current === key) return;
        busy = true;
        ensureAudio(); soundSelect(); flash();
        var delay = prefersReduced ? 0 : 120;
        window.setTimeout(function () {
            showSection(key);
            setLocation(labelFor(key));
            document.body.classList.add("in-section");
            current = key;
            var inner = screenEl.querySelector(".panel-inner");
            if (inner) inner.scrollTop = 0;
            backBtn.focus({ preventScroll: true });
            busy = false;
        }, delay);
    }

    function back() {
        if (busy || current === null) return;
        busy = true;
        soundBack(); flash();
        var delay = prefersReduced ? 0 : 120;
        window.setTimeout(function () {
            document.body.classList.remove("in-section");
            setLocation("Main Menu");
            current = null;
            busy = false;
        }, delay);
    }

    /* ---------- keyboard ---------- */
    function onKey(e) {
        if (current === null) {
            if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); setSelected(selected + 1); soundMove(); }
            else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); setSelected(selected - 1); soundMove(); }
            else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(MENU[selected].key); }
        } else {
            if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); back(); }
        }
    }

    /* ---------- sound toggle ---------- */
    function toggleSound() {
        muted = !muted;
        soundBtn.classList.toggle("muted", muted);
        if (!muted) { ensureAudio(); soundMove(); }
    }

    /* ---------- init ---------- */
    function init() {
        buildWallpaper();
        buildMenu();
        setLocation("Main Menu");

        backBtn.addEventListener("click", back);
        soundBtn.addEventListener("click", toggleSound);
        window.addEventListener("keydown", onKey);
        window.addEventListener("pointerdown", ensureAudio, { once: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
