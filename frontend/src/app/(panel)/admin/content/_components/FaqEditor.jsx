"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { newFaqGroupId } from "@/lib/api/contentHelpers";

export default function FaqEditor({ value, onChange }) {
  const groups = Array.isArray(value) ? value : [];

  const setGroups = (next) => onChange?.(next);

  const updateGroup = (id, patch) => {
    setGroups(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const removeGroup = (id) => {
    setGroups(groups.filter((g) => g.id !== id));
  };

  const addGroup = () => {
    setGroups([
      ...groups,
      {
        id: newFaqGroupId(),
        title: "دسته جدید",
        items: [{ q: "", a: "" }],
      },
    ]);
  };

  const updateItem = (groupId, index, patch) => {
    setGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        const items = (g.items || []).map((item, i) =>
          i === index ? { ...item, ...patch } : item
        );
        return { ...g, items };
      })
    );
  };

  const addItem = (groupId) => {
    setGroups(
      groups.map((g) =>
        g.id === groupId
          ? { ...g, items: [...(g.items || []), { q: "", a: "" }] }
          : g
      )
    );
  };

  const removeItem = (groupId, index) => {
    setGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        const items = (g.items || []).filter((_, i) => i !== index);
        return { ...g, items };
      })
    );
  };

  const totalItems = groups.reduce((n, g) => n + (g.items?.length || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {groups.length.toLocaleString("fa-IR")} دسته ·{" "}
          {totalItems.toLocaleString("fa-IR")} سوال
        </p>
        <Button type="button" size="sm" onClick={addGroup}>
          <Plus className="size-4" />
          دسته جدید
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            هنوز دسته‌ای برای FAQ تعریف نشده.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {groups.map((group) => (
            <AccordionItem
              key={group.id}
              value={group.id}
              className="rounded-xl border px-3"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <span className="font-iranianSansDemiBold text-sm">
                  {group.title || "بدون عنوان"}
                </span>
                <span className="ms-2 text-xs text-muted-foreground">
                  ({(group.items || []).length} سوال)
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label>عنوان دسته</Label>
                  <Input
                    value={group.title || ""}
                    onChange={(e) =>
                      updateGroup(group.id, { title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-3">
                  {(group.items || []).map((item, index) => (
                    <div
                      key={`${group.id}-${index}`}
                      className="space-y-3 rounded-xl border bg-muted/20 p-4"
                    >
                      <div className="space-y-2">
                        <Label>سوال</Label>
                        <Input
                          value={item.q || ""}
                          onChange={(e) =>
                            updateItem(group.id, index, { q: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>پاسخ</Label>
                        <Textarea
                          rows={4}
                          value={item.a || ""}
                          onChange={(e) =>
                            updateItem(group.id, index, { a: e.target.value })
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeItem(group.id, index)}
                      >
                        <Trash2 className="size-4" />
                        حذف سوال
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addItem(group.id)}
                  >
                    <Plus className="size-4" />
                    سوال جدید
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeGroup(group.id)}
                  >
                    <Trash2 className="size-4" />
                    حذف دسته
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
