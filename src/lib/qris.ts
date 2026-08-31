// QRIS Dynamic Generator
// Implements CRC16 CCITT-FALSE

export function generateDynamicQRIS(staticQRIS: string, amount: number): string {
  // 1. Ganti tag 01 dari 11 menjadi 12 (Dinamis)
  let qris = staticQRIS.replace('010211', '010212');

  // 2. Buat tag 54 (Transaction Amount)
  const amountStr = amount.toString();
  const amountLength = amountStr.length.toString().padStart(2, '0');
  const tag54 = `54${amountLength}${amountStr}`;

  // Sisipkan tag 54 sebelum tag 58 (Country Code, biasanya ID)
  // Atau jika sudah ada tag 54, replace. Asumsi simple: sisipkan sebelum 5802ID
  if (qris.includes('54')) {
    // Regex to replace existing tag 54 (54 + 2 digits length + value)
    qris = qris.replace(/54\d{2}\d+/, tag54);
  } else {
    qris = qris.replace('5802ID', `${tag54}5802ID`);
  }

  // 3. Hapus 4 digit checksum lama (di ujung setelah 6304)
  const baseQris = qris.substring(0, qris.indexOf('6304') + 4);

  // 4. Hitung ulang checksum CRC-16/CCITT-FALSE
  const crc = calculateCRC16CCITT(baseQris);

  // 5. Gabungkan hasil
  return baseQris + crc;
}

function calculateCRC16CCITT(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  crc = crc & 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
