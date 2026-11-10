import QRCode from 'qrcode';
import { Mutamer, PaxType, HotelSector, Voucher, B2BAgent } from '../types';

export async function generateVoucherQRCode(voucher: Voucher): Promise<string> {
  // Direct URL so scanning the QR code opens ONLY this voucher's PDF view
  const publicVoucherUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?voucher=${voucher.voucherNo}`
    : `https://ameerhamzatravel.com?voucher=${voucher.voucherNo}`;

  try {
    return await QRCode.toDataURL(publicVoucherUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 150,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('QR Code generation error:', err);
    return '';
  }
}

export function getNextVoucherNumber(existingVouchers: Voucher[]): string {
  const STARTING_VOUCHER_NUM = 10101;
  let maxNum = STARTING_VOUCHER_NUM - 1;

  for (const v of existingVouchers) {
    // Extract digits from voucherNo (e.g. "10101", "UB-10101", etc.)
    const matches = v.voucherNo.match(/\d+/g);
    if (matches) {
      for (const m of matches) {
        const num = parseInt(m, 10);
        if (num >= 10000 && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  const nextNum = Math.max(STARTING_VOUCHER_NUM, maxNum + 1);
  return `HV-${nextNum}`;
}

export function formatVoucherDisplayNo(voucherNo: string): string {
  if (!voucherNo) return 'HV-10101';
  if (voucherNo.startsWith('HV-')) return voucherNo;
  if (/^\d+$/.test(voucherNo)) return `HV-${voucherNo}`;
  return voucherNo;
}

export function printVoucherDocument(voucherNo: string) {
  const displayNo = formatVoucherDisplayNo(voucherNo);
  const oldTitle = document.title;
  document.title = displayNo;
  window.print();
  setTimeout(() => {
    document.title = oldTitle;
  }, 1500);
}

export function calculateNights(checkin: string, checkout: string): number {
  if (!checkin || !checkout) return 1;
  try {
    const parseDate = (dStr: string) => {
      // Handles DD-MM-YY or DD-MM-YYYY or DD/MM/YYYY or YYYY-MM-DD
      const cleaned = dStr.trim();
      if (cleaned.includes('/')) {
        const parts = cleaned.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          let year = parseInt(parts[2], 10);
          if (year < 100) year += 2000;
          return new Date(year, month, day);
        }
      } else if (cleaned.includes('-')) {
        const parts = cleaned.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            // YYYY-MM-DD
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          } else {
            // DD-MM-YY
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            let year = parseInt(parts[2], 10);
            if (year < 100) year += 2000;
            return new Date(year, month, day);
          }
        }
      }
      return new Date(dStr);
    };

    const d1 = parseDate(checkin);
    const d2 = parseDate(checkout);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  } catch {
    return 1;
  }
}

export function summarizePax(mutamers: Mutamer[]): {
  adults: number;
  children: number;
  infants: number;
  totalPax: number;
  totalBeds: number;
  paxText: string;
} {
  let adults = 0;
  let children = 0;
  let infants = 0;
  let beds = 0;

  for (const m of mutamers) {
    if (m.paxType === 'Adult') adults++;
    else if (m.paxType === 'Child') children++;
    else if (m.paxType === 'Infant') infants++;

    if (m.bed === 'Yes') beds++;
  }

  const totalPax = mutamers.length;
  const paxText = `${totalPax} (A:${adults},C:${children},I:${infants}),Beds=${beds}`;

  return { adults, children, infants, totalPax, totalBeds: beds, paxText };
}

export function parseStandardCSV(csvText: string): {
  groupNo: string;
  groupName: string;
  mutamers: Mutamer[];
} {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let groupNo = '1000';
  let groupName = 'AMEERHAMZAONLYACC';
  const mutamers: Mutamer[] = [];

  let isHeaderPassed = false;
  let sno = 1;

  for (const line of lines) {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));

    if (cols[0]?.toLowerCase().includes('groupno')) {
      groupNo = cols[1] || '1000';
      continue;
    }
    if (cols[0]?.toLowerCase().includes('groupname')) {
      groupName = cols[1] || 'AMEERHAMZAONLYACC';
      continue;
    }

    if (cols[0]?.toLowerCase().includes('passportno') || cols[0]?.toLowerCase().includes('passport')) {
      isHeaderPassed = true;
      continue;
    }

    if (isHeaderPassed && cols.length >= 2 && cols[0]) {
      // PassportNo, First Name, Family Name, Birth Date, Gender
      const passportNo = cols[0];
      const firstName = cols[1] || '';
      const familyName = cols[2] || '';
      const birthDate = cols[3] || '';
      const gender = (cols[4] || 'Male').startsWith('F') ? 'F' : 'M';

      // Estimate Pax Type
      let paxType: PaxType = 'Adult';
      if (birthDate) {
        try {
          const parts = birthDate.split('/');
          if (parts.length === 3) {
            const bYear = parseInt(parts[2], 10);
            const currentYear = 2026;
            const age = currentYear - bYear;
            if (age < 2) paxType = 'Infant';
            else if (age < 12) paxType = 'Child';
          }
        } catch {}
      }

      const fullName = `${firstName} ${familyName}`.trim();

      mutamers.push({
        id: `m-std-${Date.now()}-${sno}`,
        sno: sno++,
        passportNo,
        firstName,
        familyName,
        mutamerName: fullName,
        gender,
        paxType,
        bed: paxType === 'Infant' ? 'No' : 'Yes',
        mofaNo: '4809' + Math.floor(100000 + Math.random() * 900000),
        grpNo: groupNo,
        visaNo: '9840' + Math.floor(1000 + Math.random() * 9000),
        pnr: 'PK-' + Math.floor(100 + Math.random() * 900),
        birthDate,
      });
    }
  }

  return { groupNo, groupName, mutamers };
}

export function parseNusukCSV(csvText: string): {
  groupNo: string;
  groupName: string;
  mutamers: Mutamer[];
} {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let groupNo = 'NUSUK-2026';
  let groupName = 'NUSUK GROUP';
  const mutamers: Mutamer[] = [];

  let dataStarted = false;
  let sno = 1;

  for (const line of lines) {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.some(c => c.toLowerCase().includes('passport'))) {
      dataStarted = true;
      continue;
    }

    if (dataStarted && cols.length >= 3 && cols[2]) {
      // Group Code, Group Name, Passport No, Mutamer Full Name, Nationality, Gender, DOB, Visa No, MOFA No, PNR
      groupNo = cols[0] || groupNo;
      groupName = cols[1] || groupName;
      const passportNo = cols[2];
      const fullName = cols[3] || 'Mutamer ' + sno;
      const nationality = cols[4] || 'Pakistani';
      const gender = (cols[5] || '').toLowerCase().startsWith('f') ? 'F' : 'M';
      const dob = cols[6] || '';
      const visaNo = cols[7] || '98' + Math.floor(100000 + Math.random() * 900000);
      const mofaNo = cols[8] || '480' + Math.floor(1000000 + Math.random() * 9000000);
      const pnr = cols[9] || 'SV' + Math.floor(100 + Math.random() * 900);

      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || fullName;
      const familyName = nameParts.slice(1).join(' ') || firstName;

      mutamers.push({
        id: `m-nsk-${Date.now()}-${sno}`,
        sno: sno++,
        passportNo,
        firstName,
        familyName,
        mutamerName: fullName,
        gender,
        paxType: 'Adult',
        bed: 'Yes',
        mofaNo,
        grpNo: groupNo,
        visaNo,
        pnr,
        birthDate: dob,
        nationality,
      });
    }
  }

  return { groupNo, groupName, mutamers };
}

// Parser for Mutamers List Export (External Agent: Main EA / Sub EA e.g. ANAS AMEER HAMZA) from Excel/PDF
export function parseExternalAgentExport(rawText: string): {
  groupNo: string;
  groupName: string;
  subEAName: string;
  subEACode: string;
  mainEAName: string;
  mainEACode: string;
  mutamers: Mutamer[];
} {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let groupNo = '42892';
  let groupName = 'ANAS AMEER HAMZA';
  let subEAName = 'ANAS AMEER HAMZA';
  let subEACode = '42892';
  let mainEAName = 'Ansharah International Travels';
  let mainEACode = '1006017';
  const mutamers: Mutamer[] = [];

  let dataStarted = false;
  let headerIndexMap: { [key: string]: number } = {};
  let sno = 1;

  for (const line of lines) {
    // Delimiter detection: tab or comma or multiple spaces
    const delimiter = line.includes('\t') ? '\t' : (line.includes(',') ? ',' : /\t+|\s{2,}/);
    const cols = (typeof delimiter === 'string' ? line.split(delimiter) : line.split(delimiter)).map(c => c.trim().replace(/^"|"$/g, ''));

    const lowerCols = cols.map(c => c.toLowerCase());
    if (lowerCols.some(c => c.includes('mutamer name') || c.includes('passport'))) {
      dataStarted = true;
      lowerCols.forEach((col, idx) => {
        if (col.includes('mutamer name') || col === 'name') headerIndexMap['name'] = idx;
        else if (col.includes('age')) headerIndexMap['age'] = idx;
        else if (col.includes('passport')) headerIndexMap['passport'] = idx;
        else if (col.includes('nationality')) headerIndexMap['nationality'] = idx;
        else if (col.includes('main external agent name') || col.includes('main ea name')) headerIndexMap['mainEAName'] = idx;
        else if (col.includes('main external agent code') || col.includes('main ea code')) headerIndexMap['mainEACode'] = idx;
        else if (col.includes('sub ea name')) headerIndexMap['subEAName'] = idx;
        else if (col.includes('sub ea code')) headerIndexMap['subEACode'] = idx;
        else if (col.includes('visa status')) headerIndexMap['visaStatus'] = idx;
        else if (col.includes('visa number') || col.includes('visa no')) headerIndexMap['visaNo'] = idx;
        else if (col.includes('mofa number') || col.includes('mofa no')) headerIndexMap['mofaNo'] = idx;
      });
      continue;
    }

    if (dataStarted && cols.length >= 3) {
      const getVal = (key: string, defaultIdx: number) => {
        const idx = headerIndexMap[key] !== undefined ? headerIndexMap[key] : defaultIdx;
        return cols[idx] || '';
      };

      const fullName = getVal('name', 0);
      if (!fullName) continue;

      const ageStr = getVal('age', 1);
      const passportNo = getVal('passport', 2);
      const nationality = getVal('nationality', 3) || 'Pakistan';
      const mEACode = getVal('mainEACode', 4);
      const mEAName = getVal('mainEAName', 5);
      const sEACode = getVal('subEACode', 6);
      const sEAName = getVal('subEAName', 7);
      const visaNo = getVal('visaNo', 10);
      const mofaNo = getVal('mofaNo', 11);

      if (sEACode) {
        subEACode = sEACode;
        groupNo = sEACode;
      }
      if (sEAName) {
        subEAName = sEAName;
        groupName = sEAName;
      }
      if (mEAName) mainEAName = mEAName;
      if (mEACode) mainEACode = mEACode;

      const age = parseInt(ageStr, 10);
      let paxType: PaxType = 'Adult';
      if (!isNaN(age)) {
        if (age < 2) paxType = 'Infant';
        else if (age < 12) paxType = 'Child';
      }

      // Infer gender or default to M
      const isFemale = /khatoon|bibi|begum|mai|fatima|parveen|khatun|bano/i.test(fullName);
      const gender = isFemale ? 'F' : 'M';

      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || fullName;
      const familyName = nameParts.slice(1).join(' ') || firstName;

      mutamers.push({
        id: `m-ea-${Date.now()}-${sno}`,
        sno: sno++,
        passportNo,
        firstName,
        familyName,
        mutamerName: fullName,
        gender,
        paxType,
        bed: paxType === 'Infant' ? 'No' : 'Yes',
        mofaNo: mofaNo || ('1465' + Math.floor(10000 + Math.random() * 90000)),
        grpNo: groupNo,
        visaNo: visaNo || ('6177' + Math.floor(100000 + Math.random() * 900000)),
        pnr: 'PK-' + Math.floor(100 + Math.random() * 900),
        birthDate: !isNaN(age) ? `Age: ${age}` : '',
        nationality,
      });
    }
  }

  return {
    groupNo: groupNo || '42892',
    groupName: groupName ? `${groupName}` : 'ANAS AMEER HAMZA',
    subEAName,
    subEACode,
    mainEAName,
    mainEACode,
    mutamers,
  };
}

// Calculate agent-specific hotel rate with custom discount or overridden contract rate
export function calculateAgentHotelRate(
  baseB2BRate: number,
  hotelName: string,
  agent?: B2BAgent
): {
  finalRate: number;
  discountSAR: number;
  discountReason: string;
} {
  if (!agent) {
    return { finalRate: baseB2BRate, discountSAR: 0, discountReason: '' };
  }

  // 1. Hotel-specific override or discount for this agent
  if (agent.customHotelDiscounts && agent.customHotelDiscounts.length > 0) {
    const custom = agent.customHotelDiscounts.find(
      (c) =>
        c.hotelName.toLowerCase().trim() === hotelName.toLowerCase().trim() ||
        hotelName.toLowerCase().includes(c.hotelName.toLowerCase().trim()) ||
        c.hotelName.toLowerCase().includes(hotelName.toLowerCase().trim())
    );
    if (custom) {
      if (custom.customRateSAR !== undefined && custom.customRateSAR > 0) {
        const discount = Math.max(0, baseB2BRate - custom.customRateSAR);
        return {
          finalRate: custom.customRateSAR,
          discountSAR: discount,
          discountReason: `Custom Contract Rate (${custom.customRateSAR} SAR/night)`,
        };
      }
      if (custom.discountSAR !== undefined && custom.discountSAR > 0) {
        const discounted = Math.max(1, baseB2BRate - custom.discountSAR);
        return {
          finalRate: discounted,
          discountSAR: custom.discountSAR,
          discountReason: `Hotel Specific Discount (-${custom.discountSAR} SAR/night)`,
        };
      }
    }
  }

  // 2. Agent flat SAR discount per night across all hotels
  if (agent.defaultHotelDiscountSAR && agent.defaultHotelDiscountSAR > 0) {
    const discounted = Math.max(1, baseB2BRate - agent.defaultHotelDiscountSAR);
    return {
      finalRate: discounted,
      discountSAR: agent.defaultHotelDiscountSAR,
      discountReason: `Agent Special Discount (-${agent.defaultHotelDiscountSAR} SAR/night)`,
    };
  }

  // 3. Agent percentage discount across all hotels
  if (agent.defaultHotelDiscountPercent && agent.defaultHotelDiscountPercent > 0) {
    const discountAmount = Math.round((baseB2BRate * agent.defaultHotelDiscountPercent) / 100);
    const discounted = Math.max(1, baseB2BRate - discountAmount);
    return {
      finalRate: discounted,
      discountSAR: discountAmount,
      discountReason: `Agent Volume Discount (${agent.defaultHotelDiscountPercent}% off)`,
    };
  }

  return { finalRate: baseB2BRate, discountSAR: 0, discountReason: '' };
}

// Universal binary PDF parser to extract Group Code, Group Name, Mutamer Name, and Passport Number
export function parseMutamersFromPDFBytes(u8: Uint8Array): {
  groupNo: string;
  groupName: string;
  mutamers: Mutamer[];
} {
  let str = '';
  const len = u8.length;
  const chunkSz = 16384;
  for (let i = 0; i < len; i += chunkSz) {
    const chunk = u8.subarray(i, Math.min(i + chunkSz, len));
    str += String.fromCharCode.apply(null, Array.from(chunk));
  }

  // Parse font ToUnicode CMap table
  const map = new Map<string, string>();
  const cmapRegex = /<([0-9a-fA-F]{4})><([0-9a-fA-F]{4})>/g;
  let m: RegExpExecArray | null;
  while ((m = cmapRegex.exec(str)) !== null) {
    map.set(m[1].toLowerCase(), String.fromCharCode(parseInt(m[2], 16)));
  }

  const textList: string[] = [];
  // Extract hex encoded Tj
  const tjRegex = /<([0-9a-fA-F]+)>\s*Tj/g;
  let tMatch: RegExpExecArray | null;
  while ((tMatch = tjRegex.exec(str)) !== null) {
    const hex = tMatch[1].toLowerCase();
    let text = '';
    for (let i = 0; i < hex.length; i += 4) {
      const code = hex.substr(i, 4);
      text += map.get(code) || '';
    }
    textList.push(text.trim());
  }

  // Fallback: literal string Tj
  if (textList.length === 0) {
    const litRegex = /\(([^)]+)\)\s*Tj/g;
    let lMatch: RegExpExecArray | null;
    while ((lMatch = litRegex.exec(str)) !== null) {
      textList.push(lMatch[1].trim());
    }
  }

  let headerIdx = -1;
  for (let i = 0; i < textList.length; i++) {
    const t = textList[i].toLowerCase();
    if (t.includes('mutamer name') || (t.includes('passport') && !t.startsWith('p'))) {
      headerIdx = i;
      break;
    }
  }

  let groupNo = '42892';
  let groupName = 'ANAS AMEER HAMZA';
  const mutamers: Mutamer[] = [];

  if (headerIdx !== -1) {
    const stride = 12; // 12 columns per row in External Agent export
    let sno = 1;
    for (let i = headerIdx + stride; i < textList.length; i += stride) {
      const row = textList.slice(i, i + stride);
      if (row.length < 3) break;
      const fullName = row[0];
      const ageStr = row[1];
      const passportNo = row[2];
      const nationality = row[3] || 'Pakistan';
      const subEACode = row[6] || '';
      const subEAName = row[7] || '';
      const visaNo = row[10] || '';
      const mofaNo = row[11] || '';

      if (subEACode) groupNo = subEACode;
      if (subEAName) groupName = subEAName;

      if (fullName && passportNo) {
        const parts = fullName.trim().split(/\s+/);
        const firstName = parts[0] || fullName;
        const familyName = parts.slice(1).join(' ') || firstName;

        let ageNum = parseInt(ageStr, 10);
        let paxType: PaxType = 'Adult';
        if (!isNaN(ageNum)) {
          if (ageNum < 2) paxType = 'Infant';
          else if (ageNum < 12) paxType = 'Child';
        }

        mutamers.push({
          id: `m-pdf-${Date.now()}-${sno}`,
          sno: sno++,
          passportNo: passportNo.toUpperCase().trim(),
          firstName,
          familyName,
          mutamerName: fullName.trim(),
          gender: 'M',
          paxType,
          bed: paxType === 'Infant' ? 'No' : 'Yes',
          mofaNo: mofaNo || '4809' + Math.floor(100000 + Math.random() * 900000),
          grpNo: groupNo,
          visaNo: visaNo || '6177' + Math.floor(100000 + Math.random() * 900000),
          pnr: 'PK-' + Math.floor(100 + Math.random() * 900),
          nationality,
        });
      }
    }
  }

  return { groupNo, groupName, mutamers };
}
