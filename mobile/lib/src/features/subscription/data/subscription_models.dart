class PublicCoachItem {
  const PublicCoachItem({
    required this.coachId,
    required this.slug,
    required this.displayName,
  });

  final int coachId;
  final String slug;
  final String displayName;

  factory PublicCoachItem.fromJson(Map<String, dynamic> json) => PublicCoachItem(
        coachId: (json['coachId'] as num?)?.toInt() ?? 0,
        slug: json['slug'] as String? ?? '',
        displayName: json['displayName'] as String? ?? '',
      );
}

class PublicPlan {
  const PublicPlan({
    required this.id,
    required this.title,
    required this.price,
    required this.discountPrice,
    required this.durationDays,
  });

  final int id;
  final String title;
  final int price;
  final int discountPrice;
  final int durationDays;

  int get payable => discountPrice > 0 ? discountPrice : price;

  factory PublicPlan.fromJson(Map<String, dynamic> json) => PublicPlan(
        id: (json['id'] as num?)?.toInt() ?? 0,
        title: json['title'] as String? ?? '',
        price: (json['price'] as num?)?.toInt() ?? 0,
        discountPrice: (json['discountPrice'] as num?)?.toInt() ?? 0,
        durationDays: (json['durationDays'] as num?)?.toInt() ?? 0,
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
