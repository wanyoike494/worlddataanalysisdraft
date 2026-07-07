// ── Scroll reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        e.target.style.transitionDelay = (i * 0.08) + 's';
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // ── Stat counter animation
  function animateCounter(el, target, suffix = '') {
    let start = 0;
    const duration = 1800;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const nums = e.target.querySelectorAll('.stat-num');
        const data = [{ val: 100, suffix: '+' }, { val: 150, suffix: '' }, { val: 50, suffix: '' }];
        nums.forEach((n, i) => animateCounter(n, data[i].val, data[i].suffix));
        statsObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  const statsBar = document.querySelector('.stats-bar');
  if (statsBar) statsObserver.observe(statsBar);

  // ── Animate bar fills & temp fills on page load (hero is visible immediately)
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.querySelectorAll('.bar-fill, .temp-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.w + '%';
      });
    }, 600);
  });

  // ── Search shimmer on focus
  const searchInput = document.querySelector('.search-wrap input');
  if (searchInput) {
    searchInput.addEventListener('focus', () => {
      searchInput.parentElement.style.transform = 'scale(1.01)';
    });
    searchInput.addEventListener('blur', () => {
      searchInput.parentElement.style.transform = 'scale(1)';
    });
  }

  // ── Pulse population counter
  let popCount = 8120000000;
  const popEl = document.getElementById('pop-counter');
  if (popEl) {
    setInterval(() => {
      popCount += Math.floor(Math.random() * 3) + 1;
      const b = (popCount / 1e9).toFixed(2);
      popEl.textContent = b + 'B';
    }, 800);
  }
  // ── Hover lift for inline dark cards
  document.querySelectorAll('.hw-wave').forEach(card => {
    card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-3px)'; card.style.boxShadow = 'var(--shadow-md)'; });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.boxShadow = ''; });
  });

 