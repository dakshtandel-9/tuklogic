// Contact form phone field: a country picker with flags and dial codes (intl-tel-input,
// self-hosted under /vendor). The form's own phone input stays as the React-controlled
// value and is hidden; this visible input writes the full international number into it
// (for example "+971 50 123 4567"), so validation and submission are unchanged.
import intlTelInput from '/vendor/intl-tel-input-29.5.10/js/intlTelInput.mjs';

const VENDOR = '/vendor/intl-tel-input-29.5.10';

const css = `
.tuk-phone{width:100%}
.form_block:has(.tuk-phone){position:relative;z-index:30}
.tuk-phone .iti{display:block;width:100%;
  --iti-border-color:rgba(225,209,240,.18);--iti-hover-color:rgba(255,255,255,.08);
  --iti-icon-color:#a99dbd;--iti-dropdown-bg:#1c1236;--iti-country-selector-bg:transparent}
.tuk-phone .iti__selected-country{border-radius:4px 0 0 4px}
html[dir=rtl] .tuk-phone .iti__selected-country{border-radius:0 4px 4px 0}
.tuk-phone .iti__selected-country-primary{padding:0 8px 0 16px;background:transparent!important}
.tuk-phone .iti__selected-country:hover .iti__selected-country-primary,.tuk-phone .iti__selected-country[aria-expanded=true] .iti__selected-country-primary{background:rgba(255,255,255,.06)!important}
html[dir=rtl] .tuk-phone .iti__selected-country-primary{padding:0 16px 0 8px}
.tuk-phone .iti__selected-dial-code{color:#fff;font-family:'Open Sans',sans-serif;font-size:14px}
.tuk-phone .iti__arrow{border-top-color:#a99dbd}
.tuk-phone .iti__arrow--up{border-bottom-color:#a99dbd}
html .form_block .tuk-phone input.tuk-phone-input{direction:ltr!important;text-align:left!important;unicode-bidi:normal!important}
.iti__country-selector{background:#1c1236!important;border:1px solid rgba(225,209,240,.22)!important;border-radius:6px;
  box-shadow:0 18px 40px rgba(0,0,0,.45);color:#fff;font-family:'Open Sans',sans-serif;font-size:14px;overflow:hidden}
#contact-form .form_block .iti__search-input,.iti__search-input{height:44px!important;min-height:44px!important;margin:0!important;
  border:0!important;border-bottom:1px solid rgba(225,209,240,.18)!important;border-radius:0!important;
  background:rgba(255,255,255,.04)!important;color:#fff!important;font-size:14px!important;padding-inline:40px 36px!important}
.iti__search-input::placeholder{color:#a99dbd!important}
.iti__search-input:focus{outline:none!important;box-shadow:none!important}
.iti__country-list{background:#1c1236}
.iti__search-icon,.iti__search-clear{color:#a99dbd}
.iti__country-list{max-height:260px;scrollbar-color:rgba(255,255,255,.25) transparent}
.iti__country{padding:10px 14px}
.iti__country.iti__highlight{background:rgba(255,108,163,.16)!important}
.iti__country-name{color:#fff}
.iti__dial-code{color:#a99dbd}
.iti__no-results{color:#a99dbd}
.iti--fullscreen-popup.iti--container{background:rgba(5,3,15,.7)}
`;

function addStyles() {
  if (document.getElementById('tuk-phone-css')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${VENDOR}/css/intlTelInput.min.css`;
  const style = document.createElement('style');
  style.id = 'tuk-phone-css';
  style.textContent = css;
  document.head.append(link, style);
}

// Visitor's country from Vercel's edge (see /api/geo); falls back to the United States.
function lookupCountry() {
  return fetch('/api/geo')
    .then((r) => (r.ok ? r.json() : {}))
    .then((d) => (typeof d.country === 'string' && /^[a-z]{2}$/i.test(d.country) ? d.country.toLowerCase() : 'us'))
    .catch(() => 'us');
}

// React only notices a value change made through the native setter plus an input event.
function setReactValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

export function mount(host, { rtl = false, placeholder = '' } = {}) {
  if (!host || host.dataset.mounted) return;
  const form = host.closest('form');
  const target = form && form.querySelector('input[name="your-phone"]');
  if (!target) return;
  host.dataset.mounted = '1';
  addStyles();

  const input = document.createElement('input');
  input.type = 'tel';
  input.className = 'tuk-phone-input';
  input.autocomplete = 'tel';
  input.setAttribute('aria-label', placeholder || 'Phone number');
  host.appendChild(input);

  const iti = intlTelInput(input, {
    initialCountry: 'auto',
    initialCountryLookup: lookupCountry,
    countryOrder: ['us', 'ae', 'in', 'sa', 'gb'],
    separateDialCode: true,
    strictMode: true,
    countrySearch: true,
    countryNameLocale: rtl ? 'ar' : 'en',
    uiTranslations: rtl ? { searchPlaceholder: 'بحث', noResults: 'لا توجد نتائج' } : {},
    loadUtils: () => import(`${VENDOR}/js/utils.js`),
  });

  const sync = () => {
    const local = input.value.trim();
    let value = '';
    if (local) {
      const dial = iti.getSelectedCountry()?.dialCode;
      let full = '';
      try {
        full = iti.getNumber('INTERNATIONAL');
      } catch {}
      value = full && full.startsWith('+') ? full : dial ? `+${dial} ${local}` : local;
      value = value.replace(/[^+\d\s()-]/g, '').slice(0, 20);
    }
    if (target.value !== value) setReactValue(target, value);
  };
  input.addEventListener('input', sync);
  input.addEventListener('countrychange', sync);
  input.addEventListener('blur', sync);

  // The form clears its fields after a successful send; clear this one with it.
  form.addEventListener('submit', () => {
    let checks = 0;
    const timer = setInterval(() => {
      if (!target.value && input.value) {
        input.value = '';
        clearInterval(timer);
      } else if (++checks > 40) {
        clearInterval(timer);
      }
    }, 250);
  });
}
