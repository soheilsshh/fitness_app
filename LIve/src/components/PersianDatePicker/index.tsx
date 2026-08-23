/**
 * Persian (Jalali) DatePicker Component
 * Modern, clean, and type-safe date picker for React + TypeScript
 */

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  getJalaliDate,
  toJalali,
  toGregorian,
  getJalaliMonthName,
  getJalaliDayName,
  getDaysInJalaliMonth,
  toPersianDigits,
  toEnglishDigits,
  parseJalaliInput,
  formatJalali,
} from '@/utils/jalali';

export interface PersianDatePickerProps {
  /** Value as Gregorian Date object or ISO string */
  value?: Date | string | null;
  /** Callback when date changes (returns Gregorian Date) */
  onChange: (date: Date | null) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Minimum selectable date (Gregorian) */
  minDate?: Date | string;
  /** Maximum selectable date (Gregorian) */
  maxDate?: Date | string;
  /** Show time picker */
  showTime?: boolean;
  /** Inline mode (always visible) */
  inline?: boolean;
}

const PERSIAN_DAY_NAMES = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export default function PersianDatePicker({
  value,
  onChange,
  placeholder = 'تاریخ را انتخاب کنید',
  disabled = false,
  className = '',
  minDate,
  maxDate,
  showTime = false,
  inline = false,
}: PersianDatePickerProps) {
  const [isOpen, setIsOpen] = useState(inline);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? (typeof value === 'string' ? new Date(value) : value) : null
  );

  // Get current Jalali date for calendar navigation
  const jalaliDate = getJalaliDate(selectedDate || new Date());
  const [currentYear, setCurrentYear] = useState(jalaliDate?.year || 1403);
  const [currentMonth, setCurrentMonth] = useState(jalaliDate?.month || 1);

  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(0);

  const pickerRef = useRef<HTMLDivElement>(null);

  // Update selected date when value prop changes
  useEffect(() => {
    if (value === null || value === undefined) {
      setSelectedDate(null);
      return;
    }

    const dt = typeof value === 'string' ? new Date(value) : value;
    if (!isNaN(dt.getTime())) {
      setSelectedDate(dt);
      const jalali = getJalaliDate(dt);
      if (jalali) {
        setCurrentYear(jalali.year);
        setCurrentMonth(jalali.month);
        setSelectedHour(dt.getHours());
        setSelectedMinute(dt.getMinutes());
      }
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    if (inline) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, inline]);

  const handleDateSelect = (day: number) => {
    const newDate = toGregorian(currentYear, currentMonth, day, selectedHour, selectedMinute);
    setSelectedDate(newDate);
    onChange(newDate);

    if (!inline && !showTime) {
      setIsOpen(false);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(null);
    onChange(null);
    if (!inline) {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (hour: number, minute: number) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);

    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(hour);
      newDate.setMinutes(minute);
      setSelectedDate(newDate);
      onChange(newDate);
    } else {
      const today = new Date();
      today.setHours(hour);
      today.setMinutes(minute);
      const jalali = getJalaliDate(today);
      if (jalali) {
        const newDate = toGregorian(jalali.year, jalali.month, jalali.day, hour, minute);
        setSelectedDate(newDate);
        onChange(newDate);
      }
    }
  };

  const daysInMonth = getDaysInJalaliMonth(currentYear, currentMonth);
  const today = getJalaliDate(new Date());

  // Calculate first day of month
  // In Persian calendar, week starts from Saturday
  const firstDayDate = toGregorian(currentYear, currentMonth, 1);
  const firstDay = firstDayDate.getDay(); // 0=Sunday, 6=Saturday
  // Convert to Persian week: Saturday=0, Sunday=1, Monday=2, ..., Friday=6
  const firstDayIndex = firstDay === 6 ? 0 : firstDay + 1;

  const days: (number | null)[] = Array(firstDayIndex).fill(null);
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const displayValue = selectedDate
    ? showTime
      ? formatJalali(selectedDate, 'YYYY/MM/DD HH:mm')
      : formatJalali(selectedDate, 'YYYY/MM/DD')
    : '';

  const isDateDisabled = (day: number): boolean => {
    if (!minDate && !maxDate) return false;

    const checkDate = toGregorian(currentYear, currentMonth, day);
    const min = minDate ? (typeof minDate === 'string' ? new Date(minDate) : minDate) : null;
    const max = maxDate ? (typeof maxDate === 'string' ? new Date(maxDate) : maxDate) : null;

    if (min && checkDate < min) return true;
    if (max && checkDate > max) return true;

    return false;
  };

  const isToday = (day: number): boolean => {
    if (!today) return false;
    return (
      today.year === currentYear &&
      today.month === currentMonth &&
      today.day === day
    );
  };

  const isSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    const jalali = getJalaliDate(selectedDate);
    if (!jalali) return false;

    return (
      jalali.year === currentYear &&
      jalali.month === currentMonth &&
      jalali.day === day
    );
  };

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      {!inline && (
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            flex items-center justify-between
            px-4 py-2.5
            bg-card border border-input
            rounded-xl
            cursor-pointer
            transition-all
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/40'}
            ${isOpen ? 'border-primary' : ''}
          `}
        >
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className={`text-sm ${displayValue ? 'text-foreground' : 'text-muted-foreground'}`}>
              {displayValue || placeholder}
            </span>
          </div>
          {displayValue && !disabled && (
            <button
              onClick={clearDate}
              className="p-1 hover:bg-foreground/5 rounded transition-colors"
              type="button"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {(isOpen || inline) && (
        <div className={`${inline ? '' : 'absolute top-full left-0 mt-2 z-50'} fp-card fp-notch-sm shadow-2xl p-4 min-w-[320px]`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
              type="button"
              disabled={disabled}
            >
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="text-center">
              <div className="text-foreground font-semibold text-lg">
                {getJalaliMonthName(currentMonth)} {toPersianDigits(currentYear)}
              </div>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
              type="button"
              disabled={disabled}
            >
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {PERSIAN_DAY_NAMES.map((day, index) => (
              <div
                key={index}
                className="text-center text-xs text-muted-foreground font-medium py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={index} />;
              }

              const disabled = isDateDisabled(day);
              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  key={index}
                  onClick={() => !disabled && handleDateSelect(day)}
                  disabled={disabled}
                  className={`
                    aspect-square flex items-center justify-center
                    text-sm rounded-lg
                    transition-all
                    ${disabled
                      ? 'text-muted-foreground/40 cursor-not-allowed'
                      : selected
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : today
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'text-foreground hover:bg-foreground/5'
                    }
                  `}
                  type="button"
                >
                  {toPersianDigits(day)}
                </button>
              );
            })}
          </div>

          {/* Time Picker (if enabled) */}
          {showTime && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-muted-foreground text-xs">ساعت:</label>
                  <select
                    value={selectedHour}
                    onChange={(e) => handleTimeChange(parseInt(e.target.value), selectedMinute)}
                    className="bg-background border border-input rounded px-2 py-1 text-foreground text-sm"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-muted-foreground text-xs">دقیقه:</label>
                  <select
                    value={selectedMinute}
                    onChange={(e) => handleTimeChange(selectedHour, parseInt(e.target.value))}
                    className="bg-background border border-input rounded px-2 py-1 text-foreground text-sm"
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
