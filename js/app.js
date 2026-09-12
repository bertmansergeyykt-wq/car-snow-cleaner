import {
  initTelegram
} from "./telegram.js";

import {
  showScreen,
  renderProfile
} from "./screens.js";

import {
  openMapScreen,
  initializeMap,
  useCurrentLocation
} from "./map.js";

import {
  continueFromLocation,
  selectService,
  createOrder,
  completeCurrentOrder,
  loadOrdersScreen
} from "./orders.js";

import {
  openPerformerScreen,
  loadAvailableOrders,
  acceptPerformerOrder,
  completePerformerOrder,
  backToProfile
} from "./performer.js";

import {
  selectedLocation
} from "./state.js";


/* =========================================================
   ИНИЦИАЛИЗАЦИЯ TELEGRAM
========================================================= */

initTelegram();


/* =========================================================
   ГЛОБАЛЬНЫЕ ФУНКЦИИ
========================================================= */

/*
  Пока в HTML используются onclick="...",
  функции должны быть доступны через window.

  Позже мы можем полностью убрать inline onclick,
  но сейчас оставляем этот мост, чтобы ничего не сломать.
*/

window.showScreen =
  showScreen;

window.openMapScreen =
  openMapScreen;

window.initializeMap =
  initializeMap;

window.useCurrentLocation =
  useCurrentLocation;

window.continueFromLocation =
  continueFromLocation;

window.selectService =
  selectService;

window.createOrder =
  createOrder;

window.completeCurrentOrder =
  completeCurrentOrder;

window.loadOrdersScreen =
  loadOrdersScreen;

window.openPerformerScreen =
  openPerformerScreen;

window.loadAvailableOrders =
  loadAvailableOrders;

window.acceptPerformerOrder =
  acceptPerformerOrder;

window.completePerformerOrder =
  completePerformerOrder;

window.backToProfile =
  backToProfile;


/* =========================================================
   РЕДАКТИРОВАНИЕ АДРЕСА
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const addressInput =
      document.getElementById(
        "address-input"
      );

    if (addressInput) {

      addressInput.addEventListener(
        "input",
        () => {

          selectedLocation.address =
            addressInput.value.trim();

        }
      );
    }

    renderProfile();

  }
);


/* =========================================================
   TELEGRAM BACK BUTTON
========================================================= */

const telegramWebApp =
  window.Telegram?.WebApp || null;

if (telegramWebApp) {

  telegramWebApp.BackButton.onClick(
    () => {

      showScreen(
        "home"
      );

      telegramWebApp.BackButton.hide();

    }
  );

}


/* =========================================================
   ПОКАЗ / СКРЫТИЕ TELEGRAM BACK BUTTON
========================================================= */

const originalShowScreen =
  showScreen;

window.showScreen =
  function(screenName) {

    originalShowScreen(
      screenName
    );

    if (!telegramWebApp) {
      return;
    }

    if (
      screenName === "home"
    ) {

      telegramWebApp.BackButton.hide();

    } else {

      telegramWebApp.BackButton.show();

    }
  };


/* =========================================================
   НАЧАЛЬНЫЙ ЭКРАН
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    showScreen(
      "home"
    );

  }
);
