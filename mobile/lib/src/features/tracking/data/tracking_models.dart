class TrackingAlert {
  const TrackingAlert({
    required this.type,
    required this.days,
    required this.message,
  });

  final String type;
  final int days;
  final String message;

  factory TrackingAlert.fromJson(Map<String, dynamic> json) => TrackingAlert(
        type: json['type'] as String? ?? '',
        days: (json['days'] as num?)?.toInt() ?? 0,
        message: json['message'] as String? ?? '',
      );
}

class TrackingPhoto {
  const TrackingPhoto({
    required this.id,
    required this.url,
    required this.type,
    required this.uploadedAt,
  });

  final int id;
  final String url;
  final String type;
  final String uploadedAt;

  factory TrackingPhoto.fromJson(Map<String, dynamic> json) => TrackingPhoto(
        id: (json['id'] as num?)?.toInt() ?? 0,
        url: json['url'] as String? ?? '',
        type: json['type'] as String? ?? '',
        uploadedAt: json['uploadedAt'] as String? ?? '',
      );
}

class PhotoTypeHistory {
  const PhotoTypeHistory({
    required this.type,
    required this.label,
    required this.photos,
  });

  final String type;
  final String label;
  final List<TrackingPhoto> photos;

  factory PhotoTypeHistory.fromJson(Map<String, dynamic> json) =>
      PhotoTypeHistory(
        type: json['type'] as String? ?? '',
        label: json['label'] as String? ?? '',
        photos: (json['photos'] as List? ?? const [])
            .map((e) => TrackingPhoto.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
      );
}

class WeightPoint {
  const WeightPoint({required this.date, required this.weight});

  final String date;
  final double weight;

  factory WeightPoint.fromJson(Map<String, dynamic> json) => WeightPoint(
        date: json['date'] as String? ?? '',
        weight: (json['weight'] as num?)?.toDouble() ?? 0,
      );
}

class TrackingStatus {
  const TrackingStatus({
    this.nextDueDate,
    required this.frequencyDays,
    required this.weightSubmitted,
    required this.photosSubmitted,
    required this.alerts,
    required this.weightHistory,
    required this.photoHistories,
    this.lastWeightKg,
    this.subscriptionId,
  });

  final String? nextDueDate;
  final int frequencyDays;
  final bool weightSubmitted;
  final Map<String, bool> photosSubmitted;
  final List<TrackingAlert> alerts;
  final List<WeightPoint> weightHistory;
  final List<PhotoTypeHistory> photoHistories;
  final double? lastWeightKg;
  final int? subscriptionId;

  factory TrackingStatus.fromJson(Map<String, dynamic> json) {
    final photosRaw = json['photosSubmitted'];
    final photosSubmitted = <String, bool>{};
    if (photosRaw is Map) {
      photosRaw.forEach((k, v) {
        photosSubmitted[k.toString()] = v == true;
      });
    }
    return TrackingStatus(
      nextDueDate: json['nextDueDate'] as String?,
      frequencyDays: (json['frequencyDays'] as num?)?.toInt() ?? 14,
      weightSubmitted: json['weightSubmitted'] == true,
      photosSubmitted: photosSubmitted,
      alerts: (json['alerts'] as List? ?? const [])
          .map((e) => TrackingAlert.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
      weightHistory: (json['weightHistory'] as List? ?? const [])
          .map((e) => WeightPoint.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
      photoHistories: (json['photoHistories'] as List? ?? const [])
          .map((e) =>
              PhotoTypeHistory.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
      lastWeightKg: (json['lastWeightKg'] as num?)?.toDouble(),
      subscriptionId: (json['subscriptionId'] as num?)?.toInt(),
    );
  }
}
