export type PhotoType = "single" | "strip" | "gif" | "boomerang" | "video";

export type PhotoStatus = "pending" | "processing" | "ready" | "failed";

export type AiStyle = "none" | "cartoon" | "neon" | "vintage" | "custom";

export type DeliveryChannel = "qr" | "email" | "whatsapp" | "print";

export interface Organization {
  id: string;
  name: string;
  plan: "basic" | "pro" | "business";
  createdAt: string;
}

export interface EventSummary {
  id: string;
  organizationId: string;
  name: string;
  themeConfig: Record<string, unknown>;
  startDate: string;
  endDate: string | null;
  isOffline: boolean;
  booths?: BoothSummary[];
  photos?: PhotoSummary[];
  templates?: TemplateSummary[];
  _count?: { booths: number; photos: number };
}

export interface BoothSummary {
  id: string;
  eventId: string;
  deviceToken: string;
  name: string;
  lastSeenAt: string | null;
}

export interface PhotoSummary {
  id: string;
  eventId: string;
  boothId: string;
  type: PhotoType;
  originalUrl: string;
  processedUrl: string | null;
  aiStyle: AiStyle | null;
  status: PhotoStatus;
  deliveredVia: DeliveryChannel[];
  createdAt: string;
}

export interface TemplateSummary {
  id: string;
  eventId: string;
  layoutJson: Record<string, unknown>;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface ApiSuccess<T> {
  data: T;
}

// --- Auth ---
export interface RegisterBoothInput {
  eventId: string;
  name: string;
}

export interface RegisterBoothOutput {
  boothId: string;
  deviceToken: string;
}

// --- Fotos ---
export interface PresignUploadInput {
  boothId: string;
  eventId: string;
  type: PhotoType;
  aiStyle?: AiStyle;
  fileName: string;
  contentType: string;
  size: number;
}

export interface PresignUploadOutput {
  uploadUrl: string;
  photoId: string;
  objectKey: string;
  expiresIn: number;
}

export interface CreatePhotoInput {
  boothId: string;
  eventId: string;
  type: PhotoType;
  aiStyle?: AiStyle;
  objectKey: string;
  originalUrl: string;
  status?: PhotoStatus;
}

export interface CreatePhotoOutput {
  photo: PhotoSummary;
}

export interface ListPhotosOutput {
  photos: PhotoSummary[];
}

export interface HealthOutput {
  status: "ok";
  service: string;
  timestamp: string;
}
