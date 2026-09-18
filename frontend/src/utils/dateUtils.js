/**
 * Utility functions for Date formatting, parsing, and validation in DD/MM/YYYY format.
 */

/**
 * Formats YYYY-MM-DD or Date object into DD/MM/YYYY
 */
export function formatIsoToDdMmYyyy(isoDateStr) {
  if (!isoDateStr) return '';
  const parts = String(isoDateStr).trim().split('T')[0].split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (year.length === 4 && month.length <= 2 && day.length <= 2) {
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
  }
  const dateObj = new Date(isoDateStr);
  if (!isNaN(dateObj.getTime())) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return String(isoDateStr);
}

/**
 * Parses user input in DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD format
 * Returns YYYY-MM-DD if valid, or null if invalid calendar date
 */
export function parseUserDateToIso(userInput) {
  if (!userInput || typeof userInput !== 'string') return null;
  const clean = userInput.trim();

  // Pattern 1: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);

    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    if (year < 2020 || year > 2099) return null;

    // Check actual calendar validity (e.g., Feb 31 -> invalid)
    const testDate = new Date(year, month - 1, day);
    if (
      testDate.getFullYear() !== year ||
      testDate.getMonth() !== month - 1 ||
      testDate.getDate() !== day
    ) {
      return null;
    }

    const isoDay = String(day).padStart(2, '0');
    const isoMonth = String(month).padStart(2, '0');
    return `${year}-${isoMonth}-${isoDay}`;
  }

  // Pattern 2: YYYY-MM-DD (Native datepicker input)
  const ymdMatch = clean.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);

    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    const testDate = new Date(year, month - 1, day);
    if (
      testDate.getFullYear() !== year ||
      testDate.getMonth() !== month - 1 ||
      testDate.getDate() !== day
    ) {
      return null;
    }

    const isoDay = String(day).padStart(2, '0');
    const isoMonth = String(month).padStart(2, '0');
    return `${year}-${isoMonth}-${isoDay}`;
  }

  return null;
}
