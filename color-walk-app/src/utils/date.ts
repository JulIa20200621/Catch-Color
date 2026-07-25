export function toLocalDateString(value: Date | string = new Date()): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const localTime = date.getTime() - date.getTimezoneOffset() * 60_000;
  return new Date(localTime).toISOString().slice(0, 10);
}
