<?php
require_once __DIR__ . '/db.php';

if (session_status() === PHP_SESSION_NONE) {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'secure' => $isHttps]);
    session_start();
}

function currentUser(): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    static $cached = null;
    if ($cached !== null && $cached['id'] === $_SESSION['user_id']) {
        return $cached;
    }
    $stmt = db()->prepare('SELECT * FROM users WHERE id = :id');
    $stmt->execute([':id' => $_SESSION['user_id']]);
    $user = $stmt->fetch();
    if (!$user) {
        unset($_SESSION['user_id']);
        return null;
    }
    $cached = $user;
    return $user;
}

function requireLogin(): array
{
    $user = currentUser();
    if (!$user) {
        header('Location: /login.php');
        exit;
    }
    return $user;
}

function registerUser(string $name, string $email, string $password): array
{
    $name = trim($name);
    $email = trim(mb_strtolower($email));
    if ($name === '' || mb_strlen($name) > 100) {
        return ['ok' => false, 'error' => 'נא להזין שם תקין.'];
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['ok' => false, 'error' => 'כתובת אימייל לא תקינה.'];
    }
    if (mb_strlen($password) < 6) {
        return ['ok' => false, 'error' => 'הסיסמה חייבת להכיל לפחות 6 תווים.'];
    }
    $pdo = db();
    $exists = $pdo->prepare('SELECT id FROM users WHERE email = :email');
    $exists->execute([':email' => $email]);
    if ($exists->fetch()) {
        return ['ok' => false, 'error' => 'כתובת אימייל זו כבר רשומה במערכת.'];
    }
    $stmt = $pdo->prepare(
        'INSERT INTO users (name, email, password_hash) VALUES (:name, :email, :hash)'
    );
    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':hash' => password_hash($password, PASSWORD_DEFAULT),
    ]);
    $_SESSION['user_id'] = (int) $pdo->lastInsertId();
    return ['ok' => true];
}

function attemptLogin(string $email, string $password): array
{
    $email = trim(mb_strtolower($email));
    $stmt = db()->prepare('SELECT * FROM users WHERE email = :email');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($password, $user['password_hash'])) {
        return ['ok' => false, 'error' => 'אימייל או סיסמה שגויים.'];
    }
    $_SESSION['user_id'] = (int) $user['id'];
    return ['ok' => true];
}

function logoutUser(): void
{
    $_SESSION = [];
    session_destroy();
}

function csrfToken(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrfField(): string
{
    return '<input type="hidden" name="csrf_token" value="' . htmlspecialchars(csrfToken()) . '">';
}

function verifyCsrf(): bool
{
    $token = $_POST['csrf_token'] ?? '';
    return !empty($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}
