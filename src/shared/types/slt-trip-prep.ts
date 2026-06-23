export type TripPrepAlertTone = "red" | "yellow" | "green";

export type TripPrepChecklistStatus =
  | "complete"
  | "in_review"
  | "needs_attention"
  | "upcoming";

export type TripPrepFormStatus = "submitted" | "needs_signature" | "in_review";

export type TripPrepPaymentStatus = "paid" | "processing" | "due";

export type TripPrepFlightStatus = "confirmed" | "watch" | "missing";

export type TripPrepMeetingStatus = "attended" | "upcoming" | "missed";

export type TripPrepTimelineStatus = "complete" | "current" | "next" | "upcoming";

export type TripPrepNotificationTone = "info" | "watch" | "urgent";

export type TripPrepRiskLevel = "high" | "medium" | "low";

export type TripPrepAlert = {
  id: string;
  tone: TripPrepAlertTone;
  label: string;
  summary: string;
  owner: string;
  dueLabel: string;
  href: string;
};

export type TripPrepChecklistItem = {
  id: string;
  category: string;
  title: string;
  status: TripPrepChecklistStatus;
  dueLabel: string;
  summary: string;
  whyItMatters: string;
  evidenceRequirement: string;
  owner: string;
  mockSource:
    | "Drive/Form mock"
    | "HubSpot mock"
    | "Shopify mock"
    | "Luma mock"
    | "myMEDLIFE mock";
  nextStep: string;
};

export type TripPrepFormItem = {
  id: string;
  title: string;
  status: TripPrepFormStatus;
  dueLabel: string;
  summary: string;
  sourceLabel: "Drive/Form mock" | "HubSpot mock" | "myMEDLIFE mock";
};

export type TripPrepPaymentItem = {
  id: string;
  title: string;
  status: TripPrepPaymentStatus;
  dueLabel: string;
  amountLabel: string;
  summary: string;
  sourceLabel: "Shopify mock" | "Scholarship review mock";
};

export type TripPrepFlightSegment = {
  id: string;
  label: string;
  route: string;
  timingLabel: string;
  status: TripPrepFlightStatus;
  summary: string;
};

export type TripPrepMeeting = {
  id: string;
  title: string;
  timingLabel: string;
  status: TripPrepMeetingStatus;
  host: string;
  sourceLabel: "Luma mock" | "Zoom mock";
  summary: string;
};

export type TripPrepExtensionOption = {
  id: string;
  title: string;
  status: "selected" | "considering" | "not_selected";
  priceLabel: string;
  summary: string;
};

export type TripPrepTimelineEvent = {
  id: string;
  label: string;
  dateLabel: string;
  status: TripPrepTimelineStatus;
  summary: string;
};

export type TripPrepNotification = {
  id: string;
  tone: TripPrepNotificationTone;
  title: string;
  sentLabel: string;
  channelLabel: string;
  summary: string;
  href: string;
};

export type TripPrepProfileSnapshot = {
  travelerEmail: string;
  travelerPhone: string;
  passportStatus: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  dietaryNeeds: string;
  shirtSize: string;
  insuranceStatus: string;
  travelNotes: string;
};

export type TripPrepMockSources = {
  hubspot: string;
  shopify: string;
  luma: string;
};

export type TripPrepTraveler = {
  id: string;
  firstName: string;
  displayName: string;
  chapterName: string;
  roleLabel: string;
  tripLabel: string;
  departureDateIso: string;
  departureDateLabel: string;
  cityLabel: string;
  riskLevel: TripPrepRiskLevel;
  alerts: TripPrepAlert[];
  checklist: TripPrepChecklistItem[];
  forms: TripPrepFormItem[];
  payments: TripPrepPaymentItem[];
  flights: TripPrepFlightSegment[];
  meetings: TripPrepMeeting[];
  extensions: TripPrepExtensionOption[];
  timeline: TripPrepTimelineEvent[];
  notifications: TripPrepNotification[];
  profile: TripPrepProfileSnapshot;
  mockSources: TripPrepMockSources;
};
