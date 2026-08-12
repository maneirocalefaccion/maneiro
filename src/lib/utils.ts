export function parseNum(val: string | number): number {
  if (typeof val === 'number') return Math.round(val * 100);
  if (!val) return 0;
  
  // Remove currency symbols and spaces
  let str = val.toString().replace(/[$\s]/g, '');
  
  // Handle argentine format 1.000.500,50
  if (str.includes(',') && str.includes('.')) {
    // If multiple dots, or dot before comma: 1.000.500,50
    if (str.lastIndexOf('.') < str.indexOf(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US format 1,000,500.50
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Only comma: 500,50
    str = str.replace(',', '.');
  }
  
  const parsed = parseFloat(str);
  if (isNaN(parsed)) return 0;
  
  return Math.round(parsed * 100);
}

export function centsToPesos(cents: number): number {
  if (typeof cents !== 'number' || isNaN(cents)) return 0;
  return cents / 100;
}

export function formatMoney(cents: number, currency: string = 'ARS'): string {
  const amount = centsToPesos(cents);
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formatted = formatter.format(amount);
  
  if (currency === 'USD') {
    return formatted.replace('US$', 'u$s');
  }
  return formatted;
}

export function parseFecha(val: string | Date): Date {
  if (val instanceof Date) return val;
  if (!val) return new Date();

  // Try parsing ISO
  const isoDate = new Date(val);
  if (!isNaN(isoDate.getTime())) return isoDate;

  // Handle DD/MM/YYYY or DD-MM-YYYY
  const parts = val.split(/[\/\-]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    const parsedDate = new Date(year, month, day);
    if (!isNaN(parsedDate.getTime())) return parsedDate;
  }

  return new Date();
}

export function generateCorrelativo(prefix: string, count: number): string {
  const nextNum = (count + 1).toString().padStart(6, '0');
  return `${prefix}-${nextNum}`;
}
