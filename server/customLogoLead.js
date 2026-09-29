const collapseWhitespace = (value) => String(value || '').trim().replace(/\s+/g, ' ');

export function normaliseCustomLogoLead(input = {}) {
  const name = collapseWhitespace(input.name).slice(0, 100);
  const phone = String(input.phone || '').replace(/\D/g, '').slice(0, 15);
  const honeypot = collapseWhitespace(input.companyWebsite).slice(0, 200);

  if (honeypot) return { name, phone, honeypot, isBot: true };
  if (name.length < 2) throw new Error('Sila masukkan nama penuh.');
  if (!/^01\d{8,9}$/.test(phone) && !/^601\d{8,9}$/.test(phone)) {
    throw new Error('Sila masukkan nombor telefon Malaysia yang sah.');
  }

  return { name, phone, honeypot: '', isBot: false };
}

export function toMalaysiaWhatsAppNumber(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.startsWith('60') ? digits : digits.startsWith('0') ? `6${digits}` : digits;
}
