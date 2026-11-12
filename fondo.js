// Fondo negro animado: una red de telecomunicaciones en movimiento.
// Nodos que flotan y se enlazan cuando están cerca, paquetes de datos (naranja) que viajan por los enlaces,
// una línea de escaneo como en las cámaras de vigilancia y reacción al ratón o al dedo.
// Se pinta en un <canvas> fijo detrás de todo. Se para si la pestaña no se ve y respeta «reducir movimiento».
(() => {
  const lienzo = document.createElement("canvas");
  lienzo.id = "fondo-animado";
  lienzo.setAttribute("aria-hidden", "true");
  document.body.prepend(lienzo);
  const ctx = lienzo.getContext("2d");

  const calma = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COLORES = ["98,231,242", "172,232,255", "155,99,244"]; // cian, hielo y violeta (RGB)
  const NAR = "255,132,0";
  const DIST = 150; // distancia máxima para enlazar dos nodos

  let W = 0, H = 0, ppp = 1, nodos = [], paquetes = [], raf = 0, antes = 0;
  const raton = { x: -9999, y: -9999 };

  function medir() {
    ppp = Math.min(window.devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    lienzo.width = Math.round(W * ppp); lienzo.height = Math.round(H * ppp);
    ctx.setTransform(ppp, 0, 0, ppp, 0, 0);
    // Cantidad de nodos según el tamaño de la pantalla (menos en móvil).
    const n = Math.max(28, Math.min(110, Math.round((W * H) / 15000)));
    while (nodos.length < n) nodos.push(nuevoNodo());
    nodos.length = n;
    paquetes = paquetes.filter((p) => p.a < n && p.b < n);
  }

  function nuevoNodo() {
    const ang = Math.random() * Math.PI * 2, vel = 6 + Math.random() * 14; // píxeles por segundo
    return {
      x: Math.random() * W, y: Math.random() * H,
      vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel,
      r: 1 + Math.random() * 1.8,
      c: COLORES[Math.floor(Math.random() * COLORES.length)],
      fase: Math.random() * Math.PI * 2,
    };
  }

  function mover(dt) {
    for (const n of nodos) {
      n.x += n.vx * dt; n.y += n.vy * dt;
      // Al salir por un borde, entra por el contrario.
      if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
      // El ratón los aparta un poco.
      const dx = n.x - raton.x, dy = n.y - raton.y, d2 = dx * dx + dy * dy;
      if (d2 < 120 * 120 && d2 > 1) { const f = (1 - Math.sqrt(d2) / 120) * 40 * dt; n.x += (dx / Math.sqrt(d2)) * f; n.y += (dy / Math.sqrt(d2)) * f; }
    }
    // De vez en cuando sale un paquete de datos por un enlace.
    if (paquetes.length < 14 && Math.random() < dt * 3) {
      const a = Math.floor(Math.random() * nodos.length);
      let mejor = -1, md = DIST * DIST;
      for (let b = 0; b < nodos.length; b++) {
        if (b === a) continue;
        const dx = nodos[a].x - nodos[b].x, dy = nodos[a].y - nodos[b].y, d2 = dx * dx + dy * dy;
        if (d2 < md && Math.random() < 0.6) { md = d2; mejor = b; }
      }
      if (mejor >= 0) paquetes.push({ a, b: mejor, t: 0, vel: 0.6 + Math.random() * 0.8, saltos: 1 + Math.floor(Math.random() * 3) });
    }
    for (const p of paquetes) {
      p.t += p.vel * dt;
      if (p.t >= 1 && p.saltos > 0) {
        // Salta al siguiente nodo cercano, como un paquete que va de router en router.
        const desde = p.b;
        let sig = -1;
        for (let k = 0; k < 12; k++) {
          const c = Math.floor(Math.random() * nodos.length);
          if (c === desde || c === p.a) continue;
          const dx = nodos[desde].x - nodos[c].x, dy = nodos[desde].y - nodos[c].y;
          if (dx * dx + dy * dy < DIST * DIST) { sig = c; break; }
        }
        if (sig >= 0) { p.a = desde; p.b = sig; p.t = 0; p.saltos--; }
      }
    }
    paquetes = paquetes.filter((p) => p.t < 1);
  }

  function pintar(seg) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);

    // Resplandores muy suaves que se desplazan despacio.
    const orbes = [
      [W * (0.2 + 0.08 * Math.sin(seg * 0.07)), H * (0.15 + 0.06 * Math.cos(seg * 0.05)), Math.max(W, H) * 0.45, "155,99,244", 0.10],
      [W * (0.85 + 0.06 * Math.cos(seg * 0.06)), H * (0.8 + 0.08 * Math.sin(seg * 0.04)), Math.max(W, H) * 0.4, NAR, 0.07],
      [W * (0.7 + 0.1 * Math.sin(seg * 0.03)), H * (0.1 + 0.05 * Math.sin(seg * 0.08)), Math.max(W, H) * 0.3, "98,231,242", 0.06],
    ];
    for (const [x, y, r, c, a] of orbes) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    // Enlaces entre nodos cercanos (más visibles cuanto más cerca).
    ctx.lineWidth = 1;
    for (let i = 0; i < nodos.length; i++) {
      const a = nodos[i];
      for (let j = i + 1; j < nodos.length; j++) {
        const b = nodos[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 > DIST * DIST) continue;
        ctx.strokeStyle = `rgba(${a.c},${(1 - Math.sqrt(d2) / DIST) * 0.22})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      // Enlace con el ratón
      const dx = a.x - raton.x, dy = a.y - raton.y, d2 = dx * dx + dy * dy;
      if (d2 < 200 * 200) {
        ctx.strokeStyle = `rgba(${NAR},${(1 - Math.sqrt(d2) / 200) * 0.35})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(raton.x, raton.y); ctx.stroke();
      }
    }

    // Nodos con un leve parpadeo.
    for (const n of nodos) {
      const brillo = 0.45 + 0.35 * Math.sin(seg * 1.5 + n.fase);
      ctx.fillStyle = `rgba(${n.c},${brillo})`;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    }

    // Paquetes de datos: punto naranja brillante con estela.
    for (const p of paquetes) {
      const a = nodos[p.a], b = nodos[p.b];
      const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
      const ex = a.x + (b.x - a.x) * Math.max(0, p.t - 0.25), ey = a.y + (b.y - a.y) * Math.max(0, p.t - 0.25);
      const g = ctx.createLinearGradient(ex, ey, x, y);
      g.addColorStop(0, `rgba(${NAR},0)`); g.addColorStop(1, `rgba(${NAR},.8)`);
      ctx.strokeStyle = g; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = `rgba(${NAR},1)`; ctx.shadowColor = `rgb(${NAR})`; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Línea de escaneo que baja lentamente por la pantalla.
    const ys = ((seg * 60) % (H + 240)) - 120;
    const gs = ctx.createLinearGradient(0, ys - 120, 0, ys);
    gs.addColorStop(0, "rgba(172,232,255,0)"); gs.addColorStop(1, "rgba(172,232,255,.05)");
    ctx.fillStyle = gs; ctx.fillRect(0, ys - 120, W, 120);
    ctx.fillStyle = "rgba(172,232,255,.10)"; ctx.fillRect(0, ys, W, 1);
  }

  function bucle(ahora) {
    const dt = Math.min(0.05, (ahora - antes) / 1000 || 0);
    antes = ahora;
    mover(dt);
    pintar(ahora / 1000);
    raf = requestAnimationFrame(bucle);
  }

  function arrancar() { if (!raf && !calma) { antes = performance.now(); raf = requestAnimationFrame(bucle); } }
  function parar() { cancelAnimationFrame(raf); raf = 0; }

  addEventListener("resize", () => { medir(); if (calma) pintar(0); });
  addEventListener("pointermove", (e) => { raton.x = e.clientX; raton.y = e.clientY; }, { passive: true });
  const soltar = () => { raton.x = raton.y = -9999; };
  document.addEventListener("mouseout", (e) => { if (!e.relatedTarget) soltar(); });
  addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") soltar(); });
  document.addEventListener("visibilitychange", () => (document.hidden ? parar() : arrancar()));

  medir();
  pintar(0);
  arrancar();
})();
