<?php
// Setări pentru trimiterea formularelor.
// NU scrieți tokenul aici: la publicare, GitHub Actions înlocuiește valoarea smtp_pass
// cu secretul SMTP_PASS din repo (Settings > Secrets and variables > Actions).
// Acest fișier stă în folderul „private”, în afara public_html, și nu poate fi deschis din browser.
return [
    'smtp_host'   => 'smtp.protonmail.ch',
    'smtp_port'   => 587,
    'smtp_secure' => 'starttls',
    'smtp_user'   => 'contact@nuratadigitalizarea.ro',
    'smtp_pass'   => 'LIPITI-AICI-TOKENUL-SMTP-DIN-PROTON',
    'from_email'  => 'contact@nuratadigitalizarea.ro',
    'from_name'   => 'Site nuratadigitalizarea.ro',
    'to_email'    => ['contact@nuratadigitalizarea.ro'],
    // Copiile mesajelor (și jurnalul de erori) se salvează aici:
    'data_dir'    => __DIR__ . '/mesaje',
];
