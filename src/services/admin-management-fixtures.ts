import type { ManagedChapter, ManagedUser } from "@/services/admin-management";

export const managedUserFixtures: ManagedUser[] = [
  {
    id: "user-sofia",
    name: "Sofia Alvarez",
    email: "sofia.alvarez@mymedlife.test",
    status: "active",
    chapterMemberships: [{ chapterId: "chapter-ucla", roleKey: "General Member" }],
    staffRoles: [],
    portfolioChapterIds: [],
    inviteStatus: "accepted",
  },
  {
    id: "user-casey",
    name: "Casey Chair",
    email: "casey.chair@mymedlife.test",
    status: "active",
    chapterMemberships: [
      { chapterId: "chapter-ucla", roleKey: "Action Committee Chair" },
    ],
    staffRoles: [],
    portfolioChapterIds: [],
    inviteStatus: "accepted",
  },
  {
    id: "user-priya",
    name: "Priya President",
    email: "priya.president@mymedlife.test",
    status: "active",
    chapterMemberships: [{ chapterId: "chapter-boston", roleKey: "President / VP" }],
    staffRoles: [],
    portfolioChapterIds: [],
    inviteStatus: "accepted",
  },
  {
    id: "user-cam",
    name: "Cam Coach",
    email: "cam.coach@mymedlife.test",
    status: "active",
    chapterMemberships: [],
    staffRoles: ["Coach"],
    portfolioChapterIds: ["chapter-ucla", "chapter-boston"],
    inviteStatus: "accepted",
  },
  {
    id: "user-sky",
    name: "Sky Sales Coach",
    email: "sky.sales@mymedlife.test",
    status: "active",
    chapterMemberships: [],
    staffRoles: ["Sales Coach"],
    portfolioChapterIds: ["chapter-ucla", "chapter-howard"],
    inviteStatus: "accepted",
  },
  {
    id: "user-gina",
    name: "Gina General Staff",
    email: "gina.staff@mymedlife.test",
    status: "active",
    chapterMemberships: [],
    staffRoles: ["General Staff"],
    portfolioChapterIds: [],
    inviteStatus: "accepted",
  },
  {
    id: "user-dee",
    name: "Dee Systems",
    email: "dee.systems@mymedlife.test",
    status: "active",
    chapterMemberships: [],
    staffRoles: ["DS Admin"],
    portfolioChapterIds: [],
    inviteStatus: "accepted",
  },
  {
    id: "user-sam",
    name: "Sam Super",
    email: "sam.super@mymedlife.test",
    status: "active",
    chapterMemberships: [],
    staffRoles: ["Super Admin"],
    portfolioChapterIds: [],
    inviteStatus: "accepted",
  },
  {
    id: "user-ivy",
    name: "Ivy Invite",
    email: "ivy.invite@mymedlife.test",
    status: "pending",
    chapterMemberships: [{ chapterId: "chapter-howard", roleKey: "General Member" }],
    staffRoles: [],
    portfolioChapterIds: [],
    inviteStatus: "sent",
  },
];

export const managedChapterFixtures: ManagedChapter[] = [
  {
    id: "chapter-ucla",
    name: "UCLA MEDLIFE",
    school: "UCLA",
    region: "West Coast",
    status: "active",
    coachOwnerId: "user-cam",
    staffOwnerIds: ["user-sky"],
    studentLeaderIds: ["user-casey"],
    activeModules: ["Events", "RSVP", "Attendance", "Points"],
    activeMemberCount: 68,
    activeEventCount: 5,
    historicalRecordCount: 142,
  },
  {
    id: "chapter-boston",
    name: "Boston College MEDLIFE",
    school: "Boston College",
    region: "Northeast",
    status: "active",
    coachOwnerId: "user-cam",
    staffOwnerIds: [],
    studentLeaderIds: ["user-priya"],
    activeModules: ["Events", "RSVP", "Attendance", "Points"],
    activeMemberCount: 54,
    activeEventCount: 4,
    historicalRecordCount: 118,
  },
  {
    id: "chapter-howard",
    name: "Howard University MEDLIFE",
    school: "Howard University",
    region: "DC-Metro",
    status: "active",
    coachOwnerId: "user-sky",
    staffOwnerIds: ["user-gina"],
    studentLeaderIds: [],
    activeModules: ["Events", "RSVP", "Points"],
    activeMemberCount: 42,
    activeEventCount: 3,
    historicalRecordCount: 87,
  },
  {
    id: "chapter-michigan",
    name: "Michigan State MEDLIFE",
    school: "Michigan State University",
    region: "Midwest",
    status: "disabled",
    coachOwnerId: null,
    staffOwnerIds: [],
    studentLeaderIds: [],
    activeModules: ["Events"],
    activeMemberCount: 18,
    activeEventCount: 0,
    historicalRecordCount: 32,
  },
];

export function getManagedUserName(userId: string | null | undefined): string {
  if (!userId) return "Unassigned";
  return managedUserFixtures.find((user) => user.id === userId)?.name ?? userId;
}

export function getManagedChapterName(chapterId: string): string {
  return (
    managedChapterFixtures.find((chapter) => chapter.id === chapterId)?.name ??
    chapterId
  );
}
