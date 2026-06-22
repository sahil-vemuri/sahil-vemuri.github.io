/* ============================================================
   Sky Portfolio — scroll-driven navigation through the clouds.
   Desktop-focused.
   ============================================================ */
(function () {
    "use strict";

    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var ORDER = ["home", "about", "skills", "experience", "projects", "education"];

    var stage   = document.querySelector(".stage");
    var sky     = document.querySelector(".sky-clouds");
    var curtain = document.querySelector(".curtain");
    var puffsEl = curtain.querySelector(".puffs");
    var progress = document.querySelector(".progress");

    var index = 0;       // current section index in ORDER
    var busy = false;
    var lastNav = 0;

    function rand(a, b) { return Math.random() * (b - a) + a; }
    function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
    function viewEl(name) { return document.getElementById("view-" + name); }
    function activeView() { return viewEl(ORDER[index]); }

    /* ---------- photoreal cloud builder ----------
       A cloud is built from real fractal noise (feTurbulence), not a drawn
       shape: the noise becomes the cloud's density/texture, which is then
       masked into a soft cumulus silhouette and shaded top-to-bottom.
       This reads like an actual photographed cloud rather than an icon. */
    var SVGNS = "http://www.w3.org/2000/svg";

    // Blurred ellipses that define each cloud's overall cumulus silhouette.
    var SILHOUETTE = [
        [140, 150, 84, 58], [206, 130, 100, 74], [276, 150, 84, 58],
        [108, 164, 52, 40], [300, 162, 56, 42], [200, 180, 184, 46]
    ];

    function makeCloud(w, i) {
        var h = Math.round(w * (240 / 400));
        var seed = Math.floor(rand(0, 100));
        var bf1 = (0.0065 + rand(0, 0.004)).toFixed(4);   // horizontal noise scale
        var bf2 = (0.011 + rand(0, 0.006)).toFixed(4);    // vertical noise scale (stretched)

        var sil = SILHOUETTE.map(function (e) {
            return '<ellipse cx="' + e[0] + '" cy="' + e[1] + '" rx="' + e[2] + '" ry="' + e[3] + '"/>';
        }).join("");

        var svg =
            '<svg class="cloud-svg" viewBox="0 0 400 240" width="' + w + '" height="' + h + '" ' +
                'preserveAspectRatio="none" xmlns="' + SVGNS + '">' +
              '<defs>' +
                // top-lit vertical shading
                '<linearGradient id="g' + i + '" x1="0" y1="0" x2="0" y2="1">' +
                  '<stop offset="0" style="stop-color:var(--cl-hi)"/>' +
                  '<stop offset="0.42" style="stop-color:var(--cl-body)"/>' +
                  '<stop offset="1" style="stop-color:var(--cl-shade)"/>' +
                '</linearGradient>' +
                // the cloud's internal density/texture, from fractal noise
                '<filter id="tx' + i + '" x="0" y="0" width="100%" height="100%">' +
                  '<feTurbulence type="fractalNoise" baseFrequency="' + bf1 + ' ' + bf2 +
                    '" numOctaves="6" seed="' + seed + '" stitchTiles="stitch" result="t"/>' +
                  '<feComponentTransfer in="t">' +
                    '<feFuncR type="linear" slope="0" intercept="1"/>' +
                    '<feFuncG type="linear" slope="0" intercept="1"/>' +
                    '<feFuncB type="linear" slope="0" intercept="1"/>' +
                    '<feFuncA type="table" tableValues="0 0 0.15 0.45 0.75 0.95 1"/>' +
                  '</feComponentTransfer>' +
                '</filter>' +
                '<filter id="sb' + i + '"><feGaussianBlur stdDeviation="14"/></filter>' +
                '<mask id="sh' + i + '"><g fill="#fff" filter="url(#sb' + i + ')">' + sil + '</g></mask>' +
                '<mask id="tm' + i + '"><rect width="400" height="240" filter="url(#tx' + i + ')"/></mask>' +
              '</defs>' +
              '<g mask="url(#sh' + i + ')">' +
                '<rect width="400" height="240" fill="url(#g' + i + ')" mask="url(#tm' + i + ')"/>' +
              '</g>' +
            '</svg>';

        var holder = el("div");
        holder.innerHTML = svg;
        return holder.firstChild;
    }

    function buildSky() {
        var count = 6;
        for (var i = 0; i < count; i++) {
            var depth = i / (count - 1);                  // 0 = far, 1 = near
            var w = rand(260, 320) + depth * 320;         // near clouds are bigger
            var dur = rand(175, 225) - depth * 70;        // near clouds drift a touch faster
            var wrap = el("div", "drift");
            wrap.style.top = rand(-4, 70) + "vh";
            wrap.style.opacity = (0.55 + depth * 0.4).toFixed(2);
            wrap.style.animationDuration = dur + "s";
            wrap.style.animationDelay = (-rand(0, dur)) + "s";
            wrap.appendChild(makeCloud(w, i));
            sky.appendChild(wrap);
        }
    }

    function buildStars() {
        var holder = document.querySelector(".stars");
        var frag = document.createDocumentFragment();
        for (var i = 0; i < 130; i++) {
            var s = el("div", "star");
            var sz = rand(1.3, 3.4);
            s.style.width = sz + "px";
            s.style.height = sz + "px";
            s.style.left = rand(0, 100) + "%";
            s.style.top = rand(0, 90) + "%";
            s.style.setProperty("--tw", rand(2.6, 6) + "s");
            s.style.animationDelay = (-rand(0, 6)) + "s";
            frag.appendChild(s);
        }
        holder.appendChild(frag);
    }

    /* ---------- transition curtain puffs ---------- */
    function buildPuffs() {
        var cols = 5, rows = 3;
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var p = el("div", "puff-c");
                var size = rand(36, 56);
                p.style.width = size + "vw";
                p.style.height = size + "vw";
                p.style.left = (c / (cols - 1) * 100 - size / 2 + rand(-6, 6)) + "%";
                p.style.top = (r / (rows - 1) * 100 - size / 2 + rand(-6, 6)) + "%";
                p.style.setProperty("--pd", (rand(0, 0.2) + r * 0.02) + "s");
                puffsEl.appendChild(p);
            }
        }
    }

    /* ---------- progress dots ---------- */
    function buildDots() {
        ORDER.forEach(function (name, i) {
            var b = el("button");
            b.setAttribute("aria-label", name);
            b.title = name.charAt(0).toUpperCase() + name.slice(1);
            b.addEventListener("click", function () { goTo(i); });
            progress.appendChild(b);
        });
        updateDots();
    }
    function updateDots() {
        var dots = progress.children;
        for (var i = 0; i < dots.length; i++) dots[i].classList.toggle("current", i === index);
    }

    /* ---------- view swapping ---------- */
    function showView(i) {
        ORDER.forEach(function (name, n) {
            var v = viewEl(name);
            var on = (n === i);
            v.hidden = !on;
            v.classList.toggle("active", on);
            if (on) v.scrollTop = 0;
        });
        index = i;
        updateDots();
        stage.classList.toggle("moved", i > 0);
        disarm();
    }

    /* ---------- the cloud transition ----------
       Always plays (even under reduced motion) — it is the core idea of
       the site. Reduced motion just runs shorter/gentler via CSS. */
    function goTo(i) {
        if (busy || i === index || i < 0 || i >= ORDER.length) return;
        busy = true;
        lastNav = Date.now();

        var t = prefersReduced
            ? { swap: 360, open: 440, done: 980 }
            : { swap: 560, open: 640, done: 1480 };

        curtain.classList.remove("opening");
        curtain.classList.add("closing");

        window.setTimeout(function () { showView(i); }, t.swap);
        window.setTimeout(function () {
            curtain.classList.remove("closing");
            curtain.classList.add("opening");
        }, t.open);
        window.setTimeout(function () {
            curtain.classList.remove("opening");
            busy = false;
        }, t.done);
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    /* ---------- scroll-driven control ----------
       At a section boundary the first scroll only *arms* (with a gentle
       tug cue); a second, deliberate scroll is needed to cross over. */
    var armed = false, armedDir = 0, settled = false, settleTimer = null;

    function canScrollInside(dir) {
        var v = activeView();
        if (!v) return false;
        if (dir > 0) return v.scrollTop + v.clientHeight < v.scrollHeight - 2;
        return v.scrollTop > 2;
    }

    function disarm() {
        armed = false; settled = false; armedDir = 0;
        clearTimeout(settleTimer);
        stage.classList.remove("armed-down", "armed-up");
    }

    function scheduleSettle() {
        settled = false;
        clearTimeout(settleTimer);
        settleTimer = window.setTimeout(function () { settled = true; }, 170);
    }

    function arm(dir) {
        armed = true; armedDir = dir;
        stage.classList.remove("armed-down", "armed-up");
        stage.classList.add(dir > 0 ? "armed-down" : "armed-up");
        scheduleSettle();
    }

    function onWheel(e) {
        var dir = e.deltaY > 0 ? 1 : -1;
        if (busy) { e.preventDefault(); return; }
        if (canScrollInside(dir)) { if (armed) disarm(); return; } // scroll within section
        e.preventDefault();
        if (Math.abs(e.deltaY) < 4) return;

        if (!armed || armedDir !== dir) {   // first arrival at the edge → arm only
            arm(dir);
            return;
        }
        if (!settled) { scheduleSettle(); return; } // still the same scroll burst — wait
        // A fresh, deliberate push in the same direction → cross over.
        disarm();
        if (dir > 0) next(); else prev();
    }

    function onKey(e) {
        var down = ["ArrowDown", "PageDown", " ", "Spacebar"];
        var up = ["ArrowUp", "PageUp"];
        if (down.indexOf(e.key) !== -1) {
            if (canScrollInside(1)) return;
            e.preventDefault(); next();
        } else if (up.indexOf(e.key) !== -1) {
            if (canScrollInside(-1)) return;
            e.preventDefault(); prev();
        } else if (e.key === "Home") { e.preventDefault(); goTo(0); }
        else if (e.key === "End") { e.preventDefault(); goTo(ORDER.length - 1); }
    }

    /* ---------- touch (basic, in case it's opened on a tablet) ---------- */
    var touchY = null;
    function onTouchStart(e) { touchY = e.touches[0].clientY; }
    function onTouchEnd(e) {
        if (touchY === null) return;
        var dy = touchY - e.changedTouches[0].clientY;
        if (Math.abs(dy) > 50) {
            var dir = dy > 0 ? 1 : -1;
            if (!canScrollInside(dir)) { if (dir > 0) next(); else prev(); }
        }
        touchY = null;
    }

    /* ---------- day / night ---------- */
    function applyTheme(night) {
        document.body.classList.toggle("night", night);
        var icon = document.querySelector(".toggle-icon");
        if (icon) icon.textContent = night ? "🌙" : "☀️";
        try { localStorage.setItem("sky-theme", night ? "night" : "day"); } catch (e) {}
    }
    function initTheme() {
        var saved = null;
        try { saved = localStorage.getItem("sky-theme"); } catch (e) {}
        if (saved === null) saved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day";
        applyTheme(saved === "night");
    }

    /* ---------- init ---------- */
    function init() {
        buildSky();
        buildStars();
        buildPuffs();
        buildDots();
        initTheme();

        window.addEventListener("wheel", onWheel, { passive: false });
        window.addEventListener("keydown", onKey);
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchend", onTouchEnd, { passive: true });

        var toggle = document.querySelector(".theme-toggle");
        if (toggle) toggle.addEventListener("click", function () {
            applyTheme(!document.body.classList.contains("night"));
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
