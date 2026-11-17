<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/discover.php';
require_once __DIR__ . '/includes/posts.php';

$viewer = allxion_current_user();
$canSeeAdult = $viewer && user_age_verified($viewer);
$pageTitle = 'Entdecken · Hybrixon';
$activeNav = 'explore';

$trending = [];
try {
    $stmt = allxion_db()->query(
        <<<'SQL'
SELECT h.tag, COUNT(ph.post_id) AS uses
FROM hashtags h
JOIN post_hashtags ph ON ph.hashtag_id = h.id
JOIN posts p ON p.id = ph.post_id
WHERE p.moderation_status != 'removed'
GROUP BY h.id
ORDER BY uses DESC, h.tag ASC
LIMIT 24
SQL
    );
    $trending = $stmt ? $stmt->fetchAll() : [];
} catch (Throwable) {
    $trending = [];
}

require __DIR__ . '/includes/header.php';
?>
<section class="panel">
  <h1>Entdecken</h1>
  <p class="muted">Trends, Vorschläge und Beiträge in deiner Nähe.</p>
</section>

<section class="panel">
  <h2>Trending Hashtags</h2>
  <?php if (!$trending): ?>
    <p class="muted">Noch keine Trends.</p>
  <?php else: ?>
    <div class="tag-cloud" style="display:flex;flex-wrap:wrap;gap:0.55rem;">
      <?php foreach ($trending as $row): ?>
        <a class="btn btn-ghost" href="<?= e(allxion_url('tag.php?t=' . rawurlencode((string)$row['tag']))) ?>">
          #<?= e((string)$row['tag']) ?>
          <span class="muted" style="margin-left:0.35rem;"><?= (int)$row['uses'] ?></span>
        </a>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</section>

<section class="panel">
  <?php if (!$viewer): ?>
    <p class="muted"><a href="<?= e(allxion_url('login.php')) ?>">Anmelden</a> für personalisierte Vorschläge.</p>
  <?php else: ?>
    <p class="muted">Mehr in der <a href="<?= e(allxion_url('search.php')) ?>">Suche</a> und bei <a href="<?= e(allxion_url('groups.php')) ?>">Gruppen</a>.</p>
  <?php endif; ?>
</section>
<?php require __DIR__ . '/includes/footer.php'; ?>
