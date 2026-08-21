// charts.js – Simple Chart.js integration for analysis features
// This file defines functions to render placeholder charts for the new analysis section.
// Real data should be passed from app.js after calculations.

// Ensure Chart.js is loaded (it will be added via CDN in index.html)
function renderFormTrendChart() {
  const ctx = document.getElementById('formTrendChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['M5', 'M4', 'M3', 'M2', 'M1'], // last 5 matches
      datasets: [{
        label: 'Form Trend (Points)',
        data: [3, 1, 0, 3, 1], // placeholder points per match
        borderColor: 'var(--accent-cyan)',
        backgroundColor: 'rgba(0,119,182,0.1)',
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, suggestedMax: 3 } }
    }
  });
}

function renderXGTimelineChart() {
  const ctx = document.getElementById('xGTimelineChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['M5', 'M4', 'M3', 'M2', 'M1'],
      datasets: [{
        label: 'xG',
        data: [1.2, 1.8, 0.9, 1.5, 1.1],
        backgroundColor: 'var(--accent-emerald)'
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

function renderPossessionChart() {
  const ctx = document.getElementById('possessionChart').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Home', 'Away'],
      datasets: [{
        data: [55, 45],
        backgroundColor: ['var(--accent-cyan)', 'var(--accent-amber)']
      }]
    },
    options: { responsive: true, cutout: '70%' }
  });
}

function renderPlayerRatingChart() {
  const ctx = document.getElementById('playerRatingChart').getContext('2d');
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Pass', 'Shot', 'Defense', 'Physical', 'Dribble'],
      datasets: [{
        label: 'Player Rating',
        data: [78, 85, 70, 80, 73],
        borderColor: 'var(--accent-violet)',
        backgroundColor: 'rgba(109,40,217,0.1)',
        fill: true
      }]
    },
    options: { responsive: true, scales: { r: { beginAtZero: true, max: 100 } } }
  });
}

function renderHeatmap() {
  const container = document.getElementById('heatmapContainer');
  container.innerHTML = '<p style="color:var(--text-primary);font-size:14px;">Heatmap placeholder – integrate a proper library for shot maps.</p>';
}

function renderConfidenceMeter() {
  const container = document.getElementById('confidenceMeter');
  container.innerHTML = `<div style="display:flex;align-items:center;gap:8px;">
    <span style="font-weight:800;color:var(--accent-emerald);">AI Confidence</span>
    <div style="flex:1;height:8px;background:var(--border-glass);border-radius:4px;overflow:hidden;">
      <div style="width:85%;height:100%;background:var(--accent-emerald);"></div>
    </div>
    <span style="font-weight:600;color:var(--text-secondary);">85%</span>
  </div>`;
}

// Export functions to global namespace for app.js to call
window.GolanalyzCharts = {
  renderFormTrendChart,
  renderXGTimelineChart,
  renderPossessionChart,
  renderPlayerRatingChart,
  renderHeatmap,
  renderConfidenceMeter
};
