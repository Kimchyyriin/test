/* LoveApp — multi-page mini experience
   - Stores name + progress in localStorage
   - Typewriter on story page
   - Gallery unlock mechanic
   - Finale: random line + unique signature hash
   - Confetti burst (no libs)
*/

const LoveApp = (() => {
    const KEY = "love_app_v1";

    const state = {
        name: "",
        step: 0,          // 0 index, 3 done
        revealed: {},     // gallery card reveal flags
        lastLineIdx: 0
    };

    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            Object.assign(state, parsed || {});
        } catch { /* ignore */ }
    }

    function save() {
        localStorage.setItem(KEY, JSON.stringify(state));
    }

    function setName(name) {
        state.name = (name || "").trim();
        save();
    }

    function setStep(step) {
        state.step = Math.max(state.step, step);
        save();
        syncProgressUI();
    }

    function progressPercent() {
        // 4 stages: 0..3
        const pct = Math.round((Math.min(state.step, 3) / 3) * 100);
        return isFinite(pct) ? pct : 0;
    }

    function syncProgressUI() {
        const pct = progressPercent();
        const t = document.getElementById("progressText");
        const b = document.getElementById("barFill");
        if (t) t.textContent = `Progress: ${pct}%`;
        if (b) b.style.width = `${pct}%`;

        const badge = document.getElementById("badgeName");
        if (badge) {
            badge.textContent = state.name ? `To: ${state.name}` : "To: my love";
        }
    }

    // ---------- Typewriter ----------
    async function typewriter(el, text, speed = 18) {
        el.textContent = "";
        for (let i = 0; i < text.length; i++) {
            el.textContent += text[i];
            // small natural jitter
            const jitter = (i % 11 === 0) ? 35 : 0;
            await wait(speed + jitter);
        }
    }

    function wait(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    function initStoryPage({ text, done }) {
        load();
        syncProgressUI();
        const typedEl = document.getElementById("typed");
        if (!typedEl) return;

        // update step when arriving here
        setStep(0);

        typewriter(typedEl, text, 16).then(() => {
            done?.();
        });
    }

    // ---------- Gallery ----------
    function initGalleryPage({ cards, onUnlocked }) {
        load();
        syncProgressUI();
        setStep(1);

        const grid = document.getElementById("grid");
        const need = 3;

        const revealedCount = () =>
            Object.values(state.revealed || {}).filter(Boolean).length;

        function render() {
            grid.innerHTML = "";
            cards.forEach((c, idx) => {
                const revealed = !!state.revealed[idx];
                const card = document.createElement("div");
                card.className = `memCard ${revealed ? "revealed" : "locked"}`;

                const h = document.createElement("h3");
                h.textContent = c.title;

                const p = document.createElement("p");
                p.textContent = c.body;

                card.appendChild(h);
                card.appendChild(p);

                card.addEventListener("click", () => {
                    state.revealed[idx] = true;
                    save();
                    card.classList.remove("locked");
                    card.classList.add("revealed");

                    if (revealedCount() >= need) onUnlocked?.();
                });

                grid.appendChild(card);
            });

            if (revealedCount() >= need) onUnlocked?.();
        }

        render();
    }

    // ---------- Finale ----------
    const finaleLines = [
        "ขอบคุณที่อยู่ด้วยกันนะ",
        "เธอคือความสบายใจของเรา",
        "เราจะรักเธอให้เหมือนวันแรก…แต่เก่งกว่าเดิม",
        "ถ้าวันไหนไม่ไหว กอดเราได้เลย",
        "ขอให้เรายิ้มด้วยกันไปนานๆ",
        "รักแบบที่ไม่ต้องพิสูจน์อะไรอีกแล้ว"
    ];

    function xmur3(str) {
        // tiny hash seed
        let h = 1779033703 ^ str.length;
        for (let i = 0; i < str.length; i++) {
            h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
        }
        return () => {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            return (h ^= h >>> 16) >>> 0;
        };
    }

    function mulberry32(a) {
        return () => {
            let t = (a += 0x6D2B79F5);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function getSignature() {
        const base = `${state.name || "my-love"}|${new Date().toISOString().slice(0, 10)}|v1`;
        const seed = xmur3(base)();
        const rand = mulberry32(seed);
        const hex = () => Math.floor(rand() * 0xffffffff).toString(16).padStart(8, "0");
        return `sig-${hex()}-${hex()}-${hex()}`;
    }

    function refreshFinale() {
        load();
        syncProgressUI();
        setStep(2);

        const rnd = mulberry32(xmur3(`${Date.now()}|${state.name}`)());
        const idx = Math.floor(rnd() * finaleLines.length);
        state.lastLineIdx = idx;
        save();

        const lineEl = document.getElementById("randomLine");
        const hashEl = document.getElementById("hashLine");
        if (lineEl) lineEl.textContent = finaleLines[idx];
        if (hashEl) hashEl.textContent = `// ${getSignature()}`;
    }

    function initFinalePage() {
        load();
        syncProgressUI();
        refreshFinale();
    }

    // ---------- Confetti ----------
    function confettiBurst() {
        const n = 120;
        const wrap = document.createElement("div");
        wrap.style.position = "fixed";
        wrap.style.inset = "0";
        wrap.style.pointerEvents = "none";
        wrap.style.overflow = "hidden";
        document.body.appendChild(wrap);

        const w = window.innerWidth;
        const h = window.innerHeight;

        for (let i = 0; i < n; i++) {
            const s = document.createElement("span");
            s.textContent = Math.random() > 0.5 ? "❤" : "✦";
            s.style.position = "absolute";
            s.style.left = `${w * 0.5 + (Math.random() - 0.5) * 80}px`;
            s.style.top = `${h * 0.35 + (Math.random() - 0.5) * 60}px`;
            s.style.fontSize = `${12 + Math.random() * 18}px`;
            s.style.opacity = "0.95";
            s.style.filter = "drop-shadow(0 10px 18px rgba(0,0,0,.25))";
            s.style.transform = `translate(0,0) rotate(${Math.random() * 360}deg)`;

            const dx = (Math.random() - 0.5) * 600;
            const dy = (Math.random() - 0.5) * 400 - 250;
            const dur = 900 + Math.random() * 600;

            wrap.appendChild(s);

            s.animate(
                [
                    { transform: `translate(0,0) rotate(0deg)`, opacity: 1 },
                    { transform: `translate(${dx}px, ${dy}px) rotate(${720 + Math.random() * 720}deg)`, opacity: 0 }
                ],
                { duration: dur, easing: "cubic-bezier(.2,.7,.2,1)", fill: "forwards" }
            );
        }

        setTimeout(() => wrap.remove(), 1800);
    }

    // ---------- bootstrap shared ----------
    function initIndexPage() {
        load();
        syncProgressUI();

        const nameInput = document.getElementById("nameInput");
        const btn = document.getElementById("startBtn");

        if (nameInput) nameInput.value = state.name || "";

        if (btn) {
            btn.addEventListener("click", () => {
                setName(nameInput?.value || "");
                setStep(0);
                window.location.href = "story.html";
            });
        }
    }

    // Auto-run minimal bootstrap
    document.addEventListener("DOMContentLoaded", () => {
        // If index page has startBtn, init index
        if (document.getElementById("startBtn")) initIndexPage();
        else {
            load();
            syncProgressUI();
        }
    });

    return {
        setName,
        setStep,
        initStoryPage,
        initGalleryPage,
        initFinalePage,
        refreshFinale,
        confettiBurst
    };
})();