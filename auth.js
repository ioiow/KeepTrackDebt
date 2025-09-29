// Проверка авторизации при загрузке страницы
auth.onAuthStateChanged((user) => {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (user) {
        // Пользователь авторизован
        updateUserInfo(user);
        
        // Если на странице входа - перенаправляем на дашборд
        if (currentPage === 'index.html' || currentPage === '') {
            window.location.href = 'dashboard.html';
        }
        
        // Сохраняем/обновляем информацию о пользователе в Firestore
        saveUserToFirestore(user);
    } else {
        // Пользователь не авторизован
        // Если не на странице входа - перенаправляем на вход
        if (currentPage !== 'index.html' && currentPage !== '') {
            window.location.href = 'index.html';
        }
    }
});

// Функция обновления информации о пользователе в интерфейсе
function updateUserInfo(user) {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = user.displayName || user.email;
    }
}

// Функция сохранения пользователя в Firestore
async function saveUserToFirestore(user) {
    try {
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error('Ошибка при сохранении пользователя:', error);
    }
}

// Обработчики для страницы входа
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const authMessage = document.getElementById('auth-message');
    
    // Вход по email и паролю
    if (loginBtn) {
        loginBtn.addEventListener('click', async function() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showMessage('Заполните все поля', 'error');
                return;
            }
            
            try {
                await auth.signInWithEmailAndPassword(email, password);
                showMessage('Вход выполнен успешно!', 'success');
            } catch (error) {
                showMessage(getAuthErrorMessage(error), 'error');
            }
        });
    }
    
    // Регистрация по email и паролю
    if (signupBtn) {
        signupBtn.addEventListener('click', async function() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showMessage('Заполните все поля', 'error');
                return;
            }
            
            if (password.length < 6) {
                showMessage('Пароль должен содержать минимум 6 символов', 'error');
                return;
            }
            
            try {
                await auth.createUserWithEmailAndPassword(email, password);
                showMessage('Регистрация выполнена успешно!', 'success');
            } catch (error) {
                showMessage(getAuthErrorMessage(error), 'error');
            }
        });
    }
    
    // Вход через Google
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async function() {
            try {
                await auth.signInWithPopup(googleProvider);
                showMessage('Вход через Google выполнен успешно!', 'success');
            } catch (error) {
                showMessage(getAuthErrorMessage(error), 'error');
            }
        });
    }
    
    // Выход из системы
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                await auth.signOut();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Ошибка при выходе:', error);
            }
        });
    }
    
    // Функция показа сообщений
    function showMessage(message, type) {
        if (authMessage) {
            authMessage.textContent = message;
            authMessage.className = `message ${type}`;
            setTimeout(() => {
                authMessage.textContent = '';
                authMessage.className = 'message';
            }, 5000);
        }
    }
    
    // Функция получения понятного текста ошибки
    function getAuthErrorMessage(error) {
        switch (error.code) {
            case 'auth/invalid-email':
                return 'Неверный формат email';
            case 'auth/user-disabled':
                return 'Пользователь заблокирован';
            case 'auth/user-not-found':
                return 'Пользователь не найден';
            case 'auth/wrong-password':
                return 'Неверный пароль';
            case 'auth/email-already-in-use':
                return 'Email уже используется';
            case 'auth/weak-password':
                return 'Пароль слишком простой';
            case 'auth/operation-not-allowed':
                return 'Операция не разрешена';
            case 'auth/too-many-requests':
                return 'Слишком много попыток. Попробуйте позже';
            default:
                return 'Произошла ошибка: ' + error.message;
        }
    }
});