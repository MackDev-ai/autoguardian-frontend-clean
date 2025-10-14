import 'package:flutter/material.dart';

ThemeData buildLightTheme() {
  return ThemeData(
    colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0B5ED7)),
    useMaterial3: true,
  );
}

ThemeData buildDarkTheme() {
  return ThemeData(
    colorScheme: ColorScheme.fromSeed(
      seedColor: const Color(0xFF0B5ED7),
      brightness: Brightness.dark,
    ),
    useMaterial3: true,
  );
}
