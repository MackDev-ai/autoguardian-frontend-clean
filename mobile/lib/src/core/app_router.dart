import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/dashboard/dashboard_screen.dart';
import '../features/onboarding/onboarding_screen.dart';
import '../features/policies/policy_list_screen.dart';
import '../features/vehicles/vehicle_list_screen.dart';

final appRouterProvider = Provider<RouterConfig<Object?>>((ref) {
  return RouterConfig(
    routerDelegate: _AppRouterDelegate(ref),
    routeInformationParser: const _AppRouteParser(),
  );
});

class _AppRouteParser extends RouteInformationParser<List<String>> {
  const _AppRouteParser();

  @override
  Future<List<String>> parseRouteInformation(RouteInformation routeInformation) async {
    final location = routeInformation.location ?? '/';
    return location.split('/').where((segment) => segment.isNotEmpty).toList();
  }
}

class _AppRouterDelegate extends RouterDelegate<List<String>>
    with ChangeNotifier, PopNavigatorRouterDelegateMixin<List<String>> {
  _AppRouterDelegate(this._ref);

  final ProviderRef<Object?> _ref;
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
  List<String> _segments = [];

  @override
  Widget build(BuildContext context) {
    Widget child;
    if (_segments.isEmpty) {
      child = const DashboardScreen();
    } else if (_segments.first == 'onboarding') {
      child = const OnboardingScreen();
    } else if (_segments.first == 'vehicles') {
      child = const VehicleListScreen();
    } else if (_segments.first == 'policies') {
      child = const PolicyListScreen();
    } else {
      child = const DashboardScreen();
    }

    return Navigator(
      key: navigatorKey,
      pages: [MaterialPage(child: child)],
      onPopPage: (route, result) {
        if (!route.didPop(result)) {
          return false;
        }
        _segments = [];
        notifyListeners();
        return true;
      },
    );
  }

  @override
  Future<void> setNewRoutePath(List<String> configuration) async {
    _segments = configuration;
    notifyListeners();
  }
}
