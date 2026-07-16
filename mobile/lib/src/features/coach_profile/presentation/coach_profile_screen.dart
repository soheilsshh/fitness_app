import 'package:flutter/material.dart';
import '../../../core/widgets/fitino_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../data/coach_profile_repository.dart';

const grade3CertificateTitle = 'مدرک مربی‌گری درجه سه';

String _assetUrl(String path) {
  if (path.isEmpty) return '';
  if (path.startsWith('http')) return path;
  final base = AppConfig.baseUrl.replaceAll(RegExp(r'/$'), '');
  return '$base${path.startsWith('/') ? path : '/$path'}';
}

String _normalizePersian(String s) => s
    .replaceAll('ي', 'ی')
    .replaceAll('ك', 'ک')
    .replaceAll('‌', '')
    .replaceAll(RegExp(r'\s+'), '');

bool isGrade3Certificate(CoachAchievement a) {
  if (a.imageUrl.trim().isEmpty) return false;
  if (a.type != 'qualification' && a.type != 'certificate') return false;
  final title = _normalizePersian(a.title);
  final needle = _normalizePersian(grade3CertificateTitle);
  return title.contains(needle) ||
      (title.contains('مربی') && title.contains('درجهسه'));
}

class CoachProfileScreen extends ConsumerStatefulWidget {
  const CoachProfileScreen({super.key});

  @override
  ConsumerState<CoachProfileScreen> createState() => _CoachProfileScreenState();
}

class _CoachProfileScreenState extends ConsumerState<CoachProfileScreen> {
  final _displayName = TextEditingController();
  final _title = TextEditingController();
  final _slug = TextEditingController();
  final _bio = TextEditingController();
  final _about = TextEditingController();
  final _specialty = TextEditingController();
  final _city = TextEditingController();
  final _phone = TextEditingController();
  final _instagram = TextEditingController();
  final _telegram = TextEditingController();
  final _whatsapp = TextEditingController();
  final _website = TextEditingController();
  bool _isPublished = false;
  bool _hydrated = false;
  bool _busy = false;

  @override
  void dispose() {
    _displayName.dispose();
    _title.dispose();
    _slug.dispose();
    _bio.dispose();
    _about.dispose();
    _specialty.dispose();
    _city.dispose();
    _phone.dispose();
    _instagram.dispose();
    _telegram.dispose();
    _whatsapp.dispose();
    _website.dispose();
    super.dispose();
  }

  void _hydrate(CoachProfile p) {
    if (_hydrated) return;
    _hydrated = true;
    _displayName.text = p.displayName;
    _title.text = p.title;
    _slug.text = p.slug;
    _bio.text = p.bio;
    _about.text = p.aboutCoach;
    _specialty.text = p.specialty;
    _city.text = p.city;
    _phone.text = p.phone;
    _instagram.text = p.instagram;
    _telegram.text = p.telegram;
    _whatsapp.text = p.whatsapp;
    _website.text = p.website;
    _isPublished = p.isPublished;
  }

  Future<void> _save() async {
    setState(() => _busy = true);
    try {
      await ref.read(coachProfileRepositoryProvider).update({
        'title': _title.text.trim(),
        'bio': _bio.text.trim(),
        'aboutCoach': _about.text.trim(),
        'specialty': _specialty.text.trim(),
        'city': _city.text.trim(),
        'contactPhone': _phone.text.trim(),
        'instagram': _instagram.text.trim(),
        'telegram': _telegram.text.trim(),
        'whatsapp': _whatsapp.text.trim(),
        'website': _website.text.trim(),
        'isPublished': _isPublished,
      });
      _hydrated = false;
      ref.invalidate(coachProfileProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('پروفایل ذخیره شد')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _pickUpload(bool cover) async {
    final file = await ImagePicker()
        .pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (file == null) return;
    setState(() => _busy = true);
    try {
      final repo = ref.read(coachProfileRepositoryProvider);
      if (cover) {
        await repo.uploadCover(file.path);
      } else {
        await repo.uploadAvatar(file.path);
      }
      _hydrated = false;
      ref.invalidate(coachProfileProvider);
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _submit(List<CoachAchievement> achievements) async {
    if (!achievements.any(isGrade3Certificate)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'ثبت «مدرک مربی‌گری درجه سه» همراه با تصویر الزامی است.',
            ),
          ),
        );
      }
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(coachProfileRepositoryProvider).submitRequest();
      _hydrated = false;
      ref.invalidate(coachProfileProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('درخواست بررسی ارسال شد')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _addAchievement({bool grade3 = false}) async {
    final title = TextEditingController(
      text: grade3 ? grade3CertificateTitle : '',
    );
    final issuer = TextEditingController();
    final year = TextEditingController();
    final desc = TextEditingController();
    String imageUrl = '';
    var uploading = false;

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          title: Text(grade3 ? 'مدرک مربی‌گری درجه سه' : 'افتخار جدید'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (grade3)
                  const Padding(
                    padding: EdgeInsets.only(bottom: 12),
                    child: Text(
                      'تصویر مدرک الزامی است.',
                      style: TextStyle(color: AppColors.muted, fontSize: 13),
                    ),
                  ),
                TextField(
                  controller: title,
                  readOnly: grade3,
                  decoration: const InputDecoration(labelText: 'عنوان'),
                ),
                TextField(
                  controller: issuer,
                  decoration: const InputDecoration(labelText: 'صادرکننده'),
                ),
                TextField(
                  controller: year,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'سال'),
                ),
                TextField(
                  controller: desc,
                  decoration: const InputDecoration(labelText: 'توضیح'),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: uploading
                      ? null
                      : () async {
                          final file = await ImagePicker().pickImage(
                            source: ImageSource.gallery,
                            imageQuality: 85,
                          );
                          if (file == null) return;
                          setLocal(() => uploading = true);
                          try {
                            imageUrl = await ref
                                .read(coachProfileRepositoryProvider)
                                .uploadAchievementImage(file.path);
                            setLocal(() {});
                          } on ApiException catch (e) {
                            if (ctx.mounted) {
                              ScaffoldMessenger.of(ctx).showSnackBar(
                                SnackBar(content: Text(e.message)),
                              );
                            }
                          } finally {
                            setLocal(() => uploading = false);
                          }
                        },
                  icon: uploading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.upload),
                  label: Text(
                    imageUrl.isEmpty ? 'آپلود تصویر' : 'تصویر انتخاب شد',
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('انصراف'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('افزودن'),
            ),
          ],
        ),
      ),
    );
    if (ok != true || title.text.trim().isEmpty) return;
    if (grade3 && imageUrl.trim().isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('برای مدرک درجه سه، تصویر الزامی است.'),
          ),
        );
      }
      return;
    }
    try {
      await ref.read(coachProfileRepositoryProvider).createAchievement({
        'type': grade3 ? 'qualification' : 'certificate',
        'title': title.text.trim(),
        'issuer': issuer.text.trim(),
        'year': int.tryParse(year.text.trim()) ?? 0,
        'description': desc.text.trim(),
        'imageUrl': imageUrl,
        'isVisible': true,
      });
      ref.invalidate(coachAchievementsProvider);
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(coachProfileProvider);
    final achievementsAsync = ref.watch(coachAchievementsProvider);

    return FitinoPushScaffold(
      title: 'پروفایل مربی',
      body: AsyncValueWidget<CoachProfile>(
        value: async,
        onRetry: () {
          _hydrated = false;
          ref.invalidate(coachProfileProvider);
        },
        data: (p) {
          _hydrate(p);
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundImage: p.avatarUrl.isNotEmpty
                        ? NetworkImage(_assetUrl(p.avatarUrl))
                        : null,
                    child: p.avatarUrl.isEmpty
                        ? const Icon(Icons.person, size: 36)
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          p.status.isEmpty ? '—' : 'وضعیت: ${p.status}',
                          style: const TextStyle(color: AppColors.muted),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          children: [
                            OutlinedButton(
                              onPressed:
                                  _busy ? null : () => _pickUpload(false),
                              child: const Text('آواتار'),
                            ),
                            OutlinedButton(
                              onPressed:
                                  _busy ? null : () => _pickUpload(true),
                              child: const Text('کاور'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _displayName,
                readOnly: true,
                decoration: const InputDecoration(
                  labelText: 'نام نمایشی',
                  helperText: 'فقط توسط ادمین قابل ویرایش است',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _slug,
                readOnly: true,
                textDirection: TextDirection.ltr,
                decoration: const InputDecoration(
                  labelText: 'اسلاگ',
                  helperText: 'فقط توسط ادمین قابل ویرایش است',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _title,
                decoration: const InputDecoration(labelText: 'عنوان'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _specialty,
                decoration: const InputDecoration(labelText: 'تخصص'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _city,
                decoration: const InputDecoration(labelText: 'شهر'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _bio,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'بیو'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _about,
                maxLines: 4,
                decoration: const InputDecoration(labelText: 'درباره مربی'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _phone,
                decoration: const InputDecoration(labelText: 'تلفن تماس'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _instagram,
                decoration: const InputDecoration(labelText: 'اینستاگرام'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _telegram,
                decoration: const InputDecoration(labelText: 'تلگرام'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _whatsapp,
                decoration: const InputDecoration(labelText: 'واتساپ'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _website,
                decoration: const InputDecoration(labelText: 'وبسایت'),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('انتشار عمومی'),
                value: _isPublished,
                onChanged: (v) => setState(() => _isPublished = v),
              ),
              const SizedBox(height: 8),
              FilledButton(
                onPressed: _busy ? null : _save,
                child: Text(_busy ? '...' : 'ذخیره پروفایل'),
              ),
              const SizedBox(height: 8),
              achievementsAsync.when(
                loading: () => const SizedBox.shrink(),
                error: (_, __) => OutlinedButton(
                  onPressed: _busy ? null : () => _submit(const []),
                  child: const Text('ارسال برای تأیید'),
                ),
                data: (items) => OutlinedButton(
                  onPressed: _busy ? null : () => _submit(items),
                  child: const Text('ارسال برای تأیید'),
                ),
              ),
              const SizedBox(height: 24),
              achievementsAsync.when(
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
                data: (items) {
                  final hasGrade3 = items.any(isGrade3Certificate);
                  return Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: hasGrade3
                          ? Colors.green.withValues(alpha: 0.12)
                          : Colors.amber.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      hasGrade3
                          ? 'مدرک مربی‌گری درجه سه ثبت شده است.'
                          : 'مدرک مربی‌گری درجه سه همراه با تصویر برای تأیید الزامی است.',
                      style: TextStyle(
                        color: hasGrade3
                            ? Colors.green.shade800
                            : Colors.amber.shade900,
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Text(
                    'افتخارات',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const Spacer(),
                  TextButton.icon(
                    onPressed: () => _addAchievement(grade3: true),
                    icon: const Icon(Icons.school_outlined),
                    label: const Text('مدرک درجه سه'),
                  ),
                  TextButton.icon(
                    onPressed: () => _addAchievement(),
                    icon: const Icon(Icons.add),
                    label: const Text('افزودن'),
                  ),
                ],
              ),
              achievementsAsync.when(
                loading: () => const Padding(
                  padding: EdgeInsets.all(16),
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (e, _) => Text('$e'),
                data: (items) {
                  if (items.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: Text(
                        'افتخاری ثبت نشده.',
                        style: TextStyle(color: AppColors.muted),
                      ),
                    );
                  }
                  return Column(
                    children: items
                        .map(
                          (a) => Card(
                            child: ListTile(
                              leading: a.imageUrl.isNotEmpty
                                  ? ClipRRect(
                                      borderRadius: BorderRadius.circular(6),
                                      child: Image.network(
                                        _assetUrl(a.imageUrl),
                                        width: 48,
                                        height: 48,
                                        fit: BoxFit.cover,
                                      ),
                                    )
                                  : const Icon(Icons.emoji_events_outlined),
                              title: Text(a.title),
                              subtitle: Text(
                                [
                                  if (a.issuer.isNotEmpty) a.issuer,
                                  if (a.year > 0) '${a.year}',
                                  if (isGrade3Certificate(a)) 'الزامی ✓',
                                ].join(' · '),
                              ),
                              trailing: IconButton(
                                icon: const Icon(Icons.delete_outline),
                                onPressed: () async {
                                  await ref
                                      .read(coachProfileRepositoryProvider)
                                      .deleteAchievement(a.id);
                                  ref.invalidate(coachAchievementsProvider);
                                },
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  );
                },
              ),
            ],
          );
        },
      ),
    );
  }
}
