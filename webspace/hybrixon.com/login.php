<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';

if (allxion_current_user()) {
    redirect(allxion_url());
}

$error = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $login = trim((string)($_POST['login'] ?? ''));
    $password = (string)($_POST['password'] ?? '');
    if ($login === '' || $password === '') {
        $error = 'Bitte Login und Passwort ausfüllen.';
    } else {
        $loginResult = allxion_login($login, $password);
        if ($loginResult === true) {
            flash('success', 'Willkommen zurück.');
            $next = (string)($_GET['next'] ?? '');
            $base = allxion_base_path();
            $allowedPrefix = $base === '' ? '/' : $base;
            if ($next === '' || !str_starts_with($next, $allowedPrefix)) {
                $next = allxion_url();
            }
            redirect($next);
        }
        $error = is_string($loginResult) ? $loginResult : 'Login fehlgeschlagen.';
    }
}

$pageTitle = 'Anmelden · Hybrixon';
$activeNav = 'login';
require __DIR__ . '/includes/header.php';
?>

<section class="panel">
  <h1>Anmelden</h1>
  <p class="muted" style="margin-bottom:1rem;">Nur registrierte Mitglieder können Beiträge schreiben.</p>
  <?php if ($error): ?><div class="flash flash-error" style="margin-bottom:1rem;"><?= e($error) ?></div><?php endif; ?>
  <form method="post" class="form">
    <?= csrf_field() ?>
    <label>Benutzername oder E-Mail
      <input type="text" name="login" required autocomplete="username" value="<?= e($_POST['login'] ?? '') ?>">
    </label>
    <label>Passwort
      <input type="password" name="password" required autocomplete="current-password">
    </label>
    <button class="btn btn-block" type="submit">Anmelden</button>
  </form>
  <p class="muted center" style="margin-top:1rem;">Noch kein Konto? <a href="<?= e(allxion_url('register.php')) ?>">Registrieren</a></p>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
