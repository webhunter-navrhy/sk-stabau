document.documentElement.classList.add('js');

// Menu na mobile
(function () {
  var b = document.querySelector('.burger'), m = document.getElementById('menu');
  if (!b || !m) return;
  function nastav(o) { b.setAttribute('aria-expanded', o ? 'true' : 'false'); m.classList.toggle('otvorene', o); }
  b.addEventListener('click', function () { nastav(b.getAttribute('aria-expanded') !== 'true'); });
  m.addEventListener('click', function (e) { if (e.target.closest('a')) nastav(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') nastav(false); });
})();

// Zoznam stavieb: filter podľa typu, roky, staršie roky; na tablete a mobile jeden rok ako záložka
(function () {
  var zapisy = document.querySelector('.zapisy');
  if (!zapisy) return;
  var roky = Array.prototype.slice.call(zapisy.querySelectorAll('.rok'));
  var odkazy = Array.prototype.slice.call(document.querySelectorAll('.roky a'));
  var filtre = Array.prototype.slice.call(document.querySelectorAll('.filter'));
  var vyber = document.querySelector('.filter-vyber select');
  var viac = zapisy.querySelector('.viac-rokov');
  var mq = { matches: true };
  var vybrany = roky[0] ? roky[0].id : '';

  function rozbal() { zapisy.classList.add('vsetky'); if (viac) viac.setAttribute('aria-expanded', 'true'); }
  if (viac) viac.addEventListener('click', rozbal);

  function oznac(id) {
    odkazy.forEach(function (a) {
      var akt = a.getAttribute('href') === '#' + id;
      a.classList.toggle('aktivny', akt);
      if (akt) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      if (akt && a.parentNode.scrollWidth > a.parentNode.clientWidth) {
        a.parentNode.scrollTo({ left: a.offsetLeft - 24, behavior: 'smooth' });
      }
    });
  }
  function vyberRok(id) {
    vybrany = id;
    roky.forEach(function (r) { r.classList.toggle('vybrany', r.id === id); });
    oznac(id);
  }
  function rezim() {
    zapisy.classList.toggle('taby', mq.matches);
    if (mq.matches) vyberRok(vybrany);
  }

  function filtruj(typ) {
    var pocty = {}, max = 1;
    roky.forEach(function (r) {
      var n = 0;
      r.querySelectorAll('li').forEach(function (li) {
        var ok = typ === 'vse' || li.getAttribute('data-typ') === typ;
        li.hidden = !ok; if (ok) n++;
      });
      r.classList.toggle('prazdny', n === 0);
      pocty[r.id] = n; if (n > max) max = n;
    });
    odkazy.forEach(function (a) {
      var id = a.getAttribute('href').slice(1), n = pocty[id] || 0;
      a.querySelector('em').textContent = n;
      a.querySelector('.stlpec').style.setProperty('--n', Math.round(n / max * 100) + '%');
      a.classList.toggle('nic', !n);
    });
    if (typ !== 'vse') rozbal();
    if (!pocty[vybrany]) {
      var prvy = roky.filter(function (r) { return pocty[r.id]; })[0];
      if (prvy) vybrany = prvy.id;
    }
    if (mq.matches) vyberRok(vybrany);
  }
  filtre.forEach(function (f) {
    f.addEventListener('click', function () {
      filtre.forEach(function (g) { g.setAttribute('aria-pressed', g === f ? 'true' : 'false'); });
      if (vyber) vyber.value = f.getAttribute('data-typ');
      filtruj(f.getAttribute('data-typ'));
    });
  });
  if (vyber) vyber.addEventListener('change', function () {
    filtre.forEach(function (g) { g.setAttribute('aria-pressed', g.getAttribute('data-typ') === vyber.value ? 'true' : 'false'); });
    filtruj(vyber.value);
  });

  odkazy.forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1), ciel = document.getElementById(id);
      if (mq.matches) { e.preventDefault(); if (!a.classList.contains('nic')) vyberRok(id); return; }
      if (ciel && ciel.classList.contains('starsie')) rozbal();
    });
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (zaznamy) {
      if (mq.matches) return;
      zaznamy.forEach(function (z) { if (z.isIntersecting) oznac(z.target.id); });
    }, { rootMargin: '-35% 0px -60% 0px' });
    roky.forEach(function (r) { io.observe(r); });
  }
  rezim();
})();

// Fázy stavby (záložky na osi)
(function () {
  var taby = Array.prototype.slice.call(document.querySelectorAll('.os [role="tab"]'));
  if (!taby.length) return;
  function ukaz(n, fokus) {
    taby.forEach(function (t, i) {
      var akt = i === n;
      t.setAttribute('aria-selected', akt ? 'true' : 'false');
      t.tabIndex = akt ? 0 : -1;
      t.classList.toggle('prejdene', i < n);
      document.getElementById(t.getAttribute('aria-controls')).hidden = !akt;
    });
    if (fokus) taby[n].focus();
    if (taby[n].parentNode.scrollWidth > taby[n].parentNode.clientWidth) taby[n].parentNode.scrollTo({ left: taby[n].offsetLeft - 20, behavior: 'smooth' });
  }
  taby.forEach(function (t, i) {
    t.addEventListener('click', function () { ukaz(i); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); ukaz((i + 1) % taby.length, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); ukaz((i - 1 + taby.length) % taby.length, true); }
    });
  });
  document.querySelectorAll('.dalsia').forEach(function (b) {
    b.addEventListener('click', function () { ukaz(parseInt(b.getAttribute('data-dalsia'), 10), true); });
  });
})();

// Galéria: všetky fotky + lightbox
(function () {
  var zoznam = document.querySelector('.fotky');
  if (!zoznam) return;
  var viac = document.querySelector('.viac-fotiek');
  if (viac) viac.addEventListener('click', function () { zoznam.classList.add('vsetky'); });


  var odkazy = Array.prototype.slice.call(zoznam.querySelectorAll('a[data-lightbox]'));
  var dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.innerHTML = '<button class="lb-zavriet" type="button" aria-label="Zavrieť">×</button>' +
    '<button class="lb-sipka lb-pred" type="button" aria-label="Predchádzajúca">‹</button>' +
    '<button class="lb-sipka lb-dalej" type="button" aria-label="Ďalšia">›</button><img alt=""><p></p>';
  document.body.appendChild(dlg);
  var obr = dlg.querySelector('img'), popis = dlg.querySelector('p'), i = 0;
  function ukaz(n) {
    i = (n + odkazy.length) % odkazy.length;
    var a = odkazy[i], alt = a.querySelector('img').alt;
    obr.src = a.href; obr.alt = alt; popis.textContent = alt;
  }
  odkazy.forEach(function (a, n) {
    a.addEventListener('click', function (e) {
      if (!dlg.showModal) return;
      e.preventDefault(); ukaz(n); dlg.showModal();
    });
  });
  dlg.querySelector('.lb-zavriet').addEventListener('click', function () { dlg.close(); });
  dlg.querySelector('.lb-pred').addEventListener('click', function () { ukaz(i - 1); });
  dlg.querySelector('.lb-dalej').addEventListener('click', function () { ukaz(i + 1); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') ukaz(i - 1);
    if (e.key === 'ArrowRight') ukaz(i + 1);
  });
})();

// Jemné objavenie sekcií
(function () {
  if (!('IntersectionObserver' in window)) return;
  var prvky = document.querySelectorAll('.sluzba, .etapa, .o-nas-foto, .rok, .dopyt');
  var io = new IntersectionObserver(function (z) {
    z.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('videne'); io.unobserve(x.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  prvky.forEach(function (p) { p.classList.add('odhal'); io.observe(p); });
})();

// Formulár: ukážkový režim nič neodosiela, ostrý režim posiela na endpoint zo site.json
(function () {
  document.querySelectorAll('form.formular').forEach(function (f) {
    var stav = f.querySelector('.formular-stav');
    f.addEventListener('submit', function (e) {
      var endpoint = f.getAttribute('data-endpoint');
      var demo = f.getAttribute('data-demo') === '1';
      if (f.querySelector('.past input').value) { e.preventDefault(); return; }
      e.preventDefault();
      if (demo || !endpoint) {
        stav.textContent = 'Toto je ukážka formulára, zatiaľ sa nič neodosiela. Po spustení webu príde dopyt priamo na e-mail firmy.';
        return;
      }
      stav.textContent = 'Odosielam…';
      fetch(endpoint, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); f.reset(); stav.textContent = 'Ďakujeme, dopyt sme prijali.'; })
        .catch(function () { stav.textContent = 'Odoslanie sa nepodarilo. Napíšte nám prosím e-mailom.'; });
    });
  });
})();
