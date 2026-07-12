# Requirements Document

## Introduction

AssetFlow Enterprise is the complete frontend for an ERP platform that enables organisations to track, allocate,
and maintain physical assets and shared resources. The application is built on the existing Next.js 16 App Router
scaffold and extends the current auth / users skeleton with ten fully-featured modules: Dashboard, Organisation
Setup, Asset Registration, Asset Allocation & Transfer, Resource Booking, Maintenance Management, Asset Audit,
Reports & Analytics, and Activity Logs & Notifications. All modules are delivered as a dark-themed, mobile-first,
accessible, role-aware single-page-style frontend that integrates with a REST API backend.

---

## Glossary

- **AssetFlow**: The frontend Next.js application being specified.
- **API**: The REST backend (base URL from `NEXT_PUBLIC_API_BASE_URL`).
- **Session**: Cookie-based auth state managed by `lib/session.ts`; contains `access_token`, `user_role`, `user_id`.
- **Admin**: User role with full organisational control.
- **Asset_Manager**: User role responsible for asset lifecycle and maintenance approvals.
- **Department_Head**: User role with visibility and approval rights scoped to their department.
- **Employee**: Default role granted on registration; can view own assets, book resources, raise maintenance requests.
- **Asset**: A tracked physical item with a unique auto-generated tag (format `AF-XXXX`).
- **Asset_Tag**: Auto-generated identifier in the format `AF-XXXX` (e.g. `AF-0001`).
- **Lifecycle_Status**: One of: `Available`, `Allocated`, `Reserved`, `Under_Maintenance`, `Lost`, `Retired`, `Disposed`.
- **Resource**: A bookable asset (flagged `bookable = true`).
- **Booking**: A time-bounded reservation of a Resource by a user.
- **Transfer_Request**: A workflow to move an Allocated asset from one holder to another.
- **Maintenance_Request**: A reported issue that triggers a maintenance workflow.
- **Audit_Cycle**: A bounded scope-and-date-range exercise in which auditors verify asset presence and condition.
- **Discrepancy**: An asset marked `Missing` or `Damaged` during an Audit_Cycle.
- **KPI_Card**: A dashboard summary tile showing a single numeric metric.
- **Skeleton_Loader**: A pulsing placeholder rendered while data is loading, built with `components/ui/Skeleton`.
- **RBAC**: Role-based access control — every page and action is gated by the user's role stored in the Session.
- **Dark_Theme**: The design system's base colour palette (slate-900 background, slate-100 text, indigo-500 accent).

---

## Requirements

---

### Requirement 1 — Design System & Dark Theme

**User Story:** As any user, I want a visually consistent dark-themed interface across all screens, so that the
application is easy to read, has professional appearance, and respects the established colour palette.

#### Acceptance Criteria

1. THE AssetFlow SHALL apply a dark-theme base palette (`bg-slate-900` body, `bg-slate-800` cards,
   `text-slate-100` primary text, `text-slate-400` secondary text, `indigo-500/600` accent) across every page.
2. THE AssetFlow SHALL extend `globals.css` with the dark-theme CSS variables and override the existing
   `--background` / `--foreground` tokens to reflect the dark palette.
3. THE AssetFlow SHALL preserve the three-colour semantic mapping (Indigo = primary action, Slate = neutral,
   Rose = destructive) from the existing design system.
4. THE AssetFlow SHALL deliver all UI components (buttons, inputs, badges, alerts, skeletons) with dark-theme
   variants matching the new palette without breaking the existing component API.
5. WHEN a viewport is between 320 px and 767 px wide, THE AssetFlow SHALL render all layouts in a single-column
   stacked arrangement with a bottom-sheet or drawer navigation.
6. WHEN a viewport is 768 px or wider, THE AssetFlow SHALL render a fixed 240 px-wide sidebar and a content area
   that occupies the remaining viewport width.
7. THE AssetFlow SHALL meet WCAG 2.1 AA colour-contrast requirements for all text rendered on dark backgrounds.

---

### Requirement 2 — Sidebar Navigation & RBAC Routing

**User Story:** As any authenticated user, I want a role-aware sidebar that shows only the sections I am
permitted to access, so that I can navigate efficiently without encountering unauthorised pages.

#### Acceptance Criteria

1. THE Sidebar SHALL display navigation items according to the following RBAC matrix:

   | Route                   | Admin | Asset_Manager | Department_Head | Employee |
   |-------------------------|-------|---------------|-----------------|----------|
   | /dashboard              | ✓     | ✓             | ✓               | ✓        |
   | /dashboard/org-setup    | ✓     |               |                 |          |
   | /dashboard/assets       | ✓     | ✓             | ✓               | ✓        |
   | /dashboard/allocations  | ✓     | ✓             | ✓               |          |
   | /dashboard/bookings     | ✓     | ✓             | ✓               | ✓        |
   | /dashboard/maintenance  | ✓     | ✓             | ✓               | ✓        |
   | /dashboard/audits       | ✓     | ✓             |                 |          |
   | /dashboard/reports      | ✓     | ✓             |                 |          |
   | /dashboard/logs         | ✓     |               |                 |          |

2. WHEN an unauthenticated user navigates to any `/dashboard/*` route, THE AssetFlow SHALL redirect the user to
   `/login`.
3. WHEN an authenticated user navigates to a route outside their RBAC matrix, THE AssetFlow SHALL render a
   403 Forbidden page with a "Go to Dashboard" link.
4. THE Sidebar SHALL highlight the active route using `aria-current="page"` and a visible active-state style.
5. WHEN a mobile user taps the hamburger menu icon, THE Sidebar SHALL open as a full-height drawer from the left
   with a backdrop overlay.
6. WHEN a mobile user taps outside the drawer or a navigation link, THE Sidebar SHALL close.
7. THE Sidebar SHALL display the authenticated user's name, role badge, and an avatar initial derived from the
   user's name.

---

### Requirement 3 — Dashboard / Home (Screen 2)

**User Story:** As any authenticated user, I want a dashboard home screen that shows the current state of assets
and upcoming actions, so that I can understand the org's asset health at a glance and act on urgent items
immediately.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL render six KPI_Cards in a responsive grid (2-column on mobile, 3-column on ≥768 px):
   Assets Available, Assets Allocated, Maintenance Today, Active Bookings, Pending Transfers, Upcoming Returns.
2. WHEN the API returns data with overdue allocations, THE Dashboard_Page SHALL render a dismissible warning
   banner above the KPI grid listing the count of overdue returns.
3. THE Dashboard_Page SHALL render three Quick_Action buttons: "Register Asset", "Book Resource", and
   "Raise Maintenance Request", each navigating to the respective module entry flow.
4. WHEN the user's role is `Employee`, THE Dashboard_Page SHALL hide the "Register Asset" quick action.
5. THE Dashboard_Page SHALL render a Recent_Activity feed showing the 10 most recent log entries with
   relative timestamps (e.g. "2 min ago").
6. WHEN the Dashboard API request is in flight, THE Dashboard_Page SHALL render Skeleton_Loader placeholders
   for each KPI_Card and each activity row.
7. IF the Dashboard API request fails, THEN THE Dashboard_Page SHALL display an inline error message with a
   Retry button.
8. THE Dashboard_Page SHALL refresh KPI data automatically every 60 seconds without a full page reload.

---

### Requirement 4 — Organisation Setup (Screen 3, Admin only)

**User Story:** As an Admin, I want to manage departments, asset categories, and the employee directory from a
single tabbed screen, so that I can keep the org's structure and personnel records accurate.

#### Acceptance Criteria

1. THE Org_Setup_Page SHALL be accessible only to users with role `Admin`; all other roles SHALL be redirected
   to the 403 page.
2. THE Org_Setup_Page SHALL render three tabs: "Departments", "Asset Categories", and "Employee Directory".
3. WHEN the "Departments" tab is active, THE Org_Setup_Page SHALL display a table of departments with columns:
   Name, Head, Parent Department, Status, and Actions (Edit / Deactivate).
4. WHEN an Admin submits the Create Department form with a valid name, THE Org_Setup_Page SHALL POST to the API,
   optimistically append the new department to the table, and display a success toast.
5. IF the Create Department API call fails, THEN THE Org_Setup_Page SHALL revert the optimistic update and
   display an inline error.
6. WHEN an Admin deactivates a department, THE Org_Setup_Page SHALL prompt for confirmation before sending the
   PATCH request.
7. WHEN the "Asset Categories" tab is active, THE Org_Setup_Page SHALL display a table of categories with
   columns: Name, Custom Fields, and Actions (Edit / Delete).
8. WHEN an Admin creates an Asset Category, THE Org_Setup_Page SHALL allow the Admin to define zero or more
   custom fields (name + type: text | number | date | boolean).
9. WHEN the "Employee Directory" tab is active, THE Org_Setup_Page SHALL display a table with columns: Name,
   Email, Department, Role, Status, and Actions.
10. WHEN an Admin changes an Employee's role via the directory, THE Org_Setup_Page SHALL send a PATCH request and
    update the displayed role without a full page reload.
11. THE Org_Setup_Page SHALL support search-by-name filtering on all three tabs with results filtered client-side
    within 200 ms of the last keystroke.

---

### Requirement 5 — Asset Registration & Directory (Screen 4)

**User Story:** As an Asset_Manager or Admin, I want to register new assets and browse the asset directory with
rich filtering, so that every physical item in the organisation is accounted for and quickly findable.

#### Acceptance Criteria

1. THE Asset_Directory_Page SHALL display a searchable, filterable table with columns: Asset_Tag, Name,
   Category, Lifecycle_Status, Location, Department, and Actions.
2. THE Asset_Directory_Page SHALL support filter chips for: Category, Lifecycle_Status, Department, Location;
   multiple chips SHALL combine as AND filters applied client-side.
3. WHEN a user enters text in the search bar, THE Asset_Directory_Page SHALL filter rows by Asset_Tag, serial
   number, or name within 200 ms of the last keystroke.
4. WHEN an Asset_Manager or Admin opens the Register Asset form, THE AssetFlow SHALL auto-generate an
   Asset_Tag in the format `AF-XXXX` where XXXX is the next sequential four-digit number.
5. THE Asset_Registration_Form SHALL collect: name (required), category (required), serial number (optional),
   acquisition date (required), acquisition cost (required, numeric ≥ 0), condition (required: New | Good |
   Fair | Poor), location (required), department (optional), photo upload (optional, max 5 MB, JPEG/PNG/WEBP),
   document upload (optional, max 10 MB, PDF), and bookable flag (boolean).
6. WHEN the Asset_Registration_Form is submitted with valid data, THE AssetFlow SHALL POST to the API, navigate
   to the newly created asset's detail page, and display a success toast.
7. IF the Asset_Registration_Form is submitted with missing required fields, THEN THE AssetFlow SHALL display
   inline field-level error messages without submitting to the API.
8. WHEN a user opens an asset detail page, THE AssetFlow SHALL display the asset's full metadata, current
   Lifecycle_Status badge, and two history tabs: "Allocation History" and "Maintenance History".
9. THE Asset_Directory_Page SHALL paginate results at 25 rows per page with next/previous controls.

---

### Requirement 6 — Asset Allocation & Transfer (Screen 5)

**User Story:** As an Asset_Manager, Department_Head, or Admin, I want to allocate assets to employees or
departments and manage the full transfer and return lifecycle, so that every asset has a known, current holder.

#### Acceptance Criteria

1. WHEN an authorised user opens the Allocate Asset form for an asset with Lifecycle_Status `Available`, THE
   AssetFlow SHALL render a form with fields: Asset (searchable select), Assignee (employee or department,
   searchable select), and Expected Return Date (optional date picker).
2. WHEN an authorised user attempts to allocate an asset with Lifecycle_Status other than `Available`, THE
   AssetFlow SHALL display a conflict alert banner showing the current holder's name and a "Request Transfer"
   button instead of the allocation form.
3. WHEN an authorised user submits a Transfer_Request, THE AssetFlow SHALL POST to the API with status
   `Requested` and add the request to the Pending Transfers count on the Dashboard.
4. WHEN an Asset_Manager or Admin approves a Transfer_Request, THE AssetFlow SHALL PATCH the request status
   to `Approved` and update the asset's Lifecycle_Status to `Allocated` with the new holder.
5. WHEN a user marks an asset as returned, THE AssetFlow SHALL present a condition notes text area, PATCH the
   allocation status to `Returned`, and update the asset's Lifecycle_Status to `Available`.
6. THE Allocation_Page SHALL display an "Overdue" badge on any allocation where the current date exceeds the
   Expected Return Date.
7. WHEN an allocation becomes overdue, THE AssetFlow SHALL surface a notification in the Activity Log and
   increment the Overdue Returns count on the Dashboard.
8. THE Allocation_Page SHALL display an allocation history table with columns: Asset, Holder, Start Date,
   Expected Return, Actual Return, Status.

---

### Requirement 7 — Resource Booking (Screen 6)

**User Story:** As any authenticated user, I want to book shared resources through a calendar interface with
overlap validation, so that no two users hold the same resource at the same time.

#### Acceptance Criteria

1. THE Booking_Page SHALL render a Resource selector (searchable dropdown limited to assets with `bookable =
   true`) and a day-timeline calendar view showing all existing bookings for the selected resource.
2. WHEN a user selects a date-time range for a booking, THE AssetFlow SHALL validate the range against existing
   bookings: a new booking is invalid if its start time is before an existing booking's end time AND its end time
   is after that booking's start time.
3. IF a selected booking range overlaps an existing booking, THEN THE AssetFlow SHALL display a conflict
   indicator on the calendar slot and disable the submit button.
4. WHEN a user submits a valid booking, THE AssetFlow SHALL POST to the API and render the new booking on the
   calendar with status `Upcoming`.
5. WHEN a booking's start time is reached, THE AssetFlow SHALL update the booking's displayed status to
   `Ongoing`.
6. WHEN a user cancels a booking with status `Upcoming`, THE AssetFlow SHALL prompt for confirmation, PATCH
   the booking status to `Cancelled`, and remove the slot from the calendar view.
7. WHEN a user reschedules a booking, THE AssetFlow SHALL present the existing time values pre-filled in the
   booking form and re-validate for overlaps before PATCHing.
8. THE Booking_Page SHALL display a booking status legend: Upcoming (indigo), Ongoing (green), Completed
   (slate), Cancelled (rose).

---

### Requirement 8 — Maintenance Management (Screen 7)

**User Story:** As any user, I want to raise maintenance requests and track their progress through a Kanban
board, so that asset issues are resolved transparently and asset statuses stay accurate.

#### Acceptance Criteria

1. THE Maintenance_Page SHALL render a Kanban board with five columns: Pending, Approved, Technician_Assigned,
   In_Progress, Resolved.
2. WHEN any authenticated user raises a Maintenance_Request, THE AssetFlow SHALL render a form with fields:
   Asset (searchable select), Issue Description (required, min 10 characters), Priority (Low | Medium | High |
   Critical), and optional photo attachment (max 5 MB, JPEG/PNG/WEBP).
3. WHEN an Asset_Manager or Admin approves a Maintenance_Request, THE AssetFlow SHALL PATCH the request status
   to `Approved` and automatically PATCH the related asset's Lifecycle_Status to `Under_Maintenance`.
4. WHEN an Asset_Manager or Admin rejects a Maintenance_Request, THE AssetFlow SHALL PATCH the request status
   to `Rejected` and leave the asset's Lifecycle_Status unchanged.
5. WHEN a Maintenance_Request is marked `Resolved`, THE AssetFlow SHALL automatically PATCH the related asset's
   Lifecycle_Status to `Available`.
6. THE Maintenance_Page SHALL support drag-and-drop card movement between adjacent columns for users with
   Asset_Manager or Admin role; Employee and Department_Head users SHALL see read-only Kanban cards.
7. WHEN a maintenance card is moved via drag-and-drop, THE AssetFlow SHALL PATCH the status immediately and
   revert the card to its previous column if the API call fails.
8. WHEN a Kanban card is expanded, THE AssetFlow SHALL display the full issue description, asset details,
   requester name, priority badge, and photo thumbnail if an attachment exists.

---

### Requirement 9 — Asset Audit (Screen 8)

**User Story:** As an Admin or Asset_Manager, I want to create and manage audit cycles, so that physical assets
are periodically verified and discrepancies are formally recorded and resolved.

#### Acceptance Criteria

1. THE Audit_Page SHALL display a list of all Audit_Cycles with columns: Name, Scope (dept/location), Date
   Range, Auditors, Status (Open | Closed), and Actions.
2. WHEN an Admin creates an Audit_Cycle, THE AssetFlow SHALL collect: cycle name, scope type (Department or
   Location), scope value (select), start date, end date, and assign one or more auditors from the employee list.
3. WHEN an auditor opens an Audit_Cycle, THE AssetFlow SHALL display a checklist table of all in-scope assets
   with columns: Asset_Tag, Name, Category, Current Status, and Audit Result (Verified | Missing | Damaged |
   Pending).
4. WHEN an auditor marks an asset as `Missing` or `Damaged`, THE AssetFlow SHALL add the asset to the
   Discrepancy Report section and display a discrepancy count banner.
5. WHEN an Admin closes an Audit_Cycle, THE AssetFlow SHALL prompt for confirmation, lock the cycle
   (no further changes), PATCH all confirmed-missing assets to Lifecycle_Status `Lost`, and PATCH all
   Damaged assets to Lifecycle_Status `Available` with a condition note.
6. THE Audit_Page SHALL retain all closed Audit_Cycle records with their full checklist and discrepancy history
   for audit trail purposes.
7. WHEN an Audit_Cycle is closed, THE AssetFlow SHALL generate and allow download of a PDF or CSV discrepancy
   report.

---

### Requirement 10 — Reports & Analytics (Screen 9)

**User Story:** As an Admin or Asset_Manager, I want visual reports and exportable data, so that I can make
informed decisions about asset utilisation, maintenance schedules, and department allocations.

#### Acceptance Criteria

1. THE Reports_Page SHALL render the following charts:
   a. Bar chart: Asset utilisation by department (% time allocated vs. available per dept).
   b. Line chart: Maintenance frequency over time (requests per week for the selected date range).
   c. Horizontal bar chart: Top 5 most-used vs. top 5 idle assets.
   d. Heat-map calendar: Resource booking density per day/hour.
2. THE Reports_Page SHALL render a Department Allocation Summary table with columns: Department, Total Assets,
   Allocated, Available, Under_Maintenance.
3. THE Reports_Page SHALL render an Assets Due list: assets whose last maintenance date exceeds 180 days and
   assets within 30 days of a user-defined retirement date.
4. WHEN a user selects a date-range filter on the Reports_Page, THE AssetFlow SHALL re-fetch all chart and
   table data for the selected range.
5. WHEN a user clicks "Export", THE Reports_Page SHALL download the currently displayed report data as a CSV
   file containing all rows visible in the summary tables.
6. WHEN the Reports API request is in flight, THE Reports_Page SHALL render Skeleton_Loader placeholders for
   each chart area.

---

### Requirement 11 — Activity Logs & Notifications (Screen 10)

**User Story:** As any authenticated user, I want to view a feed of notifications and a full audit log of
system actions, so that I am kept informed about events relevant to my role and all changes are traceable.

#### Acceptance Criteria

1. THE Logs_Page SHALL render a notification feed with filter tabs: All, Alerts, Approvals, Bookings.
2. THE Logs_Page SHALL support the following notification types, each with a colour-coded icon:
   Asset Assigned (indigo), Maintenance Approved (green), Maintenance Rejected (rose), Booking Confirmed
   (indigo), Booking Cancelled (rose), Booking Reminder (amber), Transfer Approved (green), Overdue Return
   Alert (rose), Audit Discrepancy Flagged (amber).
3. WHEN a notification is unread, THE Logs_Page SHALL render a filled dot indicator on the notification row.
4. WHEN a user clicks a notification, THE AssetFlow SHALL mark it as read via a PATCH request and navigate to
   the relevant resource page.
5. THE Logs_Page SHALL display relative timestamps (e.g. "5 min ago") that update every 60 seconds without a
   page reload.
6. WHEN the user's role is `Admin`, THE Logs_Page SHALL additionally render a full Admin_Audit_Log section
   below the notifications, showing all system actions with columns: Timestamp, Actor, Action, Entity,
   Entity ID, and IP Address.
7. THE Navbar SHALL display an unread notification count badge that updates every 60 seconds.
8. WHEN the unread notification count exceeds 99, THE Navbar SHALL display "99+" in the badge.

---

### Requirement 12 — Authentication & Session Management (Extension of existing auth)

**User Story:** As any user, I want secure, seamless authentication with clear error feedback, so that I can
access the system confidently and my session is protected.

#### Acceptance Criteria

1. THE AssetFlow SHALL retain the existing `useActionState`-based login and register forms and extend them
   with dark-theme styling.
2. THE Login_Page SHALL include a "Forgot Password" link that navigates to `/forgot-password` and renders a
   password-reset request form.
3. WHEN a user submits the Forgot Password form with a valid email, THE AssetFlow SHALL POST to
   `/api/auth/forgot-password` and display a confirmation message regardless of whether the email exists (to
   prevent user enumeration).
4. WHEN the session token stored in the `access_token` cookie is expired or absent, THE AssetFlow SHALL
   attempt a silent refresh via `POST /api/auth/refresh`; IF the refresh fails, THEN THE AssetFlow SHALL
   redirect the user to `/login`.
5. THE Register_Page SHALL only allow creation of `Employee` accounts; the role field SHALL be omitted from
   the registration form.
6. WHEN a register or login action succeeds, THE AssetFlow SHALL redirect Admins to `/dashboard`, all other
   roles to `/dashboard` (landing on the full KPI dashboard, not the profile stub).

---

### Requirement 13 — Performance & Code Quality

**User Story:** As a developer and end-user, I want the application to load quickly and maintain a clean
codebase, so that user experience is smooth and the frontend is maintainable long-term.

#### Acceptance Criteria

1. THE AssetFlow SHALL use dynamic imports (`next/dynamic`) to code-split each of the ten module pages so that
   the initial JS bundle for any route excludes code for other routes.
2. WHEN a page component is loading via dynamic import, THE AssetFlow SHALL render a full-page Skeleton_Loader
   composed of the existing `Skeleton` component.
3. THE AssetFlow SHALL place all REST API calls within `lib/api.ts` following the existing `request()` helper
   pattern; no `fetch` calls SHALL appear outside `lib/api.ts` or designated Server Actions.
4. THE AssetFlow SHALL co-locate each module's Server Actions in `lib/actions/{module}.ts` (e.g.
   `lib/actions/assets.ts`, `lib/actions/bookings.ts`).
5. THE AssetFlow SHALL define all domain model TypeScript interfaces in `lib/types.ts` with no use of `any`.
6. THE AssetFlow SHALL validate all user-submitted form data in the corresponding Server Action before making
   any API call, returning typed field-level errors matching the pattern in `lib/validations.ts`.
7. THE AssetFlow SHALL sanitise all string inputs rendered as HTML by relying on React's default JSX escaping;
   no `dangerouslySetInnerHTML` SHALL be used without explicit sanitisation.

---

### Requirement 14 — Error Handling & Feedback

**User Story:** As any user, I want clear, actionable feedback for every action I take, so that I always know
whether something succeeded, failed, or is in progress.

#### Acceptance Criteria

1. WHEN a Server Action returns a success response, THE AssetFlow SHALL display a toast notification in the
   top-right corner with the success message for 4 seconds.
2. WHEN a Server Action returns an error response, THE AssetFlow SHALL display an inline Alert component using
   the existing `components/ui/Alert` with the API-provided error message.
3. WHEN a network request is in flight, THE AssetFlow SHALL disable the triggering button and display the
   existing loading spinner from `components/ui/Button` (via `loading={true}`).
4. THE AssetFlow SHALL implement a global error boundary at the dashboard layout level that catches unhandled
   errors, renders a friendly error screen, and logs the error to the console.
5. IF a 401 Unauthorized response is received from the API, THEN THE AssetFlow SHALL clear the session cookies
   and redirect the user to `/login` with a `?reason=session_expired` query parameter.
6. WHEN the user lands on `/login?reason=session_expired`, THE Login_Page SHALL display a descriptive banner
   explaining the session has expired.
