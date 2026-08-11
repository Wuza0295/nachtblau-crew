<?php
declare(strict_types=1);
/** @var array $post */
/** @var list<array> $media */
/** @var array|null $user */
/** @var bool $showComments */
$user = $user ?? allxion_current_user();
$media = $media ?? allxion_post_media((int)$post['id']);
$showComments = $showComments ?? false;
$share = hybrixon_public_url('post.php?id=' . (int)$post['id']);
$isOwner = $user && ((int)$user['id'] === (int)$post['user_id'] || user_is_admin($user));
$isSaved = false;
if ($user) {
    require_once __DIR__ . '/../saved.php';
    $isSaved = saved_is_saved((int)$user['id'], (int)$post['id']);
}
require_once __DIR__ . '/../discover.php';
require_once __DIR__ . '/../comments.php';
$commentCount = isset($post['comment_count']) ? (int)$post['comment_count'] : comments_count((int)$post['id']);
?>
<article class="post<?= !empty($post['is_adult']) ? ' post-adult' : '' ?><?= ($post['post_type'] ?? '') === 'short' ? ' post-short' : '' ?>">
  <div class="post-meta">
    <div>
      <a class="post-user" href="<?= e(user_public_url((string)$post['username'])) ?>">
        @<?= e($post['username']) ?>
      </a>
      <span> · <?= e(time_ago($post['created_at'])) ?></span>
      <?php if (!empty($post['updated_at'])): ?>
        <span class="muted"> · <?= e(t('post.edited')) ?></span>
      <?php endif; ?>
      <?php if (($post['post_type'] ?? '') === 'short'): ?>
        <span class="badge-18" style="border-color:rgba(45,212,191,.4);color:var(--accent);"><?= e(t('post.short')) ?></span>
      <?php endif; ?>
      <?php if (!empty($post['is_adult'])): ?>
        <span class="badge-18" title="<?= e(t('post.soft18')) ?>"><?= e(t('post.soft18')) ?></span>
      <?php endif; ?>
      <?php if (($post['moderation_status'] ?? '') === 'pending'): ?>
        <span class="pill" title="<?= e(t('post.review')) ?>"><?= e(t('post.review')) ?></span>
      <?php endif; ?>
    </div>
  </div>
  <?php if (trim((string)$post['body']) !== ''): ?>
    <?php // Post text stays in its original language; translation is opt-in only. ?>
    <div class="post-body" data-post-body lang="und"><?= discover_format_body((string)$post['body']) ?></div>
    <button class="btn btn-sm btn-ghost post-translate-btn" type="button" data-translate-post
      data-original="<?= e((string)$post['body']) ?>"
      title="<?= e(t('post.translate_hint')) ?>"><?= e(t('post.translate')) ?></button>
  <?php endif; ?>
  <?php if ($media): ?>
    <div class="media-grid<?= count($media) > 1 ? ' media-grid-multi' : '' ?>">
    <?php foreach ($media as $m): ?>
      <?php if (($m['kind'] ?? '') === 'video'): ?>
        <?php $videoUrl = allxion_url(
            (!empty($m['id']) ? 'media.php?m=' . (int)$m['id'] : 'media.php?id=' . (int)$post['id'] . '&kind=video')
            . '&stream=' . MEDIA_STREAM_VERSION
        ); ?>
        <?php $posterUrl = !empty($m['id']) && !empty($m['poster_path'])
            ? allxion_url('media.php?poster=' . (int)$m['id'])
            : null; ?>
        <figure class="post-video">
          <video controls playsinline preload="none"
            data-video-preview
            <?= $posterUrl !== null ? 'data-video-poster="' . e($posterUrl) . '"' : '' ?>
            data-video-src="<?= e($videoUrl) ?>">
          </video>
          <noscript><a class="btn btn-sm" href="<?= e($videoUrl) ?>">Video öffnen</a></noscript>
        </figure>
      <?php else: ?>
        <figure class="post-image">
          <img src="<?= e(allxion_url(!empty($m['id']) ? 'media.php?m=' . (int)$m['id'] : 'media.php?id=' . (int)$post['id'])) ?>" alt="" loading="lazy">
        </figure>
      <?php endif; ?>
    <?php endforeach; ?>
    </div>
  <?php endif; ?>
  <div class="post-actions">
    <?php if ($user): ?>
      <a class="btn btn-sm btn-ghost" href="<?= e(allxion_url('?like=' . (int)$post['id'] . (isset($_GET['scope']) ? '&scope=' . rawurlencode((string)$_GET['scope']) : ''))) ?>">♥ <?= (int)$post['like_count'] ?></a>
      <a class="btn btn-sm btn-ghost" href="<?= e(allxion_url('post.php?id=' . (int)$post['id'] . '#comments')) ?>">💬 <?= (int)$commentCount ?></a>
      <form method="post" action="<?= e(allxion_url('post.php?id=' . (int)$post['id'])) ?>" style="display:inline;">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="toggle_save">
        <button class="btn btn-sm btn-ghost" type="submit"><?= $isSaved ? '★ ' . e(t('post.saved')) : '☆ ' . e(t('post.save')) ?></button>
      </form>
      <button class="btn btn-sm btn-ghost" type="button" data-copy="<?= e($share) ?>"><?= e(t('post.share')) ?></button>
      <?php if ($isOwner): ?>
        <a class="btn btn-sm btn-ghost" href="<?= e(allxion_url('edit-post.php?id=' . (int)$post['id'])) ?>"><?= e(t('common.edit')) ?></a>
        <form method="post" action="<?= e(allxion_url('post.php?id=' . (int)$post['id'])) ?>" style="display:inline;" onsubmit="return confirm(<?= json_encode(t('post.confirm_delete'), JSON_UNESCAPED_UNICODE) ?>);">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="delete_post">
          <button class="btn btn-sm btn-ghost" type="submit"><?= e(t('common.delete')) ?></button>
        </form>
      <?php endif; ?>
      <details class="report-details">
        <summary class="btn btn-sm btn-ghost"><?= e(t('common.report')) ?></summary>
        <form method="post" class="form" style="margin-top:0.65rem;" action="<?= e(allxion_url()) ?>">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="report_post">
          <input type="hidden" name="post_id" value="<?= (int)$post['id'] ?>">
          <label><?= e(t('post.report_reason')) ?>
            <textarea name="reason" required maxlength="500" rows="2" placeholder="<?= e(t('post.report_placeholder')) ?>"></textarea>
          </label>
          <button class="btn btn-sm btn-danger" type="submit"><?= e(t('common.report')) ?></button>
        </form>
      </details>
    <?php else: ?>
      <span class="muted">♥ <?= (int)$post['like_count'] ?> · 💬 <?= (int)$commentCount ?></span>
      <button class="btn btn-sm btn-ghost" type="button" data-copy="<?= e($share) ?>"><?= e(t('post.share')) ?></button>
    <?php endif; ?>
  </div>

  <?php if ($showComments): ?>
    <?php $comments = comments_for_post((int)$post['id'], $user); ?>
    <div id="comments" class="comments-block" style="margin-top:1rem;padding-top:0.85rem;border-top:1px solid var(--line);">
      <h3 style="font-size:1rem;margin-bottom:0.65rem;"><?= e(t('common.comments')) ?></h3>
      <?php if ($user): ?>
        <form method="post" class="form" style="margin-bottom:1rem;">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="add_comment">
          <label><?= e(t('common.comment')) ?>
            <textarea name="body" required maxlength="2000" rows="2" data-mention placeholder="#tag @user"></textarea>
          </label>
          <button class="btn btn-sm" type="submit"><?= e(t('common.comment')) ?></button>
        </form>
      <?php endif; ?>
      <?php if (!$comments): ?>
        <p class="muted"><?= e(t('comments.empty')) ?></p>
      <?php else: ?>
        <?php foreach ($comments as $c): ?>
          <div class="dm-bubble" style="max-width:100%;margin-bottom:0.5rem;">
            <div class="dm-meta">
              <a href="<?= e(user_public_url($c['username'])) ?>">@<?= e($c['username']) ?></a>
              <span><?= e(time_ago($c['created_at'])) ?></span>
            </div>
            <div class="dm-body"><?= discover_format_body((string)$c['body']) ?></div>
            <?php if ($user && ((int)$user['id'] === (int)$c['user_id'] || user_is_admin($user))): ?>
              <form method="post" style="margin-top:0.35rem;">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="delete_comment">
                <input type="hidden" name="comment_id" value="<?= (int)$c['id'] ?>">
                <button class="btn btn-sm btn-ghost" type="submit">Löschen</button>
              </form>
            <?php endif; ?>
          </div>
        <?php endforeach; ?>
      <?php endif; ?>
    </div>
  <?php endif; ?>
</article>
