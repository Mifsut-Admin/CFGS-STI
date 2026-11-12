// Vídeos «Archivo recuperado»: clips animados que se generan en el navegador con <canvas>.
// Estética de cámara de vigilancia (naranja y cian, letras de terminal, fallos de señal y cuenta atrás).
// Se construyen al momento con el progreso guardado de María, así que cambian según avanza.
// Formatos: horizontal 16:9 (1280×720) y vertical 9:16 (720×1280) para móvil y redes.
// El botón «Descargar» graba el clip y lo guarda como archivo de vídeo (.mp4 o .webm según el navegador).
// Depende de: comun.js (ALUMNA, INDICE, mejores, almacen, esc) y app.js (superada, nFallos, enlace).
(() => {
  const lienzo = document.getElementById("lienzo");
  if (!lienzo) return;
  const ctx = lienzo.getContext("2d");
  const $ = (id) => document.getElementById(id);

  const NAR = "#ff8400", CIAN = "#ace8ff", BLANCO = "#f4f1ec", ROJO = "#ff3b30", FONDO = "#050608";
  const TIT = '"Orbitron", "Segoe UI", sans-serif';
  const MONO = '"Share Tech Mono", ui-monospace, Consolas, monospace';
  const calma = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Utilidades ----------
  const lim = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const suave = (x) => { x = lim(x); return x * x * (3 - 2 * x); };
  const azar = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }; // "aleatorio" repetible
  const dos = (n) => String(Math.floor(n)).padStart(2, "0");
  const mayus = (s) => s.toLocaleUpperCase("es");
  const coma = (n) => n.toFixed(2).replace(".", ",");

  // Tamaño del lienzo: W×H, V = vertical, M = margen, CW = ancho útil.
  let W, H, V, M, CW, capaRayas;
  const ruidos = [0, 1, 2, 3].map(() => {
    const c = document.createElement("canvas"); c.width = 320; c.height = 180;
    const g = c.getContext("2d"), img = g.createImageData(320, 180);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    return c;
  });

  function ponerFormato(vertical) {
    V = vertical; W = V ? 720 : 1280; H = V ? 1280 : 720; M = V ? 50 : 90; CW = W - 2 * M;
    lienzo.width = W; lienzo.height = H;
    // Líneas de barrido de monitor y viñeta oscura en los bordes (se pintan una vez y se reutilizan).
    capaRayas = document.createElement("canvas"); capaRayas.width = W; capaRayas.height = H;
    const c = capaRayas.getContext("2d");
    c.fillStyle = "rgba(0,0,0,.22)";
    for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
    const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.78)");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    $("pantalla").classList.toggle("vertical", V);
    $("v-formato").textContent = V ? "⇄ 16:9" : "⇄ 9:16";
    $("v-formato").setAttribute("aria-label", V ? "Cambiar a vídeo horizontal" : "Cambiar a vídeo vertical");
  }

  function fuente(tam, tipo = MONO, peso = 400) { ctx.font = `${peso} ${tam}px ${tipo}`; }

  // Texto con brillo y, si se pide, colores separados (aberración) como en una señal dañada.
  function texto(s, x, y, { tam = 28, tipo = MONO, peso = 400, color = CIAN, alin = "left", brillo = 12, aberr = 0, alfa = 1 } = {}) {
    fuente(tam, tipo, peso);
    ctx.textAlign = alin; ctx.textBaseline = "middle";
    const antes = ctx.globalAlpha;
    ctx.globalAlpha = antes * alfa;
    if (aberr) {
      ctx.fillStyle = "rgba(0,229,255,.75)"; ctx.fillText(s, x - aberr, y);
      ctx.fillStyle = "rgba(255,40,40,.75)"; ctx.fillText(s, x + aberr, y);
    }
    ctx.shadowColor = color; ctx.shadowBlur = brillo;
    ctx.fillStyle = color; ctx.fillText(s, x, y);
    ctx.shadowBlur = 0; ctx.globalAlpha = antes;
  }
  // Máquina de escribir: el texto aparece letra a letra según p (0 → 1), con cursor mientras escribe.
  const escribir = (s, p) => s.slice(0, Math.floor(s.length * lim(p))) + (p > 0 && p < 1 ? "█" : "");
  // Recorta un texto con «…» para que quepa (usa la fuente ya puesta).
  function recortar(s, ancho) {
    if (ctx.measureText(s).width <= ancho) return s;
    while (s.length > 1 && ctx.measureText(s + "…").width > ancho) s = s.slice(0, -1);
    return s + "…";
  }
  // Parte un texto en líneas que quepan en un ancho (usa la fuente ya puesta).
  function partir(s, ancho) {
    const lineas = []; let l = "";
    for (const p of s.split(" ")) {
      const prueba = l ? `${l} ${p}` : p;
      if (l && ctx.measureText(prueba).width > ancho) { lineas.push(l); l = p; } else l = prueba;
    }
    if (l) lineas.push(l);
    return lineas;
  }
  // Titular enorme centrado; se parte en líneas y cada una se encoge si no cabe. Devuelve dónde acaba.
  function titular(s, cy, { tam = 96, color = NAR, aberr = 4, dx = 0 } = {}) {
    fuente(tam, TIT, 900);
    const lineas = partir(s, CW);
    const alto = tam * 1.12, y0 = cy - ((lineas.length - 1) * alto) / 2;
    lineas.forEach((l, i) => {
      fuente(tam, TIT, 900);
      const t = Math.min(tam, (tam * CW) / ctx.measureText(l).width);
      texto(l, W / 2 + dx, y0 + i * alto, { tam: t, tipo: TIT, peso: 900, color, brillo: 28, aberr, alin: "center" });
    });
    return y0 + (lineas.length - 1) * alto + tam / 2;
  }
  function barraProgreso(x, y, ancho, alto, p, color = NAR) {
    ctx.strokeStyle = CIAN; ctx.lineWidth = 2; ctx.strokeRect(x, y, ancho, alto);
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 14;
    const n = Math.floor((ancho - 8) / 20), llenos = Math.round(n * lim(p));
    for (let i = 0; i < llenos; i++) ctx.fillRect(x + 4 + i * 20, y + 4, 16, alto - 8);
    ctx.shadowBlur = 0;
  }

  // Foto de María para la ficha (si no carga, se muestra «SIN SEÑAL»).
  const foto = new Image();
  foto.src = "img/maria.jpg?v=2";

  // ---------- Sonido (sintetizado, sin archivos) ----------
  let ac = null, salida = null, destino = null, zumbido = null, bufRuido = null;
  let sonido = almacen.leer("sti-sonido", true);
  function iniciarAudio() {
    if (ac) { if (ac.state === "suspended") ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    salida = ac.createGain(); salida.gain.value = sonido ? 1 : 0; salida.connect(ac.destination);
    if (ac.createMediaStreamDestination) { destino = ac.createMediaStreamDestination(); salida.connect(destino); }
  }
  // Zumbido grave de fondo, como el de una sala de máquinas.
  function zumbar(encender) {
    if (!ac) return;
    if (encender && !zumbido) {
      const g = ac.createGain(), f = ac.createBiquadFilter();
      g.gain.setValueAtTime(0, ac.currentTime); g.gain.linearRampToValueAtTime(0.05, ac.currentTime + 1);
      f.type = "lowpass"; f.frequency.value = 260;
      const os = [55, 55.7].map((hz) => { const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = hz; o.connect(f); o.start(); return o; });
      f.connect(g); g.connect(salida);
      zumbido = { g, os };
    } else if (!encender && zumbido) {
      const z = zumbido; zumbido = null;
      z.g.gain.setTargetAtTime(0, ac.currentTime, 0.1);
      z.os.forEach((o) => o.stop(ac.currentTime + 0.6));
    }
  }
  function pitido(hz, dur, vol, tipo = "square") {
    if (!ac) return;
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.value = hz;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(salida); o.start(t); o.stop(t + dur + 0.02);
  }
  function chasquido(dur = 0.18, vol = 0.12) {
    if (!ac) return;
    if (!bufRuido) {
      bufRuido = ac.createBuffer(1, ac.sampleRate / 2, ac.sampleRate);
      const d = bufRuido.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ac.currentTime, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = bufRuido; f.type = "bandpass"; f.frequency.value = 1800;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(salida); s.start(t); s.stop(t + dur);
  }
  const SONIDOS = {
    tecla: () => pitido(1200, 0.03, 0.025),
    linea: () => pitido(660, 0.07, 0.04),
    fallo: () => chasquido(),
    cuenta: () => pitido(440, 0.25, 0.07, "sawtooth"),
    golpe: () => { pitido(70, 0.6, 0.3, "sine"); chasquido(0.35, 0.15); },
  };

  // ---------- Escenas ----------
  // Cada escena dura d segundos; f(t, d) la pinta en su tiempo local t. ev = sonidos [segundo, tipo].

  // 1. Arranque del sistema: líneas de terminal y barra de recuperación del archivo.
  const arranque = (lineas, archivo) => ({
    d: 3.4,
    ev: lineas.map((_, i) => [0.2 + i * 0.5, "linea"]),
    f(t, d) {
      const tam = V ? 26 : 30, y0 = V ? 330 : 200;
      lineas.forEach((l, i) => {
        const p = (t - 0.2 - i * 0.5) / 0.4;
        if (p > 0) texto("› " + escribir(l, p), M, y0 + i * 54, { tam, color: i === lineas.length - 1 ? NAR : CIAN });
      });
      const p = suave(t / (d - 0.3)), yb = V ? 820 : 590;
      fuente(V ? 20 : 22);
      texto(recortar(`RECUPERANDO ${archivo}`, CW - 90), M, yb - 26, { tam: V ? 20 : 22, brillo: 6 });
      texto(`${Math.round(p * 100)} %`, W - M, yb - 26, { tam: V ? 20 : 22, color: NAR, alin: "right" });
      barraProgreso(M, yb, CW, 24, p);
    },
  });

  // 2. Portada: titular enorme con temblor y separación de colores al entrar.
  const portada = (titulo, sub) => ({
    d: 3.8,
    ev: [[0, "golpe"]],
    f(t) {
      const sac = calma ? 0 : Math.max(0, 1 - t / 0.6);
      const dx = (azar(Math.floor(t * 30)) - 0.5) * 30 * sac;
      const cy = V ? 520 : 290;
      texto("/////////////////", W / 2, cy - (V ? 230 : 120), { tam: 26, color: NAR, alin: "center", alfa: 0.7 });
      const fin = titular(titulo, cy, { aberr: 4 + 10 * sac, dx });
      fuente(V ? 28 : 30);
      partir(sub, CW).forEach((l, i) =>
        texto(escribir(l, (t - 0.7 - i * 0.5) / 0.9), W / 2, fin + 70 + i * 44, { tam: V ? 28 : 30, alin: "center" }));
    },
  });

  // 3a. Registro de celdas: las unidades de una asignatura, liberadas (superadas) o bloqueadas.
  const celdas = (m) => {
    const n = m.unidades.length, paso = Math.min(1, 8 / n);
    return {
      d: 1.8 + n * paso + 1.4,
      ev: m.unidades.map((_, i) => [0.8 + i * paso, "linea"]),
      f(t) {
        const y0 = V ? 150 : 115;
        texto(`PABELLÓN ${m.codigo} · REGISTRO DE CELDAS`, M, y0, { tam: V ? 24 : 26, color: NAR });
        ctx.fillStyle = "rgba(255,132,0,.5)"; ctx.fillRect(M, y0 + 24, CW, 2);
        const alto = V ? Math.min(118, (H - 330) / n) : Math.min(58, 480 / n);
        m.unidades.forEach((u, i) => {
          const p = (t - 0.8 - i * paso) / 0.35;
          if (p <= 0) return;
          const ok = superada(u.id), y = y0 + 60 + alto / 2 + i * alto, x = M - (1 - suave(p)) * 60;
          const parpadeo = ok || Math.floor(t * 3) % 2 === 0;
          ctx.globalAlpha = lim(p);
          ctx.fillStyle = ok ? "rgba(172,232,255,.08)" : "rgba(255,132,0,.07)";
          ctx.fillRect(x, y - alto / 2 + 4, CW, alto - 8);
          ctx.fillStyle = ok ? CIAN : NAR; ctx.fillRect(x, y - alto / 2 + 4, 3, alto - 8);
          const estado = ok ? "LIBERADA ✔" : "BLOQUEADA ■", colorEstado = ok ? CIAN : NAR;
          if (V) {
            texto(`CELDA ${dos(u.n)}`, x + 18, y - 20, { tam: 22, color: NAR });
            texto(estado, x + CW - 16, y - 20, { tam: 20, color: colorEstado, alin: "right", alfa: parpadeo ? 1 : 0.35 });
            fuente(23); texto(recortar(u.titulo, CW - 36), x + 18, y + 18, { tam: 23, color: BLANCO, brillo: 4 });
          } else {
            texto(`CELDA ${dos(u.n)}`, x + 18, y, { tam: 22, color: NAR });
            fuente(24); texto(recortar(u.titulo, CW - 390), x + 170, y, { tam: 24, color: BLANCO, brillo: 4 });
            texto(estado, x + CW - 16, y, { tam: 22, color: colorEstado, alin: "right", alfa: parpadeo ? 1 : 0.35 });
          }
          ctx.globalAlpha = 1;
        });
      },
    };
  };

  // 3b. Estado de los pabellones: las cuatro asignaturas con su barra de progreso.
  const pabellones = () => ({
    d: 6,
    ev: INDICE.modulos.map((_, i) => [0.6 + i * 0.9, "linea"]),
    f(t) {
      const y0 = V ? 150 : 115;
      texto("ESTADO DE LOS PABELLONES", M, y0, { tam: V ? 24 : 26, color: NAR });
      ctx.fillStyle = "rgba(255,132,0,.5)"; ctx.fillRect(M, y0 + 24, CW, 2);
      INDICE.modulos.forEach((m, i) => {
        const p = (t - 0.6 - i * 0.9) / 0.5;
        if (p <= 0) return;
        const hechas = m.unidades.filter((u) => superada(u.id)).length, total = m.unidades.length;
        const llenado = suave((t - 1 - i * 0.9) / 1.2) * (hechas / total);
        ctx.globalAlpha = lim(p);
        if (V) {
          const y = 270 + i * 235;
          texto(m.codigo, M, y, { tam: 40, tipo: TIT, peso: 700, color: NAR });
          texto(`${hechas}/${total}`, W - M, y, { tam: 34, tipo: TIT, peso: 700, alin: "right" });
          fuente(24);
          partir(m.nombre, CW).slice(0, 2).forEach((l, k) => texto(l, M, y + 52 + k * 32, { tam: 24, color: BLANCO, brillo: 4 }));
          barraProgreso(M, y + 130, CW, 22, llenado);
        } else {
          const y = 215 + i * 112;
          texto(m.codigo, M, y, { tam: 34, tipo: TIT, peso: 700, color: NAR });
          fuente(24); texto(recortar(m.nombre, CW - 330), M + 190, y, { tam: 24, color: BLANCO, brillo: 4 });
          texto(`${hechas}/${total}`, W - M, y, { tam: 30, tipo: TIT, peso: 700, alin: "right" });
          barraProgreso(M, y + 32, CW, 22, llenado);
        }
        ctx.globalAlpha = 1;
      });
    },
  });

  // 4. Ficha del sujeto: foto como cámara de vigilancia con reconocimiento facial y datos tecleados.
  const ficha = (filas) => ({
    d: 5.6,
    ev: [[0.2, "linea"], ...filas.map((_, i) => [1 + i * 0.55, "tecla"])],
    f(t) {
      const fw = V ? 330 : 330, fh = V ? 440 : 440, fx = V ? (W - fw) / 2 : M, fy = V ? 130 : 135;
      ctx.fillStyle = "#000"; ctx.fillRect(fx, fy, fw, fh);
      if (foto.complete && foto.naturalWidth) {
        ctx.save();
        ctx.beginPath(); ctx.rect(fx, fy, fw, fh); ctx.clip();
        ctx.filter = "grayscale(1) contrast(1.3) brightness(.9)";
        const r = Math.max(fw / foto.naturalWidth, fh / foto.naturalHeight), iw = foto.naturalWidth * r, ih = foto.naturalHeight * r;
        const temblor = calma ? 0 : (azar(Math.floor(t * 8)) - 0.5) * 4;
        ctx.drawImage(foto, fx + (fw - iw) / 2 + temblor, fy, iw, ih);
        ctx.filter = "none";
        ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = "#8fdcff"; ctx.fillRect(fx, fy, fw, fh);
        ctx.globalCompositeOperation = "source-over";
        // Línea de escaneo que recorre la foto
        const ys = fy + ((t * 160) % fh);
        const g = ctx.createLinearGradient(0, ys - 40, 0, ys);
        g.addColorStop(0, "rgba(255,132,0,0)"); g.addColorStop(1, "rgba(255,132,0,.45)");
        ctx.fillStyle = g; ctx.fillRect(fx, ys - 40, fw, 40);
        ctx.restore();
        // Recuadro de reconocimiento facial que se cierra sobre la cara
        const c = suave((t - 0.4) / 1.1), ab = (1 - c) * 60;
        const bx = fx + fw * 0.18 - ab, by = fy + fh * 0.06 - ab, bw = fw * 0.64 + 2 * ab, bh = fh * 0.55 + 2 * ab, l = 26;
        ctx.strokeStyle = NAR; ctx.lineWidth = 3; ctx.shadowColor = NAR; ctx.shadowBlur = 10;
        ctx.beginPath();
        [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]].forEach(([x, y, sx, sy]) => {
          ctx.moveTo(x + sx * l, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * l);
        });
        ctx.stroke(); ctx.shadowBlur = 0;
        if (c >= 1) {
          ctx.fillStyle = "rgba(0,0,0,.65)"; ctx.fillRect(fx, fy + fh - 44, fw, 44);
          texto(`IDENTIFICADA · ${coma(98.7)} %`, fx + fw / 2, fy + fh - 22, { tam: 20, color: NAR, alin: "center", alfa: Math.floor(t * 4) % 2 ? 1 : 0.6 });
        }
      } else {
        texto("SIN SEÑAL", fx + fw / 2, fy + fh / 2, { tam: 30, alin: "center" });
      }
      ctx.strokeStyle = CIAN; ctx.lineWidth = 2; ctx.strokeRect(fx, fy, fw, fh);
      // Datos tecleados
      const x = V ? M : fx + fw + 70, y0 = V ? fy + fh + 75 : 165, paso = V ? 92 : 78, ancho = V ? CW : W - M - x;
      filas.forEach(([etiqueta, valor], i) => {
        const p = (t - 1 - i * 0.55) / 0.45;
        if (p <= 0) return;
        texto(etiqueta, x, y0 + i * paso, { tam: 20, color: NAR, brillo: 6 });
        fuente(30); texto(escribir(recortar(valor, ancho), p), x, y0 + i * paso + 32, { tam: 30, color: BLANCO, brillo: 6 });
      });
    },
  });

  // 5. Cuenta atrás: «el sistema eliminará este archivo en 3, 2, 1».
  const cuenta = () => ({
    d: 3.3,
    ev: [[0.05, "cuenta"], [1.05, "cuenta"], [2.05, "cuenta"]],
    f(t) {
      const cy = H / 2 + (V ? 20 : 30);
      fuente(30);
      partir("EL SISTEMA ELIMINARÁ ESTE ARCHIVO EN", CW).forEach((l, i) =>
        texto(l, W / 2, cy - (V ? 300 : 230) + i * 44, { tam: V ? 30 : 32, alin: "center" }));
      const n = 3 - Math.floor(t), f = t % 1;
      // Anillo que se vacía cada segundo
      ctx.strokeStyle = "rgba(255,132,0,.25)"; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(W / 2, cy, 170, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = NAR; ctx.shadowColor = NAR; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(W / 2, cy, 170, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - f)); ctx.stroke();
      ctx.shadowBlur = 0;
      if (n < 1) { texto("ELIMINANDO…", W / 2, cy, { tam: 40, tipo: TIT, peso: 700, color: ROJO, alin: "center", aberr: 6 }); return; }
      const esc = 1 + (1 - suave(f * 3)) * 0.35;
      ctx.save(); ctx.translate(W / 2, cy); ctx.scale(esc, esc);
      texto(String(n), 0, 8, { tam: 220, tipo: TIT, peso: 900, color: NAR, brillo: 40, aberr: calma ? 0 : 6, alin: "center" });
      ctx.restore();
    },
  });

  // 6. Final: mensaje de ánimo según el progreso y llamada a la acción parpadeante.
  const final = (titulo, sub, cta) => ({
    d: 4.4,
    ev: [[0, "golpe"]],
    f(t) {
      ctx.fillStyle = `rgba(255,132,0,${0.35 * Math.max(0, 1 - t * 4)})`; ctx.fillRect(0, 0, W, H);
      const fin = titular(titulo, V ? 470 : 250, { tam: V ? 84 : 88, aberr: calma ? 0 : 3 });
      fuente(30);
      const lineas = partir(sub, CW);
      lineas.forEach((l, i) => texto(escribir(l, (t - 0.5 - i * 0.6) / 0.8), W / 2, fin + 70 + i * 44, { tam: V ? 28 : 30, alin: "center" }));
      if (t > 1.5) {
        const y = V ? H - 300 : H - 150, enc = Math.floor(t * 2.5) % 2 === 0;
        fuente(30, TIT, 700);
        const ancho = Math.min(CW, ctx.measureText(cta).width + 80);
        ctx.strokeStyle = NAR; ctx.lineWidth = 3; ctx.shadowColor = NAR; ctx.shadowBlur = enc ? 22 : 6;
        ctx.strokeRect(W / 2 - ancho / 2, y - 36, ancho, 72); ctx.shadowBlur = 0;
        ctx.fillStyle = enc ? "rgba(255,132,0,.22)" : "rgba(255,132,0,.08)"; ctx.fillRect(W / 2 - ancho / 2, y - 36, ancho, 72);
        const tam = Math.min(30, (30 * (ancho - 40)) / ctx.measureText(cta).width);
        texto(cta, W / 2, y, { tam, tipo: TIT, peso: 700, color: BLANCO, alin: "center" });
      }
    },
  });

  // Une escenas una detrás de otra y reúne sus sonidos (más un fallo de señal en cada corte).
  function secuencia(escenas) {
    let t = 0;
    const eventos = [];
    const lista = escenas.map((e) => {
      const s = { ...e, desde: t };
      eventos.push({ t: t + 0.001, tipo: "fallo" });
      (e.ev || []).forEach(([dt, tipo]) => eventos.push({ t: t + dt + 0.002, tipo }));
      t += e.d;
      return s;
    });
    return { escenas: lista, dur: t, eventos: eventos.sort((a, b) => a.t - b.t) };
  }

  // ---------- Clips ----------
  // A qué examen mandar a María: la primera unidad sin superar (examen 1 o, si ya lo aprobó, el 2).
  function siguienteExamen(unidades) {
    const u = unidades.find((x) => estaLista(x.id) && !superada(x.id));
    if (!u) return null;
    const t = (mejores()[`${u.id}/1`] ?? 0) >= 5 ? "2" : "1";
    return { u, href: enlace(u.id, t) };
  }

  function clipIntro() {
    const notas = Object.values(mejores());
    const unidades = INDICE.modulos.flatMap((m) => m.unidades.map((u) => ({ ...u, codigo: m.codigo })));
    const superadas = unidades.filter((u) => superada(u.id)).length;
    const fallosTotal = unidades.reduce((n, u) => n + nFallos(u.id), 0);
    const media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
    const sig = siguienteExamen(unidades);
    const sub = fallosTotal ? `Tienes ${fallosTotal} fallos retenidos. Libéralos en «Repasar fallos».`
      : !sig ? "Has abierto todas las celdas. Repasa y sal por la puerta grande."
      : notas.length ? `Siguiente celda: ${sig.u.codigo} · U${sig.u.n}. Cada unidad aprobada abre una puerta.`
      : "Cada unidad aprobada abre una celda. Empieza por la primera.";
    return {
      archivo: "EXPEDIENTE_MARIA.MP4", cam: 1,
      ir: sig ? { href: sig.href, texto: `▶ Empezar ${sig.u.codigo} · U${sig.u.n}` } : { href: "#fallos", texto: "▶ Repasar fallos" },
      ...secuencia([
        arranque(["SISTEMA STI-IA · v26.11", "CONEXIÓN CON CONTROL… OK", "ANALIZANDO EXPEDIENTE…", "ACCESO CONCEDIDO"], "EXPEDIENTE_MARIA.MP4"),
        portada("ARCHIVO RECUPERADO", "Expediente de estudio · Sistemas de Telecomunicaciones e Informáticos"),
        ficha([
          ["SUJETO", mayus(ALUMNA.completo)],
          ["PROGRAMA", "CFGS STI · TELECOMUNICACIONES"],
          ["EXÁMENES REALIZADOS", String(notas.length)],
          ["NOTA MEDIA", media === null ? "SIN DATOS" : coma(media)],
          ["UNIDADES SUPERADAS", `${superadas} / ${unidades.length}`],
          ["FALLOS RETENIDOS", String(fallosTotal)],
        ]),
        pabellones(),
        cuenta(),
        final(sig ? "ÚNICA SALIDA: APROBAR" : "LIBERTAD CONDICIONAL", sub, sig ? "ELIGE UNA CELDA Y EMPIEZA" : "REPASA Y SUBE NOTA"),
      ]),
    };
  }

  function clipModulo(m, num) {
    const hechas = m.unidades.filter((u) => superada(u.id)).length;
    const propias = Object.entries(mejores()).filter(([k]) => k.startsWith(m.id + "_")).map(([, v]) => v);
    const fallosMod = m.unidades.reduce((n, u) => n + nFallos(u.id), 0);
    const sig = siguienteExamen(m.unidades);
    const archivo = `${m.id}_${m.codigo.replace(/\s+/g, "")}.MP4`;
    return {
      archivo, cam: num,
      ir: sig ? { href: sig.href, texto: `▶ Empezar la unidad ${sig.u.n}` } : { href: `#${m.id}`, texto: `▶ Ver ${m.codigo}` },
      ...secuencia([
        arranque(["SISTEMA STI-IA · v26.11", `ABRIENDO PABELLÓN ${m.codigo}…`, `${m.unidades.length} CELDAS DETECTADAS`, "ACCESO CONCEDIDO"], archivo),
        portada(`PABELLÓN ${m.codigo}`, m.nombre),
        celdas(m),
        ficha([
          ["SUJETO", mayus(ALUMNA.completo)],
          ["PABELLÓN", `${m.codigo} · ${m.unidades.length} CELDAS`],
          ["CELDAS LIBERADAS", `${hechas} / ${m.unidades.length}`],
          ["NOTA MEDIA EN EL PABELLÓN", propias.length ? coma(propias.reduce((a, b) => a + b, 0) / propias.length) : "SIN DATOS"],
          ["FALLOS RETENIDOS", String(fallosMod)],
        ]),
        cuenta(),
        final(sig ? "ESCAPA CELDA A CELDA" : "PABELLÓN LIBERADO",
          sig ? `Próxima celda: U${sig.u.n} · ${sig.u.titulo}` : "Repasa los fallos y la autoevaluación oficial para llegar a tope.",
          sig ? `EMPIEZA LA UNIDAD ${sig.u.n}` : "REPASA Y SUBE NOTA"),
      ]),
    };
  }

  const LISTA = [
    { id: "intro", nombre: "Expediente", crear: clipIntro },
    ...INDICE.modulos.map((m, i) => ({ id: m.id, nombre: m.codigo, crear: () => clipModulo(m, i + 2) })),
  ];

  // ---------- Pintado de cada fotograma ----------
  function pintar(t) {
    ctx.fillStyle = FONDO; ctx.fillRect(0, 0, W, H);
    // Rejilla tenue
    ctx.strokeStyle = "rgba(172,232,255,.05)"; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 0; x <= W; x += 40) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
    for (let y = 0; y <= H; y += 40) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
    ctx.stroke();

    let esc = clip.escenas[0];
    for (const e of clip.escenas) if (e.desde <= t) esc = e;
    const lt = t - esc.desde;
    ctx.save(); esc.f(lt, esc.d); ctx.restore();

    // Fallos de señal: fuertes al cambiar de escena y alguno suelto de vez en cuando.
    const g = calma ? 0 : Math.max(0, 1 - lt / 0.35) + (azar(Math.floor(t * 10)) > 0.97 ? 0.5 : 0);
    if (g > 0) cortes(g, t);
    hud(t);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 0.05 + g * 0.2;
    ctx.drawImage(ruidos[Math.floor(t * 24) % 4], 0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true;
    // Franja de luz que baja como en un monitor antiguo
    const yb = ((t * 140) % (H + 300)) - 150, gb = ctx.createLinearGradient(0, yb, 0, yb + 150);
    gb.addColorStop(0, "rgba(172,232,255,0)"); gb.addColorStop(0.5, "rgba(172,232,255,.045)"); gb.addColorStop(1, "rgba(172,232,255,0)");
    ctx.fillStyle = gb; ctx.fillRect(0, yb, W, 150);
    ctx.drawImage(capaRayas, 0, 0);
  }

  // Desplaza franjas horizontales de la imagen (efecto de señal corrupta).
  function cortes(g, t) {
    const n = Math.ceil(g * 7);
    for (let i = 0; i < n; i++) {
      const r = azar(Math.floor(t * 40) * 13 + i);
      const y = Math.floor(r * H), h = 6 + Math.floor(azar(r * 99 + i) * 40), dx = (azar(r * 7 + i) - 0.5) * 80 * g;
      ctx.drawImage(lienzo, 0, y, W, h, dx, y, W, h);
    }
    ctx.fillStyle = `rgba(255,132,0,${0.14 * g})`;
    ctx.fillRect(0, azar(Math.floor(t * 30)) * H, W, 3 + g * 10);
  }

  // Marco de cámara: esquinas, REC, número de cámara, fecha y contador.
  function hud(t) {
    const m = 28, l = 40;
    ctx.strokeStyle = NAR; ctx.lineWidth = 3; ctx.beginPath();
    [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, sx, sy]) => {
      ctx.moveTo(x + sx * l, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * l);
    });
    ctx.stroke();
    if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = ROJO; ctx.shadowColor = ROJO; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(m + 26, m + 30, 8, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
    texto("REC", m + 42, m + 30, { tam: 18, color: BLANCO, brillo: 4 });
    texto(`CAM-0${clip.cam} · STI-IA`, m + 96, m + 30, { tam: 18, brillo: 4 });
    const d = new Date();
    texto(`${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()} ${dos(d.getHours())}:${dos(d.getMinutes())}:${dos(d.getSeconds())}`,
      W - m - 14, m + 30, { tam: 18, alin: "right", brillo: 4 });
    texto(clip.archivo, m + 14, H - m - 22, { tam: 16, brillo: 4, alfa: 0.8 });
    texto(`${dos(t / 60)}:${dos(t % 60)}:${dos((t % 1) * 25)}`, W - m - 14, H - m - 22, { tam: 18, color: NAR, alin: "right", brillo: 6 });
  }

  // ---------- Reproductor ----------
  let elegido = LISTA[0], clip = null, pos = 0, inicio = 0, previo = 0, va = false, raf = 0, grabador = null;
  const CARTEL = 6.6; // segundo que se muestra como portada antes de reproducir

  const reloj = (s) => `${dos(s / 60)}:${dos(s % 60)}`;
  function avisar(msg) { $("v-aviso").textContent = msg; }

  function mandos() {
    $("v-play").textContent = va ? "❚❚" : "▶";
    $("v-play").setAttribute("aria-label", va ? "Pausar" : "Reproducir");
    $("v-barra").max = clip.dur.toFixed(2);
    $("v-barra").value = pos.toFixed(2);
    $("v-tiempo").textContent = `${reloj(pos)} / ${reloj(clip.dur)}`;
    $("play-grande").hidden = va || pos > 0;
    $("v-descargar").textContent = grabador ? "● Grabando…" : "⬇ Descargar";
    $("v-descargar").disabled = !!grabador;
  }

  function cargar(item) {
    pausar();
    elegido = item;
    clip = item.crear();
    pos = 0; previo = 0;
    $("fin").hidden = true;
    pintar(Math.min(CARTEL, clip.dur - 0.01));
    document.querySelectorAll(".cinta").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === item.id)));
    mandos();
  }

  function bucle(ahora) {
    if (!va) return;
    pos = lim((ahora - inicio) / 1000, 0, clip.dur); // el primer fotograma puede llegar con hora anterior al inicio
    for (const e of clip.eventos) if (e.t > previo && e.t <= pos) SONIDOS[e.tipo]?.();
    previo = pos;
    pintar(Math.min(pos, clip.dur - 0.001));
    if (pos >= clip.dur) terminar();
    else raf = requestAnimationFrame(bucle);
    mandos();
  }

  function reproducir() {
    if (va) return;
    iniciarAudio();
    if (pos >= clip.dur - 0.05) { clip = elegido.crear(); pos = 0; } // al repetir, datos recientes
    $("fin").hidden = true;
    inicio = performance.now() - pos * 1000; previo = pos;
    va = true; zumbar(true);
    raf = requestAnimationFrame(bucle);
    mandos();
  }

  function pausar() {
    if (grabador) { grabador.cancelado = true; grabador.stop(); }
    if (!va) return;
    va = false; cancelAnimationFrame(raf); zumbar(false);
    mandos();
  }

  function terminar() {
    va = false; zumbar(false);
    $("fin-ir").href = clip.ir.href;
    $("fin-ir").textContent = clip.ir.texto;
    $("fin").hidden = false;
    if (grabador) grabador.stop();
    mandos();
  }

  // Graba el clip desde el principio y lo descarga como archivo de vídeo.
  function descargar() {
    if (grabador) return;
    if (!window.MediaRecorder || !lienzo.captureStream) { avisar("Este navegador no permite grabar el vídeo. Prueba con Chrome o Edge en el ordenador."); return; }
    pausar();
    iniciarAudio();
    let flujo;
    try { flujo = lienzo.captureStream(30); } catch {
      avisar("No se puede grabar abriendo la web como archivo local. Ábrela desde GitHub Pages para descargar el vídeo.");
      return;
    }
    if (destino) destino.stream.getAudioTracks().forEach((p) => flujo.addTrack(p));
    const tipo = ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm"].find((x) => MediaRecorder.isTypeSupported(x));
    const trozos = [];
    const rec = new MediaRecorder(flujo, tipo ? { mimeType: tipo, videoBitsPerSecond: 6e6 } : {});
    rec.ondataavailable = (e) => { if (e.data.size) trozos.push(e.data); };
    rec.onstop = () => {
      grabador = null;
      flujo.getVideoTracks().forEach((p) => p.stop());
      mandos();
      if (rec.cancelado) { avisar("Grabación cancelada."); return; }
      const blob = new Blob(trozos, { type: rec.mimeType || "video/webm" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${clip.archivo.replace(/\.MP4$/, "")}_${V ? "9x16" : "16x9"}.${blob.type.includes("mp4") ? "mp4" : "webm"}`;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      avisar(`Vídeo guardado (${a.download}).`);
    };
    clip = elegido.crear(); pos = 0;
    grabador = rec;
    rec.start(250);
    avisar("Grabando el vídeo… deja esta pestaña abierta hasta que termine.");
    reproducir();
  }

  // ---------- Arranque ----------
  $("cintas").innerHTML = LISTA.map((c) => `<button class="cinta" type="button" data-id="${c.id}" aria-pressed="false">${esc(c.nombre)}</button>`).join("");
  $("cintas").addEventListener("click", (e) => {
    const b = e.target.closest(".cinta");
    if (b && !grabador) cargar(LISTA.find((c) => c.id === b.dataset.id));
  });
  const alternar = () => (va ? pausar() : reproducir());
  $("v-play").addEventListener("click", alternar);
  $("play-grande").addEventListener("click", reproducir);
  lienzo.addEventListener("click", () => { if (!grabador) alternar(); });
  $("fin-otra").addEventListener("click", () => { pos = clip.dur; reproducir(); });
  $("v-barra").addEventListener("input", (e) => {
    if (grabador) return;
    pos = Number(e.target.value); previo = pos;
    inicio = performance.now() - pos * 1000;
    $("fin").hidden = true;
    if (!va) { pintar(Math.min(pos, clip.dur - 0.001)); mandos(); }
  });
  function ponerSonido() {
    $("v-sonido").textContent = sonido ? "🔊" : "🔇";
    $("v-sonido").setAttribute("aria-label", sonido ? "Quitar sonido" : "Poner sonido");
    if (salida) salida.gain.value = sonido ? 1 : 0;
  }
  $("v-sonido").addEventListener("click", () => { sonido = !sonido; almacen.guardar("sti-sonido", sonido); ponerSonido(); });
  $("v-formato").addEventListener("click", () => { if (!grabador) { ponerFormato(!V); cargar(elegido); } });
  const pantalla = $("pantalla");
  if (pantalla.requestFullscreen) {
    $("v-completa").addEventListener("click", () => (document.fullscreenElement ? document.exitFullscreen() : pantalla.requestFullscreen()));
  } else $("v-completa").hidden = true;
  $("v-descargar").addEventListener("click", descargar);
  document.addEventListener("visibilitychange", () => { if (document.hidden) pausar(); });

  ponerFormato(matchMedia("(max-width: 640px)").matches);
  ponerSonido();
  cargar(LISTA[0]);
  // Cuando llegan las letras (Orbitron y Share Tech Mono) y la foto, se repinta la portada.
  const repintar = () => { if (!va && pos === 0) pintar(Math.min(CARTEL, clip.dur - 0.01)); };
  if (document.fonts) Promise.all([document.fonts.load(`900 40px ${TIT}`), document.fonts.load(`20px ${MONO}`)]).then(repintar, repintar);
  foto.addEventListener("load", repintar);
})();
