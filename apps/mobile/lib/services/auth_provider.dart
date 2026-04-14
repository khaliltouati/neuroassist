import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants.dart';
import '../models/user.dart';
import 'api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService api;
  User? _user;
  bool _loading = false;
  String? _error;

  AuthProvider(this.api);

  User? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConstants.tokenKey);
    final userData = prefs.getString(AppConstants.userKey);

    if (token != null && userData != null) {
      api.setToken(token);
      _user = User.fromJson(jsonDecode(userData));
      // Override 'user_id' key mapping — stored locally as 'id'
      _user = User(id: _user!.id, email: _user!.email, name: _user!.name);
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final auth = await api.login(email, password);
      await _persist(auth);
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      return false;
    } catch (e) {
      _error = 'Connection failed. Check your network.';
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> register(String name, String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final auth = await api.register(name, email, password);
      await _persist(auth);
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      return false;
    } catch (e) {
      _error = 'Connection failed. Check your network.';
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.tokenKey);
    await prefs.remove(AppConstants.userKey);
    api.setToken(null);
    _user = null;
    notifyListeners();
  }

  Future<void> _persist(AuthResponse auth) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.tokenKey, auth.accessToken);
    await prefs.setString(AppConstants.userKey, jsonEncode(auth.user.toJson()));
    _user = auth.user;
  }
}
