class User {
  final String id;
  final String email;
  final String name;

  User({required this.id, required this.email, required this.name});

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['user_id'] ?? json['id'] ?? '',
        email: json['email'] ?? '',
        name: json['name'] ?? '',
      );

  Map<String, dynamic> toJson() => {'id': id, 'email': email, 'name': name};
}

class AuthResponse {
  final String accessToken;
  final User user;

  AuthResponse({required this.accessToken, required this.user});

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
        accessToken: json['access_token'] ?? '',
        user: User.fromJson(json),
      );
}
