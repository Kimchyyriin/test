const LoveApp = (() => {
  const KEY = "love_app_v2";
  const state = {
    name: "โอปอ",  // default
    step: 0
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      Object.assign(state, JSON.parse(raw) || {});
    } catch {}
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function progressPercent() {
    // 0..3 (ถ้าคุณมีหลายหน้าตามเดิม)
    const pct = Math.round((Math.min(state.step, 3) / 3) * 100);
    return isFinite(pct) ? pct : 0;
  }

  function syncProgressUI() {
    const pct = progressPercent();
    const t = document.getElementById("progressText");
    const b = document.getElementById("barFill");
    if (t) t.textContent = `Progress: ${pct}%`;
    if (b) b.style.width = `${pct}%`;
  }

  function initIndexPage() {
    load();
    syncProgressUI();

    // time chip
    const chip = document.getElementById("chipTime");
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2,"0");
      const mm = String(d.getMinutes()).padStart(2,"0");
      chip && (chip.textContent = `Bangkok • ${hh}:${mm}`);
    };
    tick();
    setInterval(tick, 1000 * 10);

    // name input default
    const nameInput = document.getElementById("nameInput");
    if (nameInput) nameInput.value = state.name || "โอปอ";

    // start button
    const btn = document.getElementById("startBtn");
    btn?.addEventListener("click", () => {
      const name = (nameInput?.value || "").trim();
      state.name = name || "โอปอ";
      state.step = Math.max(state.step, 0);
      save();
      // ไปหน้าถัดไป
      window.location.href = "story.html";
    });
  }

  // -------- Stars canvas --------
  function initStars() {
    const c = document.getElementById("stars");
    if (!c) return;

    const ctx = c.getContext("2d");
    let w, h, stars;

    const resize = () => {
      w = c.width = Math.floor(window.innerWidth * devicePixelRatio);
      h = c.height = Math.floor(window.innerHeight * devicePixelRatio);
      c.style.width = "100%";
      c.style.height = "100%";

      const count = Math.min(260, Math.floor((window.innerWidth * window.innerHeight) / 7000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 1.4 + 0.3) * devicePixelRatio,
        a: Math.random() * 0.7 + 0.15,
        s: (Math.random() * 0.45 + 0.08) * devicePixelRatio, // drift speed
        tw: Math.random() * 0.04 + 0.01
      }));
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);

      // subtle vignette
      const g = ctx.createRadialGradient(w*0.5, h*0.4, 0, w*0.5, h*0.4, Math.max(w,h)*0.7);
      g.addColorStop(0, "rgba(255,255,255,0.02)");
      g.addColorStop(1, "rgba(0,0,0,0.22)");
      ctx.fillStyle = g;
      ctx.fillRect(0,0,w,h);

      for (const st of stars) {
        st.y += st.s;
        if (st.y > h + 20) { st.y = -20; st.x = Math.random() * w; }

        const tw = 0.5 + 0.5 * Math.sin(t * st.tw);
        const alpha = st.a * (0.55 + tw * 0.45);

        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }

      requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize, { passive: true });
    resize();
    requestAnimationFrame(draw);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initStars();
    if (document.getElementById("startBtn")) initIndexPage();
  });

  return {
    load, save, state
  };
})();
