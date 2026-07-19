/// Store / distribution flavor for Fitino mobile builds.
enum AppStoreFlavor {
  myket,
  bazaar,
  play,
  appstore;

  String get id => name;

  String get labelFa => switch (this) {
        AppStoreFlavor.myket => 'مایکت',
        AppStoreFlavor.bazaar => 'کافه‌بازار',
        AppStoreFlavor.play => 'گوگل پلی',
        AppStoreFlavor.appstore => 'اپ استور',
      };

  bool get isAndroidStore =>
      this == AppStoreFlavor.myket ||
      this == AppStoreFlavor.bazaar ||
      this == AppStoreFlavor.play;

  bool get isIosStore => this == AppStoreFlavor.appstore;

  static AppStoreFlavor parse(String? raw) {
    switch ((raw ?? '').trim().toLowerCase()) {
      case 'myket':
        return AppStoreFlavor.myket;
      case 'bazaar':
      case 'cafebazaar':
      case 'cafe_bazaar':
        return AppStoreFlavor.bazaar;
      case 'appstore':
      case 'ios':
      case 'apple':
        return AppStoreFlavor.appstore;
      case 'play':
      case 'googleplay':
      case 'google_play':
      default:
        return AppStoreFlavor.play;
    }
  }
}

class FlavorConfig {
  FlavorConfig._(this.flavor);

  static FlavorConfig? _instance;

  final AppStoreFlavor flavor;

  static FlavorConfig get instance {
    assert(_instance != null, 'FlavorConfig.init() must be called in main');
    return _instance!;
  }

  static void init(AppStoreFlavor flavor) {
    _instance = FlavorConfig._(flavor);
  }

  /// Fallback when no entrypoint called [init] (e.g. tests).
  static void initFromEnvironment() {
    const raw = String.fromEnvironment('FLAVOR', defaultValue: 'play');
    init(AppStoreFlavor.parse(raw));
  }

  String get storeId => flavor.id;
  String get storeLabel => flavor.labelFa;
}
