# myMEDLIFE Production Approval Email Draft

Date: 2026-06-25

Status:
- review-only
- staging is review-ready, not live-ready yet

## Suggested Subject

myMEDLIFE launch review: remaining approval decisions needed

## To

Nick, Kiomi, DS, HQ ops

## Cc

Me

## English Draft

Hi everyone,

We are in the final review stage for myMEDLIFE, but we are **not live-ready yet**. The app is in review-ready staging, and the remaining work is to confirm the launch decisions below so we can keep the pilot controlled and safe.

Please confirm or replace only the fields you want to change:

1. Staging reviewer access path
   - Confirm the approved reviewer path for staging.
   - Confirm how reviewers should get through the current Vercel SSO handoff.

2. Pilot scope
   - Confirm the first pilot chapter.
   - Confirm the pilot cohort size.
   - Confirm the support / pause channel.

3. First hosted write
   - Approve `action_started` as the first hosted write, or name a narrower approved lane.
   - Confirm that external sends stay off.

4. Smallest proof/review loop
   - Confirm that the hosted loop is limited to proof metadata submission plus leader review readback.
   - Keep uploads, public proof, and broader HQ publishing off.

5. Production environment ownership
   - Confirm ownership for production Supabase, Vercel, domain/DNS, secrets, and backup / restore.

6. Monitoring and incident response
   - Confirm who owns alerting, backup, rollback, and incident handling for the pilot window.

7. External integration hold
   - Confirm HubSpot, Shopify, n8n, warehouse, Power BI, SMS, email, and AI stay off.
   - The only approved exception under review is the staging-only Luma event/RSVP/attendance/points loop.

If the current defaults are acceptable, a reply of `approved as written` is enough.
If something needs to change, please reply with only the fields you want updated.

Thanks,

Codex

## Spanish Draft

Hola a todos,

Estamos en la etapa final de revisión de myMEDLIFE, pero **todavía no estamos listos para salir en vivo**. La aplicación está en una versión de staging lista para revisión, y lo que falta es confirmar las decisiones de lanzamiento para mantener el piloto controlado y seguro.

Por favor confirmen o reemplacen solo los campos que quieran cambiar:

1. Ruta de acceso para revisores en staging
   - Confirmar la ruta aprobada para revisar staging.
   - Confirmar cómo deben pasar los revisores por el acceso actual de Vercel SSO.

2. Alcance del piloto
   - Confirmar el primer capítulo piloto.
   - Confirmar el tamaño del grupo piloto.
   - Confirmar el canal de soporte / pausa.

3. Primera escritura hospedada
   - Aprobar `action_started` como la primera escritura hospedada, o indicar una opción más limitada.
   - Confirmar que los envíos externos siguen desactivados.

4. Bucle mínimo de evidencia / revisión
   - Confirmar que el flujo hospedado se limita a envío de metadatos de evidencia + revisión del líder.
   - Mantener apagados los uploads, la publicación pública de evidencia y la publicación más amplia en HQ.

5. Propiedad del entorno de producción
   - Confirmar quién es responsable de Supabase de producción, Vercel, dominio/DNS, secretos y backup / restore.

6. Monitoreo e incident response
   - Confirmar quién es responsable de alertas, backup, rollback y manejo de incidentes durante el piloto.

7. Mantener integraciones apagadas
   - Confirmar que HubSpot, Shopify, n8n, warehouse, Power BI, SMS, email y AI siguen apagados.
   - La unica excepcion aprobada en revision es el flujo de Luma solo en staging para evento/RSVP/asistencia/puntos.

Si los valores por defecto funcionan, basta con responder `approved as written`.
Si algo debe cambiar, respondan solo con los campos que quieran actualizar.

Gracias,

Codex

## Notes

- This draft is intentionally review-only.
- It does not imply launch approval.
- It matches the current approval request and go / no-go matrix.
- It keeps the remaining ask small: reviewers can approve as written or edit only the fields they want changed.
