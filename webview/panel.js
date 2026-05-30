(function () {
  'use strict';

  const vscode = acquireVsCodeApi();

  // ─── Diagnostic Harness for Webview Runtime Errors ──────────────────────────
  window.onerror = function (message, source, lineno, colno, error) {
    const errorMsg = `[Webview Error] ${message} at ${source}:${lineno}:${colno}`;
    console.error(errorMsg, error);

    const banner = document.createElement('div');
    banner.style.position = 'absolute';
    banner.style.top = '0';
    banner.style.left = '0';
    banner.style.right = '0';
    banner.style.background = 'rgba(255, 0, 0, 0.95)';
    banner.style.color = '#ffffff';
    banner.style.padding = '8px 12px';
    banner.style.zIndex = '999999';
    banner.style.fontSize = '12px';
    banner.style.fontFamily = 'monospace';
    banner.style.wordBreak = 'break-all';
    banner.style.maxHeight = '200px';
    banner.style.overflowY = 'auto';
    banner.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
    banner.textContent = errorMsg + (error ? '\n' + (error.stack || error) : '');

    document.body.appendChild(banner);
  };

  const body = document.body;

  // Parse configurations from single-quoted JSON injected in body data-attributes
  window.MONSTER_SPRITES = JSON.parse(body.dataset.spritesMap || '{}');
  window.IS_FLYER_MAP = JSON.parse(body.dataset.flyerMap || '{}');

  const monsterStage = document.getElementById('monster-stage');
  const moodFx = document.getElementById('mood-fx');
  const moodLabel = document.getElementById('mood-label');
  const statScore = document.getElementById('stat-score');
  const statEvolution = document.getElementById('stat-evolution');

  // ─── Monster Configuration Data ─────────────────────────────────────────────
  const MONSTER_CONFIGS = {
    godzilla: {
      accent: '#00e5ff',
      glow: 'rgba(0, 229, 255, 0.2)',
      animationSpeed: 0.6,
      isFlyer: false,
      clickMessages: [
        'SKREEEONK!',
        'The Alpha observes.',
        'Atomic silence.',
        'Staring down the code.'
      ],
      pokeMessages: [
        'RAAWR!',
        'Atomic breath charging...',
        'Unacceptable.',
        'Ow! Watch it!'
      ]
    },
    kong: {
      accent: '#ffb700',
      glow: 'rgba(255, 183, 0, 0.2)',
      animationSpeed: 1.4,
      isFlyer: false,
      clickMessages: [
        '*grunt*',
        'Watching...',
        'Skull Island calm.',
        '*chest pound*'
      ],
      pokeMessages: [
        'RAAAAGH!',
        '*beats chest furiously*',
        'KONG ANGRY!',
        'FIX BUGS NOW!!!'
      ]
    },
    ghidorah: {
      accent: '#ffee00',
      glow: 'rgba(255, 238, 0, 0.25)',
      animationSpeed: 1.1,
      isFlyer: true,
      clickMessages: [
        '...we watch...',
        'Three minds as one.',
        'The void awaits.',
        '*static*'
      ],
      pokeMessages: [
        'DESTROY!!!',
        'ERRORS! CHAOS! RUIN!',
        'LIGHTNING STRIKE!',
        'ALL WILL BURN!'
      ]
    },
    rodan: {
      accent: '#ff4400',
      glow: 'rgba(255, 68, 0, 0.2)',
      animationSpeed: 2.0,
      isFlyer: true,
      clickMessages: [
        '*wind rush*',
        'Scanning horizon...',
        'Alert. Always alert.',
        '*wing rustle*'
      ],
      pokeMessages: [
        'SCREEEE!',
        'FIRE DEMON WAKES!',
        'YOU WILL BURN!',
        'FASTER! NO ERRORS!'
      ]
    },
    mechagodzilla: {
      accent: '#ff0000',
      glow: 'rgba(255, 0, 0, 0.2)',
      animationSpeed: 1.0,
      isFlyer: false,
      clickMessages: [
        '*mechanical whir*',
        'Systems nominal.',
        'Scanning code...',
        'Efficiency at 98%.'
      ],
      pokeMessages: [
        'ERRORS DETECTED.',
        'EXTERMINATE BUGS.',
        'SYSTEM MALFUNCTION.',
        'PROCEED TO ELIMINATE.'
      ]
    },
    muto: {
      accent: '#ff0033',
      glow: 'rgba(255, 0, 51, 0.2)',
      animationSpeed: 1.5,
      isFlyer: false,
      clickMessages: [
        '*clicking sounds*',
        'Seeking energy...',
        'Radiation levels optimal.',
        '...'
      ],
      pokeMessages: [
        '*screech*',
        'ENERGY DEPLETED!',
        'NETWORK DISRUPTED!',
        'ATTACK!'
      ]
    },
    scylla: {
      accent: '#00ffff',
      glow: 'rgba(0, 255, 255, 0.2)',
      animationSpeed: 1.2,
      isFlyer: false,
      clickMessages: [
        '*chitter*',
        'Freezing the environment...',
        'Scuttling around.',
        'Cold is good.'
      ],
      pokeMessages: [
        '*hiss*',
        'TOO HOT!',
        'MELTING AVOIDED!',
        'FREEZE THEM ALL!'
      ]
    }
  };

  // ─── Active Monsters Array ──────────────────────────────────────────────────
  let activeMonsters = [];

  // ─── Monster Instance Class ─────────────────────────────────────────────────
  class Monster {
    constructor(id, x, instanceId) {
      this.id = id;
      this.instanceId = instanceId;
      this.config = MONSTER_CONFIGS[id] || MONSTER_CONFIGS.godzilla;
      this.isFlyer = !!this.config.isFlyer;

      // Coordinate & Movement states
      const stageWidth = monsterStage.clientWidth || 300;
      this.currentX = x !== undefined ? x : (stageWidth / 2);
      if (isNaN(this.currentX) || this.currentX <= 0) {
        this.currentX = 50 + Math.random() * (stageWidth - 100);
      }
      this.targetX = this.currentX;
      this.facingRight = Math.random() < 0.5;
      this.walkCyclePhase = Math.random() * 10;
      this.baseBottom = this.isFlyer ? 80 : 20; // sit higher if flying
      this.scale = this.id === 'ghidorah' ? 1.2 : 1.0;

      this.currentMood = 'idle';
      this.isMoving = false;

      // Handles / Timers
      this.wanderTimeout = null;
      this.speechTimer = null;
      this.sleepZInterval = null;
      this.reactionTimer = null;

      // Image Asset loading
      this.imgLoaded = false;
      this.spriteSource = null;
      this.spritesheetImg = new Image();
      this.spritesheetImg.onload = () => {
        this.spriteSource = this.spritesheetImg;
        this.imgLoaded = true;
      };
      this.spritesheetImg.onerror = (err) => {
        const errorMsg = `Image loading failed for "${id}". Checked URI: "${this.spritesheetImg.src}"`;
        window.onerror(errorMsg, 'panel.js', 190, 0, err);
      };
      // Load spritesheet path from the injected window sprites mapping
      this.spritesheetImg.src = window.MONSTER_SPRITES[id] || '';

      // Create DOM elements
      this.createDom();
      this.startWandering();
    }

    createDom() {
      // Container
      this.element = document.createElement('div');
      this.element.className = 'monster-instance';
      this.element.style.left = `${this.currentX}px`;
      this.element.style.bottom = `${this.baseBottom}px`;
      this.element.style.width = `${48 * this.scale}px`;
      this.element.style.height = `${48 * this.scale}px`;
      this.element.style.setProperty('--accent', this.config.accent);
      this.element.style.setProperty('--glow', this.config.glow);

      // Flip container (CSS transform hardware accelerated)
      this.flipElement = document.createElement('div');
      this.flipElement.className = 'monster-flip';
      this.flipElement.style.transform = this.facingRight ? 'scaleX(-1)' : 'scaleX(1)';

      // Elastic wrapper
      this.wrapperElement = document.createElement('div');
      this.wrapperElement.className = 'monster-wrapper';

      // 512x512 High-DPI canvas
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'monster-canvas';
      this.canvas.width = 512;
      this.canvas.height = 512;

      // Speech bubble
      this.speechBubble = document.createElement('div');
      this.speechBubble.className = 'speech-bubble';

      // Assemble DOM
      this.wrapperElement.appendChild(this.canvas);
      this.flipElement.appendChild(this.wrapperElement);
      this.element.appendChild(this.flipElement);
      this.element.appendChild(this.speechBubble);
      monsterStage.appendChild(this.element);

      // Interactive Click Event
      this.element.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onClick();
      });
    }

    getRenderState() {
      if (['typing', 'alert', 'angry', 'victory', 'happy'].includes(this.currentMood)) return 'react';

      if (Math.abs(this.currentX - this.targetX) > 2) {
        return this.isFlyer ? 'flying' : 'walk';
      }
      return this.isFlyer ? 'hover' : 'idle';
    }

    startWandering() {
      clearTimeout(this.wanderTimeout);
      this.wanderLoop();
    }

    wanderLoop() {
      if (['typing', 'alert', 'angry', 'victory'].includes(this.currentMood)) {
        this.isMoving = false;
        this.wanderTimeout = setTimeout(() => this.wanderLoop(), 1000);
        return;
      }

      // 40% chance to pause and rest
      if (Math.random() < 0.4) {
        this.isMoving = false;
        this.wanderTimeout = setTimeout(() => this.wanderLoop(), 1500 + Math.random() * 2500);
        return;
      }

      const stageWidth = monsterStage.clientWidth || 300;
      const padding = 12;
      const targetXVal = padding + Math.random() * (stageWidth - padding * 2);

      this.targetX = targetXVal;
      this.isMoving = true;

      const dist = Math.abs(this.targetX - this.currentX);
      const speed = this.isFlyer ? 10 : 6;
      const duration = dist / speed;

      this.wanderTimeout = setTimeout(() => this.wanderLoop(), (duration * 1000) + 1500 + Math.random() * 2000);
    }

    update(dt) {
      if (['typing', 'alert', 'angry', 'victory'].includes(this.currentMood)) {
        this.targetX = this.currentX;
        return;
      }

      const dist = this.targetX - this.currentX;
      if (Math.abs(dist) > 2) {
        const dir = Math.sign(dist);
        const moveSpeed = this.isFlyer ? 10 : 6;
        this.currentX += dir * moveSpeed * dt;
        this.facingRight = dir > 0;

        this.flipElement.style.transform = this.facingRight ? 'scaleX(-1)' : 'scaleX(1)';

        const phaseMultiplier = this.isFlyer ? 0.08 : 0.12;
        this.walkCyclePhase += Math.abs(moveSpeed * dt) * phaseMultiplier;
      } else {
        this.currentX = this.targetX;
        this.isMoving = false;
      }

      const stageWidth = monsterStage.clientWidth || 300;
      const padding = 12;
      if (this.currentX < padding) this.currentX = padding;
      if (this.currentX > stageWidth - padding) this.currentX = stageWidth - padding;

      this.element.style.left = `${Math.round(this.currentX)}px`;

      // Vertical bobbing for flyers
      let hoverOffset = 0;
      if (this.isFlyer) {
        const time = performance.now();
        // Shift speed slightly depending on name length so multiple flyers are out of sync
        const frequency = 0.0035 + (this.id.length * 0.0001);
        hoverOffset = 5 * Math.sin(time * frequency);
      }
      this.element.style.bottom = `${this.baseBottom + hoverOffset}px`;
    }

    draw(time) {
      if (!this.imgLoaded || !this.spriteSource) return;

      const ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const renderState = this.getRenderState();

      let rowIdx = 0;
      let colIdx = 0;

      if (renderState === 'walk' || renderState === 'flying') {
        rowIdx = 1;
        colIdx = Math.floor(this.walkCyclePhase) % 4;
      } else if (renderState === 'react') {
        rowIdx = 2;
        colIdx = Math.floor(time / 100) % 4;
      } else {
        rowIdx = 0;
        colIdx = Math.floor(time / 250) % 4;
      }

      ctx.imageSmoothingEnabled = false;

      // Draw the 256x256 frame from the 1024x1024 sheet onto the 512x512 canvas
      ctx.drawImage(
        this.spriteSource,
        colIdx * 256, rowIdx * 256, 256, 256,
        0, 0, this.canvas.width, this.canvas.height
      );
    }

    setMood(mood, message) {
      if (mood === this.currentMood) {
        if (message) this.showSpeechBubble(message);
        return;
      }

      this.currentMood = mood;

      if (mood !== 'idle') {
        this.targetX = this.currentX;
        this.isMoving = false;
      }

      if (message) this.showSpeechBubble(message);

      if (mood === 'victory' || mood === 'angry') {
        this.spawnParticles(mood);
      }
    }

    showSpeechBubble(text) {
      clearTimeout(this.speechTimer);
      this.speechBubble.textContent = text;
      this.speechBubble.classList.add('visible');
      this.speechTimer = setTimeout(() => {
        this.speechBubble.classList.remove('visible');
      }, 2500);
    }



    spawnParticles(mood) {
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const p = document.createElement('div');
          p.className = 'particle';
          p.style.background = mood === 'victory' ? '#ffcc00' : '#ff3300';

          const angle = Math.random() * Math.PI * 2;
          const dist = 18 + Math.random() * 22;
          p.style.setProperty('--px', `${Math.cos(angle) * dist}px`);
          p.style.setProperty('--py', `${Math.sin(angle) * dist}px`);

          p.style.left = '12px';
          p.style.top = '12px';
          p.style.animation = 'particleFloat 0.8s ease-out forwards';

          this.element.appendChild(p);
          setTimeout(() => p.remove(), 800);
        }, i * 60);
      }
    }

    onClick() {
      const msgs = this.config.clickMessages;
      const msg = msgs[Math.floor(Math.random() * msgs.length)];

      this.setMood('happy', msg);

      clearTimeout(this.reactionTimer);
      this.reactionTimer = setTimeout(() => {
        this.setMood('idle');
      }, 2500);
    }

    onPoke() {
      const msgs = this.config.pokeMessages;
      const msg = msgs[Math.floor(Math.random() * msgs.length)];

      this.setMood('angry', msg);

      clearTimeout(this.reactionTimer);
      this.reactionTimer = setTimeout(() => {
        this.setMood('idle');
      }, 2000);
    }

    destroy() {
      clearTimeout(this.wanderTimeout);
      clearTimeout(this.speechTimer);
      clearTimeout(this.reactionTimer);
      clearInterval(this.sleepZInterval);
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
  }

  // ─── Helper Functions ───────────────────────────────────────────────────────
  function spawnMonster(id, x, instanceId) {
    const monster = new Monster(id, x, instanceId);
    activeMonsters.push(monster);
    return monster;
  }

  function clearAllMonsters() {
    activeMonsters.forEach(m => m.destroy());
    activeMonsters = [];
  }

  function updateActiveTheme(id) {
    const config = MONSTER_CONFIGS[id] || MONSTER_CONFIGS.godzilla;
    document.documentElement.style.setProperty('--accent', config.accent);
    document.documentElement.style.setProperty('--glow', config.glow);
  }

  function showFxPop(text) {
    moodFx.textContent = text;
    moodFx.style.animation = 'none';
    moodFx.offsetHeight; // reflow
    moodFx.style.animation = 'fxPop 1s ease-out forwards';
  }

  // ─── Messaging ─────────────────────────────────────────────────────────────
  window.addEventListener('message', (event) => {
    const message = event.data;
    if (!message) return;

    if (message.type === 'UPDATE_STATE') {
      const currentMood = message.mood || 'idle';
      if (typeof moodLabel !== 'undefined' && moodLabel) moodLabel.textContent = currentMood.toUpperCase();
      if (typeof statScore !== 'undefined' && statScore) statScore.textContent = message.activityScore || 0;
      if (typeof statEvolution !== 'undefined' && statEvolution) statEvolution.textContent = (message.evolution || 'BASE').toUpperCase();

      updateActiveTheme(message.monster);

      if (message.message) {
        showFxPop(message.message);
      }

      const match = activeMonsters.filter(m => m.id === message.monster);
      if (match.length > 0) {
        match.forEach(m => m.setMood(message.mood, message.message));
      } else if (activeMonsters.length > 0) {
        activeMonsters[0].setMood(message.mood, message.message);
      }
    } else if (message.type === 'SWITCH_MONSTER') {
      updateActiveTheme(message.monster);
    } else if (message.type === 'ADD_MONSTER') {
      const stageWidth = monsterStage.clientWidth || 300;
      const randomX = 12 + Math.random() * (stageWidth - 24);
      spawnMonster(message.monster, randomX, message.instanceId);
    } else if (message.type === 'REMOVE_MONSTER') {
      const targetIndex = activeMonsters.findIndex(m => m.instanceId === message.instanceId);
      if (targetIndex !== -1) {
        activeMonsters[targetIndex].destroy();
        activeMonsters.splice(targetIndex, 1);
      }
    } else if (message.type === 'POKE_MONSTERS') {
      showFxPop('POW!');
      activeMonsters.forEach(m => m.onPoke());
    } else if (message.type === 'CLEAR_MONSTERS') {
      clearAllMonsters();
    }
  });

  // ─── Events ───────────────────────────────────────────────────────────────

  // Handle stage bounds on resize
  window.addEventListener('resize', () => {
    const stageWidth = monsterStage.clientWidth || 300;
    const padding = 12;
    activeMonsters.forEach(m => {
      if (m.currentX > stageWidth - padding) {
        m.currentX = stageWidth - padding;
        m.targetX = m.currentX;
      }
    });
  });

  // ─── Game Loop ──────────────────────────────────────────────────────────────
  let lastTime = performance.now();

  function frameLoop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    activeMonsters.forEach(m => {
      m.update(dt);
      m.draw(time);
    });

    requestAnimationFrame(frameLoop);
  }

  // ─── Initialize ────────────────────────────────────────────────────────────
  const initialMonster = body.dataset.monster || 'godzilla';
  updateActiveTheme(initialMonster);

  // Spawn the initial default monster
  spawnMonster(initialMonster, undefined, 'instance-0');

  requestAnimationFrame(frameLoop);

})();
