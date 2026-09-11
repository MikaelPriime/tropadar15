'use strict';

const loginPanel = document.querySelector('#login-panel');
const dashboard = document.querySelector('#dashboard');
const loginForm = document.querySelector('#login-form');
const eventForm = document.querySelector('#event-form');
const status = document.querySelector('#event-status');
let adminPassword = sessionStorage.getItem('r15-admin-session') || '';
let managedEvents = [];

const fields = {
  id: document.querySelector('#event-id'), title: document.querySelector('#event-title'),
  date: document.querySelector('#event-date'), time: document.querySelector('#event-time'),
  type: document.querySelector('#event-type'), city: document.querySelector('#event-city'),
  meetingPoint: document.querySelector('#event-place'), description: document.querySelector('#event-description'),
  image: document.querySelector('#event-image')
};

async function api(method = 'GET', body) {
  const options = { method, headers: { Accept: 'application/json', 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify({ ...body, password: adminPassword });
  const response = await fetch('/api/events', options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.');
  return data;
}

function setDashboard(open) {
  loginPanel.hidden = open;
  dashboard.hidden = !open;
}

function eventData() {
  return Object.fromEntries(Object.entries(fields).filter(([key]) => key !== 'id').map(([key, input]) => [key, input.value]));
}

function resetForm() {
  eventForm.reset(); fields.id.value = '';
  document.querySelector('#form-title').textContent = 'Novo evento';
  document.querySelector('#cancel-edit').hidden = true;
  document.querySelector('#description-count').textContent = '0 / 500';
  status.textContent = '';
}

function editEvent(event) {
  Object.entries(fields).forEach(([key, input]) => { input.value = event[key] || ''; });
  document.querySelector('#form-title').textContent = 'Editar evento';
  document.querySelector('#cancel-edit').hidden = false;
  document.querySelector('#description-count').textContent = fields.description.value.length + ' / 500';
  eventForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderManagedEvents() {
  const container = document.querySelector('#admin-events');
  container.replaceChildren();
  document.querySelector('#event-total').textContent = managedEvents.length + (managedEvents.length === 1 ? ' evento' : ' eventos');
  if (!managedEvents.length) {
    const empty = document.createElement('p'); empty.className = 'empty-admin'; empty.textContent = 'Nenhum evento publicado. Crie o primeiro usando o formulário.'; container.append(empty); return;
  }
  managedEvents.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).forEach(event => {
    const item = document.createElement('article'); item.className = 'admin-event';
    const info = document.createElement('div');
    const date = document.createElement('span'); date.textContent = new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR');
    const title = document.createElement('h3'); title.textContent = event.title;
    const place = document.createElement('p'); place.textContent = [event.time, event.city, event.meetingPoint].filter(Boolean).join(' · ') || 'Local a definir';
    info.append(date, title, place);
    const actions = document.createElement('div'); actions.className = 'event-actions';
    const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'EDITAR'; edit.addEventListener('click', () => editEvent(event));
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'danger'; remove.textContent = 'EXCLUIR';
    remove.addEventListener('click', async () => {
      if (!confirm('Excluir o evento “' + event.title + '”?')) return;
      try { await api('DELETE', { id: event.id }); await loadEvents(); } catch (error) { status.textContent = error.message; }
    });
    actions.append(edit, remove); item.append(info, actions); container.append(item);
  });
}

async function loadEvents() {
  const data = await api(); managedEvents = Array.isArray(data.events) ? data.events : []; renderManagedEvents();
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  adminPassword = document.querySelector('#admin-password').value;
  const loginStatus = document.querySelector('#login-status'); loginStatus.textContent = 'Verificando…';
  try {
    await api('POST', { action: 'authenticate' });
    sessionStorage.setItem('r15-admin-session', adminPassword); setDashboard(true); loginForm.reset(); await loadEvents();
  } catch (error) { adminPassword = ''; loginStatus.textContent = error.message; }
});

eventForm.addEventListener('submit', async event => {
  event.preventDefault(); status.textContent = 'Salvando…';
  try {
    const id = fields.id.value;
    await api(id ? 'PUT' : 'POST', { id, event: eventData() });
    resetForm(); await loadEvents(); status.textContent = 'Evento salvo e publicado com sucesso.';
  } catch (error) { status.textContent = error.message; }
});

fields.description.addEventListener('input', () => { document.querySelector('#description-count').textContent = fields.description.value.length + ' / 500'; });
document.querySelector('#cancel-edit').addEventListener('click', resetForm);
document.querySelector('#logout').addEventListener('click', () => { sessionStorage.removeItem('r15-admin-session'); adminPassword = ''; setDashboard(false); });

if (adminPassword) {
  api('POST', { action: 'authenticate' }).then(() => { setDashboard(true); return loadEvents(); }).catch(() => { sessionStorage.removeItem('r15-admin-session'); adminPassword = ''; setDashboard(false); });
}
