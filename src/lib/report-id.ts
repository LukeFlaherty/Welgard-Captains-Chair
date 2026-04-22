export function generateReportId(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `WRP-${year}-${rand}`;
}
