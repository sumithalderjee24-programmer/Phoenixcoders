/**
 * CampusFix - Interactive Modern Canvas & Particle Mesh Background
 * Lightweight, high-performance interactive physics animation with mouse gravity,
 * geometric grid accents, connecting nodes, and reactive ripples.
 */
(function () {
  'use strict';

  function initInteractiveBg() {
    // Check if background container already exists
    if (document.querySelector('.cf-interactive-bg')) return;

    // Create wrapper element
    const bgContainer = document.createElement('div');
    bgContainer.className = 'cf-interactive-bg';
    bgContainer.setAttribute('aria-hidden', 'true');

    // Create campus image texture layer with delicate gradient overlay
    const imgOverlay = document.createElement('div');
    imgOverlay.className = 'cf-bg-campus-layer';
    bgContainer.appendChild(imgOverlay);

    // Create dynamic color mesh blobs
    const orb1 = document.createElement('div');
    orb1.className = 'cf-orb cf-orb-1';
    const orb2 = document.createElement('div');
    orb2.className = 'cf-orb cf-orb-2';
    const orb3 = document.createElement('div');
    orb3.className = 'cf-orb cf-orb-3';
    bgContainer.appendChild(orb1);
    bgContainer.appendChild(orb2);
    bgContainer.appendChild(orb3);

    // Create Canvas for Interactive Particle Constellation
    const canvas = document.createElement('canvas');
    canvas.className = 'cf-particle-canvas';
    bgContainer.appendChild(canvas);

    // Insert as the first element in body so it stays behind everything
    document.body.insertBefore(bgContainer, document.body.firstChild);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles = [];
    let dpr = window.devicePixelRatio || 1;

    // Mouse tracker
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 140,
      active: false
    };

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      initParticles();
    }

    // Particle class
    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.baseRadius = Math.random() * 2.2 + 1.2;
        this.radius = this.baseRadius;
        
        // Dynamic colors: Indigo, Purple, Pink, Emerald, Amber
        const hues = [245, 270, 330, 160, 40];
        this.hue = hues[Math.floor(Math.random() * hues.length)];
        this.alpha = Math.random() * 0.45 + 0.25;
        this.pulseSpeed = 0.02 + Math.random() * 0.02;
        this.pulseAngle = Math.random() * Math.PI * 2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around borders
        if (this.x < -20) this.x = width + 20;
        else if (this.x > width + 20) this.x = -20;
        if (this.y < -20) this.y = height + 20;
        else if (this.y > height + 20) this.y = -20;

        // Subtle radius pulse
        this.pulseAngle += this.pulseSpeed;
        this.radius = this.baseRadius + Math.sin(this.pulseAngle) * 0.8;

        // Interactive mouse physics: gentle push away or glow
        if (mouse.active) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (1 - dist / mouse.radius);
            const angle = Math.atan2(dy, dx);
            this.x -= Math.cos(angle) * force * 3;
            this.y -= Math.sin(angle) * force * 3;
            this.radius = this.baseRadius + force * 2.5;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.8, this.radius), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 85%, 60%, ${this.alpha})`;
        ctx.shadowColor = `hsla(${this.hue}, 90%, 65%, 0.5)`;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow
      }
    }

    function initParticles() {
      // Density-based count (balanced performance)
      const count = Math.min(Math.floor((width * height) / 18000), 55);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }

    // Interactive connection lines between nearby particles
    function drawConnections() {
      const maxDistance = 125;
      const mouseDistThreshold = mouse.radius;

      for (let i = 0; i < particles.length; i++) {
        // Connect to mouse if nearby
        if (mouse.active) {
          const dxM = mouse.x - particles[i].x;
          const dyM = mouse.y - particles[i].y;
          const distM = Math.sqrt(dxM * dxM + dyM * dyM);
          if (distM < mouseDistThreshold) {
            const alphaM = (1 - distM / mouseDistThreshold) * 0.45;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(124, 58, 237, ${alphaM})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }

        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.22;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }
    }

    let animationFrameId;
    function animate() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }

      drawConnections();
      animationFrameId = requestAnimationFrame(animate);
    }

    // Mouse & Touch events
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      mouse.active = false;
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      resize();
    });

    // Start
    resize();
    animate();
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInteractiveBg);
  } else {
    initInteractiveBg();
  }
})();
