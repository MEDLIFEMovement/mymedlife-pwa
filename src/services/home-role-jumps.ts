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
    helper: "Student leadership command center",
    returnTo: "/leader?view=overview&source=member_home",
  },
  {
    label: "Staff View",
    selectedEmail: "coach@mymedlife.test",
    helper: "Staff command center",
    returnTo: "/staff?view=chapters&source=member_home",
  },
  {
    label: "Admin",
    selectedEmail: "admin@mymedlife.test",
    helper: "Admin Console",
    returnTo: "/admin?source=member_home",
  },
];
