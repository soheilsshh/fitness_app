# Fitino seed data — one folder per dataset (no shared filenames)

```text
data/
├── exercises-fa/                 ← کاتالوگ فارسی (سید می‌شود)
│   ├── exercises.fa.json
│   ├── images/                   ← فقط مدیای این کاتالوگ
│   └── videos/
├── exercises-en/                 ← نسخه انگلیسی (سید نمی‌شود)
│   └── exercises.json
├── foods/
│   └── Persian_food_facts.csv    ← سید می‌شود
├── exercise-templates/           ← قالب تمرین crul (سید می‌شود)
│   ├── exercise_templates.json
│   ├── images/                   ← فقط مدیای قالب‌ها (جدا از کاتالوگ)
│   └── videos/
└── diet-templates/               ← قالب رژیم (سید می‌شود)
    ├── diet_templates.json
    └── images/
```

## چرا جدا؟

نام فایل‌ها در کاتالوگ (`0001-….jpg`) و قالب‌های morabiha (`17275….png`) ممکن است
یکی شوند یا قاطی شوند. هر دیتاست پوشهٔ مدیای خودش را دارد.

## URLها

| پوشه | مسیر استاتیک |
|------|----------------|
| `exercises-fa/` | `/exercises-media/images/...` |
| `exercise-templates/` | `/exercise-templates-media/images/...` |
| `diet-templates/` | `/diet-templates-media/images/...` |

## دیپلوی

کل پوشه `data/` را کنار باینری بگذار (یا `FITINO_DATA_DIR` را ست کن).
