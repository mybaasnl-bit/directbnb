export type Align = 'left' | 'center' | 'right';

export interface HeaderBlock {
  id: string;
  type: 'header';
  props: {
    title: string;
    subtitle: string;
    bgColor: string;
    textColor: string;
  };
}

export interface TextBlock {
  id: string;
  type: 'text';
  props: {
    content: string;
    align: Align;
    fontSize: number;
    color: string;
    bold: boolean;
  };
}

export interface ButtonBlock {
  id: string;
  type: 'button';
  props: {
    label: string;
    url: string;
    bgColor: string;
    textColor: string;
    align: Align;
  };
}

export interface ImageBlock {
  id: string;
  type: 'image';
  props: {
    src: string;
    alt: string;
    align: Align;
    width: 25 | 50 | 75 | 100;
  };
}

export interface DividerBlock {
  id: string;
  type: 'divider';
  props: {
    color: string;
    thickness: 1 | 2 | 3;
  };
}

export interface SpacerBlock {
  id: string;
  type: 'spacer';
  props: {
    height: 8 | 16 | 32 | 48;
  };
}

export interface FooterBlock {
  id: string;
  type: 'footer';
  props: {
    text: string;
    textColor: string;
    bgColor: string;
  };
}

export interface BookingDetailsBlock {
  id: string;
  type: 'booking_details';
  props: {
    bgColor: string;
    showProperty: boolean;
    showRoom: boolean;
    showCheckin: boolean;
    showCheckout: boolean;
    showGuests: boolean;
    showPrice: boolean;
  };
}

export type Block =
  | HeaderBlock
  | TextBlock
  | ButtonBlock
  | ImageBlock
  | DividerBlock
  | SpacerBlock
  | FooterBlock
  | BookingDetailsBlock;

export type BlockType = Block['type'];

export const BLOCK_LABELS: Record<BlockType, string> = {
  header: 'Koptekst',
  text: 'Tekst',
  button: 'Knop',
  image: 'Afbeelding',
  divider: 'Lijn',
  spacer: 'Ruimte',
  footer: 'Voettekst',
  booking_details: 'Boekingsgegevens',
};
