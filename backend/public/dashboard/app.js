const tokenInput = document.getElementById("tokenInput");
const projectIdInput = document.getElementById("projectIdInput");
const loadBtn = document.getElementById("loadBtn");
const overviewCards = document.getElementById("overviewCards");
const funnelTable = document.getElementById("funnelTable");
const retentionTable = document.getElementById("retentionTable");
const preaggregatedTable = document.getElementById("preaggregatedTable");

let charts = [];

function authHeaders() {
  return {
    Authorization: `Bearer ${tokenInput.value.trim()}`
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...authHeaders(),
      "Content-Type": "application/json"
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data.data;
}

function destroyCharts() {
  charts.forEach((chart) => {
    if (chart && typeof chart.destroy === "function") {
      chart.destroy();
    }
  });
  charts = [];
}

function makeLineChart(id, labels, values, label) {
  const el = document.getElementById(id);
  if (!el) return;

  const chart = new Chart(el, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: label,
          data: values,
          tension: 0.3,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  charts.push(chart);
}

function makeBarChart(id, labels, values, label) {
  const el = document.getElementById(id);
  if (!el) return;

  const chart = new Chart(el, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: label,
          data: values
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  charts.push(chart);
}

function renderOverview(overview) {
  overviewCards.innerHTML = `
    <div class="metric-card">
      <div class="metric-label">Total Events</div>
      <div class="metric-value">${overview.totalEvents}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Unique Users</div>
      <div class="metric-value">${overview.uniqueUsers}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Unique Sessions</div>
      <div class="metric-value">${overview.uniqueSessions}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Today Events</div>
      <div class="metric-value">${overview.todayEvents}</div>
    </div>
  `;
}

function renderFunnel(funnel) {
  funnelTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Step</th>
          <th>Users</th>
          <th>Conversion</th>
          <th>Drop-off</th>
        </tr>
      </thead>
      <tbody>
        ${funnel.steps.map((row) => `
          <tr>
            <td>${row.step}</td>
            <td>${row.users}</td>
            <td>${row.conversionFromFirstStep}%</td>
            <td>${row.dropOffFromPreviousStep}%</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderRetention(retention) {
  if (!retention.cohorts.length) {
    retentionTable.innerHTML = `<div class="empty-state">No retention data yet.</div>`;
    return;
  }

  retentionTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Cohort Date</th>
          <th>Cohort Size</th>
          <th>Day 0 Users</th>
          <th>Day 0 Retention</th>
        </tr>
      </thead>
      <tbody>
        ${retention.cohorts.map((cohort) => {
          const day0 = cohort.retention.day_0 || { users: 0, retentionRate: 0 };
          return `
            <tr>
              <td>${cohort.cohortDate}</td>
              <td>${cohort.cohortSize}</td>
              <td>${day0.users}</td>
              <td>${day0.retentionRate}%</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function renderPreaggregated(preaggregated) {
  if (!preaggregated.series.length) {
    preaggregatedTable.innerHTML = `<div class="empty-state">No preaggregated data yet.</div>`;
    return;
  }

  preaggregatedTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Total Events</th>
          <th>Unique Users</th>
          <th>Unique Sessions</th>
        </tr>
      </thead>
      <tbody>
        ${preaggregated.series.map((row) => `
          <tr>
            <td>${row.date}</td>
            <td>${row.totalEvents}</td>
            <td>${row.uniqueUsers}</td>
            <td>${row.uniqueSessions}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

async function loadDashboard() {
  const token = tokenInput.value.trim();
  const projectId = projectIdInput.value.trim();

  if (!token) {
    alert("Paste Bearer token first.");
    return;
  }

  if (!projectId) {
    alert("Enter Project ID first.");
    return;
  }

  destroyCharts();

  try {
    const [
      overview,
      topEvents,
      timeseries,
      dau,
      wau,
      mau,
      retention,
      segmentation,
      funnel,
      preaggregated
    ] = await Promise.all([
      fetchJson(`/api/v1/analytics/${projectId}/overview`),
      fetchJson(`/api/v1/analytics/${projectId}/events/top`),
      fetchJson(`/api/v1/analytics/${projectId}/events/timeseries`),
      fetchJson(`/api/v1/analytics/${projectId}/users/dau`),
      fetchJson(`/api/v1/analytics-plus/${projectId}/users/wau`),
      fetchJson(`/api/v1/analytics-plus/${projectId}/users/mau`),
      fetchJson(`/api/v1/analytics/${projectId}/retention`),
      fetchJson(`/api/v1/analytics-plus/${projectId}/segmentation?field=eventName`),
      fetchJson(`/api/v1/analytics/${projectId}/funnel`, {
        method: "POST",
        body: JSON.stringify({
          steps: [
            "view_home",
            "view_product_list",
            "view_product",
            "add_to_cart",
            "view_cart",
            "checkout_started",
            "purchase_completed"
          ]
        })
      }),
      fetchJson(`/api/v1/analytics-plus/${projectId}/preaggregated/daily`)
    ]);

    renderOverview(overview);
    renderFunnel(funnel);
    renderRetention(retention);
    renderPreaggregated(preaggregated);

    makeLineChart(
      "timeseriesChart",
      timeseries.series.map((x) => x.date),
      timeseries.series.map((x) => x.count),
      "Events"
    );

    makeBarChart(
      "topEventsChart",
      topEvents.map((x) => x.eventName),
      topEvents.map((x) => x.count),
      "Top Events"
    );

    makeLineChart(
      "dauChart",
      dau.series.map((x) => x.date),
      dau.series.map((x) => x.dau),
      "DAU"
    );

    makeLineChart(
      "wauChart",
      wau.series.map((x) => x.date),
      wau.series.map((x) => x.wau),
      "WAU"
    );

    makeLineChart(
      "mauChart",
      mau.series.map((x) => x.date),
      mau.series.map((x) => x.mau),
      "MAU"
    );

    makeBarChart(
      "segmentationChart",
      segmentation.segments.map((x) => x.segment),
      segmentation.segments.map((x) => x.count),
      "Segment Count"
    );
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

if (loadBtn) {
  loadBtn.addEventListener("click", loadDashboard);
}