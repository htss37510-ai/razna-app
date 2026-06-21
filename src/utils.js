/**
 * Converts Eastern Arabic numerals (٠-٩) and Persian numerals (۰-۹) 
 * to standard English/ASCII numerals (0-9).
 * @param {string|number} input 
 * @returns {string} Normalized string with only English digits.
 */
export const toEnglishDigits = (input) => {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48));
};

/**
 * Extracts only digits from a string after normalizing them.
 * @param {string} input 
 * @returns {string}
 */
export const cleanDigits = (input) => {
  const normalized = toEnglishDigits(input);
  return normalized.replace(/[^0-9]/g, '');
};
