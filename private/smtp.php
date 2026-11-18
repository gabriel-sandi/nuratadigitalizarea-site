<?php
/**
 * Client SMTP minimal (fără biblioteci externe) pentru trimiterea e-mailurilor prin Proton.
 * Server: smtp.protonmail.ch, port 587, STARTTLS, autentificare cu token SMTP.
 */
declare(strict_types=1);

function nrd_smtp_send(array $c, string $subject, string $body, string $replyTo, string $replyName): void {
    $host = $c['smtp_host'];
    $port = (int)$c['smtp_port'];
    $secure = $c['smtp_secure'] ?? 'starttls'; // starttls | tls | none (doar pentru teste)
    $ctx = stream_context_create(['ssl' => [
        'verify_peer' => $c['smtp_verify'] ?? true,
        'verify_peer_name' => $c['smtp_verify'] ?? true,
        'allow_self_signed' => !($c['smtp_verify'] ?? true),
    ]]);
    $remote = ($secure === 'tls' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
    $fp = @stream_socket_client($remote, $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
    if (!$fp) throw new RuntimeException("Conectare SMTP eșuată: $errstr ($errno)");
    stream_set_timeout($fp, 20);

    $read = function () use ($fp): string {
        $data = '';
        while (($line = fgets($fp, 1024)) !== false) {
            $data .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') break;
        }
        return $data;
    };
    $cmd = function (?string $line, array $okCodes) use ($fp, $read): string {
        if ($line !== null) fwrite($fp, $line . "\r\n");
        $resp = $read();
        $code = (int)substr($resp, 0, 3);
        if (!in_array($code, $okCodes, true)) {
            $shown = $line !== null && stripos($line, 'AUTH') !== 0 && strlen($line) < 200 ? $line : '(comandă)';
            throw new RuntimeException("SMTP: $shown -> " . trim($resp));
        }
        return $resp;
    };

    $me = $c['helo'] ?? 'nuratadigitalizarea.ro';
    $cmd(null, [220]);
    $cmd("EHLO $me", [250]);
    if ($secure === 'starttls') {
        $cmd('STARTTLS', [220]);
        if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT)) {
            throw new RuntimeException('STARTTLS eșuat');
        }
        $cmd("EHLO $me", [250]);
    }
    $cmd('AUTH LOGIN', [334]);
    $cmd(base64_encode($c['smtp_user']), [334]);
    $cmd(base64_encode($c['smtp_pass']), [235]);

    $from = $c['from_email'];
    $cmd("MAIL FROM:<$from>", [250]);
    foreach ((array)$c['to_email'] as $to) $cmd("RCPT TO:<$to>", [250, 251]);
    $cmd('DATA', [354]);

    $enc = fn(string $s): string => '=?UTF-8?B?' . base64_encode($s) . '?=';
    $clean = fn(string $s): string => str_replace(["\r", "\n"], ' ', $s);
    $domain = substr(strrchr($from, '@') ?: '@nuratadigitalizarea.ro', 1);
    $headers = [
        'Date: ' . date('r'),
        'From: ' . $enc($c['from_name'] ?? 'Site nuratadigitalizarea.ro') . " <$from>",
        'To: ' . implode(', ', array_map(fn($t) => "<$t>", (array)$c['to_email'])),
        'Reply-To: ' . $enc($clean($replyName)) . ' <' . $clean($replyTo) . '>',
        'Subject: ' . $enc($clean($subject)),
        'Message-ID: <' . bin2hex(random_bytes(12)) . "@$domain>",
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
    ];
    $msg = implode("\r\n", $headers) . "\r\n\r\n" . chunk_split(base64_encode($body), 76, "\r\n");
    fwrite($fp, $msg . "\r\n.\r\n");
    $cmd(null, [250]);
    $cmd('QUIT', [221, 250]);
    fclose($fp);
}
