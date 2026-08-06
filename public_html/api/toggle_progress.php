<?php
require __DIR__ . '/../../app/auth.php';
require __DIR__ . '/../../app/functions.php';

header('Content-Type: application/json; charset=utf-8');

$user = currentUser();
if (!$user) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'לא מחובר']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !verifyCsrf()) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'בקשה לא תקינה']);
    exit;
}

$mishnaId = (int) ($_POST['mishna_id'] ?? 0);
if ($mishnaId <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'משנה לא תקינה']);
    exit;
}

$userId = (int) $user['id'];
if (isMishnaCompletedByUser($userId, $mishnaId)) {
    unmarkMishnaComplete($userId, $mishnaId);
    $completed = false;
} else {
    markMishnaComplete($userId, $mishnaId);
    $completed = true;
}

echo json_encode([
    'ok' => true,
    'completed' => $completed,
    'stats' => getUserStats($userId),
]);
