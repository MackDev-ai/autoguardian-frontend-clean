import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'src/core/app_router.dart';
import 'src/core/theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: AutoGuardianApp()));
}

class AutoGuardianApp extends ConsumerWidget {
  const AutoGuardianApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'AutoGuardian',
      theme: buildLightTheme(),
      darkTheme: buildDarkTheme(),
      routerConfig: router,
      locale: const Locale('pl'),
      supportedLocales: const [Locale('pl'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
    );
  }
}
