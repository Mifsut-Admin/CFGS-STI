// Utilidades compartidas por la página de inicio (app.js) y la de examen (examen.html).
window.BANCO = window.BANCO || {};

// Alumna para la que está hecha la web (se usa en saludos y mensajes de nota).
const ALUMNA = { nombre: "María", completo: "María Oyonarte" };

// Cuaderno de NotebookLM con los temas, para resolver dudas. Vacío = botones «Pregúntame» ocultos.
// Para activarlo: "https://notebook.google.com/notebook/f0d2a534-5b96-4600-96f9-47f70ceb0f46/preview"
const NOTEBOOK = "";

// Versión de los archivos: cámbiala al publicar para que el navegador no use copias antiguas.
const VERSION = "20261025j";

function saludo() {
  const h = new Date().getHours();
  return h < 6 ? "Buenas noches" : h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
}

// Mensaje personalizado según la nota (sobre 10).
function mensajeNota(nota) {
  const n = ALUMNA.nombre;
  if (nota >= 9) return `¡Excelente, ${n}! Dominas este tema: estás preparadísima.`;
  if (nota >= 7) return `¡Muy buen trabajo, ${n}! Repasa las falladas y lo bordas.`;
  if (nota >= 5) return `Aprobado, ${n}. Vas por buen camino: lee las explicaciones de las que has fallado y sube nota.`;
  return `Esta vez no ha salido, ${n}, pero cada fallo es una explicación que te acerca al aprobado. Repite las falladas, ¡tú puedes!`;
}
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
