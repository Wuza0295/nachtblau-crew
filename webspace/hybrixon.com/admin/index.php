<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/dm.php';
require_once __DIR__ . '/../includes/moderation.php';

$admin = allxion_require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $userId = (int)($_POST['user_id'] ?? 0);
    $action = (string)($_POST['action'] ?? '');
    $note = trim((string)($_POST['note'] ?? ''));
    $reportId = (int)($_POST['report_id'] ?? 0);
    $contentReportId = (int)($_POST['content_report_id'] ?? 0);

    if ($userId > 0 && in_array($action, ['approved', 'rejected'], true)) {
        allxion_admin_set_age_status($userId, $action, $note !== '' ? $note : $action . ' by @' . $admin['username']);
        flash('success', $action === 'approved' ? 'Freigabe erteilt.' : 'Antrag abgelehnt.');
        redirect(allxion_url('admin/'));
    }

    if ($userId > 0 && in_array($action, ['grant_admin', 'revoke_admin'], true)) {
        $errors = allxion_set_user_admin($userId, $action === 'grant_admin', $admin);
        if ($errors) {
            flash('error', $errors[0]);
        } else {
            flash('success', $action === 'grant_admin' ? 'Admin vergeben.' : 'Admin entzogen.');
        }
        redirect(allxion_url('admin/#admins'));
    }

    if ($reportId > 0 && $action === 'close_dm_report') {
        dm_admin_close_report(
            $reportId,
            $note !== '' ? $note : 'closed by @' . $admin['username'],
            (int)$admin['id']
        );
        flash('success', 'DM-Meldung geschlossen.');
        redirect(allxion_url('admin/#dms'));
    }

    if ($contentReportId > 0 && in_array($action, ['content_ok', 'content_remove', 'content_remove_ban'], true)) {
        $repRow = allxion_db()->prepare('SELECT post_id FROM content_reports WHERE id = ?');
        $repRow->execute([$contentReportId]);
        $repData = $repRow->fetch();
        $authorId = 0;
        if ($repData) {
            $authorStmt = allxion_db()->prepare('SELECT user_id FROM posts WHERE id = ?');
            $authorStmt->execute([(int)$repData['post_id']]);
            $authorId = (int)($authorStmt->fetchColumn() ?: 0);
        }

        content_admin_resolve_report(
            $contentReportId,
            $action === 'content_ok' ? 'ok' : 'remove',
            (int)$admin['id'],
            $note !== '' ? $note : $action . ' by @' . $admin['username']
        );

        if ($action === 'content_remove_ban' && $authorId > 0) {
            $banErrors = allxion_ban_user(
                $authorId,
                $admin,
                $note !== '' ? $note : 'Verstoß gegen Inhaltsregeln (18++ / schwer)',
                true
            );
            if ($banErrors) {
                flash('error', 'Beitrag entfernt, Sperre fehlgeschlagen: ' . $banErrors[0]);
            } else {
                flash('success', 'Beitrag entfernt und Nutzer gesperrt.');
            }
        } else {
            flash('success', $action === 'content_ok' ? 'Meldung als ok geschlossen.' : 'Beitrag entfernt.');
        }
        redirect(allxion_url('admin/#content'));
    }

    if ($userId > 0 && $action === 'ban_user') {
        $errors = allxion_ban_user($userId, $admin, $note, !empty($_POST['remove_posts']));
        if ($errors) {
            flash('error', $errors[0]);
        } else {
            flash('success', 'Nutzer gesperrt.');
        }
        redirect(allxion_url('admin/#admins'));
    }

    if ($userId > 0 && $action === 'unban_user') {
        $errors = allxion_unban_user($userId, $admin);
        if ($errors) {
            flash('error', $errors[0]);
        } else {
            flash('success', 'Sperre aufgehoben.');
        }
        redirect(allxion_url('admin/#admins'));
    }

    redirect(allxion_url('admin/'));
}

$pending = allxion_db()->query(
    "SELECT id, username, email, birthdate, age_doc_path, age_requested_at, created_at
     FROM users WHERE age_status = 'pending' ORDER BY age_requested_at ASC"
)->fetchAll();

$recent = allxion_db()->query(
    "SELECT id, username, age_status, age_verified_at, age_reviewed_at, age_review_note
     FROM users WHERE age_status IN ('approved','rejected') ORDER BY COALESCE(age_reviewed_at, age_verified_at) DESC LIMIT 20"
)->fetchAll();

$users = allxion_db()->query(
    "SELECT id, username, email, is_admin, age_status, banned_at, ban_reason, created_at
     FROM users ORDER BY CASE WHEN banned_at IS NOT NULL AND banned_at != '' THEN 1 ELSE 0 END, is_admin DESC, lower(username) ASC"
)->fetchAll();

$dmReports = dm_admin_open_reports();
$contentReports = content_admin_open_reports();

$pageTitle = 'Admin · Hybrixon';
$activeNav = 'admin';
require __DIR__ . '/../includes/header.php';
?>

<section class="panel">
  <h1>Admin</h1>
  <p class="muted">Angemeldet als @<?= e($admin['username']) ?>. Soft-18+ (kein 18++), volle DM-Kontrolle.</p>
  <div class="pill-row">
    <a class="pill" href="#content">Inhalte (<?= count($contentReports) ?>)</a>
    <a class="pill" href="#age">Soft-18+ Anträge</a>
    <a class="pill" href="<?= e(allxion_url('admin/dms.php')) ?>">Alle DMs</a>
    <a class="pill" href="#dms">DM-Meldungen (<?= count($dmReports) ?>)</a>
    <a class="pill" href="#admins">Nutzer / Sperren</a>
    <a class="pill" href="<?= e(allxion_url('rules.php')) ?>">Regeln</a>
  </div>
</section>

<section class="panel" id="content">
  <h2>Inhalt-Meldungen offen (<?= count($contentReports) ?>)</h2>
  <p class="muted" style="margin-bottom:1rem;">
    Soft-18+-Bilder und Text-Treffer werden automatisch gemeldet.
    Bei 18++: Beitrag entfernen — bei schweren Verstößen Nutzer sperren.
    Nach „OK“ können Nutzer den Beitrag erneut melden.
  </p>
  <?php if (!$contentReports): ?>
    <p class="muted">Keine offenen Meldungen.</p>
  <?php else: ?>
    <div class="feed">
      <?php foreach ($contentReports as $rep): ?>
        <article class="post<?= !empty($rep['is_adult']) ? ' post-adult' : '' ?>">
          <div class="post-meta">
            <span>
              #<?= (int)$rep['id'] ?> ·
              <?= ($rep['source'] ?? '') === 'auto' ? 'Auto' : ('User @' . e((string)$rep['reporter_username'])) ?>
              · Post von @<?= e((string)$rep['author_username']) ?>
            </span>
            <span><?= e($rep['created_at'] ?? '') ?></span>
          </div>
          <p><strong>Grund:</strong> <?= nl2br(e($rep['reason'])) ?></p>
          <?php if (trim((string)($rep['post_body'] ?? '')) !== ''): ?>
            <div class="post-body" style="margin-top:0.5rem;"><?= nl2br(e($rep['post_body'])) ?></div>
          <?php endif; ?>
          <?php if (!empty($rep['image_path'])): ?>
            <figure class="post-image">
              <img src="<?= e(allxion_url('media.php?id=' . (int)$rep['post_id'])) ?>" alt="Gemeldetes Bild" loading="lazy">
            </figure>
          <?php endif; ?>
          <form method="post" class="form" style="margin-top:0.85rem;">
            <?= csrf_field() ?>
            <input type="hidden" name="content_report_id" value="<?= (int)$rep['id'] ?>">
            <label>Notiz (optional)
              <input type="text" name="note" maxlength="500">
            </label>
            <div class="hero-actions">
              <button class="btn btn-sm" type="submit" name="action" value="content_ok">OK / behalten</button>
              <button class="btn btn-sm btn-danger" type="submit" name="action" value="content_remove">Beitrag entfernen</button>
              <?php if (empty($rep['author_banned_at'])): ?>
                <button class="btn btn-sm btn-danger" type="submit" name="action" value="content_remove_ban">Entfernen + User sperren</button>
              <?php else: ?>
                <span class="muted">Autor bereits gesperrt</span>
              <?php endif; ?>
            </div>
          </form>
        </article>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</section>

<section class="panel" id="age">
  <h2>Soft-18+ offen (<?= count($pending) ?>)</h2>
  <?php if (!$pending): ?>
    <p class="muted">Keine offenen Anträge.</p>
  <?php else: ?>
    <div class="feed">
      <?php foreach ($pending as $row): ?>
        <article class="post">
          <div class="post-meta">
            <span class="post-user">@<?= e($row['username']) ?></span>
            <span>Antrag: <?= e($row['age_requested_at'] ?? '') ?></span>
          </div>
          <p class="muted">Geburtsdatum (Konto): <strong><?= e($row['birthdate']) ?></strong> · Alter <?= (int)(age_from_birthdate($row['birthdate']) ?? 0) ?></p>
          <p class="muted">Soft-18+ Selbstauskunft + Passwort — ohne Ausweis. Freigabe nur für Soft-18+, nicht für 18++/Porno.</p>
          <form method="post" class="form" style="margin-top:0.75rem;">
            <?= csrf_field() ?>
            <input type="hidden" name="user_id" value="<?= (int)$row['id'] ?>">
            <label>Notiz (optional)
              <input type="text" name="note" maxlength="500">
            </label>
            <div class="hero-actions">
              <button class="btn btn-sm" type="submit" name="action" value="approved">Freigeben</button>
              <button class="btn btn-sm btn-danger" type="submit" name="action" value="rejected">Ablehnen</button>
            </div>
          </form>
        </article>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</section>

<section class="panel">
  <h2>Zuletzt bearbeitet</h2>
  <?php if (!$recent): ?>
    <p class="muted">Noch keine Entscheidungen.</p>
  <?php else: ?>
    <ul class="muted" style="list-style:none;display:grid;gap:0.5rem;">
      <?php foreach ($recent as $row): ?>
        <li>
          @<?= e($row['username']) ?> —
          <strong><?= e($row['age_status']) ?></strong>
          <?= e($row['age_reviewed_at'] ?? $row['age_verified_at'] ?? '') ?>
          <?php if (!empty($row['age_review_note'])): ?>
            · <?= e($row['age_review_note']) ?>
          <?php endif; ?>
        </li>
      <?php endforeach; ?>
    </ul>
  <?php endif; ?>
</section>

<section class="panel" id="dms">
  <h2>DM-Meldungen offen (<?= count($dmReports) ?>)</h2>
  <div class="flash flash-info" style="margin-bottom:1rem;">
    <strong>Volle Kontrolle:</strong> Admins können alle DMs unter
    <a href="<?= e(allxion_url('admin/dms.php')) ?>">Alle DMs</a> einsehen (protokolliert).
    Meldungen helfen bei der Priorisierung.
  </div>
  <?php if (!$dmReports): ?>
    <p class="muted">Keine offenen Meldungen.</p>
  <?php else: ?>
    <div class="feed">
      <?php foreach ($dmReports as $rep): ?>
        <?php
          $threadMsgs = dm_admin_thread_messages(
              (int)$rep['thread_id'],
              (int)$admin['id'],
              (int)$rep['id']
          ) ?? [];
        ?>
        <article class="post">
          <div class="post-meta">
            <span>Meldung #<?= (int)$rep['id'] ?> von @<?= e($rep['reporter_username']) ?></span>
            <span><?= e($rep['created_at'] ?? '') ?></span>
          </div>
          <p class="muted">
            Thread #<?= (int)$rep['thread_id'] ?>:
            @<?= e($rep['user_a_name']) ?> ↔ @<?= e($rep['user_b_name']) ?>
          </p>
          <p><strong>Grund:</strong> <?= nl2br(e($rep['reason'])) ?></p>
          <div class="dm-thread" style="margin-top:0.85rem;max-height:280px;overflow:auto;">
            <?php if (!$threadMsgs): ?>
              <p class="muted">Keine Nachrichten (bereits gelöscht/abgelaufen) oder Zugriff nicht erlaubt.</p>
            <?php else: ?>
              <?php foreach ($threadMsgs as $m): ?>
                <article class="dm-bubble">
                  <div class="dm-meta">
                    <strong>@<?= e($m['username']) ?></strong>
                    <span><?= e($m['created_at']) ?></span>
                  </div>
                  <div class="dm-body"><?= nl2br(e($m['body'])) ?></div>
                </article>
              <?php endforeach; ?>
            <?php endif; ?>
          </div>
          <form method="post" class="form" style="margin-top:0.85rem;">
            <?= csrf_field() ?>
            <input type="hidden" name="report_id" value="<?= (int)$rep['id'] ?>">
            <label>Notiz (optional)
              <input type="text" name="note" maxlength="500">
            </label>
            <button class="btn btn-sm" type="submit" name="action" value="close_dm_report">Meldung schließen</button>
          </form>
        </article>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</section>

<section class="panel" id="admins">
  <h2>Nutzer &amp; Admins</h2>
  <p class="muted" style="margin-bottom:1rem;">
    Admin-Rechte setzen/entziehen und Nutzer sperren (Login blockiert, Beiträge ausgeblendet).
  </p>
  <div class="feed">
    <?php foreach ($users as $row): ?>
      <?php
        $isAdminRow = !empty($row['is_admin']);
        $isSelf = (int)$row['id'] === (int)$admin['id'];
        $isBanned = !empty($row['banned_at']);
      ?>
      <article class="post<?= $isAdminRow ? ' post-adult' : '' ?>">
        <div class="post-meta">
          <div>
            <span class="post-user">@<?= e($row['username']) ?></span>
            <?php if ($isSelf): ?><span class="muted"> (du)</span><?php endif; ?>
          </div>
          <?php if ($isBanned): ?>
            <span class="badge-18" style="border-color:rgba(232,93,93,.45);color:#fca5a5;background:rgba(232,93,93,.12);">GESPERRT</span>
          <?php elseif ($isAdminRow): ?>
            <span class="badge-18" style="border-color:rgba(61,214,140,.4);color:var(--ok);background:rgba(61,214,140,.12);">ADMIN</span>
          <?php else: ?>
            <span class="muted">Mitglied</span>
          <?php endif; ?>
        </div>
        <p class="muted"><?= e($row['email']) ?> · seit <?= e($row['created_at'] ?? '') ?></p>
        <?php if ($isBanned && !empty($row['ban_reason'])): ?>
          <p class="muted">Grund: <?= e($row['ban_reason']) ?></p>
        <?php endif; ?>
        <form method="post" class="form" style="margin-top:0.75rem;">
          <?= csrf_field() ?>
          <input type="hidden" name="user_id" value="<?= (int)$row['id'] ?>">
          <div class="hero-actions">
            <?php if ($isAdminRow): ?>
              <button
                class="btn btn-sm btn-ghost"
                type="submit"
                name="action"
                value="revoke_admin"
                <?= $isSelf ? 'disabled title="Nicht bei dir selbst möglich"' : '' ?>
              >Admin entziehen</button>
            <?php else: ?>
              <button class="btn btn-sm" type="submit" name="action" value="grant_admin" <?= $isBanned ? 'disabled' : '' ?>>Zum Admin machen</button>
            <?php endif; ?>
            <?php if (!$isAdminRow && !$isSelf): ?>
              <?php if ($isBanned): ?>
                <button class="btn btn-sm" type="submit" name="action" value="unban_user">Sperre aufheben</button>
              <?php else: ?>
                <label class="check" style="margin:0;">
                  <input type="checkbox" name="remove_posts" value="1">
                  <span>Beiträge mit löschen</span>
                </label>
                <input type="text" name="note" maxlength="500" placeholder="Sperrgrund (optional)" style="max-width:14rem;">
                <button class="btn btn-sm btn-danger" type="submit" name="action" value="ban_user">Sperren</button>
              <?php endif; ?>
            <?php endif; ?>
          </div>
        </form>
      </article>
    <?php endforeach; ?>
  </div>
</section>

<?php require __DIR__ . '/../includes/footer.php'; ?>
