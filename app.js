/* Haramain Path (first called Umrah Companion): screens and behaviour. Every word of guidance lives in content.js.
   Routes are plain names (#home, #stage-5, #count-tawaf) so they also work inside the private preview page. */
(function () {
  'use strict';
  var C = window.UMRAH_CONTENT, ENV = window.UMRAH_ENV || {};
  var KEY = 'umrahCompanion.v1';
  var DEF = { setup: false, gender: '', school: '', route: '', date: '', size: 0, checks: {}, read: {}, done: {}, live: false, tawaf: 0, sai: 0, duas: [], card: {}, masjid: '', mapMode: '3d', plan: {}, docs: [], hotel: {}, purpose: '' };
  function fresh() { return JSON.parse(JSON.stringify(DEF)); }

  /* Everything the pilgrim enters stays on this phone (localStorage). Nothing is sent anywhere. */
  var S = fresh();
  try {
    var raw = window.localStorage.getItem(KEY);
    if (raw) {
      var o = JSON.parse(raw) || {};
      Object.keys(DEF).forEach(function (k) {
        if (o[k] != null && typeof o[k] === typeof DEF[k] && Array.isArray(o[k]) === Array.isArray(DEF[k])) S[k] = o[k];
      });
    }
  } catch (e) { S = fresh(); }
  /* someone who had already marked steps as done is in the middle of their Umrah */
  if (!S.live && Object.keys(S.done).length) S.live = true;
  function save() { try { window.localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  var R = { route: 'home', ask: '', lastTap: 0, map: null, layers: { gate: true, lesson: true, wudu: true, help: true }, day: {}, redraw: null };
  var view = document.getElementById('view'), tabs = document.getElementById('tabs'), toastEl = document.getElementById('toast');
  var TOTAL = C.stages.length;
  var CHECK = '<svg class="ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var PLAY = '<svg class="pl" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var TABS_UMRAH = [['home', 'Home'], ['umrah', 'Umrah'], ['classes', 'Classes'], ['maps', 'Maps']];
  var TABS_CLASSES = [['home', 'Home'], ['classes', 'Classes'], ['maps', 'Maps']];
  var ROUTE = /^(home|prepare|prep-duas|prep-card|learn|perform|help|card|setup|maps|map-makkah|map-madinah|lessons-makkah|lessons-madinah|floors-makkah|plan|prep-docs|doc-\d+|count-tawaf|count-sai|duas|teacher-makkah-\d+|teacher-madinah-\d+|lesson-[a-z]+|read-\d+|stage-\d+|details-\d+|where-\d+|umrah|steps|help-[a-z]+)$/;

  /* ---------- small helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function stage(n) { for (var i = 0; i < C.stages.length; i++) if (C.stages[i].id === n) return C.stages[i]; return null; }
  function forMe(x) { return !x.who || !S.gender || x.who === S.gender; }
  function chkItems() { var out = []; C.checklist.forEach(function (g) { g.items.forEach(function (it) { if (forMe(it)) out.push(it); }); }); return out; }
  function doneCount() { return C.stages.filter(function (s) { return S.done[s.id]; }).length; }
  function nextStage() { for (var i = 0; i < C.stages.length; i++) if (!S.done[C.stages[i].id]) return C.stages[i].id; return 0; }
  function daysLeft() {
    var p = String(S.date || '').split('-'); if (p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2]), n = new Date(), t = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    return isNaN(d) ? null : Math.round((d - t) / 86400000);
  }
  function labelOf(s) { var l = s.l; if (l && typeof l === 'object') l = l[S.school || 'unsure'] || l.unsure; return l || 'tip'; }
  function noteOf(x) { if (!x.sch) return ''; var k = S.school; return (k && k !== 'unsure') ? (x.sch[k] || '') : (x.sch.all || ''); }
  function visible(s) { return forMe(s) && (!s.onlyRoute || s.onlyRoute.indexOf(S.route) >= 0); }
  function details() { return [S.gender === 'm' ? 'Man' : S.gender === 'f' ? 'Woman' : '', C.schools[S.school], C.routes[S.route]].filter(Boolean).join(' · '); }
  function pairs(o) { return Object.keys(o).map(function (k) { return [k, o[k]]; }); }
  function toast(m) { toastEl.textContent = m; toastEl.className = 'show'; clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.className = ''; }, 2800); }
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

  /* ---------- pictures: real photographs of the places, and the teachers' official portraits ---------- */
  var MEDIA = window.UMRAH_MEDIA || { photos: {}, teachers: [], basemap: {} };
  var STAGE_PIC = { 1: 'ihram', 2: 'miqat', 4: 'gate', 5: 'kaaba', 6: 'maqam', 7: 'zamzam', 8: 'safa' };
  var STEP_PIC = { 'Start at the Black Stone': 'blackstone', 'Between the Yemeni corner and the Black Stone': 'yemeni', 'Walk towards Maqam Ibrahim': 'maqam',
    'On Safa': 'safa', 'On Marwah': 'marwah', 'Jog between the green lights': 'masaa', 'Between the green lights': 'masaa', 'Wear the two ihram cloths': 'ihram', 'Drink Zamzam water': 'zamzam' };
  var CUR_PIC = '';
  function hasPic(n) { return !!(n && MEDIA.photos[n]); }
  function pic(n, cls, alt) {
    return hasPic(n) ? '<img class="' + cls + '" src="p-' + n + '.jpg" alt="' + esc(alt || MEDIA.photos[n].what || '') + '" loading="lazy">' : '';
  }
  function face(m, id, cls) {
    return MEDIA.teachers.indexOf(m + '-' + id) >= 0 ? '<img class="' + (cls || 'face') + '" src="t-' + m + '-' + id + '.jpg" alt="" loading="lazy">' : '<span class="' + (cls || 'face') + ' none"></span>';
  }

  /* ---------- shared pieces ---------- */
  function top(title, back, sub) {
    return '<header class="top">' + (back ? '<button class="back" data-go="' + back + '">‹ Back</button>' : '') +
      '<h1>' + esc(title) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</header>';
  }
  function chk(on, t, n, attrs) {
    return '<button class="chk" role="checkbox" aria-checked="' + on + '" ' + attrs + '><span class="box">' + (on ? CHECK : '') + '</span>' +
      '<span class="ct"><b>' + esc(t) + '</b>' + (n ? '<small>' + esc(n) + '</small>' : '') + '</span></button>';
  }
  function ask(key, label, question, yes) {
    if (R.ask !== key) return '<button class="btn ghost" data-act="ask" data-k="' + key + '">' + esc(label) + '</button>';
    return '<div class="card"><h3>' + esc(question) + '</h3><div class="two"><button class="btn ghost" data-act="ask" data-k="">No</button>' +
      '<button class="btn" data-act="yes" data-k="' + key + '">' + esc(yes) + '</button></div></div>';
  }
  function duaHTML(k) {
    var d = C.duas[k]; if (!d) return '';
    return '<div class="dua"><p class="ar" lang="ar" dir="rtl">' + esc(d.ar) + '</p><p class="tr">' + esc(d.tr) + '</p><p class="en">' + esc(d.en) + '</p>' +
      '<div class="df"><button class="listen" data-act="listen">' + PLAY + 'Listen</button><span class="src">' + esc(d.src) + '</span></div></div>';
  }
  function stepHTML(s) {
    var l = labelOf(s), txt = s.route ? (s.route[S.route] || s.route.road) : s.t, note = noteOf(s);
    var src = s.routeSrc ? (s.routeSrc[S.route] || s.routeSrc.road) : s.src;
    return '<article class="step"><div class="sh"><span class="lab ' + l + '">' + esc(C.labels[l]) + '</span>' +
      (s.who ? '<span class="who">' + (s.who === 'm' ? 'For men' : 'For women') + '</span>' : '') + '</div>' +
      '<h3>' + esc(s.h) + '</h3>' + (STEP_PIC[s.h] && STEP_PIC[s.h] !== CUR_PIC ? pic(STEP_PIC[s.h], 'steppic', s.h) : '') + (txt ? '<p>' + esc(txt) + '</p>' : '') + (s.dua ? duaHTML(s.dua) : '') +
      (note ? '<p class="sn">' + esc(note) + '</p>' : '') + (src ? '<p class="src">Source: ' + esc(src) + '</p>' : '') + '</article>';
  }
  function legend() {
    return '<div class="legend">' + C.legend.map(function (x) { return '<div><span class="lab ' + x[0] + '">' + esc(C.labels[x[0]]) + '</span><span>' + esc(x[1]) + '</span></div>'; }).join('') + '</div>';
  }
  var WHENS = [['any', 'Any time'], ['tawaf', 'During tawaf'], ['rakah', 'After the two rak‘ahs'], ['zamzam', 'When drinking Zamzam'], ['safa', 'On Safa and Marwah'], ['sai', 'During sa‘i'], ['rawdah', 'In the Rawdah'], ['sujud', 'In sujud and after prayers']];
  var STAGE_WHEN = { 5: ['tawaf'], 6: ['rakah'], 7: ['zamzam'], 8: ['safa', 'sai'] };
  function whenName(w) { for (var i = 0; i < WHENS.length; i++) if (WHENS[i][0] === w) return WHENS[i][1]; return ''; }
  /* the pilgrim's own duas for the place they are at now: the ones chosen for this moment first, then the any-time ones */
  function myDuas(keys) {
    var rows = [];
    S.duas.forEach(function (d, i) { if (!d.done) { var w = d.w || 'any', here = keys && keys.indexOf(w) >= 0; if (here || w === 'any' || !keys) rows.push([here ? 0 : 1, i, d]); } });
    if (!rows.length) return '';
    rows.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    return '<div class="card"><h3>' + (keys ? 'My duas for this moment' : 'My dua list') + '</h3><div class="rows">' + rows.map(function (r) {
      return '<div class="item">' + chk(false, r[2].t, r[0] === 0 ? whenName(r[2].w) : '', 'data-act="dua-tick" data-i="' + r[1] + '"') + '</div>';
    }).join('') + '</div><p class="hint">Tick a dua once you have made it. You can make dua at any time and in any language.</p><button class="btn ghost small" data-go="duas">All my duas</button></div>';
  }

  /* ---------- route maps: each one is drawn on the real map of the Masjid, so the shapes and distances are true ---------- */
  var KB = { c: [661.1, 727.4], stone: [668.9, 729.7], yemeni: [660.5, 735.4], hijr: [655.6, 717.6], maqam: [674.6, 720.7], light: [729.5, 752.8], safa: [790.7, 806.9], marwah: [759.6, 433.3] };
  function f1(v) { return (+v).toFixed(1); }
  function rmap(box, label, inner, bar) {
    var dark = isDark(), c = dark ? PAL.night : PAL.day, u = box[2] / 100, x = box[0], y = box[1], w = box[2], h = box[3];
    var by = y + h - 5 * u, bx = x + 5 * u;
    return '<svg class="rmap" viewBox="' + box.join(' ') + '" role="img" aria-label="' + esc(label) + '">' +
      '<defs><marker id="rm-a" markerWidth="4.4" markerHeight="4.4" refX="2.6" refY="2.2" orient="auto"><path d="M0 0L4.4 2.2L0 4.4Z" fill="' + c.gold + '"/></marker>' +
      '<marker id="rm-b" markerWidth="4.4" markerHeight="4.4" refX="2.6" refY="2.2" orient="auto"><path d="M0 0L4.4 2.2L0 4.4Z" fill="' + (dark ? '#7FCBA2' : '#1B5A43') + '"/></marker></defs>' +
      baseSVG('makkah', dark) + '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c.land + '" fill-opacity="0.22"/>' + inner(u, c, dark) +
      '<g font-family="Inter, Arial, sans-serif" font-weight="700" font-size="' + f1(3 * u) + '" fill="' + c.text + '" stroke="' + c.halo + '" stroke-width="' + f1(0.9 * u) + '" paint-order="stroke" stroke-linejoin="round">' +
      '<path d="M' + f1(bx) + ' ' + f1(by) + 'h' + bar + '" fill="none" stroke="' + c.text + '" stroke-width="' + f1(0.7 * u) + '" paint-order="normal"/><text x="' + f1(bx + bar / 2) + '" y="' + f1(by - 2.2 * u) + '" text-anchor="middle">' + bar + ' m</text>' +
      '<text x="' + f1(x + w - 6 * u) + '" y="' + f1(y + 8.5 * u) + '" text-anchor="middle">N</text><path d="M' + f1(x + w - 6 * u) + ' ' + f1(y + 2 * u) + 'l' + f1(1.6 * u) + ' ' + f1(3 * u) + 'h' + f1(-3.2 * u) + 'Z" fill="' + c.text + '" stroke="none"/></g></svg>';
  }
  function medal(x, y, n, u, c) {
    return '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(4.3 * u) + '" fill="' + c.halo + '"/><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(3.6 * u) + '" fill="' + c.gold + '"/><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(2.9 * u) + '" fill="none" stroke="' + c.halo + '" stroke-width="' + f1(0.3 * u) + '"/>' +
      '<text x="' + f1(x) + '" y="' + f1(y) + '" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="' + f1(3.9 * u) + '" text-anchor="middle" dominant-baseline="central" fill="' + (c === PAL.night ? '#06140E' : '#FFFFFF') + '">' + n + '</text>';
  }
  function tag(x, y, t, u, c, anchor, small) {
    return '<text x="' + f1(x) + '" y="' + f1(y) + '" font-family="Marcellus, Georgia, serif" font-size="' + f1((small ? 3.5 : 4.4) * u) + '" text-anchor="' + (anchor || 'middle') + '" dominant-baseline="central" fill="' + (c === PAL.night ? '#F4EFE2' : '#16261F') + '" stroke="' + c.halo + '" stroke-width="' + f1(1.1 * u) + '" stroke-linejoin="round" paint-order="stroke">' + esc(t) + '</text>';
  }
  function way(d, u, c, col, mk, dash) {
    return '<path d="' + d + '" fill="none" stroke="' + c.halo + '" stroke-width="' + f1(2.6 * u) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + (col || c.gold) + '" stroke-width="' + f1(1.25 * u) + '" stroke-linecap="round" stroke-linejoin="round"' + (dash ? ' stroke-dasharray="' + f1(0.2 * u) + ' ' + f1(2.6 * u) + '"' : '') + (mk ? ' marker-end="url(#' + mk + ')"' : '') + '/>';
  }
  function stops(list) {
    return '<ol class="stops">' + list.map(function (s) {
      var body = '<span class="sn">' + s[0] + '</span><span class="ct"><b>' + esc(s[1]) + '</b><small>' + esc(s[2]) + '</small></span>' + (s[3] ? pic(s[3], 'sp', s[1]) : '');
      return s[4] ? '<li><button class="stopb" data-go="' + s[4] + '">' + body + '</button></li>' : '<li>' + body + '</li>';
    }).join('') + '</ol>';
  }
  function tawafRing(u, c, r) {
    /* around the Ka'bah with it on your left: on a map with north at the top that is east, north, west, south */
    var k = KB.c, a0 = Math.atan2(KB.stone[1] - k[1], KB.stone[0] - k[0]), h = '', i;
    for (i = 0; i < 4; i++) {
      var a = a0 - i * Math.PI / 2, b = a - Math.PI / 2 + 0.16;
      h += way('M' + f1(k[0] + r * Math.cos(a)) + ' ' + f1(k[1] + r * Math.sin(a)) + 'A' + r + ' ' + r + ' 0 0 0 ' + f1(k[0] + r * Math.cos(b)) + ' ' + f1(k[1] + r * Math.sin(b)), u, c, null, 'rm-a');
    }
    return h;
  }
  var PLAN = {
    tawaf: function () {
      var S4 = [[1, KB.stone, 'Black Stone'], [2, KB.maqam, 'Maqam Ibrahim'], [3, KB.hijr, 'The Hijr'], [4, KB.yemeni, 'Yemeni corner']];
      return rmap([576, 642, 170, 170], 'Map of tawaf around the Ka‘bah, with the start line at the Black Stone corner and four places to know.', function (u, c, dark) {
        var k = KB.c, dx = KB.light[0] - KB.stone[0], dy = KB.light[1] - KB.stone[1], L = Math.hypot(dx, dy), ex = KB.stone[0] + dx / L * 60, ey = KB.stone[1] + dy / L * 60, green = dark ? '#7FCBA2' : '#1B5A43';
        var h = '<circle cx="' + k[0] + '" cy="' + k[1] + '" r="36" fill="' + c.gold + '" fill-opacity="0.10"/>' + tawafRing(u, c, 36);
        h += way('M' + f1(KB.stone[0]) + ' ' + f1(KB.stone[1]) + 'L' + f1(ex) + ' ' + f1(ey), u, c, green, '', true) + tag(ex + 2 * u, ey + 5 * u, 'Start line', u, c, 'middle', true);
        S4.forEach(function (s) {
          var a = Math.atan2(s[1][1] - k[1], s[1][0] - k[0]) + (s[0] === 1 ? 0.5 : s[0] === 2 ? -0.25 : 0), mx = k[0] + 57 * Math.cos(a), my = k[1] + 57 * Math.sin(a);
          h += '<path d="M' + f1(s[1][0]) + ' ' + f1(s[1][1]) + 'L' + f1(mx) + ' ' + f1(my) + '" stroke="' + c.halo + '" stroke-width="' + f1(1.3 * u) + '"/><path d="M' + f1(s[1][0]) + ' ' + f1(s[1][1]) + 'L' + f1(mx) + ' ' + f1(my) + '" stroke="' + c.gold + '" stroke-width="' + f1(0.5 * u) + '"/>' +
            '<circle cx="' + f1(s[1][0]) + '" cy="' + f1(s[1][1]) + '" r="' + f1(1.1 * u) + '" fill="' + c.gold + '" stroke="' + c.halo + '" stroke-width="' + f1(0.4 * u) + '"/>' + medal(mx, my, s[0], u, c) +
            tag(mx, my + (Math.sin(a) < -0.3 ? -7 : 7.4) * u, s[2], u, c, 'middle', true);
        });
        return h + tag(k[0] - 46, k[1] + 62, 'Mataf', u, c, 'middle', true);
      }, 20) + stops([
        [1, 'The Black Stone corner', 'Every round starts and ends level with this corner. A green light on the wall of the Masjid, far behind it, marks the same line.', 'blackstone'],
        [2, 'Maqam Ibrahim', 'The gold and glass case a few steps from the door of the Ka‘bah. The crowd flows around it.', 'maqam'],
        [3, 'The Hijr', 'The low curved wall beside the Ka‘bah. Walk around the outside of it.', ''],
        [4, 'The Yemeni corner', 'The last corner before the Black Stone.', 'yemeni']]);
    },
    sai: function () {
      return rmap([610, 388, 250, 462], 'Map of sa‘i. Laps go from Safa north to Marwah and back. The green lights are nearer to Safa.', function (u, c, dark) {
        var a = KB.safa, b = KB.marwah, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, o = 7, green = dark ? '#7FCBA2' : '#1B5A43';
        function at(t, off) { return [a[0] + dx * t + nx * off, a[1] + dy * t + ny * off]; }
        function seg(t0, t1, off) { var p = at(t0, off), q = at(t1, off); return 'M' + f1(p[0]) + ' ' + f1(p[1]) + 'L' + f1(q[0]) + ' ' + f1(q[1]); }
        var g0 = at(0.2, -15), g1 = at(0.345, -15), g2 = at(0.345, 15), g3 = at(0.2, 15), mid = at(0.27, 0), up = at(0.66, -o - 3), dn = at(0.66, o + 3);
        var h = '<path d="M' + [g0, g1, g2, g3].map(function (p) { return f1(p[0]) + ' ' + f1(p[1]); }).join('L') + 'Z" fill="' + green + '" fill-opacity="0.34" stroke="' + green + '" stroke-width="' + f1(0.5 * u) + '"/>';
        h += way(seg(0.04, 0.95, -o), u, c, null, 'rm-a') + way(seg(0.96, 0.05, o), u, c, green, 'rm-b');
        h += medal(a[0], a[1] + 6 * u, 1, u, c) + tag(a[0], a[1] + 13.5 * u, 'Safa', u, c) + medal(mid[0] + 25, mid[1], 2, u, c) + tag(mid[0] + 25, mid[1] + 7.6 * u, 'Green lights', u, c, 'middle', true) +
          medal(b[0], b[1] - 6 * u, 3, u, c) + tag(b[0], b[1] - 13.5 * u, 'Marwah', u, c);
        h += tag(up[0] - 3, up[1], 'Laps 1, 3, 5, 7', u, c, 'end', true) + tag(dn[0] + 3, dn[1] + 22, 'Laps 2, 4, 6', u, c, 'start', true);
        return h + tag(KB.c[0], KB.c[1] + 16, 'Ka‘bah', u, c, 'middle', true) + tag(650, 600, 'Masjid al-Haram', u, c, 'middle', true);
      }, 50) + stops([
        [1, 'Safa', 'Start here. The bare rock of the hill is kept behind a rail at the south end of the long hall.', 'safa'],
        [2, 'The green lights', 'Green lights on the ceiling and walls mark this stretch. Its place on this map is approximate.', 'masaa'],
        [3, 'Marwah', 'The north end. Lap one ends here, and so does lap seven.', 'marwah']]);
    },
    enter: function () {
      return rmap([398, 382, 460, 528], 'Map of Masjid al-Haram with its main gates and the mataf in the middle.', function (u, c, dark) {
        var h = '', k = KB.c, named = { '1': [0, 6.2, 'middle'], '79': [-3, -6.2, 'start'], '62': [0, -6.2, 'middle'], '100': [0, -6.2, 'middle'], '25': [-4.5, 0, 'end'] };
        pinsOf('makkah').forEach(function (p) {
          if (p.k !== 'gate' || (p.z || 1) !== 1) return;
          var n = String(p.r).split(',')[0], nm = named[n];
          if (nm) { var dx = k[0] - p.x, dy = k[1] - p.y, L = Math.hypot(dx, dy); h += way('M' + f1(p.x + dx / L * 14) + ' ' + f1(p.y + dy / L * 14) + 'L' + f1(k[0] - dx / L * 50) + ' ' + f1(k[1] - dy / L * 50), u, c, null, 'rm-a', true); }
        });
        h += '<circle cx="' + k[0] + '" cy="' + k[1] + '" r="40" fill="' + c.gold + '" fill-opacity="0.14" stroke="' + c.gold + '" stroke-width="' + f1(0.5 * u) + '"/>' + tag(k[0], k[1] + 26, 'Mataf', u, c, 'middle', true);
        pinsOf('makkah').forEach(function (p) {
          if (p.k !== 'gate' || (p.z || 1) !== 1) return;
          var n = String(p.r).split(',')[0], nm = named[n];
          h += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + f1(2.9 * u) + '" fill="' + (dark ? '#7FCBA2' : '#1B5A43') + '" stroke="' + c.halo + '" stroke-width="' + f1(0.5 * u) + '"/><text x="' + p.x + '" y="' + p.y + '" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="' + f1((n.length > 1 ? 2.9 : 3.4) * u) + '" text-anchor="middle" dominant-baseline="central" fill="' + (dark ? '#06140E' : '#FFFFFF') + '">' + esc(n) + '</text>';
          if (nm) h += tag(p.x + nm[0] * u, p.y + nm[1] * u, p.n, u, c, nm[2], true);
        });
        return h;
      }, 100) + stops([
        ['1', 'King Abdulaziz Gate', 'On the south side, facing the Clock Tower.', 'gate'],
        ['79', 'King Fahd Gate', 'On the west side, the way in from the King Fahd expansion.', ''],
        ['62', 'Umrah Gate', 'On the north-west side.', ''],
        ['100', 'King Abdullah Gate', 'On the north side, into the newest expansion.', ''],
        ['25', 'Marwah Gate', 'At the north end of the mas‘a, where sa‘i finishes.', '']]);
    },
    journey: function () {
      return rmap([398, 382, 460, 528], 'Map of the whole Umrah inside Masjid al-Haram: in through a gate, tawaf, two rak‘ahs, then sa‘i from Safa to Marwah.', function (u, c, dark) {
        var k = KB.c, g = [626.0, 890.4], h = '';
        h += way('M' + f1(g[0]) + ' ' + f1(g[1] - 14) + 'L' + f1(k[0] - 8) + ' ' + f1(k[1] + 46), u, c, null, 'rm-a', true);
        h += '<circle cx="' + k[0] + '" cy="' + k[1] + '" r="34" fill="' + c.gold + '" fill-opacity="0.12"/>' + tawafRing(u * 0.8, c, 34);
        h += way('M' + f1(k[0] + 40) + ' ' + f1(k[1] + 22) + 'L' + f1(KB.safa[0] - 16) + ' ' + f1(KB.safa[1] - 8), u, c, null, 'rm-a', true);
        h += way('M' + f1(KB.safa[0] - 4) + ' ' + f1(KB.safa[1] - 16) + 'L' + f1(KB.marwah[0] + 1) + ' ' + f1(KB.marwah[1] + 20), u, c, null, 'rm-a');
        h += medal(g[0], g[1], 4, u, c) + tag(g[0], g[1] + 7.4 * u, 'Enter', u, c, 'middle', true) + medal(k[0] - 60, k[1], 5, u, c) + tag(k[0] - 60, k[1] + 7.4 * u, 'Tawaf', u, c, 'middle', true) +
          medal(k[0] + 22, k[1] - 50, 6, u, c) + tag(k[0] + 22, k[1] - 50 - 7 * u, 'Two rak‘ahs', u, c, 'middle', true) +
          medal(KB.safa[0] + 4, KB.safa[1] + 14, 8, u, c) + tag(KB.safa[0] + 4, KB.safa[1] + 14 + 7.4 * u, 'Sa‘i starts at Safa', u, c, 'middle', true) +
          medal(KB.marwah[0] + 6, KB.marwah[1] - 4, 9, u, c) + tag(KB.marwah[0] + 6, KB.marwah[1] - 4 - 7 * u, 'Ends at Marwah', u, c, 'middle', true);
        return h;
      }, 100);
    }
  };

  /* ---------- welcome / your details ---------- */
  function opts(name, list) {
    return '<div class="opts">' + list.map(function (o) {
      return '<button class="opt" data-act="set" data-k="' + name + '" data-v="' + o[0] + '" aria-pressed="' + (S[name] === o[0]) + '">' + esc(o[1]) + '</button>';
    }).join('') + '</div>';
  }
  var PURPOSES = [['umrah', 'Performing Umrah', 'The steps, what to prepare, and where to go'], ['classes', 'Attending classes', 'Who is teaching, where and when'], ['both', 'Both', 'My Umrah and the classes']];
  function forClasses() { return S.purpose === 'classes'; }
  /* the Umrah screens fit themselves to three answers; a class visitor who opens one is asked for them */
  function askThree() { return S.gender && S.school && S.route ? '' : '<div class="card"><h3>Make the steps fit you</h3><p>Answer three short questions and the guide shows what applies to you.</p><button class="btn small" data-act="purpose-both">Answer them</button></div>'; }
  function vSetup() {
    var h = top(S.setup ? 'Your details' : 'Assalamu alaykum', S.setup ? 'home' : '', S.setup ? 'Change any answer' : 'Welcome') + '<section class="pad">';
    var pur = S.purpose || (S.setup ? 'both' : '');
    if (!S.setup) h += '<p class="lead">A few taps, so you only see what applies to you. You can change this at any time.</p>';
    if (!S.setup) h += '<p class="draft">' + esc(C.draftNote) + '</p>';
    h += '<h2 class="q">What brings you here?</h2><div class="whys">' + PURPOSES.map(function (x) { return '<button class="opt why" data-act="set" data-k="purpose" data-v="' + x[0] + '" aria-pressed="' + (pur === x[0]) + '"><b>' + x[1] + '</b><small>' + x[2] + '</small></button>'; }).join('') + '</div>';
    if (pur && pur !== 'classes') {
    h += '<h2 class="q">I am a</h2>' + opts('gender', [['m', 'Man'], ['f', 'Woman']]);
    h += '<h2 class="q">My school of fiqh</h2>' + opts('school', pairs(C.schools));
    h += '<h2 class="q">My journey</h2>' + opts('route', pairs(C.routes));
    h += '<label class="q" for="f-date">Date of my Umrah <span class="optn">optional</span></label><input type="date" id="f-date" value="' + esc(S.date) + '">';
    }
    h += '<button class="btn" data-act="setup-done">' + (S.setup ? 'Save' : 'Start') + '</button>';
    if (S.setup) h += ask('erase', 'Erase everything on this phone', 'Erase your answers, checklist, dua list and hotel card?', 'Yes, erase');
    return h + '</section>';
  }

  /* ---------- home ---------- */
  function tile(to, n, t, s, pct) {
    var ph = { prepare: 'miqat', umrah: 'kaaba', 'prep-docs': 'babsalam', maps: 'nabawi' }[to] || (to.indexOf('lessons') === 0 ? 'umbrellas' : to === 'duas' ? 'rawdah' : '');
    return '<button class="tile' + (hasPic(ph) ? ' pic' : '') + '" data-go="' + to + '">' + pic(ph, 'tpic', '') + '<span class="tn">' + n + '</span><b>' + t + '</b><small>' + esc(s) + '</small>' +
      (pct == null ? '' : '<span class="tbar"><i style="width:' + Math.round(100 * pct) + '%"></i></span>') + '</button>';
  }
  function ring(pct, big, small) {
    var c = 2 * Math.PI * 42, off = c * (1 - Math.max(0, Math.min(1, pct)));
    return '<div class="ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="rt" cx="50" cy="50" r="42"/><circle class="rp" cx="50" cy="50" r="42" stroke-dasharray="' + c.toFixed(1) +
      '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 50 50)"/></svg><div class="rc"><b>' + esc(big) + '</b>' + (small ? '<small>' + esc(small) + '</small>' : '') + '</div></div>';
  }
  function todayCard() {
    var rows = '';
    ['makkah', 'madinah'].forEach(function (m) {
      var D = LES.masjid[m], ds = D ? days(m) : [], d0 = ds.length && ds[0].i === 0 ? ds[0] : null, line = 'No lessons are listed for today';
      if (d0) {
        var L = D.lessons.filter(function (x) { return x.d === d0.key; }), T = prayerTimes(m, d0.date), now = Date.now(), pick = null, on = false;
        L.forEach(function (x) {
          if (pick || !T) return;
          var w = slotWindow(x.s, T);
          if (now <= w[1]) { pick = x; on = now >= w[0]; }
        });
        line = pick ? (on ? 'On now: ' : 'Next, after ' + pick.s.charAt(0).toUpperCase() + pick.s.slice(1) + ': ') + (pick.en || pick.ar) : 'Today’s lessons have finished';
      }
      rows += '<button class="rowb" data-go="lessons-' + m + '"><span class="ct"><small>' + CITY[m] + (d0 ? ' · ' + d0.n + (d0.n === 1 ? ' lesson today' : ' lessons today') : '') + '</small><b>' + esc(line) + '</b></span><span class="chev">›</span></button>';
    });
    return '<h2 class="gh">Today in the two masajid</h2><div class="rows">' + rows + '</div>';
  }
  /* today's classes that have not finished, in both masajid, soonest first; if none are left, the next listed day */
  function comingClasses() {
    var now = Date.now(), today = [], later = [];
    ['makkah', 'madinah'].forEach(function (m) {
      var D = LES.masjid[m]; if (!D) return;
      days(m).forEach(function (d) {
        if (d.i < 0 || !d.date) return;
        var T = prayerTimes(m, d.date); if (!T) return;
        D.lessons.forEach(function (x) {
          if (x.d !== d.key) return;
          var w = slotWindow(x.s, T);
          if (w[1] < now) return;
          (d.i === 0 ? today : later).push({ m: m, x: x, d: d, a: w[0], on: now >= w[0], at: T[x.s] });
        });
      });
    });
    function by(p, q) { return p.a - q.a; }
    today.sort(by); later.sort(by);
    if (today.length) return { today: true, list: today };
    var first = later.length ? later[0].d.i : -1;
    return { today: false, list: later.filter(function (e) { return e.d.i === first; }) };
  }
  function classRow(e) {
    var D = LES.masjid[e.m], t = D.teachers[e.x.t] || {};
    return '<button class="rowb haspic" data-go="lessons-' + e.m + '">' + face(e.m, e.x.t, 'face') + '<span class="ct"><small>' + CITY[e.m] + ' · ' + (e.on ? 'on now' : 'after ' + e.x.s.charAt(0).toUpperCase() + e.x.s.slice(1)) + '</small><b>' + esc(e.x.en || e.x.ar) + '</b><small>' + esc(t.en || t.ar || '') + '</small></span><span class="chev">›</span></button>';
  }
  function homeTail(label) {
    return '<div class="me"><div class="line"><p>' + esc(label) + '</p><button class="btn ghost small" data-go="setup">Change</button></div>' +
      '<div class="line"><p>Text size</p><div class="sz">' + [0, 1, 2].map(function (i) {
        return '<button class="s' + i + '" data-act="size" data-v="' + i + '" aria-pressed="' + (S.size === i) + '" aria-label="' + ['Normal text', 'Large text', 'Largest text'][i] + '">A</button>';
      }).join('') + '</div></div></div>';
  }
  function vHomeClasses() {
    var C2 = comingClasses(), e = C2.list[0], n = planCount();
    var h = '<header class="top home"><p>Assalamu alaykum</p><h1>Haramain Path</h1><p class="tagl">Classes in Makkah and Madinah</p></header><section class="pad homepad">';
    if (e) {
      var D = LES.masjid[e.m], t = D.teachers[e.x.t] || {}, p = D.places[e.x.p] || {};
      h += '<div class="hero nextclass">' + face(e.m, e.x.t, 'bigface') + '<p class="hk">' + (e.on ? 'On now in ' : C2.today ? 'Next today in ' : e.d.label + ' in ') + CITY[e.m] + '</p><p class="hb">' + esc(e.x.en || e.x.ar) + '</p>' +
        '<p><b>' + esc(t.en || t.ar || '') + '</b></p><p>' + esc(p.en || p.ar || '') + '</p><p class="hs">After ' + e.x.s.charAt(0).toUpperCase() + e.x.s.slice(1) + ', about ' + esc(clock(e.at)) + ' Saudi time · ' + esc(e.x.lang) + '</p>' +
        (p.lat ? '<button class="btn gold" data-act="show-place" data-m="' + e.m + '" data-p="' + esc(e.x.p) + '">Show me where</button>' : '') +
        '<button class="lnk" data-go="lessons-' + e.m + '">All ' + CITY[e.m] + ' classes and the calendar</button></div>';
    } else h += '<div class="hero nextclass"><p class="hb">No upcoming classes are saved</p><p class="hs">' + 'The next timetable has not arrived yet.' + '</p><button class="btn gold" data-go="lessons-makkah">Open the timetable</button></div>';
    var rest = C2.list.slice(1, 5);
    if (rest.length) h += '<h2 class="gh">' + (C2.today ? 'Later today' : 'Also that day') + '</h2><div class="rows">' + rest.map(classRow).join('') + '</div>';
    h += '<button class="rowb solo" data-go="plan"><span class="ct"><b>My classes</b><small>' + (n ? n + ' chosen. Add them to your calendar' : 'Pick the classes you want to attend') + '</small></span><span class="chev">›</span></button>';
    h += '<div class="tiles">' + tile('lessons-makkah', '01', 'Makkah', 'Timetable and calendar') + tile('lessons-madinah', '02', 'Madinah', 'Timetable and calendar') + tile('maps', '03', 'Maps', 'Class spots and gates') + tile('duas', '04', 'My duas', S.duas.length ? S.duas.filter(function (x) { return !x.done; }).length + ' still to make' : 'Write them here') + '</div>';
    h += '<button class="rowb solo" data-go="help"><span class="ct"><b>Help</b><small>What to do when something goes wrong</small></span><span class="chev">›</span></button>';
    h += '<button class="rowb solo" data-act="purpose-both"><span class="ct"><b>Performing Umrah too?</b><small>Add the Umrah guide to your home screen</small></span><span class="chev">›</span></button>';
    return h + homeTail('Here for the classes') + '<p class="draft">' + esc(C.draftNote) + '</p></section>';
  }
  function vHome() {
    if (forClasses()) return vHomeClasses();
    var items = chkItems(), cd = items.filter(function (i) { return S.checks[i.id]; }).length;
    var seen = C.stages.filter(function (x) { return S.read['s' + x.id]; }).length;
    var dn = doneCount(), nx = nextStage(), d = daysLeft(), ready = (cd + seen) / Math.max(1, items.length + TOTAL);
    var kick = 'Your journey', big, small, btn = 'Continue', to = '', pct = ready, rb = Math.round(ready * 100) + '%', rs = 'ready';
    if ((dn || S.live) && nx) { kick = 'You are here'; big = 'Step ' + nx + ': ' + stage(nx).title; small = 'Carry on from where you stopped.'; to = 'stage-' + nx; pct = dn / TOTAL; rb = dn + '/' + TOTAL; rs = 'steps'; }
    else if (dn) { kick = 'Alhamdulillah'; big = 'Umrah complete'; small = 'May Allah accept it from you.'; pct = 1; rb = TOTAL + '/' + TOTAL; rs = 'steps'; }
    else {
      big = d === 0 ? 'Your Umrah is today' : d === 1 ? 'Your Umrah is tomorrow' : 'Prepare for your Umrah';
      if (d != null && d > 1) { rb = String(d); rs = 'days to go'; }
      if (d != null && d <= 0) { small = 'When you set out, start at step 1.'; btn = 'Open the steps'; to = 'umrah'; }
      else if (cd < items.length) { small = 'Next: your checklist, ' + cd + ' of ' + items.length + ' done.'; to = 'prepare'; }
      else if (seen < TOTAL) { small = 'Next: read the steps, ' + seen + ' of ' + TOTAL + ' read.'; to = 'umrah'; }
      else { small = 'You are ready. Start when you set out.'; btn = 'Open the steps'; to = 'umrah'; }
    }
    var h = '<header class="top home"><p>Assalamu alaykum</p><h1>Haramain Path</h1><p class="tagl">Umrah guide, maps and today’s classes</p></header><section class="pad homepad">';
    h += '<div class="hero">' + ring(pct, rb, rs) + '<div class="ht"><p class="hk">' + kick + '</p><p class="hb">' + esc(big) + '</p><p class="hs">' + esc(small) + '</p></div>' +
      (to ? '<button class="btn gold" data-go="' + to + '">' + btn + '</button>' : '') +
      (!S.date && !dn ? '<button class="lnk" data-go="setup">Add the date of your Umrah</button>' : '') + '</div>';
    if (started()) h += resetAsk();
    if (S.purpose === 'both') h += todayCard();
    h += '<div class="tiles">' + tile('umrah', '01', 'Umrah steps', !nx ? 'Complete' : S.live ? 'Step ' + nx + ' of ' + TOTAL : seen + ' of ' + TOTAL + ' read', (S.live ? dn : seen) / TOTAL) +
      tile('prepare', '02', 'Get ready', cd + ' of ' + items.length + ' ticked', cd / Math.max(1, items.length)) +
      tile('maps', '03', 'Maps', 'Both masajid in 3D') + tile('lessons-' + (S.masjid || 'makkah'), '04', 'Classes', lessonCount()) +
      tile('duas', '05', 'My duas', S.duas.length ? S.duas.filter(function (x) { return !x.done; }).length + ' still to make' : 'Write them here') +
      tile('prep-docs', '06', 'Documents', S.docs.length ? S.docs.length + ' saved' : 'Visa links and papers') + '</div>';
    h += '<button class="rowb solo" data-go="help"><span class="ct"><b>Help</b><small>What to do when something goes wrong</small></span><span class="chev">›</span></button>';
    if (S.purpose !== 'both') h += todayCard();
    h += '<div class="me"><div class="line"><p>' + esc(details()) + '</p><button class="btn ghost small" data-go="setup">Change</button></div>' +
      '<div class="line"><p>Text size</p><div class="sz">' + [0, 1, 2].map(function (i) {
        return '<button class="s' + i + '" data-act="size" data-v="' + i + '" aria-pressed="' + (S.size === i) + '" aria-label="' + ['Normal text', 'Large text', 'Largest text'][i] + '">A</button>';
      }).join('') + '</div></div></div>';
    return h + '<p class="draft">' + esc(C.draftNote) + '</p></section>';
  }

  /* ---------- prepare: checklist, dua list, hotel card ---------- */
  function checklist() {
    var items = chkItems(), n = items.filter(function (i) { return S.checks[i.id]; }).length;
    var h = '<p class="prog">' + n + ' of ' + items.length + ' done</p><div class="bar"><i style="width:' + Math.round(100 * n / Math.max(1, items.length)) + '%"></i></div>';
    C.checklist.forEach(function (g) {
      h += '<h2 class="gh">' + esc(g.title) + '</h2>';
      if (g.note) h += '<p class="hint">' + esc(g.note) + (g.link ? ' <a href="' + esc(g.link[1]) + '" target="_blank" rel="noopener">' + esc(g.link[0]) + '</a>' : '') + '</p>';
      h += '<div class="rows">' + g.items.filter(forMe).map(function (it) { return chk(!!S.checks[it.id], it.t, it.n, 'data-act="check" data-id="' + it.id + '"'); }).join('') + '</div>';
    });
    return h;
  }
  var DGROUPS = [['me', 'For myself'], ['family', 'My family'], ['asked', 'People who asked me'], ['ummah', 'The ummah']];
  var IDEAS = {
    me: ['Forgiveness for my sins', 'To be kept firm on the deen', 'An accepted Umrah', 'Good health', 'Halal provision with barakah', 'A good end to my life', 'Relief from a worry I carry', 'To come back here again'],
    family: ['My mother', 'My father', 'My spouse', 'My children and their guidance', 'My brothers and sisters', 'My grandparents', 'Relatives who have passed away', 'A family member who is ill'],
    asked: ['Friends who asked me for dua', 'My teachers', 'My neighbours', 'The people of my masjid', 'Someone who helped me', 'Someone I have wronged'],
    ummah: ['The sick', 'The oppressed', 'People living through war and hardship', 'Muslims who have passed away', 'The youth', 'Unity and guidance for the ummah']
  };
  function duaList() {
    var g = R.duaGroup || 'me', w = R.duaWhen || 'any', have = {};
    S.duas.forEach(function (d) { have[d.t] = 1; });
    var h = '<h2 class="gh">Who is it for?</h2><div class="opts">' + DGROUPS.map(function (x) { return '<button class="opt" data-act="dua-group" data-v="' + x[0] + '" aria-pressed="' + (g === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<h2 class="gh">When will you make it?</h2><div class="opts">' + WHENS.map(function (x) { return '<button class="opt" data-act="dua-when" data-v="' + x[0] + '" aria-pressed="' + (w === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="addrow"><input type="text" id="dua-in" maxlength="200" placeholder="Health for my parents" aria-label="A dua or a name"><button class="btn small" data-act="dua-add">Add</button></div>';
    var ideas = IDEAS[g].filter(function (t) { return !have[t]; });
    if (ideas.length) h += '<h2 class="gh">Ideas. Tap one to add it</h2><div class="ideas">' + ideas.map(function (t) { return '<button class="idea" data-act="dua-idea" data-t="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>';
    if (!S.duas.length) return h;
    DGROUPS.forEach(function (x) {
      var rows = '';
      S.duas.forEach(function (d, i) { if ((d.g || 'me') === x[0]) rows += '<div class="item">' + chk(!!d.done, d.t, d.w && d.w !== 'any' ? whenName(d.w) : '', 'data-act="dua-tick" data-i="' + i + '"') + '<button class="del" data-act="dua-del" data-i="' + i + '">Remove</button></div>'; });
      if (rows) h += '<h2 class="gh">' + x[1] + '</h2><div class="rows">' + rows + '</div>';
    });
    return h;
  }
  function vDuas() { return top('My duas', 'home', 'Keep them with you') + '<section class="pad">' + pic('rawdah', 'bannerpic', '') + duaList() + '</section>'; }
  /* ---- my hotel: found by name, then the way to the Haram worked out from it ---- */
  function gateLL(m, p) { var P = MAPS[m].proj; return [P.latN - p.y / P.ky, P.lonW + p.x / P.kx]; }
  function hotelGuide() {
    var H = S.hotel || {}; if (!H.lat) return '';
    var m = kmBetween(H.lat, H.lon, SPOT.makkah[0], SPOT.makkah[1]) <= kmBetween(H.lat, H.lon, SPOT.madinah[0], SPOT.madinah[1]) ? 'makkah' : 'madinah';
    var best = null, bd = 1e9, bi = -1;
    pinsOf(m).forEach(function (p, i) { if (p.k !== 'gate') return; var ll = gateLL(m, p), d = kmBetween(H.lat, H.lon, ll[0], ll[1]); if (d < bd) { bd = d; best = p; bi = i; } });
    var far = kmBetween(H.lat, H.lon, SPOT[m][0], SPOT[m][1]);
    var h = '<div class="card navcard"><p class="hk">From your hotel to ' + esc(MAPS[m].title) + '</p>';
    if (far > 60 || !best) return h + '<p>This place is about ' + Math.round(far).toLocaleString('en-US') + ' km from the Masjid, so it does not look like a hotel in ' + CITY[m] + '. Search again with the city name.</p></div>';
    var ll = gateLL(m, best), metres = bd * 1000, dx = (ll[1] - H.lon) * Math.cos(H.lat * Math.PI / 180), dy = ll[0] - H.lat, wd = WIND[Math.round(((Math.atan2(dx, dy) * 180 / Math.PI) + 360) / 45) % 8];
    var gname = best.n.indexOf('Gate ') === 0 ? best.n : 'Gate ' + String(best.r).split(',')[0] + ', ' + best.n, dest = ll[0].toFixed(6) + ',' + ll[1].toFixed(6);
    if (metres < 2500) h += '<p class="navbig">' + (metres < 950 ? Math.max(50, Math.round(metres / 50) * 50) + ' m' : (metres / 1000).toFixed(1) + ' km') + ' · about ' + Math.max(2, Math.round(metres * 1.3 / 70)) + ' min on foot</p><p>The nearest gate to your hotel is <b>' + esc(gname) + '</b>. From your hotel it lies to the <b>' + wd + '</b>.</p>';
    else h += '<p class="navbig">' + (metres / 1000).toFixed(1) + ' km away</p><p>That is far to walk. Ask your hotel about its shuttle bus, or take a taxi and ask for <b>' + esc(gname) + '</b>.</p>';
    h += '<div class="two"><a class="btn small" href="https://maps.apple.com/?daddr=' + dest + '&dirflg=w" target="_blank" rel="noopener">Walking route in Apple Maps</a><a class="btn ghost small" href="https://www.google.com/maps/dir/?api=1&destination=' + dest + '&travelmode=walking" target="_blank" rel="noopener">In Google Maps</a></div>' +
      '<div class="two"><button class="btn ghost small" data-act="hotel-gate" data-m="' + m + '" data-i="' + bi + '">Show this gate on the map</button><a class="btn ghost small" href="https://maps.apple.com/?daddr=' + H.lat.toFixed(6) + ',' + H.lon.toFixed(6) + '&dirflg=w" target="_blank" rel="noopener">Way back to my hotel</a></div>';
    return h + '<p class="hint">The distance is in a straight line with a little added for streets, so the real walk can be longer. Remember your gate number: it is how you find your way back.</p></div>';
  }
  function hotelFind() {
    var el = document.getElementById('hotel-q'), q = el ? el.value.trim() : '';
    if (q.length < 3) { toast('Type the hotel name first'); return; }
    R.hotelQ = q; R.hotelHits = null; R.hotelMsg = 'Searching…'; render();
    var done = function (msg, hits) { R.hotelMsg = msg; R.hotelHits = hits; if (/^prep-card/.test(R.route)) render(); };
    try {
      fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&namedetails=1&accept-language=en&countrycodes=sa&q=' + encodeURIComponent(q))
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (d) { done(d && d.length ? '' : 'Nothing found. Try the hotel name with the city, for example “Hilton Makkah”.', d || []); })
        .catch(function () { done(ENV.preview ? 'The private link cannot search. It works in the app on your phone.' : 'The search could not be reached. Check your connection and try again.', null); });
    } catch (e) { done('The search could not be reached.', null); }
  }
  function hotelPick(i) {
    var x = (R.hotelHits || [])[i]; if (!x) return;
    var a = x.address || {}, nd = x.namedetails || {}, name = nd['name:en'] || x.name || String(x.display_name || '').split(',')[0];
    S.hotel = { lat: +x.lat, lon: +x.lon, name: name };
    S.card.hotel = name;
    var ar = nd['name:ar'] || (/[؀-ۿ]/.test(nd.name || '') ? nd.name : '');
    if (ar) S.card.hotelAr = ar;
    S.card.area = [a.road, a.suburb || a.neighbourhood || a.quarter, a.city || a.town || a.state].filter(Boolean).join(', ');
    R.hotelHits = null; R.hotelMsg = ''; save(); toast('Hotel added to your card'); render();
  }
  function cardForm() {
    var c = S.card || {}, h = '<div class="card"><h3>Find my hotel</h3><p>Type your hotel’s name and the app fills in the card and works out the way to the Haram.</p>' +
      '<div class="addrow"><input type="text" id="hotel-q" maxlength="120" placeholder="Swissotel Makkah" aria-label="Hotel name" value="' + esc(R.hotelQ || '') + '"><button class="btn small" data-act="hotel-find">Find</button></div>';
    if (R.hotelMsg) h += '<p class="hint">' + esc(R.hotelMsg) + '</p>';
    if (R.hotelHits && R.hotelHits.length) h += '<div class="rows">' + R.hotelHits.map(function (x, i) {
      var parts = String(x.display_name || '').split(',');
      return '<button class="rowb" data-act="hotel-pick" data-i="' + i + '"><span class="ct"><b>' + esc(parts[0]) + '</b><small>' + esc(parts.slice(1, 4).join(',').trim()) + '</small></span><span class="chev">›</span></button>';
    }).join('') + '</div>';
    h += '<p class="src">The search sends only the name you type to OpenStreetMap’s search service. Results © OpenStreetMap contributors.</p></div>' + hotelGuide();
    h += '<p class="lead">If you are lost, show this card to a guard, a driver or anyone nearby.</p>';
    C.card.fields.forEach(function (f) {
      h += '<label class="fl">' + esc(f[1]) + '<input type="' + f[2] + '" id="c-' + f[0] + '" data-card="' + f[0] + '" value="' + esc(c[f[0]] || '') + '"' + (f[0] === 'hotelAr' ? ' dir="auto"' : '') + '></label>';
    });
    return h + '<button class="btn" data-go="card">Show my card</button>';
  }
  /* ---- my documents: photographs kept on this phone only (in the browser's own store), ready to show an official ---- */
  var DOCKINDS = [['passport', 'Passport'], ['visa', 'Visa'], ['permit', 'Nusuk permit'], ['flight', 'Flight ticket'], ['hotel', 'Hotel booking'], ['health', 'Insurance or vaccination'], ['other', 'Other']];
  function docName(k) { for (var i = 0; i < DOCKINDS.length; i++) if (DOCKINDS[i][0] === k) return DOCKINDS[i][1]; return 'Document'; }
  function idb(mode, fn) {
    return new Promise(function (ok, no) {
      try {
        var q = window.indexedDB.open('haramGuide', 1);
        q.onupgradeneeded = function () { q.result.createObjectStore('docs'); };
        q.onerror = function () { no(q.error); };
        q.onsuccess = function () {
          var tx = q.result.transaction('docs', mode), st = tx.objectStore('docs'), out = fn(st);
          tx.oncomplete = function () { ok(out && out.result); }; tx.onerror = function () { no(tx.error); };
        };
      } catch (e) { no(e); }
    });
  }
  function docAdd(file) {
    if (!file) return;
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      /* shrink big photographs so many documents fit, while the small print stays readable */
      var k = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight)), cv = document.createElement('canvas');
      cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
      cv.toBlob(function (blob) {
        var id = Date.now();
        idb('readwrite', function (st) { return st.put(blob, id); }).then(function () {
          S.docs.push({ id: id, k: R.docKind || 'passport' }); save(); toast('Saved on this phone'); render();
        }).catch(function () { toast('This phone could not save the picture'); });
      }, 'image/jpeg', 0.86);
    };
    img.onerror = function () { URL.revokeObjectURL(url); toast('That file is not a picture. Take a photo or a screenshot of it'); };
    img.src = url;
  }
  function docPaint() {
    [].forEach.call(document.querySelectorAll('img[data-doc]'), function (el) {
      var id = +el.getAttribute('data-doc');
      idb('readonly', function (st) { return st.get(id); }).then(function (blob) { if (blob) el.src = URL.createObjectURL(blob); }).catch(function () {});
    });
  }
  function docsView() {
    var k = R.docKind || 'passport';
    var h = '<div class="card"><h3>Visa and permits</h3><p>Use official sites only. Visa rules change, so check before you book.</p>' +
      '<a class="btn ghost small" href="https://www.nusuk.sa" target="_blank" rel="noopener">Nusuk: Umrah visas, packages and permits</a>' +
      '<a class="btn ghost small" href="https://visa.visitsaudi.com" target="_blank" rel="noopener">Saudi eVisa (tourist visa)</a>' +
      '<a class="btn ghost small" href="https://www.haj.gov.sa" target="_blank" rel="noopener">Ministry of Hajj and Umrah</a>' +
      '<p class="hint">The Rawdah in Madinah needs a free permit, booked in the Nusuk app.</p></div>';
    h += '<h2 class="gh">My documents</h2>';
    if (S.docs.length) h += '<div class="docs">' + S.docs.map(function (d) {
      return '<button class="doc" data-go="doc-' + d.id + '"><img data-doc="' + d.id + '" alt=""><b>' + esc(docName(d.k)) + '</b></button>';
    }).join('') + '</div>';
    h += '<div class="card"><h3>Add a document</h3><div class="opts">' + DOCKINDS.map(function (x) { return '<button class="opt" data-act="doc-kind" data-v="' + x[0] + '" aria-pressed="' + (k === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<label class="btn filebtn">Take or choose a picture<input type="file" id="doc-file" accept="image/*"></label>' +
      '<p class="credit">Stays on this phone. Keep it locked, and carry your real passport.</p></div>';
    return h;
  }
  function vDoc(id) {
    var d = null; S.docs.forEach(function (x) { if (x.id === id) d = x; });
    if (!d) return vPrepare('prep-docs');
    return top(docName(d.k), 'prep-docs', 'Show this screen') + '<section class="pad docfull"><img data-doc="' + d.id + '" alt="' + esc(docName(d.k)) + '">' +
      '<p class="hint">Pinch to zoom. Turn your screen brightness up if a scanner cannot read it.</p>' +
      (R.docDel === d.id ? '<div class="card"><p>Remove this picture from the app?</p><div class="two"><button class="btn ghost small" data-act="doc-keep">No</button><button class="btn small" data-act="doc-del" data-id="' + d.id + '">Yes, remove</button></div></div>' : '<button class="btn ghost small" data-act="doc-ask" data-id="' + d.id + '">Remove this picture</button>') + '</section>';
  }
  function vPrepare(r) {
    var t = [['prepare', 'Checklist'], ['prep-duas', 'Duas'], ['prep-card', 'Hotel'], ['prep-docs', 'Documents']];
    var h = top('Get ready', 'umrah', 'Before you travel') + '<section class="pad"><div class="seg3 four" role="tablist">' + t.map(function (x) {
      return '<button role="tab" aria-selected="' + (x[0] === r) + '" data-go="' + x[0] + '">' + x[1] + '</button>';
    }).join('') + '</div>';
    return h + (r === 'prepare' ? askThree() : '') + (r === 'prep-duas' ? duaList() : r === 'prep-card' ? cardForm() : r === 'prep-docs' ? docsView() : checklist()) + '</section>';
  }
  function vCard() {
    var c = S.card || {}, F = {}, any = false;
    C.card.fields.forEach(function (f) { F[f[0]] = f; if (c[f[0]]) any = true; });
    var h = top('My hotel card', 'help') + '<section class="pad">';
    if (!any) return h + '<div class="card"><h3>Your card is empty</h3><p>Fill it in before you travel, so that anyone can help you get back.</p></div><button class="btn" data-go="prep-card">Fill in my card</button></section>';
    function row(k, rtl) { return c[k] ? '<dt>' + esc(F[k][1].split(',')[0]) + (F[k][3] ? '<span lang="ar" dir="rtl">' + esc(F[k][3]) + '</span>' : '') + '</dt><dd' + (rtl ? ' class="rtl" dir="auto"' : '') + '>' + esc(c[k]) + '</dd>' : ''; }
    h += '<div class="hcard"><p class="ar" lang="ar" dir="rtl">' + esc(C.card.helpAr) + '</p><p class="hen">' + esc(C.card.helpEn) + '</p>' +
      '<dl class="kv">' + row('hotel') + row('hotelAr', true) + row('area') + row('room') + row('meet') + '</dl>';
    if (c.leaderPhone || c.family) h += '<p class="ar" lang="ar" dir="rtl">' + esc(C.card.callAr) + '</p><p class="hen">' + esc(C.card.callEn) + '</p><dl class="kv">' + row('leader') + row('leaderPhone') + row('family') + '</dl>';
    if (c.name) h += '<dl class="kv">' + row('name') + '</dl>';
    return h + '</div><button class="btn ghost" data-go="prep-card">Edit my card</button></section>';
  }

  /* ---------- the Umrah steps, told as a photo story: one step on each screen ---------- */
  /* Three short lines for each step. They are the step's own headings in content.js; 'm' and 'f' mark a line for men or women only. */
  var STORY = {
    1: ['Tidy up and bathe', ['m', 'Wear the two ihram cloths'], ['f', 'Wear your normal modest clothes'], 'Pray first'],
    2: ['Know your miqat', 'Make your intention', 'Say the Talbiyah'],
    3: ['Do not cut your hair or nails', 'No perfume or scented products', ['m', 'No head covering or fitted clothes'], ['f', 'No face veil or gloves']],
    4: ['Have wudu', 'Agree a meeting point', 'Enter with your right foot'],
    5: ['Start level with the Black Stone', 'Keep the Ka‘bah on your left', 'Walk seven rounds'],
    6: [['m', 'Cover both shoulders'], 'Walk towards Maqam Ibrahim', 'Pray two rak‘ahs', ['f', 'Do not block the way']],
    7: ['Drink Zamzam water', 'Make dua', 'Rest if you need to'],
    8: ['Begin on Safa', 'Walk to Marwah: that is lap one', 'Seven laps, ending at Marwah'],
    9: [['m', 'Shave your whole head, which is better'], ['m', 'Or shorten evenly from all over'], ['f', 'Gather your hair'], ['f', 'Cut about a fingertip’s length'], ['f', 'Women do not shave']],
    10: ['Your ihram has ended', 'Thank Allah and ask Him to accept it', 'Stay close to the Masjid']
  };
  /* which part of each photograph to keep when it is cropped to a tall frame */
  var STORY_POS = { ihram: '50% 50%', miqat: '50% 50%', tanim: '50% 50%', gate: '50% 40%', kaaba: '33% 60%', maqam: '50% 50%', zamzam: '50% 55%', safa: '50% 50%' };
  function storyLines(n) {
    return (STORY[n] || []).filter(function (x) { return typeof x === 'string' || x[0] === S.gender; }).map(function (x) { return typeof x === 'string' ? x : x[1]; });
  }
  function stagePic(n) {
    if (n === 2 && S.route === 'makkah') return 'tanim';
    if (n === 1 && S.gender === 'f') return '';
    return n === TOTAL ? 'kaaba' : (STAGE_PIC[n] || '');
  }
  function stepNow() { return R.look || (S.live ? nextStage() || TOTAL : 1); }
  function waiting(keys) { return S.duas.filter(function (d) { return !d.done && keys && keys.indexOf(d.w || 'any') >= 0; }).length; }
  function started() { return !!(S.live || doneCount() || S.tawaf || S.sai); }
  function resetAsk() {
    var h = ask('restart', 'Start my Umrah again', 'Go back to step 1?', 'Yes, start again');
    return h.replace('</h3>', '</h3><p class="hint">Your steps and both counters are cleared, and your duas are unticked. Your checklist, dua list, hotel and documents stay.</p>');
  }
  function vStory(n) {
    var st = stage(n); if (!st) return vSteps();
    R.look = n;
    var ph = stagePic(n), lines = storyLines(n), mine = waiting(STAGE_WHEN[n]);
    var h = '<section class="story' + (hasPic(ph) ? '' : ' nophoto') + '">';
    h += '<div class="sphoto">' + (hasPic(ph) ? '<img src="p-' + ph + '.jpg" alt="' + esc(MEDIA.photos[ph].what || st.title) + '" style="object-position:' + (STORY_POS[ph] || '50% 50%') + (ph === 'kaaba' ? ';transform:translateY(-9%)' : '') + '">' : '<b aria-hidden="true">' + n + '</b>') + '</div>';
    h += '<div class="sdots">' + C.stages.map(function (x) { return '<button class="' + ((S.live ? S.done[x.id] : x.id < n) ? 'd' : '') + (x.id === n ? ' c' : '') + '" data-go="stage-' + x.id + '" aria-label="Step ' + x.id + ': ' + esc(x.title) + '"' + (x.id === n ? ' aria-current="step"' : '') + '></button>'; }).join('') + '</div>';
    h += '<div class="stop"><button class="pill" data-go="steps">All steps</button><button class="pill" data-go="prepare">Get ready</button><button class="pill" data-go="help">Help</button></div>';
    h += '<div class="stxt"><div class="skick"><p>Step ' + n + ' of ' + TOTAL + (S.live && S.done[n] ? ' · done' : '') + '</p>' + (n > 1 ? '<button data-go="stage-' + (n - 1) + '">‹ Step ' + (n - 1) + '</button>' : '') + '</div>';
    h += '<h1>' + esc(st.title) + '</h1><p class="swhere">' + esc(st.where) + '</p>';
    h += '<ol class="sdo">' + lines.map(function (x, i) { return '<li><b>' + (i + 1) + '</b><span>' + esc(x) + '</span></li>'; }).join('') + '</ol>';
    if (!(S.gender && S.school && S.route)) h += '<button class="smine" data-act="purpose-both">Answer three questions so the steps fit you ›</button>';
    else if (mine) h += '<button class="smine" data-go="details-' + n + '">My duas for this moment: ' + mine + ' ›</button>';
    var more = '<button class="sbtn" data-go="details-' + n + '">' + (st.steps.some(function (x) { return x.dua && visible(x); }) ? 'Duas and details' : 'All the details') + '</button>';
    var next = '<button class="sbtn" data-act="stage-done" data-n="' + n + '">' + (n < TOTAL ? 'Next step ›' : 'Finish') + '</button>';
    var where = st.img ? '<button class="sbtn" data-go="where-' + n + '">Show me where</button>' : '';
    if (st.counter) {
      var c = S[st.counter], taw = st.counter === 'tawaf';
      var lab = c >= 7 ? 'Open the counter' : c ? (taw ? 'Round ' : 'Lap ') + (c + 1) + ' of 7: count' : taw ? 'Count my rounds' : 'Count my laps';
      h += '<div class="sbtns"><button class="sbtn gold" data-go="count-' + st.counter + '">' + lab + '</button>' + where + more + next + '</div>';
    } else h += '<div class="sbtns">' + where + (where ? more : more.replace('class="sbtn"', 'class="sbtn full"')) + next.replace('class="sbtn"', 'class="sbtn gold' + (where ? '' : ' full') + '"') + '</div>';
    if (!S.live) h += '<button class="slive" data-act="live">You are reading ahead. <u>Start my Umrah</u> to keep your place.</button>';
    if (started()) h += '<div class="sreset">' + resetAsk() + '</div>';
    return h + '</div></section>';
  }
  function vWhere(n) {
    var st = stage(n); if (!st || !st.img) return vStory(n);
    var ph = stagePic(n);
    var h = top('Where to go', 'stage-' + n, 'Step ' + n + ' · ' + st.title) + '<section class="pad">';
    h += '<figure class="fig">' + PLAN[st.img]() + '<figcaption>' + esc(st.cap) + '</figcaption></figure>';
    if (hasPic(ph)) h += '<figure class="shot">' + pic(ph, '', st.title) + '<figcaption>What to look for</figcaption></figure>';
    return h + '<button class="btn" data-go="map-makkah">Open the live map</button></section>';
  }
  function vDetails(n) {
    var st = stage(n); if (!st) return vSteps();
    CUR_PIC = stagePic(n);
    var h = top(st.title, 'stage-' + n, 'Step ' + n + ' of ' + TOTAL + ' · Duas and details') + '<section class="pad">' +
      '<p class="where">' + esc(st.where) + '</p><p class="lead">' + esc(st.summary) + '</p>' + askThree();
    if (STAGE_WHEN[n]) h += myDuas(STAGE_WHEN[n]);
    h += st.steps.filter(visible).map(stepHTML).join('') + legend();
    return h + '<button class="btn" data-go="stage-' + n + '">Back to step ' + n + '</button></section>';
  }
  function vSteps() {
    var dn = doneCount(), nx = nextStage();
    var h = top('All steps', 'umrah', 'Your whole Umrah') + '<section class="pad">' + askThree();
    h += '<button class="rowb solo" data-go="prepare"><span class="ct"><b>Get ready</b><small>Checklist, my duas, hotel and documents</small></span><span class="chev">›</span></button>';
    if (!S.live) h += '<button class="btn" data-act="live">Start my Umrah</button>';
    else if (!nx) h += '<div class="card"><h3>Umrah complete</h3><p>May Allah accept it from you.</p></div>';
    else h += '<button class="btn" data-go="stage-' + nx + '">Continue with step ' + nx + '</button>';
    if (started()) h += resetAsk();
    h += '<div class="rows">' + C.stages.map(function (s) {
      var sp = stagePic(s.id), done = S.live && S.done[s.id];
      return '<button class="rowb' + (done ? ' done' : S.live && s.id === nx ? ' cur' : '') + ' haspic" data-go="stage-' + s.id + '">' + (hasPic(sp) ? pic(sp, 'rowpic', '') : '<span class="rowpic none"></span>') + '<span class="num">' + (done ? CHECK : s.id) + '</span>' +
        '<span class="ct"><b>' + esc(s.title) + '</b><small>' + esc(s.where) + '</small></span><span class="chev">›</span></button>';
    }).join('') + '</div>';
    h += '<figure class="fig"><p class="hk">Your Umrah on the map</p>' + PLAN.journey() + '</figure>';
    h += '<h2 class="gh">Also worth reading</h2><div class="rows">' + [['intro', 'Start here'], ['words', 'The Arabic terms you will hear'], ['women', 'Clothing, pace, your period, hair']].map(function (x) {
      return '<button class="rowb" data-go="lesson-' + x[0] + '"><span class="ct"><b>' + esc(C.lessons[x[0]].title) + '</b><small>' + x[1] + '</small></span><span class="chev">›</span></button>';
    }).join('') + '</div>';
    return h + '</section>';
  }

  /* ---------- the other lessons ---------- */
  function vLesson(id) {
    var L = C.lessons[id]; if (!L) return vSteps();
    var h = top(L.title, 'steps', 'Lesson') + '<section class="pad">';
    L.blocks.forEach(function (b) {
      h += '<article class="step"><h3>' + esc(b.h) + '</h3>' + (b.p || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
        (b.list ? '<ol class="ol">' + b.list.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>' : '') +
        (b.src ? '<p class="src">Source: ' + esc(b.src) + '</p>' : '') + '</article>';
    });
    if (id === 'words') h += '<div class="card"><dl class="gl">' + C.glossary.map(function (g) { return '<dt>' + esc(g[0]) + '</dt><dd>' + esc(g[1]) + '</dd>'; }).join('') + '</dl></div>';
    return h + '<button class="btn" data-act="read" data-id="' + id + '">Back to all steps</button></section>';
  }

  /* ---------- the counters ---------- */
  function arcs(n, done) {
    var h = '', seg = 360 / 7, gap = 8, r = 104;
    for (var i = 0; i < 7; i++) {
      var a0 = (i * seg + gap / 2 - 90) * Math.PI / 180, a1 = ((i + 1) * seg - gap / 2 - 90) * Math.PI / 180;
      h += '<path class="' + (i < n ? 'ad' : (!done && i === n ? 'ac' : 'at')) + '" d="M' + (120 + r * Math.cos(a0)).toFixed(1) + ' ' + (120 + r * Math.sin(a0)).toFixed(1) +
        'A' + r + ' ' + r + ' 0 0 1 ' + (120 + r * Math.cos(a1)).toFixed(1) + ' ' + (120 + r * Math.sin(a1)).toFixed(1) + '"/>';
    }
    return '<svg viewBox="0 0 240 240" aria-hidden="true">' + h + '</svg>';
  }
  function vCount(kind) {
    var taw = kind === 'tawaf', n = S[kind], done = n >= 7, cur = Math.min(n + 1, 7), toMarwah = cur % 2 === 1, man = S.gender === 'm';
    var st = null; C.stages.forEach(function (s) { if (s.counter === kind) st = s; });
    var what = taw ? 'when you pass the Black Stone' : toMarwah ? 'when you reach Marwah' : 'when you reach Safa';
    var h = top(taw ? 'Tawaf counter' : 'Sa‘i counter', 'stage-' + st.id, 'Step ' + st.id + ' of ' + TOTAL) + '<section class="pad count">';
    if (!done) {
      h += '<button class="ringtap tap" data-act="count" data-k="' + kind + '" aria-label="' + (taw ? 'Round ' : 'Lap ') + cur + ' of 7. Tap ' + what + '.">' + arcs(n, false) +
        '<span class="rin"><small>' + (taw ? 'Round' : 'Lap') + '</small><b>' + cur + '</b><small>of 7</small></span></button>';
      if (!taw) h += '<p class="dir">' + (toMarwah ? 'Safa → Marwah' : 'Marwah → Safa') + '</p>';
      h += '<p class="taphint">Tap the circle ' + what + '</p>';
      h += '<p class="hintl">' + (taw ? (man && cur <= 3 ? 'Brisk walk in this round' : 'Walk at a normal pace') : (man ? 'Jog between the green lights' : 'Walk at a normal pace')) + '</p>';
    } else {
      h += '<div class="ringtap">' + arcs(7, true) + '<span class="rin">' + CHECK + '</span></div><p class="ctt">' + (taw ? 'Seven rounds done' : 'Seven laps done') + '</p>' +
        '<p class="lead">' + (taw ? 'Your tawaf is complete.' + (man ? ' Cover both shoulders now.' : '') : 'You are at Marwah. Your sa‘i is complete.') + '</p>' +
        '<button class="btn" data-act="count-next" data-k="' + kind + '">' + (taw ? 'Next: two rak‘ahs' : 'Next: cut your hair') + '</button>';
    }
    h += '<div class="two">' + (n ? '<button class="btn ghost small" data-act="undo" data-k="' + kind + '">Undo last tap</button>' : '') +
      (n && R.ask !== 'reset-' + kind ? '<button class="btn ghost small" data-act="ask" data-k="reset-' + kind + '">Start again</button>' : '') + '</div>';
    if (R.ask === 'reset-' + kind) h += ask('reset-' + kind, '', 'Set this counter back to zero?', 'Yes, start again');
    if (taw) h += '<div class="card"><h3>Between the Yemeni corner and the Black Stone</h3>' + duaHTML('rabbana') + '</div>';
    else h += '<div class="card"><h3>On Safa and on Marwah</h3>' + duaHTML('safaDhikr') + '</div><div class="card"><h3>Between the green lights</h3>' + duaHTML('green') + '</div>';
    return h + myDuas(taw ? ['tawaf'] : ['safa', 'sai']) + '</section>';
  }

  /* ---------- help ---------- */
  function vHelp() {
    var h = top('Help', '', 'When something goes wrong') + '<section class="pad"><h2 class="gh">What if…</h2><div class="rows">' +
      C.help.map(function (x) { return '<button class="rowb" data-go="help-' + x.id + '"><span class="ct"><b>' + esc(x.q) + '</b></span><span class="chev">›</span></button>'; }).join('') + '</div>';
    h += '<h2 class="gh">If you are lost</h2><button class="btn" data-go="card">Show my hotel card</button>';
    h += '<h2 class="gh">Emergency numbers in Saudi Arabia</h2><div class="rows">' + C.numbers.map(function (n) {
      return '<div class="rowb"><span class="tel">' + (ENV.preview ? esc(n[0]) : '<a href="tel:' + esc(n[0]) + '">' + esc(n[0]) + '</a>') + '</span><span class="ct"><b>' + esc(n[1]) + '</b></span></div>';
    }).join('') + '</div><p class="hint">' + esc(C.numbersNote) + '</p>';
    h += '<h2 class="gh">About this guide</h2><div class="card"><p>' + esc(C.draftNote) + '</p><p class="src">' + esc(C.version) + '. Every dua shows its source. Nothing you enter leaves this phone.</p>' +
      (Object.keys(MEDIA.photos).length ? '<p class="src">Photographs from Wikimedia Commons: ' + Object.keys(MEDIA.photos).map(function (k) { var c = MEDIA.photos[k]; return '<a href="' + esc(c.page) + '" target="_blank" rel="noopener">' + esc(c.what || k) + '</a> (' + esc(c.by) + ', ' + esc(c.lic) + ')'; }).join('; ') + '.</p>' : '') +
      '<p class="src">Teacher portraits: Presidency of Religious Affairs. Maps: OpenStreetMap contributors. Lesson schedule: ' + esc(LES.source || 'the official schedule') + '. Prayer times are worked out with the open-source adhan library.</p><p class="src">Maps show the ground level unless a floor is chosen, and are not a survey. Makkah gate numbers and services follow the Ministry of Hajj’s Grand Mosque guide. Madinah sections follow the official visitor map of May 2025, placed to within about 20 m. The Presidency posts class timetables a few weeks at a time.</p></div>';
    return h + '</section>';
  }
  function vHelpItem(id) {
    var x = null; C.help.forEach(function (i) { if (i.id === id) x = i; });
    if (!x) return vHelp();
    var note = noteOf(x);
    var h = top('What if…', 'help') + '<section class="pad"><article class="step"><h3>' + esc(x.q) + '</h3>' + x.a.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
      (note ? '<p class="sn">' + esc(note) + '</p>' : '') + (x.src ? '<p class="src">Source: ' + esc(x.src) + '</p>' : '') + '</article>';
    if (x.card) h += '<button class="btn" data-go="card">Show my hotel card</button>';
    return h + '<button class="btn ghost" data-go="help">Back to Help</button></section>';
  }

  /* ---------- the two masajid: maps and lessons ---------- */
  var MAPS = window.UMRAH_MAPS || {}, LES = window.UMRAH_LESSONS || { masjid: {} };
  var CITY = { makkah: 'Makkah', madinah: 'Madinah' }, SPOT = { makkah: [21.4225, 39.8262], madinah: [24.4672, 39.6111] };
  var LAYERS = [['gate', 'Gates'], ['lesson', 'Lessons'], ['wudu', 'Washrooms and wudu'], ['help', 'Help points']];
  var SLOTS = [['fajr', 'Fajr'], ['dhuhr', 'Dhuhr'], ['asr', 'Asr'], ['maghrib', 'Maghrib'], ['isha', 'Isha']];
  var KIND = { gate: 'Gate', cg: 'Courtyard gate', wudu: 'Washroom', help: 'Help point', lesson: 'Lesson place', place: 'Place' };
  var pinCache = {};
  var HIJRI = (function () { try { return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura').resolvedOptions().calendar === 'islamic-umalqura'; } catch (e) { return false; } })();

  var INSIDE = window.UMRAH_INSIDE || {};
  function pinsOf(m) {
    if (pinCache[m]) return pinCache[m];
    var M = MAPS[m], IG = INSIDE[m] || {}, L = (LES.masjid[m] || {}).places || {};
    var out = M.pins.map(function (p) { var f = null; (IG.gates || []).forEach(function (g) { if (p.k === 'gate' && p.n === g.n) f = g; }); if (!f) return p; var q = {}; Object.keys(p).forEach(function (k) { q[k] = p[k]; }); q.r = f.r; return q; });
    (IG.addGates || []).forEach(function (g) { out.push({ k: 'gate', n: g.n, r: g.r, x: g.x, y: g.y, z: 1 }); });
    Object.keys(L).forEach(function (id) {
      var p = L[id]; if (!p.lat) return;
      var who = [], les = (LES.masjid[m] || {}).lessons || [];
      les.forEach(function (x) { if (x.p === id && who.indexOf(x.t) < 0) who.push(x.t); });
      out.push({ k: 'lesson', n: p.en || p.ar, a: p.ar, x: (p.lon - M.proj.lonW) * M.proj.kx, y: (M.proj.latN - p.lat) * M.proj.ky, z: 1, pid: id, near: p.near, floor: p.floor, who: who, img: who.length && MEDIA.teachers.indexOf(m + '-' + who[0]) >= 0 ? 't-' + m + '-' + who[0] + '.jpg' : '' });
    });
    ((INSIDE[m] || {}).marks || []).forEach(function (k) { out.push({ k: 'place', n: k.n, s: k.s, x: k.x, y: k.y, z: k.z, note: k.note }); });
    return (pinCache[m] = out);
  }
  function labelsOf(m) { return MAPS[m].labels.concat((INSIDE[m] || {}).labels || []); }
  function mapState(m) {
    var M = MAPS[m];
    if (!R.map || R.map.m !== m) R.map = { m: m, k: M.start.k, cx: M.start.cx, cy: M.start.cy, sel: -1, me: null };
    return R.map;
  }
  function remember(m) { if (S.masjid !== m) { S.masjid = m; save(); } }
  function masjidHead(m, mode) {
    return '<div class="seg2">' + ['makkah', 'madinah'].map(function (x) { return '<button aria-pressed="' + (x === m) + '" data-go="' + mode + '-' + x + '">' + CITY[x] + '</button>'; }).join('') + '</div>' +
      '<div class="' + (m === 'makkah' ? 'seg3' : 'seg2') + ' pick">' + (m === 'makkah' ? [['map', 'Map'], ['floors', 'Floors'], ['lessons', 'Classes']] : [['map', 'Map'], ['lessons', 'Classes']]).map(function (x) { return '<button aria-pressed="' + (x[0] === mode) + '" data-go="' + x[0] + '-' + m + '">' + x[1] + '</button>'; }).join('') + '</div>';
  }
  function swatch(k) { return '<svg class="sw" viewBox="0 0 64 64" aria-hidden="true"><use href="#ic-' + k + '"/></svg>'; }

  /* dates and prayer times, always in Saudi time */
  function parts(fmt, d) { var o = {}; fmt.formatToParts(d).forEach(function (p) { o[p.type] = p.value; }); return o; }
  function saudiYMD(d) { return parts(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Riyadh', year: 'numeric', month: 'numeric', day: 'numeric' }), d); }
  function saudiDay(i) { var p = saudiYMD(new Date()); return new Date(Date.UTC(+p.year, +p.month - 1, +p.day + i, 9)); }
  function hijriKey(d) {
    var p = parts(new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { timeZone: 'Asia/Riyadh', year: 'numeric', month: 'numeric', day: 'numeric' }), d);
    return p.year + '-' + ('0' + p.month).slice(-2) + '-' + ('0' + p.day).slice(-2);
  }
  function days(m) {
    var L = (LES.masjid[m] || {}).lessons || [], have = {}, out = [];
    L.forEach(function (x) { have[x.d] = (have[x.d] || 0) + 1; });
    if (!HIJRI) return Object.keys(have).sort().map(function (k) { return { key: k, label: +k.slice(8) + '/' + +k.slice(5, 7), sub: k.slice(0, 4) + ' AH', i: -1, n: have[k], date: null }; });
    var wd = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Riyadh', weekday: 'short', day: 'numeric', month: 'short' });
    var hj = new Intl.DateTimeFormat('en-GB-u-ca-islamic-umalqura-nu-latn', { timeZone: 'Asia/Riyadh', day: 'numeric', month: 'long' });
    for (var i = 0; i < 21; i++) {
      var d = saudiDay(i), k = hijriKey(d);
      if (have[k]) out.push({ key: k, label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : wd.format(d), sub: i < 2 ? wd.format(d) : hj.format(d), i: i, n: have[k], date: d });
    }
    return out;
  }
  /* ---------- Masjid al-Haram, floor by floor: the floors drawn pulled apart, then a plan of the one you choose ---------- */
  var FL = window.UMRAH_FLOORS || { floors: [], links: [] };
  var LINK = { esc: ['E', 'Escalator'], stairs: ['S', 'Stairs'], lift: ['L', 'Lift'] };
  function outline(m, fill, line, wd) {
    return MAPS[m].shapes.filter(function (x) { return x[0] === 'bld'; }).map(function (x) {
      /* only the pieces of the Masjid itself: one outlying piece far to the north-west is left off */
      var d = x[1].split('M').filter(function (p) { return p && Math.min.apply(null, p.replace(/Z/g, '').split('L').map(function (q) { return parseFloat(q); })) >= 250; }).map(function (p) { return 'M' + p; }).join('');
      return '<path fill-rule="evenodd" d="' + d + '" fill="' + fill + '" stroke="' + line + '" stroke-width="' + wd + '"/>'; }).join('');
  }
  function floorSVG(f) {
    var dark = isDark(), c = dark ? PAL.night : PAL.day, box = [275, 315, 580, 630], u = 5.4;
    var h = '<rect x="275" y="315" width="580" height="630" fill="' + c.land + '"/>' + (f.id === 0 ? baseSVG('makkah', dark) : outline('makkah', c.mBld, c.mLine, 2) + '<path d="' + MAPS.makkah.shapes.filter(function (x) { return x[0] === 'kaaba'; })[0][1] + '" fill="' + c.kaaba + '" opacity="0.35"/>');
    FL.links.forEach(function (q) {
      if (q.f.indexOf(f.id) < 0) return;
      var col = q.k === 'esc' ? '#1B5A43' : q.k === 'lift' ? '#7A3E8E' : '#2B6C94';
      h += '<rect x="' + (q.x - 9) + '" y="' + (q.y - 9) + '" width="18" height="18" rx="5" fill="' + col + '" stroke="#fff" stroke-width="1.8"/><text x="' + q.x + '" y="' + q.y + '" font-family="Inter, Arial" font-weight="700" font-size="12.5" fill="#fff" text-anchor="middle" dominant-baseline="central">' + LINK[q.k][0] + '</text>';
    });
    f.places.forEach(function (q, i) { h += medal(q.x, q.y, i + 1, u, c); });
    h += tag(661, 757, 'Ka‘bah', u * 0.9, c, 'middle', true);
    return '<svg class="rmap" viewBox="' + box.join(' ') + '" role="img" aria-label="Plan of the ' + esc(f.name) + '">' + h + '</svg>';
  }
  function vFloors() {
    var sel = R.floor == null ? 0 : R.floor, f = null; FL.floors.forEach(function (x) { if (x.id === sel) f = x; });
    if (!f) return vMap('makkah');
    var count = { esc: 0, stairs: 0, lift: 0 }; FL.links.forEach(function (q) { if (q.f.indexOf(f.id) >= 0) count[q.k]++; });
    var h = top('Floors', '', 'Masjid al-Haram') + '<section class="pad">' + masjidHead('makkah', 'floors') +
      '<div class="floorbar">' + FL.floors.map(function (x) { return '<button class="opt" data-act="floor" data-v="' + x.id + '" aria-pressed="' + (x.id === sel) + '">' + esc(x.name) + '</button>'; }).join('') + '</div>' +
      '<figure class="fig"><p class="hk">' + esc(f.name) + '</p>' + floorSVG(f) +
      '<div class="zonekey"><span><i style="background:#1B5A43"></i>E: escalator (' + count.esc + ')</span><span><i style="background:#2B6C94"></i>S: stairs (' + count.stairs + ')</span><span><i style="background:#7A3E8E"></i>L: lift (' + count.lift + ')</span></div><figcaption>' + esc(f.about) + '</figcaption>' +
      (f.places.length ? stops(f.places.map(function (q, i) { return [i + 1, q.n, '', '']; })) : '') + '</figure>';
    return h + '<p class="credit">Not an official floor plan. Some stairs and lifts are missing, and real floor shapes differ.</p></section>';
  }
  function lessonCount() {
    var n = 0;
    ['makkah', 'madinah'].forEach(function (m) { var d = days(m); if (d.length && d[0].i === 0) n += d[0].n; });
    return n ? n + ' today' : 'In the two masajid';
  }
  function prayerTimes(m, d) {
    try {
      var A = window.adhan, p = saudiYMD(d);
      var t = new A.PrayerTimes(new A.Coordinates(SPOT[m][0], SPOT[m][1]), new Date(+p.year, +p.month - 1, +p.day), A.CalculationMethod.UmmAlQura());
      return { fajr: t.fajr, sunrise: t.sunrise, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha };
    } catch (e) { return null; }
  }
  function slotWindow(s, T) {
    var M = 60000, a = +T[s] + 10 * M;
    var b = s === 'fajr' ? +T.sunrise + 30 * M : s === 'dhuhr' ? Math.min(+T.dhuhr + 100 * M, +T.asr - 10 * M) : s === 'asr' ? +T.maghrib - 5 * M : s === 'maghrib' ? +T.isha - 5 * M : +T.isha + 100 * M;
    return [a, b];
  }
  function clock(d) { return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Riyadh', hour: 'numeric', minute: '2-digit' }).format(d); }

  /* the map */
  /* the four glossy map icons: defined once for the whole page, then used by the buttons and both maps */
  var ICONS = '<defs><linearGradient id="ic-gGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#45C98C"/><stop offset="1" stop-color="#0D6B43"/></linearGradient><linearGradient id="ic-gGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE9A3"/><stop offset=".55" stop-color="#E0B24A"/><stop offset="1" stop-color="#A8791C"/></linearGradient><linearGradient id="ic-gWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C8864B"/><stop offset="1" stop-color="#7A471F"/></linearGradient><linearGradient id="ic-gPage" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EBDDBB"/></linearGradient><radialGradient id="ic-gWater" cx=".36" cy=".52" r=".75"><stop offset="0" stop-color="#BDF0FF"/><stop offset=".45" stop-color="#37AEEA"/><stop offset="1" stop-color="#0A5D9E"/></radialGradient><radialGradient id="ic-gRed" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#FF9C8A"/><stop offset=".5" stop-color="#E0432F"/><stop offset="1" stop-color="#8E1D10"/></radialGradient><symbol id="ic-gate" viewBox="0 0 64 64"><ellipse cx="33" cy="58" rx="26" ry="4" fill="#000" opacity=".16"/><path d="M10 56V30C10 17 24 12 32 5c8 7 22 12 22 25v26z" fill="#6E4C0C" transform="translate(3 1)"/><path d="M10 56V30C10 17 24 12 32 5c8 7 22 12 22 25v26z" fill="url(#ic-gGold)"/><path d="M17 56V32c0-9 10-13 15-18 5 5 15 9 15 18v24z" fill="url(#ic-gGreen)"/><path d="M32 15v41" stroke="#06422A" stroke-width="2"/><circle cx="28" cy="40" r="2.4" fill="url(#ic-gGold)"/><circle cx="36" cy="40" r="2.4" fill="url(#ic-gGold)"/><path d="M19 33c0-7 7-11 12-15v10c-5 2-9 5-12 11z" fill="#fff" opacity=".28"/><rect x="6" y="54" width="52" height="5" rx="2" fill="url(#ic-gGold)"/></symbol><symbol id="ic-lesson" viewBox="0 0 64 64"><ellipse cx="32" cy="59" rx="25" ry="3.6" fill="#000" opacity=".16"/><path d="M13 58 38 34l8 3-22 22zM51 58 26 34l-8 3 22 22z" fill="url(#ic-gWood)"/><path d="M3 17c11-6 22-4 29 3 7-7 18-9 29-3l-3 27c-10-4-19-3-26 3-7-6-16-7-26-3z" fill="#0D5C3A"/><path d="M7 14c10-5 19-2 25 4v24c-6-5-15-7-23-4z" fill="url(#ic-gPage)"/><path d="M57 14c-10-5-19-2-25 4v24c6-5 15-7 23-4z" fill="url(#ic-gPage)"/><path d="M12 20c6-1 11 0 15 3M13 26c5-1 10 0 14 3M14 32c5-1 9 0 13 3M52 20c-6-1-11 0-15 3M51 26c-5-1-10 0-14 3M50 32c-5-1-9 0-13 3" stroke="#B3955A" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M32 18v25" stroke="#C9A24B" stroke-width="2"/></symbol><linearGradient id="ic-gMen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3FA9F0"/><stop offset="1" stop-color="#0B568F"/></linearGradient><linearGradient id="ic-gWomen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C573C9"/><stop offset="1" stop-color="#6E2575"/></linearGradient><symbol id="ic-wudu" viewBox="0 0 64 64"><ellipse cx="33" cy="60" rx="24" ry="3.4" fill="#000" opacity=".16"/><rect x="6" y="6" width="54" height="54" rx="14" fill="#000" opacity=".28"/><rect x="3" y="3" width="54" height="54" rx="14" fill="url(#ic-gMen)"/><path d="M7 20C7 11 11 7 19 7h22c9 0 13 4 13 11-16-4-31-1-47 8z" fill="#fff" opacity=".2"/><g fill="#fff" transform="translate(-2 -3)"><g transform="translate(32 33) scale(.8) translate(-32 -33)"><circle cx="18" cy="17" r="5.6"/><path d="M12.5 24.5h11q3.5 0 3.5 3.5v13.5h-4V31h-1v22h-4.3V40.5h-1.4V53H12.7V31h-1v10.5h-4V28q0-3.5 3.5-3.5z"/><rect x="31" y="12" width="2.4" height="43" rx="1.2" opacity=".75"/><circle cx="47" cy="17" r="5.6"/><path d="M42.5 24.5h9l7.5 17-3.6 1.6-5.2-11.6h-.8L55.5 44h-4.3v9.5h-4.2V44h-1v9.5h-4.2V44H38.5 l4.4-12.5h-.8l-5.2 11.6-3.6-1.6z"/></g></g></symbol><symbol id="ic-wc-m" viewBox="0 0 64 64"><ellipse cx="33" cy="60" rx="24" ry="3.4" fill="#000" opacity=".16"/><rect x="6" y="6" width="54" height="54" rx="14" fill="#000" opacity=".28"/><rect x="3" y="3" width="54" height="54" rx="14" fill="url(#ic-gMen)"/><path d="M7 20C7 11 11 7 19 7h22c9 0 13 4 13 11-16-4-31-1-47 8z" fill="#fff" opacity=".2"/><g fill="#fff" transform="translate(-2 -3)"><circle cx="32" cy="17" r="5.6"/><path d="M26.5 24.5h11q3.5 0 3.5 3.5v13.5h-4V31h-1v22h-4.3V40.5h-1.4V53H26.7V31h-1v10.5h-4V28q0-3.5 3.5-3.5z"/></g></symbol><symbol id="ic-wc-f" viewBox="0 0 64 64"><ellipse cx="33" cy="60" rx="24" ry="3.4" fill="#000" opacity=".16"/><rect x="6" y="6" width="54" height="54" rx="14" fill="#000" opacity=".28"/><rect x="3" y="3" width="54" height="54" rx="14" fill="url(#ic-gWomen)"/><path d="M7 20C7 11 11 7 19 7h22c9 0 13 4 13 11-16-4-31-1-47 8z" fill="#fff" opacity=".2"/><g fill="#fff" transform="translate(-2 -3)"><circle cx="32" cy="17" r="5.6"/><path d="M27.5 24.5h9l7.5 17-3.6 1.6-5.2-11.6h-.8L40.5 44h-4.3v9.5h-4.2V44h-1v9.5h-4.2V44H23.5 l4.4-12.5h-.8l-5.2 11.6-3.6-1.6z"/></g></symbol><symbol id="ic-help" viewBox="0 0 64 64"><ellipse cx="32" cy="59" rx="20" ry="3.6" fill="#000" opacity=".16"/><circle cx="34" cy="31" r="25" fill="#6E1408"/><circle cx="31" cy="29" r="25" fill="url(#ic-gRed)"/><ellipse cx="26" cy="15" rx="13" ry="7" fill="#fff" opacity=".35" transform="rotate(-22 26 15)"/><circle cx="31" cy="18" r="4.6" fill="#fff"/><rect x="26.5" y="25.5" width="9" height="20" rx="4" fill="#fff"/></symbol></defs>';
  document.body.insertAdjacentHTML('beforeend', '<svg class="sprite" width="0" height="0" aria-hidden="true">' + ICONS + '</svg>');
  function pinsSVG(m, px) {
    var M = MAPS[m], st = R.map, v = Math.max(M.w, M.h) / st.k, u = v / px, P = pinsOf(m), h = '', x0 = st.cx - v / 2, y0 = st.cy - v / 2;
    var rank = { lesson: 0, gate: 1, place: 2, wudu: 3, help: 4, cg: 5 }, zrank = { cg: 0, help: 1, wudu: 2, gate: 3, lesson: 4, place: 5 }, kept = [];
    function n(a) { return (a * u).toFixed(2); }
    function t(x, y, size, cls, txt, halo) {
      return '<text class="' + cls + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-size="' + n(size) + '"' + (halo ? ' stroke-width="' + n(3) + '"' : '') + ' text-anchor="middle" dominant-baseline="central">' + esc(txt) + '</text>';
    }
    function icon(k, x, y, size) { return '<use href="#ic-' + k + '" x="' + (x - size / 2 * u).toFixed(1) + '" y="' + (y - size / 2 * u).toFixed(1) + '" width="' + n(size) + '" height="' + n(size) + '"/>'; }
    var labels = [], boxes = [];
    labelsOf(m).forEach(function (l) { if (st.k >= (l[3] || 1) && st.k < 9) labels.push([1.5, l[1], l[2], 11, l[0], 't-area']); });
    var list = P.map(function (p, i) { return { p: p, i: i }; }).filter(function (o) {
      var p = o.p;
      if (o.i === st.sel) return true;
      if (p.k !== 'place' && !R.layers[p.k === 'cg' ? 'gate' : p.k]) return false;
      if (st.k < (p.z || 1)) return false;
      return !(p.x < x0 - 30 * u || p.x > x0 + v + 30 * u || p.y < y0 - 30 * u || p.y > y0 + v + 30 * u);
    });
    /* Within one kind, a marker that would sit on top of another waits until you zoom in. */
    list.sort(function (a, b) { return (b.i === st.sel) - (a.i === st.sel) || rank[a.p.k] - rank[b.p.k] || (a.p.z || 1) - (b.p.z || 1); });
    list = list.filter(function (o) {
      var p = o.p, near = 19 * u;
      if (o.i !== st.sel && p.k !== 'lesson' && p.k !== 'place') {
        for (var j = 0; j < kept.length; j++) if (kept[j].k === p.k && kept[j].g === p.g && Math.abs(kept[j].x - p.x) < near && Math.abs(kept[j].y - p.y) < near) return false;
      }
      kept.push(p); return true;
    });
    list.sort(function (a, b) { return zrank[a.p.k] - zrank[b.p.k]; });
    list.forEach(function (o) {
      var p = o.p, i = o.i, sel = i === st.sel, x = p.x, y = p.y, num = String(p.r || '').split(',')[0];
      var g = '<g class="pin" data-pin="' + i + '">';
      if (sel) g += '<circle class="p-ring" cx="' + x + '" cy="' + y + '" r="' + n(17) + '" stroke-width="' + n(3) + '"/>';
      if (p.k === 'gate' && !num) g += icon('gate', x, y, 24);
      else if (p.k === 'gate') g += '<circle class="p-gate" cx="' + x + '" cy="' + y + '" r="' + n(p.z === 1 ? 10.5 : 9) + '"/>' + t(x, y, num.length > 2 ? 7.5 : 9.5, 't-on', num);
      else if (p.k === 'cg') g += '<circle class="p-cg" cx="' + x + '" cy="' + y + '" r="' + n(9) + '" stroke-width="' + n(1.5) + '"/>' + t(x, y, 7, 't-cg', num);
      else if (p.k === 'wudu') g += icon(p.g ? 'wc-' + p.g : 'wudu', x, y, 25) + (num ? '<rect class="p-wcno" x="' + (x - 11 * u).toFixed(1) + '" y="' + (y + 11 * u).toFixed(1) + '" width="' + n(22) + '" height="' + n(11) + '" rx="' + n(5.5) + '"/>' + t(x, y + 16.5 * u, 8, 't-wcno', num) : '');
      else if (p.k === 'help') g += icon('help', x, y, 22);
      else if (p.k === 'lesson' && p.img) g += '<circle class="p-lesson" cx="' + x + '" cy="' + y + '" r="' + n(15) + '" stroke-width="' + n(2) + '"/><image href="' + p.img + '" x="' + (x - 13 * u).toFixed(1) + '" y="' + (y - 13 * u).toFixed(1) + '" width="' + n(26) + '" height="' + n(26) + '" preserveAspectRatio="xMidYMid slice" clip-path="circle(50%)"/>';
      else if (p.k === 'lesson') g += icon('lesson', x, y, 30);
      else g += '<circle class="p-place" cx="' + x + '" cy="' + y + '" r="' + n(p.big ? 3 : 4) + '"/>';
      if (p.k === 'place') labels.push([sel ? 0 : p.big ? 1 : 3, x, y - 11 * u, p.big ? 12 : 10.5, p.s || p.n, 't-place']);
      else if (p.k !== 'lesson' && (sel || (p.k === 'gate' && p.z === 1 && st.k >= 2.4))) labels.push([sel ? 0 : 2, x, y + 18 * u, 10.5, p.n, 't-place']);
      h += g + '</g>';
    });
    /* Names go on last, most important first, and a name that would run into another is left for a closer zoom. */
    labels.sort(function (a, b) { return a[0] - b[0]; }).forEach(function (l) {
      var w = l[4].length * l[3] * 0.3 * u + 4 * u, hh = l[3] * 0.75 * u;
      for (var j = 0; j < boxes.length; j++) if (Math.abs(boxes[j][0] - l[1]) < boxes[j][2] + w && Math.abs(boxes[j][1] - l[2]) < boxes[j][3] + hh) return;
      boxes.push([l[1], l[2], w, hh]);
      h += t(l[1], l[2], l[3], l[5], l[4], 1);
    });
    var nv = R.nav && R.nav.m === m ? P[R.nav.i] : null;
    if (nv && st.me) h += '<line class="p-nav" x1="' + st.me.x.toFixed(1) + '" y1="' + st.me.y.toFixed(1) + '" x2="' + nv.x.toFixed(1) + '" y2="' + nv.y.toFixed(1) + '" stroke-width="' + n(4) + '" stroke-dasharray="' + n(2) + ' ' + n(8) + '"/>';
    if (st.me) h += '<circle class="p-me" cx="' + st.me.x.toFixed(1) + '" cy="' + st.me.y.toFixed(1) + '" r="' + n(8) + '" stroke-width="' + n(3) + '"/>';
    return h;
  }
  function lessonsAt(m, pid) {
    var D = LES.masjid[m] || {}, out = [];
    days(m).forEach(function (d) {
      (D.lessons || []).forEach(function (x) {
        if (x.d === d.key && x.p === pid && out.length < 6) out.push((d.i < 2 ? d.label : d.sub ? d.label : d.key) + ', after ' + x.s.charAt(0).toUpperCase() + x.s.slice(1) + ': ' + (x.en || x.ar) + ' (' + ((D.teachers[x.t] || {}).en || (D.teachers[x.t] || {}).ar || '') + ')');
      });
    });
    return out;
  }
  function spotLessons(m, pid) {
    var D = LES.masjid[m] || {}, out = [];
    days(m).forEach(function (d) {
      var T = d.date ? prayerTimes(m, d.date) : null;
      (D.lessons || []).forEach(function (x) { if (x.d === d.key && x.p === pid && out.length < 4) out.push({ x: x, d: d, at: T ? T[x.s] : null }); });
    });
    return out;
  }
  function spotSheet(m, p, i) {
    var D = LES.masjid[m], L = spotLessons(m, p.pid);
    var h = '<div class="sheet"><div class="sheetcard left"><div class="shead"><p class="hk">Class at this spot</p><button class="btn ghost small" data-act="spot-close">Close</button></div><h3>' + esc(p.n) + '</h3>';
    if (!L.length) h += '<p>No classes are listed here in the coming days' + '.</p>';
    L.forEach(function (e, n) {
      if (n) { h += '<p class="more"><b>' + esc(e.d.label) + ', after ' + e.x.s.charAt(0).toUpperCase() + e.x.s.slice(1) + ':</b> ' + esc(e.x.en || e.x.ar) + '</p>'; return; }
      var x = e.x, t = D.teachers[x.t] || {}, what = (x.bk || []).map(function (b) { return b.what || b.en; }).filter(Boolean).join('; ');
      h += '<div class="sl"><p class="where">' + esc(e.d.label) + ', after ' + x.s.charAt(0).toUpperCase() + x.s.slice(1) + (e.at ? ' · about ' + esc(clock(e.at)) + ' Saudi time' : '') + '</p>' +
        '<button class="who2" data-go="teacher-' + m + '-' + esc(x.t) + '">' + face(m, x.t) + '<span class="ct"><b>' + esc(x.en || x.ar) + '</b><small>' + esc(t.en || t.ar || '') + ' · ' + esc(x.lang) + '</small></span></button>' +
        (what ? '<p class="src">What it is: ' + esc(what) + '.</p>' : '') + '<div class="two">' + books(x) + '</div>' + planBtn(m, x) + '</div>';
    });
    return h + '<div class="two"><button class="btn small" data-act="nav" data-i="' + i + '">Guide me here</button><button class="btn ghost small" data-go="lessons-' + m + '">All lessons</button></div></div></div>';
  }
  function pinInfo(m) {
    var st = R.map, p = st && st.sel >= 0 ? pinsOf(m)[st.sel] : null;
    if (!p) return '';
    var h = '<div class="card"><div class="sh"><span class="lab plain">' + KIND[p.k] + (p.r && p.k !== 'wudu' ? ' ' + esc(p.r) : '') + '</span></div><h3>' + esc(p.n) + '</h3>' + (p.a ? '<p class="ar2" lang="ar" dir="rtl">' + esc(p.a) + '</p>' : '');
    if (p.k === 'wudu') h += '<div class="wcinfo">' + swatch(p.g ? 'wc-' + p.g : 'wudu') + '<dl><dt>Number</dt><dd>' + esc(p.r || 'Not on the map') + '</dd><dt>For</dt><dd>' + (p.g === 'm' ? 'Men' : p.g === 'f' ? 'Women' : 'Check the sign') + '</dd></dl></div>';
    if (p.note) h += '<p>' + esc(p.note) + '</p>';
    if (p.k === 'lesson') {
      h += '<p>' + esc([p.floor, p.near ? 'Near ' + p.near : ''].filter(Boolean).join('. ')) + '. This marker was placed by hand from the written description, so look for the teacher’s chair nearby.</p>';
      if (p.who && p.who.length) h += '<div class="faces">' + p.who.map(function (id) { var t = (LES.masjid[m].teachers[id] || {}); return '<button class="who2" data-go="teacher-' + m + '-' + esc(id) + '">' + face(m, id) + '<span class="ct"><b>' + esc(t.en || t.ar || '') + '</b></span></button>'; }).join('') + '</div>';
      var ls = lessonsAt(m, p.pid);
      if (ls.length) h += '<ul class="plain">' + ls.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      h += '<button class="btn ghost small" data-go="lessons-' + m + '">All lessons</button>';
    }
    var gi = st.sel, going = R.nav && R.nav.m === m && R.nav.i === gi;
    if (p.k === 'gate' || p.k === 'cg') h += '<button class="btn ghost small wide" data-act="at-gate" data-i="' + gi + '">I’m at this gate</button>';
    if (p.k === 'lesson' && R.sheetOff !== m + gi) h += spotSheet(m, p, gi);
    h += '<button class="btn small wide' + (going ? ' ghost' : '') + '" data-act="' + (going ? 'nav-stop' : 'nav') + '" data-i="' + gi + '">' + (going ? 'Stop guiding me' : 'Guide me here') + '</button>';
    return h + '</div>';
  }
  /* The 3D view needs two library files. They load only when a map is opened; if they cannot load, the flat map is shown. */
  var LIB3D = ['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js', 'scene.js', 'map3d.js'], lib3d = null;
  function loadScript(src) {
    return new Promise(function (ok, no) {
      var s = document.createElement('script'); s.src = src; s.async = false;
      s.onload = function () { ok(); }; s.onerror = function () { no(new Error(src)); };
      document.head.appendChild(s);
    });
  }
  function need3d() {
    if (!lib3d) lib3d = LIB3D.reduce(function (p, src) { return p.then(function () { return loadScript(src); }); }, Promise.resolve());
    return lib3d;
  }
  var HAS3D = (function () { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } })();
  function is3d() { return HAS3D && !R.no3d && S.mapMode !== 'flat'; }
  function isDark() { var t = document.documentElement.getAttribute('data-theme'); return t ? t === 'dark' : !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); }

  /* The street map is drawn, not a photograph of a map, so it stays sharp however far you zoom.
     One set of colours for day and one for night; the same drawing is laid on the ground of the 3D view. */
  var PAL = {
    day: { land: '#F3F1EA', green: '#CFE5C6', plaza: '#ECE8DD', bld: '#E3DED1', bldLine: '#D3CCBB', case: '#D6D0C2', road: '#FFFFFF', foot: '#E2DCCD', text: '#6A6353', halo: '#F3F1EA',
      mBld: '#FFF9E9', mExt: '#FBF3DC', mOpen: '#FFFFFF', mLine: '#B79743', mPlaza: '#EFEADF', mSvc: '#C9D2CC', mGreen: '#BFDDB6', rawdah: '#7DBE95', kaaba: '#1B1B1B', gold: '#B79743', zOld: '#F1DFA9', zFirst: '#FAEFCF', zMen: '#FFF9E9', zWomen: '#F5DCE7', zCourt: '#D9EAF3', zNorth: '#E1ECD7', zLine: '#C9B274' },
    night: { land: '#151C19', green: '#1E3526', plaza: '#1C2521', bld: '#232C28', bldLine: '#313D37', case: '#151C19', road: '#34413B', foot: '#28322D', text: '#A9B6AE', halo: '#151C19',
      mBld: '#3A3524', mExt: '#322E20', mOpen: '#4B4A43', mLine: '#CBAA4F', mPlaza: '#202A25', mSvc: '#3D4E45', mGreen: '#234029', rawdah: '#2F7B52', kaaba: '#050505', gold: '#CBAA4F', zOld: '#5A4E24', zFirst: '#463F26', zMen: '#3A3524', zWomen: '#4A3040', zCourt: '#27404D', zNorth: '#2F3E2C', zLine: '#8C7A45' }
  };
  function baseSVG(m, dark) {
    var B = (window.UMRAH_BASE || {})[m], M = MAPS[m], c = dark ? PAL.night : PAL.day, h = '<rect x="-3000" y="-3000" width="8000" height="8000" fill="' + c.land + '"/>';
    if (B) {
      B.a.forEach(function (a) { h += '<path d="' + a[1] + '" fill="' + (a[0] === 'green' ? c.green : a[0] === 'plaza' ? c.plaza : c.bld) + '"' + (a[0] === 'bld' ? ' stroke="' + c.bldLine + '" stroke-width="0.6"' : '') + '/>'; });
      var W = { major: 13, minor: 7, foot: 2.2 };
      B.l.forEach(function (l) { if (l[0] !== 'foot') h += '<path d="' + l[1] + '" fill="none" stroke="' + c.case + '" stroke-width="' + (W[l[0]] + 2) + '" stroke-linecap="round" stroke-linejoin="round"/>'; });
      ['foot', 'minor', 'major'].forEach(function (k) { B.l.forEach(function (l) { if (l[0] === k) h += '<path d="' + l[1] + '" fill="none" stroke="' + (k === 'foot' ? c.foot : c.road) + '" stroke-width="' + W[k] + '" stroke-linecap="round" stroke-linejoin="round"/>'; }); });
    }
    var F = { plaza: c.mPlaza, green: c.mGreen, svc: c.mSvc, bld: c.mBld, ext: c.mExt, masaa: c.mExt, open: c.mOpen, rawdah: c.rawdah, kaaba: c.kaaba };
    var IN = INSIDE[m], out = '', cnt = {};
    function fillOf(k) { var f = IN && IN.fills && IN.fills[k]; if (f) { var i = cnt[k] || 0; cnt[k] = i + 1; var tok = typeof f === 'string' ? f : f[i]; if (tok && c[tok]) return c[tok]; } return F[k] || c.mBld; }
    M.shapes.forEach(function (x) {
      var k = x[0];
      if (IN && k === 'women') return;
      if (k === 'women') h += '<path d="' + x[1] + '" fill="' + c.gold + '" fill-opacity="0.08" stroke="' + c.gold + '" stroke-width="1.5" stroke-dasharray="5 4"/>';
      else if (k === 'hijr') h += '<path d="' + x[1] + '" fill="none" stroke="' + c.mLine + '" stroke-width="1.5"/>';
      else h += '<path fill-rule="evenodd" d="' + x[1] + '" fill="' + fillOf(k) + '"' + (k === 'bld' || k === 'ext' || k === 'masaa' || k === 'open' ? ' stroke="' + c.mLine + '" stroke-width="1.2"' : '') + '/>';
      if (IN && k === 'bld') {
        /* the sections inside, cut to the real outline of the building */
        var Z = { old: c.zOld, first: c.zFirst, men: c.zMen, women: c.zWomen, court: c.zCourt };
        h += '<clipPath id="in-' + m + '"><path fill-rule="evenodd" d="' + x[1] + '"/></clipPath><g clip-path="url(#in-' + m + ')">' + (IN.zones || []).map(function (z) {
          return '<rect x="' + z[2] + '" y="' + z[3] + '" width="' + (z[4] - z[2]) + '" height="' + (z[5] - z[3]) + '" fill="' + Z[z[0]] + '" stroke="' + c.zLine + '" stroke-width="' + (z[0] === 'court' ? 0.9 : 0.6) + '"' + (z[0] === 'court' ? ' rx="3"' : '') + '/>';
        }).join('') + '</g><path d="' + x[1] + '" fill="none" stroke="' + c.mLine + '" stroke-width="1.4"/>';
        if (IN.imamLine) out += '<path d="M' + IN.imamLine.x0 + ' ' + IN.imamLine.y + 'H388M490 ' + IN.imamLine.y + 'H' + IN.imamLine.x1 + '" stroke="' + c.gold + '" stroke-width="1" stroke-dasharray="5 4"/>';
      }
    });
    h += out;
    if (B && B.p) h += '<path d="' + B.p + '" fill="none" stroke="' + c.mLine + '" stroke-opacity="0.45" stroke-width="0.7"/>';
    if (B) B.t.forEach(function (t) {
      h += '<text x="' + t[1] + '" y="' + t[2] + '" font-size="' + t[4] + '" font-family="Inter, Arial, sans-serif" font-weight="600" text-anchor="middle" dominant-baseline="central" fill="' + c.text + '" stroke="' + c.halo + '" stroke-width="1.6" stroke-linejoin="round" paint-order="stroke"' + (t[3] ? ' transform="rotate(' + t[3] + ' ' + t[1] + ' ' + t[2] + ')"' : '') + '>' + esc(t[0]) + '</text>';
    });
    return h;
  }
  /* The same drawing painted onto a canvas, for the ground of the 3D view. It is painted directly, shape by shape,
     because iPhones will not turn a drawing into a 3D surface any other way. The size stays under the iPhone limit. */
  function groundCanvas(m, dark, maxW) {
    var B = (window.UMRAH_BASE || {})[m], M = MAPS[m], c = dark ? PAL.night : PAL.day, IN = INSIDE[m], pad = (B || {}).pad || 0;
    var x0 = -pad, y0 = -pad, w = M.w + 2 * pad, h = M.h + 2 * pad;
    var W = Math.min(maxW || 4096, Math.floor(Math.sqrt(11e6 * w / h))), H = Math.round(W * h / w), k = W / w;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d');
    if (window.HG_LOOK) { var base0 = c; c = {}; Object.keys(base0).forEach(function (kk) { c[kk] = (window.HG_LOOK.pal || {})[kk] || base0[kk]; }); }
    g.fillStyle = c.land; g.fillRect(0, 0, W, H); g.setTransform(k, 0, 0, k, -x0 * k, -y0 * k); g.lineJoin = 'round';
    function fill(d, col, eo) { g.fillStyle = col; g.fill(new Path2D(d), eo ? 'evenodd' : 'nonzero'); }
    function line(d, col, wd, dash, cap) { g.strokeStyle = col; g.lineWidth = wd; g.setLineDash(dash || []); g.lineCap = cap || 'butt'; g.stroke(new Path2D(d)); }
    if (B) {
      B.a.forEach(function (a) { fill(a[1], a[0] === 'green' ? c.green : a[0] === 'plaza' ? c.plaza : c.bld); if (a[0] === 'bld') line(a[1], c.bldLine, 0.6); });
      var WD = { major: 13, minor: 7, foot: 2.2 };
      B.l.forEach(function (l) { if (l[0] !== 'foot') line(l[1], c.case, WD[l[0]] + 2, null, 'round'); });
      ['foot', 'minor', 'major'].forEach(function (kk) { B.l.forEach(function (l) { if (l[0] === kk) line(l[1], kk === 'foot' ? c.foot : c.road, WD[kk], null, 'round'); }); });
    }
    var F = { plaza: c.mPlaza, green: c.mGreen, svc: c.mSvc, bld: c.mBld, ext: c.mExt, masaa: c.mExt, open: c.mOpen, rawdah: c.rawdah, kaaba: c.kaaba };
    var cnt = {};
    function fillOf(k) { var f = IN && IN.fills && IN.fills[k]; if (f) { var i = cnt[k] || 0; cnt[k] = i + 1; var tok = typeof f === 'string' ? f : f[i]; if (tok && c[tok]) return c[tok]; } return F[k] || c.mBld; }
    M.shapes.forEach(function (x) {
      var kk = x[0];
      if (IN && kk === 'women') return;
      if (kk === 'women') { g.globalAlpha = 0.08; fill(x[1], c.gold); g.globalAlpha = 1; line(x[1], c.gold, 1.5, [5, 4]); }
      else if (kk === 'hijr') line(x[1], c.mLine, 1.5);
      else { fill(x[1], fillOf(kk), true); if (kk === 'bld' || kk === 'ext' || kk === 'masaa' || kk === 'open') line(x[1], c.mLine, 1.2); }
      if (IN && kk === 'bld') {
        var Z = { old: c.zOld, first: c.zFirst, men: c.zMen, women: c.zWomen, court: c.zCourt };
        g.save(); g.clip(new Path2D(x[1]), 'evenodd'); g.setLineDash([]);
        (IN.zones || []).forEach(function (z) { g.fillStyle = Z[z[0]]; g.fillRect(z[2], z[3], z[4] - z[2], z[5] - z[3]); g.strokeStyle = c.zLine; g.lineWidth = z[0] === 'court' ? 0.9 : 0.6; g.strokeRect(z[2], z[3], z[4] - z[2], z[5] - z[3]); });
        g.restore(); line(x[1], c.mLine, 1.4);
      }
    });
    if (IN && IN.imamLine) line('M' + IN.imamLine.x0 + ' ' + IN.imamLine.y + 'H388M490 ' + IN.imamLine.y + 'H' + IN.imamLine.x1, c.gold, 1, [5, 4]);
    if (B && B.p) { g.globalAlpha = 0.45; line(B.p, c.mLine, 0.7); g.globalAlpha = 1; }
    if (B) B.t.forEach(function (t) {
      g.save(); g.translate(t[1], t[2]); if (t[3]) g.rotate(t[3] * Math.PI / 180);
      g.font = '600 ' + t[4] + 'px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.setLineDash([]);
      g.lineWidth = 1.6; g.strokeStyle = c.halo; g.strokeText(t[0], 0, 0); g.fillStyle = c.text; g.fillText(t[0], 0, 0); g.restore();
    });
    return { x: x0, y: y0, w: w, h: h, canvas: cv };
  }
  function flatSVG(m) {
    var M = MAPS[m];
    return '<svg id="map" class="map" viewBox="0 0 ' + M.w + ' ' + M.h + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map of ' + esc(M.title) + '">' + baseSVG(m, isDark()) + '<g id="pins"></g></svg>';
  }
  function vMap(m) {
    var M = MAPS[m]; if (!M) return vHome();
    mapState(m); remember(m);
    var d3 = is3d();
    var h = '<section class="pad mappad"><h1 class="vh">' + esc(M.title) + '</h1>' + masjidHead(m, 'map');
    h += '<div class="mapbox tall' + (R.mapFull ? ' full' : '') + '">' + (d3 ? '<div id="map3d" class="map3dbox"><p class="maploading">Building the 3D view</p></div>' : flatSVG(m)) +
      (HAS3D && !R.no3d ? '<div class="mapmode"><button aria-pressed="' + d3 + '" data-act="mapmode" data-v="3d">3D</button><button aria-pressed="' + !d3 + '" data-act="mapmode" data-v="flat">Flat</button></div>' : '') +
      '<div class="zoom"><button data-act="zoom" data-v="1.7" aria-label="Zoom in">+</button><button data-act="zoom" data-v="0.59" aria-label="Zoom out">−</button></div>' + (d3 ? '<div class="turn"><button data-act="turn" data-v="45" aria-label="Turn left">↺</button><button class="compass" data-act="north" aria-label="Face north"><span id="needle"><b>▲</b>N</span></button><button data-act="turn" data-v="-45" aria-label="Turn right">↻</button></div>' : '') + '<button class="fullbtn" data-act="map-full">' + (R.mapFull ? 'Close full screen' : 'Full screen') + '</button></div>';
    if (INSIDE[m] && INSIDE[m].key) { var zc = isDark() ? PAL.night : PAL.day; h += '<div class="zonekey">' + INSIDE[m].key.map(function (z) { return '<span><i style="background:' + zc[z[0]] + '"></i>' + esc(z[1]) + '</span>'; }).join('') + '</div>'; }
    h += '<div id="pininfo">' + pinInfo(m) + '</div>';
    h += '<div class="two"><button class="btn ghost small" data-act="zoom" data-v="0">Reset the view</button>' + (d3 ? '<button class="btn ghost small" data-act="tilt">' + (R.topView ? 'Angled view' : 'Top view') + '</button><button class="btn ghost small" data-act="inside">See inside</button>' : '') + '</div>';
    h += '<div class="chips">' + LAYERS.map(function (l) { return '<button class="chip" data-act="layer" data-k="' + l[0] + '" aria-pressed="' + !!R.layers[l[0]] + '">' + swatch(l[0]) + l[1] + '</button>'; }).join('') + '</div>';
    h += '<div id="gpsbox">' + gpsHTML(m) + '</div>';
    h += '<div class="card"><h3>Which gate?</h3><div class="addrow"><input type="text" inputmode="numeric" id="gate-in" maxlength="12" placeholder="79" aria-label="Gate number"><button class="btn small" data-act="find-gate">Find gate</button></div><button class="btn ghost small wide" data-act="at-gate">I’m at this gate</button></div>';
    h += '<a class="btn ghost small" href="https://alharamain.gov.sa/public/?page=interactive_maps_ar" target="_blank" rel="noopener">Official live map (may work only in Saudi Arabia)</a>';
    return h + '<p class="credit">Map © OpenStreetMap contributors. Some gate numbers may be missing or old.</p></section>';
  }
  function mapOpts(m) {
    var st = R.map;
    return { pins: pinsOf(m), labels: labelsOf(m), layers: R.layers, sel: st.sel, me: st.me, nav: R.nav && R.nav.m === m ? pinsOf(m)[R.nav.i] : null, dark: isDark(), ground: function (dark, maxW) { return groundCanvas(m, dark, maxW); }, onTurn: function (deg) { var n = document.getElementById('needle'); if (n) n.style.transform = 'rotate(' + deg.toFixed(0) + 'deg)'; }, focus: st.focus, onSelect: function (i) { st.sel = i; if (R.redraw) R.redraw(); } };
  }
  function mapSetup() {
    if (!R.map) return;
    var st = R.map, m = st.m, host = document.getElementById('map3d');
    if (host) {
      need3d().then(function () {
        var h2 = document.getElementById('map3d');
        if (!h2 || !R.map || R.map.m !== m) return;
        R.redraw = function () { window.UMRAH_3D.update(mapOpts(m)); var info = document.getElementById('pininfo'); if (info) info.innerHTML = pinInfo(m); };
        window.UMRAH_3D.show(h2, m, mapOpts(m)); st.focus = null;
      }).catch(function () { lib3d = null; R.no3d = true; toast('The 3D view could not load, so this is the flat map'); render(); });
      return;
    }
    var svg = document.getElementById('map'), layer = document.getElementById('pins');
    if (!svg || !layer) return;
    var M = MAPS[m], big = Math.max(M.w, M.h), ptrs = {}, moved = 0;
    st.focus = null;
    function px() { return Math.max(svg.clientWidth, svg.clientHeight) || 340; }
    function apply() {
      st.k = Math.max(1, Math.min(14, st.k));
      st.cx = Math.max(0, Math.min(M.w, st.cx)); st.cy = Math.max(0, Math.min(M.h, st.cy));
      var v = big / st.k;
      svg.setAttribute('viewBox', (st.cx - v / 2).toFixed(1) + ' ' + (st.cy - v / 2).toFixed(1) + ' ' + v.toFixed(1) + ' ' + v.toFixed(1));
    }
    function draw() { apply(); layer.innerHTML = pinsSVG(m, px()); }
    R.redraw = function () { draw(); var info = document.getElementById('pininfo'); if (info) info.innerHTML = pinInfo(m); };
    svg.addEventListener('pointerdown', function (e) {
      try { svg.setPointerCapture(e.pointerId); } catch (x) {}
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (Object.keys(ptrs).length === 1) moved = 0;
    });
    svg.addEventListener('pointermove', function (e) {
      var p = ptrs[e.pointerId]; if (!p) return;
      var ids = Object.keys(ptrs), u = big / st.k / px();
      if (ids.length === 1) {
        var dx = e.clientX - p.x, dy = e.clientY - p.y;
        moved += Math.abs(dx) + Math.abs(dy); st.cx -= dx * u; st.cy -= dy * u; p.x = e.clientX; p.y = e.clientY; apply();
      } else if (ids.length === 2) {
        var o = ptrs[ids[0] === String(e.pointerId) ? ids[1] : ids[0]], d0 = Math.hypot(p.x - o.x, p.y - o.y);
        p.x = e.clientX; p.y = e.clientY;
        var d1 = Math.hypot(p.x - o.x, p.y - o.y);
        if (d0 > 0) { st.k *= d1 / d0; moved += 20; draw(); }
      }
    });
    function up(e) {
      var was = ptrs[e.pointerId]; delete ptrs[e.pointerId];
      if (Object.keys(ptrs).length) return;
      if (was && moved < 8 && e.type === 'pointerup') {
        var el = document.elementFromPoint(e.clientX, e.clientY), g = el && el.closest ? el.closest('[data-pin]') : null;
        st.sel = g ? +g.getAttribute('data-pin') : -1; R.redraw();
      } else draw();
    }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    svg.addEventListener('wheel', function (e) { e.preventDefault(); st.k *= e.deltaY < 0 ? 1.25 : 0.8; draw(); }, { passive: false });
    draw();
  }
  function focusPin(m, i) { var p = pinsOf(m)[i]; mapState(m); R.map.sel = i; R.map.cx = p.x; R.map.cy = p.y; R.map.k = Math.max(R.map.k, 5); R.map.focus = { x: p.x, y: p.y }; }
  function gateIndex() {
    var el = document.getElementById('gate-in'), q = el ? el.value.trim().toLowerCase() : '', P = pinsOf(R.map.m), hit = -1;
    if (!q) { toast('Type a gate number first'); return -1; }
    P.forEach(function (p, i) { if (hit < 0 && (p.k === 'gate' || p.k === 'cg') && String(p.r || '').split(/,\s*/).indexOf(q) >= 0) hit = i; });
    P.forEach(function (p, i) { if (hit < 0 && p.k === 'gate' && p.n.toLowerCase().indexOf(q) >= 0) hit = i; });
    if (hit < 0) toast('That gate is not on this map');
    return hit;
  }
  function findGate() {
    var hit = gateIndex(), m = R.map.m; if (hit < 0) return;
    R.layers.gate = true; focusPin(m, hit); render();
    var box = document.querySelector('.mapbox'); if (box && box.scrollIntoView) box.scrollIntoView({ block: 'nearest' });
  }
  /* "I'm at gate N": the pilgrim reads the number off the sign above the door, and the dot goes there.
     Under the roof this is more exact than GPS, and it works with no signal at all. */
  function atGate(i) {
    var st = R.map, m = st.m, p = pinsOf(m)[i]; if (!p) return;
    try { if (GPS.id != null) navigator.geolocation.clearWatch(GPS.id); } catch (e) {}
    GPS.id = null; GPS.on = true; GPS.manual = true;
    st.me = { x: p.x, y: p.y };
    GPS.msg = 'You placed yourself at ' + (p.n.indexOf('Gate ') === 0 ? p.n : 'Gate ' + String(p.r).split(',')[0] + ', ' + p.n) + '. The dot stays there until you move it or turn on GPS.';
    R.layers.gate = true; st.sel = i; st.cx = p.x; st.cy = p.y; st.k = Math.max(st.k, 4); st.focus = { x: p.x, y: p.y };
    toast('Your dot is at this gate'); render();
    var box = document.querySelector('.mapbox'); if (box && box.scrollIntoView) box.scrollIntoView({ block: 'nearest' });
  }
  function showPlace(m, pid) {
    var hit = -1;
    pinsOf(m).forEach(function (p, i) { if (p.k === 'lesson' && p.pid === pid) hit = i; });
    if (hit < 0) { toast('That place is not on the map yet'); return; }
    R.pop = null; R.layers.lesson = true; R.sheetOff = m + hit; focusPin(m, hit); go('map-' + m);
  }

  /* ---- live position: a blue dot where the pilgrim stands. The position never leaves the phone. ---- */
  var GPS = { id: null, on: false, msg: '', demo: 0 };
  var DEMO = {
    makkah: [[21.42120, 39.82385, 'outside King Fahd Gate'], [21.42243, 39.82652, 'on the mataf'], [21.42522, 39.82722, 'at Marwah']],
    madinah: [[24.46742, 39.61040, 'outside As-Salam Gate'], [24.47030, 39.61118, 'in the north courtyard'], [24.46850, 39.60880, 'on the west side']]
  };
  function kmBetween(a, b, c, d) {
    var r = Math.PI / 180, x = Math.sin((c - a) * r / 2), y = Math.sin((d - b) * r / 2), h = x * x + Math.cos(a * r) * Math.cos(c * r) * y * y;
    return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function nearText(m) {
    var st = R.map, best = null, bd = 1e9;
    pinsOf(m).forEach(function (p) { if (p.k !== 'gate') return; var d = Math.hypot(p.x - st.me.x, p.y - st.me.y); if (d < bd) { bd = d; best = p; } });
    if (!best) return 'You are on the map.';
    return 'You are about ' + Math.max(5, Math.round(bd / 5) * 5) + ' m from ' + (best.n.indexOf('Gate ') === 0 ? best.n : 'Gate ' + String(best.r).split(',')[0] + ', ' + best.n) + '.';
  }
  var WIND = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
  function navHTML() {
    var st = R.map, p = st && R.nav && R.nav.m === st.m ? pinsOf(st.m)[R.nav.i] : null;
    if (!p) return '';
    var h = '<div class="card navcard"><p class="hk">Guiding you to</p><h3>' + esc(p.n) + '</h3>';
    if (!st.me) h += '<p>' + (GPS.on ? 'Waiting for your position.' : 'Turn on your position below and the app will point the way.') + '</p>';
    else {
      var dx = p.x - st.me.x, dy = p.y - st.me.y, d = Math.hypot(dx, dy), w = WIND[Math.round(((Math.atan2(dx, -dy) * 180 / Math.PI) + 360) / 45) % 8];
      if (d < 15) h += '<p class="navbig">You have arrived</p><p>Look for the teacher’s chair or the sign nearby.</p>';
      else {
        h += '<p class="navbig">' + Math.max(10, Math.round(d / 10) * 10) + ' m · about ' + Math.max(1, Math.round(d / 65)) + ' min</p><p>Walk <b>' + w + '</b>, along the dotted line on the map. North is at the top in the flat and top views.</p>';
        if (p.k !== 'gate' && p.k !== 'cg') {
          var best = null, bd = 1e9;
          pinsOf(st.m).forEach(function (g) { if (g.k !== 'gate') return; var q = Math.hypot(g.x - p.x, g.y - p.y); if (q < bd) { bd = q; best = g; } });
          if (best && bd < 260) h += '<p>The nearest gate to it is <b>' + esc(best.n.indexOf('Gate ') === 0 ? best.n : 'Gate ' + String(best.r).split(',')[0] + ', ' + best.n) + '</b>.</p>';
        }
      }
      h += '<p class="hint">The line is straight. The app does not know walls, barriers or closed paths, so follow the signs and the staff as well. Indoors, GPS can be off by 20 m or more.</p>';
    }
    return h + '<button class="btn ghost small" data-act="nav-stop">Stop guiding me</button></div>';
  }
  function navStart(i) {
    var st = R.map; if (!st || !(i >= 0)) return;
    R.nav = { m: st.m, i: i }; R.sheetOff = st.m + i;
    if (!st.me) { if (ENV.preview) { gpsDemo(); return; } if (navigator.geolocation && !GPS.on) { gpsStart(); return; } }
    gpsPaint(false);
    var b = document.getElementById('gpsbox'); if (b && b.scrollIntoView) b.scrollIntoView({ block: 'nearest' });
  }
  function gpsHTML() {
    var h = navHTML() + '<div class="card"><h3>Where am I?</h3>' + (GPS.on && GPS.msg ? '<p class="gpsline">' + esc(GPS.msg) + '</p>' : '');
    if (ENV.preview) h += '<p>This private link cannot read your position. Try a sample.</p><button class="btn ghost small" data-act="gps-demo">' + (GPS.on ? 'Try another sample' : 'Show a sample position') + '</button>';
    else if (!navigator.geolocation) h += '<p>This phone does not share its position with web pages.</p>';
    else if (!GPS.on) h += '<button class="btn small" data-act="gps">Show where I am</button>';
    else h += (GPS.manual && navigator.geolocation ? '<button class="btn small" data-act="gps">Use GPS instead</button>' : '') + '<button class="btn ghost small" data-act="gps-stop">' + (GPS.manual ? 'Remove my dot' : 'Stop showing my position') + '</button>';
    return h + '</div>';
  }
  function gpsPaint(recentre) {
    var st = R.map, box = document.getElementById('gpsbox');
    if (!st) return;
    if (box) box.innerHTML = gpsHTML();
    if (recentre && st.me) {
      if (document.getElementById('map3d') && window.UMRAH_3D && R.redraw) { R.redraw(); window.UMRAH_3D.focus(st.me.x, st.me.y); return; }
      st.cx = st.me.x; st.cy = st.me.y; st.k = Math.max(st.k, 4);
    }
    if (R.redraw) R.redraw();
  }
  function gpsFix(lat, lon, acc, label) {
    var st = R.map; if (!st) return;
    var m = st.m, M = MAPS[m], x = (lon - M.proj.lonW) * M.proj.kx, y = (M.proj.latN - lat) * M.proj.ky, first = !st.me;
    GPS.on = true;
    if (x < -200 || y < -200 || x > M.w + 200 || y > M.h + 200) {
      var d = kmBetween(lat, lon, SPOT[m][0], SPOT[m][1]);
      st.me = null;
      GPS.msg = 'GPS is working. You are about ' + (d >= 10 ? Math.round(d).toLocaleString('en-US') : d.toFixed(1)) + ' km from ' + M.title + ', so you are not on this map.';
      gpsPaint(false); return;
    }
    st.me = { x: x, y: y };
    GPS.msg = (label ? 'Sample, ' + label + '. ' : '') + nearText(m) + (label ? '' : ' Accurate to about ' + Math.max(5, Math.round((acc || 10) / 5) * 5) + ' m.');
    gpsPaint(first || !!label);
  }
  function gpsStart() {
    var q = /[?&]lat=([-\d.]+)&lon=([-\d.]+)/.exec(location.search);
    GPS.on = true; GPS.manual = false; GPS.msg = 'Finding you…';
    if (q) { gpsFix(+q[1], +q[2], 10); return; }
    gpsPaint(false);
    try {
      GPS.id = navigator.geolocation.watchPosition(function (p) { gpsFix(p.coords.latitude, p.coords.longitude, p.coords.accuracy); }, function (err) {
        GPS.msg = err && err.code === 1 ? 'Location is switched off for this app. Turn it on in your phone’s settings, then try again.' : 'Your phone could not find its position. Try again in the open air.';
        gpsPaint(false);
      }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 25000 });
    } catch (e) { GPS.msg = 'Your phone could not find its position.'; gpsPaint(false); }
  }
  function gpsStop(quiet) {
    try { if (GPS.id != null) navigator.geolocation.clearWatch(GPS.id); } catch (e) {}
    GPS.id = null; GPS.on = false; GPS.manual = false; GPS.msg = '';
    if (R.map) R.map.me = null;
    if (!quiet) gpsPaint(false);
  }
  function gpsDemo() { var st = R.map, list = DEMO[st.m], s = list[GPS.demo % list.length]; GPS.demo++; gpsFix(s[0], s[1], 10, s[2]); }

  /* the lessons */
  function books(x) {
    return (x.bk || []).map(function (b) {
      return '<a class="btn ghost small" href="' + esc(b.url) + '" target="_blank" rel="noopener">' + (b.kind === 'pdf' ? 'Get the text (PDF)' : 'Read the text') + (x.bk.length > 1 ? ': ' + esc(b.en) : '') + '</a>';
    }).join('');
  }
  function lessonHTML(m, x, on) {
    var D = LES.masjid[m], t = D.teachers[x.t] || {}, p = D.places[x.p] || {};
    return '<article class="step lessoncard"><div class="sh">' + (on ? '<span class="lab now">Likely on now</span>' : '') + '<span class="lab ' + (x.lang === 'Arabic' ? 'plain' : 'alt') + '">' + esc(x.lang) + '</span>' + (x.live ? '<span class="lab plain">Broadcast live</span>' : '') + '</div>' +
      '<button class="who2" data-go="teacher-' + m + '-' + esc(x.t) + '">' + face(m, x.t) + '<span class="ct"><b>' + esc(t.en || t.ar || '') + '</b>' + (t.en ? '<small lang="ar" dir="rtl">' + esc(t.ar) + '</small>' : '') + '<small>About the teacher ›</small></span></button>' +
      '<h3>' + esc(x.en || x.ar) + '</h3>' + (x.en ? '<p class="ar2" lang="ar" dir="rtl">' + esc(x.ar) + '</p>' : '') +
      '<p><b>Where: </b>' + esc(p.en || p.ar || '') + (p.floor ? ' (' + esc(p.floor.toLowerCase()) + ')' : '') + '</p>' +
      '<div class="two">' + (p.lat ? '<button class="btn ghost small" data-act="show-place" data-m="' + m + '" data-p="' + esc(x.p) + '">Show on map</button>' : '') +
      (x.live && D.live ? '<a class="btn ghost small" href="' + esc(D.live) + '" target="_blank" rel="noopener">Watch live</a>' : '') + books(x) + '</div>' + planBtn(m, x) + '</article>';
  }
  /* ---- my classes: the lessons the pilgrim means to attend, and a way into their own calendar ---- */
  function lid(m, x) { return [m, x.d, x.s, x.t, x.p].join('|'); }
  function planBtn(m, x) {
    var on = !!S.plan[lid(m, x)];
    return '<button class="btn ' + (on ? 'ghost' : '') + ' small wide" data-act="plan" data-id="' + esc(lid(m, x)) + '" aria-pressed="' + on + '">' + (on ? '✓ In my classes. Remove' : 'Add to my classes') + '</button>';
  }
  function planned() {
    var out = [];
    ['makkah', 'madinah'].forEach(function (m) {
      var D = LES.masjid[m]; if (!D) return;
      days(m).forEach(function (d) {
        if (d.i < 0 || !d.date) return;
        var T = prayerTimes(m, d.date);
        D.lessons.forEach(function (x) {
          if (x.d !== d.key || !S.plan[lid(m, x)]) return;
          var w = T ? slotWindow(x.s, T) : null, a = w ? w[0] + 5 * 60000 : 0;
          out.push({ m: m, x: x, d: d, a: a, b: w ? Math.min(w[1], a + 60 * 60000) : 0 });
        });
      });
    });
    return out.sort(function (p, q) { return p.a - q.a; });
  }
  function planCount() { return planned().length; }
  function evText(e) {
    var D = LES.masjid[e.m], t = D.teachers[e.x.t] || {}, p = D.places[e.x.p] || {};
    return { title: 'Lesson: ' + (e.x.en || e.x.ar) + (t.en ? ' (' + t.en + ')' : ''), where: (p.en || p.ar || '') + ', ' + MAPS[e.m].title + ', ' + CITY[e.m],
      note: 'After ' + e.x.s.charAt(0).toUpperCase() + e.x.s.slice(1) + ' prayer. ' + e.x.lang + '. The start time is an estimate from the prayer time: lessons begin shortly after the prayer and can be moved or cancelled. Official schedule: ' + D.page };
  }
  function stamp(ms) { return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z'); }
  function gcal(e) {
    var v = evText(e);
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(v.title) + '&dates=' + stamp(e.a) + '/' + stamp(e.b) + '&location=' + encodeURIComponent(v.where) + '&details=' + encodeURIComponent(v.note);
  }
  function icsText(list) {
    function q(t) { return String(t).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n'); }
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Haramain Path//EN', 'CALSCALE:GREGORIAN'];
    list.forEach(function (e) {
      var v = evText(e);
      L.push('BEGIN:VEVENT', 'UID:' + lid(e.m, e.x).replace(/[^\w]/g, '-') + '@umrah-companion', 'DTSTAMP:' + stamp(Date.now()), 'DTSTART:' + stamp(e.a), 'DTEND:' + stamp(e.b),
        'SUMMARY:' + q(v.title), 'LOCATION:' + q(v.where), 'DESCRIPTION:' + q(v.note), 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + q(v.title), 'TRIGGER:-PT30M', 'END:VALARM', 'END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.join('\r\n');
  }
  function icsSave() {
    var list = planned().filter(function (e) { return e.a; });
    if (!list.length) { toast('Add a class first'); return; }
    try {
      var url = URL.createObjectURL(new Blob([icsText(list)], { type: 'text/calendar' })), a = document.createElement('a');
      a.href = url; a.download = 'my-classes.ics'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      toast('Calendar file made. Open it to add the classes');
    } catch (e) { toast('This phone could not make the file. Use the Google Calendar buttons'); }
  }
  function vPlan() {
    var list = planned(), h = top('My classes', 'lessons-' + (S.masjid || 'makkah'), 'Your own timetable') + '<section class="pad">', last = '';
    if (!list.length) return h + '<div class="card"><h3>Choose your classes</h3><p>Open the lessons and press “Add to my classes” on the ones you want to attend. They gather here in order, ready to go into your own calendar.</p><div class="two"><button class="btn small" data-go="lessons-makkah">Makkah lessons</button><button class="btn small" data-go="lessons-madinah">Madinah lessons</button></div></div></section>';
    h += '<div class="card"><p>' + list.length + (list.length === 1 ? ' class' : ' classes') + ' chosen. Put them all into your calendar with one file (iPhone, Outlook and most others), or one at a time into Google Calendar. Each comes with a reminder 30 minutes before.</p>' +
      '<button class="btn" data-act="ics">Add all to my calendar</button>' + (ENV.preview ? '<p class="hint">On this private link the file may be blocked. The Google Calendar buttons below work everywhere.</p>' : '') + '</div>';
    list.forEach(function (e) {
      var D = LES.masjid[e.m], t = D.teachers[e.x.t] || {}, p = D.places[e.x.p] || {}, day = e.d.label + (e.d.i < 2 ? ', ' + e.d.sub : '') + ' · ' + CITY[e.m];
      if (day !== last) { h += '<h2 class="gh">' + esc(day) + '</h2>'; last = day; }
      h += '<article class="step lessoncard"><p class="where">About ' + esc(clock(new Date(e.a))) + ' Saudi time, after ' + e.x.s.charAt(0).toUpperCase() + e.x.s.slice(1) + '</p>' +
        '<button class="who2" data-go="teacher-' + e.m + '-' + esc(e.x.t) + '">' + face(e.m, e.x.t) + '<span class="ct"><b>' + esc(e.x.en || e.x.ar) + '</b><small>' + esc(t.en || t.ar || '') + '</small></span></button>' +
        '<p><b>Where: </b>' + esc(p.en || p.ar || '') + '</p><div class="two">' + (p.lat ? '<button class="btn ghost small" data-act="show-place" data-m="' + e.m + '" data-p="' + esc(e.x.p) + '">Show on map</button>' : '') +
        '<a class="btn ghost small" href="' + esc(gcal(e)) + '" target="_blank" rel="noopener">Google Calendar</a><button class="btn ghost small" data-act="plan" data-id="' + esc(lid(e.m, e.x)) + '">Remove</button></div></article>';
    });
    return h + '<p class="credit">Times are estimates, shown in your phone’s time zone.</p></section>';
  }
  function vTeacher(m, id) {
    var D = LES.masjid[m], t = D && D.teachers[id]; if (!t) return vLessons(m || 'makkah');
    var h = top(t.en || t.ar, 'lessons-' + m, 'Teacher at ' + MAPS[m].title) + '<section class="pad"><div class="card tcard">' + face(m, id, 'bigface') +
      '<p class="ar2 c" lang="ar" dir="rtl">' + esc(t.ar) + '</p>' + (t.bio ? '<p>' + esc(t.bio) + '</p>' : '<p class="hint">A short biography has not been confirmed from a reliable source yet.</p>') +
      (t.src && t.src.length ? '<p class="src">Source: ' + t.src.map(function (u, i) { return '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(u.split('/')[2]) + '</a>'; }).join(', ') + '. Portrait: Presidency of Religious Affairs.</p>' : '<p class="src">Portrait: Presidency of Religious Affairs.</p>') + '</div>';
    var ds = days(m), any = false;
    ds.forEach(function (d) {
      var L = D.lessons.filter(function (x) { return x.d === d.key && x.t === id; });
      if (!L.length) return;
      any = true; h += '<h2 class="gh">' + esc(d.label) + (d.i < 2 ? '' : '') + '</h2>';
      L.forEach(function (x) { var p = D.places[x.p] || {}; h += '<article class="step"><p class="where">After ' + x.s.charAt(0).toUpperCase() + x.s.slice(1) + '</p><h3>' + esc(x.en || x.ar) + '</h3><p>' + esc(p.en || p.ar || '') + '</p><div class="two">' + (p.lat ? '<button class="btn ghost small" data-act="show-place" data-m="' + m + '" data-p="' + esc(x.p) + '">Show on map</button>' : '') + books(x) + '</div></article>'; });
    });
    if (!any) h += '<p class="hint">No lessons are listed for this teacher in the saved days.</p>';
    return h + '</section>';
  }
  /* the class that is on now, or starts within the hour: offered once as a pop-up */
  function upcoming() {
    var order = S.masjid === 'madinah' ? ['madinah', 'makkah'] : ['makkah', 'madinah'], hit = null, now = Date.now();
    order.forEach(function (m) {
      var D = LES.masjid[m], ds = D ? days(m) : [], d0 = ds.length && ds[0].i === 0 ? ds[0] : null, T = d0 ? prayerTimes(m, d0.date) : null;
      if (!T || hit) return;
      D.lessons.forEach(function (x) {
        if (hit || x.d !== d0.key) return;
        var w = slotWindow(x.s, T);
        if (now >= w[0] - 3600000 && now <= w[1]) hit = { m: m, x: x, on: now >= w[0], at: T[x.s] };
      });
    });
    return hit;
  }
  function popup() {
    var u = R.pop, D, t, p;
    if (!u) return '';
    D = LES.masjid[u.m]; t = D.teachers[u.x.t] || {}; p = D.places[u.x.p] || {};
    return '<div class="sheet" role="dialog" aria-label="A class"><div class="sheetcard">' + face(u.m, u.x.t, 'bigface') +
      '<p class="hk">' + (u.on ? 'On now in ' : 'Soon in ') + CITY[u.m] + '</p><h3>' + esc(u.x.en || u.x.ar) + '</h3>' +
      '<p><b>' + esc(t.en || t.ar || '') + '</b></p><p>' + esc(p.en || p.ar || '') + '</p>' +
      '<p class="hint">' + (u.on ? 'It began after ' : 'It begins after ') + u.x.s.charAt(0).toUpperCase() + u.x.s.slice(1) + ', about ' + esc(clock(u.at)) + ' Saudi time. ' + esc(u.x.lang) + '.</p>' +
      '<div class="two">' + (p.lat ? '<button class="btn small" data-act="show-place" data-m="' + u.m + '" data-p="' + esc(u.x.p) + '">Show on map</button>' : '') + '<button class="btn ghost small" data-act="pop-close">Close</button></div></div></div>';
  }
  /* a month at a glance: the days that have classes carry their number, and you tap one to see it */
  function monthGrid(m, ds, sel) {
    var D = LES.masjid[m], by = {}, months = [], h = '', today = saudiYMD(new Date());
    var MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    ds.forEach(function (d) {
      if (!d.date) return;
      var p = saudiYMD(d.date), k = p.year + '-' + p.month + '-' + p.day, mk = p.year + '-' + p.month;
      var n = 0, mine = 0; D.lessons.forEach(function (x) { if (x.d === d.key) { n++; if (S.plan[lid(m, x)]) mine++; } });
      by[k] = { d: d, n: n, mine: mine };
      if (months.indexOf(mk) < 0) months.push(mk);
    });
    /* this month and the three after it, side by side: swipe left and right, or use the two buttons */
    months = [];
    for (var q = 0; q < 4; q++) { var md = new Date(Date.UTC(+today.year, +today.month - 1 + q, 1)); months.push(md.getUTCFullYear() + '-' + (md.getUTCMonth() + 1)); }
    var selP = sel && sel.date ? saudiYMD(sel.date) : today, selM = selP.year + '-' + selP.month;
    h += '<div class="cals" id="cals">';
    months.forEach(function (mk, mi) {
      var y = +mk.split('-')[0], mo = +mk.split('-')[1], first = new Date(Date.UTC(y, mo - 1, 1)).getUTCDay(), len = new Date(Date.UTC(y, mo, 0)).getUTCDate(), i;
      h += '<div class="cal"' + (mk === selM ? ' data-cur="1"' : '') + '><div class="calt"><button class="calb" data-act="cal-go" data-v="-1" aria-label="Previous month"' + (mi === 0 ? ' disabled' : '') + '>‹</button><p class="calh">' + MN[mo - 1] + ' ' + y + '</p><button class="calb" data-act="cal-go" data-v="1" aria-label="Next month"' + (mi === months.length - 1 ? ' disabled' : '') + '>›</button></div><div class="calg">' + ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(function (w) { return '<span class="cw">' + w + '</span>'; }).join('');
      for (i = 0; i < first; i++) h += '<span></span>';
      for (i = 1; i <= len; i++) {
        var e = by[y + '-' + mo + '-' + i], isT = +today.year === y && +today.month === mo && +today.day === i, cls = 'cd' + (isT ? ' today' : '');
        if (e && e.n) h += '<button class="' + cls + ' has" data-act="day" data-m="' + m + '" data-v="' + e.d.key + '" aria-pressed="' + (sel && e.d.key === sel.key) + '" aria-label="' + i + ' ' + MN[mo - 1] + ', ' + e.n + ' classes"><b>' + i + '</b><small>' + e.n + (e.mine ? ' ✓' : '') + '</small></button>';
        else h += '<span class="' + cls + '"><b>' + i + '</b></span>';
      }
      h += '</div></div>';
    });
    return h + '</div>';
  }
  function vLessons(m) {
    var D = LES.masjid[m]; if (!D || !MAPS[m]) return vHome();
    remember(m);
    var ds = days(m), sel = null, when = LES.read || '';
    ds.forEach(function (d) { if (d.key === R.day[m]) sel = d; });
    if (!sel) sel = ds[0] || null;
    try { when = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(LES.read)); } catch (e) {}
    var h = top('Classes', '', MAPS[m].title) + '<section class="pad">' + masjidHead(m, 'lessons');
    h += '<button class="rowb solo" data-go="plan"><span class="ct"><b>My classes</b><small>' + (planCount() ? planCount() + ' chosen. Add them to your calendar' : 'Pick the lessons you want and add them to your calendar') + '</small></span><span class="chev">›</span></button>';
    if (!sel) h += '<div class="card"><h3>This saved schedule has ended</h3><p>Open the official schedule for today’s lessons. The usual lesson places are still marked on the map.</p></div>';
    else {
      h += monthGrid(m, ds, sel);
      h += '<h2 class="gh big">' + esc(sel.label + (sel.i < 2 ? ', ' + sel.sub : ' · ' + sel.sub)) + '</h2>';
      var T = sel.date ? prayerTimes(m, sel.date) : null, now = Date.now(), L = D.lessons.filter(function (x) { return x.d === sel.key; });
      if (!L.length) h += '<p class="hint">No classes are listed for this day. Choose another day.</p>';
      SLOTS.forEach(function (s) {
        var list = L.filter(function (x) { return x.s === s[0]; }), on = false;
        if (!list.length) return;
        if (T && sel.i === 0) { var w = slotWindow(s[0], T); on = now >= w[0] && now <= w[1]; }
        h += '<h2 class="slot"><span>After ' + s[1] + '</span>' + (T ? '<small>about <b>' + esc(clock(T[s[0]])) + '</b> Saudi time</small>' : '') + '</h2>';
        list.forEach(function (x) { h += lessonHTML(m, x, on); });
      });
    }
    h += '<a class="btn ghost small" href="' + esc(D.page) + '" target="_blank" rel="noopener">Open the official schedule</a><p class="credit">Updated ' + esc(when) + '. Classes can move or be cancelled.</p>';
    return h + '</section>';
  }

  /* ---------- drawing, moving between screens ---------- */
  function addChrome(r) {
    if (r === 'setup' || r === 'help' || r.indexOf('help-') === 0) return;
    var where = view.querySelector('header.top') || view.querySelector('.mapbox');
    if (where) where.insertAdjacentHTML('beforeend', '<button class="helpbtn" data-go="help">Help</button>');
  }
  function render() {
    document.documentElement.setAttribute('data-size', String(S.size || 0));
    var r = S.setup ? R.route : 'setup', tab = 'home', h;
    if (r === 'umrah') r = 'stage-' + stepNow();
    else if (r === 'learn' || r === 'perform') r = 'steps';
    else if (r.indexOf('read-') === 0) r = 'stage-' + r.slice(5);
    if (r === 'setup') { h = vSetup(); tab = S.setup ? 'home' : ''; }
    else if (r.indexOf('doc-') === 0) { h = vDoc(+r.slice(4)); tab = 'prepare'; }
    else if (r === 'prepare' || r === 'prep-duas' || r === 'prep-card' || r === 'prep-docs') { h = vPrepare(r); tab = 'prepare'; }
    else if (r === 'steps') { h = vSteps(); tab = 'umrah'; }
    else if (r.indexOf('lesson-') === 0) { h = vLesson(r.slice(7)); tab = 'umrah'; }
    else if (r.indexOf('stage-') === 0) { h = vStory(+r.slice(6)); tab = 'umrah'; }
    else if (r.indexOf('where-') === 0) { h = vWhere(+r.slice(6)); tab = 'umrah'; }
    else if (r.indexOf('details-') === 0) { h = vDetails(+r.slice(8)); tab = 'umrah'; if (!S.read['s' + r.slice(8)]) { S.read['s' + r.slice(8)] = true; save(); } }
    else if (r === 'count-tawaf' || r === 'count-sai') { h = vCount(r.slice(6)); tab = 'umrah'; }
    else if (r === 'maps' || r.indexOf('map-') === 0) { h = vMap(r === 'maps' ? (S.masjid || 'makkah') : r.slice(4)); tab = 'maps'; }
    else if (r.indexOf('lessons-') === 0) { h = vLessons(r.slice(8)); tab = 'maps'; }
    else if (r === 'duas') { h = vDuas(); tab = 'home'; }
    else if (r === 'floors-makkah') { h = vFloors(); tab = 'maps'; }
    else if (r === 'plan') { h = vPlan(); tab = 'maps'; }
    else if (r.indexOf('teacher-') === 0) { h = vTeacher(r.split('-')[1], r.split('-')[2]); tab = 'maps'; }
    else if (r === 'help') { h = vHelp(); tab = 'help'; }
    else if (r.indexOf('help-') === 0) { h = vHelpItem(r.slice(5)); tab = 'help'; }
    else if (r === 'card') { h = vCard(); tab = 'help'; }
    else { R.route = 'home'; h = vHome(); }
    if (r.indexOf('map-') !== 0 && R.mapFull) { R.mapFull = false; }
    document.documentElement.classList.toggle('mapfull', !!R.mapFull);
    if (r === 'home' && !R.popDone) { R.popDone = true; try { R.pop = upcoming(); } catch (e) { R.pop = null; } }
    document.documentElement.classList.toggle('storyon', r.indexOf('stage-') === 0);
    view.innerHTML = h + (R.pop && (r === 'home' || r.indexOf('lessons-') === 0) ? popup() : '');
    addChrome(r);
    if (document.querySelector('img[data-doc]')) docPaint();
    var cals = document.getElementById('cals'), curM = cals ? cals.querySelector('[data-cur]') : null;
    if (curM) cals.scrollLeft = curM.offsetLeft - cals.offsetLeft;
    R.redraw = null;
    if (tab === 'maps') mapSetup();
    if (window.UMRAH_3D && !document.getElementById('map3d')) window.UMRAH_3D.hide();
    tabs.hidden = !tab;
    if (r.indexOf('lessons-') === 0 || r === 'plan' || r.indexOf('teacher-') === 0) tab = 'classes';
    /* the steps and Get ready live together under the Umrah tab; Help is a button at the top */
    if (tab === 'prepare') tab = 'umrah';
    if (tab === 'help') tab = 'none';
    var TL = forClasses() ? TABS_CLASSES : TABS_UMRAH;
    tabs.innerHTML = tab ? TL.map(function (t) { var to = t[0] === 'classes' ? 'lessons-' + (S.masjid || 'makkah') : t[0]; return '<a href="#' + to + '" data-go="' + to + '"' + (t[0] === tab ? ' aria-current="page"' : '') + '>' + t[1] + '</a>'; }).join('') : '';
  }
  var lock = null;
  function wake() {
    var need = R.route.indexOf('count-') === 0;
    try {
      if (need && !lock && navigator.wakeLock && document.visibilityState === 'visible') {
        navigator.wakeLock.request('screen').then(function (l) { lock = l; l.addEventListener('release', function () { lock = null; }); }).catch(function () {});
      } else if (!need && lock) { lock.release(); lock = null; }
    } catch (e) {}
  }
  function go(route) {
    if (GPS.on && !/^(maps$|map-)/.test(route)) gpsStop(true);
    R.route = route; R.ask = '';
    try { if (location.hash.slice(1) !== route) location.hash = route; } catch (e) {}
    render(); window.scrollTo(0, 0); wake();
  }

  /* ---------- what each button does ---------- */
  function act(a, t) {
    var k = t.getAttribute('data-k'), i = +t.getAttribute('data-i'), el;
    if (a === 'set') { S[k] = t.getAttribute('data-v'); save(); render(); }
    else if (a === 'setup-done') {
      if (!S.purpose && S.setup) S.purpose = 'both';
      if (!S.purpose) { toast('Choose what brings you here'); return; }
      if (S.purpose !== 'classes' && !(S.gender && S.school && S.route)) { toast('Answer the three questions first'); return; }
      S.setup = true; R.popDone = false; save(); go('home');
    }
    else if (a === 'purpose-both') { if (S.purpose === 'classes' || !S.purpose) S.purpose = 'both'; save(); if (S.gender && S.school && S.route) go('home'); else go('setup'); }
    else if (a === 'size') { S.size = +t.getAttribute('data-v'); save(); render(); }
    else if (a === 'check') { var id = t.getAttribute('data-id'); S.checks[id] = !S.checks[id]; save(); render(); }
    else if (a === 'dua-add') {
      el = document.getElementById('dua-in'); var v = el ? el.value.trim() : '';
      if (!v) { toast('Type a dua or a name first'); return; }
      S.duas.push({ t: v, done: false, g: R.duaGroup || 'me', w: R.duaWhen || 'any' }); save(); render();
      el = document.getElementById('dua-in'); if (el) el.focus();
    }
    else if (a === 'dua-tick') { if (S.duas[i]) { S.duas[i].done = !S.duas[i].done; save(); render(); } }
    else if (a === 'dua-del') { S.duas.splice(i, 1); save(); render(); }
    else if (a === 'read') { S.read[t.getAttribute('data-id')] = true; save(); go('steps'); }
    else if (a === 'stage-done') { var n = +t.getAttribute('data-n'); S.read['s' + n] = true; if (S.live) S.done[n] = true; save(); go(n < TOTAL ? 'stage-' + (n + 1) : S.live ? 'home' : 'steps'); }
    else if (a === 'live') { S.live = true; save(); R.look = nextStage() || 1; go('stage-' + R.look); toast('Your Umrah has started. Next step now marks each one done.'); }
    else if (a === 'count') {
      var now = Date.now();
      if (now - R.lastTap < 1200) { toast('Counted. One tap for each ' + (k === 'tawaf' ? 'round' : 'lap') + '.'); return; }
      R.lastTap = now;
      if (S[k] < 7) { S[k]++; save(); buzz(S[k] >= 7 ? [70, 60, 70] : 40); }
      render(); el = view.querySelector('.tap, .count .btn'); if (el) el.focus({ preventScroll: true });
    }
    else if (a === 'undo') { if (S[k] > 0) { S[k]--; save(); } R.lastTap = 0; render(); }
    else if (a === 'count-next') {
      C.stages.forEach(function (s) { if (s.counter === k) { if (S.live) S.done[s.id] = true; save(); go('stage-' + (s.id + 1)); } });
    }
    else if (a === 'ask') { R.ask = k || ''; render(); el = k === 'restart' && view.querySelector('[data-act="yes"]'); if (el) el.closest('.card').scrollIntoView({ block: 'center' }); }
    else if (a === 'yes') {
      R.ask = '';
      if (k === 'restart') { S.done = {}; S.live = false; S.tawaf = 0; S.sai = 0; S.duas.forEach(function (d) { d.done = false; }); R.look = 0; save(); go('stage-1'); toast('Your Umrah is reset. You are at step 1.'); }
      else if (k === 'reset-tawaf') { S.tawaf = 0; save(); render(); }
      else if (k === 'reset-sai') { S.sai = 0; save(); render(); }
      else if (k === 'erase') { try { window.localStorage.removeItem(KEY); } catch (e) {} idb('readwrite', function (st) { return st.clear(); }).catch(function () {}); S = fresh(); go('setup'); }
    }
    else if (a === 'layer') { R.layers[k] = !R.layers[k]; render(); }
    else if (a === 'zoom') {
      var z = +t.getAttribute('data-v'), MM = MAPS[R.map.m];
      if (document.getElementById('map3d') && window.UMRAH_3D && R.redraw) {
        if (z) window.UMRAH_3D.zoom(z); else { window.UMRAH_3D.reset(); if (R.topView) { R.topView = false; render(); } }
      } else {
        if (!z) { R.map.k = MM.start.k; R.map.cx = MM.start.cx; R.map.cy = MM.start.cy; } else R.map.k = Math.max(1, Math.min(14, R.map.k * z));
        if (R.redraw) R.redraw();
      }
    }
    else if (a === 'floor') { R.floor = +t.getAttribute('data-v'); render(); }
    else if (a === 'turn') { if (window.UMRAH_3D) window.UMRAH_3D.turn(+t.getAttribute('data-v')); }
    else if (a === 'north') { if (window.UMRAH_3D) window.UMRAH_3D.north(); }
    else if (a === 'mapmode') { S.mapMode = t.getAttribute('data-v'); save(); render(); }
    else if (a === 'tilt') { R.topView = !R.topView; if (window.UMRAH_3D && R.redraw) window.UMRAH_3D.tilt(R.topView); render(); }
    else if (a === 'find-gate') { findGate(); }
    else if (a === 'at-gate') { var gi2 = t.getAttribute('data-i'); gi2 = gi2 != null ? +gi2 : gateIndex(); if (gi2 >= 0) atGate(gi2); }
    else if (a === 'gps') { gpsStart(); }
    else if (a === 'gps-stop') { gpsStop(); }
    else if (a === 'gps-demo') { gpsDemo(); }
    else if (a === 'show-place') { showPlace(t.getAttribute('data-m'), t.getAttribute('data-p')); }
    else if (a === 'cal-go') { var cs = document.getElementById('cals'); if (cs) cs.scrollLeft += (+t.getAttribute('data-v')) * cs.clientWidth; }
    else if (a === 'day') { R.day[t.getAttribute('data-m')] = t.getAttribute('data-v'); render(); }
    else if (a === 'spot-close') { if (R.map) { R.sheetOff = R.map.m + R.map.sel; if (R.redraw) R.redraw(); } }
    else if (a === 'map-full') { R.mapFull = !R.mapFull; var mb = document.querySelector('.mapbox'); if (mb) mb.classList.toggle('full', R.mapFull); document.documentElement.classList.toggle('mapfull', R.mapFull); t.textContent = R.mapFull ? 'Close full screen' : 'Full screen'; window.dispatchEvent(new Event('resize')); if (R.redraw) R.redraw(); }
    else if (a === 'pop-close') { R.pop = null; render(); }
    else if (a === 'plan') { var pk = t.getAttribute('data-id'); if (S.plan[pk]) delete S.plan[pk]; else S.plan[pk] = 1; save(); toast(S.plan[pk] ? 'Added to my classes' : 'Removed'); render(); }
    else if (a === 'ics') { icsSave(); }
    else if (a === 'nav') { navStart(+t.getAttribute('data-i')); }
    else if (a === 'nav-stop') { R.nav = null; gpsPaint(false); }
    else if (a === 'inside') { if (window.UMRAH_3D && R.redraw) { window.UMRAH_3D.inside(); } }
    else if (a === 'hotel-find') { hotelFind(); }
    else if (a === 'hotel-pick') { hotelPick(+t.getAttribute('data-i')); }
    else if (a === 'hotel-gate') { var hm = t.getAttribute('data-m'); R.layers.gate = true; focusPin(hm, +t.getAttribute('data-i')); go('map-' + hm); }
    else if (a === 'doc-kind') { R.docKind = t.getAttribute('data-v'); render(); }
    else if (a === 'doc-ask') { R.docDel = +t.getAttribute('data-id'); render(); }
    else if (a === 'doc-keep') { R.docDel = 0; render(); }
    else if (a === 'doc-del') { var did = +t.getAttribute('data-id'); idb('readwrite', function (st) { return st.delete(did); }).catch(function () {}); S.docs = S.docs.filter(function (x) { return x.id !== did; }); R.docDel = 0; save(); go('prep-docs'); }
    else if (a === 'dua-when') { R.duaWhen = t.getAttribute('data-v'); render(); }
    else if (a === 'dua-idea') { S.duas.push({ t: t.getAttribute('data-t'), done: false, g: R.duaGroup || 'me', w: R.duaWhen || 'any' }); save(); toast('Added'); render(); }
    else if (a === 'dua-group') { R.duaGroup = t.getAttribute('data-v'); render(); }
    else if (a === 'listen') { toast('Audio is not recorded yet. A reciter will record it.'); }
  }
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-go],[data-act]') : null;
    if (!t) return;
    var g = t.getAttribute('data-go');
    if (g) { e.preventDefault(); go(g); return; }
    act(t.getAttribute('data-act'), t);
  });
  function typed(e) {
    var t = e.target; if (!t || !t.getAttribute) return;
    var ck = t.getAttribute('data-card');
    if (ck) { S.card[ck] = t.value; save(); }
    else if (t.id === 'f-date') { S.date = t.value; save(); }
    else if (t.id === 'doc-file' && e.type === 'change') { docAdd(t.files && t.files[0]); }
    else if (t.id === 'hotel-q') { R.hotelQ = t.value; }
  }
  document.addEventListener('input', typed);
  document.addEventListener('change', typed);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && e.target.id === 'dua-in') { e.preventDefault(); act('dua-add', e.target); }
    if (e.key === 'Enter' && e.target && e.target.id === 'hotel-q') { e.preventDefault(); hotelFind(); }
    if (e.key === 'Enter' && e.target && e.target.id === 'gate-in') { e.preventDefault(); findGate(); }
  });
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('hashchange', function () {
    var h = ''; try { h = location.hash.slice(1); } catch (e) {}
    if (h && h !== R.route && ROUTE.test(h)) { R.route = h; R.ask = ''; render(); window.scrollTo(0, 0); wake(); }
  });

  /* ---------- start ---------- */
  var h0 = ''; try { h0 = location.hash.slice(1); } catch (e) {}
  if (h0 && ROUTE.test(h0)) R.route = h0;
  render(); wake();

  /* A newer lesson schedule, when the app sits on its own web address and the phone is online. The saved copy is used otherwise. */
  if (!ENV.preview && (ENV.lessonsUrl || /^https?:$/.test(location.protocol)) && window.fetch) {
    fetch(ENV.lessonsUrl || 'lessons.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d && d.read && d.masjid && d.read > (LES.read || '')) { LES = d; pinCache = {}; if (/^(home|maps|map-|lessons-)/.test(R.route)) render(); }
    }).catch(function () {});
  }

  /* Offline copy: only on a real https address (or with ?sw=1 while testing on this Mac). The private preview page cannot use it. */
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if (ENV.sw && 'serviceWorker' in navigator && (location.protocol === 'https:' || (local && /[?&]sw=1/.test(location.search)))) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
