-- Remove the pre-metadata overloaded admin chapter RPC signature.
-- The expanded signature keeps trailing defaults, so existing nine-argument
-- SQL calls resolve without ambiguity while app calls can pass metadata fields.

drop function if exists app.admin_manage_chapter(
  text,
  uuid,
  text,
  text,
  text,
  text,
  uuid,
  text,
  text
);
