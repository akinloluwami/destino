export function readableTime(
  amount: number,
  unit: "s" | "m" | "h" | "d"
): number {
  const units = {
    s: 1000,
    m: 1000 * 60,
    h: 1000 * 60 * 60,
    d: 1000 * 60 * 60 * 24,
  };
  return amount * units[unit];
}
