export function addAtomic(a: string, b: string): string {
  return (BigInt(a) + BigInt(b)).toString();
}

export function subAtomic(a: string, b: string): string {
  const result = BigInt(a) - BigInt(b);
  if (result < 0n) {
    throw new Error("NEGATIVE_ATOMIC_AMOUNT");
  }
  return result.toString();
}

export function gteAtomic(a: string, b: string): boolean {
  return BigInt(a) >= BigInt(b);
}

export function gtAtomic(a: string, b: string): boolean {
  return BigInt(a) > BigInt(b);
}

export function sumAtomic(values: string[]): string {
  return values.reduce((acc, value) => acc + BigInt(value), 0n).toString();
}

export function ratioDecimal(numerator: string, denominator: string): string {
  const den = BigInt(denominator);
  if (den === 0n) {
    return "0";
  }
  const scaled = (BigInt(numerator) * 1_000_000n) / den;
  const whole = scaled / 1_000_000n;
  const fraction = (scaled % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}
