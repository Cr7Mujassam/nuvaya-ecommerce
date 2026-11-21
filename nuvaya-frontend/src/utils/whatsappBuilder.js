export function buildWhatsAppCheckoutUrl({
  whatsappNumber, orderReference, customerName, customerMobile,
  deliveryAddress, city, state, pinCode, orderNotes,
  items = [], subtotal, deliveryCharges, discountAmount, finalAmount
}) {
  const cleanPhone = String(whatsappNumber || '').replace(/[^0-9]/g, '');
  const fullAddress = `${deliveryAddress}, ${city}, ${state} - ${pinCode}`;

  const totalQty = items.reduce((sum, it) => sum + Number(it.quantity || 1), 0);

  const lines = [
    `*NUVAYA ORDER — ${orderReference}*`,
    '',
    '*Delivery Details:*',
    `Name: ${customerName}`,
    `Mobile: ${customerMobile}`,
    `Address: ${fullAddress}`,
  ];

  if (orderNotes?.trim()) {
    lines.push(`Delivery Note: ${orderNotes.trim()}`);
  }

  lines.push('', `*Order Summary (${items.length} ${items.length === 1 ? 'Item' : 'Items'} • ${totalQty} Qty):*`);

  const MAX_VISIBLE_ITEMS = 4;
  const visibleItems = items.slice(0, MAX_VISIBLE_ITEMS);

  visibleItems.forEach((item) => {
    const meta = [
      item.packName,
      item.mixedColorsSummary ? `Colors: ${item.mixedColorsSummary}` : item.selectedColor,
      item.selectedSize && item.selectedSize !== 'Standard' ? `Size: ${item.selectedSize}` : null,
    ].filter(Boolean).join(' • ');

    const metaText = meta ? ` (${meta})` : '';
    lines.push(`• ${item.quantity}× ${item.productName}${metaText} — ₹${Number(item.lineTotal).toLocaleString('en-IN')}`);
  });

  if (items.length > MAX_VISIBLE_ITEMS) {
    const remainingCount = items.length - MAX_VISIBLE_ITEMS;
    lines.push(`• +${remainingCount} more ${remainingCount === 1 ? 'item' : 'items'} (Full list saved under ${orderReference})`);
  }

  lines.push('');

  if (Number(deliveryCharges) > 0) {
    lines.push(`Delivery: ₹${Number(deliveryCharges).toLocaleString('en-IN')}`);
  } else {
    lines.push('Delivery: FREE');
  }

  if (Number(discountAmount) > 0) {
    lines.push(`Discount: -₹${Number(discountAmount).toLocaleString('en-IN')}`);
  }

  lines.push(
    `*Total Payable: ₹${Number(finalAmount).toLocaleString('en-IN')}*`,
    '',
    'Please confirm my order.'
  );

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
}
