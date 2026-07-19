class PublicCoachItem {
  const PublicCoachItem({
    required this.coachId,
    required this.slug,
    required this.displayName,
    this.title = '',
    this.specialty = '',
    this.avatarUrl = '',
  });

  final int coachId;
  final String slug;
  final String displayName;
  final String title;
  final String specialty;
  final String avatarUrl;

  factory PublicCoachItem.fromJson(Map<String, dynamic> json) =>
      PublicCoachItem(
        coachId: (json['coachId'] as num?)?.toInt() ?? 0,
        slug: json['slug'] as String? ?? '',
        displayName: json['displayName'] as String? ?? '',
        title: json['title'] as String? ?? '',
        specialty: json['specialty'] as String? ?? '',
        avatarUrl: json['avatarUrl'] as String? ?? '',
      );
}

class PublicAchievement {
  const PublicAchievement({
    required this.id,
    required this.title,
    this.issuer = '',
    this.year = 0,
    this.imageUrl = '',
  });

  final int id;
  final String title;
  final String issuer;
  final int year;
  final String imageUrl;

  factory PublicAchievement.fromJson(Map<String, dynamic> json) =>
      PublicAchievement(
        id: (json['id'] as num?)?.toInt() ?? 0,
        title: json['title'] as String? ?? '',
        issuer: json['issuer'] as String? ?? '',
        year: (json['year'] as num?)?.toInt() ?? 0,
        imageUrl: json['imageUrl'] as String? ?? '',
      );
}

class PublicCoachProfile {
  const PublicCoachProfile({
    required this.coachId,
    required this.slug,
    required this.displayName,
    this.title = '',
    this.bio = '',
    this.aboutCoach = '',
    this.specialty = '',
    this.avatarUrl = '',
    this.coverImageUrl = '',
    this.achievements = const [],
  });

  final int coachId;
  final String slug;
  final String displayName;
  final String title;
  final String bio;
  final String aboutCoach;
  final String specialty;
  final String avatarUrl;
  final String coverImageUrl;
  final List<PublicAchievement> achievements;

  factory PublicCoachProfile.fromJson(Map<String, dynamic> json) =>
      PublicCoachProfile(
        coachId: (json['coachId'] as num?)?.toInt() ?? 0,
        slug: json['slug'] as String? ?? '',
        displayName: json['displayName'] as String? ?? '',
        title: json['title'] as String? ?? '',
        bio: json['bio'] as String? ?? '',
        aboutCoach: json['aboutCoach'] as String? ?? '',
        specialty: json['specialty'] as String? ?? '',
        avatarUrl: json['avatarUrl'] as String? ?? '',
        coverImageUrl: json['coverImageUrl'] as String? ?? '',
        achievements: (json['achievements'] as List? ?? const [])
            .map((e) =>
                PublicAchievement.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
      );
}

class PublicPlan {
  const PublicPlan({
    required this.id,
    required this.title,
    required this.price,
    required this.discountPrice,
    required this.durationDays,
    this.subtitle = '',
    this.featuresText = '',
    this.isPopular = false,
  });

  final int id;
  final String title;
  final String subtitle;
  final int price;
  final int discountPrice;
  final int durationDays;
  final String featuresText;
  final bool isPopular;

  int get payable => discountPrice > 0 ? discountPrice : price;

  factory PublicPlan.fromJson(Map<String, dynamic> json) => PublicPlan(
        id: (json['id'] as num?)?.toInt() ?? 0,
        title: json['title'] as String? ?? json['name'] as String? ?? '',
        subtitle: json['subtitle'] as String? ?? '',
        price: (json['price'] as num?)?.toInt() ?? 0,
        discountPrice: (json['discountPrice'] as num?)?.toInt() ?? 0,
        durationDays: (json['durationDays'] as num?)?.toInt() ?? 0,
        featuresText: json['featuresText'] as String? ?? '',
        isPopular: json['isPopular'] == true,
      );
}

class ZarinpalPaymentData {
  const ZarinpalPaymentData({
    required this.orderId,
    required this.paymentUrl,
  });

  final int orderId;
  final String paymentUrl;

  factory ZarinpalPaymentData.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>? ?? json;
    return ZarinpalPaymentData(
      orderId: (data['orderId'] as num?)?.toInt() ??
          (data['transaction_id'] as num?)?.toInt() ??
          0,
      paymentUrl: data['payment_url'] as String? ?? '',
    );
  }
}

class PaymentResult {
  const PaymentResult({
    required this.success,
    required this.txId,
    this.refId,
  });

  final bool success;
  final int txId;
  final String? refId;
}
