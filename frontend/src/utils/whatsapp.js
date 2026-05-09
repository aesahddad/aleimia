export function formatWhatsAppNumber(number) {
  if (!number) return '';
  let clean = number.replace(/[^0-9]/g, '');
  if (clean.startsWith('00')) clean = clean.slice(2);
  if (clean.startsWith('0')) clean = '966' + clean.slice(1);
  if (clean.startsWith('5') && clean.length === 9) clean = '966' + clean;
  return clean;
}

export function openWhatsApp(number, message) {
  const clean = formatWhatsAppNumber(number);
  if (!clean) return;
  window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`, '_blank');
}
