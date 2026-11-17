export function buildWhatsAppCheckoutUrl({
  whatsappNumber, orderReference, customerName, customerMobile,
  deliveryAddress, city, state, pinCode, orderNotes,
  items, subtotal, deliveryCharges, discountAmount, finalAmount
}) {
  const cleanPhone = String(whatsappNumber || '').replace(/[^0-9]/g, '');
  const fullAddress = `${deliveryAddress}, ${city}, ${state} - ${pinCode}`;

  const lines = [
    'Hello NUVAYA Team!',
    'I would like to place an order.',
    `Order Ref: ${orderReference}`,
    '',
    'Customer Details:',
    `Name: ${customerName}`,
    `Mobile: ${customerMobile}`,
    `Address: ${fullAddress}`,
  ];
  if (orderNotes?.trim()) lines.push(`Notes: ${orderNotes.trim()}`);
  lines.push('', 'Order Details:');

  let idx = 1;
  items.forEach((item) => {
    lines.push(`${idx++}. Product: ${item.productName}`);
    if (item.selectedColor) lines.push(`${idx++}. Color: ${item.selectedColor}`);
    if (item.mixedColorsSummary) lines.push(`${idx++}. Mixed Colors: ${item.mixedColorsSummary}`);
    if (item.packName) lines.push(`${idx++}. Pack: ${item.packName}`);
    if (item.selectedSize) lines.push(`${idx++}. Size: ${item.selectedSize}`);
    lines.push(`${idx++}. Quantity: ${item.quantity}`);
    lines.push(`${idx++}. Price: ₹${Number(item.lineTotal).toLocaleString('en-IN')}`);
  });

  lines.push(
    '',
    `Subtotal: ₹${Number(subtotal).toLocaleString('en-IN')}`,
    `Delivery Charges: ₹${Number(deliveryCharges).toLocaleString('en-IN')}`,
    `Discount: ₹${Number(discountAmount).toLocaleString('en-IN')}`,
    `Total Amount: ₹${Number(finalAmount).toLocaleString('en-IN')}`,
    '',
    'Please confirm my order.'
  );

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
}
