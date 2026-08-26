/**
 * Persian TimePicker Component
 * Simple 24-hour time picker with Iran timezone support
 */

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { toPersianDigits } from '@/utils/jalali';

export interface PersianTimePickerProps {
  /** Value as "HH:mm" string */
  value?: string | null;
  /** Callback when time changes (returns "HH:mm" string) */
  onChange: (time: string | null) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export default function PersianTimePicker({
  value,
  onChange,
  placeholder = 'ساعت را انتخاب کنید',
  disabled = false,
  className = '',
}: PersianTimePickerProps) {
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const parts = value.split(':');
      if (parts.length === 2) {
        const h = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        if (!isNaN(h) && h >= 0 && h <= 23) setHour(h);
        if (!isNaN(m) && m >= 0 && m <= 59) setMinute(m);
      }
    }
  }, [value]);

  const handleTimeChange = (newHour: number, newMinute: number) => {
    setHour(newHour);
    setMinute(newMinute);
    const timeString = `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
    onChange(timeString);
  };

  const displayValue = value
    ? `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    : '';

  return (
    <div className={`relative ${className}`}>
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
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className={`text-sm ${displayValue ? 'text-foreground' : 'text-muted-foreground'}`}>
            {displayValue ? toPersianDigits(displayValue) : placeholder}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 fp-card fp-notch-sm shadow-2xl p-4 min-w-[200px]">
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <label className="text-muted-foreground text-xs">ساعت</label>
              <select
                value={hour}
                onChange={(e) => handleTimeChange(parseInt(e.target.value), minute)}
                className="bg-background border border-input rounded px-3 py-2 text-foreground text-sm min-w-[80px]"
                disabled={disabled}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {toPersianDigits(i.toString().padStart(2, '0'))}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-muted-foreground text-xl mt-6">:</div>
            <div className="flex flex-col items-center gap-2">
              <label className="text-muted-foreground text-xs">دقیقه</label>
              <select
                value={minute}
                onChange={(e) => handleTimeChange(hour, parseInt(e.target.value))}
                className="bg-background border border-input rounded px-3 py-2 text-foreground text-sm min-w-[80px]"
                disabled={disabled}
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>
                    {toPersianDigits(i.toString().padStart(2, '0'))}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="mt-4 w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm transition-colors"
            type="button"
          >
            تایید
          </button>
        </div>
      )}
    </div>
  );
}
