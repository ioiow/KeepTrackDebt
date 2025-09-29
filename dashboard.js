// Глобальные переменные
let debts = [];
let currentUser = null;

// Инициализация дашборда
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            initDashboard();
        }
    });
});

// Инициализация дашборда
function initDashboard() {
    setupEventListeners();
    loadDebts();
}

// Настройка обработчиков событий
function setupEventListeners() {
    const createDebtBtn = document.getElementById('create-debt-btn');
    const modal = document.getElementById('create-debt-modal');
    const closeBtn = document.querySelector('.close');
    const createDebtForm = document.getElementById('create-debt-form');
    
    // Открытие модального окна
    if (createDebtBtn) {
        createDebtBtn.addEventListener('click', function() {
            modal.style.display = 'block';
        });
    }
    
    // Закрытие модального окна
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Закрытие модального окна при клике вне его
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Обработка формы создания долга
    if (createDebtForm) {
        createDebtForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await createDebt();
        });
    }
}

// Загрузка долгов пользователя
function loadDebts() {
    // Подписываемся на обновления в реальном времени
    db.collection('debts')
        .where('participants', 'array-contains', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            debts = [];
            snapshot.forEach((doc) => {
                debts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            renderDebts();
            updateSummary();
        }, (error) => {
            console.error('Ошибка при загрузке долгов:', error);
        });
}

// Отображение списка долгов
function renderDebts() {
    const debtsContainer = document.getElementById('debts-container');
    
    if (debts.length === 0) {
        debtsContainer.innerHTML = '<p class="no-debts">У вас пока нет долгов</p>';
        return;
    }
    
    debtsContainer.innerHTML = debts.map(debt => {
        const isOwner = debt.ownerA === currentUser.uid;
        const otherUserEmail = isOwner ? debt.ownerBEmail : debt.ownerAEmail;
        const amountClass = isOwner ? 'positive' : 'negative';
        const amountPrefix = isOwner ? '+' : '-';
        const description = isOwner ? 
            `Вам должен: ${otherUserEmail}` : 
            `Вы должны: ${otherUserEmail}`;
        
        return `
            <div class="debt-item" data-debt-id="${debt.id}">
                <div class="debt-info">
                    <h3>${debt.note || 'Без примечания'}</h3>
                    <p>${description}</p>
                    <small>Создан: ${formatDate(debt.createdAt?.toDate())}</small>
                </div>
                <div class="debt-amount ${amountClass}">
                    ${amountPrefix}${debt.amount}${debt.currency}
                </div>
            </div>
        `;
    }).join('');
    
    // Добавляем обработчики кликов на элементы долгов
    document.querySelectorAll('.debt-item').forEach(item => {
        item.addEventListener('click', function() {
            const debtId = this.getAttribute('data-debt-id');
            window.location.href = `debtdetail.html?id=${debtId}`;
        });
    });
}

// Обновление сводки
function updateSummary() {
    let owedToYou = 0;
    let youOwe = 0;
    
    debts.forEach(debt => {
        if (debt.ownerA === currentUser.uid) {
            owedToYou += debt.amount;
        } else {
            youOwe += debt.amount;
        }
    });
    
    document.getElementById('owed-to-you').textContent = `${owedToYou}€`;
    document.getElementById('you-owe').textContent = `${youOwe}€`;
}

// Создание нового долга
async function createDebt() {
    const email = document.getElementById('debt-email').value;
    const amount = parseFloat(document.getElementById('debt-amount').value);
    const currency = document.getElementById('debt-currency').value;
    const note = document.getElementById('debt-note').value;
    
    if (!email || !amount || amount <= 0) {
        alert('Заполните все обязательные поля корректно');
        return;
    }
    
    try {
        // Ищем пользователя по email
        const usersSnapshot = await db.collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();
        
        let ownerB = null;
        let ownerBEmail = email;
        
        if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            ownerB = userDoc.id;
            ownerBEmail = userDoc.data().email;
        }
        
        // Создаем долг
        const debtData = {
            ownerA: currentUser.uid,
            ownerAEmail: currentUser.email,
            ownerB: ownerB,
            ownerBEmail: ownerBEmail,
            amount: amount,
            currency: currency,
            note: note,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            participants: ownerB ? [currentUser.uid, ownerB] : [currentUser.uid]
        };
        
        await db.collection('debts').add(debtData);
        
        // Очищаем форму и закрываем модальное окно
        document.getElementById('create-debt-form').reset();
        document.getElementById('create-debt-modal').style.display = 'none';
        
        alert('Долг успешно создан!');
        
    } catch (error) {
        console.error('Ошибка при создании долга:', error);
        alert('Произошла ошибка при создании долга: ' + error.message);
    }
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