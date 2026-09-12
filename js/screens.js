// ============================================================
// ЭКРАНЫ
// ============================================================

import {
  map
} from "./state.js";


// ============================================================
// ПОКАЗ ЭКРАНА
// ============================================================

export function showScreen(screenName) {

  const screens =
    document.querySelectorAll(".screen");


  screens.forEach(
    (screen) => {

      screen.classList.remove("active");

    }
  );


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


  // ----------------------------------------------------------
  // Если открываем карту
  // ----------------------------------------------------------

  if (screenName === "map") {

    setTimeout(
      () => {

        if (!map) {
          return;
        }


        if (
          typeof map.requestReposition ===
          "function"
        ) {

          map.requestReposition();

        } else if (
          map.container &&
          typeof map.container.fitToViewport ===
          "function"
        ) {

          map.container.fitToViewport();

        }

      },
      100
    );

  }


  // ----------------------------------------------------------
  // Если открываем профиль
  // ----------------------------------------------------------

  if (screenName === "profile") {

    renderProfile();

  }

}


// ============================================================
// ПРОФИЛЬ
// ============================================================

export function renderProfile() {

  const user =
    window.Telegram
      ?.WebApp
      ?.initDataUnsafe
      ?.user || null;


  const element =
    document.getElementById(
      "profile-user-id"
    );


  if (!element) {

    return;

  }


  if (user) {

    const name =
      [
        user.first_name,
        user.last_name
      ]
        .filter(Boolean)
        .join(" ");


    element.textContent =
      name ||
      ("ID: " + user.id);

  } else {

    element.textContent =
      "Тестовый пользователь";

  }

}
