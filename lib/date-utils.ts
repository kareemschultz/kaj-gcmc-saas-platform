// Date utility functions using date-fns

import { format, parseISO, isAfter, isBefore, addDays, addMonths, addYears, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { DATE_FORMATS } from '@/config/constants';

export function formatDate(date: Date | string, formatStr: string = DATE_FORMATS.DISPLAY): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

export function formatDateInput(date: Date | string): string {
  return formatDate(date, DATE_FORMATS.INPUT);
}

export function formatDateFull(date: Date | string): string {
  return formatDate(date, DATE_FORMATS.FULL);
}

export function isExpired(expiryDate: Date | string): boolean {
  const dateObj = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
  return isBefore(dateObj, new Date());
}

export function isExpiringSoon(expiryDate: Date | string, daysThreshold: number = 30): boolean {
  const dateObj = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
  const thresholdDate = addDays(new Date(), daysThreshold);
  return isAfter(dateObj, new Date()) && isBefore(dateObj, thresholdDate);
}

export function getDaysUntilExpiry(expiryDate: Date | string): number {
  const dateObj = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
  return differenceInDays(dateObj, new Date());
}

export function getNextMonthlyDueDate(dueDay: number): Date {
  const today = new Date();
  const thisMonthDue = new Date(today.getFullYear(), today.getMonth(), dueDay);
  
  if (isAfter(today, thisMonthDue)) {
    return addMonths(thisMonthDue, 1);
  }
  
  return thisMonthDue;
}

export function getQuarterlyDueDate(month: number, day: number): Date {
  const today = new Date();
  const year = today.getFullYear();
  const quarters = [
    new Date(year, month - 1, day),
    new Date(year, month + 2, day),
    new Date(year, month + 5, day),
    new Date(year, month + 8, day),
  ];
  
  const nextDue = quarters.find(q => isAfter(q, today));
  return nextDue || addYears(quarters[0], 1);
}

export function getAnnualDueDate(month: number, day: number): Date {
  const today = new Date();
  const year = today.getFullYear();
  const dueDate = new Date(year, month - 1, day);
  
  if (isAfter(today, dueDate)) {
    return addYears(dueDate, 1);
  }
  
  return dueDate;
}

export function getPeriodLabel(periodStart: Date | string, periodEnd: Date | string): string {
  const start = typeof periodStart === 'string' ? parseISO(periodStart) : periodStart;
  const end = typeof periodEnd === 'string' ? parseISO(periodEnd) : periodEnd;
  
  return `${format(start, 'MMM yyyy')} - ${format(end, 'MMM yyyy')}`;
}

export function getMonthPeriod(date: Date = new Date()): { start: Date; end: Date } {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}
