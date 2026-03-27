// Client-side dashboard rendering
var MY = DATA.myAccount;
var COMP = 'max_sher';
var GH_ACTIONS_URL = 'https://github.com/demilio24/Websites/actions/workflows/refresh-dashboard.yml';

function prepReels(arr) {
  return arr.map(function(r) {
    var copy = Object.assign({}, r);
    copy._date = r.timestamp ? r.timestamp.split('T')[0] : '';
    return copy;
  }).sort(function(a, b) { return a.timestamp < b.timestamp ? -1 : 1; });
}

var myReels = prepReels(DATA.myReels);
var rawComp = DATA.competitors;
var compArr = rawComp[COMP] ? (Array.isArray(rawComp[COMP]) ? rawComp[COMP] : (rawComp[COMP].reels || [])) : [];
var compReels = prepReels(compArr);

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
  var myFiltered = filterReels(myReels, currentFilter);
  var compFiltered = filterReels(compReels, currentFilter);
  var mySt = calcStats(myFiltered);
  var compSt = calcStats(compFiltered);

  // Activity Grid (compact)
  var gridDays = 91;
  var postMap = {};
  var viewMap = {};
  myReels.forEach(function(r) {
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
  gridHtml += '<div class="grid-legend"><span>Less</span><div class="swatch" style="background:var(--surface2)"></div><div class="swatch" style="background:#bfdbfe"></div><div class="swatch" style="background:#60a5fa"></div><div class="swatch" style="background:#3b82f6"></div><div class="swatch" style="background:#1d4ed8"></div><span>More</span></div>';

  // Posts table (only my reels)
  var sortedFiltered = myFiltered.slice().sort(function(a, b) { return b.timestamp < a.timestamp ? -1 : 1; });
  var filteredViews = myFiltered.map(function(r) { return r.views; });
  var maxV = filteredViews.length > 0 ? Math.max.apply(null, filteredViews) : 1;
  var postsHtml = sortedFiltered.map(function(r) {
    var perf = r.views >= maxV * 0.6 ? 'high' : r.views >= maxV * 0.25 ? 'mid' : 'low';
    var dur = r.duration ? Math.round(r.duration) + 's' : '-';
    return '<tr><td>' + (r._date || '-') + '</td><td><span class="perf-dot ' + perf + '"></span>' + num(r.views) + '</td><td>' + r.likes + '</td><td>' + r.comments + '</td><td>' + r.engagement + '%</td><td>' + dur + '</td><td class="hook-td" title="' + esc(r.hook) + '">' + esc(r.hook) + '</td><td><a href="' + r.url + '" target="_blank">View</a></td></tr>';
  }).join('');

  if (!postsHtml) {
    postsHtml = '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:20px">No posts in this period</td></tr>';
  }

  // Filter buttons
  var filterBtns = [7, 14, 30, 90, 0].map(function(d) {
    var label = d === 0 ? 'All' : d + 'd';
    var cls = currentFilter === d ? 'fbtn active' : 'fbtn';
    return '<button class="' + cls + '" onclick="setFilter(' + d + ')">' + label + '</button>';
  }).join('');

  // KPI cards: side by side comparison built in
  function kpi(label, myVal, compVal) {
    var myStr = typeof myVal === 'number' ? num(myVal) : myVal;
    var compStr = typeof compVal === 'number' ? num(compVal) : compVal;
    var themVal = compSt.posts === 0 && currentFilter > 0 ? '<span class="kpi-na">--</span>' : compStr;
    return '<div class="kpi">' +
      '<div class="kpi-label">' + label + '</div>' +
      '<div class="kpi-compare">' +
        '<div class="kpi-col me"><div class="kpi-val">' + myStr + '</div><div class="kpi-who">You</div></div>' +
        '<div class="kpi-vs">vs</div>' +
        '<div class="kpi-col them"><div class="kpi-val">' + themVal + '</div><div class="kpi-who">@' + COMP + compNote + '</div></div>' +
      '</div>' +
    '</div>';
  }

  var periodLabel = currentFilter > 0 ? 'past ' + currentFilter + ' days' : 'all time';

  // If comp has no posts in filtered period, show a note
  var compNote = compSt.posts === 0 && currentFilter > 0 ? ' <span class="inactive-note">(no posts in this period)</span>' : '';

  document.getElementById('app').innerHTML =
    '<div class="hdr">' +
      '<div><h1>Nils Digital Dashboard</h1><div class="refresh-info"><span class="refresh-dot"></span>Last scraped: ' + DATA.date + ' <span class="refresh-hint">Auto-refreshes every Monday</span></div></div>' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><div class="filters">' + filterBtns + '</div><a href="' + GH_ACTIONS_URL + '" target="_blank" class="refresh-btn">Refresh</a></div>' +
    '</div>' +
    '<div class="kpis">' +
      kpi('Posts', mySt.posts, compSt.posts) +
      kpi('Total Views', mySt.totalViews, compSt.totalViews) +
      kpi('Avg Views', mySt.avgViews, compSt.avgViews) +
      kpi('Total Likes', mySt.totalLikes, compSt.totalLikes) +
      kpi('Comments', mySt.totalComments, compSt.totalComments) +
      kpi('Avg Eng', mySt.avgEng + '%', compSt.avgEng + '%') +
      kpi('Avg Duration', mySt.avgDur + 's', compSt.avgDur + 's') +
    '</div>' +
    '<div class="activity-section"><div class="section-label">Posting Activity <span class="period-label">' + periodLabel + '</span></div><div class="grid-wrap">' + gridHtml + '</div></div>' +
    '<div class="posts-section"><div class="section-label">Your Reels <span class="period-label">' + periodLabel + '</span></div><div class="tbl-wrap"><table><tr><th>Date</th><th>Views</th><th>Likes</th><th>Comments</th><th>Eng%</th><th>Dur</th><th>Hook</th><th></th></tr>' + postsHtml + '</table></div></div>' +
    '<div style="text-align:center;padding:16px;color:var(--muted);font-size:11px"><code>node scrape-dashboard.js</code> to refresh</div>';
}

function setFilter(d) { currentFilter = d; render(); }

render();
