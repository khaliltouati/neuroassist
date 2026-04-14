class Patient {
  final String id;
  final String doctorId;
  final String name;
  final int age;
  final String notes;
  final DateTime createdAt;

  Patient({
    required this.id,
    required this.doctorId,
    required this.name,
    required this.age,
    required this.notes,
    required this.createdAt,
  });

  factory Patient.fromJson(Map<String, dynamic> json) => Patient(
        id: json['id'] ?? '',
        doctorId: json['doctor_id'] ?? '',
        name: json['name'] ?? '',
        age: json['age'] ?? 0,
        notes: json['notes'] ?? '',
        createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      );
}
