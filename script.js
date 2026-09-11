'use strict';

const config = window.R15_CONFIG;
const form = document.querySelector('#join-form');
const moto = document.querySelector('#moto');
const customBike = document.querySelector('#outra-moto');
const interestInputs = [...form.querySelectorAll('[name="interesse"]')];
const interestError = document.querySelector('#interest-error');
const rulesAccepted = document.querySelector('#regras-aceitas');
const formStatus = document.querySelector('#form-status');
let interestTouched = false;

// Apenas a preferência de aparência é persistida. O perfil fica em memória.
const themeSelect = document.querySelector('#theme-select');
themeSelect.value = window.siteTheme.choice;
themeSelect.addEventListener('change', () => window.siteTheme.set(themeSelect.value));
document.querySelector('#copyright-year').textContent = new Date().getFullYear();

function configureSocialLink(id, url, label) {
  if (!url) return;
  const current = document.querySelector(id);
  if (!current || current.tagName === 'A') {
    if (current) current.href = url;
    return;
  }
  const link = document.createElement('a');
  link.className = current.className + ' is-live';
  link.id = current.id;
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.innerHTML = current.innerHTML;
  link.querySelector('small').textContent = label;
  link.querySelector('b').textContent = '↗';
  current.replaceWith(link);
}

if (config) {
  document.querySelector('#group-description').textContent = config.description;
  const list = document.querySelector('#rules-list');
  list.replaceChildren();
  config.rules.forEach((rule, index) => {
    const li = document.createElement('li');
    li.className = 'rule-scroll-item';
    li.style.setProperty('--rule-delay', (index * 70) + 'ms');
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    const number = document.createElement('span');
    number.className = 'rule-number';
    number.textContent = String(index + 1).padStart(2, '0');
    const title = document.createElement('span');
    title.textContent = rule.title;
    const toggle = document.createElement('span');
    toggle.className = 'rule-toggle';
    toggle.setAttribute('aria-hidden', 'true');
    toggle.textContent = '+';
    const text = document.createElement('p');
    text.textContent = rule.text;
    summary.append(number, title, toggle);
    details.append(summary, text);
    li.append(details);
    list.append(li);
  });
  moto.length = 1;
  config.bikes.forEach(bike => moto.add(new Option(bike.name, bike.name)));
  configureSocialLink('#social-whatsapp', config.social?.whatsapp, 'Entrar no grupo oficial');
  configureSocialLink('#social-instagram', config.social?.instagram, 'Acompanhar no Instagram');
  configureSocialLink('#social-tiktok', config.social?.tiktok, 'Acompanhar no TikTok');
}

const clean = value => value.trim().replace(/\s+/g, ' ');
const interests = () => interestInputs.filter(input => input.checked).map(input => input.value);
const selectedBike = () => config?.bikes.find(bike => bike.name === moto.value);
const bikeName = () => selectedBike()?.custom ? clean(customBike.value) : moto.value;

function createMessage() {
  const name = clean(form.elements.nome.value) || '[seu nome]';
  const age = form.elements.idade.value || '[idade]';
  const city = clean(form.elements.cidade.value) || '[sua cidade]';
  const selectedInterests = interests();
  const about = form.elements.sobre.value.trim();
  const lines = [
    '🏍️ *APRESENTAÇÃO — ' + (config?.groupName || 'R15 Santa Catarina').toUpperCase() + '*',
    '',
    'Fala, tropa! Me chamo *' + name + '*, tenho *' + age + ' anos* e sou de *' + city + '*.',
    'Minha moto: *' + (bikeName() || '[sua moto]') + '*.',
    '',
    '*Quero participar de:*',
    ...(selectedInterests.length ? selectedInterests.map(value => '• ' + value) : ['[seus interesses]'])
  ];
  if (about) lines.push('', '*Sobre mim:* ' + about);
  if (rulesAccepted.checked) lines.push('', '✅ Li e concordo com as regras da tropa.');
  lines.push('', 'Bora somar nos próximos rolês! 🤝');
  return lines.join('\n');
}

function syncInterestValidity() {
  const valid = interests().length > 0;
  interestInputs[0].setCustomValidity(valid ? '' : 'Escolha pelo menos um interesse.');
  interestInputs[0].setAttribute('aria-invalid', String(!valid && interestTouched));
  interestError.hidden = valid || !interestTouched;
}

function updateProfile() {
  for (const field of [form.elements.nome, form.elements.cidade, customBike]) {
    field.setCustomValidity(field.required && !clean(field.value) ? 'Preencha este campo.' : '');
  }
  syncInterestValidity();
  const bikeValid = Boolean(moto.value) && (!customBike.required || customBike.validity.valid);
  const completed = [form.elements.nome.validity.valid, form.elements.idade.validity.valid,
    form.elements.cidade.validity.valid, bikeValid, interests().length > 0, rulesAccepted.checked].filter(Boolean).length;
  document.querySelector('#form-progress').value = completed;
  document.querySelector('#progress-text').textContent = completed + ' de 6';
  document.querySelector('#about-count').textContent = form.elements.sobre.value.length + ' / 400';
  formStatus.textContent = '';
  if (moto.value) document.querySelector('#moto-name').textContent = bikeName() || moto.value;
}

function updateBike() {
  const bike = selectedBike();
  const isCustom = Boolean(bike?.custom);
  document.querySelector('#other-moto-field').hidden = !isCustom;
  customBike.disabled = !isCustom;
  customBike.required = isCustom;
  if (!isCustom) { customBike.value = ''; customBike.setCustomValidity(''); }
  const preview = document.querySelector('#moto-preview');
  preview.hidden = !moto.value;
  const visual = document.querySelector('#moto-visual');
  const monogram = document.createElement('span');
  monogram.className = 'moto-monogram';
  monogram.setAttribute('aria-hidden', 'true');
  monogram.textContent = bike?.badge || 'SC';
  if (monogram.textContent.length > 4) monogram.style.fontSize = '21px';
  visual.replaceChildren(monogram);
  if (bike?.image) {
    const image = new Image();
    image.alt = bike.name;
    image.decoding = 'async';
    image.addEventListener('load', () => {
      // Uma foto atrasada não substitui o modelo selecionado mais recentemente.
      if (selectedBike() === bike && visual.contains(monogram)) visual.append(image);
    }, { once: true });
    image.addEventListener('error', () => {}, { once: true });
    image.src = bike.image;
  }
  updateProfile();
}

moto.addEventListener('change', updateBike);
form.addEventListener('input', updateProfile);
form.addEventListener('change', updateProfile);
form.addEventListener('invalid', event => {
  if (interestInputs.includes(event.target)) {
    interestTouched = true;
    syncInterestValidity();
  }
}, true);

form.addEventListener('submit', event => {
  event.preventDefault();
  interestTouched = true;
  updateProfile();
  if (!form.reportValidity()) return;
  const number = config?.whatsappNumber;
  if (!number || !/^\d{10,15}$/.test(number)) {
    formStatus.textContent = 'O contato do WhatsApp ainda não está disponível. Tente novamente mais tarde.';
    return;
  }
  // Nenhuma API envia dados do formulário; o visitante confirma o envio no WhatsApp.
  const url = 'https://wa.me/' + number + '?text=' + encodeURIComponent(createMessage());
  window.open(url, '_blank', 'noopener,noreferrer');
  formStatus.replaceChildren(document.createTextNode('Confira e envie a mensagem no WhatsApp. Não abriu? '));
  const fallback = document.createElement('a');
  fallback.href = url;
  fallback.textContent = 'Toque aqui para abrir.';
  fallback.target = '_blank';
  fallback.rel = 'noopener noreferrer';
  formStatus.append(fallback);
});

updateProfile();
window.addEventListener('pageshow', updateBike);

// Galeria automática com controle manual e gesto lateral.
const gallery = document.querySelector('#gallery-window');
const galleryTrack = document.querySelector('#gallery-track');
const gallerySlides = [...gallery.querySelectorAll('.gallery-slide')];
const galleryDots = [...gallery.querySelectorAll('.gallery-dots button')];
const galleryCounter = document.querySelector('#gallery-counter');
let galleryIndex = 0;
let galleryTimer;
let touchStart = 0;

function showGallerySlide(index, userInitiated = false) {
  galleryIndex = (index + gallerySlides.length) % gallerySlides.length;
  galleryTrack.style.transform = `translate3d(-${galleryIndex * 100}%, 0, 0)`;
  gallerySlides.forEach((slide, slideIndex) => {
    const active = slideIndex === galleryIndex;
    slide.classList.toggle('is-active', active);
    slide.setAttribute('aria-hidden', String(!active));
  });
  galleryDots.forEach((dot, dotIndex) => {
    const active = dotIndex === galleryIndex;
    dot.classList.toggle('is-active', active);
    dot.setAttribute('aria-selected', String(active));
    dot.tabIndex = active ? 0 : -1;
  });
  galleryCounter.textContent = String(galleryIndex + 1).padStart(2, '0') + ' / ' + String(gallerySlides.length).padStart(2, '0');
  if (userInitiated) restartGallery();
}

function restartGallery() {
  clearInterval(galleryTimer);
  if (!document.hidden) galleryTimer = setInterval(() => showGallerySlide(galleryIndex + 1), 4500);
}

document.querySelector('#gallery-prev').addEventListener('click', () => showGallerySlide(galleryIndex - 1, true));
document.querySelector('#gallery-next').addEventListener('click', () => showGallerySlide(galleryIndex + 1, true));
galleryDots.forEach((dot, index) => dot.addEventListener('click', () => showGallerySlide(index, true)));
gallery.addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientX; }, { passive: true });
gallery.addEventListener('touchend', event => {
  const distance = event.changedTouches[0].clientX - touchStart;
  if (Math.abs(distance) > 45) showGallerySlide(galleryIndex + (distance < 0 ? 1 : -1), true);
  else restartGallery();
}, { passive: true });
document.addEventListener('visibilitychange', restartGallery);
showGallerySlide(0);
restartGallery();

// Agenda pública: os eventos são lidos da função da Netlify e organizados por mês.
const eventsFlow = document.querySelector('#events-flow');
const eventsMonthLabel = document.querySelector('#events-month');
let publicEvents = [];
let visibleMonth = new Date();
visibleMonth.setDate(1);
visibleMonth.setHours(12, 0, 0, 0);

function eventMonthKey(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
}

function renderEvents() {
  const key = eventMonthKey(visibleMonth);
  const monthEvents = publicEvents.filter(event => event.date?.slice(0, 7) === key).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  eventsMonthLabel.textContent = visibleMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
  eventsFlow.replaceChildren();
  if (!monthEvents.length) {
    const empty = document.createElement('div');
    empty.className = 'events-empty';
    empty.innerHTML = '<span>SEM EVENTOS PUBLICADOS</span><h3>A agenda deste mês ainda está aberta.</h3><p>Assim que um encontro for confirmado pela administração, ele aparecerá aqui.</p>';
    eventsFlow.append(empty);
    return;
  }
  monthEvents.forEach((event, index) => {
    const date = new Date(event.date + 'T12:00:00');
    const card = document.createElement('article');
    card.className = 'event-card';
    card.style.setProperty('--event-order', index);
    if (event.image) {
      const image = document.createElement('img');
      image.src = event.image;
      image.alt = '';
      image.loading = 'lazy';
      card.append(image);
    }
    const content = document.createElement('div');
    content.className = 'event-card-content';
    const dateBlock = document.createElement('div');
    dateBlock.className = 'event-date';
    const day = document.createElement('strong');
    day.textContent = String(date.getDate()).padStart(2, '0');
    const month = document.createElement('span');
    month.textContent = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
    dateBlock.append(day, month);
    const info = document.createElement('div');
    info.className = 'event-info';
    const type = document.createElement('span');
    type.className = 'event-type';
    type.textContent = event.type || 'ENCONTRO DA TROPA';
    const title = document.createElement('h3');
    title.textContent = event.title;
    const place = document.createElement('p');
    place.textContent = [event.time, event.city, event.meetingPoint].filter(Boolean).join(' · ');
    const description = document.createElement('p');
    description.className = 'event-description';
    description.textContent = event.description || '';
    info.append(type, title, place, description);
    content.append(dateBlock, info);
    card.append(content);
    eventsFlow.append(card);
  });
}

function shiftEventsMonth(offset) {
  visibleMonth.setMonth(visibleMonth.getMonth() + offset);
  renderEvents();
  eventsFlow.scrollTo({ left: 0, behavior: 'smooth' });
}
document.querySelector('#events-prev').addEventListener('click', () => shiftEventsMonth(-1));
document.querySelector('#events-next').addEventListener('click', () => shiftEventsMonth(1));

fetch('/api/events', { headers: { Accept: 'application/json' } })
  .then(response => {
    if (!response.ok) throw new Error('Agenda indisponível');
    return response.json();
  })
  .then(data => { publicEvents = Array.isArray(data.events) ? data.events : []; renderEvents(); })
  .catch(() => { publicEvents = []; renderEvents(); });

// Uma entrada por elemento; nenhum loop ou biblioteca de animação.
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !motion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealing');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06 });
  document.querySelectorAll('.reveal, .rule-scroll-item').forEach(element => observer.observe(element));
}

// A linha e a palavra de fundo acompanham o avanço dentro da seção de regras.
const rulesSection = document.querySelector('#regras');
let rulesFrame = 0;
function syncRulesScroll() {
  rulesFrame = 0;
  const rect = rulesSection.getBoundingClientRect();
  const travel = rect.height + window.innerHeight;
  const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / travel));
  rulesSection.style.setProperty('--rules-progress', progress.toFixed(3));
}
function requestRulesScroll() {
  if (!rulesFrame) rulesFrame = requestAnimationFrame(syncRulesScroll);
}
window.addEventListener('scroll', requestRulesScroll, { passive: true });
window.addEventListener('resize', requestRulesScroll, { passive: true });
syncRulesScroll();
