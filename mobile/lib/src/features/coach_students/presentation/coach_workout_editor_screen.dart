import 'package:flutter/material.dart';
import '../../../core/widgets/fitino_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../coach_catalog/presentation/catalog_pickers.dart';
import '../data/coach_students_repository.dart';

const _days = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
const _dayLabels = {
  'sat': 'شنبه',
  'sun': 'یکشنبه',
  'mon': 'دوشنبه',
  'tue': 'سه‌شنبه',
  'wed': 'چهارشنبه',
  'thu': 'پنجشنبه',
  'fri': 'جمعه',
};

const _systemLabels = {
  'normal': 'عادی',
  'superset': 'سوپرست',
  'giant_set': 'جاینت‌ست',
  'circuit': 'ست دایره‌ای',
};

List<Map<String, dynamic>> _normalizeSetsDetails(
  dynamic details, {
  int count = 0,
  String defaultReps = '12',
}) {
  final list = <Map<String, dynamic>>[];
  if (details is List) {
    for (var i = 0; i < details.length; i++) {
      final d = details[i];
      if (d is! Map) continue;
      list.add({
        'setNumber': (d['setNumber'] as num?)?.toInt() ??
            (d['set_number'] as num?)?.toInt() ??
            i + 1,
        'reps': '${d['reps'] ?? ''}'.trim(),
        'isAmrap': d['isAmrap'] == true || d['is_amrap'] == true,
      });
    }
  }
  if (count > 0) {
    while (list.length < count) {
      list.add({
        'setNumber': list.length + 1,
        'reps': defaultReps,
        'isAmrap': false,
      });
    }
    if (list.length > count) {
      return list.sublist(0, count);
    }
  }
  for (var i = 0; i < list.length; i++) {
    list[i]['setNumber'] = i + 1;
  }
  return list;
}

String _summarizeReps(List<Map<String, dynamic>> sets) {
  return sets
      .map((s) => s['isAmrap'] == true ? 'AMRAP' : '${s['reps'] ?? ''}'.trim())
      .where((e) => e.isNotEmpty)
      .join('/');
}

String _newSupersetId() =>
    'ss-${DateTime.now().microsecondsSinceEpoch}-${DateTime.now().millisecond}';

class CoachWorkoutEditorScreen extends ConsumerStatefulWidget {
  const CoachWorkoutEditorScreen({super.key, required this.studentId});
  final int studentId;

  @override
  ConsumerState<CoachWorkoutEditorScreen> createState() =>
      _CoachWorkoutEditorScreenState();
}

class _CoachWorkoutEditorScreenState
    extends ConsumerState<CoachWorkoutEditorScreen> {
  final _title = TextEditingController(text: 'برنامه تمرین');
  final _dayTitle = TextEditingController();
  final _duration = TextEditingController(text: '45');
  int _programId = 0;
  String _selectedDay = 'sat';
  Map<String, Map<String, dynamic>> _planByDay = {};
  List<String> _restDays = [];
  final Set<int> _selectedIndexes = {};
  bool _loading = true;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _title.dispose();
    _dayTitle.dispose();
    _duration.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final p = await ref
          .read(coachStudentsRepositoryProvider)
          .programs(widget.studentId);
      _programId = p.workoutProgramId;
      final rest = p.schedule?['restDays'];
      _restDays = rest is List
          ? rest.map((e) => e.toString()).toList()
          : <String>[];
      final map = <String, Map<String, dynamic>>{};
      for (final d in _days) {
        final day = p.planByDay[d];
        if (day is Map && day['workout'] is Map) {
          map[d] = Map<String, dynamic>.from(day['workout'] as Map);
        } else {
          map[d] = {
            'title': '',
            'durationMin': 45,
            'calories': 0,
            'exercises': <Map<String, dynamic>>[],
          };
        }
      }
      _planByDay = map;
      _selectedIndexes.clear();
      _syncDayFields();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  bool get _isRestDay => _restDays.contains(_selectedDay);

  Map<String, dynamic> _currentWorkout() {
    return _planByDay.putIfAbsent(
      _selectedDay,
      () => {
        'title': '',
        'durationMin': 45,
        'calories': 0,
        'exercises': <Map<String, dynamic>>[],
      },
    );
  }

  void _syncDayFields() {
    final w = _currentWorkout();
    _dayTitle.text = w['title']?.toString() ?? '';
    _duration.text = '${w['durationMin'] ?? 45}';
  }

  void _selectDay(String day) {
    _persistDayFields();
    setState(() {
      _selectedDay = day;
      _selectedIndexes.clear();
      _syncDayFields();
    });
  }

  void _persistDayFields() {
    final w = _currentWorkout();
    w['title'] = _dayTitle.text.trim();
    w['durationMin'] = int.tryParse(_duration.text.trim()) ?? 45;
  }

  List<Map<String, dynamic>> _exercises() {
    final w = _currentWorkout();
    final raw = w['exercises'];
    if (raw is! List) {
      w['exercises'] = <Map<String, dynamic>>[];
      return w['exercises'] as List<Map<String, dynamic>>;
    }
    return raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  void _setExercises(List<Map<String, dynamic>> list) {
    setState(() => _currentWorkout()['exercises'] = list);
  }

  void _toggleRestDay() {
    setState(() {
      if (_restDays.contains(_selectedDay)) {
        _restDays = _restDays.where((d) => d != _selectedDay).toList();
      } else {
        _restDays = [..._restDays, _selectedDay];
        _currentWorkout()['exercises'] = <Map<String, dynamic>>[];
        _selectedIndexes.clear();
      }
    });
  }

  void _linkSelected(String systemType) {
    final list = _exercises();
    if (_selectedIndexes.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('حداقل دو حرکت را انتخاب کنید')),
      );
      return;
    }
    final id = _newSupersetId();
    for (final i in _selectedIndexes) {
      if (i < 0 || i >= list.length) continue;
      list[i] = {
        ...list[i],
        'supersetId': id,
        'workoutSystemType': systemType,
      };
    }
    _setExercises(list);
    setState(() => _selectedIndexes.clear());
  }

  void _unlinkSelected() {
    final list = _exercises();
    for (final i in _selectedIndexes) {
      if (i < 0 || i >= list.length) continue;
      list[i] = {
        ...list[i],
        'supersetId': null,
        'workoutSystemType': 'normal',
      };
    }
    _setExercises(list);
    setState(() => _selectedIndexes.clear());
  }

  Future<void> _pickTemplate() async {
    final templates =
        await ref.read(coachStudentsRepositoryProvider).workoutTemplates();
    if (!mounted) return;
    final picked = await showModalBottomSheet<ProgramTemplate>(
      context: context,
      builder: (ctx) => ListView(
        children: [
          const ListTile(title: Text('انتخاب قالب تمرین')),
          ...templates.map(
            (t) => ListTile(
              title: Text(t.title),
              subtitle: t.extra.isEmpty ? null : Text(t.extra),
              onTap: () => Navigator.pop(ctx, t),
            ),
          ),
        ],
      ),
    );
    if (picked == null) return;
    setState(() => _busy = true);
    try {
      await ref
          .read(coachStudentsRepositoryProvider)
          .assignWorkoutTemplate(widget.studentId, picked.id);
      ref.invalidate(coachStudentProgramsProvider(widget.studentId));
      ref.invalidate(coachStudentDetailProvider(widget.studentId));
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('قالب اعمال شد')),
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

  Future<void> _save() async {
    _persistDayFields();
    setState(() => _busy = true);
    try {
      final planByDay = <String, dynamic>{};
      for (final e in _planByDay.entries) {
        if (_restDays.contains(e.key)) continue;
        final exercises = (e.value['exercises'] as List? ?? const []);
        if (exercises.isEmpty &&
            (e.value['title'] as String? ?? '').isEmpty) {
          continue;
        }
        planByDay[e.key] = {'workout': e.value};
      }
      final weekly = _days.where((d) => !_restDays.contains(d)).toList();
      await ref.read(coachStudentsRepositoryProvider).saveWorkout(
            studentId: widget.studentId,
            programId: _programId,
            body: {
              'title': _title.text.trim().isEmpty
                  ? 'برنامه تمرین'
                  : _title.text.trim(),
              'durationWeeks': 4,
              'planByDay': planByDay,
              'schedule': {
                'weekly': weekly,
                'restDays': _restDays,
              },
            },
          );
      ref.invalidate(coachStudentProgramsProvider(widget.studentId));
      ref.invalidate(coachStudentDetailProvider(widget.studentId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('برنامه تمرین ذخیره شد')),
        );
        Navigator.of(context).pop();
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

  Future<void> _editExercise(Map<String, dynamic>? existing, int? index) async {
    final name =
        TextEditingController(text: existing?['name']?.toString() ?? '');
    final setsCtrl = TextEditingController(text: '${existing?['sets'] ?? 3}');
    var setsDetails = _normalizeSetsDetails(
      existing?['setsDetails'],
      count: int.tryParse('${existing?['sets'] ?? 3}') ?? 3,
      defaultReps: existing?['reps']?.toString() ?? '12',
    );
    if (setsDetails.isEmpty) {
      setsDetails = _normalizeSetsDetails(null, count: 3);
    }

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) {
          void resize(int count) {
            setsDetails = _normalizeSetsDetails(
              setsDetails,
              count: count,
              defaultReps: setsDetails.isNotEmpty
                  ? '${setsDetails.first['reps'] ?? '12'}'
                  : '12',
            );
            setsCtrl.text = '$count';
            setLocal(() {});
          }

          return AlertDialog(
            title: Text(existing == null ? 'حرکت جدید' : 'ویرایش حرکت'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: name,
                    decoration: const InputDecoration(labelText: 'نام حرکت'),
                  ),
                  TextField(
                    controller: setsCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'تعداد ست'),
                    onChanged: (v) {
                      final n = int.tryParse(v.trim()) ?? 0;
                      if (n > 0) resize(n.clamp(1, 12));
                    },
                  ),
                  const SizedBox(height: 12),
                  const Align(
                    alignment: Alignment.centerRight,
                    child: Text('جزئیات هر ست',
                        style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                  for (var i = 0; i < setsDetails.length; i++)
                    Row(
                      children: [
                        Text('ست ${i + 1}',
                            style: const TextStyle(fontSize: 12)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextFormField(
                            initialValue: '${setsDetails[i]['reps'] ?? ''}',
                            decoration: const InputDecoration(
                              labelText: 'تکرار',
                              isDense: true,
                            ),
                            onChanged: (v) => setsDetails[i]['reps'] = v,
                          ),
                        ),
                        Checkbox(
                          value: setsDetails[i]['isAmrap'] == true,
                          onChanged: (v) => setLocal(
                            () => setsDetails[i]['isAmrap'] = v == true,
                          ),
                        ),
                        const Text('AMRAP', style: TextStyle(fontSize: 11)),
                      ],
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
                child: const Text('تأیید'),
              ),
            ],
          );
        },
      ),
    );
    if (ok != true || name.text.trim().isEmpty) return;
    final setsCount = setsDetails.length;
    final item = {
      ...(existing ?? const <String, dynamic>{}),
      'name': name.text.trim(),
      'sets': setsCount,
      'setsDetails': setsDetails,
      'reps': _summarizeReps(setsDetails),
      'supersetId': existing?['supersetId'],
      'workoutSystemType': existing?['workoutSystemType'] ?? 'normal',
    };
    final list = _exercises();
    if (index == null) {
      list.add(item);
    } else {
      list[index] = item;
    }
    _setExercises(list);
  }

  @override
  Widget build(BuildContext context) {
    final exercises = _loading ? const <Map<String, dynamic>>[] : _exercises();

    return FitinoPushScaffold(
      title: 'برنامه تمرین',
      actions: [
        TextButton(
          onPressed: _busy ? null : _pickTemplate,
          child: const Text('قالب'),
        ),
      ],
      floatingActionButton: FitinoExtendedFab(
        onPressed: _busy || _loading ? null : _save,
        icon: Icons.save,
        label: _busy ? '...' : 'ذخیره',
      ),
      body: _loading
          ? const FitinoLoading()
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
              children: [
                TextField(
                  controller: _title,
                  decoration: const InputDecoration(labelText: 'عنوان برنامه'),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 40,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      for (final d in _days)
                        Padding(
                          padding: const EdgeInsets.only(left: 8),
                          child: ChoiceChip(
                            label: Text(
                              '${_dayLabels[d]!}${_restDays.contains(d) ? ' 💤' : ''}',
                            ),
                            selected: _selectedDay == d,
                            onSelected: (_) => _selectDay(d),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: _toggleRestDay,
                  icon: Icon(_isRestDay ? Icons.fitness_center : Icons.hotel),
                  label: Text(
                      _isRestDay ? 'لغو روز استراحت' : 'علامت روز استراحت'),
                ),
                if (_isRestDay)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Text(
                      'این روز به‌عنوان استراحت ذخیره می‌شود.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.muted),
                    ),
                  )
                else ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: _dayTitle,
                    decoration: const InputDecoration(labelText: 'عنوان روز'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _duration,
                    keyboardType: TextInputType.number,
                    decoration:
                        const InputDecoration(labelText: 'مدت (دقیقه)'),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Text('حرکات',
                          style: TextStyle(fontWeight: FontWeight.bold)),
                      const Spacer(),
                      TextButton.icon(
                        onPressed: () async {
                          final picked = await showExercisePicker(context);
                          if (picked == null) return;
                          final list = _exercises()
                            ..add({
                              ...picked,
                              'sets': picked['sets'] ?? 3,
                              'reps': picked['reps'] ?? '12',
                              'setsDetails': _normalizeSetsDetails(
                                null,
                                count: int.tryParse('${picked['sets'] ?? 3}') ??
                                    3,
                                defaultReps: '${picked['reps'] ?? 12}',
                              ),
                              'workoutSystemType': 'normal',
                            });
                          _setExercises(list);
                        },
                        icon: const Icon(Icons.search),
                        label: const Text('کاتالوگ'),
                      ),
                      TextButton.icon(
                        onPressed: () => _editExercise(null, null),
                        icon: const Icon(Icons.add),
                        label: const Text('دستی'),
                      ),
                    ],
                  ),
                  if (_selectedIndexes.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: [
                        ActionChip(
                          label: const Text('سوپرست'),
                          onPressed: () => _linkSelected('superset'),
                        ),
                        ActionChip(
                          label: const Text('جاینت‌ست'),
                          onPressed: () => _linkSelected('giant_set'),
                        ),
                        ActionChip(
                          label: const Text('دایره‌ای'),
                          onPressed: () => _linkSelected('circuit'),
                        ),
                        ActionChip(
                          label: const Text('جدا کردن'),
                          onPressed: _unlinkSelected,
                        ),
                      ],
                    ),
                  ],
                  if (exercises.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Text('حرکتی اضافه نشده.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.muted)),
                    )
                  else
                    ...List.generate(exercises.length, (i) {
                      final e = exercises[i];
                      final system = '${e['workoutSystemType'] ?? 'normal'}';
                      final linked = e['supersetId'] != null &&
                          system != 'normal' &&
                          '${e['supersetId']}'.isNotEmpty;
                      final selected = _selectedIndexes.contains(i);
                      return FitinoPanelCard(padding: EdgeInsets.zero, child: ListTile(
                          onTap: () => _editExercise(e, i),
                          onLongPress: () => setState(() {
                            if (selected) {
                              _selectedIndexes.remove(i);
                            } else {
                              _selectedIndexes.add(i);
                            }
                          }),
                          leading: Checkbox(
                            value: selected,
                            onChanged: (v) => setState(() {
                              if (v == true) {
                                _selectedIndexes.add(i);
                              } else {
                                _selectedIndexes.remove(i);
                              }
                            }),
                          ),
                          title: Text(e['name']?.toString() ?? ''),
                          subtitle: Text(
                            [
                              '${e['sets'] ?? ''} ست × ${e['reps'] ?? ''}',
                              if (linked)
                                _systemLabels[system] ?? system,
                            ].join(' · '),
                          ),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete_outline),
                            onPressed: () {
                              final list = _exercises()..removeAt(i);
                              _setExercises(list);
                              setState(() => _selectedIndexes.remove(i));
                            },
                          ),
                        ));
                    }),
                ],
              ],
            ),
    );
  }
}
