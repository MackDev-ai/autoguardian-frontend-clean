import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

class PolicySummary {
  PolicySummary({
    required this.insurer,
    required this.policyType,
    required this.endDate,
    required this.premium,
  });

  final String insurer;
  final String policyType;
  final DateTime endDate;
  final double premium;

  String get endDateFormatted => DateFormat('dd.MM.yyyy').format(endDate);
}

final policyListProvider = Provider<List<PolicySummary>>((ref) {
  return [
    PolicySummary(
      insurer: 'Warta',
      policyType: 'OC',
      endDate: DateTime(2026, 1, 14),
      premium: 980.50,
    ),
    PolicySummary(
      insurer: 'Allianz',
      policyType: 'AC',
      endDate: DateTime(2025, 7, 1),
      premium: 1450.00,
    ),
  ];
});

final activePolicyProvider = FutureProvider<PolicySummary?>((ref) async {
  final policies = ref.watch(policyListProvider);
  policies.sort((a, b) => a.endDate.compareTo(b.endDate));
  return policies.isEmpty ? null : policies.first;
});

final upcomingEventsProvider = Provider<List<_ReminderCard>>((ref) {
  final policies = ref.watch(policyListProvider);
  final now = DateTime.now();
  return policies
      .where((policy) => policy.endDate.isAfter(now))
      .map(
        (policy) => _ReminderCard(
          title: '${policy.policyType} - ${policy.insurer}',
          subtitle: 'Ważna do ${policy.endDateFormatted} · Składka ${policy.premium.toStringAsFixed(2)} zł',
        ),
      )
      .toList();
});

class _ReminderCard {
  _ReminderCard({required this.title, required this.subtitle});

  final String title;
  final String subtitle;
}
