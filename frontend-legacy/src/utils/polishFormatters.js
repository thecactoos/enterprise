// Polish currency and number formatting utilities

/**
 * Format amount in Polish Złoty (PLN) with proper locale formatting
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string (e.g., "1 234,56 PLN")
 */
export const formatPLN = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0,00 PLN';
  }
  
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format number with Polish locale (space as thousands separator, comma as decimal)
 * @param {number} number - Number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string (e.g., "1 234,56")
 */
export const formatPolishNumber = (number, decimals = 2) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0' + (decimals > 0 ? ',' + '0'.repeat(decimals) : '');
  }
  
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

/**
 * Format percentage with Polish locale
 * @param {number} percentage - Percentage to format (as decimal, e.g., 0.23 for 23%)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string (e.g., "23,0%")
 */
export const formatPolishPercentage = (percentage, decimals = 1) => {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return '0' + (decimals > 0 ? ',' + '0'.repeat(decimals) : '') + '%';
  }
  
  return new Intl.NumberFormat('pl-PL', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(percentage);
};

/**
 * Format date in Polish format (DD.MM.YYYY)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string (e.g., "15.08.2024")
 */
export const formatPolishDate = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj);
};

/**
 * Format date and time in Polish format (DD.MM.YYYY HH:mm)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date time string (e.g., "15.08.2024 14:30")
 */
export const formatPolishDateTime = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

/**
 * Parse Polish number string to number
 * @param {string} polishNumber - Polish formatted number string (e.g., "1 234,56")
 * @returns {number} Parsed number
 */
export const parsePolishNumber = (polishNumber) => {
  if (!polishNumber || typeof polishNumber !== 'string') {
    return 0;
  }
  
  // Remove spaces and replace comma with dot
  const normalized = polishNumber
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, ''); // Remove non-numeric characters except dot and minus
  
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Parse Polish currency string to number
 * @param {string} polishCurrency - Polish formatted currency string (e.g., "1 234,56 PLN")
 * @returns {number} Parsed amount
 */
export const parsePolishCurrency = (polishCurrency) => {
  if (!polishCurrency || typeof polishCurrency !== 'string') {
    return 0;
  }
  
  // Remove currency symbol and parse as number
  const numberPart = polishCurrency.replace(/PLN/gi, '').trim();
  return parsePolishNumber(numberPart);
};

/**
 * Calculate VAT amount (Polish standard rate: 23%)
 * @param {number} netAmount - Net amount
 * @param {number} vatRate - VAT rate as decimal (default: 0.23 for 23%)
 * @returns {number} VAT amount
 */
export const calculateVAT = (netAmount, vatRate = 0.23) => {
  if (!netAmount || isNaN(netAmount)) {
    return 0;
  }
  
  return netAmount * vatRate;
};

/**
 * Calculate gross amount from net amount
 * @param {number} netAmount - Net amount
 * @param {number} vatRate - VAT rate as decimal (default: 0.23 for 23%)
 * @returns {number} Gross amount
 */
export const calculateGrossAmount = (netAmount, vatRate = 0.23) => {
  if (!netAmount || isNaN(netAmount)) {
    return 0;
  }
  
  return netAmount * (1 + vatRate);
};

/**
 * Calculate net amount from gross amount
 * @param {number} grossAmount - Gross amount
 * @param {number} vatRate - VAT rate as decimal (default: 0.23 for 23%)
 * @returns {number} Net amount
 */
export const calculateNetAmount = (grossAmount, vatRate = 0.23) => {
  if (!grossAmount || isNaN(grossAmount)) {
    return 0;
  }
  
  return grossAmount / (1 + vatRate);
};

/**
 * Calculate profit margin percentage
 * @param {number} sellingPrice - Selling price
 * @param {number} costPrice - Cost/purchase price
 * @returns {number} Margin percentage as decimal (e.g., 0.25 for 25%)
 */
export const calculateMarginPercentage = (sellingPrice, costPrice) => {
  if (!sellingPrice || !costPrice || sellingPrice <= 0 || costPrice <= 0) {
    return 0;
  }
  
  return (sellingPrice - costPrice) / costPrice;
};

/**
 * Calculate markup percentage
 * @param {number} sellingPrice - Selling price
 * @param {number} costPrice - Cost/purchase price
 * @returns {number} Markup percentage as decimal (e.g., 0.40 for 40%)
 */
export const calculateMarkupPercentage = (sellingPrice, costPrice) => {
  if (!sellingPrice || !costPrice || sellingPrice <= 0 || costPrice <= 0) {
    return 0;
  }
  
  return (sellingPrice - costPrice) / sellingPrice;
};

/**
 * Round to nearest grosze (5 grosze increments for Polish pricing)
 * @param {number} amount - Amount to round
 * @param {number} increment - Increment to round to (default: 0.05 for 5 grosze)
 * @returns {number} Rounded amount
 */
export const roundToNearestGrosze = (amount, increment = 0.05) => {
  if (!amount || isNaN(amount)) {
    return 0;
  }
  
  return Math.round(amount / increment) * increment;
};

/**
 * Format Polish postal code (XX-XXX format)
 * @param {string} postalCode - Postal code to format
 * @returns {string} Formatted postal code
 */
export const formatPolishPostalCode = (postalCode) => {
  if (!postalCode || typeof postalCode !== 'string') {
    return '';
  }
  
  // Remove all non-numeric characters
  const digits = postalCode.replace(/\D/g, '');
  
  // Format as XX-XXX if we have 5 digits
  if (digits.length === 5) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  
  return postalCode; // Return original if can't format
};

/**
 * Validate and format NIP (Polish tax number)
 * @param {string} nip - NIP to format
 * @returns {string} Formatted NIP (XXX-XXX-XX-XX or XXX-XX-XX-XXX)
 */
export const formatNIP = (nip) => {
  if (!nip || typeof nip !== 'string') {
    return '';
  }
  
  // Remove all non-numeric characters
  const digits = nip.replace(/\D/g, '');
  
  // Format as XXX-XXX-XX-XX if we have 10 digits
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
  }
  
  return nip; // Return original if can't format
};

/**
 * Validate NIP checksum (Polish tax number validation)
 * @param {string} nip - NIP to validate
 * @returns {boolean} True if NIP is valid
 */
export const validateNIP = (nip) => {
  if (!nip || typeof nip !== 'string') {
    return false;
  }
  
  // Remove all non-numeric characters
  const digits = nip.replace(/\D/g, '');
  
  // Must have exactly 10 digits
  if (digits.length !== 10) {
    return false;
  }
  
  // NIP validation algorithm
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const checksum = digits
    .slice(0, 9)
    .split('')
    .reduce((sum, digit, index) => sum + parseInt(digit) * weights[index], 0);
  
  const controlDigit = checksum % 11;
  
  // Control digit cannot be 10
  if (controlDigit === 10) {
    return false;
  }
  
  return controlDigit === parseInt(digits[9]);
};

// Export all functions as default object for convenience
export default {
  formatPLN,
  formatPolishNumber,
  formatPolishPercentage,
  formatPolishDate,
  formatPolishDateTime,
  parsePolishNumber,
  parsePolishCurrency,
  calculateVAT,
  calculateGrossAmount,
  calculateNetAmount,
  calculateMarginPercentage,
  calculateMarkupPercentage,
  roundToNearestGrosze,
  formatPolishPostalCode,
  formatNIP,
  validateNIP
};