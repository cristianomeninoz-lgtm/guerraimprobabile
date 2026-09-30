/* UNHINGED WARFARE — Renderer Three.js progressivo.
 * Il gioco 2D resta il fallback completo: Three viene usato solo se è disponibile
 * WebGL e SAVE.data.settings.render3d è abilitato. La logica resta in ENGINE.
 */
(function (window, document) {
  'use strict';

  var THREE_URL_FALLBACK_MS = 12000;
  var RAF = window.requestAnimationFrame || function (fn) { return setTimeout(function () { fn(Date.now()); }, 16); };
  var scene, camera, renderer, canvas, world, actors, projectiles, pickups, effects, obstacles, vases, pois, landmarkProps;
  var oilNodes = new Map(), currentQuality = null;
  var ready = false, failed = false, disposed = false, currentLevel = -1, lastFrame = 0;
  var geometryCache = Object.create(null), materialCache = Object.create(null), textureCache = Object.create(null);
  var actorNodes = new Map(), projectileNodes = new Map(), pickupNodes = new Map(), effectNodes = new Map(), obstacleNodes = new Map(), vaseNodes = new Map(), poiNodes = new Map();
  var ambientLight, mainLight, accentLight, rimLight;
  var cameraPositionEase, cameraAimEase, cameraInitialized = false;
  var landmarkMotions = [];
  var key = function (obj) { return obj; };

  var THEMES = [
    { floor: 0x293c35, wall: 0x172a25, accent: 0x68f0b0, glow: 0x4cdda0, haze: 0x10251d, prop: 0xb8cbd1 },
    { floor: 0x3b3429, wall: 0x29251e, accent: 0xffa83f, glow: 0xff7a28, haze: 0x24160b, prop: 0x7c8ba0 },
    { floor: 0x29372f, wall: 0x1c2a24, accent: 0x54d7b4, glow: 0x27b98f, haze: 0x12231e, prop: 0xb8a56e },
    { floor: 0x363a42, wall: 0x252a32, accent: 0xffcf40, glow: 0xff9630, haze: 0x191b23, prop: 0x9c7c56 },
    { floor: 0x273846, wall: 0x142433, accent: 0x55c9ff, glow: 0x409eff, haze: 0x0b1725, prop: 0x7d9bb0 },
    { floor: 0x362843, wall: 0x21182c, accent: 0xff6bd6, glow: 0xc54dff, haze: 0x160b20, prop: 0x995ac2 },
    { floor: 0x353845, wall: 0x232631, accent: 0x6db8ff, glow: 0x5a79ff, haze: 0x121722, prop: 0x858b9e },
    { floor: 0x46372c, wall: 0x2d241e, accent: 0xd1ae68, glow: 0xff9a56, haze: 0x20130f, prop: 0x94553b },
    { floor: 0x303c4e, wall: 0x1c283a, accent: 0x79d5ff, glow: 0x5ca7ff, haze: 0x101925, prop: 0x899bb2 },
    { floor: 0x281e36, wall: 0x171022, accent: 0xff49cf, glow: 0x762cff, haze: 0x10071b, prop: 0x5a3a70 },
    { floor: 0x24542d, wall: 0x152b1a, accent: 0xe7ff63, glow: 0x72ed40, haze: 0x0f2112, prop: 0xb9c5ce },
    { floor: 0x39313b, wall: 0x241d28, accent: 0xffcf72, glow: 0xff8c4d, haze: 0x1a111c, prop: 0x7b4059 },
    { floor: 0x2e2238, wall: 0x1c1424, accent: 0xb08aff, glow: 0x7de8b0, haze: 0x140d1e, prop: 0x6b4a7a },
    { floor: 0x4a3420, wall: 0x2a1c14, accent: 0xffcf72, glow: 0xd4a24a, haze: 0x1a1008, prop: 0x8a6a3a },
    { floor: 0x271f3e, wall: 0x171026, accent: 0x52f2ff, glow: 0x9b43ff, haze: 0x11081f, prop: 0x45465d }
  ];

  function settingQuality() {
    var settings = window.SAVE && SAVE.data && SAVE.data.settings;
    var quality = settings && settings.quality;
    return quality === 'low' || quality === 'med' ? quality : 'high';
  }
  function settingEnabled() {
    var settings = window.SAVE && SAVE.data && SAVE.data.settings;
    return !!(settings && settings.render3d !== false);
  }
  function getTheme(levelIndex) { return THEMES[Math.max(0, Math.min(THEMES.length - 1, levelIndex || 0))]; }
  function getGeometry(name, create) {
    if (!geometryCache[name]) geometryCache[name] = create();
    return geometryCache[name];
  }
  function getMaterial(color, options) {
    options = options || {};
    var id = String(color) + ':' + (options.roughness == null ? 0.82 : options.roughness) + ':' + (options.metalness || 0) + ':' + (options.emissive || 0) + ':' + (options.emissiveIntensity || 0) + ':' + (!!options.transparent) + ':' + (options.opacity == null ? 1 : options.opacity);
    if (!materialCache[id]) {
      materialCache[id] = new window.THREE.MeshStandardMaterial({
        color: color,
        roughness: options.roughness == null ? 0.82 : options.roughness,
        metalness: options.metalness || 0,
        flatShading: options.flatShading !== false,
        emissive: options.emissive || 0,
        emissiveIntensity: options.emissiveIntensity || 0,
        transparent: !!options.transparent,
        opacity: options.opacity == null ? 1 : options.opacity
      });
    }
    return materialCache[id];
  }
  function boxGeometry(w, h, d) {
    var id = 'box:' + w + ':' + h + ':' + d;
    return getGeometry(id, function () { return new window.THREE.BoxGeometry(w, h, d); });
  }
  function addMesh(group, geometry, material, x, y, z, castShadow) {
    var mesh = new window.THREE.Mesh(geometry, material);
    mesh.position.set(x || 0, y || 0, z || 0);
    mesh.castShadow = castShadow !== false;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  function capsuleBetween(group, name, start, end, radius, material) {
    /* Three r128 has no CapsuleGeometry: assemble a cached rounded limb from
       a short cylinder and two spheres, parented at the joint for animation. */
    var T=window.THREE, delta=new T.Vector3().subVectors(end,start), length=delta.length();
    var pivot=new T.Group(), direction=delta.clone().normalize();
    pivot.position.copy(start); group.add(pivot);
    var shaft=addMesh(pivot,getGeometry(name+':shaft:'+radius+':'+length.toFixed(3),function(){return new T.CylinderGeometry(radius,radius,Math.max(0.04,length),9,1);}),material,
      delta.x/2,delta.y/2,delta.z/2);
    shaft.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction);
    var cap=getGeometry(name+':cap:'+radius,function(){return new T.SphereGeometry(radius,9,7);});
    addMesh(pivot,cap,material,0,0,0,false);
    addMesh(pivot,cap,material,delta.x,delta.y,delta.z,false);
    return pivot;
  }

  function outfitColor(id, outfit) {
    var palette={camice:0xe8eee8,pentole:0x9aa8b0,elegante:0x282d39,fenicottero:0xff8ac2,aerobica:0x39ff14,mascotte:0x8a5ac8};
    if (outfit && palette[outfit] && outfit !== 'tuta') return palette[outfit];
    return charColor(id);
  }


  function releaseNode(node) {
    if (!node) return;
    var ownedMaterials = new Set(node.userData && node.userData.ownedMaterials || []);
    if (node.userData && node.userData.ownedMaterials) {
      node.userData.ownedMaterials.forEach(function (material) { material.dispose(); });
      node.userData.ownedMaterials.length = 0;
    }
    if (node.userData && node.userData.ownedGeometry) {
      node.userData.ownedGeometry.dispose();
      node.userData.ownedGeometry = null;
    }
    if (node.userData && node.userData.ownedTexture) {
      node.userData.ownedTexture.dispose();
      node.userData.ownedTexture = null;
    }
    if (node.geometry && node.userData && node.userData.ownsSelfGeometry) {
      node.geometry.dispose();
      node.userData.ownsSelfGeometry = false;
    }
    if (node.traverse) node.traverse(function (child) {
      if (child !== node && child.geometry && child.userData && child.userData.ownsSelfGeometry) {
        child.geometry.dispose();
        child.userData.ownsSelfGeometry = false;
      }
      if (child.userData && child.userData.ownedMaterial && child.material) {
        if (Array.isArray(child.material)) child.material.forEach(function (material) { if(!ownedMaterials.has(material)) material.dispose(); });
        else if(!ownedMaterials.has(child.material)) child.material.dispose();
        child.userData.ownedMaterial = false;
      }
      if (child !== node && child.userData && child.userData.ownedMaterials) {
        child.userData.ownedMaterials.forEach(function (material) { if(!ownedMaterials.has(material)) material.dispose(); });
        child.userData.ownedMaterials.length = 0;
      }
      if (child !== node && child.userData && child.userData.ownedGeometry) {
        child.userData.ownedGeometry.dispose();
        child.userData.ownedGeometry = null;
      }
      if (child.userData && child.userData.ownedTexture) {
        child.userData.ownedTexture.dispose();
        child.userData.ownedTexture = null;
      }
    });
  }
  function addBox(group, w, h, d, color, x, y, z, options) {
    return addMesh(group, boxGeometry(w, h, d), getMaterial(color, options), x, y, z, !options || options.castShadow !== false);
  }
  function makeCanvasTexture(id, draw, repeatX, repeatY) {
    if (textureCache[id]) return textureCache[id];
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var g = c.getContext('2d');
    draw(g, c.width, c.height);
    var texture = new window.THREE.CanvasTexture(c);
    texture.wrapS = texture.wrapT = window.THREE.RepeatWrapping;
    texture.repeat.set(repeatX || 4, repeatY || 2);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy ? Math.min(4, renderer.capabilities.getMaxAnisotropy()) : 1;
    textureCache[id] = texture;
    return texture;
  }
  function floorTexture(theme, levelIndex) {
    var palette = theme;
    return makeCanvasTexture('floor:' + levelIndex, function (g, w, h) {
      g.fillStyle = '#' + palette.floor.toString(16).padStart(6, '0');
      g.fillRect(0, 0, w, h);
      var cell = levelIndex === 1 ? 64 : 48;
      for (var y = 0; y < h; y += cell) {
        for (var x = 0; x < w; x += cell) {
          g.fillStyle = ((x / cell + y / cell) % 2) ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.08)';
          g.fillRect(x, y, cell, cell);
          g.fillStyle = 'rgba(5,8,12,.25)';
          g.fillRect(x, y, cell, 2);
        }
      }
      // Small stable grime marks: a hand-painted texture rather than per-frame work.
      for (var i = 0; i < 72; i++) {
        var px = (i * 73 + levelIndex * 29) % w, py = (i * 101 + levelIndex * 53) % h;
        g.fillStyle = i % 3 ? 'rgba(4,8,8,.10)' : 'rgba(255,255,255,.07)';
        g.beginPath();
        g.ellipse(px, py, 3 + i % 9, 2 + i % 4, i % 6, 0, Math.PI * 2);
        g.fill();
      }
      // Fine grit, scuffs and chips make every floor material feel handled, not flat.
      for (var grit = 0; grit < 190; grit++) {
        var gx = (grit * 47 + levelIndex * 31) % w, gy = (grit * 89 + levelIndex * 17) % h;
        g.fillStyle = grit % 5 ? 'rgba(0,0,0,.11)' : 'rgba(255,255,255,.1)';
        g.fillRect(gx, gy, 1 + grit % 4, 1 + grit % 2);
      }
      // Each venue gets a subtle floor graphic in addition to its palette.
      g.save();
      if (levelIndex === 0) {
        // Hospital linoleum: pale tile joints and a quiet emergency wayfinding line.
        g.fillStyle = 'rgba(218,235,226,.055)';
        for (var tileY = 0; tileY < h; tileY += 64) for (var tileX = 0; tileX < w; tileX += 64) {
          if ((tileX / 64 + tileY / 64) % 2 === 0) g.fillRect(tileX, tileY, 64, 64);
        }
        g.strokeStyle = 'rgba(220,242,232,.18)'; g.lineWidth = 2;
        for (var tileJoint = 0; tileJoint <= w; tileJoint += 64) { g.beginPath(); g.moveTo(tileJoint, 0); g.lineTo(tileJoint, h); g.stroke(); }
        for (var tileRow = 0; tileRow <= h; tileRow += 64) { g.beginPath(); g.moveTo(0, tileRow); g.lineTo(w, tileRow); g.stroke(); }
        g.strokeStyle = 'rgba(104,240,176,.28)'; g.lineWidth = 4;
        g.beginPath(); g.moveTo(0, h * .5); g.lineTo(w, h * .5); g.stroke();
      } else if (levelIndex === 1) {
        g.strokeStyle = 'rgba(255,196,52,.72)'; g.lineWidth = 5;
        for (var py1 = 24; py1 < h; py1 += 96) { g.beginPath(); g.moveTo(0, py1); g.lineTo(w, py1); g.stroke(); }
        g.setLineDash([14, 10]); g.strokeStyle = 'rgba(245,245,230,.35)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
      } else if (levelIndex === 2) {
        g.fillStyle = 'rgba(197,44,57,.34)'; g.fillRect(0, h * .46, w, 8);
        g.fillStyle = 'rgba(55,126,211,.34)'; g.fillRect(0, h * .52, w, 8);
      } else if (levelIndex === 3) {
        for (var py2 = 10; py2 < h; py2 += 42) for (var px2 = 12; px2 < w; px2 += 58) {
          g.fillStyle = 'rgba(245,245,235,.12)'; g.fillRect(px2, py2, 34, 24);
        }
      } else if (levelIndex === 4) {
        // Metro platform edge, rail direction and evenly spaced sleeper marks.
        g.fillStyle = 'rgba(255,195,48,.68)'; g.fillRect(0, h - 19, w, 7);
        g.fillStyle = 'rgba(225,238,250,.15)'; g.fillRect(0, 12, w, 3);
        g.strokeStyle = 'rgba(161,196,211,.22)'; g.lineWidth = 3;
        for (var sleeper = 16; sleeper < w; sleeper += 32) { g.beginPath(); g.moveTo(sleeper, h - 50); g.lineTo(sleeper, h - 8); g.stroke(); }
        g.strokeStyle = 'rgba(88,214,255,.13)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(0, h * .42); g.lineTo(w, h * .42); g.stroke();
      } else if (levelIndex === 5) {

        for (var confetti = 0; confetti < 22; confetti++) {
          g.fillStyle = confetti % 2 ? 'rgba(255,107,214,.23)' : 'rgba(255,211,78,.24)';
          g.beginPath(); g.arc((confetti * 47) % w, (confetti * 83) % h, 3 + confetti % 5, 0, Math.PI * 2); g.fill();
        }
      } else if (levelIndex === 6) {
        g.strokeStyle = 'rgba(224,206,158,.12)'; g.lineWidth = 2;
        for (var grid = 0; grid < w; grid += 32) { g.beginPath(); g.moveTo(grid, 0); g.lineTo(grid, h); g.stroke(); }
      } else if (levelIndex === 7) {
        // Warm parquet boards and staggered end joints set the retirement villa apart.
        for (var plankY = 0; plankY < h; plankY += 36) {
          g.fillStyle = plankY / 36 % 2 ? 'rgba(226,184,125,.065)' : 'rgba(102,61,35,.09)';
          g.fillRect(0, plankY, w, 36);
          g.strokeStyle = 'rgba(22,13,9,.24)'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(0, plankY); g.lineTo(w, plankY); g.stroke();
          var jointOffset = plankY / 36 % 2 ? 32 : 0;
          for (var plankX = jointOffset; plankX < w; plankX += 64) {
            g.beginPath(); g.moveTo(plankX, plankY); g.lineTo(plankX, plankY + 36); g.stroke();
          }
          g.strokeStyle = 'rgba(255,219,164,.07)'; g.lineWidth = 1;
          g.beginPath(); g.moveTo(0, plankY + 5); g.lineTo(w, plankY + 5); g.stroke();
        }
      } else if (levelIndex === 8) {
        // Airport terminal tiles and directional cyan gate markings, distinct from metro rails.
        g.fillStyle = 'rgba(209,224,237,.055)';
        for (var terminalY = 0; terminalY < h; terminalY += 64) for (var terminalX = 0; terminalX < w; terminalX += 64) {
          if ((terminalX / 64 + terminalY / 64) % 2 === 0) g.fillRect(terminalX, terminalY, 64, 64);
        }
        g.strokeStyle = 'rgba(202,220,232,.15)'; g.lineWidth = 2;
        for (var tileSeam = 0; tileSeam <= h; tileSeam += 64) { g.beginPath(); g.moveTo(0, tileSeam); g.lineTo(w, tileSeam); g.stroke(); }
        g.strokeStyle = 'rgba(121,213,255,.3)'; g.lineWidth = 5;
        g.beginPath(); g.moveTo(0, h * .72); g.lineTo(w, h * .72); g.stroke();
        for (var arrow = 24; arrow < w; arrow += 64) {
          g.beginPath(); g.moveTo(arrow, h * .72 - 7); g.lineTo(arrow + 10, h * .72); g.lineTo(arrow, h * .72 + 7); g.stroke();
        }
      } else if (levelIndex === 9) {
        g.strokeStyle = 'rgba(255,73,207,.3)'; g.lineWidth = 2;
        for (var grid2 = 0; grid2 < w; grid2 += 32) { g.beginPath(); g.moveTo(grid2, 0); g.lineTo(grid2, h); g.stroke(); }
        g.strokeStyle = 'rgba(82,242,255,.2)';
        for (var grid3 = 0; grid3 < h; grid3 += 32) { g.beginPath(); g.moveTo(0, grid3); g.lineTo(w, grid3); g.stroke(); }
      } else if (levelIndex === 10) {
        // Stadium pitch: mowing bands, touchlines, halfway and center circle.
        for (var turf = 0; turf < h; turf += 32) {
          g.fillStyle = turf % 64 ? 'rgba(168,228,112,.08)' : 'rgba(8,42,16,.12)'; g.fillRect(0, turf, w, 32);
        }
        g.strokeStyle = 'rgba(245,255,226,.2)'; g.lineWidth = 2;
        g.strokeRect(18, 18, w - 36, h - 36); g.beginPath(); g.moveTo(w / 2, 18); g.lineTo(w / 2, h - 18); g.stroke();
        g.beginPath(); g.arc(w / 2, h / 2, 30, 0, Math.PI * 2); g.stroke();
      } else if (levelIndex === 11) {
        // VIP carpet: dark checker weave, gold aisle border and seat-row markers.
        for (var carpetY = 0; carpetY < h; carpetY += 32) for (var carpetX = 0; carpetX < w; carpetX += 32) {
          g.fillStyle = (carpetX / 32 + carpetY / 32) % 2 ? 'rgba(255,207,114,.055)' : 'rgba(34,19,34,.16)';
          g.fillRect(carpetX, carpetY, 32, 32);
        }
        g.strokeStyle = 'rgba(255,207,114,.35)'; g.lineWidth = 4;
        g.strokeRect(18, 18, w - 36, h - 36);
        g.setLineDash([10, 12]); g.lineWidth = 2;
        for (var seatRow = 32; seatRow < h; seatRow += 48) { g.beginPath(); g.moveTo(22, seatRow); g.lineTo(w - 22, seatRow); g.stroke(); }
        g.setLineDash([]);
      } else if (levelIndex === 12) {
        // Haunted villa: warped floorboards with dark seams and green ectoplasm stains.
        g.strokeStyle = 'rgba(20,12,28,.4)'; g.lineWidth = 4;
        for (var plank = 0; plank < w; plank += 38) { g.beginPath(); g.moveTo(plank, 0); g.lineTo(plank + 6, h); g.stroke(); }
        for (var stain = 0; stain < 8; stain++) {
          g.fillStyle = 'rgba(125,232,176,.12)'; g.beginPath();
          g.ellipse((stain * 97) % w, (stain * 53) % h, 22 + stain % 4 * 9, 10 + stain % 3 * 5, 0.3, 0, Math.PI * 2); g.fill();
        }
      } else if (levelIndex === 13) {
        // Court: polished parquet with brass aisle strips.
        for (var tileY = 0; tileY < h; tileY += 32) for (var tileX = 0; tileX < w; tileX += 64) {
          g.fillStyle = ((tileX / 64 + tileY / 32) % 2) ? 'rgba(255,207,114,.06)' : 'rgba(20,10,4,.14)';
          g.fillRect(tileX, tileY, 64, 32);
        }
        g.strokeStyle = 'rgba(255,207,114,.28)'; g.lineWidth = 3;
        for (var aisle = 24; aisle < w; aisle += 96) { g.beginPath(); g.moveTo(aisle, 0); g.lineTo(aisle, h); g.stroke(); }
      } else if (levelIndex === 14) {
        g.strokeStyle = 'rgba(82,242,255,.2)'; g.lineWidth = 2;
        for (var circuit = 0; circuit < 7; circuit++) {
          var cy = (circuit * 37 + 18) % h;
          g.beginPath(); g.moveTo(0, cy); g.lineTo(72 + circuit * 13, cy); g.lineTo(92 + circuit * 13, cy + 16); g.lineTo(w, cy + 16); g.stroke();
          g.fillStyle = 'rgba(155,67,255,.26)'; g.beginPath(); g.arc(72 + circuit * 13, cy, 4, 0, Math.PI * 2); g.fill();
        }
      }
      if (levelIndex !== 5 && levelIndex !== 11) {
        // Low-contrast themed decals are generated once and reused as a texture.
        g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 2;
        for (var decal = 0; decal < 10; decal++) {
          var dx = (decal * 71 + levelIndex * 23) % w, dy = (decal * 43 + levelIndex * 37) % h;
          g.beginPath(); g.arc(dx, dy, 3 + decal % 6, 0, Math.PI * 2); g.stroke();
        }
      }
      g.restore();
    }, 7, 3);
  }

  function bootRenderer() {
    if (ready || failed || disposed || !window.THREE || !window.THREE.WebGLRenderer) return;
    var listenersInstalled = false;
    try {
      var T = window.THREE;
      canvas = document.createElement('canvas');
      canvas.id = 'game3d';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText =      'position:fixed;inset:0;width:100vw;height:100vh;display:none;pointer-events:none;z-index:0;';
      document.body.appendChild(canvas);
      renderer = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: settingQuality() !== 'low', powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settingQuality() === 'low' ? 1 : settingQuality() === 'med' ? 1.35 : 1.75));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      renderer.setClearColor(0x000000, 0);
      if (T.sRGBEncoding) renderer.outputEncoding = T.sRGBEncoding;
      if (T.ACESFilmicToneMapping != null) { renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08; }
      renderer.shadowMap.enabled = settingQuality() === 'high';
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      scene = new T.Scene();
      scene.background = null;
      camera = new T.PerspectiveCamera(52, window.innerWidth / Math.max(1, window.innerHeight), 0.1, 260);
      cameraPositionEase = new T.Vector3(); cameraAimEase = new T.Vector3(); cameraInitialized = false;
      world = new T.Group(); landmarkProps = new T.Group();
      actors = new T.Group(); projectiles = new T.Group(); pickups = new T.Group(); effects = new T.Group(); obstacles = new T.Group(); vases = new T.Group(); pois = new T.Group();
      scene.add(world, landmarkProps, actors, projectiles, pickups, effects, obstacles, vases, pois);
      ambientLight = new T.HemisphereLight(0xbbeeff, 0x203027, 1.05);
      scene.add(ambientLight);
      mainLight = new T.DirectionalLight(0xfff1d1, 1.8);
      mainLight.position.set(-5, 15, 8);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.set(512, 512);
      mainLight.shadow.camera.left = -35; mainLight.shadow.camera.right = 35;
      mainLight.shadow.camera.top = 25; mainLight.shadow.camera.bottom = -25;
      scene.add(mainLight);
      accentLight = new T.PointLight(0x65ffcb, 1.25, 34, 1.5);
      scene.add(accentLight);
      rimLight = new T.PointLight(0xff4fc8, 0.72, 28, 1.7);
      scene.add(rimLight);
      canvas.addEventListener('webglcontextlost', onContextLost, false);
      window.addEventListener('resize', resize);
      document.addEventListener('visibilitychange', onVisibilityChange);
      listenersInstalled = true;
      resize();
      ready = true;
      window.THREE3D.ready = true;
    } catch (error) {
      if (listenersInstalled) removeRendererListeners();
      try { clearWorld(); } catch (cleanupError) {}
      try { if (renderer) renderer.dispose(); } catch (disposeError) {}
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      canvas = null; renderer = null; scene = null; camera = null;
      failRenderer(error);
    }
  }
  function resize() {
    if (!renderer || !camera) return;
    var quality = settingQuality();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'low' ? 1 : quality === 'med' ? 1.35 : 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
    camera.updateProjectionMatrix();
  }
  function onVisibilityChange() { lastFrame = 0; }
  function removeRendererListeners() {
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (canvas) canvas.removeEventListener('webglcontextlost', onContextLost, false);
  }
  function failRenderer(error) {
    if (failed) return;
    failed = true;
    ready = false;
    window.THREE3D.error = String(error && error.message || error || 'Renderer WebGL non disponibile');
    window.THREE3D.ready = false;
    removeRendererListeners();
    if (canvas) canvas.style.display = 'none';
    try { clearWorld(); } catch (cleanupError) {}
    try { if (renderer && renderer.forceContextLoss) renderer.forceContextLoss(); } catch (lossError) {}
    try { if (renderer) renderer.dispose(); } catch (disposeError) {}
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null; renderer = null; scene = null; camera = null;
    if (window.console && console.warn) console.warn('[UNHINGED 3D] Renderer non disponibile; il gioco continua in Canvas2D.', error || '');
  }
  function onContextLost(event) {
    if (event && event.preventDefault) event.preventDefault();
    failRenderer('Contesto WebGL perso: fallback Canvas2D attivato');
  }

  function makeRoomSign(text, color) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 128;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#11151b'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#' + color.toString(16).padStart(6, '0'); ctx.lineWidth = 8; ctx.strokeRect(5, 5, c.width - 10, c.height - 10);
    ctx.fillStyle = '#f4f2df'; ctx.font = 'bold 44px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 256, 64, 460);
    var tex = new window.THREE.CanvasTexture(c);
    var mat = new window.THREE.MeshBasicMaterial({ map: tex, side: window.THREE.DoubleSide });
    var mesh = new window.THREE.Mesh(new window.THREE.PlaneGeometry(5.2, 1.3), mat);
    mesh.userData.ownedTexture = tex;
    mesh.userData.ownedMaterials = [mat];
    mesh.userData.ownedGeometry = mesh.geometry;
    return mesh;
  }
  function addPillar(x, theme) {
    var T = window.THREE;
    // Spostiamo i pilastri sui lati (z = +/- 10.5) per non ostruire la telecamera alle spalle del giocatore lungo il corridoio centrale
    for(var sgn = -1; sgn <= 1; sgn += 2) {
      var pillar = addMesh(world, getGeometry('pillar', function () { return new T.CylinderGeometry(0.55, 0.72, 7, 7); }), getMaterial(theme.prop, { roughness: 0.55, metalness: 0.2 }), x, 3.5, sgn * 10.5);
      pillar.castShadow = true;
      addBox(world, 1.5, 0.24, 1.5, theme.accent, x, 6.9, sgn * 10.5, { emissive: theme.accent, emissiveIntensity: 0.15 });
    }
  }
  function addHospitalBed(x, z, theme) {
    var T = window.THREE;
    addLandmarkBox( 4.2, 0.28, 1.25, 0xb8c1c6, x, 0.68, z, { roughness: 0.4, metalness: 0.55 });
    addLandmarkBox( 3.8, 0.2, 1.15, 0xe4e5d7, x, 0.92, z, { roughness: 0.95 });
    for (var s = -1; s <= 1; s += 2) {
      addLandmarkBox( 0.13, 0.78, 0.13, 0x87959b, x + s * 1.7, 0.38, z - 0.38, { roughness: 0.48, metalness: 0.5 });
      addLandmarkBox( 0.13, 0.78, 0.13, 0x87959b, x + s * 1.7, 0.38, z + 0.38, { roughness: 0.48, metalness: 0.5 });
      addMesh(world, getGeometry('bed-wheel', function () { return new T.SphereGeometry(0.17, 7, 5); }), getMaterial(0x22272a), x + s * 1.7, 0.16, z);
    }
    var monitor = addLandmarkBox( 0.65, 0.8, 0.65, 0x45525a, x + 2.15, 0.95, z, { metalness: 0.28, roughness: 0.58 });
    addLandmarkBox( 0.48, 0.29, 0.08, theme.glow, x + 2.15, 1.28, z + 0.34, { emissive: theme.glow, emissiveIntensity: 0.65, castShadow: false });
    monitor.castShadow = true;
    // Tiny red cross keeps the hospital silhouette readable from the camera.
    addLandmarkBox( 0.48, 0.15, 0.06, 0xff4d6d, x - 2.08, 1.22, z, { castShadow: false });
    addLandmarkBox( 0.15, 0.48, 0.06, 0xff4d6d, x - 2.08, 1.22, z, { castShadow: false });
  }
  function addCar(x, z, theme, variant) {
    var color = [0x7a3434, 0x31556d, 0x75622c, 0x573b67][variant % 4];
    addBox(world, 5.5, 1.0, 2.5, color, x, 0.72, z, { roughness: 0.38, metalness: 0.35 });
    addBox(world, 2.8, 0.92, 2.05, 0x24313b, x - 0.15, 1.55, z, { roughness: 0.28, metalness: 0.35 });
    var T = window.THREE;
    for (var s = -1; s <= 1; s += 2) for (var f = -1; f <= 1; f += 2) {
      addMesh(world, getGeometry('car-wheel', function () { return new T.CylinderGeometry(0.42, 0.42, 0.28, 9); }), getMaterial(0x191b1d, { roughness: 0.9 }), x + f * 1.65, 0.42, z + s * 1.15).rotation.z = Math.PI / 2;
    }
    addBox(world, 0.28, 0.2, 0.9, theme.accent, x + 2.78, 0.92, z - 0.76, { emissive: theme.accent, emissiveIntensity: 0.2 });
  }
  function addShelves(x, z, theme) {
    addBox(world, 3.6, 3.5, 0.38, 0x39404a, x, 1.8, z, { roughness: 0.55, metalness: 0.3 });
    var colors = [0xff6b6b, 0x62c77d, 0xffd34e, 0x6d9dff, 0xff8dd1];
    for (var row = 0; row < 3; row++) {
      addBox(world, 3.45, 0.12, 0.52, 0x8a9297, x, 0.8 + row * 0.86, z + 0.22, { roughness: 0.5, metalness: 0.35 });
      for (var col = 0; col < 4; col++) addBox(world, 0.48, 0.52, 0.42, colors[(row + col) % colors.length], x - 1.25 + col * 0.82, 1.11 + row * 0.86, z + 0.22, { roughness: 0.62 });
    }
  }
  function addDesk(x, z, theme) {
    addBox(world, 3.2, 0.24, 1.65, 0x594936, x, 1.25, z, { roughness: 0.72 });
    for (var s = -1; s <= 1; s += 2) addBox(world, 0.18, 1.25, 0.18, 0x45404a, x + s * 1.28, 0.62, z, { metalness: 0.24 });
    addBox(world, 1.25, 0.78, 0.15, 0x242832, x - 0.38, 1.74, z - 0.35, { roughness: 0.38 });
    addBox(world, 1.06, 0.59, 0.08, theme.glow, x - 0.38, 1.76, z - 0.25, { emissive: theme.glow, emissiveIntensity: 0.22, castShadow: false });
    addBox(world, 0.4, 0.12, 0.38, theme.accent, x + 0.95, 1.45, z + 0.25, { roughness: 0.45 });
  }
  function addSpeaker(x, z, theme) {
    addBox(world, 2.25, 3.8, 1.7, 0x211a2a, x, 1.9, z, { roughness: 0.45 });
    var T = window.THREE;
    for (var y = 0; y < 2; y++) {
      addMesh(world, getGeometry('speaker-cone', function () { return new T.CylinderGeometry(0.62, 0.69, 0.16, 12); }), getMaterial(theme.glow, { emissive: theme.glow, emissiveIntensity: 0.38 }), x, 1.05 + y * 1.45, z + 0.88).rotation.x = Math.PI / 2;
    }
  }
  function addLandmarkBox(w,h,d,color,x,y,z,options) {
    return addBox(landmarkProps||world,w,h,d,color,x,y,z,options);
  }
  function addLandmarkMesh(geometry,material,x,y,z,castShadow) {
    return addMesh(landmarkProps||world,geometry,material,x,y,z,castShadow);
  }
  function rotateLandmark(node, axis, speed, amplitude, phase) {
    landmarkMotions.push({node:node,axis:axis,speed:speed,amplitude:amplitude||1,phase:phase||0,base:node.rotation[axis]});
    return node;
  }
  function pulseLandmark(node, speed, phase) {
    landmarkMotions.push({node:node,pulse:true,speed:speed,phase:phase||0,base:node.scale.x});
    return node;
  }
  function spinLandmark(node, axis, speed, phase) {
    landmarkMotions.push({node:node,spin:true,axis:axis,speed:speed,phase:phase||0,base:node.rotation[axis]});
    return node;
  }
  function orbitLandmark(node, radius, speed, phase, drop) {
    landmarkMotions.push({node:node,orbit:true,radius:radius,speed:speed,phase:phase||0,drop:drop||0});
    return node;
  }
  function animateLandmarks(time) {
    for (var i=0;i<landmarkMotions.length;i++) {
      var motion=landmarkMotions[i], wave=Math.sin(time*motion.speed+motion.phase);
      if(motion.orbit){
        var angle=time*motion.speed+motion.phase;
        motion.node.position.set(Math.cos(angle)*motion.radius,Math.sin(angle)*motion.radius-motion.drop,0.22);
        motion.node.rotation.z=-angle;
      } else if(motion.spin) motion.node.rotation[motion.axis]=motion.base+time*motion.speed+motion.phase;
      else if(motion.pulse) motion.node.scale.setScalar(motion.base*(0.86+Math.max(0,wave)*0.3));
      else motion.node.rotation[motion.axis]=motion.base+wave*motion.amplitude;
    }
  }
  function addLevelLandmark(level, theme) {
    var T = window.THREE, x = 48, z = -11.4;
    var addCylinder = function (name, top, bottom, height, color, px, py, pz, options) {
      return addLandmarkMesh(getGeometry(name, function () { return new T.CylinderGeometry(top, bottom, height, 10); }), getMaterial(color, options), px, py, pz);
    };
    switch (level) {
      case 0: // Hospital: wall clock, treatment monitor and emergency cross.
        addLandmarkMesh(getGeometry('landmark-clock-ring', function () { return new T.TorusGeometry(0.72, 0.09, 7, 20); }), getMaterial(0xdce9e2, { metalness: 0.35 }), 24, 4.25, z);
        addLandmarkBox( 0.08, 0.64, 0.08, 0xff4d6d, 24, 4.3, z + 0.1, { emissive: 0x501020, emissiveIntensity: 0.25 });
        addLandmarkBox( 0.44, 0.08, 0.08, 0xff4d6d, 24.13, 4.02, z + 0.1);
        var clockHand = new T.Group(); clockHand.position.set(24,4.25,z+0.1); landmarkProps.add(clockHand);
        addBox(clockHand,0.06,0.54,0.07,0x263a3b,0,0.15,0.06,{castShadow:false});
        spinLandmark(clockHand,'z',0.13);        addLandmarkBox( 1.5, 1.2, 0.35, 0x304b50, 34, 1.4, z, { metalness: 0.3 });
        var monitorScreen = addLandmarkBox(1.15,0.7,0.08,0x65ffd0,34,1.62,z+0.2,{emissive:0x25b78a,emissiveIntensity:0.8,castShadow:false});
        pulseLandmark(monitorScreen,2.1,0.4);

        break;
      case 1: // Parking: painted bays, clearance bar and charging pillars.
        for (var bay = 0; bay < 5; bay++) {
          addLandmarkBox( 0.08, 0.025, 5.6, 0xffc434, 25 + bay * 9, 0.015, 10.7, { emissive: 0x5e4716, emissiveIntensity: 0.08, castShadow: false });
        }
        addLandmarkBox( 5.8, 0.16, 0.18, 0xffc434, 47, 5.4, z, { emissive: 0xff8a28, emissiveIntensity: 0.45 });
        addLandmarkBox( 0.55, 3.4, 0.65, 0x202a32, 44, 1.7, z, { metalness: 0.5 });
        var gateWarning = addLandmarkBox( 0.36, 0.48, 0.08, 0xff594d, 44, 2.6, z + 0.36, { emissive: 0xaa1818, emissiveIntensity: 0.8 });
        pulseLandmark(gateWarning, 3.6, 0);
        break;
      case 2: // Commissariato: evidence wall, filing cabinets and rotating-light motif.
        addLandmarkBox( 6.2, 3.2, 0.28, 0x263746, 48, 2.35, z, { roughness: 0.65 });
        for (var file = 0; file < 6; file++) {
          addLandmarkBox( 0.68, 0.78, 0.08, file % 2 ? 0xb64a4e : 0x4b79b4, 45 + (file % 3) * 1.75, 1.25 + Math.floor(file / 3) * 1.2, z + 0.2, { roughness: 0.9 });
          addLandmarkBox( 0.35, 0.05, 0.1, 0xf0dfb4, 45.15 + (file % 3) * 1.75, 1.2 + Math.floor(file / 3) * 1.2, z + 0.27, { castShadow: false });
        }
        var blueAlarm = addLandmarkBox( 0.32, 0.7, 0.32, 0x2c3b49, 43.5, 4.3, z, { emissive: 0x2866ff, emissiveIntensity: 0.8 });
        var redAlarm = addLandmarkBox( 0.32, 0.7, 0.32, 0x422a39, 44.1, 4.3, z, { emissive: 0xff394d, emissiveIntensity: 0.8 });
        pulseLandmark(blueAlarm, 4, 0);
        pulseLandmark(redAlarm, 5, Math.PI / 2);
        break;
      case 3: // Supermarket: checkout lanes and bold aisle markers.
        for (var till = 0; till < 3; till++) {
          var tx = 30 + till * 18;
          addLandmarkBox( 5.2, 0.95, 1.35, 0x38464b, tx, 0.78, z, { roughness: 0.48 });
          addLandmarkBox( 1.1, 0.08, 0.82, 0xff5e68, tx - 1.35, 1.3, z + 0.08, { emissive: 0x681d24, emissiveIntensity: 0.22 });
          addLandmarkBox( 0.74, 1.2, 0.08, 0x58d5b2, tx + 1.6, 1.05, z + 0.68, { emissive: 0x12634f, emissiveIntensity: 0.2 });
        }
        addLandmarkBox( 7.5, 0.45, 0.28, 0x243039, 49, 5.4, z, { emissive: 0xffd34e, emissiveIntensity: 0.18 });
        var tillScanner = addLandmarkBox( 0.13, 0.15, 0.3, 0xffd34e, 46, 5.38, z + 0.18, { emissive: 0xffd34e, emissiveIntensity: 0.8 });
        pulseLandmark(tillScanner, 5.2, 0);
        break;
      case 4: // Ghost metro: rail lines, destination board and a stopped carriage.
        addLandmarkBox( 70, 0.12, 0.12, 0x78878e, 50, 0.07, 10.7, { metalness: 0.75, roughness: 0.35 });
        addLandmarkBox( 70, 0.12, 0.12, 0x78878e, 50, 0.07, 12.0, { metalness: 0.75, roughness: 0.35 });
        addLandmarkBox( 12, 2.8, 2.45, 0x385a70, 51, 1.7, z, { metalness: 0.3, roughness: 0.45 });
        for (var win = 0; win < 4; win++) addLandmarkBox( 1.8, 1.1, 0.06, 0x9ad6e4, 47 + win * 2.2, 2.15, z + 1.25, { emissive: 0x1b4d60, emissiveIntensity: 0.24 });
        addLandmarkBox( 5.8, 0.9, 0.24, 0x142330, 47, 5.2, z, { emissive: 0x58d6ff, emissiveIntensity: 0.2 });
        var metroSignal = addLandmarkBox( 4.8, 0.13, 0.08, 0xeaf8ff, 47, 5.22, z + 0.16, { emissive: 0x58d6ff, emissiveIntensity: 0.32, castShadow: false });
        pulseLandmark(metroSignal, 2.4, 0.7);
        var metroBoardGlow = addLandmarkBox(0.18,0.18,0.08,0x58d6ff,51.7,5.2,z+0.19,{emissive:0x58d6ff,emissiveIntensity:0.8,castShadow:false});
        pulseLandmark(metroBoardGlow,3.4,Math.PI/3);
        break;
      case 5: // Closed amusement park: a turning ferris wheel with level, orbiting gondolas.
        var wheelGroup = new T.Group(); wheelGroup.position.set(50,4.3,z); (landmarkProps||world).add(wheelGroup);
        var wheelRotor = new T.Group(); wheelGroup.add(wheelRotor);
        addMesh(wheelRotor, getGeometry('fair-wheel', function () { return new T.TorusGeometry(3.25, 0.12, 8, 28); }), getMaterial(0xff6bd6, { emissive: 0x66205a, emissiveIntensity: 0.35 }), 0, 0, 0);
        var wheelSpokes = new T.Group(); wheelRotor.add(wheelSpokes);
        for (var spoke = 0; spoke < 8; spoke++) {
          var angle = spoke * Math.PI / 4;
          var beam = addBox(wheelSpokes, 0.1, 6.25, 0.13, spoke % 2 ? 0xffd34e : 0x71ddff, 0, 0, 0.1, { emissive: spoke % 2 ? 0x6b4710 : 0x12475a, emissiveIntensity: 0.24 });
          beam.rotation.z = angle;
          var gondola = new T.Group(); wheelGroup.add(gondola);
          addBox(gondola, 0.72, 0.55, 0.62, spoke % 2 ? 0xff6bd6 : 0x69c7ef, 0, 0, 0, { emissive: 0x28152e, emissiveIntensity: 0.12 });
          orbitLandmark(gondola,3.25,0.38,angle,0.34);
        }

        spinLandmark(wheelRotor,'z',0.38);
        /* supports and ticket booth remain fixed outside the rotating wheel */
        addLandmarkBox(0.34, 4.2, 0.34, 0x74717a, 48.2, 2.1, z, { metalness: 0.58 });
        addLandmarkBox(0.34, 4.2, 0.34, 0x74717a, 51.8, 2.1, z, { metalness: 0.58 });
        addLandmarkBox(4.6, 1.35, 1.5, 0x51404d, 34, 0.68, z, { roughness: 0.6 });
        var ticketStripe = addLandmarkBox(4.3,0.18,1.55,0xffd34e,34,1.45,z,{emissive:0x7a4512,emissiveIntensity:0.3});
        pulseLandmark(ticketStripe,1.7,0.8);
        break;

      case 6: // Skyscraper: boardroom table, chairs and presentation wall.
        addLandmarkBox( 14, 0.28, 2.2, 0x4b3d37, 48, 1.18, z, { roughness: 0.42 });
        for (var chair = 0; chair < 6; chair++) {
          var cx = 42 + chair * 2.4;
          addLandmarkBox( 0.85, 1.15, 0.72, chair % 2 ? 0x4c6a94 : 0x76504e, cx, 0.68, z + 2.1, { roughness: 0.58 });
          addLandmarkBox( 0.74, 0.1, 0.72, 0x252a35, cx, 1.25, z + 2.1, { roughness: 0.38 });
        }
        addLandmarkBox( 8.5, 4.2, 0.35, 0x202330, 49, 4.3, z, { roughness: 0.36 });
        addLandmarkBox( 7.7, 3.45, 0.08, 0x57677b, 49, 4.35, z + 0.23, { emissive: 0x18324a, emissiveIntensity: 0.54, castShadow: false });
        var meetingEye = addLandmarkMesh( getGeometry('meeting-eye', function () { return new T.SphereGeometry(0.13, 8, 6); }), getMaterial(0xff5b82, { emissive: 0xa51d43, emissiveIntensity: 0.9 }), 49, 4.35, z + 0.34, false);
        pulseLandmark(meetingEye, 2.8, 0.3);
        break;
      case 7: // Retirement villa: handrail, potted greenery and a bedside clock.
        addLandmarkBox( 34, 0.16, 0.14, 0xb5a18b, 47, 0.95, 10.9, { metalness: 0.18 });
        for (var rail = 0; rail < 7; rail++) addLandmarkBox( 0.1, 0.84, 0.12, 0xa38c73, 31 + rail * 5, 0.48, 10.9, { castShadow: false });
        for (var plant = 0; plant < 3; plant++) {
          var px = 31 + plant * 17;
          addCylinder('retirement-pot', 0.42, 0.58, 0.62, 0x8a593e, px, 0.31, z);
          var leaves = addLandmarkMesh(getGeometry('retirement-leaves',function(){return new T.IcosahedronGeometry(0.72,0);}),getMaterial(0x4d8b58,{roughness:0.92}),px,1.18,z);
          rotateLandmark(leaves,'y',0.12,0.08,plant*Math.PI/2);
        }
        addLandmarkMesh( getGeometry('retirement-clock', function () { return new T.TorusGeometry(0.62, 0.1, 7, 18); }), getMaterial(0xe6c98c), 55, 4.35, z);
        var villaClockHand = new T.Group(); villaClockHand.position.set(55,4.35,z+0.1); landmarkProps.add(villaClockHand);
        addBox(villaClockHand,0.07,0.5,0.08,0x6a4e39,0,0.16,0.04,{castShadow:false});
        spinLandmark(villaClockHand,'z',0.08);
        break;
      case 8: // Airport: departures board, baggage belt and wing silhouette.
        addLandmarkBox( 9.5, 2.2, 0.28, 0x172a3c, 49, 5.2, z, { metalness: 0.38 });
        for (var row = 0; row < 3; row++) for (var col = 0; col < 5; col++) {
          var departurePixel = addLandmarkBox( 1.25, 0.12, 0.08, (row + col) % 3 ? 0x77d8ff : 0xffd34e, 45 + col * 1.75, 5.85 - row * 0.52, z + 0.18, { emissive: 0x16536a, emissiveIntensity: 0.35, castShadow: false });
          if (row === 0 && col === 0) pulseLandmark(departurePixel, 3.2, 0.4);
        }
        addLandmarkBox( 18, 0.92, 2.25, 0xddd8cb, 52, 0.6, 10.5, { roughness: 0.5, metalness: 0.12 });
        addLandmarkBox( 10, 0.16, 5.8, 0x778694, 53, 0.94, 10.5, { metalness: 0.32 });
        addLandmarkBox( 2.2, 0.52, 1.4, 0x596b7a, 42, 1.15, z, { roughness: 0.45 });
        var baggageBeacon = addLandmarkBox(0.22,0.12,0.08,0x77d8ff,47.8,5.15,z+0.2,{emissive:0x1685aa,emissiveIntensity:0.85,castShadow:false});
        pulseLandmark(baggageBeacon,2.7,0.6);
        break;
      case 9: // Nightclub: raised DJ booth, dance grid and a mirrored ball.
        addLandmarkBox( 9.5, 1.35, 2.2, 0x21162e, 49, 0.68, z, { metalness: 0.3, roughness: 0.36 });
        addLandmarkBox( 8.2, 0.78, 0.12, 0xff49cf, 49, 1.35, z + 1.1, { emissive: 0x9c1683, emissiveIntensity: 0.72, castShadow: false });
        for (var deck = 0; deck < 5; deck++) addLandmarkBox( 0.08, 0.035, 11, deck % 2 ? 0x52f2ff : 0xff49cf, 30 + deck * 8, 0.035, 0, { emissive: deck % 2 ? 0x185969 : 0x5a164d, emissiveIntensity: 0.4, castShadow: false });
        var mirrorball = new T.Group(); mirrorball.position.set(52,7.1,-4); landmarkProps.add(mirrorball);
        addMesh(mirrorball,getGeometry('club-ball',function(){return new T.SphereGeometry(0.9,12,10);}),getMaterial(0xd9e5ff,{metalness:0.85,roughness:0.16,emissive:0x24194a,emissiveIntensity:0.5}),0,0,0);
        spinLandmark(mirrorball,'y',0.85,Math.PI);
        for (var facet = 0; facet < 4; facet++) {
          var ballFacet = addBox(mirrorball,0.08,0.08,0.08,facet%2?0x52f2ff:0xff49cf,(facet%2)*1.2-0.6,facet>1?0.5:-0.5,0.8,{emissive:0xffffff,emissiveIntensity:0.8,castShadow:false});
          pulseLandmark(ballFacet, 4.5, facet * Math.PI / 2);
        }
        break;
      case 10: // Stadium: pitch markings, goals and dugout lights.
        addLandmarkBox( 0.16, 0.08, 10, 0xf4f2dc, 38, 0.04, 0, { castShadow: false });
        addLandmarkBox( 0.16, 0.08, 8, 0xf4f2dc, 62, 0.04, 0, { castShadow: false });
        addLandmarkBox( 5.5, 2.5, 0.18, 0xeeeece, 27, 1.25, 10.8, { castShadow: false });
        addLandmarkBox( 5.5, 2.5, 0.18, 0xeeeece, 70, 1.25, -10.8, { castShadow: false });
        addLandmarkBox( 8.5, 3.3, 0.42, 0x252e39, 50, 5.2, z, { emissive: 0x354d65, emissiveIntensity: 0.18 });
        var stadiumScoreGlow = addLandmarkBox( 6.6, 0.62, 0.1, 0xe7ff63, 50, 5.35, z + 0.25, { emissive: 0x53691c, emissiveIntensity: 0.55, castShadow: false });
        pulseLandmark(stadiumScoreGlow, 1.8, 0);
        break;
      case 11: // VIP stand: velvet ropes, banners and a giant scoreboard.
        for (var rope = 0; rope < 6; rope++) {
          var rx = 32 + rope * 7;
          addCylinder('vip-post', 0.07, 0.1, 1.1, 0xd5aa51, rx, 0.55, z);
          if (rope < 5) addLandmarkBox( 6.8, 0.06, 0.06, 0xc64b50, rx + 3.2, 0.86, z, { castShadow: false });
        }
        addLandmarkBox( 11, 4.3, 0.32, 0x302634, 49, 4.8, z, { metalness: 0.22 });
        var vipScoreGlow = addLandmarkBox( 9.5, 2.9, 0.08, 0xffcf72, 49, 4.9, z + 0.2, { emissive: 0x5c3017, emissiveIntensity: 0.48, castShadow: false });
        pulseLandmark(vipScoreGlow, 1.2, 0.5);
        for (var flag = 0; flag < 4; flag++) {
          addLandmarkBox( 0.1, 3.2, 0.1, 0xd6d0c6, 26 + flag * 16, 3.7, 10.8, { metalness: 0.4 });
          addLandmarkBox( 1.8, 1.05, 0.08, [0xd94b58, 0xffcf72, 0x6b91c4, 0xf1ead7][flag], 26.9 + flag * 16, 4.55, 10.8, { emissive: 0x33252c, emissiveIntensity: 0.16 });
        }
        break;
      case 12: // Abandoned villa: crooked door, floating candles and a haunted fuse box.
        addLandmarkBox( 2.2, 3.6, 0.24, 0x4a3050, 30, 1.8, z, { roughness: 0.86 });
        addLandmarkBox( 1.1, 2.4, 0.12, 0x2a1c30, 30, 1.2, z + 0.16, { roughness: 0.9 });
        var hauntedLamp = addLandmarkBox( 0.34, 0.5, 0.34, 0x7de8b0, 38, 4.6, z, { emissive: 0x2f7a58, emissiveIntensity: 0.85, castShadow: false });
        pulseLandmark(hauntedLamp, 2.6, 0);
        for (var candle = 0; candle < 4; candle++) {
          var candleX = 44 + candle * 5.5;
          addLandmarkBox( 0.16, 0.52, 0.16, 0xe8dcc0, candleX, 2.1 + (candle % 2) * 1.1, z, { castShadow: false });
          var flame = addLandmarkMesh(getGeometry('haunted-flame',function(){return new T.ConeGeometry(0.12,0.36,6);}),getMaterial(0xffb56b,{emissive:0xff8a2a,emissiveIntensity:0.9}),candleX,2.55 + (candle % 2) * 1.1,z,false);
          pulseLandmark(flame, 3.4 + candle * 0.4, candle);
        }
        addLandmarkBox( 0.9, 1.4, 0.5, 0x3a2c46, 62, 0.7, z, { roughness: 0.82 });
        addLandmarkBox( 0.12, 0.62, 0.08, 0x7de8b0, 62, 1.1, z + 0.3, { emissive: 0x2f7a58, emissiveIntensity: 0.7, castShadow: false });
        break;
      case 13: // Court: judge bench, scales of justice and guilty-looking columns.
        addLandmarkBox( 9.5, 1.5, 2.2, 0x6a4526, 48, 0.75, z, { roughness: 0.58 });
        addLandmarkBox( 8.2, 0.28, 1.9, 0x8a5a34, 48, 1.55, z, { roughness: 0.5 });
        for (var gavel = 0; gavel < 2; gavel++) {
          addLandmarkBox( 0.55, 0.22, 0.22, 0x5a3620, 44 + gavel * 8, 1.82, z + 0.55, { castShadow: false });
          addLandmarkBox( 0.2, 0.32, 0.32, 0x3a2210, 44.4 + gavel * 8, 1.82, z + 0.55, { castShadow: false });
        }
        var scalePole = addLandmarkMesh(getGeometry('court-scale-pole',function(){return new T.CylinderGeometry(0.07,0.07,3.4,8);}),getMaterial(0xd4a24a,{metalness:0.55}),28,3.2,z);
        addLandmarkBox( 3.2, 0.12, 0.12, 0xd4a24a, 28, 4.6, z, { metalness: 0.55 });
        for (var pan = -1; pan <= 1; pan += 2) {
          addLandmarkMesh(getGeometry('court-scale-pan',function(){return new T.CylinderGeometry(0.5,0.36,0.12,10);}),getMaterial(0xd4a24a,{metalness:0.6}),28 + pan * 1.6,3.95,z);
        }
        rotateLandmark(scalePole,'y',0.1,0.06,0);
        var courtSign = addLandmarkBox( 6.5, 1.2, 0.18, 0x8a5a34, 48, 5.6, z, { emissive: 0x2a1608, emissiveIntensity: 0.25 });
        pulseLandmark(courtSign, 1.4, 0.3);
        for (var jury = 0; jury < 6; jury++) addLandmarkBox( 1.1, 0.85, 0.9, jury % 2 ? 0x4a3420 : 0x3a2818, 34 + jury * 4.6, 0.45, z + 2.6, { roughness: 0.72 });
        break;
      case 14: // Central plant: contained brain, coolant loops and powered conduits.
        for (var tower = 0; tower < 4; tower++) {
          var tx2 = 39 + tower * 6;
          addCylinder('reactor-column', 0.38, 0.55, 6.4, tower % 2 ? 0x3e4160 : 0x31566a, tx2, 3.2, z, { metalness: 0.58, roughness: 0.35, emissive: 0x172039, emissiveIntensity: 0.25 });
          addLandmarkBox( 0.58, 0.15, 0.58, 0x52f2ff, tx2, 6.35, z, { emissive: 0x278eaa, emissiveIntensity: 0.72, castShadow: false });
        }
        addLandmarkMesh( getGeometry('core-shell', function () { return new T.SphereGeometry(1.75, 16, 12); }), getMaterial(0xf090b5, { roughness: 0.4, emissive: 0x742b6a, emissiveIntensity: 0.48, transparent: true, opacity: 0.82 }), 49, 4.25, z + 0.8);
        for (var ring = 0; ring < 3; ring++) {
          var halo = addLandmarkMesh( getGeometry('core-ring-' + ring, function () { return new T.TorusGeometry(2.4 + ring * 0.4, 0.07, 7, 28); }), getMaterial(ring % 2 ? 0x9b43ff : 0x52f2ff, { emissive: ring % 2 ? 0x401078 : 0x146071, emissiveIntensity: 0.8 }), 49, 4.25, z + 0.3);
          halo.rotation.y = ring * Math.PI / 3; halo.rotation.x = ring * Math.PI / 5;
          spinLandmark(halo,'y',0.16+ring*0.06,ring*Math.PI/2);
        }
        var reactorCore = addLandmarkMesh(getGeometry('reactor-core-glow',function(){return new T.SphereGeometry(1.9,12,9);}),getMaterial(0xf090b5,{transparent:true,opacity:0.12,emissive:0x9b43ff,emissiveIntensity:0.35}),49,4.25,z+0.8,false);
        pulseLandmark(reactorCore,1.25,0);
        addLandmarkBox( 0.35, 7.4, 0.35, 0x39294d, 49, 3.7, z + 0.55, { emissive: 0x6b35a2, emissiveIntensity: 0.22 });
        break;
    }
  }
  function buildThemeProps(level, theme) {
    var T = window.THREE;
    // A corridor gives the old side-scrolling combat space a believable 3D route.
    for (var i = 0; i < 6; i++) {
      var x = 7 + i * 16;
      addPillar(x, theme);
      if (level === 0) {
        addHospitalBed(x - 3, i % 2 ? 9 : -9, theme);
        addBox(world, 1.15, 2.6, 0.8, 0x7a8f88, x + 5, 1.3, i % 2 ? -9 : 9, { roughness: 0.76 });
        addBox(world, 0.85, 1.5, 0.08, theme.accent, x + 5, 1.35, i % 2 ? -8.55 : 8.55, { emissive: theme.accent, emissiveIntensity: 0.25, castShadow: false });
      } else if (level === 1) {
        addCar(x - 3, i % 2 ? 9 : -9, theme, i);
        addBox(world, 0.62, 7, 0.62, 0x4d4b43, x + 5, 3.5, i % 2 ? -10 : 10, { roughness: 0.82 });
        addBox(world, 1.1, 0.12, 0.8, theme.accent, x + 5, 6.8, i % 2 ? -10 : 10, { emissive: theme.glow, emissiveIntensity: 0.35 });
      } else if (level === 2 || level === 6) {
        addShelves(x - 3, i % 2 ? 10 : -10, theme);
        addDesk(x + 4, i % 2 ? -9 : 9, theme);
      } else if (level === 3) {
        addShelves(x - 3, i % 2 ? 10 : -10, theme);
        addBox(world, 0.35, 1.1, 0.35, 0x9f7850, x + 4, 0.56, i % 2 ? -8 : 8, { roughness: 0.68 });
      } else if (level === 4 || level === 8) {
        addBox(world, 5.5, 1.3, 2.3, level === 4 ? 0x3e5462 : 0x394052, x - 2, 0.8, i % 2 ? 9 : -9, { roughness: 0.55, metalness: 0.18 });
        addBox(world, 1.8, 0.28, 1.5, theme.prop, x - 2, 1.55, i % 2 ? 9 : -9, { roughness: 0.78 });
      } else if (level === 5 || level === 9) {
        addSpeaker(x - 3, i % 2 ? 10 : -10, theme);
        addBox(world, 3.5, 0.25, 1.8, theme.prop, x + 4, 1.05, i % 2 ? -9 : 9, { roughness: 0.52 });
      } else if (level === 10 || level === 11) {
        addBox(world, 5.5, 2.4, 1.0, 0x394052, x - 3, 1.2, i % 2 ? 10 : -10, { roughness: 0.56 });
        for (var seat = 0; seat < 3; seat++) addBox(world, 1.2, 0.72, 1.0, [0x386b4a, 0x34507b, 0x843d46][seat], x - 4 + seat * 1.5, 2.72, i % 2 ? 10 : -10, { roughness: 0.8 });
      } else {
        addBox(world, 2.8, 3.3, 1.4, theme.prop, x - 3, 1.65, i % 2 ? 10 : -10, { roughness: 0.5, metalness: 0.32 });
        addBox(world, 0.18, 0.18, 1.5, theme.glow, x - 3, 2.45, i % 2 ? 10 : -10, { emissive: theme.glow, emissiveIntensity: 0.75 });
      }
      // Recesses in both walls read as side rooms that the player can enter.
      addBox(world, 0.22, 3.8, 3.8, theme.accent, x + 1, 1.9, 14.15, { roughness: 0.42, metalness: 0.18 });
      addBox(world, 0.22, 3.8, 3.8, theme.accent, x + 1, 1.9, -14.15, { roughness: 0.42, metalness: 0.18 });
    }
    if (level === 0) {
      var sign = makeRoomSign('PRONTO SOCCORSO', theme.accent);
      sign.position.set(11, 6.3, -13.65); sign.rotation.y = Math.PI; landmarkProps.add(sign);
      var sign2 = makeRoomSign('REPARTO 9', 0xff4d6d);
      sign2.position.set(62, 6.3, 13.65); landmarkProps.add(sign2);
    } else {
      var levelName = (window.DATA && DATA.Levels[level] && DATA.Levels[level].place || 'ZONA ' + (level + 1)).toUpperCase();
      var board = makeRoomSign(levelName, theme.accent);
      board.position.set(10, 6.3, -13.65); board.rotation.y = Math.PI; landmarkProps.add(board);
    }
    addLevelLandmark(level, theme);
    // Ceiling lights are visible emissive panels; the room intentionally stays open above the camera.
    for (var lx = 5; lx < 100; lx += 13) {
      addBox(world, 4.5, 0.12, 1.15, theme.glow, lx, 8.8, 0, { emissive: theme.glow, emissiveIntensity: 0.72, castShadow: false });
    }
    var themeLamp = new T.PointLight(theme.glow, 0.8, 40, 1.5);
    themeLamp.position.set(43, 7, 0); world.add(themeLamp);
  }
  function getSky(theme) {
    /* Cielo esterno: gradiente dipendente dal tema. Oltre l'arena non c'è più il vuoto nero. */
    var T = window.THREE, id = 'sky:' + theme.haze;
    if (textureCache[id]) return textureCache[id];
    var cv = document.createElement('canvas'); cv.width = 8; cv.height = 256;
    var g = cv.getContext('2d');
    var top = new T.Color(theme.haze).multiplyScalar(0.42);
    var mid = new T.Color(theme.haze);
    var low = new T.Color(theme.glow).lerp(new T.Color(theme.haze), 0.68);
    var grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#' + top.getHexString());
    grad.addColorStop(0.55, '#' + mid.getHexString());
    grad.addColorStop(1, '#' + low.getHexString());
    g.fillStyle = grad; g.fillRect(0, 0, 8, 256);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    for (var i = 0; i < 26; i++) g.fillRect((i * 37) % 8, (i * 61) % 170, 1, 1);
    var tex = new T.CanvasTexture(cv);
    textureCache[id] = tex;
    return tex;
  }
  function buildExterior(levelIndex, theme) {
    var T = window.THREE;
    /* ESTERNO visibile ma NON accessibile: terreno, skyline, lampioni e insegne
       oltre le mura — l'arena è un luogo dentro un mondo che continua fuori. */
    var groundMat = getMaterial(theme.wall, { roughness: 0.95, metalness: 0.02 });
    var ground = addLandmarkMesh(getGeometry('ext-ground', function () { return new T.PlaneGeometry(460, 320); }), groundMat, 48, -0.34, -40, false);
    ground.rotation.x = -Math.PI / 2;
    for (var i = 0; i < 30; i++) {
      var side = i % 2 ? 1 : -1;
      var bx = -80 + (i * 53) % 260;
      var bz = side * (24 + (i * 29) % 58);
      var bh = 8 + (i * 17) % 24;
      var bw = 7 + (i % 4) * 4;
      addLandmarkBox(bw, bh, bw * 0.9, theme.wall, bx, bh / 2 - 0.3, bz, { roughness: 0.92, castShadow: false });
      if (i % 2 === 0) {
        addLandmarkBox(bw * 0.55, 1.1, 0.12, theme.glow, bx, bh * 0.72, bz + (side > 0 ? -bw * 0.46 : bw * 0.46), { emissive: theme.glow, emissiveIntensity: 0.6, castShadow: false });
      }
    }
    for (var lx = -40; lx <= 140; lx += 26) {
      for (var sgn = -1; sgn <= 1; sgn += 2) {
        addLandmarkBox(0.24, 6.4, 0.24, theme.prop, lx, 2.9, sgn * 19, { castShadow: false });
        addLandmarkBox(1.7, 0.28, 0.55, theme.glow, lx, 6.15, sgn * 18.4, { emissive: theme.glow, emissiveIntensity: 0.85, castShadow: false });
      }
    }
  }
  function buildWorld(levelIndex) {
    if (!ready || !world) return;
    clearWorld();
    currentLevel = levelIndex;
    var T = window.THREE, theme = getTheme(levelIndex), quality = settingQuality();
    scene.fog = new T.FogExp2(theme.haze, quality === 'low' ? 0.0032 : 0.0052);
    scene.background = getSky(theme);
    ambientLight.color.setHex(theme.accent);
    ambientLight.intensity = quality === 'low' ? 1.5 : 1.1;
    mainLight.color.setHex(0xfff1d8);
    mainLight.intensity = quality === 'high' ? 1.75 : 1.25;
    mainLight.castShadow = quality === 'high';
    accentLight.color.setHex(theme.glow);
    accentLight.intensity = quality === 'low' ? 0.4 : 1.25;

    var texture = floorTexture(theme, levelIndex);
    var floorMat = new T.MeshStandardMaterial({ map: texture, color: 0xffffff, roughness: 0.91, metalness: 0.02, side: T.DoubleSide });
    var floor = addLandmarkMesh( getGeometry('hall-floor', function () { return new T.PlaneGeometry(116, 30); }), floorMat, 48, -0.12, 0, false);
    floor.rotation.x = -Math.PI / 2;
    floor.userData.ownedMaterials = [floorMat];
    floor.userData.ownedTexture = null;
    // A low-contrast animated hazard stripe and wall panels provide readable depth cues.
    var wallPanelMat = getMaterial(theme.prop, { roughness: 0.82, metalness: 0.08 });
    for (var panel = 0; panel < 14; panel++) {
      var panelX = -3 + panel * 8;
      addLandmarkBox( 3.7, 2.9, 0.035, theme.prop, panelX, 2.15, 14.36, { roughness: 0.82, metalness: 0.08, castShadow: false });
      addLandmarkBox( 3.7, 2.9, 0.035, theme.prop, panelX, 2.15, -14.36, { roughness: 0.82, metalness: 0.08, castShadow: false });
      if (panel % 2 === levelIndex % 2) {
        addLandmarkBox( 0.65, 0.12, 0.04, theme.accent, panelX, 3.35, 14.32, { emissive: theme.accent, emissiveIntensity: 0.11, castShadow: false });
        addLandmarkBox( 0.65, 0.12, 0.04, theme.accent, panelX, 3.35, -14.32, { emissive: theme.accent, emissiveIntensity: 0.11, castShadow: false });
      }
    }
    addLandmarkBox( 112, 4.5, 0.8, theme.wall, 48, 2.15, 14.8, { roughness: 0.9, castShadow: false });
    addLandmarkBox( 112, 4.5, 0.8, theme.wall, 48, 2.15, -14.8, { roughness: 0.9, castShadow: false });
    addLandmarkBox( 0.8, 4.5, 30, theme.wall, -8, 2.15, 0, { roughness: 0.9, castShadow: false });
    addLandmarkBox( 0.8, 4.5, 30, theme.wall, 104, 2.15, 0, { roughness: 0.9, castShadow: false });
    // Alternating floor strips, wall trims and theme props make the hall read as a place.
    for (var x = -6; x < 104; x += 8) {
      addLandmarkBox( 0.08, 0.018, 29, theme.accent, x, -0.085, 0, { emissive: theme.accent, emissiveIntensity: 0.055, castShadow: false });
    }
    addLandmarkBox( 112, 0.16, 0.18, theme.accent, 48, 4.25, 14.27, { emissive: theme.glow, emissiveIntensity: 0.1, castShadow: false });
    addLandmarkBox( 112, 0.16, 0.18, theme.accent, 48, 4.25, -14.27, { emissive: theme.glow, emissiveIntensity: 0.1, castShadow: false });
    buildThemeProps(levelIndex, theme);
    buildExterior(levelIndex, theme);
  }
  function clearWorld() {
    [actorNodes, projectileNodes, pickupNodes, effectNodes, obstacleNodes, vaseNodes, poiNodes].forEach(function (map) { map.clear(); });
    landmarkMotions.length = 0;
    [world, landmarkProps, actors, projectiles, pickups, effects, obstacles, vases, pois].forEach(function (group) {
      if (!group) return;
      while (group.children.length) {
        var child = group.children[0];
        group.remove(child);
        releaseNode(child);
      }
    });
    Object.keys(geometryCache).forEach(function (k) { geometryCache[k].dispose(); });
    Object.keys(materialCache).forEach(function (k) { materialCache[k].dispose(); });
    Object.keys(textureCache).forEach(function (k) { textureCache[k].dispose(); });
    geometryCache = Object.create(null); materialCache = Object.create(null); textureCache = Object.create(null);
    oilNodes.clear();
  }

  function charColor(id) {
    var palette = { zappo: 0xff2a2a, mimi: 0xb565ff, bruno: 0x596b78, ferdinando: 0xd4af37, dolores: 0x70b85d, kevin: 0xff7f32, carla: 0xff2e7e, sandro: 0xe65c00, paolo: 0x20c997, lucia: 0x3a8fd9, ninoz: 0xe056fd };
    return palette[id] || 0x77aacc;
  }
  function enemyColor(id) {
    var palette = { nurse: 0xe3e8f3, gurney: 0xb7c1c8, cart: 0x6ebf99, drone: 0x555d6c, folder: 0xd6c27d, clerk: 0x566d51, granny: 0xd85e9a, passenger: 0x61769b, clown: 0xb755be, plant: 0x438c51, silla: 0x344055, shredder: 0x929da8, wheelchair: 0x75528f, knitter: 0xabb8c7, suitcase: 0x956343, steward: 0x2c9a98, dancer: 0xef69bd, barman: 0x2d2d3d, ultrass: 0x22438b, mascotte: 0xf18c3e, spettro: 0xcdd8ec, ratto: 0x6b6b78, usciere: 0x2c3346, avvocato: 0x26262e };
    return palette[id] || 0xadb5bd;
  }
  function bossColor(id) {
    var palette = { bendaggio: 0xe8e8ef, custode: 0x47734a, timbro: 0x315b77, coupon: 0xc75d8c, capotreno: 0x1d5075, palloncino: 0xf06290, manager: 0x363445, badante: 0x81c76c, gatekeep: 0x293b62, deejay: 0x574075, allenatore: 0x465152, bandierona: 0xd5d8e3, fantasma: 0xcdd8ec, giudice: 0x241c2e, fritto: 0x9a542e, energia: 0x30475c, archivio: 0x555564, cervellone: 0xee91ad };
    return palette[id] || 0xf0ad62;
  }
  function createActorNode(a) {
    var T = window.THREE, group = new T.Group(), role = a.kind || 'enemy';
    var baseColor = role === 'player' ? outfitColor(a.charId,a.colors&&a.colors.outfit) : role === 'boss' ? bossColor(a.type) : enemyColor(a.type);
    if(role!=='player'&&a.variant!=null&&window.THREE){
      /* varianti NPC: stessa tipologia, tinta leggermente diversa per ogni unità */
      var vColor=new window.THREE.Color(baseColor);
      vColor.offsetHSL((a.variant%4)*0.035-0.05,(a.variant%2)*0.08,(a.variant%4)*0.045-0.06);
      baseColor=vColor.getHex();
    }
    var baseMat = getMaterial(baseColor, { roughness: 0.72, flatShading: false });
    var darkMat = getMaterial(role === 'player' ? 0x202a45 : 0x28303b, { roughness: 0.84 });
    var skinMat = getMaterial(0xffd3ac, { roughness: 0.88 });
    var accent = getMaterial(role === 'player' ? 0xffe34c : 0xff444f, { emissive: role === 'player' ? 0x7a5713 : 0x4a0b14, emissiveIntensity: 0.3 });
    var rootScale = role === 'boss' ? 1.45 : role === 'player' ? 1 : 0.82;      group.scale.setScalar(rootScale);
      var body = new T.Group(); body.name = 'animatedBody'; group.add(body);
      var weaponPivot = null;

    var isMachine = ['cart', 'suitcase', 'shredder', 'gurney', 'drone', 'plant', 'mascotte'].indexOf(a.type) >= 0 && role === 'enemy';
    if (isMachine) {
      if (a.type === 'drone') {
        addMesh(body, getGeometry('drone-core', function () { return new T.DodecahedronGeometry(0.62, 0); }), baseMat, 0, 1.3, 0);
        addBox(body, 1.9, 0.08, 0.12, 0x707b88, 0, 1.55, 0, { metalness: 0.5 });
        addMesh(body, getGeometry('drone-eye', function () { return new T.SphereGeometry(0.16, 8, 6); }), accent, 0.34, 1.31, 0.45);
      } else if (a.type === 'plant') {
        addMesh(body, getGeometry('plant-stem', function () { return new T.CylinderGeometry(0.18, 0.32, 1.15, 7); }), getMaterial(0x327849), 0, 0.65, 0);
        addMesh(body, getGeometry('plant-head', function () { return new T.SphereGeometry(0.58, 8, 6); }), baseMat, 0, 1.55, 0);
        addMesh(body, getGeometry('plant-eye', function () { return new T.SphereGeometry(0.1, 6, 5); }), accent, 0.25, 1.68, 0.48);
      } else {
        addMesh(body, getGeometry('machine-body', function () { return new T.BoxGeometry(1.22, 1.2, 1.05); }), baseMat, 0, 0.9, 0);
        addBox(body, 0.72, 0.16, 0.12, accent.color.getHex(), 0, 1.05, 0.56, { emissive: accent.color.getHex(), emissiveIntensity: 0.32 });
        for (var wheel = -1; wheel <= 1; wheel += 2) {
          addMesh(body, getGeometry('machine-wheel', function () { return new T.CylinderGeometry(0.2, 0.2, 0.16, 8); }), darkMat, wheel * 0.48, 0.24, 0.44).rotation.x = Math.PI / 2;
        }
        if (a.type === 'suitcase') addMesh(body, getGeometry('case-handle', function () { return new T.TorusGeometry(0.25, 0.055, 5, 8, Math.PI); }), darkMat, 0, 1.52, 0.02);
      }
    } else {
      var torsoGeo = getGeometry('actor-torso', function () { return new T.CylinderGeometry(0.43, 0.52, 0.86, 12, 2); });
      addMesh(body, torsoGeo, baseMat, 0, 1.2, 0);
      addMesh(body, getGeometry('actor-chest', function () { return new T.SphereGeometry(0.47, 12, 9); }), baseMat, 0, 1.48, 0);
      /* segni del danno: graffi rossi sul torso, visibili quando la vita cala */
      var woundMarks = [];
      for (var wm = 0; wm < 3; wm++) {
        var mark = addBox(body, 0.3 - wm * 0.05, 0.055, 0.03, 0x8a1226, -0.16 + wm * 0.16, 1.52 - wm * 0.17, 0.45, { emissive: 0x55091a, emissiveIntensity: 0.5, castShadow: false });
        mark.rotation.z = -0.5 + wm * 0.35;
        mark.visible = false;
        woundMarks.push(mark);
      }
      group.userData.wounds = woundMarks;
      addMesh(body, getGeometry('actor-head', function () { return new T.SphereGeometry(0.42, 14, 11); }), skinMat, 0, 2.02, 0.05);
      addMesh(body, getGeometry('actor-hair', function () { return new T.SphereGeometry(0.44, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.45); }), darkMat, 0, 2.18, -0.02);
      var eyeMat=getMaterial(0x10151f,{roughness:0.2}), eyeGlint=getMaterial(0xffffff,{emissive:0x777777,emissiveIntensity:0.25});
      for (var eye = -1; eye <= 1; eye += 2) {
        addMesh(body,getGeometry('actor-eye-white',function(){return new T.SphereGeometry(0.125,10,8);}),eyeGlint,eye*0.15,2.02,0.38,false);
        addMesh(body,getGeometry('actor-eye', function () { return new T.SphereGeometry(0.068, 8, 6); }), eyeMat, eye * 0.15, 2.02, 0.485,false);
        // palpebra comica stile Fox Cartoons (Simpson/Griffin)
        addMesh(body,getGeometry('actor-eyelid',function(){return new T.SphereGeometry(0.13,8,5,0,Math.PI*2,0,Math.PI*0.35);}),skinMat,eye*0.15,2.06,0.375,false).rotation.x=-0.25;
      }
      addMesh(body,getGeometry('actor-nose',function(){return new T.SphereGeometry(0.08,8,6);}),skinMat,0,1.91,0.46,false);
      // mento pronunciato stile Stan Smith / Peter Griffin
      addMesh(body,getGeometry('actor-chin',function(){return new T.SphereGeometry(0.16,9,7);}),skinMat,0,1.72,0.38,false).scale.set(1.2,0.85,1.0);
      var armGeo = getGeometry('actor-arm', function () { return new T.CylinderGeometry(0.15, 0.19, 0.76, 9, 1); });
      var armJointGeo=getGeometry('actor-joint',function(){return new T.SphereGeometry(0.19,9,7);});
      var gloveGeo=getGeometry('actor-glove',function(){return new T.SphereGeometry(0.18,9,7);});
      var legGeo = getGeometry('actor-leg', function () { return new T.CylinderGeometry(0.19, 0.23, 0.66, 9, 1); });
      var bootGeo=getGeometry('actor-boot',function(){return new T.SphereGeometry(0.25,9,7);});
      var arms = [], legs = [];
      for (var side = -1; side <= 1; side += 2) {
        addMesh(body,armJointGeo,baseMat,side*0.49,1.5,0);
        var arm= capsuleBetween(body,'actor-arm',new T.Vector3(side*0.49,1.48,0),new T.Vector3(side*0.6,0.84,0.02),0.16,baseMat);arms.push(arm);
        addMesh(body,gloveGeo,accent,side*0.6,0.75,0.04);
        var leg=capsuleBetween(body,'actor-leg',new T.Vector3(side*0.23,0.72,0),new T.Vector3(side*0.23,0.16,0.02),0.19,darkMat);legs.push(leg);
        addMesh(body,bootGeo,darkMat,side*0.23,0.12,0.11).scale.set(1.05,0.58,1.22);
      }
      addBox(body,0.88,0.12,0.55,accent.color.getHex(),0,0.93,0.04,{emissive:accent.color.getHex(),emissiveIntensity:0.16,roughness:0.62});
    var playerId=a.charId||'zappo';
    if(role==='player'&&playerId!=='lucia'){
      var motif=playerId==='mimi'?0xff4d6d:playerId==='zappo'?0x52f2ff:playerId==='bruno'?0xffd94d:charColor(playerId);
      var sigilGeo=getGeometry('player-icon-'+playerId,function(){return new T.OctahedronGeometry(0.17,0);});
      var sigilMat=getMaterial(motif,{emissive:motif,emissiveIntensity:0.65,metalness:0.22});
      var sigil=addMesh(body,sigilGeo,sigilMat,0,1.22,0.61,false);
      sigil.scale.set(1,1.18,0.48);
      var backSigil=addMesh(body,sigilGeo,sigilMat,0,1.22,-0.61,false);
      backSigil.scale.set(1,1.18,0.48);
      backSigil.rotation.y=Math.PI;
      /* Il chase-cam mostra spesso la schiena: badge e profili restano leggibili. */
      addBox(body,0.08,0.72,0.06,motif,0,1.3,-0.55,{emissive:motif,emissiveIntensity:0.22,castShadow:false});
      addBox(body,0.42,0.08,0.06,motif,0,1.3,-0.55,{emissive:motif,emissiveIntensity:0.22,castShadow:false});
    }
      group.userData.arms = arms; group.userData.legs = legs;
      if (role === 'boss') {
        addBox(body, 0.9, 0.18, 0.12, 0xff4d6d, 0, 1.22, 0.57, { emissive: 0x501020, emissiveIntensity: 0.45 });
        addMesh(body, getGeometry('boss-spike', function () { return new T.ConeGeometry(0.22, 0.72, 5); }), accent, -0.48, 2.45, -0.02);
        addMesh(body, getGeometry('boss-spike', function () { return new T.ConeGeometry(0.22, 0.72, 5); }), accent, 0.48, 2.45, -0.02);
      } else if (role === 'player') {
        var playerId=a.charId||'zappo';
        var markColor=charColor(playerId);
        addBox(body, 0.4, 0.13, 0.1, accent.color.getHex(), 0, 1.23, 0.56, { emissive: accent.color.getHex(), emissiveIntensity: 0.5 });
        if(playerId==='mimi'){
          // ANGELO CADUTO: ali piumate viola scuro e aureola spezzata
          var angelWingMat=getMaterial(0x8a45b8,{roughness:0.6});
          for(var wingSide=-1;wingSide<=1;wingSide+=2){
            var wing=addMesh(body,getGeometry('angel-wing',function(){return new T.ConeGeometry(0.18,0.92,4);}),angelWingMat,wingSide*0.48,1.45,-0.42);
            wing.rotation.z=wingSide*0.75; wing.rotation.x=-0.5;
          }
          var brokenHalo=addMesh(body,getGeometry('angel-halo',function(){return new T.TorusGeometry(0.28,0.045,5,12,Math.PI*1.6);}),getMaterial(0xffea60,{emissive:0xa88514,emissiveIntensity:0.6}),0.08,2.46,-0.04);
          brokenHalo.rotation.x=Math.PI/2; brokenHalo.rotation.y=0.25;
        } else if(playerId==='zappo'){
          // FIGLIO DEL DIAVOLO: corna ricurve scarlatte e spuntoni infuocati
          var devilHornMat=getMaterial(0xff1f1f,{emissive:0x700000,emissiveIntensity:0.45,roughness:0.3});
          for(var horn=-1;horn<=1;horn+=2){
            var hMesh=addMesh(body,getGeometry('devil-horn',function(){return new T.ConeGeometry(0.14,0.58,5);}),devilHornMat,horn*0.28,2.44,-0.02);
            hMesh.rotation.z=-horn*0.38; hMesh.rotation.x=-0.2;
          }
          // coda appuntita
          var tailMat=getMaterial(0xff2222,{emissive:0x660000,emissiveIntensity:0.35});
          var tail=addMesh(body,getGeometry('devil-tail',function(){return new T.ConeGeometry(0.12,0.48,4);}),tailMat,0,0.85,-0.55);
          tail.rotation.x=-Math.PI*0.75;
        } else if(playerId==='bruno'){
          // PADRE DIVORZIATO: canotta, lattina e ciabatta
          addBox(body,0.65,0.78,0.48,0xf4efe6,0,1.22,0.06,{roughness:0.95});
          addMesh(body,getGeometry('dad-can',function(){return new T.CylinderGeometry(0.09,0.09,0.28,8);}),getMaterial(0xcc2233,{metalness:0.6}),-0.55,0.92,0.35);
        } else if(playerId==='ferdinando'){
          // AVVOCATO FALLITO: cravatta d'oro e cartellina legale
          addBox(body,0.76,0.85,0.52,0x242834,0,1.2,0.02,{roughness:0.8});
          addBox(body,0.12,0.46,0.08,0xd4af37,0,1.25,0.32,{emissive:0x665215,emissiveIntensity:0.4});
        } else if(playerId==='dolores'){
          // NONNA ANARCHICA: bandana anarchica e barattolo di conserva
          addMesh(body,getGeometry('granny-kerchief',function(){return new T.SphereGeometry(0.38,8,6,0,Math.PI*2,0,Math.PI*0.55);}),getMaterial(0xcc2233),0,2.38,-0.02);
          addMesh(body,getGeometry('preserve-jar',function(){return new T.CylinderGeometry(0.12,0.13,0.32,7);}),getMaterial(0xe85a2b,{roughness:0.2}),-0.52,0.95,0.36);
        } else if(playerId==='kevin'){
          // COMPLOTTISTA PARANOICO: cappello di stagnola conica
          addMesh(body,getGeometry('tinfoil-hat',function(){return new T.ConeGeometry(0.38,0.62,6);}),getMaterial(0xccd6e0,{metalness:0.85,roughness:0.2}),0,2.48,0);
          addMesh(body,getGeometry('kevin-head-2',function(){return new T.SphereGeometry(0.29,8,6);}),skinMat,0.45,2.02,-0.05);
        } else if(playerId==='carla'){
          // CARLA LA FEMMINISTA: fascia fucsia fluo e megafono
          addBox(body,0.64,0.12,0.12,0x00f2fe,0,2.22,0.3,{emissive:0x008899,emissiveIntensity:0.5});
          addMesh(body,getGeometry('feminist-hair',function(){return new T.SphereGeometry(0.32,8,6);}),getMaterial(0x631e78),0,2.36,-0.12);
        } else if(playerId==='sandro'){
          // IDRAULICO LUNATICO: berretto da lavoro e sturalavandini/raccordo
          addMesh(body,getGeometry('plumber-cap',function(){return new T.CylinderGeometry(0.44,0.46,0.18,9);}),getMaterial(0xe65c00),0,2.38,0.06);
          addBox(body,0.66,0.72,0.44,0x2b4f8c,0,1.05,0.06,{roughness:0.85});
        } else if(playerId==='paolo'){
          // TRADER IN BANCAROTTA: candela ribassista rossa luminosa
          addBox(body,0.48,0.3,0.08,0x18252b,0,1.25,0.6,{roughness:0.5});
          addBox(body,0.08,0.32,0.06,0xff2222,0,1.25,0.66,{emissive:0xff2222,emissiveIntensity:0.9,castShadow:false});
        } else if(playerId==='lucia'){
          // L'ESATTORE SPIETATO: giacca ministeriale e cartella pignoramenti
          addBox(body,0.75,0.85,0.5,0x1a2638,0,1.2,0.02,{roughness:0.75});
          addBox(body,0.32,0.44,0.1,0xba1e2e,0.52,0.98,0.22,{roughness:0.6});
        } else if(playerId==='ninoz'){
          // NINOZ IL TRAPPER: capelli grigi, occhiali da sole con lenti rosse, collana dorata
          var trapHairMat=getMaterial(0xc0c8d0,{roughness:0.6});
          addMesh(body,getGeometry('ninoz-hair',function(){return new T.SphereGeometry(0.43,10,7,0,Math.PI*2,0,Math.PI*0.48);}),trapHairMat,0,2.18,-0.02);
          for(var lock=-2;lock<=2;lock++){
            var dread=addMesh(body,getGeometry('ninoz-lock',function(){return new T.CylinderGeometry(0.06,0.08,0.36,6);}),trapHairMat,lock*0.14,2.26,0.22);
            dread.rotation.x=0.4;
          }
          // occhiali da sole squadrati con lenti rosse fluorescenti
          var sunglassMat=getMaterial(0x181822,{roughness:0.4});
          var redLensMat=getMaterial(0xff1e42,{emissive:0xaa0022,emissiveIntensity:0.75,roughness:0.2});
          addBox(body,0.64,0.2,0.1,0x181822,0,2.02,0.42);
          addBox(body,0.24,0.14,0.04,0xff1e42,-0.16,2.02,0.47,{emissive:0xff1e42,emissiveIntensity:0.8,castShadow:false});
          addBox(body,0.24,0.14,0.04,0xff1e42,0.16,2.02,0.47,{emissive:0xff1e42,emissiveIntensity:0.8,castShadow:false});
          // collana trap dorata
          addMesh(body,getGeometry('trap-chain',function(){return new T.TorusGeometry(0.32,0.04,6,16);}),getMaterial(0xffd700,{metalness:0.85,roughness:0.2}),0,1.48,0.34).rotation.x=Math.PI/3;
        }
        weaponPivot=new T.Group(); weaponPivot.name='weaponPivot'; weaponPivot.position.set(0.64,1.24,0.34); body.add(weaponPivot);
        var weaponId=a.colors&&a.colors.weapon||'mattarello';
        var weaponMat=getMaterial(weaponId==='anatra'?0xffdf66:weaponId==='aspirafogli'?0x687a8a:weaponId==='gelato'?0xf57ca8:weaponId==='tostapane'?0xa7b1bb:weaponId==='trombone'?0xd9a82e:weaponId==='ciabatta'?0xb77a45:0xc59b61,{roughness:0.52,metalness:weaponId==='trombone'?0.65:0.18});
        if(weaponId==='anatra'){
          addMesh(weaponPivot,getGeometry('weapon-duck-body',function(){return new T.SphereGeometry(0.28,8,6);}),weaponMat,0.2,0.08,0.02);
          addMesh(weaponPivot,getGeometry('weapon-duck-head',function(){return new T.SphereGeometry(0.16,7,5);}),weaponMat,0.38,0.22,0.02);
          addBox(weaponPivot,0.2,0.07,0.1,0xf28c28,0.52,0.2,0.1,{castShadow:false});
        } else if(weaponId==='aspirafogli'){
          addBox(weaponPivot,0.55,0.34,0.34,0x596b7d,0.16,0,0,{metalness:0.28});
          addMesh(weaponPivot,getGeometry('weapon-vacuum-mouth',function(){return new T.CylinderGeometry(0.07,0.19,0.16,8);}),getMaterial(0x9de8e9,{metalness:0.36}),0.48,-0.02,0);
        } else if(weaponId==='gelato'){
          addMesh(weaponPivot,getGeometry('weapon-cone',function(){return new T.ConeGeometry(0.18,0.53,7);}),getMaterial(0xd8ab6b),0.17,-0.1,0);
          addMesh(weaponPivot,getGeometry('weapon-scoop',function(){return new T.SphereGeometry(0.23,8,6);}),weaponMat,0.17,0.22,0);
        } else if(weaponId==='tostapane'){
          addBox(weaponPivot,0.56,0.4,0.38,weaponMat.color.getHex(),0.16,0,0,{metalness:0.4});
          addBox(weaponPivot,0.13,0.33,0.08,0xef9b40,0.48,-0.12,0.02,{emissive:0x87430d,emissiveIntensity:0.3});
        } else if(weaponId==='trombone'){
          addMesh(weaponPivot,getGeometry('weapon-brass-bell',function(){return new T.CylinderGeometry(0.09,0.28,0.3,8);}),weaponMat,0.4,0.08,0);
          addBox(weaponPivot,0.55,0.08,0.09,weaponMat.color.getHex(),0.1,0.04,0,{metalness:0.6});
          addBox(weaponPivot,0.08,0.26,0.08,weaponMat.color.getHex(),0.1,-0.04,0,{metalness:0.6});
        } else if(weaponId==='forcone'){
          addBox(weaponPivot,0.85,0.08,0.08,0x2b1e16,0.24,0,0,{roughness:0.8});
          addBox(weaponPivot,0.1,0.38,0.08,0xc0392b,0.64,0,0,{metalness:0.7,emissive:0x550a0a,emissiveIntensity:0.3});
          for(var pr=-1;pr<=1;pr++){
            var prong=addMesh(weaponPivot,getGeometry('fork-prong',function(){return new T.ConeGeometry(0.045,0.34,4);}),getMaterial(0xc0392b,{metalness:0.8}),0.78,pr*0.14,0);
            prong.rotation.z=-Math.PI/2;
          }
        } else if(weaponId==='sturalavandini'){
          addBox(weaponPivot,0.72,0.07,0.07,0xd2a679,0.22,0,0);
          var cup=addMesh(weaponPivot,getGeometry('plunger-cup',function(){return new T.ConeGeometry(0.24,0.28,8);}),getMaterial(0xd9531e,{roughness:0.6}),0.62,0,0);
          cup.rotation.z=-Math.PI/2;
        } else if(weaponId==='valigetta'){
          addBox(weaponPivot,0.48,0.36,0.18,0x2c2621,0.24,0,0,{roughness:0.7});
          addBox(weaponPivot,0.16,0.08,0.06,0xd4af37,0.24,0.22,0,{metalness:0.8});
        } else if(weaponId==='cartello'){
          addBox(weaponPivot,0.88,0.08,0.08,0x8b5a2b,0.24,0,0);
          addBox(weaponPivot,0.1,0.52,0.62,0xff2e7e,0.66,0,0,{emissive:0x66082a,emissiveIntensity:0.35});
        } else if(weaponId==='machete'){
          addBox(weaponPivot,0.25,0.08,0.08,0x2b221d,-0.05,0,0);
          addBox(weaponPivot,0.85,0.18,0.04,0xb0bec5,0.46,0.04,0,{metalness:0.85,roughness:0.25});
        } else if(weaponId==='sigarette'){
          addBox(weaponPivot,0.44,0.08,0.08,0xffffff,0.15,0,0);
          addBox(weaponPivot,0.12,0.08,0.08,0xf39c12,-0.08,0,0);
          addBox(weaponPivot,0.08,0.09,0.09,0xff3b30,0.38,0,0,{emissive:0xff3b30,emissiveIntensity:0.9,castShadow:false});
        } else if(weaponId==='mitra'){
          addBox(weaponPivot,0.72,0.2,0.14,0x2c3e50,0.2,0,0,{metalness:0.75});
          addBox(weaponPivot,0.12,0.34,0.09,0x1a252f,0.1,-0.18,0,{metalness:0.6});
          addBox(weaponPivot,0.32,0.08,0.08,0x4f5b66,0.62,0.04,0,{metalness:0.8});
        } else if(weaponId==='padella'){
          addMesh(weaponPivot,getGeometry('weapon-pan',function(){return new T.CylinderGeometry(0.25,0.25,0.1,9);}),weaponMat,0.24,0.05,0);
          addBox(weaponPivot,0.52,0.08,0.08,0x42464d,0.54,0.05,0,{metalness:0.5});
        } else {
          addBox(weaponPivot,0.74,0.12,0.12,weaponMat.color.getHex(),0.23,0,0,{metalness:0.24});
          if(weaponId==='mattarello'||weaponId==='ciabatta')addMesh(weaponPivot,getGeometry('weapon-knob',function(){return new T.SphereGeometry(0.11,6,5);}),weaponMat,0.56,0,0);
          if(weaponId==='ombrello')addMesh(weaponPivot,getGeometry('weapon-umbrella',function(){return new T.ConeGeometry(0.28,0.2,8);}),getMaterial(0xd33),0.45,0.1,0);
          if(weaponId==='megafono')addMesh(weaponPivot,getGeometry('weapon-megaphone',function(){return new T.ConeGeometry(0.23,0.45,6);}),getMaterial(0xff8c42),0.34,0,0);
        }
      }
    }
    var shadowMat = new T.MeshBasicMaterial({ color: 0x05080b, transparent: true, opacity: 0.32, depthWrite: false });
    var shadow = addMesh(group, getGeometry('actor-shadow', function () { return new T.CircleGeometry(0.82, 14); }), shadowMat, 0, 0.025, 0, false);
    group.userData.ownedMaterials = [shadowMat];
    shadow.rotation.x = -Math.PI / 2;
    group.userData.body = body;
    if(role==='player')group.userData.appearance=[a.colors&&a.colors.outfit,a.charId,a.colors&&a.colors.weapon].join(':');
    group.userData.weaponPivot = weaponPivot;
    group.userData.isMachine = isMachine;
    group.traverse(function (child) {
      if (!child.isMesh || !child.material) return;
      child.material = child.material.clone();
      group.userData.ownedMaterials.push(child.material);
      child.userData.ownedMaterial = true;
      child.userData.baseColor = child.material.color ? child.material.color.getHex() : 0xffffff;
      child.userData.baseEmissive = child.material.emissive ? child.material.emissive.getHex() : 0;
      child.userData.baseEmissiveIntensity = child.material.emissiveIntensity || 0;
    });
    return group;
  }
  function actorWorldPosition(a) {
    return { x: (a.x || 0) * 0.1, y: Math.max(0, (640 - (a.y == null ? 640 : a.y)) * 0.04), z: (a.laneZ || 0) * 0.1 };
  }
  function syncActors(game) {
    var live = new Set(), list = [];
    if (game.player && !game.player.dead) list.push(game.player);
    if (game.ally && !game.ally.dead) list.push(game.ally);
    (game.enemies || []).forEach(function (a) { if (!a.dead) list.push(a); });
    if (game.boss && !game.boss.dead) list.push(game.boss);
    list.forEach(function (a) {
      live.add(key(a));
      var node = actorNodes.get(key(a));
      if (!node) { node = createActorNode(a); actors.add(node); actorNodes.set(key(a), node); }
      var p = actorWorldPosition(a), dir = a.dir || 1;
      var phase = a.walk || a.t || 0;
      node.position.set(p.x, p.y, p.z);
      if(a.kind==='player'&&node.userData.appearance!==[a.colors&&a.colors.outfit,a.charId,a.colors&&a.colors.weapon].join(':')){
        var old=node;
        node=createActorNode(a);
        actors.add(node);actorNodes.set(key(a),node);
        actors.remove(old);releaseNode(old);
        node.position.set(p.x,p.y,p.z);
        node.userData.appearance=[a.colors&&a.colors.outfit,a.charId,a.colors&&a.colors.weapon].join(':');
      }
      node.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      node.visible = true;
      var charTone=a.kind==='player'?charColor(a.charId):a.kind==='boss'?bossColor(a.type):enemyColor(a.type);
      var aura=node.userData.aura;
      if(a.kind==='player'){
        if(!aura){aura=new window.THREE.PointLight(charTone,0.65,5.5,2);node.add(aura);aura.position.set(0,1.35,0.15);node.userData.aura=aura;}
        aura.intensity=0.48+Math.sin((a.t||0)*4)*0.16+(a.ultActive>0?0.8:0);
      }else if(aura){node.remove(aura);node.userData.aura=null;}
      if (node.userData.arms) {
        var swing = Math.sin(phase * 5) * (Math.abs(a.vx || 0) > 0.05 ? 0.34 : 0.035);
        var poseMax=a.attackPoseMax||0.72;
        var attackProgress=a.attackPoseT>0?Math.max(0,Math.min(1,1-a.attackPoseT/poseMax)):0;
        var strike=a.using?Math.sin(attackProgress*Math.PI):0;
        node.userData.legs[0].rotation.z = swing; node.userData.legs[1].rotation.z = -swing;
        node.userData.arms[0].rotation.z = -swing * 0.72 - strike * (dir>0?1.05:-0.22);
        node.userData.arms[1].rotation.z = swing * 0.72 - strike * (dir<0?1.05:-0.22);
      }
      if(node.userData.weaponPivot){
        var weaponProgress=a.attackPoseT>0?Math.max(0,Math.min(1,1-a.attackPoseT/(a.attackPoseMax||0.72))):0;
        var weaponSwing=a.using?Math.sin(weaponProgress*Math.PI):0;
        node.userData.weaponPivot.rotation.z=a.using?-1.1*weaponSwing:Math.sin(phase*5)*0.08;
        node.userData.weaponPivot.rotation.x=a.using?0.22*weaponSwing:0;
        node.userData.weaponPivot.position.y=1.24+Math.sin(weaponProgress*Math.PI)*0.14;
      }
      var flash = a.hitFlash > 0;
      var bodyNode = node.userData.body;
      if (bodyNode) {
        /* squash & stretch + rimbalzo da cartone: il corpo respira, rimbalza e si affonda al colpo */
        var moveAmt = Math.min(1, Math.abs(a.vx || 0) / 3.2);
        var strikeBody = a.using && a.attackPoseT > 0 ? Math.sin(Math.max(0, Math.min(1, 1 - a.attackPoseT / (a.attackPoseMax || 0.72))) * Math.PI) : 0;
        var windBody = a.attackPoseT > 0 && a.attackPoseT < (a.attackPoseMax || 0.72) * 0.3 ? 1 - a.attackPoseT / ((a.attackPoseMax || 0.72) * 0.3) : 0;
        var stretch = moveAmt * 0.06 * Math.sin(phase * 10) - strikeBody * 0.08;
        var sq = a.squash ? a.squash * 0.35 : 0;
        bodyNode.scale.set(1 + sq - stretch * 0.55, 1 + sq + stretch, 1 + sq - stretch * 0.55);
        bodyNode.position.y = Math.abs(Math.sin(phase * 5)) * 0.07 * (moveAmt > 0.05 ? 1 : 0.3);
        bodyNode.rotation.x = strikeBody * 0.26 - windBody * 0.17;
        node.rotation.z = -Math.max(-0.12, Math.min(0.12, (a.vx || 0) * 0.011));
      }
      if (node.userData.wounds) {
        var wound = (a.hp != null && a.maxHp) ? Math.max(0, 1 - a.hp / a.maxHp) : 0;
        node.userData.wounds.forEach(function (w, i) { w.visible = wound > 0.28 + i * 0.18; });
      }
      node.userData.hitFlash = flash;
      if(node.userData.lastFlash!==flash){
        node.traverse(function(child){ if(child.isMesh&&child.material){
          if(child.material.color) child.material.color.setHex(flash?0xffffff:child.userData.baseColor);
          if(child.material.emissive){
            child.material.emissive.setHex(flash?0xffffff:child.userData.baseEmissive);
            child.material.emissiveIntensity=flash?0.8:child.userData.baseEmissiveIntensity;
          }
        }});
        node.userData.lastFlash=flash;
      }
    });
    actorNodes.forEach(function (node, obj) {
      if (!live.has(obj)) { actors.remove(node); releaseNode(node); actorNodes.delete(obj); }
    });
  }
  function createProjectileNode(pr) {
    var T = window.THREE, group = new T.Group();
    var color = pr.col && /^#?[0-9a-f]{6}$/i.test(String(pr.col)) ? parseInt(String(pr.col).replace('#', ''), 16) : 0xffd34e;
    if(pr.kind==='duck'){
      var duckMat=getMaterial(color,{emissive:color,emissiveIntensity:0.28,roughness:0.38});
      addMesh(group,getGeometry('projectile-duck-body',function(){return new T.SphereGeometry(0.34,8,6);}),duckMat,0,0,0);
      addMesh(group,getGeometry('projectile-duck-head',function(){return new T.SphereGeometry(0.2,7,5);}),duckMat,0.22,0.17,0);
      addMesh(group,getGeometry('projectile-duck-beak',function(){return new T.ConeGeometry(0.1,0.24,5);}),getMaterial(0xf28c28),0.38,0.16,0.02).rotation.z=-Math.PI/2;
    } else if(pr.kind==='paper'||pr.kind==='bill'){
      addBox(group,0.58,0.07,0.82,pr.kind==='bill'?0xe8eef8:0xe7e1c9,0,0,0,{emissive:color,emissiveIntensity:0.12,roughness:0.85});
      addBox(group,0.35,0.025,0.045,pr.kind==='bill'?0x7ab8e8:0x9c9688,0,0.06,0.12,{castShadow:false});
      addBox(group,0.28,0.025,0.04,pr.kind==='bill'?0x7ab8e8:0x9c9688,0,0.06,-0.02,{castShadow:false});
    } else if(pr.kind==='scoop'){
      addMesh(group,getGeometry('projectile-cone',function(){return new T.ConeGeometry(0.22,0.46,6);}),getMaterial(0xd8ab6b),0,-0.12,0);
      addMesh(group,getGeometry('projectile-scoop',function(){return new T.SphereGeometry(0.24,8,6);}),getMaterial(color,{emissive:color,emissiveIntensity:0.24}),0,0.18,0);
    } else if(pr.kind==='toast'){
      addBox(group,0.4,0.56,0.3,color,0,0,0,{emissive:0x71300a,emissiveIntensity:0.28});
      addBox(group,0.23,0.27,0.08,0xffe17c,0,0,0.18,{castShadow:false});
    } else if(pr.kind==='brass'){
      addMesh(group,getGeometry('projectile-brass',function(){return new T.SphereGeometry(0.2,7,5);}),getMaterial(color,{emissive:color,emissiveIntensity:0.55,metalness:0.48}),0,0,0);
    } else {
      var geo = pr.kind === 'boulder' ? getGeometry('boulder', function () { return new T.DodecahedronGeometry(0.75, 0); }) : getGeometry('bullet', function () { return new T.SphereGeometry(0.28, 7, 5); });
      addMesh(group, geo, getMaterial(color, { emissive: color, emissiveIntensity: 0.42, roughness: 0.4 }), 0, 0, 0, false);
    }
    return group;
  }
  function syncMap(map, group, values, create, position, update) {
    var live = new Set();
    values.forEach(function (obj) {
      if (!obj || obj.dead || obj.life <= 0) return;
      live.add(key(obj));
      var node = map.get(key(obj));
      if (!node) { node = create(obj); group.add(node); map.set(key(obj), node); }
      var p = position(obj);
      node.position.set(p.x, p.y, p.z);
      if (update) update(node, obj, p);
    });
    map.forEach(function (node, obj) {
      if (!live.has(obj)) { group.remove(node); releaseNode(node); map.delete(obj); }
    });
  }
  function syncProjectiles(game) {
    syncMap(projectileNodes, projectiles, game.projs || [], createProjectileNode,
      function (pr) { return { x: pr.x * 0.1, y: Math.max(0.12, (640 - pr.y) * 0.04), z: (pr.laneZ || 0) * 0.1 }; },
      function (node, pr) { node.rotation.x += pr.kind==='paper'||pr.kind==='bill'?0.09:0.035; node.rotation.y += pr.kind==='duck'?0.045:0.06; });
  }
  function createPickupNode(pk) {
    var T = window.THREE, group = new T.Group();
    if (pk.type === 'heart') {
      addMesh(group, getGeometry('heart-token', function () { return new T.OctahedronGeometry(0.38, 0); }), getMaterial(0xff4666, { emissive: 0x6b0719, emissiveIntensity: 0.42 }), 0, 0.2, 0);
    } else if (pk.type === 'keycard') {
      addBox(group, 0.72, 0.08, 0.48, 0x63fff0, 0, 0.2, 0, { emissive: 0x1f9d8e, emissiveIntensity: 0.8, roughness: 0.25 });
      addBox(group, 0.22, 0.035, 0.05, 0xf8ffff, 0.1, 0.25, 0.19, { castShadow: false });
    } else {
      addMesh(group, getGeometry('coin-token', function () { return new T.CylinderGeometry(0.34, 0.34, 0.12, 10); }), getMaterial(pk.type === 'charge' ? 0x55ff68 : 0xffd94d, { emissive: pk.type === 'charge' ? 0x14521c : 0x4d3300, emissiveIntensity: 0.45, metalness: 0.54 }), 0, 0.2, 0).rotation.x = Math.PI / 2;
    }
    return group;
  }
  function syncPickups(game, time) {
    syncMap(pickupNodes, pickups, game.pickups || [], createPickupNode,
      function (pk) { return { x: pk.x * 0.1, y: Math.max(0.08, (640 - pk.y) * 0.04) + 0.45 + Math.sin(time * 3 + (pk.t || 0)) * 0.13, z: (pk.laneZ || 0) * 0.1 }; },
      function (node, pk) { node.rotation.y = time * 1.6; node.rotation.z = pk.type === 'keycard' ? -0.08 : 0; });
  }
  function createEffectNode(fx) {
    var T = window.THREE, group = new T.Group();
    if (fx.kind === 'dmg') {
      var c = document.createElement('canvas'); c.width = 256; c.height = 96;
      var ctx = c.getContext('2d'); ctx.font = (fx.crit ? 'bold 66px Arial' : 'bold 52px Arial'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 9; ctx.strokeStyle = '#111'; ctx.strokeText(String(fx.col || ''), 128, 49);
      ctx.fillStyle = fx.crit ? '#ffe64b' : '#fff'; ctx.fillText(String(fx.col || ''), 128, 49);
      var texture = new T.CanvasTexture(c); texture.needsUpdate = true;
      var sprite = new T.Sprite(new T.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
      sprite.scale.set(2.4, 0.9, 1); sprite.userData.ownedTexture = texture; sprite.userData.ownedMaterial = true;
      group.userData.ownedMaterials = [sprite.material]; group.add(sprite);
    } else if (fx.kind === 'blood' || fx.kind === 'splatter') {
      var bcol = fx.col && /^#?[0-9a-f]{6}$/i.test(String(fx.col)) ? parseInt(String(fx.col).replace('#', ''), 16) : 0xc4142d;
      var bmesh = addMesh(group, getGeometry('blood-splat-3d', function () { return new T.DodecahedronGeometry(0.12, 0); }), getMaterial(bcol, { emissive: 0x4a050f, emissiveIntensity: 0.6, roughness: 0.2 }), 0, 0, 0, false);
      bmesh.scale.set(1.4, 0.8, 1.4);
    } else {
      var col = fx.col && /^#?[0-9a-f]{6}$/i.test(String(fx.col)) ? parseInt(String(fx.col).replace('#', ''), 16) : 0xffffff;
      var mesh = addMesh(group, getGeometry('fx-dot', function () { return new T.SphereGeometry(0.075, 5, 4); }), getMaterial(col, { emissive: col, emissiveIntensity: 0.8 }), 0, 0, 0, false);
      mesh.scale.setScalar(fx.kind === 'ult' || fx.kind === 'ring' ? 2 : 1);
    }
    return group;
  }
  function syncEffects(game) {
    var limit = settingQuality() === 'low' ? 48 : settingQuality() === 'med' ? 96 : 160;
    var fx = (game.fx || []).slice(-limit);
    syncMap(effectNodes, effects, fx, createEffectNode,
      function (f) { return { x: f.x * 0.1, y: Math.max(0.08, (640 - f.y) * 0.04), z: (f.laneZ || 0) * 0.1 }; },
      function (node, f) {
        var fade = Math.max(0.08, 1 - (f.t || 0) / Math.max(0.01, f.life || 0.5));
        node.scale.setScalar(0.55 + fade * (f.kind === 'dmg' ? 0.45 : 0.25));
        node.traverse(function (child) { if (child.material && child.material.transparent) child.material.opacity = fade; });
      });
  }
  function createObstacleNode(o, levelIndex) {
    var T = window.THREE, group = new T.Group(), theme = getTheme(levelIndex);
    var bodyColor = levelIndex === 0 ? 0x347854 : theme.prop;
    addBox(group, 1.35, 1.8, 1.25, bodyColor, 0, 0.9, 0, { roughness: 0.6, metalness: 0.15 });
    addBox(group, 0.9, 0.48, 0.08, theme.glow, 0, 1.1, 0.65, { emissive: theme.glow, emissiveIntensity: 0.5, castShadow: false });
    if (o.type === 'shelf' || o.type === 'copier' || o.type === 'vending') {
      addBox(group, 1.05, 0.12, 0.06, 0xffd94d, 0, 0.48, 0.67, { castShadow: false });
    }
    return group;
  }
  function syncObstacles(game) {
    var levelIndex = (game && game.environmentIdx != null) ? game.environmentIdx : (game && game.levelIdx != null) ? game.levelIdx : 0;
    syncMap(obstacleNodes, obstacles, game.obstacles || [], function (o) { return createObstacleNode(o, levelIndex); },
      function (o) { return { x: o.x * 0.1, y: 0, z: (o.laneZ || 0) * 0.1 }; },
      function (node, o) { node.rotation.y = Math.sin((o.t || 0) * 0.6) * 0.035; });
  }
  function createVaseNode(v) {
    var T = window.THREE, group = new T.Group();
    addMesh(group, getGeometry('vase-body', function () { return new T.CylinderGeometry(0.35, 0.48, 0.9, 7); }), getMaterial(0x8a5ac8), 0, 0.48, 0);
    addMesh(group, getGeometry('vase-lid', function () { return new T.CylinderGeometry(0.26, 0.26, 0.13, 7); }), getMaterial(0xffd94d), 0, 1.0, 0);
    if (v.secret) {
      var marker = addMesh(group, getGeometry('secret-vase-marker', function () { return new T.OctahedronGeometry(0.12, 0); }), getMaterial(0xffe36e, {emissive:0xffa51f,emissiveIntensity:0.8}), 0, 1.2, 0);
      group.userData.secretMarker = marker;
    }
    return group;
  }
  function syncVases(game, time) {
    syncMap(vaseNodes, vases, (game.vases || []).filter(function (v) { return v.alive; }), createVaseNode,
      function (v) { return { x: v.x * 0.1, y: 0.04 + Math.sin(time * 2 + (v.t || 0)) * 0.06, z: (v.laneZ || 0) * 0.1 }; },
      function (node) { if (node.userData.secretMarker) { node.userData.secretMarker.rotation.y = time * 1.8; node.userData.secretMarker.position.y = 1.17 + Math.sin(time * 3) * 0.05; } });
  }
  function createPoiNode(poi, levelIndex) {
    var T = window.THREE, group = new T.Group();
    var level = Math.max(0,Math.min(14,levelIndex||0));
    var theme = getTheme(level), glow = theme.glow;
    var sigils = [
      {id:'hospital-cross',geometry:function(){return new T.BoxGeometry(0.12,0.42,0.08);},color:0xff4d6d},
      {id:'parking-token',geometry:function(){return new T.CylinderGeometry(0.22,0.22,0.07,8);},color:0xffc434},
      {id:'police-shield',geometry:function(){return new T.OctahedronGeometry(0.25,0);},color:0x54d7b4},
      {id:'supermarket-star',geometry:function(){return new T.DodecahedronGeometry(0.22,0);},color:0xffcf40},
      {id:'metro-token',geometry:function(){return new T.CylinderGeometry(0.2,0.2,0.06,10);},color:0x55c9ff},
      {id:'funfair-star',geometry:function(){return new T.OctahedronGeometry(0.24,0);},color:0xff6bd6},
      {id:'office-chip',geometry:function(){return new T.BoxGeometry(0.28,0.18,0.07);},color:0x6db8ff},
      {id:'villa-leaf',geometry:function(){return new T.IcosahedronGeometry(0.23,0);},color:0xd1ae68},
      {id:'airport-wing',geometry:function(){return new T.ConeGeometry(0.19,0.4,4);},color:0x79d5ff},
      {id:'club-note',geometry:function(){return new T.TorusGeometry(0.16,0.07,5,10);},color:0xff49cf},
      {id:'stadium-ball',geometry:function(){return new T.IcosahedronGeometry(0.23,1);},color:0xe7ff63},
      {id:'vip-star',geometry:function(){return new T.OctahedronGeometry(0.25,0);},color:0xffcf72},
      {id:'manor-key',geometry:function(){return new T.TorusGeometry(0.2,0.07,5,10);},color:0xb08aff},
      {id:'gavel-star',geometry:function(){return new T.BoxGeometry(0.34,0.16,0.16);},color:0xffcf72},
      {id:'reactor-shard',geometry:function(){return new T.TetrahedronGeometry(0.27,0);},color:0x52f2ff}
    ];
    var sigil = sigils[level];
    if (poi.type === 'medical') {
      addBox(group, 1.55, 0.18, 0.76, 0x9eafb1, 0, 0.72, 0, { metalness: 0.48, roughness: 0.4 });
      addBox(group, 1.22, 0.54, 0.6, 0xe1e6df, 0, 1.04, -0.04, { roughness: 0.85 });
      for (var wheel = -1; wheel <= 1; wheel += 2) {
        addMesh(group, getGeometry('poi-cart-wheel', function () { return new T.CylinderGeometry(0.12, 0.12, 0.12, 8); }), getMaterial(0x28353a), wheel * 0.58, 0.31, 0.27).rotation.x = Math.PI / 2;
        addBox(group, 0.1, 1.28, 0.1, 0x91a4a6, wheel * 0.62, 1.03, -0.08, { metalness: 0.42 });
      }
      addBox(group, 0.38, 0.36, 0.08, 0xff4d6d, 0, 1.08, 0.32, { emissive: 0x681d24, emissiveIntensity: 0.32 });
      addBox(group, 0.1, 0.25, 0.09, 0xffffff, 0, 1.08, 0.38, { castShadow: false });
      addBox(group, 0.25, 0.09, 0.09, 0xffffff, 0, 1.08, 0.38, { castShadow: false });
    } else if (poi.type === 'locker') {
      addBox(group, 1.12, 1.82, 0.66, 0x536975, 0, 0.94, 0, { metalness: 0.35, roughness: 0.55 });
      addBox(group, 0.46, 1.55, 0.06, 0x718894, -0.27, 1.02, 0.36, { metalness: 0.28 });
      addBox(group, 0.46, 1.55, 0.06, 0x718894, 0.27, 1.02, 0.36, { metalness: 0.28 });
      addBox(group, 0.045, 0.38, 0.08, 0xe4cf88, 0.06, 1.06, 0.42, { metalness: 0.55 });
      for (var vent = 0; vent < 3; vent++) addBox(group, 0.28, 0.045, 0.07, 0x303c43, 0, 1.52 - vent * 0.12, 0.41, { castShadow: false });
    } else if (poi.type === 'terminal') {
      addBox(group, 1.35, 0.2, 0.84, 0x57636a, 0, 0.76, 0, { metalness: 0.32 });
      addBox(group, 0.72, 0.76, 0.16, 0x303a45, 0, 1.3, -0.12, { metalness: 0.25, roughness: 0.38 });
      addBox(group, 0.6, 0.52, 0.05, 0x54e0c3, 0, 1.34, -0.02, { emissive: 0x1e776a, emissiveIntensity: 0.58, castShadow: false });
      addBox(group, 0.62, 0.07, 0.4, 0x262b32, 0, 0.94, 0.18, { roughness: 0.45 });
      addBox(group, 0.12, 0.24, 0.12, 0xb7c0c1, 0, 0.98, -0.12, { metalness: 0.4 });
    } else {
      addBox(group, 1.25, 0.9, 0.92, 0x785b42, 0, 0.54, 0, { roughness: 0.78 });
      addBox(group, 1.31, 0.13, 0.98, 0x98724d, 0, 1.04, 0, { roughness: 0.72 });
      addBox(group, 0.7, 0.08, 0.08, 0xffd94d, 0, 0.72, 0.48, { metalness: 0.62, emissive: 0x513809, emissiveIntensity: 0.2 });
      addBox(group, 0.3, 0.08, 0.05, 0x34373a, 0, 0.72, 0.54, { castShadow: false });
    }
    var crestGroup=new T.Group(); crestGroup.position.set(0,1.75,0.48); group.add(crestGroup);
    var crest=addMesh(crestGroup,getGeometry(sigil.id,sigil.geometry),getMaterial(sigil.color,{emissive:sigil.color,emissiveIntensity:0.52,metalness:0.18}),0,0,0,false);
    crest.scale.setScalar(0.82);
    if(level===0) addBox(crestGroup,0.38,0.11,0.09,0xff4d6d,0,0,0.02,{emissive:0xff4d6d,emissiveIntensity:0.52,castShadow:false});
    addMesh(group,getGeometry('poi-marker',function(){return new T.TorusGeometry(0.45,0.055,5,18);}),getMaterial(glow,{emissive:theme.accent,emissiveIntensity:0.72}),0,2.2,0,false).rotation.x=Math.PI/2;
    return group;
  }
  function syncPois(game, time) {
    var levelIndex = (game && game.environmentIdx != null) ? game.environmentIdx : (game && game.levelIdx != null) ? game.levelIdx : 0;
    syncMap(poiNodes, pois, (game.explorationPOIs || []).filter(function (poi) { return !poi.used; }), function (poi) { return createPoiNode(poi, levelIndex); },
      function (poi) { return { x: poi.x * 0.1, y: 0, z: (poi.laneZ || 0) * 0.1 }; },
      function (node, poi) { node.children[node.children.length - 1].rotation.z = time * 0.7; node.userData.used = poi.used; });
  }
  function syncActorsAndObjects(game, time) {
    syncActors(game);
    syncProjectiles(game);
    syncPickups(game, time);
    syncEffects(game);
    syncObstacles(game);
    syncVases(game, time);
    syncPois(game, time);
    var liveOil = new Set(game.oilPools || []);
    oilNodes.forEach(function (mesh, oil) {
      if (!liveOil.has(oil)) { world.remove(mesh); oilNodes.delete(oil); }
    });
    (game.oilPools || []).forEach(function (oil) {
      var mesh = oilNodes.get(oil);
      if (!mesh) {
        mesh = new window.THREE.Mesh(getGeometry('oil-puddle', function () { return new window.THREE.CircleGeometry(0.8, 12); }), getMaterial(0xffac38, { transparent: true, opacity: 0.55, emissive: 0x623100, emissiveIntensity: 0.45 }));
        mesh.rotation.x = -Math.PI / 2; mesh.position.y = 0.015; world.add(mesh); oilNodes.set(oil, mesh);
      }
      mesh.position.x = oil.x * 0.1; mesh.position.z = (oil.laneZ || 0) * 0.1;
      mesh.scale.setScalar(Math.max(0.2, Math.min(1, oil.life / 2)));
    });
  }
  function cameraFollow(game, dt) {
    var p = game.player;
    if (!p) return;
    var dir = p.dir || 1;
    var px = (p.x || 0) * 0.1;
    var pz = (p.laneZ || 0) * 0.1;
    var py = Math.max(0.08, (640 - (p.y == null ? 640 : p.y)) * 0.04);
    var zoom = 1 + (game.zoomKick > 0 ? Math.min(0.08, game.zoomKick * 0.05) : 0);

    // FINISHER CINEMATOGRAFICA: freeze frame e camera ravvicinata dinamica a 360° sul boss abbattuto
    if (game.finisherT > 0 && game.finisherBoss) {
      var fb = game.finisherBoss;
      var fbx = (fb.x || 0) * 0.1, fbz = (fb.laneZ || 0) * 0.1;
      var fprogress = 1 - (game.finisherT / (game.finisherMax || 2.2));
      var fAngle = fprogress * Math.PI * 1.5;
      var fCam = new window.THREE.Vector3(
        fbx + Math.cos(fAngle) * 3.8,
        1.8 + Math.sin(fprogress * Math.PI) * 0.8,
        fbz + Math.sin(fAngle) * 3.8
      );
      var fAim = new window.THREE.Vector3(fbx, 1.4, fbz);
      cameraPositionEase.lerp(fCam, 0.18);
      cameraAimEase.lerp(fAim, 0.22);
      camera.position.copy(cameraPositionEase);
      camera.lookAt(cameraAimEase);
      accentLight.position.set(fbx, 4.0, fbz);
      return;
    }

    /* Telecamera console third-person alle spalle: segue fedelmente il personaggio da dietro
       con leggero offset over-the-shoulder, altezza dinamica e tracking fluido. */
    var behindDist = 5.2 / zoom;
    var camX = px - dir * behindDist + (game.cameraAimX || 0) * 0.015;
    // Evitiamo che la telecamera attraversi il muro sinistro dell'arena (x < -6.5)
    if (camX < -5.0) camX = -5.0;
    if (camX > 101.5) camX = 101.5;

    var targetCamera = new window.THREE.Vector3(
      camX,
      3.4 / zoom + py * 0.35 + (game.cameraAimY || 0) * 0.009,
      pz + 4.2 / zoom
    );

    if (game.screenShake > 0) {
      var shake = Math.min(0.35, game.screenShake * 0.012);
      targetCamera.x += (Math.random() - 0.5) * shake;
      targetCamera.y += (Math.random() - 0.5) * shake;
      targetCamera.z += (Math.random() - 0.5) * shake;
    }

    var aim = new window.THREE.Vector3(
      px + dir * 3.6 + (game.cameraAimX || 0) * 0.02,
      py + 1.45 + (game.cameraAimY || 0) * 0.01,
      pz + (p.vz ? p.vz * 0.008 : 0)
    );

    var blend = 1 - Math.exp(-5.2 * Math.min(dt, 0.05));
    if (!cameraInitialized) {
      cameraPositionEase.copy(targetCamera);
      cameraAimEase.copy(aim);
      cameraInitialized = true;
    } else {
      cameraPositionEase.lerp(targetCamera, blend);
      cameraAimEase.lerp(aim, blend);
    }
    camera.position.copy(cameraPositionEase);
    camera.lookAt(cameraAimEase);
    accentLight.position.set(px + dir * 1.5, 5.2, pz - 1.2);
    rimLight.position.set(px - dir * 2.8, 3.8, pz - 3.2);
  }
  function isActive() {
    if (!ready || failed || !settingEnabled()) return false;
    var ui = window.UI, game = ui && ui.getGame ? ui.getGame() : null;
    return !!(ui && ui.getScreen && ui.getScreen() === 'game' && game && game.player && !game.paused && !game.over);
  }
  function shouldRender(game) {
    if (!ready || failed || !settingEnabled()) return false;
    var ui = window.UI, screen = ui && ui.getScreen ? ui.getScreen() : '';
    if (screen === 'menu' || screen === 'mode' || screen === 'custom' || screen === 'settings' || screen === 'title') return true;
    return !!(game && game.player && (screen === 'game' || screen === 'pause' || screen === 'results'));
  }
  function frame(now) {
    if (disposed || failed) return;
    RAF(frame);
    if (!ready || document.hidden) return;
    var ui = window.UI;
    var game = ui && ui.getGame ? ui.getGame() : null;
    var visible = shouldRender(game);
    if (canvas) canvas.style.display = visible ? 'block' : 'none';
    if (!visible) { lastFrame = now; return; }
    try {
      var level = (game && game.environmentIdx != null) ? game.environmentIdx : (game && game.levelIdx != null) ? game.levelIdx : 0;
      var quality = settingQuality();
      if (level !== currentLevel || quality !== currentQuality) {
        resize();
        buildWorld(level);
        currentQuality = quality;
      }
      var dt = lastFrame ? Math.max(0.001, Math.min(0.05, (now - lastFrame) / 1000)) : 1 / 60;
      lastFrame = now;
      renderer.shadowMap.enabled = quality === 'high';
      scene.fog.density = quality === 'low' ? 0.0032 : quality === 'med' ? 0.0042 : 0.0052;
      
      var uiScreen = ui && ui.getScreen ? ui.getScreen() : '';
      if(uiScreen === 'menu' || uiScreen === 'mode' || uiScreen === 'custom' || uiScreen === 'title') {
        // Telecamera 3D dinamica psycho cartoon per il menu che orbita sullo skyline della metropoli
        var menuTime = now / 1000;
        camera.position.set(48 + Math.sin(menuTime * 0.45) * 14, 5.5 + Math.cos(menuTime * 0.6) * 1.5, 22 + Math.sin(menuTime * 0.3) * 6);
        camera.lookAt(48 + Math.sin(menuTime * 0.2) * 8, 2.5, 0);
        animateLandmarks(menuTime);
      } else if(game && game.player) {
        syncActorsAndObjects(game, now / 1000);
        animateLandmarks(now / 1000);
        cameraFollow(game, dt);
      }
      renderer.render(scene, camera);
    } catch (error) {
      failRenderer(error);
    }
  }
  function clearResources() {
    if (disposed) return;
    disposed = true;
    removeRendererListeners();
    if (ready) {
      try { clearWorld(); } catch (cleanupError) {}
      try { if (renderer) renderer.dispose(); } catch (disposeError) {}
    }
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null; renderer = null; scene = null; camera = null;
    ready = false;
    currentQuality = null;
    window.THREE3D.ready = false;
  }

  window.THREE3D = {
    ready: false,
    error: null,
    isActive: isActive,
    shouldRender: shouldRender,
    dispose: clearResources
  };

  function waitForThree(startedAt) {
    if (disposed || failed || ready) return;
    if (window.THREE && window.THREE.WebGLRenderer) {
      bootRenderer();
      if (ready) RAF(frame);
      return;
    }
    if (Date.now() - startedAt > THREE_URL_FALLBACK_MS) {
      failed = true;
      window.THREE3D.error = 'Three.js non disponibile: fallback Canvas2D';
      window.THREE3D.ready = false;
      if (window.console && console.info) console.info('[UNHINGED 3D] Three.js non raggiungibile; il gioco resta in Canvas2D.');
      return;
    }
    setTimeout(function () { waitForThree(startedAt); }, 120);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { waitForThree(Date.now()); });
  else waitForThree(Date.now());
})(window, document);
