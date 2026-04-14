import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../models/patient.dart';
import '../../models/scan.dart';
import '../../services/api_service.dart';

class PatientProfileScreen extends StatefulWidget {
  final String patientId;
  const PatientProfileScreen({super.key, required this.patientId});

  @override
  State<PatientProfileScreen> createState() => _PatientProfileScreenState();
}

class _PatientProfileScreenState extends State<PatientProfileScreen> {
  Patient? _patient;
  List<MriScan> _scans = [];
  bool _loading = true;
  bool _uploading = false;
  bool _analyzingId = false;
  String? _analyzingScanId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final results = await Future.wait([
        api.getPatient(widget.patientId),
        api.getScans(widget.patientId),
      ]);
      _patient = results[0] as Patient;
      _scans = results[1] as List<MriScan>;
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _pickAndUpload(ImageSource source) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: source, imageQuality: 85);
    if (picked == null) return;

    setState(() => _uploading = true);
    try {
      final api = context.read<ApiService>();
      final scan = await api.uploadScan(widget.patientId, File(picked.path));
      setState(() => _scans.insert(0, scan));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('MRI uploaded successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  void _showImageSourceSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Upload MRI Scan',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.brandLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.photo_library, color: AppTheme.brand),
                ),
                title: const Text('Choose from Gallery'),
                subtitle: const Text('Select an existing MRI image'),
                onTap: () {
                  Navigator.pop(context);
                  _pickAndUpload(ImageSource.gallery);
                },
              ),
              const SizedBox(height: 8),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.brandLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.camera_alt, color: AppTheme.brand),
                ),
                title: const Text('Take a Photo'),
                subtitle: const Text('Capture MRI film or screen'),
                onTap: () {
                  Navigator.pop(context);
                  _pickAndUpload(ImageSource.camera);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _analyze(String scanId) async {
    setState(() {
      _analyzingId = true;
      _analyzingScanId = scanId;
    });
    try {
      final api = context.read<ApiService>();
      await api.analyzeScan(scanId);
      if (mounted) {
        Navigator.of(context).pushNamed('/scan-result', arguments: scanId);
        _load(); // Refresh after coming back
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Analysis failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _analyzingId = false);
    }
  }

  static const _predColors = {
    'glioma': Colors.red,
    'meningioma': Colors.orange,
    'pituitary': Colors.amber,
    'no_tumor': Colors.green,
  };

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiService>();

    if (_loading) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_patient == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Patient not found')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_patient!.name, style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _uploading ? null : _showImageSourceSheet,
        icon: _uploading
            ? const SizedBox(
                width: 18, height: 18,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : const Icon(Icons.add_a_photo),
        label: Text(_uploading ? 'Uploading…' : 'New Scan'),
        backgroundColor: AppTheme.brand,
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Patient info card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: AppTheme.brand,
                      foregroundColor: Colors.white,
                      child: Text(_patient!.name[0].toUpperCase(),
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_patient!.name,
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text('Age ${_patient!.age}',
                              style: TextStyle(color: Colors.grey.shade600)),
                          if (_patient!.notes.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(_patient!.notes,
                                style: TextStyle(
                                    fontSize: 13, color: Colors.grey.shade500)),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Scans header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('MRI Scans',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text('${_scans.length}',
                      style: TextStyle(
                          fontWeight: FontWeight.bold, color: Colors.grey.shade600)),
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (_scans.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(40),
                  child: Column(
                    children: [
                      Icon(Icons.psychology_outlined,
                          size: 48, color: Colors.grey.shade300),
                      const SizedBox(height: 12),
                      Text('No scans yet',
                          style: TextStyle(color: Colors.grey.shade500)),
                      const SizedBox(height: 4),
                      Text('Tap "New Scan" to upload or capture an MRI',
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade400)),
                    ],
                  ),
                ),
              )
            else
              ..._scans.map((scan) {
                final color = _predColors[scan.prediction] ?? Colors.grey;
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    children: [
                      // Thumbnail
                      Stack(
                        children: [
                          SizedBox(
                            height: 160,
                            width: double.infinity,
                            child: Image.network(
                              api.imageUrl(scan.imagePath),
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                color: Colors.grey.shade900,
                                child: const Center(
                                  child: Icon(Icons.image, color: Colors.white38, size: 40),
                                ),
                              ),
                            ),
                          ),
                          if (scan.prediction != null)
                            Positioned(
                              top: 8,
                              right: 8,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: color.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: color.withOpacity(0.3)),
                                ),
                                child: Text(
                                  scan.prediction!.replaceAll('_', ' '),
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: color,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                      // Info
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: scan.isAnalyzed
                            ? Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Confidence: ${((scan.confidence ?? 0) * 100).toStringAsFixed(1)}%',
                                    style: TextStyle(
                                        fontSize: 13, color: Colors.grey.shade600),
                                  ),
                                  TextButton(
                                    onPressed: () => Navigator.of(context)
                                        .pushNamed('/scan-result', arguments: scan.id),
                                    child: const Text('View Results →'),
                                  ),
                                ],
                              )
                            : SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: (_analyzingId && _analyzingScanId == scan.id)
                                      ? null
                                      : () => _analyze(scan.id),
                                  icon: (_analyzingId && _analyzingScanId == scan.id)
                                      ? const SizedBox(
                                          width: 16, height: 16,
                                          child: CircularProgressIndicator(
                                              strokeWidth: 2, color: Colors.white))
                                      : const Icon(Icons.psychology, size: 18),
                                  label: Text(
                                    (_analyzingId && _analyzingScanId == scan.id)
                                        ? 'Analyzing…'
                                        : 'Run AI Analysis',
                                  ),
                                ),
                              ),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
