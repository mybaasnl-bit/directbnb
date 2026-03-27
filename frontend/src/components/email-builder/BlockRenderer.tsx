'use client';

import type { Block } from './types';

interface Props {
  block: Block;
}

/** Renders a block as it will appear in the final email (inline styles only, email-safe). */
export function BlockRenderer({ block }: Props) {
  switch (block.type) {
    case 'header':
      return (
        <div style={{ background: block.props.bgColor, padding: '40px 40px 32px', textAlign: 'center' }}>
          {block.props.title && (
            <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: block.props.textColor, lineHeight: 1.3 }}>
              {block.props.title}
            </h1>
          )}
          {block.props.subtitle && (
            <p style={{ margin: 0, fontSize: 16, color: block.props.textColor, opacity: 0.85, lineHeight: 1.5 }}>
              {block.props.subtitle}
            </p>
          )}
        </div>
      );

    case 'text':
      return (
        <div style={{ padding: '12px 40px', textAlign: block.props.align }}>
          <p style={{ margin: 0, fontSize: block.props.fontSize, fontWeight: block.props.bold ? 600 : 400, color: block.props.color, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
            {block.props.content || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Tekst…</span>}
          </p>
        </div>
      );

    case 'button':
      return (
        <div style={{ padding: '16px 40px', textAlign: block.props.align }}>
          <span style={{ display: 'inline-block', background: block.props.bgColor, color: block.props.textColor, padding: '14px 32px', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'default' }}>
            {block.props.label || 'Knoptekst'}
          </span>
        </div>
      );

    case 'image':
      return (
        <div style={{ padding: '16px 40px', textAlign: block.props.align }}>
          {block.props.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.props.src}
              alt={block.props.alt}
              style={{ maxWidth: `${block.props.width}%`, height: 'auto', borderRadius: 8, display: 'block', ...(block.props.align === 'center' ? { margin: '0 auto' } : block.props.align === 'right' ? { marginLeft: 'auto' } : {}) }}
            />
          ) : (
            <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14, maxWidth: `${block.props.width}%`, ...(block.props.align === 'center' ? { margin: '0 auto' } : {}) }}>
              🖼 Afbeelding (voer een URL in)
            </div>
          )}
        </div>
      );

    case 'divider':
      return (
        <div style={{ padding: '8px 40px' }}>
          <hr style={{ border: 'none', borderTop: `${block.props.thickness}px solid ${block.props.color}`, margin: 0 }} />
        </div>
      );

    case 'spacer':
      return <div style={{ height: block.props.height, fontSize: 0 }} />;

    case 'footer':
      return (
        <div style={{ background: block.props.bgColor, padding: '32px 40px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 13, color: block.props.textColor, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {block.props.text}
          </p>
        </div>
      );

    case 'booking_details':
      return (
        <div style={{ padding: '16px 40px' }}>
          <div style={{ background: block.props.bgColor, borderRadius: 10, padding: '20px 24px' }}>
            <p style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Boekingsgegevens</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {block.props.showProperty && <DetailRow label="Accommodatie" value="{{property_name}}" />}
                {block.props.showRoom && <DetailRow label="Kamer" value="{{room_name}}" />}
                {block.props.showCheckin && <DetailRow label="Aankomst" value="{{check_in}}" />}
                {block.props.showCheckout && <DetailRow label="Vertrek" value="{{check_out}}" />}
                {block.props.showGuests && <DetailRow label="Gasten" value="{{num_guests}}" />}
                {block.props.showPrice && <DetailRow label="Totaal" value="€{{total_price}}" highlight />}
              </tbody>
            </table>
          </div>
        </div>
      );

    default:
      return null;
  }
}

function DetailRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <tr>
      <td style={{ padding: '7px 0', borderTop: '1px solid #e2e8f0', fontSize: 14, color: '#64748b' }}>{label}</td>
      <td style={{ padding: '7px 0', borderTop: '1px solid #e2e8f0', textAlign: 'right', fontSize: highlight ? 17 : 14, fontWeight: highlight ? 700 : 600, color: highlight ? '#4f46e5' : '#1e293b' }}>{value}</td>
    </tr>
  );
}
