# فلیورهای فروشگاهی فیتینو

بسته پایه: `ir.fitino.app`

| فلیور | فروشگاه | applicationId / هدف | دستور بیلد |
|--------|---------|---------------------|------------|
| `myket` | مایکت | `ir.fitino.app.myket` | `flutter build apk --flavor myket -t lib/main_myket.dart` |
| `bazaar` | کافه‌بازار | `ir.fitino.app.bazaar` | `flutter build apk --flavor bazaar -t lib/main_bazaar.dart` |
| `play` | گوگل پلی | `ir.fitino.app` | `flutter build appbundle --flavor play -t lib/main_play.dart` |
| `appstore` | اپ استور | iOS Bundle + `main_appstore.dart` | `flutter build ipa -t lib/main_appstore.dart --dart-define=FLAVOR=appstore` |

## اجرا در دیباگ

```bash
flutter run --flavor play -t lib/main_play.dart
flutter run --flavor myket -t lib/main_myket.dart
flutter run --flavor bazaar -t lib/main_bazaar.dart
```

برای iOS بدون تعریف Scheme جدا، از `-t lib/main_appstore.dart` استفاده کنید.

## گزارش ادمین

هر بار باز شدن اپ، `heartbeat` به بک‌اند می‌رود و در `/admin/mobile` نمایش داده می‌شود.
