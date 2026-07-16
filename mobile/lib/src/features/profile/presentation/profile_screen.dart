import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../auth/application/auth_controller.dart';
import '../data/profile_models.dart';
import '../data/profile_repository.dart';
import 'change_password_dialog.dart';
import 'profile_edit_screen.dart';

String _assetUrl(String path) {
  if (path.isEmpty) return '';
  if (path.startsWith('http')) return path;
  final base = AppConfig.baseUrl.replaceAll(RegExp(r'/$'), '');
  return '$base${path.startsWith('/') ? path : '/$path'}';
}

const _photoSlots = [
  ('front', 'جلو'),
  ('right', 'راست'),
  ('back', 'عقب'),
  ('left', 'چپ'),
];

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myProfileProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('پروفایل'),
        actions: [
          IconButton(
            tooltip: 'ویرایش',
            icon: const Icon(Icons.edit_outlined),
            onPressed: () {
              final p = async.asData?.value;
              if (p == null) return;
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => ProfileEditScreen(profile: p),
                ),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(myProfileProvider);
          ref.invalidate(myAvatarUrlProvider);
          await ref.read(myProfileProvider.future);
        },
        child: AsyncValueWidget<MeProfile>(
          value: async,
          onRetry: () => ref.invalidate(myProfileProvider),
          data: (p) => _Body(profile: p),
        ),
      ),
    );
  }
}

class _Body extends ConsumerStatefulWidget {
  const _Body({required this.profile});
  final MeProfile profile;

  @override
  ConsumerState<_Body> createState() => _BodyState();
}

class _BodyState extends ConsumerState<_Body> {
  String? _uploadingType;
  bool _uploadingAvatar = false;

  Future<void> _pickAvatar() async {
    final file = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (file == null) return;
    setState(() => _uploadingAvatar = true);
    try {
      await ref.read(profileRepositoryProvider).uploadAvatar(file.path);
      ref.invalidate(myAvatarUrlProvider);
      ref.invalidate(myProfileProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('عکس پروفایل به‌روز شد')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _uploadingAvatar = false);
    }
  }

  Future<void> _uploadBody(String type) async {
    final file = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (file == null) return;
    setState(() => _uploadingType = type);
    try {
      await ref
          .read(profileRepositoryProvider)
          .uploadBodyPhoto(type, file.path);
      ref.invalidate(myProfileProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('عکس بدن آپلود شد')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _uploadingType = null);
    }
  }

  void _showPhotoGuide() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('راهنمای گرفتن عکس بدن',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 12),
            Text('• لباس ورزشی یا چسبان بپوشید'),
            Text('• نور یکنواخت رو‌به‌رو'),
            Text('• پس‌زمینه ساده'),
            Text('• چهار نما: جلو / راست / عقب / چپ'),
            Text('• فاصله ثابت از دوربین'),
            SizedBox(height: 12),
            Text(
              'این تصاویر فقط توسط مربی شما قابل مشاهده است و در هیچ جای دیگری نمایش داده نمی‌شود.',
              style: TextStyle(color: AppColors.muted, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profile = widget.profile;
    final avatarAsync = ref.watch(myAvatarUrlProvider);
    final photoMap = {
      for (final p in profile.photos) p.type: p,
    };

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Center(
          child: Column(
            children: [
              Stack(
                children: [
                  CircleAvatar(
                    radius: 48,
                    backgroundColor:
                        AppColors.primary.withValues(alpha: 0.15),
                    backgroundImage: avatarAsync.maybeWhen(
                      data: (url) => url.isEmpty
                          ? null
                          : NetworkImage(_assetUrl(url)),
                      orElse: () => null,
                    ),
                    child: avatarAsync.maybeWhen(
                      data: (url) => url.isEmpty
                          ? const Icon(Icons.person,
                              size: 48, color: AppColors.primary)
                          : null,
                      orElse: () => const Icon(Icons.person,
                          size: 48, color: AppColors.primary),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    left: 0,
                    child: Material(
                      color: AppColors.primary,
                      shape: const CircleBorder(),
                      child: InkWell(
                        customBorder: const CircleBorder(),
                        onTap: _uploadingAvatar ? null : _pickAvatar,
                        child: Padding(
                          padding: const EdgeInsets.all(8),
                          child: _uploadingAvatar
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Icon(Icons.camera_alt,
                                  size: 16, color: Colors.white),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                profile.fullName.isEmpty ? 'کاربر' : profile.fullName,
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold),
              ),
              Text(profile.phone,
                  style: const TextStyle(color: AppColors.muted)),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const ThemeToggleTile(),
        const Divider(),
        _infoRow('ایمیل', profile.email),
        _infoRow('قد',
            profile.heightCm == null ? '—' : '${profile.heightCm} سانتی‌متر'),
        _infoRow('وزن',
            profile.weightKg == null ? '—' : '${profile.weightKg} کیلوگرم'),
        _infoRow('هدف اصلی',
            profile.primaryGoal.isEmpty ? '—' : profile.primaryGoal),
        _infoRow(
            'مربی',
            profile.assignedCoachName.isEmpty
                ? '—'
                : profile.assignedCoachName),
        const SizedBox(height: 16),
        Row(
          children: [
            const Text('عکس‌های بدن',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const Spacer(),
            TextButton(
              onPressed: _showPhotoGuide,
              child: const Text('راهنما'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          childAspectRatio: 1.1,
          children: [
            for (final slot in _photoSlots)
              Card(
                child: InkWell(
                  onTap: _uploadingType == slot.$1
                      ? null
                      : () => _uploadBody(slot.$1),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (photoMap[slot.$1]?.url.isNotEmpty == true)
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.all(8),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                _assetUrl(photoMap[slot.$1]!.url),
                                fit: BoxFit.cover,
                                width: double.infinity,
                                errorBuilder: (_, _, _) =>
                                    const Icon(Icons.broken_image),
                              ),
                            ),
                          ),
                        )
                      else
                        Expanded(
                          child: Icon(
                            _uploadingType == slot.$1
                                ? Icons.hourglass_top
                                : Icons.add_a_photo_outlined,
                            color: AppColors.primary,
                          ),
                        ),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Text(slot.$2),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        const Text(
          'عکس‌ها فقط برای مربی شما قابل مشاهده است.',
          style: TextStyle(color: AppColors.muted, fontSize: 12),
        ),
        const SizedBox(height: 24),
        OutlinedButton.icon(
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => ProfileEditScreen(profile: profile),
              ),
            );
          },
          icon: const Icon(Icons.edit_outlined),
          label: const Text('ویرایش پروفایل'),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () => context.push('/student/subscribe'),
          icon: const Icon(Icons.payment),
          label: const Text('خرید اشتراک'),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () => showDialog(
            context: context,
            builder: (_) => const ChangePasswordDialog(),
          ),
          icon: const Icon(Icons.lock_outline),
          label: const Text('تغییر گذرواژه'),
        ),
        const SizedBox(height: 12),
        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.destructive,
          ),
          onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          icon: const Icon(Icons.logout),
          label: const Text('خروج از حساب'),
        ),
      ],
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.muted)),
          Flexible(child: Text(value, textAlign: TextAlign.left)),
        ],
      ),
    );
  }
}
