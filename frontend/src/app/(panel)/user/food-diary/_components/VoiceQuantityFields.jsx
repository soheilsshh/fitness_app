"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TOUCH_FIELD =
  "h-11 min-h-11 text-base transition-colors duration-200 md:text-sm";

export default function VoiceQuantityFields({
  foodName,
  qty,
  unit,
  units,
  onQtyChange,
  onUnitChange,
  idPrefix,
}) {
  const qtyId = `${idPrefix}-qty`;
  const unitId = `${idPrefix}-unit`;
  const hasUnits = (units || []).length > 0;

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <div className="space-y-1.5 text-start">
        <Label htmlFor={qtyId}>مقدار</Label>
        <Input
          id={qtyId}
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={qty}
          onChange={(e) => onQtyChange(e.target.value)}
          className={`${TOUCH_FIELD} tabular-nums`}
        />
      </div>
      <div className="space-y-1.5 text-start">
        <Label htmlFor={unitId} className="min-w-0">
          <span>واحد</span>
          {foodName ? (
            <span className="truncate font-normal text-muted-foreground" title={foodName}>
              · {foodName}
            </span>
          ) : null}
        </Label>
        {hasUnits ? (
          <Select value={unit || undefined} onValueChange={onUnitChange}>
            <SelectTrigger
              id={unitId}
              size="default"
              className={`${TOUCH_FIELD} w-full cursor-pointer`}
            >
              <SelectValue placeholder="انتخاب واحد" />
            </SelectTrigger>
            <SelectContent position="popper" align="end" className="z-80">
              {units.map((u) => (
                <SelectItem key={u.unit} value={u.unit} className="cursor-pointer">
                  {u.unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="flex h-11 min-h-11 items-center rounded-lg border border-dashed px-2.5 text-xs text-muted-foreground">
            واحدی در دیتابیس این غذا نیست
          </p>
        )}
      </div>
    </div>
  );
}
