import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import '../core/constants.dart';
import '../models/user.dart';
import '../models/patient.dart';
import '../models/scan.dart';

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);

  @override
  String toString() => message;
}

class ApiService {
  final String _baseUrl = AppConstants.baseUrl;
  String? _token;

  void setToken(String? token) => _token = token;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Future<Map<String, dynamic>> _handleResponse(http.Response res) async {
    final body = jsonDecode(res.body);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return body is Map<String, dynamic> ? body : {'data': body};
    }
    throw ApiException(
      body['detail'] ?? 'Request failed',
      res.statusCode,
    );
  }

  Future<List<dynamic>> _handleListResponse(http.Response res) async {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(res.body) as List;
    }
    final body = jsonDecode(res.body);
    throw ApiException(body['detail'] ?? 'Request failed', res.statusCode);
  }

  // ── Auth ──────────────────────────────────────────

  Future<AuthResponse> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = await _handleResponse(res);
    final auth = AuthResponse.fromJson(data);
    _token = auth.accessToken;
    return auth;
  }

  Future<AuthResponse> register(String name, String email, String password) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );
    final data = await _handleResponse(res);
    final auth = AuthResponse.fromJson(data);
    _token = auth.accessToken;
    return auth;
  }

  // ── Dashboard ─────────────────────────────────────

  Future<DashboardStats> getDashboard() async {
    final res = await http.get(
      Uri.parse('$_baseUrl/api/mri/dashboard'),
      headers: _headers,
    );
    final data = await _handleResponse(res);
    return DashboardStats.fromJson(data);
  }

  // ── Patients ──────────────────────────────────────

  Future<List<Patient>> getPatients() async {
    final res = await http.get(
      Uri.parse('$_baseUrl/api/patients'),
      headers: _headers,
    );
    final list = await _handleListResponse(res);
    return list.map((e) => Patient.fromJson(e)).toList();
  }

  Future<Patient> createPatient(String name, int age, String notes) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/patients'),
      headers: _headers,
      body: jsonEncode({'name': name, 'age': age, 'notes': notes}),
    );
    final data = await _handleResponse(res);
    return Patient.fromJson(data);
  }

  Future<Patient> getPatient(String id) async {
    final res = await http.get(
      Uri.parse('$_baseUrl/api/patients/$id'),
      headers: _headers,
    );
    final data = await _handleResponse(res);
    return Patient.fromJson(data);
  }

  // ── MRI Scans ─────────────────────────────────────

  Future<List<MriScan>> getScans(String patientId) async {
    final res = await http.get(
      Uri.parse('$_baseUrl/api/mri/$patientId'),
      headers: _headers,
    );
    final list = await _handleListResponse(res);
    return list.map((e) => MriScan.fromJson(e)).toList();
  }

  Future<MriScan> getScan(String scanId) async {
    final res = await http.get(
      Uri.parse('$_baseUrl/api/mri/scan/$scanId'),
      headers: _headers,
    );
    final data = await _handleResponse(res);
    return MriScan.fromJson(data);
  }

  Future<MriScan> uploadScan(String patientId, File imageFile) async {
    final uri = Uri.parse('$_baseUrl/api/mri/upload');
    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $_token';
    request.fields['patient_id'] = patientId;

    final ext = imageFile.path.split('.').last.toLowerCase();
    final mimeType = ext == 'png' ? 'image/png' : 'image/jpeg';

    request.files.add(await http.MultipartFile.fromPath(
      'file',
      imageFile.path,
      contentType: MediaType.parse(mimeType),
    ));

    final streamedRes = await request.send();
    final res = await http.Response.fromStream(streamedRes);
    final data = await _handleResponse(res);
    return MriScan.fromJson(data);
  }

  Future<AnalyzeResponse> analyzeScan(String scanId) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/mri/analyze'),
      headers: _headers,
      body: jsonEncode({'scan_id': scanId}),
    );
    final data = await _handleResponse(res);
    return AnalyzeResponse.fromJson(data);
  }

  // ── Feedback ──────────────────────────────────────

  Future<void> submitFeedback(String mriScanId, bool isCorrect, String comment) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/feedback'),
      headers: _headers,
      body: jsonEncode({
        'mri_scan_id': mriScanId,
        'is_correct': isCorrect,
        'comment': comment,
      }),
    );
    if (res.statusCode >= 300) {
      final body = jsonDecode(res.body);
      throw ApiException(body['detail'] ?? 'Feedback failed', res.statusCode);
    }
  }

  // ── Helpers ───────────────────────────────────────

  String imageUrl(String path) => '$_baseUrl$path';
}
