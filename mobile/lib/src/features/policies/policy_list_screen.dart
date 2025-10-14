import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'policy_providers.dart';

class PolicyListScreen extends ConsumerWidget {
  const PolicyListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final policies = ref.watch(policyListProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Polisy')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        icon: const Icon(Icons.upload_file),
        label: const Text('Dodaj z pliku'),
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: policies.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final policy = policies[index];
          return Card(
            child: ListTile(
              title: Text('${policy.policyType} · ${policy.insurer}'),
              subtitle: Text('Ważna do ${policy.endDateFormatted}\nSkładka: ${policy.premium.toStringAsFixed(2)} zł'),
              isThreeLine: true,
              trailing: IconButton(
                icon: const Icon(Icons.compare_arrows),
                onPressed: () {},
              ),
            ),
          );
        },
      ),
    );
  }
}
