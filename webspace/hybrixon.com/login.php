<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/i18n.php';

if (allxion_current_user()) {
    redirect(allxion_url());
}

$error = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $login = trim((string)($_POST['login'] ?? ''));
    $password = (string)($_POST['password'] ?? '');
    if ($login === '' || $password === '') {
        $error = t('login.error_empty');
    } else {
        $loginResult = allxion_login($login, $password, !empty($_POST['remember']));
        if ($loginResult === true) {
            flash('success', t('login.welcome'));
            $next = (string)($_GET['next'] ?? '');
            $base = allxion_base_path();
            $allowedPrefix = $base === '' ? '/' : $base;
            if ($next === '' || !str_starts_with($next, $allowedPrefix)) {
                $next = allxion_url();
            }
            redirect($next);
        }
        $error = is_string($loginResult) ? $loginResult : t('login.error_failed');
    }
}

$pageTitle = t('nav.login') . ' · Hybrixon';
$activeNav = 'login';
require __DIR__ . '/includes/header.php';
?>

<section class="panel">
  <h1><?= e(t('nav.login')) ?></h1>
  <p class="muted" style="margin-bottom:1rem;"><?= e(t('login.lead')) ?></p>
  <?php if ($error): ?><div class="flash flash-error" style="margin-bottom:1rem;"><?= e($error) ?></div><?php endif; ?>
  <form method="post" class="form">
    <?= csrf_field() ?>
    <label><?= e(t('login.user')) ?>
      <input type="text" name="login" required autocomplete="username" value="<?= e($_POST['login'] ?? '') ?>">
    </label>
    <label><?= e(t('login.password')) ?>
      <input type="password" name="password" required autocomplete="current-password">
    </label>
    <label class="check">
      <input type="checkbox" name="remember" value="1" <?= !empty($_POST['remember']) ? 'checked' : '' ?>>
      <?= e(t('login.remember', ['n' => (string)(int)REMEMBER_ME_DAYS])) ?>
    </label>
    <button class="btn btn-block" type="submit"><?= e(t('nav.login')) ?></button>
  </form>
  <p class="muted center" style="margin-top:1rem;"><?= e(t('login.no_account')) ?> <a href="<?= e(allxion_url('register.php')) ?>"><?= e(t('nav.register')) ?></a></p>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
