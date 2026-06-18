/* BFS218 Atlas: learning companion. Vanilla JS, self-contained, no build step.
   Companion to Blackboard: no grading, no student-to-student interaction here. */
(function(){
"use strict";
var D = window.BFS218 || {};
var MAIN = document.getElementById('main');
var NAV = document.getElementById('nav');
var OVERLAY = document.getElementById('overlay');

/* ---------- state (localStorage; the student owns this) ---------- */
var SKEY = 'bfs218-state-v1';
function loadState(){
  try{ var s = JSON.parse(localStorage.getItem(SKEY)||'{}'); if(typeof s!=='object'||!s) s={}; return s; }
  catch(e){ return {}; }
}
function saveState(){ try{ localStorage.setItem(SKEY, JSON.stringify(STATE)); }catch(e){} }
var STATE = loadState();
STATE.cartography = STATE.cartography || [];
STATE.selfcheck = STATE.selfcheck || {};
STATE.pacing = STATE.pacing || '';

/* ---------- helpers ---------- */
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function phaseOf(id){ for(var i=0;i<(D.phases||[]).length;i++){ if(D.phases[i].id===id) return D.phases[i]; } return {name:'',accent:'#999',fill:'#eee'}; }
function week(n){ for(var i=0;i<(D.weeks||[]).length;i++){ if(D.weeks[i].number===n) return D.weeks[i]; } return null; }
function nl2p(t){ return String(t||'').split(/\n+/).filter(function(x){return x.trim();}).map(function(x){return '<p>'+esc(x)+'</p>';}).join(''); }
function toast(msg){ OVERLAY.innerHTML = '<div class="toast" role="status">'+esc(msg)+'</div>'; setTimeout(function(){ OVERLAY.innerHTML=''; }, 2600); }
function dl(name, text){ var b=new Blob([text],{type:'application/json'}); var u=URL.createObjectURL(b); var a=document.createElement('a'); a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(u);},1000); }

/* ---------- modal with focus trap + return ---------- */
var lastFocus=null;
function openModal(html){
  lastFocus = document.activeElement;
  OVERLAY.innerHTML = '<div class="backdrop" data-close="1"><div class="modal" role="dialog" aria-modal="true">'+html+'</div></div>';
  var modal = OVERLAY.querySelector('.modal');
  var f = modal.querySelector('input,textarea,select,button,[href]'); if(f) f.focus(); else modal.focus();
  OVERLAY.querySelector('.backdrop').addEventListener('mousedown', function(e){ if(e.target.getAttribute('data-close')) closeModal(); });
  document.addEventListener('keydown', modalKey);
}
function modalKey(e){
  if(e.key==='Escape'){ closeModal(); return; }
  if(e.key!=='Tab') return;
  var m = OVERLAY.querySelector('.modal'); if(!m) return;
  var f = m.querySelectorAll('a[href],button:not([disabled]),input,textarea,select'); if(!f.length) return;
  var first=f[0], last=f[f.length-1];
  if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
}
function closeModal(){ OVERLAY.innerHTML=''; document.removeEventListener('keydown', modalKey); if(lastFocus&&lastFocus.focus) lastFocus.focus(); }

/* ---------- navigation ---------- */
var ROUTES = [
  {sec:'Course'},
  {id:'home', label:'Home', hash:'#/home'},
  {sec:'Learning tools'},
  {id:'glossary', label:'Glossary and thinkers', hash:'#/glossary'},
  {id:'cartography', label:'Living Cartography', hash:'#/cartography'},
  {id:'cards', label:'Self-check cards', hash:'#/cards'},
  {id:'cases', label:'Case studies', hash:'#/cases'},
  {sec:'Yours'},
  {id:'data', label:'Your data', hash:'#/data'}
];
function renderNav(active){
  NAV.innerHTML = ROUTES.map(function(r){
    if(r.sec) return '<div class="navsec">'+esc(r.sec)+'</div>';
    return '<a href="'+r.hash+'"'+(r.id===active?' aria-current="page"':'')+'>'+esc(r.label)+'</a>';
  }).join('');
}

/* ---------- video facade ---------- */
function videoBlock(wk){
  var v = wk.video||{};
  if(!v.url && !v.id){
    return '<div class="aspect"><div class="placeholder">Your weekly video will appear here once it is posted. The instructor records a short walkthrough for each week.</div></div>';
  }
  var poster = v.poster ? '<img src="'+esc(v.poster)+'" alt="">' : '';
  return '<div class="aspect" data-video="1" data-week="'+wk.number+'">'+poster+
    '<button class="playbtn" data-action="play-video" data-week="'+wk.number+'" aria-label="Play the Week '+wk.number+' video"><span class="circ" aria-hidden="true">&#9654;</span><span>Play the video</span><span class="muted" style="font-size:.8rem">Loads only when you click</span></button></div>';
}
function videoEmbed(wk){
  var v = wk.video||{};
  if(v.provider==='youtube'||/youtu/.test(v.url||'')){
    var id = v.id || (String(v.url).match(/[?&]v=([^&]+)/)||[])[1] || String(v.url).split('/').pop();
    return '<iframe src="https://www.youtube-nocookie.com/embed/'+esc(id)+'?rel=0" title="Week '+wk.number+' video" allow="encrypted-media; fullscreen" allowfullscreen></iframe>';
  }
  if(v.provider==='vimeo'||/vimeo/.test(v.url||'')){
    var vid = v.id || String(v.url).split('/').pop();
    return '<iframe src="https://player.vimeo.com/video/'+esc(vid)+'" title="Week '+wk.number+' video" allow="fullscreen" allowfullscreen></iframe>';
  }
  return '<video controls preload="metadata" '+(v.poster?'poster="'+esc(v.poster)+'"':'')+'><source src="'+esc(v.url)+'"></video>';
}
function urlEmbed(url,prov){
  if(prov==='youtube'||/youtu/.test(url)){ var id=(String(url).match(/[?&]v=([^&]+)/)||[])[1]||String(url).split('/').pop(); return '<div class="aspect"><iframe src="https://www.youtube-nocookie.com/embed/'+esc(id)+'?rel=0" title="Reading video" allow="fullscreen" allowfullscreen></iframe></div>'; }
  if(prov==='vimeo'||/vimeo/.test(url)){ var vid=String(url).split('/').pop(); return '<div class="aspect"><iframe src="https://player.vimeo.com/video/'+esc(vid)+'" title="Reading video" allowfullscreen></iframe></div>'; }
  return '<div class="aspect"><video controls preload="none"><source src="'+esc(url)+'"></video></div>';
}

/* ---------- slideshow ---------- */
function slideBlock(wk){
  var s = wk.slides||{};
  if(!s.available || !s.count){
    return '<div class="aspect"><div class="placeholder">The interactive slideshow for this week will appear here. Until the deck is posted, you can follow the readings and the video.</div></div>';
  }
  return '<div class="slidewrap" data-slides="'+wk.number+'" data-count="'+s.count+'" data-dir="'+esc(s.dir||('slides/week-'+pad(wk.number)))+'">'+
    '<div class="aspect"><img id="slide-img" src="'+esc((s.dir||('slides/week-'+pad(wk.number)))+'/slide-1.png')+'" alt="Slide 1 of '+s.count+'"></div>'+
    '<div class="slidebar"><button class="btn" data-action="slide-prev">Previous</button>'+
    '<span class="count"><span id="slide-n">1</span> / '+s.count+'</span>'+
    '<button class="btn" data-action="slide-next">Next</button></div></div>';
}
function pad(n){ return (n<10?'0':'')+n; }

/* ---------- routes ---------- */
function home(){
  var c = D.course||{};
  var inst = D.instructor||{};
  var bands = (D.phases||[]).map(function(p){
    var rows = (p.weeks||[]).map(function(n){
      var wk = week(n); if(!wk) return '';
      return '<a class="weekrow" href="#/week/'+n+'"><span class="weeknum">W'+pad(n)+'</span><span><b>'+esc(wk.title||('Week '+n))+'</b><br><span class="muted" style="font-size:.9rem">'+esc(wk.concept||'')+'</span></span></a>';
    }).join('');
    return '<div class="phase-band" style="background:'+p.fill+'"><div class="eyebrow" style="color:'+p.accent+'">'+esc(p.name)+' &middot; Weeks '+p.weeks[0]+' to '+p.weeks[p.weeks.length-1]+'</div>'+rows+'</div>';
  }).join('');
  return '<p class="eyebrow">'+esc(c.code)+' &middot; '+esc(c.institution||'Seneca Polytechnic')+'</p>'+
    '<h1>'+esc(c.title||'')+'</h1>'+
    '<p class="lede">'+esc(c.subtitle||'')+'. A place to read, watch, and learn your way through the course, with tools that help the ideas stick. This site is a companion to Blackboard. Your grades, discussion, and official submissions live in Blackboard.</p>'+
    '<div class="card"><div class="eyebrow">Your instructor</div><b>'+esc(inst.name||'')+'</b><div class="muted">'+esc(inst.role||'')+'</div></div>'+
    '<h2>The 14 weeks</h2>'+ bands +
    '<div class="card"><div class="eyebrow">Companion, not the gradebook</div><p style="margin:0">This atlas holds the learning materials and tools. For grades, the discussion board, and handing work in, open the course in Blackboard.</p>'+ blackboardBtn() +'</div>';
}
function blackboardBtn(){
  var u = (D.course||{}).blackboardCourseUrl;
  if(!u) return '<p class="muted" style="margin:.6em 0 0;font-size:.9rem">Blackboard link to be added.</p>';
  return '<a class="btn" style="margin-top:10px" href="'+esc(u)+'" target="_blank" rel="noopener">Open BFS218 in Blackboard</a>';
}

function weekView(n){
  var wk = week(n); if(!wk) return '<p>Week not found.</p>';
  var p = phaseOf(wk.phaseId);
  function clean(a){ return (a||[]).filter(function(r){ return !/^online-asynchronous|^spoken script|^bfs218 week/i.test(r); }); }
  function li(x){ return '<li>'+esc(x)+'</li>'; }
  function sec(id,title,inner){ return '<section id="sec-'+id+'" class="card" style="scroll-margin-top:14px" aria-labelledby="h-'+id+'"><h2 id="h-'+id+'" style="margin-top:0">'+esc(title)+'</h2>'+inner+'</section>'; }
  var head = '<a class="btn btn-quiet" href="#/home">&#8592; All weeks</a>'+
    '<p class="eyebrow" style="margin-top:14px">Week '+pad(n)+' &middot; <span style="color:'+p.accent+'">'+esc(p.name)+'</span></p>'+
    '<h1>'+esc(wk.title||'')+'</h1>'+
    '<p><span class="tag" style="background:'+p.fill+'"><span class="dot" style="background:'+p.accent+'"></span>'+esc(wk.concept||'')+'</span></p>';
  var defs=[['overview','Overview'],['purpose','Purpose and Learning Outcomes'],['guiding','Guiding Questions'],['concepts','Weekly Concepts'],['readings','Readings'],['slideshow','Interactive Slideshow'],['case','Case Study'],['reflect','Reflection Corner'],['references','References']];
  var jump='<nav class="section-tabs" aria-label="On this page">'+defs.map(function(s){return '<button data-action="jump" data-target="sec-'+s[0]+'">'+esc(s[1])+'</button>';}).join('')+'</nav>';
  var pu=wk.purpose||{};
  var wcases=(D.cases||[]).filter(function(c){return (c.weeks||[]).indexOf(n)>=0;});
  var conEx=(wk.concepts||[]).filter(function(c){return c.ex;});
  var caseInner = wcases.length ? wcases.map(function(c){return '<div style="margin-bottom:14px"><div class="eyebrow">'+esc(c.concept||'')+' &middot; '+esc(c.where||'')+'</div><b>'+esc(c.title)+'</b><p style="margin:.3em 0 0">'+esc(c.summary)+'</p></div>';}).join('')
    : (conEx.length ? '<p class="muted">A worked example from this week:</p>'+conEx.map(function(c){return '<div style="margin-bottom:10px"><b>'+esc(c.term)+'</b><p style="margin:.2em 0 0">'+esc(c.ex)+'</p></div>';}).join('') : '<p class="muted">A case study for this week will appear here.</p>');
  var sections =
    sec('overview','Overview', (wk.welcome?'<div class="eyebrow">From your instructor</div><p>'+esc(wk.welcome)+'</p>':'')+(wk.overview?nl2p(wk.overview):'<p class="muted">Overview coming soon.</p>')) +
    sec('purpose','Purpose and Learning Outcomes', (pu.statement?'<p>'+esc(pu.statement)+'</p>':'')+((pu.outcomes&&pu.outcomes.length)?'<div class="eyebrow">By the end of this week you will be able to</div><ul style="line-height:1.7">'+pu.outcomes.map(li).join('')+'</ul>':((pu.statement)?'':'<p class="muted">Outcomes coming soon.</p>'))) +
    sec('guiding','Guiding Questions', (wk.guiding&&wk.guiding.length)?'<ol style="line-height:1.8">'+wk.guiding.map(li).join('')+'</ol>':'<p class="muted">Guiding questions coming soon.</p>') +
    sec('concepts','Weekly Concepts', (wk.concepts&&wk.concepts.length)?wk.concepts.map(function(c,ci){return '<div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--hair)"><h3 style="margin:0 0 .35em">'+esc((ci+1)+'. '+c.term)+'</h3>'+((c.parts||[]).map(function(s){return '<p style="margin:.35em 0">'+esc(s)+'</p>';}).join(''))+((c.cites&&c.cites.length)?'<p class="muted" style="margin:.5em 0 0;font-size:.85rem"><b>Source:</b> '+c.cites.map(function(x){return esc(x);}).join('<br>')+'</p>':'')+'</div>';}).join(''):'<p class="muted">Concepts coming soon.</p>') +
    sec('readings','Readings', (function(){var rs=(wk.readings||[]);if(!rs.length)return '<p class="muted">Readings will be listed here.</p>';return rs.map(function(r){if(r.type==='head')return '<h4 style="margin:16px 0 6px">'+esc(r.text)+'</h4>';if(r.type==='video')return '<div class="reading">'+(r.label?'<p style="margin:0 0 8px"><b>'+esc(r.label)+'</b></p>':'')+urlEmbed(r.url,r.provider)+'</div>';if(r.type==='cite')return '<div class="reading"><p style="margin:0">'+esc(r.text)+'</p></div>';return '<p style="margin:.45em 0">'+esc(r.text)+'</p>';}).join('')+'<p class="muted" style="font-size:.9rem;margin-top:10px">Open any linked files in Blackboard.</p>';})()) +
    sec('slideshow','Interactive Slideshow', slideBlock(wk)+'<h3 style="margin-top:18px">Narrated walkthrough</h3>'+videoBlock(wk)+'<p class="muted" style="font-size:.9rem;margin-top:10px">Click through the slides at your own pace. Captions and a transcript are in the video once it is posted.</p>') +
    sec('case','Case Study', caseInner) +
    sec('reflect','Reflection Corner', '<p class="muted">One question to carry through the whole course. It is not a quiz. There is no right answer. It is here to make you think.</p><blockquote style="border-left:4px solid '+p.accent+';margin:14px 0 0;padding:6px 0 6px 18px;font-size:1.2rem;line-height:1.5">'+esc((D.course||{}).reflectionQuestion||'')+'</blockquote>') +
    sec('references','References', (function(){var rf=clean(wk.references);return rf.length?rf.map(function(r){return '<div class="reading"><p>'+esc(r)+'</p></div>';}).join(''):'<p class="muted">References will be listed here.</p>';})());
  var toolCTA='<div class="card"><div class="eyebrow">Make it yours</div><p>'+esc(wk.mapPrompt||'Add a moment from your own digital life to your Living Cartography this week.')+'</p><a class="btn btn-primary" href="#/cartography?week='+n+'">Add this week to your Living Cartography</a></div>';
  return head+jump+sections+toolCTA;
}

function glossary(){
  var terms = D.glossary||[]; var thinkers = D.thinkers||[];
  return '<h1>Glossary and key thinkers</h1><p class="lede">The language of the course in plain words, and the people behind the ideas.</p>'+
    '<label for="gsearch">Search the glossary</label><input id="gsearch" data-action="glossary-search" placeholder="Type a word, for example: coded exposure" autocomplete="off">'+
    '<div id="glist" style="margin-top:16px">'+glossaryList('')+'</div>'+
    '<h2 style="margin-top:28px">Key thinkers and sources</h2>'+
    thinkers.map(function(t){ return '<div class="card"><b>'+esc(t.name)+'</b><p style="margin:.4em 0 0">'+esc(t.note)+'</p>'+weekLinks(t.weeks)+'</div>'; }).join('');
}
function glossaryList(q){
  q=(q||'').toLowerCase();
  var terms = (D.glossary||[]).filter(function(g){ return !q || (g.term+' '+g.def).toLowerCase().indexOf(q)>=0; });
  if(!terms.length) return '<p class="muted">No matches. Try another word.</p>';
  return '<div class="grid grid-2">'+terms.map(function(g){
    return '<div class="card"><b>'+esc(g.term)+'</b><p style="margin:.4em 0 .6em">'+esc(g.def||'')+'</p>'+
      (g.ex?'<p class="muted" style="margin:0 0 .4em"><b>For example:</b> '+esc(g.ex)+'</p>':'')+
      weekLinks(g.weeks)+'</div>';
  }).join('')+'</div>';
}
function weekLinks(ws){
  if(!ws||!ws.length) return '';
  return '<div class="mono" style="font-size:.74rem;color:var(--ink-soft)">Where you meet this: '+ws.map(function(n){ return '<a href="#/week/'+n+'">W'+pad(n)+'</a>'; }).join(', ')+'</div>';
}

function cartography(){
  var preWeek = (location.hash.split('?week=')[1])||'';
  var entries = STATE.cartography;
  var list = entries.length ? entries.map(function(e,i){
    return '<div class="card"><div class="mono" style="font-size:.74rem;color:var(--ink-soft)">W'+pad(e.week)+' &middot; '+esc(e.concept||'')+'</div><b>'+esc(e.title)+'</b><p style="margin:.4em 0">'+esc(e.note||'')+'</p>'+
      '<button class="btn btn-quiet" data-action="carto-del" data-i="'+i+'">Delete this entry</button></div>';
  }).join('') : '<div class="card"><p class="muted" style="margin:0">Your atlas is blank for now. Add your first entry and watch it grow.</p></div>';
  return '<h1>Living Cartography</h1><p class="lede">Your own map of where technology touches race in your digital life. It is yours. It stays on your device. It is never graded.</p>'+
    '<div class="notebar"><b>Your privacy comes first.</b> You never have to share anything personal. Describe a moment in words, map a public screen, or use a general example. All three are full and equal.</div>'+
    '<button class="btn btn-primary" data-action="carto-add" data-week="'+esc(preWeek)+'">Add an entry</button> '+
    '<a class="btn" href="#/data">Export or manage your data</a>'+
    '<h2 style="margin-top:22px">Your entries ('+entries.length+')</h2>'+list;
}
function cartoForm(preWeek){
  var opts = (D.weeks||[]).map(function(w){ return '<option value="'+w.number+'"'+(String(w.number)===String(preWeek)?' selected':'')+'>Week '+pad(w.number)+': '+esc(w.title||'')+'</option>'; }).join('');
  return '<h2 style="margin-top:0">Add a map entry</h2>'+
    '<label for="ce-week">Which week</label><select id="ce-week">'+opts+'</select>'+
    '<label for="ce-title">A short title</label><input id="ce-title" placeholder="For example: The autofill that assumed">'+
    '<label for="ce-note">What did you notice, and how does it tie to the concept?</label><textarea id="ce-note"></textarea>'+
    '<label for="ce-concept">Concept (optional)</label><input id="ce-concept" placeholder="For example: coded exposure">'+
    '<div style="margin-top:16px;display:flex;gap:10px"><button class="btn btn-primary" data-action="carto-save">Place this pin</button><button class="btn btn-quiet" data-action="modal-close">Cancel</button></div>';
}

function cards(){
  var pre = (location.hash.split('?week=')[1])||'';
  var opts = '<option value="">All weeks</option>'+(D.weeks||[]).map(function(w){ return '<option value="'+w.number+'"'+(String(w.number)===String(pre)?' selected':'')+'>Week '+pad(w.number)+'</option>'; }).join('');
  return '<h1>Self-check cards</h1><p class="lede">Practice recalling the key ideas in your own words. Flip to check. This is private study, never scored, never a test.</p>'+
    '<label for="card-week">Show cards for</label><select id="card-week" data-action="card-filter" style="max-width:280px">'+opts+'</select>'+
    '<div id="cardgrid" style="margin-top:16px">'+cardGrid(pre)+'</div>';
}
function cardGrid(wk){
  var cs = (D.cards||[]).filter(function(c){ return !wk || (c.weeks||[]).indexOf(parseInt(wk,10))>=0; });
  if(!cs.length) return '<p class="muted">No cards for this selection.</p>';
  return '<div class="grid grid-2">'+cs.map(function(c,i){
    return '<div class="flip" data-action="flip" data-i="'+i+'" tabindex="0" role="button" aria-label="Flashcard: '+esc(c.front)+'. Activate to flip.">'+
      '<div class="flip-inner"><div class="flip-face"><div class="eyebrow">Recall</div><b style="font-size:1.1rem">'+esc(c.front)+'</b><span class="muted" style="margin-top:auto;font-size:.8rem">Click to flip</span></div>'+
      '<div class="flip-face flip-back"><div class="eyebrow">In plain words</div><p style="margin:0">'+esc(c.back)+'</p></div></div></div>';
  }).join('')+'</div>';
}

function cases(){
  return '<h1>Case studies</h1><p class="lede">Real Canadian examples of techno-racism, as worked cases you can connect to the concepts.</p>'+
    (D.cases||[]).map(function(c){
      return '<div class="card"><div class="eyebrow">'+esc(c.concept||'')+' &middot; '+esc(c.where||'')+'</div><h3 style="margin:.2em 0 .4em">'+esc(c.title)+'</h3><p style="margin:0 0 .6em">'+esc(c.summary)+'</p>'+weekLinks(c.weeks)+'</div>';
    }).join('');
}

function dataView(){
  var n = STATE.cartography.length;
  return '<h1>Your data</h1><p class="lede">This is everything this site holds about you, in plain words. It lives on your device, in this browser. Nothing here is sent anywhere.</p>'+
    '<div class="card"><div class="eyebrow">What this tool holds</div>'+
      '<p style="margin:0 0 .6em"><b>'+n+'</b> Living Cartography '+(n===1?'entry':'entries')+', plus any private self-check marks and your own pacing notes.</p>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" data-action="export">Export my atlas</button><button class="btn" data-action="wipe">Delete everything</button></div></div>'+
    '<div class="card"><div class="eyebrow">How this tool was built, and what it refuses to do</div>'+
      '<ul style="margin:0;padding-left:1.2em;line-height:1.8"><li>It does not track you.</li><li>It keeps no scores and no attendance.</li><li>It never ranks you against anyone.</li><li>Your words stay in your words. We never replace them with a summary.</li><li>Your data is yours. It stays on your device.</li></ul>'+
      '<p style="margin:.8em 0 0">No tool is neutral, including this one. If something here feels like it watches or judges you, tell your instructor. We will change it.</p></div>';
}

/* ---------- render dispatch ---------- */
function render(){
  var h = location.hash || '#/home';
  var path = h.replace(/^#\//,'').split('?')[0];
  var html, active;
  if(path.indexOf('week/')===0){ active='home'; html=weekView(parseInt(path.split('/')[1],10)); }
  else if(path==='glossary'){ active='glossary'; html=glossary(); }
  else if(path==='cartography'){ active='cartography'; html=cartography(); }
  else if(path==='cards'){ active='cards'; html=cards(); }
  else if(path==='cases'){ active='cases'; html=cases(); }
  else if(path==='data'){ active='data'; html=dataView(); }
  else { active='home'; html=home(); }
  renderNav(active);
  MAIN.innerHTML = html;
  MAIN.focus();
  window.scrollTo(0,0);
}

/* ---------- events ---------- */
document.addEventListener('click', function(e){
  var t = e.target.closest('[data-action]'); if(!t) return;
  var a = t.getAttribute('data-action');
  if(a==='play-video'){ var wk=week(parseInt(t.getAttribute('data-week'),10)); var box=t.closest('.aspect'); box.innerHTML=videoEmbed(wk); }
  else if(a==='jump'){ var je=document.getElementById(t.getAttribute('data-target')); if(je){ je.scrollIntoView({behavior:'smooth',block:'start'}); } }
  else if(a==='slide-prev'||a==='slide-next'){ stepSlide(t.closest('[data-slides]'), a==='slide-next'?1:-1); }
  else if(a==='glossary-peek'){ peek(t.getAttribute('data-term')); }
  else if(a==='carto-add'){ openModal(cartoForm(t.getAttribute('data-week'))); }
  else if(a==='carto-save'){ saveCarto(); }
  else if(a==='carto-del'){ STATE.cartography.splice(parseInt(t.getAttribute('data-i'),10),1); saveState(); render(); toast('Entry deleted.'); }
  else if(a==='modal-close'){ closeModal(); }
  else if(a==='flip'){ t.classList.toggle('flipped'); }
  else if(a==='export'){ dl('my-bfs218-atlas.json', JSON.stringify({cartography:STATE.cartography, selfcheck:STATE.selfcheck, exported:'BFS218 Atlas'}, null, 2)); toast('Your atlas was downloaded.'); }
  else if(a==='wipe'){ if(confirm('Delete everything this tool holds about you? This cannot be undone.')){ STATE={cartography:[],selfcheck:{},pacing:''}; saveState(); render(); toast('All your data was deleted.'); } }
});
document.addEventListener('keydown', function(e){
  var f=e.target.closest&&e.target.closest('[data-action=flip]');
  if(f && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); f.classList.toggle('flipped'); }
});
document.addEventListener('input', function(e){
  var t=e.target;
  if(t.id==='gsearch'){ document.getElementById('glist').innerHTML = glossaryList(t.value); }
  else if(t.id==='card-week'){ document.getElementById('cardgrid').innerHTML = cardGrid(t.value); }
});
function stepSlide(wrap, dir){
  if(!wrap) return;
  var count=parseInt(wrap.getAttribute('data-count'),10), dirp=wrap.getAttribute('data-dir');
  var nEl=wrap.querySelector('#slide-n'), img=wrap.querySelector('#slide-img');
  var cur=parseInt(nEl.textContent,10)+dir; if(cur<1)cur=count; if(cur>count)cur=1;
  nEl.textContent=cur; img.src=dirp+'/slide-'+cur+'.png'; img.alt='Slide '+cur+' of '+count;
}
function peek(term){
  var g=(D.glossary||[]).filter(function(x){return x.term.toLowerCase()===String(term).toLowerCase();})[0];
  if(!g){ g={term:term,def:'See the glossary for this term.',ex:'',weeks:[]}; }
  openModal('<h2 style="margin-top:0">'+esc(g.term)+'</h2><p>'+esc(g.def||'')+'</p>'+(g.ex?'<p class="muted"><b>For example:</b> '+esc(g.ex)+'</p>':'')+'<div style="margin-top:14px"><button class="btn" data-action="modal-close">Close</button> <a class="btn btn-quiet" href="#/glossary">Open the glossary</a></div>');
}
function saveCarto(){
  var t=document.getElementById('ce-title').value.trim();
  if(!t){ toast('Add a short title to place your pin.'); return; }
  STATE.cartography.push({week:parseInt(document.getElementById('ce-week').value,10), title:t, note:document.getElementById('ce-note').value.trim(), concept:document.getElementById('ce-concept').value.trim()});
  saveState(); closeModal(); render(); toast('Pin placed. Your atlas grew.');
}

window.addEventListener('hashchange', render);
render();
})();
