export function formatWhatsAppNumber(number) {
  if (!number) return '';
  let clean = number.toString().replace(/[^0-9]/g, '');
  if (!clean) return '';
  if (clean.startsWith('00')) clean = clean.slice(2);

  if (clean.startsWith('966')) {
    clean = '966' + clean.slice(3).replace(/^0/, '');
  } else if (clean.startsWith('05') && clean.length === 10) {
    clean = '966' + clean.slice(1);
  } else if (clean.startsWith('5') && clean.length === 9) {
    clean = '966' + clean;
  }

  return clean;
}

export function openWhatsApp(number, message) {
  const clean = formatWhatsAppNumber(number);
  if (!clean) {
    console.error('Invalid WhatsApp number:', number);
    return false;
  }

  const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;

  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  }
  return true;
}
