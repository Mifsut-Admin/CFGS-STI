# CFGS STI · Tests de práctica

Web de estudio para el ciclo formativo de grado superior **Sistemas de Telecomunicaciones e Informáticos**.

Cada unidad tiene **60 preguntas** tipo test elaboradas a partir del temario, repartidas en dos exámenes de 30, más un modo aleatorio y un repaso de las preguntas falladas. Casi todas las unidades incluyen además la **autoevaluación oficial** de la plataforma (10 preguntas reales). Cada respuesta incluye una explicación pensada para aprender del error.

## Módulos

| Módulo | Unidades |
|---|---|
| Configuración de infraestructuras de sistemas de telecomunicaciones | 9 |
| Elementos de sistemas de telecomunicaciones | 6 |
| Gestión de proyectos de instalaciones de telecomunicaciones | 8 |
| Itinerario personal para la empleabilidad I | 9 |

## Uso

Es una web estática sin dependencias: abre `index.html` en el navegador o publícala con GitHub Pages (Settings → Pages → rama `main`, carpeta raíz).

Las notas y la lista de preguntas falladas se guardan en el navegador de cada persona. Funciona en móvil, tablet y ordenador.

Los exámenes siguen el formato de evaluación: panel con progreso y navegador de preguntas, botones Responder / Pasar / Siguiente, y nota sobre 10 en la que cada fallo resta un tercio de acierto (un sexto en las autoevaluaciones de 10 preguntas). Al terminar hay un repaso filtrable, se pueden repetir las falladas u omitidas y exportar el resumen.

## Estructura

- `index.html`, `styles.css`, `app.js`: página de inicio (botonera de asignaturas, lanzador con desplegables y unidades desplegables).
- `examen.html`: página de examen (`examen.html?u=M1_U01&t=1|2|azar|oficial|fallos`).
- `comun.js`: utilidades compartidas (barajado, notas y fallos guardados).
- `data/indice.js`: módulos y unidades; `listas` indica qué unidades están publicadas.
- `data/Mx_Uyy.js`: preguntas de cada unidad. La primera opción de `r` es la correcta (la web baraja las opciones en cada intento) y `e` es la explicación.
- `data/Mx_Uyy_oficial.js`: autoevaluación oficial de la unidad. `o` son las opciones en su orden original y `c` el índice de la correcta (las opciones tipo «Todas/Ninguna/Las anteriores» no se barajan). `data/indice.js` → `oficiales` indica qué unidades la tienen.

Material de estudio no oficial.
