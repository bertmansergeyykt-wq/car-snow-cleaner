// ===============================
// Глобальное состояние приложения
// ===============================

// ---------- Карта ----------

export let map = null;
export let mapInitialized = false;


// ---------- Выбранное место ----------

export let selectedLocation = {
  latitude: null,
  longitude: null,
  address: ""
};


// ---------- Выбранная услуга ----------

export let selectedService = null;


// ---------- Заказы клиента ----------

export let currentOrders = [];

export let isCreatingOrder = false;

export let currentActiveOrderId = null;

export let currentActivePerformerId = null;

export let isCompletingOrder = false;


// ---------- Исполнитель ----------

// ID тестового исполнителя.
// Позже заменим на реальную авторизацию исполнителей.
export const TEST_PERFORMER_ID = 1;

export let performerData = null;

export let performerLatitude = 56.8389;

export let performerLongitude = 60.6057;

export let performerActiveOrder = null;

export let isAcceptingPerformerOrder = false;

export let isCompletingPerformerOrder = false;


// ===============================
// SETTERS
// ===============================

// ---------- Карта ----------

export function setMap(value) {
  map = value;
}

export function setMapInitialized(value) {
  mapInitialized = value;
}


// ---------- Выбранное место ----------

export function setSelectedLocation(value) {
  selectedLocation = value;
}


// ---------- Выбранная услуга ----------

export function setSelectedService(value) {
  selectedService = value;
}


// ---------- Заказы клиента ----------

export function setCurrentOrders(value) {
  currentOrders = value;
}

export function setIsCreatingOrder(value) {
  isCreatingOrder = value;
}

export function setCurrentActiveOrderId(value) {
  currentActiveOrderId = value;
}

export function setCurrentActivePerformerId(value) {
  currentActivePerformerId = value;
}

export function setIsCompletingOrder(value) {
  isCompletingOrder = value;
}


// ---------- Исполнитель ----------

export function setPerformerData(value) {
  performerData = value;
}

export function setPerformerLatitude(value) {
  performerLatitude = value;
}

export function setPerformerLongitude(value) {
  performerLongitude = value;
}

export function setPerformerActiveOrder(value) {
  performerActiveOrder = value;
}

export function setIsAcceptingPerformerOrder(value) {
  isAcceptingPerformerOrder = value;
}

export function setIsCompletingPerformerOrder(value) {
  isCompletingPerformerOrder = value;
}
