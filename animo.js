// Frases de ánimo para María, siempre visibles en la cabecera.
// Cada pocos segundos la frase cambia con un fundido suave; con el ratón encima se queda quieta.
// Las 25 frases salen en orden aleatorio sin repetirse hasta haberlas visto todas
// (el orden se guarda en el navegador, así que al volver otro día continúa por donde iba).
// Depende de: comun.js (ALUMNA, almacen, barajar, esc).
(() => {
  const caja = document.getElementById("animo");
  if (!caja) return;
  const n = ALUMNA.nombre;

  const FRASES = [
    `${n}, cada pregunta que repasas hoy es un punto más en tu examen de mañana.`,
    "No hace falta ir rápido: hace falta no parar. Y tú no vas a parar.",
    "Tu cabeza es la mejor antena: cuanto más la orientas al temario, mejor señal recibe.",
    "Los fallos de hoy son las respuestas que ya no fallarás en el examen.",
    "Imagina el día que veas todas las asignaturas aprobadas. Ese día se está construyendo ahora.",
    `${n}, ya sabes más que ayer. Mañana sabrás más que hoy. Así se aprueba.`,
    "Un ciclo superior no se saca en un día: se saca unidad a unidad. Y ya llevas camino.",
    "Cuando dudes de ti, mira todo lo que has avanzado. Eso no lo hace cualquiera.",
    "Estudiar cansa, pero aprobar compensa. Y tú vas a aprobar.",
    "Hoy toca sumar: una unidad, un repaso, un acierto más.",
    "Eres más fuerte que cualquier examen de 30 preguntas.",
    `Señal recibida: ${n} está a tope y nada la detiene.`,
    "La constancia gana a la suerte. Y tú eres constante.",
    "Cada explicación que lees se queda contigo. Sigue, que funciona.",
    "Lo que hoy te parece difícil, mañana te parecerá fácil.",
    "Tu yo del futuro, con el título en la mano, te da las gracias por este rato de estudio.",
    `No compitas con nadie, solo con la ${n} de ayer. Y le estás ganando.`,
    `Ánimo, ${n}: con cada test, el aprobado está más cerca.`,
    "Equivocarse es parte del plan. Rendirse, no.",
    "Tienes cabeza, tienes ganas y tienes esta web. A por todas.",
    "Un 5 abre la puerta, pero tú puedes ir a por mucho más.",
    "Respira, concéntrate y confía: lo que has estudiado está ahí.",
    "Cada unidad superada es una puerta abierta. Ya queda menos.",
    "Hay gente que cree en ti y está deseando celebrar tu aprobado contigo.",
    "Hoy es un gran día para demostrarte de lo que eres capaz.",
  ];

  const INTERVALO = 12000;  // cada frase se ve 12 s
  const FUNDIDO = 600;      // duración del fundido entre frases (ms)
  const calma = matchMedia("(prefers-reduced-motion: reduce)").matches;

  caja.innerHTML = `
    <div class="animo-ventana">
      <div class="animo-cab">
        <span class="animo-punto" aria-hidden="true"></span>
        <span class="animo-titulo">Para ${esc(n)}</span>
        <span class="animo-cuenta" aria-hidden="true"></span>
      </div>
      <p class="animo-frase"></p>
      <div class="animo-tiempo" aria-hidden="true"><span></span></div>
    </div>`;
  const frase = caja.querySelector(".animo-frase");
  const cuenta = caja.querySelector(".animo-cuenta");
  const barra = caja.querySelector(".animo-tiempo span");

  // Siguiente frase sin repetir: baraja los números 0..24 y los va recorriendo.
  function siguiente() {
    let { orden, pos } = almacen.leer("sti-animo", { orden: [], pos: 0 });
    if (!Array.isArray(orden) || orden.length !== FRASES.length || pos >= orden.length) {
      orden = barajar(FRASES.map((_, i) => i)); pos = 0;
    }
    almacen.guardar("sti-animo", { orden, pos: pos + 1 });
    return { texto: FRASES[orden[pos]], num: pos + 1 };
  }

  function poner({ texto, num }) {
    frase.textContent = texto;
    cuenta.textContent = `${String(num).padStart(2, "0")} / ${FRASES.length}`;
  }

  let reloj = 0, restante = 0, desde = 0;

  // La línea inferior se vacía poco a poco hasta la siguiente frase.
  function esperar(ms) {
    restante = ms; desde = performance.now();
    barra.style.transition = "none"; barra.style.transform = `scaleX(${ms / INTERVALO})`;
    void barra.offsetWidth;
    barra.style.transition = `transform ${ms}ms linear`; barra.style.transform = "scaleX(0)";
    clearTimeout(reloj);
    reloj = setTimeout(cambiar, ms);
  }

  function cambiar() {
    if (document.hidden) { esperar(INTERVALO); return; } // si no está mirando, no gasta frases
    const nueva = siguiente();
    if (calma) { poner(nueva); esperar(INTERVALO); return; }
    frase.classList.add("saliendo");
    setTimeout(() => {
      poner(nueva);
      frase.classList.remove("saliendo");
      esperar(INTERVALO);
    }, FUNDIDO);
  }

  // Con el ratón encima, la frase no cambia (para leerla con calma).
  caja.addEventListener("mouseenter", () => {
    clearTimeout(reloj);
    restante = Math.max(1500, restante - (performance.now() - desde));
    const actual = getComputedStyle(barra).transform;
    barra.style.transition = "none"; barra.style.transform = actual;
  });
  caja.addEventListener("mouseleave", () => esperar(restante));

  poner(siguiente());
  esperar(INTERVALO);
})();
