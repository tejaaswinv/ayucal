import type { Host, MeetingType } from "./types";

export const hosts: Host[] = [
  {
    id: "tejaaswin",
    name: "Tejaaswin",
    email: "tejaaswinv@gmail.com",
    role: "Founder, AyuPulse",
    initials: "TV"
  },
  {
    id: "raksha",
    name: "Raksha",
    email: "raksha@example.com",
    role: "AyuPulse collaborator",
    initials: "R"
  }
];

export const meetingTypes: MeetingType[] = [
  {
    id: "quick",
    title: "Quick Chat",
    durationMinutes: 15,
    description: "A short focused conversation.",
    disabled: false
  },
  {
    id: "standard",
    title: "Standard Meet",
    durationMinutes: 30,
    description: "For deeper planning and discussion.",
    disabled: true,
    badge: "Coming soon"
  },
  {
    id: "deep",
    title: "Deep Discussion",
    durationMinutes: 45,
    description: "For long reviews and detailed sessions.",
    disabled: true,
    badge: "Coming soon"
  }
];

export function getHost(hostId: string) {
  return hosts.find((host) => host.id === hostId);
}

export function getHostByEmail(email?: string | null) {
  if (!email) return undefined;
  return hosts.find((host) => host.email.toLowerCase() === email.toLowerCase());
}

export function getMeetingType(meetingTypeId: string) {
  return meetingTypes.find((type) => type.id === meetingTypeId);
}

export function isDemoMode() {
  return process.env.DEMO_MODE !== "false";
}
