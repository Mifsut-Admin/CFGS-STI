// Página de inicio CFGS STI: botonera de asignaturas, lanzador con desplegables y unidades desplegables.
// Los exámenes se abren en examen.html?u=<unidad>&t=<1|2|azar|oficial|fallos>.
// Datos: data/indice.js (módulos y unidades) y, en el navegador, la mejor nota y los fallos (comun.js).

const app = document.getElementById("app");
const ESTILO = {
  M1: { clase: "c-cian", color: "#62e7f2" },
  M2: { clase: "c-violeta", color: "#b48cff" },
  M3: { clase: "c-ambar", color: "#ffc857" },
  M4: { clase: "c-rosa", color: "#ff7fd6" },
};
const enlace = (id, modo) => `examen.html?u=${id}&t=${modo}`;
const nFallos = (id) => (fallos()[id] || []).length;

// Tipos de examen disponibles para una unidad, con su mejor nota guardada.
function tipos(id) {
  const notas = mejores();
  const lista = ["1", "2", "azar"];
  if (esOficial(id)) lista.push("oficial");
  if (nFallos(id)) lista.push("fallos");
  return lista.map((modo) => ({ modo, nombre: MODOS[modo], nota: notas[`${id}/${modo}`] }));
}

// Una unidad está superada si tiene aprobados los dos exámenes de 30 preguntas.
function superada(id) {
  const n = mejores();
  return (n[`${id}/1`] ?? 0) >= 5 && (n[`${id}/2`] ?? 0) >= 5;
}

function pintarBotonera(vista) {
  const botones = INDICE.modulos.map((m) => ({ href: `#${m.id}`, clase: ESTILO[m.id].clase, texto: m.codigo, id: m.id, titulo: m.nombre }));
  botones.push({ href: "#oficiales", clase: "c-azul", texto: "Autoevaluaciones", id: "oficiales", titulo: "Autoevaluaciones oficiales de la plataforma" });
  botones.push({ href: "#fallos", clase: "c-rojo", texto: "Repasar fallos", id: "fallos", titulo: "Unidades con preguntas falladas" });
  document.getElementById("botonera").innerHTML = botones.map((b) => `
    <a class="neon ${b.clase}" href="${b.href}" title="${esc(b.titulo)}" aria-pressed="${vista === b.id}">${esc(b.texto)}</a>`).join("") + (NOTEBOOK ? `
    <a class="neon c-verde preguntame" href="${NOTEBOOK}" target="_blank" rel="noopener" title="Resolver dudas con el cuaderno de NotebookLM">❓ Pregúntame</a>` : "");
  document.getElementById("botonera").classList.toggle("con-preguntame", !!NOTEBOOK);
}

// Saludo a María con un resumen de su progreso guardado.
function pintarSaludo() {
  const notas = Object.values(mejores());
  const unidades = INDICE.modulos.flatMap((m) => m.unidades);
  const superadas = unidades.filter((u) => superada(u.id)).length;
  const pendientes = unidades.reduce((n, u) => n + nFallos(u.id), 0);
  const media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
  const n = ALUMNA.nombre;
  let frase;
  if (!notas.length) frase = `Bienvenida a tu web de estudio, ${n}. Elige una unidad y haz tu primer examen: cada respuesta trae su explicación.`;
  else if (superadas === unidades.length) frase = `¡Lo has superado todo, ${n}! Repasa los fallos y las autoevaluaciones oficiales para llegar al examen a tope.`;
  else if (pendientes) frase = `Vas avanzando, ${n}. Tienes ${pendientes} preguntas falladas esperando en «Repasar fallos»: son las que más te ayudan a subir nota.`;
  else frase = `¡Muy bien, ${n}! No tienes fallos pendientes. Sigue con la siguiente unidad.`;
  document.getElementById("saludo").innerHTML = `
    <div>
      <h2>${saludo()}, ${esc(n)} 👋</h2>
      <p>${esc(frase)}</p>
    </div>
    <div class="cifras">
      <div class="cifra"><strong>${notas.length}</strong><span>Exámenes hechos</span></div>
      <div class="cifra"><strong>${media === null ? "—" : media.toFixed(1)}</strong><span>Nota media</span></div>
      <div class="cifra"><strong>${superadas}/${unidades.length}</strong><span>Unidades superadas</span></div>
      <div class="cifra"><strong>${pendientes}</strong><span>Fallos por repasar</span></div>
    </div>`;
}

function pintarFranja() {
  document.getElementById("franja").innerHTML = INDICE.modulos.map((m) => {
    const hechas = m.unidades.filter((u) => superada(u.id)).length;
    return `
      <a class="medidor" href="#${m.id}" style="--color:${ESTILO[m.id].color}">
        <div class="fila"><span>${esc(m.nombre)}</span><strong>${hechas}/${m.unidades.length}</strong></div>
        <div class="barra"><span style="width:${(hechas / m.unidades.length) * 100}%"></span></div>
      </a>`;
  }).join("");
}

// Lanzador: asignatura → unidad → tipo de examen.
const selModulo = document.getElementById("sel-modulo");
const selUnidad = document.getElementById("sel-unidad");
const selTipo = document.getElementById("sel-tipo");
const empezar = document.getElementById("empezar");

function rellenarLanzador(idModulo) {
  selModulo.innerHTML = INDICE.modulos.map((m) => `<option value="${m.id}">${esc(m.codigo)} · ${esc(m.nombre)}</option>`).join("");
  if (idModulo) selModulo.value = idModulo;
  rellenarUnidades();
}
function rellenarUnidades() {
  const m = INDICE.modulos.find((x) => x.id === selModulo.value);
  selUnidad.innerHTML = m.unidades.filter((u) => estaLista(u.id))
    .map((u) => `<option value="${u.id}">U${u.n} · ${esc(u.titulo)}</option>`).join("");
  rellenarTipos();
}
function rellenarTipos() {
  selTipo.innerHTML = tipos(selUnidad.value).map((t) =>
    `<option value="${t.modo}">${esc(t.nombre)}${t.modo === "fallos" ? ` (${nFallos(selUnidad.value)})` : ""}${t.nota !== undefined ? ` · mejor ${t.nota.toFixed(2)}` : ""}</option>`).join("");
  empezar.href = enlace(selUnidad.value, selTipo.value);
}
selModulo.addEventListener("change", rellenarUnidades);
selUnidad.addEventListener("change", rellenarTipos);
selTipo.addEventListener("change", () => { empezar.href = enlace(selUnidad.value, selTipo.value); });

// Tarjeta que gira al pasar el ratón: delante el examen, detrás "Empezar" con su descripción.
function botonExamen(id, t) {
  const clase = { "1": "c-violeta", "2": "c-violeta", azar: "c-cian", oficial: "c-azul", fallos: "c-rojo" }[t.modo];
  const detalle = t.modo === "fallos" ? `${nFallos(id)} preguntas`
    : t.nota !== undefined ? `Mejor nota ${t.nota.toFixed(2)}` : t.modo === "oficial" ? "10 preguntas reales" : "30 preguntas";
  const dorso = { "1": "Preguntas 1 a 30 del tema", "2": "Preguntas 31 a 60 del tema", azar: "30 al azar entre las 60",
    oficial: "Las de la plataforma, con explicación", fallos: "Acierta y desaparecen" }[t.modo];
  return `
    <a class="giro ${clase}" href="${enlace(id, t.modo)}" aria-label="${esc(t.nombre)} · ${esc(detalle)}">
      <span class="interior">
        <span class="cara frente">${esc(t.nombre)}<small>${esc(detalle)}</small></span>
        <span class="cara dorso" aria-hidden="true">▶ Empezar<small>${esc(dorso)}</small></span>
      </span>
    </a>`;
}

function vistaModulo(idModulo) {
  const m = INDICE.modulos.find((x) => x.id === idModulo) || INDICE.modulos[0];
  const color = ESTILO[m.id].color;
  const abierta = almacen.leer("sti-abierta", null);
  app.innerHTML = `
    <section class="panel" style="--color:${color}" aria-labelledby="t-mod">
      <div class="modulo-cab">
        <span class="etiqueta">${esc(m.codigo)}</span>
        <h2 id="t-mod">${esc(m.nombre)}</h2>
        <div class="acciones-mod">
          <button class="neon c-gris mini" id="abrir-todas" type="button">Abrir todas</button>
          <button class="neon c-gris mini" id="cerrar-todas" type="button">Cerrar todas</button>
        </div>
      </div>
      ${m.unidades.map((u) => estaLista(u.id) ? `
        <details class="unidad" data-id="${u.id}" ${abierta === u.id ? "open" : ""}>
          <summary>
            <span class="num">${u.n}</span>
            <span class="tit"><strong>${esc(u.titulo)}</strong>${superada(u.id) ? `<small>✔ Superada</small>` : ""}</span>
            <span class="flecha" aria-hidden="true">▾</span>
          </summary>
          <div class="cuerpo"><div class="examenes">${tipos(u.id).map((t) => botonExamen(u.id, t)).join("")}</div></div>
        </details>` : `
        <details class="unidad" disabled>
          <summary><span class="num">${u.n}</span><span class="tit"><strong>${esc(u.titulo)}</strong><small>En preparación</small></span><span></span></summary>
        </details>`).join("")}
    </section>`;
  const todas = [...app.querySelectorAll("details.unidad[data-id]")];
  todas.forEach((d) => d.addEventListener("toggle", () => { if (d.open) almacen.guardar("sti-abierta", d.dataset.id); }));
  app.querySelector("#abrir-todas").addEventListener("click", () => todas.forEach((d) => { d.open = true; }));
  app.querySelector("#cerrar-todas").addEventListener("click", () => todas.forEach((d) => { d.open = false; }));
  rellenarLanzador(m.id);
}

// Listado de unidades de todas las asignaturas que cumplen un filtro (oficiales o con fallos).
function vistaLista(titulo, ayuda, filtro, modo, detalle) {
  const filas = INDICE.modulos.flatMap((m) => m.unidades.filter((u) => estaLista(u.id) && filtro(u.id)).map((u) => ({ m, u })));
  app.innerHTML = `
    <section class="panel">
      <h2>${esc(titulo)}</h2>
      <p class="ayuda">${esc(ayuda)}</p>
      ${filas.length ? `<div class="fallos-lista">${filas.map(({ m, u }) => `
        <div class="fallo" style="border-color:${ESTILO[m.id].color}55">
          <span><strong>${esc(m.codigo)} · U${u.n}</strong> ${esc(u.titulo)}<br><small style="color:var(--muted)">${esc(detalle(u.id))}</small></span>
          <a class="neon ${modo === "fallos" ? "c-rojo" : "c-azul"} mini" href="${enlace(u.id, modo)}">Empezar</a>
        </div>`).join("")}</div>` : `<p class="vacio">No hay nada aquí todavía. Haz algún examen y vuelve.</p>`}
    </section>`;
  rellenarLanzador();
}

function enrutar() {
  const vista = location.hash.replace(/^#\/?/, "") || almacen.leer("sti-modulo", "M1");
  pintarBotonera(vista);
  pintarSaludo();
  pintarFranja();
  if (vista === "fallos") {
    vistaLista("Repasar fallos", "Unidades con preguntas falladas u omitidas. Al acertarlas en el repaso desaparecen de la lista.",
      (id) => nFallos(id) > 0, "fallos", (id) => `${nFallos(id)} preguntas pendientes`);
  } else if (vista === "oficiales") {
    vistaLista("Autoevaluaciones oficiales", "Las 10 preguntas reales de la plataforma de cada unidad, con explicación.",
      esOficial, "oficial", (id) => (`${id}/oficial` in mejores() ? `Mejor nota ${mejores()[`${id}/oficial`].toFixed(2)}` : "Sin hacer"));
  } else {
    const id = INDICE.modulos.some((m) => m.id === vista) ? vista : "M1";
    almacen.guardar("sti-modulo", id);
    vistaModulo(id);
  }
}
window.addEventListener("hashchange", enrutar);
// Al volver de un examen con el botón Atrás, actualiza notas y fallos.
window.addEventListener("pageshow", (e) => { if (e.persisted) enrutar(); });
enrutar();
