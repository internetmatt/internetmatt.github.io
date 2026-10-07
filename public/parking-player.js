/**
 * @internetmatt/led-surface — static / edge LED player (IIFE).
 * Canonical for Sites parking + :4715 /apps/parking.
 * Port of billboard `renderLED` (pitch-6, ledSize 0.7, circular + bloom).
 * Sync to Sites: `pnpm --filter @internetmatt/led-surface sync:sites`
 */
(function () {
  "use strict";

  // Mirror @internetmatt/led-surface BILLBOARD_LED + billboard renderLED
  var PITCH = 6;
  var LED_SIZE = 0.7;
  var GAP = "#0c0c0c";
  var GAMMA = 2.2;
  var ENABLE_BLOOM = true;
  var BLOOM_INTENSITY = 0.5;
  var BLOOM_RADIUS = 3;
  var DARK_FLOOR = 2; // led mode faint idle diodes

  var REALM_BY_SLUG = {
    "404mart": "glitch",
    sickmeme: "glitch",
    computeremoji: "glitch",
    thepinternet: "glitch",
    pixelexhibit: "glitch",
    prettysalty: "salty",
    saltyskate: "salty",
    deckdynasty: "games",
    lookiguess: "games",
    "404matt": "music",
    "404mateo": "music",
    internetmatt: "hub",
  };

  var REALM_AGENT = {
    glitch: "#00C9A7",
    salty: "#50E6FF",
    games: "#0078D4",
    music: "#2B88D8",
    hub: "#00C9A7",
  };

  function slugFromPath() {
    var parts = location.pathname.split("/").filter(Boolean);
    var domain = parts[parts.length - 1] || parts[parts.length - 2] || "";
    if (domain === "parking" && parts.length >= 2) domain = parts[parts.length - 2];
    return domain.replace(/\.com$/i, "").replace(/\.cards$/i, "").replace(/\./g, "-").toLowerCase();
  }

  function resolveRealm(slug) {
    var html = document.documentElement;
    var explicit = html.getAttribute("data-realm");
    if (explicit) return explicit.toLowerCase();
    return REALM_BY_SLUG[slug] || "hub";
  }

  function applyTheme(realm, slug) {
    var html = document.documentElement;
    html.setAttribute("data-theme", "dark");
    html.setAttribute("data-realm", realm);
    if (!html.getAttribute("data-site-theme") || /\s/.test(html.getAttribute("data-site-theme") || "")) {
      html.setAttribute("data-site-theme", slug);
    }
    html.style.setProperty("--parking-led-agent", REALM_AGENT[realm] || REALM_AGENT.hub);
  }

  function ensureStage() {
    var existing = document.getElementById("parking-led-stage");
    if (existing) return existing;
    var stage = document.createElement("div");
    stage.id = "parking-led-stage";
    stage.className = "parking-led-stage";
    stage.setAttribute("aria-hidden", "true");
    var scale = document.createElement("div");
    scale.className = "parking-led-scale";
    var canvas = document.createElement("canvas");
    canvas.className = "parking-led-canvas";
    scale.appendChild(canvas);
    stage.appendChild(scale);
    document.body.insertBefore(stage, document.body.firstChild);
    document.body.classList.add("has-parking-led");
    return stage;
  }

  function hexToRgb(hex) {
    var h = String(hex).replace("#", "");
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }

  function gammaCorrect(v) {
    return Math.pow(v / 255, 1 / GAMMA) * 255;
  }

  /** Same geometry as LoginPixelBackground.computeViewportGrid */
  function computeLayout(cssW, cssH) {
    var cols = Math.max(128, Math.floor(cssW / PITCH));
    var rows = Math.max(32, Math.floor(cssH / PITCH));
    var canvasW = cols * PITCH;
    var canvasH = rows * PITCH;
    return {
      cols: cols,
      rows: rows,
      canvasW: canvasW,
      canvasH: canvasH,
      coverScale: Math.max(cssW / canvasW, cssH / canvasH),
    };
  }

  /**
   * Port of useBillboardRenderer renderLED (renderMode: "led").
   * Circular diodes — not fillRect squares.
   */
  function renderLED(ctx, sx, sy, r, g, b) {
    var ledRadius = (PITCH * LED_SIZE) / 2;
    var brightness = (r + g + b) / (255 * 3);
    var gr = gammaCorrect(r);
    var gg = gammaCorrect(g);
    var gb = gammaCorrect(b);

    var gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, ledRadius);
    gradient.addColorStop(
      0,
      "rgb(" +
        Math.min(255, gr * 1.4) +
        "," +
        Math.min(255, gg * 1.4) +
        "," +
        Math.min(255, gb * 1.4) +
        ")",
    );
    gradient.addColorStop(0.35, "rgb(" + gr + "," + gg + "," + gb + ")");
    gradient.addColorStop(0.75, "rgb(" + gr * 0.5 + "," + gg * 0.5 + "," + gb * 0.5 + ")");
    gradient.addColorStop(1, "rgb(" + gr * 0.15 + "," + gg * 0.15 + "," + gb * 0.15 + ")");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(sx, sy, ledRadius, 0, Math.PI * 2);
    ctx.fill();

    if (ENABLE_BLOOM && brightness > 0.12) {
      var bloomR = ledRadius + BLOOM_RADIUS * brightness * 2.5;
      var bloom = ctx.createRadialGradient(sx, sy, ledRadius, sx, sy, bloomR);
      bloom.addColorStop(0, "rgba(" + r + "," + g + "," + b + "," + BLOOM_INTENSITY * brightness + ")");
      bloom.addColorStop(1, "rgba(" + r + "," + g + "," + b + ",0)");
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(sx, sy, bloomR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFrame(ctx, layout, t, agentHex) {
    var cols = layout.cols;
    var rows = layout.rows;
    var cw = layout.canvasW;
    var ch = layout.canvasH;
    if (ctx.canvas.width !== cw || ctx.canvas.height !== ch) {
      ctx.canvas.width = cw;
      ctx.canvas.height = ch;
    }

    ctx.fillStyle = GAP;
    ctx.fillRect(0, 0, cw, ch);

    var agent = hexToRgb(agentHex);
    var bandY = ((t * 9) % (rows + 24)) - 12;

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var nx = x / cols;
        var ny = y / rows;
        var vignette = 1 - 0.35 * Math.hypot(nx - 0.5, ny - 0.5);
        var scan = 0.5 + 0.5 * Math.sin(ny * 28 + t * 1.1);
        var idleV = (0.42 + 0.22 * scan) * vignette;
        idleV += 0.06 * (((x + y) % 3) / 3);

        var bandDist = Math.abs(y - bandY);
        var onBand = bandDist < 3.2;
        var spark =
          onBand &&
          Math.sin(x * 0.55 + t * 4.2) > 0.35 &&
          ((x * 13 + Math.floor(t * 8)) % 11) > 4;

        var r, g, b, v;
        if (spark) {
          r = agent.r;
          g = agent.g;
          b = agent.b;
          v = 0.75 + 0.25 * (1 - bandDist / 3.2);
        } else if (onBand) {
          r = Math.round(agent.r * 0.35 + 20);
          g = Math.round(agent.g * 0.35 + 24);
          b = Math.round(agent.b * 0.45 + 36);
          v = 0.55 + 0.2 * (1 - bandDist / 3.2);
        } else {
          r = Math.round(16 + 4 * scan);
          g = Math.round(20 + 18 * scan);
          b = Math.round(28 + 40 * scan);
          v = idleV;
        }

        var pr = Math.max(DARK_FLOOR, Math.round(r * v));
        var pg = Math.max(DARK_FLOOR, Math.round(g * v));
        var pb = Math.max(DARK_FLOOR, Math.round(b * v));
        var sx = x * PITCH + PITCH / 2;
        var sy = y * PITCH + PITCH / 2;
        renderLED(ctx, sx, sy, pr, pg, pb);
      }
    }
  }

  function start() {
    var slug = slugFromPath();
    var realm = resolveRealm(slug);
    applyTheme(realm, slug);
    var stage = ensureStage();
    var scaleEl = stage.querySelector(".parking-led-scale");
    var canvas = stage.querySelector("canvas");
    if (!canvas || !scaleEl) return;
    var ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    var agentHex = REALM_AGENT[realm] || REALM_AGENT.hub;
    var startTs = performance.now();
    var layout = null;

    function resize() {
      var rect = stage.getBoundingClientRect();
      layout = computeLayout(
        Math.max(320, rect.width || window.innerWidth),
        Math.max(240, rect.height || window.innerHeight),
      );
      canvas.style.width = layout.canvasW + "px";
      canvas.style.height = layout.canvasH + "px";
      scaleEl.style.transform = "scale(" + layout.coverScale + ")";
    }

    resize();
    window.addEventListener("resize", resize);
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(resize).observe(stage);

    function frame(now) {
      if (!layout) resize();
      drawFrame(ctx, layout, (now - startTs) / 1000, agentHex);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
