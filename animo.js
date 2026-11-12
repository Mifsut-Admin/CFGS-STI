// Ventana de ánimo en la cabecera: de vez en cuando aparece una frase motivadora para María,
// se escribe letra a letra con estilo neón y desaparece sola. Las 25 frases salen en orden aleatorio
// sin repetirse hasta haberlas visto todas (el orden se guarda en el navegador entre visitas).
// Depende de: comun.js (ALUMNA, almacen, barajar).
(() => {
  const caja = document.getElementById("animo");
  if (!caja) return;
  const n = ALUMNA.nombre;

  const FRASES = [
    `${n}, cada pregunta que repasas hoy es un punto más en tu examen de mañana.`,
    "No hace falta ir rápido: hace falta no parar. Y tú no vas a parar.",
    "Tu cabeza es la mejor antena: cuanto más la orientas al temario, mejor señal recibe. 📡",
    "Los fallos de hoy son las respuestas que ya no fallarás en el examen.",
    "Imagina el día que veas todas las asignaturas aprobadas. Ese día se está construyendo ahora.",
    `${n}, ya sabes más que ayer. Mañana sabrás más que hoy. Así se aprueba.`,
    "Un ciclo superior no se saca en un día: se saca unidad a unidad. Y ya llevas camino.",
    "Cuando dudes de ti, mira todo lo que has avanzado. Eso no lo hace cualquiera.",
    "Estudiar cansa, pero aprobar compensa. ¡Y tú vas a aprobar!",
    "Hoy toca sumar: una unidad, un repaso, un acierto más.",
    "Eres más fuerte que cualquier examen de 30 preguntas. 💪",
    `Señal recibida: ${n} está a tope y nada la detiene. 📶`,
    "La constancia gana a la suerte. Y tú eres constante.",
    "Cada explicación que lees se queda contigo. Sigue, que funciona.",
    "Lo que hoy te parece difícil, mañana te parecerá fácil.",
    "Tu yo del futuro, con el título en la mano, te da las gracias por este rato de estudio. 🎓",
    `No compitas con nadie, solo con la ${n} de ayer. Y le estás ganando.`,
    `Ánimo, ${n}: con cada test, el aprobado está más cerca.`,
    "Equivocarse es parte del plan. Rendirse, no.",
    "Tienes cabeza, tienes ganas y tienes esta web. ¡A por todas!",
    "Un 5 abre la puerta, pero tú puedes ir a por mucho más. ✨",
    "Respira, concéntrate y confía: lo que has estudiado está ahí.",
    "Cada unidad superada es una celda abierta. ¡Ya queda menos para salir! 🔓",
    "Hay gente que cree en ti y está deseando celebrar tu aprobado contigo. 🥳",
    "Hoy es un gran día para demostrarte de lo que eres capaz.",
  ];

  const PRIMERA = 4000;           // primera frase a los 4 s de entrar
  const VISIBLE = 14000;          // cada frase se ve 14 s
  const PAUSA = [45000, 75000];   // y la siguiente sale entre 45 y 75 s después
  const calma = matchMedia("(prefers-reduced-motion: reduce)").matches;

  caja.innerHTML = `
    <div class="animo-ventana">
      <div class="animo-cab">
        <span class="animo-punto" aria-hidden="true"></span>
        <span class="animo-titulo">Mensaje para ${esc(n)}</span>
        <button class="animo-cerrar" type="button" aria-label="Cerrar mensaje">×</button>
      </div>
      <p class="animo-frase" aria-hidden="true"></p>
      <span class="animo-lector" aria-live="polite"></span>
      <div class="animo-tiempo" aria-hidden="true"><span></span></div>
    </div>`;
  const frase = caja.querySelector(".animo-frase");
  const barra = caja.querySelector(".animo-tiempo span");
  const lector = caja.querySelector(".animo-lector");

  // Siguiente frase sin repetir: baraja los números 0..24 y los va recorriendo.
  function siguiente() {
    let { orden, pos } = almacen.leer("sti-animo", { orden: [], pos: 0 });
    if (!Array.isArray(orden) || orden.length !== FRASES.length || pos >= orden.length) {
      orden = barajar(FRASES.map((_, i) => i)); pos = 0;
    }
    almacen.guardar("sti-animo", { orden, pos: pos + 1 });
    return FRASES[orden[pos]];
  }

  let reloj = 0, tecleo = 0, restante = 0, desde = 0, visible = false;

  function escribir(texto) {
    clearInterval(tecleo);
    if (calma) { frase.textContent = texto; return; }
    let i = 0;
    frase.textContent = "";
    frase.classList.add("escribiendo");
    tecleo = setInterval(() => {
      i += 1;
      frase.textContent = texto.slice(0, i);
      if (i >= texto.length) { clearInterval(tecleo); frase.classList.remove("escribiendo"); }
    }, 28);
  }

  // La barra inferior se vacía mientras la frase está visible.
  function cuentaAtras(ms) {
    restante = ms; desde = performance.now();
    barra.style.transition = "none"; barra.style.transform = `scaleX(${ms / VISIBLE})`;
    void barra.offsetWidth;
    barra.style.transition = `transform ${ms}ms linear`; barra.style.transform = "scaleX(0)";
    clearTimeout(reloj);
    reloj = setTimeout(ocultar, ms);
  }

  function mostrar() {
    if (document.hidden) { programar(5000); return; } // si no está mirando, espera
    visible = true;
    caja.classList.add("visible");
    const texto = siguiente();
    lector.textContent = texto;
    escribir(texto);
    cuentaAtras(VISIBLE);
  }
  function ocultar() {
    visible = false;
    caja.classList.remove("visible");
    clearInterval(tecleo);
    programar(PAUSA[0] + Math.random() * (PAUSA[1] - PAUSA[0]));
  }
  function programar(ms) { clearTimeout(reloj); reloj = setTimeout(mostrar, ms); }

  // Con el ratón encima se queda quieta para poder leerla con calma.
  caja.addEventListener("mouseenter", () => {
    if (!visible) return;
    clearTimeout(reloj);
    restante = Math.max(1500, restante - (performance.now() - desde));
    const actual = getComputedStyle(barra).transform;
    barra.style.transition = "none"; barra.style.transform = actual;
  });
  caja.addEventListener("mouseleave", () => { if (visible) cuentaAtras(restante); });
  caja.querySelector(".animo-cerrar").addEventListener("click", ocultar);

  programar(PRIMERA);
})();
