import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const MATCH_THRESHOLD = 70;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
