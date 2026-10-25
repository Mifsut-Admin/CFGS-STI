# CFGS STI · Tests de práctica

Web de estudio para el ciclo formativo de grado superior **Sistemas de Telecomunicaciones e Informáticos**.

Cada unidad tiene **60 preguntas** tipo test elaboradas a partir del temario, repartidas en dos exámenes de 30, más un modo aleatorio y un repaso de las preguntas falladas. Cada respuesta incluye una explicación pensada para aprender del error.

## Módulos

| Módulo | Unidades |
|---|---|
| Configuración de infraestructuras de sistemas de telecomunicaciones | 9 |
| Elementos de sistemas de telecomunicaciones | 6 |
| Gestión de proyectos de instalaciones de telecomunicaciones | 8 |
| Itinerario personal para la empleabilidad I | 9 |

## Uso

Es una web estática sin dependencias: abre `index.html` en el navegador o publícala con GitHub Pages (Settings → Pages → rama `main`, carpeta raíz).

Las notas y la lista de preguntas falladas se guardan en el navegador de cada persona.

## Estructura

- `index.html`, `styles.css`, `app.js`: la aplicación.
- `data/indice.js`: módulos y unidades; `listas` indica qué unidades están publicadas.
- `data/Mx_Uyy.js`: preguntas de cada unidad. La primera opción de `r` es la correcta (la web baraja las opciones en cada intento) y `e` es la explicación.

Material de estudio no oficial.
