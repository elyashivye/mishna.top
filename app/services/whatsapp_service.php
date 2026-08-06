<?php
/**
 * שירות שליחת WhatsApp דרך WhatsApp Cloud API של Meta.
 * דורש חשבון Meta Business + WhatsApp Business App עם Phone Number ID, Access Token
 * ותבנית הודעה (template) מאושרת — הודעות יזומות (business-initiated, מחוץ לחלון
 * שיחה של 24 שעות) חייבות תבנית מאושרת מראש ע"י מטא. ראו README לשלבי ההקמה המלאים.
 */

function whatsappConfig(): array
{
    $config = require __DIR__ . '/../config.php';
    return [
        'phone_number_id' => $config['whatsapp_phone_number_id'] ?? '',
        'access_token' => $config['whatsapp_access_token'] ?? '',
        'api_version' => $config['whatsapp_api_version'] ?? 'v20.0',
        'template_name' => $config['whatsapp_template_name'] ?? 'daily_reminder',
        'template_lang' => $config['whatsapp_template_lang'] ?? 'he',
    ];
}

function isWhatsAppConfigured(): bool
{
    $c = whatsappConfig();
    return $c['phone_number_id'] !== '' && $c['access_token'] !== '';
}

/**
 * שולח הודעת תבנית WhatsApp. $params הם משתני הטקסט לתוך גוף התבנית (לפי הסדר
 * שהוגדר בתבנית ב-Meta Business Manager). מחזיר ['ok'=>bool, 'error'=>?string].
 */
function sendWhatsAppTemplate(string $toE164, array $params = []): array
{
    $c = whatsappConfig();
    if (!isWhatsAppConfigured()) {
        return ['ok' => false, 'error' => 'WhatsApp אינו מוגדר (חסרים פרטי חשבון Meta ב-config.php).'];
    }

    $components = [];
    if ($params) {
        $components[] = [
            'type' => 'body',
            'parameters' => array_map(static fn ($p) => ['type' => 'text', 'text' => (string) $p], $params),
        ];
    }

    $payload = [
        'messaging_product' => 'whatsapp',
        'to' => preg_replace('/[^0-9]/', '', $toE164),
        'type' => 'template',
        'template' => [
            'name' => $c['template_name'],
            'language' => ['code' => $c['template_lang']],
            'components' => $components,
        ],
    ];

    $url = "https://graph.facebook.com/{$c['api_version']}/{$c['phone_number_id']}/messages";
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $c['access_token'],
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 20,
    ]);
    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        return ['ok' => false, 'error' => "שגיאת רשת: {$curlError}"];
    }
    if ($httpCode >= 200 && $httpCode < 300) {
        return ['ok' => true];
    }
    return ['ok' => false, 'error' => "Meta API החזיר {$httpCode}: " . substr((string) $response, 0, 300)];
}
