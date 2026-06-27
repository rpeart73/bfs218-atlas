/* SOC122 Corpus: the course source library. Vanilla JS, no build step, no framework.
   Organized by WEEK (the course arc). Each content week pairs one Western reading with
   one Indigenous-scholar reading (Two-Eyed Seeing). A companion to Blackboard:
   no accounts, no grading, no student-to-student interaction.
   Saved + compare live on the student's own device (localStorage). */
(function () {
  'use strict';
  var D = window.BFS218;
  var MC = window.BFS218_MC || {};
  var HAS_EYE = !!(D.course && D.course.frame);
  var HAS_EYE = !!(D.course && D.course.frame);
  if (!D) { document.getElementById('app').textContent = 'Course data did not load.'; return; }

  var SKEY = 'bfs218corpus.v2';
  function load() { try { var o = JSON.parse(localStorage.getItem(SKEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
  function persist() { try { localStorage.setItem(SKEY, JSON.stringify({ saved: state.saved, layout: state.layout, introOpen: state.introOpen, cmpNotes: state.cmpNotes, rcNotes: state.rcNotes, journeyWeek: state.journeyWeek, wkCheck: state.wkCheck, wkReflect: state.wkReflect, act: state.act })); } catch (e) {} }
  var saved0 = load();

  var state = {
    screen: 'journey',
    journeyWeek: saved0.journeyWeek || null,
    stationWeek: null,
    wkCheck: (saved0.wkCheck && typeof saved0.wkCheck === 'object') ? saved0.wkCheck : {},
    wkReflect: (saved0.wkReflect && typeof saved0.wkReflect === 'object') ? saved0.wkReflect : {},
    act: (saved0.act && typeof saved0.act === 'object') ? saved0.act : {},
    layout: saved0.layout || 'byweek',
    search: '',
    activeTypes: [],
    activeWeek: null,
    sort: 'week',
    detailId: null,
    compareIds: [],
    saved: Array.isArray(saved0.saved) ? saved0.saved : [],
    introOpen: saved0.introOpen !== false,
    savedView: false,
    showSynthesis: false,
    lens: 'thematic',
    cmpNotes: (saved0.cmpNotes && typeof saved0.cmpNotes === 'object') ? saved0.cmpNotes : {},
    showModel: false,
    exampleOpen: false,
    rcReading: null,
    rcNotes: (saved0.rcNotes && typeof saved0.rcNotes === 'object') ? saved0.rcNotes : {},
    revealed: {},
    mcSel: {},
    libScroll: 0,
    toast: null,
    cardWeek: null,
    glossWeek: 'all',
    glossSearch: '',
  };
  var refocusSearch = false, focusTarget = null, toastTimer = null;

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function typeMeta(t) { return D.types[t] || D.types.Article; }
  function rec(id) { for (var i = 0; i < D.records.length; i++) if (D.records[i].id === id) return D.records[i]; return null; }
  var OPENSTAX_CH = {
    'soc-intro': 'https://openstax.org/books/introduction-sociology-3e/pages/1-introduction',
    'soc-research': 'https://openstax.org/books/introduction-sociology-3e/pages/2-introduction',
    'soc-socialization': 'https://openstax.org/books/introduction-sociology-3e/pages/5-introduction',
    'soc-stratification': 'https://openstax.org/books/introduction-sociology-3e/pages/9-introduction',
    'soc-family': 'https://openstax.org/books/introduction-sociology-3e/pages/14-introduction',
    'anth-culture': 'https://openstax.org/books/introduction-anthropology/pages/3-introduction',
    'psy-intro': 'https://openstax.org/books/psychology-2e/pages/1-introduction',
    'psy-social': 'https://openstax.org/books/psychology-2e/pages/12-introduction'
  };
  // Only free, openly accessible readings get a public link. Copyrighted or
  // library readings (access 'verified' or 'library') are reached through
  // Blackboard or the Seneca Library, never linked or hosted here (copyright).
  function readUrl(r) {
    return r.url || (r.doi ? 'https://doi.org/' + r.doi : null);
  }
  function readLabel(r) { return (r.fulltext === false) ? 'Find it in the Seneca Library' : 'Open the reading'; }
  function accessNote(r) {
    if (r.access === 'openstax') return 'Free and open on OpenStax. Opens in a new tab.';
    if (r.access === 'open') return 'Open access. Opens in a new tab.';
    if (r.access === 'library') return 'A licensed reading. Read it through the Seneca Library, and in this week\'s Readings folder on Blackboard.';
    return 'Posted in this week\'s Readings folder on Blackboard.';
  }
  function eyeLabel(r) { return r.eye === 'indigenous' ? 'Indigenous-scholar reading' : 'Western reading'; }
  function weekTitle(n) { return (D.weeks && D.weeks[n]) ? D.weeks[n] : ''; }
  function weeksWithReadings() { var set = {}; D.records.forEach(function (r) { set[r.week] = (set[r.week] || 0) + 1; }); return Object.keys(set).map(Number).sort(function (a, b) { return a - b; }); }
  function templatedSynthesis(recs) {
    function who(r) { return r.authors.indexOf('OpenStax') >= 0 ? 'OpenStax' : r.authors; }
    function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
    function trim(s) { return s.replace(/\.\s*$/, ''); }
    var west = recs.filter(function (r) { return r.eye === 'western'; });
    var ind = recs.filter(function (r) { return r.eye === 'indigenous'; });
    var both = west.length && ind.length;
    var named = recs.map(function (r) { return r.title + ' by ' + who(r); });
    var lead = recs.length === 2
      ? 'This compares ' + named[0] + ' and ' + named[1] + '.'
      : 'This compares ' + named.slice(0, -1).join(', ') + ', and ' + named[named.length - 1] + '.';
    var ideas = recs.map(function (r, i) {
      var ord = recs.length === 2 ? (i === 0 ? 'The first' : 'The second') : ('The ' + (['first', 'second', 'third'][i] || 'next'));
      return ord + ' says that ' + lower(trim(r.coreIdea)) + '.';
    }).join(' ');
    var rel = !HAS_EYE
      ? 'Read them together for how the same ideas and approaches play out across different topics.'
      : (both
      ? 'These include a Western reading and an Indigenous one. The course asks you to read them together rather than choose between them.'
      : (ind.length
        ? 'Both are by Indigenous scholars. Read them for how Indigenous knowledge applies to different topics.'
        : 'Both are Western readings. Read them for how the same approach applies to different topics.'));
    var close = 'Reading them together shows what you would miss from ' + (recs.length === 2 ? 'either one' : 'any one') + ' alone.';
    return [lead + ' ' + ideas + ' ' + rel + ' ' + close];
  }
  function pairText(a, b) {
    var k = [a.id, b.id].sort().join('|');
    return (D.syntheses && D.syntheses[k]) ? D.syntheses[k] : templatedSynthesis([a, b])[0];
  }
  function buildSynthesis(recs) {
    if (recs.length <= 2) {
      if (recs.length === 2) return { paras: [pairText(recs[0], recs[1])] };
      return { paras: templatedSynthesis(recs) };
    }
    var paras = [];
    for (var i = 0; i < recs.length; i++) for (var j = i + 1; j < recs.length; j++) paras.push(pairText(recs[i], recs[j]));
    return { paras: paras };
  }

  var ICON = {
    book: ['M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z', 'M4 18.5A2.5 2.5 0 0 1 6.5 16H20'],
    file: ['M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8z', 'M14 3v5h5'],
    clipboard: ['M9 4.5h6v3H9z', 'M9 6H6v15h12V6h-3'],
    search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M20 20l-4-4'],
    x: ['M6 6l12 12', 'M18 6L6 18'],
    check: ['M4 12.5l5 5 11-11'],
    bookmark: ['M6 3h12v18l-6-4-6 4z'],
    grid: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
    list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
    layers: ['M12 3l9 5-9 5-9-5z', 'M3 13l9 5 9-5'],
    columns: ['M4 4h7v16H4z', 'M13 4h7v16h-7z'],
    sparkle: ['M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z'],
    chevron: ['M9 6l6 6-6 6'],
    external: ['M14 4h6v6', 'M20 4l-9 9', 'M19 14v5H5V5h5'],
    plus: ['M12 5v14', 'M5 12h14'],
    clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2'],
    globe: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M2 12h20', 'M12 2a15 15 0 0 1 0 20', 'M12 2a15 15 0 0 0 0 20'],
    gauge: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 12l4-3'],
    calendar: ['M5 5h14v15H5z', 'M5 9h14', 'M9 3v4', 'M15 3v4'],
    type: ['M4 7V5h16v2', 'M9 19h6', 'M12 5v14'],
    eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
    unlock: ['M7 11V8a5 5 0 0 1 9.9-1', 'M5 11h14v10H5z'],
    play: ['M7 5l11 7-11 7z'],
    gallery: ['M3 5h18v14H3z', 'M3 16l5-5 4 4 3-3 6 6', 'M8.5 9.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2'],
  };
  function ic(name, size, w) {
    var paths = ICON[name] || ICON.file, s = size || 20;
    var out = '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    for (var i = 0; i < paths.length; i++) out += '<path d="' + paths[i] + '"></path>';
    return out + '</svg>';
  }

  /* ---------- filtering + sorting ---------- */
  function filtered() {
    var q = state.search.trim().toLowerCase();
    var base = state.savedView ? D.records.filter(function (r) { return state.saved.indexOf(r.id) >= 0; }) : D.records;
    var list = base.filter(function (r) {
      if (state.activeTypes.length && state.activeTypes.indexOf(r.type) < 0) return false;
      if (state.activeWeek != null && r.week !== state.activeWeek) return false;
      if (q) {
        var hay = (r.title + ' ' + r.authors + ' ' + r.abstract + ' ' + r.coreIdea + ' ' + r.type + ' Week ' + r.week + ' ' + weekTitle(r.week)).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
    var by = state.sort;
    list.sort(function (a, b) {
      return by === 'year' ? b.year - a.year : by === 'title' ? a.title.localeCompare(b.title) : by === 'type' ? (a.type.localeCompare(b.type) || a.week - b.week) : (a.week - b.week || (a.eye === b.eye ? 0 : a.eye === 'western' ? -1 : 1));
    });
    return list;
  }

  /* ---------- style builders ---------- */
  function saveBtnStyle(on) { return 'display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;border:1px solid ' + (on ? '#f0d89a' : '#DEE3EA') + ';background:' + (on ? '#FCEFD2' : '#fff') + ';color:' + (on ? '#B7791F' : '#8a909c') + ';flex:none'; }
  function cmpBtnStyle(on) { return 'display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;border:1px solid ' + (on ? '#bcd0f2' : '#DEE3EA') + ';background:' + (on ? '#E7EEFB' : '#fff') + ';color:' + (on ? '#1552D8' : '#8a909c') + ';flex:none'; }
  function chipStyle(active, accent) { return 'display:inline-flex;align-items:center;gap:6px;border:1px solid ' + (active ? accent : '#DEE3EA') + ';background:' + (active ? accent + '22' : '#fff') + ';color:' + (active ? '#15171C' : '#474C57') + ';font-size:.8125rem;font-weight:' + (active ? '600' : '500') + ';padding:6px 11px;border-radius:999px'; }
  function segStyle(active) { return 'border:none;border-radius:7px;padding:6px 12px;font-size:.8125rem;font-weight:' + (active ? '600' : '500') + ';background:' + (active ? '#fff' : 'transparent') + ';color:' + (active ? '#15171C' : '#474C57') + ';box-shadow:' + (active ? '0 1px 2px rgba(21,23,28,.12)' : 'none') + ';display:flex;align-items:center;gap:6px'; }
  function eyePill(r) {
    if (!HAS_EYE) return '';
    var ind = r.eye === 'indigenous';
    return '<span title="' + esc(eyeLabel(r)) + '" style="display:inline-flex;align-items:center;gap:5px;font-family:var(--mono);font-size:.625rem;font-weight:600;letter-spacing:.04em;color:' + (ind ? '#1f4d38' : '#3a47a8') + ';background:' + (ind ? '#E4F0E9' : '#E7E9FB') + ';padding:3px 8px;border-radius:999px">' + (ind ? 'INDIGENOUS' : 'WESTERN') + '</span>';
  }
  function weekTag(r) { return '<span class="mono" style="font-size:.6875rem;color:#8a909c;background:#EEF1F5;padding:3px 8px;border-radius:6px">Week ' + r.week + '</span>'; }

  /* ---------- cards ---------- */
  function tileCard(r) {
    var tm = typeMeta(r.type), savedOn = state.saved.indexOf(r.id) >= 0, inC = state.compareIds.indexOf(r.id) >= 0;
    return '<div class="card" style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(21,23,28,.04);display:flex;flex-direction:column">'
      + '<button onclick="SOC.open(\'' + r.id + '\')" style="text-align:left;background:none;border:none;padding:0;display:flex;flex-direction:column;flex:1">'
      + '<div style="height:5px;background:' + tm.color + ';width:100%"></div>'
      + '<div style="padding:16px 17px 12px;flex:1;display:flex;flex-direction:column">'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:11px;flex-wrap:wrap">'
      + '<span style="display:inline-flex;align-items:center;gap:6px;background:' + tm.soft + ';color:' + tm.color + ';font-size:.6875rem;font-weight:600;letter-spacing:.03em;padding:4px 9px;border-radius:999px">' + ic(tm.icon, 13) + esc(r.type) + '</span>'
      + eyePill(r)
      + '<span class="mono" style="font-size:.75rem;color:#8a909c;margin-left:auto">' + esc(String(r.year)) + '</span></div>'
      + '<h3 style="font-size:1.125rem;line-height:1.28;font-weight:600;margin:0 0 4px;color:#15171C">' + esc(r.title) + '</h3>'
      + '<div style="font-size:.8125rem;color:#474C57;margin-bottom:11px">' + esc(r.authors) + '</div>'
      + '<p style="font-size:.875rem;line-height:1.5;color:#474C57;margin:0 0 13px">' + esc(r.abstract) + '</p>'
      + '<div style="margin-top:auto">' + weekTag(r) + '</div>'
      + '</div></button>'
      + '<div style="display:flex;align-items:center;gap:8px;padding:11px 17px;border-top:1px solid #EEF1F5;background:#FBFCFD">'
      + '<span class="mono" style="font-size:.75rem;color:#8a909c">' + esc(r.len) + '</span>'
      + '<button onclick="SOC.compare(\'' + r.id + '\')" aria-label="' + (inC ? 'In compare' : 'Add to compare') + '" title="' + (inC ? 'In compare' : 'Add to compare') + '" style="' + cmpBtnStyle(inC) + ';margin-left:auto">' + ic('columns', 15) + '</button>'
      + '</div></div>';
  }
  function indexRow(r) {
    var tm = typeMeta(r.type), savedOn = state.saved.indexOf(r.id) >= 0, inC = state.compareIds.indexOf(r.id) >= 0;
    return '<div class="idxrow" style="display:flex;align-items:center;gap:14px;padding:13px 18px;border-bottom:1px solid #EEF1F5">'
      + '<span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9px;background:' + tm.soft + ';color:' + tm.color + ';flex:none">' + ic(tm.icon, 18) + '</span>'
      + '<button onclick="SOC.open(\'' + r.id + '\')" style="flex:1;min-width:0;text-align:left;background:none;border:none;padding:0">'
      + '<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap"><span style="font-size:1rem;font-weight:600;color:#15171C">' + esc(r.title) + '</span><span style="font-size:.8125rem;color:#474C57">' + esc(r.authors) + ' · ' + esc(String(r.year)) + '</span></div>'
      + '<div style="font-size:.8125rem;color:#8a909c;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:64ch">' + esc(r.abstract) + '</div></button>'
      + eyePill(r)
      + '<span class="mono" style="font-size:.75rem;color:#8a909c;flex:none;width:64px;text-align:right">Week ' + r.week + '</span>'
      + '<button onclick="SOC.compare(\'' + r.id + '\')" aria-label="' + (inC ? 'In compare' : 'Add to compare') + '" style="' + cmpBtnStyle(inC) + '">' + ic('columns', 15) + '</button>'
      + '</div>';
  }

  /* ---------- chrome ---------- */
  function header() {
    return '<header style="position:sticky;top:0;z-index:40;height:62px;background:#fff;border-bottom:2px solid var(--red);display:flex;align-items:center;padding:0 22px;gap:14px;flex:none">'
      + '<div style="display:flex;align-items:center;gap:10px;flex:none"><img src="./seneca-logo.png" alt="Seneca Polytechnic" style="height:34px;width:auto;display:block"><span style="font-weight:600;font-size:1.0625rem;color:var(--ink);letter-spacing:-.01em">BFS218</span></div>'
      + '<span class="mono" style="margin-left:auto;font-size:.75rem;font-weight:600;color:var(--red);background:#F6E3E1;padding:5px 10px;border-radius:6px;flex:none">FALL 2026</span>'
      + '</header>';
  }
  function sidebar() {
    var s = state;
    var navDefs = [['journey', 'Home', 'gauge'], ['readings', 'Library of Readings', 'gallery'], ['compare', 'Compare Reading Concepts', 'columns'], ['reading', 'Build Your Reading Comprehension', 'book'], ['glossary', 'Glossary & Thinkers', 'book'], ['cards', 'Self-check', 'clipboard']];
    var btns = navDefs.map(function (d) {
      var key = d[0], active = (key === 'journey' && (s.screen === 'journey' || s.screen === 'library' || s.screen === 'station' || s.screen === 'detail')) || s.screen === key;
      var badge = '';
      if (key === 'compare' && s.compareIds.length) badge = '<span class="mono" style="font-size:.6875rem;font-weight:600;color:#1552D8;background:#E7EEFB;padding:1px 7px;border-radius:999px">' + s.compareIds.length + '</span>';
      var click = "SOC.go('" + key + "')";
      return '<button onclick="' + click + '" aria-current="' + (active ? 'page' : 'false') + '" style="display:flex;align-items:center;gap:11px;width:100%;border:none;border-radius:10px;padding:10px 12px;font-size:.9375rem;font-weight:' + (active ? '600' : '500') + ';background:' + (active ? '#EEF1F5' : 'transparent') + ';color:' + (active ? '#15171C' : '#474C57') + ';text-align:left">'
        + '<span style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;flex:none;color:' + (active ? 'var(--red)' : '#8a909c') + '">' + ic(d[2], 19) + '</span><span style="flex:1;text-align:left">' + d[1] + '</span>' + badge + '</button>';
    });
    var walk = '<a href="https://rpeart73.github.io/bfs218-atlas/walkthroughs/" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:11px;width:100%;border-radius:10px;padding:10px 12px;font-size:.9375rem;font-weight:500;color:#474C57;text-decoration:none"><span style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;flex:none;color:#8a909c">' + ic('layers', 19) + '</span><span style="flex:1">Weekly Walkthrough</span><span style="color:#8a909c">↗</span></a>';
    var nav = btns[0] + walk + btns.slice(1).join('');
    var counts = {}; D.records.forEach(function (r) { counts[r.week] = (counts[r.week] || 0) + 1; });
    var weekNav = weeksWithReadings().map(function (w) {
      var active = s.activeWeek === w;
      return '<button onclick="SOC.week(' + w + ')" style="display:flex;align-items:center;gap:9px;width:100%;border:none;border-radius:9px;padding:7px 12px;font-size:.8125rem;font-weight:' + (active ? '600' : '500') + ';background:' + (active ? '#E6EAF1' : 'transparent') + ';color:' + (active ? '#1B2A4A' : '#474C57') + ';text-align:left">'
        + '<span class="mono" style="font-size:.6875rem;color:' + (active ? '#1B2A4A' : '#8a909c') + ';flex:none;width:18px">' + w + '</span>'
        + '<span style="flex:1;text-align:left;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(weekTitle(w)) + '</span>'
        + '<span class="mono" style="font-size:.6875rem;color:#8a909c">' + counts[w] + '</span></button>';
    }).join('');
    return '<nav class="soc-sidebar" aria-label="Primary" style="width:240px;flex:none;border-right:1px solid #DEE3EA;background:#fff;padding:18px 14px;display:flex;flex-direction:column;gap:4px;position:sticky;top:62px;align-self:flex-start;height:calc(100vh - 62px);overflow:auto">'
      + nav
      + '<div style="margin-top:14px;padding-top:14px;border-top:1px solid #EEF1F5"><div class="mono" style="font-size:.6875rem;letter-spacing:.04em;color:#8a909c;padding:0 12px 8px">WEEKS</div>' + weekNav + '</div>'
      + '<div style="margin-top:auto;padding:13px 12px;border-radius:12px;background:#EEF1F5"><div class="mono" style="font-size:.75rem;color:#474C57;margin-bottom:4px">BFS218</div><div style="font-size:.8125rem;color:#15171C;line-height:1.45">A living collection, week by week. A companion to Blackboard.</div></div>'
      + '</nav>';
  }

  /* ---------- library ---------- */
  function library() {
    var s = section_state();
    return s;
  }
  function section_state() {
    var s = state, list = filtered();
    var typeCounts = {}; D.records.forEach(function (r) { typeCounts[r.type] = (typeCounts[r.type] || 0) + 1; });
    var html = '<div class="rise">' + (s.introOpen ? '' : '<h1 class="vh">BFS218 source library, by week</h1>');

    if (s.introOpen) {
      var stats = [['Readings', D.records.length], ['Weeks', weeksWithReadings().length], ['Formats', Object.keys(typeCounts).length]];
      html += '<section style="background:#fff;border:1px solid #DEE3EA;border-top:4px solid var(--red);border-radius:14px;padding:28px 30px;margin-bottom:22px;position:relative;box-shadow:0 1px 2px rgba(21,23,28,.04)">'
        + '<div style="display:flex;align-items:flex-start;gap:24px;flex-wrap:wrap;justify-content:space-between">'
        + '<div style="flex:1;min-width:280px"><div class="mono" style="font-size:.75rem;letter-spacing:.06em;color:var(--red);margin-bottom:10px;font-weight:600">THE COURSE CORPUS</div>'
        + '<h1 style="font-size:2.125rem;line-height:1.14;font-weight:600;margin:0 0 10px;color:var(--ink)">Every reading, week by week.</h1>'
        + '<p style="font-size:1rem;line-height:1.6;color:#474C57;margin:0;max-width:62ch">These are the readings behind BFS218, in course order. Search them, hold two against each other, and follow the course as it moves.</p></div>'
        + '<div style="display:flex;gap:10px;flex:none">' + stats.map(function (st) { return '<div style="background:#EEF1F5;border:1px solid #DEE3EA;border-radius:12px;padding:12px 16px;text-align:center;min-width:78px"><div class="mono" style="font-size:1.75rem;font-weight:600;line-height:1;color:var(--red)">' + st[1] + '</div><div style="font-size:.6875rem;text-transform:uppercase;letter-spacing:.06em;color:#474C57;margin-top:5px">' + st[0] + '</div></div>'; }).join('') + '</div></div>'
        + '<button onclick="SOC.dismissIntro()" aria-label="Dismiss" style="position:absolute;top:14px;right:14px;background:#EEF1F5;border:none;border-radius:8px;width:30px;height:30px;color:#474C57;display:flex;align-items:center;justify-content:center">' + ic('x', 16) + '</button></section>';
    }

    var layoutDefs = [['byweek', 'By week', 'layers'], ['tiles', 'Tiles', 'grid'], ['index', 'Index', 'list']];
    var layoutChips = layoutDefs.map(function (d) { return '<button onclick="SOC.layout(\'' + d[0] + '\')" title="' + d[1] + '" aria-label="' + d[1] + '" aria-pressed="' + (s.layout === d[0]) + '" style="' + segStyle(s.layout === d[0]) + '">' + ic(d[2], 15) + '<span>' + d[1] + '</span></button>'; }).join('');
    var filtersActive = s.activeTypes.length || s.activeWeek != null || s.search.trim().length || s.savedView;
    var n = list.length;
    var resultLabel = s.savedView ? ('Saved shelf · ' + n + (n === 1 ? ' reading' : ' readings')) : (s.activeWeek != null ? ('Week ' + s.activeWeek + ' · ' + n + (n === 1 ? ' reading' : ' readings')) : (n === D.records.length ? 'All ' + n + ' readings' : n + ' of ' + D.records.length));
    var weekStrip = '<div class="soc-weekstrip" style="gap:8px;overflow-x:auto;margin-bottom:16px;padding-bottom:4px" aria-label="Filter by week">' + weeksWithReadings().map(function (w) { var aw = s.activeWeek === w; return '<button onclick="SOC.week(' + w + ')" aria-pressed="' + aw + '" style="flex:none;border:1px solid ' + (aw ? '#1B2A4A' : '#DEE3EA') + ';background:' + (aw ? '#E6EAF1' : '#fff') + ';color:' + (aw ? '#1B2A4A' : '#474C57') + ';font-size:.8125rem;font-weight:' + (aw ? '600' : '500') + ';padding:8px 12px;border-radius:999px;white-space:nowrap"><span class="mono" style="opacity:.7">W' + w + '</span> ' + esc(weekTitle(w)) + '</button>'; }).join('') + '</div>';

    html += '<section style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;padding:16px 18px;margin-bottom:18px;box-shadow:0 1px 2px rgba(21,23,28,.04)">'
      + '<div style="display:flex;align-items:center;gap:10px;background:#F7F8FA;border:1px solid #DEE3EA;border-radius:10px;padding:11px 14px">'
      + '<span style="display:flex;color:#8a909c;flex:none">' + ic('search', 18) + '</span>'
      + '<input id="soc-search" value="' + esc(s.search) + '" oninput="SOC.search(this.value)" placeholder="Search by title, author, idea, or week..." aria-label="Search readings" style="flex:1;border:none;background:none;outline:none;font-size:1rem;color:#15171C;min-width:0" />'
      + (s.search ? '<button onclick="SOC.clearSearch()" aria-label="Clear search" style="background:none;border:none;color:#8a909c;display:flex;padding:2px">' + ic('x', 16) + '</button>' : '')
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px solid #EEF1F5">'
      + '<span style="font-size:.8125rem;color:#474C57">' + resultLabel + '</span>'
      + (filtersActive ? '<button onclick="SOC.clearFilters()" style="background:none;border:none;color:var(--red);font-size:.8125rem;font-weight:600;padding:2px 4px">Clear</button>' : '')
      + '<div style="margin-left:auto;display:flex;gap:4px;background:#EEF1F5;border-radius:9px;padding:4px" role="group" aria-label="Layout">' + layoutChips + '</div>'
      + '</div></section>';
    html += weekStrip;

    if (n === 0) {
      html += '<div style="text-align:center;padding:70px 20px;color:#474C57"><div style="display:inline-flex;color:#C9D1DC;margin-bottom:14px">' + ic('search', 44, 1.4) + '</div><div style="font-size:1.125rem;font-weight:600;color:#15171C;margin-bottom:6px">No readings match that yet.</div><p style="margin:0 0 16px;font-size:.9375rem">Try a broader term or clear a filter.</p><button onclick="SOC.clearFilters()" style="background:#1B2A4A;color:#fff;border:none;border-radius:8px;padding:10px 18px;font-size:.9375rem;font-weight:600">Reset filters</button></div>';
    } else if (s.layout === 'tiles') {
      html += '<div class="soc-cardgrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(296px,1fr));gap:16px">' + list.map(tileCard).join('') + '</div>';
    } else if (s.layout === 'index') {
      html += '<div style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(21,23,28,.04)">' + list.map(indexRow).join('') + '</div>';
    } else {
      // by week
      var weeks = {};
      list.forEach(function (r) { (weeks[r.week] = weeks[r.week] || []).push(r); });
      var order = Object.keys(weeks).map(Number).sort(function (a, b) { return a - b; });
      html += '<div style="display:flex;flex-direction:column;gap:26px">' + order.map(function (w) {
        var cards = weeks[w].map(tileCard).join('');
        return '<section><div style="display:flex;align-items:baseline;gap:10px;margin-bottom:12px">'
          + '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:26px;padding:0 8px;border-radius:8px;background:#1B2A4A;color:#fff;font-family:var(--mono);font-size:.8125rem;font-weight:600;flex:none">' + w + '</span>'
          + '<h2 style="font-size:1.1875rem;font-weight:600;margin:0;color:#15171C">' + esc(weekTitle(w)) + '</h2>'
          + '<span class="mono" style="font-size:.75rem;color:#8a909c">' + weeks[w].length + (weeks[w].length === 1 ? ' reading' : ' readings') + '</span>'
          + '<div style="flex:1;height:1px;background:#EEF1F5"></div></div>'
          + '<div class="soc-cardgrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(296px,1fr));gap:16px">' + cards + '</div></section>';
      }).join('') + '</div>';
    }
    return html + '</div>';
  }

  /* ---------- library of readings (immersive gallery) ---------- */
  function topicLabel(k) {
    var M = { twoeyed: 'Two-Eyed Seeing', facial: 'Facial Recognition', bias: 'Algorithmic Bias', policing: 'Policing', surveillance: 'Surveillance', policy: 'Law and Policy', resistance: 'Resistance and Design Justice', intersectionality: 'Intersectionality', reconciliation: 'Reconciliation', sociology: 'Sociology', anthropology: 'Anthropology', psychology: 'Psychology', family: 'Family and Kinship', stratification: 'Stratification', socialization: 'Socialization', culture: 'Culture', learning: 'Learning', memory: 'Memory and Recall', motivation: 'Motivation', cognition: 'Cognition', development: 'Development', behaviour: 'Behaviour', behavior: 'Behaviour', identity: 'Identity', education: 'Education', conditioning: 'Conditioning', emotion: 'Emotion' };
    return M[k] || (String(k).charAt(0).toUpperCase() + String(k).slice(1));
  }
  function rgTopics() {
    var seen = {}, out = [];
    D.records.forEach(function (r) { (r.themes || []).forEach(function (t) { if (!seen[t]) { seen[t] = 1; out.push(t); } }); });
    return out.sort(function (a, b) { return topicLabel(a).localeCompare(topicLabel(b)); });
  }
  function rgList() {
    var w = state.galWeek, t = state.galTopic;
    return D.records.filter(function (r) {
      if (w != null && r.week !== w) return false;
      if (t && (r.themes || []).indexOf(t) < 0) return false;
      return true;
    }).sort(function (a, b) { return (a.week - b.week) || a.title.localeCompare(b.title); });
  }
  function rgAccessBadge(r) {
    var full = r.fulltext !== false;
    var fg = full ? '#1f7a4d' : '#B7791F', bg = full ? '#E4F0E9' : '#FCEFD2';
    return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:.6875rem;font-weight:600;letter-spacing:.03em;color:' + fg + ';background:' + bg + ';padding:4px 9px;border-radius:999px">' + ic(full ? 'unlock' : 'book', 12) + (full ? 'Read online' : 'Seneca Library') + '</span>';
  }
  function rgVideoCover(r) {
    var v = r.video;
    return '<div class="rgvideo" style="position:relative;width:100%;aspect-ratio:16/9;background:#15171C;overflow:hidden">'
      + '<button onclick="SOC.playVideo(this,\'' + v.yt + '\')" aria-label="Play a talk by ' + esc(v.scholar || r.authors) + '" style="position:absolute;inset:0;width:100%;height:100%;border:none;padding:0;cursor:pointer;background:none">'
      + '<img src="https://i.ytimg.com/vi/' + v.yt + '/maxresdefault.jpg" onerror="this.onerror=null;this.src=\'https://i.ytimg.com/vi/' + v.yt + '/hqdefault.jpg\'" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block" />'
      + '<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><span style="display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:999px;background:rgba(218,41,28,.94);color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.45)">' + ic('play', 24) + '</span></span>'
      + '<span style="position:absolute;left:0;right:0;bottom:0;padding:22px 13px 10px;background:linear-gradient(transparent,rgba(0,0,0,.9));color:#fff;text-align:left">'
      + '<span class="mono" style="display:block;font-size:.6rem;letter-spacing:.08em;color:#f3b0a8;font-weight:600;margin-bottom:2px">WATCH</span>'
      + '<span style="display:block;font-size:.8125rem;font-weight:700;line-height:1.2">' + esc(v.scholar || r.authors) + '</span>'
      + (v.title ? '<span style="display:block;font-size:.7rem;color:rgba(255,255,255,.8);line-height:1.3;margin-top:2px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + esc(v.title) + '</span>' : '')
      + '</span>'
      + '</button></div>';
  }
  function rgCard(r) {
    var tm = typeMeta(r.type);
    var topics = (r.themes || []).slice(0, 3).map(function (t) {
      var on = state.galTopic === t;
      return '<button onclick="SOC.galTopic(\'' + t + '\')" style="border:1px solid ' + (on ? '#DA291C' : '#DEE3EA') + ';background:' + (on ? '#F6E3E1' : '#F7F8FA') + ';color:' + (on ? '#DA291C' : '#474C57') + ';font-size:.6875rem;font-weight:600;padding:3px 9px;border-radius:999px;cursor:pointer">' + esc(topicLabel(t)) + '</button>';
    }).join('');
    return '<div class="rgcard" style="background:#fff;border:1px solid #DEE3EA;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(21,23,28,.06);display:flex;flex-direction:column">'
      + (r.video ? rgVideoCover(r) : '<div style="height:6px;background:' + tm.color + '"></div>')
      + '<div style="padding:16px 17px 15px;flex:1;display:flex;flex-direction:column">'
      + '<div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:10px">'
      + '<span style="display:inline-flex;align-items:center;gap:5px;background:' + tm.soft + ';color:' + tm.color + ';font-size:.6875rem;font-weight:600;padding:4px 9px;border-radius:999px">' + ic(tm.icon, 12) + esc(r.type) + '</span>'
      + rgAccessBadge(r)
      + '<span class="mono" style="font-size:.75rem;color:#8a909c;margin-left:auto">' + esc(String(r.year)) + '</span>'
      + '</div>'
      + '<h3 style="font-size:1.0625rem;line-height:1.3;font-weight:600;margin:0 0 4px;color:#15171C">' + esc(r.title) + '</h3>'
      + '<div style="font-size:.8125rem;color:#474C57;margin-bottom:9px">' + esc(r.authors) + '</div>'
      + '<p style="font-size:.84rem;line-height:1.5;color:#5a616e;margin:0 0 12px">' + esc(r.coreIdea || r.abstract) + '</p>'
      + (topics ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:13px">' + topics + '</div>' : '')
      + (r.assigned ? '<div style="display:flex;align-items:flex-start;gap:7px;background:#FBF3F2;border:1px solid #F1D5D2;border-radius:9px;padding:8px 11px;margin:0 0 12px"><span style="display:flex;color:var(--red);flex:none;margin-top:1px">' + ic('book', 13) + '</span><span style="font-size:.78rem;line-height:1.4;color:#15171C"><span style="font-weight:700">Read:</span> ' + esc(r.assigned) + '</span></div>' : '')
      + '<div style="margin-top:auto;display:flex;align-items:center;gap:9px">'
      + '<button onclick="SOC.read(\'' + r.id + '\')" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:7px;background:var(--red);color:#fff;border:none;border-radius:10px;padding:11px;font-size:.875rem;font-weight:600;cursor:pointer">' + readLabel(r) + '<span style="display:flex">' + ic('external', 15) + '</span></button>'
      + '<button onclick="SOC.open(\'' + r.id + '\')" title="Details" aria-label="Open details" style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:10px;border:1px solid #DEE3EA;background:#fff;color:#474C57;cursor:pointer;flex:none">' + ic('chevron', 18) + '</button>'
      + '</div>'
      + '<div style="margin-top:10px;display:flex;align-items:center;gap:7px">' + weekTag(r) + ((D.course && D.course.frame) ? eyePill(r) : '') + '</div>'
      + '</div></div>';
  }
  function readingsGallery() {
    var s = state, list = rgList();
    var nFull = D.records.filter(function (r) { return r.fulltext !== false; }).length;
    var nVid = D.records.filter(function (r) { return !!r.video; }).length;
    var weeks = weeksWithReadings(), topics = rgTopics();
    var stats = [['Readings', D.records.length], ['Read online', nFull]];
    if (nVid) stats.push(['Scholar talks', nVid]);
    var hero = '<section style="background:#fff;border:1px solid #DEE3EA;border-top:4px solid var(--red);border-radius:14px;padding:26px 30px;margin-bottom:18px;box-shadow:0 1px 2px rgba(21,23,28,.04)">'
      + '<div style="display:flex;align-items:flex-start;gap:24px;flex-wrap:wrap;justify-content:space-between">'
      + '<div style="flex:1;min-width:280px">'
      + '<div class="mono" style="font-size:.75rem;letter-spacing:.06em;color:var(--red);font-weight:600;margin-bottom:10px">LIBRARY OF READINGS</div>'
      + '<h1 style="font-size:2.125rem;line-height:1.14;font-weight:600;margin:0 0 10px;color:var(--ink)">Open every source online.</h1>'
      + '<p style="font-size:1rem;line-height:1.6;color:#474C57;margin:0;max-width:62ch">Click any reading to open the full text in a new tab, watch the scholars speak, and filter the collection by week or by topic.</p></div>'
      + '<div style="display:flex;gap:10px;flex:none">'
      + stats.map(function (st) { return '<div style="background:#EEF1F5;border:1px solid #DEE3EA;border-radius:12px;padding:12px 16px;text-align:center;min-width:82px"><div class="mono" style="font-size:1.75rem;font-weight:600;line-height:1;color:var(--red)">' + st[1] + '</div><div style="font-size:.6875rem;text-transform:uppercase;letter-spacing:.06em;color:#474C57;margin-top:5px">' + st[0] + '</div></div>'; }).join('')
      + '</div></div></section>';
    function pill(active, label, onclick, accent) {
      accent = accent || '#DA291C';
      return '<button onclick="' + onclick + '" aria-pressed="' + active + '" style="flex:none;border:1px solid ' + (active ? accent : '#DEE3EA') + ';background:' + (active ? accent : '#fff') + ';color:' + (active ? '#fff' : '#474C57') + ';font-size:.8125rem;font-weight:' + (active ? '600' : '500') + ';padding:7px 13px;border-radius:999px;white-space:nowrap;cursor:pointer">' + label + '</button>';
    }
    var weekRail = '<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px">'
      + pill(s.galWeek == null, 'All weeks', 'SOC.galWeek(null)')
      + weeks.map(function (w) { return pill(s.galWeek === w, '<span class="mono" style="opacity:.7">W' + w + '</span> ' + esc(weekTitle(w)), 'SOC.galWeek(' + w + ')'); }).join('')
      + '</div>';
    var topicRail = '<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px">'
      + pill(s.galTopic == null, 'All topics', 'SOC.galTopic(null)', '#15171C')
      + topics.map(function (t) { return pill(s.galTopic === t, esc(topicLabel(t)), 'SOC.galTopic(\'' + t + '\')', '#15171C'); }).join('')
      + '</div>';
    var anyFilter = (s.galWeek != null) || s.galTopic;
    var filterBar = '<section style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;padding:14px 16px;margin-bottom:16px;box-shadow:0 1px 2px rgba(21,23,28,.04);position:sticky;top:0;z-index:5">'
      + '<div style="display:flex;align-items:center;gap:7px;margin-bottom:7px"><span style="display:flex;color:#8a909c">' + ic('calendar', 15) + '</span><span style="font-size:.7rem;font-weight:600;letter-spacing:.05em;color:#8a909c;text-transform:uppercase">Filter by week</span></div>'
      + weekRail
      + '<div style="display:flex;align-items:center;gap:7px;margin:13px 0 7px"><span style="display:flex;color:#8a909c">' + ic('sparkle', 15) + '</span><span style="font-size:.7rem;font-weight:600;letter-spacing:.05em;color:#8a909c;text-transform:uppercase">Filter by topic</span></div>'
      + topicRail
      + '<div style="display:flex;align-items:center;gap:11px;margin-top:13px;padding-top:12px;border-top:1px solid #EEF1F5"><span style="font-size:.8125rem;font-weight:500;color:#474C57">' + list.length + ' of ' + D.records.length + ' readings</span>' + (anyFilter ? '<button onclick="SOC.galClear()" style="background:none;border:none;color:var(--red);font-size:.8125rem;font-weight:600;cursor:pointer">Clear filters</button>' : '') + '</div>'
      + '</section>';
    var grid = list.length
      ? '<div class="soc-cardgrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">' + list.map(rgCard).join('') + '</div>'
      : '<div style="text-align:center;padding:60px 20px;color:#474C57"><div style="font-size:1.0625rem;font-weight:600;color:#15171C;margin-bottom:10px">No readings match those filters.</div><button onclick="SOC.galClear()" style="background:var(--red);color:#fff;border:none;border-radius:9px;padding:10px 18px;font-size:.9375rem;font-weight:600;cursor:pointer">Clear filters</button></div>';
    return '<div class="rise">' + hero + filterBar + grid + '</div>';
  }

  /* ---------- detail ---------- */
  function detail() {
    var r = rec(state.detailId); if (!r) return library();
    var tm = typeMeta(r.type), savedOn = state.saved.indexOf(r.id) >= 0, inC = state.compareIds.indexOf(r.id) >= 0;
    var related = (r.related || []).map(function (id) {
      var rr = rec(id); if (!rr) return ''; var rtm = typeMeta(rr.type);
      var conn = rr.week === r.week ? 'Also in Week ' + rr.week : (HAS_EYE ? eyeLabel(rr) : ('Week ' + rr.week));
      return '<button onclick="SOC.open(\'' + id + '\')" class="relrow" style="display:flex;align-items:center;gap:13px;text-align:left;background:#fff;border:1px solid #DEE3EA;border-radius:12px;padding:13px 15px"><span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:' + rtm.soft + ';color:' + rtm.color + ';flex:none">' + ic(rtm.icon, 16) + '</span><span style="flex:1;min-width:0"><span style="display:block;font-size:.9375rem;font-weight:600;color:#15171C">' + esc(rr.title) + '</span><span style="display:block;font-size:.8125rem;color:#474C57">' + esc(rr.authors) + ' · ' + esc(conn) + '</span></span><span style="display:flex;color:#C9D1DC;flex:none">' + ic('chevron', 18) + '</span></button>';
    }).join('');
    var facts = [
      [ic('calendar', 16), 'Used in', 'Week ' + r.week + ': ' + esc(weekTitle(r.week))],
      [ic('type', 16), 'Format', esc(r.type)],
      [ic('clock', 16), 'Length', esc(r.len)],
      [ic('gauge', 16), 'Level', esc(D.levels[r.diff] || '')],
      [ic('unlock', 16), 'Access', esc((D.accessLabels && D.accessLabels[r.access]) || '')],
      [ic('globe', 16), 'Origin', esc(r.origin)],
    ].map(function (f) { return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #EEF1F5"><span style="display:flex;color:#8a909c;flex:none">' + f[0] + '</span><span style="font-size:.8125rem;color:#474C57;flex:none;width:84px">' + f[1] + '</span><span style="font-size:.875rem;font-weight:500;color:#15171C;text-align:right;flex:1">' + f[2] + '</span></div>'; }).join('');
    var hasLink = !!readUrl(r);

    return '<div class="rise"><button onclick="SOC.back()" style="background:none;border:none;color:#474C57;font-size:.875rem;font-weight:500;padding:0 0 16px;display:inline-flex;align-items:center;gap:6px">&larr; Back to the library</button>'
      + '<div class="soc-detailgrid" style="display:grid;grid-template-columns:1fr 312px;gap:26px;align-items:start"><div>'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:13px;flex-wrap:wrap"><span style="display:inline-flex;align-items:center;gap:7px;background:' + tm.soft + ';color:' + tm.color + ';font-size:.8125rem;font-weight:600;padding:5px 12px;border-radius:999px">' + ic(tm.icon, 15) + esc(r.type) + '</span>' + eyePill(r) + '<button onclick="SOC.week(' + r.week + ')" class="mono" style="font-size:.8125rem;color:#1B2A4A;background:#E6EAF1;border:none;padding:4px 10px;border-radius:999px">Week ' + r.week + '</button><span class="mono" style="font-size:.8125rem;color:#474C57">' + esc(String(r.year)) + ' · ' + esc(r.origin) + '</span></div>'
      + '<h1 style="font-size:2.125rem;line-height:1.15;font-weight:600;margin:0 0 8px">' + esc(r.title) + '</h1>'
      + '<div style="font-size:1.0625rem;color:#474C57;margin-bottom:24px">' + esc(r.authors) + '</div>'
      + '<div class="mono" style="font-size:.75rem;letter-spacing:.04em;color:#8a909c;margin-bottom:9px">ABSTRACT</div><p style="font-size:1.0625rem;line-height:1.62;color:#15171C;margin:0 0 26px;max-width:64ch">' + esc(r.abstract) + '</p>'
      + '<div style="background:' + tm.soft + ';border-radius:14px;padding:20px 22px;margin-bottom:26px;border:1px solid ' + tm.color + '33"><div style="display:flex;align-items:center;gap:9px;margin-bottom:9px"><span style="display:flex;color:' + tm.color + '">' + ic('sparkle', 17) + '</span><span style="font-size:.8125rem;font-weight:600;color:' + tm.color + ';letter-spacing:.02em">THE CORE IDEA</span></div><p style="font-size:1.1875rem;line-height:1.5;font-weight:500;color:#15171C;margin:0">' + esc(r.coreIdea) + '</p></div>'
      + (related ? '<div class="mono" style="font-size:.75rem;letter-spacing:.04em;color:#8a909c;margin-bottom:12px">READ ALONGSIDE</div><div style="display:flex;flex-direction:column;gap:10px">' + related + '</div>' : '')
      + '</div>'
      + '<aside class="soc-rail" style="position:sticky;top:84px;display:flex;flex-direction:column;gap:14px">'
      + '<div style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;padding:18px;box-shadow:0 1px 2px rgba(21,23,28,.04)">'
      + '<button onclick="SOC.read(\'' + r.id + '\')" aria-label="' + esc(readLabel(r)) + ' in a new tab" style="width:100%;background:var(--red);color:#fff;border:none;border-radius:9px;padding:13px;font-size:1rem;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:9px">' + readLabel(r) + '<span style="display:flex">' + ic('external', 16) + '</span></button>'
      + '<div style="font-size:.75rem;line-height:1.4;color:#6B7280;margin:-2px 0 9px;text-align:center">' + esc(accessNote(r)) + '</div>'
      + '<button onclick="SOC.compare(\'' + r.id + '\')" style="width:100%;display:inline-flex;align-items:center;justify-content:center;gap:7px;border-radius:9px;padding:11px;font-size:.9375rem;font-weight:600;border:1px solid ' + (inC ? '#bcd0f2' : '#DEE3EA') + ';background:' + (inC ? '#E7EEFB' : '#fff') + ';color:' + (inC ? '#1552D8' : '#15171C') + '">' + ic('columns', 16) + (inC ? 'In tray' : 'Compare') + '</button>'
      + '</div>'
      + '<div style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;padding:6px 18px;box-shadow:0 1px 2px rgba(21,23,28,.04)">' + facts + '</div>'
      + '</aside></div></div>';
  }

  /* ---------- compare ---------- */
  function comparePickList() {
    var list = D.records.slice().sort(function (a, b) { return a.week - b.week || (a.eye === b.eye ? 0 : a.eye === 'western' ? -1 : 1); });
    return list.map(function (r) {
      var tm = typeMeta(r.type), sel = state.compareIds.indexOf(r.id) >= 0;
      return '<button onclick="SOC.compare(\'' + r.id + '\')" class="mapsrc" style="display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:' + (sel ? '#E7EEFB' : 'none') + ';border:none;border-bottom:1px solid #EEF1F5;padding:10px 12px">'
        + '<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:7px;background:' + tm.soft + ';color:' + tm.color + ';flex:none">' + ic(tm.icon, 14) + '</span>'
        + '<span style="flex:1;min-width:0"><span style="display:block;font-size:.8125rem;font-weight:600;color:#15171C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r.title) + '</span><span style="display:block;font-size:.6875rem;color:#8a909c">Week ' + r.week + (HAS_EYE ? ' · ' + (r.eye === 'indigenous' ? 'Indigenous' : 'Western') : '') + '</span></span>'
        + (sel ? '<span style="display:flex;color:#1552D8;flex:none">' + ic('check', 16, 2.2) + '</span>' : '<span style="display:flex;color:#6b7280;flex:none">' + ic('plus', 16) + '</span>') + '</button>';
    }).join('');
  }
  var LENSES = {
    thematic: { label: 'Thematic', hint: 'shared themes or topics, and how each text handles them differently', diff: 'How does each reading treat the shared topic? What does each one emphasize, include, or leave out?' },
    stylistic: { label: 'Stylistic', hint: 'tone, structure, and how each text is written', diff: 'How do their tone, structure, and word choices differ? Who does each one seem written for?' },
    contextual: { label: 'Contextual', hint: 'the history, culture, and who is speaking', diff: 'How do the authors background, time, or community shape what each one says?' },
    theoretical: { label: 'Theoretical', hint: 'a critical lens, for example power or whose knowledge counts', diff: 'Read both through one lens, for example power or whose knowledge counts. What does that lens show in each?' }
  };
  var CMP_EXAMPLE = [
    ['The subject', 'Two newspapers report the same event: a 1.5% city property tax increase.'],
    ['Article A, the Community Gazette', 'A human-interest lens. Empathetic, a little critical. Leads with retirees on fixed incomes and asks whether the council tried other cuts first.'],
    ['Article B, the Metro Financial Daily', 'An economic lens. Objective and forward-looking. Focuses on the transit and roads the revenue funds, and the long-run savings.'],
    ['Similarities', 'Both agree on the core fact, a 1.5% increase, and both treat it as controversial.'],
    ['Differences', 'The Gazette uses a local, emotional frame. The Financial Daily uses a structural, analytical one.'],
    ['The insight', 'A city makeup and its politics shape how the same policy gets framed in the press. The framing is the story behind the story.']
  ];
  function comparativeStudio(recs) {
    var lens = LENSES[state.lens] || LENSES.thematic;
    function zone(n, title, prompt, key, ph) {
      var v = esc((state.cmpNotes && state.cmpNotes[key]) || '');
      return '<div style="background:#fff;border:1px solid #DEE3EA;border-radius:12px;padding:15px 17px;margin-bottom:11px">'
        + '<div style="display:flex;align-items:baseline;gap:10px;margin-bottom:5px"><span style="display:inline-flex;width:24px;height:24px;align-items:center;justify-content:center;background:#15171C;color:#fff;border-radius:50%;font-size:.8rem;font-weight:700;flex:none">' + n + '</span><h3 style="margin:0;font-size:1.0625rem">' + title + '</h3></div>'
        + '<p style="margin:0 0 8px;font-size:.875rem;color:#474C57">' + prompt + '</p>'
        + '<textarea oninput="SOC.cmpNote(\'' + key + '\',this.value)" placeholder="' + ph + '" style="width:100%;min-height:68px;font:inherit;font-size:.9rem;line-height:1.5;padding:10px 12px;border:1px solid #DEE3EA;border-radius:8px;color:#15171C;background:#fff;resize:vertical">' + v + '</textarea></div>';
    }
    var chips = Object.keys(LENSES).map(function (k) {
      var on = state.lens === k;
      return '<button onclick="SOC.setLens(\'' + k + '\')" style="border:1px solid ' + (on ? '#15171C' : '#DEE3EA') + ';background:' + (on ? '#15171C' : '#fff') + ';color:' + (on ? '#fff' : '#15171C') + ';border-radius:999px;padding:7px 15px;font-size:.85rem;font-weight:600">' + LENSES[k].label + '</button>';
    }).join(' ');
    var ex = state.exampleOpen
      ? '<div style="background:#15171C;color:#fff;border-radius:13px;padding:16px 18px;margin-bottom:15px"><div style="display:flex;align-items:center;margin-bottom:10px"><span class="mono" style="font-size:.72rem;letter-spacing:.05em;color:#fff">A WORKED EXAMPLE</span><button onclick="SOC.toggleExample()" style="margin-left:auto;background:rgba(255,255,255,.14);border:none;border-radius:7px;color:#fff;padding:4px 10px;font-size:.78rem;font-weight:600">Hide</button></div>'
        + CMP_EXAMPLE.map(function (r) { return '<div style="margin-bottom:8px"><div class="mono" style="font-size:.6875rem;letter-spacing:.04em;color:#9aa3b2">' + esc(r[0]).toUpperCase() + '</div><div style="font-size:.875rem;line-height:1.5;color:rgba(255,255,255,.93)">' + esc(r[1]) + '</div></div>'; }).join('') + '</div>'
      : '<button onclick="SOC.toggleExample()" style="background:none;border:1px solid #DEE3EA;border-radius:9px;padding:9px 14px;font-size:.875rem;font-weight:600;color:#15171C;margin-bottom:15px">See a worked example</button>';
    var model = state.showModel
      ? '<div style="background:#15171C;color:#fff;border-radius:14px;padding:18px 20px;margin-top:12px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><span style="display:flex;color:#fff">' + ic('sparkle', 16) + '</span><span class="mono" style="font-size:.72rem;letter-spacing:.04em;color:#fff">A MODEL COMPARISON</span><button onclick="SOC.hideModel()" aria-label="Hide" style="margin-left:auto;background:rgba(255,255,255,.14);border:none;border-radius:7px;color:#fff;width:26px;height:26px">' + ic('x', 14) + '</button></div>'
        + buildSynthesis(recs).paras.map(function (p) { return '<p style="font-size:.95rem;line-height:1.6;margin:0 0 10px;color:rgba(255,255,255,.94)">' + esc(p) + '</p>'; }).join('')
        + '<p style="font-size:.82rem;margin:6px 0 0;color:#9aa3b2">One way to read it. Compare it with yours, do not copy it.</p></div>'
      : '<button onclick="SOC.revealModel()" style="background:none;border:1px solid #15171C;color:#15171C;border-radius:9px;padding:10px 16px;font-size:.9rem;font-weight:600">Reveal a model comparison</button>';
    return '<div style="margin-bottom:18px">'
      + '<h2 style="font-size:1.25rem;margin:0 0 4px">Compare them</h2>'
      + '<p style="font-size:.9375rem;color:#474C57;margin:0 0 14px;max-width:72ch">Comparative reading goes past what each text says on its own. Read the two together and look for what they share, how they differ, and why those differences matter.</p>'
      + ex
      + '<div style="font-size:.8125rem;font-weight:600;color:#15171C;margin-bottom:7px">Read them through a lens</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:6px">' + chips + '</div>'
      + '<p style="font-size:.82rem;color:#8a909c;margin:0 0 16px">' + esc(lens.label) + ': ' + esc(lens.hint) + '.</p>'
      + zone('1', 'Similarities', 'What do these readings share? Where do they agree, in facts, topic, or the same idea?', 'sim', 'They both...')
      + zone('2', 'Differences', esc(lens.diff), 'diff', 'The first... while the second...')
      + zone('3', 'Why the differences matter', 'Finish the thought: these differences matter because...', 'ins', 'These differences matter because...')
      + '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:4px"><button onclick="SOC.saveComparison()" style="background:var(--red);border:none;color:#fff;border-radius:9px;padding:10px 18px;font-size:.9rem;font-weight:600">Save my comparison</button>' + (state.showModel ? '' : model) + '</div>'
      + (state.showModel ? model : '')
      + '</div>';
  }
  var RC_QUESTIONS = {
    thematic: ['What is the main idea or argument of this reading? Put it in one sentence.', 'What evidence or examples does the author use to support it?', 'What is the author really saying about the larger topic or theme?', 'How does this reading change or add to how you understand the topic?'],
    stylistic: ['What is the author tone (for example plain, urgent, careful, personal)?', 'How is the reading organized, and how does that shape its argument?', 'Which words, images, or moments stood out, and what effect did they have?', 'Who does the writing seem to be for?'],
    contextual: ['Who wrote this, and from what background or position?', 'How might the time, place, or community shape what the author says?', 'Whose perspective is centred here, and whose is missing?', 'What would someone need to know about the context to read this fairly?'],
    theoretical: ['Read this through one lens, for example power, or whose knowledge counts. What does that lens reveal?', 'Who benefits from the way this is framed, and who is left out?', 'What does the author assume that a critical reader should question?', 'What would change if you read it through a different lens?']
  };
  var RC_GUIDANCE = {
    thematic: [
      ['States the single main idea in one clear sentence, in your own words.', 'Names the central claim the author argues, not just the topics covered.', 'Is specific enough that a reader could tell which reading it came from.'],
      ['Points to specific evidence the author uses (a study, example, case, or text), not just that evidence exists.', 'Shows HOW that evidence supports the claim, not only that it is there.', 'Separates the author\'s strongest support from a minor or passing example.'],
      ['Moves past the surface topic to the deeper claim the author makes about it.', 'Names what the author wants you to think or do differently.', 'Connects the reading to the wider course theme it speaks to.'],
      ['Names something specific that shifted, was added to, or was challenged in your thinking.', 'Explains why that change matters, not just that it happened.', 'Is honest about what still feels unclear or unresolved.']
    ],
    stylistic: [
      ['Names the tone in a word or two (for example plain, urgent, careful, personal).', 'Points to a specific line or moment where you felt that tone.', 'Says what the tone does to you as a reader (draws you in, warns, reassures).'],
      ['Describes the structure (for example story then analysis, problem then solution, a list of cases).', 'Links that structure to how the argument builds or lands.', 'Notes one place where the order of the ideas matters.'],
      ['Picks one specific word, image, phrase, or moment, not a general impression.', 'Describes the effect it had on you as a reader.', 'Says why the author might have chosen it.'],
      ['Names the likely audience (students, scholars, the public, a community).', 'Points to what in the writing signals who it is for (vocabulary, references, assumptions).', 'Considers who is not addressed.']
    ],
    contextual: [
      ['Identifies the author and the position or background they write from.', 'Notes how that position might shape what they notice or value.', 'Stays within what the reading or its context actually tells you, without guessing.'],
      ['Ties the time, place, or community to a specific choice the author makes.', 'Shows how the same idea might read differently in another context.', 'Treats context as shaping the argument, not just decorating it.'],
      ['Names whose perspective is centred in the reading.', 'Names a perspective that is absent or mentioned only in passing.', 'Gives a reason that absence matters for the argument.'],
      ['Names the specific background a fair reader needs, not just that context matters.', 'Separates what the reading assumes you know from what it explains.', 'Considers how a reader without that background might misread it.']
    ],
    theoretical: [
      ['Picks one clear lens (for example power, gender, colonialism, whose knowledge counts).', 'Says what that lens makes visible in this specific reading.', 'Uses the lens to read the text, not just to label it.'],
      ['Names who benefits from the way the reading frames the issue.', 'Names who is disadvantaged, ignored, or carries the cost.', 'Ties the benefit or harm to a specific part of the text.'],
      ['Identifies an assumption the author treats as given.', 'Explains why a critical reader should question it.', 'Considers what changes if that assumption does not hold.'],
      ['Names a second, different lens.', 'Shows how the reading would look different through it.', 'Says what each lens catches that the other misses.']
    ]
  };
  function rcChips() {
    return Object.keys(LENSES).map(function (k) {
      var on = state.lens === k;
      return '<button onclick="SOC.setLens(\'' + k + '\')" style="border:1px solid ' + (on ? '#15171C' : '#DEE3EA') + ';background:' + (on ? '#15171C' : '#fff') + ';color:' + (on ? '#fff' : '#15171C') + ';border-radius:999px;padding:7px 15px;font-size:.85rem;font-weight:600">' + LENSES[k].label + '</button>';
    }).join(' ');
  }
  function numList(arr) { if (!arr.length) return ''; if (arr.length === 1) return 'question ' + arr[0]; if (arr.length === 2) return 'questions ' + arr[0] + ' and ' + arr[1]; return 'questions ' + arr.slice(0, -1).join(', ') + ', and ' + arr[arr.length - 1]; }
  function listJoin(arr) { if (!arr.length) return ''; if (arr.length === 1) return arr[0]; if (arr.length === 2) return arr[0] + ' and ' + arr[1]; return arr.slice(0, -1).join(', ') + ', and ' + arr[arr.length - 1]; }
  var RC_SKILLS = { argument: 'the main argument', concepts: 'the key concepts', context: 'the context and who is speaking', significance: 'why the reading matters' };
  var RC_SKILL_ORDER = ['argument', 'concepts', 'context', 'significance'];
  function rcSkillProfile(rid, items) {
    var stat = {};
    items.forEach(function (m, mi) { var sk = m.skill; if (!sk) return; var sel = state.mcSel[rid + '|mc|' + mi]; if (sel === undefined || sel === null) return; if (!stat[sk]) stat[sk] = { right: 0, total: 0, whys: [] }; stat[sk].total++; if (sel === m.answer) stat[sk].right++; else if (m.why) stat[sk].whys.push(m.why); });
    var strengths = [], opps = [];
    RC_SKILL_ORDER.forEach(function (sk) { var s = stat[sk]; if (!s) return; if (s.right === s.total) strengths.push(RC_SKILLS[sk]); else opps.push({ key: sk, label: RC_SKILLS[sk], whys: s.whys }); });
    return { strengths: strengths, opps: opps, has: (strengths.length + opps.length) > 0 };
  }
  function lcFirst(s) { s = String(s == null ? '' : s); return s.charAt(0).toLowerCase() + s.slice(1); }
  function ucFirst(s) { s = String(s == null ? '' : s); return s.charAt(0).toUpperCase() + s.slice(1); }
  function rcBand(correct, total) {
    if (correct === total) return { label: 'Strong grasp', color: '#2c6b3f', bg: '#E9EFE7', icon: 'check', msg: 'You have a strong hold on this reading across every kind of question. The read-out below shows what came through.' };
    var pct = correct / total;
    if (pct >= 0.6) return { label: 'On your way', color: '#1552D8', bg: '#E7EEFB', icon: 'book', msg: 'You have the core of this reading. The read-out below shows where you are strong and where to look again.' };
    if (pct >= 0.4) return { label: 'Building', color: '#8F5E0F', bg: '#F3ECE0', icon: 'book', msg: 'You are part way into this reading. The read-out below shows what is landing and what to firm up.' };
    return { label: 'Worth another read', color: '#b23121', bg: '#FBE9E7', icon: 'book', msg: 'This reading has not fully landed yet. The read-out below shows exactly where to focus your next pass.' };
  }
  function readingComp() {
    var practiceNote = '<div style="display:flex;align-items:flex-start;gap:9px;background:#EEF1F5;border:1px solid #DEE3EA;border-radius:10px;padding:11px 14px;margin:0 0 16px;font-size:.85rem;line-height:1.5;color:#474C57"><span style="display:flex;color:#8a909c;flex:none;margin-top:1px">' + ic('book', 16) + '</span><span>This is a private space for practice and self-study. Nothing here is graded, recorded, or counted toward a mark. It is here to help you check your own understanding and see where to focus.</span></div>';
    var r = state.rcReading ? rec(state.rcReading) : null;
    if (!r) {
      var picks = D.records.map(function (rd) {
        var tm = typeMeta(rd.type);
        return '<button onclick="SOC.rcPick(\'' + rd.id + '\')" style="display:flex;align-items:center;gap:11px;width:100%;text-align:left;background:#fff;border:1px solid #DEE3EA;border-radius:10px;padding:12px 14px;margin-bottom:8px;color:#15171C"><span style="width:9px;height:9px;border-radius:50%;background:' + tm.color + ';flex:none"></span><span style="flex:1;min-width:0"><span style="display:block;font-weight:600;font-size:.95rem">' + esc(rd.title) + '</span><span style="font-size:.8125rem;color:#474C57">Week ' + rd.week + ' · ' + esc(rd.authors) + '</span></span><span style="color:#8a909c">' + ic('book', 16) + '</span></button>';
      }).join('');
      return '<div class="rise"><h1 style="font-size:1.75rem;margin:0 0 6px">Build Your Reading Comprehension</h1><p class="lede" style="max-width:72ch;margin:0 0 18px">Pick one reading. You will work through questions that build your understanding of it. Switch the lens to change the kind of questions you answer. Your answers save to your notes.</p>' + practiceNote + picks + '</div>';
    }
    var lens = LENSES[state.lens] || LENSES.thematic;
    var qs = RC_QUESTIONS[state.lens] || RC_QUESTIONS.thematic;
    var guide = RC_GUIDANCE[state.lens] || RC_GUIDANCE.thematic;
    var zones = qs.map(function (q, i) {
      var key = r.id + '|' + state.lens + '|' + i;
      var v = esc((state.rcNotes && state.rcNotes[key]) || '');
      var coreIdea = (i === 0 && r.coreIdea) ? esc(String(r.coreIdea).replace(/\s*\.?\s*$/, '')) + '.' : '';
      var crit = guide[i] || [];
      var rev = state.revealed[key]
        ? '<div style="margin-top:10px;background:#15171C;color:#fff;border-radius:10px;padding:13px 16px"><div class="mono" style="font-size:.66rem;letter-spacing:.05em;color:#9aa3b2;margin-bottom:8px">A STRONG RESPONSE COVERS</div><ul style="margin:0;padding-left:17px;font-size:.875rem;line-height:1.55;color:rgba(255,255,255,.93)">' + crit.map(function (c) { return '<li style="margin-bottom:5px">' + esc(c) + '</li>'; }).join('') + '</ul>' + (coreIdea ? '<div style="margin-top:11px;padding-top:10px;border-top:1px solid rgba(255,255,255,.16);font-size:.85rem;line-height:1.5;color:rgba(255,255,255,.9)"><span style="color:#F2A900;font-weight:600">From this reading: </span>the central idea is ' + coreIdea + '</div>' : '') + '<div style="margin-top:11px;font-size:.78rem;color:#9aa3b2">Compare your answer against this. There is no single right wording.</div><button onclick="SOC.rcReveal(\'' + key + '\')" style="margin-top:9px;background:rgba(255,255,255,.14);border:none;color:#fff;border-radius:7px;padding:5px 11px;font-size:.78rem;font-weight:600">Hide</button></div>'
        : '<button onclick="SOC.rcReveal(\'' + key + '\')" style="margin-top:10px;background:none;border:1px solid #DEE3EA;border-radius:8px;padding:7px 13px;font-size:.82rem;font-weight:600;color:#15171C">Reveal a strong response</button>';
      return '<div style="background:#fff;border:1px solid #DEE3EA;border-radius:12px;padding:15px 17px;margin-bottom:11px"><div style="display:flex;align-items:baseline;gap:10px;margin-bottom:7px"><span style="display:inline-flex;width:24px;height:24px;align-items:center;justify-content:center;background:#15171C;color:#fff;border-radius:50%;font-size:.8rem;font-weight:700;flex:none">' + (i + 1) + '</span><p style="margin:0;font-size:.95rem;color:#15171C">' + esc(q) + '</p></div><textarea oninput="SOC.rcNote(\'' + key + '\',this.value)" placeholder="Your answer" style="width:100%;min-height:68px;font:inherit;font-size:.9rem;line-height:1.5;padding:10px 12px;border:1px solid #DEE3EA;border-radius:8px;color:#15171C;background:#fff;resize:vertical">' + v + '</textarea>' + rev + '</div>';
    }).join('');
    var mcItems = MC[r.id] || [];
    var mcHtml = '';
    if (mcItems.length) {
      var answered = 0, correct = 0, missed = [];
      var rows = mcItems.map(function (m, mi) {
        var mkey = r.id + '|mc|' + mi;
        var sel = state.mcSel[mkey];
        var done = (sel !== undefined && sel !== null);
        if (done) { answered++; if (sel === m.answer) correct++; else missed.push(mi + 1); }
        var opts = (m.options || []).map(function (o, oi) {
          var isSel = (sel === oi), isCor = (oi === m.answer);
          var bg = '#fff', bd = '#DEE3EA', col = '#15171C';
          if (done && isCor) { bg = '#E9EFE7'; bd = '#50694C'; col = '#2c3b29'; }
          else if (done && isSel) { bg = '#F6E3E1'; bd = '#DA291C'; col = '#8f1b12'; }
          var mark = (done && isCor) ? ' &#10003;' : ((done && isSel) ? ' &#10007;' : '');
          return '<button onclick="SOC.mcPick(\'' + mkey + '\',' + oi + ')" style="display:block;width:100%;text-align:left;border:1px solid ' + bd + ';background:' + bg + ';color:' + col + ';border-radius:8px;padding:9px 12px;margin-bottom:7px;font-size:.9rem;font-weight:500">' + esc(o) + mark + '</button>';
        }).join('');
        var ok = (sel === m.answer);
        var why = done ? '<div style="margin:9px 0 0;padding:10px 13px;border-radius:9px;background:' + (ok ? '#E9EFE7' : '#FBE9E7') + ';border:1px solid ' + (ok ? '#9CC4A8' : '#E5A9A2') + '"><span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:.9rem;color:' + (ok ? '#2c6b3f' : '#b23121') + '">' + (ok ? ic('check', 15, 2.4) + 'Correct' : ic('x', 15, 2.4) + 'Not quite') + '</span><div style="margin-top:4px;font-size:.85rem;line-height:1.5;color:#474C57">' + esc(m.why || '') + '</div></div>' : '';
        return '<div style="background:#fff;border:1px solid #DEE3EA;border-radius:12px;padding:15px 17px;margin-bottom:11px"><p style="margin:0 0 9px;font-size:.95rem;font-weight:600;color:#15171C">' + (mi + 1) + '. ' + esc(m.q) + '</p>' + opts + why + '</div>';
      }).join('');
      var total = mcItems.length, pct = Math.round(100 * correct / total);
      var score = '<div style="margin:2px 0 16px;max-width:460px">'
        + '<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px"><span style="font-size:.9rem;font-weight:700;color:#15171C">' + (answered ? 'You got ' + correct + ' of ' + total : 'Answer to fill the meter') + '</span><span style="font-size:.78rem;color:#8a909c">' + answered + ' of ' + total + ' answered</span></div>'
        + '<div style="height:11px;background:#EEF1F5;border-radius:999px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#50694C,#74a878);border-radius:999px;transition:width .35s ease"></div></div>'
        + (answered ? '' : '<p style="font-size:.8rem;color:#8a909c;margin:8px 0 0">Pick an answer to check it right away. You can change your choice.</p>') + '</div>';
      var band = (answered === total && total) ? rcBand(correct, total) : null;
      var pctLabel = band ? Math.round(100 * correct / total) + '%' : '';
      var diagLine = '';
      if (band) {
        var prof = rcSkillProfile(r.id, mcItems);
        if (prof.has) {
          if (prof.strengths.length) { var coreBit = (prof.strengths.indexOf(RC_SKILLS.argument) >= 0 && r.coreIdea) ? ' You have the central point, that ' + lcFirst(esc(String(r.coreIdea).replace(/\s*\.?\s*$/, ''))) + '.' : ''; diagLine += '<div style="margin-top:12px"><span class="mono" style="font-size:.66rem;letter-spacing:.05em;color:#2c6b3f">YOUR STRENGTHS</span><div style="font-size:.9rem;line-height:1.5;color:#15171C;margin-top:3px">Your answers show you read ' + listJoin(prof.strengths) + ' well.' + coreBit + '</div></div>'; }
          if (prof.opps.length) { var oppRows = prof.opps.map(function (o) { return '<div style="margin-top:7px"><span style="font-weight:600;color:#15171C">' + ucFirst(o.label) + '.</span> <span style="color:#474C57">' + (o.whys.length ? esc(o.whys.join(' ')) : 'Go back to this in the reading and read for it directly.') + '</span></div>'; }).join(''); diagLine += '<div style="margin-top:12px"><span class="mono" style="font-size:.66rem;letter-spacing:.05em;color:#8F5E0F">AREAS OF OPPORTUNITY</span><div style="font-size:.875rem;line-height:1.5;color:#15171C;margin-top:1px">' + oppRows + '</div></div>'; }
          else diagLine += '<div style="margin-top:10px;font-size:.85rem;color:#2c6b3f">No gaps stood out. You handled the argument, the concepts, the context, and the significance, all of it.</div>';
        } else {
          diagLine = (missed.length) ? '<p style="margin:7px 0 0;font-size:.9rem;line-height:1.5;color:#15171C"><span style="font-weight:600">Look again at ' + numList(missed) + '.</span> Those are the ideas to firm up before you move on.</p>' : '<p style="margin:7px 0 0;font-size:.9rem;color:#15171C"><span style="font-weight:600">You answered every question correctly.</span> Nothing to revisit here.</p>';
        }
      }
      var bandHtml = band ? '<div style="margin:18px 0 4px;background:' + band.bg + ';border:1.5px solid ' + band.color + ';border-radius:13px;padding:17px 19px">'
        + '<div class="mono" style="font-size:.68rem;letter-spacing:.06em;color:' + band.color + ';margin-bottom:7px">WHERE YOU ARE IN THIS READING</div>'
        + '<div style="display:flex;align-items:center;gap:11px;flex-wrap:wrap"><span style="display:flex;color:' + band.color + '">' + ic(band.icon, 24, 2.2) + '</span><span style="font-size:1.35rem;font-weight:700;color:' + band.color + '">' + band.label + '</span><span style="margin-left:auto;text-align:right"><span style="display:block;font-size:1.05rem;font-weight:700;color:' + band.color + '">' + correct + ' of ' + total + '</span><span style="font-size:.72rem;color:#474C57">correct (' + pctLabel + ')</span></span></div>'
        + '<div style="height:8px;background:#fff;border-radius:999px;overflow:hidden;margin:11px 0 2px"><div style="height:100%;width:' + Math.round(100 * correct / total) + '%;background:' + band.color + ';border-radius:999px"></div></div>'
        + '<p style="margin:11px 0 0;font-size:.92rem;line-height:1.55;color:#15171C">' + band.msg + '</p>'
        + diagLine
        + '<div style="margin-top:14px;display:flex;gap:9px;flex-wrap:wrap"><button onclick="SOC.read(\'' + r.id + '\')" style="background:' + band.color + ';border:none;color:#fff;border-radius:9px;padding:8px 15px;font-size:.875rem;font-weight:600">' + readLabel(r) + ' &#8599;</button><button onclick="SOC.mcReset(\'' + r.id + '\')" style="background:#fff;border:1px solid ' + band.color + ';color:' + band.color + ';border-radius:9px;padding:8px 15px;font-size:.875rem;font-weight:600">Try these questions again</button></div></div>' : '';
      mcHtml = '<div style="margin:24px 0 4px"><h2 style="font-size:1.15rem;margin:0 0 3px">Check your understanding</h2><p style="font-size:.85rem;color:#8a909c;margin:0 0 12px">Quick questions on this reading, with the answer right away.</p>' + score + rows + bandHtml + '</div>';
    }
    return '<div class="rise"><div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:4px"><h1 style="font-size:1.5rem;margin:0">Build Your Reading Comprehension</h1><button onclick="SOC.rcClear()" style="margin-left:auto;background:none;border:none;color:var(--red);font-size:.875rem;font-weight:600">Choose a different reading</button></div>'
      + practiceNote
      + '<div style="background:#15171C;color:#fff;border-radius:12px;padding:15px 18px;margin:8px 0 16px"><div class="mono" style="font-size:.6875rem;letter-spacing:.04em;color:#9aa3b2;margin-bottom:3px">YOUR READING</div><div style="font-size:1.0625rem;font-weight:600">' + esc(r.title) + '</div><div style="font-size:.875rem;color:rgba(255,255,255,.85)">Week ' + r.week + ' · ' + esc(r.authors) + ' · ' + esc(r.year) + '</div><button onclick="SOC.read(\'' + r.id + '\')" style="margin-top:10px;background:rgba(255,255,255,.14);border:none;color:#fff;border-radius:7px;padding:7px 13px;font-size:.85rem;font-weight:600">' + readLabel(r) + ' ↗</button></div>'
      + '<div style="font-size:.8125rem;font-weight:600;color:#15171C;margin-bottom:7px">Choose a lens (this changes the questions)</div><div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:6px">' + rcChips() + '</div><p style="font-size:.82rem;color:#8a909c;margin:0 0 16px">' + esc(lens.label) + ': ' + esc(lens.hint) + '.</p>'
      + zones
      + mcHtml
      + '<button onclick="SOC.saveReadingNotes()" style="background:var(--red);border:none;color:#fff;border-radius:9px;padding:10px 18px;font-size:.9rem;font-weight:600;margin-top:8px">Save my notes</button></div>';
  }
  function compare() {
    var recs = state.compareIds.map(rec).filter(Boolean);
    var html = '<div class="rise"><div style="display:flex;align-items:baseline;gap:12px;margin-bottom:6px;flex-wrap:wrap"><h1 style="font-size:1.75rem;font-weight:600;margin:0">Hold them side by side</h1><span style="font-size:.9375rem;color:#474C57">' + (recs.length ? recs.length + ' of 3 selected' : 'choose 2 or 3') + '</span>'
      + (recs.length ? '<button onclick="SOC.clearCompare()" style="margin-left:auto;background:none;border:none;color:var(--red);font-size:.875rem;font-weight:600">Clear all</button>' : '') + '</div>'
      + '<p style="font-size:.9375rem;color:#474C57;margin:0 0 22px;max-width:70ch">Choose readings from the list on the right, up to three, and they appear side by side here. Holding two readings together shows how they connect on the same topic.</p>';

    var left;
    if (recs.length >= 1) {
      var cols = recs.map(function (r) {
        var tm = typeMeta(r.type);
        var rows = [['WEEK', 'Week ' + r.week + ': ' + weekTitle(r.week)], ['YEAR', String(r.year)], ['ORIGIN', r.origin], ['LENGTH', r.len], ['LEVEL', D.levels[r.diff] || ''], ['THE CORE IDEA', r.coreIdea]]
          .map(function (row) { return '<div style="padding:11px 17px;border-top:1px solid #EEF1F5"><div class="mono" style="font-size:.625rem;letter-spacing:.05em;color:#8a909c;margin-bottom:4px">' + row[0] + '</div><div style="font-size:.875rem;line-height:1.45;color:#15171C">' + esc(row[1]) + '</div></div>'; }).join('');
        return '<div style="flex:none;width:280px;background:#fff;border:1px solid #DEE3EA;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(21,23,28,.04);display:flex;flex-direction:column"><div style="height:5px;background:' + tm.color + '"></div><div style="padding:16px 17px 14px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:11px"><span style="display:inline-flex;align-items:center;gap:6px;background:' + tm.soft + ';color:' + tm.color + ';font-size:.6875rem;font-weight:600;padding:4px 9px;border-radius:999px">' + ic(tm.icon, 13) + esc(r.type) + '</span><button onclick="SOC.compare(\'' + r.id + '\')" class="removebtn" aria-label="Remove" style="margin-left:auto;background:none;border:none;color:#6b7280;display:flex;padding:6px">' + ic('x', 16) + '</button></div><button onclick="SOC.open(\'' + r.id + '\')" style="text-align:left;background:none;border:none;padding:0;display:block;margin-bottom:4px"><h3 style="font-size:1.0625rem;line-height:1.3;font-weight:600;margin:0;color:#15171C">' + esc(r.title) + '</h3></button><div style="font-size:.8125rem;color:#474C57">' + esc(r.authors) + '</div></div>' + rows + '</div>';
      }).join('');
      var hint = recs.length < 2 ? '<p style="font-size:.875rem;color:#8a909c;margin:0 0 12px">Pick one more reading on the right to compare it against this one.</p>' : '';
      var synthBlock = '';
      if (recs.length >= 2) {
        if (state.showSynthesis) {
          var syn = buildSynthesis(recs);
          synthBlock = '<div style="background:#15171C;color:#fff;border-radius:14px;padding:20px 22px;margin-bottom:18px">'
            + '<div style="display:flex;align-items:center;gap:9px;margin-bottom:12px"><span style="display:flex;color:#fff">' + ic('sparkle', 17) + '</span><span class="mono" style="font-size:.75rem;letter-spacing:.04em;color:#fff">HOW THESE CONNECT</span><button onclick="SOC.hideSynthesis()" aria-label="Hide" style="margin-left:auto;background:rgba(255,255,255,.12);border:none;border-radius:7px;color:#fff;width:26px;height:26px;display:flex;align-items:center;justify-content:center">' + ic('x', 15) + '</button></div>'
            + syn.paras.map(function (p) { return '<p style="font-size:1rem;line-height:1.6;margin:0 0 12px;color:rgba(255,255,255,.92)">' + esc(p) + '</p>'; }).join('')
            + '</div>';
        } else {
          synthBlock = '<button onclick="SOC.synthesize()" style="display:inline-flex;align-items:center;gap:8px;border:none;border-radius:9px;padding:12px 22px;font-size:1rem;font-weight:600;color:#fff;background:#15171C;margin-bottom:18px">' + ic('sparkle', 16) + 'Synthesize their relationship</button>';
        }
      }
      left = hint + synthBlock + '<div class="hshelf" style="display:flex;gap:16px;align-items:stretch;overflow-x:auto;padding-bottom:10px">' + cols + '</div>';
    } else {
      left = '<div style="background:#fff;border:1px dashed #DEE3EA;border-radius:14px;padding:48px 26px;text-align:center;color:#474C57"><div style="display:inline-flex;color:#C9D1DC;margin-bottom:12px">' + ic('columns', 40, 1.4) + '</div><div style="font-size:1.0625rem;font-weight:600;color:#15171C;margin-bottom:6px">Nothing selected yet.</div><p style="font-size:.9375rem;margin:0">Choose two or three readings from the list on the right.</p></div>';
    }

    var right = '<aside class="soc-rail" style="position:sticky;top:84px">'
      + '<div class="soc-pickbox" style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(21,23,28,.04);display:flex;flex-direction:column;max-height:calc(100vh - 110px)">'
      + '<div style="padding:13px 14px;border-bottom:1px solid #EEF1F5;flex:none"><div style="font-size:.9375rem;font-weight:600;color:#15171C">Readings</div><div style="font-size:.75rem;color:#8a909c;margin-top:2px">' + recs.length + ' of 3 selected. Tap to add or remove.</div></div>'
      + '<div class="scrollarea" style="overflow:auto">' + comparePickList() + '</div>'
      + '</div></aside>';

    html += '<div class="soc-detailgrid" style="display:grid;grid-template-columns:1fr 300px;gap:26px;align-items:start"><div>' + left + '</div>' + right + '</div>';
    return html + '</div>';
  }

  /* ---------- glossary & thinkers + self-check (course concepts) ---------- */
  function conceptsForWeek(w) { return (D.glossary || []).filter(function (g) { return g.week === w; }); }
  function thinkersForWeek(w) { return D.records.filter(function (r) { return r.week === w && r.authors.indexOf('OpenStax') < 0; }); }

  function glossaryByWeek(sel) {
    var weeks = (sel === 'all' || sel == null) ? weeksWithReadings() : [parseInt(sel, 10)];
    return weeks.map(function (w) {
      var cons = conceptsForWeek(w).map(function (g) {
        return '<div style="margin:12px 0"><div style="font-size:.9375rem;font-weight:600;color:#15171C">' + esc(g.term) + '</div><div style="font-size:.875rem;line-height:1.55;color:#474C57;margin-top:3px">' + esc(g.def) + '</div>' + (g.cite ? '<div style="font-size:.75rem;color:#8a909c;border-left:3px solid #DEE3EA;padding-left:10px;margin-top:7px">' + esc(g.cite) + '</div>' : '') + '</div>';
      }).join('');
      var thinks = thinkersForWeek(w);
      var tk = thinks.length ? '<div class="mono" style="font-size:.6875rem;letter-spacing:.04em;color:#8a909c;margin:14px 0 5px">SCHOLARS THIS WEEK</div>' + thinks.map(function (r) {
        return '<div style="margin:5px 0;font-size:.8125rem;color:#15171C;line-height:1.5">' + eyePill(r) + ' <button onclick="SOC.open(\'' + r.id + '\')" style="background:none;border:none;padding:0;color:#1552D8;font-weight:600;cursor:pointer">' + esc(r.authors) + '</button>. ' + esc(r.coreIdea) + '</div>';
      }).join('') : '';
      return '<div style="border:1px solid #DEE3EA;border-radius:12px;padding:10px 16px 15px;margin-bottom:14px;background:#fff"><div class="mono" style="font-size:.6875rem;letter-spacing:.04em;color:#1B2A4A;margin:6px 0 2px">WEEK ' + w + ' &middot; ' + esc(weekTitle(w)) + '</div>' + (cons || '<p style="color:#8a909c;font-size:.875rem">No concepts listed.</p>') + tk + '</div>';
    }).join('');
  }
  function glossarySearchHTML(q) {
    q = (q || '').toLowerCase().trim(); if (!q) return '';
    var hits = (D.glossary || []).filter(function (g) { return (g.term + ' ' + g.def).toLowerCase().indexOf(q) >= 0; });
    if (!hits.length) return '<p style="color:#8a909c;font-size:.875rem">No matches. Try another word.</p>';
    return '<div class="soc-cardgrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">' + hits.map(function (g) {
      return '<div style="background:#fff;border:1px solid #DEE3EA;border-radius:12px;padding:14px 16px"><div style="font-size:.9375rem;font-weight:600;color:#15171C">' + esc(g.term) + '</div><div style="font-size:.8125rem;line-height:1.55;color:#474C57;margin:4px 0 8px">' + esc(g.def) + '</div>' + (g.cite ? '<div style="font-size:.7rem;color:#8a909c;margin-bottom:8px">' + esc(g.cite) + '</div>' : '') + '<button onclick="SOC.glossWeekGo(' + g.week + ')" class="mono" style="font-size:.6875rem;color:#1B2A4A;background:#E6EAF1;border:none;padding:3px 8px;border-radius:6px;cursor:pointer">Week ' + g.week + '</button></div>';
    }).join('') + '</div>';
  }
  function glossaryScreen() {
    var sel = state.glossWeek;
    var weekOpts = '<option value="all"' + (sel === 'all' ? ' selected' : '') + '>All weeks</option>' + weeksWithReadings().map(function (w) { return '<option value="' + w + '"' + (String(w) === String(sel) ? ' selected' : '') + '>Week ' + w + ': ' + esc(weekTitle(w)) + '</option>'; }).join('');
    return '<div class="rise">'
      + '<div class="mono" style="font-size:.75rem;letter-spacing:.06em;color:#8a909c;margin-bottom:8px">REFERENCE</div>'
      + '<h1 style="font-size:1.75rem;font-weight:600;margin:0 0 8px">Glossary and Thinkers</h1>'
      + '<p style="font-size:.9375rem;color:#474C57;margin:0 0 18px;max-width:72ch">The course concepts in plain words, week by week, and the scholars behind the readings.</p>'
      + '<label for="soc-gsearch" style="font-size:.8125rem;font-weight:600;color:#474C57;display:block;margin-bottom:6px">Search every concept</label>'
      + '<input id="soc-gsearch" oninput="SOC.glossSearch(this.value)" value="' + esc(state.glossSearch) + '" placeholder="Type a concept, for example: ways of knowing" autocomplete="off" style="width:100%;max-width:460px;padding:10px 13px;border:1px solid #DEE3EA;border-radius:9px;background:#fff;font-size:.9375rem;color:#15171C" />'
      + '<div id="soc-gsearchout" style="margin-top:12px">' + glossarySearchHTML(state.glossSearch) + '</div>'
      + '<label for="soc-gweek" style="font-size:.8125rem;font-weight:600;color:#474C57;display:block;margin:18px 0 6px">Or browse by week</label>'
      + '<select id="soc-gweek" onchange="SOC.glossWeek(this.value)" style="max-width:440px;padding:9px 12px;border:1px solid #DEE3EA;border-radius:9px;background:#fff;font-size:.9375rem;color:#15171C">' + weekOpts + '</select>'
      + '<div id="soc-gout" style="margin-top:16px">' + glossaryByWeek(sel) + '</div>'
      + '</div>';
  }

  function card(g) {
    return '<button class="flip" onclick="SOC.flip(this)" aria-label="Self-check: ' + esc(g.term) + '. Activate to reveal the definition.">'
      + '<span class="flip-inner">'
      + '<span class="flip-face flip-front">'
      + '<span style="display:flex;align-items:center;gap:8px;margin-bottom:11px"><span class="mono" style="font-size:.6875rem;color:#8a909c;margin-left:auto">WEEK ' + g.week + '</span></span>'
      + '<span class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:#1B2A4A;margin-bottom:6px">RECALL</span>'
      + '<span style="font-size:1.0625rem;font-weight:600;line-height:1.3;color:#15171C">' + esc(g.term) + '</span>'
      + '<span style="margin-top:auto;padding-top:14px;font-size:.8125rem;color:#1552D8;font-weight:600">Reveal the definition &rarr;</span>'
      + '</span>'
      + '<span class="flip-face flip-back">'
      + '<span class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:#F2A900;margin-bottom:8px">DEFINITION</span>'
      + '<span style="font-size:.9rem;line-height:1.5;font-weight:500">' + esc(g.def) + '</span>'
      + '<span style="margin-top:auto;padding-top:10px;font-size:.7rem;color:rgba(255,255,255,.62)">' + (g.cite ? esc(g.cite) : 'Week ' + g.week + ' &middot; ' + esc(weekTitle(g.week))) + '</span>'
      + '</span>'
      + '</span></button>';
  }
  function courseCode() { return (D.course && D.course.code) || ''; }
  function focusWeek(sel) { var ws = weeksWithReadings(); return sel == null ? (ws[0] || 1) : sel; }
  function recordsForWeek(w) { return D.records.filter(function (r) { return r.week === w; }); }
  function firstWhere(list, fn) { for (var i = 0; i < list.length; i++) if (fn(list[i])) return list[i]; return null; }
  function firstSentence(s) { var t = String(s || '').replace(/\s+/g, ' ').trim(), m = t.match(/^(.{60,220}?[.!?])\s/); return m ? m[1] : t.slice(0, 240); }
  function studioOpenBtn(r) {
    return r ? '<button onclick="SOC.read(\'' + r.id + '\')" style="margin-top:6px;align-self:flex-start;background:none;border:none;color:#1552D8;font-size:.78rem;font-weight:600;padding:0;cursor:pointer">Open the reading &#8599;</button>' : '';
  }
  function studioPanel(kicker, title, body, meta, icon, accent, r) {
    return '<div style="background:#fff;border:1px solid #DEE3EA;border-top:4px solid ' + accent + ';border-radius:12px;padding:15px 16px;display:flex;flex-direction:column;gap:8px;min-height:190px">'
      + '<div class="mono" style="display:flex;align-items:center;gap:7px;font-size:.6875rem;letter-spacing:.05em;color:#8a909c">' + ic(icon || 'clipboard', 14) + esc(kicker) + '</div>'
      + '<h3 style="font-size:1.0625rem;line-height:1.3;margin:0;color:#15171C">' + esc(title) + '</h3>'
      + '<p style="font-size:.875rem;line-height:1.55;color:#474C57;margin:0">' + esc(body) + '</p>'
      + (meta ? '<div style="margin-top:auto;border-left:3px solid #DEE3EA;padding-left:10px;font-size:.75rem;line-height:1.45;color:#6b7280">' + esc(meta) + '</div>' : '')
      + studioOpenBtn(r)
      + '</div>';
  }
  function studioCheck(key, check) {
    var sel = state.mcSel[key], done = (sel !== undefined && sel !== null), ok = done && sel === check.answer;
    var opts = check.options.map(function (o, oi) {
      var isSel = sel === oi, isCor = oi === check.answer, bg = '#fff', bd = '#DEE3EA', col = '#15171C';
      if (done && isCor) { bg = '#E9EFE7'; bd = '#50694C'; col = '#2c3b29'; }
      else if (done && isSel) { bg = '#F6E3E1'; bd = '#DA291C'; col = '#8f1b12'; }
      var mark = (done && isCor) ? ' &#10003;' : ((done && isSel) ? ' &#10007;' : '');
      return '<button onclick="SOC.mcPick(\'' + key + '\',' + oi + ')" aria-pressed="' + (isSel ? 'true' : 'false') + '" style="display:block;width:100%;text-align:left;border:1px solid ' + bd + ';background:' + bg + ';color:' + col + ';border-radius:8px;padding:9px 12px;margin-bottom:7px;font-size:.875rem;font-weight:500;cursor:pointer">' + esc(o) + mark + '</button>';
    }).join('');
    var why = done ? '<div style="margin:8px 0 0;padding:10px 13px;border-radius:9px;background:' + (ok ? '#E9EFE7' : '#FBE9E7') + ';border:1px solid ' + (ok ? '#9CC4A8' : '#E5A9A2') + '"><span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:.875rem;color:' + (ok ? '#2c6b3f' : '#b23121') + '">' + (ok ? ic('check', 14, 2.4) + 'Correct' : ic('x', 14, 2.4) + 'Not quite') + '</span><div style="margin-top:4px;font-size:.84rem;line-height:1.5;color:#474C57">' + esc(check.why) + '</div></div>' : '';
    return '<div role="group" style="background:#F7F8FA;border:1px solid #DEE3EA;border-radius:12px;padding:14px 16px;margin-top:14px"><div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:#8a909c;margin-bottom:8px">QUICK CHECK</div><p style="margin:0 0 9px;font-size:.9rem;font-weight:600;color:#15171C">' + esc(check.q) + '</p>' + opts + why + '</div>';
  }
  function studioShell(title, intro, inner) {
    return '<section style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;padding:18px 18px 20px;margin:0 0 22px;box-shadow:0 1px 2px rgba(21,23,28,.04)">'
      + '<div class="mono" style="font-size:.6875rem;letter-spacing:.06em;color:var(--red);font-weight:600;margin-bottom:6px">SELF-CHECK STUDIO</div>'
      + '<h2 style="font-size:1.3125rem;line-height:1.25;margin:0 0 7px;color:#15171C">' + esc(title) + '</h2>'
      + '<p style="font-size:.9375rem;line-height:1.55;color:#474C57;margin:0 0 15px;max-width:78ch">' + esc(intro) + '</p>' + inner + '</section>';
  }
  function socStudio(sel) {
    if (!HAS_EYE) return '';
    var w = focusWeek(sel), recs = recordsForWeek(w);
    var west = firstWhere(recs, function (r) { return r.eye === 'western'; });
    var ind = firstWhere(recs, function (r) { return r.eye === 'indigenous'; });
    if (!ind) return '';
    var panels = (west ? studioPanel('WESTERN EYE', west.authors, west.coreIdea, west.title + ' (' + west.year + ')', 'eye', '#3a47a8', west) : '')
      + studioPanel('INDIGENOUS EYE', ind.authors, ind.coreIdea, ind.title + ' (' + ind.year + ')', 'eye', '#1f4d38', ind);
    var soloNote = west ? '' : '<div style="margin-top:12px;background:#E4F0E9;border:1px solid #c4ddcf;border-radius:11px;padding:12px 15px;font-size:.85rem;line-height:1.55;color:#1f4d38">This week centres Indigenous knowledge; there is no separate Western-eye reading to set beside it. That is itself a Two-Eyed Seeing observation: not every topic carries a Western counterpart, and the Indigenous frame stands on its own here.</div>';
    var prompts = west
      ? ['What does ' + ind.authors + '\'s reading let you see that ' + west.authors + '\'s does not?', 'What would be missed if this week were read with only the Western eye?', 'What responsibility does ' + ind.authors + ' ask you to keep visible?']
      : ['What does ' + ind.authors + '\'s reading let you see about this week\'s topic?', 'What responsibility does ' + ind.authors + ' ask you to keep visible?'];
    var practice = '<div style="margin-top:14px;background:#F7F8FA;border:1px solid #DEE3EA;border-radius:12px;padding:14px 16px"><div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:#8a909c;margin-bottom:7px">TWO-EYED SEEING PRACTICE</div><p style="font-size:.78rem;color:#6b7280;line-height:1.5;margin:0 0 9px">Two-Eyed Seeing (Etuaptmumk) was named by Mi\'kmaw Elder Albert Marshall: seeing with the strengths of Indigenous knowledge in one eye and Western knowledge in the other, both kept whole. It is a practice you bring, not a synthesis the app writes.</p>' + prompts.map(function (p) { return '<div style="display:flex;gap:9px;align-items:flex-start;font-size:.875rem;line-height:1.5;color:#15171C;margin:6px 0"><span style="color:var(--red);font-weight:700">+</span><span>' + esc(p) + '</span></div>'; }).join('') + '</div>';
    var check = west ? studioCheck('SOC122|studio|' + w, {
      q: 'What is most at risk if this week\'s topic is treated as only a Western research-methods question?',
      options: [firstSentence(ind.coreIdea), 'Nothing important; the Western frame already covers it', 'Only the choice of examples or the citation style'],
      answer: 0,
      why: 'What is lost is exactly what ' + ind.authors + ' brings: ' + lcFirst(String(ind.coreIdea).replace(/\s*\.?\s*$/, '')) + '. Two-Eyed Seeing keeps both eyes open so this is not flattened into a footnote.'
    }) : '';
    var woven = '';
    if (west) {
      var wk2 = 'SOC122|weave|' + w, syn = (D.syntheses || {})[[west.id, ind.id].sort().join('|')];
      if (syn) woven = state.revealed[wk2]
        ? '<div style="margin-top:12px;background:#15171C;color:#fff;border-radius:11px;padding:14px 16px"><div class="mono" style="font-size:.62rem;letter-spacing:.05em;color:#9aa3b2;margin-bottom:6px">ONE GROUNDED WEAVE</div><p style="font-size:.86rem;line-height:1.55;color:rgba(255,255,255,.92);margin:0">' + esc(syn) + '</p><p style="font-size:.72rem;color:#9aa3b2;margin:9px 0 0">One way the course readings have been held together, not the answer. Two-Eyed Seeing keeps both eyes distinct (Etuaptmumk), never blended. <button onclick="SOC.rcReveal(\'' + wk2 + '\')" style="background:none;border:none;color:#f3b0a8;font-weight:600;cursor:pointer;padding:0">Hide</button></p></div>'
        : '<button onclick="SOC.rcReveal(\'' + wk2 + '\')" style="margin-top:12px;background:#fff;border:1px solid #DEE3EA;color:#15171C;border-radius:9px;padding:9px 14px;font-size:.84rem;font-weight:600;cursor:pointer">Reflect first, then see one grounded weave &#8595;</button>';
    }
    var save = '<div style="margin-top:14px"><button onclick="SOC.saveStudio()" style="background:var(--red);border:none;color:#fff;border-radius:9px;padding:9px 16px;font-size:.875rem;font-weight:600;cursor:pointer">Save my work to the Personal Cartography (.docx)</button></div>';
    return studioShell('Two attributed eyes', 'Read the two source frames as attributed readings, then bring Two-Eyed Seeing yourself. The app does not write a bridge for you.', '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px">' + panels + '</div>' + soloNote + practice + check + woven + save);
  }
  function psyStudio(sel) {
    var w = focusWeek(sel), recs = recordsForWeek(w), r = recs[0] || D.records[0], g = conceptsForWeek(w)[0] || (D.glossary || [])[0], items = (r && MC[r.id]) || [];
    if (!r) return '';
    var ev = firstWhere(items, function (m) { return m.skill === 'argument' || m.skill === 'context'; });
    var panels = studioPanel('CLAIM', r.title, r.coreIdea, r.authors + ' (' + r.year + ')', 'book', '#1552D8')
      + studioPanel('EVIDENCE', ev ? ev.q : 'What supports the claim?', ev ? ev.why : firstSentence(r.abstract), 'Ground this in the reading before applying it.', 'search', '#1f7a4d')
      + studioPanel('BOUNDARY', 'What this does not prove', 'Do not turn this idea into a rule for every learner. Check the context, supports, workload, strategy, and evidence before giving advice.', g ? g.term : 'Course concept', 'x', '#B7791F')
      + studioPanel('TRANSFER', 'Academic next step', 'Name one course task, one support, one study strategy, and one sign that the strategy is working.', 'No clinical or diagnostic framing.', 'external', '#7C3AED');
    var check = studioCheck('PSY355|studio|' + w, {
      q: 'Which next step uses this idea responsibly, without turning it into a rule or blaming the student?',
      options: ['Name one course task, one support, and one sign the strategy is working, then check the context before advising.', 'Tell the student they just need more grit or a better attitude.', 'Apply it the same way to every student, whatever their situation.'],
      answer: 0,
      why: 'The responsible step respects the boundary: ' + lcFirst(String(r.coreIdea).replace(/\s*\.?\s*$/, '')) + ', but only within its supports and context. Grit-talk blames the learner; one-size-fits-all overstates the reading.'
    });
    var save = '<div style="margin-top:14px"><button onclick="SOC.saveStudio()" style="background:var(--red);border:none;color:#fff;border-radius:9px;padding:9px 16px;font-size:.875rem;font-weight:600;cursor:pointer">Save my work to the Resilience Plan (.docx)</button></div>';
    return studioShell('Evidence Transfer Lab', 'Move from definition to responsible application: claim, evidence, boundary, then academic transfer.', '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">' + panels + '</div>' + check + save);
  }
  function bfsStudio(sel) {
    var w = focusWeek(sel), recs = recordsForWeek(w), r = recs[0] || D.records[0], g = conceptsForWeek(w)[0] || (D.glossary || [])[0];
    if (!r) return '';
    var response = firstWhere(D.records, function (x) { return (x.themes || []).indexOf('resistance') >= 0 || /Benjamin|Costanza|Tanksley/i.test(x.authors + ' ' + x.title); }) || r;
    var rows = [['System or technology', 'Name the system, platform, model, database, policy, or technical process.'], ['Design, data, or default', 'Locate the design choice, data source, rule, threshold, category, or default setting.'], ['Racialized mechanism', 'Explain how the system sorts, exposes, excludes, predicts, surveils, or ranks people.'], ['Harm and accountability', 'Name the harm and the institutions responsible for changing the structure, not just one bad actor.'], ['Response', 'Ground the repair, refusal, abolitionist tool, or policy response in the course readings.']];
    var chain = rows.map(function (row, i) { return '<div style="display:grid;grid-template-columns:34px minmax(0,1fr);gap:11px;align-items:start;background:#fff;border:1px solid #DEE3EA;border-radius:12px;padding:12px 14px"><div class="mono" style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;background:#F6E3E1;color:var(--red);font-weight:700">' + (i + 1) + '</div><div><div style="font-size:.9375rem;font-weight:600;color:#15171C;margin-bottom:3px">' + esc(row[0]) + '</div><div style="font-size:.8125rem;line-height:1.5;color:#474C57">' + esc(row[1]) + '</div></div></div>'; }).join('');
    var anchor = '<div style="margin-top:14px;background:#F7F8FA;border:1px solid #DEE3EA;border-radius:12px;padding:14px 16px"><div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:#8a909c;margin-bottom:7px">SOURCE ANCHORS</div><p style="font-size:.875rem;line-height:1.55;color:#15171C;margin:0 0 8px"><strong>' + esc(r.authors) + ':</strong> ' + esc(r.coreIdea) + '</p><p style="font-size:.875rem;line-height:1.55;color:#15171C;margin:0"><strong>Response reading:</strong> ' + esc(response.coreIdea) + '</p></div>';
    var check = studioCheck('BFS218|studio|' + w, {
      q: 'Which option names the racialized MECHANISM, not only the outcome or someone\'s intent?',
      options: [firstSentence(r.coreIdea), 'Someone built the system to be racist on purpose.', 'The unequal results just happened by chance.'],
      answer: 0,
      why: 'The mechanism sits in the design and data, not in intent or luck: ' + lcFirst(String(r.coreIdea).replace(/\s*\.?\s*$/, '')) + '. That is the New Jim Code, harm built into how the system is made.'
    });
    var save = '<div style="margin-top:14px"><button onclick="SOC.saveStudio()" style="background:var(--red);border:none;color:#fff;border-radius:9px;padding:9px 16px;font-size:.875rem;font-weight:600;cursor:pointer">Save my work to the Personal Cartography (.docx)</button></div>';
    return studioShell('Accountability Chain Lab', 'Trace techno-racism through mechanism and responsibility. A strong answer names structure, not only intent.', '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px">' + chain + '</div>' + anchor + (g ? '<div style="font-size:.75rem;color:#8a909c;margin-top:10px">Concept anchor: ' + esc(g.term) + '</div>' : '') + check + save);
  }
  function selfCheckStudio(sel) {
    var code = courseCode();
    if (code === 'SOC122') return socStudio(sel);
    if (code === 'PSY355') return psyStudio(sel);
    if (code === 'BFS218') return bfsStudio(sel);
    return '';
  }
  /* ---------- BFS218 bias audit: staged audit + avatar scan (gated to BFS218) ---------- */
  /* Published Gender Shades (Buolamwini and Gebru, 2018) intersectional error rates.
     darker-skinned women 34.7% and lighter-skinned men 0.8% are the corpus headline figures;
     lighter-skinned women ~7% and darker-skinned men ~12% are the published per-system intersectional results. */
  var GS = {
    perGroup: 25,
    groups: [
      { id: 'lm', label: 'Lighter-skinned men', short: 'Lighter men', skin: 'lighter', gender: 'men' },
      { id: 'lw', label: 'Lighter-skinned women', short: 'Lighter women', skin: 'lighter', gender: 'women' },
      { id: 'dm', label: 'Darker-skinned men', short: 'Darker men', skin: 'darker', gender: 'men' },
      { id: 'dw', label: 'Darker-skinned women', short: 'Darker women', skin: 'darker', gender: 'women' }
    ],
    systems: [
      { id: 'ibm', name: 'IBM', rate: { lm: 0.3, lw: 7.1, dm: 12.0, dw: 34.7 } },
      { id: 'microsoft', name: 'Microsoft', rate: { lm: 0.0, lw: 1.7, dm: 6.0, dw: 20.8 } },
      { id: 'faceplus', name: 'Face++', rate: { lm: 0.8, lw: 6.0, dm: 0.7, dw: 34.5 } }
    ]
  };
  function auditSys() { return GS.systems[state.auditSystem || 0]; }
  function rateOf(g) { return auditSys().rate[g.id]; }
  function gsFails(g) { return Math.round(rateOf(g) / 100 * GS.perGroup); }
  function gsAvg(fn) { var a = GS.groups.filter(fn), s = 0; a.forEach(function (g) { s += rateOf(g); }); return Math.round(s / a.length * 10) / 10; }
  function auditSliceData(slice) {
    if (slice === 'overall') return [['All faces, one number', gsAvg(function () { return true; }), '#15171C']];
    if (slice === 'gender') return [['Men', gsAvg(function (g) { return g.gender === 'men'; }), '#3a47a8'], ['Women', gsAvg(function (g) { return g.gender === 'women'; }), '#3a47a8']];
    if (slice === 'skin') return [['Lighter-skinned', gsAvg(function (g) { return g.skin === 'lighter'; }), '#B7791F'], ['Darker-skinned', gsAvg(function (g) { return g.skin === 'darker'; }), '#B7791F']];
    return GS.groups.map(function (g) { return [g.label, rateOf(g), g.id === 'dw' ? '#DA291C' : '#15171C']; });
  }
  function auditInsight(slice) {
    var sys = auditSys();
    if (slice === 'overall') return 'One number for ' + sys.name + ': about ' + Math.round(100 - gsAvg(function () { return true; })) + ' percent accurate overall. A marketing slide would stop here. Would you ship it?';
    if (slice === 'gender') return 'Split by gender, a gap opens: ' + sys.name + ' fails women more than men. Averaging still keeps it looking manageable.';
    if (slice === 'skin') return 'Split by skin type, a wider gap: ' + sys.name + ' fails darker-skinned faces more. Each single axis on its own still understates the harm.';
    return sys.name + ': darker-skinned women fail ' + sys.rate.dw.toFixed(1) + ' percent of the time, against ' + sys.rate.lm.toFixed(1) + ' percent for lighter-skinned men. A single-axis test would have passed it. That is intersectionality (Crenshaw) and the coded gaze (Buolamwini).';
  }
  function auditBars(slice) {
    var data = auditSliceData(slice);
    var bars = data.map(function (d) {
      var w = Math.max(2, Math.round(d[1] / 40 * 100));
      return '<div style="margin:0 0 11px"><div style="display:flex;justify-content:space-between;font-size:.8125rem;font-weight:600;color:#15171C;margin-bottom:4px"><span>' + esc(d[0]) + '</span><span class="mono">' + d[1].toFixed(1) + '%</span></div><div style="height:18px;background:#EEF1F5;border-radius:6px;overflow:hidden"><div style="height:100%;width:' + w + '%;background:' + d[2] + ';border-radius:6px;transition:width .4s ease"></div></div></div>';
    }).join('');
    return '<div role="img" aria-label="Misclassification rate, ' + esc(slice) + ' view. ' + esc(data.map(function (d) { return d[0] + ' ' + d[1].toFixed(1) + ' percent'; }).join('. ')) + '.">' + bars + '</div>';
  }
  function auditGrid(run) {
    var cols = GS.groups.map(function (g) {
      var fail = gsFails(g), dots = '';
      for (var i = 0; i < GS.perGroup; i++) { var isFail = run && i < fail; dots += '<span class="bfs-face' + (isFail ? ' fail' : '') + '"' + (isFail ? ' style="animation-delay:' + (i * 0.05).toFixed(2) + 's"' : '') + ' aria-hidden="true"></span>'; }
      return '<div style="flex:1;min-width:118px"><div style="font-size:.7rem;font-weight:700;color:#15171C;text-align:center;margin-bottom:8px;line-height:1.25;min-height:2.4em">' + esc(g.short) + '</div><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px;justify-items:center">' + dots + '</div>' + (run ? '<div class="mono" style="text-align:center;font-size:.7rem;color:' + (g.id === 'dw' ? '#DA291C' : '#8a909c') + ';margin-top:8px;font-weight:700">' + fail + ' of ' + GS.perGroup + ' failed</div>' : '') + '</div>';
    }).join('');
    return '<div style="display:flex;gap:14px;flex-wrap:wrap">' + cols + '</div>';
  }
  function auditSliceBtns(active) {
    var defs = [['overall', 'Overall'], ['gender', 'By gender'], ['skin', 'By skin type'], ['intersectional', 'Intersectional']];
    return '<div id="bfs-slicebtns" style="display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px">' + defs.map(function (d) {
      var on = active === d[0];
      return '<button onclick="SOC.auditSlice(\'' + d[0] + '\')" aria-pressed="' + on + '" style="border:1.5px solid ' + (on ? '#DA291C' : '#DEE3EA') + ';background:' + (on ? '#F6E3E1' : '#fff') + ';color:#15171C;border-radius:999px;padding:7px 13px;font-size:.8125rem;font-weight:600;cursor:pointer">' + esc(d[1]) + '</button>';
    }).join('') + '</div>';
  }
  function auditFallbackTable() {
    var sys = auditSys();
    var rows = GS.groups.map(function (g) { return '<tr><td style="padding:6px 8px;border-top:1px solid #EEF1F5">' + esc(g.label) + '</td><td style="text-align:right;padding:6px 8px;border-top:1px solid #EEF1F5">' + rateOf(g).toFixed(1) + '%</td><td style="text-align:right;padding:6px 8px;border-top:1px solid #EEF1F5">' + gsFails(g) + ' of ' + GS.perGroup + '</td></tr>'; }).join('');
    return '<table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:.8125rem"><caption class="mono" style="text-align:left;font-size:.6875rem;letter-spacing:.05em;color:#8a909c;margin-bottom:6px">' + esc(sys.name) + ' RESULTS (DATA TABLE)</caption><thead><tr><th scope="col" style="text-align:left;padding:6px 8px;border-bottom:1px solid #DEE3EA">Group</th><th scope="col" style="text-align:right;padding:6px 8px;border-bottom:1px solid #DEE3EA">Error rate</th><th scope="col" style="text-align:right;padding:6px 8px;border-bottom:1px solid #DEE3EA">Faces failed of 25</th></tr></thead><tbody>' + rows + '</tbody></table><p style="font-size:.72rem;line-height:1.5;color:#8a909c;margin:8px 0 0">Per-system intersectional error rates from Buolamwini and Gebru, Gender Shades (2018), the three commercial systems they audited (IBM, Microsoft, Face++). Gender, skin-type, and overall figures are averages across the balanced benchmark of 25 faces per group.</p>';
  }
  function sandboxScreen() {
    var run = !!state.auditRun, slice = state.auditSlice || 'overall', sys = auditSys();
    var auditedCount = Object.keys(state.auditedSystems || {}).length;
    var openBtn = '<button onclick="SOC.read(\'buolamwini2018\')" style="margin-top:2px;background:none;border:none;color:#1552D8;font-size:.8125rem;font-weight:600;padding:0;cursor:pointer">Open Gender Shades (Buolamwini and Gebru, 2018) &#8599;</button>';
    var predict = '<div style="background:#F7F8FA;border:1px solid #DEE3EA;border-radius:12px;padding:14px 16px;margin:16px 0 0"><div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:#8a909c;margin-bottom:6px">PREDICT FIRST</div><p style="font-size:.9rem;line-height:1.55;color:#15171C;margin:0">You are about to audit three real facial-analysis systems against a benchmark balanced by gender and skin type. Before you run it: which group do you expect them to fail the most, and why?</p></div>';
    var method = '<p style="font-size:.78rem;line-height:1.5;color:#6b7280;margin:14px 0 0">This re-enacts Buolamwini and Gebru\'s published audit of three commercial systems (IBM, Microsoft, and Face++). The systems, the balanced benchmark, and the results are theirs; you are walking through what they found, not running a live classifier. Each marker is one benchmark face the system was tested on; red means the system got it wrong. The markers are neutral and do not depict anyone.</p>';
    var grid = '<div style="background:#fff;border:1px solid #DEE3EA;border-radius:12px;padding:16px 18px;margin:14px 0 0"><div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:#8a909c;margin-bottom:12px">THE BALANCED BENCHMARK &middot; 25 FACES PER GROUP' + (run ? ' &middot; AUDITING ' + esc(sys.name.toUpperCase()) : '') + '</div><div id="bfs-grid">' + auditGrid(run) + '</div></div>';
    var runBtn = '<div style="margin:14px 0 0;display:flex;gap:12px;flex-wrap:wrap;align-items:center">' + (run
      ? '<button onclick="SOC.nextSystem()" style="background:var(--red);border:none;color:#fff;border-radius:10px;padding:10px 18px;font-size:.9rem;font-weight:600;cursor:pointer">Audit the next system &#8594;</button><span style="font-size:.8125rem;color:#6b7280">' + auditedCount + ' of 3 systems audited</span>'
      : '<button onclick="SOC.runAudit()" style="background:var(--red);border:none;color:#fff;border-radius:10px;padding:11px 20px;font-size:.95rem;font-weight:600;cursor:pointer">Run the audit on the first system</button>') + '</div>';
    var summary = run ? '<div style="background:' + (auditedCount >= 3 ? '#15171C' : '#F7F8FA') + ';color:' + (auditedCount >= 3 ? '#fff' : '#15171C') + ';border:1px solid ' + (auditedCount >= 3 ? '#15171C' : '#DEE3EA') + ';border-radius:12px;padding:14px 16px;margin:14px 0 0;font-size:.875rem;line-height:1.55">' + (auditedCount >= 3 ? 'You audited all three: IBM, Microsoft, and Face++. Every one failed darker-skinned women the most. The coded gaze is an industry pattern, not one bad product.' : esc(sys.name) + ' failed darker-skinned women the most. Audit the next system and watch whether the pattern repeats. (' + auditedCount + ' of 3 audited.)') + '</div>' : '';
    var results = run
      ? '<div style="background:#fff;border:1px solid #DEE3EA;border-top:4px solid #DA291C;border-radius:12px;padding:16px 18px;margin:14px 0 0"><div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:#8a909c;margin-bottom:10px">NOW, HOW DO YOU REPORT IT?</div>' + auditSliceBtns(slice) + '<div id="bfs-bars">' + auditBars(slice) + '</div><p id="bfs-insight" style="font-size:.875rem;line-height:1.55;color:#474C57;margin:14px 0 0">' + esc(auditInsight(slice)) + '</p></div>'
      : '<p style="font-size:.85rem;color:#6b7280;margin:14px 0 0">Run the audit, then slice the results to see what a single number hides.</p>';
    var check = studioCheck('BFS218|sandbox', {
      q: 'You ran a balanced benchmark and the system failed darker-skinned women far more than anyone else, with no racist rule written into it. Which concept names a harm like that, built into a system through its design and data rather than through intent?',
      options: ['The New Jim Code (Benjamin): discrimination built into systems that are sold as neutral, through their design and data', 'A prejudiced programmer who coded the bias on purpose', 'A random one-off software bug that can be patched and then forgotten'],
      answer: 0,
      why: 'This is the New Jim Code: the failure is produced by whose faces the system was built and tested to see, not by anyone writing a racist rule. Buolamwini and Gebru measured it, and the product still shipped, sold as neutral.'
    });
    var chain = '<div style="background:#F7F8FA;border:1px solid #DEE3EA;border-radius:12px;padding:15px 17px;margin:16px 0 0"><div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:#8a909c;margin-bottom:7px">CARRY THIS INTO YOUR ACCOUNTABILITY CHAIN</div><p style="font-size:.875rem;line-height:1.55;color:#15171C;margin:0">The system that fails darker-skinned women &#8594; the makers who built and tested it with a benchmark that hid the gap &#8594; the institutions that buy and deploy it, in policing and at borders (the OPC and Robertson readings) &#8594; the people it is then used against &#8594; accountability across that whole chain, not one programmer &#8594; a response grounded in the resistance and design-justice readings (Tanksley, Costanza-Chock).</p></div>';
    var save = '<div style="margin-top:16px"><button onclick="SOC.saveSandbox()" style="background:var(--red);border:none;color:#fff;border-radius:9px;padding:10px 18px;font-size:.875rem;font-weight:600;cursor:pointer">Save my audit to the Accountability file (.docx)</button></div>';
    return '<section style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;padding:18px 18px 22px;margin:0 0 22px;box-shadow:0 1px 2px rgba(21,23,28,.04)">'
      + '<div class="mono" style="font-size:.6875rem;letter-spacing:.06em;color:var(--red);font-weight:600;margin-bottom:6px">BIAS AUDIT</div>'
      + '<h1 style="font-size:1.75rem;font-weight:600;margin:0 0 8px">Audit the coded gaze</h1>'
      + '<p style="font-size:.9375rem;line-height:1.55;color:#474C57;margin:0 0 4px;max-width:78ch">You are the auditor. Run a balanced benchmark on a facial-analysis system, then find the bias its makers missed, the way Buolamwini and Gebru did.</p>'
      + openBtn + predict + method + grid + runBtn + summary + results + auditFallbackTable() + check + chain + save
      + '</section>';
  }
  function cardsScreen() {
    var weeks = weeksWithReadings();
    var sel = state.cardWeek;
    var list = (D.glossary || []).filter(function (g) { return sel == null || g.week === sel; });
    var opts = '<option value="">All weeks</option>' + weeks.map(function (w) { return '<option value="' + w + '"' + (sel === w ? ' selected' : '') + '>Week ' + w + ': ' + esc(weekTitle(w)) + '</option>'; }).join('');
    return '<div class="rise">'
      + '<div class="mono" style="font-size:.75rem;letter-spacing:.06em;color:#8a909c;margin-bottom:8px">SELF-CHECK</div>'
      + '<h1 style="font-size:1.75rem;font-weight:600;margin:0 0 8px">Recall the concepts</h1>'
      + '<p style="font-size:.9375rem;color:#474C57;margin:0 0 18px;max-width:70ch">Read the concept, define it in your own words, then flip the card to check yourself. Each card is one concept. Private study, never a test.</p>'
      + '<label for="soc-cardweek" style="font-size:.8125rem;font-weight:600;color:#474C57;display:block;margin-bottom:6px">Show concepts for</label>'
      + '<select id="soc-cardweek" onchange="SOC.cardWeek(this.value)" style="max-width:360px;padding:9px 12px;border:1px solid #DEE3EA;border-radius:9px;background:#fff;font-size:.9375rem;color:#15171C;margin-bottom:20px">' + opts + '</select>'
      + selfCheckStudio(sel)
      + '<div class="soc-cardgrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">' + list.map(card).join('') + '</div></div>';
  }

  /* ---------- immersive journey shell (cascaded, course-aware) ---------- */
  var JOURNEY_Q = {
    BFS218: {
      1: 'Can a technology sold as neutral still carry old racism forward?',
      2: 'Why does harm show up most clearly at the intersection of systems?',
      3: 'If no one set out to discriminate, how does a system still get built to produce unequal outcomes?',
      4: 'When a system\'s default setting quietly harms some people, who chose that default, and why does it look neutral?',
      5: 'What happens when a system is built to see some faces better than others?',
      6: 'When policing and borders run on algorithms, who is watched, and who gets to decide?',
      7: 'What are the parts of a discriminatory system, and how do they work together to produce harm?',
      8: 'Who owns the data, and who controls the story it tells?',
      9: 'When technology is sold as help, who really benefits, and who pays the hidden cost?',
      10: 'When an algorithm decides who gets help, who gets left behind?',
      11: 'If the tools carry the harm, who gets to redesign them?',
      12: 'Who is accountable when the system causes harm, and does the law keep up?'
    },
    PSY355: {
      1: 'What actually makes someone resilient: their grit, or the resources around them?',
      3: 'Does believing you can grow change your results, and when does it not?',
      4: 'Where does the confidence to keep going actually come from?',
      5: 'Is a hard stretch a verdict on who you are, or a stage you move through?',
      6: 'Why does the same support help one person and not another?',
      7: 'Can adversity itself become a source of growth, and how?',
      8: 'Is being hard on yourself what keeps you going, or what wears you down?',
      9: 'What lets you keep going without breaking, persistence or flexibility?',
      10: 'Can writing about your own experience actually build resilience?',
      11: 'What makes asking for help actually work?'
    }
  };
  function journeyQ(w) { var c = (D.course && D.course.code) || ''; return (JOURNEY_Q[c] && JOURNEY_Q[c][w]) || 'What is this week asking you to see?'; }
  function journeyWeeks() {
    var ws = weeksWithReadings(), c = (D.course && D.course.code) || '', set = {};
    ws.forEach(function (w) { set[w] = 1; });
    if (typeof WEEKPAGE !== 'undefined' && WEEKPAGE[c]) Object.keys(WEEKPAGE[c]).forEach(function (w) { set[+w] = 1; });
    return Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
  }
  function currentJourneyWeek() { var ws = journeyWeeks(); if (!ws.length) return null; if (state.journeyWeek && ws.indexOf(state.journeyWeek) >= 0) return state.journeyWeek; return ws[0]; }
  function heroArt() {
    return '<svg class="jhero-art" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
      + '<path d="M0,250 C160,210 300,300 460,250 C620,200 720,260 800,230 L800,320 L0,320 Z" fill="#DA291C" fill-opacity=".05"/>'
      + '<path d="M0,285 C180,250 320,320 500,280 C660,245 740,295 800,275 L800,320 L0,320 Z" fill="#1B2A4A" fill-opacity=".04"/>'
      + '<g stroke="#DA291C" stroke-opacity=".10" fill="none" stroke-width="1.4"><path d="M360,150 C480,110 600,180 760,130 C800,116 810,120 830,112"/><path d="M360,185 C480,150 600,215 760,165 C800,150 810,156 830,148"/></g>'
      + '<g fill="#DA291C" fill-opacity=".16"><circle cx="690" cy="70" r="2.6"/><circle cx="742" cy="118" r="1.8"/><circle cx="636" cy="52" r="1.6"/></g>'
      + '</svg>';
  }
  function journeyIntro() { return 'Follow one question through the whole course, week by week. Each week sets up what to read, why it matters, and one thing to do with it. Start at the top, or pick up where you left off.'; }
  function journeyHome() {
    var ws = journeyWeeks(), cur = currentJourneyWeek(), started = !!state.journeyWeek;
    var title = (D.course && (D.course.name || D.course.code)) || 'Your course';
    var ctaLabel = started ? ('Resume Week ' + cur) : ('Start Week ' + (ws[0] || 1));
    var hero = '<section class="jhero jfade" style="margin-bottom:26px">' + heroArt()
      + '<div style="position:relative;max-width:64ch">'
      + '<div class="mono" style="font-size:.75rem;letter-spacing:.08em;color:var(--red);font-weight:600;margin-bottom:12px">SENECA POLYTECHNIC &middot; FALL 2026</div>'
      + '<h1 style="font-size:2.5rem;line-height:1.1;font-weight:600;margin:0 0 14px;letter-spacing:-.01em">' + esc(title) + '</h1>'
      + '<p style="font-size:1.0625rem;line-height:1.6;color:var(--ink-dim);margin:0 0 24px;max-width:54ch">' + esc(journeyIntro()) + '</p>'
      + '<button class="jhero-cta" onclick="SOC.station(' + (cur || (ws[0] || 1)) + ')">' + ctaLabel + ic('chevron', 18, 2.4) + '</button>'
      + (started ? '' : '<div style="margin-top:14px;font-size:.8125rem;color:var(--ink-faint)">' + ws.length + ' weeks in this course</div>')
      + '</div></section>';
    var spineHead = '<div style="display:flex;align-items:baseline;gap:12px;margin:0 0 16px;flex-wrap:wrap"><h2 style="font-size:1.375rem;font-weight:600;margin:0;color:var(--ink)">Your journey</h2><span style="font-size:.875rem;color:var(--ink-faint)">' + ws.length + ' weeks, in course order</span></div>';
    return '<div class="rise">' + hero + spineHead + journeyStations(cur) + '</div>';
  }
  function journeyStations(cur) {
    var ws = journeyWeeks();
    return '<div style="display:flex;flex-direction:column;gap:12px">' + ws.map(function (w) {
      var recs = recordsForWeek(w), n = recs.length, isCur = (w === cur), note = n + (n === 1 ? ' reading' : ' readings');
      return '<button class="jstation' + (isCur ? ' cur' : '') + '" onclick="SOC.station(' + w + ')">'
        + '<div style="display:flex;align-items:flex-start;gap:16px">'
        + '<span class="jdot" style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;flex:none;border-radius:12px;background:' + (isCur ? 'var(--red)' : '#1B2A4A') + ';color:#fff;font-family:var(--mono);font-size:1.0625rem;font-weight:600">' + w + '</span>'
        + '<div style="flex:1;min-width:0">'
        + '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:3px">' + (isCur ? '<span class="mono" style="font-size:.625rem;font-weight:700;letter-spacing:.06em;color:var(--red);background:#F6E3E1;padding:2px 8px;border-radius:999px">YOU ARE HERE</span>' : '') + '<h3 style="font-size:1.0625rem;font-weight:600;margin:0;color:var(--ink)">' + esc(weekTitle(w)) + '</h3></div>'
        + '<p style="font-size:.9375rem;line-height:1.5;color:var(--ink-dim);margin:0 0 8px">' + esc(journeyQ(w)) + '</p>'
        + '<div style="display:flex;align-items:center;gap:7px;font-size:.75rem;color:var(--ink-faint)"><span style="display:inline-flex;color:#8a909c">' + ic('book', 13) + '</span>' + esc(note) + '<span style="margin:0 4px">&middot;</span><span style="color:var(--red);font-weight:600">Open &rarr;</span></div>'
        + '</div></div></button>';
    }).join('') + '</div>';
  }
  function stationFraming(w, recs) {
    if (recs.length > 1) return 'This week brings ' + recs.length + ' readings together. Read them as parts of one argument, not as separate facts.';
    if (recs.length === 1) return 'This week turns on one reading. Read it closely, then do something with it.';
    return '';
  }
  function stationReading(r, kicker) {
    var u = readUrl(r), accent = '#3a47a8';
    var look = r.assigned ? ('<div style="margin-top:10px;background:#F7F8FA;border-left:3px solid ' + accent + ';padding:8px 12px;border-radius:0 8px 8px 0;font-size:.8125rem;line-height:1.5;color:var(--ink-dim)"><span style="font-weight:600;color:var(--ink)">Read:</span> ' + esc(r.assigned) + '</div>') : '';
    return '<div style="border:1px solid var(--border);border-top:4px solid ' + accent + ';background:#fff;border-radius:13px;padding:17px 19px">'
      + '<div style="display:flex;align-items:center;gap:9px;margin-bottom:7px"><span class="mono" style="font-size:.625rem;font-weight:700;letter-spacing:.04em;color:' + accent + '">' + esc(kicker) + '</span></div>'
      + '<h3 style="font-size:1.1875rem;line-height:1.3;font-weight:600;margin:0 0 3px;color:var(--ink)">' + esc(r.title) + '</h3>'
      + '<div style="font-size:.8125rem;color:var(--ink-dim);margin-bottom:9px">' + esc(r.authors) + ' &middot; ' + esc(String(r.year)) + '</div>'
      + '<p style="font-size:.9375rem;line-height:1.55;color:var(--ink-dim);margin:0">' + esc(r.coreIdea) + '</p>'
      + look
      + '<div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">'
      + (u ? '<button onclick="SOC.read(\'' + r.id + '\')" style="display:inline-flex;align-items:center;gap:7px;background:var(--red);border:none;color:#fff;border-radius:9px;padding:9px 16px;font-size:.875rem;font-weight:600;cursor:pointer">Open the reading' + ic('external', 14, 2.2) + '</button>' : '')
      + '<button onclick="SOC.open(\'' + r.id + '\')" style="background:#fff;border:1px solid var(--border);color:var(--ink);border-radius:9px;padding:9px 16px;font-size:.875rem;font-weight:600;cursor:pointer">Details</button>'
      + '</div></div>';
  }
  function stationDo(w) {
    var tiles = [['See it for yourself', 'Work this week\'s readings in the Self-Check Studio.', 'clipboard', 'SOC.goWeek(\'cards\',' + w + ')']];
    if (D.course && D.course.frame) tiles.push(['Locate it on your map', 'Add this week to your Personal Cartography.', 'globe', 'SOC.go(\'map\')']);
    if (D.course && D.course.code === 'BFS218') tiles.push(['Audit a system', 'Watch a racialized harm appear in the sandbox, then name it.', 'search', 'SOC.go(\'sandbox\')']);
    if (D.course && D.course.code === 'PSY355') tiles.push(['Build your resilience', 'Bring this week into your Resilience Ecology.', 'layers', 'SOC.go(\'ecology\')']);
    tiles.push(['Hold two readings together', 'Compare any two readings, side by side.', 'columns', 'SOC.go(\'compare\')']);
    var th = tiles.map(function (t) {
      return '<button class="jtile" onclick="' + t[3] + '"><span style="display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:11px;background:#F6E3E1;color:var(--red)">' + ic(t[2], 19) + '</span><h4 style="font-size:1rem;font-weight:600;margin:4px 0 0;color:var(--ink)">' + t[0] + '</h4><p style="font-size:.84rem;line-height:1.5;color:var(--ink-dim);margin:0">' + t[1] + '</p></button>';
    }).join('');
    return '<div style="margin-top:8px"><div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:var(--ink-faint);margin:0 0 12px">NOW DO SOMETHING WITH IT</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">' + th + '</div></div>';
  }
  var WEEKPAGE = {
    BFS218: {
      5: {
        time: 'About 90 minutes (read 40, watch 20, do 25, reflect 5)',
        deck: 'BFS218_Week05',
        overview: 'This week is about who gets seen by technology, and who does not, and why that is not an accident. Some people are watched, scanned, and tracked far more than others. Some are barely recognized at all. Both can do harm, and for racialized communities the two often happen at the same time. You will learn to name this pattern, look at hard evidence for it in real facial-recognition systems, and find an example of it in your own life.',
        purpose: 'Coded exposure is the third part of Ruha Benjamin\'s idea of the New Jim Code: being visible to technology is handed out unevenly, on purpose, in the way systems are designed. The point of this week is to help you spot that unevenness and say plainly what harm it causes. It builds on intersectionality from Week 2 and sets up the work on accountability later in the course.',
        outcomes: ['Explain coded exposure: the uneven, designed way technology makes some people very visible and others invisible.', 'Explain why being over-watched and being unrecognized can both be harmful, and can happen to the same people at once.', 'Describe the coded gaze and point to the Gender Shades study as evidence for it.', 'Find a real example of coded exposure and add it to your Living Cartography.'],
        guiding: ['What are the different meanings of the word "exposure," and how does Benjamin use them all at once?', 'Is being visible a trap? When does being seen by a system protect you, and when does it put you at risk?', 'Where have you seen the coded gaze: a camera or app that reads some people well and others badly?', 'Who does a system you use make very visible, and who does it make invisible?'],
        checks: ['Facial-recognition systems are about equally accurate for everyone.', 'Being unseen by a system can be just as harmful as being watched.', 'The bias in these systems comes mainly from a few prejudiced programmers.', 'You could find an example of coded exposure in your own daily life.', 'If a system is very accurate overall, it is safe to use.'],
        concepts: [
          { h: 'Visibility is handed out by design', body: 'Technology does not see everyone equally, and that gap is built in, not an accident. Some groups are made highly visible to cameras and systems, while others are barely registered at all. Think of an automatic faucet that turns on for some hands but not others, or a camera that locks onto some faces and slides past the rest: the unevenness is a design choice, even when no single person chose it on purpose.', cite: 'Benjamin, 2019' },
          { h: 'Being seen can hurt, and so can being unseen', body: 'Being watched, scanned, and tracked is a harm. But not being recognized, by a system that cannot read your face or will not serve you, is also a harm. For racialized people these are not opposites you choose between; both can land at once, over-surveilled by police cameras yet missed by the systems meant to help.', cite: 'Benjamin, 2019' },
          { h: 'The coded gaze: whose face a system is built to see', body: 'This is Joy Buolamwini\'s name for the way a system is designed and tested around some faces and not others. The 2018 Gender Shades study measured it: facial-analysis tools were nearly perfect on lighter-skinned men but failed darker-skinned women far more often. The bias does not come from one cruel programmer, it comes from whose faces filled the data and the tests.', cite: 'Buolamwini & Gebru, 2018' },
          { h: 'Accurate is not the same as safe', body: 'Even a system that recognizes you correctly can still put you in danger by watching and exposing you. A face scanner that works perfectly at a protest or a border does not protect the people it identifies, it exposes them. So the real question is not only how often a system is wrong, but who it gets used against.', cite: 'Benjamin, 2019' }
        ],
        terms: [
          { term: 'Coded exposure', def: 'the uneven, designed way technology makes some people highly visible and others invisible.', cite: 'Benjamin, 2019' },
          { term: 'The coded gaze', def: 'whose face a system is built to recognize; the bias baked into who it sees well and who it does not.', cite: 'Buolamwini & Gebru, 2018' },
          { term: 'Intersectionality', def: 'the idea that race and gender (and other parts of who we are) overlap, so a harm aimed at darker-skinned women can be missed if you look at race alone or gender alone.', cite: 'Crenshaw, 1991' },
          { term: 'The New Jim Code', def: 'Benjamin\'s name for new technologies that carry old racism forward while looking neutral or even fair.', cite: 'Benjamin, 2019' }
        ],
        readings: [
          { apa: 'Benjamin, R. (2019). <em>Race after technology: Abolitionist tools for the New Jim Code</em>. Polity Press.', scope: 'Read: the chapter on coded exposure (pages assigned on Blackboard)', id: 'benjamin2019' },
          { apa: 'Buolamwini, J., &amp; Gebru, T. (2018). Gender shades: Intersectional accuracy disparities in commercial gender classification. <em>Proceedings of Machine Learning Research, 81</em>, 77-91.', scope: 'Open access', id: 'buolamwini2018' }
        ],
        activity: { screen: 'sandbox', title: 'Audit the Coded Gaze', what: 'You step into the role of a bias auditor and run a real benchmark, the same test Buolamwini and Gebru used, on three commercial facial-analysis systems (IBM, Microsoft, and Face++).', why: 'so you find the bias yourself instead of being told about it. You will see how it hides behind a high overall accuracy score, and how it shows up in every system, not just one bad product.' },
        youcan: ['Explain coded exposure in your own words', 'Say why being over-watched and being unrecognized can both be harms', 'Describe the coded gaze and point to the Gender Shades evidence'],
        reflectPrompt: 'In a sentence or two: where in your own life is being visible handed out by design, and who decides?'
      },
      2: {"time": "About 90 minutes (read 40, watch 20, do 25, reflect 5)", "deck": "BFS218_Week02", "overview": "This week gives you the theory underneath the vocabulary you met in Week 1. Critical race theory, or CRT, makes one hard claim: racism is ordinary and structural, built into laws, institutions, and everyday systems, and it can produce racially unequal outcomes even when a system looks neutral. Ruha Benjamin takes that lens to technology and calls the result the New Jim Code, old inequities carried forward by tools that look new, objective, and fair. By the end of the week you can explain CRT, connect it to the New Jim Code, and use both to read a real example from your own digital life. Your first Personal Cartography is due this week.", "purpose": "Week 2 closes the opening arc of the course by giving you the body of thought that techno-racism and the New Jim Code rest on. The point is to help you stop asking whether the person behind a system is racist and start asking what the system does, to whom, and who pays. You will use that shift on a real technology in your first Personal Cartography.", "outcomes": ["By the end of this week you can explain in plain language what critical race theory argues: that racism is ordinary and structural and can operate through systems that look neutral.", "By the end of this week you can connect critical race theory to Benjamin's New Jim Code, showing how the New Jim Code applies CRT to technology.", "By the end of this week you can distinguish an intentions-based account of a racist system from an outcomes-based account.", "By the end of this week you can use an outcomes-focused, intersectional lens to analyse a real technology from your own Personal Cartography."], "guiding": ["Critical race theory says racism is ordinary and structural, not only personal. What changes when you stop asking whether the person behind a system is racist and start asking what the system does, and to whom?", "Benjamin calls technology that reproduces old inequities while looking objective the New Jim Code. Why is the appearance of neutrality the most dangerous part?", "CRT asks us to weigh outcomes, not just intentions. Where in your digital life would an outcomes lens reveal something an intentions lens would miss?", "How does intersectionality (Crenshaw) sharpen the question from who a system harms to who it harms most, and at which overlap?"], "checks": ["Racism is mainly a matter of individual attitudes and personal prejudice.", "A system can produce racially unequal outcomes even when no single person intends harm.", "A technology that looks objective and neutral can still carry old inequity forward.", "You could find an example of the New Jim Code in a system you used this week.", "The most useful question about a biased system is who designed it and what they were thinking."], "concepts": [{"h": "Critical race theory (CRT)", "body": "Critical race theory is a body of scholarship holding that racism is ordinary and structural: built into laws, institutions, and everyday systems, not only into individual prejudice. A central CRT claim is that systems can produce racially unequal outcomes while appearing neutral. Kimberle Crenshaw, whose intersectionality you met in Week 1, is one of CRT's founding scholars.", "cite": "Crenshaw (1991)"}, {"h": "Structural and systemic racism", "body": "Structural racism is racism that lives in how systems are designed and how they routinely operate, so that unequal outcomes recur even when no single person intends them. This is why the course studies design and data, not only attitudes. It also means you can find a racial harm without ever finding a single villain who chose it.", "cite": "Benjamin (2019)"}, {"h": "The New Jim Code as applied critical race theory", "body": "Ruha Benjamin defines the New Jim Code as new technologies that reflect and reproduce existing inequities while being promoted and experienced as more objective or progressive than the systems of an earlier era. Read it as CRT applied to code: the same structural racism, now carried by technology that looks like progress. The danger is that the inequity becomes harder to see precisely because the tool looks neutral.", "cite": "Benjamin (2019)"}, {"h": "Intentions versus outcomes", "body": "The key analytic shift this week is to stop asking whether a system intends harm and start asking what it does, to whom, and who pays. A system with no intent at all can still produce a racial harm, and CRT trains you to see it. An intentions lens looks for a guilty designer; an outcomes lens looks at who the system actually sorts, scores, or fails.", "cite": "Benjamin (2019)"}], "terms": [{"term": "Critical race theory (CRT)", "def": "a body of scholarship holding that racism is ordinary and structural, built into laws, institutions, and everyday systems, and able to produce unequal outcomes while appearing neutral.", "cite": "Crenshaw (1991)"}, {"term": "Structural and systemic racism", "def": "racism that lives in how systems are designed and routinely operate, so unequal outcomes recur even when no single person intends them.", "cite": "Benjamin (2019)"}, {"term": "The New Jim Code", "def": "Benjamin's name for new technologies that reflect and reproduce existing inequities while being experienced as more objective or progressive than earlier systems.", "cite": "Benjamin (2019)"}, {"term": "Intersectionality", "def": "Crenshaw's idea that harm is best understood at the intersection of systems, so an analysis that looks at one axis at a time misses the people hit hardest.", "cite": "Crenshaw (1991)"}], "readings": [{"apa": "Crenshaw, K. (1991). Mapping the margins: Intersectionality, identity politics, and violence against women of color. Stanford Law Review, 43(6), 1241-1299. https://doi.org/10.2307/1229039", "scope": "Open access", "id": "crenshaw1991"}, {"apa": "Benjamin, R. (2019). Introduction: The New Jim Code. In Race after technology: Abolitionist tools for the New Jim Code (pp. 1-32). Polity Press.", "scope": "Read this on Blackboard", "id": "benjamin2019"}], "activity": {"screen": "activity", "archetype": "match", "title": "Name the code", "what": "You match a real system, policy, or example to the critical race theory mechanism it reveals.", "why": "so you practise reading technology through outcomes, not intentions, which is the exact lens you need for your Personal Cartography this week.", "data": {"prompt": "Drag each real example to the CRT mechanism it best illustrates. There is one mechanism per example. After you match, read the short why and notice that none of these requires a single villain to do harm.", "pairs": [{"item": "A hiring algorithm trained on a company's past hires keeps surfacing candidates who look like the people already there, and the firm calls it an objective, data-driven screen.", "match": "The New Jim Code: old inequity reproduced by a tool experienced as more objective than earlier systems", "why": "The tool reflects and reproduces an existing inequity while being promoted as neutral and progressive, which is exactly Benjamin's definition.", "cite": "Benjamin (2019)"}, {"item": "A tenant-screening or risk-scoring system produces racially unequal results even though no one who built it set out to discriminate.", "match": "Structural and systemic racism: unequal outcomes recur even when no single person intends them", "why": "The harm lives in how the system is designed and routinely operates, not in one person's intent, so you find the harm without finding a villain.", "cite": "Benjamin (2019)"}, {"item": "A standardized application form treats one group as the default user, so anyone who does not fit that template has to do extra work to be read correctly.", "match": "Critical race theory: racism is ordinary and built into everyday systems that look normal", "why": "CRT holds that racism is ordinary and structural, sitting in routine machinery that presents itself as neutral rather than in open hostility.", "cite": "Crenshaw (1991)"}, {"item": "A facial-analysis tool works well for lighter-skinned men but fails far more often for darker-skinned women, a gap that only appears when you look at race and gender together.", "match": "Intersectionality: harm appears at the overlap of systems and is missed by single-axis analysis", "why": "Looking at race alone or gender alone hides the harm; Crenshaw's move is to look at the intersection where the people hit hardest become visible.", "cite": "Crenshaw (1991)"}, {"item": "A welfare-fraud detection system is praised as efficient and modern, yet it flags and burdens racialized claimants at higher rates while its defenders point only to the good intentions of its designers.", "match": "Intentions versus outcomes: ask what the system does and who pays, not whether it meant harm", "why": "An intentions lens stops at the designers' good faith; an outcomes lens asks what the system actually does, to whom, and who carries the cost.", "cite": "Benjamin (2019)"}, {"item": "A search engine returns demeaning or stereotyped results for queries about a racial group while the company describes the ranking as just a neutral reflection of what people click.", "match": "The New Jim Code: inequity carried by a tool framed as objective and neutral", "why": "The system reproduces existing inequity while being experienced as a neutral, objective ranking, which is how the New Jim Code hides in plain sight.", "cite": "Benjamin (2019)"}]}}, "youcan": ["You can now explain in plain language what critical race theory argues and why racism can be structural, not only personal.", "You can now connect critical race theory to the New Jim Code and say how the New Jim Code applies CRT to technology.", "You can now read a real technology through outcomes rather than intentions, using an intersectional lens."], "reflectPrompt": "Choose one digital moment from your own life, study program, or future field. Looking at the outcome rather than the intention, whose world does that system assume, and who pays when it gets that person wrong?"},
      3: {"time": "About 90 minutes (read 40, watch 20, do 25, reflect 5)", "deck": "BFS218_Week03", "overview": "This week opens Part II of the course, where we take the New Jim Code apart one dimension at a time. We begin with the first dimension, engineered inequity: technology that, by its design, amplifies social hierarchies of race, class, and gender while presenting itself as neutral or efficient. The key idea is amplify, not create: the inequality is already in society, and the design widens it, speeds it up, and makes it harder to escape. By the end of the week you should be able to define engineered inequity, answer Benjamin's question are robots racist, and name a real example from your own digital life.", "purpose": "The purpose of this week is to give you a precise definition of engineered inequity and the habit of looking for design choices rather than bad intentions. It builds directly on the New Jim Code from Part I and sets up the three dimensions that follow: default discrimination, coded exposure, and technological benevolence.", "outcomes": ["By the end of this week you can define engineered inequity as technology that, by design, amplifies existing hierarchies of race, class, and gender.", "By the end of this week you can distinguish amplifying an existing inequity from the looser idea that a technology creates bias from nothing.", "By the end of this week you can explain Benjamin's answer to the question are robots racist, and why design, not intent, is the issue.", "By the end of this week you can identify a real example of engineered inequity and add it to your Living Cartography."], "guiding": ["What is the difference between a technology that creates a bias and one that amplifies an inequality that already exists, and why does Benjamin insist on the second?", "Are robots racist? After this week, how would you answer, and what would you point to as evidence?", "Where in your own digital life does a system seem to widen a gap that was already there, while presenting itself as neutral or efficient?", "Engineered inequity is framed across race, class, and gender at once. Where might those amplifications stack on the same person?"], "checks": ["Engineered inequity invents a brand new bias that did not exist in society before.", "A design can widen a gap that already exists while presenting itself as neutral or efficient.", "A machine can do racial harm even when no programmer behind it feels any hatred.", "You could point to a system in your own digital life that widens a gap that was already there.", "The fix for engineered inequity is mainly better intentions from the people who build it."], "concepts": [{"h": "Engineered inequity", "body": "Engineered inequity is Benjamin's first dimension of the New Jim Code: technology that, by its design, explicitly amplifies social hierarchies based on race, class, and gender. The harm is built into the design, and the system presents itself as neutral or efficient while widening a gap that already exists. The point is that the harm comes from how the system is designed, not from a feeling, a slur, or a single mistake.", "cite": "Benjamin (2019)"}, {"h": "Amplify, not create", "body": "The careful move this week is the word amplify. Engineered inequity does not conjure inequality out of nothing; it takes an existing inequity and makes it wider, faster, or harder to escape. Because the problem lives in the design and not in anyone's intentions, the fix is never just better intentions, it is a different design choice.", "cite": "Benjamin (2019)"}, {"h": "Are robots racist?", "body": "This is Benjamin's framing question for the dimension, and her answer is that robots can be racist. Not because a machine feels hatred, but because it is designed inside a society already structured by racism and carries that structure forward. The question deliberately moves us from intent to design: a system can do racial harm with no racist programmer behind it.", "cite": "Benjamin (2019)"}], "terms": [{"term": "Engineered inequity", "def": "technology that, by its design, amplifies existing social hierarchies of race, class, and gender, while presenting itself as neutral or efficient.", "cite": "Benjamin (2019)"}, {"term": "Amplify, not create", "def": "the idea that engineered inequity widens an inequality that already exists rather than inventing one from nothing, which is why the fix is different design rather than better intentions.", "cite": "Benjamin (2019)"}, {"term": "Are robots racist?", "def": "Benjamin's framing question for engineered inequity; her answer is that a machine can do racial harm by design, with no hatred and no racist programmer, when it is built inside a society already structured by racism.", "cite": "Benjamin (2019)"}, {"term": "The New Jim Code", "def": "Benjamin's name for new technologies that carry old racism forward while appearing neutral or even fair; engineered inequity is the first of its four dimensions.", "cite": "Benjamin (2019)"}], "readings": [{"apa": "Benjamin, R. (2019). Race after technology: Abolitionist tools for the New Jim Code. Polity Press. Read the first dimension, engineered inequity (the chapter framed as Are Robots Racist?).", "scope": "Read this on Blackboard", "id": "benjamin2019"}], "activity": {"screen": "activity", "archetype": "scenario", "title": "Trace the design choice", "what": "You walk a design team's decisions for a real-world system, step by step, and choose what they do at each fork.", "why": "It makes engineered inequity concrete: you watch a neutral-looking design amplify an existing gap one choice at a time, this week's exact dimension.", "data": {"setup": "A city hires a team to build an automated screening tool that ranks tenant applications for subsidized housing. The neighbourhood already has a long history of who gets approved and who does not, and the team is told to make the process faster and more objective.", "steps": [{"situation": "The team needs data to train the tool. The fastest option is to learn from years of past approval decisions made by human officers in this same city.", "choices": [{"label": "Train on the past approval records as they are, because they are the data on hand", "outcome": "The tool learns the existing pattern of who was approved before, including its bias, and forwards that hierarchy at speed and scale while looking objective.", "harm": true, "cite": "Benjamin (2019)"}, {"label": "Treat the past records as evidence of an existing gap and design to correct for it, not just reproduce it", "outcome": "The team names the existing inequity first and changes the design so the tool does not simply amplify the old pattern.", "harm": false, "cite": "Benjamin (2019)"}]}, {"situation": "The team cannot use race directly, so they must choose other inputs. One easy, predictive input is the applicant's postal code and rental history.", "choices": [{"label": "Use postal code and rental history because they boost accuracy", "outcome": "These inputs stand in for race and class, so the tool widens the same hierarchy without ever naming race, presenting the result as neutral and efficient.", "harm": true, "cite": "Benjamin (2019)"}, {"label": "Drop inputs that act as proxies for an existing hierarchy and document why", "outcome": "The team refuses a design choice that would amplify race and class through the back door, accepting a small accuracy cost.", "harm": false, "cite": "Benjamin (2019)"}, {"label": "Keep the inputs but add a label that calls the tool objective", "outcome": "The alibi of neutrality hides the amplification rather than removing it, so the harm continues while looking fair.", "harm": true, "cite": "Benjamin (2019)"}]}, {"situation": "The finished tool works. It is faster than the old process and its overall approval numbers look reasonable, so leadership wants to deploy it now.", "choices": [{"label": "Deploy it because it is efficient and the overall numbers look fine", "outcome": "Efficiency and a clean overall number become the cover; the amplified gap lands on the same families as before, now faster and harder to appeal.", "harm": true, "cite": "Benjamin (2019)"}, {"label": "Ask who carries the cost when it is wrong before deploying", "outcome": "The team checks who is hurt by the errors and finds the design still amplifies the existing gap, so they redesign rather than ship.", "harm": false, "cite": "Benjamin (2019)"}]}]}}, "youcan": ["You can now define engineered inequity as a design that amplifies an existing hierarchy of race, class, and gender.", "You can now explain why amplify, not create, makes the fix a matter of design rather than intentions.", "You can now name a real example of engineered inequity from your own digital life for your Living Cartography."], "reflectPrompt": "Think of one system you used today that seems to widen a gap that was already there. In a sentence or two, name the existing gap, the design choice that amplifies it, and who carries the cost."},
      4: {"time": "About 90 minutes (read 40, watch 20, do 25, reflect 5)", "deck": "BFS218_Week04", "overview": "This week is about a quieter kind of harm: the harm that arrives through a system's defaults. Default discrimination is Benjamin's second dimension of the New Jim Code, the way technology can carry inequity forward through the settings, data, and assumptions that treat one group's world as normal. No one has to type a slur into the code, because the inequity is already sitting in the defaults and no one designed against it. Your job is to learn the sharp question that holds the week, is the glitch systemic, and to find a real default that quietly disadvantages a group in your own world.", "purpose": "Default discrimination is Benjamin's second dimension of the New Jim Code, and the point of this week is to help you name it and test it. You will learn to apply her glitch-versus-systemic question to a real failure, to explain why she calls database design an exercise in worldbuilding, and to spot a default that treats one group's world as the norm. It builds on engineered inequity from last week and sets up coded exposure next week.", "outcomes": ["By the end of this week you can define default discrimination as harm that arrives through the defaults, data, and assumptions of a system, not only through active design.", "By the end of this week you can apply Benjamin's glitch-versus-systemic test to a real technological failure.", "By the end of this week you can explain why database design is, in Benjamin's words, an exercise in worldbuilding.", "By the end of this week you can identify a real default that quietly disadvantages a group and add it to your Living Cartography."], "guiding": ["What is the difference between a harm someone designs on purpose and a harm that arrives through a default, and why does Benjamin insist the second is just as real?", "Is the glitch systemic? When a system fails a group and the failure is called a glitch, how would you decide whether it is an accident or a design working as built?", "Whose world is treated as the default in a system you use, and who has to adapt themselves to fit it?", "If the fix is not patching the glitch but changing the default, what default would you change first?"], "checks": ["A harm only counts as discrimination when a designer deliberately writes racism into the code.", "A system can disadvantage a group through its defaults, with no one ever designing against it.", "When a failure keeps landing on the same group, calling it a glitch can hide that the system is working as built.", "You could name a default in your own life, program, or future field that quietly assumes someone who is not you.", "If the harm comes from a default, applying the patch faster is the real fix."], "concepts": [{"h": "Default discrimination", "body": "Default discrimination is Benjamin's second dimension of the New Jim Code: harm that arrives through the defaults of a system, the settings, data, and assumptions that treat one group's world as the norm. It does not require a racist designer. It requires only that the existing inequity is left in the defaults and that no one designs against it. Engineered inequity is active, a design that amplifies a gap on purpose, but default discrimination is quieter, the harm that arrives when no one is looking.", "cite": "Benjamin (2019)"}, {"h": "Is the glitch systemic?", "body": "This is Benjamin's framing question for the dimension. A glitch is supposed to be minor and temporary, a brief irregularity that someone will patch. Benjamin asks whether the glitch is actually systemic, that is, whether the failure is not an accident but the predictable result of how the system was built. When the answer is yes, the word glitch is doing work: it makes a designed harm sound like bad luck and closes the case before anyone asks who carries the cost.", "cite": "Benjamin (2019)"}, {"h": "Design as worldbuilding", "body": "Benjamin describes database design as an exercise in worldbuilding: programmers project their assumptions, interests, and view of the world into the system, and that world too often reproduces the technology of race. When Google Maps reads Malcolm X Boulevard aloud as Malcolm Ten, it reads the X as a Roman numeral because that is the default, a small sign of whose knowledge is set as normal and whose is treated as the exception.", "cite": "Benjamin (2019)"}], "terms": [{"term": "Default discrimination", "def": "harm that arrives through the defaults of a system, the settings, data, and assumptions that treat one group's world as the norm, without needing a racist designer.", "cite": "Benjamin (2019)"}, {"term": "Is the glitch systemic?", "def": "Benjamin's framing question, which asks whether a failure called a glitch is really an accident or the predictable result of how the system was built.", "cite": "Benjamin (2019)"}, {"term": "Design as worldbuilding", "def": "Benjamin's phrase for how database design projects a worldview into a system, encoding assumptions about who is normal as defaults that reproduce the technology of race.", "cite": "Benjamin (2019)"}, {"term": "Automating anti-Blackness", "def": "the way everyday tools such as credit scores, hiring algorithms, and risk assessments sift and sort people at scale, carrying old inequities forward in their defaults without ever using an explicit slur.", "cite": "Benjamin (2019)"}], "readings": [{"apa": "Benjamin, R. (2019). Race after technology: Abolitionist tools for the New Jim Code. Polity Press. Read the second dimension, default discrimination (the chapter Is the Glitch Systemic?, including the section Automating Anti-Blackness).", "scope": "Read this on Blackboard", "id": "benjamin2019"}], "activity": {"screen": "activity", "archetype": "toggle", "title": "Defaults are not neutral", "what": "You flip a system's default settings one at a time and watch who is helped and who is harmed when each default is treated as neutral.", "why": "It shows you in real time that a default is never just neutral, so a failure called a glitch is often the system working exactly as it was built.", "data": {"system": "A set of everyday systems whose defaults sift and sort people: a map voice, a credit-score screen, neighbourhood surveillance, and an autofill name field.", "toggles": [{"label": "Map voice reads the letter X as a Roman numeral by default", "on": "Malcolm X Boulevard is read aloud as Malcolm Ten, so the Black liberation leader's name disappears from the system.", "off": "The map treats X in a street name as a name, so Malcolm X Boulevard is read correctly.", "whoHarmed": "Communities whose history and naming the default treats as the exception, who must adapt to be heard correctly.", "cite": "Benjamin (2019)"}, {"label": "Hiring screen uses a credit score as a default proxy for a good candidate", "on": "Applicants with thin or damaged credit are filtered out before a human ever sees them, and the bias hides inside a number that looks objective.", "off": "Candidates are judged on the job's actual requirements, so a credit history shaped by inequality does not stand in for race or class.", "whoHarmed": "Racialized and lower-income applicants, whose credit reflects old inequities rather than their ability to do the job.", "cite": "Benjamin (2019)"}, {"label": "Surveillance system watches blocks flagged by historical crime data by default", "on": "The same neighbourhoods are watched again and again because the past data is treated as a neutral map of risk.", "off": "Watching is not steered by historical data alone, so a biased past does not decide who is surveilled in the present.", "whoHarmed": "Residents of over-policed neighbourhoods, who carry the cost of a default that recycles an unequal past.", "cite": "Benjamin (2019)"}, {"label": "Name field treats a narrow set of names as the default normal", "on": "Names outside the assumed norm are rejected, truncated, or misread, so people are misrecorded by the system.", "off": "The field accepts the full range of real names, so no one has to alter their name to fit the database.", "whoHarmed": "People whose names fall outside the worldview encoded into the default, who must adapt or be misread.", "cite": "Benjamin (2019)"}]}}, "youcan": ["You can now define default discrimination as harm that arrives through a system's defaults, not only through active design.", "You can now apply Benjamin's glitch-versus-systemic test to a real technological failure.", "You can now explain why Benjamin calls database design an exercise in worldbuilding."], "reflectPrompt": "In a sentence or two: where in your own life, your Seneca program, placement, workplace, or future field, does a default just seem to assume someone who is not you, and who has to adapt to fit it?"},
      6: {"time": "About 90 minutes (read 40, watch 20, do 25, reflect 5)", "deck": "BFS218_Week06", "overview": "This week we bring the New Jim Code home to Canada. You have already named the dimensions of algorithmic harm in the abstract; now you watch them operate in real Canadian systems across three domains: borders, policing, and the wider field of housing and services. You will study documented Canadian cases, including the RCMP's use of Clearview AI and the Supreme Court ruling in Ewert v Canada, and connect each one to the harm it produces for racialized and Indigenous communities. The point is to see that techno-racism is not somewhere else; it is here, and it has already been named in a federal report and a Supreme Court ruling.", "purpose": "Week 6 grounds the New Jim Code in Canada. Having named the dimensions, you now examine documented Canadian cases in borders, policing, and corrections, and connect each to the harm it produces for racialized and Indigenous communities. The aim is to spot which dimension is at work in a real Canadian system, name who is harmed, and ask whether any law or oversight body is holding it accountable.", "outcomes": ["By the end of this week you can describe at least one documented Canadian case of algorithmic harm in borders, policing, or corrections.", "By the end of this week you can explain the OPC finding on the RCMP's use of Clearview AI, and the holding in Ewert v Canada (2018).", "By the end of this week you can connect a Canadian case to one dimension of the New Jim Code: engineered inequity, default discrimination, or coded exposure.", "By the end of this week you can identify a Canadian example from your own life and add it to your Living Cartography, naming the dimension, the harm, and the oversight gap."], "guiding": ["Which dimension, engineered inequity, default discrimination, or coded exposure, do you see in the RCMP's use of Clearview AI?", "In Ewert v Canada, why did it matter that the risk tools were not validated for Indigenous offenders, and which dimension is that?", "Molnar calls border technology a testing ground. Who is it tested on, and why there first?", "Singh notes much algorithmic policing is authorized by courts, not legislation. Why does that gap matter?"], "checks": ["Techno-racism is mostly something that happens elsewhere, not in Canadian systems.", "A police service can be found to have broken federal privacy law by using a facial-recognition tool.", "Border technology is often tried out first on the people with the least power to refuse it.", "You could name a place in your own Canadian life where these systems already operate.", "Powerful policing tools in Canada are always governed by clear, debated legislation."], "concepts": [{"h": "Algorithmic policing", "body": "Algorithmic policing is the use of data-driven tools by law enforcement: predictive policing, facial recognition, and social-media surveillance. Robertson, Khoo, and Song document its spread across Canada, often with little public knowledge. Much of it has been authorized through court rulings rather than clear legislation, which leaves a gap in oversight: powerful tools running without debated rules to govern them.", "cite": "Robertson, Khoo, and Song (2020)"}, {"h": "Digital border technologies", "body": "Digital border technologies are the surveillance, biometrics, and automated decision systems used at borders, and Petra Molnar shows they operate through logics of exclusion. Migrants and refugees have the least power to refuse, so they are often the testing ground for tools that are later used more widely. The border is where harmful systems get tried out first, on the people least able to say no.", "cite": "Molnar (2023)"}, {"h": "Coded exposure at the border of policing", "body": "Clearview AI scraped billions of images from the web to build a face-search tool, and the RCMP used it. The Office of the Privacy Commissioner of Canada found that this use violated federal privacy law. People who never agreed to be in a police database were made searchable in one anyway, which is coded exposure: being made visible to a system that was never meant to see you.", "cite": "Office of the Privacy Commissioner of Canada (2021)"}, {"h": "Default discrimination, named by the Supreme Court", "body": "In Ewert v Canada the Supreme Court found that Correctional Service Canada breached its statutory duty by relying on actuarial risk-assessment tools that had never been shown to be valid for Indigenous people. No one had to intend harm: the tool was simply not tested on Indigenous people and used anyway. That is default discrimination, and here the highest court in the country named it.", "cite": "Ewert v Canada (2018)"}], "terms": [{"term": "Algorithmic policing", "def": "the use of data-driven tools by law enforcement, including predictive policing, facial recognition, and social-media surveillance, much of it authorized through court rulings rather than clear legislation.", "cite": "Robertson, Khoo, and Song (2020)"}, {"term": "Digital border technologies", "def": "the surveillance, biometrics, and automated decision systems used at borders, which work through logics of exclusion and test new tools on migrants and refugees first.", "cite": "Molnar (2023)"}, {"term": "Logics of exclusion", "def": "Molnar's term for how border technologies are built and used to keep certain people out, treating those with the least power to refuse as a testing ground.", "cite": "Molnar (2023)"}, {"term": "Oversight gap", "def": "the space that opens when a technology is deployed and authorized by court rulings rather than debated legislation, so powerful tools run without clear rules governing them.", "cite": "Singh (2021)"}], "readings": [{"apa": "Robertson, K., Khoo, C., & Song, Y. (2020). To surveil and predict: A human rights analysis of algorithmic policing in Canada. Citizen Lab and International Human Rights Program, University of Toronto.", "scope": "Open access", "id": "robertson2020"}, {"apa": "Molnar, P. (2023). Digital border technologies, techno-racism and logics of exclusion. International Migration. https://doi.org/10.1111/imig.13187", "scope": "Open access", "id": "molnar2023"}, {"apa": "Office of the Privacy Commissioner of Canada. (2021). Police use of facial recognition technology in Canada and the way forward. Special report to Parliament.", "scope": "Open access", "id": "opc2021"}, {"apa": "Ewert v Canada, 2018 SCC 30.", "scope": "Open access", "id": "ewert2018"}, {"apa": "Singh, S. (2021). Algorithmic policing technologies in Canada. Manitoba Law Journal, 44(6).", "scope": "Open access", "id": "singh2021"}], "activity": {"screen": "activity", "archetype": "scenario", "title": "Map the Canadian case", "what": "You walk a documented Canadian deployment of facial recognition step by step, deciding what an institution does at each turn and watching where the harm lands and where the accountability gap opens.", "why": "so you practise naming the dimension, the harm, and the oversight gap on a real Canadian case before you add one to your own Living Cartography.", "data": {"setup": "Clearview AI scraped billions of images from the web to build a face-search tool, and the RCMP used it for facial recognition without telling the public or seeking clear legal authority. You step into the choices Canadian institutions faced as this deployment unfolded, from acquisition to oversight.", "steps": [{"situation": "A facial-recognition vendor offers a police service a tool whose database was built by scraping billions of public images without consent. The service is deciding whether and how to use it.", "choices": [{"label": "Use the tool quietly, since the images were already public online", "outcome": "People who never agreed to be in a police database are now searchable in one. They are made visible to a system that was never meant to see them, which is coded exposure, and the OPC later finds this use unlawful.", "harm": true, "cite": "Office of the Privacy Commissioner of Canada (2021)"}, {"label": "Pause and ask whether scraped images can lawfully be used before deploying", "outcome": "The service confronts the consent problem up front. Treating the scraped database as a privacy question, not a convenience, is exactly the gap the OPC report says should have been closed first.", "harm": false, "cite": "Office of the Privacy Commissioner of Canada (2021)"}]}, {"situation": "The tool is being rolled out across the country. The institution must decide what legal basis and public disclosure to attach to algorithmic policing of this kind.", "choices": [{"label": "Rely on existing court rulings and roll it out without new legislation or public debate", "outcome": "The tool runs with thin oversight. Singh shows this is the common pattern: authorization through court rulings rather than clear legislation leaves an oversight gap where harm collects.", "harm": true, "cite": "Singh (2021)"}, {"label": "Document the tool and its human-rights risks in a public human-rights analysis", "outcome": "The deployment is made visible to scrutiny. Robertson, Khoo, and Song show that naming the specific tool and the rights at stake is what turns a hidden system into one that can be challenged.", "harm": false, "cite": "Robertson, Khoo, and Song (2020)"}, {"label": "Expand the same tool to the border, where refusal is hardest", "outcome": "The technology moves to the place with the least power to refuse. Molnar shows the border becomes a testing ground, and migrants and refugees absorb the harm first.", "harm": true, "cite": "Molnar (2023)"}]}, {"situation": "Harm has now been documented and the case reaches an oversight body. The question is whether accountability arrives in time to protect the people affected.", "choices": [{"label": "Wait for a complaint and let the oversight body rule case by case after the fact", "outcome": "Accountability arrives late. As with the Ewert risk tools, the harm is named only after people have already lived through it, and the lag itself is where the damage was done.", "harm": true, "cite": "Ewert v Canada (2018)"}, {"label": "Treat the OPC's finding as a rule for future deployments, not just this one", "outcome": "The finding becomes a standard rather than a one-off. The OPC's report points beyond the single case toward a way forward that closes the gap before the next tool ships.", "harm": false, "cite": "Office of the Privacy Commissioner of Canada (2021)"}]}]}}, "youcan": ["You can now describe a documented Canadian case of algorithmic harm in borders, policing, or corrections", "You can now connect a Canadian case to one dimension of the New Jim Code and name who is harmed", "You can now ask of any Canadian system whether a law, court ruling, or oversight body is holding it accountable"], "reflectPrompt": "In a sentence or two: where in your own Canadian life, your city, your program, or your future field, do these systems already operate, and what changes the moment you can name the harm where you live?"},
      7: {"time": "About 90 minutes (read 40, watch 20, do 25, reflect 5)", "deck": "BFS218_Week07", "overview": "This week closes Part II by assembling the parts you already have. Over the last few weeks you named three dimensions of the New Jim Code one at a time: engineered inequity, default discrimination, and coded exposure. There is no new reading. Instead, you put those three layers together into one working picture of how a discriminatory system produces harm, and you show what you can do in the first of two Knowledge Check videos, an individual assessment built so that no one, and no AI, can do it for you.", "purpose": "Week 7 consolidates Part II. You assemble the three dimensions of the New Jim Code and the Canadian cases into one working picture, and you demonstrate that understanding in the first Knowledge Check video. The aim is to hold the whole anatomy in one view: the three dimensions, how they differ, and how they show up together in real Canadian systems.", "outcomes": ["By the end of this week you can define and distinguish the three dimensions of the New Jim Code studied so far.", "By the end of this week you can analyse a real system and name which dimension or dimensions it reveals.", "By the end of this week you can judge whether a harm is designed or incidental, and give your reasons.", "By the end of this week you can complete Knowledge Check 1 as a screen-share and audio video, using one system from your own Living Cartography."], "guiding": ["In one sentence each, how would you define engineered inequity, default discrimination, and coded exposure?", "Pick a real system. Does it show one dimension, or more than one at once? How can you tell?", "How would you decide whether a harm is designed into a system or merely incidental?", "Where do the dimensions stack on the same person, at the intersection of race, gender, class, or status?"], "checks": ["Engineered inequity is best summed up by the word amplify, not create.", "The three dimensions are separate machines that never appear in the same system at once.", "A single real system can amplify a gap, run on untested defaults, and watch people unevenly all at the same time.", "You could take one system from your own Living Cartography and name which dimension or dimensions it reveals.", "If a system is harmful, that harm must have been put there on purpose rather than built in incidentally."], "concepts": [{"h": "Engineered inequity: amplify, not create", "body": "Engineered inequity is the first dimension of the New Jim Code: a design that, by the way it is built, amplifies an existing hierarchy of race, class, or gender. The harm is active and built into the design, not a side effect. The key word is amplify, not create: the technology takes a gap that already existed in the world and makes it bigger and faster.", "cite": "Benjamin (2019)"}, {"h": "Default discrimination: ride the defaults", "body": "Default discrimination is the second dimension: harm that arrives through the defaults, the settings, data, and assumptions that treat one group's world as normal. No one has to set out to discriminate for it to happen. The key question is whether the glitch is systemic, because when the same error keeps landing on the same people, it is not a glitch, it is the design.", "cite": "Benjamin (2019)"}, {"h": "Coded exposure: visibility handed out unevenly", "body": "Coded exposure is the third dimension: the uneven, designed distribution of visibility, where some people are watched too closely and others are not seen at all. The key question is whether visibility is a trap. Buolamwini and Gebru measured one version of it, finding facial-analysis systems near-perfect on lighter-skinned men and far worse on darker-skinned women.", "cite": "Benjamin (2019)"}, {"h": "Not separate machines: one anatomy", "body": "These three dimensions are not separate machines; they are three ways the same systemic racism enters technology. A single real system can show more than one at once, and in Canada we saw them together in policing, corrections, and at the border. Assembling the anatomy means seeing how the whole system, not one part, produces the harm.", "cite": "Benjamin (2019)"}], "terms": [{"term": "Engineered inequity (dimension one)", "def": "technology that, by its design, amplifies an existing hierarchy of race, class, or gender; the harm is active and built in, and the key word is amplify, not create.", "cite": "Benjamin (2019)"}, {"term": "Default discrimination (dimension two)", "def": "harm that arrives through the defaults, the settings, data, and assumptions that treat one group's world as normal; the key question is whether the glitch is systemic.", "cite": "Benjamin (2019)"}, {"term": "Coded exposure (dimension three)", "def": "the uneven, designed distribution of visibility, where some people are watched too closely and others are not seen at all; the key question is whether visibility is a trap.", "cite": "Benjamin (2019)"}, {"term": "Algorithmic policing", "def": "the use of data-driven tools, predictive policing, facial recognition, and social-media surveillance by law enforcement, documented spreading across Canada.", "cite": "Robertson, Khoo, and Song (2020)"}], "readings": [{"apa": "Benjamin, R. (2019). Race after technology: Abolitionist tools for the New Jim Code. Polity Press. (Engineered inequity; default discrimination; coded exposure.)", "scope": "Read this on Blackboard", "id": "benjamin2019"}, {"apa": "Buolamwini, J., and Gebru, T. (2018). Gender shades: Intersectional accuracy disparities in commercial gender classification. Proceedings of Machine Learning Research, 81, 77-91.", "scope": "Open access", "id": "buolamwini2018"}, {"apa": "Robertson, K., Khoo, C., and Song, Y. (2020). To surveil and predict: A human rights analysis of algorithmic policing in Canada. Citizen Lab and International Human Rights Program, University of Toronto.", "scope": "Open access", "id": "robertson2020"}, {"apa": "Molnar, P. (2023). Digital border technologies, techno-racism and logics of exclusion. International Migration. https://doi.org/10.1111/imig.13187", "scope": "Open access", "id": "molnar2023"}], "activity": {"screen": "activity", "archetype": "assemble", "title": "Assemble the anatomy", "what": "You take one real discriminatory system and build it layer by layer, the data, the model, the deployment, and the feedback loop, then name which dimension of the New Jim Code each layer reveals.", "why": "so you see how the whole system, not one part, produces harm, and arrive ready to walk through your own example in Knowledge Check 1.", "data": {"goal": "Assemble the four layers of one real system into a single anatomy, then name the dimension each layer reveals, so the harm is shown to come from the whole structure rather than one bad part.", "components": [{"label": "The data layer", "role": "feeds the system a record of an unequal world, so the defaults treat one group's world as normal and others as the exception.", "cite": "Benjamin (2019)"}, {"label": "The model layer", "role": "scores or sorts people by that data, amplifying an existing hierarchy of race, class, or gender rather than creating a new one.", "cite": "Benjamin (2019)"}, {"label": "The deployment layer", "role": "puts the system to work in policing, predictive tools, facial recognition, and surveillance, where the harm lands on real people across Canada.", "cite": "Robertson, Khoo, and Song (2020)"}, {"label": "The border deployment", "role": "runs the system at the border through surveillance, biometrics, and automated decisions, on those with the least power to refuse, who become the testing ground.", "cite": "Molnar (2023)"}, {"label": "The visibility setting", "role": "hands out being seen unevenly, watching some people too closely and missing others, so accuracy and safety come apart.", "cite": "Buolamwini and Gebru (2018)"}, {"label": "The feedback loop", "role": "feeds each biased result back in as new data, so the whole anatomy keeps reproducing the same harm and the glitch proves systemic.", "cite": "Benjamin (2019)"}]}}, "youcan": ["You can now define and distinguish engineered inequity, default discrimination, and coded exposure in your own words", "You can now take one real system and name which dimension or dimensions it reveals", "You can now judge whether a harm is designed or incidental, and give your reasons"], "reflectPrompt": "You can now name the anatomy of the New Jim Code, but naming a harm is not the same as ending it. For one system in your own life, what is the difference between seeing the harm clearly and being able to change it?"},
      8: {"time": "About 90 minutes (read 40, watch 20, do 25, reflect 5)", "deck": "BFS218_Week08", "overview": "This week the course turns from naming the New Jim Code to answering it, and it begins on purpose not with a Western fix but with a different relation to data altogether. Indigenous data sovereignty is the principle that First Nations, Inuit, and Metis peoples have the right to govern the data about their own communities. You will learn the OCAP principles (Ownership, Control, Access, Possession), a registered trademark of the First Nations Information Governance Centre, alongside the CARE Principles from the Global Indigenous Data Alliance, and you will run a real data-governance case through them. The point is to ask not only whether a system is biased, but who should govern the data, and on whose terms.", "purpose": "Week 8 opens Part III by reframing the central question from bias to governance. You will learn Indigenous data sovereignty and the OCAP principles as a model of agency, meet the CARE Principles and decolonial approaches to AI, and practise asking who governs a community's data and what would change if the community held it. The aim is to treat a community holding its own data as a form of agency, not just a critique.", "outcomes": ["By the end of this week you can explain Indigenous data sovereignty as the right of First Nations, Inuit, and Metis communities to govern data about themselves.", "By the end of this week you can describe the four OCAP principles, attribute them to the First Nations Information Governance Centre, and say what each one protects.", "By the end of this week you can summarise what a decolonial approach to AI centres, after Mohamed, Png, and Isaac (2020), and name what algorithmic colonialism means.", "By the end of this week you can run a data-governance case through OCAP and CARE and connect it to your own Living Cartography, naming where a community could hold its own data."], "guiding": ["Most systems assume whoever collects data owns it. What changes if the community owns it instead?", "What do Ownership, Control, Access, and Possession each protect, and why are all four needed together?", "Thomas King says stories are never neutral. If data is a kind of story, who has been telling the story of which communities?", "Mohamed, Png, and Isaac warn against algorithmic colonialism. What would a decolonial approach to AI centre instead?"], "checks": ["Indigenous data sovereignty is the right of First Nations, Inuit, and Metis communities to govern data about themselves.", "Whoever collects data about a community should be the one who owns and controls it.", "Under OCAP, a community can fully exercise its rights even when an outside agency still physically holds its data.", "You could name a community you belong to or work with whose story has been told mostly by others through its data.", "Decolonial approaches to AI ask us to centre the communities most affected in how systems are built and governed."], "concepts": [{"h": "Indigenous data sovereignty", "body": "Indigenous data sovereignty is the principle that First Nations, Inuit, and Metis peoples have the right to govern the collection, ownership, and use of data about their own communities, lands, and knowledge. It reframes data from something extracted by outsiders to something a community holds and governs. Instead of asking only whether a system is biased, it asks who should govern the data at all, moving the community from the subject of the data to its steward.", "cite": "First Nations Information Governance Centre (2014)"}, {"h": "OCAP: Ownership, Control, Access, Possession", "body": "OCAP names four First Nations principles for data governance, stewarded by the First Nations Information Governance Centre, and is a registered trademark of that Centre. Ownership means a community collectively owns its information. Control means it controls how data about it is collected and used. Access means the community can reach data about itself. Possession means it physically holds and stewards that data. All four are needed together: ownership without possession is hollow, and access without control is thin.", "cite": "First Nations Information Governance Centre (2014)"}, {"h": "Decolonial AI and algorithmic colonialism", "body": "Mohamed, Png, and Isaac (2020) argue that decolonial and postcolonial theory should guide how artificial intelligence is built and governed. They warn against algorithmic colonialism, where tools built elsewhere are imposed on communities while the power and benefit flow back outward to those who built them. A decolonial approach instead centres those most affected in how systems are designed and governed.", "cite": "Mohamed, Png, and Isaac (2020)"}, {"h": "Data is a kind of story", "body": "Thomas King reminds us, in The Truth About Stories, that stories are never neutral and that whose story gets told shapes what is taken as real. Data is a kind of story a system tells about people, so the governing question becomes who gets to hold the pen. If every dataset is a story told about people, then the fight over data is a fight over who gets to narrate someone else's life.", "cite": "King (2003)"}], "terms": [{"term": "Indigenous data sovereignty", "def": "the right of First Nations, Inuit, and Metis peoples to govern the collection, ownership, and use of data about their own communities, lands, and knowledge.", "cite": "First Nations Information Governance Centre (2014)"}, {"term": "OCAP (Ownership, Control, Access, Possession)", "def": "four First Nations principles for data governance, a registered trademark stewarded by the First Nations Information Governance Centre: a community owns its information, controls how it is collected and used, can access it, and physically possesses it.", "cite": "First Nations Information Governance Centre (2014)"}, {"term": "Algorithmic colonialism", "def": "the pattern in which AI tools built elsewhere are imposed on communities, with power and benefit flowing back outward to those who built them rather than to those most affected.", "cite": "Mohamed, Png, and Isaac (2020)"}, {"term": "CARE Principles for Indigenous Data Governance", "def": "people-and-purpose principles (Collective benefit, Authority to control, Responsibility, and Ethics) from the Global Indigenous Data Alliance that sit alongside data-sharing rules to keep Indigenous rights and wellbeing at the centre.", "cite": "Global Indigenous Data Alliance (2019)"}], "readings": [{"apa": "Mohamed, S., Png, M.-T., & Isaac, W. (2020). Decolonial AI: Decolonial theory as sociotechnical foresight in artificial intelligence. Philosophy & Technology, 33, 659-684.", "scope": "Open access", "id": "mohamed2020"}, {"apa": "King, T. (2003). The truth about stories: A native narrative. House of Anansi Press.", "scope": "Read this on Blackboard", "id": "king2003"}, {"apa": "Smillie-Adjarkwa, C. (2005). Is the internet a useful resource for Indigenous women living in remote communities? National Network for Aboriginal Mental Health Research.", "scope": "Open access", "id": "smillie2005"}, {"apa": "First Nations Information Governance Centre. (2014). Ownership, control, access and possession (OCAP): The path to First Nations information governance. First Nations Information Governance Centre.", "scope": "Open access", "id": "fnigc2014"}, {"apa": "Global Indigenous Data Alliance. (2019). CARE principles for Indigenous data governance. Global Indigenous Data Alliance.", "scope": "Open access", "id": "gida2019"}], "activity": {"screen": "activity", "archetype": "lab", "title": "Apply OCAP and CARE", "what": "You run a real data-governance case through the OCAP and CARE principles and decide what would change if the community governed its own data.", "why": "It turns Indigenous data sovereignty from a definition into a tool you can use, and it asks the system, not the community, to justify who holds the pen.", "data": {"case": "A provincial health agency holds a dataset about a First Nation's community health, collected by outside researchers and stored on the agency's own servers. The community can request reports but cannot change what is collected, cannot reach the raw records, and does not hold a copy. You decide which governance principles to apply.", "levers": [{"label": "Ownership (OCAP)", "effect": "Recognises the community, not the agency, as the collective owner of its information, so it is the community's claim to the data that is honoured first.", "tradeoff": "Ownership on paper can be hollow if the agency still controls and physically holds the data, so this principle alone does not move real power.", "cite": "First Nations Information Governance Centre (2014)"}, {"label": "Control (OCAP)", "effect": "Gives the community say over what is collected and how it is used, so research and reporting happen on the community's terms rather than the agency's.", "tradeoff": "Control without access or possession means the community can set rules but still cannot reach or hold the records, which slows decisions and depends on the agency's cooperation.", "cite": "First Nations Information Governance Centre (2014)"}, {"label": "Access (OCAP)", "effect": "Ensures the community can reach the data about itself, including the raw records, not just curated reports the agency chooses to share.", "tradeoff": "Access lets the community see the data but not decide its use, so it is thin on its own and must be paired with control to matter.", "cite": "First Nations Information Governance Centre (2014)"}, {"label": "Possession (OCAP)", "effect": "Moves physical stewardship of the data to the community, turning a right on paper into a right it can actually exercise, withhold, or undo.", "tradeoff": "Possession demands infrastructure and capacity the community may not yet have, and Smillie-Adjarkwa (2005) reminds us access to that infrastructure is not equal in remote communities.", "cite": "First Nations Information Governance Centre (2014)"}, {"label": "Collective benefit (CARE)", "effect": "Requires that the data and any AI built on it work for the community's wellbeing first, not mainly for the agency's research goals or outside funders.", "tradeoff": "Naming collective benefit does not by itself transfer control, so it can be stated as a value while the real decisions stay with the agency unless paired with OCAP.", "cite": "Global Indigenous Data Alliance (2019)"}, {"label": "Authority to control (CARE)", "effect": "Affirms the community's right and authority to govern how the data is used at every stage, which is the CARE principle that most directly answers algorithmic colonialism by keeping the pen with those most affected.", "tradeoff": "Authority must be resourced and recognised by the agency to be real, and a decolonial approach warns that authority granted in name only repeats the extraction it claims to refuse.", "cite": "Global Indigenous Data Alliance (2019)"}], "pick": 2}}, "youcan": ["You can now explain Indigenous data sovereignty in your own words and attribute it to First Nations, Inuit, and Metis communities.", "You can now describe the four OCAP principles, attribute them to the First Nations Information Governance Centre, and say what each protects.", "You can now run a data-governance case through OCAP and CARE and name what would change if the community governed its own data."], "reflectPrompt": "If data is a kind of story about people, who has been telling the story of a community you belong to or work with, and what would change if that community held the pen? Connect it to your Seneca program or field."},
      9: {"time": "About 90 minutes (read 40, watch 20, do 25, reflect 5)", "deck": "BFS218_Week09", "overview": "This week completes the four dimensions of the New Jim Code with the one Benjamin saves for last: technological benevolence, the false promise of help. The idea is simple but slippery: the most dangerous systems may be the ones that arrive as care, a fix, an upgrade, an act of help, while still carrying the old harms. You will learn to name the benevolence trap, where a tool sold as the solution becomes harder to question than one that is openly harmful. Then you will practice Benjamin's hard test, will the fix fix it, and add a technology of your own to your Living Cartography.", "purpose": "Technological benevolence is the fourth and final dimension of the New Jim Code, and it completes the anatomy you have built since Week 2. The point of this week is to help you look past benevolent framing and ask, of any proposed fix, whether it actually changes the harm or only makes it harder to question. It turns the whole course toward response: once you can see harm hiding inside help, you can test the solutions you are offered instead of trusting them.", "outcomes": ["By the end of this week you can define technological benevolence as harm carried inside the language of help.", "By the end of this week you can recognize the benevolence trap, where a fix sold as care disarms criticism in advance.", "By the end of this week you can explain Benjamin's argument in Raising Robots about helpers, disposability, and race.", "By the end of this week you can apply the will-the-fix-fix-it test to a real technology and add it to your Living Cartography."], "guiding": ["What makes a technology sold as help harder to criticize than one that is openly harmful?", "In Raising Robots, why does Benjamin connect the disposability of robots to the denigration of racialized people?", "Who benefits when a harm is reframed as a problem that technology has already solved?", "How would you tell a real repair from a comfortable story about one?"], "checks": ["A technology that is openly harmful is more dangerous than one sold to us as help.", "A tool framed as care can be harder to question than one that is openly harmful.", "The right test for any proposed fix is whether it actually changes the harm, and for whom.", "You could name a technology in your own life that was sold to you, or to your community, as help.", "When a machine is framed as keeping people safe, there is no need to ask whose safety it serves."], "concepts": [{"h": "Help can be how harm survives", "body": "Technological benevolence is Benjamin's fourth dimension: technology promoted as good for us, a fix, an upgrade, an act of care, that still carries the old harms. The benevolent framing is not a side effect; it is part of how the harm survives, because help is hard to argue with. A tool sold as the solution is harder to question than one that is openly harmful, and that difficulty is the point.", "cite": "Benjamin (2019)"}, {"h": "The benevolence trap", "body": "The benevolence trap is what makes this dimension dangerous. A tool sold as the solution disarms criticism in advance, so to question it can feel like opposing progress or refusing help. The trap is not only the harm itself but the difficulty of naming it once it wears the language of care. A harm you cannot name, you cannot organize against.", "cite": "Benjamin (2019)"}, {"h": "Raising Robots connects disposability to race", "body": "In Raising Robots, Benjamin shows how robots and automation are imagined as helpers and even servants, and how the disposability of robots travels with the denigration of racialized people. Her example is police throwbots, sent in first so officers can own the real estate with their eyes before paying with their bodies. The machine is framed as safety, which is why the right question becomes safety for whom.", "cite": "Benjamin (2019)"}, {"h": "Will the fix fix it?", "body": "This is Benjamin's working question for the dimension. For any proposed fix, ask what it actually changes and for whom. A comfortable story makes harm look solved while who carries the cost has not changed; a real repair changes who pays. The test is to separate a real repair from a comfortable story about one, and to remember that benevolence rarely arrives alone.", "cite": "Benjamin (2019)"}], "terms": [{"term": "Technological benevolence", "def": "Benjamin's fourth dimension of the New Jim Code: technology promoted as good for us, a fix, an upgrade, an act of help, that still carries existing harms because the framing of care disarms criticism.", "cite": "Benjamin (2019)"}, {"term": "The benevolence trap", "def": "what makes this dimension dangerous: a tool sold as the solution is harder to question than one that is openly harmful, so the harm is not only done but hard to name.", "cite": "Benjamin (2019)"}, {"term": "Will the fix fix it?", "def": "Benjamin's working test for any proposed solution: ask what it actually changes and for whom, to tell a real repair from a comfortable story about one.", "cite": "Benjamin (2019)"}, {"term": "Raising Robots", "def": "the chapter section where Benjamin examines machines framed as helpers, including police throwbots, and shows how the disposability of robots travels with the denigration of racialized people.", "cite": "Benjamin (2019)"}], "readings": [{"apa": "Benjamin, R. (2019). Race after technology: Abolitionist tools for the New Jim Code. Polity Press. (Technological benevolence, the fourth dimension; the chapter section Raising Robots.)", "scope": "Read this on Blackboard", "id": "benjamin2019"}], "activity": {"screen": "activity", "archetype": "scenario", "title": "The benevolence test", "what": "You evaluate a 'tech for good' pitch one promise at a time and decide whether each one is a real repair or a comfortable story that hides a harm.", "why": "so you practice Benjamin's working question, will the fix fix it, on a friendly-sounding system before you trust the next one you are offered.", "data": {"setup": "A start-up pitches CareScan, a 'tech for good' tool for a city shelter network: an AI camera and check-in app that promises to keep residents safe, speed up intake, and flag people who need help, all framed as care for a vulnerable community.", "steps": [{"situation": "The pitch opens: CareScan will make the shelter safer by watching every common area around the clock and alerting staff to incidents automatically.", "choices": [{"label": "Accept it: more watching means more safety for residents.", "outcome": "This is the benevolence trap. The camera is sold as safety, but constant surveillance of a vulnerable, often racialized population is the same exposure harm wrapped in the language of care. Ask: safety for whom.", "harm": true, "cite": "Benjamin (2019)"}, {"label": "Ask who the watching actually serves and who carries its cost.", "outcome": "This is the right move. Naming who is watched and who benefits separates a real safety measure from coded exposure sold as care, which is exactly the question Benjamin's framework demands.", "harm": false, "cite": "Benjamin (2019)"}]}, {"situation": "Next promise: CareScan's intake app uses an automated risk score to decide who gets a bed first, which the founders call a fairer, faster fix than staff judgment.", "choices": [{"label": "Run the will-the-fix-fix-it test: what does the score actually change, and for whom?", "outcome": "This is the right move. The test exposes that a fix sold as fairness can simply relocate the harm. If the score has not changed who carries the cost, it is a comfortable story, not a real repair.", "harm": false, "cite": "Benjamin (2019)"}, {"label": "Trust the score because it removes human bias and is faster.", "outcome": "This is the comfortable story. A faster, friendlier tool can still carry engineered inequity underneath; benevolence rarely arrives alone, so an automated score deserves more scrutiny, not less.", "harm": true, "cite": "Benjamin (2019)"}, {"label": "Ask whether the score has been tested for who it advantages and who it sets back.", "outcome": "This is also a strong move. Asking who the fix advantages and who it sets back is how you tell a real repair from a harm reframed as a problem technology has already solved.", "harm": false, "cite": "Benjamin (2019)"}]}, {"situation": "Closing promise: the founders say CareScan deploys cleanup and delivery robots so staff face less risky work, and they add that the robots are cheap and disposable.", "choices": [{"label": "Approve it: disposable robots take on the dangerous tasks, so no person is put at risk.", "outcome": "This repeats Benjamin's warning in Raising Robots. Machines framed as helpers can serve power, and the language of disposability travels with the denigration of the racialized people whose labour and risk the system still depends on. Ask who is really treated as disposable.", "harm": true, "cite": "Benjamin (2019)"}, {"label": "Ask who is still doing the risky labour and who the friendly framing leaves out.", "outcome": "This is the right move. Looking past the helper framing to who actually carries the risk is how you refuse the comfortable story and apply Benjamin's politics of help.", "harm": false, "cite": "Benjamin (2019)"}]}]}}, "youcan": ["You can now define technological benevolence as harm carried inside the language of help.", "You can now name the benevolence trap and explain why a fix sold as care is harder to criticize than open harm.", "You can now apply the will-the-fix-fix-it test to a real technology and tell a repair from a comfortable story."], "reflectPrompt": "Think of one technology in your own life that was sold to you, or to a community you belong to, as help. What is the harm underneath, and what does the language of help make hard to question?"},
      10: {"time": "About 90 minutes (read 40, watch 20, do 25, reflect 5)", "deck": "BFS218_Week10", "overview": "This week is about who is let through the gate, and who is kept out, when the gatekeeper is an algorithm. Automated systems now decide access in hiring, in lending, and in education, and they decide at scale and at speed. You will learn how an automated gate can reproduce racial inequity, name where that inequity lives, and ask the hard question that follows: when a model keeps someone out, quietly and at scale, who can they ask, and who is accountable.", "purpose": "Gatekeeping is where the dimensions you have studied this term meet a person's life chances. The point of this week is to help you explain how an automated gate can reproduce racial inequity at scale, and to name who is accountable when it does. It carries the New Jim Code forward into the systems that govern real opportunity, and it sets up the work on resistance and policy still to come.", "outcomes": ["By the end of this week you can explain algorithmic gatekeeping and give an example from hiring, lending, or education.", "By the end of this week you can summarise the Bird, Castleman, and Song (2023) finding on bias in predicting student success.", "By the end of this week you can distinguish inequality within the algorithm from inequality without it, after Devlin (2023).", "By the end of this week you can identify a gate in your own life decided by a system, and add it to your Living Cartography."], "guiding": ["When an algorithm decides who is let through a gate, who can the person who is kept out actually ask?", "Bird, Castleman, and Song found bias in predicting student success. What is the harm in being flagged, early and wrongly, as likely to fail?", "Devlin distinguishes inequality within and without the algorithm. What does each mean, and why do both matter?", "Which gate in your own life, a job portal, a loan, an admission, a benefit, was decided in part by a system?"], "checks": ["An automated system can decide who is hired, approved for credit, or admitted at scale and at speed.", "When an algorithm keeps someone out, that person can usually get a clear explanation and appeal the decision.", "A predictive model meant to help students can instead reinforce racial inequities by flagging some as poor bets.", "You could name a gate in your own life, a job portal, a loan, an admission, that a system helped decide.", "A search or ranking system that looks like a neutral utility cannot reproduce racism or sexism."], "concepts": [{"h": "An algorithmic gate decides at scale and in an instant", "body": "Algorithmic gatekeeping is the use of automated systems to decide who is granted access: who is hired, who is approved for credit, who is admitted or flagged in education. The gate operates at scale and at speed, sorting thousands of people on the same rule. The person it keeps out often has no one to ask and no decision to appeal, because the human gatekeeper who could once explain a decision has been replaced by a model that answers no one.", "cite": "Devlin (2023)"}, {"h": "A tool sold as help can still harm", "body": "Bird, Castleman, and Song (2023) studied predictive models that colleges use to flag community college students as likely to succeed or fail. They found that algorithmic bias can reinforce racial inequities. A model meant to point support toward students who need it can instead label some students, early and wrongly, as poor bets. That label shapes who gets help and who is quietly written off, and it can become true precisely because the system acted on it.", "cite": "Bird, Castleman, & Song (2023)"}, {"h": "Inequality lives within and without the algorithm", "body": "Devlin (2023) argues that inequality in AI sits in two places at once. Within the algorithm, it lives in the data and the design. Without it, it lives in who builds these systems and who is subject to them. Both matter, because fixing the data does not fix who holds the power, and changing who builds the tool does not fix biased data on its own.", "cite": "Devlin (2023)"}, {"h": "A ranking is a gate too", "body": "Safiya Umoja Noble shows that search and ranking systems can reproduce racism and sexism, often against Black women, while presenting as neutral utilities. A ranking is a gate too: what is pushed to the top is let through, and what is buried is kept out. The harm is easy to miss because the system looks like an objective tool rather than a decision about who counts.", "cite": "Noble (2018)"}], "terms": [{"term": "Algorithmic gatekeeping", "def": "the use of automated systems to decide who is granted access, such as who is hired, approved for credit, or admitted; the gate runs at scale and at speed, and the person kept out often has no one to ask and no decision to appeal.", "cite": "Devlin (2023)"}, {"term": "Bias in predicting success", "def": "the finding that predictive models used to flag students as likely to succeed or fail can carry algorithmic bias that reinforces racial inequities, labelling some students early and wrongly as poor bets.", "cite": "Bird, Castleman, & Song (2023)"}, {"term": "Inequality within and without the algorithm", "def": "Devlin's distinction between inequality inside the system, in its data and design, and inequality outside it, in who builds these systems and who is subject to them.", "cite": "Devlin (2023)"}, {"term": "Algorithms of oppression", "def": "Noble's argument that search and ranking systems can reproduce racism and sexism, especially against Black women, while presenting themselves as neutral tools.", "cite": "Noble (2018)"}], "readings": [{"apa": "Bird, K. A., Castleman, B. L., & Song, Y. (2023). Are algorithms biased in education? Exploring racial bias in predicting community college student success. EdWorkingPaper No. 23-717. Annenberg Institute, University of Virginia.", "scope": "Open access", "id": "bird2023"}, {"apa": "Devlin, K. (2023). Power in AI: Inequality within and without the algorithm. In The handbook of gender, communication, and women's human rights (pp. 123-139). Wiley-Blackwell. https://doi.org/10.1002/9781119800729.ch8", "scope": "Read this on Blackboard", "id": "devlin2023"}, {"apa": "Noble, S. U. (2018). Algorithms of oppression: How search engines reinforce racism. NYU Press.", "scope": "Read this on Blackboard", "id": "noble2018"}], "activity": {"screen": "activity", "archetype": "toggle", "title": "At the gate", "what": "You adjust an automated screening system, moving a threshold and switching criteria on or off, and watch who gets filtered out.", "why": "so you see for yourself how a design choice, not a person, decides who is let through and who is kept out, and where the harm falls.", "data": {"system": "An automated screening gate for a job, a loan, or a college program", "toggles": [{"label": "Resume keyword filter (auto-screen applicants before any person reads them)", "on": "Applicants whose words do not match the model's idea of a strong candidate are cut before a human ever sees them.", "off": "Every application reaches a person who can ask a question and weigh context.", "whoHarmed": "Applicants from backgrounds, schools, or first languages the training data underrepresented, screened out at scale with no one to ask.", "cite": "Devlin (2023)"}, {"label": "Early risk flag (predict who is likely to fail and sort support accordingly)", "on": "Students the model flags as likely to fail are watched, steered away, or simply not offered the help given to students it trusts.", "off": "Support is offered on need and request, not on a prediction made before the term has run.", "whoHarmed": "Students the biased model marks early and wrongly as poor bets, who lose support and can be made to fail by the flag itself.", "cite": "Bird, Castleman, & Song (2023)"}, {"label": "Credit-score cutoff (set the threshold that decides who is trusted with money)", "on": "A hard cutoff approves applicants above the line and refuses everyone below it, with no review of the history behind the number.", "off": "A person reviews borderline cases and can weigh circumstances the score cannot see.", "whoHarmed": "Applicants whose communities carry the legacy of unequal access to credit, refused at the threshold while the gate looks objective.", "cite": "Devlin (2023)"}, {"label": "Search ranking (push some results to the top and bury others)", "on": "What the ranking promotes is let through to attention; what it buries is effectively kept out, while the system looks like a neutral utility.", "off": "Results are shown without a hidden ordering that sorts who and what is seen.", "whoHarmed": "Groups the ranking demeans or buries, often Black women, harmed by a sorting that presents itself as a neutral tool.", "cite": "Noble (2018)"}]}}, "youcan": ["You can now explain algorithmic gatekeeping and give an example from hiring, lending, or education.", "You can now distinguish inequality within the algorithm from inequality without it, after Devlin.", "You can now name the harm in being flagged, early and wrongly, as likely to fail, after Bird, Castleman, and Song."], "reflectPrompt": "Every gate an algorithm guards was once guarded by a person who could be asked to explain. Name one gate in your own life or future field that a system helped decide: who did it let through, who did it keep out, and who could you actually ask?"},
      11: {"time": "About 90 minutes (read 40, watch 20, do 25, reflect 5)", "deck": "BFS218_Week11", "overview": "This is the week the whole course has been building toward. All term you have learned to see the New Jim Code and trace its harms, and now the course turns from critique to construction: you stop only naming what is wrong and start asking how to build differently. The subtitle of Benjamin's book is Abolitionist Tools for the New Jim Code, and this week you pick up those tools. You will learn design justice and the abolitionist stance, learn to tell a reform that leaves a system intact from a real repair that moves power, and you will complete your second and final Knowledge Check video that pairs a diagnosis with a response.", "purpose": "Week 11 reframes the course from critique to construction. The point is to give you concrete anti-racist strategies, design justice and abolitionist tools, so you can bring a response, not only a diagnosis, to a system in your own map. It sets up the final move of the course toward accountability and policy.", "outcomes": ["By the end of this week you can explain design justice and name several of its principles.", "By the end of this week you can explain what Benjamin means by abolitionist tools, as opposed to patches.", "By the end of this week you can distinguish a reform that leaves a system intact from a real repair that moves power.", "By the end of this week you can complete Knowledge Check 2: walk through one system from your Living Cartography and propose a design-justice or abolitionist response."], "guiding": ["What is the difference between a reform that leaves a system intact and a real repair?", "Design justice centres those most affected. What changes when the people harmed lead the design, instead of being consulted at the end?", "Benjamin calls for abolitionist tools, not patches. What would it mean to refuse a system rather than improve it?", "Tanksley centres Black youth as technological innovators. Where have you seen communities build their own tools?"], "checks": ["Patching a biased system's worst edges while leaving its power in place counts as a real repair.", "An abolitionist tool can mean refusing a system rather than making it run more smoothly.", "Design justice puts the people most affected in the lead, not consulted at the end.", "You could point to a community that has built its own tools rather than only being harmed by others'.", "A response is a real repair only when it changes who holds power and who carries the cost."], "concepts": [{"h": "Design justice", "body": "Design justice rethinks how things get designed so that it centres the people who are normally marginalized by design. Its principles include centring the voices of those directly impacted, prioritizing the design's impact on the community over the designer's intentions, treating everyone as an expert in their own lived experience, and looking first for what is already working at the community level. The people most affected lead the design, they are not consulted after it is built.", "cite": "Costanza-Chock (2020)"}, {"h": "Abolitionist tools", "body": "Benjamin calls for abolitionist tools: not patches that make an unjust system run more smoothly, but tools that refuse the system and help build something more just. The distinction is between reform, which preserves the structure while easing its worst edges, and abolition, which reimagines the structure itself. An abolitionist tool asks not how to fix the gate, but whether the gate should exist at all.", "cite": "Benjamin (2019)"}, {"h": "Reform versus real repair", "body": "The working test this week is to ask of any proposed response: is it a reform or a real repair? A reform eases harm but leaves power in place, so after the change the same people still decide. A real repair changes who holds power and who carries the cost. The test exposes fixes that sound generous, like more diverse data or a fairness audit, that can soften harm while the same company keeps deciding everything.", "cite": "Benjamin (2019)"}, {"h": "Centring Black youth as innovators", "body": "Tanksley models the abolitionist move in education with a critical race pedagogy in computer science that centres the voices, experiences, and technological innovations of Black youth. The shift is from seeing communities only as people who are harmed to seeing them as designers and builders. If communities are only ever the harmed, others still hold the power to fix them, so treating Black youth as innovators is itself part of moving that power.", "cite": "Tanksley (2023)"}], "terms": [{"term": "Design justice", "def": "an approach that rethinks design to centre people normally marginalized by it, so those most affected lead the work and count as experts by their own lived experience.", "cite": "Costanza-Chock (2020)"}, {"term": "Abolitionist tools", "def": "tools that do not make an unjust system run more smoothly but refuse it and help build a just alternative; the question shifts from how to fix the gate to whether the gate should exist.", "cite": "Benjamin (2019)"}, {"term": "Impact over intentions", "def": "the design justice rule that a design is judged by its real effect on the community, not by whether the designer meant well.", "cite": "Costanza-Chock (2020)"}, {"term": "Critical race pedagogy in computer science", "def": "an abolitionist way of teaching that centres the voices, experiences, and technological innovations of Black youth, treating them as designers rather than only as those harmed.", "cite": "Tanksley (2023)"}], "readings": [{"apa": "Costanza-Chock, S. (2020). Design justice: Community-led practices to build the worlds we need. MIT Press.", "scope": "Read this on Blackboard", "id": "costanzachock2020"}, {"apa": "Tanksley, T. (2023). Employing an abolitionist, critical race pedagogy in CS: Centering the voices, experiences and technological innovations of Black youth. Journal of Computer Science Integration, 6(1).", "scope": "Open access", "id": "tanksley2023"}, {"apa": "Benjamin, R. (2019). Race after technology: Abolitionist tools for the New Jim Code. Polity Press.", "scope": "Read this on Blackboard", "id": "benjamin2019"}], "activity": {"screen": "activity", "archetype": "assemble", "title": "Build the abolitionist toolkit", "what": "You pick one harmful system from your Living Cartography and assemble a toolkit of abolitionist tactics against it, choosing which tactics to include and saying what each one contributes.", "why": "so you move from naming harm to proposing a real response, and learn to judge whether your toolkit reforms a system or actually repairs it by moving power.", "data": {"goal": "The harm is a racialized gatekeeping system, for example a biased screening, scoring, or recognition tool that decides who gets through and quietly leaves the same people deciding. A good toolkit does not just smooth that system's edges; it shifts who leads the design and who holds power, so the response is a real repair rather than a reform.", "components": [{"label": "Audit the system", "role": "Measure who the system fails and who it serves, so the harm is documented evidence rather than a feeling, and the case for change is grounded.", "cite": "Benjamin (2019)"}, {"label": "Refuse or abolish", "role": "Ask whether the gate should exist at all and be willing to not build or to retire the system, the abolitionist move that a patch never makes.", "cite": "Benjamin (2019)"}, {"label": "Centre those most affected", "role": "Put the people normally marginalized by the design in the lead, as experts in their own lived experience, not consulted after the fact.", "cite": "Costanza-Chock (2020)"}, {"label": "Judge by impact, not intentions", "role": "Hold the response to its real effect on the community rather than to the designer's good intentions, so a well-meaning fix that still harms does not pass.", "cite": "Costanza-Chock (2020)"}, {"label": "Build with community-led innovation", "role": "Treat the affected community, including Black youth, as designers and builders of their own tools, so the alternative is built by those closest to the harm.", "cite": "Tanksley (2023)"}, {"label": "Apply the reform-or-repair test", "role": "Check the assembled toolkit against one question: after this, who still decides? If power has not moved, it is a reform, not a real repair.", "cite": "Benjamin (2019)"}]}}, "youcan": ["You can now explain design justice and name several of its principles in your own words.", "You can now tell the difference between a patch and an abolitionist tool, and between a reform and a real repair.", "You can now bring a response, not only a diagnosis, to a system in your own Living Cartography."], "reflectPrompt": "You have spent a term learning to see harm. Resistance asks something harder: to build. What is the difference between refusing a bad system and creating a better one, and which is being asked of you, in your own field, right now?"},
      12: {"time": "About 90 minutes (read 40, watch 20, do 25, reflect 5)", "deck": "BFS218_Week12", "overview": "This is the last content week of the course, and it lifts the question up a level. So far you have named harmful systems, measured the harm, and proposed fixes for single tools. This week asks what holds technology accountable at the scale of law, institutions, and international human rights, because an individual fix does not last if the rules above it still permit the harm. You will look at Canada's proposed AI law and its gaps, see techno-racism named as a human rights matter, and weigh what a just policy future could include.", "purpose": "Week 12 lifts the course to the level of accountability and policy. You examine how Canadian law, international human rights, and decolonial frameworks each try to govern technology, and you judge where each one succeeds and where it falls short. The point is to see accountability as a stack and to work the levels above the single system, where lasting change is made.", "outcomes": ["By the end of this week you can explain why accountability for technology must operate at the level of law and institutions, not only individual fixes.", "By the end of this week you can identify one documented gap in Canada's proposed Artificial Intelligence and Data Act, after Attard-Frost (2023).", "By the end of this week you can summarise how the UN frames racial discrimination in digital technologies as a human rights issue.", "By the end of this week you can describe what it means to build justice into AI governance from the start, after Ortiz (2024), and add a policy entry to your Living Cartography."], "guiding": ["Why are individual fixes not enough when the rules themselves permit the harm?", "Attard-Frost documents gaps in Canada's draft AI law. What is one gap, and who does it leave unprotected?", "The UN frames techno-racism as a human rights issue. What changes when harm is named as a rights violation?", "For a technology you use, what rule or policy would you change, and who would have to be at the table?"], "checks": ["Fixing one harmful system is enough on its own, even when the rules above it still permit the harm.", "A law meant to govern technology can leave whole groups exposed through the gaps it does not cover.", "Naming techno-racism as a human rights violation creates obligations on states and a stronger basis to demand change.", "You could name one technology in your own life and say what rule or policy about it you would change, and who would need to be at the table.", "Building justice into AI governance from the start works the same as regulating only after harm has happened."], "concepts": [{"h": "Accountability is a stack, not a patch", "body": "Accountability for technology operates at several levels: the single system at the bottom, then institutions and frameworks, then national law, then international human rights at the top. A fix aimed at one system does not last if the rules above it still permit the harm, because the next company can ship the same design. That is why this week works the top three levels, where lasting change is made.", "cite": "Attard-Frost, B. (2023)"}, {"h": "AI governance and its gaps", "body": "AI governance is the set of laws, rules, and institutions that try to constrain how AI is built and used. In Canada, the proposed Artificial Intelligence and Data Act (AIDA) is the leading attempt. In a 2023 submission to the Standing Committee on Industry and Technology, Blair Attard-Frost documented real gaps in it, including weak protection for artists and creators facing generative AI. A law with gaps still leaves people exposed, so a gap is not just a missing detail, it shows whose harm the rule was not written to count.", "cite": "Attard-Frost, B. (2023)"}, {"h": "Techno-racism as a human rights issue", "body": "In a 2020 report, the UN Special Rapporteur on contemporary forms of racism analysed racial discrimination in emerging digital technologies as a human rights matter. Naming techno-racism as a rights violation, rather than a technical glitch, changes what it asks of governments. It creates obligations on states and gives affected communities a stronger basis to demand change and redress.", "cite": "United Nations Human Rights Council (2020)"}, {"h": "Building justice in from the start", "body": "Building justice in means accountability is designed into a system from the beginning, with the communities most affected at the table, rather than added after harm has already happened. Ortiz (2024) calls this the Decolonial Intelligence Algorithmic framework, which builds justice in through epistemic decolonization and intersectional justice. It is the governance counterpart to design justice: not only how we build a tool, but how we govern it, and with whom.", "cite": "Ortiz, C. (2024)"}], "terms": [{"term": "AI governance", "def": "the set of laws, rules, and institutions that try to constrain how AI is built and used; in Canada, the proposed Artificial Intelligence and Data Act (AIDA) is the leading attempt.", "cite": "Attard-Frost, B. (2023)"}, {"term": "Documented gap", "def": "a place where a law leaves people exposed, such as the weak protection for artists and creators facing generative AI that Attard-Frost found in AIDA; a gap shows whose harm the rule was not written to count.", "cite": "Attard-Frost, B. (2023)"}, {"term": "Techno-racism as a human rights issue", "def": "naming racial discrimination in digital technologies as a rights violation rather than a technical glitch, which creates obligations on states and gives affected communities a stronger basis to demand change.", "cite": "United Nations Human Rights Council (2020)"}, {"term": "Building justice in from the start", "def": "designing accountability into a system from the beginning, with affected communities at the table, rather than regulating only after harm; Ortiz calls this the Decolonial Intelligence Algorithmic (DIA) framework.", "cite": "Ortiz, C. (2024)"}], "readings": [{"apa": "Attard-Frost, B. (2023). <em>Generative AI systems: Impacts on artists and creators and related gaps in the Artificial Intelligence and Data Act</em>. Submission to the Standing Committee on Industry and Technology, Parliament of Canada.", "scope": "Open access", "id": "attardfrost2023"}, {"apa": "United Nations Human Rights Council. (2020). <em>Racial discrimination and emerging digital technologies: A human rights analysis</em> (A/HRC/44/57). Report of the Special Rapporteur on contemporary forms of racism.", "scope": "Open access", "id": "unhrc2020"}, {"apa": "Ortiz, C. (2024). <em>The Decolonial Intelligence Algorithmic (DIA) framework: Revolutionizing ethical AI development through epistemic decolonization and intersectional justice</em>.", "scope": "Open access", "id": "ortiz2024"}], "activity": {"screen": "activity", "archetype": "lab", "title": "Draft the policy", "what": "You take a real accountability case, choose two policy levers to apply to it, and weigh what each one would fix and what it would cost.", "why": "so accountability stops being an abstract word and becomes a set of real trade-offs you have to reason through, the same choices a regulator faces.", "data": {"case": "Canada is deciding how to govern a generative AI system that scrapes artists' and creators' work to train itself, the same kind of gap Attard-Frost (2023) found left open in the proposed Artificial Intelligence and Data Act.", "levers": [{"label": "Outright ban", "effect": "Prohibits the system or use entirely, so the harm cannot happen at all.", "tradeoff": "Blunt and hard to pass; it can sweep up beneficial uses and pushes development to places with no rules at all.", "cite": "Attard-Frost, B. (2023)"}, {"label": "Audit mandate", "effect": "Requires independent, ongoing testing of the system for discriminatory or harmful effects before and after it is deployed.", "tradeoff": "Only as strong as who runs the audit and what they are allowed to see; an audit can find harm yet still leave the rules that permit it untouched.", "cite": "United Nations Human Rights Council (2020)"}, {"label": "Transparency requirement", "effect": "Forces disclosure of what data trained the system and how it is used, so the public can see and name the harm.", "tradeoff": "Visibility is not redress; people can see exactly how they are harmed and still have no power to stop it without enforcement behind it.", "cite": "Attard-Frost, B. (2023)"}, {"label": "Right to redress", "effect": "Gives the people harmed a real, enforceable way to demand correction or compensation, treating the harm as a rights violation.", "tradeoff": "Acts after the harm has already landed, and is only as strong as the body meant to enforce it.", "cite": "United Nations Human Rights Council (2020)"}, {"label": "Moratorium", "effect": "Pauses deployment until proper governance and affected communities are in place, buying time before harm becomes entrenched.", "tradeoff": "Temporary by design; if the pause is not used to write better rules with the right people at the table, the harm simply resumes.", "cite": "United Nations Human Rights Council (2020)"}, {"label": "Justice built in from the start", "effect": "Designs and governs the system with affected communities at the table from the beginning, after Ortiz's DIA framework.", "tradeoff": "Slower and harder to set up than a quick rule, and it asks those already holding power to share the table, which they rarely do willingly.", "cite": "Ortiz, C. (2024)"}], "pick": 2}}, "youcan": ["You can now explain why accountability has to operate above the single system, at institutions, national law, and human rights", "You can now name one documented gap in Canada's AIDA and say who it leaves exposed", "You can now describe what it means to build justice into AI governance from the start"], "reflectPrompt": "Laws move slower than the systems they try to govern, and they are often written by some people about others. Think of one technology in your own life: who would have to be at the table for a rule about it to be written with you, not just about you?"},
    }
  };
  function weekData(w) { var c = (D.course && D.course.code) || ''; return (WEEKPAGE[c] && WEEKPAGE[c][w]) || null; }
  function wkOptBtns(key) {
    var sel = state.wkCheck[key], opts = ['Agree', 'Not sure', 'Disagree'];
    return opts.map(function (o, i) { var on = sel === i; return '<button onclick="SOC.wkCheck(\'' + key + '\',' + i + ')" aria-pressed="' + on + '" class="wk-opt' + (on ? ' on' : '') + '">' + o + '</button>'; }).join('');
  }
  function wkOpts(key) { return '<div class="wk-opts" id="opts-' + key + '">' + wkOptBtns(key) + '</div>'; }
  function wkChecks(w, phase, d) {
    return d.checks.map(function (q, i) { return '<div class="wk-q">' + (i + 1) + '. ' + esc(q) + wkOpts(phase + '|' + w + '|' + i) + '</div>'; }).join('');
  }
  function weekPage(w, d) {
    var ws = journeyWeeks(), idx = ws.indexOf(w), prev = idx > 0 ? ws[idx - 1] : null, next = idx < ws.length - 1 ? ws[idx + 1] : null;
    var sec = function (id, title, inner) { return '<section id="wk-' + id + '" class="node"><h2 class="wk-sec">' + esc(title) + '</h2>' + inner + '</section>'; };
    var hero = '<section id="wk-ov" class="node jhero jfade" style="margin:0 0 16px"><div style="position:relative">'
      + '<div class="mono" style="font-size:.7rem;letter-spacing:.08em;color:var(--red);font-weight:700;margin-bottom:8px">WEEK ' + w + '</div>'
      + '<h1 style="font-size:2rem;line-height:1.12;font-weight:700;margin:0 0 12px;color:var(--ink)">' + esc(weekTitle(w)) + '</h1>'
      + '<p style="font-size:1.04rem;line-height:1.6;color:var(--ink);margin:0 0 4px;max-width:64ch">' + esc(d.overview) + '</p>'
      + '<div style="font-size:1.08rem;font-weight:600;color:var(--ink);border-left:3px solid var(--red);padding-left:14px;margin:16px 0">' + esc(journeyQ(w)) + '</div>'
      + '<div style="font-family:var(--mono);font-size:.74rem;color:var(--ink-faint)">' + ic('clock', 13) + ' ' + esc(d.time) + '</div>'
      + '</div></section>';
    var pre = sec('pre', 'Before you begin', '<p class="wk-hint">A quick gut-check. There is no grade and no wrong answer, it just captures what you already think. You will see the same questions again at the end, so you can watch your thinking change.</p>' + wkChecks(w, 'pre', d));
    var purpose = '<section id="wk-learn" class="node"><h2 class="wk-sec">Purpose</h2><p style="margin:0">' + esc(d.purpose) + '</p></section>';
    var outcomes = sec('out', 'Learning outcomes', '<p style="margin:0 0 8px;font-size:.9rem">By the end of this week, you will be able to:</p>' + d.outcomes.map(function (o) { return '<div class="wk-oc"><span class="b"></span>' + esc(o) + '</div>'; }).join(''));
    var guiding = sec('gq', 'Guiding questions', '<p style="margin:0 0 8px;font-size:.9rem">Hold these in mind as you work:</p>' + d.guiding.map(function (q) { return '<div class="wk-gq"><span class="q">+</span>' + esc(q) + '</div>'; }).join(''));
    var concepts = sec('con', 'Key concepts', d.concepts.map(function (c) { return '<div class="wk-concept"><h3>' + esc(c.h) + '</h3><p>' + esc(c.body) + ' <span class="wk-cite">(' + esc(c.cite) + ')</span></p></div>'; }).join(''));
    var terms = sec('term', 'Key terms', d.terms.map(function (t) { return '<div class="wk-term"><b>' + esc(t.term) + '</b>: ' + esc(t.def) + ' <span class="wk-cite">(' + esc(t.cite) + ')</span></div>'; }).join(''));
    var readings = sec('read', 'Readings', d.readings.map(function (r) { var resolves = (typeof rec === 'function') && r.id && rec(r.id); var tail = resolves ? '<button onclick="SOC.read(\'' + r.id + '\')" class="wk-scope">' + esc(r.scope || 'Open the reading') + ' &#8599;</button>' : (r.scope ? '<div class="wk-scope" style="background:none;border:none;color:var(--ink-faint);padding:6px 0;cursor:default">' + esc(r.scope) + '</div>' : ''); return '<div class="wk-read"><div class="ref">' + r.apa + '</div>' + tail + '</div>'; }).join(''));
    var watch = '<section id="wk-watch" class="node"><h2 class="wk-sec">Walkthrough</h2><p style="margin:0 0 12px;font-size:.92rem">Watch this week\'s narrated walkthrough.</p><div class="wk-deck"><iframe src="./walkthroughs/' + d.deck + '/index.html?v=4" title="Week ' + w + ' walkthrough" loading="lazy" allowfullscreen></iframe></div><a href="./walkthroughs/' + d.deck + '/index.html?v=4" target="_blank" rel="noopener" class="wk-fs">Open the walkthrough fullscreen &#8599;</a></section>';
    var act = '<section id="wk-do" class="node interactive"><h2 class="wk-sec">The activity: ' + esc(d.activity.title) + '</h2><div class="wk-whatwhy"><b>What this is:</b> ' + esc(d.activity.what) + '<br><br><b>Why you are doing it:</b> ' + esc(d.activity.why) + '</div><button onclick="SOC.startActivity(\'' + d.activity.screen + '\',' + w + ')" class="wk-cta">Start the activity' + ic('chevron', 17, 2.4) + '</button><p style="margin:10px 0 0;font-size:.74rem;color:var(--ink-faint)">Every activity works the same way: predict, then do it, then see the result, then name it with the reading.</p></section>';
    var reflect = '<section id="wk-reflect" class="node"><h2 class="wk-sec">Reflection</h2>'
      + '<div class="wk-ocheck"><div class="mono" style="font-size:.78rem;font-weight:700;color:var(--ink-faint);margin-bottom:7px">YOU CAN NOW</div>' + d.youcan.map(function (y) { return '<div class="wk-row"><span class="t">' + ic('check', 14, 2.6) + '</span>' + esc(y) + '</div>'; }).join('') + '</div>'
      + '<h3 style="margin:16px 0 4px">Now, what do you think?</h3><p class="wk-hint" style="margin-bottom:8px">The same questions from the start. Did your answers move?</p>' + wkChecks(w, 'post', d)
      + '<h3 style="margin:16px 0 4px">Your reflection</h3><p style="margin:0 0 8px;font-size:.95rem">' + esc(d.reflectPrompt) + '</p>'
      + '<textarea oninput="SOC.wkReflect(' + w + ',this.value)" class="wk-ta" placeholder="Your reflection...">' + esc(state.wkReflect[w] || '') + '</textarea>'
      + '<div class="wk-savebox"><h3>Save your work for this week</h3><p style="margin:0 0 4px;font-size:.9rem">This makes one Word file (.docx) on Seneca letterhead, your record of the week and what you hand in on Blackboard. It contains:</p><ul><li>your before-and-after answers to the five check questions</li><li>a summary of what you did in this week\'s activity</li><li>your answer to the reflection question</li></ul><button onclick="SOC.saveWeek(' + w + ')" class="wk-save">Save my work for this week (.docx)</button></div>'
      + '</section>';
    var navRow = '<div style="display:flex;gap:12px;margin-top:18px;flex-wrap:wrap">'
      + (prev != null ? '<button onclick="SOC.station(' + prev + ')" style="flex:1;min-width:180px;text-align:left;border:1px solid var(--border);background:#fff;border-radius:12px;padding:13px 16px;cursor:pointer"><div class="mono" style="font-size:.66rem;color:var(--ink-faint)">&larr; PREVIOUS</div><div style="font-size:.92rem;font-weight:700;color:var(--ink);margin-top:2px">Week ' + prev + ': ' + esc(weekTitle(prev)) + '</div></button>' : '')
      + (next != null ? '<button onclick="SOC.station(' + next + ')" style="flex:1;min-width:180px;text-align:right;border:1px solid var(--border);background:#fff;border-radius:12px;padding:13px 16px;cursor:pointer"><div class="mono" style="font-size:.66rem;color:var(--red)">NEXT &rarr;</div><div style="font-size:.92rem;font-weight:700;color:var(--ink);margin-top:2px">Week ' + next + ': ' + esc(weekTitle(next)) + '</div></button>' : '')
      + '</div>';
    var rail = '<aside class="wk-rail"><div class="wk-railbox"><div class="wk-railh">IN THIS WEEK</div>'
      + [['ov', 'Overview'], ['pre', 'Before you begin'], ['learn', 'Purpose &amp; outcomes'], ['read', 'Readings'], ['watch', 'Walkthrough'], ['do', 'The activity'], ['reflect', 'Reflection &amp; save']].map(function (it) { return '<a href="#wk-' + it[0] + '"><span class="s"></span>' + it[1] + '</a>'; }).join('')
      + '<div class="wk-railt">' + ic('clock', 12) + ' ' + esc(d.time.split('(')[0].trim()) + '</div></div></aside>';
    return '<div class="rise wk-grid"><main>' + hero + pre + purpose + outcomes + guiding + concepts + terms + readings + watch + act + reflect + navRow + '</main>' + rail + '</div>';
  }
  /* ---------- generic week activities: match / scenario / toggle / assemble / lab ---------- */
  function actCard(inner) { return '<div style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin:0 0 12px">' + inner + '</div>'; }
  function actCite(c) { return c ? '<div style="font-size:.74rem;color:var(--ink-faint);margin-top:6px">(' + esc(c) + ')</div>' : ''; }
  function actBadge(harm) { return harm ? '<span style="display:inline-block;background:#FBE9EA;color:#B11722;font-size:.7rem;font-weight:700;border-radius:999px;padding:2px 9px;margin-left:8px">leads to harm</span>' : '<span style="display:inline-block;background:#E7F3EC;color:#1C7A43;font-size:.7rem;font-weight:700;border-radius:999px;padding:2px 9px;margin-left:8px">reduces harm</span>'; }
  function actCaseBox(label, txt) { return txt ? '<div style="background:#15171C;color:#fff;border-radius:12px;padding:14px 18px;margin:0 0 16px"><div style="font-size:.7rem;font-weight:700;color:#F2A900;margin-bottom:4px">' + label + '</div><div style="font-size:.98rem;line-height:1.5">' + esc(txt) + '</div></div>' : ''; }
  function actMatch(w, a) {
    var d = a.data || {}, pairs = d.pairs || [], uniq = [], seen = {};
    pairs.forEach(function (p) { if (!seen[p.match]) { seen[p.match] = 1; uniq.push(p.match); } });
    var rows = pairs.map(function (p, i) {
      var key = 'a|' + w + '|m|' + i, sel = state.act[key];
      var btns = uniq.map(function (o, oi) {
        var picked = (sel === oi), correct = (o === p.match), bg = '#fff', bd = 'var(--border)', col = 'var(--ink)';
        if (sel != null) { if (correct) { bg = '#E7F3EC'; bd = '#1C7A43'; col = '#155f34'; } else if (picked) { bg = '#FBE9EA'; bd = '#B11722'; col = '#8f1119'; } }
        return '<button onclick="SOC.actPick(\'' + key + '\',' + oi + ')" style="text-align:left;border:1px solid ' + bd + ';background:' + bg + ';color:' + col + ';border-radius:9px;padding:8px 12px;font-size:.86rem;font-weight:600;cursor:pointer;margin:0 6px 6px 0">' + esc(o) + '</button>';
      }).join('');
      var fb = (sel != null) ? '<div style="margin-top:8px;font-size:.86rem;color:var(--ink-dim)">' + (uniq[sel] === p.match ? '<b style="color:#1C7A43">Yes. </b>' : '<b style="color:#B11722">Not quite. </b>') + esc(p.why) + actCite(p.cite) + '</div>' : '';
      return actCard('<div style="font-size:.7rem;font-weight:700;color:var(--red);margin-bottom:5px">EXAMPLE ' + (i + 1) + '</div><div style="font-size:1rem;font-weight:600;color:var(--ink);margin-bottom:10px">' + esc(p.item) + '</div><div style="font-size:.78rem;color:var(--ink-faint);margin-bottom:6px">Which mechanism does this show?</div>' + btns + fb);
    }).join('');
    return '<p style="margin:0 0 14px;color:var(--ink-dim)">' + esc(d.prompt || 'Match each example to the mechanism it shows.') + '</p>' + rows;
  }
  function actScenario(w, a) {
    var d = a.data || {}, steps = d.steps || [];
    var rows = steps.map(function (st, i) {
      var key = 'a|' + w + '|s|' + i, sel = state.act[key];
      var choices = (st.choices || []).map(function (c, ci) {
        var picked = (sel === ci), bd = picked ? (c.harm ? '#B11722' : '#1C7A43') : 'var(--border)', bg = picked ? (c.harm ? '#FBE9EA' : '#E7F3EC') : '#fff';
        return '<button onclick="SOC.actPick(\'' + key + '\',' + ci + ')" style="display:block;width:100%;text-align:left;border:1px solid ' + bd + ';background:' + bg + ';color:var(--ink);border-radius:9px;padding:10px 13px;font-size:.9rem;font-weight:600;cursor:pointer;margin:0 0 7px">' + esc(c.label) + (picked ? actBadge(c.harm) : '') + '</button>' + (picked ? '<div style="font-size:.86rem;color:var(--ink-dim);margin:0 0 10px;padding:0 2px">' + esc(c.outcome) + actCite(c.cite) + '</div>' : '');
      }).join('');
      return actCard('<div style="font-size:.7rem;font-weight:700;color:var(--red);margin-bottom:6px">DECISION ' + (i + 1) + '</div><div style="font-size:.98rem;font-weight:600;color:var(--ink);margin-bottom:10px">' + esc(st.situation) + '</div>' + choices);
    }).join('');
    return actCaseBox('THE CASE', d.setup) + '<p style="margin:0 0 14px;color:var(--ink-dim)">Make a call at each point, then see where the design choice leads.</p>' + rows;
  }
  function actToggle(w, a) {
    var d = a.data || {}, tgs = d.toggles || [];
    var rows = tgs.map(function (t, i) {
      var key = 'a|' + w + '|t|' + i, on = !!state.act[key];
      var sw = '<button onclick="SOC.actToggle(\'' + key + '\')" aria-pressed="' + on + '" aria-label="' + esc(t.label) + '" style="border:none;border-radius:999px;width:52px;height:28px;background:' + (on ? '#1C7A43' : '#C7CDD6') + ';position:relative;cursor:pointer;flex:0 0 auto"><span style="position:absolute;top:3px;left:' + (on ? '27px' : '3px') + ';width:22px;height:22px;border-radius:50%;background:#fff"></span></button>';
      return actCard('<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">' + sw + '<div style="font-size:.96rem;font-weight:700;color:var(--ink)">' + esc(t.label) + '<span style="font-size:.72rem;font-weight:600;color:var(--ink-faint);margin-left:8px">' + (on ? 'ON' : 'OFF') + '</span></div></div><div style="font-size:.88rem;color:var(--ink-dim)">' + esc(on ? t.on : t.off) + '</div><div style="font-size:.82rem;color:#B11722;margin-top:6px"><b>Who bears the cost:</b> ' + esc(t.whoHarmed) + '</div>' + actCite(t.cite));
    }).join('');
    return actCaseBox('THE SYSTEM', d.system) + '<p style="margin:0 0 14px;color:var(--ink-dim)">Flip each default and watch what changes, and who pays for it. A default is never neutral.</p>' + rows;
  }
  function actAssemble(w, a) {
    var d = a.data || {}, comps = d.components || [], key = 'a|' + w + '|asm', added = state.act[key] || [];
    var avail = comps.map(function (c, i) { return added.indexOf(i) >= 0 ? '' : '<button onclick="SOC.actAdd(\'' + key + '\',' + i + ')" style="display:block;width:100%;text-align:left;border:1px dashed var(--border);background:#fff;color:var(--ink);border-radius:9px;padding:10px 13px;font-size:.9rem;font-weight:600;cursor:pointer;margin:0 0 7px">+ ' + esc(c.label) + '</button>'; }).join('');
    var built = added.map(function (idx, n) { var c = comps[idx] || {}; return '<div style="border-left:3px solid var(--red);background:#fff;border:1px solid var(--border);border-radius:9px;padding:10px 13px;margin:0 0 8px"><div style="font-size:.92rem;font-weight:700;color:var(--ink)">' + (n + 1) + '. ' + esc(c.label) + '</div><div style="font-size:.85rem;color:var(--ink-dim);margin-top:3px">' + esc(c.role) + actCite(c.cite) + '</div></div>'; }).join('');
    var done = (added.length >= comps.length && comps.length) ? '<div style="margin-top:14px;background:#E7F3EC;border:1px solid #1C7A43;border-radius:10px;padding:12px 15px;font-size:.9rem;color:#155f34;font-weight:600">You have assembled the whole picture. Seeing the parts together is the point: the harm is not one bad piece, it is how the pieces work as a system.</div>' : '';
    return actCaseBox('THE GOAL', d.goal) + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px"><div><div style="font-size:.7rem;font-weight:700;color:var(--ink-faint);margin-bottom:8px">PARTS TO ADD</div>' + (avail || '<div style="font-size:.85rem;color:var(--ink-faint)">All parts added.</div>') + '</div><div><div style="font-size:.7rem;font-weight:700;color:var(--red);margin-bottom:8px">WHAT YOU HAVE BUILT</div>' + (built || '<div style="font-size:.85rem;color:var(--ink-faint)">Nothing yet. Add parts from the left.</div>') + '</div></div>' + done;
  }
  function actLab(w, a) {
    var d = a.data || {}, levers = d.levers || [], pick = d.pick || 2, key = 'a|' + w + '|lab', chosen = state.act[key] || [];
    var rows = levers.map(function (l, i) {
      var sel = chosen.indexOf(i) >= 0;
      var head = '<button onclick="SOC.actLabPick(\'' + key + '\',' + i + ',' + pick + ')" style="display:flex;align-items:center;gap:9px;width:100%;text-align:left;border:1px solid ' + (sel ? 'var(--red)' : 'var(--border)') + ';background:' + (sel ? '#FDECEC' : '#fff') + ';color:var(--ink);border-radius:9px;padding:10px 13px;font-size:.92rem;font-weight:700;cursor:pointer;margin:0 0 ' + (sel ? '0' : '8px') + '"><span style="width:18px;height:18px;border-radius:5px;border:2px solid ' + (sel ? 'var(--red)' : '#C7CDD6') + ';background:' + (sel ? 'var(--red)' : '#fff') + ';flex:0 0 auto"></span>' + esc(l.label) + '</button>';
      var body = sel ? '<div style="border:1px solid var(--red);border-top:none;border-radius:0 0 9px 9px;background:#fff;padding:10px 13px;margin:0 0 8px;font-size:.86rem;color:var(--ink-dim)"><b>What it does:</b> ' + esc(l.effect) + '<br><b>The trade-off:</b> ' + esc(l.tradeoff) + actCite(l.cite) + '</div>' : '';
      return head + body;
    }).join('');
    var note = chosen.length >= pick ? '<div style="margin-top:8px;background:#E7F3EC;border:1px solid #1C7A43;border-radius:10px;padding:12px 15px;font-size:.88rem;color:#155f34;font-weight:600">You picked your ' + pick + '. There is no clean answer here: every lever buys something and costs something. That tension is the policy problem.</div>' : '<div style="margin-top:8px;font-size:.82rem;color:var(--ink-faint)">Choose ' + pick + ' levers (' + chosen.length + ' of ' + pick + ' chosen).</div>';
    return actCaseBox('THE CASE', d['case']) + '<p style="margin:0 0 12px;color:var(--ink-dim)">You are the policy advisor. Pick the ' + pick + ' levers you would use, and weigh what each one costs.</p>' + rows + note;
  }
  function activityScreen() {
    var w = state.activityReturn, d = weekData(w);
    if (!d || !d.activity) return '<div style="padding:30px 0;color:var(--ink-dim)">No activity here. <button onclick="SOC.go(\'journey\')" style="background:none;border:none;color:var(--red);font-weight:600;cursor:pointer">Back to your journey</button></div>';
    var a = d.activity;
    var head = '<section class="jhero" style="margin:0 0 18px;padding:26px 28px"><div class="mono" style="font-size:.7rem;letter-spacing:.06em;color:var(--red);font-weight:700;margin-bottom:7px">WEEK ' + w + ' ACTIVITY</div><h1 style="font-size:1.7rem;line-height:1.15;font-weight:700;margin:0 0 12px;color:var(--ink)">' + esc(a.title) + '</h1><div class="wk-whatwhy" style="margin:0"><b>What this is:</b> ' + esc(a.what) + '<br><br><b>Why you are doing it:</b> ' + esc(a.why) + '</div></section>';
    var inner = '';
    switch (a.archetype) { case 'match': inner = actMatch(w, a); break; case 'scenario': inner = actScenario(w, a); break; case 'toggle': inner = actToggle(w, a); break; case 'assemble': inner = actAssemble(w, a); break; case 'lab': inner = actLab(w, a); break; default: inner = '<p style="color:var(--ink-dim)">This activity is not set up yet.</p>'; }
    var foot = '<div style="margin-top:22px;padding-top:18px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><div style="font-size:.86rem;color:var(--ink-dim)">When you are done, go back to the week to answer the reflection and save your work.</div><button onclick="SOC.station(' + w + ')" class="wk-cta" style="margin:0">Back to Week ' + w + ' ' + ic('chevron', 16, 2.4) + '</button></div>';
    return '<div class="rise" style="max-width:840px;margin:0 auto">' + head + inner + foot + '</div>';
  }
  function activitySummary(w, d) {
    var a = d.activity || {};
    if (a.screen === 'sandbox' || a.archetype == null) {
      var audited = Object.keys(state.auditedSystems || {});
      return audited.length ? ('You audited ' + audited.length + ' of 3 systems. Every system you tested failed darker-skinned women the most (up to 34.7 percent), against near-zero error for lighter-skinned men. The disparity was hidden by overall accuracy and only an intersectional cut revealed it.') : '(activity not run yet)';
    }
    var data = a.data || {};
    if (a.archetype === 'match') { var pairs = data.pairs || [], uniq = [], seen = {}, done = 0, correct = 0; pairs.forEach(function (q) { if (!seen[q.match]) { seen[q.match] = 1; uniq.push(q.match); } }); pairs.forEach(function (p, i) { var s = state.act['a|' + w + '|m|' + i]; if (s != null) { done++; if (uniq[s] === p.match) correct++; } }); return done ? ('You matched ' + correct + ' of ' + pairs.length + ' examples to the mechanism each one shows.') : '(activity not started yet)'; }
    if (a.archetype === 'scenario') { var steps = data.steps || [], n = 0; steps.forEach(function (st, i) { if (state.act['a|' + w + '|s|' + i] != null) n++; }); return n ? ('You worked through ' + n + ' of ' + steps.length + ' decision points and saw which design choices lead to harm.') : '(activity not started yet)'; }
    if (a.archetype === 'toggle') { var tgs = data.toggles || [], n2 = 0; tgs.forEach(function (t, i) { if (state.act['a|' + w + '|t|' + i]) n2++; }); return 'You explored the system defaults and saw who each one harms (' + n2 + ' of ' + tgs.length + ' turned on).'; }
    if (a.archetype === 'assemble') { var comps = data.components || [], added = (state.act['a|' + w + '|asm'] || []).length; return added ? ('You assembled ' + added + ' of ' + comps.length + ' parts and saw how they work together as a system.') : '(activity not started yet)'; }
    if (a.archetype === 'lab') { var levers = data.levers || [], ch = state.act['a|' + w + '|lab'] || []; if (!ch.length) return '(activity not started yet)'; var names = ch.map(function (i) { return levers[i] ? levers[i].label : ''; }).filter(Boolean); return 'For the case, you chose: ' + names.join(', ') + '. Each lever buys something and costs something.'; }
    return '(activity not started yet)';
  }
  function weekStation(w) {
    var d = weekData(w);
    if (d) return weekPage(w, d);
    var ws = journeyWeeks(), idx = ws.indexOf(w), recs = recordsForWeek(w);
    if (idx < 0 || !recs.length) return '<div style="padding:40px 0;color:var(--ink-dim);font-size:1rem">This week has no readings posted yet. <button onclick="SOC.go(\'journey\')" style="background:none;border:none;color:var(--red);font-weight:600;cursor:pointer">Back to your journey</button></div>';
    var hero = '<section class="jfade jhero" style="margin-bottom:22px;padding:30px 32px 28px">' + heroArt()
      + '<div style="position:relative">'
      + '<div class="mono" style="font-size:.6875rem;letter-spacing:.06em;color:var(--red);font-weight:600;margin-bottom:9px">WEEK ' + w + ' OF YOUR JOURNEY</div>'
      + '<h1 style="font-size:1.875rem;line-height:1.16;font-weight:600;margin:0 0 12px">' + esc(weekTitle(w)) + '</h1>'
      + '<p style="font-size:1.0625rem;line-height:1.5;color:var(--ink);font-weight:500;margin:0;max-width:60ch">' + esc(journeyQ(w)) + '</p>'
      + '</div></section>';
    var framing = '<p style="font-size:1rem;line-height:1.65;color:var(--ink-dim);margin:0 0 22px;max-width:72ch">' + esc(stationFraming(w, recs)) + '</p>';
    var readBlocks = '<div style="display:flex;flex-direction:column;gap:14px;margin-bottom:24px">';
    recs.forEach(function (r, i) { readBlocks += stationReading(r, i === 0 ? 'This week\'s reading' : 'Also this week'); });
    readBlocks += '</div>';
    var prev = idx > 0 ? ws[idx - 1] : null, next = idx < ws.length - 1 ? ws[idx + 1] : null;
    var navRow = '<div style="display:flex;gap:12px;margin-top:26px;flex-wrap:wrap">'
      + (prev != null ? '<button onclick="SOC.station(' + prev + ')" style="flex:1;min-width:190px;text-align:left;border:1px solid var(--border);background:#fff;border-radius:12px;padding:13px 16px;cursor:pointer"><div class="mono" style="font-size:.6875rem;color:var(--ink-faint)">&larr; PREVIOUS</div><div style="font-size:.9375rem;font-weight:600;color:var(--ink);margin-top:2px">Week ' + prev + ': ' + esc(weekTitle(prev)) + '</div></button>' : '')
      + (next != null ? '<button onclick="SOC.station(' + next + ')" style="flex:1;min-width:190px;text-align:right;border:1px solid var(--border);background:#fff;border-radius:12px;padding:13px 16px;cursor:pointer"><div class="mono" style="font-size:.6875rem;color:var(--red)">NEXT &rarr;</div><div style="font-size:.9375rem;font-weight:600;color:var(--ink);margin-top:2px">Week ' + next + ': ' + esc(weekTitle(next)) + '</div></button>' : '')
      + '</div>';
    return '<div class="rise">' + hero + framing + '<div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:var(--ink-faint);margin:0 0 12px">WHAT YOU ARE READING</div>' + readBlocks + stationDo(w) + navRow + '</div>';
  }

  /* ---------- render ---------- */
  function homeBar() {
    return '<button onclick="SOC.go(\'journey\')" style="display:inline-flex;align-items:center;gap:7px;background:#fff;border:1px solid #DEE3EA;border-radius:8px;padding:8px 14px;font-size:.875rem;font-weight:600;color:#15171C;margin-bottom:18px;cursor:pointer">&#8592; Back to your journey</button>';
  }
  function backBar() {
    if (state.activityReturn != null) return '<button onclick="SOC.station(' + state.activityReturn + ')" style="display:inline-flex;align-items:center;gap:7px;background:#fff;border:1px solid #DEE3EA;border-radius:8px;padding:8px 14px;font-size:.875rem;font-weight:600;color:#15171C;margin-bottom:18px;cursor:pointer">&#8592; Back to Week ' + state.activityReturn + '</button>';
    return homeBar();
  }
  function body() {
    if (state.screen === 'journey' || state.screen === 'library') return journeyHome();
    if (state.screen === 'station') return homeBar() + weekStation(state.stationWeek || currentJourneyWeek());
    if (state.screen === 'detail') return homeBar() + detail();
    if (state.screen === 'readings') return homeBar() + readingsGallery();
    if (state.screen === 'compare') return homeBar() + compare();
    if (state.screen === 'reading') return homeBar() + readingComp();
    if (state.screen === 'glossary') return homeBar() + glossaryScreen();
    if (state.screen === 'cards') return homeBar() + cardsScreen();
    if (state.screen === 'sandbox' && D.course && D.course.code === 'BFS218') return backBar() + sandboxScreen();
    if (state.screen === 'activity' && D.course && D.course.code === 'BFS218') return backBar() + activityScreen();
    return journeyHome();
  }
  function render() {
    if (state.screen !== 'compare' && render._prev !== undefined && render._prev !== state.screen && (state.compareIds.length || state.showSynthesis)) { state.compareIds = []; state.showSynthesis = false; }
    render._prev = state.screen;
    var toast = state.toast ? '<div role="status" style="position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:80;background:#15171C;color:#fff;font-size:.9375rem;font-weight:500;padding:12px 20px;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.24);display:flex;align-items:center;gap:10px"><span style="display:flex;color:#F2A900">' + ic('check', 16, 2.2) + '</span>' + esc(state.toast) + '</div>' : '';
    document.getElementById('app').innerHTML =
      '<div style="min-height:100vh;display:flex;flex-direction:column;background:#F7F8FA">' + header()
      + '<div style="display:flex;flex:1;min-height:0">' + sidebar()
      + '<main id="soc-main" class="scrollarea" style="flex:1;min-width:0;overflow:auto;height:calc(100vh - 62px)"><div style="max-width:1180px;margin:0 auto;padding:30px 30px 110px">' + body() + '</div></main>'
      + '</div>' + toast + '</div>';
    if (refocusSearch) {
      var el = document.getElementById('soc-search');
      if (el) { el.focus(); var v = el.value; el.setSelectionRange(v.length, v.length); }
      refocusSearch = false;
    }
    if (focusTarget) {
      var ft = document.getElementById(focusTarget);
      if (ft) { if (!ft.hasAttribute('tabindex')) ft.setAttribute('tabindex', '-1'); ft.focus(); }
      focusTarget = null;
    }
  }
  function topScroll() { var m = document.getElementById('soc-main'); if (m) m.scrollTop = 0; }

  /* ---------- actions ---------- */
  function flash(msg) { clearTimeout(toastTimer); var lr = document.getElementById('soc-live'); if (lr) { lr.textContent = ''; setTimeout(function () { lr.textContent = msg; }, 30); } state.toast = msg; render(); toastTimer = setTimeout(function () { state.toast = null; render(); }, 2200); }
  /* ---- real .docx (OOXML, dependency-free) ---- */
  function dxEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]; }); }
  function dxRun(text, opt) { opt = opt || {}; var rpr = '<w:rPr>'; if (opt.bold) rpr += '<w:b/>'; if (opt.color) rpr += '<w:color w:val="' + opt.color + '"/>'; if (opt.size) rpr += '<w:sz w:val="' + opt.size + '"/><w:szCs w:val="' + opt.size + '"/>'; rpr += '<w:rFonts w:ascii="IBM Plex Sans" w:hAnsi="IBM Plex Sans" w:cs="IBM Plex Sans"/></w:rPr>'; var parts = String(text == null ? '' : text).split('\n'), t = ''; for (var i = 0; i < parts.length; i++) { if (i > 0) t += '<w:br/>'; t += '<w:t xml:space="preserve">' + dxEsc(parts[i]) + '</w:t>'; } return '<w:r>' + rpr + t + '</w:r>'; }
  function dxPara(runsXml, opt) { opt = opt || {}; var ppr = '<w:pPr><w:spacing w:before="' + (opt.before || 0) + '" w:after="' + (opt.after || 120) + '"/>'; if (opt.border) ppr += '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="6" w:color="DEE3EA"/></w:pBdr>'; ppr += '</w:pPr>'; return '<w:p>' + ppr + runsXml + '</w:p>'; }
  function dxDoc(course, title, subLines, sections) { var body = ''; body += dxPara(dxRun('SENECA POLYTECHNIC · ' + course, { bold: true, color: 'DA291C', size: 18 }), { after: 40 }); body += dxPara(dxRun(title, { bold: true, color: 'DA291C', size: 36 }), { after: 60 }); (subLines || []).forEach(function (line, i) { body += dxPara(dxRun(line, { color: '474C57', size: 20 }), { after: (i === subLines.length - 1 ? 160 : 40), border: (i === subLines.length - 1) }); }); (sections || []).forEach(function (sec) { body += dxPara(dxRun(sec.h, { bold: true, color: 'DA291C', size: 22 }), { before: 160, after: 30 }); if (sec.t !== undefined && sec.t !== null) { var t = (String(sec.t).trim()) ? sec.t : '(not written yet)'; body += dxPara(dxRun(t, { color: '15171C', size: 22 }), { after: 80 }); } }); return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>'; }
  var DX_CT = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
  var DX_RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
  var dxCrcT = null;
  function dxCrc(bytes) { if (!dxCrcT) { dxCrcT = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); dxCrcT[n] = c >>> 0; } } var crc = 0xFFFFFFFF; for (var i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ dxCrcT[(crc ^ bytes[i]) & 0xFF]; return (crc ^ 0xFFFFFFFF) >>> 0; }
  function dxCat(arrs) { var len = 0, i; for (i = 0; i < arrs.length; i++) len += arrs[i].length; var out = new Uint8Array(len), off = 0; for (i = 0; i < arrs.length; i++) { out.set(arrs[i], off); off += arrs[i].length; } return out; }
  function dxU16(n) { return new Uint8Array([n & 255, (n >> 8) & 255]); }
  function dxU32(n) { return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]); }
  function dxZip(files) { var enc = new TextEncoder(); var chunks = [], central = [], offset = 0; files.forEach(function (f) { var nameB = enc.encode(f.name); var data = (f.data instanceof Uint8Array) ? f.data : enc.encode(f.data); var crc = dxCrc(data), size = data.length; var lfh = dxCat([dxU32(0x04034b50), dxU16(20), dxU16(0), dxU16(0), dxU16(0), dxU16(0), dxU32(crc), dxU32(size), dxU32(size), dxU16(nameB.length), dxU16(0), nameB, data]); chunks.push(lfh); central.push(dxCat([dxU32(0x02014b50), dxU16(20), dxU16(20), dxU16(0), dxU16(0), dxU16(0), dxU16(0), dxU32(crc), dxU32(size), dxU32(size), dxU16(nameB.length), dxU16(0), dxU16(0), dxU16(0), dxU16(0), dxU32(0), dxU32(offset), nameB])); offset += lfh.length; }); var centralB = dxCat(central); var eocd = dxCat([dxU32(0x06054b50), dxU16(0), dxU16(0), dxU16(files.length), dxU16(files.length), dxU32(centralB.length), dxU32(offset), dxU16(0)]); return dxCat([dxCat(chunks), centralB, eocd]); }
  function senecaDoc(course, title, subLines, sections, fn) {
    var bytes = dxZip([{ name: '[Content_Types].xml', data: DX_CT }, { name: '_rels/.rels', data: DX_RELS }, { name: 'word/document.xml', data: dxDoc(course, title, subLines, sections) }]);
    var blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fn + '.docx';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
    flash('Saved to your device (Seneca template).');
  }
  window.SOC = {
    go: function (s) { if (s === 'library') { state.savedView = false; } if (s === 'reading') { state.rcReading = null; state.lens = 'thematic'; } if (s === 'readings') { state.galWeek = null; state.galTopic = null; } state.screen = s; focusTarget = 'soc-main'; render(); topScroll(); },
    station: function (w) { state.stationWeek = w; state.journeyWeek = w; state.activityReturn = null; state.screen = 'station'; persist(); focusTarget = 'soc-main'; render(); topScroll(); },
    startActivity: function (s, w) { state.activityReturn = w; state.screen = s; focusTarget = 'soc-main'; render(); topScroll(); },
    goWeek: function (s, w) { state.cardWeek = w; state.screen = s; focusTarget = 'soc-main'; render(); topScroll(); },
    galWeek: function (w) { var m = document.getElementById('soc-main'); var y = m ? m.scrollTop : 0; state.galWeek = (state.galWeek === w) ? null : w; render(); var m2 = document.getElementById('soc-main'); if (m2) m2.scrollTop = y; },
    galTopic: function (t) { var m = document.getElementById('soc-main'); var y = m ? m.scrollTop : 0; state.galTopic = (state.galTopic === t) ? null : t; render(); var m2 = document.getElementById('soc-main'); if (m2) m2.scrollTop = y; },
    galClear: function () { state.galWeek = null; state.galTopic = null; render(); },
    playVideo: function (el, id) { var box = el.closest ? el.closest('.rgvideo') : el.parentNode; if (box) { box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1" title="Scholar talk" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>'; } },
    back: function () { state.screen = 'library'; focusTarget = 'soc-main'; render(); var m = document.getElementById('soc-main'); if (m) m.scrollTop = state.libScroll || 0; },
    open: function (id) { var m = document.getElementById('soc-main'); if (m) state.libScroll = m.scrollTop; state.screen = 'detail'; state.detailId = id; focusTarget = 'soc-main'; render(); topScroll(); },
    layout: function (l) { state.layout = l; persist(); render(); },
    sort: function (s) { state.sort = s; render(); },
    search: function (v) { state.search = v; refocusSearch = true; render(); },
    clearSearch: function () { state.search = ''; render(); },
    type: function (t) { state.activeTypes = (state.activeTypes.length === 1 && state.activeTypes[0] === t) ? [] : [t]; render(); },
    week: function (w) { state.activeWeek = (state.activeWeek === w) ? null : w; state.savedView = false; state.screen = 'library'; focusTarget = 'soc-main'; render(); topScroll(); },
    clearFilters: function () { state.activeTypes = []; state.activeWeek = null; state.search = ''; state.savedView = false; render(); },
    dismissIntro: function () { state.introOpen = false; persist(); render(); },
    save: function (id) { var a = state.saved, i = a.indexOf(id); var msg; if (i >= 0) { a.splice(i, 1); msg = 'Removed from saved.'; } else { a.push(id); msg = 'Saved to your shelf.'; } persist(); flash(msg); },
    compare: function (id) { var a = state.compareIds, i = a.indexOf(id); if (i >= 0) { a.splice(i, 1); persist(); flash('Removed from compare.'); } else { if (a.length >= 3) { flash('Compare holds three at a time.'); return; } a.push(id); persist(); flash('Added to compare.'); } },
    clearCompare: function () { state.compareIds = []; state.showSynthesis = false; render(); },
    synthesize: function () { state.showSynthesis = true; render(); },
    hideSynthesis: function () { state.showSynthesis = false; render(); },
    setLens: function (l) { state.lens = l; render(); },
    rcPick: function (id) { state.rcReading = id; state.lens = 'thematic'; persist(); render(); topScroll(); },
    rcClear: function () { state.rcReading = null; render(); topScroll(); },
    rcNote: function (k, v) { state.rcNotes[k] = v; persist(); },
    wkCheck: function (k, o) { state.wkCheck[k] = o; persist(); var el = document.getElementById('opts-' + k); if (el) el.innerHTML = wkOptBtns(k); },
    wkReflect: function (w, v) { state.wkReflect[w] = v; persist(); },
    actPick: function (key, idx) { var m = document.getElementById('soc-main'), top = m ? m.scrollTop : 0; state.act[key] = idx; persist(); render(); var m2 = document.getElementById('soc-main'); if (m2) m2.scrollTop = top; },
    actToggle: function (key) { var m = document.getElementById('soc-main'), top = m ? m.scrollTop : 0; state.act[key] = !state.act[key]; persist(); render(); var m2 = document.getElementById('soc-main'); if (m2) m2.scrollTop = top; },
    actAdd: function (key, idx) { var m = document.getElementById('soc-main'), top = m ? m.scrollTop : 0; var arr = state.act[key] || []; if (arr.indexOf(idx) < 0) arr.push(idx); state.act[key] = arr; persist(); render(); var m2 = document.getElementById('soc-main'); if (m2) m2.scrollTop = top; },
    actLabPick: function (key, idx, max) { var m = document.getElementById('soc-main'), top = m ? m.scrollTop : 0; var arr = state.act[key] || [], p = arr.indexOf(idx); if (p >= 0) arr.splice(p, 1); else { if (arr.length >= max) arr.shift(); arr.push(idx); } state.act[key] = arr; persist(); render(); var m2 = document.getElementById('soc-main'); if (m2) m2.scrollTop = top; },
    saveWeek: function (w) {
      var d = weekData(w); if (!d) { flash('Open a week first.'); return; }
      var opt = function (k) { var s = state.wkCheck[k]; return s == null ? '(not answered)' : ['Agree', 'Not sure', 'Disagree'][s]; };
      var checkLines = d.checks.map(function (q, i) { return (i + 1) + '. ' + q + '\n   Before: ' + opt('pre|' + w + '|' + i) + '   After: ' + opt('post|' + w + '|' + i); }).join('\n');
      var auditText = activitySummary(w, d);
      var sections = [
        { h: 'Week ' + w + ': ' + weekTitle(w), t: d.purpose },
        { h: 'Before and after, your check answers', t: checkLines },
        { h: 'The activity: ' + d.activity.title, t: auditText },
        { h: 'Your reflection', t: (state.wkReflect[w] || '').trim() || '(not written yet)' }
      ];
      senecaDoc('BFS218', weekTitle(w) + ' (Week ' + w + ')', ['BFS218 Racism and the Digital Age', 'Your week record'], sections, 'BFS218_Week' + w + '_my_work');
    },
    rcReveal: function (k) { var m = document.getElementById('soc-main'); var top = m ? m.scrollTop : 0; state.revealed[k] = !state.revealed[k]; render(); var m2 = document.getElementById('soc-main'); if (m2) m2.scrollTop = top; },
    mcPick: function (k, i) { var m = document.getElementById('soc-main'); var top = m ? m.scrollTop : 0; state.mcSel[k] = i; render(); var m2 = document.getElementById('soc-main'); if (m2) m2.scrollTop = top; },
    mcReset: function (id) { var m = document.getElementById('soc-main'); var top = m ? m.scrollTop : 0; var keep = {}; Object.keys(state.mcSel).forEach(function (k) { if (k.indexOf(id + '|mc|') !== 0) keep[k] = state.mcSel[k]; }); state.mcSel = keep; render(); var m2 = document.getElementById('soc-main'); if (m2) m2.scrollTop = top; },
    saveReadingNotes: function () {
      var r = state.rcReading && rec(state.rcReading); if (!r) { flash('Pick a reading first.'); return; }
      var cc = (D.course && D.course.code) || 'Course';
      var L = (LENSES[state.lens] || LENSES.thematic).label, qs = RC_QUESTIONS[state.lens] || RC_QUESTIONS.thematic;
      var sections = qs.map(function (q, i) { return { h: q, t: (state.rcNotes[r.id + '|' + state.lens + '|' + i] || '').trim() }; });
      var mcItems = MC[r.id] || [];
      if (mcItems.length) {
        var ans = 0, cor = 0, miss = [];
        mcItems.forEach(function (m, mi) { var s = state.mcSel[r.id + '|mc|' + mi]; if (s !== undefined && s !== null) { ans++; if (s === m.answer) cor++; else miss.push(mi + 1); } });
        var head = 'Score: ' + cor + ' of ' + mcItems.length + ' correct' + (ans < mcItems.length ? ' (' + ans + ' of ' + mcItems.length + ' answered).' : '.');
        if (ans === mcItems.length) {
          var b = rcBand(cor, mcItems.length); head += '\nWhere you are: ' + b.label + '. ' + b.msg;
          var prof = rcSkillProfile(r.id, mcItems);
          if (prof.has) {
            if (prof.strengths.length) { var cb = (prof.strengths.indexOf(RC_SKILLS.argument) >= 0 && r.coreIdea) ? ' You have the central point, that ' + lcFirst(String(r.coreIdea).replace(/\s*\.?\s*$/, '')) + '.' : ''; head += '\nYour strengths: you read ' + listJoin(prof.strengths) + ' well.' + cb; }
            if (prof.opps.length) { head += '\nAreas of opportunity:'; prof.opps.forEach(function (o) { head += '\n  ' + ucFirst(o.label) + '. ' + (o.whys.length ? o.whys.join(' ') : 'Go back to this in the reading and read for it directly.'); }); }
          } else if (miss.length) head += '\nLook again at ' + numList(miss) + '.';
        }
        sections.push({ h: 'Check your understanding', t: head });
        mcItems.forEach(function (m, mi) {
          var sel = state.mcSel[r.id + '|mc|' + mi];
          var done = (sel !== undefined && sel !== null);
          var chosen = done ? (m.options[sel] || '') : '(not answered)';
          var verdict = !done ? 'Not answered.' : (sel === m.answer ? 'Correct.' : 'Not quite.');
          var t = 'Your answer: ' + chosen + '\n' + verdict;
          if (done && sel !== m.answer) t += ' The correct answer is: ' + (m.options[m.answer] || '') + '.';
          if (m.why) t += '\n' + m.why;
          sections.push({ h: (mi + 1) + '. ' + m.q, t: t });
        });
      }
      senecaDoc(cc, 'Build Your Reading Comprehension', ['Reading: ' + r.title + ' by ' + r.authors, 'Lens: ' + L], sections, cc + '_reading_comprehension');
    },
    saveStudio: function () {
      var cc = courseCode(), w = focusWeek(state.cardWeek), recs = recordsForWeek(w), sections = [], sub = [], sel = state.mcSel[cc + '|studio|' + w], checkQ = '';
      if (cc === 'SOC122') {
        var west = firstWhere(recs, function (r) { return r.eye === 'western'; }), ind = firstWhere(recs, function (r) { return r.eye === 'indigenous'; });
        if (!ind) { flash('Open a week first.'); return; }
        sub = ['Self-Check Studio: Two attributed eyes', 'Week ' + w];
        if (west) sections.push({ h: 'Western eye', t: west.authors + ', ' + west.title + ' (' + west.year + ')\n' + west.coreIdea });
        sections.push({ h: 'Indigenous eye', t: ind.authors + ', ' + ind.title + ' (' + ind.year + ')\n' + ind.coreIdea });
        sections.push({ h: 'Two-Eyed Seeing practice', t: 'Two-Eyed Seeing (Etuaptmumk), named by Mi\'kmaw Elder Albert Marshall. The bridge is the practice you bring, not one the app writes.' });
        checkQ = 'What is most at risk if this is treated as only a Western research-methods question?';
      } else if (cc === 'PSY355') {
        var rp = recs[0] || D.records[0]; if (!rp) { flash('Open a week first.'); return; }
        sub = ['Self-Check Studio: Evidence Transfer Lab', 'Week ' + w];
        sections.push({ h: 'Claim', t: rp.authors + ' (' + rp.year + '): ' + rp.coreIdea });
        sections.push({ h: 'Boundary', t: 'What this does not prove: do not turn it into a rule for every learner; check context, supports, workload, strategy, and evidence first.' });
        sections.push({ h: 'Academic transfer', t: 'One course task, one support, one study strategy, and one sign the strategy is working. No clinical framing.' });
        checkQ = 'Which next step applies the idea responsibly, without blaming the student or overstating the reading?';
      } else if (cc === 'BFS218') {
        var rb = recs[0] || D.records[0]; if (!rb) { flash('Open a week first.'); return; }
        sub = ['Self-Check Studio: Accountability Chain Lab', 'Week ' + w];
        sections.push({ h: 'Source anchor', t: rb.authors + ': ' + rb.coreIdea });
        sections.push({ h: 'Accountability chain', t: 'System or technology, then design or data or default, then the racialized mechanism, then harm and the institutions responsible (not one bad actor), then a response grounded in the readings.' });
        checkQ = 'Which option names the racialized mechanism, not only the outcome or intent?';
      } else { flash('Self-Check Studio save is for the course sites.'); return; }
      if (sel !== undefined && sel !== null) sections.push({ h: 'Quick check', t: 'Q: ' + checkQ + '\nYour answer was ' + (sel === 0 ? 'the grounded one. Correct.' : 'not the grounded one. Look again at what the reading actually claims.') });
      senecaDoc(cc || 'Course', 'Self-Check Studio', sub, sections, (cc || 'Course') + '_self_check_studio');
    },
    runAudit: function () { var m = document.getElementById('soc-main'), top = m ? m.scrollTop : 0; state.auditRun = true; state.auditSystem = 0; state.auditedSystems = state.auditedSystems || {}; state.auditedSystems[GS.systems[0].id] = true; if (!state.auditSlice) state.auditSlice = 'overall'; render(); var m2 = document.getElementById('soc-main'); if (m2) m2.scrollTop = top; },
    nextSystem: function () { var m = document.getElementById('soc-main'), top = m ? m.scrollTop : 0; state.auditSystem = ((state.auditSystem || 0) + 1) % GS.systems.length; state.auditedSystems = state.auditedSystems || {}; state.auditedSystems[auditSys().id] = true; render(); var m2 = document.getElementById('soc-main'); if (m2) m2.scrollTop = top; },
    auditSlice: function (s) { state.auditSlice = s; var b = document.getElementById('bfs-bars'); if (b) b.innerHTML = auditBars(s); var i = document.getElementById('bfs-insight'); if (i) i.textContent = auditInsight(s); var sb = document.getElementById('bfs-slicebtns'); if (sb) sb.outerHTML = auditSliceBtns(s); },
    saveSandbox: function () {
      var gs = rec('buolamwini2018'), sel = state.mcSel['BFS218|sandbox'];
      var sections = [
        { h: 'Systems audited', t: 'Three commercial facial-analysis systems, audited against a benchmark balanced by gender and skin type (Buolamwini and Gebru, Gender Shades, 2018): IBM, Microsoft, and Face++.' },
        { h: 'What the audit found', t: 'Every system failed darker-skinned women the most: 34.7 percent (IBM), 34.5 percent (Face++), and 20.8 percent (Microsoft), against near-zero error for lighter-skinned men. Not one bad product, an industry pattern.' },
        { h: 'Why the bias was hidden', t: 'Overall accuracy and single-axis tests (gender alone, or skin type alone) averaged the harm away. Only looking at gender and skin type together revealed it. That is intersectionality (Crenshaw) and the coded gaze (Buolamwini).' },
        { h: 'Harm and accountability', t: 'These systems are sold as neutral, and they land hardest where they are deployed, in policing and at borders (the OPC and Robertson readings). Accountability sits with the institutions that build, buy, and deploy them, not one programmer. This is the New Jim Code (Benjamin); a response can be grounded in the resistance and design-justice readings (Tanksley, Costanza-Chock).' }
      ];
      if (sel !== undefined && sel !== null) sections.push({ h: 'Quick check', t: 'You named the harm as ' + (sel === 0 ? 'the New Jim Code, built into design and data. Correct.' : 'intent or a one-off bug. Look again: the failure came from how the system was built and tested, not from intent or chance.') });
      senecaDoc('BFS218', 'Bias Audit', ['Audit the coded gaze', (gs ? gs.title : 'Gender Shades') + ' (Buolamwini and Gebru, 2018)'], sections, 'BFS218_bias_audit');
    },
    read: function (id) { var r = rec(id); var u = r && readUrl(r); if (u) { window.open(u, '_blank', 'noopener'); } else { state.screen = 'detail'; state.detailId = id; focusTarget = 'soc-main'; render(); topScroll(); } },
    openSaved: function () { state.screen = 'library'; state.activeTypes = []; state.activeWeek = null; state.search = ''; state.savedView = state.saved.length > 0; flash(state.saved.length ? 'Your saved shelf.' : 'Nothing saved yet. Tap the bookmark on any reading.'); topScroll(); },
    cardWeek: function (v) { state.cardWeek = (v === '' ? null : parseInt(v, 10)); render(); },
    glossWeek: function (v) { state.glossWeek = v; var o = document.getElementById('soc-gout'); if (o) o.innerHTML = glossaryByWeek(v); },
    glossSearch: function (v) { state.glossSearch = v; var o = document.getElementById('soc-gsearchout'); if (o) o.innerHTML = glossarySearchHTML(v); },
    glossWeekGo: function (w) { state.glossWeek = String(w); var sel = document.getElementById('soc-gweek'); if (sel) sel.value = String(w); var o = document.getElementById('soc-gout'); if (o) { o.innerHTML = glossaryByWeek(String(w)); o.scrollIntoView({ behavior: 'smooth', block: 'start' }); } },
    flip: function (el) { var c = el && (el.classList && el.classList.contains('flip') ? el : (el.closest ? el.closest('.flip') : null)); if (c) c.classList.toggle('flipped'); },
  };

  render();
})();
