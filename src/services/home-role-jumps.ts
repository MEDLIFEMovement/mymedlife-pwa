export type HomeSurfaceJump = {
  helper: string;
  label: string;
  returnTo: string;
  selectedEmail: string;
};

export const homeSurfaceJumps: HomeSurfaceJump[] = [
  {
    label: "Leader Hub",
    selectedEmail: "leader.a@mymedlife.test",
    helper: "Chapter command center",
    returnTo: "/chapter?view=overview&source=member_home",
  },
  {
    label: "Coach View",
    selectedEmail: "coach@mymedlife.test",
    helper: "Portfolio support view",
    returnTo: "/coach?view=chapters&source=member_home",
  },
  {
    label: "Admin",
    selectedEmail: "admin@mymedlife.test",
    helper: "Admin Console",
    returnTo: "/staff?view=admin&source=member_home",
  },
];
