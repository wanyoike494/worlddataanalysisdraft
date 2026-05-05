    (async () => {
    const CSV_URL = 'https://raw.githubusercontent.com/wanyoike494/Datasets/refs/heads/main/Population/worldPopulation19602024All.csv';

    // ── FETCH & PARSE ──
    let rawText;
    try {
      const res = await fetch(CSV_URL);
      rawText = await res.text();
    } catch(e) {
      document.getElementById('loading').innerHTML = `<div class="loader-text" style="color:#f87171">Failed to load dataset. Check network or CORS.</div>`;
      return;
    }

    const rows = d3.csvParse(rawText.replace(/^\uFEFF/, '')); // strip BOM
    const worldRow = rows.find(r => r['Country Name'] === 'World');
    if (!worldRow) {
      document.getElementById('loading').innerHTML = `<div class="loader-text" style="color:#f87171">World row not found in dataset.</div>`;
      return;
    }

    // Build year→value array
    const allYears = d3.range(1960, 2025);
    const fullData = allYears.map(y => ({
      year: y,
      pop: +worldRow[String(y)] || null
    })).filter(d => d.pop !== null && !isNaN(d.pop));

    const startPop = fullData[0].pop;
    const endPop = fullData[fullData.length - 1].pop;

    function fmt(n) {
      if (n >= 1e9) return (n/1e9).toFixed(2) + 'B';
      if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
      return d3.format(',')(n);
    }
    function fmtFull(n) { return d3.format(',.0f')(n); }

    document.getElementById('stat-start').textContent = fmt(startPop);
    document.getElementById('stat-end').textContent   = fmt(endPop);
    document.getElementById('stat-growth').textContent = (endPop/startPop).toFixed(2) + '×';

    // ── REVEAL CHART ──
    document.getElementById('loading').style.display = 'none';
    document.getElementById('chart-wrap').style.display = 'block';

    // ── DIMENSIONS ──
    const svg = d3.select('#chart-svg');
    const margin = { top: 20, right: 20, bottom: 36, left: 60 };

    let W, H, innerW, innerH;
    let xScale, yScale, lineGen, areaGen;
    let gClip, gArea, gGlow, gLine, gAnnot;

    function getDims() {
      const el = document.getElementById('chart-svg');
      W = el.parentElement.clientWidth;
      H = Math.min(Math.max(W * 0.55, 220), 480);
      innerW = W - margin.left - margin.right;
      innerH = H - margin.top - margin.bottom;
      // adjust left margin on mobile
      margin.left = W < 500 ? 48 : 60;
      innerW = W - margin.left - margin.right;
    }

    // state
    let yearStart = 1960, yearEnd = 2024;
    let animInterval = null, animSpeed = 900;
    let animYear = 1960;

    function filteredData() {
      return fullData.filter(d => d.year >= yearStart && d.year <= yearEnd);
    }

    // ── BUILD SVG ──
    let root, gX, gY, gGrid, tooltipDot, cursorLine;

    function buildSVG() {
      svg.selectAll('*').remove();
      getDims();
      svg.attr('width', W).attr('height', H);

      root = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      // clip
      svg.append('defs').append('clipPath').attr('id', 'plot-clip')
        .append('rect').attr('width', innerW).attr('height', innerH + 5).attr('y', -5);

      // gradient
      const defs = svg.select('defs');
      const grad = defs.append('linearGradient').attr('id','area-grad').attr('gradientUnits','userSpaceOnUse')
        .attr('x1',0).attr('x2',0).attr('y1',0).attr('y2',innerH);
      grad.append('stop').attr('offset','0%').attr('stop-color','var(--accent)').attr('stop-opacity',0.18);
      grad.append('stop').attr('offset','100%').attr('stop-color','var(--accent)').attr('stop-opacity',0);

      const lineGrad = defs.append('linearGradient').attr('id','line-grad').attr('gradientUnits','userSpaceOnUse')
        .attr('x1',0).attr('x2',innerW).attr('y1',0).attr('y2',0);
      lineGrad.append('stop').attr('offset','0%').attr('stop-color','var(--accent2)');
      lineGrad.append('stop').attr('offset','100%').attr('stop-color','var(--accent)');

      // grid group
      gGrid = root.append('g').attr('class','gridlines');
      gX = root.append('g').attr('class','axis axis--x').attr('transform',`translate(0,${innerH})`);
      gY = root.append('g').attr('class','axis axis--y');

      // clipped layer
      const clipped = root.append('g').attr('clip-path','url(#plot-clip)');
      gArea  = clipped.append('path').attr('class','area-path');
      gGlow  = clipped.append('path').attr('class','glow-line');
      gLine  = clipped.append('path').attr('class','line-path').attr('stroke','url(#line-grad)');

      // cursor line & dot (not clipped)
      cursorLine = root.append('line').attr('class','cursor-line').attr('y1',0).attr('y2',innerH).style('opacity',0);
      tooltipDot = root.append('circle').attr('class','tooltip-dot');
      gAnnot = root.append('g');
    }

    function updateScales(data) {
      xScale = d3.scaleLinear()
        .domain([yearStart, yearEnd])
        .range([0, innerW]);

      const [minP, maxP] = d3.extent(data, d => d.pop);
      const pad = (maxP - minP) * 0.1;
      yScale = d3.scaleLinear()
        .domain([Math.max(0, minP - pad), maxP + pad])
        .range([innerH, 0])
        .nice();

      lineGen = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.pop))
        .curve(d3.curveMonotoneX);

      areaGen = d3.area()
        .x(d => xScale(d.year))
        .y0(innerH)
        .y1(d => yScale(d.pop))
        .curve(d3.curveMonotoneX);
    }

    function renderAxes(data) {
      const tickCount = innerW < 350 ? 4 : 7;
      gX.call(
        d3.axisBottom(xScale)
          .ticks(tickCount)
          .tickFormat(d3.format('d'))
          .tickSize(4)
      );
      gX.select('.domain').attr('stroke','var(--border)');
      gX.selectAll('.tick line').attr('stroke','var(--border)');

      gY.call(
        d3.axisLeft(yScale)
          .ticks(5)
          .tickFormat(d => d >= 1e9 ? (d/1e9).toFixed(1)+'B' : (d/1e6).toFixed(0)+'M')
          .tickSize(4)
      );
      gY.select('.domain').attr('stroke','var(--border)');
      gY.selectAll('.tick line').attr('stroke','var(--border)');

      gGrid.call(
        d3.axisLeft(yScale).ticks(5).tickSize(-innerW).tickFormat('')
      );
      gGrid.select('.domain').remove();
      gGrid.selectAll('line').attr('stroke','var(--grid)').attr('stroke-dasharray','2,4');
    }

    function renderPaths(data) {
      gArea.datum(data).attr('d', areaGen).attr('fill','url(#area-grad)');
      gGlow.datum(data).attr('d', lineGen);
      gLine.datum(data).attr('d', lineGen);
    }

    function drawChart(animate = false) {
      const data = filteredData();
      if (!data.length) return;
      updateScales(data);
      renderAxes(data);

      if (animate) {
        // Animate line draw using stroke-dasharray trick
        const pathNode = gLine.node();
        const totalLen = pathNode.getTotalLength ? pathNode.getTotalLength() : 2000;
        renderPaths(data);
        gLine
          .attr('stroke-dasharray', totalLen + ' ' + totalLen)
          .attr('stroke-dashoffset', totalLen)
          .transition().duration(1600).ease(d3.easeCubicInOut)
          .attr('stroke-dashoffset', 0);
        gArea.style('opacity', 0).transition().delay(400).duration(1000).style('opacity',1);
        gGlow.style('opacity', 0).transition().delay(400).duration(1000).style('opacity',0.08);
      } else {
        renderPaths(data);
        gLine.attr('stroke-dasharray', null).attr('stroke-dashoffset', null);
      }

      document.getElementById('year-badge').textContent = `${yearStart}–${yearEnd}`;
    }

    // ── TOOLTIP ──
    const tooltip = document.getElementById('tooltip');
    const ttYear  = document.getElementById('tt-year');
    const ttPop   = document.getElementById('tt-pop');
    const ttGrowth = document.getElementById('tt-growth');

    function showTooltip(d, prevD, mx, my) {
      ttYear.textContent = d.year;
      ttPop.textContent  = fmtFull(d.pop);
      if (prevD) {
        const pct = ((d.pop - prevD.pop)/prevD.pop*100).toFixed(2);
        const sign = pct >= 0 ? '+' : '';
        ttGrowth.textContent = `${sign}${pct}% YoY`;
        ttGrowth.className = 'tooltip-growth ' + (pct >= 0 ? 'pos' : 'neg');
      } else {
        ttGrowth.textContent = '';
      }
      const card = document.getElementById('chart-wrap');
      const rect = card.getBoundingClientRect();
      let left = mx + 14, top = my - 55;
      if (left + 155 > rect.width) left = mx - 155;
      if (top < 0) top = 0;
      tooltip.style.left = left + 'px';
      tooltip.style.top  = top + 'px';
      tooltip.style.opacity = '1';
      tooltipDot.style.opacity = '1';
    }
    function hideTooltip() {
      tooltip.style.opacity = '0';
      tooltipDot.style.opacity = '0';
      cursorLine.style('opacity', 0);
    }

    function addHoverOverlay() {
      root.selectAll('.hover-overlay').remove();
      root.append('rect')
        .attr('class','hover-overlay')
        .attr('width', innerW).attr('height', innerH)
        .attr('fill','transparent')
        .on('mousemove touchmove', function(event) {
          event.preventDefault();
          const [mx] = event.touches ? d3.pointers(event, this)[0] : d3.pointer(event);
          const clampedX = Math.max(0, Math.min(innerW, mx));
          const yearHovered = xScale.invert(clampedX);
          const data = filteredData();
          const bisect = d3.bisector(d => d.year).left;
          const idx = bisect(data, yearHovered, 1);
          const d0 = data[idx - 1], d1 = data[idx];
          if (!d0) return;
          const d = d1 && Math.abs(d1.year - yearHovered) < Math.abs(d0.year - yearHovered) ? d1 : d0;
          const px = xScale(d.year), py = yScale(d.pop);
          tooltipDot.attr('cx', px).attr('cy', py);
          cursorLine.attr('x1', px).attr('x2', px).style('opacity',1);
          const prevD = data[data.indexOf(d) - 1];
          const [emx, emy] = event.touches ? d3.pointers(event, document.getElementById('chart-wrap'))[0] : [event.offsetX, event.offsetY];
          showTooltip(d, prevD, emx, emy);
        })
        .on('mouseleave touchend', hideTooltip);
    }

    // ── FULL RENDER ──
    function fullRender(animate = false) {
      buildSVG();
      drawChart(animate);
      addHoverOverlay();
      updateSliderFill();
    }

    fullRender(true);

    // ── RESIZE ──
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => fullRender(false), 150);
    });

    // ── SLIDER FILL ──
    function updateSliderFill() {
      const pStart = (yearStart - 1960) / (2024 - 1960) * 100;
      const pEnd   = (yearEnd   - 1960) / (2024 - 1960) * 100;
      document.getElementById('slider-fill').style.left  = pStart + '%';
      document.getElementById('slider-fill').style.width = (pEnd - pStart) + '%';
      document.getElementById('lbl-start').textContent = yearStart;
      document.getElementById('lbl-end').textContent   = yearEnd;
      document.getElementById('year-badge').textContent = `${yearStart}–${yearEnd}`;
    }

    const rangeStart = document.getElementById('range-start');
    const rangeEnd   = document.getElementById('range-end');

    function onRangeChange() {
      let s = +rangeStart.value, e = +rangeEnd.value;
      if (s > e - 3) {
        if (this === rangeStart) { s = e - 3; rangeStart.value = s; }
        else { e = s + 3; rangeEnd.value = e; }
      }
      yearStart = s; yearEnd = e;
      updateSliderFill();
      drawChart(false);
      addHoverOverlay();
    }

    rangeStart.addEventListener('input', onRangeChange);
    rangeEnd.addEventListener('input', onRangeChange);

    // ── PLAY ANIMATION ──
    const playBtn = document.getElementById('play-btn');
    const playIcon= document.getElementById('play-icon');
    const animBar = document.getElementById('anim-bar');
    const animWrap= document.getElementById('anim-bar-wrap');

    const PLAY_SVG  = '<path d="M3 2l11 6-11 6V2z"/>';
    const PAUSE_SVG = '<rect x="3" y="2" width="4" height="12"/><rect x="9" y="2" width="4" height="12"/>';
    const STOP_SVG  = PAUSE_SVG;

    function stopAnimation() {
      if (animInterval) { clearInterval(animInterval); animInterval = null; }
      playBtn.classList.remove('playing');
      playIcon.innerHTML = PLAY_SVG;
      animWrap.classList.remove('visible');
      animBar.style.width = '0%';
      animYear = yearStart;
    }

    function startAnimation() {
      stopAnimation();
      // Reset to show only first year, then grow
      const fullEnd = yearEnd;
      animYear = yearStart;
      playBtn.classList.add('playing');
      playIcon.innerHTML = PAUSE_SVG;
      animWrap.classList.add('visible');

      // Temporarily set end to start, then animate
      yearEnd = yearStart;
      drawChart(false);
      addHoverOverlay();

      animInterval = setInterval(() => {
        animYear++;
        yearEnd = animYear;
        rangeEnd.value = yearEnd;
        updateSliderFill();
        drawChart(false);
        addHoverOverlay();

        const pct = (animYear - yearStart) / (fullEnd - yearStart) * 100;
        animBar.style.width = pct + '%';

        if (animYear >= fullEnd) {
          stopAnimation();
          yearEnd = fullEnd;
          rangeEnd.value = yearEnd;
          updateSliderFill();
          drawChart(false);
          addHoverOverlay();
        }
      }, animSpeed);
    }

    playBtn.addEventListener('click', () => {
      if (animInterval) { stopAnimation(); drawChart(false); addHoverOverlay(); }
      else { startAnimation(); }
    });

    // ── SPEED BUTTONS ──
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        animSpeed = +this.dataset.speed;
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        if (animInterval) {
          const wasRunning = !!animInterval;
          stopAnimation();
          if (wasRunning) startAnimation();
        }
      });
    });
  })();