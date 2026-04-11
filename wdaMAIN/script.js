const drawLineChart = (canvasId, points, stroke = '#2d6cb2', fill = 'rgba(45,108,178,0.16)') => {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const parent = canvas.parentElement;
  const width = parent.clientWidth;
  const height = parent.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const padding = 30;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  ctx.strokeStyle = '#dbe4f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  ctx.beginPath();
  points.forEach((val, idx) => {
    const x = padding + (chartW / (points.length - 1)) * idx;
    const y = padding + chartH - val * chartH;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  const lastX = padding + chartW;
  const lastY = padding + chartH - points[points.length - 1] * chartH;

  ctx.lineTo(lastX, padding + chartH);
  ctx.lineTo(padding, padding + chartH);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.beginPath();
  points.forEach((val, idx) => {
    const x = padding + (chartW / (points.length - 1)) * idx;
    const y = padding + chartH - val * chartH;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
  ctx.fillStyle = stroke;
  ctx.fill();
};

const renderCharts = () => {
  drawLineChart('populationChart', [0.35, 0.45, 0.56, 0.65, 0.73, 0.82]);
  drawLineChart('africaChart', [0.42, 0.5, 0.58, 0.68, 0.75], '#2d9254', 'rgba(45,146,84,0.16)');
};

window.addEventListener('load', renderCharts);
window.addEventListener('resize', renderCharts);

const cards = document.querySelectorAll('.card');
cards.forEach((card, idx) => {
  card.style.animation = `fadeInUp 500ms ease ${idx * 60}ms both`;
});
