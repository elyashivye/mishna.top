<?php
/**
 * שירות שליחת מייל. ברירת מחדל: mail() המובנה של PHP, שעובד out-of-the-box על
 * אחסון משותף בהוסטינגר (מקושר לדומיין). למי שרוצה SMTP אמיתי (deliverability
 * טוב יותר, DKIM/SPF תקינים), ראו README להטמעת PHPMailer חלופית.
 */

function isEmailConfigured(): bool
{
    return function_exists('mail');
}

function sendReminderEmail(string $toEmail, string $subject, string $bodyHtml): array
{
    $host = $_SERVER['SERVER_NAME'] ?? 'mishna.top';
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: =?UTF-8?B?" . base64_encode('משנה של נשמה') . "?= <no-reply@{$host}>\r\n";

    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $ok = @mail($toEmail, $encodedSubject, $bodyHtml, $headers);
    return $ok ? ['ok' => true] : ['ok' => false, 'error' => 'שליחת המייל נכשלה (mail() החזיר false).'];
}
