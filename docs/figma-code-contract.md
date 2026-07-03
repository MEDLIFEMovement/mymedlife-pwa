# Figma Code Contract

Use the raw Figma-generated code as the fixed visual contract for each
myMEDLIFE surface.

Do not redesign around it. Functional changes are allowed only when they are
required for routing, auth, accessibility, state, or maintainability, and they
should be documented here.

## Login Page

- Figma screen name: `Create mockups for text` login screen
- Source file/link:
  `/Users/codex/Desktop/Create mockups for text/src/app/App.tsx`
- Target route: `/login`
- App shell: unauthenticated entry
- Primary user role: all unauthenticated users
- Raw Figma code file path:
  `docs/figma-code/raw/login-page/App.tsx.txt`
- Supporting raw assets:
  - `docs/figma-code/raw/login-page/my-medlife-role-based-login.md`
  - `public/images/medlife-circle-logo.png`
- Components extracted:
  - login wordmark block
  - centered sign-in card
  - email field
  - password field
  - forgot-password text action
  - primary sign-in button
  - signed-in session card
- Tokens/colors used:
  - background `#0d1117`
  - card `#161b22`
  - accent `#b8253a`
  - muted text `#6b7280`
  - primary text `#f3f4f6`
  - font family `Plus Jakarta Sans`
- Implementation status: implemented
- Functional deviations:
  - The visual shell is taken from the raw Figma login screen, but the login
    route keeps backend-routed auth as the source of truth.
  - The older workspace-card/profile-picker concepts in the raw export are not
    used on `/login`; after sign-in the app routes from the authenticated role.
  - `Forgot password?` is present visually but remains a non-writing review
    placeholder for now.
  - Signed-in users see a session card styled inside the same visual system so
    they can continue or sign out without leaving the login route.

## Student Leadership Command Center

- Figma screen name: `Student Leadership Command Center`
- Source file/link:
  `/Users/codex/Downloads/Student Leadership Command Center/src/app/App.tsx`
- Target route: `/leader`
- App shell: `LeaderAppShell`
- Primary user role: chapter leaders and E-board
- Key visible contract:
  - `Chapter Home` left-rail entry
  - `Create Event` and `Assign Action` hero CTAs
  - lower quick actions:
    `Review Members`, `Assign Action`, `Promote Emerging Leader`,
    `Create Event`, `Share Bridge Video`
  - command-center nav:
    `Chapter Home`, `Leaderboard`, `Member Pipeline`, `Member Profile`,
    `Committees`, `Events`, `Impact`, `Bridge Videos`, `Succession`,
    `Feed Analytics`
- Implementation status: implemented on `/leader`
- Functional deviations:
  - The repo keeps the existing typed command-center service and route family,
    then fits the Figma structure on top of it instead of copying the generated
    prototype literally.
  - The shared desktop rail is hidden on `/leader` so the Figma command center
    can own its own left navigation without a second generic app menu.
  - `Assign Action` opens the existing leader-owned action flow rather than a
    static mock button.
  - Chapter detail, members, events, bridge-video review, and succession stay
    stateful and route-backed instead of remaining screenshot-only.

## Staff Command Center

- Figma screen name: `Staff Command Center Dashboard`
- Source file/link:
  `/Users/codex/Desktop/Staff Command Center Dashboard/src/app/App.tsx`
- Target route: `/staff`
- App shell: `StaffAppShell`
- Primary user role: coaches, sales staff, and staff-admin roles
- Key visible contract:
  - compact dark control strip with `myMEDLIFE` identity
  - eight command-center views:
    `Chapters`, `Campaigns`, `Proof / UGC`, `Feed Studio`,
    `Feed Analytics`, `HubSpot`, `Best Practices`, `Admin`
  - `Portfolio Overview` as the default first working surface
  - dense KPI band and portfolio filters above the chapter table
  - chapter-risk and decision posture expressed directly in the table
- Implementation status: implemented on `/staff`
- Functional deviations:
  - The repo keeps the existing typed staff command-center service and
    route-backed state, then renders the Figma-owned shell instead of copying
    the raw prototype one-to-one.
  - The shared desktop rail and shared top header are hidden on `/staff` so the
    Figma command center owns its own nav and top strip without a second
    generic app menu layered above it.
  - Coach actors can still open `/staff`, but the page forces the internal
    route base to stay on `/staff` so the shared workspace does not hop back to
    legacy `/coach` links.
  - Legacy launch-lane views such as `events` and `leaderboard` now cleanly
    park back into the owned staff command-center route family instead of
    rendering the older event-tracking shell.
