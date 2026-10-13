/* ===============================================================
   모아둠 (MOADUM) - app.js
   ===============================================================
   ★ 글씨를 바꾸고 싶으면 아래 [1. 화면 문구]만 수정하세요.
   ★ 따옴표 안쪽의 글자만 바꾸고, 쉼표(,)는 남겨두세요.
   ★ 수정 후 GitHub에 저장하면 Vercel이 자동 배포합니다.
   ★ 날짜 계산과 Supabase 연결 코드는 아래쪽에 있으므로
      글씨를 수정할 때 건드릴 필요가 없습니다.
   ★ HTML 태그는 화면을 만드는 코드라서 문구와 분리했습니다.
   =============================================================== */
(() => {
  'use strict';

  // =============================================================
  // [1. 화면 문구] ★ 여기만 수정하면 됩니다 ★
  // =============================================================
  const TEXT = {
    // (1) 웹앱 첫 화면
    brand:           'MOADUM',
    mainEyebrow:     'A LITTLE SPACE FOR EVERYTHING',
    mainTitle:       'MOADUM • 모아둠',
    mainSubtitle:    '링크 바로가기',
    mainFooter:      '가볍게 열고, 편하게 읽는 나만의 공간',

    // (2) 글 모음 타일 및 페이지
    libraryTile:     '글 모음',
    libraryEyebrow:  'TODAY & ARCHIVE',
    libraryTitle:    '글 모음',
    librarySubtitle: '오늘 읽을 글을 보고, 전체 원문도 언제든 찾아보세요.',
    todayTab:        '오늘의 글',
    allTab:          '전체 글',

    // (3) 첫 번째~네 번째 글 모음: 고정 화면 라벨
    firstLabel:      '첫 번째',
    secondLabel:     '두 번째',
    thirdLabel:      '세 번째',
    fourthLabel:     '네 번째',

    // (4) 관리자에게만 표시되는 간단한 버튼
    extraButton:     '+1 추가',
    pauseButton:     '하루 정지',
    undoButton:      '되돌리기'
  };

  // =============================================================
  // [2. 앱 기본 설정] 이하 일반적으로 수정할 필요 없음
  // =============================================================
  const ROOT = document.getElementById('app');
  const KEY = 'my-simple-hub-v1'; // 기존 로컬 데이터와 호환
  const SESSION_KEY = 'my-simple-hub-session';
  const GROUP_ORDER = ['first','eight','third','fixed'];
  const cfg = window.HUB_CONFIG || {};
  const remote = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  let state;
  let busy = false;
  let remoteStatus = remote ? '연결 중' : '이 브라우저만 저장';
  let selectedDate = koreanToday();
  let activeReadTab = 'today';
  let allFilter = 'all';
  let adminTab = 'links';
  let editGroup = 'first';
  let editNumber = 1;
  let iconEditing = -1;
  let toastTimer;
  let session = null;
  let lastSaveTime = null;
  const storageAvailable = (() => {
    try { localStorage.setItem('__hub_storage_test__','1'); localStorage.removeItem('__hub_storage_test__'); return true; }
    catch (_) { return false; }
  })();

  // =============================================================
  // [3. 아이콘] 모든 타일의 SVG 모양 / 아이콘 파일 업로드
  // =============================================================
  const SYMBOLS = {
    spark: '<path d="M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3z"/>',
    video: '<rect x="3" y="6" width="12" height="12" rx="2"/><path d="m15 10 6-3v10l-6-3"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
    users: '<path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 20v-2a4 4 0 0 0-3-3.9M16 3a4 4 0 0 1 0 8"/>',
    book: '<path d="M12 7C9 5 6 5 3 6v14c3-1 6-1 9 1 3-2 6-2 9-1V6c-3-1-6-1-9 1zM12 7v14"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18M12 3c5 5 5 13 0 18"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l2-2"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
    star: '<path d="m12 2 3.1 6.4 7.1 1-5.1 5 .9 7.1-6-3.3-6 3.3.9-7.1-5.1-5 7.1-1z"/>',
    document: '<path d="M6 3h8l5 5v13H6zM14 3v6h5M9 13h7M9 17h7"/>',
    bookmark: '<path d="M5 3h14v18l-7-5-7 5z"/>',
    music: '<path d="M9 19V6l12-3v13M9 9l12-3"/><circle cx="6" cy="19" r="3"/><circle cx="18" cy="16" r="3"/>',
    home: '<path d="m3 11 9-8 9 8v10h-6v-6H9v6H3z"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m4 19 6-6 3 3 3-4 5 6"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/>',
    phone: '<path d="M8 3H5L3 7c2 8 6 12 14 14l4-2v-3l-5-2-2 3c-3-1-5-3-7-7l3-2z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',
    map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16m6-14v16"/>',
    clipboard: '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5V3h6v2M9 11h6m-6 4h6"/>',
    cloud: '<path d="M6 18a5 5 0 0 1-.3-10A7 7 0 0 1 19 10a4 4 0 0 1-1 8z"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
    bolt: '<path d="m13 2-9 11h7l-1 9 10-12h-7z"/>',
    gift: '<rect x="3" y="10" width="18" height="11"/><path d="M2 7h20v4H2zM12 7v14M12 7c-7 0-7-6-3-6 2 0 3 3 3 6zm0 0c7 0 7-6 3-6-2 0-3 3-3 6z"/>',
    coffee: '<path d="M4 8h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 9h2a3 3 0 0 1 0 6h-2M8 2v3m5-3v3"/>',
    pen: '<path d="m3 21 4-1 13-13-3-3L4 17zM15 6l3 3"/>',
    camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/>',
    up: '<path d="M7 17 17 7M8 7h9v9"/>',
    right: '<path d="m5 12 14 0m-6-6 6 6-6 6"/>',
    left: '<path d="m19 12-14 0m6-6-6 6 6 6"/>',
    chevl: '<path d="m15 18-6-6 6-6"/>',
    chevr: '<path d="m9 18 6-6-6-6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a2 2 0 0 0 .4 2.2l-2 2a2 2 0 0 0-2.2-.4 2 2 0 0 0-1.6 1.6h-2.8a2 2 0 0 0-1.6-1.6 2 2 0 0 0-2.2.4l-2-2a2 2 0 0 0 .4-2.2 2 2 0 0 0-1.6-1.6v-2.8A2 2 0 0 0 5.8 9a2 2 0 0 0-.4-2.2l2-2a2 2 0 0 0 2.2.4 2 2 0 0 0 1.6-1.6h2.8a2 2 0 0 0 1.6 1.6 2 2 0 0 0 2.2-.4l2 2a2 2 0 0 0-.4 2.2 2 2 0 0 0 1.6 1.6v2.8a2 2 0 0 0-1.6 1.6z"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    pin: '<path d="m16 3 5 5-4 1-3 3-2 9-2-9-3-3-4-1 5-5z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    undo: '<path d="M9 9H4V4M4 9a8 8 0 1 1-.1 5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    logout: '<path d="M10 17l5-5-5-5m5 5H3m10-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>'
  };
  const ICON_OPTIONS = [
    ['video','영상'],['folder','폴더'],['search','검색'],['layers','모아보기'],
    ['users','사람'],['book','책'],['globe','지구'],['link','링크'],
    ['calendar','달력'],['heart','하트'],['star','별'],['document','문서'],
    ['bookmark','북마크'],['music','음악'],['home','집'],['image','이미지'],
    ['mail','메일'],['phone','전화'],['clock','시계'],['map','지도'],
    ['clipboard','목록'],['cloud','클라우드'],['play','재생'],['bolt','번개'],
    ['gift','선물'],['coffee','커피'],['pen','연필'],['camera','카메라']
  ];
  const MAX_ICON_BYTES = 2 * 1024 * 1024;
  const MAX_ICON_DATA_LENGTH = 240000; // 업로드한 그림은 128px PNG로 줄여 저장
  const isIconImage = (value) => typeof value === 'string' && value.length <= MAX_ICON_DATA_LENGTH && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value);
  const e = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const svg = (key, size='') => `<svg class="icon ${size ? 'icon-'+size : ''}" viewBox="0 0 24 24" aria-hidden="true">${SYMBOLS[key] || SYMBOLS.book}</svg>`;
  function tileIcon(link,size='lg'){
    return isIconImage(link?.image)
      ? `<img class="tile-image ${size==='lg'?'':'tile-image-small'}" alt="" src="${e(link.image)}">`
      : svg(SYMBOLS[link?.icon] ? link.icon : 'folder',size);
  }
  // 외부 SVG에서 코드/외부 파일 참조를 제거한 후 캔버스에 그려 PNG로 저장합니다.
  function safeSvgSource(text){
    if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('지원하지 않는 SVG 형식이에요.');
    const doc=new DOMParser().parseFromString(text,'image/svg+xml');
    if(doc.querySelector('parsererror') || doc.documentElement?.localName!=='svg')throw Error('올바른 SVG 파일을 선택해 주세요.');
    const tags=new Set('svg g path rect circle ellipse polygon polyline line defs linearGradient radialGradient stop text tspan clipPath'.toLowerCase().split(' '));
    const attrs=new Set('xmlns viewBox width height fill fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray stroke-dashoffset stroke-opacity opacity d cx cy r rx ry x y x1 y1 x2 y2 points transform offset stop-color stop-opacity gradientUnits gradientTransform fx fy id clip-path font-size font-family font-weight text-anchor'.toLowerCase().split(' '));
    const clean=(el)=>{
      for(const child of [...el.children]){
        if(!tags.has(child.localName.toLowerCase()))child.remove();
        else clean(child);
      }
      for(const attr of [...el.attributes]){
        const key=attr.name.toLowerCase(),v=attr.value;
        const safeReference=/^url\(#[a-zA-Z_][\w-]*\)$/.test(v);
        if(!attrs.has(key) || /[<>]/.test(v) || (/(?:url\(|javascript:|data:|https?:)/i.test(v) && !safeReference))el.removeAttribute(attr.name);
      }
    };
    clean(doc.documentElement);
    doc.documentElement.setAttribute('xmlns','http://www.w3.org/2000/svg');
    return new XMLSerializer().serializeToString(doc.documentElement);
  }
  async function convertIconFile(file){
    if(file.size > MAX_ICON_BYTES)throw Error('이미지는 2MB 이하로 선택해 주세요.');
    const isSvg=file.type==='image/svg+xml' || /\.svg$/i.test(file.name);
    const rasterTypes=['image/png','image/jpeg','image/webp'];
    if(!isSvg && !rasterTypes.includes(file.type))throw Error('PNG, JPG, WEBP, SVG 이미지만 지원해요.');
    const blob=isSvg?new Blob([safeSvgSource(await file.text())],{type:'image/svg+xml'}):file;
    const url=URL.createObjectURL(blob);
    try{
      const img=await new Promise((resolve,reject)=>{
        const element=new Image();
        element.onload=()=>resolve(element);
        element.onerror=()=>reject(Error('이미지를 읽을 수 없어요. 다른 파일을 선택해 주세요.'));
        element.src=url;
      });
      if(!img.naturalWidth || !img.naturalHeight)throw Error('크기를 확인할 수 없는 이미지예요.');
      const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
      const ctx=canvas.getContext('2d');if(!ctx)throw Error('브라우저에서 이미지 처리가 지원되지 않아요.');
      const ratio=Math.min(112/img.naturalWidth,112/img.naturalHeight);
      const w=img.naturalWidth*ratio,h=img.naturalHeight*ratio;
      ctx.clearRect(0,0,128,128);
      ctx.drawImage(img,(128-w)/2,(128-h)/2,w,h);
      const result=canvas.toDataURL('image/png');
      if(!isIconImage(result))throw Error('이미지가 너무 복잡해요. 작은 이미지로 다시 시도해 주세요.');
      return result;
    }finally{URL.revokeObjectURL(url);}
  }
  const monday = ['일','월','화','수','목','금','토'];
  function koreanToday() {
    return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  }
  function parseDate(str){const [y,m,d]=str.split('-').map(Number);return new Date(Date.UTC(y,m-1,d));}
  function isoDate(d){return d.toISOString().slice(0,10);}
  function addDays(str,n){const d=parseDate(str);d.setUTCDate(d.getUTCDate()+n);return isoDate(d);}
  function dayDiff(a,b){return Math.round((parseDate(a).getTime()-parseDate(b).getTime())/86400000);}
  function mod(a,n){return ((a%n)+n)%n;}
  function validDate(s){return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)) && isoDate(parseDate(s))===s;}
  function fmtDate(str,weekday=true){if(!validDate(str))return str;const d=parseDate(str);return `${d.getUTCFullYear()}년 ${d.getUTCMonth()+1}월 ${d.getUTCDate()}일${weekday?' '+monday[d.getUTCDay()]+'요일':''}`;}
  function fmtShort(str){if(!validDate(str))return str;const d=parseDate(str);return `${d.getUTCMonth()+1}.${d.getUTCDate()}`;}
  function monthDays(y,m){return new Date(Date.UTC(y,m,0)).getUTCDate();}
  // =============================================================
  // [4. 데이터 구성 · 이전 버전 자동 호환]
  // 기존 세 번째(fixed)의 1~13번 글은 새 네 번째 모음으로 옮깁니다.
  // 과거 14번 글은 안전하게 unusedOldArticle14 속성에 보관합니다.
  // =============================================================
  function defaultState(){
    const mk=(prefix,i)=>({
      title:`${i}번 글`,
      body:`[예시 글 ${i}]\n\n${prefix}의 ${i}번 원문을 관리자 화면에서 입력해 주세요.\n줄바꿈과 문단을 그대로 유지해서 보여줍니다.`
    });
    return {
      schema:2,
      siteTitle:'모아둠',
      featureIcon:'book',featureImage:'',
      links:[
        {name:'Zoom',url:'',icon:'video',image:''},
        {name:'자료실',url:'',icon:'folder',image:''},
        {name:'경전검색',url:'',icon:'search',image:''},
        {name:'모아보기',url:'',icon:'layers',image:''},
        {name:'할 사람 찾기',url:'',icon:'users',image:''}
      ],
      groups:{
        first:{title:'첫 번째 글 모음',articles:Array.from({length:4},(_,i)=>mk('5일 구간',i+1))},
        eight:{title:'두 번째 글 모음',articles:Array.from({length:8},(_,i)=>mk('8일 순환',i+1))},
        third:{title:'세 번째 글 모음',articles:Array.from({length:8},(_,i)=>mk('정지 가능한 8일 순환',i+1))},
        fixed:{title:'네 번째 글 모음',articles:Array.from({length:13},(_,i)=>mk('고정 및 매일 순환',i+1))}
      },
      rules:{
        firstMode:'restart',firstAnchor:'2026-10-01',
        eightAnchor:'2026-10-13',thirdAnchor:'2026-10-13',fixedAnchor:'2026-10-13'
      },
      adjustments:{extraDays:[],pauseDays:[]},
      unusedOldArticle14:null
    };
  }

  function normalise(incoming){
    const def=defaultState();
    if(!incoming || typeof incoming!=='object')return def;
    if(typeof incoming.siteTitle==='string')def.siteTitle=incoming.siteTitle.slice(0,70);
    if(SYMBOLS[incoming.featureIcon])def.featureIcon=incoming.featureIcon;
    if(isIconImage(incoming.featureImage))def.featureImage=incoming.featureImage;
    if(Array.isArray(incoming.links)){
      def.links=incoming.links.slice(0,40).map(x=>({
        name:String(x?.name||'새 링크').slice(0,150),
        url:String(x?.url||'').slice(0,2000),
        icon:SYMBOLS[x?.icon]?x.icon:'folder',
        image:isIconImage(x?.image)?x.image:''
      }));
    }

    for(const key of GROUP_ORDER){
      const g=incoming.groups?.[key];
      if(!g || typeof g!=='object')continue;
      let title=String(g.title??def.groups[key].title).slice(0,90);
      // 3모음 → 4모음 업그레이드 시 옛 기본 제목만 바꿉니다.
      if(key==='fixed' && title==='세 번째 글 모음')title='네 번째 글 모음';
      def.groups[key].title=title;
      const target=def.groups[key].articles;
      for(let i=0;i<target.length;i++)if(g.articles?.[i]){
        target[i].title=String(g.articles[i].title??target[i].title).slice(0,150);
        target[i].body=String(g.articles[i].body??target[i].body).slice(0,200000);
      }
    }
    // 이전 14번은 새 화면에서 사용하지 않지만 덮어쓰거나 잃어버리지 않습니다.
    const old14=incoming.unusedOldArticle14 || incoming.groups?.fixed?.articles?.[13];
    if(old14 && typeof old14==='object')def.unusedOldArticle14={
      title:String(old14.title||'14번 글').slice(0,150),
      body:String(old14.body||'').slice(0,200000)
    };

    const r=incoming.rules||{};
    if(['restart','continuous'].includes(r.firstMode))def.rules.firstMode=r.firstMode;
    for(const k of ['firstAnchor','eightAnchor','fixedAnchor','thirdAnchor']){
      if(validDate(r[k]||''))def.rules[k]=r[k];
    }
    // 세 번째 모음이 새로 생겼다면 두 번째 모음과 기준일을 맞춰 시작합니다.
    if(!validDate(r.thirdAnchor||'') && validDate(r.eightAnchor||''))def.rules.thirdAnchor=r.eightAnchor;

    const inputAdj=incoming.adjustments||{};
    for(const k of ['extraDays','pauseDays']){
      if(Array.isArray(inputAdj[k]))def.adjustments[k]=[...new Set(inputAdj[k].filter(validDate))].slice(0,3000).sort();
    }
    return def;
  }
  function loadLocal(){try{return normalise(JSON.parse(localStorage.getItem(KEY)));}catch(_){return defaultState();}}
  function saveLocal(){if(!storageAvailable)throw Error('브라우저가 로컬 저장을 막고 있어요. README에 적힌 로컬 서버 방식으로 열어 주세요.');localStorage.setItem(KEY,JSON.stringify(state));}
  // =============================================================
  // [5. 날짜 계산] 버튼은 1번만 적용되고 이후 순환에 누적 반영됨
  // =============================================================
  function groupLabel(k){
    const base={first:'첫 번째',eight:'두 번째',third:'세 번째',fixed:'네 번째'};
    const labels={first:TEXT.firstLabel,eight:TEXT.secondLabel,third:TEXT.thirdLabel,fixed:TEXT.fourthLabel};
    const custom=state.groups[k].title;
    return custom===base[k]+' 글 모음' ? labels[k]+' 글 모음' : custom;
  }
  function baseNumberFirst(date){
    const d=parseDate(date),slot=Math.min(5,Math.floor((d.getUTCDate()-1)/5));
    if(state.rules.firstMode==='restart')return slot%4+1;
    const ref=parseDate(state.rules.firstAnchor);
    const months=(d.getUTCFullYear()-ref.getUTCFullYear())*12+d.getUTCMonth()-ref.getUTCMonth();
    const anchorSlot=Math.min(5,Math.floor((ref.getUTCDate()-1)/5));
    return mod(months*6+slot-anchorSlot,4)+1;
  }
  function changesBefore(kind,date){
    const entries=kind==='eight'?state.adjustments.extraDays:state.adjustments.pauseDays;
    return entries.filter(d=>d<date).length;
  }
  function adjustedOn(kind,date){
    return (kind==='eight'?state.adjustments.extraDays:state.adjustments.pauseDays).includes(date);
  }
  function todayArticles(group,date){
    let numbers=[];
    if(group==='first')numbers=[baseNumberFirst(date)];
    else if(group==='eight'){
      // +1을 누른 날에는 현재 글과 다음 글을 표시합니다.
      // 그 다음 날부터 앞으로 한 칸 앞당긴 상태가 유지됩니다.
      const current=mod(dayDiff(date,state.rules.eightAnchor)+changesBefore('eight',date),8)+1;
      numbers=adjustedOn('eight',date)?[current,(current%8)+1]:[current];
    }else if(group==='third'){
      // 정지한 오늘은 같은 글을 표시하되, 내일도 같은 글이 나오도록
      // 다음 날부터 누적 진행 횟수를 1회 차감합니다.
      const current=mod(dayDiff(date,state.rules.thirdAnchor)-changesBefore('third',date),8)+1;
      numbers=[current];
    }else if(group==='fixed'){
      numbers=[1,mod(dayDiff(date,state.rules.fixedAnchor),12)+2];
    }
    const count=state.groups[group].articles.length;
    return numbers.filter(n=>Number.isInteger(n)&&n>=1&&n<=count).map(n=>({n,...state.groups[group].articles[n-1]}));
  }
  function rangeLabel(date){const d=parseDate(date),start=Math.min(5,Math.floor((d.getUTCDate()-1)/5))*5+1;const end=start===26?monthDays(d.getUTCFullYear(),d.getUTCMonth()+1):start+4;return `${d.getUTCMonth()+1}월 ${start}~${end}일`}
  function sectionNote(group,date){
    if(group==='first')return `${rangeLabel(date)} · 5일 단위`;
    if(group==='eight')return '8개 글 · 매일 순환';
    if(group==='third')return '8개 글 · 매일 순환';
    return '1번 고정 + 2~13번 매일 순환';
  }
  function iconButton(key,action,label,extra=''){return `<button type="button" class="icon-btn" data-action="${action}" aria-label="${e(label)}" title="${e(label)}" ${extra}>${svg(key)}</button>`;}
  function logo(){return `<a class="identity" href="#/" aria-label="처음으로"><span class="mark">${svg('spark','sm')}</span><span>${e(TEXT.brand)}</span></a>`;}
  // 6-A. 공통 상단 영역과 메인 타일 화면
  function shell(content){
    const head=`<div class="shell-top">${logo()}<div class="top-right"><span class="date-small">${e(fmtDate(koreanToday(),false))}</span>${iconButton('settings','admin','관리자 설정')}</div></div>`;
    return `<main class="app">${head}${content}</main>`;
  }
  function home(){
    const tiles=state.links.map((l,i)=>{
      const tileInner=`<span class="tile-head">${tileIcon(l,'lg')}${svg('up','sm')}</span><span class="tile-title">${e(l.name)}</span>`;
      const cleanUrl=validUrl(l.url);
      return cleanUrl?`<a class="tile" href="${e(cleanUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${e(l.name)} 새 창으로 열기">${tileInner}</a>`:`<button class="tile" type="button" data-action="missing-link" data-idx="${i}" aria-label="${e(l.name)} 연결 주소 등록 안내">${tileInner}</button>`;
    }).join('');
    return shell(`<section class="hero"><div class="eyebrow">${e(TEXT.mainEyebrow)}</div><h1>${e(TEXT.mainTitle)}</h1><p class="subtitle">${e(TEXT.mainSubtitle)}</p></section><div class="tiles">${tiles}<button class="tile tile-feature" type="button" data-action="read"><span class="tile-head">${tileIcon({icon:state.featureIcon,image:state.featureImage},'lg')}${svg('right','sm')}</span><span class="tile-title">${e(TEXT.libraryTile)}</span></button></div><div class="footer">${e(TEXT.mainFooter)}</div>`);
  }
  // 6-B. 글 본문 / 카드 / 전체 목록
  function articleHTML(item,group,showPinned=false){
    const pin=(group==='fixed'&&item.n===1);
    return `<div class="article-item"><div class="article-title"><h3>${e(item.title)}</h3>${pin?`<span class="badge-soft">${svg('pin','xs')} 항상 표시</span>`:''}</div><div class="body-text">${e(item.body)}</div><div class="copy-row"><button type="button" class="copy-btn" data-action="copy-article" data-group="${group}" data-num="${item.n}">${svg('copy','xs')} 글 복사</button></div></div>`;
  }
  // =============================================================
  // [6. 화면 구성 (HTML)] 아래에서 페이지/카드의 배치를 생성합니다.
  // 글자만 바꿀 때는 여기보다 맨 위 [1. 화면 문구]를 수정하세요.
  // =============================================================
  function canAdjustToday(){
    return selectedDate===koreanToday() && (!remote || !!session?.access_token);
  }
  function adjustmentButton(group,date){
    if(!canAdjustToday() || !['eight','third'].includes(group))return '';
    const on=adjustedOn(group,date);
    const label=on?TEXT.undoButton:(group==='eight'?TEXT.extraButton:TEXT.pauseButton);
    const ico=on?'undo':(group==='eight'?'plus':'pause');
    return `<button type="button" class="mini-toggle ${on?'active':''}" data-action="toggle-adjustment" data-group="${group}" aria-pressed="${on}" title="${e(label)}">${svg(ico,'xs')} ${e(label)}</button>`;
  }
  function todayView(){
    const date=selectedDate;
    const nav=`<div class="date-row"><div class="date-nav"><button type="button" data-action="day-prev" aria-label="전날">${svg('chevl','sm')}</button><strong>${e(fmtDate(date))}</strong><button type="button" data-action="day-next" aria-label="다음날">${svg('chevr','sm')}</button></div><button type="button" class="text-link" data-action="day-reset">오늘로 돌아가기</button></div>`;
    const cards=GROUP_ORDER.map(group=>{
      const arts=todayArticles(group,date);
      const pill=group==='fixed'?'고정 + 순환':group==='first'?'5일 단위':'매일 변경';
      return `<section class="article-card"><div class="card-head"><div><h2>${e(groupLabel(group))}</h2><div class="muted">${e(sectionNote(group,date))}</div></div><div class="card-tools"><span class="pill">${pill}</span>${adjustmentButton(group,date)}</div></div>${arts.map(a=>articleHTML(a,group)).join('')||'<div class="empty">이 날짜에 표시할 글이 없습니다.</div>'}</section>`;
    }).join('');
    return nav+`<div class="section-stack">${cards}</div><div class="copy-row" style="margin-top:18px"><button class="light-btn" data-action="copy-today">${svg('copy','sm')} 오늘의 글 전체 복사</button></div>`;
  }
  function allView(){
    const counts={first:4,eight:8,third:8,fixed:13};
    const labels={first:TEXT.firstLabel,eight:TEXT.secondLabel,third:TEXT.thirdLabel,fixed:TEXT.fourthLabel};
    const btns=[['all','모두 · 33'],...GROUP_ORDER.map(k=>[k,`${labels[k]} · ${counts[k]}`])]
      .map(([key,label])=>`<button class="chip ${allFilter===key?'active':''}" data-action="filter" data-value="${key}">${e(label)}</button>`).join('');
    const groups=GROUP_ORDER.filter(k=>allFilter==='all'||allFilter===k).map(k=>{
      const articles=state.groups[k].articles;
      const items=articles.map((a,i)=>`<div class="all-article"><h3>${e(a.title)}${k==='fixed'&&i===0?'<span class="anchor-badge">항상 표시</span>':''}</h3><div class="body-text">${e(a.body)}</div><div class="copy-row"><button class="copy-btn" data-action="copy-article" data-group="${k}" data-num="${i+1}">${svg('copy','xs')} 복사</button></div></div>`).join('');
      const desc=k==='first'?'매월 1·6·11·16·21·26일 전환':k==='fixed'?'1번 고정 · 2~13번 순환':'8개 글이 매일 순환';
      return `<section class="all-group"><div class="all-heading"><h2>${e(groupLabel(k))}</h2><span class="muted">${articles.length}개</span></div><div class="all-desc">${e(desc)}</div><div class="all-items">${items}</div></section>`;
    }).join('');
    return `<div class="all-top"><span class="muted">등록된 글 33개 · 원문 전체 보기</span><button class="light-btn" data-action="copy-all">${svg('copy','xs')} 전체 복사</button></div><div class="chip-row">${btns}</div>${groups}`;
  }
  function readPage(){
    return shell(`<button class="back" type="button" data-action="home">${svg('left','sm')} 처음으로</button><div class="read-container"><section class="read-hero"><div class="eyebrow">${e(TEXT.libraryEyebrow)}</div><h1>${e(TEXT.libraryTitle)}</h1><p class="subtitle">${e(TEXT.librarySubtitle)}</p></section><div class="seg" role="tablist"><button type="button" role="tab" aria-selected="${activeReadTab==='today'}" class="${activeReadTab==='today'?'active':''}" data-action="read-tab" data-value="today">${e(TEXT.todayTab)}</button><button type="button" role="tab" aria-selected="${activeReadTab==='all'}" class="${activeReadTab==='all'?'active':''}" data-action="read-tab" data-value="all">${e(TEXT.allTab)}</button></div>${activeReadTab==='today'?todayView():allView()}</div>`);
  }
  // 6-C. 관리자 화면 (링크 · 글 · 규칙)
  function adminNav(){
    const items=[['links','링크 관리'],['articles','글 관리'],['rules','날짜 규칙']];
    return `<div class="admin-tabs" role="tablist">${items.map(([k,label])=>`<button class="${adminTab===k?'active':''}" data-action="admin-tab" data-value="${k}">${label}</button>`).join('')}</div>`;
  }
  const input = (id,value,type='text',extra='') => `<input id="${id}" class="input" type="${type}" value="${e(value)}" ${extra}>`;
  function iconPicker(){
    const link=iconEditing===-2?{name:TEXT.libraryTile,icon:state.featureIcon,image:state.featureImage}:state.links[iconEditing];if(!link)return '';
    const choices=ICON_OPTIONS.map(([key,label])=>`<button class="icon-choice ${!link.image && link.icon===key?'selected':''}" type="button" data-action="icon-choose" data-value="${key}" aria-label="${e(label)} 아이콘" title="${e(label)}" aria-pressed="${!link.image&&link.icon===key}">${svg(key,'lg')}</button>`).join('');
    return `<section class="icon-picker" aria-label="타일 아이콘 설정"><div class="icon-picker-head"><div class="icon-picker-title"><span class="icon-preview-large">${tileIcon(link)}</span><div><h3>${e(link.name)} 타일 아이콘</h3><p>기본 아이콘을 고르거나 내 이미지를 올려주세요.</p></div></div>${iconButton('close','icon-close','닫기')}</div>
      <div class="icon-grid">${choices}</div>
      <div class="icon-upload-row"><label for="tile-icon-file" class="upload-label">${svg('image','sm')} 이미지 파일 선택</label><input id="tile-icon-file" type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" aria-label="타일 아이콘 이미지 업로드"><span class="hint">PNG · JPG · WEBP · SVG / 최대 2MB<br>타일에 맞게 자동 축소해 저장합니다.</span></div>
      ${link.image?`<button class="light-btn" type="button" data-action="icon-remove">${svg('trash','xs')} 업로드 이미지 제거</button>`:''}
      <p class="icon-picker-hint">아이콘을 고르면 미리보기가 바뀝니다. 적용하려면 아래의 <b>링크 저장</b>을 눌러주세요.</p></section>`;
  }
  function linkAdmin(){
    const rows=state.links.map((link,i)=>`<div class="admin-link-row" data-link-row="${i}"><button type="button" class="link-icon-trigger ${iconEditing===i?'is-active':''}" data-action="icon-open" data-idx="${i}" aria-label="${e(link.name)} 아이콘 변경" title="아이콘 변경">${tileIcon(link,'sm')}</button><input class="input" data-kind="name" value="${e(link.name)}" placeholder="표시할 이름" aria-label="링크 이름"><input class="input link-url" data-kind="url" value="${e(link.url)}" placeholder="https://..." aria-label="연결 주소"><div class="mini-actions"><button data-action="link-up" data-idx="${i}" title="위로 이동" aria-label="위로 이동">${svg('chevl','xs')}</button><button data-action="link-down" data-idx="${i}" title="아래로 이동" aria-label="아래로 이동">${svg('chevr','xs')}</button><button data-action="link-delete" data-idx="${i}" title="삭제" aria-label="삭제">${svg('trash','xs')}</button></div></div>`).join('');
    return `<div class="admin-panel"><h2 class="panel-title">바로가기 편집</h2><p class="panel-sub">이름·주소·아이콘을 수정할 수 있어요. 각 항목 왼쪽 <b>아이콘 버튼</b>을 누르면 다른 그림으로 변경할 수 있습니다.</p>${rows||'<p class="hint">등록된 링크가 없습니다.</p>'}<div class="feature-icon-admin"><button type="button" class="link-icon-trigger ${iconEditing===-2?'is-active':''}" data-action="icon-feature" aria-label="글 모음 아이콘 변경" title="아이콘 변경">${tileIcon({icon:state.featureIcon,image:state.featureImage},'sm')}</button><div><strong>${e(TEXT.libraryTile)}</strong><span>내부 페이지로 연결되는 타일</span></div></div>${iconPicker()}<button class="secondary-btn" data-action="link-add">${svg('plus','sm')} 링크 추가</button><div class="savebar"><button class="primary-btn" data-action="save-links">${svg('check','sm')} 링크 저장</button></div></div>`;
  }
  function articleAdmin(){
    const grp=state.groups[editGroup];
    const obj=grp.articles[editNumber-1]||grp.articles[0];
    const counts={first:4,eight:8,third:8,fixed:13};
    const labels={first:TEXT.firstLabel,eight:TEXT.secondLabel,third:TEXT.thirdLabel,fixed:TEXT.fourthLabel};
    const pills=grp.articles.map((a,i)=>`<button class="${editNumber===i+1?'active':''}" data-action="edit-number" data-value="${i+1}" aria-label="${i+1}번 글">${i+1}</button>`).join('');
    const switches=GROUP_ORDER.map(k=>`<button data-action="edit-group" data-value="${k}" class="${editGroup===k?'active':''}">${e(labels[k])} · ${counts[k]}개</button>`).join('');
    return `<div class="admin-panel"><h2 class="panel-title">글 내용 편집</h2><p class="panel-sub">모음과 글 번호를 선택한 뒤 제목과 원문을 수정할 수 있어요.</p><div class="group-switch">${switches}</div><div class="number-pills">${pills}</div><div class="field"><label for="article-title">${editNumber}번 글 제목</label>${input('article-title',obj.title)}</div><div class="field"><label for="article-body">글 내용</label><textarea class="textarea" id="article-body" spellcheck="false" placeholder="여기에 원문을 붙여 넣으세요.">${e(obj.body)}</textarea></div><div class="savebar"><button class="primary-btn" data-action="save-article">${svg('check','sm')} 글 저장</button></div></div>`;
  }
  function ruleAdmin(){
    const r=state.rules;
    return `<div class="admin-panel"><h2 class="panel-title">글이 바뀌는 기준</h2><p class="panel-sub">기준일과 모음 이름을 수정할 수 있어요. +1 추가와 하루 정지는 오늘의 글에서 바로 누르면 됩니다.</p>
      <section class="rule-card"><h3>${e(TEXT.firstLabel)} 글 모음 · 4개</h3><p>매월 1~5일, 6~10일, 11~15일, 16~20일, 21~25일, 26~말일. 31일은 마지막 글을 유지합니다.</p><div class="field"><label for="first-group-name">모음 이름</label>${input('first-group-name',groupLabel('first'))}</div><div class="field"><label for="first-mode">다음 달로 넘어갈 때</label><select id="first-mode" class="select"><option value="restart" ${r.firstMode==='restart'?'selected':''}>매달 1번 글부터 다시 시작</option><option value="continuous" ${r.firstMode==='continuous'?'selected':''}>다음 달에도 4개 글의 순서 이어가기</option></select></div><div class="field"><label for="first-anchor">이어가기 방식의 기준일</label>${input('first-anchor',r.firstAnchor,'date')}</div></section>
      <section class="rule-card"><h3>${e(TEXT.secondLabel)} 글 모음 · 8개</h3><p>하루에 하나씩 순환합니다. +1 추가를 누른 날은 두 개를 보여주고 이후 순환이 한 칸 빨라집니다.</p><div class="field"><label for="eight-group-name">모음 이름</label>${input('eight-group-name',groupLabel('eight'))}</div><div class="field"><label for="eight-anchor">1번 글을 표시할 기준일</label>${input('eight-anchor',r.eightAnchor,'date')}</div></section>
      <section class="rule-card"><h3>${e(TEXT.thirdLabel)} 글 모음 · 8개</h3><p>하루에 하나씩 순환합니다. 하루 정지를 누른 날의 글은 오늘과 다음 날 똑같이 보여요.</p><div class="field"><label for="third-group-name">모음 이름</label>${input('third-group-name',groupLabel('third'))}</div><div class="field"><label for="third-anchor">1번 글을 표시할 기준일</label>${input('third-anchor',r.thirdAnchor,'date')}</div></section>
      <section class="rule-card"><h3>${e(TEXT.fourthLabel)} 글 모음 · 13개</h3><p>1번 글은 항상 표시하고 2~13번 글은 하루에 하나씩 돌아갑니다.</p><div class="field"><label for="fixed-group-name">모음 이름</label>${input('fixed-group-name',groupLabel('fixed'))}</div><div class="field"><label for="fixed-anchor">2번 글을 표시할 기준일</label>${input('fixed-anchor',r.fixedAnchor,'date')}</div></section>
      <div class="savebar"><button class="primary-btn" data-action="save-rules">${svg('check','sm')} 규칙 저장</button></div></div>`;
  }
  function loginPage(){
    return shell(`<button class="back" data-action="home">${svg('left','sm')} 처음으로</button><div class="login-box"><h2>관리자 로그인</h2><p>방문자는 글을 볼 수 있지만, 글과 링크 수정은 지정된 관리자만 할 수 있습니다.</p><form id="login-form"><div class="field"><label for="login-email">이메일</label><input required class="input" autocomplete="username" id="login-email" type="email" placeholder="이메일 주소"></div><div class="field"><label for="login-pass">비밀번호</label><input required class="input" autocomplete="current-password" id="login-pass" type="password" placeholder="비밀번호"></div><button type="submit" class="primary-btn" style="width:100%">로그인</button></form></div>`);
  }
  function adminPage(){
    if(remote && !session?.access_token)return loginPage();
    const content={links:linkAdmin,articles:articleAdmin,rules:ruleAdmin}[adminTab]();
    return shell(`<button class="back" data-action="home">${svg('left','sm')} 처음으로</button><div class="admin-header"><h1>관리자 모드</h1><p class="hint">필요한 내용만 바꾸고 저장하면 됩니다.</p></div>${!remote?`<div class="notice"><strong>이 브라우저에서만 저장되는 시험용 모드</strong><br>${storageAvailable?'현재 편집 기능은 별도 로그인 없이 작동합니다. 공개 운영 전에 Supabase를 연결하면 로그인 관리자만 수정하고, 방문자는 읽기만 할 수 있습니다.':'지금은 브라우저가 저장을 차단했습니다. 파일을 로컬 웹서버로 실행하거나 Supabase를 연결해 주세요.'}</div>`:''}${adminNav()}${content}<div class="bottom-gap"></div>`);
  }
  function route(){const path=location.hash.replace(/^#\/?/,'').split('?')[0];return path==='read'?'read':path==='admin'?'admin':'home';}
  function render(){ROOT.innerHTML=route()==='read'?readPage():route()==='admin'?adminPage():home();document.title=(route()==='read'?TEXT.libraryTitle:route()==='admin'?'관리자':TEXT.mainTitle)+' · '+TEXT.brand;}
  function nav(page){location.hash=page===''?'#/':'#/'+page;render();window.scrollTo({top:0,behavior:'instant'});}
  function toast(s){const node=document.getElementById('toast');node.textContent=s;node.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('show'),3200);}
  function validUrl(u){try{const z=new URL(u);return ['https:','http:'].includes(z.protocol)?z.href:null;}catch(_){return null;}}
  function copyText(t){if(navigator.clipboard && window.isSecureContext){return navigator.clipboard.writeText(t).then(()=>toast('복사했어요.')).catch(()=>fallbackCopy(t));}return Promise.resolve(fallbackCopy(t));}
  function fallbackCopy(t){let el=document.createElement('textarea');el.value=t;el.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(el);el.select();try{document.execCommand('copy');toast('복사했어요.');}catch(_){toast('복사할 수 없습니다. 브라우저 권한을 확인해 주세요.');}el.remove();}
  function getCopyArticle(k,n){const x=state.groups[k]?.articles[n-1];return x?`${x.title}\n\n${x.body}`:'';}
  function getAllText(groups){return groups.map(k=>`${state.groups[k].title}\n\n${state.groups[k].articles.map((a,i)=>getCopyArticle(k,i+1)).join('\n\n──────────\n\n')}`).join('\n\n════════════════\n\n');}
  function captureLinks(){state.links=[...ROOT.querySelectorAll('[data-link-row]')].map((r,i)=>({name:r.querySelector('[data-kind="name"]').value.trim()||'이름 없는 링크',url:r.querySelector('[data-kind="url"]').value.trim(),icon:state.links[i]?.icon||'folder',image:state.links[i]?.image||''}));}
  function captureArticle(){const title=ROOT.querySelector('#article-title'),body=ROOT.querySelector('#article-body');if(!title||!body)return;state.groups[editGroup].articles[editNumber-1]={title:title.value.trim()||`${editNumber}번 글`,body:body.value};}
  function captureRules(){
    const v=id=>ROOT.querySelector('#'+id)?.value;
    if(!v('first-mode'))return;
    for(const k of ['first-anchor','eight-anchor','third-anchor','fixed-anchor']){
      if(!validDate(v(k)))throw Error('올바른 기준 날짜를 입력해 주세요.');
    }
    state.rules={
      firstMode:v('first-mode'),firstAnchor:v('first-anchor'),
      eightAnchor:v('eight-anchor'),thirdAnchor:v('third-anchor'),fixedAnchor:v('fixed-anchor')
    };
    const fields={first:'first-group-name',eight:'eight-group-name',third:'third-group-name',fixed:'fixed-group-name'};
    const defaults={first:TEXT.firstLabel,eight:TEXT.secondLabel,third:TEXT.thirdLabel,fixed:TEXT.fourthLabel};
    for(const k of GROUP_ORDER)state.groups[k].title=v(fields[k]).trim()||defaults[k]+' 글 모음';
  }
  function captureAdmin(){if(route()!=='admin')return;try{if(adminTab==='links')captureLinks();if(adminTab==='articles')captureArticle();if(adminTab==='rules')captureRules();}catch(_){}}

  // =============================================================
  // [7. Supabase 연결 / 저장 / 권한]
  // =============================================================
  async function api(path,method='GET',data=null,authenticated=false){
    const base=cfg.supabaseUrl.replace(/\/$/,'');
    const makeHeaders=()=>({'apikey':cfg.supabaseAnonKey,...(authenticated&&session?.access_token?{'Authorization':`Bearer ${session.access_token}`}:{}),'Content-Type':'application/json',...(method==='PATCH'?{'Prefer':'return=minimal'}:{})});
    let rsp=await fetch(base+path,{method,headers:makeHeaders(),body:data===null?undefined:JSON.stringify(data)});
    if(rsp.status===401&&authenticated&&session?.refresh_token){
      const refresh=await fetch(base+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'apikey':cfg.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
      if(refresh.ok){session=await refresh.json();sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));rsp=await fetch(base+path,{method,headers:makeHeaders(),body:data===null?undefined:JSON.stringify(data)});}
    }
    if(!rsp.ok){let detail='';try{detail=(await rsp.json()).message||'';}catch(_){}throw Error(detail||`서버 요청 실패 (${rsp.status})`);}
    if(rsp.status===204)return null;
    const text=await rsp.text();return text?JSON.parse(text):null;
  }
  async function loadRemote(){
    try{const result=await api('/rest/v1/app_state?select=content&id=eq.main');if(Array.isArray(result)&&result[0]?.content){state=normalise(result[0].content);remoteStatus='서버 연결됨';render();}else{remoteStatus='초기 데이터 없음';toast('Supabase의 초기 데이터를 확인해 주세요.');}}
    catch(err){remoteStatus='연결 오류';toast('서버에서 데이터를 불러오지 못했어요. 연결 설정을 확인해 주세요.');console.warn(err);}
  }
  async function persist(){
    if(!remote){
      try{saveLocal();lastSaveTime=Date.now();toast('이 브라우저에 저장했어요.');return true;}
      catch(err){toast(err.message||'저장 실패');return false;}
    }
    if(!session?.access_token){toast('관리자 로그인이 필요해요.');return false;}
    if(remoteStatus!=='서버 연결됨'){toast('서버 데이터를 불러온 뒤 저장해 주세요.');return false;}
    if(busy)return false;
    busy=true;
    try{
      await api('/rest/v1/app_state?id=eq.main','PATCH',{
        content:state,updated_at:new Date().toISOString()
      },true);
      lastSaveTime=Date.now();toast('저장했어요. 모든 방문자에게 적용됩니다.');return true;
    }catch(err){
      toast('저장에 실패했어요: '+err.message);console.warn(err);return false;
    }finally{busy=false;}
  }
  async function login(){const email=ROOT.querySelector('#login-email').value.trim(),password=ROOT.querySelector('#login-pass').value;
    try{
      const rsp=await fetch(cfg.supabaseUrl.replace(/\/$/,'')+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'apikey':cfg.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
      if(!rsp.ok)throw Error('이메일 또는 비밀번호를 확인해 주세요.');
      session=await rsp.json();
      const allowed=await api('/rest/v1/rpc/is_site_admin','POST',{},true);
      if(allowed!==true){session=null;throw Error('이 계정에는 수정 권한이 없습니다.');}
      sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));toast('관리자로 로그인했어요.');render();
    }catch(err){session=null;sessionStorage.removeItem(SESSION_KEY);toast(err.message);}
  }
  // =============================================================
  // [8. 버튼 동작 및 이벤트]
  // =============================================================
  async function handleAction(el){
    const a=el.dataset.action,v=el.dataset.value,idx=Number(el.dataset.idx),g=el.dataset.group,n=Number(el.dataset.num);
    try{
      if(a==='home')return nav('');if(a==='read')return nav('read');if(a==='admin')return nav('admin');
      if(a==='missing-link')return toast('아직 주소가 등록되지 않았어요. 관리자에서 링크를 입력해 주세요.');
      if(a==='read-tab'){activeReadTab=v;render();return;}
      if(a==='day-prev'){selectedDate=addDays(selectedDate,-1);render();return;}
      if(a==='day-next'){selectedDate=addDays(selectedDate,1);render();return;}
      if(a==='day-reset'){selectedDate=koreanToday();render();return;}
      if(a==='filter'){allFilter=v;render();return;}
      if(a==='copy-article')return copyText(getCopyArticle(g,n));
      if(a==='copy-today')return copyText(GROUP_ORDER.map(k=>`${groupLabel(k)}\n\n${todayArticles(k,selectedDate).map(x=>`${x.title}\n\n${x.body}`).join('\n\n')}`).join('\n\n──────────────\n\n'));
      if(a==='copy-all')return copyText(getAllText(GROUP_ORDER.filter(k=>allFilter==='all'||allFilter===k)));
      if(a==='admin-tab'){captureAdmin();adminTab=v;render();return;}
      if(a==='icon-open'){captureLinks();iconEditing=iconEditing===idx?-1:idx;render();return;}
      if(a==='icon-feature'){captureLinks();iconEditing=iconEditing===-2?-1:-2;render();return;}
      if(a==='icon-close'){iconEditing=-1;render();return;}
      if(a==='icon-choose'){
        if(iconEditing===-1 || !SYMBOLS[v])return;
        captureLinks();
        if(iconEditing===-2){state.featureIcon=v;state.featureImage='';}
        else if(state.links[iconEditing]){state.links[iconEditing].icon=v;state.links[iconEditing].image='';}
        render();return;
      }
      if(a==='icon-remove'){
        if(iconEditing===-1)return;
        captureLinks();
        if(iconEditing===-2)state.featureImage='';
        else if(state.links[iconEditing])state.links[iconEditing].image='';
        render();return;
      }
      if(a==='link-add'){captureLinks();if(state.links.length>=40)return toast('링크는 최대 40개까지 등록할 수 있어요.');state.links.push({name:'새 링크',url:'',icon:'folder',image:''});iconEditing=-1;render();return;}
      if(a==='link-delete'){captureLinks();state.links.splice(idx,1);iconEditing=-1;render();return;}
      if(a==='link-up'||a==='link-down'){captureLinks();const target=idx+(a==='link-up'?-1:1);if(target>=0&&target<state.links.length)[state.links[idx],state.links[target]]=[state.links[target],state.links[idx]];iconEditing=-1;render();return;}
      if(a==='save-links'){captureLinks();if(state.links.some(l=>l.url&&!validUrl(l.url)))return toast('링크 주소는 https:// 또는 http://로 시작해야 해요.');await persist();return;}
      if(a==='edit-group'){captureArticle();editGroup=v;editNumber=1;render();return;}
      if(a==='edit-number'){captureArticle();editNumber=Number(v);render();return;}
      if(a==='save-article'){captureArticle();await persist();render();return;}
      if(a==='save-rules'){captureRules();await persist();render();return;}
      if(a==='toggle-adjustment'){
        if(busy)return;
        if(selectedDate!==koreanToday())return toast('조정 버튼은 오늘 날짜에만 사용할 수 있어요.');
        if(remote && !session?.access_token)return toast('관리자 로그인이 필요해요.');
        if(!['eight','third'].includes(g))return;
        if(remote){
          try{const rows=await api('/rest/v1/app_state?select=content&id=eq.main');
            if(Array.isArray(rows) && rows[0]?.content)state=normalise(rows[0].content);
          }catch(_){return toast('최신 순환 상태를 읽지 못했어요. 다시 시도해 주세요.');}
        }
        const field=g==='eight'?'extraDays':'pauseDays';
        const date=koreanToday();
        const previous=[...state.adjustments[field]];
        state.adjustments[field]=previous.includes(date)
          ? previous.filter(d=>d!==date)
          : [...previous,date].sort();
        // 서버 저장 실패 시 화면/순환이 잘못 바뀌지 않도록 원래대로 되돌립니다.
        const ok=await persist();
        if(!ok)state.adjustments[field]=previous;
        render();return;
      }
      if(a==='logout'){session=null;sessionStorage.removeItem(SESSION_KEY);toast('로그아웃했어요.');render();return;}
    }catch(err){toast(err.message||'처리 중 오류가 발생했어요.');console.warn(err);}
  }
  ROOT.addEventListener('click',ev=>{const el=ev.target.closest('[data-action]');if(el){ev.preventDefault();void handleAction(el);}});
  ROOT.addEventListener('change',async ev=>{
    if(ev.target.id!=='tile-icon-file')return;
    const file=ev.target.files?.[0];if(!file||iconEditing===-1)return;
    const targetIndex=iconEditing;
    captureLinks();
    ev.target.disabled=true;
    toast('이미지를 준비하고 있어요…');
    try{
      const imgData=await convertIconFile(file);
      if(targetIndex===-2)state.featureImage=imgData;
      else if(state.links[targetIndex])state.links[targetIndex].image=imgData;
      else return;
      iconEditing=targetIndex;
      render();toast('아이콘 미리보기가 변경됐어요. 링크 저장을 눌러주세요.');
    }catch(err){toast(err.message||'이미지를 처리할 수 없어요.');ev.target.disabled=false;ev.target.value='';}
  });
  ROOT.addEventListener('submit',ev=>{if(ev.target.id==='login-form'){ev.preventDefault();void login();}});
  window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});
  async function boot(){
    state=loadLocal();
    if(remote){try{session=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');}catch(_){} }
    render();
    if(remote)await loadRemote();
  }
  boot();
  // 개발 확인용: 날짜별로 표시할 글 번호 확인
  window.HubDebug={getState:()=>structuredClone(state),showFor:(date)=>Object.fromEntries(GROUP_ORDER.map(k=>[k,todayArticles(k,date).map(a=>a.n)])),getRemoteStatus:()=>remoteStatus};
})();
