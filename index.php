<?php
declare(strict_types=1);

header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Cache-Control: no-store, private');
header("Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'");

$configPath = __DIR__ . '/config.local.php';
if (!is_file($configPath)) {
    http_response_code(503);
    exit('Konfiguration fehlt. Bitte config.example.php nach config.local.php kopieren.');
}
$config = require $configPath;
$expectedToken = is_array($config) ? ($config['token'] ?? '') : '';
$givenToken = $_GET['token'] ?? null;
if (!is_string($expectedToken) || strlen($expectedToken) < 24) {
    http_response_code(503);
    exit('Ungueltige Serverkonfiguration.');
}
if (!is_string($givenToken) || !hash_equals($expectedToken, $givenToken)) {
    http_response_code(404);
    exit('Nicht gefunden.');
}

function queryChoice(string $name, array $allowed, string $default): string {
    $value = $_GET[$name] ?? null;
    return is_string($value) && in_array($value, $allowed, true) ? $value : $default;
}
$width = queryChoice('w', array_map('strval', range(320, 4000)), '1200');
$quality = queryChoice('q', ['high', 'medium', 'low'], 'medium');
?>
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <title>Easy Image Shrink</title>
  <link rel="stylesheet" href="assets/style.css">
  <script src="assets/app.js" defer></script>
</head>
<body>
  <main class="app">
    <header>
      <h1>Easy Image Shrink</h1>
      <p>Bilder verkleinern. Sofort herunterladen. Keine Uploads.</p>
    </header>
    <section class="controls" aria-label="Einstellungen">
      <label for="width">Maximale Breite (px)
        <input id="width" type="number" min="320" max="4000" step="1" value="<?= htmlspecialchars($width, ENT_QUOTES, 'UTF-8') ?>">
      </label>
      <label for="quality">Qualität
        <select id="quality">
          <option value="high" <?= $quality === 'high' ? 'selected' : '' ?>>Hoch</option>
          <option value="medium" <?= $quality === 'medium' ? 'selected' : '' ?>>Mittel</option>
          <option value="low" <?= $quality === 'low' ? 'selected' : '' ?>>Niedrig</option>
        </select>
      </label>
    </section>
    <section class="dropzone" id="dropzone" tabindex="0" role="button" aria-label="Bilder auswählen oder hier ablegen">
      <div class="drop-icon" aria-hidden="true">↓</div>
      <h2>Bilder hier reinziehen</h2>
      <p>Oder klicken, um Bilder auszuwählen</p>
      <small>JPG, PNG, WebP, SVG · mehrere Dateien möglich</small>
    </section>
    <input id="files" type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml,.svg" multiple hidden>
    <p class="status" id="status" role="status" aria-live="polite">Bereit.</p>
    <div class="results" id="results" aria-live="polite"></div>
    <footer>Die Bilder bleiben auf deinem Gerät. Es werden keine Bilddaten an den Server gesendet.</footer>
  </main>
</body>
</html>
