import { firebaseConfig } from './firebase.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, addDoc, deleteDoc, serverTimestamp, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js';

const defaults = {
  settings:{logline:'จุดรวมงานกลางของโปรเจกต์หนังผี ตั้งแต่บท ทีมงาน แผนถ่าย ภาพกอง และประกาศทีมงาน', heroUrl:'assets/images/inset-01.jpg'},
  announcement:{title:'ยินดีต้อนรับเข้าสู่ Production Portal', text:'ประกาศจากทีมงานจะแสดงเป็น Popup แบบ Real-time เมื่อเชื่อม Firebase แล้ว', updatedAt:Date.now()},
  crew:[
    {name:'โฟกัส', role:'Executive Producer / Sound', note:'หิรัญ ดิษฐสกุล'},
    {name:'เน็น', role:'File Report / Equip / Sound', note:'ธัญพิสิษฐ์ พูนพานิช'},
    {name:'เอ๊าะ', role:'Director', note:'วัชรพล ดำสมอ'},
    {name:'ปอย', role:'AD 1 / Costume', note:'วิภาวัณย์ วงษ์เสนา'},
    {name:'ตอง', role:'AD 2 / Finance', note:'กัณญาพัฒน์ จันทร์เกษมสุข'},
    {name:'นิ้ก', role:'Art Director / Location Manager', note:'ธนกฤต บริสุทธิ์'},
    {name:'มูน', role:'Production Design / Prop Master', note:'รวีโรจน์ เชื้อแฉ่ง'},
    {name:'จี้', role:'Screenwriter / Script Supervisor', note:'พิยดา อุทาพันธ์'},
    {name:'ลูกปัด', role:'Acting Coach / Screenwriter', note:'จันทิมา จันทร์ข่วง'},
    {name:'ตอริก', role:'Editor / Graphic Designer', note:'พิเชฐ ตรงเพชร'},
    {name:'ทีเจ', role:'Gaffer / Lighting Crew', note:'ศิริวัฒน์ เดชอุดม'},
    {name:'แม็กกี้', role:'Camera Operator', note:'ณรงค์เดช แสนสิทธิ์'},
    {name:'โฟล์ค', role:'Art Run / Lighting', note:'ขันเงิน สาครธนะศักดิ์'}
  ],
  story:[
    {title:'ดงต้นกล้วย / ความฝัน', text:'เจนและมีร่าในชุดนักเรียนย้ำคำสัญญาว่าจะอยู่ด้วยกันตลอดไป ก่อนมีร่าหายตัวไป'},
    {title:'ห้องนอนเจน', text:'เจนตื่นขึ้นพร้อมสายตาพร่ามัว โทรศัพท์จากแม่ และตุ๊กตาที่เชื่อมกับความทรงจำ'},
    {title:'พิธีลักษิกา', text:'มีร่าถือถาดเครื่องเซ่น จุดธูป และเชิญผีเหย้า ผีเรือนให้มารับเครื่องเซ่น'},
    {title:'ห้องน้ำกลางคืน', text:'เสียงเคาะประตู รอยฝ่ามือ รอยเท้า และร่างหญิงสาวฟ้อนอย่างผิดธรรมชาติ'},
    {title:'ห้องทำพิธี', text:'ฝันรุนแรงของเจนที่ถูกมัดและถูกทำพิธี ท่ามกลางเสียงกรีดร้องและแม่หมอ'}
  ],
  schedule:[
    {time:'4–18 ก.ค.', title:'Rough Cut', text:'วางโครงเรื่อง เลือกช็อตหลัก และ Export Preview รอบแรก'},
    {time:'19–26 ก.ค.', title:'Fine Cut', text:'ปรับจังหวะภาพ ความหลอน และความเข้าใจของเรื่อง'},
    {time:'27 ก.ค.–1 ส.ค.', title:'Sound / SFX / Music', text:'ปรับเสียงพูด ใส่ Ambience, SFX และเพลงประกอบ'},
    {time:'2–5 ส.ค.', title:'Color / Title / Credit', text:'คุมโทนภาพหนังผี ใส่ชื่อเรื่องและเครดิต'},
    {time:'11–31 ส.ค.', title:'Contest Submission', text:'เตรียม Final Film, Poster, Synopsis, Team Credit และส่งประกวด'}
  ]
};

let app, auth, db, storage, role = localStorage.getItem('blb_role') || '', selectedRole='admin', galleryItems=[], currentIndex=0, online=false;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

function toast(msg){ $('#syncStatus').textContent = msg; console.log(msg); }
function render(data){
  const settings = data.settings || defaults.settings;
  $('#siteLogline').textContent = settings.logline || defaults.settings.logline;
  $('#loglineInput').value = settings.logline || '';
  $('#heroPoster').style.backgroundImage = `linear-gradient(to top,rgba(0,0,0,.92),rgba(0,0,0,.15)),url('${settings.heroUrl || defaults.settings.heroUrl}')`;
  const ann = data.announcement || defaults.announcement;
  $('#announceTitle').textContent = ann.title || '';
  $('#announceText').textContent = ann.text || '';
  $('#annTitleInput').value = ann.title || '';
  $('#annTextInput').value = ann.text || '';
  if(ann.title || ann.text) $('#announcement').classList.remove('hidden');
  renderCrew(data.crew || defaults.crew); renderStory(data.story || defaults.story); renderSchedule(data.schedule || defaults.schedule);
  $('#crewJson').value = JSON.stringify(data.crew || defaults.crew,null,2);
  $('#storyJson').value = JSON.stringify(data.story || defaults.story,null,2);
  $('#scheduleJson').value = JSON.stringify(data.schedule || defaults.schedule,null,2);
}
function renderCrew(list){ $('#crewCount').textContent=list.length; $('#crewGrid').innerHTML=list.map(x=>`<article class="crew"><h3>${esc(x.name)}</h3><p><b>${esc(x.role)}</b></p><p>${esc(x.note)}</p></article>`).join(''); }
function renderStory(list){ $('#storyGrid').innerHTML=list.map((x,i)=>`<article class="scene"><span class="chip">Scene ${String(i+1).padStart(2,'0')}</span><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join(''); }
function renderSchedule(list){ $('#scheduleList').innerHTML=list.map(x=>`<div class="timeline-item"><div class="time">${esc(x.time)}</div><div><h3>${esc(x.title)}</h3><p class="muted">${esc(x.text)}</p></div></div>`).join(''); }
function renderGallery(filter='all'){
  const builtins=[
    {url:'assets/images/bts-01.jpg', caption:'Behind The Scene', type:'Behind The Scene'},
    {url:'assets/images/inset-01.jpg', caption:'In Set', type:'In Set'},
    {url:'assets/images/bts-02.jpg', caption:'Behind The Scene', type:'Behind The Scene'}
  ];
  const arr=[...builtins,...galleryItems].filter(x=>filter==='all'||x.type===filter);
  $('#galleryGrid').innerHTML=arr.map((x,i)=>`<article class="photo" data-i="${i}"><img src="${esc(x.url)}" alt="${esc(x.caption)}"><div><small>${esc(x.type)}</small><p>${esc(x.caption||'ไม่มีคำอธิบาย')}</p></div></article>`).join('');
  $('#galleryGrid').onclick=e=>{ const card=e.target.closest('.photo'); if(!card)return; openLightbox(arr, +card.dataset.i); };
}
function openLightbox(arr,i){ galleryItems._view=arr; currentIndex=i; updateLightbox(); $('#lightbox').showModal(); }
function updateLightbox(){ const arr=galleryItems._view||[]; const x=arr[currentIndex]; if(!x)return; $('#lightboxImg').src=x.url; $('#lightboxCaption').textContent=`${x.type} • ${x.caption||''}`; }
function updateRoleUI(){ $('#loginBox').classList.toggle('hidden', !!role); $('#panelBox').classList.toggle('hidden', !role); $('#roleLabel').textContent = role ? `เข้าสู่ระบบเป็น ${role.toUpperCase()}` : 'ยังไม่ได้เข้าสู่ระบบ'; }
async function saveMain(part, value){ await setDoc(doc(db,'portal','main'), {[part]: value}, {merge:true}); }
async function uploadFile(file, path){ const r=ref(storage,path); await uploadBytes(r,file); return await getDownloadURL(r); }
async function initFirebase(){
  try{ app=initializeApp(firebaseConfig); auth=getAuth(app); db=getFirestore(app); storage=getStorage(app); await signInAnonymously(auth); online=true; toast('Online Sync พร้อมใช้งาน');
    const mainRef=doc(db,'portal','main'); const snap=await getDoc(mainRef); if(!snap.exists()) await setDoc(mainRef, defaults);
    onSnapshot(mainRef, s=>render({...defaults,...s.data()}), err=>toast('อ่าน Firestore ไม่ได้: '+err.message));
    onSnapshot(query(collection(db,'gallery'), orderBy('createdAt','desc')), qs=>{ galleryItems=qs.docs.map(d=>({id:d.id,...d.data()})); renderGallery($('.tab.active')?.dataset.filter||'all'); }, err=>toast('อ่าน Gallery ไม่ได้: '+err.message));
  }catch(err){ online=false; toast('Firebase ยังไม่พร้อม: '+err.message); render(defaults); renderGallery(); }
}

// UI events
window.addEventListener('mousemove',e=>{ const g=$('#cursorGlow'); g.style.left=e.clientX+'px'; g.style.top=e.clientY+'px'; });
$$('[data-open-control]').forEach(b=>b.onclick=()=>{ updateRoleUI(); $('#controlDialog').showModal(); });
$('[data-close-control]').onclick=()=>$('#controlDialog').close();
$('[data-scroll="gallery"]').onclick=()=>$('#gallery').scrollIntoView({behavior:'smooth'});
$('#dismissAnnounce').onclick=()=>$('#announcement').classList.add('hidden');
$$('.role-btn').forEach(b=>b.onclick=()=>{ selectedRole=b.dataset.role; $$('.role-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); });
$('#loginBtn').onclick=()=>{ const pass=$('#passwordInput').value.trim(); if((selectedRole==='admin'&&pass==='admin123')||(selectedRole==='editor'&&pass==='editor123')){ role=selectedRole; localStorage.setItem('blb_role',role); updateRoleUI(); } else alert('รหัสไม่ถูกต้อง'); };
$('#logoutBtn').onclick=()=>{ role=''; localStorage.removeItem('blb_role'); updateRoleUI(); };
$$('.panel-tabs button').forEach(b=>b.onclick=()=>{ $$('.panel-tabs button,.admin-panel').forEach(x=>x.classList.remove('active')); b.classList.add('active'); $('#'+b.dataset.panel).classList.add('active'); });
$$('.tab').forEach(b=>b.onclick=()=>{ $$('.tab').forEach(x=>x.classList.remove('active')); b.classList.add('active'); renderGallery(b.dataset.filter); });
$('#saveAnnouncement').onclick=()=>saveMain('announcement',{title:$('#annTitleInput').value,text:$('#annTextInput').value,updatedAt:Date.now()});
$('#saveSettings').onclick=()=>saveMain('settings',{logline:$('#loglineInput').value, heroUrl: $('#heroPoster').style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)?.[1] || defaults.settings.heroUrl});
$('#saveCrew').onclick=()=>{ try{ saveMain('crew', JSON.parse($('#crewJson').value)); }catch(e){ alert('JSON Crew ผิด'); } };
$('#saveStory').onclick=()=>{ try{ saveMain('story', JSON.parse($('#storyJson').value)); }catch(e){ alert('JSON Story ผิด'); } };
$('#saveSchedule').onclick=()=>{ try{ saveMain('schedule', JSON.parse($('#scheduleJson').value)); }catch(e){ alert('JSON Schedule ผิด'); } };
$('#uploadHero').onclick=async()=>{ const f=$('#heroFile').files[0]; if(!f)return alert('เลือกรูปก่อน'); const url=await uploadFile(f,`hero/${Date.now()}-${f.name}`); await saveMain('settings',{logline:$('#loglineInput').value||defaults.settings.logline,heroUrl:url}); };
$('#uploadGallery').onclick=async()=>{ const f=$('#galleryFile').files[0]; if(!f)return alert('เลือกรูปก่อน'); const url=await uploadFile(f,`gallery/${Date.now()}-${f.name}`); await addDoc(collection(db,'gallery'),{url,type:$('#galleryType').value,caption:$('#galleryCaption').value,createdAt:serverTimestamp(),by:role||'unknown'}); $('#galleryCaption').value=''; $('#galleryFile').value=''; };
$('.close-lightbox').onclick=()=>$('#lightbox').close(); $('.prev').onclick=()=>{ const arr=galleryItems._view||[]; currentIndex=(currentIndex-1+arr.length)%arr.length; updateLightbox(); }; $('.next').onclick=()=>{ const arr=galleryItems._view||[]; currentIndex=(currentIndex+1)%arr.length; updateLightbox(); };
window.addEventListener('keydown',e=>{ if(e.key==='Escape'&&$('#lightbox').open)$('#lightbox').close(); if($('#lightbox').open&&e.key==='ArrowLeft')$('.prev').click(); if($('#lightbox').open&&e.key==='ArrowRight')$('.next').click(); });

updateRoleUI(); initFirebase(); renderGallery();
