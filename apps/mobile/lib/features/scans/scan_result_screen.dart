import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../models/scan.dart';
import '../../services/api_service.dart';

class ScanResultScreen extends StatefulWidget {
  final String scanId;
  const ScanResultScreen({super.key, required this.scanId});

  @override
  State<ScanResultScreen> createState() => _ScanResultScreenState();
}

class _ScanResultScreenState extends State<ScanResultScreen> {
  MriScan? _scan;
  bool _loading = true;
  bool _analyzing = false;
  bool _showHeatmap = true;
  String? _error;

  // Feedback
  bool _feedbackSubmitted = false;
  bool? _feedbackCorrect;
  final _commentCtrl = TextEditingController();
  bool _submittingFeedback = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      _scan = await api.getScan(widget.scanId);
    } catch (e) {
      _error = e.toString();
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _analyze() async {
    setState(() => _analyzing = true);
    try {
      final api = context.read<ApiService>();
      final result = await api.analyzeScan(widget.scanId);
      _scan = MriScan(
        id: _scan!.id,
        patientId: _scan!.patientId,
        imagePath: _scan!.imagePath,
        prediction: result.prediction,
        confidence: result.confidence,
        heatmapPath: result.heatmapUrl,
        createdAt: _scan!.createdAt,
      );
    } catch (e) {
      _error = e.toString();
    }
    if (mounted) setState(() => _analyzing = false);
  }

  Future<void> _submitFeedback() async {
    if (_feedbackCorrect == null) return;
    setState(() => _submittingFeedback = true);
    try {
      final api = context.read<ApiService>();
      await api.submitFeedback(
        widget.scanId,
        _feedbackCorrect!,
        _commentCtrl.text.trim(),
      );
      setState(() => _feedbackSubmitted = true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _submittingFeedback = false);
    }
  }

  static const _predBadge = {
    'glioma': (Colors.red, 'Glioma'),
    'meningioma': (Colors.orange, 'Meningioma'),
    'pituitary': (Colors.amber, 'Pituitary'),
    'no_tumor': (Colors.green, 'No Tumor'),
  };

  static const _explanations = {
    'glioma':
        'The AI model detected patterns consistent with a glioma. Areas highlighted in the heatmap indicate regions that most influenced this prediction. Please correlate with clinical findings.',
    'meningioma':
        'The AI model detected patterns consistent with a meningioma. The heatmap highlights the regions contributing most to this classification. Clinical correlation is recommended.',
    'pituitary':
        'The AI model detected patterns consistent with a pituitary tumor. The highlighted regions in the heatmap show key areas influencing the prediction. Further clinical evaluation is advised.',
    'no_tumor':
        'The AI model did not detect patterns consistent with a brain tumor. The heatmap shows the regions analyzed. This is a decision-support result and does not replace clinical judgment.',
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

    if (_scan == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(child: Text(_error ?? 'Scan not found')),
      );
    }

    final badge = _predBadge[_scan!.prediction];
    final color = badge?.$1 ?? Colors.grey;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Results', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Not analyzed
          if (!_scan!.isAnalyzed) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Column(
                  children: [
                    Icon(Icons.psychology_outlined,
                        size: 48, color: Colors.grey.shade300),
                    const SizedBox(height: 12),
                    const Text('Not analyzed yet'),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _analyzing ? null : _analyze,
                      icon: _analyzing
                          ? const SizedBox(
                              width: 16, height: 16,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.psychology),
                      label: Text(_analyzing ? 'Analyzing…' : 'Run AI Analysis'),
                    ),
                  ],
                ),
              ),
            ),
          ],

          // Results
          if (_scan!.isAnalyzed) ...[
            // Image viewer
            Card(
              clipBehavior: Clip.antiAlias,
              child: Column(
                children: [
                  // Toggle tabs
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _showHeatmap = false),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: !_showHeatmap
                                  ? AppTheme.brandLight
                                  : Colors.transparent,
                              border: Border(
                                bottom: BorderSide(
                                  color: !_showHeatmap
                                      ? AppTheme.brand
                                      : Colors.grey.shade200,
                                  width: 2,
                                ),
                              ),
                            ),
                            child: Center(
                              child: Text('Original MRI',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color:
                                        !_showHeatmap ? AppTheme.brand : Colors.grey,
                                  )),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _showHeatmap = true),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: _showHeatmap
                                  ? AppTheme.brandLight
                                  : Colors.transparent,
                              border: Border(
                                bottom: BorderSide(
                                  color: _showHeatmap
                                      ? AppTheme.brand
                                      : Colors.grey.shade200,
                                  width: 2,
                                ),
                              ),
                            ),
                            child: Center(
                              child: Text('Grad-CAM',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color:
                                        _showHeatmap ? AppTheme.brand : Colors.grey,
                                  )),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  // Image
                  Container(
                    color: const Color(0xFF0F172A),
                    width: double.infinity,
                    height: 260,
                    child: Image.network(
                      api.imageUrl(
                        (_showHeatmap && _scan!.heatmapPath != null)
                            ? _scan!.heatmapPath!
                            : _scan!.imagePath,
                      ),
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => const Center(
                        child: Icon(Icons.broken_image, color: Colors.white38, size: 40),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Prediction card
            Card(
              color: color.withOpacity(0.05),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: color.withOpacity(0.2)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('AI PREDICTION',
                                style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 1.5,
                                    color: Colors.grey.shade500)),
                            const SizedBox(height: 4),
                            Text(
                              badge?.$2 ?? _scan!.prediction!,
                              style: TextStyle(
                                  fontSize: 26,
                                  fontWeight: FontWeight.bold,
                                  color: color),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('CONFIDENCE',
                                style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 1.5,
                                    color: Colors.grey.shade500)),
                            const SizedBox(height: 4),
                            Text(
                              '${((_scan!.confidence ?? 0) * 100).toStringAsFixed(1)}%',
                              style: const TextStyle(
                                  fontSize: 26, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Confidence bar
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: _scan!.confidence ?? 0,
                        minHeight: 6,
                        backgroundColor: Colors.white54,
                        valueColor: AlwaysStoppedAnimation(
                          (_scan!.confidence ?? 0) >= 0.8
                              ? Colors.green
                              : (_scan!.confidence ?? 0) >= 0.5
                                  ? Colors.amber
                                  : Colors.red,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Explanation
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline, size: 18, color: Colors.amber.shade700),
                        const SizedBox(width: 8),
                        const Text('AI Explanation',
                            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _explanations[_scan!.prediction] ??
                          'AI analysis complete. Correlate with clinical findings.',
                      style: TextStyle(
                          fontSize: 13,
                          height: 1.5,
                          color: Colors.grey.shade600),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.amber.shade50,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        'Disclaimer: This is a decision-support tool and is not intended for medical diagnosis.',
                        style: TextStyle(fontSize: 11, color: Colors.amber.shade800),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Feedback
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Doctor Feedback',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 4),
                    Text('Was this prediction correct?',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                    const SizedBox(height: 16),

                    if (_feedbackSubmitted)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.check_circle, color: Colors.green.shade700),
                            const SizedBox(width: 10),
                            Text('Feedback recorded. Thank you!',
                                style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: Colors.green.shade700)),
                          ],
                        ),
                      )
                    else ...[
                      // Thumbs
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () =>
                                  setState(() => _feedbackCorrect = true),
                              icon: const Icon(Icons.thumb_up_outlined, size: 18),
                              label: const Text('Correct'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: _feedbackCorrect == true
                                    ? Colors.green.shade700
                                    : null,
                                backgroundColor: _feedbackCorrect == true
                                    ? Colors.green.shade50
                                    : null,
                                side: BorderSide(
                                  color: _feedbackCorrect == true
                                      ? Colors.green
                                      : Colors.grey.shade300,
                                ),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () =>
                                  setState(() => _feedbackCorrect = false),
                              icon: const Icon(Icons.thumb_down_outlined, size: 18),
                              label: const Text('Incorrect'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: _feedbackCorrect == false
                                    ? Colors.red.shade700
                                    : null,
                                backgroundColor: _feedbackCorrect == false
                                    ? Colors.red.shade50
                                    : null,
                                side: BorderSide(
                                  color: _feedbackCorrect == false
                                      ? Colors.red
                                      : Colors.grey.shade300,
                                ),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                              ),
                            ),
                          ),
                        ],
                      ),

                      if (_feedbackCorrect != null) ...[
                        const SizedBox(height: 16),
                        TextField(
                          controller: _commentCtrl,
                          maxLines: 2,
                          decoration: const InputDecoration(
                            labelText: 'Comment (optional)',
                            hintText: 'Add notes about the diagnosis…',
                          ),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _submittingFeedback ? null : _submitFeedback,
                          child: _submittingFeedback
                              ? const SizedBox(
                                  width: 18, height: 18,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.white))
                              : const Text('Submit Feedback'),
                        ),
                      ],
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Center(
              child: Text(
                'Decision-support only — not for medical diagnosis.',
                style: TextStyle(fontSize: 11, color: Colors.grey.shade400),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
