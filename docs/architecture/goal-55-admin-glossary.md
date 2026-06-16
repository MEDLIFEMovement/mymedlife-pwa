# Goal 55: Admin Glossary

Goal 55 adds a plain-English glossary to `/admin`.

## What Changed

- Added definitions for local actor, mock data, browser write, external send,
  outbox, proof, RLS, and stakeholder review.
- Added an admin glossary panel.
- Added tests proving the glossary is visible to Admin, DS Admin, and Super
  Admin, and hidden from operating roles.

## Why

The review build now contains many safety and architecture terms. Non-coder
reviewers need simple language so they can tell the difference between local
MVP readiness and live launch readiness.

## Safety Boundary

This goal does not enable auth, writes, uploads, public proof sharing, external
sends, reminders, escalation packets, service workers, or production data.
