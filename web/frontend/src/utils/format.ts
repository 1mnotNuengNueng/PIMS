export function formatMoney(num: number | string | undefined | null): string {
  const parsed = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(parsed || 0);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}
