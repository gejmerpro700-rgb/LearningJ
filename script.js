// ==========================================================================
// JAVA LEAGUE — CLIENT LOGIC & API SYNC
// ==========================================================================

// Константы и локальное состояние по умолчанию
const LOCAL_STORAGE_KEY = 'javaLeagueState';

let state = {
  points: 0,
  friend: 0,
  completed: [],
  tasks: {},
  level: 0,
  hours: 0,
  scoreHistory: [],
  weeks: [],
  stages: [],
  projects: []
};

let isServerOnline = false;
let soundEnabled = true;

// Web Audio API синтезатор звуковых эффектов (без необходимости внешних файлов)
const audioCtx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  ? new (window.AudioContext || window.webkitAudioContext)()
  : null;

function playSound(type) {
  if (!soundEnabled || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'success') {
      // Приятный мажорный перезвон (завершение задачи/недели)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'alarm') {
      // Сигнал окончания таймера 2 часов
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1174.66, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (e) {
    console.debug('Audio error:', e);
  }
}

// Селекторы
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Уведомления (Toast)
function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

// Загрузка состояния из localStorage
function loadLocalState() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
    }
  } catch (e) {
    console.error('Ошибка чтения localStorage:', e);
  }
}

// Сохранение в localStorage
function saveLocalState() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Ошибка записи localStorage:', e);
  }
}

// Клиентский API слой
const api = {
  async checkServer() {
    try {
      const res = await fetch('/api/health', { method: 'GET', cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        isServerOnline = data.status === 'ok';
      } else {
        isServerOnline = false;
      }
    } catch {
      isServerOnline = false;
    }
    updateServerStatusUI();
    return isServerOnline;
  },

  async fetchState() {
    if (!isServerOnline) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(`/api/state?date=${today}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          state.points = json.data.points ?? state.points;
          state.friend = json.data.friend ?? state.friend;
          state.hours = json.data.hours ?? state.hours;
          state.level = json.data.level ?? state.level;
          state.completed = json.data.completed || state.completed;
          state.tasks = json.data.tasks || state.tasks;
          state.scoreHistory = json.data.scoreHistory || [];
          if (json.data.weeks?.length) state.weeks = json.data.weeks;
          if (json.data.stages?.length) state.stages = json.data.stages;
          if (json.data.projects?.length) state.projects = json.data.projects;
          saveLocalState();
        }
      }
    } catch (e) {
      console.warn('API error, working offline:', e);
    }
  },

  async toggleWeek(weekNum) {
    if (isServerOnline) {
      try {
        const res = await fetch('/api/weeks/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weekNumber: weekNum })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.state) {
            state.points = json.state.points;
            state.completed = json.state.completed;
            state.scoreHistory = json.state.scoreHistory || [];
            saveLocalState();
            return json.isCompleted;
          }
        }
      } catch (e) {
        console.warn('Sync failed, toggling locally:', e);
      }
    }
    // Локальный режим
    const idx = state.completed.indexOf(weekNum);
    let done = false;
    if (idx >= 0) {
      state.completed.splice(idx, 1);
      state.points = Math.max(0, state.points - 30);
      done = false;
    } else {
      state.completed.push(weekNum);
      state.points += 30;
      done = true;
    }
    saveLocalState();
    return done;
  },

  async toggleDailyTask(taskKey) {
    const today = new Date().toISOString().slice(0, 10);
    if (isServerOnline) {
      try {
        const res = await fetch('/api/tasks/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskKey, date: today })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.state) {
            state.points = json.state.points;
            state.hours = json.state.hours;
            state.tasks = json.state.tasks;
            state.scoreHistory = json.state.scoreHistory || [];
            saveLocalState();
            return json.done;
          }
        }
      } catch (e) {
        console.warn('Sync failed, toggling task locally:', e);
      }
    }
    // Локальный режим
    state.tasks[taskKey] = !state.tasks[taskKey];
    const isDone = !!state.tasks[taskKey];
    const hourDelta = taskKey === 'practice' ? 1 : 0.5;
    if (isDone) {
      state.points += 10;
      state.hours += hourDelta;
    } else {
      state.points = Math.max(0, state.points - 10);
      state.hours = Math.max(0, state.hours - hourDelta);
    }
    saveLocalState();
    return isDone;
  },

  async addScore(userId, points, reason) {
    if (isServerOnline) {
      try {
        const res = await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: userId, points, reason })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            state.points = json.data.points;
            state.friend = json.data.friend;
            state.scoreHistory = json.data.scoreHistory || [];
            saveLocalState();
            return;
          }
        }
      } catch (e) {
        console.warn('Sync failed, adding score locally:', e);
      }
    }
    // Локальный режим
    const delta = Number(points) || 0;
    if (userId === 'friend') {
      state.friend = Math.max(0, state.friend + delta);
    } else {
      state.points = Math.max(0, state.points + delta);
    }
    state.scoreHistory.unshift({
      id: Date.now(),
      user_id: userId,
      points: delta,
      reason: reason || (delta >= 0 ? `+${delta} XP` : `${delta} XP`),
      created_at: new Date().toISOString()
    });
    saveLocalState();
  },

  async updateLevel(level) {
    const lvl = Math.max(0, Math.min(5, Number(level)));
    state.level = lvl;
    saveLocalState();

    if (isServerOnline) {
      try {
        await fetch('/api/level', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: lvl })
        });
      } catch (e) {
        console.warn('Failed to sync level:', e);
      }
    }
  },

  async addStudyHours(hours) {
    state.hours += hours;
    saveLocalState();
    if (isServerOnline) {
      try {
        await fetch('/api/hours', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hours })
        });
      } catch (e) {
        console.warn('Failed to sync hours:', e);
      }
    }
  },

  async resetAll() {
    if (isServerOnline) {
      try {
        await fetch('/api/reset', { method: 'POST' });
      } catch (e) {
        console.warn('Reset error:', e);
      }
    }
    state.points = 0;
    state.friend = 0;
    state.completed = [];
    state.tasks = {};
    state.level = 0;
    state.hours = 0;
    state.scoreHistory = [];
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    saveLocalState();
  }
};

// Обновление плашки синхронизации
function updateServerStatusUI() {
  const syncWrap = $('#syncStatus');
  const syncText = $('#syncText');
  if (!syncWrap || !syncText) return;

  if (isServerOnline) {
    syncWrap.className = 'sync-status online';
    syncText.textContent = 'Сервер и БД активны';
  } else {
    syncWrap.className = 'sync-status offline';
    syncText.textContent = 'Офлайн (локальный режим)';
  }
}

// Навигация по секциям
function goToSection(sectionId) {
  playSound('click');
  $$('.page').forEach(p => p.classList.toggle('active', p.id === sectionId));
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.section === sectionId));
  $$('.bottom-nav-item').forEach(n => n.classList.toggle('active', n.dataset.section === sectionId));

  const titles = {
    dashboard: 'Java League',
    roadmap: 'Дорожная карта',
    weeks: 'Учебные недели',
    projects: 'Проекты',
    scores: 'XP Баттл',
    rules: 'Система обучения'
  };

  const pageTitle = $('#pageTitle');
  if (pageTitle && titles[sectionId]) {
    pageTitle.textContent = titles[sectionId];
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Описания уровней понимания
const skillLevelDescriptions = {
  0: '0/5 — Тёмный лес. Тема незнакома или концепции непонятны.',
  1: '1/5 — Понял общую теорию и термины, но писать код сложно.',
  2: '2/5 — Могу решить простую задачу с открытой документацией/видео.',
  3: '3/5 — Могу реализовать задачу самостоятельно без подглядываний.',
  4: '4/5 — Могу легко объяснить устройство кода и ошибки другу.',
  5: '5/5 — Полное мастерство. Пишу чистый код в проекте без подсказок.'
};

// Рендеринг Roadmap
function renderRoadmap() {
  const container = $('#roadmapList');
  if (!container || !state.stages.length) return;

  container.innerHTML = state.stages.map((stage, idx) => {
    const stageWeeks = state.weeks.filter(w => w.stage === stage.n);
    const completedInStage = stageWeeks.filter(w => state.completed.includes(w.n)).length;
    const isStageDone = stageWeeks.length > 0 && completedInStage === stageWeeks.length;

    return `
      <article class="stage ${idx === 1 ? 'open' : ''} ${isStageDone ? 'stage-done' : ''}">
        <div class="stage-head">
          <span class="stage-num-badge">ЭТАП ${stage.n}</span>
          <div class="stage-head-text">
            <h3>${stage.name}</h3>
            <p>${stage.desc} · недели ${stage.range} · (${completedInStage}/${stageWeeks.length} сдано)</p>
          </div>
          <span class="stage-toggle-icon">+</span>
        </div>
        <div class="stage-weeks">
          ${stageWeeks.map(w => {
      const isDone = state.completed.includes(w.n);
      return `
              <div class="mini-week ${isDone ? 'done' : ''}">
                <div class="mini-week-top">
                  <b>Неделя ${w.n}</b>
                  <span>${isDone ? '✓ Сдано' : 'В процессе'}</span>
                </div>
                <strong>${w.title}</strong>
                <span class="mini-week-project">📦 ${w.project}</span>
              </div>
            `;
    }).join('')}
        </div>
      </article>
    `;
  }).join('');

  $$('.stage-head').forEach(head => {
    head.addEventListener('click', () => {
      head.parentElement.classList.toggle('open');
      playSound('click');
    });
  });
}

// Рендеринг Недель
function renderWeeks() {
  const stageFilter = $('#stageFilter');
  if (!stageFilter || !state.stages.length) return;

  const currentVal = stageFilter.value || 'all';
  stageFilter.innerHTML = '<option value="all">Все этапы (0–10)</option>' +
    state.stages.map(s => `<option value="${s.n}">Этап ${s.n} — ${s.name}</option>`).join('');
  stageFilter.value = currentVal;

  function doRender() {
    const filter = stageFilter.value;
    const search = ($('#weekSearch')?.value || '').trim().toLowerCase();

    const filtered = state.weeks.filter(w => {
      const matchStage = filter === 'all' || String(w.stage) === filter;
      const matchSearch = !search ||
        w.title.toLowerCase().includes(search) ||
        w.topic.toLowerCase().includes(search) ||
        w.project.toLowerCase().includes(search);
      return matchStage && matchSearch;
    });

    const grid = $('#weekGrid');
    if (!grid) return;

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted);">Ничего не найдено по вашему запросу.</div>';
      return;
    }

    grid.innerHTML = filtered.map(w => {
      const isDone = state.completed.includes(w.n);
      return `
        <article class="week-card ${isDone ? 'done' : ''}">
          <div class="week-card-top">
            <span class="week-card-num">НЕДЕЛЯ ${w.n}</span>
            <span style="font-size:10px; color:var(--text-muted); margin-left:auto;">Этап ${w.stage}</span>
          </div>
          <h3>${w.title}</h3>
          <p>${w.topic}</p>
          <span class="week-card-project-tag">📦 Проект: <b>${w.project}</b></span>
          <button class="${isDone ? 'ghost-btn' : 'primary-btn'}" data-toggle-week="${w.n}">
            ${isDone ? '✓ Проект сдан' : 'Отметить сдачу (+30 XP)'}
          </button>
        </article>
      `;
    }).join('');

    $$('[data-toggle-week]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const num = Number(btn.dataset.toggleWeek);
        const done = await api.toggleWeek(num);
        if (done) {
          playSound('success');
          toast(`+30 XP за сдачу проекта недели ${num}!`);
        } else {
          toast(`Отметка недели ${num} снята.`);
        }
        renderAll();
      });
    });
  }

  stageFilter.onchange = doRender;
  const searchInput = $('#weekSearch');
  if (searchInput) {
    searchInput.oninput = doRender;
  }

  doRender();
}

// Рендеринг Проектов
function renderProjects() {
  const grid = $('#projectGrid');
  if (!grid || !state.projects.length) return;

  grid.innerHTML = state.projects.map(p => `
    <article class="project-card">
      <div class="project-card-header">
        <div class="project-icon">${p.icon}</div>
        <span class="project-category-tag">${p.category}</span>
      </div>
      <h3>${p.title}</h3>
      <p>${p.desc}</p>
    </article>
  `).join('');
}

// Вычисление текущей недели спринта
function getCurrentSprintWeek() {
  if (!state.weeks.length) return null;
  const n = Math.min(state.weeks.length - 1, state.completed.length);
  return state.weeks[n] || state.weeks[0];
}

// Рендеринг Дашборда
function renderDashboard() {
  const w = getCurrentSprintWeek();
  const weekCard = $('#currentWeekCard');

  if (w && weekCard && state.stages[w.stage]) {
    const isCurrentDone = state.completed.includes(w.n);
    weekCard.innerHTML = `
      <div class="week-badge-row">
        <span class="week-num-badge">НЕДЕЛЯ ${w.n}</span>
        <span style="font-size:12px; color:var(--text-muted);">•</span>
        <span style="font-size:12px; color:var(--text-secondary); font-weight:600;">${state.stages[w.stage].name}</span>
      </div>
      <h3>${w.title}</h3>
      <p>${w.topic}</p>
      <div class="tasks-chip-row">
        ${(w.tasks || []).map(t => `<span class="task-chip">${t}</span>`).join('')}
      </div>
      <div class="project-footer-row">
        <div class="project-info-label">
          Мини-проект недели: <b>${w.project}</b>
        </div>
        <button class="${isCurrentDone ? 'ghost-btn' : 'primary-btn'}" data-toggle-week="${w.n}">
          ${isCurrentDone ? '✓ Проект выполнен' : 'Завершить проект (+30 XP)'}
        </button>
      </div>
    `;

    const sprintBtn = weekCard.querySelector('[data-toggle-week]');
    if (sprintBtn) {
      sprintBtn.addEventListener('click', async () => {
        const done = await api.toggleWeek(w.n);
        if (done) {
          playSound('success');
          toast(`+30 XP за сдачу проекта недели ${w.n}!`);
        } else {
          toast(`Отметка недели ${w.n} снята.`);
        }
        renderAll();
      });
    }

    $('#currentStage').textContent = `Этап ${w.stage}`;
    $('#currentStageName').textContent = state.stages[w.stage].name;
  }

  const totalWeeks = state.weeks.length || 45;
  const completedCount = state.completed.length;
  const pct = Math.round((completedCount / totalWeeks) * 100);

  $('#completedWeeks').textContent = `${completedCount} / ${totalWeeks}`;
  $('#completionPercentage').textContent = `${pct}% выполнено`;
  $('#statsWeeksFill').style.width = `${pct}%`;
  $('#sidebarWeeksBadge').textContent = `${completedCount}/${totalWeeks}`;

  $('#studyHours').textContent = `${state.hours} ч`;
  $('#totalPoints').textContent = `${state.points} XP`;
  $('#youScore').textContent = state.points;
  $('#friendScore').textContent = state.friend;

  // Бары соревнований
  const maxPts = Math.max(state.points, state.friend, 10);
  $('#youBarFill').style.width = `${Math.min(100, Math.round((state.points / maxPts) * 100))}%`;
  $('#friendBarFill').style.width = `${Math.min(100, Math.round((state.friend / maxPts) * 100))}%`;

  const diff = state.points - state.friend;
  const scoreDiffStatus = $('#scoreDiffStatus');
  const youStatus = $('#youStatusLabel');
  const friendStatus = $('#friendStatusLabel');

  if (diff > 0) {
    scoreDiffStatus.textContent = `Впереди на +${diff} XP`;
    youStatus.textContent = 'Лидируешь 👑';
    friendStatus.textContent = 'Догоняет 🎯';
  } else if (diff < 0) {
    scoreDiffStatus.textContent = `Отставание: ${diff} XP`;
    youStatus.textContent = 'Догоняющий 🎯';
    friendStatus.textContent = 'Лидирует 👑';
  } else {
    scoreDiffStatus.textContent = 'Вровень с другом';
    youStatus.textContent = 'Ничья';
    friendStatus.textContent = 'Ничья';
  }

  // Уровень понимания
  $('#skillLevel').textContent = state.level;
  $('#skillDescription').textContent = skillLevelDescriptions[state.level] || '';
  $$('.skill-btn').forEach(b => {
    b.classList.toggle('selected', Number(b.dataset.level) === state.level);
  });

  // Ежедневные чеки
  const dailyDoneCount = Object.values(state.tasks).filter(Boolean).length;
  $('#todayProgress').style.width = `${(dailyDoneCount / 3) * 100}%`;
  $('#todayProgressText').textContent = `${dailyDoneCount} / 3 задач`;

  $$('.check-btn').forEach(btn => {
    const key = btn.dataset.task;
    btn.classList.toggle('done', !!state.tasks[key]);
  });

  // История начислений
  renderScoreHistory();
}

// Рендеринг истории очков
function renderScoreHistory() {
  const container = $('#scoreHistoryList');
  if (!container) return;

  if (!state.scoreHistory || state.scoreHistory.length === 0) {
    container.innerHTML = '<div style="padding: 12px; color: var(--text-muted); font-size: 11px;">История пока пуста.</div>';
    return;
  }

  container.innerHTML = state.scoreHistory.slice(0, 8).map(item => {
    const isPlus = item.points >= 0;
    const userLabel = item.user_id === 'friend' ? 'Друг' : 'Ты';
    return `
      <div class="history-item">
        <span class="reason"><b>${userLabel}</b>: ${item.reason}</span>
        <span class="pts ${isPlus ? 'positive' : 'negative'}">${isPlus ? '+' : ''}${item.points} XP</span>
      </div>
    `;
  }).join('');
}

// Полный рендеринг всех компонентов
function renderAll() {
  renderRoadmap();
  renderWeeks();
  renderProjects();
  renderDashboard();
}

// ==========================================================================
// ТАЙМЕР 2 ЧАСОВ И ФОКУС-РЕЖИМ
// ==========================================================================

let timerInterval = null;
let remainingSeconds = 7200; // 2 часа
const TOTAL_SECONDS = 7200;

function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function updateTimerDisplays() {
  const formatted = formatTime(remainingSeconds);
  const topDisplay = $('#topTimerDisplay');
  const panelDisplay = $('#timerDisplay');
  const modalDisplay = $('#modalTimerDisplay');

  if (topDisplay) topDisplay.textContent = formatted;
  if (panelDisplay) panelDisplay.textContent = formatted;
  if (modalDisplay) modalDisplay.textContent = formatted;
}

function toggleTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    $('#focusBtnText').textContent = 'Продолжить';
    $('#modalStartBtn').textContent = '▶ Продолжить';
    toast('Таймер на паузе');
    return;
  }

  $('#focusBtnText').textContent = 'Пауза';
  $('#modalStartBtn').textContent = '⏸ Пауза';
  toast('Сессия 2 часов запущена!');
  playSound('click');

  timerInterval = setInterval(() => {
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      remainingSeconds = TOTAL_SECONDS;
      updateTimerDisplays();

      $('#focusBtnText').textContent = 'Начать 2 часа';
      $('#modalStartBtn').textContent = '▶ Старт';

      playSound('alarm');
      api.addStudyHours(2);
      api.addScore('you', 20, 'Завершена 2-часовая сессия');
      toast('🎉 2 часа завершены! +20 XP и +2 часа в профиль!');
      renderDashboard();
      return;
    }

    remainingSeconds--;
    updateTimerDisplays();
  }, 1000);
}

function resetTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  remainingSeconds = TOTAL_SECONDS;
  updateTimerDisplays();
  $('#focusBtnText').textContent = 'Начать 2 часа';
  $('#modalStartBtn').textContent = '▶ Старт';
  toast('Таймер сброшен');
}

// ==========================================================================
// ИНИЦИАЛИЗАЦИЯ СОБЫТИЙ
// ==========================================================================

function initEvents() {
  // Навигация (десктопный сайдбар и мобильный нижний бар)
  $$('.nav-item').forEach(b => b.addEventListener('click', () => goToSection(b.dataset.section)));
  $$('.bottom-nav-item').forEach(b => b.addEventListener('click', () => goToSection(b.dataset.section)));
  $$('[data-goto]').forEach(b => b.addEventListener('click', () => goToSection(b.dataset.goto)));

  // Клик по ежедневным чекбоксам
  $$('.check-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.task;
      const isDone = await api.toggleDailyTask(key);
      if (isDone) {
        playSound('success');
        toast(`+10 XP: выполнена задача "${key}"`);
      } else {
        toast(`Отметка задачи "${key}" снята`);
      }
      renderDashboard();
    });
  });

  // Шкала понимания 0-5
  $$('.skill-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const lvl = Number(btn.dataset.level);
      await api.updateLevel(lvl);
      playSound('click');
      renderDashboard();
      toast(`Уровень понимания обновлен: ${lvl}/5`);
    });
  });

  // Таймер кнопки
  $('#focusBtn')?.addEventListener('click', toggleTimer);
  $('#modalStartBtn')?.addEventListener('click', toggleTimer);
  $('#modalResetBtn')?.addEventListener('click', resetTimer);

  // Модалка таймера
  const timerModal = $('#timerModal');
  $('#openTimerOverlayBtn')?.addEventListener('click', () => timerModal?.classList.add('open'));
  $('#closeTimerModalBtn')?.addEventListener('click', () => timerModal?.classList.remove('open'));
  timerModal?.addEventListener('click', e => {
    if (e.target === timerModal) timerModal.classList.remove('open');
  });

  // Быстрые кнопки добавления XP в лидерборде
  $$('.quick-xp').forEach(b => {
    b.addEventListener('click', async () => {
      const player = b.dataset.player;
      const add = Number(b.dataset.add);
      const text = b.textContent.trim();
      await api.addScore(player, add, text);
      playSound(add > 0 ? 'success' : 'click');
      toast(`${player === 'friend' ? 'Другу: ' : ''}${add > 0 ? '+' : ''}${add} XP`);
      renderDashboard();
    });
  });

  // Модалка добавления XP
  const scoreModal = $('#scoreModal');
  let selectedTargetUser = 'you';
  let selectedXpDelta = 10;

  $('#openScoreModalBtn')?.addEventListener('click', () => scoreModal?.classList.add('open'));
  $('#closeScoreModalBtn')?.addEventListener('click', () => scoreModal?.classList.remove('open'));
  $('#cancelScoreModalBtn')?.addEventListener('click', () => scoreModal?.classList.remove('open'));

  scoreModal?.addEventListener('click', e => {
    if (e.target === scoreModal) scoreModal.classList.remove('open');
  });

  $$('.segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.segment-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTargetUser = btn.dataset.targetUser;
    });
  });

  $$('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $$('.preset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedXpDelta = Number(chip.dataset.xp);
      const customInput = $('#customXpInput');
      if (customInput) customInput.value = selectedXpDelta;
    });
  });

  $('#customXpInput')?.addEventListener('input', e => {
    selectedXpDelta = Number(e.target.value) || 0;
    $$('.preset-chip').forEach(c => c.classList.remove('active'));
  });

  $('#confirmScoreModalBtn')?.addEventListener('click', async () => {
    const reasonInput = $('#scoreReasonInput');
    const reason = reasonInput?.value.trim() || undefined;
    await api.addScore(selectedTargetUser, selectedXpDelta, reason);
    playSound(selectedXpDelta > 0 ? 'success' : 'click');
    toast(`${selectedTargetUser === 'friend' ? 'Другу ' : ''}${selectedXpDelta >= 0 ? '+' : ''}${selectedXpDelta} XP`);
    if (reasonInput) reasonInput.value = '';
    scoreModal?.classList.remove('open');
    renderDashboard();
  });

  // Звук переключатель
  $('#soundToggleBtn')?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    const icon = $('#soundIcon');
    if (icon) icon.textContent = soundEnabled ? '🔊' : '🔇';
    toast(soundEnabled ? 'Звуковые эффекты включены' : 'Звук выключен');
    if (soundEnabled) playSound('click');
  });

  // Сброс всего прогресса
  $('#resetBtn')?.addEventListener('click', async () => {
    if (confirm('Сбросить весь прогресс (недели, часы, очки XP)?')) {
      await api.resetAll();
      toast('Прогресс успешно сброшен');
      renderAll();
    }
  });

  // Горячие клавиши (Space = пауза/старт таймера, если нет фокуса в input)
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      toggleTimer();
    }
  });
}

// Запуск приложения
async function initApp() {
  loadLocalState();

  // Дата сегодня
  const d = new Date();
  const dateEl = $('#todayDate');
  if (dateEl) {
    dateEl.textContent = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  }

  initEvents();

  // Проверка соединения с бекендом
  await api.checkServer();

  // Загружаем актуальное состояние
  await api.fetchState();

  // Первоначальный рендеринг
  renderAll();

  // Периодический пинг сервера (каждые 30 секунд)
  setInterval(async () => {
    const wasOnline = isServerOnline;
    await api.checkServer();
    if (!wasOnline && isServerOnline) {
      await api.fetchState();
      renderAll();
    }
  }, 30000);
}

// Старт после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
