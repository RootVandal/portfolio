/* ==========================================================================
   Портфолио веб-студии. Логика.
   ========================================================================== */
(() => {
  "use strict";
  const M = window.ME, W = window.WORKS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function me() {
    $$("[data-me]").forEach((el) => { const v = M[el.dataset.me]; if (v != null) el.textContent = v; });
    const hrefs = {
      wa: "https://wa.me/" + M.whatsapp,
      tg: "https://t.me/" + M.telegram,
      tel: "tel:" + M.phone.replace(/[^\d+]/g, ""),
      mail: "mailto:" + M.email,
      ig: "https://instagram.com/" + M.instagram,
      gh: "https://github.com/" + M.github,
    };
    $$("[data-me-href]").forEach((el) => (el.href = hrefs[el.dataset.meHref]));
    $("#year").textContent = new Date().getFullYear();
    document.title = `${M.role} — ${M.name}`;
  }

  function works() {
    const ext = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>`;
    $("#workList").innerHTML = W.map((w) => `
      <article class="work reveal">
        <a class="work-shot" href="${esc(w.live)}" target="_blank" rel="noopener" aria-label="Открыть ${esc(w.title)}">
          <img loading="lazy" src="${esc(w.img)}" alt="Сайт ${esc(w.title)}" width="1280" height="800">
        </a>
        <div class="work-body">
          <div class="work-kind mono"><span>${esc(w.kind)}</span>·<span class="yr">${esc(w.year)}</span></div>
          <h3>${esc(w.title)}</h3>
          <p>${esc(w.desc)}</p>
          <div class="work-tags">${w.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
          <div class="work-actions">
            <a class="work-open" href="${esc(w.live)}" target="_blank" rel="noopener">Открыть сайт ${ext}</a>
            <span class="work-note">Живое демо</span>
          </div>
        </div>
      </article>`).join("");
  }

  function services() {
    $("#svcList").innerHTML = window.SERVICES.map(([n, t, d, p]) => `
      <article class="svc reveal"><span class="n">${n}</span><h3>${esc(t)}</h3><p>${esc(d)}</p><span class="pr">${esc(p)}</span></article>`).join("");
  }

  function steps() {
    $("#steps").innerHTML = window.STEPS.map(([t, d], i) =>
      `<div class="step reveal"><span class="k">0${i + 1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("");
  }

  function faq() {
    $("#faq").innerHTML = window.FAQ.map(([q, a]) =>
      `<div class="qa"><button aria-expanded="false">${esc(q)}<span class="pm"></span></button><div class="qa-a"><div><p>${esc(a)}</p></div></div></div>`).join("");
    $$(".qa button").forEach((b) => b.addEventListener("click", () => {
      const qa = b.parentElement, open = !qa.classList.contains("open");
      qa.classList.toggle("open", open); b.setAttribute("aria-expanded", String(open));
    }));
  }

  function header() {
    const hdr = $("#hdr");
    const upd = () => hdr.classList.toggle("solid", window.scrollY > 40);
    upd(); window.addEventListener("scroll", upd, { passive: true });
    const burger = $("#burger");
    const close = () => { document.body.classList.remove("menu-open", "locked"); burger.setAttribute("aria-expanded", "false"); };
    burger.addEventListener("click", () => {
      const open = !document.body.classList.contains("menu-open");
      document.body.classList.toggle("menu-open", open);
      document.body.classList.toggle("locked", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    $$("#nav a").forEach((a) => a.addEventListener("click", close));
  }

  function form() {
    const f = $("#form");
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = f.elements.name, contact = f.elements.contact;
      const ok1 = name.value.trim().length > 1, ok2 = contact.value.trim().length > 3;
      name.closest(".field").classList.toggle("err", !ok1);
      contact.closest(".field").classList.toggle("err", !ok2);
      if (!ok1 || !ok2) return (ok1 ? contact : name).focus();
      const msg = [
        `Здравствуйте! Заявка с портфолио.`,
        `Имя: ${name.value.trim()}`,
        `Связь: ${contact.value.trim()}`,
        f.elements.note.value.trim() && `Задача: ${f.elements.note.value.trim()}`,
      ].filter(Boolean).join("\n");
      $("#formWa").href = `https://wa.me/${M.whatsapp}?text=${encodeURIComponent(msg)}`;
      $("#formOk").hidden = false;
    });
  }

  function reveal() {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach((el) => io.observe(el));
  }

  me(); works(); services(); steps(); faq(); header(); form(); reveal();
})();
