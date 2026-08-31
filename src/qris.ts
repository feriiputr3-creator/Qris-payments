export function convertStaticToDynamicQris(rawQris: string, amount: number): string {
    // 1. Change 010211 to 010212 (01 is tag Point of Initiation Method, 02 length, 12 dynamic)
    let qris = rawQris.replace('010211', '010212');
    
    // Remove old CRC (last 4 chars)
    let qrisWithoutCrc = qris.slice(0, -4);
    
    // 2. Insert Tag 54 (Transaction Amount)
    const amountStr = amount.toString();
    const tag54Len = amountStr.length.toString().padStart(2, '0');
    const tag54 = `54${tag54Len}${amountStr}`;
    
    // Handle edge case if it already ends with 6304
    if (qrisWithoutCrc.endsWith('6304')) {
        qrisWithoutCrc = qrisWithoutCrc.slice(0, -4);
    } else {
        const idx = qrisWithoutCrc.lastIndexOf('6304');
        if (idx !== -1) {
             qrisWithoutCrc = qrisWithoutCrc.substring(0, idx);
        }
    }
    
    const stringToHash = qrisWithoutCrc + tag54 + '6304';
    
    // 3. Calculate CRC
    const newCrc = crc16CcittFalse(stringToHash);
    
    return stringToHash + newCrc;
}

function crc16CcittFalse(data: string): string {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) > 0) {
                crc = ((crc << 1) ^ 0x1021);
            } else {
                crc = (crc << 1);
            }
            crc &= 0xFFFF;
        }
    }
    // Ensure unsigned 16-bit integer format and pad to 4 hex characters
    return (crc >>> 0).toString(16).toUpperCase().padStart(4, '0');
}
