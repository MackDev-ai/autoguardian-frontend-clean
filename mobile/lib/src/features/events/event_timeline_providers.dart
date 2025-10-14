import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../vehicles/vehicle_providers.dart';

class TimelineEntry {
  const TimelineEntry({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;
}

final eventTimelineProvider = Provider<List<TimelineEntry>>((ref) {
  // In MVP we return cached demo data offline-friendly.
  final vehicles = ref.watch(vehicleSummaryProvider);
  if (vehicles.isEmpty) {
    return const [];
  }
  return [
    const TimelineEntry(
      icon: Icons.policy,
      title: 'OC/AC - ważne do 14.01.2026',
      subtitle: 'Składka 980,50 zł · Warta',
    ),
    const TimelineEntry(
      icon: Icons.build,
      title: 'Serwis: wymiana oleju',
      subtitle: 'AutoSerwis Nowak · 10.03.2025 · 124 500 km',
    ),
    const TimelineEntry(
      icon: Icons.fact_check,
      title: 'Przegląd techniczny',
      subtitle: 'Stacja SKP Zielona · 15.04.2024',
    ),
  ];
});
