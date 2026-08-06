document.addEventListener('DOMContentLoaded', () => {
  const adultToggle = document.querySelector('[data-adult-toggle]');
  const adultHint = document.querySelector('[data-adult-hint]');
  const policyRequired = document.querySelector('[data-policy-required]');
  if (adultToggle && adultHint) {
    const sync = () => {
      const on = adultToggle.checked;
      adultHint.hidden = !on;
      if (policyRequired) {
        policyRequired.required = on;
        if (!on) policyRequired.checked = false;
      }
    };
    adultToggle.addEventListener('change', sync);
    sync();
  }
});
