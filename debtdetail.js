// Глобальные переменные
let currentDebt = null;
let currentUser = null;

// Инициализация страницы деталей долга
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadDebtDetail();
        }
    });
});

// Загрузка деталей долга
function loadDebtDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const debtId = urlParams.get('id');
    
    if (!debtId) {
        showError('ID долга не указан');
        return;
    }
    
    // Подписываемся на обновления долга в реальном времени
    db.collection('debts').doc(debtId).onSnapshot((doc) => {
        if (doc.exists) {
            currentDebt = {
                id: doc.id,
                ...doc.data()
            };
            renderDebtDetail();
        } else {
            showError('Долг не найден');
        }
    }, (error) => {
        console.error('Ошибка при загрузке долга:', error);
        showError('Произошла ошибка при загрузке долга');
    });
}

// Отображение деталей долга
function renderDebtDetail() {
    const container = document.getElementById('debt-detail-container');
    
    if (!currentDebt) {
        container.innerHTML = '<p>Долг не найден</p>';
        return;
    }
    
    const isOwner = currentDebt.ownerA === currentUser.uid;
    const otherUserEmail = isOwner ? currentDebt.ownerBEmail : currentDebt.ownerAEmail;
    const amountClass = isOwner ? 'positive' : 'negative';
    const amountPrefix = isOwner ? '+' : '-';
    const statusText = getStatusText(currentDebt.status);
    const statusClass = getStatusClass(currentDebt.status);
    
    container.innerHTML = `
        <div class="debt-detail-card">
            <div class="debt-detail-header">
                <h2>${currentDebt.note || 'Без примечания'}</h2>
                <div class="debt-detail-amount ${amountClass}">
                    ${amountPrefix}${currentDebt.amount}${currentDebt.currency}
                </div>
            </div>
            
            <div class="debt-detail-info">
                <div class="info-row">
                    <span class="info-label">Статус:</span>
                    <span class="info-value ${statusClass}">${statusText}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">${isOwner ? 'Вам должен:' : 'Вы должны:'}</span>
                    <span class="info-value">${otherUserEmail}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Создатель долга:</span>
                    <span class="info-value">${currentDebt.ownerAEmail}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Дата создания:</span>
                    <span class="info-value">${formatDate(currentDebt.createdAt?.toDate())}</span>
                </div>
                
                ${currentDebt.note ? `
                <div class="info-row">
                    <span class="info-label">Примечание:</span>
                    <span class="info-value">${currentDebt.note}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="debt-actions" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                ${isOwner ? `
                    <button id="mark-paid-btn" class="btn-primary">Отметить как погашенный</button>
                    <button id="delete-debt-btn" class="btn-secondary" style="margin-left: 10px;">Удалить долг</button>
                ` : `
                    <button id="mark-paid-btn" class="btn-primary">Подтвердить погашение</button>
                `}
            </div>
        </div>
    `;
    
    // Добавляем обработчики для кнопок действий
    const markPaidBtn = document.getElementById('mark-paid-btn');
    const deleteDebtBtn = document.getElementById('delete-debt-btn');
    
    if (markPaidBtn) {
        markPaidBtn.addEventListener('click', markDebtAsPaid);
    }
    
    if (deleteDebtBtn) {
        deleteDebtBtn.addEventListener('click', deleteDebt);
    }
}

// Отметить долг как погашенный
async function markDebtAsPaid() {
    if (!currentDebt) return;
    
    try {
        await db.collection('debts').doc(currentDebt.id).update({
            status: 'paid',
            paidAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Долг отмечен как погашенный');
    } catch (error) {
        console.error('Ошибка при обновлении долга:', error);
        alert('Произошла ошибка: ' + error.message);
    }
}

// Удалить долг
async function deleteDebt() {
    if (!currentDebt) return;
    
    if (!confirm('Вы уверены, что хотите удалить этот долг?')) {
        return;
    }
    
    try {
        await db.collection('debts').doc(currentDebt.id).delete();
        alert('Долг удален');
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Ошибка при удалении долга:', error);
        alert('Произошла ошибка: ' + error.message);
    }
}

// Получение текста статуса
function getStatusText(status) {
    switch (status) {
        case 'active': return 'Активный';
        case 'paid': return 'Погашен';
        case 'cancelled': return 'Отменен';
        default: return status;
    }
}

// Получение класса для статуса
function getStatusClass(status) {
    switch (status) {
        case 'active': return 'status-active';
        case 'paid': return 'status-paid';
        case 'cancelled': return 'status-cancelled';
        default: return '';
    }
}

// Показать ошибку
function showError(message) {
    const container = document.getElementById('debt-detail-container');
    container.innerHTML = `
        <div class="error-message">
            <h3>Ошибка</h3>
            <p>${message}</p>
            <a href="dashboard.html" class="btn-primary">Вернуться к списку долгов</a>
        </div>
    `;
}

// Форматирование даты
function formatDate(date) {
    if (!date) return 'Неизвестно';
    
    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}