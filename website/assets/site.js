window.HM = (() => {
  const DEFAULT_NAV = [
    { key: "home", label: "Home", visible: true },
    { key: "about", label: "About", visible: true },
    { key: "photo", label: "Photo", visible: true },
    { key: "video", label: "Video", visible: true },
    { key: "schedule", label: "Schedule", visible: true },
    { key: "contact", label: "Contact", visible: true }
  ];

  const DEFAULTS = {
    hero: { subtitle: "브랜드의 무드를, 가장 강력한 이미지로", meta: "COMMERCIAL PHOTO & VIDEO — SEOUL" },
    marquee: ["BEAUTY", "PRODUCT", "MODEL", "FOOD", "LIFESTYLE", "VIDEO"],
    intro: "기획부터 촬영, 후반 작업까지. 브랜드가 전하고 싶은 무드를 정확하게 읽고, 가장 강력한 한 장의 이미지로 완성합니다.",
    works: [],
    brands: [],
    heroSlides: [],
    nav: DEFAULT_NAV,
    about: { text: "" },
    stats: [
      { value: 120, label: "Brands Worked With" },
      { value: 800, label: "Projects Delivered" },
      { value: 7, label: "Years of Craft" }
    ],
    videos: [],
    cta: { heading: "LET'S MAKE\nSOMETHING HOLY.", buttonText: "프로젝트 문의하기", email: "studio.holymolly@gmail.com" },
    footer: {
      bio: "브랜드의 무드를, 가장 강력한 이미지로. 기획 — 촬영 — 후반 — 납품.",
      socials: [],
      location: "Seoul, Korea"
    }
  };

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  const catOf = b => (b.category || "").trim().toUpperCase();

  function getBrands(c) {
    return (Array.isArray(c.brands) && c.brands.length ? c.brands
      : (c.works || []).filter(w => w.image).map(w => ({ name: w.title, tag: w.tag, visible: true, photos: [{ image: w.image }] })))
      .map(b => ({ ...b, photos: (b.photos || []).filter(p => p.image) }))
      .filter(b => b.visible !== false && b.photos.length);
  }

  // 페이지(탭) 이동마다 전체 콘텐츠를 다시 내려받지 않도록 세션 캐시 사용.
  // TTL 이내에는 서버 호출 없이 캐시로 즉시 렌더하고, TTL이 지나면 캐시로 먼저
  // 렌더한 뒤 백그라운드에서만 갱신한다.
  // (sessionStorage는 탭 단위라 새 탭/새 방문에서는 항상 최신을 받는다)
  const CONTENT_CACHE_KEY = "hm:content";
  const CONTENT_TTL = 10 * 60 * 1000;
  async function loadFreshContent() {
    try {
      const r = await fetch("/api/content", { cache: "no-store" });
      if (!r.ok) return null;
      const data = await r.json();
      try { sessionStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify({ t: Date.now(), data })); } catch {}
      return data;
    } catch { return null; }
  }
  async function fetchContent() {
    let cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(CONTENT_CACHE_KEY)); } catch {}
    if (cached && cached.data && typeof cached.data === "object") {
      if (Date.now() - (cached.t || 0) > CONTENT_TTL) loadFreshContent();
      return cached.data;
    }
    return (await loadFreshContent()) || {};
  }

  // ---------- custom cursor ----------
  let cursor = null;
  function initCursor() {
    cursor = document.createElement("div");
    cursor.id = "cursor";
    document.body.appendChild(cursor);
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; });
    (function loop() {
      cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18;
      cursor.style.left = cx + "px"; cursor.style.top = cy + "px";
      requestAnimationFrame(loop);
    })();
  }
  function hoverize(root) {
    (root || document).querySelectorAll("a, button, .work, .vthumb").forEach(el => {
      if (el.dataset.hoverized) return;
      el.dataset.hoverized = "1";
      el.addEventListener("mouseenter", () => cursor.classList.add("grow"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("grow"));
    });
  }

  // ---------- lightbox (per-brand slideshow) ----------
  let lbBrand = null, lbP = 0, lbBuilt = false;
  function ensureLightbox() {
    if (lbBuilt) return;
    lbBuilt = true;
    const div = document.createElement("div");
    div.className = "lightbox";
    div.id = "lightbox";
    div.setAttribute("role", "dialog");
    div.setAttribute("aria-modal", "true");
    div.setAttribute("aria-label", "사진 크게 보기");
    div.innerHTML = `
      <div class="lb-count" id="lbCount"></div>
      <button class="lb-btn lb-close" id="lbClose" aria-label="닫기">×</button>
      <div class="lb-stage">
        <button class="lb-btn lb-prev" id="lbPrev" aria-label="이전 사진">←</button>
        <img id="lbImg" src="" alt="">
        <button class="lb-btn lb-next" id="lbNext" aria-label="다음 사진">→</button>
      </div>
      <div class="lb-thumbs" id="lbThumbs"></div>
      <div class="lb-caption"><span class="t" id="lbTitle"></span><span class="tag" id="lbTag"></span></div>`;
    document.body.appendChild(div);
    const lb = div, lbImg = div.querySelector("#lbImg");
    document.getElementById("lbClose").addEventListener("click", closeLightbox);
    document.getElementById("lbPrev").addEventListener("click", e => { e.stopPropagation(); lbShow(lbP - 1); });
    document.getElementById("lbNext").addEventListener("click", e => { e.stopPropagation(); lbShow(lbP + 1); });
    lb.addEventListener("click", e => { if (e.target === lb || e.target.classList.contains("lb-stage")) closeLightbox(); });
    lbImg.addEventListener("click", e => {
      e.stopPropagation();
      if ((lbBrand?.photos || []).length > 1) lbShow(lbP + 1);
    });
    addEventListener("keydown", e => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") lbShow(lbP - 1);
      if (e.key === "ArrowRight") lbShow(lbP + 1);
    });
    let touchX = null;
    lb.addEventListener("touchstart", e => { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", e => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) lbShow(lbP + (dx < 0 ? 1 : -1));
      touchX = null;
    }, { passive: true });
    hoverize(lb);
  }
  function lbShow(p) {
    const photos = lbBrand.photos;
    lbP = (p + photos.length) % photos.length;
    const src = photos[lbP].image;
    const lbImg = document.getElementById("lbImg");
    lbImg.style.opacity = "0";
    const pre = new Image();
    pre.onload = () => {
      lbImg.src = src;
      lbImg.alt = lbBrand.name || "";
      lbImg.style.opacity = "1";
    };
    pre.src = src;
    document.getElementById("lbTitle").textContent = lbBrand.name || "";
    document.getElementById("lbTag").textContent = "";
    const multi = photos.length > 1;
    document.getElementById("lbCount").textContent = multi ? `${lbP + 1} / ${photos.length}` : "";
    document.getElementById("lbPrev").style.visibility = multi ? "visible" : "hidden";
    document.getElementById("lbNext").style.visibility = multi ? "visible" : "hidden";
    if (multi) {
      new Image().src = photos[(lbP + 1) % photos.length].image;
      new Image().src = photos[(lbP - 1 + photos.length) % photos.length].image;
    }
    const thumbs = document.getElementById("lbThumbs");
    [...thumbs.children].forEach((t, i) => t.classList.toggle("cur", i === lbP));
    if (thumbs.children[lbP]) thumbs.children[lbP].scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }
  function openLightbox(brand) {
    ensureLightbox();
    lbBrand = brand;
    const thumbs = document.getElementById("lbThumbs");
    thumbs.hidden = brand.photos.length < 2;
    thumbs.innerHTML = brand.photos.map((p, i) =>
      `<img src="${esc(p.image)}" alt="${esc(brand.name || "")} ${i + 1}" data-i="${i}">`).join("");
    thumbs.querySelectorAll("img").forEach(t => {
      t.addEventListener("click", e => { e.stopPropagation(); lbShow(+t.dataset.i); });
    });
    lbShow(0);
    document.getElementById("lightbox").classList.add("open");
    document.body.classList.add("lb-lock");
  }
  function closeLightbox() {
    document.getElementById("lightbox").classList.remove("open");
    document.body.classList.remove("lb-lock");
  }

  // ---------- portfolio grid + category filter ----------
  function buildWorkCards(gridEl, list, instant) {
    gridEl.innerHTML = list.map((b, i) => `
      <div class="work ${instant ? "" : "reveal"}" data-index="${i}" role="button" tabindex="0" aria-label="${esc(b.name)} 사진 보기">
        <div class="frame">
          <img src="${esc(b.photos[0].image)}" alt="${esc(b.name)}" loading="lazy">
          ${b.photos.length > 1 ? `<span class="nbadge">${b.photos.length} PHOTOS</span>` : ""}
        </div>
        <div class="info"><h3>${esc(b.name)}</h3></div>
      </div>`).join("");
    gridEl.querySelectorAll(".work").forEach(el => {
      el.addEventListener("click", () => openLightbox(list[+el.dataset.index]));
      el.addEventListener("keydown", e => { if (e.key === "Enter") openLightbox(list[+el.dataset.index]); });
    });
    hoverize(gridEl);
  }

  const CAT_ORDER = ["BEAUTY", "PRODUCT", "F&B", "MODEL", "LIFESTYLE"];
  const CAT_LABELS = { BEAUTY: "Beauty", PRODUCT: "Product", "F&B": "F&B", MODEL: "Model", LIFESTYLE: "Life Style" };

  function renderPortfolio(c, ids) {
    const grid = document.getElementById(ids.grid);
    const fbar = ids.bar ? document.getElementById(ids.bar) : null;
    const head = ids.head ? document.getElementById(ids.head) : null;
    const emptyEl = ids.empty ? document.getElementById(ids.empty) : null;
    const allBrands = getBrands(c);
    if (head) head.hidden = allBrands.length === 0;
    grid.hidden = allBrands.length === 0 && !ids.fixedCats;

    function show(list, instant, isFiltered) {
      buildWorkCards(grid, list, instant);
      if (emptyEl) {
        emptyEl.hidden = list.length > 0;
        emptyEl.textContent = isFiltered
          ? "이 카테고리에는 아직 등록된 작업이 없어요."
          : "아직 등록된 작업이 없습니다.";
      }
    }

    const used = [...new Set(allBrands.map(catOf).filter(Boolean))];
    const cats = ids.fixedCats
      ? [...CAT_ORDER, ...used.filter(u => !CAT_ORDER.includes(u))]
      : used.sort((a, b) => {
          const ia = CAT_ORDER.indexOf(a), ib = CAT_ORDER.indexOf(b);
          return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
        });

    if (fbar) {
      if (ids.fixedCats || (allBrands.length && cats.length >= 1)) {
        fbar.hidden = false;
        fbar.innerHTML = ["ALL", ...cats].map((cat, k) =>
          `<button class="fbtn ${k === 0 ? "on" : ""}" data-c="${esc(cat)}">${esc(cat)}</button>`).join("");
        fbar.querySelectorAll(".fbtn").forEach(btn => {
          btn.addEventListener("click", () => {
            fbar.querySelectorAll(".fbtn").forEach(x => x.classList.remove("on"));
            btn.classList.add("on");
            const cat = btn.dataset.c;
            show(cat === "ALL" ? allBrands : allBrands.filter(b => catOf(b) === cat), true, cat !== "ALL");
          });
        });
        hoverize(fbar);
      } else {
        fbar.hidden = true;
      }
    }
    show(allBrands, false, false);

    // preselect a category (e.g. /photo?cat=BEAUTY)
    if (ids.initialCat && fbar && !fbar.hidden) {
      const target = fbar.querySelector(`.fbtn[data-c="${CSS.escape(ids.initialCat.toUpperCase())}"]`);
      if (target) target.click();
    }
    return allBrands;
  }

  // ---------- videos ----------
  // 세로(쇼츠) 영상에만 실제 세로 썸네일 oardefault.jpg가 존재 → 로드된 이미지가 세로 비율이면
  // 세로 프레임(.vert)으로 전환. 가로 영상은 404 placeholder(120x90)가 내려오므로
  // 크기 비교 후 가로 썸네일(hq720 → hqdefault)로 폴백
  function vidCell(v) {
    const id = esc(v.youtubeId);
    const t = esc(v.title || "");
    return `
      <div class="vthumb" role="button" tabindex="0" data-yid="${id}" data-title="${t}" aria-label="${t || "video"} 재생">
        <div class="frame">
          <img src="https://i.ytimg.com/vi/${id}/oardefault.jpg" alt="${t || "video"}" loading="lazy" crossorigin="anonymous"
            onload="if(this.naturalHeight>this.naturalWidth){this.closest('.vthumb').classList.add('vert')}else if(!this.dataset.f){this.dataset.f=1;this.src='https://i.ytimg.com/vi/${id}/hq720.jpg'}else{HM.pbCheck(this)}"
            onerror="if(this.dataset.f){this.onerror=null;this.src='https://i.ytimg.com/vi/${id}/hqdefault.jpg'}else{this.dataset.f=1;this.src='https://i.ytimg.com/vi/${id}/hq720.jpg'}">
          <span class="vplay">▶</span>
        </div>
        ${t ? `<div class="vtitle">${t}</div>` : ""}
      </div>`;
  }
  // 세로 영상을 일반 업로드해서 가로 썸네일에 검은 필러박스가 박힌 경우 감지.
  // 양쪽에 폭 18% 이상의 순수 검정 바가 있으면 vert 처리 — 9:16 cover 크롭이
  // 바를 잘라내고, /video에선 쇼츠 그리드로 이동한다.
  function pbCheck(img) {
    try {
      const W = 128, H = 72;
      const cv = document.createElement("canvas");
      cv.width = W; cv.height = H;
      const cx = cv.getContext("2d");
      cx.drawImage(img, 0, 0, W, H); // img는 crossorigin=anonymous로 로드되어 캔버스 taint 없음
      const px = cx.getImageData(0, 0, W, H).data;
      const col = x => { let s = 0; for (let y = 0; y < H; y++) { const i = (y * W + x) * 4; s += px[i] + px[i + 1] + px[i + 2]; } return s / H / 3; };
      let L = 0; while (L < W / 2 && col(L) < 8) L++;
      let R = 0; while (R < W / 2 && col(W - 1 - R) < 8) R++;
      // 9:16 필러박스는 바가 각 34%, 1:1(정사각)은 각 21.9% → 18% 이상이면 세로 취급
      if (L / W >= 0.18 && R / W >= 0.18) img.closest(".vthumb").classList.add("vert");
    } catch (e) {} // CORS 미지원 등으로 실패하면 가로 썸네일 그대로 둠
  }
  function wireVidCells(el) {
    el.querySelectorAll(".vthumb").forEach(cell => {
      const open = () => openVideoLightbox(cell.dataset.yid, cell.dataset.title, cell.classList.contains("vert"));
      cell.addEventListener("click", open);
      cell.addEventListener("keydown", e => { if (e.key === "Enter") open(); });
    });
    hoverize(el);
  }
  function renderVideoList(c, el, shortsEl) {
    const vids = (c.videos || []).filter(v => v.youtubeId);
    el.innerHTML = vids.map(vidCell).join("");
    wireVidCells(el);
    // 세로(쇼츠)로 판별된 셀은 쇼츠 그리드로 옮겨 썸네일 크기를 통일 (리스너는 노드와 함께 이동)
    if (shortsEl) {
      new MutationObserver(list => list.forEach(m => {
        if (m.target.classList && m.target.classList.contains("vert") && m.target.parentElement === el)
          shortsEl.appendChild(m.target);
      })).observe(el, { subtree: true, attributes: true, attributeFilter: ["class"] });
    }
    return vids.length;
  }
  // 홈: Selected Work와 같은 한 줄 자동 롤링 스트립
  function renderVideoStrip(c, el) {
    const vids = (c.videos || []).filter(v => v.youtubeId);
    if (vids.length) {
      const half = vids.map(vidCell).join("");
      el.innerHTML = half + half;
      el.style.animationDuration = Math.max(40, vids.length * 5) + "s";
      wireVidCells(el);
    }
    return vids.length;
  }

  // ---------- video lightbox ----------
  let vlbBuilt = false;
  function ensureVideoLightbox() {
    if (vlbBuilt) return;
    vlbBuilt = true;
    const div = document.createElement("div");
    div.className = "lightbox";
    div.id = "vlightbox";
    div.setAttribute("role", "dialog");
    div.setAttribute("aria-modal", "true");
    div.setAttribute("aria-label", "영상 재생");
    div.innerHTML = `
      <button class="lb-btn lb-close" id="vlbClose" aria-label="닫기">×</button>
      <div class="vlb-frame" id="vlbFrame"></div>
      <div class="lb-caption"><span class="t" id="vlbTitle"></span></div>`;
    document.body.appendChild(div);
    const close = () => {
      div.classList.remove("open");
      document.body.classList.remove("lb-lock");
      document.getElementById("vlbFrame").innerHTML = ""; // iframe 제거 = 재생 정지
    };
    document.getElementById("vlbClose").addEventListener("click", close);
    div.addEventListener("click", e => { if (e.target === div) close(); });
    addEventListener("keydown", e => { if (div.classList.contains("open") && e.key === "Escape") close(); });
    hoverize(div);
  }
  function openVideoLightbox(id, title, vert) {
    ensureVideoLightbox();
    const frame = document.getElementById("vlbFrame");
    frame.classList.toggle("vert", !!vert);
    frame.innerHTML = `<iframe src="https://www.youtube.com/embed/${esc(id)}?autoplay=1&rel=0&playsinline=1" title="${esc(title || "video")}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    document.getElementById("vlbTitle").textContent = title || "";
    document.getElementById("vlightbox").classList.add("open");
    document.body.classList.add("lb-lock");
  }

  // ---------- stats ----------
  function fillStats(c, el) {
    const st = (c.stats || []).filter(s => s.label);
    el.hidden = st.length === 0;
    // 인라인 grid-template-columns 대신 변수만 지정 — 모바일 1열 미디어쿼리가 살아있도록
    el.style.setProperty("--stat-cols", Math.min(st.length, 3) || 1);
    el.innerHTML = st.map(s => `
      <div class="reveal"><div class="num" data-count="${Number(s.value) || 0}">0</div><div class="label">${esc(s.label)}</div></div>`).join("");
    return st.length;
  }

  // ---------- nav + footer ----------
  function getNav(c) {
    const saved = Array.isArray(c.nav) && c.nav.length ? c.nav : DEFAULT_NAV;
    // ensure all known keys exist (new pages appear even for old saved data)
    const byKey = Object.fromEntries(saved.map(n => [n.key, n]));
    const merged = saved.filter(n => DEFAULT_NAV.some(d => d.key === n.key));
    DEFAULT_NAV.forEach((d, idx) => { if (!byKey[d.key]) merged.splice(idx, 0, { ...d }); });
    return merged;
  }
  function fillNav(c, active) {
    const nav = document.getElementById("siteNav");
    if (!nav) return;
    // 회사소개서가 등록돼 있으면 Contact 바로 옆에 링크 추가 (푸터와 동일 조건)
    const bHref = c.brochure && (c.brochure.url || c.brochure.pdf);
    let brochureLink = bHref
      ? `<a href="${esc(bHref)}" target="_blank" rel="noopener">회사소개서</a>` : "";
    const items = getNav(c).filter(n => n.visible !== false).map(n => {
      const href = n.key === "home" ? "/" : "/" + esc(n.key);
      const link = `<a href="${href}" class="${n.key === active ? "active" : ""}">${esc(n.label || n.key)}</a>`;
      let out = link;
      if (n.key === "photo") {
        const sub = CAT_ORDER.map(cat =>
          `<a href="/photo?cat=${encodeURIComponent(cat)}">${esc(CAT_LABELS[cat] || cat)}</a>`).join("");
        out = `<span class="nav-sub-wrap">${link}<span class="nav-sub">${sub}</span></span>`;
      }
      if (n.key === "contact" && brochureLink) { out += brochureLink; brochureLink = ""; }
      return out;
    });
    nav.innerHTML = items.join("") + brochureLink + `<a class="nav-cta" href="/contact">문의하기</a>`;
    initNavToggle(nav);
  }
  // 모바일 햄버거 메뉴 (≤720px에서만 CSS로 표시)
  function initNavToggle(nav) {
    const header = document.querySelector("header");
    if (!header || document.getElementById("navToggle")) return;
    const btn = document.createElement("button");
    btn.id = "navToggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "메뉴 열기");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = "<span></span><span></span><span></span>";
    header.appendChild(btn);
    const set = open => {
      document.body.classList.toggle("nav-open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    };
    btn.addEventListener("click", e => { e.stopPropagation(); set(!document.body.classList.contains("nav-open")); });
    nav.addEventListener("click", e => { if (e.target.closest("a")) set(false); });
    document.addEventListener("click", e => {
      if (document.body.classList.contains("nav-open") && !e.target.closest("header")) set(false);
    });
  }
  function fillFooter(c) {
    const bio = document.getElementById("footerBio");
    if (!bio) return;
    bio.textContent = c.footer.bio || "";
    const socials = (c.footer.socials || []).filter(s => s.name);
    document.getElementById("footerSocials").innerHTML = socials.map(s =>
      `<li><a href="${esc(s.url || "#")}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`).join("") || "<li>—</li>";
    document.getElementById("footerContact").innerHTML = [
      c.cta.email ? `<li><a href="mailto:${esc(c.cta.email)}">${esc(c.cta.email)}</a></li>` : "",
      c.footer.phone ? `<li><a href="tel:${esc(c.footer.phone.replace(/[^0-9+]/g, ""))}">${esc(c.footer.phone)}</a></li>` : "",
      c.footer.location ? `<li><a href="#">${esc(c.footer.location)}</a></li>` : "",
      // PDF가 등록돼 있으면 웹 뷰어 대신 파일 바로 다운로드 (이미지 로딩 대기 없음)
      c.brochure && c.brochure.pdf ? `<li><a href="${esc(c.brochure.pdf)}" download="STUDIO-HOLYMOLLY_회사소개서.pdf">회사소개서 (PDF) ↓</a></li>`
        : c.brochure && c.brochure.url ? `<li><a href="${esc(c.brochure.url)}" target="_blank" rel="noopener">회사소개서 (PDF) ↓</a></li>` : ""
    ].join("");
    const bottom = document.querySelector("footer .bottom");
    if (c.footer.business && bottom && !document.querySelector("footer .bizline")) {
      bottom.insertAdjacentHTML("beforebegin", `<div class="bizline">${esc(c.footer.business)}</div>`);
    }
  }

  // ---------- floating kakao chat button ----------
  function initChatFab(c) {
    const kakao = (c.footer.socials || []).find(s => s.name === "KakaoTalk" && s.url);
    if (!kakao || document.getElementById("chatFab")) return;
    // pf.kakao.com 채널 주소면 바로 1:1 채팅창으로 연결
    let url = kakao.url;
    if (/pf\.kakao\.com\/[^/]+\/?$/.test(url)) url = url.replace(/\/$/, "") + "/chat";
    const a = document.createElement("a");
    a.id = "chatFab";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "카카오톡 채널로 문의하기");
    a.innerHTML = "💬 카톡 문의";
    document.body.appendChild(a);
  }

  // ---------- reveal + counters ----------
  function initReveal() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        if (performance.now() < 1500) e.target.style.transition = "none";
        e.target.classList.add("on");
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    document.querySelectorAll(".reveal:not(.on)").forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) {
        el.style.transition = "none";
        el.classList.add("on");
      } else {
        io.observe(el);
      }
    });
  }
  function initCounters() {
    const cio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target, target = +el.dataset.count, dur = 1400, t0 = performance.now();
        (function tick(t) {
          const p = Math.min((t - t0) / dur, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + "+";
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
        cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll(".num").forEach(el => cio.observe(el));
  }

  // ---------- boot ----------
  async function boot(active, main) {
    initCursor();
    const fetched = await fetchContent();
    const c = { ...DEFAULTS, ...fetched };
    c.hero = { ...DEFAULTS.hero, ...(fetched.hero || {}) };
    c.cta = { ...DEFAULTS.cta, ...(fetched.cta || {}) };
    c.footer = { ...DEFAULTS.footer, ...(fetched.footer || {}) };
    fillNav(c, active);
    fillFooter(c);
    initChatFab(c);
    if (main) await main(c);
    initReveal();
    initCounters();
    hoverize(document);
  }

  return { boot, esc, catOf, getBrands, openLightbox, renderPortfolio, renderVideoList, renderVideoStrip, fillStats, pbCheck };
})();
