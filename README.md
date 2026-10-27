# GEIFEM – Landing provisional

Página estática (HTML + CSS, sin build) que reemplaza temporalmente geifem.com mientras el hosting está suspendido.

## Contenido

- `index.html`: la página completa (CSS en `<style>`, JS mínimo).
- `politica-de-privacidad/index.html`: ruta pública para Meta/WhatsApp. **Pendiente: pegar el texto vigente (Ley 1581 de 2012).**
- `img/`: logo original (WebP con transparencia) e ilustraciones SVG de apoyo.
- `favicon.png`, `og-image.png` (1200x630).

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
