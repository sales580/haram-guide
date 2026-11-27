/* Umrah Companion: the 3D map.
   Needs three.js r128 (window.THREE), its OrbitControls file (THREE.MapControls) and scene.js (window.UMRAH_SCENE).
   One canvas is kept for the whole visit and moved into whichever map screen is open. The picture is drawn only
   when the view changes, so it costs nothing while the pilgrim is reading.
   Scene units are metres: x east, y up, z south. Marker positions come in the flat map's grid (x east, y south). */
(function () {
  'use strict';
  var V = { renderer: null, canvas: null, overlay: null, camera: null, controls: null, scenes: {}, cams: {}, cur: '', host: null, opts: null, down: null };

  function supported() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; }
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }

  /* ---------- building the model ---------- */
  function shapeOf(T, p, cx, cz) {
    var s = new T.Shape();
    for (var i = 0; i < p.length; i += 2) { var x = p[i] - cx, y = -(p[i + 1] - cz); if (i === 0) s.moveTo(x, y); else s.lineTo(x, y); }
    return s;
  }
  function buildScene(m) {
    var T = window.THREE, D = window.UMRAH_SCENE[m], scene = new T.Scene(), cx = D.w / 2, cz = D.h / 2;
    var MB = { pos: [], nor: [], col: [] }, KB = { pos: [], nor: [], col: [] }, pal = D.palette.map(function (c) { return new T.Color(window.HG_LOOK && window.HG_LOOK.recolor ? window.HG_LOOK.recolor(c) : c); });
    function push(geom, wall, roof, base, keep) {
      var B = keep ? KB : MB, pos = B.pos, nor = B.nor, col = B.col;
      var g = geom.index ? geom.toNonIndexed() : geom;
      if (!g.attributes.normal) g.computeVertexNormals();
      var p = g.attributes.position.array, n = g.attributes.normal.array;
      for (var i = 0; i < p.length; i += 3) {
        var up = n[i + 1] > 0.6, c = up ? roof : wall, k = 1;
        /* walls are a little darker near the ground: a cheap stand-in for shadow that gives the blocks weight */
        if (!up && base !== null) k = 0.9 + 0.1 * Math.min(1, Math.max(0, (p[i + 1] - base) / 14));
        pos.push(p[i], p[i + 1], p[i + 2]); nor.push(n[i], n[i + 1], n[i + 2]); col.push(c.r * k, c.g * k, c.b * k);
      }
      if (g !== geom) g.dispose();
      geom.dispose();
    }
    var ground = new T.PlaneGeometry(9000, 9000); ground.rotateX(-Math.PI / 2);
    var gc = (window.HG_LOOK && window.HG_LOOK.earth) || '#d8d0be';
    push(ground, new T.Color(gc), new T.Color(gc), null, true);
    var base = !!window.UMRAH_BASE;
    (base ? [] : D.flats).forEach(function (f) {
      var g = new T.ShapeGeometry(shapeOf(T, f.p, cx, cz)); g.rotateX(-Math.PI / 2); g.translate(0, f.y, 0);
      push(g, pal[f.c], pal[f.c], null, true);
    });
    D.solids.forEach(function (s) {
      var p = s.p, wall = pal[s.c], roof = pal[s.rc != null ? s.rc : s.c], wallTop = s.t - (s.rh || 0), i;
      /* what stays whole when the roofs lift: the Ka'bah, the domes and the minarets */
      var ax0 = Infinity, ax1 = -Infinity, az0 = Infinity, az1 = -Infinity;
      for (i = 0; i < p.length; i += 2) { ax0 = Math.min(ax0, p[i]); ax1 = Math.max(ax1, p[i]); az0 = Math.min(az0, p[i + 1]); az1 = Math.max(az1, p[i + 1]); }
      var keep = D.palette[s.c] === '#1c1c1c' || !!s.r || (s.t > 45 && Math.max(ax1 - ax0, az1 - az0) < 26);
      if (wallTop - s.b > 0.05) {
        var shape = shapeOf(T, p, cx, cz);
        (s.q || []).forEach(function (h) {
          var path = new T.Path();
          for (var j = 0; j < h.length; j += 2) { var hx = h[j] - cx, hy = -(h[j + 1] - cz); if (j === 0) path.moveTo(hx, hy); else path.lineTo(hx, hy); }
          shape.holes.push(path);
        });
        var g = new T.ExtrudeGeometry(shape, { depth: wallTop - s.b, bevelEnabled: false, curveSegments: 1 });
        g.rotateX(-Math.PI / 2); g.translate(0, s.b, 0);
        push(g, wall, roof, s.b, keep);
      }
      if (s.r) {
        var x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, n = p.length / 2, rg;
        for (i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); z0 = Math.min(z0, p[i + 1]); z1 = Math.max(z1, p[i + 1]); }
        var rx = (x1 - x0) / 2, rz = (z1 - z0) / 2;
        if (s.r === 'd') { rg = new T.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2); rg.scale(rx, s.rh, rz); }
        else {
          rg = new T.ConeGeometry(1, 1, n <= 5 ? 4 : 16, 1);
          if (n <= 5) rg.rotateY(Math.PI / 4);
          rg.translate(0, 0.5, 0); rg.scale(n <= 5 ? rx * Math.SQRT2 : rx, s.rh, n <= 5 ? rz * Math.SQRT2 : rz);
        }
        rg.computeVertexNormals(); rg.translate((x0 + x1) / 2 - cx, wallTop, (z0 + z1) / 2 - cz);
        push(rg, roof, roof, null, keep);
      }
    });
    function mesh(B, mat) {
      var geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(B.pos, 3));
      geo.setAttribute('normal', new T.Float32BufferAttribute(B.nor, 3));
      geo.setAttribute('color', new T.Float32BufferAttribute(B.col, 3));
      var o = new T.Mesh(geo, mat); o.castShadow = true; o.receiveShadow = true; scene.add(o);
    }
    /* the buildings that can be opened: seen from both sides, and cut at head height when the view is close */
    scene.userData.open = new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide, clipShadows: true });
    mesh(MB, scene.userData.open);
    mesh(KB, new T.MeshLambertMaterial({ vertexColors: true }));
    /* soft sky light plus one sun that casts real shadows; the shadow picture is made once, as nothing moves */
    var hemi = new T.HemisphereLight(0xffffff, 0xd2c8b4, 0.66), sun = new T.DirectionalLight(0xfff0d2, 0.42), sc = sun.shadow.camera;
    sun.position.set(-760, 1300, 560); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 1.6;
    sc.left = -1000; sc.right = 1000; sc.top = 1000; sc.bottom = -1000; sc.near = 200; sc.far = 3600; sc.updateProjectionMatrix();
    scene.userData.hemi = hemi; scene.userData.sun = sun;
    scene.add(hemi); scene.add(sun);
    /* the drawn street map, laid flat under the buildings; its picture is made in ground() */
    var pg = new T.PlaneGeometry(1, 1); pg.rotateX(-Math.PI / 2);
    var pm = new T.Mesh(pg, new T.MeshLambertMaterial({ color: 0xffffff })); pm.receiveShadow = true; pm.visible = false; scene.add(pm);
    scene.userData.ground = pm;
    scene.userData.tris = (MB.pos.length + KB.pos.length) / 9;
    return scene;
  }
  function sky(T, top, bottom) {
    var c = document.createElement('canvas'); c.width = 2; c.height = 256;
    var x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, top); g.addColorStop(0.62, bottom); g.addColorStop(1, bottom);
    x.fillStyle = g; x.fillRect(0, 0, 2, 256);
    return new T.CanvasTexture(c);
  }
  /* Draw the street map onto the ground. It is redrawn only when day turns to night or back. */
  function ground() {
    var T = window.THREE, s = V.scenes[V.cur], m = V.cur, dark = !!(V.opts && V.opts.dark), pm = s && s.userData.ground;
    if (!pm || !V.opts || !V.opts.ground || s.userData.groundDark === dark) return;
    s.userData.groundDark = dark;
    var c = centreOf(m), max = V.renderer.capabilities.maxTextureSize || 2048;
    var g = V.opts.ground(dark, Math.min(max, (navigator.deviceMemory && navigator.deviceMemory < 4) ? 2048 : 4096));
    var tex = new T.CanvasTexture(g.canvas); tex.anisotropy = Math.min(8, V.renderer.capabilities.getMaxAnisotropy());
    if (pm.material.map) pm.material.map.dispose();
    pm.material.map = tex; pm.material.needsUpdate = true;
    pm.scale.set(g.w, 1, g.h); pm.position.set(g.x + g.w / 2 - c[0], 0.08, g.y + g.h / 2 - c[1]); pm.visible = true;
  }
  function theme() {
    var T = window.THREE, s = V.scenes[V.cur], dark = !!(V.opts && V.opts.dark);
    if (!s) return;
    if (!V.skies) V.skies = { day: sky(T, '#8fbbe0', '#e6ece8'), night: sky(T, '#0a1626', '#2a3f52') };
    s.background = dark ? V.skies.night : V.skies.day;
    s.fog = new T.Fog(dark ? 0x2a3f52 : 0xe6ece8, 1300, 4200);
    s.userData.hemi.intensity = dark ? 0.44 : 0.66;
    s.userData.hemi.color.set(dark ? 0xb7c8e2 : 0xffffff);
    s.userData.sun.intensity = dark ? 0.34 : 0.42;
    s.userData.sun.color.set(dark ? 0xffd9a0 : 0xfff0d2);
    V.renderer.shadowMap.needsUpdate = true;
    ground();
  }

  /* ---------- camera ---------- */
  function centreOf(m) { var D = window.UMRAH_SCENE[m]; return [D.w / 2, D.h / 2]; }
  function resetCam(m) {
    var D = window.UMRAH_SCENE[m], c = centreOf(m), tx = D.look[0] - c[0], tz = D.look[1] - c[1];
    V.controls.target.set(tx, 0, tz);
    V.camera.position.set(tx + D.cam[0], D.cam[1], tz + D.cam[2]);
    V.controls.update();
  }
  function keepClose() {
    var D = window.UMRAH_SCENE[V.cur], t = V.controls.target, lx = D.w / 2 + 350, lz = D.h / 2 + 350;
    var dx = Math.max(-lx, Math.min(lx, t.x)) - t.x, dz = Math.max(-lz, Math.min(lz, t.z)) - t.z;
    if (dx || dz || t.y) { V.camera.position.x += dx; V.camera.position.z += dz; t.x += dx; t.z += dz; t.y = 0; }
  }

  /* ---------- markers, drawn as ordinary page elements on top of the picture ---------- */
  var RANK = { lesson: 0, gate: 1, place: 2, wudu: 3, help: 4, cg: 5 };
  function markers() {
    var o = V.opts, T = window.THREE;
    if (!o) return;
    var w = V.canvas.clientWidth, h = V.canvas.clientHeight, c = centreOf(V.cur), v = new T.Vector3();
    var zoom = 950 / V.camera.position.distanceTo(V.controls.target), kept = [], html = '';
    function at(x, y, lift) {
      v.set(x - c[0], lift, y - c[1]).project(V.camera);
      if (v.z > 1 || v.z < -1) return null;
      var sx = (v.x * 0.5 + 0.5) * w, sy = (-v.y * 0.5 + 0.5) * h;
      return (sx < -20 || sy < -20 || sx > w + 20 || sy > h + 20) ? null : [sx, sy];
    }
    (o.labels || []).forEach(function (l) {
      var s = zoom >= (l[3] || 1) && zoom < 6 ? at(l[1], l[2], 2) : null;
      if (s) html += '<span class="lab3" style="left:' + s[0].toFixed(1) + 'px;top:' + s[1].toFixed(1) + 'px">' + esc(l[0]) + '</span>';
    });
    var list = [];
    o.pins.forEach(function (p, i) {
      var sel = i === o.sel;
      if (!sel) {
        if (p.k !== 'place' && !o.layers[p.k === 'cg' ? 'gate' : p.k]) return;
        if (zoom < (p.z || 1)) return;
      }
      var s = at(p.x, p.y, p.k === 'place' ? 3 : 2);
      if (s) list.push({ p: p, i: i, s: s, sel: sel });
    });
    list.sort(function (a, b) { return (b.sel - a.sel) || RANK[a.p.k] - RANK[b.p.k] || (a.p.z || 1) - (b.p.z || 1); });
    list.forEach(function (q) {
      var p = q.p, near = p.k === 'place' ? 46 : 21;
      if (!q.sel && p.k !== 'lesson') {
        for (var j = 0; j < kept.length; j++) if (kept[j].k === p.k && Math.abs(kept[j].x - q.s[0]) < near && Math.abs(kept[j].y - q.s[1]) < near * (p.k === 'place' ? 0.4 : 1)) return;
      }
      kept.push({ k: p.k, x: q.s[0], y: q.s[1] });
      var num = String(p.r || '').split(',')[0];
      var text = p.k === 'gate' || p.k === 'cg' ? num : p.k === 'wudu' ? 'W' : p.k === 'help' ? 'H' : p.k === 'lesson' ? 'L' : (p.s || p.n);
      if (p.k === 'lesson' && p.img) { html += '<button class="pin3 k-face' + (q.sel ? ' sel' : '') + '" data-pin="' + q.i + '" style="left:' + q.s[0].toFixed(1) + 'px;top:' + q.s[1].toFixed(1) + 'px" aria-label="' + esc(p.n) + '"><img src="' + p.img + '" alt=""></button>'; return; }
      var pic = p.k === 'wudu' || p.k === 'help' || p.k === 'lesson' || (p.k === 'gate' && !num);  /* gates with a number keep the number */
      html += '<button class="pin3 k-' + p.k + (pic ? ' ic' : '') + (q.sel ? ' sel' : '') + (p.big ? ' big' : '') + '" data-pin="' + q.i + '" style="left:' + q.s[0].toFixed(1) + 'px;top:' + q.s[1].toFixed(1) + 'px" aria-label="' + esc(p.n) + '">' + (pic ? '<svg viewBox="0 0 64 64"><use href="#ic-' + p.k + '"/></svg>' : '<span>' + esc(text) + '</span>') + '</button>';
    });
    if (o.me && o.nav) {
      var a1 = v.set(o.me.x - c[0], 2, o.me.y - c[1]).project(V.camera).clone(), a2 = v.set(o.nav.x - c[0], 2, o.nav.y - c[1]).project(V.camera).clone();
      if (a1.z < 1 && a2.z < 1) html += '<svg class="nav3" width="' + w + '" height="' + h + '"><line x1="' + ((a1.x * 0.5 + 0.5) * w).toFixed(1) + '" y1="' + ((-a1.y * 0.5 + 0.5) * h).toFixed(1) + '" x2="' + ((a2.x * 0.5 + 0.5) * w).toFixed(1) + '" y2="' + ((-a2.y * 0.5 + 0.5) * h).toFixed(1) + '"/></svg>';
    }
    if (o.me) {
      var ms = at(o.me.x, o.me.y, 2);
      if (ms) html += '<span class="me3" style="left:' + ms[0].toFixed(1) + 'px;top:' + ms[1].toFixed(1) + 'px"></span>';
    }
    V.overlay.innerHTML = html;
  }
  function draw() {
    if (!V.host || !V.scenes[V.cur]) return;
    keepClose();
    if (V.opts && V.opts.onTurn) V.opts.onTurn(Math.atan2(V.camera.position.x - V.controls.target.x, V.camera.position.z - V.controls.target.z) * 180 / Math.PI);
    if (V.opts && V.opts.onTurn) V.opts.onTurn(Math.atan2(V.camera.position.x - V.controls.target.x, V.camera.position.z - V.controls.target.z) * 180 / Math.PI);
    var sc = V.scenes[V.cur], inside = !!(window.HG_LOOK && window.HG_LOOK.open) || V.camera.position.distanceTo(V.controls.target) < 330;
    if (sc.userData.inside !== inside) {
      sc.userData.inside = inside;
      if (!V.plane) V.plane = new window.THREE.Plane(new window.THREE.Vector3(0, -1, 0), 3.4);
      sc.userData.open.clippingPlanes = inside ? [V.plane] : []; sc.userData.open.needsUpdate = true;
      V.renderer.shadowMap.needsUpdate = true;
    }
    V.renderer.render(V.scenes[V.cur], V.camera);
    markers();
  }
  function size() {
    var w = V.host.clientWidth || 340, h = V.host.clientHeight || w;
    V.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    V.renderer.setSize(w, h, false);
    V.camera.aspect = w / h; V.camera.updateProjectionMatrix();
  }
  /* ---------- fingers on the map ----------
     One finger moves the map. Two fingers pinch to zoom and twist to turn it, all the way round.
     Two fingers slid up or down together tilt the view. The same works when a finger starts on a marker:
     the markers are redrawn while the map moves, so the listeners go on the element that was touched. */
  function orbit(dTheta, dPhi, scale) {
    var T = window.THREE, c = V.controls, off = V.camera.position.clone().sub(c.target), s = new T.Spherical().setFromVector3(off);
    s.theta += dTheta || 0;
    s.phi = Math.max(0.02, Math.min(c.maxPolarAngle, s.phi + (dPhi || 0)));
    s.radius = Math.max(c.minDistance, Math.min(c.maxDistance, s.radius / (scale || 1)));
    V.camera.position.copy(c.target).add(off.setFromSpherical(s));
    V.camera.lookAt(c.target);
  }
  function slide(dx, dy) {
    var T = window.THREE, t = V.controls.target, off = V.camera.position.clone().sub(t), s = new T.Spherical().setFromVector3(off);
    var mpp = 2 * s.radius * Math.tan(V.camera.fov * Math.PI / 360) / (V.canvas.clientHeight || 600);
    var fx = -Math.sin(s.theta), fz = -Math.cos(s.theta), rx = Math.cos(s.theta), rz = -Math.sin(s.theta), deep = dy * mpp / Math.max(0.4, Math.cos(s.phi));
    var mx = -rx * dx * mpp + fx * deep, mz = -rz * dx * mpp + fz * deep;
    t.x += mx; t.z += mz; V.camera.position.x += mx; V.camera.position.z += mz;
  }
  var G = { pts: null, mode: '', turn: 0, zoom: 0, lift: 0, moved: 0, frame: 0, target: null, noClick: 0 };
  function read(ev) { var out = []; for (var i = 0; i < ev.touches.length && i < 2; i++) out.push([ev.touches[i].clientX, ev.touches[i].clientY]); return out; }
  function redraw() { if (G.frame) return; G.frame = requestAnimationFrame(function () { G.frame = 0; V.controls.update(); draw(); }); }
  function onMove(ev) {
    ev.preventDefault();
    var now = read(ev), was = G.pts;
    if (!was || now.length !== was.length) { G.pts = now; G.mode = ''; G.turn = G.zoom = G.lift = 0; return; }
    if (now.length === 1) {
      var dx = now[0][0] - was[0][0], dy = now[0][1] - was[0][1];
      G.moved += Math.abs(dx) + Math.abs(dy);
      if (G.moved > 6) slide(dx, dy); else return;
    } else {
      var a0 = Math.atan2(was[1][1] - was[0][1], was[1][0] - was[0][0]), a1 = Math.atan2(now[1][1] - now[0][1], now[1][0] - now[0][0]);
      var turn = Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0));
      var d0 = Math.hypot(was[1][0] - was[0][0], was[1][1] - was[0][1]) || 1, d1 = Math.hypot(now[1][0] - now[0][0], now[1][1] - now[0][1]) || 1;
      var cx = (now[0][0] + now[1][0] - was[0][0] - was[1][0]) / 2, cy = (now[0][1] + now[1][1] - was[0][1] - was[1][1]) / 2;
      var m0 = now[0][1] - was[0][1], m1 = now[1][1] - was[1][1];
      G.moved += 20; G.turn += turn; G.zoom += Math.log(d1 / d0); G.lift += m0 * m1 > 0 ? cy : 0;
      if (!G.mode) {
        if (Math.abs(G.turn) > 0.07 || Math.abs(G.zoom) > 0.07) G.mode = 'spin';
        else if (Math.abs(G.lift) > 16) G.mode = 'tilt';
      }
      if (G.mode === 'tilt') orbit(0, -cy * 0.006, 1);
      else if (G.mode === 'spin') { orbit(turn, 0, d1 / d0); slide(cx, cy); }
    }
    G.pts = now; redraw();
  }
  function onEnd(ev) {
    if (ev.touches.length) { G.pts = read(ev); G.mode = ''; G.turn = G.zoom = G.lift = 0; return; }
    var t = G.target; G.target = null; G.pts = null;
    if (t) { t.removeEventListener('touchmove', onMove); t.removeEventListener('touchend', onEnd); t.removeEventListener('touchcancel', onEnd); }
    if (G.moved > 8) G.noClick = Date.now();
  }
  function onStart(ev) {
    ev.stopImmediatePropagation();
    if (ev.touches.length === 1) { G.moved = 0; }
    G.pts = read(ev); G.mode = ''; G.turn = G.zoom = G.lift = 0;
    if (!G.target) { G.target = ev.target; G.target.addEventListener('touchmove', onMove, { passive: false }); G.target.addEventListener('touchend', onEnd); G.target.addEventListener('touchcancel', onEnd); }
  }
  /* ---------- fingers on the map ----------
     One finger moves the map. Two fingers pinch to zoom and twist to turn it, all the way round.
     Two fingers slid up or down together tilt the view. The same works when a finger starts on a marker:
     the markers are redrawn while the map moves, so the listeners go on the element that was touched. */
  function orbit(dTheta, dPhi, scale) {
    var T = window.THREE, c = V.controls, off = V.camera.position.clone().sub(c.target), s = new T.Spherical().setFromVector3(off);
    s.theta += dTheta || 0;
    s.phi = Math.max(0.02, Math.min(c.maxPolarAngle, s.phi + (dPhi || 0)));
    s.radius = Math.max(c.minDistance, Math.min(c.maxDistance, s.radius / (scale || 1)));
    V.camera.position.copy(c.target).add(off.setFromSpherical(s));
    V.camera.lookAt(c.target);
  }
  function slide(dx, dy) {
    var T = window.THREE, t = V.controls.target, off = V.camera.position.clone().sub(t), s = new T.Spherical().setFromVector3(off);
    var mpp = 2 * s.radius * Math.tan(V.camera.fov * Math.PI / 360) / (V.canvas.clientHeight || 600);
    var fx = -Math.sin(s.theta), fz = -Math.cos(s.theta), rx = Math.cos(s.theta), rz = -Math.sin(s.theta), deep = dy * mpp / Math.max(0.4, Math.cos(s.phi));
    var mx = -rx * dx * mpp + fx * deep, mz = -rz * dx * mpp + fz * deep;
    t.x += mx; t.z += mz; V.camera.position.x += mx; V.camera.position.z += mz;
  }
  var G = { pts: null, mode: '', turn: 0, zoom: 0, lift: 0, moved: 0, frame: 0, target: null, noClick: 0 };
  function read(ev) { var out = []; for (var i = 0; i < ev.touches.length && i < 2; i++) out.push([ev.touches[i].clientX, ev.touches[i].clientY]); return out; }
  function redraw() { if (G.frame) return; G.frame = requestAnimationFrame(function () { G.frame = 0; V.controls.update(); draw(); }); }
  function onMove(ev) {
    ev.preventDefault();
    var now = read(ev), was = G.pts;
    if (!was || now.length !== was.length) { G.pts = now; G.mode = ''; G.turn = G.zoom = G.lift = 0; return; }
    if (now.length === 1) {
      var dx = now[0][0] - was[0][0], dy = now[0][1] - was[0][1];
      G.moved += Math.abs(dx) + Math.abs(dy);
      if (G.moved > 6) slide(dx, dy); else return;
    } else {
      var a0 = Math.atan2(was[1][1] - was[0][1], was[1][0] - was[0][0]), a1 = Math.atan2(now[1][1] - now[0][1], now[1][0] - now[0][0]);
      var turn = Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0));
      var d0 = Math.hypot(was[1][0] - was[0][0], was[1][1] - was[0][1]) || 1, d1 = Math.hypot(now[1][0] - now[0][0], now[1][1] - now[0][1]) || 1;
      var cx = (now[0][0] + now[1][0] - was[0][0] - was[1][0]) / 2, cy = (now[0][1] + now[1][1] - was[0][1] - was[1][1]) / 2;
      var m0 = now[0][1] - was[0][1], m1 = now[1][1] - was[1][1];
      G.moved += 20; G.turn += turn; G.zoom += Math.log(d1 / d0); G.lift += m0 * m1 > 0 ? cy : 0;
      if (!G.mode) {
        if (Math.abs(G.turn) > 0.07 || Math.abs(G.zoom) > 0.07) G.mode = 'spin';
        else if (Math.abs(G.lift) > 16) G.mode = 'tilt';
      }
      if (G.mode === 'tilt') orbit(0, -cy * 0.006, 1);
      else if (G.mode === 'spin') { orbit(turn, 0, d1 / d0); slide(cx, cy); }
    }
    G.pts = now; redraw();
  }
  function onEnd(ev) {
    if (ev.touches.length) { G.pts = read(ev); G.mode = ''; G.turn = G.zoom = G.lift = 0; return; }
    var t = G.target; G.target = null; G.pts = null;
    if (t) { t.removeEventListener('touchmove', onMove); t.removeEventListener('touchend', onEnd); t.removeEventListener('touchcancel', onEnd); }
    if (G.moved > 8) G.noClick = Date.now();
  }
  function onStart(ev) {
    ev.stopImmediatePropagation();
    if (ev.touches.length === 1) { G.moved = 0; }
    G.pts = read(ev); G.mode = ''; G.turn = G.zoom = G.lift = 0;
    if (!G.target) { G.target = ev.target; G.target.addEventListener('touchmove', onMove, { passive: false }); G.target.addEventListener('touchend', onEnd); G.target.addEventListener('touchcancel', onEnd); }
  }
  function init() {
    var T = window.THREE;
    V.canvas = document.createElement('canvas'); V.canvas.className = 'map3d';
    V.renderer = new T.WebGLRenderer({ canvas: V.canvas, antialias: true, powerPreference: 'low-power' });
    V.renderer.localClippingEnabled = true; V.renderer.shadowMap.enabled = true; V.renderer.shadowMap.type = T.PCFSoftShadowMap; V.renderer.shadowMap.autoUpdate = false;
    V.camera = new T.PerspectiveCamera(40, 1, 8, 12000);
    V.controls = new T.MapControls(V.camera, V.canvas);
    V.controls.enableDamping = false; V.controls.minDistance = 70; V.controls.maxDistance = 2100;
    V.controls.maxPolarAngle = Math.PI * 0.47; V.controls.rotateSpeed = 0.55; V.controls.zoomSpeed = 1.1; V.controls.panSpeed = 1.1;
    V.controls.addEventListener('change', draw);
    V.overlay = document.createElement('div'); V.overlay.className = 'pins3';
    V.overlay.addEventListener('click', function (e) {
      if (Date.now() - G.noClick < 350) return;
      if (Date.now() - G.noClick < 350) return;
      var b = e.target.closest ? e.target.closest('[data-pin]') : null;
      if (b && V.opts && V.opts.onSelect) V.opts.onSelect(+b.getAttribute('data-pin'));
    });
    /* a tap on the picture itself (not a drag) clears the chosen marker */
    V.canvas.addEventListener('pointerdown', function (e) { V.down = [e.clientX, e.clientY]; });
    V.canvas.addEventListener('pointerup', function (e) {
      if (V.down && Math.abs(e.clientX - V.down[0]) + Math.abs(e.clientY - V.down[1]) < 6 && V.opts && V.opts.onSelect && V.opts.sel >= 0) V.opts.onSelect(-1);
      V.down = null;
    });
    V.canvas.addEventListener('touchstart', onStart, { capture: true, passive: true });
    V.overlay.addEventListener('touchstart', onStart, { passive: true });
    V.canvas.addEventListener('touchstart', onStart, { capture: true, passive: true });
    V.overlay.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('resize', function () { if (V.host && V.host.isConnected) { size(); draw(); } });
  }

  window.UMRAH_3D = {
    supported: supported,
    /* host: the element to fill. opts: { pins, labels, layers, sel, me, dark, onSelect, focus } */
    show: function (host, m, opts) {
      if (!V.renderer) init();
      if (V.cur && V.cur !== m) V.cams[V.cur] = { p: V.camera.position.clone(), t: V.controls.target.clone() };
      if (!V.scenes[m]) V.scenes[m] = buildScene(m);
      var fresh = V.cur !== m;
      V.cur = m; V.opts = opts; V.host = host;
      host.textContent = ''; host.appendChild(V.canvas); host.appendChild(V.overlay);
      if (fresh) {
        if (V.cams[m]) { V.camera.position.copy(V.cams[m].p); V.controls.target.copy(V.cams[m].t); V.controls.update(); } else resetCam(m);
      }
      theme(); size();
      if (opts.focus) this.focus(opts.focus.x, opts.focus.y); else draw();
      return V.scenes[m].userData.tris;
    },
    update: function (opts) { V.opts = opts; theme(); draw(); },
    focus: function (x, y) {
      var c = centreOf(V.cur), t = V.controls.target, dir = V.camera.position.clone().sub(t).normalize();
      t.set(x - c[0], 0, y - c[1]);
      V.camera.position.copy(t).add(dir.multiplyScalar(240));
      V.controls.update(); draw();
    },
    reset: function () { resetCam(V.cur); draw(); },
    zoom: function (f) {
      var t = V.controls.target, off = V.camera.position.clone().sub(t), d = Math.max(V.controls.minDistance, Math.min(V.controls.maxDistance, off.length() / f));
      V.camera.position.copy(t).add(off.setLength(d)); V.controls.update(); draw();
    },
    /* straight down, north at the top, or back to the angled view */
    tilt: function (top) {
      var t = V.controls.target, d = V.camera.position.distanceTo(t);
      if (top) V.camera.position.set(t.x, d, t.z + d * 0.02); else V.camera.position.set(t.x + d * 0.42, d * 0.62, t.z + d * 0.66);
      V.controls.update(); draw();
    },
    /* go in close so the roofs lift, or step back out */
    inside: function () {
      var t = V.controls.target, off = V.camera.position.clone().sub(t);
      V.camera.position.copy(t).add(off.setLength(off.length() < 330 ? 620 : 230)); V.controls.update(); draw();
    },
    turn: function (deg) { orbit(deg * Math.PI / 180, 0, 1); V.controls.update(); draw(); },
    north: function () { var t = V.controls.target, off = V.camera.position.clone().sub(t), sp = new window.THREE.Spherical().setFromVector3(off); orbit(-sp.theta, 0, 1); V.controls.update(); draw(); },
    heading: function () { return V.controls ? V.controls.getAzimuthalAngle() * 180 / Math.PI : 0; },
    turn: function (deg) { orbit(deg * Math.PI / 180, 0, 1); V.controls.update(); draw(); },
    north: function () { var t = V.controls.target, off = V.camera.position.clone().sub(t), sp = new window.THREE.Spherical().setFromVector3(off); orbit(-sp.theta, 0, 1); V.controls.update(); draw(); },
    heading: function () { return V.controls ? V.controls.getAzimuthalAngle() * 180 / Math.PI : 0; },
    isTop: function () { return V.controls ? V.controls.getPolarAngle() < 0.12 : false; },
    hide: function () { V.host = null; }
  };
})();
