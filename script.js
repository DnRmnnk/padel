'use strict';

/* =====================================================
 *  КАСТОМНЫЙ КУРСОР
 * ===================================================== */
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const ringPos = { x: mouse.x, y: mouse.y };

window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  cursorDot.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%, -50%)`;
});

function animateRing() {
  ringPos.x += (mouse.x - ringPos.x) * 0.18;
  ringPos.y += (mouse.y - ringPos.y) * 0.18;
  cursorRing.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%, -50%)`;
  requestAnimationFrame(animateRing);
}
animateRing();

// hover для интерактивных
document.addEventListener('mouseover', (e) => {
  if (e.target.closest('button, input, [data-hover]')) {
    cursorRing.classList.add('hover');
    cursorDot.classList.add('hover');
  }
});
document.addEventListener('mouseout', (e) => {
  if (e.target.closest('button, input, [data-hover]')) {
    cursorRing.classList.remove('hover');
    cursorDot.classList.remove('hover');
  }
});

/* =====================================================
 *  АНИМИРОВАННЫЙ ФОН — движущаяся фиолетовая субстанция
 *  (метаболы реагируют на курсор)
 * ===================================================== */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let W = 0, H = 0;
function resizeCanvas() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Blob {
  constructor() {
    this.reset();
    this.x = Math.random() * W;
    this.y = Math.random() * H;
  }
  reset() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.r = 120 + Math.random() * 220;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = (Math.random() - 0.5) * 0.6;
    const purples = [
      'rgba(168, 85, 247, 0.55)',   // основной фиолетовый
      'rgba(107, 33, 168, 0.5)',    // глубокий
      'rgba(192, 132, 252, 0.45)',  // светлый
      'rgba(76, 29, 149, 0.55)',    // тёмный
    ];
    this.color = purples[Math.floor(Math.random() * purples.length)];
  }
  update() {
    // притяжение к курсору
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 400 && dist > 0) {
      const force = (400 - dist) / 400;
      this.vx += (dx / dist) * force * 0.05;
      this.vy += (dy / dist) * force * 0.05;
    }
    // лёгкое демпфирование
    this.vx *= 0.985;
    this.vy *= 0.985;
    // случайный дрейф
    this.vx += (Math.random() - 0.5) * 0.06;
    this.vy += (Math.random() - 0.5) * 0.06;

    this.x += this.vx;
    this.y += this.vy;

    // отражение от границ
    if (this.x < -this.r) this.x = W + this.r;
    if (this.x > W + this.r) this.x = -this.r;
    if (this.y < -this.r) this.y = H + this.r;
    if (this.y > H + this.r) this.y = -this.r;
  }
  draw(boost = 1, alphaBoost = 1) {
    const r = this.r * boost;
    // подмешиваем альфа: парсим rgba() цвета и умножаем последний канал
    const color = this.color.replace(/rgba\(([^)]+)\)/, (_, parts) => {
      const [r1, g1, b1, a1] = parts.split(',').map(s => parseFloat(s.trim()));
      return `rgba(${r1}, ${g1}, ${b1}, ${Math.min(1, a1 * alphaBoost)})`;
    });
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

const blobs = Array.from({ length: 7 }, () => new Blob());

// Глобальная "интенсивность" фона: 0 — спокой, 1 — спин (барабаны крутятся).
// Меняется ПЛАВНО (lerp), без пульсаций.
let bgIntensity = 0;
let bgTarget = 0;

function setBgSpinning(on) {
  bgTarget = on ? 1 : 0;
  document.getElementById('bg-canvas').classList.toggle('spinning', on);
}

function tick() {
  ctx.clearRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'screen';

  // плавный lerp интенсивности — без sin-мерцания
  bgIntensity += (bgTarget - bgIntensity) * 0.035;
  const boost = 1 + bgIntensity * 0.45;       // плавное увеличение радиуса blob'ов
  const alphaBoost = 1 + bgIntensity * 0.6;   // плавное усиление прозрачности

  blobs.forEach(b => { b.update(); b.draw(boost, alphaBoost); });
  requestAnimationFrame(tick);
}
tick();

/* =====================================================
 *  ВВОД ИМЁН
 * ===================================================== */
const MAX_NAMES = 10;
const MIN_NAMES = 2;
const namesList = document.getElementById('names-list');
const addBtn = document.getElementById('add-btn');
const spinBtn = document.getElementById('spin-btn');
const counterEl = document.getElementById('count');

function getRows() { return Array.from(namesList.querySelectorAll('.name-row')); }

function renumber() {
  getRows().forEach((row, i) => {
    row.querySelector('.name-index').textContent = String(i + 1).padStart(2, '0');
  });
}

function getValidNames() {
  return getRows()
    .map(r => r.querySelector('.name-input').value.trim())
    .filter(Boolean);
}

function updateState() {
  const rows = getRows();
  const valid = getValidNames();
  counterEl.textContent = valid.length;

  addBtn.disabled = rows.length >= MAX_NAMES;
  addBtn.style.opacity = rows.length >= MAX_NAMES ? '0.4' : '1';

  spinBtn.disabled = valid.length < MIN_NAMES;
}

function createRow(focus = false) {
  if (getRows().length >= MAX_NAMES) return;

  const row = document.createElement('div');
  row.className = 'name-row';
  row.innerHTML = `
    <span class="name-index"></span>
    <input class="name-input" type="text" placeholder="Имя игрока" maxlength="24" autocomplete="off" />
    <button type="button" class="remove-btn" aria-label="Удалить">×</button>
  `;
  namesList.appendChild(row);

  const input = row.querySelector('.name-input');
  input.addEventListener('input', updateState);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const rows = getRows();
      const idx = rows.indexOf(row);
      if (idx === rows.length - 1 && rows.length < MAX_NAMES) {
        createRow(true);
      } else if (idx < rows.length - 1) {
        rows[idx + 1].querySelector('.name-input').focus();
      }
    }
  });

  row.querySelector('.remove-btn').addEventListener('click', () => {
    if (getRows().length <= 1) return;
    row.classList.add('removing');
    setTimeout(() => {
      row.remove();
      renumber();
      updateState();
    }, 280);
  });

  renumber();
  updateState();
  if (focus) input.focus();
}

// Стартуем с двух пустых полей
createRow();
createRow();

addBtn.addEventListener('click', () => createRow(true));

/* =====================================================
 *  ПЕРЕХОД МЕЖДУ ЭКРАНАМИ
 * ===================================================== */
const inputScreen = document.getElementById('input-screen');
const slotScreen = document.getElementById('slot-screen');

function showSlotScreen() {
  inputScreen.classList.remove('active');
  inputScreen.classList.add('exiting');
  setTimeout(() => {
    inputScreen.classList.remove('exiting');
    inputScreen.style.display = 'none';
    slotScreen.style.display = 'flex';
    slotScreen.classList.add('active');
  }, 520);
}

/* =====================================================
 *  СЛОТ МАШИНА — анимация прокрута
 * ===================================================== */
const VISIBLE_ROWS = 3;
const STRIP_SIZE = 40;      // ячеек в ленте — много, чтобы создавалась иллюзия бесконечности

/**
 * Высота одной ячейки барабана. Считается из CSS box-размера .reel
 * через offsetHeight — это значение игнорирует CSS transforms
 * (scale у frameIn / screenIn анимации), поэтому JS всегда совпадает
 * с реальной CSS-высотой на любом брейкпоинте.
 *
 * ВАЖНО: использовать getBoundingClientRect здесь нельзя — он
 * учитывает activeный transform: scale() и возвращает заниженную высоту,
 * из-за чего барабан остановится не на той ячейке.
 */
function cellHeight() {
  const reel = document.querySelector('.reel');
  if (reel && reel.offsetHeight > 10) {
    return reel.offsetHeight / VISIBLE_ROWS;
  }
  // фолбек, если барабанов ещё нет в DOM
  if (window.innerWidth <= 380) return 55;
  if (window.innerWidth <= 520) return 65;
  return 80;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Координированно строит ленты для всех трёх барабанов:
 *  - центральный ряд (видимый после остановки): везде winner
 *  - верхний и нижний ряды: имена выбираются так, чтобы НЕ было
 *    трёх одинаковых подряд (по возможности — все разные)
 *  - остальное содержимое ленты — случайные имена для иллюзии прокрута
 * @returns массив stopIndex для каждого барабана
 */
function buildAllStrips(reels, names, winner) {
  // 3 разных имени для одного ряда (если хватает), исключая winner если возможно
  const pickRow = () => {
    const pool = names.length >= 4 ? names.filter(n => n !== winner) : names.slice();
    if (pool.length === 0) return [winner, winner, winner];

    // если в пуле >= 3 имён — берём три РАЗНЫХ
    if (pool.length >= 3) {
      return shuffle(pool).slice(0, 3);
    }
    // если 2 — расставляем так, чтобы не было трёх одинаковых подряд:
    // [a, b, a] либо [b, a, b]
    if (pool.length === 2) {
      const [a, b] = shuffle(pool);
      return Math.random() < 0.5 ? [a, b, a] : [b, a, b];
    }
    // только одно имя — повторяем (без вариантов)
    return [pool[0], pool[0], pool[0]];
  };

  const topRow = pickRow();
  const bottomRow = pickRow();
  const stops = [];

  reels.forEach((reelEl, reelIndex) => {
    const strip = reelEl.querySelector('.reel-strip');
    strip.innerHTML = '';
    strip.className = 'reel-strip'; // сбросить blur-классы
    strip.style.transition = 'none';
    strip.style.transform = 'translateY(0px)';

    const stopIndex = STRIP_SIZE - 6 + reelIndex;
    stops.push(stopIndex);

    const cells = [];
    for (let i = 0; i < STRIP_SIZE + VISIBLE_ROWS; i++) {
      let name;
      if (i === stopIndex)      name = winner;
      else if (i === stopIndex - 1) name = topRow[reelIndex];
      else if (i === stopIndex + 1) name = bottomRow[reelIndex];
      else                      name = names[Math.floor(Math.random() * names.length)];
      cells.push(name);
    }

    cells.forEach((name, i) => {
      const c = document.createElement('div');
      c.className = 'reel-cell';
      c.textContent = name;
      if (i === stopIndex) c.dataset.winner = 'true';
      strip.appendChild(c);
    });
  });

  return stops;
}

/**
 * Запускает анимацию одного барабана.
 * Фазы:
 *  1) короткий импульс (барабан "набирает обороты")
 *  2) длинный прокрут с очень плавным замедлением до точной финальной позиции
 *  3) микро-доводка (settle) без отскока — мягкая остановка
 */
function spinReel(reelEl, stopIndex, duration, delay) {
  const strip = reelEl.querySelector('.reel-strip');
  const ch = cellHeight();
  const finalY = -(stopIndex - 1) * ch;

  return new Promise(resolve => {
    setTimeout(() => {
      // фаза 1: разгон
      strip.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.6, 1)';
      strip.style.transform = `translateY(${ch * 1.6}px)`;

      setTimeout(() => {
        // фаза 2: длинный прокрут — очень плавная докрутка
        // ease-out с длинным хвостом (последняя треть едет почти неощутимо)
        strip.style.transition = `transform ${duration}ms cubic-bezier(0.08, 0.82, 0.17, 1)`;
        strip.style.transform = `translateY(${finalY}px)`;

        setTimeout(() => {
          // фаза 3: мягкое settle, без отскока
          strip.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
          strip.style.transform = `translateY(${finalY}px)`;
          setTimeout(resolve, 500);
        }, duration);
      }, 350);
    }, delay);
  });
}

async function runSlot(names) {
  const winner = names[Math.floor(Math.random() * names.length)];
  const reels = document.querySelectorAll('.reel');
  const slotMachine = document.querySelector('.slot-machine');
  const slotGlow = document.querySelector('.slot-glow');
  const winnerBanner = document.getElementById('winner-banner');
  const winnerNameEl = document.getElementById('winner-name');
  const restartBtn = document.getElementById('restart-btn');

  slotMachine.classList.remove('win');
  winnerBanner.classList.remove('show');
  restartBtn.classList.remove('show');
  document.querySelectorAll('.reel-cell').forEach(c => c.classList.remove('winner'));

  // настраиваем все ленты согласованно
  const stops = buildAllStrips(reels, names, winner);

  // даём браузеру отрисовать
  await new Promise(r => requestAnimationFrame(r));

  // включаем "повышенный режим" фона и свечения слота
  setBgSpinning(true);
  slotGlow.classList.add('spinning');

  // запускаем — каждый барабан крутится дольше предыдущего
  const baseDuration = 5200;
  const stepDuration = 1300;
  const promises = [];
  reels.forEach((reel, i) => {
    promises.push(spinReel(reel, stops[i], baseDuration + i * stepDuration, i * 160));
  });

  await Promise.all(promises);

  // ВСЕ барабаны остановились → плавно гасим фон
  setBgSpinning(false);
  slotGlow.classList.remove('spinning');

  // выдерживаем паузу, чтобы зритель увидел финальную раскладку 3-х имён В РЯД,
  // и только ПОТОМ зажигаем подсветку
  await new Promise(r => setTimeout(r, 650));

  slotMachine.classList.add('win');
  document.querySelectorAll('.reel-cell[data-winner="true"]').forEach(c => c.classList.add('winner'));

  // показываем баннер
  winnerNameEl.textContent = winner;
  setTimeout(() => winnerBanner.classList.add('show'), 400);
  setTimeout(() => restartBtn.classList.add('show'), 900);
}

/* =====================================================
 *  СПИН и RESTART
 * ===================================================== */
spinBtn.addEventListener('click', () => {
  const names = getValidNames();
  if (names.length < MIN_NAMES) return;

  showSlotScreen();
  // запускаем слот после появления экрана
  setTimeout(() => runSlot(names), 900);
});

document.getElementById('restart-btn').addEventListener('click', () => {
  slotScreen.classList.remove('active');
  slotScreen.classList.add('exiting');
  setTimeout(() => {
    slotScreen.classList.remove('exiting');
    slotScreen.style.display = 'none';
    inputScreen.style.display = 'flex';
    inputScreen.classList.add('active');

    // сброс состояний слота
    document.querySelector('.slot-machine').classList.remove('win');
    document.querySelectorAll('.reel-cell').forEach(c => c.classList.remove('winner'));
    document.getElementById('winner-banner').classList.remove('show');
    document.getElementById('restart-btn').classList.remove('show');
  }, 520);
});

/* =====================================================
 *  Тачскрин — скрываем кастомный курсор
 * ===================================================== */
if (matchMedia('(hover: none)').matches) {
  cursorDot.style.display = 'none';
  cursorRing.style.display = 'none';
  document.documentElement.style.cursor = 'auto';
}
