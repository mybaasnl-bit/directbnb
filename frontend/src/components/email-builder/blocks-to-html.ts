import type { Block } from './types';

const MARKER = 'email-builder-v1';

export function blocksToHtml(blocks: Block[]): string {
  const json = JSON.stringify(blocks);
  const inner = blocks.map(blockToHtml).join('\n');

  return `<!-- ${MARKER}: ${json} -->
<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
${inner}
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function htmlToBlocks(html: string): Block[] | null {
  if (!html) return null;
  const re = new RegExp(`<!-- ${MARKER}: ([\\s\\S]*?) -->`);
  const match = html.match(re);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? (parsed as Block[]) : null;
  } catch {
    return null;
  }
}

/* ---------- per-block HTML ---------- */

function blockToHtml(block: Block): string {
  switch (block.type) {
    case 'header':
      return `<tr><td style="background:${block.props.bgColor};padding:40px 40px 32px;text-align:center;">
${block.props.title ? `<h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:${block.props.textColor};line-height:1.3;">${esc(block.props.title)}</h1>` : ''}
${block.props.subtitle ? `<p style="margin:0;font-size:16px;color:${block.props.textColor};opacity:.85;line-height:1.5;">${esc(block.props.subtitle)}</p>` : ''}
</td></tr>`;

    case 'text':
      return `<tr><td style="padding:12px 40px;text-align:${block.props.align};">
<p style="margin:0;font-size:${block.props.fontSize}px;font-weight:${block.props.bold ? 600 : 400};color:${block.props.color};line-height:1.65;">${esc(block.props.content).replace(/\n/g, '<br />')}</p>
</td></tr>`;

    case 'button':
      return `<tr><td style="padding:16px 40px;text-align:${block.props.align};">
<a href="${block.props.url || '#'}" style="display:inline-block;background:${block.props.bgColor};color:${block.props.textColor};padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;text-decoration:none;line-height:1;">${esc(block.props.label)}</a>
</td></tr>`;

    case 'image':
      return `<tr><td style="padding:16px 40px;text-align:${block.props.align};">
<img src="${block.props.src || 'https://placehold.co/600x200?text=Afbeelding'}" alt="${esc(block.props.alt)}" style="max-width:${block.props.width}%;height:auto;border-radius:8px;display:block;${block.props.align === 'center' ? 'margin:0 auto;' : block.props.align === 'right' ? 'margin-left:auto;' : ''}">
</td></tr>`;

    case 'divider':
      return `<tr><td style="padding:8px 40px;">
<hr style="border:none;border-top:${block.props.thickness}px solid ${block.props.color};margin:0;">
</td></tr>`;

    case 'spacer':
      return `<tr><td style="height:${block.props.height}px;font-size:0;line-height:0;">&nbsp;</td></tr>`;

    case 'footer':
      return `<tr><td style="background:${block.props.bgColor};padding:32px 40px;text-align:center;">
<p style="margin:0;font-size:13px;color:${block.props.textColor};line-height:1.6;">${esc(block.props.text).replace(/\n/g, '<br />')}</p>
</td></tr>`;

    case 'booking_details': {
      const rows: string[] = [];
      if (block.props.showProperty) rows.push(detRow('Accommodatie', '{{property_name}}'));
      if (block.props.showRoom) rows.push(detRow('Kamer', '{{room_name}}'));
      if (block.props.showCheckin) rows.push(detRow('Aankomst', '{{check_in}}'));
      if (block.props.showCheckout) rows.push(detRow('Vertrek', '{{check_out}}'));
      if (block.props.showGuests) rows.push(detRow('Gasten', '{{num_guests}}'));
      if (block.props.showPrice) rows.push(detRow('Totaal', '€{{total_price}}', true));
      return `<tr><td style="padding:16px 40px;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${block.props.bgColor};border-radius:10px;padding:20px 24px;">
<tr><td colspan="2" style="padding-bottom:14px;font-size:15px;font-weight:700;color:#1e293b;">Boekingsgegevens</td></tr>
${rows.join('\n')}
</table></td></tr>`;
    }

    default:
      return '';
  }
}

function detRow(label: string, value: string, highlight = false): string {
  return `<tr>
<td style="padding:8px 0;border-top:1px solid #e2e8f0;font-size:14px;color:#64748b;">${label}</td>
<td style="padding:8px 0;border-top:1px solid #e2e8f0;text-align:right;font-size:${highlight ? 18 : 14}px;font-weight:${highlight ? 700 : 600};color:${highlight ? '#4f46e5' : '#1e293b'};">${value}</td>
</tr>`;
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
