import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'event_timeline_providers.dart';

class EventTimeline extends ConsumerWidget {
  const EventTimeline({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final events = ref.watch(eventTimelineProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Oś czasu pojazdu', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        if (events.isEmpty)
          const Card(child: ListTile(title: Text('Brak wpisów. Dodaj pierwszy serwis.')))
        else
          ...events.map(
            (event) => Card(
              child: ListTile(
                leading: Icon(event.icon),
                title: Text(event.title),
                subtitle: Text(event.subtitle),
              ),
            ),
          ),
      ],
    );
  }
}
