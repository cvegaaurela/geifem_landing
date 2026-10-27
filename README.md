# GEIFEM – Landing provisional

Página estática (HTML + CSS, sin build) que reemplaza temporalmente geifem.com mientras el hosting está suspendido.

## Contenido

- `index.html`: la página (contenido, SEO y datos estructurados JSON-LD). Sin build.
- Estilos, en este orden de carga: `luxury.css` (tipografía fina y formas), `light.css` (tema blanco con azul y dorado de marca), `motion.css` (efectos de movimiento) y `mobile.css` (ajustes de móvil, siempre al final).
- Scripts: `motion.js` (revelados, texto cinético, tilt, banda en movimiento) y `luxury.js` (logo y escenas de partículas en canvas).
- `politica-de-privacidad/index.html`: ruta pública para Meta/WhatsApp. **Pendiente: pegar el texto vigente (Ley 1581 de 2012).**
- `img/`: logos (WebP con transparencia) e ilustraciones SVG.
- `favicon.png`, `og-image.png` (1200x630).
- SEO: `robots.txt`, `sitemap.xml`. Caché y cabeceras: `_headers` (Netlify y Cloudflare Pages).

## Fotos y trabajos realizados

- `img/colombia/`: fotos de Unsplash (uso comercial permitido, sin atribución obligatoria) en WebP, de ~40–110 KB. Se usan en el mosaico de clientes, en "Cuatro líneas de solución", en "El punto de partida" y en "Formación". Si se reemplazan, mantener contexto colombiano y el mismo recorte (3:2 o 4:3).
- `trabajos.css` y `trabajos.js`: carrusel 3D de "Trabajos realizados" (Motion). Con JS carga `vendor/motion.mjs` solo cuando la sección está cerca; sin JS o con "reducir movimiento" queda una rejilla estática.
- Los sectores del carrusel no llevan país, fechas ni años de relación, a propósito.

## Pendiente: humanizar el sitio

Ya hecho: fotos en soluciones, punto de partida, formación y clientes; textos más cercanos en punto de partida, metodología, planes y contacto; mensajes de WhatsApp en tono natural; hero con una foto de fondo muy sutil (`img/colombia/hero.webp`, calle de Salento, capa `.hero-photo` en `light.css`) y la línea "Hablamos contigo, no con un formulario".

"Nosotros" ya tiene la foto del director general (`img/director.webp`) y una cita en primera persona del plural, tono corporativo y cercano (borrador: confirmar o reescribir). Si se suma más equipo, repetir el patrón `.dir-fig`.

Anotado, falta material real del cliente:

1. **Testimonios:** al menos una cita corta de un cliente real, aunque sin nombre completo. Debe ser una frase real, no inventada.
2. **Contacto:** añadir nombre de quien responde, horario y tiempo de respuesta (hoy no se promete ninguno porque no están confirmados).
3. **Microcopy:** repasar el resto de títulos y botones con tono directo ("te acompañamos", "tu equipo").

## Probar en local

Hay que servir la carpeta por HTTP (en `file://` el logo de partículas cae a la imagen estática):

```
python -m http.server 5190
```

Y abrir `http://127.0.0.1:5190/`.

## Accesibilidad y movimiento

Si el visitante tiene activada la opción "reducir movimiento", no se carga ninguna animación ni las partículas: ve el logo estático y las escenas como lista.

## Paleta

Blanco `#fff`, azul marino `#00305B`, azul `#054387`, hielo `#eaf2fb`, dorado `#C19844` / `#E6C887` y dorado para texto `#8a6420`.

## Cambiar número o mensajes de WhatsApp

Todo está en la constante `GEIFEM_WA` al final de `index.html` (número, mensaje general y plantillas por línea y plan). Los enlaces tienen un `href` de respaldo con el número, así que si cambias el número, actualiza también `573007239228` en esos `href` (búsqueda y reemplazo).

## Desplegar

### Cloudflare Pages
1. Entra a dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Nombre del proyecto: `geifem`. Arrastra la carpeta `geifem-landing` y pulsa **Deploy**.
3. En el proyecto: **Custom domains** → **Set up a custom domain** → `www.geifem.com` (repite con `geifem.com`).
4. Si el DNS del dominio ya está en Cloudflare, el registro se crea solo. Si no, en el proveedor del dominio crea un `CNAME` de `www` hacia `geifem.pages.dev` (o cambia los nameservers a Cloudflare).

### Netlify
1. Entra a app.netlify.com/drop y arrastra la carpeta `geifem-landing`.
2. **Domain management** → **Add a domain** → `geifem.com`.
3. En el proveedor del dominio: `CNAME` de `www` hacia `<tu-sitio>.netlify.app` y registro `A` de `@` hacia `75.2.60.5` (o usa Netlify DNS).
4. Activa HTTPS (certificado gratuito) y fija `www.geifem.com` como dominio principal.

## Después de publicar

- Abre `https://www.geifem.com/politica-de-privacidad/` y confirma que carga.
- Prueba el botón de WhatsApp desde un celular.
- Comparte la URL en WhatsApp o en un depurador de Open Graph para confirmar la vista previa.
