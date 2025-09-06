import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getReadingLevelLabel(level: number): string {
    switch (level) {
        case 1:
            return 'Way Below Age Level';
        case 2:
            return 'Below Age Level';
        case 3:
            return 'At Age Level';
        case 4:
            return 'Above Age Level';
        case 5:
            return 'Way Above Age Level';
        default:
            return 'At Age Level';
    }
}
