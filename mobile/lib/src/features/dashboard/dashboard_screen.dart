import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../events/event_timeline.dart';
import '../policies/policy_providers.dart';
import '../vehicles/vehicle_providers.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vehicles = ref.watch(vehicleSummaryProvider);
    final activePolicy = ref.watch(activePolicyProvider);
    final upcomingEvents = ref.watch(upcomingEventsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('AutoGuardian')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(vehicleSummaryProvider);
          ref.invalidate(activePolicyProvider);
          ref.invalidate(upcomingEventsProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('Najbliższe terminy', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            if (upcomingEvents.isEmpty)
              const Card(child: ListTile(title: Text('Brak zbliżających się terminów.')))
            else
              ...upcomingEvents.map((event) => Card(
                    child: ListTile(
                      title: Text(event.title),
                      subtitle: Text(event.subtitle),
                    ),
                  )),
            const SizedBox(height: 16),
            Text('Aktywna polisa', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            activePolicy.when(
              data: (policy) => policy == null
                  ? const Card(child: ListTile(title: Text('Dodaj pierwszą polisę.')))
                  : Card(
                      child: ListTile(
                        title: Text(policy.insurer),
                        subtitle: Text('${policy.policyType} · ważna do ${policy.endDateFormatted}'),
                      ),
                    ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Card(child: ListTile(title: Text('Błąd: $err'))),
            ),
            const SizedBox(height: 16),
            Text('Pojazdy', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Card(
              child: ListTile(
                title: Text('${vehicles.length} pojazdów'),
                subtitle: Text(vehicles.map((vehicle) => vehicle.displayName).join(', ')),
              ),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.add_circle_outline),
              label: const Text('Dodaj polisę'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.build_circle_outlined),
              label: const Text('Dodaj przegląd / serwis'),
            ),
            const SizedBox(height: 24),
            const EventTimeline(),
          ],
        ),
      ),
    );
  }
}
