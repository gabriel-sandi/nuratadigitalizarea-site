<?php
/**
 * Nu Rata Digitalizarea — primirea formularelor (contact și evaluare IA).
 *
 * Ce face:
 *  1. verifică datele trimise din formular;
 *  2. salvează o copie pe server, într-un folder privat (în afara site-ului public);
 *  3. trimite un e-mail către contact@nuratadigitalizarea.ro prin serverul SMTP Proton.
 *
 * Setările (adresa, tokenul SMTP) NU sunt în acest fișier, ci în ../private/config.php,
 * adică în folderul „private”, lângă public_html, unde nu poate fi deschis din browser.
 */

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

function respond(int $code, array $data): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'method']);
}

$configFile = __DIR__ . '/../private/config.php';
if (!is_file($configFile)) {
    respond(500, ['ok' => false, 'error' => 'config']);
}
$config = require $configFile;
$dataDir = $config['data_dir'] ?? (__DIR__ . '/../private/mesaje');
if (!is_dir($dataDir)) { @mkdir($dataDir, 0700, true); }

// --- Citim corpul cererii păstrând câmpurile repetate (ex. „zone” bifate de mai multe ori)
$raw = file_get_contents('php://input') ?: '';
if (strlen($raw) > 50000) { respond(413, ['ok' => false, 'error' => 'size']); }
$fields = [];
foreach (explode('&', $raw) as $pair) {
    if ($pair === '') continue;
    $kv = explode('=', $pair, 2);
    $k = urldecode($kv[0]);
    $v = isset($kv[1]) ? urldecode($kv[1]) : '';
    $k = preg_replace('/\[\]$/', '', $k);
    $v = trim(str_replace("\0", '', $v));
    if (isset($fields[$k])) {
        $fields[$k] = (array)$fields[$k];
        $fields[$k][] = $v;
    } else {
        $fields[$k] = $v;
    }
}
$get = function (string $k) use ($fields): string {
    $v = $fields[$k] ?? '';
    return is_array($v) ? implode(', ', $v) : $v;
};

// --- Anti-spam: câmp capcană completat doar de roboți
if ($get('bot-field') !== '') { respond(200, ['ok' => true]); }

$formName = $get('form-name');
$forms = ['contact' => 'Mesaj nou din formularul de contact', 'evaluare-ia' => 'Evaluare IA nouă'];
if (!isset($forms[$formName])) { respond(400, ['ok' => false, 'error' => 'form']); }

// --- Validare
$email = $get('email');
$missing = [];
foreach (['nume', 'firma', 'email', 'acord'] as $req) {
    if ($get($req) === '') $missing[] = $req;
}
if ($formName === 'contact' && $get('mesaj') === '') $missing[] = 'mesaj';
if ($missing || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['ok' => false, 'error' => 'validation', 'fields' => $missing]);
}

// --- Limită simplă: max. 5 trimiteri pe oră de la aceeași adresă IP
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rateFile = $dataDir . '/.rate-' . hash('sha256', $ip . date('YmdH'));
$count = is_file($rateFile) ? (int)file_get_contents($rateFile) : 0;
if ($count >= 5) { respond(429, ['ok' => false, 'error' => 'rate']); }
@file_put_contents($rateFile, (string)($count + 1));
foreach (glob($dataDir . '/.rate-*') ?: [] as $f) { if (filemtime($f) < time() - 7200) @unlink($f); }

// --- Construim mesajul
$labels = [
    'nume' => 'Nume', 'firma' => 'Firma', 'email' => 'E-mail', 'telefon' => 'Telefon',
    'interes' => 'Interes', 'mesaj' => 'Mesaj', 'marime' => 'Număr angajați', 'domeniu' => 'Domeniu',
    'scor_total' => 'Scor total', 'nivel' => 'Nivel', 'scor_dimensiuni' => 'Scor pe dimensiuni',
    'zone' => 'Zone unde se pierde timp', 'acord' => 'A citit politica de confidențialitate',
    'newsletter' => 'Acord newsletter',
];
$skip = ['bot-field', 'form-name'];
$lines = [];
foreach ($labels as $k => $label) {
    if (array_key_exists($k, $fields) && $get($k) !== '') $lines[] = $label . ': ' . $get($k);
}
$answers = [];
foreach ($fields as $k => $v) {
    if (isset($labels[$k]) || in_array($k, $skip, true)) continue;
    $answers[] = $k . ': ' . (is_array($v) ? implode(', ', $v) : $v);
}
if ($answers) { $lines[] = ''; $lines[] = 'Răspunsuri chestionar (0 = cel mai slab, 3 = cel mai bun):'; $lines = array_merge($lines, $answers); }
$lines[] = '';
$lines[] = 'Trimis la: ' . date('Y-m-d H:i:s') . ' din pagina ' . ($formName === 'contact' ? 'Contact' : 'Evaluare IA');
$body = implode("\r\n", $lines);

$subject = $forms[$formName] . ': ' . mb_substr($get('nume'), 0, 60) . ' (' . mb_substr($get('firma'), 0, 60) . ')';

// --- 1) Salvăm o copie pe server (ca să nu se piardă nimic, chiar dacă e-mailul eșuează)
$record = ['data' => date('c'), 'formular' => $formName, 'campuri' => $fields];
@file_put_contents($dataDir . '/mesaje-' . date('Y-m') . '.jsonl', json_encode($record, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);

// --- 2) Trimitem e-mailul prin SMTP (Proton)
require_once __DIR__ . '/../private/smtp.php';
try {
    nrd_smtp_send($config, $subject, $body, $email, $get('nume'));
} catch (Throwable $e) {
    @file_put_contents($dataDir . '/erori.log', date('c') . ' ' . $e->getMessage() . "\n", FILE_APPEND | LOCK_EX);
    // Mesajul e salvat pe server; îi spunem vizitatorului că a ajuns.
    respond(200, ['ok' => true, 'mail' => false]);
}
respond(200, ['ok' => true]);
