FIGMA PROMPT — myMEDLIFE Role-Based Login + Separate App Shells

Design the myMEDLIFE entry experience as a role-based platform with distinct app shells, not one generic app with slightly different content.

Core concept

myMEDLIFE is one shared platform with:

* one database
* one authentication system
* one user profile system
* one permissions engine

But after login, users enter different role-specific app experiences.

The product should feel like multiple connected apps under one myMEDLIFE platform:

1. General Member App
2. Student Leader App
3. Sales Coach / Sales Staff Command Center
4. Non-Sales Staff Workspace
5. DS Admin Backend
6. Super Admin Backend
7. SLT Prep area for eligible travelers

Login page concept

Create a clean myMEDLIFE login page that visually communicates:

“Choose your myMEDLIFE workspace”

Login options/cards:

* General Member
* Student Leader
* Sales Coach / Sales Staff
* Staff
* Data Solutions / Admin
* Super Admin

Each card should show:

* role name
* short description
* icon
* “Sign in” button

Important:
These cards do not create separate databases. They are entry points into different app shells.

After authentication, the system verifies the user’s real role and routes them to the correct shell. If someone clicks the wrong card, they should be redirected to their correct workspace or shown “You do not have access to this workspace.”

App shell principle

Each role should have a different navigation structure, homepage, and visual hierarchy.

Do not design one universal sidebar with every feature hidden or disabled.

Each app shell should feel purpose-built.

General Member App

Figma reference:
https://www.figma.com/make/YeIALD6FoYqw2G1YDdbMgl/myMEDLIFE-App-Prototype?t=V5WFjapW4nspFW7m-20&fullscreen=1

Mobile-first.

Shows:

* home
* assigned actions
* events
* campaigns
* points
* leaderboard
* evidence submission
* profile
* SLT Prep card if eligible

Does not show:

* staff dashboard
* DS backend
* API keys
* SOP Builder
* permission editor

Student Leader App

Figma reference:
https://www.figma.com/make/UDgMuThad6xaGMRQRUU62Q/Student-Leadership-Command-Center?t=zWrNngM5n1hvWAiO-20&fullscreen=1

Desktop/tablet-first.

Shows:

* chapter dashboard
* members
* committees
* events
* action assignments
* attendance
* evidence review
* chapter points
* campaign progress
* fundraising
* SLT summary
* leadership pipeline

Scope:
own chapter only.

Sales Coach / Sales Staff Command Center

Figma reference:
https://www.figma.com/make/TvdEhnGhbT70YyqHT4p3J8/Staff-Command-Center-Dashboard?t=V5WFjapW4nspFW7m-20&fullscreen=1

Desktop-first.

Shows:

* coach portfolio
* chapter health
* campaign readiness
* risk flags
* validation tasks
* coach notes
* chapter performance
* attendance/points/event reporting
* best practices
* staff review queues

Sales Coach scope:
assigned portfolio only.

Sales Admin scope:
sales/chapter reporting scope.

Non-Sales Staff Workspace

This should be visually related to the Staff Command Center but not identical to the Sales Coach surface.

Shows:

* approved department dashboards
* review queues
* content/proof review where applicable
* campaign visibility where permitted
* reporting relevant to department scope

Does not show:

* sales-only controls
* DS backend
* API keys
* raw secret settings

DS Admin Backend

No final Figma reference yet unless provided.

Design as a secure internal backend.

Shows:

* users
* roles
* permissions
* committees
* Campaign SOP Builder
* API keys / integrations
* MCP settings
* provider connection status
* audit logs
* automation outbox
* feature flags
* system health

Security feel:

* restricted
* locked
* step-up authentication area
* audit-heavy
* no student-style navigation

Super Admin Backend

Similar to DS Admin Backend, but with breakglass/full-platform access.

Must clearly show:

* dangerous actions
* audit warnings
* environment controls
* production/staging distinction
* emergency disable tools

Staff impersonation / preview requirement

Staff and admins need the ability to preview what end users see.

Design an “Experience Preview” or “View As” tool inside Staff/Admin.

This is not true impersonation by default. It is a safe preview mode.

Preview options:

* View as General Member
* View as Action Committee Member
* View as Committee Chair
* View as Chapter President
* View as Sales Coach
* View as Traveler with SLT Prep

Preview must clearly display a banner:
“You are previewing this experience. No actions will be submitted.”

If true impersonation is ever allowed, it must require Super Admin, step-up authentication, reason for access, and full audit log.

Visual implementation rule

Figma is both workflow map and visual reference.

Design each role-based shell to match the intended Figma experience:

* layout
* navigation
* responsive behavior
* cards
* tables
* tabs
* drawers
* modals
* forms
* buttons
* badges
* progress states
* colors
* typography
* spacing
* hierarchy
* empty states
* loading states
* access-denied states

The final product should look like role-specific myMEDLIFE workspaces, not one generic dashboard template.