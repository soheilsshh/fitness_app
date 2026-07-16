import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/config/api_paths.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/dio_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_widget.dart';
import '../../../core/widgets/fitino_ui.dart';
import '../../../core/widgets/state_views.dart';

class OrderLineItem {
  const OrderLineItem({
    required this.title,
    required this.qty,
    required this.price,
    this.type = '',
  });

  final String title;
  final int qty;
  final int price;
  final String type;

  factory OrderLineItem.fromJson(Map<String, dynamic> json) => OrderLineItem(
        title: json['title'] as String? ?? '',
        qty: (json['qty'] as num?)?.toInt() ?? 1,
        price: (json['price'] as num?)?.toInt() ?? 0,
        type: json['type'] as String? ?? '',
      );
}

class OrderDetail {
  const OrderDetail({
    required this.id,
    required this.status,
    required this.createdAt,
    required this.items,
    this.paymentMethod = '',
    this.trackingCode = '',
    this.discountPercent = 0,
    this.note = '',
    this.coachName = '',
  });

  final int id;
  final String status;
  final String createdAt;
  final List<OrderLineItem> items;
  final String paymentMethod;
  final String trackingCode;
  final int discountPercent;
  final String note;
  final String coachName;

  int get subtotal =>
      items.fold(0, (sum, i) => sum + (i.price * i.qty));

  int get payable {
    if (discountPercent <= 0) return subtotal;
    return (subtotal * (100 - discountPercent) / 100).round();
  }

  factory OrderDetail.fromJson(Map<String, dynamic> json) => OrderDetail(
        id: (json['id'] as num?)?.toInt() ?? 0,
        status: json['status'] as String? ?? '',
        createdAt: json['createdAt']?.toString() ?? '',
        paymentMethod: json['paymentMethod'] as String? ?? '',
        trackingCode: json['trackingCode'] as String? ?? '',
        discountPercent: (json['discountPercent'] as num?)?.toInt() ?? 0,
        note: json['note'] as String? ?? '',
        coachName: json['coachName'] as String? ?? '',
        items: (json['items'] as List? ?? const [])
            .map((e) =>
                OrderLineItem.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
      );
}

class OrdersRepository {
  OrdersRepository(this._dio);
  final Dio _dio;

  Future<List<OrderDetail>> list() async {
    try {
      final res = await _dio.get(ApiPaths.meOrders);
      final data = res.data;
      final list = data is Map
          ? (data['items'] as List? ?? const [])
          : (data as List? ?? const []);
      return list
          .map((e) =>
              OrderDetail.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<OrderDetail> detail(int id) async {
    try {
      final res = await _dio.get(ApiPaths.meOrder(id));
      return OrderDetail.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final ordersRepositoryProvider =
    Provider((ref) => OrdersRepository(ref.watch(dioProvider)));

final ordersProvider = FutureProvider.autoDispose<List<OrderDetail>>((ref) {
  return ref.watch(ordersRepositoryProvider).list();
});

final orderDetailProvider =
    FutureProvider.autoDispose.family<OrderDetail, int>((ref, id) {
  return ref.watch(ordersRepositoryProvider).detail(id);
});

String statusFa(String s) {
  return switch (s.toLowerCase()) {
    'paid' || 'success' || 'completed' => 'موفق',
    'pending' => 'در انتظار',
    'failed' || 'canceled' || 'cancelled' => 'ناموفق',
    _ => s.isEmpty ? 'نامشخص' : s,
  };
}

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(ordersProvider);
    final fmt = NumberFormat.decimalPattern('fa');
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        color: AppColors.brandMid,
        onRefresh: () async => ref.refresh(ordersProvider.future),
        child: AsyncValueWidget<List<OrderDetail>>(
          value: async,
          onRetry: () => ref.invalidate(ordersProvider),
          data: (items) {
            if (items.isEmpty) {
              return ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
                children: [
                  FitinoPageHeader(
                    title: 'سفارش‌ها',
                    description: 'تاریخچه خرید و وضعیت پرداخت',
                    meta: TextButton(
                      onPressed: () => context.push('/student/subscribe'),
                      child: const Text('خرید پلن'),
                    ),
                  ),
                  const SizedBox(height: 64),
                  const EmptyView(
                    message: 'هنوز سفارشی ندارید',
                    icon: Icons.shopping_bag_outlined,
                  ),
                  const SizedBox(height: 16),
                  Center(
                    child: FilledButton(
                      onPressed: () => context.push('/student/subscribe'),
                      child: const Text('مشاهده پلن‌ها'),
                    ),
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
              itemCount: items.length + 1,
              separatorBuilder: (_, i) =>
                  SizedBox(height: i == 0 ? 12 : 8),
              itemBuilder: (_, i) {
                if (i == 0) {
                  return FitinoPageHeader(
                    title: 'سفارش‌ها',
                    description: 'تاریخچه خرید و وضعیت پرداخت',
                    meta: TextButton(
                      onPressed: () => context.push('/student/subscribe'),
                      child: const Text('خرید پلن'),
                    ),
                  );
                }
                final o = items[i - 1];
                final title = o.items.isNotEmpty
                    ? o.items.first.title
                    : 'سفارش #${o.id}';
                return FitinoPanelCard(
                  padding: EdgeInsets.zero,
                  child: ListTile(
                    title: Text(title),
                    subtitle: Text(
                      '${statusFa(o.status)} · ${o.createdAt}',
                      style: const TextStyle(color: AppColors.muted),
                    ),
                    trailing: Text(
                      '${fmt.format(o.payable)} تومان',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    onTap: () => context.push('/student/orders/${o.id}'),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({super.key, required this.id});
  final int id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(orderDetailProvider(id));
    final fmt = NumberFormat.decimalPattern('fa');
    return FitinoPushScaffold(
      title: 'سفارش #$id',
      description: 'جزئیات سفارش و پرداخت',
      body: AsyncValueWidget<OrderDetail>(
        value: async,
        onRetry: () => ref.invalidate(orderDetailProvider(id)),
        data: (o) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            FitinoPanelCard(
              padding: EdgeInsets.zero,
              child: ListTile(
                title: Text(statusFa(o.status)),
                subtitle: Text(o.createdAt),
                trailing: o.coachName.isEmpty ? null : Text(o.coachName),
              ),
            ),
            const SizedBox(height: 12),
            const Text('اقلام',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            ...o.items.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: FitinoPanelCard(
                  padding: EdgeInsets.zero,
                  child: ListTile(
                    title: Text(item.title),
                    subtitle: Text('تعداد: ${item.qty}'),
                    trailing:
                        Text('${fmt.format(item.price * item.qty)} ت'),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            FitinoPanelCard(
              child: Column(
                children: [
                  _row('جمع', '${fmt.format(o.subtotal)} تومان'),
                  if (o.discountPercent > 0)
                    _row('تخفیف', '${o.discountPercent}٪'),
                  const Divider(),
                  _row('قابل پرداخت', '${fmt.format(o.payable)} تومان',
                      bold: true),
                  if (o.paymentMethod.isNotEmpty)
                    _row('روش پرداخت', o.paymentMethod),
                  if (o.trackingCode.isNotEmpty)
                    _row('کد پیگیری', o.trackingCode),
                  if (o.note.isNotEmpty) _row('یادداشت', o.note),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _row(String k, String v, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(k, style: TextStyle(color: bold ? null : AppColors.muted)),
          Flexible(
            child: Text(
              v,
              textAlign: TextAlign.left,
              style: TextStyle(fontWeight: bold ? FontWeight.bold : null),
            ),
          ),
        ],
      ),
    );
  }
}
