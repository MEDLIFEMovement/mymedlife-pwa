import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/leader",
  useSearchParams: () => new URLSearchParams(),
}));

describe("role shell wrappers", () => {
  it("keeps the leader shell framed as a command-center experience by default", async () => {
    const { LeaderAppShell } = await import("@/components/leader-app-shell");
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");

    const html = renderToStaticMarkup(
      <LeaderAppShell actor={actor}>
        <section>Leader shell content</section>
      </LeaderAppShell>,
    );

    expect(html).not.toContain("Leadership command center");
    expect(html).not.toContain("Student Leadership Command Center");
    expect(html).toContain("Leader shell content");
    expect(html).toContain("Leader navigation");
    expect(html).toContain("/leader?view=overview");
    expect(html).not.toContain("Preview role");
  });

  it("keeps the staff shell framed as its own command-center experience by default", async () => {
    const { StaffAppShell } = await import("@/components/staff-app-shell");
    const actor = getMockLocalActorContext("admin@mymedlife.test");

    const html = renderToStaticMarkup(
      <StaffAppShell actor={actor}>
        <section>Staff shell content</section>
      </StaffAppShell>,
    );

    expect(html).not.toContain("Staff command center");
    expect(html).not.toContain("Staff Command Center");
    expect(html).not.toContain("Staff surface");
    expect(html).toContain("Staff shell content");
    expect(html).toContain("Staff navigation");
    expect(html).toContain("/staff?view=chapters");
    expect(html).not.toContain("Preview role");
    expect(html).not.toContain("Browser only");
  });

  it("keeps the admin shell framed as the DS backend by default", async () => {
    const { AdminAppShell } = await import("@/components/admin-app-shell");
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");

    const html = renderToStaticMarkup(
      <AdminAppShell actor={actor}>
        <section>Admin shell content</section>
      </AdminAppShell>,
    );

    expect(html).not.toContain("DS admin backend");
    expect(html).not.toContain("DS Admin Backend");
    expect(html).not.toContain("DS backend");
    expect(html).toContain("Admin shell content");
    expect(html).toContain("Admin navigation");
    expect(html).toContain("/admin");
    expect(html).not.toContain("Preview role");
    expect(html).not.toContain("Browser only");
  });

  it("keeps the student shell mobile-first and hides the shared top header", async () => {
    const { StudentAppShell } = await import("@/components/student-app-shell");
    const actor = getMockLocalActorContext("member.a@mymedlife.test");

    const html = renderToStaticMarkup(
      <StudentAppShell actor={actor}>
        <section>Student shell content</section>
      </StudentAppShell>,
    );

    expect(html).not.toContain("General member app");
    expect(html).not.toContain("Leadership command center");
    expect(html).not.toContain("Staff command center");
    expect(html).toContain("Mobile quick navigation");
    expect(html).toContain("Student shell content");
  });
});
