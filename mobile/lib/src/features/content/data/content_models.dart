class AcademyItem {
  const AcademyItem({
    required this.id,
    required this.type,
    required this.title,
    required this.description,
    this.body,
    required this.category,
    required this.featured,
    this.duration,
    this.src,
    this.cover,
    this.sortOrder = 0,
  });

  final String id;
  final String type; // podcast | video | text
  final String title;
  final String description;
  final String? body;
  final String category;
  final bool featured;
  final String? duration;
  final String? src;
  final String? cover;
  final int sortOrder;

  factory AcademyItem.fromJson(Map<String, dynamic> json) => AcademyItem(
        id: json['id']?.toString() ?? '',
        type: json['type'] as String? ?? 'text',
        title: json['title'] as String? ?? '',
        description: json['description'] as String? ?? '',
        body: json['body'] as String?,
        category: json['category'] as String? ?? '',
        featured: json['featured'] == true,
        duration: json['duration'] as String?,
        src: json['src'] as String?,
        cover: json['cover'] as String?,
        sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      );
}

class FaqItem {
  const FaqItem({required this.q, required this.a});
  final String q;
  final String a;

  factory FaqItem.fromJson(Map<String, dynamic> json) => FaqItem(
        q: json['q'] as String? ?? '',
        a: json['a'] as String? ?? '',
      );
}

class FaqGroup {
  const FaqGroup({
    required this.id,
    required this.title,
    required this.items,
  });

  final String id;
  final String title;
  final List<FaqItem> items;

  factory FaqGroup.fromJson(Map<String, dynamic> json) => FaqGroup(
        id: json['id']?.toString() ?? '',
        title: json['title'] as String? ?? '',
        items: (json['items'] as List? ?? const [])
            .map((e) => FaqItem.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
      );
}
