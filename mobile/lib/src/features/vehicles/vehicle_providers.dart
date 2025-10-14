import 'package:flutter_riverpod/flutter_riverpod.dart';

class VehicleSummary {
  const VehicleSummary({required this.displayName, required this.registration});

  final String displayName;
  final String registration;
}

final vehicleSummaryProvider = Provider<List<VehicleSummary>>((ref) {
  // TODO: connect with Hive cache + API service.
  return const [
    VehicleSummary(displayName: 'Toyota Corolla 1.8 Hybrid', registration: 'WE12345'),
    VehicleSummary(displayName: 'Skoda Octavia 2.0 TDI', registration: 'PO45678'),
  ];
});
