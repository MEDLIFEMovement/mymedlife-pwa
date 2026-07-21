-- Trigger functions run through their attached table triggers. They are not
-- client RPCs and must not be directly executable by API roles.

revoke execute on function app.enforce_assignment_update_bounds()
from public, anon, authenticated, service_role;

revoke execute on function app.enforce_chapter_event_update_bounds()
from public, anon, authenticated, service_role;

revoke execute on function app.enforce_membership_update_bounds()
from public, anon, authenticated, service_role;
