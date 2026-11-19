// Chestionarul de maturitate IA — calcul scor și recomandări (rulează în browser)
(function () {
  var form = document.getElementById('assessment');
  if (!form) return;

  var questions = Array.prototype.slice.call(form.querySelectorAll('fieldset.q[data-dim]'));
  var total = questions.length;
  var bar = document.querySelector('.progress-bar span');
  var ptxt = document.querySelector('.progress-text');

  function answered() {
    return questions.filter(function (q) { return q.querySelector('input:checked'); }).length;
  }
  function updateProgress() {
    var n = answered();
    bar.style.width = Math.round((n / total) * 100) + '%';
    ptxt.textContent = n + ' din ' + total + ' întrebări completate';
  }
  form.addEventListener('change', updateProgress);
  updateProgress();

  var LEVELS = [
    { max: 25, name: 'Explorare', text: 'Organizația este la început de drum. Există interes, dar lipsesc încă o direcție clară, instrumentele potrivite și regulile de utilizare. Vestea bună: primele câștiguri pot apărea repede, cu investiții mici.' },
    { max: 50, name: 'Experimentare', text: 'Unii colegi folosesc deja IA, dar mai ales individual și neorganizat. Următorul pas este să alegeți 2–3 procese cu impact real și să le testați controlat, cu reguli clare.' },
    { max: 75, name: 'Implementare', text: 'Aveți baze solide: procese digitalizate, instrumente și oameni deschiși. Acum contează prioritizarea pe impact, pilotele măsurate și transformarea lor în soluții standard.' },
    { max: 100, name: 'Extindere', text: 'Sunteți printre organizațiile avansate. Valoarea vine acum din extinderea a ceea ce funcționează, automatizări mai profunde, asistenți pe date interne și guvernanță matură.' }
  ];

  var DIM_TIPS = {
    strategie: 'Stabiliți 2–3 obiective de business pentru IA (timp economisit, costuri, calitate) și un responsabil intern.',
    procese: 'Documentați procesele repetitive principale. Un proces clar se automatizează mult mai ușor.',
    date: 'Centralizați documentele și datele importante într-un loc structurat (ex. SharePoint, Google Drive organizat, un sistem de management al documentelor).',
    instrumente: 'Alegeți instrumente aprobate de firmă (ex. Microsoft Copilot, ChatGPT Team/Enterprise) în locul conturilor personale.',
    oameni: 'Un training practic de 2–3 ore pe sarcinile reale ale echipei aduce cel mai rapid adopție.',
    clienti: 'Adunați mesajele, recenziile și rețelele sociale într-un singur loc. Un agent IA pe WhatsApp și răspunsul automat la recenzii sunt, de obicei, cele mai rapide câștiguri.',
    guvernanta: 'Introduceți o politică simplă de utilizare a IA: ce date pot fi folosite, ce instrumente, cine aprobă. Țineți cont de GDPR și de AI Act.'
  };

  var AREA_WINS = {
    sedinte: 'Ședințe: rezumat automat, decizii, acțiuni și responsabili după fiecare întâlnire.',
    documente: 'Documente și contracte: extragerea automată a obligațiilor, termenelor și riscurilor.',
    email: 'E-mail: prioritizarea mesajelor și ciorne de răspuns pregătite automat.',
    raportare: 'Raportare: comentarii de management și analize generate din datele existente.',
    cunostinte: 'Cunoștințe interne: un asistent IA care răspunde din documentele firmei.',
    procese: 'Procese manuale: fluxuri automatizate între aplicațiile pe care le folosiți deja.',
    clienti: 'Relația cu clienții: răspunsuri rapide, oferte și follow-up asistate de IA.',
    hr: 'HR: anunțuri de angajare, onboarding și răspunsuri la întrebările angajaților.',
    mesaje: 'Mesaje de la clienți: un agent IA pe WhatsApp care răspunde non-stop, din informațiile firmei.',
    recenzii: 'Recenzii: răspuns personalizat și automat la recenziile Google, în limba clientului.',
    promovare: 'Promovare: o promoție pornită o singură dată pe toate canalele, cu postări generate automat.',
    restaurant: 'Restaurant: o singură aplicație pentru sală, bucătărie, stoc, HACCP, echipă și marketing.',
    google: 'Google: Search Console, date structurate și profil de business complet, ca firma să fie găsită ușor.'
  };

  var AREA_LINKS = {
    sedinte: 'ia-pentru-firme.html#productivitate', documente: 'ia-pentru-firme.html#documente', email: 'ia-pentru-firme.html#automatizare',
    raportare: 'ia-pentru-firme.html#raportare', cunostinte: 'ia-pentru-firme.html#asistenti', procese: 'ia-pentru-firme.html#automatizare',
    clienti: 'agent-ia-whatsapp.html', hr: 'ia-pentru-firme.html#asistenti', mesaje: 'agent-ia-whatsapp.html', recenzii: 'recenzii-google.html',
    promovare: 'campanii-promovare.html', google: 'vizibilitate-google.html', restaurant: 'aplicatie-restaurant.html'
  };
  var DIM_LINKS = { clienti: 'retele-sociale.html', guvernanta: 'ia-pentru-firme.html#guvernanta', oameni: 'training.html', procese: 'ia-pentru-firme.html#automatizare' };

  function addLink(li, href) {
    if (!href) return;
    li.appendChild(document.createTextNode(' '));
    var a = document.createElement('a');
    a.href = href; a.className = 'link-arrow'; a.textContent = 'Detalii';
    li.appendChild(a);
  }

  function compute() {
    var dims = {}, sum = 0;
    questions.forEach(function (q) {
      var d = q.dataset.dim;
      var v = q.querySelector('input:checked');
      var val = v ? parseInt(v.value, 10) : 0;
      dims[d] = dims[d] || { label: q.dataset.dimLabel, sum: 0, n: 0 };
      dims[d].sum += val; dims[d].n += 1; sum += val;
    });
    var pct = Math.round((sum / (total * 3)) * 100);
    Object.keys(dims).forEach(function (k) { dims[k].pct = Math.round((dims[k].sum / (dims[k].n * 3)) * 100); });
    return { pct: pct, dims: dims };
  }

  var showBtn = document.getElementById('show-result');
  var result = document.getElementById('result');

  showBtn.addEventListener('click', function () {
    var missing = questions.filter(function (q) { return !q.querySelector('input:checked'); });
    var msg = document.getElementById('q-missing');
    if (missing.length) {
      msg.textContent = 'Mai aveți ' + missing.length + (missing.length === 1 ? ' întrebare' : ' întrebări') + ' fără răspuns. Vă ducem la prima.';
      msg.className = 'form-status err';
      missing[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      var first = missing[0].querySelector('input');
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 400);
      return;
    }
    msg.className = 'form-status';

    var r = compute();
    var level = LEVELS.filter(function (l) { return r.pct <= l.max; })[0];

    document.getElementById('score-num').textContent = r.pct;
    document.getElementById('level-name').textContent = level.name;
    document.getElementById('level-text').textContent = level.text;
    var circ = 2 * Math.PI * 88;
    var ring = document.getElementById('ring-fill');
    ring.style.strokeDasharray = circ;
    ring.style.strokeDashoffset = circ * (1 - r.pct / 100);

    // Bare pe dimensiuni
    var bars = document.getElementById('bars');
    bars.innerHTML = '';
    var sorted = Object.keys(r.dims).map(function (k) { return { key: k, d: r.dims[k] }; });
    sorted.forEach(function (o) {
      var row = document.createElement('div');
      row.className = 'bar-row';
      row.innerHTML = '<span></span><div class="track"><div class="fill"></div></div><span class="pct"></span>';
      row.children[0].textContent = o.d.label;
      row.querySelector('.fill').style.width = Math.max(o.d.pct, 3) + '%';
      row.children[2].textContent = o.d.pct + '%';
      bars.appendChild(row);
    });

    // Recomandări: cele mai slabe 2 dimensiuni
    sorted.sort(function (a, b) { return a.d.pct - b.d.pct; });
    var recs = document.getElementById('recs');
    recs.innerHTML = '';
    sorted.slice(0, 2).forEach(function (o) {
      var li = document.createElement('li');
      li.innerHTML = '<strong></strong> ';
      li.firstChild.textContent = o.d.label + ':';
      li.appendChild(document.createTextNode(DIM_TIPS[o.key]));
      addLink(li, DIM_LINKS[o.key]);
      recs.appendChild(li);
    });

    // Quick wins din zonele bifate
    var wins = document.getElementById('wins');
    wins.innerHTML = '';
    var areas = Array.prototype.slice.call(form.querySelectorAll('input[name="zone"]:checked')).map(function (i) { return i.value; });
    if (!areas.length) areas = ['sedinte', 'documente', 'email'];
    areas.slice(0, 4).forEach(function (a) {
      if (!AREA_WINS[a]) return;
      var li = document.createElement('li');
      li.textContent = AREA_WINS[a];
      addLink(li, AREA_LINKS[a]);
      wins.appendChild(li);
    });

    // Câmpuri ascunse pentru formular (ajung la noi împreună cu datele de contact)
    form.querySelector('[name="scor_total"]').value = r.pct + '%';
    form.querySelector('[name="nivel"]').value = level.name;
    form.querySelector('[name="scor_dimensiuni"]').value = Object.keys(r.dims).map(function (k) { return r.dims[k].label + ': ' + r.dims[k].pct + '%'; }).join(' | ');

    result.classList.add('show');
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var status = document.getElementById('send-status');
    var bad = null;
    form.querySelectorAll('#contact-fields [required]').forEach(function (el) {
      var ok = el.type === 'checkbox' ? el.checked : el.value.trim() !== '' && el.checkValidity();
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok && !bad) bad = el;
    });
    if (bad) {
      status.textContent = 'Vă rugăm să completați numele, e-mailul, firma și să confirmați că ați citit Politica de confidențialitate.';
      status.className = 'form-status err';
      bad.focus();
      return;
    }
    window.NRD.submitForm(form, status, 'Mulțumim! Am primit rezultatele. Vă trimitem raportul detaliat și vă contactăm pentru discuția gratuită în cel mult 2 zile lucrătoare.');
  });
})();
