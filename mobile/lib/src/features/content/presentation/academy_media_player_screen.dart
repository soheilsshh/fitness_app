import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../data/content_models.dart';
import 'academy_screen.dart';

/// In-app player for academy podcast/video using [video_player].
class AcademyMediaPlayerScreen extends StatefulWidget {
  const AcademyMediaPlayerScreen({super.key, required this.item});

  final AcademyItem item;

  @override
  State<AcademyMediaPlayerScreen> createState() =>
      _AcademyMediaPlayerScreenState();
}

class _AcademyMediaPlayerScreenState extends State<AcademyMediaPlayerScreen> {
  VideoPlayerController? _controller;
  String? _error;
  bool _ready = false;

  bool get _isAudio => widget.item.type == 'podcast';

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final url = resolveMediaUrl(widget.item.src);
    if (url.isEmpty) {
      setState(() => _error = 'آدرس رسانه موجود نیست');
      return;
    }
    try {
      final controller =
          VideoPlayerController.networkUrl(Uri.parse(url));
      _controller = controller;
      await controller.initialize();
      await controller.setLooping(false);
      await controller.play();
      if (mounted) setState(() => _ready = true);
    } catch (e) {
      if (mounted) setState(() => _error = 'پخش رسانه ناموفق بود');
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  String _fmt(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    final h = d.inHours;
    if (h > 0) return '$h:$m:$s';
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final c = _controller;
    return FitinoPushScaffold(
      title: widget.item.title,
      description: widget.item.type == 'podcast' ? 'پادکست' : 'ویدیو',
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(widget.item.description,
                style: const TextStyle(color: AppColors.muted)),
            const SizedBox(height: 16),
            if (_error != null)
              Expanded(
                child: Center(
                  child: Text(_error!, style: const TextStyle(color: Colors.red)),
                ),
              )
            else if (!_ready || c == null)
              const Expanded(child: const FitinoLoading())
            else ...[
              Expanded(
                child: Center(
                  child: _isAudio
                      ? Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.podcasts,
                                size: 96,
                                color: AppColors.primary.withValues(alpha: 0.8)),
                            const SizedBox(height: 16),
                            Text(widget.item.category,
                                style: const TextStyle(color: AppColors.muted)),
                          ],
                        )
                      : AspectRatio(
                          aspectRatio: c.value.aspectRatio == 0
                              ? 16 / 9
                              : c.value.aspectRatio,
                          child: VideoPlayer(c),
                        ),
                ),
              ),
              const SizedBox(height: 12),
              ValueListenableBuilder(
                valueListenable: c,
                builder: (_, value, __) {
                  final pos = value.position;
                  final total = value.duration;
                  final maxMs = total.inMilliseconds <= 0
                      ? 1.0
                      : total.inMilliseconds.toDouble();
                  return Column(
                    children: [
                      Slider(
                        value: pos.inMilliseconds
                            .clamp(0, maxMs.toInt())
                            .toDouble(),
                        max: maxMs,
                        onChanged: (v) =>
                            c.seekTo(Duration(milliseconds: v.round())),
                      ),
                      Row(
                        children: [
                          Text(_fmt(pos),
                              style: const TextStyle(fontSize: 12)),
                          const Spacer(),
                          Text(_fmt(total),
                              style: const TextStyle(fontSize: 12)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          IconButton(
                            iconSize: 36,
                            onPressed: () => c.seekTo(
                              pos - const Duration(seconds: 10),
                            ),
                            icon: const Icon(Icons.replay_10),
                          ),
                          IconButton(
                            iconSize: 56,
                            onPressed: () {
                              if (value.isPlaying) {
                                c.pause();
                              } else {
                                c.play();
                              }
                            },
                            icon: Icon(
                              value.isPlaying
                                  ? Icons.pause_circle
                                  : Icons.play_circle,
                              color: AppColors.primary,
                            ),
                          ),
                          IconButton(
                            iconSize: 36,
                            onPressed: () => c.seekTo(
                              pos + const Duration(seconds: 10),
                            ),
                            icon: const Icon(Icons.forward_10),
                          ),
                        ],
                      ),
                    ],
                  );
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}
