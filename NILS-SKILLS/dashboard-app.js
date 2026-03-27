// Client-side dashboard rendering — inlined by scrape-dashboard.js at build time
var MY = DATA.myAccount;
var COMPARE_ACCOUNT = 'max_sher';

// Prepare reels for both accounts
function prepReels(arr) {
  return arr.map(function(r) {
    var copy = Object.assign({}, r);
    copy._date = r.timestamp ? r.timestamp.split('T')[0] : '';
    return copy;
  }).sort(function(a, b) { return a.timestamp < b.timestamp ? -1 : 1; });
}

var myReels = prepReels(DATA.myReels);
var compData = DATA.competitors;
var compareReels = compData[COMPARE_ACCOUNT] ? prepReels(compData[COMPARE_ACCOUNT]) : [];

var today = new Date(DATA.date + 'T12:00:00');
function daysAgo(d, n) { var x = new Date(d); x.setDate(x.getDate() - n); return x; }
function fmtDate(d) { return d.toISOString().split('T')[0]; }
function filterReels(arr, days) {
  if (days === 0) return arr;
  var cutoff = fmtDate(daysAgo(today, days));
  return arr.filter(function(r) { return r._date >= cutoff; });
}
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function num(n) { return n.toLocaleString(); }

var currentFilter = 0;
var activeTab = 'me'; // 'me' or 'compare'

function delta(curr, prev) {
  if (prev === 0 && curr === 0) return '<span class="delta flat">--</span>';
  if (prev === 0) return '<span class="delta up">NEW</span>';
  var pct = Math.round((curr - prev) / prev * 100);
  if (pct > 0) return '<span class="delta up">+' + pct + '%</span>';
  if (pct < 0) return '<span class="delta down">' + pct + '%</span>';
  return '<span class="delta flat">0%</span>';
}

function calcStats(arr) {
  var n = arr.length;
  if (!n) return { posts: 0, totalViews: 0, avgViews: 0, totalLikes: 0, totalComments: 0, avgEng: 0, avgDur: 0 };
  var tv = arr.reduce(function(s, r) { return s + r.views; }, 0);
  var tl = arr.reduce(function(s, r) { return s + r.likes; }, 0);
  var tc = arr.reduce(function(s, r) { return s + r.comments; }, 0);
  var ae = +(arr.reduce(function(s, r) { return s + r.engagement; }, 0) / n).toFixed(2);
  var ad = +(arr.reduce(function(s, r) { return s + r.duration; }, 0) / n).toFixed(0);
  return { posts: n, totalViews: tv, avgViews: Math.round(tv / n), totalLikes: tl, totalComments: tc, avgEng: ae, avgDur: ad };
}

function render() {
  var sourceReels = activeTab === 'me' ? myReels : compareReels;
  var accountName = activeTab === 'me' ? MY : COMPARE_ACCOUNT;
  var filtered = filterReels(sourceReels, currentFilter);
  var prevPeriodReels = currentFilter > 0
    ? sourceReels.filter(function(r) {
        var cutStart = fmtDate(daysAgo(today, currentFilter * 2));
        var cutEnd = fmtDate(daysAgo(today, currentFilter));
        return r._date >= cutStart && r._date < cutEnd;
      })
    : [];

  var st = calcStats(filtered);
  var prev = calcStats(prevPeriodReels);
  var showDelta = currentFilter > 0;

  // Comparison bar: show the other account's stats side by side
  var otherReels = activeTab === 'me' ? compareReels : myReels;
  var otherFiltered = filterReels(otherReels, currentFilter);
  var otherSt = calcStats(otherFiltered);
  var otherName = activeTab === 'me' ? COMPARE_ACCOUNT : MY;

  // Activity Grid (always show your own)
  var gridReels = myReels;
  var gridDays = 91;
  var postMap = {};
  var viewMap = {};
  gridReels.forEach(function(r) {
    if (!r._date) return;
    postMap[r._date] = (postMap[r._date] || 0) + 1;
    viewMap[r._date] = (viewMap[r._date] || 0) + r.views;
  });
  var viewValues = Object.values(viewMap);
  var maxDayViews = viewValues.length > 0 ? Math.max.apply(null, viewValues) : 1;
  if (maxDayViews < 1) maxDayViews = 1;

  var startDate = daysAgo(today, gridDays - 1);
  var alignedStart = daysAgo(startDate, startDate.getDay());
  var weeks = [];
  var cur = new Date(alignedStart);
  var weekCol = [];

  while (cur <= today || weekCol.length > 0) {
    var d = fmtDate(cur);
    var inRange = cur >= daysAgo(today, gridDays - 1) && cur <= today;
    var count = postMap[d] || 0;
    var views = viewMap[d] || 0;
    var level = !inRange ? -1 : count === 0 ? 0 : views <= maxDayViews * 0.25 ? 1 : views <= maxDayViews * 0.5 ? 2 : views <= maxDayViews * 0.75 ? 3 : 4;

    if (inRange || cur <= today) {
      if (level === -1) {
        weekCol.push('<div class="day-cell" style="visibility:hidden"></div>');
      } else {
        weekCol.push('<div class="day-cell" data-count="' + count + '" data-level="' + level + '"><span class="tip">' + d + ': ' + count + ' post' + (count !== 1 ? 's' : '') + ', ' + num(views) + ' views</span></div>');
      }
    }

    if (weekCol.length === 7 || cur > today) {
      while (weekCol.length < 7) weekCol.push('<div class="day-cell" style="visibility:hidden"></div>');
      weeks.push('<div class="week-col">' + weekCol.join('') + '</div>');
      weekCol = [];
      if (cur > today) break;
    }
    cur.setDate(cur.getDate() + 1);
  }

  var gridHtml = '<div class="activity-grid">' + weeks.join('') + '</div>';
  gridHtml += '<div class="grid-legend"><span>Less</span><div class="swatch" style="background:var(--surface2)"></div><div class="swatch" style="background:#1e3a5f"></div><div class="swatch" style="background:#1d4ed8"></div><div class="swatch" style="background:#3b82f6"></div><div class="swatch" style="background:#60a5fa"></div><span>More</span></div>';

  // Posts table
  var sortedFiltered = filtered.slice().sort(function(a, b) { return b.timestamp < a.timestamp ? -1 : 1; });
  var filteredViews = filtered.map(function(r) { return r.views; });
  var maxV = filteredViews.length > 0 ? Math.max.apply(null, filteredViews) : 1;
  var postsHtml = sortedFiltered.map(function(r) {
    var perf = r.views >= maxV * 0.6 ? 'high' : r.views >= maxV * 0.25 ? 'mid' : 'low';
    var dur = r.duration ? Math.round(r.duration) + 's' : '-';
    return '<tr><td>' + (r._date || '-') + '</td><td><span class="perf-dot ' + perf + '"></span>' + num(r.views) + '</td><td>' + r.likes + '</td><td>' + r.comments + '</td><td>' + r.engagement + '%</td><td>' + dur + '</td><td class="hook-td" title="' + esc(r.hook) + '">' + esc(r.hook) + '</td><td><a href="' + r.url + '" target="_blank">View</a></td></tr>';
  }).join('');

  if (!postsHtml) {
    postsHtml = '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:20px">No posts in this period</td></tr>';
  }

  // Top competitor reels (all competitors)
  var allComp = [];
  var compKeys = Object.keys(compData);
  for (var j = 0; j < compKeys.length; j++) {
    var arr = compData[compKeys[j]];
    for (var k = 0; k < arr.length; k++) {
      var rc = Object.assign({}, arr[k]);
      rc._date = rc.timestamp ? rc.timestamp.split('T')[0] : '';
      allComp.push(rc);
    }
  }
  allComp.sort(function(a, b) { return b.views - a.views; });

  // Find outliers: reels that got 3x+ the account's average
  var compAvgs = {};
  for (var ci = 0; ci < compKeys.length; ci++) {
    var cs = calcStats(compData[compKeys[ci]].map(function(r) {
      var c2 = Object.assign({}, r);
      c2._date = r.timestamp ? r.timestamp.split('T')[0] : '';
      return c2;
    }));
    compAvgs[compKeys[ci]] = cs.avgViews;
  }

  var topReels = allComp.slice(0, 15);
  var topReelsHtml = topReels.map(function(r, i) {
    var avg = compAvgs[r.username] || 1;
    var multiplier = avg > 0 ? (r.views / avg).toFixed(1) : '-';
    var isOutlier = r.views >= avg * 3;
    var outlierBadge = isOutlier ? ' <span class="outlier-badge">' + multiplier + 'x avg</span>' : '';
    return '<tr><td>' + (i + 1) + '</td><td>@' + r.username + '</td><td>' + num(r.views) + outlierBadge + '</td><td>' + r.likes + '</td><td>' + r.engagement + '%</td><td class="hook-td" title="' + esc(r.hook) + '">' + esc(r.hook) + '</td><td><a href="' + r.url + '" target="_blank">View</a></td></tr>';
  }).join('');

  // Filter buttons
  var filterBtns = [7, 14, 30, 90, 0].map(function(d) {
    var label = d === 0 ? 'All' : d + 'd';
    var cls = currentFilter === d ? 'fbtn active' : 'fbtn';
    return '<button class="' + cls + '" onclick="setFilter(' + d + ')">' + label + '</button>';
  }).join('');

  // Account toggle
  var meClass = activeTab === 'me' ? 'tab active' : 'tab';
  var compClass = activeTab === 'compare' ? 'tab active' : 'tab';
  var toggleHtml = '<div class="toggle"><button class="' + meClass + '" onclick="setTab(\'me\')">@' + MY + '</button><button class="' + compClass + '" onclick="setTab(\'compare\')">@' + COMPARE_ACCOUNT + '</button></div>';

  // KPI cards with vs comparison
  function kpi(label, val, prevVal, otherVal) {
    var d = showDelta ? delta(val, prevVal) : '';
    var vs = otherVal !== undefined ? '<div class="vs">vs @' + otherName + ': <b>' + (typeof otherVal === 'number' ? num(otherVal) : otherVal) + '</b></div>' : '';
    return '<div class="kpi"><div class="label">' + label + '</div><div class="val">' + (typeof val === 'number' ? num(val) : val) + '</div>' + d + vs + '</div>';
  }

  var periodLabel = currentFilter > 0 ? '(past ' + currentFilter + ' days)' : '(all time)';

  var refreshHtml = '<div class="refresh-info"><span class="refresh-dot"></span>Last scraped: ' + DATA.date + ' <span class="refresh-hint">Refreshes every Monday via GitHub Actions</span></div>';

  document.getElementById('app').innerHTML =
    '<div class="hdr"><div><h1>Nils Digital Dashboard</h1>' + refreshHtml + '</div><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">' + toggleHtml + '<div class="filters">' + filterBtns + '</div></div></div>' +
    '<div class="kpis">' +
      kpi('Posts', st.posts, prev.posts, otherSt.posts) +
      kpi('Total Views', st.totalViews, prev.totalViews, otherSt.totalViews) +
      kpi('Avg Views', st.avgViews, prev.avgViews, otherSt.avgViews) +
      kpi('Total Likes', st.totalLikes, prev.totalLikes, otherSt.totalLikes) +
      kpi('Total Comments', st.totalComments, prev.totalComments, otherSt.totalComments) +
      kpi('Avg Engagement', st.avgEng + '%', undefined, otherSt.avgEng + '%') +
      kpi('Avg Duration', st.avgDur + 's', undefined, otherSt.avgDur + 's') +
    '</div>' +
    '<div class="activity-section"><div class="title">Your Posting Activity (past 90 days)</div><div class="grid-wrap">' + gridHtml + '</div></div>' +
    '<div class="posts-section"><div class="title">@' + accountName + ' Reels ' + periodLabel + '</div><div class="tbl-wrap"><table><tr><th>Date</th><th>Views</th><th>Likes</th><th>Comments</th><th>Eng%</th><th>Dur</th><th>Hook</th><th></th></tr>' + postsHtml + '</table></div></div>' +
    '<div class="posts-section"><div class="title">Top Competitor Reels <span style="font-weight:400;color:var(--muted)">(across all tracked accounts)</span></div><div class="tbl-wrap"><table><tr><th>#</th><th>Account</th><th>Views</th><th>Likes</th><th>Eng%</th><th>Hook</th><th></th></tr>' + topReelsHtml + '</table></div></div>' +
    '<div style="text-align:center;padding:20px;color:var(--muted);font-size:11px"><code>node scrape-dashboard.js</code> to refresh &middot; <code>--build-only</code> to rebuild from cache</div>';
}

function setFilter(d) { currentFilter = d; render(); }
function setTab(t) { activeTab = t; render(); }

render();
