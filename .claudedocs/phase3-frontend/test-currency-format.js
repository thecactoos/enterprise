// Quick test to check actual Polish currency formatting
const formatPLN = (amount) => {
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

console.log('Testing Polish currency formatting:');
console.log('1234.56:', JSON.stringify(formatPLN(1234.56)));
console.log('123456.78:', JSON.stringify(formatPLN(123456.78)));
console.log('0:', JSON.stringify(formatPLN(0)));
console.log('0.05:', JSON.stringify(formatPLN(0.05)));
console.log('null:', JSON.stringify(formatPLN(null)));