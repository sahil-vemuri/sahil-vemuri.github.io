/* ============================================================
   Sahil Vemuri — Portfolio (Jazz Jackrabbit 2 menu style)
   - Builds the cartoon world (clouds, stars, gems).
   - Builds the wavy menu; letters ripple in a traveling wave.
   - Mouse + keyboard navigation, with retro blip sounds.
   - Selecting a menu item drops you into a section screen.
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

    var menuEl    = document.getElementById("menu");
    var screenEl  = document.getElementById("screen");
    var backBtn   = document.getElementById("backBtn");
    var flashEl   = document.getElementById("flash");
    var soundBtn  = document.getElementById("soundToggle");

    var items = [];          // the .menu-item buttons
    var selected = 0;        // index of highlighted menu item
    var current = null;      // null = menu, else section key
    var busy = false;

    function rand(a, b) { return Math.random() * (b - a) + a; }
    function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

    /* ---------- retro blip sound (Web Audio, no assets) ---------- */
    var audioCtx = null;
    var muted = false;
    function ensureAudio() {
        if (!audioCtx) {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (AC) audioCtx = new AC();
        }
        if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
        return audioCtx;
    }
    function blip(freq, dur, type, vol) {
        if (muted) return;
        var ctx = ensureAudio();
        if (!ctx) return;
        var t = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = type || "square";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.08));
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + (dur || 0.08) + 0.02);
    }
    function soundMove()   { blip(620, 0.07, "square", 0.09); }
    function soundSelect()  { blip(720, 0.09, "square", 0.12); setTimeout(function(){ blip(1040, 0.12, "square", 0.11); }, 70); }
    function soundBack()    { blip(500, 0.09, "square", 0.1);  setTimeout(function(){ blip(320, 0.12, "square", 0.1); }, 70); }

    /* ---------- background world ---------- */
    function buildStars() {
        var holder = document.querySelector(".stars");
        var frag = document.createDocumentFragment();
        for (var i = 0; i < 70; i++) {
            var s = el("div", "star");
            var sz = rand(1.2, 3);
            s.style.width = sz + "px";
            s.style.height = sz + "px";
            s.style.left = rand(0, 100) + "%";
            s.style.top = rand(0, 46) + "%";       // upper sky only
            s.style.setProperty("--tw", rand(2.6, 6) + "s");
            s.style.animationDelay = (-rand(0, 6)) + "s";
            frag.appendChild(s);
        }
        holder.appendChild(frag);
    }

    function buildClouds() {
        var holder = document.querySelector(".clouds");
        for (var i = 0; i < 6; i++) {
            var c = el("div", "cloud");
            var w = rand(90, 190);
            c.style.width = w + "px";
            c.style.height = (w * 0.34) + "px";
            c.style.top = rand(4, 52) + "vh";
            c.style.opacity = rand(0.75, 1);
            var dur = rand(48, 90);
            c.style.animationDuration = dur + "s";
            c.style.animationDelay = (-rand(0, dur)) + "s";
            holder.appendChild(c);
        }
    }

    function buildGems() {
        if (prefersReduced) return;
        var holder = document.querySelector(".gems");
        var colors = ["#46e0ff", "#ff5db0", "#7dff9b", "#ffd23f", "#b57bff"];
        for (var i = 0; i < 9; i++) {
            var g = el("div", "gem");
            g.style.left = rand(4, 96) + "%";
            g.style.setProperty("--gc", colors[i % colors.length]);
            var dur = rand(11, 20);
            g.style.setProperty("--gd", dur + "s");
            g.style.animationDelay = (-rand(0, dur)) + "s";
            var sz = rand(12, 22);
            g.style.width = sz + "px";
            g.style.height = sz + "px";
            holder.appendChild(g);
        }
    }

    /* ---------- wavy menu ---------- */
    function buildMenu() {
        MENU.forEach(function (m, idx) {
            var btn = el("button", "menu-item");
            btn.type = "button";
            btn.setAttribute("data-key", m.key);
            btn.setAttribute("aria-label", m.label);

            var ci = 0;
            m.label.split("").forEach(function (ch) {
                var span = el("span", "char" + (ch === " " ? " space" : ""));
                span.textContent = ch === " " ? " " : ch;
                span.style.setProperty("--i", ci++);
                btn.appendChild(span);
            });

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
        void flashEl.offsetWidth;   // restart animation
        flashEl.classList.add("go");
    }

    function showSection(key) {
        document.querySelectorAll(".section").forEach(function (s) {
            s.classList.toggle("active", s.getAttribute("data-key") === key);
        });
    }

    function open(key) {
        if (busy || current === key) return;
        busy = true;
        ensureAudio();
        soundSelect();
        flash();
        var delay = prefersReduced ? 0 : 130;
        window.setTimeout(function () {
            showSection(key);
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
        soundBack();
        flash();
        var delay = prefersReduced ? 0 : 130;
        window.setTimeout(function () {
            document.body.classList.remove("in-section");
            current = null;
            busy = false;
        }, delay);
    }

    /* ---------- keyboard ---------- */
    function onKey(e) {
        if (current === null) {
            if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                e.preventDefault(); setSelected(selected + 1); soundMove();
            } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                e.preventDefault(); setSelected(selected - 1); soundMove();
            } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault(); open(MENU[selected].key);
            }
        } else {
            if (e.key === "Escape" || e.key === "Backspace") {
                e.preventDefault(); back();
            }
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
        buildStars();
        buildClouds();
        buildGems();
        buildMenu();

        backBtn.addEventListener("click", back);
        soundBtn.addEventListener("click", toggleSound);
        window.addEventListener("keydown", onKey);
        // Unlock audio on first pointer interaction (browser autoplay policy).
        window.addEventListener("pointerdown", ensureAudio, { once: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
