// ============================================
// TELEGRAM WEB APP
// ============================================

export const telegramWebApp =
  window.Telegram?.WebApp || null;


// ============================================
// ИНИЦИАЛИЗАЦИЯ TELEGRAM
// ============================================

export function initTelegram() {

  if (!telegramWebApp) {

    console.warn(
      "Telegram WebApp API не найден. Приложение открыто вне Telegram."
    );

    return;
  }


  telegramWebApp.ready();

  telegramWebApp.expand();
}


// ============================================
// ПОЛУЧИТЬ TELEGRAM USER
// ============================================

export function getTelegramUser() {

  return (
    telegramWebApp
      ?.initDataUnsafe
      ?.user ||
    null
  );
}


// ============================================
// ПОЛУЧИТЬ TELEGRAM USER ID
// ============================================

export function getTelegramUserId() {

  const user =
    getTelegramUser();


  if (!user?.id) {

    console.warn(
      "Telegram пользователь не найден."
    );

    return null;
  }


  return user.id;
}


// ============================================
// ПОЛУЧИТЬ ИМЯ ПОЛЬЗОВАТЕЛЯ
// ============================================

export function getTelegramUserName() {

  const user =
    getTelegramUser();


  if (!user) {
    return "";
  }


  return [
    user.first_name,
    user.last_name
  ]
    .filter(Boolean)
    .join(" ");
}


// ============================================
// ПОЛУЧИТЬ USERNAME
// ============================================

export function getTelegramUsername() {

  const user =
    getTelegramUser();


  if (!user) {
    return "";
  }


  return user.username || "";
}
