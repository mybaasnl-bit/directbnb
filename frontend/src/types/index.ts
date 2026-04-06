export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'OWNER' | 'ADMIN';
  preferredLanguage: string;
  isBetaUser: boolean;
  emailVerified: boolean;
  createdAt: string;
  _count?: { properties: number };
}

export interface Property {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  descriptionNl?: string;
  descriptionEn?: string;
  addressStreet?: string;
  addressCity?: string;
  addressZip?: string;
  addressCountry: string;
  latitude?: number;
  longitude?: number;
  isPublished: boolean;

  // Amenities & policies
  amenities: string[];
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicy?: string;
  smokingAllowed: boolean;
  petsAllowed: boolean;
  childrenAllowed: boolean;

  photos: PropertyPhoto[];
  rooms?: Room[];
  reviews?: Review[];
  avgRating?: number | null;
  reviewCount?: number;

  showExtraServices?: boolean;

  _count?: { rooms: number };
  createdAt: string;
  updatedAt: string;
}

export interface PropertyPhoto {
  id: string;
  propertyId: string;
  url: string;
  altText?: string;
  sortOrder: number;
  isCover: boolean;
}

export interface Room {
  id: string;
  propertyId: string;
  name: string;
  descriptionNl?: string;
  descriptionEn?: string;
  pricePerNight: number;
  maxGuests: number;
  beds?: number;
  bathrooms?: number;
  sqm?: number;
  minStay: number;
  isActive: boolean;
  photos: RoomPhoto[];
  createdAt: string;
}

export interface RoomPhoto {
  id: string;
  roomId: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface Review {
  id: string;
  propertyId: string;
  guestFirstName: string;
  rating: number;
  cleanlinessRating?: number;
  locationRating?: number;
  valueRating?: number;
  comment?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface Guest {
  id: string;
  ownerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  nationality?: string;
  notes?: string;
  _count?: { bookings: number };
  createdAt: string;
}

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'PAYMENT_PENDING'
  | 'PAID';

export interface Booking {
  id: string;
  roomId: string;
  guestId: string;
  ownerId: string;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  totalPrice: number;
  status: BookingStatus;
  guestMessage?: string;
  ownerNotes?: string;
  source: string;
  room: Room & { property: Property };
  guest: Guest;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalProperties: number;
  totalRooms: number;
  totalGuests: number;
  pendingBookings: number;
  confirmedBookings: number;
  revenueThisMonth: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}
