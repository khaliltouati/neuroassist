class MriScan {
  final String id;
  final String patientId;
  final String imagePath;
  final String? prediction;
  final double? confidence;
  final String? heatmapPath;
  final DateTime createdAt;

  MriScan({
    required this.id,
    required this.patientId,
    required this.imagePath,
    this.prediction,
    this.confidence,
    this.heatmapPath,
    required this.createdAt,
  });

  factory MriScan.fromJson(Map<String, dynamic> json) => MriScan(
        id: json['id'] ?? '',
        patientId: json['patient_id'] ?? '',
        imagePath: json['image_path'] ?? '',
        prediction: json['prediction'],
        confidence: json['confidence'] != null
            ? (json['confidence'] as num).toDouble()
            : null,
        heatmapPath: json['heatmap_path'],
        createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      );

  bool get isAnalyzed => prediction != null;
}

class AnalyzeResponse {
  final String prediction;
  final double confidence;
  final String heatmapUrl;
  final String explanation;

  AnalyzeResponse({
    required this.prediction,
    required this.confidence,
    required this.heatmapUrl,
    required this.explanation,
  });

  factory AnalyzeResponse.fromJson(Map<String, dynamic> json) =>
      AnalyzeResponse(
        prediction: json['prediction'] ?? '',
        confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
        heatmapUrl: json['heatmap_url'] ?? '',
        explanation: json['explanation'] ?? '',
      );
}

class DashboardStats {
  final int totalPatients;
  final int totalScans;
  final double aiAccuracy;
  final List<MriScan> recentScans;

  DashboardStats({
    required this.totalPatients,
    required this.totalScans,
    required this.aiAccuracy,
    required this.recentScans,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) => DashboardStats(
        totalPatients: json['total_patients'] ?? 0,
        totalScans: json['total_scans'] ?? 0,
        aiAccuracy: (json['ai_accuracy'] as num?)?.toDouble() ?? 0,
        recentScans: (json['recent_scans'] as List? ?? [])
            .map((e) => MriScan.fromJson(e))
            .toList(),
      );
}
