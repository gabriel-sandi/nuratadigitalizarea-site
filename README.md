# nuratadigitalizarea.ro

Site-ul static (HTML/CSS/JS + `trimite.php` pentru formulare), găzduit pe Hetzner Webhosting.

| Folder din repo | Unde ajunge pe server |
|---|---|
| `site/` | `public_html/nuratadigitalizarea.ro/site` (document root) |
| `private/` | `public_html/nuratadigitalizarea.ro/private` (setări SMTP, mesaje; blocat din browser) |

## Publicare

Orice modificare pe `main` se publică automat prin GitHub Actions (`.github/workflows/deploy.yml`), prin SFTP.
Se poate porni și manual: **Actions → Publicare pe Hetzner → Run workflow**.

- În `site/`, fișierele șterse din repo se șterg și de pe server (cu excepția `.well-known/`).
- În `private/` nu se șterge nimic; folderul `private/mesaje/` (mesajele primite) nu e în repo și nu e atins.
- Publicarea scrie doar în `public_html/nuratadigitalizarea.ro/`; dacă folderele `site` sau `private` lipsesc, se oprește.

## Secrete (Settings → Secrets and variables → Actions)

| Secret | Ce conține |
|---|---|
| `FTP_HOST` | serverul, ex. `www781.your-server.de` |
| `FTP_USER` | utilizatorul FTP principal din konsoleH |
| `FTP_PASSWORD` | parola FTP |
| `SMTP_PASS` | tokenul SMTP Proton pentru `contact@nuratadigitalizarea.ro` (pus în `config.php` doar la publicare) |

Variabile opționale (tab-ul **Variables**): `DEPLOY_PROTOCOL` = `sftp` (implicit) sau `ftps`; `DEPLOY_PORT` = `22` / `21`.
