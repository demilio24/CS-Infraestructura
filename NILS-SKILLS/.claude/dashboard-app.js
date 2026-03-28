// Client-side dashboard rendering
var MY = DATA.myAccount;

// Build competitor list from data
var compList = [];
var rawComp = DATA.competitors;
var compReelsMap = {};
var ck = Object.keys(rawComp);
for (var i = 0; i < ck.length; i++) {
  var val = rawComp[ck[i]];
  var arr = Array.isArray(val) ? val : (val.reels || []);
  if (arr.length > 0) {
    compList.push(ck[i]);
    compReelsMap[ck[i]] = prepReels(arr);
  }
}
var activeComp = compList.length > 0 ? compList[0] : null;

function prepReels(arr) {
  return arr.map(function(r) {
    var copy = Object.assign({}, r);
    copy._date = r.timestamp ? r.timestamp.split('T')[0] : '';
    return copy;
  }).sort(function(a, b) { return a.timestamp < b.timestamp ? -1 : 1; });
}

var myReels = prepReels(DATA.myReels);

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
  var compReels = activeComp ? compReelsMap[activeComp] : [];
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

  // Posts table
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

  // Competitor selector
  var compOptions = compList.map(function(name) {
    var sel = name === activeComp ? ' selected' : '';
    return '<option value="' + name + '"' + sel + '>@' + name + '</option>';
  }).join('');
  var compSelector = '<select class="comp-select" onchange="setComp(this.value)">' + compOptions + '</select>';

  // KPI cards
  var compNote = compSt.posts === 0 && currentFilter > 0 ? ' <span class="inactive-note">(inactive)</span>' : '';
  function kpi(label, myVal, compVal) {
    var myStr = typeof myVal === 'number' ? num(myVal) : myVal;
    var compStr = typeof compVal === 'number' ? num(compVal) : compVal;
    var themVal = compSt.posts === 0 && currentFilter > 0 ? '<span class="kpi-na">--</span>' : compStr;
    return '<div class="kpi">' +
      '<div class="kpi-label">' + label + '</div>' +
      '<div class="kpi-compare">' +
        '<div class="kpi-col me"><div class="kpi-val">' + myStr + '</div><div class="kpi-who">You</div></div>' +
        '<div class="kpi-vs">vs</div>' +
        '<div class="kpi-col them"><div class="kpi-val">' + themVal + '</div><div class="kpi-who">' + (activeComp ? '@' + activeComp : '--') + compNote + '</div></div>' +
      '</div>' +
    '</div>';
  }

  // Outlier posts: reels that got 2x+ the account's average
  var allCompReels = [];
  var compAvgs = {};
  for (var oi = 0; oi < compList.length; oi++) {
    var oname = compList[oi];
    var oreels = compReelsMap[oname];
    var oavg = oreels.length > 0 ? oreels.reduce(function(s,r){return s+r.views},0) / oreels.length : 0;
    compAvgs[oname] = oavg;
    for (var oj = 0; oj < oreels.length; oj++) allCompReels.push(oreels[oj]);
  }
  // Also add my reels to find my own outliers
  var myAvg = myReels.length > 0 ? myReels.reduce(function(s,r){return s+r.views},0) / myReels.length : 0;
  compAvgs[MY] = myAvg;
  for (var mi = 0; mi < myReels.length; mi++) allCompReels.push(myReels[mi]);

  allCompReels.sort(function(a,b){return b.views - a.views});
  // Only show reels that are 2x+ their account's average
  var outliers = allCompReels.filter(function(r) {
    var avg = compAvgs[r.username] || 1;
    return r.views >= avg * 2 && r.views > 0;
  }).slice(0, 10);

  var outliersHtml = outliers.map(function(r, idx) {
    var avg = compAvgs[r.username] || 1;
    var mult = (r.views / avg).toFixed(1);
    return '<tr><td>' + (idx+1) + '</td><td>@' + r.username + '</td><td>' + num(r.views) + ' <span class="outlier-badge">' + mult + 'x</span></td><td>' + r.engagement + '%</td><td class="hook-td" title="' + esc(r.hook) + '">' + esc(r.hook) + '</td><td><a href="' + r.url + '" target="_blank">View</a></td></tr>';
  }).join('');

  var periodLabel = currentFilter > 0 ? 'past ' + currentFilter + ' days' : 'all time';
  var GH_ACTIONS_URL = 'https://github.com/demilio24/Websites/actions/workflows/refresh-dashboard.yml';

  document.getElementById('app').innerHTML =
    '<div class="hdr">' +
      '<div><h1>Nils Digital Dashboard</h1><div class="refresh-info"><span class="refresh-dot"></span>Last scraped: ' + DATA.date + '</div></div>' +
      '<div class="hdr-controls"><div class="control-row"><span class="control-label">Compare</span>' + compSelector + '</div><div class="control-row"><div class="filters">' + filterBtns + '</div><a href="' + GH_ACTIONS_URL + '" target="_blank" class="refresh-btn">Refresh</a></div></div>' +
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
    (outliers.length > 0 ? '<div class="posts-section"><div class="section-label">Outlier Posts <span class="period-label">reels that beat their account avg by 2x+</span></div><div class="tbl-wrap"><table><tr><th>#</th><th>Account</th><th>Views</th><th>Eng%</th><th>Hook</th><th></th></tr>' + outliersHtml + '</table></div></div>' : '') +
    '<div style="text-align:center;padding:16px;color:var(--muted);font-size:11px"><code>node scrape-dashboard.js</code> to refresh</div>';
}

function setFilter(d) { currentFilter = d; render(); }
function setComp(name) { activeComp = name; render(); }

render();
