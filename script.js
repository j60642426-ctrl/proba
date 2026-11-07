const TYPES = { exam: 'экзамен', project: 'проект', olympiad: 'олимпиада', consult: 'консультация' };

let deadlines = JSON.parse(localStorage.getItem('deadlines') || '[]');
let currentFilter = 'all';

const form = document.getElementById('deadlineForm');
const list = document.getElementById('deadlineList');
const emptyMsg = document.getElementById('emptyMsg');
const statsBox = document.getElementById('stats');
const banner = document.getElementById('todayBanner');
const nextUpBox = document.getElementById('nextUp');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// нельзя выбрать дату в прошлом
document.getElementById('date').min = new Date().toISOString().slice(0, 10);

/* ---------- Тема ---------- */
const themeBtn = document.getElementById('themeToggle');
function applyTheme(t) {
  document.body.classList.toggle('dark', t === 'dark');
  themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
}
applyTheme(localStorage.getItem('theme') || 'light');
themeBtn.addEventListener('click', () => {
  const next = document.body.classList.contains('dark') ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme(next);
});

/* ---------- Русские склонения: 1 день, 2 дня, 5 дней ---------- */
function plural(n, forms) {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return forms[1];
  return forms[2];
}

function daysLeft(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function save() {
  localStorage.setItem('deadlines', JSON.stringify(deadlines));
}

function labelFor(d) {
  const left = daysLeft(d.date);
  if (d.done) return 'выполнено';
  if (left < 0) return 'просрочено';
  if (left === 0) return 'СЕГОДНЯ!';
  return `осталось ${left} ${plural(left, ['день', 'дня', 'дней'])}`;
}

function render() {
  deadlines.sort((a, b) => new Date(a.date) - new Date(b.date));

  const visible = currentFilter === 'all'
    ? deadlines
    : deadlines.filter(d => d.type === currentFilter);

  list.innerHTML = '';
  emptyMsg.classList.toggle('hidden', visible.length > 0);

  visible.forEach(d => {
    const i = deadlines.indexOf(d);
    const left = daysLeft(d.date);
    const li = document.createElement('li');

    if (d.done)          li.className = 'done overdue';
    else if (left < 0)   li.className = 'overdue';
    else if (left === 0) li.className = 'today';
    else if (left <= 3)  li.className = 'soon';
    else                 li.className = 'far';

    li.innerHTML = `
      <span class="info">
        <span class="badge badge-${d.type}">${TYPES[d.type]}</span>
        ${d.title} — ${new Date(d.date).toLocaleDateString('ru-RU')} · ${labelFor(d)}
      </span>
      <span class="actions">
        <button class="icon-btn ok" onclick="toggleDone(${i})" title="Выполнено">✔</button>
        <button class="icon-btn del" onclick="removeDeadline(${i})" title="Удалить">✖</button>
      </span>`;
    list.appendChild(li);
  });

  /* Счётчики срочности */
  const open = deadlines.filter(d => !d.done);
  const todayCount = open.filter(d => daysLeft(d.date) === 0).length;
  const soonCount  = open.filter(d => daysLeft(d.date) > 0 && daysLeft(d.date) <= 3).length;
  statsBox.innerHTML = todayCount || soonCount
    ? `🔥 Сегодня: ${todayCount} · 🕐 Скоро (3 дня): ${soonCount}`
    : '';

  /* Ближайший дедлайн в шапке */
  const future = open.filter(d => daysLeft(d.date) >= 0);
  const nearest = future.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  if (nearest) {
    const n = daysLeft(nearest.date);
    nextUpBox.textContent = `Ближайший: ${nearest.title} — через ${n} ${plural(n, ['день', 'дня', 'дней'])}`;
  } else {
    nextUpBox.textContent = '';
  }

  /* Баннер «сегодня» */
  const todayList = open.filter(d => daysLeft(d.date) === 0);
  banner.classList.toggle('hidden', todayList.length === 0);
  if (todayList.length) {
    banner.textContent = '⚠️ Сегодня на контроле: ' + todayList.map(d => d.title).join(', ');
  }

  /* Прогресс выполнения */
  const total = deadlines.length;
  const doneCount = deadlines.filter(d => d.done).length;
  progressWrap.classList.toggle('hidden', total === 0);
  if (total) {
    const pct = Math.round(doneCount / total * 100);
    progressFill.style.width = pct + '%';
    progressText.textContent = `Выполнено: ${doneCount} из ${total} (${pct}%)`;
  }
}

form.addEventListener('submit', e => {
  e.preventDefault();
  deadlines.push({
    title: document.getElementById('title').value,
    type: document.getElementById('type').value,
    date: document.getElementById('date').value,
    done: false
  });
  save();
  form.reset();
  render();
});

document.getElementById('filters').addEventListener('click', e => {
  if (e.target.tagName !== 'BUTTON') return;
  currentFilter = e.target.dataset.filter;
  document.querySelectorAll('#filters button').forEach(b => b.classList.toggle('active', b === e.target));
  render();
});

document.getElementById('clearAll').addEventListener('click', () => {
  if (!deadlines.length) return;
  if (confirm('Удалить все дедлайны?')) {
    deadlines = [];
    save();
    render();
  }
});

function toggleDone(i) { deadlines[i].done = !deadlines[i].done; save(); render(); }
function removeDeadline(i) { deadlines.splice(i, 1); save(); render(); }

render();
