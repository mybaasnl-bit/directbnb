import type { Metadata } from 'next';
import type { Property } from '@/types';
import { PropertyPageClient } from '../[slug]/PropertyPageClient';

export const metadata: Metadata = {
  title: 'Demo B&B – De Groene Oase | DirectBnB',
  description: 'Bekijk een demonstratie van een DirectBnB boekingspagina. Ontdek hoe gasten bij jou kunnen boeken zonder commissie.',
};

// Static demo property — always works, no DB required
const DEMO_PROPERTY: Property & { avgRating: number; reviewCount: number } = {
  id: 'demo',
  ownerId: 'demo',
  slug: 'demo',
  name: 'De Groene Oase',
  descriptionNl:
    'Welkom in De Groene Oase — een sfeervol B&B midden in het hart van Amsterdam. Geniet van een heerlijk ontbijt, comfortabele kamers en persoonlijke service. Ideaal voor een city-trip of een ontspannen weekendje weg.',
  descriptionEn:
    'Welcome to De Groene Oase — a charming B&B in the heart of Amsterdam. Enjoy a delicious breakfast, comfortable rooms and personal service. Perfect for a city trip or a relaxing weekend getaway.',
  addressStreet: 'Prinsengracht 123',
  addressCity: 'Amsterdam',
  addressZip: '1015 DX',
  addressCountry: 'NL',
  isPublished: true,
  amenities: ['wifi', 'breakfast', 'parking', 'heating', 'tv', 'garden', 'bicycle'],
  checkInTime: '15:00',
  checkOutTime: '11:00',
  cancellationPolicy: 'Gratis annuleren tot 48 uur voor aankomst.',
  smokingAllowed: false,
  petsAllowed: false,
  childrenAllowed: true,
  showExtraServices: true,
  avgRating: 9.2,
  reviewCount: 24,
  photos: [
    {
      id: 'photo-1',
      propertyId: 'demo',
      url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
      altText: 'Sfeervolle kamer',
      sortOrder: 0,
      isCover: true,
    },
    {
      id: 'photo-2',
      propertyId: 'demo',
      url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
      altText: 'Gezellige lounge',
      sortOrder: 1,
      isCover: false,
    },
    {
      id: 'photo-3',
      propertyId: 'demo',
      url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80',
      altText: 'Ontbijtruimte',
      sortOrder: 2,
      isCover: false,
    },
  ],
  rooms: [
    {
      id: 'room-1',
      propertyId: 'demo',
      name: 'Tuinkamer',
      descriptionNl: 'Lichte kamer met uitzicht op de tuin. Queensize bed, eigen badkamer.',
      descriptionEn: 'Bright room with garden view. Queen-size bed, en-suite bathroom.',
      pricePerNight: 129,
      maxGuests: 2,
      minStay: 1,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      photos: [
        {
          id: 'rp-1',
          roomId: 'room-1',
          url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
          altText: 'Tuinkamer',
          sortOrder: 0,
        },
      ],
    },
    {
      id: 'room-2',
      propertyId: 'demo',
      name: 'Grachtkamer',
      descriptionNl: 'Romantische kamer met uitzicht op de gracht. Kingsize bed, douchebad.',
      descriptionEn: 'Romantic room overlooking the canal. King-size bed, shower bath.',
      pricePerNight: 159,
      maxGuests: 2,
      minStay: 1,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      photos: [
        {
          id: 'rp-2',
          roomId: 'room-2',
          url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
          altText: 'Grachtkamer',
          sortOrder: 0,
        },
      ],
    },
    {
      id: 'room-3',
      propertyId: 'demo',
      name: 'Familiesuite',
      descriptionNl: 'Ruime suite voor gezinnen met twee slaapkamers en een eigen woonkamer.',
      descriptionEn: 'Spacious suite for families with two bedrooms and a private living room.',
      pricePerNight: 219,
      maxGuests: 4,
      minStay: 2,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      photos: [],
    },
  ],
  reviews: [
    {
      id: 'rev-1',
      propertyId: 'demo',
      guestFirstName: 'Sophie',
      rating: 9,
      comment: 'Heerlijk verblijf! Het ontbijt was fantastisch en de kamer was super comfortabel. Zeker voor herhaling vatbaar.',
      isPublished: true,
      createdAt: '2025-09-15T10:00:00Z',
    },
    {
      id: 'rev-2',
      propertyId: 'demo',
      guestFirstName: 'Thomas',
      rating: 10,
      comment: 'Perfecte locatie, vriendelijke eigenaar en uitstekende service. We hebben genoten van elk moment.',
      isPublished: true,
      createdAt: '2025-08-20T10:00:00Z',
    },
    {
      id: 'rev-3',
      propertyId: 'demo',
      guestFirstName: 'Marie',
      rating: 9,
      comment: 'Warm en gezellig. De tuin is prachtig voor een rustig ontbijt buiten.',
      isPublished: true,
      createdAt: '2025-07-05T10:00:00Z',
    },
  ],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

export default function DemoPage() {
  return (
    <div className="relative">
      {/* Demo banner */}
      <div className="bg-amber-500 text-white text-center text-sm font-semibold py-2 px-4 sticky top-0 z-50">
        🎯 Dit is een demonstratiepagina — boekingen zijn uitgeschakeld
      </div>
      <PropertyPageClient property={DEMO_PROPERTY} />
    </div>
  );
}
