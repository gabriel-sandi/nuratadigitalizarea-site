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
