/* BFS218 Atlas: learning companion. Vanilla JS, self-contained, no build step.
   Companion to Blackboard: no assessment, no student-to-student interaction here. */
(function(){
"use strict";
var D = window.BFS218 || {};
var MAIN = document.getElementById('main');
var NAV = document.getElementById('nav');
var OVERLAY = document.getElementById('overlay');

/* ---------- injected styles for richer components ---------- */
var CSS = [
"#hero{position:relative;overflow:hidden;border-radius:18px;padding:40px clamp(20px,5vw,56px);margin-bottom:26px;color:#1A1A1A;background:linear-gradient(135deg,#FBFAF7 0%,#E8EEF1 38%,#E9EFE7 62%,#ECE7F1 100%);border:1px solid var(--hair)}",
"#hero .htag{font-family:var(--mono);font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:#54585A}",
"#hero h1{font-size:clamp(1.9rem,4.4vw,2.9rem);margin:.18em 0 .12em}",
"#hero .hsub{font-size:1.15rem;color:#3a3f45}",
"#hero .hcontour{position:absolute;inset:0;opacity:.5;pointer-events:none}",
"#hero .hactions{margin-top:20px;display:flex;flex-wrap:wrap;gap:10px}",
".toolgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}",
".toolcard{display:block;text-decoration:none;color:inherit;border:1px solid var(--hair);border-radius:14px;padding:18px;background:var(--surface);transition:transform .15s,border-color .15s}",
".toolcard:hover{transform:translateY(-2px);border-color:#cfc9bb}",
".toolcard .ic{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;margin-bottom:10px}",
".wkgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}",
".wktile{display:flex;flex-direction:column;gap:6px;text-decoration:none;color:#1A1A1A;border:1px solid var(--hair);border-radius:12px;padding:14px;min-height:104px;transition:transform .15s}",
".wktile:hover{transform:translateY(-2px)}",
".wktile .wn{font-family:var(--mono);font-size:.74rem;font-weight:600}",
".wktile b{font-size:.98rem;line-height:1.25}",
".cmap{display:flex;gap:6px;overflow-x:auto;padding:14px 4px 8px;border:1px solid var(--hair);border-radius:12px;background:var(--surface)}",
".cphase{display:flex;flex-direction:column;gap:6px}",
".cphase .pl{font-family:var(--mono);font-size:.66rem;text-transform:uppercase;letter-spacing:.04em;color:#54585A;padding:0 4px}",
".ccols{display:flex;gap:6px}",
".ccol{min-width:50px;display:flex;flex-direction:column;align-items:center;gap:5px;border-radius:8px;padding:6px 4px}",
".ccol .cw{font-family:var(--mono);font-size:.66rem;color:#54585A}",
".cpin{width:20px;height:20px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.18);cursor:pointer}",
".cpin:focus-visible{outline:3px solid var(--focus);outline-offset:2px}",
".cempty{width:10px;height:10px;border-radius:50%;background:#EDEAE2}",
".glossweek{border:1px solid var(--hair);border-radius:12px;padding:6px 16px 14px;margin-bottom:14px;background:var(--surface)}",
".cite{font-size:.85rem;color:#4A4A4A;border-left:3px solid var(--hair);padding-left:10px;margin:.5em 0 0}",
".rlink{font-weight:600;font-size:.9rem}",
".slideshow-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:16px;align-items:start}",
".herogrid{display:grid;grid-template-columns:1.6fr 1fr;gap:24px;align-items:center}",
".heroimg img{width:100%;max-height:260px;object-fit:cover;border-radius:14px;box-shadow:0 8px 24px rgba(26,26,26,.14)}",
"@media (max-width:760px){.herogrid{grid-template-columns:1fr}.heroimg{display:none}}",
".slide-kp{background:var(--raised);border:1px solid var(--hair);border-radius:12px;padding:16px}",
"@media (max-width:760px){.slideshow-grid{grid-template-columns:1fr}}",
"@media (max-width:640px){.toolgrid{grid-template-columns:1fr}}"
].join("\n");
(function(){ var s=document.createElement('style'); s.textContent=CSS; document.head.appendChild(s); })();

/* ---------- state (the student owns this; saved on their device) ---------- */
var SKEY='bfs218-cartography-v1';
function loadCarto(){ try{ var a=JSON.parse(localStorage.getItem(SKEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function saveCarto(){ try{ localStorage.setItem(SKEY, JSON.stringify(CARTO)); }catch(e){} }
var CARTO = loadCarto();

/* ---------- helpers ---------- */
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function linkify(t){
  t=String(t==null?'':t); var re=/(https?:\/\/[^\s]+|doi:\s*10\.\d{4,}\/[^\s]+|\b10\.\d{4,}\/[^\s]+)/gi, out='', last=0, m;
  while((m=re.exec(t))){
    out+=esc(t.slice(last,m.index));
    var full=m[0], trail=''; var tm=full.match(/[).,;:]+$/); if(tm){ trail=tm[0]; full=full.slice(0,full.length-trail.length); }
    var href=full; if(/^10\./.test(full)) href='https://doi.org/'+full; else if(/^doi:/i.test(full)) href='https://doi.org/'+full.replace(/^doi:\s*/i,'');
    out+='<a href="'+esc(href)+'" target="_blank" rel="noopener">'+esc(full)+'</a>'+esc(trail);
    last=m.index+m[0].length;
  }
  return out+esc(t.slice(last));
}
function phaseOf(id){ for(var i=0;i<(D.phases||[]).length;i++){ if(D.phases[i].id===id) return D.phases[i]; } return {name:'',accent:'#5B7A8C',fill:'#eee'}; }
function week(n){ for(var i=0;i<(D.weeks||[]).length;i++){ if(D.weeks[i].number===n) return D.weeks[i]; } return null; }
function pad(n){ return (n<10?'0':'')+n; }
function toast(msg){ OVERLAY.insertAdjacentHTML('beforeend','<div class="toast" role="status">'+esc(msg)+'</div>'); var t=OVERLAY.lastChild; setTimeout(function(){ if(t&&t.parentNode) t.parentNode.removeChild(t); },2600); }
function dl(name,text){ var b=new Blob([text],{type:'application/json'}); var u=URL.createObjectURL(b); var a=document.createElement('a'); a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(u);},1000); }
function contourSVG(){ return '<svg class="hcontour" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true">'+
  [40,90,150,220,300].map(function(y,i){ return '<path d="M0 '+y+' C 200 '+(y-30)+', 420 '+(y+34)+', 640 '+y+' S 1020 '+(y-26)+', 1200 '+(y+10)+'" fill="none" stroke="#5B7A8C" stroke-opacity="0.16" stroke-width="1.5"/>'; }).join('')+'</svg>'; }

/* ---------- modal with focus trap + return ---------- */
var lastFocus=null;
function openModal(html){
  lastFocus=document.activeElement;
  OVERLAY.innerHTML='<div class="backdrop" data-close="1"><div class="modal" role="dialog" aria-modal="true">'+html+'</div></div>';
  var m=OVERLAY.querySelector('.modal'); var f=m.querySelector('input,textarea,select,button,[href]'); if(f) f.focus(); else m.focus();
  OVERLAY.querySelector('.backdrop').addEventListener('mousedown',function(e){ if(e.target.getAttribute('data-close')) closeModal(); });
  document.addEventListener('keydown',modalKey);
}
function modalKey(e){
  if(e.key==='Escape'){ closeModal(); return; }
  if(e.key!=='Tab') return;
  var m=OVERLAY.querySelector('.modal'); if(!m) return;
  var f=m.querySelectorAll('a[href],button:not([disabled]),input,textarea,select'); if(!f.length) return;
  var first=f[0],last=f[f.length-1];
  if(e.shiftKey&&document.activeElement===first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey&&document.activeElement===last){ e.preventDefault(); first.focus(); }
}
function closeModal(){ OVERLAY.innerHTML=''; document.removeEventListener('keydown',modalKey); if(lastFocus&&lastFocus.focus) lastFocus.focus(); }

/* ---------- navigation ---------- */
var ROUTES=[
  {sec:'Course'},
  {id:'home',label:'Home',hash:'#/home'},
  {id:'assignments',label:'Assignments',hash:'#/assignments'},
  {sec:'Learning tools'},
  {id:'glossary',label:'Glossary and Thinkers',hash:'#/glossary'},
  {id:'cartography',label:'Living Cartography',hash:'#/cartography'},
  {id:'cards',label:'Self-check cards',hash:'#/cards'},
  {id:'cases',label:'Case studies',hash:'#/cases'}
];
function renderNav(active){
  NAV.innerHTML=ROUTES.map(function(r){
    if(r.sec) return '<div class="navsec">'+esc(r.sec)+'</div>';
    return '<a href="'+r.hash+'"'+(r.id===active?' aria-current="page"':'')+'>'+esc(r.label)+'</a>';
  }).join('');
}

/* ---------- media embeds ---------- */
function videoBlock(wk){
  var v=wk.video||{};
  if(!v.url&&!v.id) return '<div class="aspect"><div class="placeholder">Your weekly video will appear here once it is posted. It loads only when a student presses play.</div></div>';
  var poster=v.poster?'<img src="'+esc(v.poster)+'" alt="">':'';
  return '<div class="aspect" data-video="1">'+poster+'<button class="playbtn" data-action="play-video" data-week="'+wk.number+'" aria-label="Play the Week '+wk.number+' video"><span class="circ" aria-hidden="true">&#9654;</span><span>Play the video</span><span class="muted" style="font-size:.8rem">Loads only when you click</span></button></div>';
}
function videoEmbed(v,label){
  if(v.provider==='youtube'||/youtu/.test(v.url||v.id||'')){ var id=v.id||(String(v.url).match(/[?&]v=([^&]+)/)||[])[1]||String(v.url).split('/').pop(); return '<iframe src="https://www.youtube-nocookie.com/embed/'+esc(id)+'?rel=0" title="'+esc(label||'Video')+'" allow="fullscreen" allowfullscreen></iframe>'; }
  if(v.provider==='vimeo'||/vimeo/.test(v.url||'')){ var vid=v.id||String(v.url).split('/').pop(); return '<iframe src="https://player.vimeo.com/video/'+esc(vid)+'" title="'+esc(label||'Video')+'" allowfullscreen></iframe>'; }
  return '<video controls preload="metadata" '+(v.poster?'poster="'+esc(v.poster)+'"':'')+'><source src="'+esc(v.url)+'"></video>';
}
function readingMedia(r){ return '<div class="aspect">'+videoEmbed({provider:r.provider,url:r.url})+'</div>'; }

/* ---------- slideshow ---------- */
function kpHTML(wk,cur){
  var s=wk.slides||{}, ins=(s.insights||[])[cur-1], count=s.count||0;
  var h='<div class="eyebrow">The deeper point &middot; slide '+cur+' of '+count+'</div>';
  if(!ins) return h+'<p class="muted" style="margin:0">Follow the narration for this slide.</p>';
  return h+'<p style="margin:.2em 0 0;font-size:1.02rem;line-height:1.55">'+esc(ins)+'</p>';
}
function slideBlock(wk){
  var s=wk.slides||{};
  if(!s.available||!s.count) return '<div class="aspect"><div class="placeholder">The slideshow for this week will appear here once the deck is posted.</div></div>';
  var dir=s.dir||('slides/week-'+pad(wk.number));
  return '<div class="slidewrap" data-week="'+wk.number+'" data-count="'+s.count+'" data-dir="'+esc(dir)+'" tabindex="0" aria-label="Slideshow for Week '+wk.number+', use arrow keys to move">'+
    '<div class="slideshow-grid"><div><div class="aspect"><img id="slide-img" src="'+esc(dir+'/slide-1.png')+'" alt="Slide 1 of '+s.count+'"></div>'+
    '<div style="height:4px;background:var(--hair);border-radius:2px;margin-top:8px"><div id="slide-bar" style="height:100%;width:'+(100/s.count)+'%;background:var(--red);border-radius:2px"></div></div>'+
    '<div class="slidebar"><button class="btn" data-action="slide-prev">Previous</button><span class="count"><span id="slide-n">1</span> / '+s.count+'</span><button class="btn" data-action="slide-next">Next</button></div></div>'+
    '<aside class="slide-kp" id="slide-kp" aria-live="polite">'+kpHTML(wk,1)+'</aside></div></div>';
}
function stepSlide(wrap,dir){
  if(!wrap) return;
  var count=parseInt(wrap.getAttribute('data-count'),10),dirp=wrap.getAttribute('data-dir');
  var nEl=wrap.querySelector('#slide-n'),img=wrap.querySelector('#slide-img'),bar=wrap.querySelector('#slide-bar');
  var cur=parseInt(nEl.textContent,10)+dir; if(cur<1)cur=count; if(cur>count)cur=1;
  nEl.textContent=cur; img.src=dirp+'/slide-'+cur+'.png'; img.alt='Slide '+cur+' of '+count; if(bar) bar.style.width=(100*cur/count)+'%';
  var wk=week(parseInt(wrap.getAttribute('data-week'),10)); var kpEl=document.getElementById('slide-kp'); if(kpEl&&wk) kpEl.innerHTML=kpHTML(wk,cur);
}

/* ---------- home ---------- */
function home(){
  var c=D.course||{},inst=D.instructor||{};
  var toolMeta={glossary:['#5B7A8C','Glossary and Thinkers','Every concept and the people behind it, week by week','#/glossary','A'],
    cartography:['#7C6A93','Living Cartography','Map techno-racism in your own digital life','#/cartography','M'],
    cards:['#6E8B6A','Self-check cards','Practice recalling the ideas in your own words','#/cards','R'],
    cases:['#B07A57','Case studies','Real Canadian examples, tied to the concepts','#/cases','C']};
  var hero='<section id="hero">'+contourSVG()+
    '<div style="position:relative"><div class="htag">'+esc(c.code)+' &middot; '+esc(c.institution||'Seneca Polytechnic')+' &middot; Online, self-paced</div>'+
    '<h1>'+esc(c.title||'')+'</h1><p class="hsub">'+esc(c.subtitle||'')+'. Read, watch, and work through the course at your own pace, with tools that help the ideas take hold.</p>'+
    '<div class="hactions"><a class="btn btn-primary" href="#/week/1">Start with Week 1</a><a class="btn" href="#/glossary">Explore the tools</a></div></div></section>';
  var tools='<h2>Learning tools</h2><div class="toolgrid">'+Object.keys(toolMeta).map(function(k){var t=toolMeta[k];return '<a class="toolcard" href="'+t[3]+'"><div class="ic" style="background:'+t[0]+'22;color:'+t[0]+'">'+t[4]+'</div><b>'+esc(t[1])+'</b><p style="margin:.3em 0 0;color:#4A4A4A;font-size:.92rem">'+esc(t[2])+'</p></a>';}).join('')+'</div>';
  var bands=(D.phases||[]).map(function(p){
    var tiles=(p.weeks||[]).map(function(n){var wk=week(n);if(!wk)return '';return '<a class="wktile" href="#/week/'+n+'" style="background:'+p.fill+'"><span class="wn" style="color:'+p.accent+'">WEEK '+pad(n)+'</span><b>'+esc(wk.title||'')+'</b><span class="muted" style="font-size:.8rem">'+esc(wk.concept||'')+'</span></a>';}).join('');
    return '<h3 style="margin:18px 0 8px;color:'+p.accent+'">'+esc(p.name)+' <span class="muted" style="font-weight:400">Weeks '+p.weeks[0]+' to '+p.weeks[p.weeks.length-1]+'</span></h3><div class="wkgrid">'+tiles+'</div>';
  }).join('');
  var foot='<div class="card" style="margin-top:24px"><div class="eyebrow">A companion to Blackboard</div><p style="margin:0">This site holds the learning materials and private tools. Official course records, submissions, and class discussion live in Blackboard. Nothing here is assessed or tracked.</p></div>';
  return hero+tools+'<h2 style="margin-top:26px">The 14 weeks</h2>'+bands+foot;
}

/* ---------- week page ---------- */
function structList(arr){
  return (arr||[]).map(function(it){ return it.type==='head' ? '<h4 style="margin:14px 0 6px">'+esc(it.text)+'</h4>' : '<p style="margin:.45em 0">'+esc(it.text)+'</p>'; }).join('');
}
function readingLink(r){
  if(r.url) return '<a class="rlink" href="'+esc(r.url)+'" target="_blank" rel="noopener">Access Reading</a>';
  return '<span class="muted" style="font-size:.85rem">Available through the Seneca library.</span>';
}
function weekView(n){
  var wk=week(n); if(!wk) return '<p>Week not found.</p>';
  var p=phaseOf(wk.phaseId);
  function sec(id,title,inner){ return '<section id="sec-'+id+'" class="card" style="scroll-margin-top:14px" aria-labelledby="h-'+id+'"><h2 id="h-'+id+'" style="margin-top:0">'+esc(title)+'</h2>'+inner+'</section>'; }
  function li(x){ return '<li>'+esc(x)+'</li>'; }
  var head='<a class="btn btn-quiet" href="#/home">&#8592; All weeks</a><p class="eyebrow" style="margin-top:14px">Week '+pad(n)+' &middot; <span style="color:'+p.accent+'">'+esc(p.name)+'</span></p><h1>'+esc(wk.title||'')+'</h1><p><span class="tag" style="background:'+p.fill+'"><span class="dot" style="background:'+p.accent+'"></span>'+esc(wk.concept||'')+'</span></p>';
  var defs=[['overview','Overview'],['purpose','Purpose and Learning Outcomes'],['guiding','Guiding Questions'],['concepts','Weekly Concepts'],['readings','Readings'],['slideshow','Interactive Slideshow'],['case','Case Study'],['reflect','Reflection Corner'],['references','References']];
  var jump='<nav class="section-tabs" aria-label="On this page">'+defs.map(function(s){return '<button data-action="jump" data-target="sec-'+s[0]+'">'+esc(s[1])+'</button>';}).join('')+'</nav>';
  var pu=wk.purpose||{statement:[],outcomes:[]};
  var wcases=(D.cases||[]).filter(function(c){return (c.weeks||[]).indexOf(n)>=0;});
  var caseInner=wcases.length?wcases.map(function(c){return '<div style="margin-bottom:14px"><div class="eyebrow">'+esc(c.concept||'')+' &middot; '+esc(c.where||'')+'</div><b>'+esc(c.title)+'</b><p style="margin:.3em 0 0">'+esc(c.summary)+'</p></div>';}).join(''):'<p class="muted">A case study for this week will appear here.</p>';
  var s=
    sec('overview','Overview', (wk.overview&&wk.overview.length)?structList(wk.overview):'<p class="muted">Overview coming soon.</p>')+
    sec('purpose','Purpose and Learning Outcomes', ((pu.statement||[]).map(function(x){return '<p>'+esc(x)+'</p>';}).join(''))+((pu.outcomes&&pu.outcomes.length)?'<div class="eyebrow">By the end of this week you will be able to:</div><ul style="line-height:1.7">'+pu.outcomes.map(li).join('')+'</ul>':''))+
    sec('guiding','Guiding Questions', (wk.guiding&&wk.guiding.length)?'<ol style="line-height:1.8">'+wk.guiding.map(li).join('')+'</ol>':'<p class="muted">Guiding questions coming soon.</p>')+
    sec('concepts','Weekly Concepts', (wk.concepts&&wk.concepts.length)?wk.concepts.map(function(c,ci){return '<div style="margin-bottom:22px;padding-bottom:18px;border-bottom:1px solid var(--hair)"><h3 style="margin:0 0 .4em">'+esc((ci+1)+'. '+c.term)+'</h3>'+((c.paras||[]).map(function(x){return '<p style="margin:.5em 0">'+esc(x)+'</p>';}).join(''))+((c.cites&&c.cites.length)?'<p class="cite"><b>Reference (APA 7th):</b><br>'+c.cites.map(function(x){return esc(x);}).join('<br>')+'</p>':'')+'</div>';}).join(''):'<p class="muted">Concepts coming soon.</p>')+
    sec('readings','Readings', (function(){var rs=wk.readings||[];if(!rs.length)return '<p class="muted">Readings will be listed here.</p>';return rs.map(function(r){if(r.type==='head')return '<h4 style="margin:16px 0 6px">'+esc(r.text)+'</h4>';if(r.type==='video')return '<div class="reading">'+(r.label?'<p style="margin:0 0 8px"><b>'+esc(r.label)+'</b></p>':'')+readingMedia(r)+'</div>';if(r.type==='cite')return '<div class="reading"><p style="margin:0 0 .4em">'+linkify(r.text)+'</p>'+readingLink(r)+'</div>';return '<p style="margin:.45em 0">'+esc(r.text)+'</p>';}).join('');})())+
    sec('slideshow','Interactive Slideshow', slideBlock(wk)+'<h3 style="margin-top:18px">Narrated walkthrough</h3>'+videoBlock(wk)+'<div class="notebar" style="margin-top:12px"><b>Pause and notice.</b> As you move through the slides, stop on one that surprises you and ask: who does this system assume I am, and who does it leave out?</div>')+
    sec('case','Case Study', caseInner)+
    sec('reflect','Reflection Corner', '<p class="muted">One question to carry through the whole course. It is not a quiz. There is no right answer. It is here to make you think.</p><blockquote style="border-left:4px solid '+p.accent+';margin:14px 0 0;padding:6px 0 6px 18px;font-size:1.2rem;line-height:1.5">'+esc((D.course||{}).reflectionQuestion||'')+'</blockquote>')+
    sec('references','References', (function(){var rf=wk.references||[];return rf.length?rf.map(function(r){return '<div class="reading"><p style="margin:0">'+linkify(r)+'</p></div>';}).join(''):'<p class="muted">References will be listed here.</p>';})());
  var cta='<div class="card"><div class="eyebrow">Make it yours</div><p>'+esc(wk.mapPrompt||'Add a moment from your own digital life to your Living Cartography this week.')+'</p><a class="btn btn-primary" href="#/cartography?week='+n+'">Add this week to your Living Cartography</a></div>';
  return head+jump+s+cta;
}

/* ---------- glossary and thinkers, by week ---------- */
function glossary(){
  var sel=(location.hash.split('?week=')[1])||'all';
  var weekOpts='<option value="all"'+(sel==='all'?' selected':'')+'>All weeks</option>'+(D.weeks||[]).map(function(w){return '<option value="'+w.number+'"'+(String(w.number)===String(sel)?' selected':'')+'>Week '+pad(w.number)+': '+esc(w.title||'')+'</option>';}).join('');
  var head='<h1>Glossary and Thinkers</h1><p class="lede">The language of the course in plain words, and the people behind the ideas, organized by week.</p>'+
    '<label for="gsearch">Search every term</label><input id="gsearch" data-action="g" placeholder="Type a word, for example: coded exposure" autocomplete="off">'+
    '<div id="gsearchout" style="margin-top:12px"></div>'+
    '<label for="gweek" style="margin-top:16px">Or browse by week</label><select id="gweek" data-action="gweek" style="max-width:420px">'+weekOpts+'</select>'+
    '<div id="gout" style="margin-top:16px">'+glossaryByWeek(sel)+'</div>';
  return head;
}
function glossaryByWeek(sel){
  var ws=(sel==='all')?(D.weeks||[]):[week(parseInt(sel,10))].filter(Boolean);
  return ws.map(function(w){
    var p=phaseOf(w.phaseId);
    var cons=(w.concepts||[]).map(function(c){return '<div style="margin:10px 0"><b>'+esc(c.term)+'</b><p style="margin:.25em 0 .3em">'+esc((c.paras||[]).join(' '))+'</p>'+((c.cites&&c.cites.length)?'<p class="cite">'+esc(c.cites[0])+'</p>':'')+'</div>';}).join('');
    var thinks=(D.thinkers||[]).filter(function(t){return (t.weeks||[]).indexOf(w.number)>=0;});
    var tk=thinks.length?'<div class="eyebrow" style="margin-top:10px">Thinkers this week</div>'+thinks.map(function(t){return '<p style="margin:.2em 0"><b>'+esc(t.name)+'.</b> '+esc(t.note)+'</p>';}).join(''):'';
    return '<div class="glossweek"><div class="eyebrow" style="color:'+p.accent+';margin-top:8px">Week '+pad(w.number)+' &middot; '+esc(w.title||'')+'</div>'+(cons||'<p class="muted">No concepts listed.</p>')+tk+'</div>';
  }).join('');
}
function glossarySearch(q){
  q=(q||'').toLowerCase().trim(); if(!q) return '';
  var hits=(D.glossary||[]).filter(function(g){return (g.term+' '+g.def).toLowerCase().indexOf(q)>=0;});
  if(!hits.length) return '<p class="muted">No matches. Try another word.</p>';
  return '<div class="grid grid-2">'+hits.map(function(g){return '<div class="card"><b>'+esc(g.term)+'</b><p style="margin:.3em 0 .4em">'+esc(g.def||'')+'</p>'+(g.cite?'<p class="cite">'+esc(g.cite)+'</p>':'')+'<div class="mono" style="font-size:.72rem;color:#54585A;margin-top:6px">Weeks: '+(g.weeks||[]).map(function(n){return '<a href="#/week/'+n+'">W'+pad(n)+'</a>';}).join(', ')+'</div></div>';}).join('')+'</div>';
}

/* ---------- self-check cards ---------- */
function cards(){
  var pre=(location.hash.split('?week=')[1])||'';
  var opts='<option value="">All weeks</option>'+(D.weeks||[]).map(function(w){return '<option value="'+w.number+'"'+(String(w.number)===String(pre)?' selected':'')+'>Week '+pad(w.number)+'</option>';}).join('');
  return '<h1>Self-check cards</h1><p class="lede">Practice recalling the key ideas in your own words, then flip to check. Private study, never a test.</p>'+
    '<label for="card-week">Show cards for</label><select id="card-week" data-action="cw" style="max-width:280px">'+opts+'</select><div id="cardgrid" style="margin-top:16px">'+cardGrid(pre)+'</div>';
}
function cardGrid(wk){
  var cs=(D.cards||[]).filter(function(c){return !wk||(c.weeks||[]).indexOf(parseInt(wk,10))>=0;});
  if(!cs.length) return '<p class="muted">No cards for this selection.</p>';
  return '<div class="grid grid-2">'+cs.map(function(c){return '<div class="flip" data-action="flip" tabindex="0" role="button" aria-label="Flashcard: '+esc(c.front)+'. Activate to flip."><div class="flip-inner"><div class="flip-face"><div class="eyebrow">Recall</div><b style="font-size:1.1rem">'+esc(c.front)+'</b><span class="muted" style="margin-top:auto;font-size:.8rem">Click to flip</span></div><div class="flip-face flip-back"><div class="eyebrow">Definition</div><p style="margin:0">'+esc(c.back)+'</p></div></div></div>';}).join('')+'</div>';
}

/* ---------- case studies ---------- */
function cases(){
  return '<h1>Case studies</h1><p class="lede">Real Canadian examples of techno-racism, as worked cases you can connect to the concepts.</p>'+(D.cases||[]).map(function(c){return '<div class="card"><div class="eyebrow">'+esc(c.concept||'')+' &middot; '+esc(c.where||'')+'</div><h3 style="margin:.2em 0 .4em">'+esc(c.title)+'</h3><p style="margin:0 0 .6em">'+esc(c.summary)+'</p><div class="mono" style="font-size:.72rem;color:#54585A">Weeks: '+(c.weeks||[]).map(function(n){return '<a href="#/week/'+n+'">W'+pad(n)+'</a>';}).join(', ')+'</div></div>';}).join('');
}

function assignments(){
  var as=D.assignments||[];
  return '<h1>Assignments</h1><p class="lede">A preparation overview for the main course tasks. Use this page to plan your work, then use Blackboard for official instructions, submission, and course records.</p>'+as.map(function(a){return '<div class="card"><div class="eyebrow">Blackboard task</div><h3 style="margin:.1em 0 .4em">'+esc(a.name)+'</h3><p style="margin:0">'+esc(a.blurb||'')+'</p></div>';}).join('')+'<div class="card"><div class="eyebrow">Where you hand in</div><p style="margin:0">All official instructions and submission points live in Blackboard. This page is a preparation guide.</p></div>';
}

/* ---------- living cartography (visual + save) ---------- */
function cartography(){
  var pre=(location.hash.split('?week=')[1])||'';
  return '<h1>Living Cartography</h1><p class="lede">Your own growing map of where technology touches race in your digital life. It is yours, it saves on your device, and it is not assessed here.</p>'+
    '<div class="notebar"><b>Your privacy comes first.</b> You never have to share anything personal. Describe a moment in words, map a public screen, or use a general example. All three are full and equal.</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:10px;margin:14px 0"><button class="btn btn-primary" data-action="carto-add" data-week="'+esc(pre)+'">Add an entry</button><button class="btn" data-action="carto-export">Save to a file</button><button class="btn" data-action="carto-import">Load from a file</button><button class="btn btn-quiet" data-action="carto-clear">Clear my map</button><input type="file" id="carto-file" accept="application/json" hidden></div>'+
    '<h2>Your map</h2><p class="muted" style="margin-top:-4px">Each pin is a moment you mapped. Watch your map fill across the term.</p>'+cartoMap()+
    '<h2 style="margin-top:22px">Your entries ('+CARTO.length+')</h2>'+cartoEntries();
}
function cartoMap(){
  return '<div class="cmap">'+(D.phases||[]).map(function(p){
    var cols=(p.weeks||[]).map(function(n){
      var es=CARTO.map(function(e,i){return {e:e,i:i};}).filter(function(o){return o.e.week===n;});
      var pins=es.length?es.map(function(o){return '<button class="cpin" style="background:'+p.accent+'" data-action="carto-view" data-i="'+o.i+'" aria-label="Week '+n+' entry: '+esc(o.e.title)+'" title="'+esc(o.e.title)+'"></button>';}).join(''):'<span class="cempty" aria-hidden="true"></span>';
      return '<div class="ccol" style="background:'+p.fill+'66"><span class="cw">W'+pad(n)+'</span>'+pins+'</div>';
    }).join('');
    return '<div class="cphase"><span class="pl" style="color:'+p.accent+'">'+esc(p.name)+'</span><div class="ccols">'+cols+'</div></div>';
  }).join('')+'</div>';
}
function cartoEntries(){
  if(!CARTO.length) return '<div class="card"><p class="muted" style="margin:0">Your map is empty. Add your first entry and a pin will appear above.</p></div>';
  return CARTO.map(function(e,i){var p=phaseOf((week(e.week)||{}).phaseId);return '<div class="card"><div class="mono" style="font-size:.74rem;color:#54585A">W'+pad(e.week)+' &middot; '+esc(e.concept||'')+'</div><b>'+esc(e.title)+'</b><p style="margin:.4em 0">'+esc(e.note||'')+'</p><button class="btn btn-quiet" data-action="carto-del" data-i="'+i+'">Delete this entry</button></div>';}).join('');
}
function cartoForm(pre){
  var opts=(D.weeks||[]).map(function(w){return '<option value="'+w.number+'"'+(String(w.number)===String(pre)?' selected':'')+'>Week '+pad(w.number)+': '+esc(w.title||'')+'</option>';}).join('');
  return '<h2 style="margin-top:0">Add a map entry</h2><label for="ce-week">Which week</label><select id="ce-week">'+opts+'</select><label for="ce-title">A short title</label><input id="ce-title" placeholder="For example: The autofill that assumed"><label for="ce-note">What did you notice, and how does it tie to the concept?</label><textarea id="ce-note"></textarea><label for="ce-concept">Concept (optional)</label><input id="ce-concept" placeholder="For example: coded exposure"><div style="margin-top:16px;display:flex;gap:10px"><button class="btn btn-primary" data-action="carto-save">Place this pin</button><button class="btn btn-quiet" data-action="modal-close">Cancel</button></div>';
}
function cartoViewModal(i){
  var e=CARTO[i]; if(!e) return; var p=phaseOf((week(e.week)||{}).phaseId);
  openModal('<div class="eyebrow" style="color:'+p.accent+'">Week '+pad(e.week)+' &middot; '+esc(e.concept||'')+'</div><h2 style="margin:.2em 0 .4em">'+esc(e.title)+'</h2><p>'+esc(e.note||'')+'</p><div style="margin-top:14px;display:flex;gap:10px"><button class="btn btn-quiet" data-action="modal-close">Close</button><button class="btn btn-quiet" data-action="carto-del" data-i="'+i+'">Delete</button></div>');
}

/* ---------- render dispatch ---------- */
function render(){
  var h=location.hash||'#/home', path=h.replace(/^#\//,'').split('?')[0], html, active;
  if(path.indexOf('week/')===0){ active='home'; html=weekView(parseInt(path.split('/')[1],10)); }
  else if(path==='glossary'){ active='glossary'; html=glossary(); }
  else if(path==='cartography'){ active='cartography'; html=cartography(); }
  else if(path==='cards'){ active='cards'; html=cards(); }
  else if(path==='cases'){ active='cases'; html=cases(); }
  else if(path==='assignments'){ active='assignments'; html=assignments(); }
  else { active='home'; html=home(); }
  renderNav(active); MAIN.innerHTML=html; MAIN.focus(); window.scrollTo(0,0);
}

/* ---------- events ---------- */
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-action]'); if(!t) return;
  var a=t.getAttribute('data-action');
  if(a==='play-video'){ var wk=week(parseInt(t.getAttribute('data-week'),10)); t.closest('.aspect').innerHTML=videoEmbed(wk.video,'Week '+wk.number+' video'); }
  else if(a==='jump'){ var je=document.getElementById(t.getAttribute('data-target')); if(je) je.scrollIntoView({behavior:'smooth',block:'start'}); }
  else if(a==='slide-prev'||a==='slide-next'){ stepSlide(t.closest('.slidewrap'),a==='slide-next'?1:-1); }
  else if(a==='flip'){ t.classList.toggle('flipped'); }
  else if(a==='carto-add'){ openModal(cartoForm(t.getAttribute('data-week'))); }
  else if(a==='carto-save'){ saveEntry(); }
  else if(a==='carto-del'){ CARTO.splice(parseInt(t.getAttribute('data-i'),10),1); saveCarto(); closeModal(); render(); toast('Entry deleted.'); }
  else if(a==='carto-view'){ cartoViewModal(parseInt(t.getAttribute('data-i'),10)); }
  else if(a==='carto-export'){ if(!CARTO.length){ toast('Your map is empty.'); return; } dl('my-bfs218-cartography.json', JSON.stringify(CARTO,null,2)); toast('Saved to a file you keep.'); }
  else if(a==='carto-import'){ document.getElementById('carto-file').click(); }
  else if(a==='carto-clear'){ if(confirm('Clear your whole map? This cannot be undone. Save to a file first if you want to keep it.')){ CARTO=[]; saveCarto(); render(); toast('Your map was cleared.'); } }
  else if(a==='modal-close'){ closeModal(); }
});
document.addEventListener('keydown',function(e){
  var f=e.target.closest&&e.target.closest('[data-action=flip]');
  if(f&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); f.classList.toggle('flipped'); }
  var sw=e.target.closest&&e.target.closest('.slidewrap');
  if(sw&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){ e.preventDefault(); stepSlide(sw,e.key==='ArrowRight'?1:-1); }
});
document.addEventListener('input',function(e){
  if(e.target.id==='gsearch'){ document.getElementById('gsearchout').innerHTML=glossarySearch(e.target.value); }
});
document.addEventListener('change',function(e){
  if(e.target.id==='gweek'){ location.hash='#/glossary?week='+e.target.value; }
  else if(e.target.id==='card-week'){ document.getElementById('cardgrid').innerHTML=cardGrid(e.target.value); }
  else if(e.target.id==='carto-file'){ var fl=e.target.files[0]; if(!fl) return; var rd=new FileReader(); rd.onload=function(){ try{ var a=JSON.parse(rd.result); if(Array.isArray(a)){ CARTO=a; saveCarto(); render(); toast('Your map was loaded.'); } else toast('That file did not look like a saved map.'); }catch(err){ toast('Could not read that file.'); } }; rd.readAsText(fl); }
});
function saveEntry(){
  var t=document.getElementById('ce-title').value.trim();
  if(!t){ toast('Add a short title to place your pin.'); return; }
  CARTO.push({week:parseInt(document.getElementById('ce-week').value,10),title:t,note:document.getElementById('ce-note').value.trim(),concept:document.getElementById('ce-concept').value.trim()});
  saveCarto(); closeModal(); render(); toast('Pin placed. Your map grew.');
}

window.addEventListener('hashchange',render);
render();
})();
