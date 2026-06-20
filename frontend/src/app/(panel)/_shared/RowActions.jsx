"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Shared "عملیات" (operations) menu for panel tables.
 *
 * Renders a compact ⋯ trigger that opens a dropdown with the actions that are
 * actually supported for the row. Pass only the props for available actions —
 * unsupported actions are simply not rendered (no dead/disabled items):
 *  - view:   `viewHref` (Link) or `onView` (callback)
 *  - edit:   `editHref` (Link) or `onEdit` (callback)
 *  - delete: `onDelete` async callback; a confirm dialog is shown first.
 */
export default function RowActions({
  viewHref,
  onView,
  viewLabel = "مشاهده جزئیات",
  editHref,
  onEdit,
  editLabel = "ویرایش",
  onDelete,
  deleteLabel = "حذف",
  deleteTitle = "حذف مورد",
  deleteDescription = "آیا از حذف این مورد مطمئن هستید؟ این عملیات قابل بازگشت نیست.",
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasView = Boolean(viewHref || onView);
  const hasEdit = Boolean(editHref || onEdit);

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label="عملیات"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-36">
          {hasView ? (
            viewHref ? (
              <DropdownMenuItem asChild>
                <Link href={viewHref}>
                  <Eye />
                  {viewLabel}
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onView}>
                <Eye />
                {viewLabel}
              </DropdownMenuItem>
            )
          ) : null}

          {hasEdit ? (
            editHref ? (
              <DropdownMenuItem asChild>
                <Link href={editHref}>
                  <Pencil />
                  {editLabel}
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onEdit}>
                <Pencil />
                {editLabel}
              </DropdownMenuItem>
            )
          ) : null}

          {onDelete ? (
            <>
              {hasView || hasEdit ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  setConfirmOpen(true);
                }}
              >
                <Trash2 />
                {deleteLabel}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {onDelete ? (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{deleteTitle}</DialogTitle>
              <DialogDescription>{deleteDescription}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
              >
                انصراف
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "در حال حذف..." : deleteLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
