<?php
require __DIR__ . '/../app/auth.php';
header('Location: ' . (currentUser() ? '/dashboard.php' : '/login.php'));
exit;
