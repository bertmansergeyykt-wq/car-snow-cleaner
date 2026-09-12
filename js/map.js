import {
  map,
  mapInitialized,
  selectedLocation,
  setMap,
  setMapInitialized
} from "./state.js";

import { showScreen } from "./screens.js";


// ============================================
// ОТКРЫТИЕ ЭКРАНА КАРТЫ
// ============================================

export function openMapScreen() {

  showScreen("map");

  setTimeout(() => {
    initializeMap();
  }, 100);
}


// ============================================
// ИНИЦИАЛИЗАЦИЯ ЯНДЕКС КАРТЫ
// ============================================

export function initializeMap() {

  // Если карта уже создана —
  // просто обновляем её размеры

  if (mapInitialized && map) {

    if (
      typeof map.container?.fitToViewport ===
      "function"
    ) {
      map.container.fitToViewport();
    }

    return;
  }


  // Проверяем наличие Yandex Maps API

  if (typeof ymaps === "undefined") {

    alert(
      "Яндекс Карты ещё загружаются. Попробуйте ещё раз."
    );

    return;
  }


  ymaps.ready(() => {

    // Защита от повторной инициализации

    if (mapInitialized) {
      return;
    }


    // ========================================
    // СТАРТОВАЯ ТОЧКА — ЕКАТЕРИНБУРГ
    // ========================================

    const defaultCenter = [
      56.8389,
      60.6057
    ];


    // ========================================
    // СОЗДАЁМ КАРТУ
    // ========================================

    const newMap =
      new ymaps.Map(
        "map",
        {
          center: defaultCenter,
          zoom: 13,

          controls: [
            "zoomControl"
          ]
        }
      );


    // Сохраняем карту

    setMap(newMap);

    setMapInitialized(true);


    // ========================================
    // КАРТА ПЕРЕМЕЩЕНА
    // ========================================

    newMap.events.add(
      "actionend",
      () => {

        const center =
          newMap.getCenter();

        if (!center) {
          return;
        }


        const latitude =
          center[0];

        const longitude =
          center[1];


        // Сохраняем координаты

        selectedLocation.latitude =
          latitude;

        selectedLocation.longitude =
          longitude;


        // Обновляем отображение координат

        updateCoordinatesText(
          latitude,
          longitude
        );
      }
    );


    // ========================================
    // КЛИК ПО КАРТЕ
    // ========================================

    newMap.events.add(
      "click",
      (event) => {

        const coordinates =
          event.get("coords");

        if (!coordinates) {
          return;
        }


        setMapLocation(
          coordinates[0],
          coordinates[1]
        );
      }
    );


    // ========================================
    // СТАРТОВАЯ ТОЧКА
    // ========================================

    setMapLocation(
      defaultCenter[0],
      defaultCenter[1]
    );

  });
}


// ============================================
// УСТАНОВИТЬ МЕСТО НА КАРТЕ
// ============================================

export function setMapLocation(
  latitude,
  longitude
) {

  // Сохраняем координаты

  selectedLocation.latitude =
    latitude;

  selectedLocation.longitude =
    longitude;


  // ========================================
  // ОБНОВЛЯЕМ ТЕКСТ КООРДИНАТ
  // ========================================

  updateCoordinatesText(
    latitude,
    longitude
  );


  const currentMap =
    map;


  // ========================================
  // ПЕРЕМЕЩАЕМ КАРТУ
  // ========================================

  if (currentMap) {

    currentMap.setCenter(
      [
        latitude,
        longitude
      ],
      16,
      {
        duration: 250
      }
    );
  }


  // ========================================
  // АДРЕС НЕ ОПРЕДЕЛЯЕМ АВТОМАТИЧЕСКИ
  // ========================================

  const addressInput =
    document.getElementById(
      "address-input"
    );


  if (addressInput) {

    // Если поле было пустым —
    // предлагаем пользователю ввести адрес

    if (
      !addressInput.value ||
      addressInput.value ===
        "Определяем адрес..." ||
      addressInput.value ===
        "Адрес не найден" ||
      addressInput.value ===
        "Не удалось определить адрес"
    ) {

      addressInput.value = "";

      addressInput.placeholder =
        "Введите адрес вручную";
    }
  }
}


// ============================================
// ОБНОВЛЕНИЕ КООРДИНАТ
// ============================================

function updateCoordinatesText(
  latitude,
  longitude
) {

  const coordinatesElement =
    document.getElementById(
      "coordinates"
    );


  if (!coordinatesElement) {
    return;
  }


  coordinatesElement.textContent =
    "Координаты: " +
    latitude.toFixed(6) +
    ", " +
    longitude.toFixed(6);
}


// ============================================
// ТЕКУЩЕЕ МЕСТОПОЛОЖЕНИЕ
// ============================================

export function useCurrentLocation() {

  // Проверяем поддержку геолокации

  if (!navigator.geolocation) {

    alert(
      "Геолокация недоступна в этом браузере."
    );

    return;
  }


  // ========================================
  // ПОЛУЧАЕМ ГЕОЛОКАЦИЮ
  // ========================================

  navigator.geolocation.getCurrentPosition(

    (position) => {

      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;


      console.log(
        "Текущее местоположение:",
        latitude,
        longitude
      );


      // Устанавливаем найденную точку

      setMapLocation(
        latitude,
        longitude
      );
    },


    (error) => {

      console.error(
        "Ошибка геолокации:",
        error
      );


      alert(
        "Не удалось получить ваше местоположение."
      );
    },


    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    }
  );
}
