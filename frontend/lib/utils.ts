/**
 * Utility function to get a cookie value by name
 */
export function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || '';
  }
  return '';
}

/**
 * Utility function to set a cookie
 */
export function setCookie(name: string, value: string, days: number = 365): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

/**
 * Utility function to escape CSV values
 */
export function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes(' ')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Safely extract a string value for CSV export
 */
export function getCSVValue(data: Record<string, any>, fieldName: string): string {
  const value = data[fieldName];
  if (value === undefined || value === null) return '';
  return escapeCSV(String(value));
}
