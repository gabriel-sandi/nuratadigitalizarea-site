// Nu Rata Digitalizarea — scripturi comune
(function () {
  // Meniu mobil
  var btn = document.querySelector('.menu-btn');
  var links = document.getElementById('nav-links');
  if (btn && links) {
    btn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Anul curent în footer
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

// Trimitere formular către scriptul de pe server (trimite.php), care trimite e-mailul prin Proton
window.NRD = window.NRD || {};
window.NRD.submitForm = function (form, statusEl, okMsg) {
  var data = new FormData(form);
  var body = new URLSearchParams();
  data.forEach(function (v, k) { body.append(k, v); });
  var submitBtn = form.querySelector('[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset.label = submitBtn.textContent; submitBtn.textContent = 'Se trimite…'; }
  statusEl.className = 'form-status';
  return fetch('trimite.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  }).then(function (r) {
    return r.json().catch(function () { return {}; }).then(function (j) {
      if (!r.ok || !j.ok) throw new Error('HTTP ' + r.status);
    });
  }).then(function () {
    statusEl.textContent = okMsg;
    statusEl.className = 'form-status ok';
    form.reset();
  }).catch(function () {
    statusEl.innerHTML = 'Mesajul nu a putut fi trimis acum. Vă rugăm să ne scrieți direct la <a href="mailto:contact@nuratadigitalizarea.ro">contact@nuratadigitalizarea.ro</a>.';
    statusEl.className = 'form-status err';
  }).finally(function () {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset.label; }
    statusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
};

// Formular simplu (contact)
document.querySelectorAll('form[data-simple-form]').forEach(function (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var status = form.querySelector('.form-status');
    var bad = null;
    form.querySelectorAll('[required]').forEach(function (el) {
      var ok = el.type === 'checkbox' ? el.checked : el.value.trim() !== '' && el.checkValidity();
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok && !bad) bad = el;
    });
    if (bad) {
      status.textContent = 'Vă rugăm să completați câmpurile marcate cu * (inclusiv confirmarea că ați citit Politica de confidențialitate).';
      status.className = 'form-status err';
      bad.focus();
      return;
    }
    window.NRD.submitForm(form, status, form.dataset.ok || 'Mulțumim! Am primit mesajul și revenim în cel mult o zi lucrătoare.');
  });
});

// Mod de noapte: comutator manual (ținut minte în browser), altfel urmează setarea sistemului
(function () {
  var b = document.querySelector('.theme-btn');
  if (!b) return;
  var root = document.documentElement;
  function current() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function sync() { b.setAttribute('aria-pressed', current() === 'dark' ? 'true' : 'false'); }
  sync();
  b.addEventListener('click', function () {
    var next = current() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('nrd-theme', next); } catch (e) {}
    sync();
  });
})();

// File (tab-uri) pentru module: fără JavaScript se văd toate secțiunile
(function () {
  var nav = document.querySelector('[data-tabs]');
  if (!nav) return;
  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var panels = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  nav.setAttribute('role', 'tablist');
  function show(i, focus) {
    links.forEach(function (a, j) {
      a.setAttribute('aria-selected', i === j ? 'true' : 'false');
      a.classList.toggle('active', i === j);
      if (panels[j]) panels[j].hidden = i !== j;
    });
    if (focus && panels[i]) nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  links.forEach(function (a, i) {
    a.setAttribute('role', 'tab');
    a.addEventListener('click', function (e) { e.preventDefault(); show(i, true); history.replaceState(null, '', a.getAttribute('href')); });
  });
  var start = links.findIndex(function (a) { return a.getAttribute('href') === location.hash; });
  show(start < 0 ? 0 : start, false);
})();

// Culoarea barei browserului pe telefon urmează tema aleasă manual
(function () {
  function apply() {
    var t = document.documentElement.getAttribute('data-theme');
    if (!t) return;
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) { m.setAttribute('content', t === 'dark' ? '#0e161f' : '#f7f4ee'); });
  }
  apply();
  var b = document.querySelector('.theme-btn');
  if (b) b.addEventListener('click', function () { setTimeout(apply, 0); });
})();
