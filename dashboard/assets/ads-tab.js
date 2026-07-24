// '메타 광고' 탭 업그레이드 — 탭이 열리면 기존 내용 대신 /ads(광고 효율) 화면을 그 자리에 띄움.
// 빌드된 번들은 건드리지 않고 DOM 위에서만 동작하는 오버레이 방식.
(() => {
  const LABEL = '메타 광고'
  const ID = 'hm-ads-embed'

  const st = document.createElement('style')
  st.textContent =
    '.hm-ads-takeover > :not(#' + ID + '){display:none!important}' +
    '#' + ID + '{margin:-22px -26px -60px}' + // .content 패딩 상쇄 — 탭 영역에 꽉 차게
    '#' + ID + ' iframe{display:block;width:100%;border:0}'
  document.head.appendChild(st)

  function tick() {
    const h2 = document.querySelector('.main .topbar h2')
    const content = document.querySelector('.main .content')
    const active = !!(h2 && h2.textContent.trim() === LABEL && content)
    let box = document.getElementById(ID)

    if (active) {
      content.classList.add('hm-ads-takeover')
      if (!box || box.parentElement !== content) {
        if (box) box.remove()
        box = document.createElement('div')
        box.id = ID
        const f = document.createElement('iframe')
        f.src = '/ads?embed=1'
        f.title = '광고 효율'
        box.appendChild(f)
        content.appendChild(box)
      }
      const f = box.firstChild
      const top = box.getBoundingClientRect().top
      const h = Math.max(420, window.innerHeight - Math.max(0, top))
      if (f.style.height !== h + 'px') f.style.height = h + 'px'
    } else {
      if (box) box.remove()
      document.querySelectorAll('.hm-ads-takeover').forEach(el => el.classList.remove('hm-ads-takeover'))
    }
  }

  new MutationObserver(tick).observe(document.body, { childList: true, subtree: true, characterData: true })
  window.addEventListener('resize', tick)
  setInterval(tick, 800) // 안전망 — 옵저버가 놓친 상태 변화 보정
  tick()
})()
