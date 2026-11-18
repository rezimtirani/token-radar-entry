// Token Radar dashboard: board, detail view, live tokens and the model.
// Static page, no network: all data comes from data.js (window.RADAR), the
// file main.ts writes from the same ranked board. State lives in the URL
// hash, so a board, a detail view and a filtered view each have a link:
//   #view=board, #view=live, #view=model, #detail=<slug>,
//   #q=<text> #cat=<category> #chain=<chain> #status=watchlist|early|high
//   #sort=rank|value|tvl|growth|age
(function () {
  'use strict';
  var D = window.RADAR;
  if (!D) { document.getElementById('board').innerHTML = '<p class="empty">No radar data loaded.</p>'; return; }
  // The watchlist slugs are the board rows the snapshot's floor named; the
  // model marks them in data.js via row.watch (set by main.ts's build).
  var watchlistSet = new Set();
  D.rows.forEach(function (r) { if (r.watch) watchlistSet.add(r.slug); });

  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2).replace(/\.00$/, '') + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(n >= 1e8 ? 0 : 1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + n;
  }
  function pct(n) { return n === null || n === undefined ? '—' : (n >= 0 ? '+' : '') + n + '%'; }
  function ageText(a) { if (a === null || a === undefined) return '—'; if (a < 365) return a + 'd'; return (a / 365).toFixed(1) + 'y'; }
  function parseHash() {
    var out = { view: 'board', detail: '', q: '', cat: '', chain: '', status: '', sort: 'rank' };
    location.hash.slice(1).split('&').forEach(function (kv) {
      var i = kv.indexOf('=');
      if (i < 0) return;
      var k = kv.slice(0, i), v = decodeURIComponent(kv.slice(i + 1));
      if (k in out) out[k] = v;
    });
    return out;
  }
  var S = parseHash();

  // ---- header stats -------------------------------------------------------
  var top = D.rows[0];
  $('stats').innerHTML =
    '<div class="stat"><b>' + D.board_size + '</b><span>ranked rows</span></div>' +
    '<div class="stat"><b>' + D.watchlist_size + '</b><span>watchlist</span></div>' +
    '<div class="stat"><b>' + D.early_size + '</b><span>early radar</span></div>' +
    '<div class="stat"><b>' + money(top ? top.implied_value_usd : 0) + '</b><span>top implied</span></div>';
  $('source').textContent = 'Snapshot ' + D.as_of + ' · ' + D.source + ' · model ' + D.model_version + ' · floor ' + money(D.floor_usd) + '.';

  // ---- filter controls ----------------------------------------------------
  var cats = [], chains = [];
  D.rows.forEach(function (r) {
    if (r.category && cats.indexOf(r.category) < 0) cats.push(r.category);
    r.chains.forEach(function (c) { if (chains.indexOf(c) < 0) chains.push(c); });
  });
  cats.sort(); chains.sort();
  cats.forEach(function (c) { $('cat').insertAdjacentHTML('beforeend', '<option>' + esc(c) + '</option>'); });
  chains.forEach(function (c) { $('chain').insertAdjacentHTML('beforeend', '<option>' + esc(c) + '</option>'); });
  $('q').value = S.q; $('cat').value = S.cat; $('chain').value = S.chain; $('status').value = S.status; $('sort').value = S.sort;

  function writeHash() {
    var parts = [];
    if (S.view !== 'board') parts.push('view=' + S.view);
    if (S.detail) parts.push('detail=' + encodeURIComponent(S.detail));
    if (S.q) parts.push('q=' + encodeURIComponent(S.q));
    if (S.cat) parts.push('cat=' + encodeURIComponent(S.cat));
    if (S.chain) parts.push('chain=' + encodeURIComponent(S.chain));
    if (S.status) parts.push('status=' + S.status);
    if (S.sort !== 'rank') parts.push('sort=' + S.sort);
    var h = parts.length ? '#' + parts.join('&') : '#';
    if (location.hash !== h) { try { history.replaceState(null, '', h); } catch (e) { /* file:// or sandboxed viewers may refuse; the page already rendered */ } }
  }
  function filtered() {
    var q = S.q.toLowerCase();
    var rows = D.rows.filter(function (r) {
      if (q && r.name.toLowerCase().indexOf(q) < 0 && r.slug.toLowerCase().indexOf(q) < 0) return false;
      if (S.cat && r.category !== S.cat) return false;
      if (S.chain && r.chains.indexOf(S.chain) < 0) return false;
      if (S.status === 'watchlist' && !watchlistSet.has(r.slug)) return false;
      if (S.status === 'early' && watchlistSet.has(r.slug)) return false;
      if (S.status === 'high' && r.likelihood !== 'High') return false;
      return true;
    });
    var by = {
      rank: function (a, b) { return a.rank - b.rank; },
      value: function (a, b) { return b.implied_value_usd - a.implied_value_usd; },
      tvl: function (a, b) { return b.tvl_usd - a.tvl_usd; },
      growth: function (a, b) { return (b.change_7d || 0) - (a.change_7d || 0); },
      age: function (a, b) { return (b.age_days || 0) - (a.age_days || 0); },
    }[S.sort] || function (a, b) { return a.rank - b.rank; };
    return rows.slice().sort(by);
  }

  function likelihoodBadge(l) {
    return '<span class="badge ' + (l === 'High' ? 'high' : l === 'Medium' ? 'med' : 'low') + '">' + l + '</span>';
  }

  function renderBoard() {
    var rows = filtered();
    var shown = rows.slice(0, 100);
    var html = '<p class="meta">Showing ' + shown.length + ' of ' + rows.length + ' matching rows · ' + D.board_size +
      ' ranked in all · ranked by implied value (model ' + esc(D.model_version) + '). Click a row for its farm plan.</p>';
    if (!rows.length) { $('board').innerHTML = html + '<p class="empty">No protocol matches these filters.</p>'; return; }
    html += '<table><thead><tr><th class="num">#</th><th>Protocol</th><th>Category</th><th>Chains</th><th class="num">TVL</th><th class="num">7d</th><th class="num">Age</th><th class="num">Implied value</th><th>Likelihood</th></tr></thead><tbody>';
    shown.forEach(function (r) {
      html += '<tr data-slug="' + esc(r.slug) + '"' + (S.detail === r.slug ? ' class="sel"' : '') + '>' +
        '<td class="num rank">' + r.rank + '</td>' +
        '<td><span class="name">' + esc(r.name) + '</span> <span class="slug">' + esc(r.slug) + '</span>' +
        (watchlistSet.has(r.slug) ? '<span class="badge wl">WATCHLIST</span>' : '<span class="badge early">EARLY</span>') + '</td>' +
        '<td>' + esc(r.category || '—') + '</td>' +
        '<td>' + esc(r.chains.slice(0, 3).join(', ')) + (r.chains.length > 3 ? ' +' + (r.chains.length - 3) : '') + '</td>' +
        '<td class="num">' + money(r.tvl_usd) + '</td>' +
        '<td class="num ' + (r.change_7d === null ? '' : r.change_7d >= 0 ? 'pos' : 'neg') + '">' + pct(r.change_7d) + '</td>' +
        '<td class="num">' + ageText(r.age_days) + '</td>' +
        '<td class="num"><b>' + money(r.implied_value_usd) + '</b></td>' +
        '<td>' + likelihoodBadge(r.likelihood) + '</td></tr>';
    });
    html += '</tbody></table>';
    if (rows.length > 100) html += '<p class="meta">First 100 rows shown — narrow the filters to see the rest.</p>';
    $('board').innerHTML = html;
    Array.prototype.forEach.call($('board').querySelectorAll('tr[data-slug]'), function (tr) {
      tr.addEventListener('click', function () { S.detail = tr.getAttribute('data-slug'); S.view = 'board'; writeHash(); render(); });
    });
  }

  function bar(label, mult, max) {
    var w = Math.max(2, Math.min(100, (mult / max) * 100));
    return '<div class="bar"><span>' + label + '</span><span class="track"><span class="fill" style="display:block;width:' + w.toFixed(0) + '%"></span></span><b>×' + mult.toFixed(2) + '</b></div>';
  }

  function renderDetail() {
    var box = $('detail');
    if (!S.detail) { box.innerHTML = ''; return; }
    var r = null;
    D.rows.forEach(function (x) { if (x.slug === S.detail) r = x; });
    if (!r) { box.innerHTML = '<div class="card"><p>No protocol with that slug on the board.</p></div>'; return; }
    var steps = r.farm_steps.map(function (s) {
      var i = s.indexOf(' Cost: ');
      var main = i >= 0 ? s.slice(0, i) : s;
      var ct = i >= 0 ? s.slice(i + 1) : '';
      return '<li>' + esc(main) + (ct ? '<span class="ct">' + esc(ct) + '</span>' : '') + '</li>';
    }).join('');
    box.innerHTML = '<div class="card"><h2>#' + r.rank + ' ' + esc(r.name) + '</h2>' +
      '<p class="why">' + esc(r.why) + '</p>' +
      '<div class="kv">' +
      '<div><b>' + money(r.implied_value_usd) + '</b><span>implied value</span></div>' +
      '<div><b>' + money(r.tvl_usd) + '</b><span>TVL</span></div>' +
      '<div><b>' + pct(r.change_7d) + '</b><span>7d growth</span></div>' +
      '<div><b>' + ageText(r.age_days) + '</b><span>tracked, no token</span></div>' +
      '<div><b>' + r.chains.length + '</b><span>chains</span></div>' +
      '<div><b>$' + r.capital_usd + '</b><span>farm capital</span></div>' +
      '<div><b>' + r.likelihood + '</b><span>likelihood</span></div></div>' +
      '<h3>How the value is built</h3><div class="bars">' +
      bar('Category ×' + r.category_multiple.toFixed(2) + ' (' + esc(r.category || 'uncategorised') + ')', r.category_multiple, 0.4) +
      bar('Growth', r.growth_multiplier, 1.8) +
      bar('Maturity (age)', r.maturity_multiplier, 1.1) +
      bar('Chain reach', r.chain_multiplier, 1.2) +
      '</div><p class="why">Implied = TVL × category multiple × growth × maturity × chain reach. ' +
      'Change any constant in the model panel and the board recomputes — the model is a claim you can test, not a black box.</p>' +
      '<h3>Farm plan — ' + esc(r.name) + '</h3><ol class="steps">' + steps + '</ol>' +
      '<p class="why">No token is recorded for this protocol in the snapshot, so none of these steps assumes one exists yet. ' +
      'If a token launches, the same position is the one a distribution would read.</p></div>';
  }

  function renderLive() {
    var rows = D.live.map(function (p, i) {
      return '<tr><td class="num rank">' + (i + 1) + '</td><td><span class="name">' + esc(p.name) + '</span> <span class="slug">' + esc(p.slug) + '</span></td>' +
        '<td>' + esc(p.category || '—') + '</td><td class="num">' + money(p.tvl_usd) + '</td>' +
        '<td class="num">' + money(p.mcap_usd || 0) + '</td>' +
        '<td class="num ' + (p.change_7d === null ? '' : p.change_7d >= 0 ? 'pos' : 'neg') + '">' + pct(p.change_7d) + '</td></tr>';
    }).join('');
    $('extra').innerHTML = '<div class="card"><h2>Already trading — the market\'s own values</h2>' +
      '<p class="why">These ' + D.live_size + ' protocols already have a token, so the board shows their market cap as the market prices it — never a model\'s implied value, and never mixed into the ranked board. They are the control group: what a launch is worth once it exists.</p>' +
      '<table class="tbl2"><thead><tr><th class="num">#</th><th>Protocol</th><th>Category</th><th class="num">TVL</th><th class="num">Market cap</th><th class="num">7d</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function renderModel() {
    var mults = Object.keys(D.model.category_multiples).sort().map(function (k) {
      return '<tr><td>' + esc(k) + '</td><td class="num">×' + D.model.category_multiples[k].toFixed(2) + '</td></tr>';
    }).join('');
    var e = D.excluded;
    $('extra').innerHTML = '<div class="grid2"><div class="card"><h2>The model — radar-2</h2>' +
      '<p class="why">Implied value = TVL × category multiple × growth × maturity × chain reach. Every input is a figure the snapshot itself carries; no protocol name is ever special-cased, so the same function scores a protocol the snapshot has never seen.</p>' +
      '<table class="tbl2"><thead><tr><th>Category</th><th class="num">Multiple</th></tr></thead><tbody>' + mults +
      '<tr><td>Anything else</td><td class="num">×' + D.model.default_multiple.toFixed(2) + '</td></tr></tbody></table></div>' +
      '<div class="card"><h2>What was left out — and why</h2>' +
      '<p class="why">A board that ranks everything ranks nothing. These protocols are in the snapshot but never on the ranked board:</p>' +
      '<table class="tbl2"><tbody>' +
      '<tr><td>' + e.live_token + ' protocols</td><td>already have a token — see Live tokens</td></tr>' +
      '<tr><td>' + e.cex + ' protocols</td><td>centralised exchanges, not farmable protocols</td></tr>' +
      '<tr><td>' + e.wrapped_staked_bridge + ' protocols</td><td>wrapped, staked or bridged products of a token that already trades</td></tr>' +
      '<tr><td>' + e.versioned + ' protocols</td><td>versioned pools of another protocol (V2, 2.0, …)</td></tr>' +
      '</tbody></table>' +
      '<h3>Growth</h3><p class="why">7-day TVL change, clamped to −60%…+150%, weighted ×' + D.model.growth_weight + ', floored at ×' + D.model.growth_mult_floor + '. A shrinking protocol still keeps most of its value; a surging one earns more.</p>' +
      '<h3>Maturity</h3><p class="why">×' + D.model.maturity_floor + ' at launch, rising to ×1.00 at 3 years with no token, then easing to ×' + D.model.maturity_tail + ' — a protocol that has run for years without a token has built the value a launch would price, while one that has run a decade without ever launching is a weaker candidate.</p>' +
      '<h3>Chain reach</h3><p class="why">+2% per extra chain, to +16%: reach across chains is reach across user bases.</p>' +
      '<div class="note">The watchlist is the floor, never the ceiling: ' + D.watchlist_size + ' protocols meet the house rule, and the board adds ' + D.early_size + ' more pre-token protocols below it — the early radar.</div>' +
      '</div></div>';
  }

  function render() {
    document.querySelectorAll('#views button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-view') === S.view); });
    $('controls').style.display = S.view === 'board' ? 'flex' : 'none';
    $('board').style.display = S.view === 'board' ? '' : 'none';
    $('detail').style.display = S.view === 'board' ? '' : 'none';
    $('extra').innerHTML = '';
    if (S.view === 'board') { renderBoard(); renderDetail(); }
    else if (S.view === 'live') { renderLive(); }
    else { renderModel(); }
    writeHash();
  }

  document.querySelectorAll('#views button').forEach(function (b) {
    b.addEventListener('click', function () { S.view = b.getAttribute('data-view'); S.detail = ''; render(); });
  });
  $('q').addEventListener('input', function () { S.q = $('q').value; S.detail = ''; render(); });
  $('cat').addEventListener('change', function () { S.cat = $('cat').value; render(); });
  $('chain').addEventListener('change', function () { S.chain = $('chain').value; render(); });
  $('status').addEventListener('change', function () { S.status = $('status').value; render(); });
  $('sort').addEventListener('change', function () { S.sort = $('sort').value; render(); });
  window.addEventListener('hashchange', function () { S = parseHash(); $('q').value = S.q; $('cat').value = S.cat; $('chain').value = S.chain; $('status').value = S.status; $('sort').value = S.sort; render(); });
  render();
})();
