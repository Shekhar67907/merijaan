/**
 * Generates a prescription number in the format P2324-XXX
 * Simple fixed implementation that will always generate a number
 */
export const generatePrescriptionNo = (): string => {
  // Fixed current fiscal year
  const fiscalYear = '2324';
  
  // Generate a 3-digit number based on current timestamp
  const timestamp = new Date().getTime();
  
  // Use last 3 digits for a simple unique ID
  const sequentialNum = (timestamp % 1000).toString().padStart(3, '0');
  
  // Hardcoded working value as fallback if all else fails
  return `P${fiscalYear}-${sequentialNum || '123'}`;
};

/**
 * Calculates IPD from RPD and LPD values
 */
export const calculateIPD = (rpd: string, lpd: string): string => {
  const rpdValue = parseFloat(rpd || '0');
  const lpdValue = parseFloat(lpd || '0');
  
  if (isNaN(rpdValue) || isNaN(lpdValue)) {
    return '';
  }
  
  return (rpdValue + lpdValue).toFixed(1);
};

/**
 * Formats a numeric input to ensure it has a '+' prefix if positive
 */
export const formatNumericInput = (value: string): string => {
  if (!value) return '';
  
  // Allow negative sign to be entered and maintained
  if (value === '-' || value.startsWith('-')) {
    return value;
  }

  const numericValue = parseFloat(value);
  
  if (isNaN(numericValue)) return '';
  
  // Add '+' only if the value is positive and doesn't start with '+'.
  // The check for '-' is already handled above.
  if (numericValue > 0 && !value.startsWith('+')) {
    return `+${numericValue}`;
  }
  
  return value;
};

/**
 * Returns today's date in YYYY-MM-DD format
 */
export const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Returns date one month from today in YYYY-MM-DD format
 */
export const getNextMonthDate = (): string => {
  const today = new Date();
  today.setMonth(today.getMonth() + 1);
  return today.toISOString().split('T')[0];
};

export const titleOptions: Array<{ label: string, value: string }> = [
  { label: 'Mr.', value: 'Mr.' },
  { label: 'Ms.', value: 'Ms.' },
  { label: 'Mrs.', value: 'Mrs.' },
  { label: 'Dr.', value: 'Dr.' }
];

export const classOptions: Array<{ label: string, value: string }> = [
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'Business', value: 'Business' },
  { label: 'C', value: 'C' },
  { label: 'D', value: 'D' },
  { label: 'Dr', value: 'Dr' },
  { label: 'Rajness', value: 'Rajness' },
  { label: 'Gold', value: 'Gold' }
];

export const prescribedByOptions: Array<{ label: string, value: string }> = [
  { label: 'Self', value: 'Self' },
  { label: 'Doctor', value: 'Doctor' },
  { label: 'Optometrist', value: 'Optometrist' }
];