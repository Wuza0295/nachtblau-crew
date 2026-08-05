/* Kartenbau aus Primitiven: Stadt, Bunker, Wüste */
window.BH = window.BH || {};

BH.Maps = (function () {

  function makeBox(group, obstacles, x, z, w, h, d, color, opts) {
    opts = opts || {};
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color, roughness: opts.roughness !== undefined ? opts.roughness : 0.82,
      metalness: opts.metalness || 0.08,
      emissive: opts.emissive || 0x000000,
      emissiveIntensity: opts.emissiveIntensity || 0,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2 + (opts.yOff || 0), z);
    if (opts.noShadow) mesh.userData.bhNoShadow = true;
    group.add(mesh);
    if (!opts.noCollide) {
      obstacles.push(new THREE.Box3(
        new THREE.Vector3(x - w / 2, opts.yOff || 0, z - d / 2),
        new THREE.Vector3(x + w / 2, h + (opts.yOff || 0), z + d / 2)
      ));
    }
    return mesh;
  }

  function makeGround(group, size, color) {
    const geo = new THREE.PlaneGeometry(size, size, 12, 12);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.94, metalness: 0.04 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.userData.bhGround = true;
    group.add(mesh);
    return mesh;
  }

  function makeBorder(group, obstacles, half, height, color) {
    makeBox(group, obstacles, 0, -half, half * 2 + 2, height, 1.5, color);
    makeBox(group, obstacles, 0, half, half * 2 + 2, height, 1.5, color);
    makeBox(group, obstacles, -half, 0, 1.5, height, half * 2 + 2, color);
    makeBox(group, obstacles, half, 0, 1.5, height, half * 2 + 2, color);
  }

  function makeNeonStrip(group, x, y, z, w, h, color) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, 0.08),
      new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.92, roughness: 0.3, metalness: 0.2,
      })
    );
    m.position.set(x, y, z);
    group.add(m);
  }

  function makeSandbagRow(group, obstacles, x, z, len, rotY) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.92, metalness: 0.05 });
    const row = new THREE.Group();
    row.position.set(x, 0, z);
    row.rotation.y = rotY || 0;
    for (let i = 0; i < len; i++) {
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.38, 0.55), mat);
      bag.position.set((i - (len - 1) / 2) * 0.95, 0.19, (i % 2) * 0.08);
      row.add(bag);
    }
    group.add(row);
  }

  function makeStreetLamp(group, x, z, color) {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a5058, roughness: 0.55, metalness: 0.45 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.2, 6), poleMat);
    pole.position.set(x, 2.6, z);
    group.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.4), poleMat);
    arm.position.set(x + 0.5, 5.0, z);
    group.add(arm);
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.12, 0.55),
      new THREE.MeshStandardMaterial({
        color: color || 0xffdd99, emissive: color || 0xffaa44, emissiveIntensity: 0.85,
        roughness: 0.35, metalness: 0.2,
      })
    );
    lamp.position.set(x + 1.0, 4.92, z);
    group.add(lamp);
  }

  /** Prüft ob ein Punkt (Fuß-Position + Radius) in einem Hindernis liegt */
  function isSpawnBlocked(x, z, obstacles, radius, footY) {
    radius = radius || 0.42;
    footY = footY != null ? footY : 0;
    const bodyTop = footY + 1.75;
    for (const b of obstacles) {
      if (!b || !b.min) continue;
      if (x + radius > b.min.x && x - radius < b.max.x &&
          z + radius > b.min.z && z - radius < b.max.z &&
          bodyTop > b.min.y && footY < b.max.y) {
        return true;
      }
    }
    return false;
  }

  /** Findet freien Punkt in der Nähe — vermeidet Spawns in Map-Objekten */
  function resolveClearSpawn(x, z, obstacles, bounds) {
    if (!isSpawnBlocked(x, z, obstacles)) return new THREE.Vector3(x, 0, z);
    for (let r = 2; r <= 28; r += 2) {
      for (let a = 0; a < 16; a++) {
        const ang = (a / 16) * Math.PI * 2;
        const nx = x + Math.cos(ang) * r;
        const nz = z + Math.sin(ang) * r;
        if (bounds) {
          if (nx < bounds.minX + 1 || nx > bounds.maxX - 1 ||
              nz < bounds.minZ + 1 || nz > bounds.maxZ - 1) continue;
        }
        if (!isSpawnBlocked(nx, nz, obstacles)) return new THREE.Vector3(nx, 0, nz);
      }
    }
    return new THREE.Vector3(x, 0, z);
  }

  function sanitizeSpawnList(list, obstacles, bounds) {
    if (!list || !list.length) return list || [];
    return list.map(sp => {
      const v = sp.isVector3 ? sp : new THREE.Vector3(sp.x || sp[0], 0, sp.z || sp[1]);
      return resolveClearSpawn(v.x, v.z, obstacles, bounds);
    });
  }

  function sanitizeMapSpawns(mapData) {
    if (!mapData || !mapData.obstacles) return mapData;
    const obs = mapData.obstacles;
    const b = mapData.bounds;
    if (mapData.spawnsA) mapData.spawnsA = sanitizeSpawnList(mapData.spawnsA, obs, b);
    if (mapData.spawnsB) mapData.spawnsB = sanitizeSpawnList(mapData.spawnsB, obs, b);
    if (mapData.spawnsFFA) mapData.spawnsFFA = sanitizeSpawnList(mapData.spawnsFFA, obs, b);
    if (mapData.campSpawns) mapData.campSpawns = sanitizeSpawnList(mapData.campSpawns, obs, b);
    if (mapData.reinforceSpawns) mapData.reinforceSpawns = sanitizeSpawnList(mapData.reinforceSpawns, obs, b);
    return mapData;
  }

  function pickSpawn(mapData, list, idx, jitter) {
    if (!list || !list.length) return new THREE.Vector3(0, 0, 0);
    const base = list[idx % list.length];
    let x = base.x, z = base.z;
    if (jitter) {
      x += (Math.random() - 0.5) * jitter * 2;
      z += (Math.random() - 0.5) * jitter * 2;
    }
    const obs = mapData && mapData.obstacles;
    const bounds = mapData && mapData.bounds;
    return resolveClearSpawn(x, z, obs || [], bounds);
  }

  function setupLights(scene, hemiSky, hemiGround, dirColor, dirIntensity, dirPos) {
    const hemi = new THREE.HemisphereLight(hemiSky, hemiGround, 0.92);
    scene.add(hemi);
    scene._bhHemiLight = hemi;
    scene._bhHemiBase = 0.92;

    const amb = new THREE.AmbientLight(0x3d4654, 0.32);
    scene.add(amb);
    scene._bhAmbLight = amb;
    scene._bhAmbBase = 0.32;

    const dir = new THREE.DirectionalLight(dirColor, dirIntensity);
    dir.position.set(dirPos.x, dirPos.y, dirPos.z);
    dir.target.position.set(0, 0, 0);
    scene.add(dir.target);
    scene.add(dir);
    scene._bhDirLight = dir;
    scene._bhDirBase = dirIntensity;

    const rim = new THREE.DirectionalLight(0x6688bb, 0.22);
    rim.position.set(-dirPos.x * 0.35, dirPos.y * 0.45, -dirPos.z * 0.55);
    scene.add(rim);
    scene._bhRimLight = rim;
    scene._bhRimBase = 0.22;
  }

  const SKY_PRESETS = {
    harbor:     { top: 0x3a5570, bottom: 0x0e1520 },
    industrial: { top: 0x5a4030, bottom: 0x120a06 },
    arctic:     { top: 0xb8d8f0, bottom: 0x607888 },
    ruins:      { top: 0x6a6560, bottom: 0x1a1816 },
    tower:      { top: 0x252d38, bottom: 0x080a0e },
    city:       { top: 0x384560, bottom: 0x0e1118 },
    bunker:     { top: 0x1a2818, bottom: 0x060806 },
    desert:     { top: 0xe8b878, bottom: 0x906038 },
  };

  function skyColorsForMap(mapId, variant) {
    const preset = SKY_PRESETS[mapId] || SKY_PRESETS.city;
    const top = new THREE.Color(preset.top);
    const bottom = new THREE.Color(preset.bottom);
    if (variant === "night") {
      top.multiplyScalar(0.22);
      bottom.multiplyScalar(0.12);
    }
    if (variant === "rain" && mapId === "arctic") {
      top.lerp(new THREE.Color(0x8898a8), 0.35);
      bottom.lerp(new THREE.Color(0x506068), 0.35);
    }
    return { top, bottom };
  }

  function addSkyGradient(scene, topColor, bottomColor) {
    if (scene._bhSky) {
      scene.remove(scene._bhSky);
      if (scene._bhSky.geometry) scene._bhSky.geometry.dispose();
      if (scene._bhSky.material) scene._bhSky.material.dispose();
    }
    const top = topColor instanceof THREE.Color ? topColor : new THREE.Color(topColor);
    const bottom = bottomColor instanceof THREE.Color ? bottomColor : new THREE.Color(bottomColor);
    const geo = new THREE.SphereGeometry(400, 24, 12);
    const colors = [];
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = Math.pow(Math.max(0, Math.min(1, (y / 400 + 1) * 0.5)), 0.72);
      const c = bottom.clone().lerp(top, t);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false,
    });
    const sky = new THREE.Mesh(geo, mat);
    sky.userData.bhNoShadow = true;
    sky.frustumCulled = false;
    sky.renderOrder = -10;
    scene.add(sky);
    scene._bhSky = sky;
    scene.background = bottom.clone();
  }

  function applySky(scene, mapId, variant) {
    const colors = skyColorsForMap(mapId, variant);
    addSkyGradient(scene, colors.top, colors.bottom);
  }

  function finalizeMapScene(scene, mapId, variant) {
    applySky(scene, mapId, variant);
    if (variant) applyVariant(scene, mapId, variant);
    if (BH.Graphics) {
      BH.Graphics.applyScene(scene);
      BH.Graphics.applySceneLighting(scene);
      BH.Graphics.applySceneMeshes(scene);
    }
  }

  /* =================== STADT (TDM / FFA) =================== */
  function buildCity(scene) {
    const group = new THREE.Group();
    const obstacles = [];
    const half = 58;

    scene.background = new THREE.Color(0x1a1f2c);
    scene.fog = new THREE.Fog(0x1a1f2c, 30, 150);
    setupLights(scene, 0x55617a, 0x1c1c20, 0xffb066, 0.85, { x: 40, y: 60, z: 20 });

    makeGround(group, half * 2 + 4, 0x33363b);
    makeBorder(group, obstacles, half, 14, 0x22262c);

    // Gebäuderaster mit Straßen
    const palette = [0x4a4f57, 0x565049, 0x3e444e, 0x504a52, 0x45504a];
    const grid = [-40, -20, 0, 20, 40];
    let i = 0;
    for (const gx of grid) {
      for (const gz of grid) {
        if (Math.abs(gx) < 5 && Math.abs(gz) < 5) continue; // freier Platz in der Mitte
        if ((gx === -20 && gz === 20) || (gx === 20 && gz === -20)) continue; // offene Höfe
        const w = 9 + ((i * 37) % 5);
        const d = 9 + ((i * 53) % 5);
        const h = 6 + ((i * 71) % 14);
        makeBox(group, obstacles, gx, gz, w, h, d, palette[i % palette.length]);
        i++;
      }
    }
    // Zentrum: zerstörtes Denkmal + Deckung
    makeBox(group, obstacles, 0, 0, 3, 7, 3, 0x5a5a60);
    const crates = [[-8, 4], [7, -6], [12, 10], [-12, -9], [4, 14], [-5, -16], [16, -2], [-17, 6]];
    for (const [cx, cz] of crates) makeBox(group, obstacles, cx, cz, 2, 1.6, 2, 0x6b5a3e);
    // Wracks auf den Straßen
    makeBox(group, obstacles, -30, 10, 4.5, 1.8, 2.2, 0x37404a, { metalness: 0.4, roughness: 0.5 });
    makeBox(group, obstacles, 30, -8, 4.5, 1.8, 2.2, 0x4a3a37, { metalness: 0.4, roughness: 0.5 });
    makeBox(group, obstacles, 10, 30, 2.2, 1.8, 4.5, 0x3a4a40, { metalness: 0.4, roughness: 0.5 });

    scene.add(group);
    finalizeMapScene(scene, "city", null);
    return {
      solids: group, obstacles,
      bounds: { minX: -half + 1.6, maxX: half - 1.6, minZ: -half + 1.6, maxZ: half - 1.6 },
      spawnsA: [[-50, -50], [-50, -30], [-50, -10], [-50, 10], [-50, 30], [-50, 50]].map(p => new THREE.Vector3(p[0], 0, p[1])),
      spawnsB: [[50, -50], [50, -30], [50, -10], [50, 10], [50, 30], [50, 50]].map(p => new THREE.Vector3(p[0], 0, p[1])),
      spawnsFFA: [[-50, -50], [50, 50], [-50, 50], [50, -50], [0, -52], [0, 52], [-52, 0], [52, 0], [10, 10], [-10, -12]].map(p => new THREE.Vector3(p[0], 0, p[1])),
    };
  }

  /* =================== BUNKER 7 (ZOMBIES) =================== */
  function buildBunker(scene) {
    const group = new THREE.Group();
    const obstacles = [];
    const half = 30;

    scene.background = new THREE.Color(0x0a0f0a);
    scene.fog = new THREE.Fog(0x0a0f0a, 8, 70);
    setupLights(scene, 0x3a4d3a, 0x101410, 0x88ff99, 0.35, { x: 10, y: 40, z: 10 });

    // flackernde Notbeleuchtung
    const p1 = new THREE.PointLight(0xff8844, 1.1, 38); p1.position.set(0, 6, 0); scene.add(p1);
    const p2 = new THREE.PointLight(0x66ff88, 0.7, 30); p2.position.set(-18, 5, -18); scene.add(p2);
    const p3 = new THREE.PointLight(0x66aaff, 0.7, 30); p3.position.set(18, 5, 18); scene.add(p3);

    makeGround(group, half * 2 + 4, 0x23291f);
    makeBorder(group, obstacles, half, 10, 0x2c3328);

    // Innere Struktur: Räume und Korridore
    makeBox(group, obstacles, -12, -12, 10, 4.5, 1.2, 0x39402f); // Wandsegmente
    makeBox(group, obstacles, 12, 12, 10, 4.5, 1.2, 0x39402f);
    makeBox(group, obstacles, -12, 12, 1.2, 4.5, 10, 0x39402f);
    makeBox(group, obstacles, 12, -12, 1.2, 4.5, 10, 0x39402f);
    makeBox(group, obstacles, 0, 0, 4, 3, 4, 0x444a38);       // Zentralblock
    const cover = [[-6, 6], [6, -6], [-20, 0], [20, 0], [0, -20], [0, 20]];
    for (const [cx, cz] of cover) makeBox(group, obstacles, cx, cz, 2, 1.5, 2, 0x55543c);

    // Munitionskiste (kaufbar)
    const ammoBox = makeBox(group, obstacles, -24, 24, 2.4, 1.3, 1.6, 0x274a27, { emissive: 0x113311, emissiveIntensity: 0.6 });
    // Mystery-Box
    const mysteryBox = makeBox(group, obstacles, 24, -24, 2.4, 1.3, 1.6, 0x4a3a10, { emissive: 0x664400, emissiveIntensity: 0.7 });

    scene.add(group);
    finalizeMapScene(scene, "bunker", null);
    return {
      solids: group, obstacles,
      bounds: { minX: -half + 1.6, maxX: half - 1.6, minZ: -half + 1.6, maxZ: half - 1.6 },
      playerSpawn: new THREE.Vector3(0, 0, 10),
      zombieGates: [[-27, -27], [27, 27], [-27, 27], [27, -27], [0, -27], [-27, 0]].map(p => new THREE.Vector3(p[0], 0, p[1])),
      ammoStation: { pos: new THREE.Vector3(-24, 0, 24), mesh: ammoBox },
      mysteryStation: { pos: new THREE.Vector3(24, 0, -24), mesh: mysteryBox },
      flicker: [p1, p2, p3],
      easterEgg: new THREE.Vector3(-27, 0, 27),
    };
  }

  /* =================== WÜSTE ROTGLUT (KAMPAGNE) =================== */
  function buildDesert(scene) {
    const group = new THREE.Group();
    const obstacles = [];
    const half = 70;

    scene.background = new THREE.Color(0xc98d52);
    scene.fog = new THREE.Fog(0xc98d52, 50, 220);
    setupLights(scene, 0xffe0b0, 0x8a6a40, 0xffd9a0, 1.1, { x: -50, y: 70, z: 30 });

    makeGround(group, half * 2 + 4, 0xb5915c);
    makeBorder(group, obstacles, half, 12, 0x9c7c4c);

    // Felsen verstreut
    const rocks = [[-40, 20, 5], [-25, -30, 7], [15, 35, 6], [-50, -10, 4], [35, -45, 5], [-10, 45, 4], [50, 20, 6], [-35, 50, 5]];
    for (const [rx, rz, rs] of rocks) makeBox(group, obstacles, rx, rz, rs, rs * 0.8, rs, 0x8a7050, { roughness: 1 });

    // Feindliches Lager (Norden, z negativ)
    const campZ = -45;
    makeBox(group, obstacles, -14, campZ, 1.2, 4, 26, 0x7a6a4a);   // Lagermauern
    makeBox(group, obstacles, 14, campZ, 1.2, 4, 26, 0x7a6a4a);
    makeBox(group, obstacles, 0, campZ - 13, 26, 4, 1.2, 0x7a6a4a);
    makeBox(group, obstacles, -8, campZ - 13 + 0.1, 8, 4, 1.2, 0x7a6a4a); // Tor offen lassen rechts
    makeBox(group, obstacles, -6, campZ - 5, 6, 3.5, 4, 0x6a5a3a);  // Baracken
    makeBox(group, obstacles, 7, campZ + 4, 5, 3, 4, 0x6a5a3a);
    makeBox(group, obstacles, 0, campZ - 9, 2, 5.5, 2, 0x5a4a30);   // Wachturm
    const camCrates = [[-9, campZ + 8], [3, campZ - 2], [10, campZ - 8]];
    for (const [cx, cz] of camCrates) makeBox(group, obstacles, cx, cz, 2, 1.6, 2, 0x6b5a3e);

    // Aussichtspunkt (Hügel, Süden)
    makeBox(group, obstacles, 40, 52, 10, 3, 10, 0x9a8055);

    // Deckung auf dem Weg
    const wayCover = [[20, 20], [5, 5], [-15, 10], [25, -10], [-5, -20], [12, -28]];
    for (const [cx, cz] of wayCover) makeBox(group, obstacles, cx, cz, 2.4, 1.5, 2.4, 0x8a7050);

    scene.add(group);
    finalizeMapScene(scene, "desert", null);
    return {
      solids: group, obstacles,
      bounds: { minX: -half + 1.6, maxX: half - 1.6, minZ: -half + 1.6, maxZ: half - 1.6 },
      playerSpawn: new THREE.Vector3(55, 0, 60),
      lookout: new THREE.Vector3(40, 3, 52),
      campCenter: new THREE.Vector3(0, 0, campZ),
      campSpawns: [[-6, campZ + 2], [7, campZ - 4], [0, campZ - 10], [-10, campZ - 8], [10, campZ + 8], [3, campZ + 10], [-12, campZ], [12, campZ]].map(p => new THREE.Vector3(p[0], 0, p[1])),
      defendPoint: new THREE.Vector3(0, 0, campZ),
      reinforceSpawns: [[-60, -20], [60, -20], [0, 20], [-40, -55], [40, -55]].map(p => new THREE.Vector3(p[0], 0, p[1])),
      evacPoint: new THREE.Vector3(60, 0, 35),
    };
  }

  /** Standard-Team-Spawns für große PvP-Karten — an den Rändern, nicht in der Mitte */
  function teamSpawns(half) {
    const e = half - 10;
    const pts = (signX, signZ) => [
      [signX * e, signZ * (e - 6)],
      [signX * e, signZ * (e * 0.55)],
      [signX * e, 0],
      [signX * (e - 6), signZ * e],
      [signX * (e - 6), signZ * (e * 0.45)],
      [signX * e, signZ * (-e * 0.55)],
    ];
    return {
      spawnsA: pts(-1, -1).concat(pts(-1, 1)).map(p => new THREE.Vector3(p[0], 0, p[1])),
      spawnsB: pts(1, 1).concat(pts(1, -1)).map(p => new THREE.Vector3(p[0], 0, p[1])),
      spawnsFFA: [
        [-e, -e], [e, e], [-e, e], [e, -e], [0, -e + 4], [0, e - 4],
        [-e + 4, 0], [e - 4, 0], [14, 14], [-14, -14], [-10, 22], [12, -18],
      ].map(p => new THREE.Vector3(p[0], 0, p[1])),
    };
  }

  function makeContainerStack(group, obstacles, x, z, levels, color, opts) {
    opts = opts || {};
    for (let lv = 0; lv < levels; lv++) {
      makeBox(group, obstacles, x, z, opts.w || 6, 2.6, opts.d || 2.5, color, {
        metalness: 0.38, roughness: 0.55, yOff: lv * 2.6,
      });
    }
  }

  /* =================== MILITÄRHAFEN DELTA (Saison 1) =================== */
  function buildHarbor(scene) {
    const group = new THREE.Group();
    const obstacles = [];
    const half = 54;

    scene.background = new THREE.Color(0x142030);
    scene.fog = new THREE.Fog(0x1a2838, 28, 145);
    setupLights(scene, 0x7799bb, 0x141c28, 0xffc878, 0.75, { x: 25, y: 55, z: -15 });

    // Hafenbeleuchtung
    const dockLight1 = new THREE.PointLight(0xffaa55, 0.9, 42);
    dockLight1.position.set(-22, 9, -20);
    scene.add(dockLight1);
    const dockLight2 = new THREE.PointLight(0x88bbff, 0.55, 38);
    dockLight2.position.set(28, 7, -18);
    scene.add(dockLight2);
    const yardLight = new THREE.PointLight(0xffcc88, 0.45, 50);
    yardLight.position.set(0, 12, 8);
    scene.add(yardLight);

    // Asphalt / Kai
    makeGround(group, half * 2 + 4, 0x3a4248);
    makeBorder(group, obstacles, half, 12, 0x2a3238);

    // Wasserbecken (Norden, nicht kollidierend)
    makeBox(group, [], 0, -38, half * 2 + 2, 0.15, 34, 0x1a3548, {
      noCollide: true, yOff: -0.08, roughness: 0.22, metalness: 0.42, noShadow: true,
    });
    makeBox(group, [], 0, -52, half * 2 + 2, 0.12, 8, 0x152a38, {
      noCollide: true, yOff: -0.1, roughness: 0.18, metalness: 0.45, noShadow: true,
    });

    // Hauptkai & Pier
    makeBox(group, obstacles, 0, -22, 72, 0.55, 10, 0x4a5058, { roughness: 0.95 });
    makeBox(group, obstacles, -32, -22, 8, 0.55, 10, 0x525860, { roughness: 0.95 });
    makeBox(group, obstacles, 32, -22, 8, 0.55, 10, 0x525860, { roughness: 0.95 });
    // Pier-Ausleger
    makeBox(group, obstacles, 0, -30, 14, 0.45, 22, 0x4a5058, { roughness: 0.95 });
    makeBox(group, obstacles, -18, -28, 10, 0.45, 14, 0x4a5058, { roughness: 0.95 });

    const contColors = [0x8b3a2a, 0x2e5a3a, 0x3a4a62, 0x6a5a30, 0x4a3a52, 0x3a5248];

    // —— Westliches Lager (Team-A-Seite) ——
    makeBox(group, obstacles, -38, 8, 16, 11, 18, 0x4a5058);
    makeBox(group, obstacles, -38, 8, 16, 3, 18, 0x3a4248, { yOff: 11 }); // Dach
    makeBox(group, obstacles, -46, 8, 4, 8, 14, 0x505860); // Anbau
    makeBox(group, obstacles, -30, -2, 6, 7, 10, 0x525860);
    // Laderampe
    makeBox(group, obstacles, -32, 16, 8, 1.2, 4, 0x5a6068, { roughness: 0.85 });
    // Container neben Lager
    makeContainerStack(group, obstacles, -48, 22, 2, contColors[0]);
    makeContainerStack(group, obstacles, -48, 14, 1, contColors[2]);
    makeContainerStack(group, obstacles, -48, -6, 2, contColors[4]);
    makeContainerStack(group, obstacles, -42, 28, 1, contColors[1]);
    makeContainerStack(group, obstacles, -42, -12, 2, contColors[3]);

    // —— Östliches Terminal (Team-B-Seite) ——
    makeBox(group, obstacles, 38, -4, 18, 10, 14, 0x505860);
    makeBox(group, obstacles, 38, -4, 18, 2.5, 14, 0x424850, { yOff: 10 });
    makeBox(group, obstacles, 46, 10, 10, 7, 12, 0x4a5058);
    makeBox(group, obstacles, 46, -18, 8, 6, 10, 0x525860);
    // Container-Alleen (3 Gassen)
    for (let row = 0; row < 4; row++) {
      const cx = 22 + row * 7;
      makeContainerStack(group, obstacles, cx, 24, 1 + (row % 2), contColors[row % contColors.length]);
      makeContainerStack(group, obstacles, cx, 12, 2, contColors[(row + 1) % contColors.length]);
      makeContainerStack(group, obstacles, cx, 0, 1, contColors[(row + 2) % contColors.length]);
      makeContainerStack(group, obstacles, cx, -12, 2 + (row % 2), contColors[(row + 3) % contColors.length]);
    }
    makeContainerStack(group, obstacles, 50, 20, 2, contColors[0]);
    makeContainerStack(group, obstacles, 50, 4, 1, contColors[2]);
    makeContainerStack(group, obstacles, 50, -10, 2, contColors[4]);

    // —— Zentrum: Container-Yard & Deckung ——
    // Quer-Reihen mit Kampfgassen
    for (let i = 0; i < 5; i++) {
      const zx = -16 + i * 8;
      makeContainerStack(group, obstacles, zx, 22, 1, contColors[i % contColors.length]);
      makeContainerStack(group, obstacles, zx, 8, 2, contColors[(i + 2) % contColors.length]);
      if (i !== 2) makeContainerStack(group, obstacles, zx, -6, 1, contColors[(i + 4) % contColors.length]);
    }
    // Mittelinsel – offener Kreuzungsbereich, niedrige Deckung
    const midCover = [[-6, 14, 2.4], [6, 14, 2.4], [-8, 2, 2], [8, 2, 2], [0, 18, 3], [-4, -2, 2.2], [4, -2, 2.2]];
    for (const [cx, cz, cs] of midCover) {
      makeBox(group, obstacles, cx, cz, cs, 1.5, cs, 0x6b5a3e, { roughness: 0.9 });
    }
    // Paletten & Fässer
    const barrels = [[-12, 18], [12, 16], [-14, 4], [14, 6], [2, 12], [-2, -8], [10, -4], [-10, -6]];
    for (const [bx, bz] of barrels) {
      makeBox(group, obstacles, bx, bz, 1.2, 1.4, 1.2, 0x5a5040, { metalness: 0.25 });
    }
    const extraBarrels = [[-24, 6], [-18, -14], [20, 8], [26, -16], [4, 24], [-6, 36], [16, 30], [-30, 24], [34, 14]];
    for (const [bx, bz] of extraBarrels) {
      makeBox(group, obstacles, bx, bz, 1.1, 1.35, 1.1, 0x5a5040, { metalness: 0.28 });
    }
    const extraCrates = [[-22, 20], [22, 18], [0, 6], [-8, -18], [12, -10], [30, 28], [-34, 32]];
    for (const [cx, cz] of extraCrates) {
      makeBox(group, obstacles, cx, cz, 1.4, 0.9, 1.4, 0x6b5a3e, { roughness: 0.92 });
    }
    [[-44, 0], [44, -8], [-10, 40], [18, -40], [0, -8]].forEach(([lx, lz], i) => {
      makeStreetLamp(group, lx, lz, i % 2 ? 0xffcc88 : 0xaaccff);
    });

    // —— Liegeplatz: Frachter „Delta-7“ ——
    makeBox(group, obstacles, -8, -36, 28, 5.5, 9, 0x3a4248, { metalness: 0.45, roughness: 0.55 });
    makeBox(group, obstacles, -8, -36, 24, 4, 7, 0x2a3238, { metalness: 0.5, yOff: 5.5 });
    makeBox(group, obstacles, -8, -42, 8, 6, 6, 0x4a5058, { metalness: 0.4 }); // Bug
    makeBox(group, obstacles, 6, -34, 6, 8, 5, 0x505860); // Brücke
    makeBox(group, obstacles, 6, -34, 4, 3, 4, 0x3a4550, { yOff: 8 });
    // Deck-Container auf Schiff
    makeContainerStack(group, obstacles, -14, -34, 1, contColors[1]);
    makeContainerStack(group, obstacles, -2, -38, 1, contColors[3]);
    makeContainerStack(group, obstacles, 2, -32, 2, contColors[5]);

    // —— Portalkran ——
    const craneZ = -24;
    makeBox(group, obstacles, -10, craneZ, 2.2, 16, 2.2, 0x5a6068, { metalness: 0.55 });
    makeBox(group, obstacles, 10, craneZ, 2.2, 16, 2.2, 0x5a6068, { metalness: 0.55 });
    makeBox(group, obstacles, 0, craneZ, 22, 1.8, 2, 0x6a7078, { metalness: 0.6, yOff: 14 });
    makeBox(group, obstacles, 8, craneZ + 4, 1.8, 1.8, 8, 0x5a6068, { metalness: 0.55, yOff: 13 });
    makeBox(group, obstacles, -9, craneZ, 3, 3, 3, 0x4a5058, { metalness: 0.4, yOff: 12 }); // Kabine
    makeBox(group, obstacles, 0, craneZ - 1, 1.2, 12, 1.2, 0x7a8088, { metalness: 0.65, yOff: 8 }); // Ausleger
    makeBox(group, obstacles, 5, craneZ - 1, 0.8, 0.8, 0.8, 0xff4400, {
      emissive: 0xff4400, emissiveIntensity: 0.6, metalness: 0.2, noCollide: true, yOff: 15.5,
    });

    // —— Süden: Parkplatz & Wracks ——
    makeBox(group, obstacles, -20, 38, 12, 2, 5, 0x3a4048, { metalness: 0.4, roughness: 0.5 });
    makeBox(group, obstacles, 18, 42, 5, 2.2, 4.5, 0x4a3835, { metalness: 0.35 });
    makeBox(group, obstacles, 0, 44, 4.5, 1.8, 2.2, 0x37404a, { metalness: 0.4 });
    makeContainerStack(group, obstacles, -8, 32, 1, contColors[2]);
    makeContainerStack(group, obstacles, 8, 34, 1, contColors[4]);
    makeContainerStack(group, obstacles, -28, 42, 1, contColors[0]);
    makeContainerStack(group, obstacles, 28, 38, 2, contColors[1]);
    // Zäune / Barrieren
    makeBox(group, obstacles, -14, 28, 0.4, 2.5, 12, 0x6a7078, { metalness: 0.5 });
    makeBox(group, obstacles, 14, 26, 0.4, 2.5, 10, 0x6a7078, { metalness: 0.5 });
    makeBox(group, obstacles, 0, 30, 18, 2.5, 0.4, 0x6a7078, { metalness: 0.5 });

    // Leuchtfeuer am Pier
    makeBox(group, obstacles, -36, -20, 1.2, 5, 1.2, 0x5a6068, { metalness: 0.4 });
    makeBox(group, obstacles, -36, -20, 0.6, 0.6, 0.6, 0xffcc44, {
      emissive: 0xffaa22, emissiveIntensity: 0.8, noCollide: true, yOff: 5.2,
    });
    makeBox(group, obstacles, 36, -20, 1.2, 5, 1.2, 0x5a6068, { metalness: 0.4 });
    makeBox(group, obstacles, 36, -20, 0.6, 0.6, 0.6, 0x44aaff, {
      emissive: 0x2288ff, emissiveIntensity: 0.7, noCollide: true, yOff: 5.2,
    });

    scene.add(group);

    return {
      solids: group,
      obstacles,
      bounds: { minX: -half + 1.6, maxX: half - 1.6, minZ: -half + 1.6, maxZ: half - 1.6 },
      spawnsA: [
        [-50, 34], [-50, 26], [-50, -14], [-50, -30], [-44, 38], [-36, -24],
      ].map(p => new THREE.Vector3(p[0], 0, p[1])),
      spawnsB: [
        [50, 32], [50, 22], [50, -14], [50, -30], [44, 38], [32, -26],
      ].map(p => new THREE.Vector3(p[0], 0, p[1])),
      spawnsFFA: [
        [-50, 34], [50, 32], [-50, -30], [50, -30], [0, 18], [0, -10],
        [-18, 6], [24, 4], [0, -26], [-10, -36], [14, 36], [-14, -14],
      ].map(p => new THREE.Vector3(p[0], 0, p[1])),
      harborLights: [dockLight1, dockLight2, yardLight],
    };
  }

  /* =================== ANLAGE SIERRA-7 (Saison 1) =================== */
  function buildIndustrial(scene) {
    const group = new THREE.Group();
    const obstacles = [];
    const half = 56;
    scene.background = new THREE.Color(0x2a1a10);
    scene.fog = new THREE.Fog(0x3a2818, 20, 130);
    setupLights(scene, 0xffaa66, 0x1a1008, 0xff8844, 0.9, { x: -30, y: 55, z: 20 });
    makeGround(group, half * 2 + 4, 0x3a3428);
    makeBorder(group, obstacles, half, 14, 0x2a2418);
    // Fabrikhallen & Tanks
    makeBox(group, obstacles, -30, -20, 16, 12, 14, 0x4a4038);
    makeBox(group, obstacles, 30, 20, 16, 12, 14, 0x4a4038);
    makeBox(group, obstacles, 0, 0, 10, 16, 10, 0x3a3530);
    makeBox(group, obstacles, -20, 25, 5, 8, 5, 0x5a5040, { metalness: 0.4 });
    makeBox(group, obstacles, 20, -25, 5, 8, 5, 0x5a5040, { metalness: 0.4 });
    makeBox(group, obstacles, -40, 10, 4, 6, 4, 0x6a4030, { emissive: 0x331100, emissiveIntensity: 0.3 });
    makeBox(group, obstacles, 40, -10, 4, 6, 4, 0x6a4030, { emissive: 0x331100, emissiveIntensity: 0.3 });
    const pipes = [[-10, -5], [10, 5], [-5, 15], [5, -15], [25, 0], [-25, 0]];
    for (const [px, pz] of pipes) makeBox(group, obstacles, px, pz, 2.5, 2, 2.5, 0x5a5a50, { metalness: 0.6 });
    const extraBarrels = [[-15, 8], [15, -8], [-8, -18], [12, 14], [0, 22], [-32, -8], [28, 12]];
    for (const [bx, bz] of extraBarrels) {
      makeBox(group, obstacles, bx, bz, 1.1, 1.3, 1.1, 0x4a4035, { metalness: 0.35 });
    }
    [[-48, 18], [48, -18], [0, 42], [-20, -38]].forEach(([lx, lz]) => makeStreetLamp(group, lx, lz, 0xff9955));
    scene.add(group);
    return { solids: group, obstacles, bounds: { minX: -half + 1.6, maxX: half - 1.6, minZ: -half + 1.6, maxZ: half - 1.6 }, ...teamSpawns(half) };
  }

  /* =================== AUSPOSTEN FROSTLINIE (Saison 1) =================== */
  function buildArctic(scene) {
    const group = new THREE.Group();
    const obstacles = [];
    const half = 50;
    scene.background = new THREE.Color(0xc8dce8);
    scene.fog = new THREE.Fog(0xc8dce8, 35, 160);
    setupLights(scene, 0xe8f4ff, 0x8090a0, 0xffffff, 1.0, { x: 20, y: 70, z: -30 });
    makeGround(group, half * 2 + 4, 0xd8e8f0);
    makeBorder(group, obstacles, half, 10, 0xa8b8c8);
    // Schneebunker & Wälle
    makeBox(group, obstacles, -20, -20, 12, 5, 8, 0xb0c0d0);
    makeBox(group, obstacles, 20, 20, 12, 5, 8, 0xb0c0d0);
    makeBox(group, obstacles, -20, 20, 8, 4, 12, 0xa8b8c8);
    makeBox(group, obstacles, 20, -20, 8, 4, 12, 0xa8b8c8);
    makeBox(group, obstacles, 0, 0, 6, 4, 6, 0xc0d0e0);
    const snow = [[-35, 0, 5], [35, 0, 4.5], [0, -35, 6], [0, 35, 5], [-15, -8, 4], [15, 8, 5], [-8, 15, 4.5], [8, -15, 5]];
    for (const [sx, sz, ss] of snow) makeBox(group, obstacles, sx, sz, ss, 2.5, ss, 0xd0e0f0);
    makeSandbagRow(group, obstacles, -12, 0, 5, 0);
    makeSandbagRow(group, obstacles, 12, 0, 5, Math.PI);
    makeBox(group, obstacles, -30, 30, 1.2, 1.2, 1.2, 0x4a5868, { metalness: 0.55 });
    makeBox(group, obstacles, 30, -30, 1.2, 1.2, 1.2, 0x4a5868, { metalness: 0.55 });
    [[-42, 22], [42, -22], [-18, -40], [18, 40]].forEach(([lx, lz]) => makeStreetLamp(group, lx, lz, 0xaaccff));
    scene.add(group);
    return { solids: group, obstacles, bounds: { minX: -half + 1.6, maxX: half - 1.6, minZ: -half + 1.6, maxZ: half - 1.6 }, ...teamSpawns(half) };
  }

  function buildRuins(scene) {
    const group = new THREE.Group();
    const obstacles = [];
    const half = 55;
    scene.background = new THREE.Color(0x3a2828);
    scene.fog = new THREE.Fog(0x4a3030, 22, 145);
    setupLights(scene, 0xff8866, 0x201010, 0xff6644, 0.75, { x: -40, y: 45, z: 15 });
    makeGround(group, half * 2 + 4, 0x3a3530);
    makeBorder(group, obstacles, half, 13, 0x2a2520);
    // Eingestürzte Gebäude
    const ruins = [[-30, -25, 10, 5], [-15, 10, 8, 7], [0, -10, 12, 4], [15, 20, 9, 6], [30, -15, 11, 5], [-10, 30, 7, 8], [25, 5, 8, 9]];
    for (const [rx, rz, rw, rh] of ruins) makeBox(group, obstacles, rx, rz, rw, rh, rw * 0.9, 0x4a4540);
    makeBox(group, obstacles, 0, 0, 4, 9, 4, 0x5a5550);
    const rubble = [[-5, -5, 2.2], [5, 5, 2.8], [-20, 0, 2.5], [20, 0, 2.4], [0, 20, 2.6], [0, -22, 2.3], [-35, 15, 2.7], [35, -10, 2.5]];
    for (const [rx, rz, rs] of rubble) makeBox(group, obstacles, rx, rz, rs, 1.2, rs, 0x5a5048);
    makeBox(group, obstacles, -40, 10, 5, 1.5, 2.5, 0x37404a, { metalness: 0.4 });
    makeBox(group, obstacles, 10, -28, 3, 1.8, 3, 0x4a3530);
    makeBox(group, obstacles, -22, -18, 2.5, 1.4, 2.5, 0x4a3530);
    [[-45, 0], [45, 5], [0, 48], [-30, -35]].forEach(([lx, lz]) => makeStreetLamp(group, lx, lz, 0xff7744));
    const ember = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.7, roughness: 0.6 })
    );
    ember.position.set(-5, 0.5, -5);
    group.add(ember);
    scene.add(group);
    return { solids: group, obstacles, bounds: { minX: -half + 1.6, maxX: half - 1.6, minZ: -half + 1.6, maxZ: half - 1.6 }, ...teamSpawns(half) };
  }

  function buildTower(scene) {
    const group = new THREE.Group();
    const obstacles = [];
    const half = 42;
    scene.background = new THREE.Color(0x1a2030);
    scene.fog = new THREE.Fog(0x2a3040, 18, 120);
    setupLights(scene, 0x8899bb, 0x101820, 0xffaa66, 0.65, { x: 15, y: 60, z: -10 });
    makeGround(group, half * 2 + 4, 0x2a3038);
    makeBorder(group, obstacles, half, 16, 0x1a2028);
    makeBox(group, obstacles, 0, 0, 14, 22, 16, 0x3a4550);
    makeBox(group, obstacles, -18, 0, 8, 6, 14, 0x4a5058);
    makeBox(group, obstacles, 18, 0, 8, 6, 14, 0x4a5058);
    makeBox(group, obstacles, -8, -12, 3, 8, 3, 0x505860);
    makeBox(group, obstacles, 8, 12, 3, 8, 3, 0x505860);
    makeBox(group, obstacles, 0, -18, 10, 3, 3, 0x505860);
    makeBox(group, obstacles, 0, 18, 10, 3, 3, 0x505860);
    makeBox(group, obstacles, 0, 0, 3, 1.2, 12, 0x606870, { metalness: 0.3 });
    const cover = [[-12, -8, 2], [12, 8, 2.5], [-6, 14, 2], [6, -14, 2], [-22, 5, 3], [22, -5, 3]];
    for (const [cx, cz, cs] of cover) makeBox(group, obstacles, cx, cz, cs, 1.4, cs, 0x454a52);
    makeNeonStrip(group, 0, 20, 8.05, 9, 0.12, 0x44aaff);
    makeNeonStrip(group, 0, 20, -8.05, 9, 0.12, 0x44aaff);
    makeNeonStrip(group, -7.05, 14, 0, 0.12, 6, 0xff6688);
    makeNeonStrip(group, 7.05, 14, 0, 0.12, 6, 0xff6688);
    makeNeonStrip(group, -18, 10, 4.05, 0.12, 5, 0x66ffaa);
    makeNeonStrip(group, 18, 10, -4.05, 0.12, 5, 0x66ffaa);
    [[-32, 0], [32, 0], [0, -32], [0, 32]].forEach(([lx, lz]) => makeStreetLamp(group, lx, lz, 0xffcc88));
    scene.add(group);
    return { solids: group, obstacles, bounds: { minX: -half + 1.6, maxX: half - 1.6, minZ: -half + 1.6, maxZ: half - 1.6 }, ...teamSpawns(half) };
  }

  function pickVariant(mapId) {
    const d = BH.Progress && BH.Progress.data;
    let idx = d ? (d.mapIndex || 0) : 0;
    if (d && d.mapPickMode === "manual" && d.selectedMapId) {
      const mi = MAP_POOL.findIndex(m => m.id === d.selectedMapId);
      if (mi >= 0) idx = mi;
    }
    if (mapId === "arctic" && idx % 3 === 0) return "rain";
    if (idx % 2 === 1) return "night";
    return "day";
  }

  function applyVariant(scene, mapId, variant) {
    if (variant === "night") {
      if (scene.fog && scene.fog.color) { scene.fog.color.multiplyScalar(0.42); scene.fog.near *= 0.72; }
      if (scene._bhHemiBase) scene._bhHemiBase *= 0.42;
      if (scene._bhAmbBase) scene._bhAmbBase *= 0.55;
      if (scene._bhDirBase) scene._bhDirBase *= 0.38;
      if (scene._bhRimBase) scene._bhRimBase *= 0.5;
      const moon = new THREE.DirectionalLight(0x99aacc, 0.32);
      moon.position.set(-35, 58, -28);
      scene.add(moon);
      scene._bhMoonLight = moon;
    }
    if (variant === "rain" && mapId === "arctic") {
      if (scene.fog) { scene.fog.far *= 0.62; scene.fog.near *= 0.82; }
      scene.userData.weather = "rain";
    }
  }

  function buildMap(scene, mapDef) {
    const mapData = mapDef.build(scene);
    const variant = pickVariant(mapDef.id);
    finalizeMapScene(scene, mapDef.id, variant);
    mapData.variant = variant;
    mapData.variantLabel = variant === "night" ? " · NACHT" : variant === "rain" ? " · REGEN" : "";
    sanitizeMapSpawns(mapData);
    return mapData;
  }

  /* Karten-Rotation (Saison 1 – wechselt nach jedem Match) */
  const MAP_POOL = [
    { id: "harbor",     name: "MILITÄRHAFEN DELTA",   short: "Hafen Delta",       emoji: "⚓", build: buildHarbor },
    { id: "industrial", name: "ANLAGE SIERRA-7",      short: "Sierra-7",          emoji: "🏭", build: buildIndustrial },
    { id: "arctic",     name: "AUSPOSTEN FROSTLINIE", short: "Frostlinie",        emoji: "❄", build: buildArctic },
    { id: "ruins",      name: "VORORT ZERO",          short: "Vorort Zero",       emoji: "🏚", build: buildRuins },
    { id: "tower",      name: "HOCHHAUS ZERO",        short: "Hochhaus Zero",     emoji: "🏙", build: buildTower },
  ];

  function livePool() {
    return BH.SeasonRelease ? BH.SeasonRelease.filterMapPool(MAP_POOL) : MAP_POOL;
  }

  function poolIndex(rawIdx, pool) {
    if (!pool.length) return 0;
    const id = MAP_POOL[rawIdx % MAP_POOL.length]?.id;
    const found = pool.findIndex(m => m.id === id);
    return found >= 0 ? found : rawIdx % pool.length;
  }

  function getMapById(id) {
    const pool = livePool();
    return pool.find(m => m.id === id) || pool[0];
  }

  function getActiveMap() {
    const d = BH.Progress && BH.Progress.data;
    if (d && d.mapPickMode === "manual" && d.selectedMapId) {
      return getMapById(d.selectedMapId);
    }
    return getRotatingMap();
  }

  function getRotatingMap() {
    const pool = livePool();
    const raw = (BH.Progress && BH.Progress.data) ? (BH.Progress.data.mapIndex || 0) : 0;
    return pool[poolIndex(raw, pool)] || pool[0];
  }

  function getNextMap() {
    const pool = livePool();
    const raw = (BH.Progress && BH.Progress.data) ? (BH.Progress.data.mapIndex || 0) : 0;
    return pool[(poolIndex(raw, pool) + 1) % pool.length] || pool[0];
  }

  function advanceRotation() {
    if (!BH.Progress || !BH.Progress.data) return;
    const pool = livePool();
    const raw = BH.Progress.data.mapIndex || 0;
    const cur = poolIndex(raw, pool);
    const nextId = pool[(cur + 1) % pool.length].id;
    const nextRaw = MAP_POOL.findIndex(m => m.id === nextId);
    BH.Progress.data.mapIndex = nextRaw >= 0 ? nextRaw : 0;
    BH.Progress.save();
  }

  /** Vereinfachte Hindernisse für die Minimap */
  function buildMinimapObstacles(obstacles, opts) {
    if (!obstacles || !obstacles.length) return [];
    opts = opts || {};
    const minH = opts.minH !== undefined ? opts.minH : 2.2;
    const max = opts.max || 100;
    const items = [];
    for (const box of obstacles) {
      if (!box || !box.min) continue;
      const h = box.max.y - box.min.y;
      if (h < minH) continue;
      const w = box.max.x - box.min.x;
      const d = box.max.z - box.min.z;
      if (w < 1.2 || d < 1.2) continue;
      items.push({
        x: (box.min.x + box.max.x) * 0.5,
        z: (box.min.z + box.max.z) * 0.5,
        w, d, h,
        area: w * d,
      });
    }
    items.sort((a, b) => b.area - a.area);
    return items.slice(0, max);
  }

  return {
    buildCity, buildBunker, buildDesert,
    buildHarbor, buildIndustrial, buildArctic, buildRuins, buildTower,
    MAP_POOL, livePool, getMapById, getActiveMap, getRotatingMap, getNextMap,
    advanceRotation, buildMap, pickVariant, buildMinimapObstacles,
    pickSpawn, resolveClearSpawn, sanitizeMapSpawns, isSpawnBlocked,
  };
})();
