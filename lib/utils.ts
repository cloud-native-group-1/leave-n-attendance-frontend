import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ProxyUserOut } from "./services/leave-request"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string to a more readable format
 * @param dateString Date string in ISO format (YYYY-MM-DD)
 * @returns Formatted date string (e.g., "Oct 25, 2023")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * 格式化用戶全名
 */
export function formatName(person: { first_name?: string; last_name?: string } | null | undefined) {
  if (!person) return '-';
  return `${person.last_name || ''}${person.first_name || ''}`.trim() || '-';
}