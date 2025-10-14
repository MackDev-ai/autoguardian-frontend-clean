import 'package:autoguardian_mobile/main.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('App renders dashboard', (tester) async {
    await tester.pumpWidget(const AutoGuardianApp());
    await tester.pumpAndSettle();

    expect(find.text('AutoGuardian'), findsWidgets);
    expect(find.text('Najbliższe terminy'), findsOneWidget);
  });
}
