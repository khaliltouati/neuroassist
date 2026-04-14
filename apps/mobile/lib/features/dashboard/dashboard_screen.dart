import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../models/scan.dart';
import '../../services/api_service.dart';
import '../../services/auth_provider.dart';
import '../../widgets/stat_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  DashboardStats? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      _stats = await api.getDashboard();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final name = auth.user?.name.split(' ').first ?? 'Doctor';
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Good morning'
        : hour < 17
            ? 'Good afternoon'
            : 'Good evening';

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('$greeting, $name',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text('Clinical activity overview',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _stats == null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Failed to load dashboard'),
                      const SizedBox(height: 12),
                      OutlinedButton(onPressed: _load, child: const Text('Retry')),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Stat cards
                      Row(
                        children: [
                          Expanded(
                            child: StatCard(
                              icon: Icons.people_outline,
                              label: 'Patients',
                              value: '${_stats!.totalPatients}',
                              color: Colors.blue,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: StatCard(
                              icon: Icons.psychology,
                              label: 'Scans',
                              value: '${_stats!.totalScans}',
                              color: Colors.purple,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: StatCard(
                              icon: Icons.track_changes,
                              label: 'Accuracy',
                              value: '${_stats!.aiAccuracy}%',
                              color: Colors.green,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: StatCard(
                              icon: Icons.schedule,
                              label: 'Recent',
                              value: '${_stats!.recentScans.length}',
                              color: Colors.orange,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Recent scans
                      const Text(
                        'Recent Analyses',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      if (_stats!.recentScans.isEmpty)
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(32),
                            child: Center(
                              child: Text('No scans analyzed yet',
                                  style: TextStyle(color: Colors.grey.shade500)),
                            ),
                          ),
                        )
                      else
                        ..._stats!.recentScans.take(8).map(
                              (scan) => _RecentScanTile(scan: scan),
                            ),

                      const SizedBox(height: 24),
                      Center(
                        child: Text(
                          'Decision-support only — not for medical diagnosis.',
                          style: TextStyle(fontSize: 11, color: Colors.grey.shade400),
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }
}

class _RecentScanTile extends StatelessWidget {
  final MriScan scan;
  const _RecentScanTile({required this.scan});

  static const _predColors = {
    'glioma': Colors.red,
    'meningioma': Colors.orange,
    'pituitary': Colors.amber,
    'no_tumor': Colors.green,
  };

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiService>();
    final color = _predColors[scan.prediction] ?? Colors.grey;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: () => Navigator.of(context).pushNamed('/scan-result', arguments: scan.id),
        leading: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.network(
            api.imageUrl(scan.imagePath),
            width: 44,
            height: 44,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Container(
              width: 44, height: 44,
              color: Colors.grey.shade200,
              child: const Icon(Icons.image, size: 20),
            ),
          ),
        ),
        title: Text('Scan ${scan.id.substring(0, 8)}…',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        subtitle: Text(
          scan.createdAt.toLocal().toString().split('.').first,
          style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (scan.prediction != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  scan.prediction!.replaceAll('_', ' '),
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color),
                ),
              ),
            if (scan.confidence != null) ...[
              const SizedBox(width: 8),
              Text(
                '${(scan.confidence! * 100).toStringAsFixed(0)}%',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade600),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
