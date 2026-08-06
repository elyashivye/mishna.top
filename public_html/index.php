<?php
require __DIR__ . '/../app/auth.php';
header('Location: ' . (currentUser() ? '/pages.php' : '/login.php'));
exit;
