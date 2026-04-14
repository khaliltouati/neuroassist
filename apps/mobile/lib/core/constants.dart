class AppConstants {
  AppConstants._();

  // For physical device via USB: run `adb reverse tcp:8001 tcp:8001`
  // For emulator: use 'http://10.0.2.2:8001'
  // For physical device via Wi-Fi: use your PC's LAN IP
  static const String baseUrl = 'http://localhost:8001';

  static const String tokenKey = 'access_token';
  static const String userKey = 'user_data';
}
