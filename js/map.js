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
      typeof map.container?.fitToViewport === "function"
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


    // Екатеринбург — стартовая точка
    const defaultCenter = [
      56.8389,
      60.6057
    ];


    // Создаём карту
    const newMap = new ymaps.Map(
      "map",
      {
        center: defaultCenter,
        zoom: 13,
        controls: [
          "zoomControl"
        ]
      }
    );


    // Сохраняем карту в state
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


        selectedLocation.latitude =
          latitude;

        selectedLocation.longitude =
          longitude;


        reverseGeocode(
          longitude,
          latitude
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

  selectedLocation.latitude =
    latitude;

  selectedLocation.longitude =
    longitude;


  const currentMap = map;


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


  reverseGeocode(
    latitude,
    longitude
  );
}


// ============================================
// ОПРЕДЕЛЕНИЕ АДРЕСА
// ============================================

export async function reverseGeocode(
  latitude,
  longitude
) {

  const addressInput =
    document.getElementById(
      "address-input"
    );


  if (!addressInput) {
    return;
  }


  addressInput.value =
    "Определяем адрес...";


  try {

    const result =
      await ymaps.geocode(
        [
          latitude,
          longitude
        ],
        {
          results: 1
        }
      );


    const firstGeoObject =
      result.geoObjects.get(0);


    if (!firstGeoObject) {

      addressInput.value =
        "Адрес не найден";

      selectedLocation.address =
        "";

      return;
    }


    const address =
      firstGeoObject.getAddressLine();


    selectedLocation.address =
      address || "";


    addressInput.value =
      address ||
      "Адрес не найден";


  } catch (error) {

    console.error(
      "Ошибка геокодирования:",
      error
    );


    selectedLocation.address =
      "";

    addressInput.value =
      "Не удалось определить адрес";
  }
}


// ============================================
// ТЕКУЩЕЕ МЕСТОПОЛОЖЕНИЕ
// ============================================

export function useCurrentLocation() {

  if (!navigator.geolocation) {

    alert(
      "Геолокация недоступна в этом браузере."
    );

    return;
  }


  navigator.geolocation.getCurrentPosition(

    (position) => {

      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;


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
