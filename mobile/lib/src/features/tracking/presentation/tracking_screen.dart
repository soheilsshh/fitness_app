import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../data/tracking_models.dart';
import '../data/tracking_repository.dart';

const _photoSlots = [
  ('front', 'جلو'),
  ('back', 'پشت'),
  ('side', 'بغل'),
];

String _assetUrl(String path) {
  if (path.isEmpty) return '';
  if (path.startsWith('http')) return path;
  final base = AppConfig.baseUrl.replaceAll(RegExp(r'/$'), '');
  return '$base${path.startsWith('/') ? path : '/$path'}';
}

class TrackingScreen extends ConsumerStatefulWidget {
  const TrackingScreen({super.key});

  @override
  ConsumerState<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends ConsumerState<TrackingScreen> {
  final _weightCtrl = TextEditingController();
  bool _submittingWeight = false;
  String? _uploadingType;

  @override
  void dispose() {
    _weightCtrl.dispose();
    super.dispose();
  }

  Future<void> _submitWeight(TrackingStatus status) async {
    final value = double.tryParse(_weightCtrl.text.trim());
    if (value == null || value < 20 || value > 300) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('وزن باید بین ۲۰ تا ۳۰۰ کیلوگرم باشد')),
      );
      return;
    }
    setState(() => _submittingWeight = true);
    try {
      await ref.read(trackingRepositoryProvider).submitWeight(value);
      _weightCtrl.clear();
      ref.invalidate(trackingStatusProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('وزن با موفقیت ثبت شد')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    } finally {
      if (mounted) setState(() => _submittingWeight = false);
    }
  }

  Future<void> _uploadPhoto(String type) async {
    final picker = ImagePicker();
    final file = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (file == null) return;
    setState(() => _uploadingType = type);
    try {
      await ref.read(trackingRepositoryProvider).uploadPhoto(
            path: file.path,
            type: type,
          );
      ref.invalidate(trackingStatusProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('عکس با موفقیت آپلود شد')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    } finally {
      if (mounted) setState(() => _uploadingType = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(trackingStatusProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('پایش پیشرفت')),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(trackingStatusProvider.future),
        child: AsyncValueWidget<TrackingStatus>(
          value: async,
          onRetry: () => ref.invalidate(trackingStatusProvider),
          data: (status) => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'هر ${status.frequencyDays} روز یک‌بار وزن و عکس‌های جلو، پشت و بغل را ثبت کنید.',
                style: const TextStyle(color: AppColors.muted),
              ),
              if (status.nextDueDate != null) ...[
                const SizedBox(height: 8),
                Chip(
                  label: Text('موعد بعدی: ${status.nextDueDate}'),
                  backgroundColor: AppColors.surfaceVariant,
                ),
              ],
              if (status.alerts.isNotEmpty) ...[
                const SizedBox(height: 12),
                ...status.alerts.map(
                  (a) => Card(
                    color: AppColors.destructive.withValues(alpha: 0.12),
                    child: ListTile(
                      leading: const Icon(Icons.warning_amber,
                          color: AppColors.destructive),
                      title: Text(a.message),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.monitor_weight_outlined,
                              color: AppColors.primary),
                          SizedBox(width: 8),
                          Text('ثبت وزن',
                              style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _weightCtrl,
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        decoration: InputDecoration(
                          labelText: 'وزن (کیلوگرم)',
                          hintText: status.lastWeightKg != null
                              ? '${status.lastWeightKg}'
                              : 'مثلاً ۷۵',
                        ),
                      ),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: _submittingWeight
                            ? null
                            : () => _submitWeight(status),
                        child: Text(
                          _submittingWeight ? 'در حال ثبت...' : 'ثبت وزن',
                        ),
                      ),
                      if (status.weightSubmitted)
                        const Padding(
                          padding: EdgeInsets.only(top: 8),
                          child: Text(
                            'وزن این دوره ثبت شده است.',
                            style: TextStyle(color: AppColors.primary),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.camera_alt_outlined,
                              color: AppColors.primary),
                          SizedBox(width: 8),
                          Text('آپلود عکس‌های پایش',
                              style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          for (final slot in _photoSlots)
                            Expanded(
                              child: Padding(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 4),
                                child: Column(
                                  children: [
                                    OutlinedButton(
                                      onPressed: _uploadingType == slot.$1
                                          ? null
                                          : () => _uploadPhoto(slot.$1),
                                      child: Text(
                                        _uploadingType == slot.$1
                                            ? '...'
                                            : slot.$2,
                                      ),
                                    ),
                                    if (status.photosSubmitted[slot.$1] == true)
                                      const Text('ثبت شد',
                                          style: TextStyle(
                                              fontSize: 11,
                                              color: AppColors.primary)),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text('مقایسه عکس‌ها',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 8),
              ...status.photoHistories.map(
                (h) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _PhotoCompareBox(history: h),
                ),
              ),
              const SizedBox(height: 8),
              const Text('نمودار تغییرات وزن',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 8),
              _WeightChart(points: status.weightHistory),
            ],
          ),
        ),
      ),
    );
  }
}

class _PhotoCompareBox extends StatefulWidget {
  const _PhotoCompareBox({required this.history});
  final PhotoTypeHistory history;

  @override
  State<_PhotoCompareBox> createState() => _PhotoCompareBoxState();
}

class _PhotoCompareBoxState extends State<_PhotoCompareBox> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final photos = widget.history.photos;
    final current = photos.isEmpty ? null : photos[_index.clamp(0, photos.length - 1)];
    final hasMultiple = photos.length > 1;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(widget.history.label,
                style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            AspectRatio(
              aspectRatio: 3 / 4,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: current == null
                    ? const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.image_not_supported_outlined,
                                color: AppColors.muted),
                            SizedBox(height: 8),
                            Text('عکسی ثبت نشده',
                                style: TextStyle(
                                    color: AppColors.muted, fontSize: 12)),
                          ],
                        ),
                      )
                    : ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          _assetUrl(current.url),
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) =>
                              const Icon(Icons.broken_image),
                        ),
                      ),
              ),
            ),
            if (current != null) ...[
              const SizedBox(height: 8),
              Text(
                hasMultiple
                    ? '${current.uploadedAt} (${_index + 1} از ${photos.length})'
                    : current.uploadedAt,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.muted, fontSize: 12),
              ),
            ],
            if (hasMultiple) ...[
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    onPressed: _index >= photos.length - 1
                        ? null
                        : () => setState(() => _index++),
                    icon: const Icon(Icons.chevron_right),
                    tooltip: 'عکس قدیمی‌تر',
                  ),
                  IconButton(
                    onPressed:
                        _index <= 0 ? null : () => setState(() => _index--),
                    icon: const Icon(Icons.chevron_left),
                    tooltip: 'عکس جدیدتر',
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _WeightChart extends StatelessWidget {
  const _WeightChart({required this.points});
  final List<WeightPoint> points;

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 40),
          child: Center(
            child: Text('هنوز وزنی ثبت نشده است.',
                style: TextStyle(color: AppColors.muted)),
          ),
        ),
      );
    }

    final sorted = [...points]..sort((a, b) => a.date.compareTo(b.date));
    final latest = sorted.last;
    final first = sorted.first;
    final delta = latest.weight - first.weight;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'آخرین: ${latest.weight} کیلو · تغییر: ${delta >= 0 ? '+' : ''}${delta.toStringAsFixed(1)}',
              style: const TextStyle(color: AppColors.muted, fontSize: 12),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 180,
              width: double.infinity,
              child: CustomPaint(
                painter: _WeightChartPainter(sorted),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(first.date,
                    style:
                        const TextStyle(color: AppColors.muted, fontSize: 11)),
                Text(latest.date,
                    style:
                        const TextStyle(color: AppColors.muted, fontSize: 11)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _WeightChartPainter extends CustomPainter {
  _WeightChartPainter(this.points);
  final List<WeightPoint> points;

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;

    final weights = points.map((p) => p.weight).toList();
    var minW = weights.reduce(math.min);
    var maxW = weights.reduce(math.max);
    if ((maxW - minW).abs() < 0.5) {
      minW -= 1;
      maxW += 1;
    }
    final pad = (maxW - minW) * 0.1;
    minW -= pad;
    maxW += pad;

    final gridPaint = Paint()
      ..color = AppColors.border
      ..strokeWidth = 1;
    for (var i = 0; i < 4; i++) {
      final y = size.height * i / 3;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    final path = Path();
    for (var i = 0; i < points.length; i++) {
      final x = points.length == 1
          ? size.width / 2
          : size.width * i / (points.length - 1);
      final y = size.height *
          (1 - ((points[i].weight - minW) / (maxW - minW)).clamp(0.0, 1.0));
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    final linePaint = Paint()
      ..color = AppColors.primary
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(path, linePaint);

    final dotPaint = Paint()..color = AppColors.chart[1];
    for (var i = 0; i < points.length; i++) {
      final x = points.length == 1
          ? size.width / 2
          : size.width * i / (points.length - 1);
      final y = size.height *
          (1 - ((points[i].weight - minW) / (maxW - minW)).clamp(0.0, 1.0));
      canvas.drawCircle(Offset(x, y), 4, dotPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _WeightChartPainter oldDelegate) =>
      oldDelegate.points != points;
}
