export type HostId = "tejaaswin" | "raksha";

export type Host = {
  id: HostId;
  name: string;
  email: string;
  role: string;
  initials: string;
};

export type MeetingType = {
  id: "quick" | "standard" | "deep";
  title: string;
  durationMinutes: number;
  description: string;
  disabled: boolean;
  badge?: string;
};

export type AvailabilityWindow = {
  id?: string;
  host_id: HostId;
  available_date: string;
  start_time: string;
  end_time: string;
};

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export type BookingRecord = {
  id: string;
  host_id: HostId;
  meeting_type_id: MeetingType["id"];
  guest_name: string;
  guest_email: string;
  guest_telegram: string;
  agenda?: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  outlook_url?: string | null;
  confirmation_token?: string | null;
  confirmed_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
};

export type Slot = {
  start: string;
  end: string;
  label: string;
};

export type BookingRequest = {
  hostId: HostId;
  meetingTypeId: MeetingType["id"];
  start: string;
  guestName: string;
  guestEmail: string;
  guestTelegram: string;
  agenda?: string;
};
