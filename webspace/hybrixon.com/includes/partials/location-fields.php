<?php
declare(strict_types=1);

/** @var string $plzValue */
/** @var string $cityValue */

$plzValue = (string)($plzValue ?? '');
$cityValue = (string)($cityValue ?? '');
require_once __DIR__ . '/../geo.php';
$cityOptions = $plzValue !== '' ? geo_cities_for_plz($plzValue) : [];
if ($cityValue !== '') {
    $found = false;
    foreach ($cityOptions as $opt) {
        if (mb_strtolower($opt) === mb_strtolower($cityValue)) {
            $found = true;
            break;
        }
    }
    if (!$found) {
        array_unshift($cityOptions, $cityValue);
    }
}
?>
<div class="location-fields" data-location-fields>
  <input type="hidden" name="postal_code" data-plz-hidden value="<?= e($plzValue) ?>">
  <label>Postleitzahl <span class="muted">(optional)</span>
    <input
      type="text"
      id="field-plz"
      inputmode="numeric"
      pattern="\d{5}"
      maxlength="5"
      placeholder="12345"
      autocomplete="postal-code"
      data-plz-input
      data-plz-api="<?= e(allxion_url('api-plz.php')) ?>"
      data-city-api="<?= e(allxion_url('api-city.php')) ?>"
      value="<?= e($plzValue) ?>"
    >
    <span class="hint">Optional: PLZ tippen, um die Ortsliste einzugrenzen. Danach kannst du die PLZ wieder löschen — der Ort bleibt.</span>
  </label>
  <label>Ort suchen <span class="muted">(ohne PLZ)</span>
    <input
      type="search"
      id="field-city-filter"
      maxlength="60"
      placeholder="z. B. Berlin oder Fürstenwalde"
      autocomplete="off"
      data-city-filter
    >
    <span class="hint">Ohne PLZ mindestens 2 Buchstaben tippen — Treffer landen im Dropdown.</span>
  </label>
  <label>Ort / Stadt (Pflichtfeld)
    <select name="city" id="field-city" data-city-select required>
      <option value=""><?= $cityOptions ? 'Bitte Ort wählen…' : 'Ort suchen oder PLZ eingeben…' ?></option>
      <?php foreach ($cityOptions as $opt): ?>
        <option value="<?= e($opt) ?>" <?= mb_strtolower($opt) === mb_strtolower($cityValue) ? 'selected' : '' ?>><?= e($opt) ?></option>
      <?php endforeach; ?>
    </select>
  </label>
  <p class="hint" style="margin-top:-0.35rem;">
    Der Ort ist Pflicht. Die PLZ ist optional und dient der genaueren Auswahl.
    Falschangaben können geprüft werden und zu Einschränkungen oder Sperrung führen.
  </p>
</div>
