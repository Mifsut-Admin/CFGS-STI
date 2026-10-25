// Tests de práctica CFGS STI.
// Cada unidad es un archivo data/Mx_Uyy.js que registra BANCO["Mx_Uyy"] = [{p, r: [correcta, ...incorrectas], e}].
// La primera respuesta de "r" es siempre la correcta; las opciones se barajan en cada intento.
// La autoevaluación oficial está en data/Mx_Uyy_oficial.js como [{p, o: [opciones en orden original], c: índice correcta, e}].

window.BANCO = window.BANCO || {};
const app = document.getElementById("app");
const POR_EXAMEN = 30;

// --- Utilidades ---------------------------------------------------------

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function barajar(lista) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Opciones como "Todas son correctas" se quedan en su sitio; si alguna opción se refiere a
// otras ("las dos anteriores", "A) y B)"), no se baraja nada para no cambiar su sentido.
const META = /^(todas|todos|ninguna|ninguno|las dos|ambas)\b/i;
const REFERENCIA = /anterior|\b[A-D]\)|\b[A-D] y [A-D]\b/;

function ordenarOpciones(textos, correcta) {
  const lista = textos.map((texto, i) => ({ texto, correcta: i === correcta }));
  if (textos.some((t) => REFERENCIA.test(t))) return lista;
  const huecos = lista.map((o, i) => (META.test(o.texto) ? null : i)).filter((i) => i !== null);
  const mezcla = barajar(huecos.map((i) => lista[i]));
  huecos.forEach((pos, k) => { lista[pos] = mezcla[k]; });
  return lista;
}

// Pregunta en formato común: {p, o, c, e} (las del banco normal tienen la correcta en r[0]).
const normalizar = (q) => (q.o ? q : { p: q.p, o: q.r, c: 0, e: q.e });
const esOficial = (id) => (INDICE.oficiales || []).includes(id);

const almacen = {
  leer(clave, defecto) {
    try { return JSON.parse(localStorage.getItem(clave)) ?? defecto; } catch { return defecto; }
  },
  guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento */ }
  },
};

// Carga el archivo de una unidad bajo demanda (funciona también abriendo el HTML en local).
function cargarUnidad(id) {
  if (BANCO[id]) return Promise.resolve(BANCO[id]);
  return new Promise((ok, fallo) => {
    const s = document.createElement("script");
    s.src = `data/${id}.js`;
    s.onload = () => (BANCO[id] ? ok(BANCO[id]) : fallo(new Error("Unidad vacía")));
    s.onerror = () => fallo(new Error("No se pudo cargar la unidad"));
    document.head.appendChild(s);
  });
}

function buscar(idUnidad) {
  for (const m of INDICE.modulos) {
    const u = m.unidades.find((x) => x.id === idUnidad);
    if (u) return { modulo: m, unidad: u };
  }
  return null;
}

const mejores = () => almacen.leer("sti-mejores", {});
const fallos = () => almacen.leer("sti-fallos", {});

// --- Vistas -------------------------------------------------------------

function vistaInicio() {
  const total = INDICE.modulos.reduce((n, m) => n + m.unidades.length, 0);
  app.innerHTML = `
    <h1>Elige un módulo</h1>
    <p class="sub">${INDICE.modulos.length} módulos · ${total} unidades · 60 preguntas por unidad en 2 exámenes de 30, más la autoevaluación oficial de la plataforma.</p>
    <div class="rejilla">
      ${INDICE.modulos.map((m) => `
        <a class="tarjeta" href="#/m/${m.id}">
          <span class="etiqueta">${esc(m.codigo)}</span>
          <h3>${esc(m.nombre)}</h3>
          <p>${m.unidades.filter((u) => INDICE.listas.includes(u.id)).length} de ${m.unidades.length} unidades disponibles</p>
        </a>`).join("")}
    </div>`;
}

function vistaModulo(idModulo) {
  const m = INDICE.modulos.find((x) => x.id === idModulo);
  if (!m) return vistaInicio();
  const notas = mejores();
  const nFallos = fallos();
  const nota = (clave) => (clave in notas ? `<span class="nota-mini">${notas[clave].toFixed(1)}</span>` : "");
  app.innerHTML = `
    <div class="miga"><a href="#/">Inicio</a> › ${esc(m.nombre)}</div>
    <h1>${esc(m.nombre)}</h1>
    <p class="sub">Haz cada examen tantas veces como quieras. Se guarda tu mejor nota en este navegador.</p>
    <div class="unidades">
      ${m.unidades.map((u) => {
        const fu = (nFallos[u.id] || []).length;
        if (!INDICE.listas.includes(u.id)) return `
        <div class="tarjeta unidad pendiente">
          <div class="info">
            <span class="etiqueta">Unidad ${u.n}</span>
            <h3>${esc(u.titulo)}</h3>
          </div>
          <span class="nota-mini">En preparación</span>
        </div>`;
        return `
        <div class="tarjeta unidad">
          <div class="info">
            <span class="etiqueta">Unidad ${u.n}</span>
            <h3>${esc(u.titulo)}</h3>
          </div>
          <div class="acciones">
            <a class="boton" href="#/t/${u.id}/1">Examen 1 ${nota(u.id + "/1")}</a>
            <a class="boton" href="#/t/${u.id}/2">Examen 2 ${nota(u.id + "/2")}</a>
            <a class="boton" href="#/t/${u.id}/azar">Aleatorio ${nota(u.id + "/azar")}</a>
            ${esOficial(u.id) ? `<a class="boton" href="#/t/${u.id}/oficial">Autoevaluación oficial ${nota(u.id + "/oficial")}</a>` : ""}
            ${fu ? `<a class="boton" href="#/t/${u.id}/fallos">Repasar fallos (${fu})</a>` : ""}
          </div>
        </div>`;
      }).join("")}
    </div>`;
}

async function vistaTest(idUnidad, modo) {
  const encontrado = buscar(idUnidad);
  if (!encontrado || !INDICE.listas.includes(idUnidad)) return vistaInicio();
  const { modulo, unidad } = encontrado;
  app.innerHTML = `<p class="sub">Cargando preguntas…</p>`;
  // Cada pregunta lleva su "clave" para la lista de fallos: número en el banco normal, "o<n>" en la oficial.
  let banco = [], oficial = [];
  try {
    if (modo !== "oficial") banco = await cargarUnidad(idUnidad);
    if (esOficial(idUnidad) && (modo === "oficial" || modo === "fallos")) oficial = await cargarUnidad(idUnidad + "_oficial");
  } catch (err) {
    app.innerHTML = `<p class="sub">${esc(err.message)}. <a href="#/m/${modulo.id}">Volver</a></p>`;
    return;
  }
  const delBanco = (i) => banco[i] && { q: normalizar(banco[i]), clave: i };
  const delOficial = (i) => oficial[i] && { q: normalizar(oficial[i]), clave: "o" + i };

  let seleccion;
  if (modo === "1") seleccion = banco.slice(0, POR_EXAMEN).map((_, i) => delBanco(i));
  else if (modo === "2") seleccion = banco.slice(POR_EXAMEN, POR_EXAMEN * 2).map((_, i) => delBanco(POR_EXAMEN + i));
  else if (modo === "oficial") seleccion = oficial.map((_, i) => delOficial(i));
  else if (modo === "fallos") seleccion = (fallos()[idUnidad] || [])
    .map((k) => (String(k).startsWith("o") ? delOficial(Number(String(k).slice(1))) : delBanco(k))).filter(Boolean);
  else seleccion = barajar(banco.map((_, i) => delBanco(i))).slice(0, POR_EXAMEN);
  if (!seleccion.length) return vistaModulo(modulo.id);

  const nombreModo = { "1": "Examen 1", "2": "Examen 2", azar: "Aleatorio", oficial: "Autoevaluación oficial", fallos: "Repaso de fallos" }[modo] || "Test";
  const preguntas = barajar(seleccion).map(({ q, clave }) => {
    const opciones = ordenarOpciones(q.o, q.c);
    return { q, indice: clave, opciones, correcta: q.o[q.c], elegida: null };
  });
  let actual = 0;

  function pintar() {
    const item = preguntas[actual];
    const respondida = item.elegida !== null;
    const contestadas = preguntas.filter((x) => x.elegida !== null).length;
    app.innerHTML = `
      <div class="miga"><a href="#/">Inicio</a> › <a href="#/m/${modulo.id}">${esc(modulo.nombre)}</a> › U${unidad.n}</div>
      <div class="cabecera-test"><span>${esc(unidad.titulo)} · ${nombreModo}</span><span>Pregunta ${actual + 1} de ${preguntas.length}</span></div>
      <div class="progreso"><span style="width:${(contestadas / preguntas.length) * 100}%"></span></div>
      <div class="tarjeta pregunta">
        <h2>${esc(item.q.p)}</h2>
        <div class="opciones">
          ${item.opciones.map((o, i) => {
            let clase = "";
            if (respondida && o.correcta) clase = "ok";
            else if (respondida && i === item.elegida) clase = "mal";
            return `<button class="opcion ${clase}" data-i="${i}" ${respondida ? "disabled" : ""}>
              <span class="letra">${"ABCD"[i]}</span><span>${esc(o.texto)}</span></button>`;
          }).join("")}
        </div>
        ${respondida ? (() => {
          const acierto = item.opciones[item.elegida].correcta;
          return `<div class="explicacion ${acierto ? "es-ok" : "es-mal"}">
            <strong>${acierto ? "✓ ¡Correcto!" : `✗ Incorrecto. La respuesta correcta es: ${esc(item.correcta)}`}</strong>
            ${item.q.e ? `<p>${esc(item.q.e)}</p>` : ""}
          </div>`;
        })() : ""}
      </div>
      <div class="navegacion">
        <button class="boton" id="ant" ${actual === 0 ? "disabled" : ""}>← Anterior</button>
        ${actual < preguntas.length - 1
          ? `<button class="boton primario" id="sig">Siguiente →</button>`
          : `<button class="boton primario" id="fin">Ver resultado</button>`}
      </div>`;
    app.querySelectorAll(".opcion").forEach((b) => b.addEventListener("click", () => {
      item.elegida = Number(b.dataset.i);
      pintar();
    }));
    app.querySelector("#ant")?.addEventListener("click", () => { actual--; pintar(); });
    app.querySelector("#sig")?.addEventListener("click", () => { actual++; pintar(); });
    app.querySelector("#fin")?.addEventListener("click", terminar);
  }

  function terminar() {
    const aciertos = preguntas.filter((x) => x.elegida !== null && x.opciones[x.elegida].correcta);
    const malas = preguntas.filter((x) => !aciertos.includes(x));
    const nota = (aciertos.length / preguntas.length) * 10;

    const clave = `${idUnidad}/${modo}`;
    const notas = mejores();
    if (modo !== "fallos" && (!(clave in notas) || nota > notas[clave])) {
      notas[clave] = nota;
      almacen.guardar("sti-mejores", notas);
    }
    // Lista de fallos de la unidad: se añaden los nuevos y se quitan los acertados.
    const todos = fallos();
    const set = new Set(todos[idUnidad] || []);
    malas.forEach((x) => set.add(x.indice));
    aciertos.forEach((x) => set.delete(x.indice));
    todos[idUnidad] = [...set];
    almacen.guardar("sti-fallos", todos);

    app.innerHTML = `
      <div class="miga"><a href="#/">Inicio</a> › <a href="#/m/${modulo.id}">${esc(modulo.nombre)}</a> › U${unidad.n}</div>
      <div class="tarjeta resultado">
        <span class="etiqueta">${esc(unidad.titulo)} · ${nombreModo}</span>
        <div class="nota ${nota >= 5 ? "aprobado" : "suspenso"}">${nota.toFixed(1)}</div>
        <p class="sub">${aciertos.length} de ${preguntas.length} aciertos</p>
        <div class="acciones" style="justify-content:center">
          <button class="boton primario" id="otra">Repetir</button>
          <a class="boton" href="#/m/${modulo.id}">Volver al módulo</a>
        </div>
      </div>
      ${malas.length ? `<h2>Preguntas a repasar (${malas.length})</h2>
      <div class="repaso">
        ${malas.map((x) => `
          <div class="tarjeta">
            <h3>${esc(x.q.p)}</h3>
            ${x.elegida !== null ? `<div class="tuya">✗ Tu respuesta: ${esc(x.opciones[x.elegida].texto)}</div>` : `<div class="tuya">✗ Sin responder</div>`}
            <div class="buena">✓ Correcta: ${esc(x.correcta)}</div>
            ${x.q.e ? `<div class="por-que">${esc(x.q.e)}</div>` : ""}
          </div>`).join("")}
      </div>` : ""}`;
    app.querySelector("#otra").addEventListener("click", () => vistaTest(idUnidad, modo));
    window.scrollTo(0, 0);
  }

  pintar();
}

// --- Rutas y tema -------------------------------------------------------

function enrutar() {
  const partes = location.hash.replace(/^#\/?/, "").split("/");
  if (partes[0] === "m") vistaModulo(partes[1]);
  else if (partes[0] === "t") vistaTest(partes[1], partes[2]);
  else vistaInicio();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", enrutar);
enrutar();

const raiz = document.documentElement;
const temaGuardado = almacen.leer("sti-tema", null);
if (temaGuardado) raiz.dataset.theme = temaGuardado;
document.getElementById("tema").addEventListener("click", () => {
  const oscuro = raiz.dataset.theme
    ? raiz.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  raiz.dataset.theme = oscuro ? "light" : "dark";
  almacen.guardar("sti-tema", raiz.dataset.theme);
});
