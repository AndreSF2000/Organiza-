// Configuração do Supabase
const SUPABASE_URL = 'https://aomuwbdojaamiowcxcxr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbXV3YmRvamFhbWlvd2N4Y3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzQzODgsImV4cCI6MjA3MjIxMDM4OH0.PiSyUlaxzFxFTzFTZUklCvqDGl1TH8SZMqgod8Ir-ck';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado da aplicação
let currentUser = null;
let currentDate = new Date();
let currentFilter = 'all';

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Organiza+ iniciando...');
    checkAuth();
    setupEventListeners();
    requestNotificationPermission();
    initializeApp();
    setupMobileFeatures();
});

// Inicialização da aplicação
function initializeApp() {
    // Verificar se o Supabase está conectado
    if (!supabase) {
        showNotification('Erro de conexão com o banco de dados', 'error');
        return;
    }
    
    // Adicionar loading states
    addLoadingStates();
    
    // Configurar PWA
    setupPWA();
    
    console.log('✅ Organiza+ inicializado com sucesso!');
    loadUserSettings();
}

function addLoadingStates() {
    const style = document.createElement('style');
    style.textContent = `
        .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
}

function setupPWA() {
    // Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('✅ Service Worker registrado'))
            .catch(err => console.log('❌ Erro no Service Worker:', err));
    }
}

// Verificar autenticação
async function checkAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Erro de autenticação:', error);
            showNotification('Erro de autenticação', 'error');
            showHome();
            return;
        }
        
        if (session) {
            currentUser = session.user;
            console.log('✅ Usuário autenticado:', currentUser.email);
            showDashboard();
            await loadDashboardData();
        } else {
            console.log('👤 Usuário não autenticado');
            showHome();
        }
    } catch (error) {
        console.error('Erro crítico na autenticação:', error);
        showNotification('Erro crítico de autenticação', 'error');
        showHome();
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Listener para mudanças de autenticação
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            showDashboard();
            loadDashboardData();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            showHome();
        }
    });
    
    // Event delegation principal
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('submit', handleFormSubmit);
    
    // Setup mobile navigation
    setupMobileNavigation();
}

function handleGlobalClick(e) {
    const target = e.target;
    const closest = (selector) => target.closest(selector);
    
    // Navegação principal
    if (target.id === 'login-btn' || closest('#login-btn')) {
        e.preventDefault();
        showLogin();
    } else if (target.id === 'register-btn' || closest('#register-btn')) {
        e.preventDefault();
        showRegister();
    } else if (target.id === 'back-to-home-1' || closest('#back-to-home-1')) {
        e.preventDefault();
        showHome();
    } else if (target.id === 'back-to-home-2' || closest('#back-to-home-2')) {
        e.preventDefault();
        showHome();
    }
    
    // Dashboard cards
    else if (closest('#calendar-card')) {
        e.preventDefault();
        showCalendar();
    } else if (closest('#tasks-card')) {
        e.preventDefault();
        showTasks();
    } else if (closest('#health-card')) {
        e.preventDefault();
        showHealth();
    } else if (closest('#notes-card')) {
        e.preventDefault();
        showNotes();
    } else if (closest('#habits-card')) {
        e.preventDefault();
        showHabits();
    } else if (closest('#stats-card')) {
        e.preventDefault();
        showStats();
    } else if (closest('#profile-card')) {
        e.preventDefault();
        showProfile();
    }
    
    // Navegação por data attributes
    else if (target.dataset.nav) {
        e.preventDefault();
        handleNavigation(target.dataset.nav);
    } else if (target.dataset.action) {
        e.preventDefault();
        handleAction(target.dataset.action, target);
    }
    
    // Botões de exclusão
    else if (closest('.delete-btn')) {
        e.preventDefault();
        const deleteBtn = closest('.delete-btn');
        const itemType = deleteBtn.dataset.type;
        const itemId = deleteBtn.dataset.id;
        if (itemType && itemId) {
            handleDelete(itemType, itemId);
        }
    } else if (target.dataset.filter) {
        e.preventDefault();
        filterTasks(target.dataset.filter, target);
    } else if (target.dataset.tab) {
        e.preventDefault();
        showHealthTab(target.dataset.tab, target);
    }
    
    // Password toggle
    else if (closest('.password-toggle')) {
        e.preventDefault();
        const toggle = closest('.password-toggle');
        const targetId = toggle.dataset.target;
        if (targetId) togglePassword(targetId);
    }
    
    // Auth links
    else if (closest('.auth-link')) {
        e.preventDefault();
        const action = closest('.auth-link').dataset.action;
        if (action === 'show-register') showRegister();
        else if (action === 'show-login') showLogin();
        else if (action === 'forgot-password') showForgotPassword();
    }
    
    // Download buttons
    else if (target.id === 'ios-download' || closest('#ios-download') || target.id === 'ios-download-bottom' || closest('#ios-download-bottom')) {
        e.preventDefault();
        handleIOSDownload();
    } else if (target.id === 'android-download' || closest('#android-download') || target.id === 'android-download-bottom' || closest('#android-download-bottom')) {
        e.preventDefault();
        handleAndroidDownload();
    } else if (target.id === 'windows-download' || closest('#windows-download') || target.id === 'windows-download-bottom' || closest('#windows-download-bottom')) {
        e.preventDefault();
        handleWindowsDownload();
    }
    
    // Mobile download scroll link
    else if (target.id === 'mobile-download-scroll' || closest('#mobile-download-scroll')) {
        e.preventDefault();
        scrollToDownloadSection();
    }
}

// Função já redefinida acima com melhorias mobile

function handleAction(action, element) {
    switch(action) {
        case 'logout': logout(); break;
        case 'add-event': showAddEvent(); break;
        case 'add-task': showAddTask(); break;
        case 'add-medication': showAddMedication(); break;
        case 'add-note': showAddNote(); break;
        case 'add-habit': showAddHabit(); break;
        case 'prev-month': 
            previousMonth(); 
            break;
        case 'next-month': 
            nextMonth(); 
            break;
        case 'hide-modal': hideModal(); break;
        case 'delete-note': 
            const noteId = element.dataset.noteId;
            if (noteId) deleteNote(noteId);
            break;
        case 'delete-task':
            const taskId = element.dataset.taskId;
            if (taskId) deleteTask(taskId);
            break;
        case 'delete-medication':
            const medicationId = element.dataset.medicationId;
            if (medicationId) deleteMedication(medicationId);
            break;
        case 'delete-habit':
            const habitId = element.dataset.habitId;
            if (habitId) deleteHabit(habitId);
            break;
        case 'edit-event':
            const eventId = element.dataset.eventId;
            if (eventId) editEvent(eventId);
            break;
        case 'delete-event':
            const deleteEventId = element.dataset.eventId;
            if (deleteEventId) deleteEvent(deleteEventId);
            break;
        case 'export-data':
            exportUserData();
            break;
        case 'clear-cache':
            clearAppCache();
            break;
        case 'save-settings':
            saveUserSettings();
            break;
        case 'update-profile':
            updateUserProfile();
            break;
        case 'change-password':
            showChangePassword();
            break;
        case 'forgot-password':
            showForgotPassword();
            break;
        case 'export-stats':
            exportStatsReport();
            break;
    }
}

function handleFormSubmit(e) {
    if (e.target.id === 'login-form') {
        handleLogin(e);
    } else if (e.target.id === 'register-form') {
        handleRegister(e);
    } else if (e.target.id === 'add-event-form') {
        saveEvent(e);
    } else if (e.target.id === 'add-task-form') {
        saveTask(e);
    } else if (e.target.id === 'add-medication-form') {
        saveMedication(e);
    } else if (e.target.id === 'add-note-form') {
        saveNote(e);
    } else if (e.target.id === 'edit-note-form') {
        const noteId = e.target.dataset.noteId;
        if (noteId) updateNote(e, noteId);
    } else if (e.target.id === 'edit-event-form') {
        const eventId = e.target.dataset.eventId;
        if (eventId) updateEvent(e, eventId);
    } else if (e.target.id === 'add-habit-form') {
        saveHabit(e);
    } else if (e.target.id === 'forgot-password-form') {
        handleForgotPassword(e);
    } else if (e.target.id === 'change-password-form') {
        handleChangePassword(e);
    }
}

// Navegação entre páginas
function showHome() {
    hideAllPages();
    document.getElementById('home-page').classList.add('active');
}

function showLogin() {
    hideAllPages();
    document.getElementById('login-page').classList.add('active');
}

function showRegister() {
    hideAllPages();
    document.getElementById('register-page').classList.add('active');
}

function showDashboard() {
    hideAllPages();
    document.getElementById('dashboard-page').classList.add('active');
    if (currentUser) {
        const userName = currentUser.user_metadata?.name || currentUser.email.split('@')[0];
        document.getElementById('user-name').textContent = `Olá, ${userName}!`;
    }
    loadDashboardData();
}

function showCalendar() {
    hideAllPages();
    const page = document.getElementById('calendar-page');
    if (page) {
        page.classList.add('active');
        setTimeout(() => loadCalendar(), 100);
    }
}

function showTasks() {
    hideAllPages();
    const page = document.getElementById('tasks-page');
    if (page) {
        page.classList.add('active');
        setTimeout(() => loadTasks(), 100);
    }
}

function showHealth() {
    hideAllPages();
    const page = document.getElementById('health-page');
    if (page) {
        page.classList.add('active');
        setTimeout(() => loadHealthData(), 100);
    }
}

function showNotes() {
    hideAllPages();
    const page = document.getElementById('notes-page');
    if (page) {
        page.classList.add('active');
        setTimeout(() => loadNotes(), 100);
    }
}

function showHabits() {
    hideAllPages();
    const page = document.getElementById('habits-page');
    if (page) {
        page.classList.add('active');
        setTimeout(() => loadHabits(), 100);
    }
}

function showProfile() {
    showModal(`
        <div class="profile-settings">
            <div class="profile-header">
                <svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
                <h3>Configurações da Conta</h3>
            </div>
            
            <div class="profile-content">
                <div class="profile-section">
                    <h4>Informações Pessoais</h4>
                    <form id="profile-form">
                        <div class="input-group">
                            <label>Nome Completo</label>
                            <input type="text" id="profile-name" value="${currentUser?.user_metadata?.name || ''}" placeholder="Digite seu nome completo">
                        </div>
                        <div class="input-group">
                            <label>Email</label>
                            <input type="email" id="profile-email" value="${currentUser?.email || ''}" readonly style="background: var(--gray-100); cursor: not-allowed;">
                            <small style="color: var(--gray-500); font-size: 0.75rem; margin-top: 0.25rem; display: block;">O email não pode ser alterado</small>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Membro desde:</span>
                            <span class="info-value">${formatDate(currentUser?.created_at)}</span>
                        </div>
                    </form>
                </div>
                
                <div class="profile-section">
                    <h4>Segurança</h4>
                    <div class="profile-actions">
                        <button class="profile-btn" data-action="change-password">
                            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <circle cx="12" cy="16" r="1"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                            Alterar Senha
                        </button>
                    </div>
                </div>
                
                <div class="profile-section">
                    <h4>Dados e Backup</h4>
                    <div class="profile-actions">
                        <button class="profile-btn" data-action="export-data">
                            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Exportar Dados
                        </button>
                        <button class="profile-btn" data-action="clear-cache">
                            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                            Limpar Cache
                        </button>
                    </div>
                </div>
                
                <div class="profile-section">
                    <h4>Notificações</h4>
                    <div class="profile-toggles">
                        <label class="toggle-item">
                            <input type="checkbox" id="notifications-enabled" checked>
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Notificações Push</span>
                        </label>
                        <label class="toggle-item">
                            <input type="checkbox" id="daily-reminders" checked>
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Lembretes Diários</span>
                        </label>
                    </div>
                </div>
            </div>
            
            <div class="modal-buttons">
                <button type="button" class="btn-cancel" data-action="hide-modal">Fechar</button>
                <button type="button" class="btn-save" data-action="update-profile">Atualizar Perfil</button>
                <button type="button" class="btn-save" data-action="save-settings">Salvar Configurações</button>
            </div>
        </div>
    `);
}

function hideAllPages() {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
}

// Autenticação
async function handleLogin(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Loading state
        submitBtn.innerHTML = '<div class="loading-spinner"></div> Entrando...';
        submitBtn.disabled = true;
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            throw new Error('Email e senha são obrigatórios');
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            throw error;
        }
        
        showBeautifulNotification('Bem-vindo de volta ao Organiza+!', 'success', 'general');
        console.log('✅ Usuário logado:', data.user.email);
        
    } catch (error) {
        console.error('Erro no login:', error);
        showNotification(error.message || 'Erro ao fazer login', 'error');
    } finally {
        // Restore button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Loading state
        submitBtn.innerHTML = '<div class="loading-spinner"></div> Criando conta...';
        submitBtn.disabled = true;
        
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        
        // Validações
        if (!name || name.length < 2) {
            throw new Error('Nome deve ter pelo menos 2 caracteres');
        }
        
        if (!email || !email.includes('@')) {
            throw new Error('Email inválido');
        }
        
        if (!password || password.length < 6) {
            throw new Error('Senha deve ter pelo menos 6 caracteres');
        }
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name,
                    display_name: name
                }
            }
        });
        
        if (error) {
            throw error;
        }
        
        showBeautifulNotification('Conta criada! Bem-vindo ao Organiza+!', 'success', 'general');
        console.log('✅ Usuário registrado:', data.user.email);
        showLogin();
        
    } catch (error) {
        console.error('Erro no registro:', error);
        showNotification(error.message || 'Erro ao criar conta', 'error');
    } finally {
        // Restore button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Função para mostrar/ocultar senha
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const button = input.parentElement.querySelector('.password-toggle');
    const icon = button.querySelector('svg');
    
    if (input.type === 'password') {
        input.type = 'text';
        // Ícone de olho fechado (senha visível)
        icon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        `;
        button.style.color = 'var(--primary)';
    } else {
        input.type = 'password';
        // Ícone de olho aberto (senha oculta)
        icon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        `;
        button.style.color = 'var(--gray-400)';
    }
}

async function logout() {
    await supabase.auth.signOut();
    showNotification('Logout realizado com sucesso!');
}

// Dashboard
async function loadDashboardData() {
    if (!currentUser) return;
    
    try {
        console.log('📊 Carregando dados do dashboard...');
        
        // Mostrar loading
        const statsElements = ['today-events', 'pending-tasks', 'medications-today'];
        statsElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<div class="loading-spinner"></div>';
        });
        
        // Carregar dados em paralelo
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];
        
        const [eventsResult, tasksResult, medicationsResult] = await Promise.allSettled([
            supabase.from('events').select('*').eq('user_id', currentUser.id).gte('date', today).lt('date', tomorrow),
            supabase.from('tasks').select('*').eq('user_id', currentUser.id).eq('completed', false),
            supabase.from('medications').select('*').eq('user_id', currentUser.id)
        ]);
        
        // Atualizar contadores
        const todayEventsEl = document.getElementById('today-events');
        if (todayEventsEl) {
            const count = eventsResult.status === 'fulfilled' ? (eventsResult.value.data?.length || 0) : 0;
            todayEventsEl.textContent = count;
            animateCounter(todayEventsEl, count);
        }
        
        const pendingTasksEl = document.getElementById('pending-tasks');
        if (pendingTasksEl) {
            const count = tasksResult.status === 'fulfilled' ? (tasksResult.value.data?.length || 0) : 0;
            pendingTasksEl.textContent = count;
            animateCounter(pendingTasksEl, count);
        }
        
        const medicationsTodayEl = document.getElementById('medications-today');
        if (medicationsTodayEl) {
            const count = medicationsResult.status === 'fulfilled' ? (medicationsResult.value.data?.length || 0) : 0;
            medicationsTodayEl.textContent = count;
            animateCounter(medicationsTodayEl, count);
        }
        
        console.log('✅ Dados do dashboard carregados');
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados do dashboard:', error);
        showNotification('Erro ao carregar dados do dashboard', 'error');
    }
}

function animateCounter(element, targetValue) {
    const startValue = 0;
    const duration = 1000;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
        
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Calendário
function loadCalendar() {
    renderCalendar();
    loadEvents();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthHeader = document.getElementById('current-month');
    
    if (!grid || !monthHeader) return;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    monthHeader.textContent = new Intl.DateTimeFormat('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
    }).format(currentDate);
    
    // Limpar grid
    grid.innerHTML = '';
    
    // Dias da semana
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    weekDays.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day-header';
        dayElement.textContent = day;
        grid.appendChild(dayElement);
    });
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Renderizar dias
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.dataset.day = date.getDate();
        
        // Criar elemento para o número do dia
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayElement.appendChild(dayNumber);
        
        if (date.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }
        
        if (date.toDateString() === new Date().toDateString()) {
            dayElement.classList.add('today');
        }
        
        dayElement.addEventListener('click', (e) => {
            // Não abrir modal se clicou em um evento
            if (e.target.closest('.event-dot, .event-text')) {
                return;
            }
            
            // Destacar dia selecionado
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
            dayElement.classList.add('selected');
            showAddEvent(date);
        });
        
        grid.appendChild(dayElement);
    }
}

async function loadEvents() {
    if (!currentUser) return;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', currentUser.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
    
    displayEvents(events || []);
    addEventsToCalendar(events || []);
}

function addEventsToCalendar(events) {
    // Agrupar eventos por data
    const eventsByDate = {};
    events.forEach(event => {
        const dateKey = event.date;
        if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
    });
    
    // Adicionar eventos aos dias do calendário
    document.querySelectorAll('.calendar-day').forEach(dayElement => {
        const dayNumber = parseInt(dayElement.dataset.day);
        if (isNaN(dayNumber)) return;
        
        // Limpar eventos anteriores primeiro
        const existingEvents = dayElement.querySelector('.day-events');
        if (existingEvents) {
            existingEvents.remove();
        }
        
        // Calcular a data correta do dia baseada na posição no grid
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        // Encontrar o índice do dia no grid
        const dayIndex = Array.from(dayElement.parentNode.children).indexOf(dayElement) - 7; // -7 para pular os headers
        if (dayIndex < 0) return; // É um header
        
        const actualDate = new Date(startDate);
        actualDate.setDate(startDate.getDate() + dayIndex);
        const dateKey = actualDate.toISOString().split('T')[0];
        const isCurrentMonth = actualDate.getMonth() === month;
        
        // Só mostrar eventos se for do mês atual
        if (isCurrentMonth && eventsByDate[dateKey]) {
            const eventsForDay = eventsByDate[dateKey];
            
            // Criar container para eventos
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'day-events';
            
            // Adicionar pontos indicadores (máximo 3)
            const maxDots = Math.min(3, eventsForDay.length);
            for (let i = 0; i < maxDots; i++) {
                const eventDot = document.createElement('div');
                eventDot.className = 'event-dot';
                eventDot.style.backgroundColor = getEventColor(i);
                eventDot.title = `${eventsForDay[i].time || ''} ${eventsForDay[i].title}`.trim();
                eventsContainer.appendChild(eventDot);
            }
            
            // Adicionar textos dos eventos (máximo 2 visíveis)
            const maxVisible = 2;
            eventsForDay.slice(0, maxVisible).forEach((event, index) => {
                const eventText = document.createElement('div');
                eventText.className = 'event-text';
                eventText.textContent = event.title;
                eventText.style.borderLeftColor = getEventColor(index);
                eventText.title = `${event.time || ''} ${event.title}\n${event.description || ''}`.trim();
                eventText.dataset.eventId = event.id;
                
                // Adicionar listener para mostrar detalhes
                eventText.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showEventDetails(event);
                });
                
                eventsContainer.appendChild(eventText);
            });
            
            // Mostrar indicador se há mais eventos
            if (eventsForDay.length > 2) {
                const moreIndicator = document.createElement('div');
                moreIndicator.className = 'more-events';
                moreIndicator.textContent = `+${eventsForDay.length - 2} mais`;
                moreIndicator.title = `${eventsForDay.length} eventos no total`;
                
                // Adicionar listener para mostrar todos os eventos do dia
                moreIndicator.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showDayEvents(dateKey, eventsForDay);
                });
                
                eventsContainer.appendChild(moreIndicator);
            }
            
            dayElement.appendChild(eventsContainer);
            dayElement.classList.add('has-events');
        }
    });
}

function getEventColor(index) {
    const colors = [
        '#2563eb', // Azul
        '#06b6d4', // Ciano
        '#10b981', // Verde
        '#f59e0b', // Amarelo
        '#ef4444', // Vermelho
        '#8b5cf6', // Roxo
        '#f97316', // Laranja
        '#ec4899'  // Rosa
    ];
    return colors[index % colors.length];
}

function showEventDetails(event) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    showModal(`
        <div class="event-details">
            <div class="event-details-header">
                <svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <h3>${event.title}</h3>
            </div>
            
            <div class="event-details-content">
                <div class="event-detail-item">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>${formattedDate}</span>
                </div>
                
                ${event.time ? `
                    <div class="event-detail-item">
                        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12,6 12,12 16,14"/>
                        </svg>
                        <span>${event.time}</span>
                    </div>
                ` : ''}
                
                ${event.description ? `
                    <div class="event-detail-item description">
                        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        <span>${event.description}</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="modal-buttons">
                <button type="button" class="btn-cancel" data-action="hide-modal">Fechar</button>
                <button type="button" class="btn-save" data-action="edit-event" data-event-id="${event.id}">Editar</button>
            </div>
        </div>
    `);
}

function showDayEvents(dateKey, events) {
    const eventDate = new Date(dateKey);
    const formattedDate = eventDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const eventsHtml = events.map((event, index) => `
        <div class="day-event-item" data-event-id="${event.id}">
            <div class="event-color-bar" style="background-color: ${getEventColor(index)}"></div>
            <div class="event-info">
                <div class="event-title">${event.title}</div>
                <div class="event-time">${event.time || 'Sem horário'}</div>
                ${event.description ? `<div class="event-desc">${event.description}</div>` : ''}
            </div>
        </div>
    `).join('');
    
    showModal(`
        <div class="day-events-modal">
            <div class="day-events-header">
                <svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <h3>Eventos de ${formattedDate}</h3>
            </div>
            
            <div class="day-events-list">
                ${eventsHtml}
            </div>
            
            <div class="modal-buttons">
                <button type="button" class="btn-cancel" data-action="hide-modal">Fechar</button>
                <button type="button" class="btn-save" data-action="add-event">Novo Evento</button>
            </div>
        </div>
    `);
    
    // Adicionar listeners para os eventos individuais
    document.querySelectorAll('.day-event-item').forEach(item => {
        item.addEventListener('click', () => {
            const eventId = item.dataset.eventId;
            const event = events.find(e => e.id === eventId);
            if (event) {
                hideModal();
                setTimeout(() => showEventDetails(event), 100);
            }
        });
    });
}

function editEvent(eventId) {
    // Buscar o evento no banco de dados
    supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
        .then(({ data: event, error }) => {
            if (error) {
                showNotification('Erro ao carregar evento', 'error');
                return;
            }
            
            hideModal();
            setTimeout(() => {
                showModal(`
                    <h3>Editar Evento</h3>
                    <form id="edit-event-form" data-event-id="${event.id}">
                        <div class="input-group">
                            <label>Título</label>
                            <input type="text" id="edit-event-title" value="${event.title}" required>
                        </div>
                        <div class="input-group">
                            <label>Data</label>
                            <input type="date" id="edit-event-date" value="${event.date}" required>
                        </div>
                        <div class="input-group">
                            <label>Horário</label>
                            <input type="time" id="edit-event-time" value="${event.time || ''}">
                        </div>
                        <div class="input-group">
                            <label>Descrição</label>
                            <textarea id="edit-event-description">${event.description || ''}</textarea>
                        </div>
                        <div class="modal-buttons">
                            <button type="button" class="btn-cancel" data-action="hide-modal">Cancelar</button>
                            <button type="submit" class="btn-save">Salvar Alterações</button>
                            <button type="button" class="btn-delete" data-action="delete-event" data-event-id="${event.id}">Excluir</button>
                        </div>
                    </form>
                `);
            }, 100);
        });
}

async function updateEvent(e, eventId) {
    e.preventDefault();
    
    const eventData = {
        title: document.getElementById('edit-event-title').value,
        date: document.getElementById('edit-event-date').value,
        time: document.getElementById('edit-event-time').value,
        description: document.getElementById('edit-event-description').value
    };
    
    const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId);
    
    if (error) {
        showNotification('Erro ao atualizar evento', 'error');
    } else {
        showNotification('Evento atualizado com sucesso!');
        hideModal();
        loadCalendar();
        loadDashboardData();
    }
}

async function deleteEvent(eventId) {
    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
    
    if (error) {
        showBeautifulNotification('Erro ao excluir evento', 'error', 'calendar');
    } else {
        showBeautifulNotification('Evento excluído com sucesso!', 'success', 'calendar');
        hideModal();
        loadCalendar();
        loadDashboardData();
    }
}

// Funcionalidades de configuração
async function exportUserData() {
    if (!currentUser) return;
    
    try {
        showNotification('Exportando dados...', 'info');
        
        const [eventsResult, tasksResult, notesResult, habitsResult, medicationsResult] = await Promise.allSettled([
            supabase.from('events').select('*').eq('user_id', currentUser.id),
            supabase.from('tasks').select('*').eq('user_id', currentUser.id),
            supabase.from('notes').select('*').eq('user_id', currentUser.id),
            supabase.from('habits').select('*').eq('user_id', currentUser.id),
            supabase.from('medications').select('*').eq('user_id', currentUser.id)
        ]);
        
        const exportData = {
            user: {
                email: currentUser.email,
                name: currentUser.user_metadata?.name,
                created_at: currentUser.created_at
            },
            export_date: new Date().toISOString(),
            data: {
                events: eventsResult.status === 'fulfilled' ? eventsResult.value.data : [],
                tasks: tasksResult.status === 'fulfilled' ? tasksResult.value.data : [],
                notes: notesResult.status === 'fulfilled' ? notesResult.value.data : [],
                habits: habitsResult.status === 'fulfilled' ? habitsResult.value.data : [],
                medications: medicationsResult.status === 'fulfilled' ? medicationsResult.value.data : []
            }
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `organiza-plus-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('✅ Dados exportados com sucesso!');
        
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        showNotification('Erro ao exportar dados', 'error');
    }
}

async function clearAppCache() {
    try {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        localStorage.clear();
        showNotification('✅ Cache limpo com sucesso!');
        
        setTimeout(() => window.location.reload(), 1000);
        
    } catch (error) {
        console.error('Erro ao limpar cache:', error);
        showNotification('Erro ao limpar cache', 'error');
    }
}

async function updateUserProfile() {
    try {
        const name = document.getElementById('profile-name')?.value?.trim();
        
        if (!name || name.length < 2) {
            showBeautifulNotification('Nome deve ter pelo menos 2 caracteres', 'warning', 'general');
            return;
        }
        
        const { error } = await supabase.auth.updateUser({
            data: {
                name: name,
                display_name: name
            }
        });
        
        if (error) {
            throw error;
        }
        
        // Atualizar o nome no header
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) {
            userNameEl.textContent = `Olá, ${name}!`;
        }
        
        showBeautifulNotification('Perfil atualizado com sucesso!', 'success', 'general');
        
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        showBeautifulNotification('Erro ao atualizar perfil', 'error', 'general');
    }
}

function saveUserSettings() {
    try {
        const notificationsEnabled = document.getElementById('notifications-enabled')?.checked;
        const dailyReminders = document.getElementById('daily-reminders')?.checked;
        
        const settings = {
            notifications: notificationsEnabled,
            dailyReminders: dailyReminders,
            updated_at: new Date().toISOString()
        };
        
        localStorage.setItem('organiza-plus-settings', JSON.stringify(settings));
        
        if (dailyReminders) {
            scheduleDailyReminders();
        }
        
        showBeautifulNotification('✅ Configurações salvas!', 'success', 'general');
        
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        showBeautifulNotification('Erro ao salvar configurações', 'error', 'general');
    }
}

// Funções de segurança
function showForgotPassword() {
    showModal(`
        <div class="forgot-password-modal">
            <div class="modal-header">
                <svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                </svg>
                <h3>Recuperar Senha</h3>
            </div>
            
            <p style="color: var(--gray-600); margin-bottom: 1.5rem; text-align: center;">Digite seu email para receber um link de recuperação de senha</p>
            
            <form id="forgot-password-form">
                <div class="input-group">
                    <label>Email</label>
                    <input type="email" id="forgot-email" placeholder="Digite seu email" required>
                </div>
                
                <div class="modal-buttons">
                    <button type="button" class="btn-cancel" data-action="hide-modal">Cancelar</button>
                    <button type="submit" class="btn-save">Enviar Link</button>
                </div>
            </form>
        </div>
    `);
}

function showChangePassword() {
    showModal(`
        <div class="change-password-modal">
            <div class="modal-header">
                <svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <h3>Alterar Senha</h3>
            </div>
            
            <form id="change-password-form">
                <div class="input-group">
                    <label>Nova Senha</label>
                    <div class="password-input">
                        <input type="password" id="new-password" placeholder="Digite sua nova senha" required>
                        <button type="button" class="password-toggle" data-target="new-password">
                            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </button>
                    </div>
                    <small style="color: var(--gray-500); font-size: 0.75rem;">Mínimo 6 caracteres</small>
                </div>
                
                <div class="input-group">
                    <label>Confirmar Nova Senha</label>
                    <div class="password-input">
                        <input type="password" id="confirm-password" placeholder="Confirme sua nova senha" required>
                        <button type="button" class="password-toggle" data-target="confirm-password">
                            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="modal-buttons">
                    <button type="button" class="btn-cancel" data-action="hide-modal">Cancelar</button>
                    <button type="submit" class="btn-save">Alterar Senha</button>
                </div>
            </form>
        </div>
    `);
}

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.innerHTML = '<div class="loading-spinner"></div> Enviando...';
        submitBtn.disabled = true;
        
        const email = document.getElementById('forgot-email').value.trim();
        
        if (!email) {
            throw new Error('Email é obrigatório');
        }
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });
        
        if (error) {
            throw error;
        }
        
        showBeautifulNotification('Link de recuperação enviado para seu email!', 'success', 'general');
        hideModal();
        
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        showBeautifulNotification(error.message || 'Erro ao enviar email', 'error', 'general');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.innerHTML = '<div class="loading-spinner"></div> Alterando...';
        submitBtn.disabled = true;
        
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!newPassword || newPassword.length < 6) {
            throw new Error('Nova senha deve ter pelo menos 6 caracteres');
        }
        
        if (newPassword !== confirmPassword) {
            throw new Error('As senhas não coincidem');
        }
        
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        
        if (error) {
            throw error;
        }
        
        showBeautifulNotification('Senha alterada com sucesso!', 'success', 'general');
        hideModal();
        
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        showBeautifulNotification(error.message || 'Erro ao alterar senha', 'error', 'general');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function loadUserSettings() {
    try {
        const savedSettings = localStorage.getItem('organiza-plus-settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            if (settings.dailyReminders) {
                scheduleDailyReminders();
            }
            
            console.log('⚙️ Configurações carregadas:', settings);
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

// Página de estatísticas
function showStats() {
    if (!currentUser) return;
    
    showModal(`
        <div class="stats-modal">
            <div class="stats-header">
                <svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3v18h18"/>
                    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                </svg>
                <h3>Suas Estatísticas</h3>
            </div>
            
            <div class="stats-content">
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-number" id="total-events">0</div>
                        <div class="stat-label">Eventos Criados</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number" id="total-tasks">0</div>
                        <div class="stat-label">Tarefas Criadas</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number" id="completed-tasks">0</div>
                        <div class="stat-label">Tarefas Concluídas</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number" id="total-notes">0</div>
                        <div class="stat-label">Notas Criadas</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number" id="total-habits">0</div>
                        <div class="stat-label">Hábitos Ativos</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number" id="days-active">0</div>
                        <div class="stat-label">Dias Ativo</div>
                    </div>
                </div>
                
                <div class="productivity-chart">
                    <h4>Produtividade Semanal</h4>
                    <div class="chart-container" id="productivity-chart">
                        <div class="loading">Carregando estatísticas...</div>
                    </div>
                </div>
            </div>
            
            <div class="modal-buttons">
                <button type="button" class="btn-cancel" data-action="hide-modal">Fechar</button>
                <button type="button" class="btn-save" data-action="export-stats">Exportar Relatório</button>
            </div>
        </div>
    `);
    
    loadStatsData();
}

async function loadStatsData() {
    if (!currentUser) return;
    
    try {
        const [eventsResult, tasksResult, notesResult, habitsResult] = await Promise.allSettled([
            supabase.from('events').select('*').eq('user_id', currentUser.id),
            supabase.from('tasks').select('*').eq('user_id', currentUser.id),
            supabase.from('notes').select('*').eq('user_id', currentUser.id),
            supabase.from('habits').select('*').eq('user_id', currentUser.id)
        ]);
        
        const events = eventsResult.status === 'fulfilled' ? eventsResult.value.data : [];
        const tasks = tasksResult.status === 'fulfilled' ? tasksResult.value.data : [];
        const notes = notesResult.status === 'fulfilled' ? notesResult.value.data : [];
        const habits = habitsResult.status === 'fulfilled' ? habitsResult.value.data : [];
        
        // Atualizar estatísticas
        const totalEventsEl = document.getElementById('total-events');
        if (totalEventsEl) {
            animateCounter(totalEventsEl, events.length);
        }
        
        const totalTasksEl = document.getElementById('total-tasks');
        if (totalTasksEl) {
            animateCounter(totalTasksEl, tasks.length);
        }
        
        const completedTasksEl = document.getElementById('completed-tasks');
        const completedCount = tasks.filter(t => t.completed).length;
        if (completedTasksEl) {
            animateCounter(completedTasksEl, completedCount);
        }
        
        const totalNotesEl = document.getElementById('total-notes');
        if (totalNotesEl) {
            animateCounter(totalNotesEl, notes.length);
        }
        
        const totalHabitsEl = document.getElementById('total-habits');
        if (totalHabitsEl) {
            animateCounter(totalHabitsEl, habits.length);
        }
        
        const daysActiveEl = document.getElementById('days-active');
        const daysActive = Math.floor((new Date() - new Date(currentUser.created_at)) / (1000 * 60 * 60 * 24));
        if (daysActiveEl) {
            animateCounter(daysActiveEl, daysActive);
        }
        
        // Gerar gráfico de produtividade
        generateProductivityChart(tasks);
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        showNotification('Erro ao carregar estatísticas', 'error');
    }
}

function generateProductivityChart(tasks) {
    const chartContainer = document.getElementById('productivity-chart');
    if (!chartContainer) return;
    
    // Agrupar tarefas por dia da semana
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const tasksByDay = new Array(7).fill(0);
    
    tasks.forEach(task => {
        if (task.completed && task.updated_at) {
            const dayOfWeek = new Date(task.updated_at).getDay();
            tasksByDay[dayOfWeek]++;
        }
    });
    
    const maxTasks = Math.max(...tasksByDay, 1);
    
    chartContainer.innerHTML = `
        <div class="chart-bars">
            ${weekDays.map((day, index) => `
                <div class="chart-bar-container">
                    <div class="chart-bar" style="height: ${(tasksByDay[index] / maxTasks) * 100}%">
                        <span class="bar-value">${tasksByDay[index]}</span>
                    </div>
                    <div class="chart-label">${day}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function exportStatsReport() {
    if (!currentUser) return;
    
    try {
        const statsData = {
            user: {
                email: currentUser.email,
                name: currentUser.user_metadata?.name
            },
            report_date: new Date().toISOString(),
            period: 'Todos os tempos',
            statistics: {
                total_events: document.getElementById('total-events')?.textContent || '0',
                total_tasks: document.getElementById('total-tasks')?.textContent || '0',
                completed_tasks: document.getElementById('completed-tasks')?.textContent || '0',
                total_notes: document.getElementById('total-notes')?.textContent || '0',
                total_habits: document.getElementById('total-habits')?.textContent || '0',
                days_active: document.getElementById('days-active')?.textContent || '0'
            }
        };
        
        const reportContent = `
# Organiza+ - Relatório de Estatísticas

**Usuário:** ${statsData.user.name || statsData.user.email}
**Data do Relatório:** ${new Date().toLocaleDateString('pt-BR')}
**Período:** ${statsData.period}

## Resumo Geral

- **Eventos Criados:** ${statsData.statistics.total_events}
- **Tarefas Criadas:** ${statsData.statistics.total_tasks}
- **Tarefas Concluídas:** ${statsData.statistics.completed_tasks}
- **Notas Criadas:** ${statsData.statistics.total_notes}
- **Hábitos Ativos:** ${statsData.statistics.total_habits}
- **Dias Ativo:** ${statsData.statistics.days_active}

## Produtividade

**Taxa de Conclusão de Tarefas:** ${statsData.statistics.total_tasks > 0 ? Math.round((statsData.statistics.completed_tasks / statsData.statistics.total_tasks) * 100) : 0}%

---

*Relatório gerado pelo Organiza+ - Plataforma de Organização*
        `;
        
        const blob = new Blob([reportContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `organiza-plus-relatorio-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('✅ Relatório exportado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao exportar relatório:', error);
        showNotification('Erro ao exportar relatório', 'error');
    }
}

function displayEvents(events) {
    const eventsList = document.getElementById('events-list');
    eventsList.innerHTML = '<h3>Próximos Eventos</h3>';
    
    if (events.length === 0) {
        eventsList.innerHTML += '<p style="color: #666; text-align: center; padding: 20px;">Nenhum evento encontrado</p>';
        return;
    }
    
    events.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        eventElement.innerHTML = `
            <div class="event-time">${formatDate(event.date)} ${event.time || ''}</div>
            <div class="event-title">${event.title}</div>
            <div class="event-description">${event.description || ''}</div>
        `;
        eventsList.appendChild(eventElement);
    });
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    loadEvents();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    loadEvents();
}

function selectDate(date) {
    showAddEvent(date);
}

// Tarefas
let allTasks = [];
let filteredTasks = [];

async function loadTasks() {
    if (!currentUser) return;
    
    try {
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allTasks = tasks || [];
        applyTaskFilters();
        
        // Configurar busca
        setupTasksSearch();
        
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
        showNotification('Erro ao carregar tarefas', 'error');
    }
}

function applyTaskFilters() {
    let filtered = [...allTasks];
    
    // Filtro por status
    if (currentFilter === 'pending') {
        filtered = filtered.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filtered = filtered.filter(task => task.completed);
    }
    
    // Filtro por busca
    const searchInput = document.getElementById('tasks-search');
    if (searchInput && searchInput.value.trim()) {
        const searchTerm = searchInput.value.toLowerCase().trim();
        filtered = filtered.filter(task => 
            task.title.toLowerCase().includes(searchTerm) ||
            (task.description && task.description.toLowerCase().includes(searchTerm))
        );
    }
    
    filteredTasks = filtered;
    displayTasks(filteredTasks);
}

function setupTasksSearch() {
    const searchInput = document.getElementById('tasks-search');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyTaskFilters();
        }, 300);
    });
}

function displayTasks(tasks) {
    const tasksList = document.getElementById('tasks-list');
    tasksList.innerHTML = '';
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">Nenhuma tarefa encontrada</p>';
        return;
    }
    
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'completed' : ''}" data-task-id="${task.id}" data-completed="${!task.completed}">
                <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: ${task.completed ? 'block' : 'none'}">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
            </div>
            <div class="task-content">
                <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                <div class="task-due">${task.due_date ? formatDate(task.due_date) : 'Sem prazo'}</div>
            </div>
            <button class="delete-btn" data-type="task" data-id="${task.id}" title="Excluir tarefa">
                <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                </svg>
            </button>
        `;
        
        // Adicionar listener para checkbox
        const checkbox = taskElement.querySelector('.task-checkbox');
        checkbox.addEventListener('click', () => {
            const taskId = checkbox.dataset.taskId;
            const completed = checkbox.dataset.completed === 'true';
            toggleTask(taskId, completed);
        });
        tasksList.appendChild(taskElement);
    });
}

async function toggleTask(taskId, completed) {
    const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', taskId);
    
    if (!error) {
        loadTasks();
        loadDashboardData();
        showBeautifulNotification(
            completed ? 'Parabéns! Tarefa concluída!' : 'Tarefa reaberta', 
            completed ? 'success' : 'info', 
            'tasks'
        );
    } else {
        showBeautifulNotification('Erro ao atualizar tarefa', 'error', 'tasks');
    }
}

function filterTasks(filter, element) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');
    applyTaskFilters();
}

// Saúde
async function loadHealthData() {
    showHealthTab('medications');
    loadMedications();
}

function showHealthTab(tab, element) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (element) element.classList.add('active');
    else document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
    
    document.getElementById(`${tab}-tab`)?.classList.add('active');
    
    if (tab === 'medications') loadMedications();
    else if (tab === 'appointments') loadAppointments();
    else if (tab === 'vitals') loadVitals();
}

async function loadMedications() {
    if (!currentUser) return;
    
    const { data: medications } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
    
    const medicationsList = document.getElementById('medications-list');
    medicationsList.innerHTML = '';
    
    if (!medications || medications.length === 0) {
        medicationsList.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">Nenhum medicamento cadastrado</p>';
        return;
    }
    
    medications.forEach(med => {
        const medElement = document.createElement('div');
        medElement.className = 'medication-item';
        medElement.innerHTML = `
            <div class="medication-content">
                <div class="medication-name">${med.name}</div>
                <div class="medication-schedule">Dosagem: ${med.dosage}</div>
                <div class="medication-schedule">Horário: ${med.schedule}</div>
            </div>
            <button class="delete-btn" data-type="medication" data-id="${med.id}" title="Excluir medicamento">
                <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                </svg>
            </button>
        `;
        medicationsList.appendChild(medElement);
    });
}

async function loadAppointments() {
    if (!currentUser) return;
    
    const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: true });
    
    const appointmentsList = document.getElementById('appointments-list');
    appointmentsList.innerHTML = '';
    
    if (!appointments || appointments.length === 0) {
        appointmentsList.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">Nenhuma consulta agendada</p>';
        return;
    }
    
    appointments.forEach(apt => {
        const aptElement = document.createElement('div');
        aptElement.className = 'appointment-item';
        aptElement.innerHTML = `
            <div class="appointment-title">${apt.title}</div>
            <div class="appointment-date">${formatDate(apt.date)} às ${apt.time}</div>
            <div class="appointment-date">Local: ${apt.location || 'Não informado'}</div>
        `;
        appointmentsList.appendChild(aptElement);
    });
}

function loadVitals() {
    document.getElementById('vitals-list').innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">Funcionalidade em desenvolvimento</p>';
}

// Notas
let allNotes = [];
let filteredNotes = [];

async function loadNotes() {
    if (!currentUser) return;
    
    try {
        const { data: notes, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        allNotes = notes || [];
        filteredNotes = [...allNotes];
        displayNotes(filteredNotes);
        
        // Configurar busca
        setupNotesSearch();
        
    } catch (error) {
        console.error('Erro ao carregar notas:', error);
        showNotification('Erro ao carregar notas', 'error');
    }
}

function displayNotes(notes) {
    const notesGrid = document.getElementById('notes-grid');
    notesGrid.innerHTML = '';
    
    if (!notes || notes.length === 0) {
        notesGrid.innerHTML = `
            <div class="empty-state">
                <svg class="icon icon-xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <h3>Nenhuma nota encontrada</h3>
                <p>Crie sua primeira nota para começar a organizar suas ideias</p>
            </div>
        `;
        return;
    }
    
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item fade-in';
        noteElement.innerHTML = `
            <div class="note-title">${highlightSearchTerm(note.title)}</div>
            <div class="note-preview">${highlightSearchTerm(note.content)}</div>
            <div class="note-date">${formatDate(note.updated_at)}</div>
        `;
        noteElement.addEventListener('click', () => editNote(note));
        noteElement.style.cursor = 'pointer';
        notesGrid.appendChild(noteElement);
    });
}

function setupNotesSearch() {
    const searchInput = document.getElementById('notes-search');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            if (!searchTerm) {
                filteredNotes = [...allNotes];
            } else {
                filteredNotes = allNotes.filter(note => 
                    note.title.toLowerCase().includes(searchTerm) ||
                    note.content.toLowerCase().includes(searchTerm)
                );
            }
            
            displayNotes(filteredNotes);
        }, 300);
    });
}

function highlightSearchTerm(text) {
    const searchInput = document.getElementById('notes-search');
    if (!searchInput || !searchInput.value.trim()) return text;
    
    const searchTerm = searchInput.value.trim();
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Hábitos
async function loadHabits() {
    if (!currentUser) return;
    
    const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
    
    const habitsList = document.getElementById('habits-list');
    habitsList.innerHTML = '';
    
    if (!habits || habits.length === 0) {
        habitsList.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">Nenhum hábito cadastrado</p>';
        return;
    }
    
    habits.forEach(habit => {
        const habitElement = document.createElement('div');
        habitElement.className = 'habit-item';
        habitElement.innerHTML = `
            <div class="habit-content">
                <div class="habit-header">
                    <div class="habit-name">${habit.name}</div>
                    <div class="habit-streak">${habit.streak || 0} dias</div>
                </div>
                <div class="habit-progress">
                    ${generateProgressDays(habit)}
                </div>
            </div>
            <button class="delete-btn" data-type="habit" data-id="${habit.id}" title="Excluir hábito">
                <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                </svg>
            </button>
        `;
        habitsList.appendChild(habitElement);
    });
}

function generateProgressDays(habit) {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayNumber = date.getDate();
        const isToday = i === 0;
        const isCompleted = Math.random() > 0.5; // Simulação - implementar lógica real
        
        days.push(`
            <div class="progress-day ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}">
                ${dayNumber}
            </div>
        `);
    }
    
    return days.join('');
}

// Modais
function showModal(content) {
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('modal-overlay').classList.add('active');
}

function hideModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

// Adicionar eventos
function showAddEvent(selectedDate = null) {
    const date = selectedDate || new Date();
    const dateStr = date.toISOString().split('T')[0];
    
    showModal(`
        <h3>Novo Evento</h3>
        <form id="add-event-form">
            <div class="input-group">
                <label>Título</label>
                <input type="text" id="event-title" required>
            </div>
            <div class="input-group">
                <label>Data</label>
                <input type="date" id="event-date" value="${dateStr}" required>
            </div>
            <div class="input-group">
                <label>Horário</label>
                <input type="time" id="event-time">
            </div>
            <div class="input-group">
                <label>Descrição</label>
                <textarea id="event-description"></textarea>
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn-cancel" data-action="hide-modal">Cancelar</button>
                <button type="submit" class="btn-save">Salvar</button>
            </div>
        </form>
    `);
    
    const form = document.getElementById('add-event-form');
    if (form) form.dataset.noteId = '';
}

async function saveEvent(e) {
    e.preventDefault();
    
    const eventData = {
        user_id: currentUser.id,
        title: document.getElementById('event-title').value,
        date: document.getElementById('event-date').value,
        time: document.getElementById('event-time').value,
        description: document.getElementById('event-description').value
    };
    
    const { error } = await supabase.from('events').insert([eventData]);
    
    if (error) {
        showBeautifulNotification('Erro ao salvar evento', 'error', 'calendar');
    } else {
        showBeautifulNotification('Evento criado com sucesso!', 'success', 'calendar');
        hideModal();
        loadCalendar();
        loadDashboardData();
        scheduleNotification(eventData);
    }
}

// Adicionar tarefas
function showAddTask() {
    showModal(`
        <h3>Nova Tarefa</h3>
        <form id="add-task-form">
            <div class="input-group">
                <label>Título</label>
                <input type="text" id="task-title" required>
            </div>
            <div class="input-group">
                <label>Descrição</label>
                <textarea id="task-description"></textarea>
            </div>
            <div class="input-group">
                <label>Data de Vencimento</label>
                <input type="date" id="task-due-date">
            </div>
            <div class="input-group">
                <label>Prioridade</label>
                <select id="task-priority">
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                </select>
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn-cancel" data-action="hide-modal">Cancelar</button>
                <button type="submit" class="btn-save">Salvar</button>
            </div>
        </form>
    `);
    
    // Form será tratado pelo event delegation
}

async function saveTask(e) {
    e.preventDefault();
    
    const taskData = {
        user_id: currentUser.id,
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        due_date: document.getElementById('task-due-date').value,
        priority: document.getElementById('task-priority').value,
        completed: false
    };
    
    const { error } = await supabase.from('tasks').insert([taskData]);
    
    if (error) {
        showBeautifulNotification('Erro ao salvar tarefa', 'error', 'tasks');
    } else {
        showBeautifulNotification('Nova tarefa adicionada!', 'success', 'tasks');
        hideModal();
        loadTasks();
        loadDashboardData();
    }
}

// Adicionar medicamentos
function showAddMedication() {
    showModal(`
        <h3>Novo Medicamento</h3>
        <form id="add-medication-form">
            <div class="input-group">
                <label>Nome do Medicamento</label>
                <input type="text" id="medication-name" required>
            </div>
            <div class="input-group">
                <label>Dosagem</label>
                <input type="text" id="medication-dosage" placeholder="Ex: 1 comprimido" required>
            </div>
            <div class="input-group">
                <label>Horário</label>
                <input type="text" id="medication-schedule" placeholder="Ex: 8h, 14h, 20h" required>
            </div>
            <div class="input-group">
                <label>Observações</label>
                <textarea id="medication-notes"></textarea>
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn-cancel" data-action="hide-modal">Cancelar</button>
                <button type="submit" class="btn-save">Salvar</button>
            </div>
        </form>
    `);
    
    // Form será tratado pelo event delegation
}

async function saveMedication(e) {
    e.preventDefault();
    
    const medicationData = {
        user_id: currentUser.id,
        name: document.getElementById('medication-name').value,
        dosage: document.getElementById('medication-dosage').value,
        schedule: document.getElementById('medication-schedule').value,
        notes: document.getElementById('medication-notes').value
    };
    
    const { error } = await supabase.from('medications').insert([medicationData]);
    
    if (error) {
        showBeautifulNotification('Erro ao salvar medicamento', 'error', 'health');
    } else {
        showBeautifulNotification('Medicamento adicionado!', 'success', 'health');
        hideModal();
        loadMedications();
        loadDashboardData();
    }
}

// Adicionar notas
function showAddNote() {
    showModal(`
        <h3>Nova Nota</h3>
        <form id="add-note-form">
            <div class="input-group">
                <label>Título</label>
                <input type="text" id="note-title" required>
            </div>
            <div class="input-group">
                <label>Conteúdo</label>
                <textarea id="note-content" rows="6" required></textarea>
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn-cancel" data-action="hide-modal">Cancelar</button>
                <button type="submit" class="btn-save">Salvar</button>
            </div>
        </form>
    `);
    
    // Form será tratado pelo event delegation
}

async function saveNote(e) {
    e.preventDefault();
    
    const noteData = {
        user_id: currentUser.id,
        title: document.getElementById('note-title').value,
        content: document.getElementById('note-content').value
    };
    
    const { error } = await supabase.from('notes').insert([noteData]);
    
    if (error) {
        showBeautifulNotification('Erro ao salvar nota', 'error', 'notes');
    } else {
        showBeautifulNotification('Nota criada com sucesso!', 'success', 'notes');
        hideModal();
        loadNotes();
    }
}

function editNote(note) {
    showModal(`
        <h3>Editar Nota</h3>
        <form id="edit-note-form">
            <div class="input-group">
                <label>Título</label>
                <input type="text" id="edit-note-title" value="${note.title}" required>
            </div>
            <div class="input-group">
                <label>Conteúdo</label>
                <textarea id="edit-note-content" rows="6" required>${note.content}</textarea>
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn-cancel" data-action="hide-modal">Cancelar</button>
                <button type="submit" class="btn-save">Salvar</button>
                <button type="button" class="btn-delete" data-action="delete-note" data-note-id="${note.id}">Excluir</button>
            </div>
        </form>
    `);
    
    const form = document.getElementById('edit-note-form');
    if (form) form.dataset.noteId = note.id;
}

async function updateNote(e, noteId) {
    e.preventDefault();
    
    const noteData = {
        title: document.getElementById('edit-note-title').value,
        content: document.getElementById('edit-note-content').value,
        updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
        .from('notes')
        .update(noteData)
        .eq('id', noteId);
    
    if (error) {
        showNotification('Erro ao atualizar nota', 'error');
    } else {
        showNotification('Nota atualizada com sucesso!');
        hideModal();
        loadNotes();
    }
}

async function deleteNote(noteId) {
    const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);
    
    if (error) {
        showBeautifulNotification('Erro ao excluir nota', 'error', 'notes');
    } else {
        showBeautifulNotification('Nota excluída com sucesso!', 'success', 'notes');
        hideModal();
        loadNotes();
    }
}

// Adicionar hábitos
function showAddHabit() {
    showModal(`
        <h3>Novo Hábito</h3>
        <form id="add-habit-form">
            <div class="input-group">
                <label>Nome do Hábito</label>
                <input type="text" id="habit-name" required>
            </div>
            <div class="input-group">
                <label>Descrição</label>
                <textarea id="habit-description"></textarea>
            </div>
            <div class="input-group">
                <label>Frequência</label>
                <select id="habit-frequency">
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                </select>
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn-cancel" data-action="hide-modal">Cancelar</button>
                <button type="submit" class="btn-save">Salvar</button>
            </div>
        </form>
    `);
    
    // Form será tratado pelo event delegation
}

async function saveHabit(e) {
    e.preventDefault();
    
    const habitData = {
        user_id: currentUser.id,
        name: document.getElementById('habit-name').value,
        description: document.getElementById('habit-description').value,
        frequency: document.getElementById('habit-frequency').value,
        streak: 0
    };
    
    const { error } = await supabase.from('habits').insert([habitData]);
    
    if (error) {
        showBeautifulNotification('Erro ao salvar hábito', 'error', 'general');
    } else {
        showBeautifulNotification('Hábito salvo com sucesso!', 'success', 'general');
        hideModal();
        loadHabits();
    }
}

// Notificações
function requestNotificationPermission() {
    if ('Notification' in window && 'serviceWorker' in navigator) {
        Notification.requestPermission().then(permission => {
            console.log('🔔 Permissão de notificação:', permission);
            if (permission === 'granted') {
                showNotification('✅ Notificações ativadas!');
                scheduleWelcomeNotification();
            }
        });
    }
}

function scheduleWelcomeNotification() {
    setTimeout(() => {
        if (Notification.permission === 'granted') {
            new Notification('Organiza+', {
                body: 'Bem-vindo! Sua plataforma de organização está pronta.',
                icon: '/manifest.json',
                badge: '/manifest.json',
                tag: 'welcome'
            });
        }
    }, 3000);
}

function scheduleNotification(event) {
    if (Notification.permission === 'granted') {
        const eventDate = new Date(`${event.date}T${event.time || '09:00'}`);
        const now = new Date();
        const timeDiff = eventDate.getTime() - now.getTime();
        
        if (timeDiff > 0) {
            // Notificação 15 minutos antes
            const reminderTime = Math.max(0, timeDiff - 15 * 60 * 1000);
            
            setTimeout(() => {
                new Notification('Organiza+ - Lembrete', {
                    body: `📅 ${event.title} em 15 minutos`,
                    icon: '/manifest.json',
                    badge: '/manifest.json',
                    tag: `event-${event.id}`,
                    requireInteraction: true,
                    actions: [
                        { action: 'view', title: 'Ver detalhes' },
                        { action: 'dismiss', title: 'Dispensar' }
                    ]
                });
            }, reminderTime);
            
            // Notificação na hora do evento
            setTimeout(() => {
                new Notification('Organiza+ - Evento Agora', {
                    body: `⏰ ${event.title} está acontecendo agora!`,
                    icon: '/manifest.json',
                    badge: '/manifest.json',
                    tag: `event-now-${event.id}`,
                    requireInteraction: true
                });
            }, timeDiff);
        }
    }
}

function scheduleDailyReminders() {
    if (Notification.permission === 'granted' && currentUser) {
        // Lembrete diário às 9h para verificar tarefas
        const now = new Date();
        const tomorrow9AM = new Date(now);
        tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
        tomorrow9AM.setHours(9, 0, 0, 0);
        
        const timeUntil9AM = tomorrow9AM.getTime() - now.getTime();
        
        setTimeout(() => {
            new Notification('Organiza+ - Bom dia!', {
                body: '🌅 Que tal verificar suas tarefas de hoje?',
                icon: '/manifest.json',
                tag: 'daily-reminder'
            });
            
            // Reagendar para o próximo dia
            scheduleDailyReminders();
        }, timeUntil9AM);
    }
}

// Notificações bonitas para todas as ações
function showBeautifulNotification(message, type = 'success', category = 'general') {
    const notification = document.createElement('div');
    notification.className = `beautiful-notification ${type} ${category}`;
    
    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    
    const categoryIcons = {
        calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        tasks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
        notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>',
        health: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
        general: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'
    };
    
    notification.innerHTML = `
        <div class="notification-wrapper">
            <div class="notification-icon-container">
                <div class="category-icon">${categoryIcons[category] || categoryIcons.general}</div>
                <div class="status-icon">${icons[type] || icons.info}</div>
            </div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
                <div class="notification-progress"></div>
            </div>
            <button class="notification-close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
    `;
    
    // Remover notificações antigas
    document.querySelectorAll('.beautiful-notification').forEach(n => {
        n.classList.add('removing');
        setTimeout(() => n.remove(), 200);
    });
    
    document.body.appendChild(notification);
    
    // Animação de entrada
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // Progress bar
    const progressBar = notification.querySelector('.notification-progress');
    const duration = type === 'error' ? 5000 : 3000;
    
    setTimeout(() => {
        progressBar.style.width = '0%';
        progressBar.style.transition = `width ${duration}ms linear`;
    }, 100);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto-remover
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
    
    // Vibração e som
    if ('vibrate' in navigator) {
        const patterns = {
            success: [100],
            error: [100, 100, 100],
            warning: [100, 50, 100],
            info: [50]
        };
        navigator.vibrate(patterns[type] || patterns.info);
    }
    
    // Som (opcional)
    playNotificationSound(type);
}

function playNotificationSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const frequencies = {
            success: [523, 659, 784], // C, E, G
            error: [220, 185], // A, F#
            warning: [440, 554], // A, C#
            info: [440] // A
        };
        
        const freqs = frequencies[type] || frequencies.info;
        
        freqs.forEach((freq, index) => {
            setTimeout(() => {
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            }, index * 100);
        });
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        // Silenciosamente falhar se não suportar áudio
    }
}

// Manter função original para compatibilidade
function showNotification(message, type = 'success') {
    showBeautifulNotification(message, type, 'general');
}

// Handler geral para exclusões
function handleDelete(itemType, itemId) {
    switch(itemType) {
        case 'task': deleteTask(itemId); break;
        case 'medication': deleteMedication(itemId); break;
        case 'habit': deleteHabit(itemId); break;
        case 'note': deleteNote(itemId); break;
        case 'event': deleteEvent(itemId); break;
    }
}

// Funções de exclusão específicas
async function deleteTask(taskId) {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
    
    if (error) {
        showBeautifulNotification('Erro ao excluir tarefa', 'error', 'tasks');
    } else {
        showBeautifulNotification('Tarefa excluída com sucesso!', 'success', 'tasks');
        loadTasks();
        loadDashboardData();
    }
}

async function deleteMedication(medicationId) {
    const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', medicationId);
    
    if (error) {
        showBeautifulNotification('Erro ao excluir medicamento', 'error', 'health');
    } else {
        showBeautifulNotification('Medicamento excluído com sucesso!', 'success', 'health');
        loadMedications();
        loadDashboardData();
    }
}

async function deleteHabit(habitId) {
    const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);
    
    if (error) {
        showBeautifulNotification('Erro ao excluir hábito', 'error', 'general');
    } else {
        showBeautifulNotification('Hábito excluído com sucesso!', 'success', 'general');
        loadHabits();
    }
}

// Utilitários
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
}

// Função para fechar modal
function hideModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Fechar modal ao clicar fora e ESC
document.addEventListener('DOMContentLoaded', function() {
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                hideModal();
            }
        });
    }
    
    // Listener para tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideModal();
        }
    });
});

// Service Worker para notificações
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}

// Funções específicas para mobile
function setupMobileFeatures() {
    // Detectar se é mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        document.body.classList.add('mobile-device');
        
        // Configurar menu mobile
        setupMobileMenu();
        
        // Melhorar toques
        setupTouchEnhancements();
        
        // Configurar viewport dinâmico
        setupDynamicViewport();
        
        // Otimizar performance mobile
        setupMobilePerformance();
        
        console.log('📱 Recursos mobile ativados');
    }
}

function setupMobileMenu() {
    // Adicionar botão de menu mobile se não existir
    const dashboardHeader = document.querySelector('.dashboard-header');
    if (dashboardHeader && !document.querySelector('.mobile-menu-btn')) {
        const menuBtn = document.createElement('button');
        menuBtn.className = 'mobile-menu-btn';
        menuBtn.innerHTML = `
            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
        `;
        
        menuBtn.addEventListener('click', toggleMobileMenu);
        dashboardHeader.insertBefore(menuBtn, dashboardHeader.firstChild);
    }
    
    // Fechar menu ao clicar fora
    document.addEventListener('click', (e) => {
        const sidebar = document.querySelector('.sidebar');
        const menuBtn = document.querySelector('.mobile-menu-btn');
        
        if (sidebar && sidebar.classList.contains('mobile-open') && 
            !sidebar.contains(e.target) && 
            !menuBtn?.contains(e.target)) {
            closeMobileMenu();
        }
    });
}

function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
        
        // Adicionar overlay
        if (sidebar.classList.contains('mobile-open')) {
            const overlay = document.createElement('div');
            overlay.className = 'mobile-menu-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 99;
                backdrop-filter: blur(4px);
            `;
            overlay.addEventListener('click', closeMobileMenu);
            document.body.appendChild(overlay);
        } else {
            const overlay = document.querySelector('.mobile-menu-overlay');
            if (overlay) overlay.remove();
        }
    }
}

function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-menu-overlay');
    
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.remove();
}

function setupTouchEnhancements() {
    // Melhorar toques em elementos interativos
    const style = document.createElement('style');
    style.textContent = `
        @media (hover: none) and (pointer: coarse) {
            .btn, .task-checkbox, .delete-btn, .calendar-day, 
            .note-item, .habit-item, .medication-item, .appointment-item,
            .sidebar-nav a, .filter-btn, .tab-btn, .add-btn {
                min-height: 44px;
                min-width: 44px;
            }
            
            .password-toggle {
                min-width: 44px;
                min-height: 44px;
                padding: 0.5rem;
            }
            
            .calendar-day {
                min-height: 60px;
            }
            
            .event-text {
                min-height: 24px;
                padding: 0.25rem 0.5rem;
            }
        }
        
        .mobile-device .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
        }
        
        .mobile-device .sidebar.mobile-open {
            transform: translateX(0);
        }
    `;
    document.head.appendChild(style);
}

function setupDynamicViewport() {
    // Ajustar viewport para mobile
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', () => {
        setTimeout(setViewportHeight, 100);
    });
}

function setupMobilePerformance() {
    // Lazy loading para imagens
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // Debounce para scroll events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            // Scroll handling aqui se necessário
        }, 100);
    }, { passive: true });
    
    // Otimizar animações para mobile
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        document.body.classList.add('reduced-motion');
    }
}

// Melhorar navegação mobile
function handleNavigation(nav) {
    // Fechar menu mobile ao navegar
    closeMobileMenu();
    
    // Atualizar sidebar ativo
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-nav="${nav}"]`)?.classList.add('active');
    
    // Navegar para a página
    switch(nav) {
        case 'dashboard': showDashboard(); break;
        case 'calendar': showCalendar(); break;
        case 'tasks': showTasks(); break;
        case 'health': showHealth(); break;
        case 'notes': showNotes(); break;
        case 'habits': showHabits(); break;
    }
}

// Melhorar modais para mobile
function showModal(content) {
    const modal = document.getElementById('modal-content');
    const overlay = document.getElementById('modal-overlay');
    
    modal.innerHTML = content;
    overlay.classList.add('active');
    
    // Scroll para o topo do modal
    modal.scrollTop = 0;
    
    // Focar no primeiro input se existir
    const firstInput = modal.querySelector('input, textarea, select');
    if (firstInput && window.innerWidth > 768) {
        setTimeout(() => firstInput.focus(), 100);
    }
    
    // Prevenir scroll do body
    document.body.style.overflow = 'hidden';
}

function hideModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Melhorar notificações para mobile
function showBeautifulNotification(message, type = 'success', category = 'general') {
    const notification = document.createElement('div');
    notification.className = `beautiful-notification ${type} ${category}`;
    
    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    
    const categoryIcons = {
        calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        tasks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
        notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>',
        health: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
        general: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'
    };
    
    // Ajustar posição para mobile
    const isMobile = window.innerWidth <= 768;
    
    notification.innerHTML = `
        <div class="notification-wrapper">
            <div class="notification-icon-container">
                <div class="category-icon">${categoryIcons[category] || categoryIcons.general}</div>
                <div class="status-icon">${icons[type] || icons.info}</div>
            </div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
                <div class="notification-progress"></div>
            </div>
            <button class="notification-close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
    `;
    
    // Remover notificações antigas
    document.querySelectorAll('.beautiful-notification').forEach(n => {
        n.classList.add('removing');
        setTimeout(() => n.remove(), 200);
    });
    
    document.body.appendChild(notification);
    
    // Animação de entrada
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // Progress bar
    const progressBar = notification.querySelector('.notification-progress');
    const duration = type === 'error' ? 5000 : 3000;
    
    setTimeout(() => {
        progressBar.style.width = '0%';
        progressBar.style.transition = `width ${duration}ms linear`;
    }, 100);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto-remover
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
    
    // Vibração e som
    if ('vibrate' in navigator) {
        const patterns = {
            success: [100],
            error: [100, 100, 100],
            warning: [100, 50, 100],
            info: [50]
        };
        navigator.vibrate(patterns[type] || patterns.info);
    }
    
    // Som (opcional)
    if (!isMobile) { // Evitar sons em mobile por padrão
        playNotificationSound(type);
    }
}
// Funções de download PWA
function handleIOSDownload() {
    const btn = document.getElementById('ios-download');
    
    // Detectar se é iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
        // Mostrar instruções para adicionar à tela inicial
        showIOSInstallInstructions(btn);
    } else {
        // Simular download para outros dispositivos
        simulateDownload(btn, 'iOS');
    }
}

function handleAndroidDownload() {
    const btn = document.getElementById('android-download');
    
    // Detectar se é Android
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isAndroid) {
        // Mostrar instruções para adicionar à tela inicial
        showAndroidInstallInstructions(btn);
    } else {
        // Simular download para outros dispositivos
        simulateDownload(btn, 'Android');
    }
}

function showIOSInstallInstructions(btn) {
    btn.classList.add('downloading');
    
    setTimeout(() => {
        btn.classList.remove('downloading');
        
        showModal(`
            <div class="ios-install-modal">
                <div class="install-header">
                    <svg class="icon icon-xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                        <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                    <h3>Instalar Organiza+</h3>
                </div>
                
                <div class="install-steps">
                    <div class="install-step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <p>Toque no botão <strong>Compartilhar</strong> 📤 na parte inferior da tela</p>
                        </div>
                    </div>
                    
                    <div class="install-step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <p>Role para baixo e toque em <strong>"Adicionar à Tela Inicial"</strong> 📱</p>
                        </div>
                    </div>
                    
                    <div class="install-step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <p>Toque em <strong>"Adicionar"</strong> para confirmar ✅</p>
                        </div>
                    </div>
                </div>
                
                <div class="install-footer">
                    <p>🎉 Pronto! O Organiza+ aparecerá na sua tela inicial como um app nativo!</p>
                </div>
                
                <div class="modal-buttons">
                    <button type="button" class="btn-save" data-action="hide-modal">Entendi!</button>
                </div>
            </div>
        `);
    }, 1500);
}

function simulateDownload(btn, platform) {
    btn.classList.add('downloading');
    
    // Simular progresso de download
    setTimeout(() => {
        showDownloadSuccess(btn, platform);
    }, 2000);
}

function showDownloadSuccess(btn, platform) {
    btn.classList.remove('downloading');
    btn.classList.add('completed');
    
    // Mudar ícone para check
    const icon = btn.querySelector('.download-icon');
    icon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"/>
        </svg>
    `;
    
    // Mudar texto
    const info = btn.querySelector('.download-info');
    info.innerHTML = `
        <span class="download-label">Download</span>
        <span class="download-store">Concluído!</span>
    `;
    
    // Mostrar notificação
    showBeautifulNotification(`App ${platform} instalado com sucesso! 🎉`, 'success', 'general');
    
    // Vibração de sucesso
    if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
    }
    
    // Resetar após 3 segundos
    setTimeout(() => {
        resetDownloadButton(btn, platform);
    }, 3000);
}

function resetDownloadButton(btn, platform) {
    btn.classList.remove('completed');
    
    // Restaurar ícone original
    const icon = btn.querySelector('.download-icon');
    if (platform === 'iOS') {
        icon.innerHTML = `<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>`;
    } else if (platform === 'Android') {
        icon.innerHTML = `<path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396"/>`;
    } else {
        icon.innerHTML = `<path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.851"/>`;
    }
    
    // Restaurar texto original
    const info = btn.querySelector('.download-info');
    const storeNames = {
        'iOS': 'iOS / iPhone',
        'Android': 'Android', 
        'Windows': 'Windows'
    };
    info.innerHTML = `
        <span class="download-label">Baixar para</span>
        <span class="download-store">${storeNames[platform]}</span>
    `;
}

// Capturar evento de instalação PWA
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
});

// Função para scroll suave até a seção de download
function scrollToDownloadSection() {
    const downloadSection = document.getElementById('download-section');
    if (downloadSection) {
        // Vibração no dispositivo se suportado
        if ('vibrate' in navigator) {
            navigator.vibrate([50, 100, 50]);
        }
        
        // Scroll suave
        downloadSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
        });
        
        // Efeito de destaque na seção
        setTimeout(() => {
            downloadSection.style.transform = 'scale(1.02)';
            downloadSection.style.transition = 'transform 0.3s ease';
            
            setTimeout(() => {
                downloadSection.style.transform = 'scale(1)';
            }, 300);
        }, 500);
        
        // Notificação visual
        showBeautifulNotification('📱 Escolha sua plataforma para download!', 'info', 'general');
    }
}
function handleWindowsDownload() {
    const btn = document.getElementById('windows-download');
    
    // Detectar se é Windows
    const isWindows = navigator.platform.indexOf('Win') > -1;
    
    if (isWindows) {
        // Mostrar instruções para PWA no Windows
        showWindowsInstallInstructions(btn);
    } else {
        // Simular download para outros sistemas
        simulateDownload(btn, 'Windows');
    }
}

function showWindowsInstallInstructions(btn) {
    btn.classList.add('downloading');
    
    setTimeout(() => {
        btn.classList.remove('downloading');
        
        showModal(`
            <div class="windows-install-modal">
                <div class="install-header">
                    <svg class="icon icon-xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    <h3>Instalar Organiza+ no Windows</h3>
                </div>
                
                <div class="install-steps">
                    <div class="install-step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <p>Clique no ícone <strong>⚙️ Configurações</strong> no canto superior direito do navegador</p>
                        </div>
                    </div>
                    
                    <div class="install-step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <p>Procure por <strong>"Instalar Organiza+"</strong> ou <strong>"Adicionar à área de trabalho"</strong></p>
                        </div>
                    </div>
                    
                    <div class="install-step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <p>Clique em <strong>"Instalar"</strong> para adicionar como aplicativo nativo 💻</p>
                        </div>
                    </div>
                </div>
                
                <div class="install-footer">
                    <p>🎉 O Organiza+ será instalado como um aplicativo Windows completo!</p>
                </div>
                
                <div class="modal-buttons">
                    <button type="button" class="btn-save" data-action="hide-modal">Entendi!</button>
                </div>
            </div>
        `);
    }, 1500);
}
function showAndroidInstallInstructions(btn) {
    btn.classList.add('downloading');
    
    setTimeout(() => {
        btn.classList.remove('downloading');
        
        showModal(`
            <div class="android-install-modal">
                <div class="install-header">
                    <svg class="icon icon-xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                        <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                    <h3>Instalar Organiza+ no Android</h3>
                </div>
                
                <div class="install-steps">
                    <div class="install-step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <p>Toque no menu <strong>⋮</strong> (três pontos) no canto superior direito</p>
                        </div>
                    </div>
                    
                    <div class="install-step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <p>Procure por <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar app"</strong> 📱</p>
                        </div>
                    </div>
                    
                    <div class="install-step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <p>Toque em <strong>"Adicionar"</strong> ou <strong>"Instalar"</strong> ✅</p>
                        </div>
                    </div>
                </div>
                
                <div class="install-footer">
                    <p>🎉 O Organiza+ aparecerá na sua tela inicial como um app nativo!</p>
                </div>
                
                <div class="modal-buttons">
                    <button type="button" class="btn-save" data-action="hide-modal">Entendi!</button>
                </div>
            </div>
        `);
    }, 1500);
}

// Navegação Mobile
function setupMobileNavigation() {
    // Setup mobile menu toggles
    document.addEventListener('click', (e) => {
        if (e.target.id === 'mobile-menu-toggle' || e.target.closest('#mobile-menu-toggle')) {
            e.preventDefault();
            toggleMobileSidebar();
        }
        
        if (e.target.id === 'mobile-sidebar-overlay' || e.target.closest('#mobile-sidebar-overlay')) {
            e.preventDefault();
            closeMobileSidebar();
        }
    });
    
    // Setup mobile bottom navigation
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const nav = item.dataset.nav;
            if (nav) {
                updateMobileNavigation(nav);
                handleNavigation(nav);
            }
        });
    });
    
    // Setup mobile sidebar navigation
    document.querySelectorAll('.mobile-sidebar-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const nav = link.dataset.nav;
            if (nav) {
                closeMobileSidebar();
                updateMobileNavigation(nav);
                handleNavigation(nav);
            }
        });
    });
    
    // Setup mobile search inputs
    const mobileTasksSearch = document.getElementById('mobile-tasks-search');
    if (mobileTasksSearch) {
        mobileTasksSearch.addEventListener('input', (e) => {
            const desktopSearch = document.getElementById('tasks-search');
            if (desktopSearch) {
                desktopSearch.value = e.target.value;
                desktopSearch.dispatchEvent(new Event('input'));
            }
        });
    }
    
    const mobileNotesSearch = document.getElementById('mobile-notes-search');
    if (mobileNotesSearch) {
        mobileNotesSearch.addEventListener('input', (e) => {
            const desktopSearch = document.getElementById('notes-search');
            if (desktopSearch) {
                desktopSearch.value = e.target.value;
                desktopSearch.dispatchEvent(new Event('input'));
            }
        });
    }
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('mobile-sidebar');
    const overlay = document.getElementById('mobile-sidebar-overlay');
    
    if (sidebar && overlay) {
        const isOpen = sidebar.classList.contains('active');
        
        if (isOpen) {
            closeMobileSidebar();
        } else {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.classList.add('mobile-menu-active');
        }
    }
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('mobile-sidebar');
    const overlay = document.getElementById('mobile-sidebar-overlay');
    
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.classList.remove('mobile-menu-active');
}

function updateMobileNavigation(activeNav) {
    // Update bottom navigation
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.nav === activeNav) {
            item.classList.add('active');
        }
    });
    
    // Update sidebar navigation
    document.querySelectorAll('.mobile-sidebar-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.nav === activeNav) {
            link.classList.add('active');
        }
    });
    
    // Update mobile header title
    const headerTitle = document.querySelector('.mobile-header-title');
    if (headerTitle) {
        const titles = {
            dashboard: 'Dashboard',
            calendar: 'Calendário',
            tasks: 'Tarefas',
            health: 'Saúde',
            notes: 'Notas',
            habits: 'Hábitos'
        };
        headerTitle.textContent = titles[activeNav] || 'Organiza+';
    }
}

// Atualizar dados mobile
function updateMobileStats() {
    // Sincronizar stats mobile com desktop
    const todayEvents = document.getElementById('today-events')?.textContent || '0';
    const pendingTasks = document.getElementById('pending-tasks')?.textContent || '0';
    const medicationsToday = document.getElementById('medications-today')?.textContent || '0';
    
    const todayEventsMobile = document.getElementById('today-events-mobile');
    const pendingTasksMobile = document.getElementById('pending-tasks-mobile');
    const medicationsTodayMobile = document.getElementById('medications-today-mobile');
    const habitsStreakMobile = document.getElementById('habits-streak-mobile');
    
    if (todayEventsMobile) todayEventsMobile.textContent = todayEvents;
    if (pendingTasksMobile) pendingTasksMobile.textContent = pendingTasks;
    if (medicationsTodayMobile) medicationsTodayMobile.textContent = medicationsToday;
    if (habitsStreakMobile) habitsStreakMobile.textContent = '7'; // Placeholder
}

// Override da função loadDashboardData para incluir mobile
async function loadDashboardData() {
    if (!currentUser) return;
    
    try {
        console.log('📊 Carregando dados do dashboard...');
        
        // Mostrar loading
        const statsElements = ['today-events', 'pending-tasks', 'medications-today'];
        const mobileStatsElements = ['today-events-mobile', 'pending-tasks-mobile', 'medications-today-mobile'];
        
        [...statsElements, ...mobileStatsElements].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<div class="loading-spinner"></div>';
        });
        
        // Carregar dados em paralelo
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];
        
        const [eventsResult, tasksResult, medicationsResult] = await Promise.allSettled([
            supabase.from('events').select('*').eq('user_id', currentUser.id).gte('date', today).lt('date', tomorrow),
            supabase.from('tasks').select('*').eq('user_id', currentUser.id).eq('completed', false),
            supabase.from('medications').select('*').eq('user_id', currentUser.id)
        ]);
        
        // Atualizar contadores desktop
        const todayEventsEl = document.getElementById('today-events');
        if (todayEventsEl) {
            const count = eventsResult.status === 'fulfilled' ? (eventsResult.value.data?.length || 0) : 0;
            todayEventsEl.textContent = count;
            animateCounter(todayEventsEl, count);
        }
        
        const pendingTasksEl = document.getElementById('pending-tasks');
        if (pendingTasksEl) {
            const count = tasksResult.status === 'fulfilled' ? (tasksResult.value.data?.length || 0) : 0;
            pendingTasksEl.textContent = count;
            animateCounter(pendingTasksEl, count);
        }
        
        const medicationsTodayEl = document.getElementById('medications-today');
        if (medicationsTodayEl) {
            const count = medicationsResult.status === 'fulfilled' ? (medicationsResult.value.data?.length || 0) : 0;
            medicationsTodayEl.textContent = count;
            animateCounter(medicationsTodayEl, count);
        }
        
        // Atualizar contadores mobile
        const todayEventsMobile = document.getElementById('today-events-mobile');
        if (todayEventsMobile) {
            const count = eventsResult.status === 'fulfilled' ? (eventsResult.value.data?.length || 0) : 0;
            todayEventsMobile.textContent = count;
            animateCounter(todayEventsMobile, count);
        }
        
        const pendingTasksMobile = document.getElementById('pending-tasks-mobile');
        if (pendingTasksMobile) {
            const count = tasksResult.status === 'fulfilled' ? (tasksResult.value.data?.length || 0) : 0;
            pendingTasksMobile.textContent = count;
            animateCounter(pendingTasksMobile, count);
        }
        
        const medicationsTodayMobile = document.getElementById('medications-today-mobile');
        if (medicationsTodayMobile) {
            const count = medicationsResult.status === 'fulfilled' ? (medicationsResult.value.data?.length || 0) : 0;
            medicationsTodayMobile.textContent = count;
            animateCounter(medicationsTodayMobile, count);
        }
        
        const habitsStreakMobile = document.getElementById('habits-streak-mobile');
        if (habitsStreakMobile) {
            habitsStreakMobile.textContent = '7'; // Placeholder - implementar lógica real
            animateCounter(habitsStreakMobile, 7);
        }
        
        console.log('✅ Dados do dashboard carregados');
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados do dashboard:', error);
        showNotification('Erro ao carregar dados do dashboard', 'error');
    }
}