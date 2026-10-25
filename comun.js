// Utilidades compartidas por la página de inicio (app.js) y la de examen (examen.html).
window.BANCO = window.BANCO || {};
const POR_EXAMEN = 30;

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
const estaLista = (id) => INDICE.listas.includes(id);

const almacen = {
  leer(clave, defecto) {
    try { return JSON.parse(localStorage.getItem(clave)) ?? defecto; } catch { return defecto; }
  },
  guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento */ }
  },
};
const mejores = () => almacen.leer("sti-mejores", {});
const fallos = () => almacen.leer("sti-fallos", {});

function buscar(idUnidad) {
  for (const m of INDICE.modulos) {
    const u = m.unidades.find((x) => x.id === idUnidad);
    if (u) return { modulo: m, unidad: u };
  }
  return null;
}

const MODOS = {
  "1": "Examen 1",
  "2": "Examen 2",
  azar: "Aleatorio",
  oficial: "Autoevaluación oficial",
  fallos: "Repaso de fallos",
};
