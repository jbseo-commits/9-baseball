// 꿈을 잃은 세계: 설정집과 원고를 읽고, 쓰고, GitHub에 바로 저장하는 웹
const REPO = { owner: 'jjsjb88-alt', name: 'lost-dreams-novel', branch: 'main' };
const API = `https://api.github.com/repos/${REPO.owner}/${REPO.name}`;
const GH = `https://github.com/${REPO.owner}/${REPO.name}`;
const TOKEN_PAGE = 'https://github.com/settings/personal-access-tokens/new';

// 브라우저 저장소는 막혀 있을 수 있으니 항상 감싸서 쓴다
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
const TOKEN_KEY = 'ldn-token';
const draftKey = path => `ldn-draft:${path || 'new'}`;

let manifest = { settings: [], manuscript: [] };

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = text => DOMPurify.sanitize(marked.parse(text));
const pad = n => String(n).padStart(3, '0');
const token = () => store.get(TOKEN_KEY);
const countChars = t => ({ all: t.length, noSpace: t.replace(/\s/g, '').length });

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4000);
}

// ---------- GitHub API ----------
function ghHeaders(extra = {}) {
  const h = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...extra };
  if (token()) h.Authorization = `Bearer ${token()}`;
  return h;
}

const toBase64 = text => {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const fromBase64 = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), c => c.charCodeAt(0)));

// 최신 내용과 sha. 연결돼 있으면 API에서 바로 읽어서 방금 저장한 것도 보인다.
async function loadFile(path) {
  if (token()) {
    const r = await fetch(`${API}/contents/${path}?ref=${REPO.branch}`, { headers: ghHeaders(), cache: 'no-store' });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`GitHub 응답 ${r.status}`);
    const j = await r.json();
    return { text: fromBase64(j.content), sha: j.sha };
  }
  const r = await fetch(path, { cache: 'no-store' });
  if (!r.ok) return null;
  return { text: await r.text(), sha: null };
}

async function saveFile(path, text, message, sha) {
  const body = { message, content: toBase64(text), branch: REPO.branch };
  if (sha) body.sha = sha;
  const r = await fetch(`${API}/contents/${path}`, { method: 'PUT', headers: ghHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
  if (r.ok) return (await r.json()).content.sha;
  if (r.status === 409 || (r.status === 422 && !sha)) throw new Error('conflict');
  if (r.status === 401) throw new Error('token');
  if (r.status === 403 || r.status === 404) throw new Error('permission');
  throw new Error(`GitHub 응답 ${r.status}`);
}

// 목록: 배포 때 만든 manifest.json. 없거나 연결돼 있으면 GitHub에서 최신 목록을 읽는다.
async function listDir(dir) {
  const r = await fetch(`${API}/contents/${dir}?ref=${REPO.branch}`, { headers: ghHeaders(), cache: 'no-store' });
  if (!r.ok) return [];
  const files = (await r.json()).filter(f => f.name.endsWith('.md')).sort((a, b) => a.name.localeCompare(b.name));
  return files.map(f => ({ path: f.path, title: f.name.replace(/\.md$/, ''), chars: null }));
}

async function loadManifest() {
  try {
    const r = await fetch('manifest.json', { cache: 'no-store' });
    if (r.ok) manifest = await r.json();
  } catch {}
  if (token() || !manifest.settings.length) {
    const titled = new Map([...manifest.settings, ...manifest.manuscript].map(i => [i.path, i]));
    const fresh = async dir => (await listDir(dir)).map(i => titled.get(i.path) || i);
    const [settings, manuscript] = await Promise.all([fresh('settings'), fresh('manuscript')]);
    if (settings.length || manuscript.length) manifest = { ...manifest, settings, manuscript };
  }
}

// ---------- 화면 ----------
function renderNav(active) {
  const item = i => `<li><a href="#/read/${i.path}" class="${i.path === active ? 'active' : ''}">${esc(i.title)}</a></li>`;
  $('#settingsList').innerHTML = manifest.settings.map(item).join('') || '<li class="empty">아직 없어요</li>';
  $('#manuscriptList').innerHTML = manifest.manuscript.map(item).join('') || '<li class="empty">아직 원고가 없어요</li>';
}

function connectBadge() {
  return token()
    ? `<a class="badge ok" href="#/connect">GitHub 연결됨</a>`
    : `<a class="badge" href="#/connect">GitHub 연결하기</a>`;
}

function viewHome() {
  renderNav(null);
  const total = manifest.manuscript.reduce((s, i) => s + (i.chars || 0), 0);
  const latest = manifest.manuscript.at(-1);
  $('#main').innerHTML = `
    <section class="home">
      <p class="eyebrow">장편소설 · 설정집과 원고</p>
      <h1>꿈을 잃은 세계</h1>
      <p class="lead">채팅에서 쓴 글을 붙여넣고 저장하면 GitHub 저장소가 바로 바뀌어요. 어떤 AI든 그 저장소를 읽고 이어서 쓸 수 있어요.</p>
      <div class="actions">
        <a class="btn primary" href="#/write">새 화 쓰기</a>
        ${latest ? `<a class="btn" href="#/read/${latest.path}">최근 원고 읽기</a>` : ''}
        ${connectBadge()}
      </div>
      <dl class="stats">
        <div><dt>설정</dt><dd>${manifest.settings.length}개</dd></div>
        <div><dt>원고</dt><dd>${manifest.manuscript.length}화</dd></div>
        <div><dt>총 글자 수</dt><dd>${total ? total.toLocaleString('ko-KR') + '자' : '-'}</dd></div>
      </dl>
      <h2>설정집</h2>
      <ol class="cards">
        ${manifest.settings.map(i => `<li><a href="#/read/${i.path}">${esc(i.title)}</a></li>`).join('')}
      </ol>
    </section>`;
}

async function viewRead(path) {
  renderNav(path);
  const main = $('#main');
  main.innerHTML = '<p class="muted">불러오는 중…</p>';
  let file;
  try { file = await loadFile(path); } catch (e) { file = null; }
  if (!file) {
    main.innerHTML = `<p class="muted">이 파일을 불러오지 못했어요. 방금 저장했다면 1~2분 뒤 다시 열어보세요.</p>`;
    return;
  }
  const isMs = path.startsWith('manuscript/');
  const list = isMs ? manifest.manuscript : manifest.settings;
  const idx = list.findIndex(i => i.path === path);
  const prev = idx > 0 ? list.at(idx - 1) : null;
  const next = idx >= 0 && idx < list.length - 1 ? list.at(idx + 1) : null;
  const c = countChars(file.text);
  main.innerHTML = `
    <div class="doc-bar">
      <span class="muted">${isMs ? `공백 제외 ${c.noSpace.toLocaleString('ko-KR')}자` : '설정'}</span>
      <a class="btn small" href="#/edit/${path}">고치기</a>
    </div>
    <article class="prose ${isMs ? 'manuscript' : ''}">${md(file.text)}</article>
    <nav class="pager">
      ${prev ? `<a href="#/read/${prev.path}">← ${esc(prev.title)}</a>` : '<span></span>'}
      ${next ? `<a href="#/read/${next.path}">${esc(next.title)} →</a>` : '<span></span>'}
    </nav>`;
  main.focus();
  window.scrollTo(0, 0);
}

async function nextEpisodeNumber() {
  const nums = manifest.manuscript.map(i => Number((i.path.match(/ep(\d+)\.md$/) || [])[1] || 0));
  return Math.max(0, ...nums) + 1;
}

async function viewEditor(path) {
  renderNav(path);
  const main = $('#main');
  const isNew = !path;
  let sha = null, original = '';
  if (!isNew) {
    main.innerHTML = '<p class="muted">불러오는 중…</p>';
    try {
      const f = await loadFile(path);
      if (f) { original = f.text; sha = f.sha; }
    } catch {}
  }
  const n = isNew ? await nextEpisodeNumber() : null;
  const saved = store.get(draftKey(path));
  let draft = saved ? JSON.parse(saved) : null;

  main.innerHTML = `
    <section class="editor">
      <h1>${isNew ? '새 화 쓰기' : `고치기 · <span class="muted">${esc(path)}</span>`}</h1>
      <p class="muted">${isNew ? '채팅에서 쓴 글을 본문에 그대로 붙여넣어도 돼요.' : '채팅에서 정리한 내용으로 통째로 바꾸려면 전체 선택 후 붙여넣으세요.'} 쓰는 동안 이 브라우저에 자동으로 임시 저장돼요.</p>
      ${draft ? `<p class="notice">임시 저장된 글을 불러왔어요. <button class="link" id="discard">버리고 원래대로</button></p>` : ''}
      ${isNew ? `
        <div class="row">
          <label>화 번호<input id="epNum" type="number" min="1" value="${draft?.num ?? n}"></label>
          <label class="grow">제목<input id="epTitle" type="text" placeholder="예: 광고가 끝난 밤" value="${esc(draft?.title ?? '')}"></label>
        </div>` : ''}
      <label class="grow">본문
        <textarea id="body" spellcheck="false" placeholder="여기에 쓰거나 붙여넣으세요">${esc(draft?.body ?? original)}</textarea>
      </label>
      <div class="editor-foot">
        <span class="muted" id="count"></span>
        <label class="grow">저장 메모<input id="msg" type="text" value=""></label>
        <button class="btn primary" id="save">GitHub에 저장</button>
      </div>
      ${token() ? '' : `<p class="notice">아직 GitHub에 연결되지 않았어요. <a href="#/connect">한 번만 연결</a>해두면 이 버튼으로 바로 저장돼요. 연결 전에는 GitHub 편집 화면을 열어드려요.</p>`}
    </section>`;

  const body = $('#body'), msg = $('#msg');
  const num = () => Number($('#epNum')?.value || n);
  const title = () => ($('#epTitle')?.value || '').trim();
  const target = () => isNew ? `manuscript/ep${pad(num())}.md` : path;
  const content = () => isNew ? `# 제${num()}화. ${title() || '제목 없음'}\n\n${body.value.trim()}\n` : body.value;
  const defaultMsg = () => isNew ? `원고: 제${num()}화 ${title()}`.trim() : `${path.startsWith('settings/') ? '설정' : '원고'}: ${path.split('/').at(-1)} 수정`;
  msg.value = defaultMsg();

  const update = () => {
    const c = countChars(body.value);
    $('#count').textContent = `공백 포함 ${c.all.toLocaleString('ko-KR')}자 · 제외 ${c.noSpace.toLocaleString('ko-KR')}자`;
    store.set(draftKey(path), JSON.stringify({ body: body.value, num: isNew ? num() : undefined, title: isNew ? title() : undefined }));
  };
  [body, $('#epNum'), $('#epTitle')].forEach(el => el?.addEventListener('input', () => {
    update();
    if (el !== body) msg.value = defaultMsg();
  }));
  update();
  if (!draft) store.del(draftKey(path));

  $('#discard')?.addEventListener('click', () => { store.del(draftKey(path)); viewEditor(path); });

  $('#save').addEventListener('click', async () => {
    if (!body.value.trim()) return toast('본문이 비어 있어요.');
    if (!token()) return openGitHubEditor(target(), content(), isNew);
    const btn = $('#save');
    btn.disabled = true;
    btn.textContent = '저장 중…';
    try {
      await saveFile(target(), content(), msg.value.trim() || defaultMsg(), isNew ? null : sha);
      store.del(draftKey(path));
      toast('GitHub에 저장했어요. 웹사이트 목록에는 1~2분 뒤 반영돼요.');
      if (isNew && !manifest.manuscript.some(i => i.path === target())) {
        manifest.manuscript.push({ path: target(), title: `제${num()}화. ${title() || '제목 없음'}`, chars: countChars(body.value).noSpace });
      }
      location.hash = `#/read/${target()}`;
    } catch (e) {
      const why = {
        conflict: isNew ? '이미 같은 번호의 화가 있어요. 화 번호를 바꿔주세요.' : '그사이 다른 곳(AI 등)에서 이 파일이 바뀌었어요. 글은 임시 저장돼 있으니 복사해두고, 새로고침해서 최신 내용을 확인해주세요.',
        token: '토큰이 만료됐거나 잘못됐어요. 다시 연결해주세요.',
        permission: '이 토큰에는 저장 권한이 없어요. 연결 화면의 안내대로 권한을 확인해주세요.',
      }[e.message] || `저장하지 못했어요 (${e.message}).`;
      toast(why);
      btn.disabled = false;
      btn.textContent = 'GitHub에 저장';
    }
  });
}

async function openGitHubEditor(path, text, isNew) {
  try { await navigator.clipboard.writeText(text); } catch {}
  const dir = path.split('/').slice(0, -1).join('/');
  const file = path.split('/').at(-1);
  const url = isNew ? `${GH}/new/${REPO.branch}/${dir}?filename=${encodeURIComponent(file)}` : `${GH}/edit/${REPO.branch}/${path}`;
  window.open(url, '_blank', 'noopener');
  toast('글을 복사했어요. 열린 GitHub 화면에 붙여넣고 Commit changes를 누르세요.');
}

function viewConnect() {
  renderNav(null);
  $('#main').innerHTML = `
    <section class="connect">
      <h1>GitHub 연결</h1>
      <p>한 번만 연결해두면 이 웹에서 쓴 글이 저장 버튼 하나로 저장소에 올라가요. 연결 정보(토큰)는 <strong>이 브라우저에만</strong> 저장되고, 다른 곳으로는 보내지 않아요.</p>
      ${token() ? `
        <p class="notice ok">지금 연결돼 있어요.</p>
        <button class="btn" id="disconnect">연결 끊기</button>` : `
        <ol class="steps">
          <li><a href="${TOKEN_PAGE}" target="_blank" rel="noopener">GitHub 토큰 만들기 화면</a>을 열어요.</li>
          <li><b>Token name</b>은 아무거나 (예: 소설 웹), <b>Expiration</b>은 원하는 기간으로 정해요.</li>
          <li><b>Repository access</b>에서 <b>Only select repositories</b>를 고르고 <code>${REPO.name}</code> 하나만 선택해요.</li>
          <li><b>Permissions → Repository permissions → Contents</b>를 <b>Read and write</b>로 바꿔요.</li>
          <li><b>Generate token</b>을 누르고, 나온 값을 복사해서 아래에 붙여넣어요.</li>
        </ol>
        <label>토큰<input id="tokenInput" type="password" autocomplete="off" placeholder="github_pat_로 시작하는 값"></label>
        <button class="btn primary" id="connectBtn">연결</button>
        <p class="muted small">토큰은 비밀번호와 같아요. 다른 사람에게 보여주거나 채팅에 붙여넣지 마세요. 공용 PC에서는 쓰지 않는 게 좋아요.</p>`}
    </section>`;

  $('#disconnect')?.addEventListener('click', () => { store.del(TOKEN_KEY); toast('연결을 끊었어요.'); viewConnect(); });
  $('#connectBtn')?.addEventListener('click', async () => {
    const t = $('#tokenInput').value.trim();
    if (!t) return toast('토큰을 붙여넣어 주세요.');
    const r = await fetch(API, { headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${t}` } }).catch(() => null);
    if (!r || !r.ok) return toast('이 토큰으로는 저장소에 접근할 수 없어요. 저장소 선택을 확인해주세요.');
    const j = await r.json();
    if (!j.permissions?.push) return toast('읽기만 되는 토큰이에요. Contents를 Read and write로 바꿔주세요.');
    store.set(TOKEN_KEY, t);
    toast('연결됐어요. 이제 저장 버튼으로 바로 올라가요.');
    await loadManifest();
    location.hash = '#/';
  });
}

// ---------- 라우터 ----------
function route() {
  const h = decodeURIComponent(location.hash.slice(1)) || '/';
  document.body.classList.remove('nav-open');
  $('#menuBtn').setAttribute('aria-expanded', 'false');
  if (h.startsWith('/read/')) return viewRead(h.slice(6));
  if (h.startsWith('/edit/')) return viewEditor(h.slice(6));
  if (h === '/write') return viewEditor(null);
  if (h === '/connect') return viewConnect();
  viewHome();
}

$('#menuBtn').addEventListener('click', () => {
  const open = document.body.classList.toggle('nav-open');
  $('#menuBtn').setAttribute('aria-expanded', String(open));
});
$('#repoLink').href = GH;
window.addEventListener('hashchange', route);

loadManifest().then(route);
