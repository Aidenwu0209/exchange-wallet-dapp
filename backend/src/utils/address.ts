import { getAddress, isAddress } from "ethers";

export function normalizeAddress(address: string): string {
  return getAddress(address);
}

export function isEvmAddress(address: string): boolean {
  return isAddress(address);
}
