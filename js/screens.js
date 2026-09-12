import { map } from "./state.js";
import { telegramWebApp } from "./telegram.js";

/**
 * Переключение экранов приложения
 */
export function showScreen(screenName) {
  const screens =
    document.querySelectorAll(".screen");

  screens.forEach((screen) => {
    screen.classList.remove("active");
  });

  const target =
    document.getElementById(
      "screen-" + screenName
    );

  if (!target) {
    console.error(
      "Экран не найден:",
      screenName
    );
    return;
  }

  target.classList.add("active");

  // ========================================
  // TELEGRAM BACK BUTTON
  // ========================================

  if (telegramWebApp) {
    if (screenName === "home") {
      telegramWebApp.BackButton.hide();
    } else {
      telegramWebApp.BackButton.show();
    }
  }

  // ========================================
  // КАРТА
  // ========================================

  if (screenName === "map") {
    setTimeout(() => {
      if (!map) return;

      if (
        typeof map.requestReposition ===
        "function"
      ) {
        map.requestReposition();
        return;
      }

      if (
        map.container &&
        typeof map.container.fitToViewport ===
        "function"
      ) {
        map.container.fitToViewport();
      }
    }, 100);
  }

  // ========================================
  // ПРОФИЛЬ
  // ========================================

  if (screenName === "profile") {
    renderProfile();
  }
}

/**
 * Отображение данных пользователя Telegram
 */
export function renderProfile() {
  const user =
    window.Telegram?.WebApp?.initDataUnsafe?.user ||
    null;

  const element =
    document.getElementById(
      "profile-user-id"
    );

  if (!element) return;

  if (user) {
    const name = [
      user.first_name,
      user.last_name
    ]
      .filter(Boolean)
      .join(" ");

    element.textContent =
      name ||
      `ID: ${user.id}`;
  } else {
    element.textContent =
      "Тестовый пользователь";
  }
}
