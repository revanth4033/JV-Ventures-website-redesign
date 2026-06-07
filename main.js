/* ============================================================
   JV VENTURES — homepage motion system · v3 (presentation deck)
   One pinned moment: the deck. Vertical scroll drives horizontal
   slides with layered parallax. Grammar: one easing, 3 durations,
   transform/opacity only.
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const MOBILE = window.matchMedia("(max-width: 1023px)").matches;
const EASE = "power3.out";
let lenis = null;

/* ---------- smooth scroll (Lenis) ---------- */
if (!REDUCED) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  window.__lenis = lenis; // QA hook
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- masked line reveals (outside the deck) ---------- */
document.querySelectorAll(".line-inner").forEach((el) => {
  if (el.closest(".deck-stage")) return; // deck lines are slide-activated
  gsap.to(el, {
    y: 0,
    duration: REDUCED ? 0 : 1.2,
    ease: EASE,
    scrollTrigger: { trigger: el.closest(".line"), start: "top 88%", once: true },
  });
});
document.querySelectorAll(".reveal").forEach((el) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: REDUCED ? 0 : 0.7,
    ease: EASE,
    scrollTrigger: { trigger: el, start: "top 88%", once: true },
  });
});

/* ============ THE PRESENTATION DECK ============ */
(() => {
  const stage = document.querySelector(".deck-stage");
  const track = document.querySelector(".deck-track");
  if (!stage || !track) return;

  const slides = gsap.utils.toArray(".slide");
  const chapters = gsap.utils.toArray(".rail-ch");
  const counterEl = document.getElementById("deck-cur");
  const N = slides.length;
  const TOTAL = (N - 1) + 3; // 3 slide transitions + 3 units of strip steps on slide 04
  const counted = new Set();
  let current = -1;

  /* slide 04 strips: scroll opens them one by one */
  const strips = gsap.utils.toArray(".strip");
  const stripWrap = document.querySelector(".plat-strips");
  const wideScreen = window.matchMedia("(min-width: 1024px)");
  let stripIdx = -1;
  const openStrip = (i) => {
    if (i === stripIdx || !strips.length) return;
    stripIdx = i;
    strips.forEach((st, j) => st.classList.toggle("open", j === i));
    if (wideScreen.matches)
      stripWrap.style.gridTemplateColumns = strips.map((_, j) => (j === i ? "3.4fr" : "0.55fr")).join(" ");
  };
  openStrip(0);

  /* stat counters fire once, when the impact slide arrives */
  const countStats = () => {
    document.querySelectorAll(".stat-card").forEach((card) => {
      if (counted.has(card)) return;
      counted.add(card);
      const numEl = card.querySelector(".stat-num");
      const target = +card.dataset.count;
      const suffix = card.dataset.suffix || "";
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: REDUCED ? 0 : 1.2,
        ease: "power2.out",
        onUpdate: () => (numEl.textContent = Math.round(obj.v).toLocaleString("en-IN") + suffix),
      });
    });
  };

  const activate = (i) => {
    if (i === current) return;
    current = i;
    slides.forEach((s, j) => s.classList.toggle("active", j === i));
    chapters.forEach((c, j) => c.classList.toggle("active", j === i));
    counterEl.textContent = String(i + 1).padStart(2, "0");
    if (i === 1) countStats();
  };

  if (REDUCED || MOBILE) {
    // mobile / reduced-motion: vertical stack, no pin, no horizontal scroll
    slides.forEach((s) => s.classList.add("active"));
    strips.forEach((st) => st.classList.add("open")); // all platforms shown
    if (REDUCED) {
      document.querySelectorAll(".stat-card").forEach((card) => {
        card.querySelector(".stat-num").textContent =
          (+card.dataset.count).toLocaleString("en-IN") + (card.dataset.suffix || "");
      });
    } else {
      // counters animate when each scrolls into view
      document.querySelectorAll(".stat-card").forEach((card) => {
        ScrollTrigger.create({
          trigger: card, start: "top 85%", once: true,
          onEnter: () => {
            const numEl = card.querySelector(".stat-num");
            const target = +card.dataset.count, suffix = card.dataset.suffix || "";
            const obj = { v: 0 };
            gsap.to(obj, { v: target, duration: 1.2, ease: "power2.out",
              onUpdate: () => (numEl.textContent = Math.round(obj.v).toLocaleString("en-IN") + suffix) });
          },
        });
      });
    }
    return;
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: stage,
      start: "top top",
      end: "+=" + (N * 100 + 300) + "%", // extra travel: strips advance during slide 04
      pin: ".deck-viewport",
      scrub: true,
      onUpdate: (self) => {
        const t = self.progress * TOTAL;
        const i = t < N - 1 ? Math.round(t) : N - 1;
        activate(i);
        // strips phase: the last 3 units feature each platform in turn
        if (t >= N - 1) openStrip(Math.min(strips.length - 1, Math.floor((t - (N - 1)) / 0.75)));
        gsap.set(".rail-fill", { scaleX: self.progress });
      },
    },
  });

  // the track travels; total duration = N-1 transitions
  tl.to(track, { xPercent: -100 * ((N - 1) / N), ease: "none", duration: N - 1 }, 0);
  tl.to({}, { duration: TOTAL - (N - 1) }, N - 1); // hold: strips phase

  // layered parallax: each slide's content & visual drift at different speeds
  slides.forEach((slide, i) => {
    const content = slide.querySelector(".slide-content");
    const visual = slide.querySelector(".slide-visual");
    const w0 = Math.max(0, i - 1);
    const w1 = Math.min(N - 1, i + 1);
    if (content)
      tl.fromTo(content, { xPercent: i === 0 ? 0 : 10 }, { xPercent: i === N - 1 ? 0 : -10, ease: "none", duration: w1 - w0 }, w0);
    const amp = slide.dataset.vpx ? +slide.dataset.vpx : 22; // full-bleed slides drift less
    if (visual)
      tl.fromTo(visual, { xPercent: i === 0 ? 0 : amp }, { xPercent: i === N - 1 ? 0 : -amp, ease: "none", duration: w1 - w0 }, w0);
  });

  /* chapter rail: click to jump */
  const st = tl.scrollTrigger;
  const jumpTo = (i) => {
    const y = st.start + ((st.end - st.start) * i) / TOTAL;
    lenis ? lenis.scrollTo(y, { duration: 1.1 }) : window.scrollTo({ top: y, behavior: "smooth" });
  };
  chapters.forEach((c) => c.addEventListener("click", () => jumpTo(+c.dataset.i)));
  document.querySelectorAll("[data-deck-slide]").forEach((a) =>
    a.addEventListener("click", (e) => { e.preventDefault(); jumpTo(+a.dataset.deckSlide); })
  );

  /* arrow keys advance the presentation while the deck is on screen */
  window.addEventListener("keydown", (e) => {
    if (!st.isActive) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); jumpTo(Math.min(N - 1, current + 1)); }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); jumpTo(Math.max(0, current - 1)); }
  });

  activate(0);
})();

/* ============ SOI sphere: tiles orbit the core (all viewports) ============ */
(() => {
  const rings = document.querySelector(".soi-rings");
  if (!rings) return;
  const orbiters = [
    { el: document.querySelector(".t-edu"),  r: 0.46, a: -52 },
    { el: document.querySelector(".t-rx"),   r: 0.38, a: 178 },
    { el: document.querySelector(".t-care"), r: 0.44, a: 34 },
    { el: document.querySelector(".t-pod"),  r: 0.31, a: 108 },
  ].filter(o => o.el);
  if (!orbiters.length) return;
  // re-anchor every tile at the center; orbit drives x/y from there
  orbiters.forEach(o =>
    gsap.set(o.el, { left: "50%", top: "50%", right: "auto", bottom: "auto", xPercent: -50, yPercent: -50 })
  );
  const state = { spin: 0 };
  const place = () => {
    const R = rings.offsetWidth / 2;
    orbiters.forEach(o => {
      const a = ((o.a + state.spin) * Math.PI) / 180;
      gsap.set(o.el, { x: Math.cos(a) * R * 2 * o.r, y: Math.sin(a) * R * 2 * o.r });
    });
  };
  place();
  if (!REDUCED)
    gsap.to(state, { spin: 360, duration: 70, repeat: -1, ease: "none", onUpdate: place });
  window.addEventListener("resize", place);
})();

/* ---------- closing bridge ---------- */
(() => {
  const img = document.querySelector(".close-bridge img");
  if (!img || REDUCED) return;
  gsap.to(img, {
    clipPath: "inset(0 0% 0 0)",
    duration: 1.8,
    ease: "power2.inOut",
    scrollTrigger: { trigger: ".act-close", start: "top 55%", once: true },
  });
  gsap.from(".close-bridge", {
    yPercent: 30, ease: "none",
    scrollTrigger: { trigger: ".act-close", start: "top bottom", end: "top 20%", scrub: 0.4 },
  });
})();

/* ---------- placeholder links ---------- */
document.querySelectorAll('a[href="#"]').forEach((a) =>
  a.addEventListener("click", (e) => e.preventDefault())
);

window.addEventListener("resize", () => ScrollTrigger.refresh());

/* ---------- smart header: backdrop on scroll, tuck on scroll-down ---------- */
(() => {
  const header = document.querySelector(".site-header");
  if (!header) return;
  let lastY = 0;
  const onScroll = (y) => {
    header.classList.toggle("scrolled", y > 40);
    header.classList.toggle("tucked", y > lastY + 2 && y > 260);
    if (y < lastY - 2) header.classList.remove("tucked");
    lastY = y;
  };
  if (window.__lenis) window.__lenis.on("scroll", (e) => onScroll(e.scroll));
  else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
})();
