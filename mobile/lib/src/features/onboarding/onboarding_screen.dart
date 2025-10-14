import 'package:flutter/material.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  static const _items = [
    (
      Icons.verified_user,
      'Wiesz, co obejmuje Twoja polisa',
      'Przejrzyste karty i szybki dostęp do szczegółów ochrony.'
    ),
    (
      Icons.calendar_month,
      'Nie przegapisz terminów',
      'Automatyczne przypomnienia o polisach, przeglądach i ratach.'
    ),
    (
      Icons.analytics_outlined,
      'Pełna teczka pojazdu',
      'Zapisuj serwisy, koszty i przebiegi w jednym miejscu.'
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AutoGuardian')),
      body: PageView.builder(
        itemCount: _items.length,
        itemBuilder: (context, index) {
          final item = _items[index];
          return Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(item.$1, size: 96),
                const SizedBox(height: 32),
                Text(item.$2, style: Theme.of(context).textTheme.headlineSmall, textAlign: TextAlign.center),
                const SizedBox(height: 16),
                Text(item.$3, style: Theme.of(context).textTheme.bodyLarge, textAlign: TextAlign.center),
              ],
            ),
          );
        },
      ),
    );
  }
}
