// Конфигурация Firebase
const firebaseConfig = {
    // ЗАМЕНИТЕ ЭТИ ДАННЫЕ НА ВАШИ ИЗ FIREBASE CONSOLE
    apiKey: "AIzaSyCVITQ6rtz6Au_FmEjU4uiB7_3oksMIht0",
    authDomain: "debt-tracker-47f89.firebaseapp.com",
    projectId: "debt-tracker-47f89",
    storageBucket: "debt-tracker-47f89.firebasestorage.app",
    messagingSenderId: "1068226926657",
    appId: "1:1068226926657:web:74dec8767aacace74e0ec0"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);

// Инициализация сервисов
const auth = firebase.auth();
const db = firebase.firestore();

// Настройка провайдера Google
const googleProvider = new firebase.auth.GoogleAuthProvider();