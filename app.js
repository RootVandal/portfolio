/* ==========================================================================
   Портфолио веб-студии — логика.
   Хамелеон (палитры по секциям), стопка окон в hero, сцены работ с прокруткой
   превью, конфигуратор цены с чеком, живой просмотр сайтов в iframe.
   ========================================================================== */
(() => {
  "use strict";
  const M = window.ME, W = window.WORKS, BLD = window.BUILDER;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const money = (n) => Math.round(n).toLocaleString("ru-RU");
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c; };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const THEME = { base: "#ebebe6", noir: "#0b0b0b", aitu: "#173a2b", kadr: "#f7f5f1", night: "#111110" };

  /* ------------------------------ Контакты ------------------------------ */
  function me() {
    $$("[data-me]").forEach((el) => { const v = M[el.dataset.me]; if (v != null) el.textContent = v; });
    const hrefs = {
      tel: "tel:" + M.phone.replace(/[^\d+]/g, ""),
      wa: "https://wa.me/" + M.whatsapp,
      mail: "mailto:" + M.email,
      gh: "https://github.com/" + M.github,
    };
    $$("[data-me-href]").forEach((el) => (el.href = hrefs[el.dataset.meHref]));
    $("#year").textContent = new Date().getFullYear();

    const btn = $("#copyMail"), label = btn.querySelector(".copy-t");
    btn.addEventListener("click", () => {
      const done = () => { label.textContent = "скопировано"; setTimeout(() => (label.textContent = "копировать"), 1800); };
      const fallback = () => { const r = document.createRange(); r.selectNodeContents(btn.querySelector("[data-me]")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); label.textContent = "выделено — Ctrl+C"; };
      if (navigator.clipboard) navigator.clipboard.writeText(M.email).then(done, fallback); else fallback();
    });
  }

  function clock() {
    const el = $("#clock");
    let fmt;
    try { fmt = new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Almaty", hour: "2-digit", minute: "2-digit" }); }
    catch { fmt = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }); }
    const tick = () => (el.textContent = `${M.city} ${fmt.format(new Date())}`);
    tick(); setInterval(tick, 20000);
  }

  /* -------------------------------- Шапка -------------------------------- */
  function header() {
    const hdr = $("#hdr");
    const upd = () => hdr.classList.toggle("solid", scrollY > 30);
    upd(); addEventListener("scroll", upd, { passive: true });
    const burger = $("#burger");
    const set = (open) => {
      document.body.classList.toggle("menu-open", open);
      document.body.classList.toggle("locked", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    };
    burger.addEventListener("click", () => set(!document.body.classList.contains("menu-open")));
    $$("#nav a").forEach((a) => a.addEventListener("click", () => set(false)));
    addEventListener("keydown", (e) => { if (e.key === "Escape" && document.body.classList.contains("menu-open")) set(false); });
  }

  /* ------------------------ Прокрутка превью сайтов ---------------------- */
  // view — окно, scroller — длинный скриншот внутри. Пишем дистанцию в CSS.
  const measured = [];
  function scrollPreview(view, kind) {
    const scroller = view.querySelector(".scroller");
    const img = scroller.querySelector("img");
    const calc = () => {
      const dist = Math.max(0, scroller.offsetHeight - view.clientHeight);
      if (kind === "phone") {
        view.style.setProperty("--pdist", `-${dist}px`);
        view.style.setProperty("--pdur", `${Math.min(30, Math.max(12, dist / 150 / 0.38))}s`);
      } else {
        view.style.setProperty("--dist", `-${dist}px`);
        view.style.setProperty("--dur", `${Math.min(11, Math.max(2.4, dist / 420))}s`);
        view.classList.toggle("scrollable", dist > 8);
      }
    };
    if (img.complete && img.naturalHeight) calc(); else img.addEventListener("load", calc, { once: true });
    measured.push(calc);
  }
  if ("ResizeObserver" in window) {
    let t; new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => measured.forEach((f) => f()), 120); }).observe(document.documentElement);
  }

  const shot = (src, alt, eager) =>
    `<div class="scroller"><img src="${esc(src)}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></div>`;

  /* -------------------------------- Стопка ------------------------------- */
  function stack() {
    const rot = $("#stackRot"), box = $("#stack");
    rot.innerHTML = W.map((w, i) => `
      <article class="win" data-i="${i}" data-pos="${i}" data-cursor="Открыть">
        <div class="win-bar" aria-hidden="true"><i></i><i></i><i></i><span class="win-url">${esc(w.url)}</span></div>
        <div class="win-view">${shot(w.desk, `Сайт ${w.title}`, i === 0)}</div>
        <span class="win-tag mono">0${i + 1} · ${esc(w.title)}</span>
      </article>`).join("");
    const wins = $$(".win", rot);
    wins.forEach((el, i) => { scrollPreview(el.querySelector(".win-view"), "desk"); setTimeout(() => el.classList.add("in"), reduced ? 0 : 450 + i * 160); });

    const front = () => wins.find((w) => w.dataset.pos === "0");
    const apply = () => wins.forEach((w) => w.querySelector(".win-view").classList.toggle("can-scroll", w.dataset.pos === "0"));
    const bring = (el) => {
      const shift = (3 - +el.dataset.pos) % 3;
      wins.forEach((w) => (w.dataset.pos = String((+w.dataset.pos + shift) % 3)));
      apply();
    };
    apply();

    wins.forEach((el) => el.addEventListener("click", () => {
      if (el.dataset.pos === "0") document.getElementById("work-" + W[+el.dataset.i].key).scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      else bring(el);
    }));

    // автосмена окон, пока мышь не над стопкой
    let hover = false;
    box.addEventListener("pointerenter", () => (hover = true));
    box.addEventListener("pointerleave", () => (hover = false));
    if (!reduced) setInterval(() => {
      if (hover || document.hidden || box.getBoundingClientRect().bottom < 0) return;
      bring(wins.find((w) => w.dataset.pos === "1"));
    }, 3800);

    // наклон за курсором
    if (finePointer && !reduced) {
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
      const hero = $(".hero");
      hero.addEventListener("pointermove", (e) => {
        tx = (e.clientX / innerWidth - .5) * 12;
        ty = (e.clientY / innerHeight - .5) * -9;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      hero.addEventListener("pointerleave", () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
      function loop() {
        cx += (tx - cx) * .08; cy += (ty - cy) * .08;
        rot.style.setProperty("--ry", cx.toFixed(2) + "deg");
        rot.style.setProperty("--rx", cy.toFixed(2) + "deg");
        raf = Math.abs(tx - cx) + Math.abs(ty - cy) > .02 ? requestAnimationFrame(loop) : 0;
      }
    }
    return front;
  }

  /* ------------------------------ Манифест ------------------------------- */
  function manifest() {
    const p = $("#manifest");
    const words = p.textContent.trim().split(/\s+/);
    const hlFrom = words.findIndex((w, i) => w === "с" && words[i + 1] === "первого");
    p.innerHTML = words.map((w, i) => `<span class="w${hlFrom >= 0 && i >= hlFrom ? " hl" : ""}">${esc(w)}</span>`).join(" ");
    const spans = $$(".w", p);
    if (reduced) { spans.forEach((s) => s.classList.add("on")); return; }
    let ticking = false;
    const upd = () => {
      ticking = false;
      const r = p.getBoundingClientRect(), vh = innerHeight;
      const prog = Math.min(1, Math.max(0, (vh * .85 - r.top) / (r.height + vh * .35)));
      const k = Math.round(prog * spans.length);
      spans.forEach((s, i) => s.classList.toggle("on", i < k));
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* ------------------------------- Работы -------------------------------- */
  function stages() {
    $("#stages").innerHTML = W.map((w, i) => `
      <section class="stage" id="work-${w.key}" data-palette="${w.palette}" aria-label="${esc(w.title)}">
        <div class="wrap stage-in">
          <div class="stage-copy rv">
            <div class="stage-idx mono"><b>0${i + 1}</b><span>/ 0${W.length}</span><span>·</span><span>${esc(w.kind)}</span><span>·</span><span>${esc(w.year)}</span></div>
            <h3 class="stage-title">${esc(w.title)}</h3>
            <p class="stage-desc">${esc(w.desc)}</p>
            <ul class="stage-feat">${w.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
            <div class="stage-cta">
              <a class="btn" href="${esc(w.live)}" target="_blank" rel="noopener">Открыть сайт ↗</a>
              <button class="btn btn-line" type="button" data-try="${i}">Попробовать здесь</button>
            </div>
          </div>
          <div class="devices rv d1">
            <div class="browser" data-cursor="Листать">
              <div class="win-bar" aria-hidden="true"><i></i><i></i><i></i><span class="win-url">${esc(w.url)}</span></div>
              <div class="win-view can-scroll">${shot(w.desk, `${w.title} на компьютере`)}</div>
            </div>
            <div class="phone" aria-hidden="true"><div class="phone-view">${shot(w.mob, "")}</div></div>
          </div>
        </div>
      </section>`).join("");

    $$(".stage").forEach((st) => {
      scrollPreview(st.querySelector(".browser .win-view"), "desk");
      scrollPreview(st.querySelector(".phone-view"), "phone");
    });
    // телефон листается сам, только пока сцена на экране
    const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("play", e.isIntersecting)), { threshold: .25 });
    $$(".stage").forEach((s) => io.observe(s));
    $$("[data-try]").forEach((b) => b.addEventListener("click", () => openTry(W[+b.dataset.try], b)));
  }

  /* ------------------------------ Хамелеон ------------------------------- */
  function chameleon() {
    const meta = $('meta[name="theme-color"]');
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const p = e.target.dataset.palette;
      if (document.body.dataset.palette !== p) {
        document.body.dataset.palette = p;
        meta.setAttribute("content", THEME[p] || THEME.base);
      }
    }), { rootMargin: "-50% 0px -50% 0px" });
    $$("main [data-palette]").forEach((s) => io.observe(s));
  }

  /* ---------------------------- Конфигуратор ----------------------------- */
  function builder() {
    const st = { type: BLD.types[0].id, pages: BLD.types[0].pages, extras: new Set(), urgent: false };
    const typeOf = () => BLD.types.find((t) => t.id === st.type);

    $("#types").innerHTML = BLD.types.map((t, i) => `
      <button type="button" class="type" role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-t="${t.id}">
        <span class="dot" aria-hidden="true"></span>
        <b>${esc(t.name)}</b><small>${esc(t.sub)}</small>
        <span class="pr">от ${money(t.price)} ₸ · ${t.days} ${plural(t.days, "день", "дня", "дней")}</span>
      </button>`).join("");
    $("#extras").innerHTML = BLD.extras.map((x) => `
      <label class="extra" data-x="${x.id}"><input type="checkbox"><span class="box" aria-hidden="true"></span>
        <span class="t">${esc(x.name)}</span><span class="p">+${money(x.price)} ₸</span></label>`).join("");

    const types = $$(".type");
    const pick = (id, focus) => {
      st.type = id; st.pages = typeOf().pages;
      types.forEach((b) => { const on = b.dataset.t === id; b.setAttribute("aria-checked", String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
      $("#pages").value = st.pages;
      update();
    };
    types.forEach((b, i) => {
      b.addEventListener("click", () => pick(b.dataset.t));
      b.addEventListener("keydown", (e) => {
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        pick(types[(i + d + types.length) % types.length].dataset.t, true);
      });
    });
    $("#pages").addEventListener("input", (e) => { st.pages = +e.target.value; update(); });
    $$(".extra").forEach((l) => l.querySelector("input").addEventListener("change", (e) => {
      e.target.checked ? st.extras.add(l.dataset.x) : st.extras.delete(l.dataset.x);
      l.classList.toggle("on", e.target.checked); update();
    }));
    $("#urgent").addEventListener("change", (e) => { st.urgent = e.target.checked; update(); });

    // шапка чека: номер и дата по Алматы
    const now = new Date();
    let dfmt;
    try { dfmt = new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Almaty", day: "numeric", month: "long" }); } catch { dfmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }); }
    $("#rcDate").textContent = dfmt.format(now);
    $("#rcNo").textContent = String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0");

    let lastTotal = null;
    function update() {
      const t = typeOf();
      const extraPages = Math.max(0, st.pages - t.pages);
      const pagesCost = extraPages * BLD.pagePrice;
      let days = t.days + Math.ceil(extraPages / 2);
      const lines = [[`${t.name}${t.from ? " — база" : ""}`, t.price]];
      if (extraPages) lines.push([`+${extraPages} ${plural(extraPages, "раздел", "раздела", "разделов")}`, pagesCost]);
      let sum = t.price + pagesCost;
      BLD.extras.forEach((x) => { if (st.extras.has(x.id)) { lines.push([x.name, x.price]); sum += x.price; days += x.days; } });
      let total = sum;
      if (st.urgent) {
        total = Math.round((sum * BLD.urgent.k) / 1000) * 1000;
        days = Math.max(3, Math.ceil(days * BLD.urgent.d));
        lines.push(["Срочно, +30%", total - sum, true]);
      }
      $("#pagesOut").textContent = st.pages;
      $("#pagesHint").textContent = `Включено: ${t.pages} ${plural(t.pages, "раздел", "раздела", "разделов")}. Каждый следующий — +${money(BLD.pagePrice)} ₸.`;
      $("#rcLines").innerHTML = lines.map(([n, p, mul]) => `<li${mul ? ' class="mul"' : ""}><span>${esc(n)}</span><b>${money(p)} ₸</b></li>`).join("");
      const totalTxt = `${t.from ? "от" : "≈"} ${money(total)} ₸`;
      const daysTxt = `Срок ≈ ${days} ${plural(days, "день", "дня", "дней")}`;
      const tot = $("#rcTotal");
      tot.textContent = totalTxt;
      if (lastTotal !== null && lastTotal !== total && !reduced) { tot.classList.remove("bump"); void tot.offsetWidth; tot.classList.add("bump"); }
      lastTotal = total;
      $("#rcDays").textContent = daysTxt;
      $("#mbTotal").textContent = totalTxt;
      $("#mbDays").textContent = daysTxt;

      const ex = BLD.extras.filter((x) => st.extras.has(x.id)).map((x) => x.name);
      const msg = [
        "Здравствуйте! Посчитал сайт в конфигураторе:",
        `— Тип: ${t.name}`,
        `— Разделов: ${st.pages}`,
        ex.length ? `— Дополнительно: ${ex.join(", ")}` : "",
        st.urgent ? "— Нужно срочно" : "",
        `Итого: ${totalTxt}, ${daysTxt.toLowerCase()}.`,
        "Хочу обсудить детали.",
      ].filter(Boolean).join("\n");
      const href = `https://wa.me/${M.whatsapp}?text=${encodeURIComponent(msg)}`;
      $("#rcSend").href = href; $("#mbSend").href = href;
    }
    update();

    // мобильная плашка с ценой — пока конфигуратор на экране
    const bar = $("#mbar");
    new IntersectionObserver(([e]) => { bar.classList.toggle("show", e.isIntersecting); bar.setAttribute("aria-hidden", String(!e.isIntersecting)); }, { rootMargin: "0px 0px -35% 0px" }).observe($("#buildForm"));
  }

  /* --------------------------- Процесс и FAQ ---------------------------- */
  function process() {
    $("#rail").innerHTML = window.STEPS.map(([d, t, p], i) => `<li class="rv d${i}"><span class="d mono">${esc(d)}</span><h3>${esc(t)}</h3><p>${esc(p)}</p></li>`).join("");
  }
  function faq() {
    $("#faq").innerHTML = window.FAQ.map(([q, a], i) => `
      <div class="qa"><button type="button" aria-expanded="false" aria-controls="qa${i}">${esc(q)}<span class="pm" aria-hidden="true"></span></button>
      <div class="qa-a" id="qa${i}"><div><p>${esc(a)}</p></div></div></div>`).join("");
    $$(".qa button").forEach((b) => b.addEventListener("click", () => {
      const qa = b.parentElement, open = !qa.classList.contains("open");
      qa.classList.toggle("open", open); b.setAttribute("aria-expanded", String(open));
    }));
  }

  /* --------------------------- Живой просмотр ---------------------------- */
  const tryEl = $("#try"), frame = $("#tryFrame"), ifr = $("#tryIf");
  let opener = null;
  function openTry(w, from) {
    opener = from || null;
    $("#tryTitle").textContent = w.title;
    $("#tryKind").textContent = w.kind;
    $("#tryOpen").href = w.live;
    if (ifr.dataset.src !== w.live) {
      frame.classList.remove("ready");
      ifr.dataset.src = w.live;
      ifr.src = w.live;
      ifr.title = `Сайт ${w.title}`;
    }
    setDev("desk");
    tryEl.classList.add("open"); tryEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("locked");
    setTimeout(() => $("#tryX").focus(), 60);
  }
  function closeTry() {
    tryEl.classList.remove("open"); tryEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("locked");
    if (opener) opener.focus();
  }
  function setDev(d) {
    frame.dataset.dev = d;
    $$(".seg button").forEach((b) => { const on = b.dataset.dev === d; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
  }
  ifr.addEventListener("load", () => { if (ifr.src) frame.classList.add("ready"); });
  $$(".seg button").forEach((b) => b.addEventListener("click", () => setDev(b.dataset.dev)));
  $("#tryX").addEventListener("click", closeTry);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && tryEl.classList.contains("open")) closeTry(); });
  tryEl.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const f = $$("button, a[href]", tryEl).filter((x) => x.offsetParent);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  /* ------------------------------- Курсор -------------------------------- */
  function cursor() {
    if (!finePointer || reduced) return;
    const c = $("#cur"), t = $("#curT");
    let x = -100, y = -100, cx = -100, cy = -100, raf = 0, shown = false;
    addEventListener("pointermove", (e) => {
      x = e.clientX; y = e.clientY;
      const tgt = e.target.closest && e.target.closest("[data-cursor]");
      const want = !!tgt && !tryEl.classList.contains("open");
      if (want) t.textContent = tgt.dataset.cursor;
      if (want !== shown) { shown = want; c.classList.toggle("show", want); }
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    function loop() {
      cx += (x - cx) * .2; cy += (y - cy) * .2;
      c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = Math.abs(x - cx) + Math.abs(y - cy) > .3 ? requestAnimationFrame(loop) : 0;
    }
  }

  /* ------------- Подгонка: длинное слово не переносится по буквам ---------- */
  function fit() {
    const els = $$(".stage-title, .phone-big");
    const room = (p) => { const cs = getComputedStyle(p); return p.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); };
    const over = (el) => el.scrollWidth > el.clientWidth + 1 || el.getBoundingClientRect().width > room(el.parentElement) + 1;
    const run = () => els.forEach((el) => {
      el.style.fontSize = "";
      let size = parseFloat(getComputedStyle(el).fontSize), guard = 40;
      while (over(el) && size > 14 && guard--) { size -= 2; el.style.fontSize = size + "px"; }
    });
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(run);
    let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(run, 150); });
  }

  /* ------------------------------- Появление ----------------------------- */
  function reveal() {
    $$(".works-intro-in, .build-head, .faq-grid > div, .contact-h, .phone-big, .contact-row, .facts").forEach((el) => el.classList.add("rv"));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
    $$(".rv").forEach((el) => io.observe(el));
  }

  me(); clock(); header(); stack(); manifest(); stages(); chameleon(); builder(); process(); faq(); cursor(); reveal(); fit();
})();
