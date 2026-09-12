import { initTelegram, telegramWebApp } from "./telegram.js";

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


// ========================================
// TELEGRAM
// ========================================

initTelegram();


// ========================================
// TELEGRAM BACK BUTTON
// ========================================

if (telegramWebApp) {

  telegramWebApp.BackButton.onClick(() => {

    showScreen("home");

  });

}


// ========================================
// ДЕЛАЕМ ФУНКЦИИ ДОСТУПНЫМИ HTML
// ========================================

window.showScreen = showScreen;

window.openMapScreen = openMapScreen;
window.initializeMap = initializeMap;
window.useCurrentLocation = useCurrentLocation;

window.continueFromLocation = continueFromLocation;

window.selectService = selectService;
window.createOrder = createOrder;

window.completeCurrentOrder = completeCurrentOrder;

window.loadOrdersScreen = loadOrdersScreen;

window.openPerformerScreen = openPerformerScreen;
window.loadAvailableOrders = loadAvailableOrders;
window.acceptPerformerOrder = acceptPerformerOrder;
window.completePerformerOrder = completePerformerOrder;

window.backToProfile = backToProfile;


// ========================================
// АДРЕС
// ========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const addressInput =
      document.getElementById("address-input");

    if (addressInput) {

      addressInput.addEventListener(
        "input",
        () => {

          selectedLocation.address =
            addressInput.value.trim();

        }
      );

    }

    // ========================================
    // СТАРТОВЫЙ ЭКРАН
    // ========================================

    renderProfile();

    showScreen("home");

  }
);
