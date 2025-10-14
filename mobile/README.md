# AutoGuardian Mobile

Flutter + Riverpod client providing the MVP experience for managing insurance policies, vehicles and service events. The UI focuses on quick access to coverage details, reminders and the vehicle timeline.

## Getting started

Install Flutter 3.16+, then:

```bash
flutter pub get
flutter test
flutter run
```

Offline-first storage uses Hive (initialised in future milestones). Networking is performed via Dio with JWT interceptors (to be implemented in the next iterations).
