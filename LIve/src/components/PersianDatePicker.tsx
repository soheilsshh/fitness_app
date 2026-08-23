import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toPersian, persianToGregorian, formatPersianDate, getPersianMonthName, getPersianDayName } from '@/utils/persianDate';

interface PersianDatePickerProps {
  value?: string; // Format: YYYY/MM/DD
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند"
];

const PERSIAN_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

export default function PersianDatePicker({
  value,
  onChange,
  placeholder = "تاریخ را انتخاب کنید",
  disabled = false,
  className = ""
}: PersianDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState<number>(1403);
  const [currentMonth, setCurrentMonth] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          setSelectedDate({ year, month, day });
          setCurrentYear(year);
          setCurrentMonth(month);
        }
      }
    } else {
      // Default to today
      const today = toPersian(new Date());
      setCurrentYear(today.year);
      setCurrentMonth(today.month);
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
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
  }, [isOpen]);

  const getDaysInMonth = (year: number, month: number): number => {
    if (month <= 6) {
      return 31;
    } else if (month <= 11) {
      return 30;
    } else {
      // Month 12 (Esfand) - check for leap year (simplified)
      // In a full implementation, you'd check if the year is a leap year
      return 29; // Default to 29, but should check leap year
    }
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    const firstDayGregorian = persianToGregorian(year, month, 1);
    const dayOfWeek = firstDayGregorian.getDay();
    // Convert to Persian week day (Saturday = 0)
    return dayOfWeek === 6 ? 0 : dayOfWeek + 1;
  };

  const handleDateSelect = (day: number) => {
    const newDate = { year: currentYear, month: currentMonth, day };
    setSelectedDate(newDate);
    const dateString = `${newDate.year}/${String(newDate.month).padStart(2, '0')}/${String(newDate.day).padStart(2, '0')}`;
    onChange(dateString);
    setIsOpen(false);
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
    onChange('');
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const displayValue = selectedDate
    ? `${selectedDate.year}/${String(selectedDate.month).padStart(2, '0')}/${String(selectedDate.day).padStart(2, '0')}`
    : '';

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between
          px-4 py-2.5
          bg-[#0f0f0f] border border-gray-800
          rounded-lg
          cursor-pointer
          transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-700'}
          ${isOpen ? 'border-emerald-500' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className={`text-sm ${displayValue ? 'text-gray-200' : 'text-gray-500'}`}>
            {displayValue || placeholder}
          </span>
        </div>
        {displayValue && !disabled && (
          <button
            onClick={clearDate}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            type="button"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-[#0a0a0a] border border-gray-800 rounded-xl shadow-2xl p-4 min-w-[320px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              type="button"
            >
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
            <div className="text-center">
              <div className="text-white font-semibold text-lg">
                {getPersianMonthName(currentMonth)} {currentYear}
              </div>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              type="button"
            >
              <ChevronLeft className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {PERSIAN_DAYS.map((day, index) => (
              <div
                key={index}
                className="text-center text-xs text-gray-500 font-medium py-2"
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

              const isSelected =
                selectedDate &&
                selectedDate.year === currentYear &&
                selectedDate.month === currentMonth &&
                selectedDate.day === day;

              const isToday = (() => {
                const today = toPersian(new Date());
                return (
                  today.year === currentYear &&
                  today.month === currentMonth &&
                  today.day === day
                );
              })();

              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(day)}
                  className={`
                    aspect-square flex items-center justify-center
                    text-sm rounded-lg
                    transition-all
                    ${isSelected
                      ? 'bg-emerald-600 text-white font-semibold'
                      : isToday
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-gray-300 hover:bg-gray-800'
                    }
                  `}
                  type="button"
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
