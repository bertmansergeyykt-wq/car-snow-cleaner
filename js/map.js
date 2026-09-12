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

  // Карта уже создана
  if (mapInitialized && map) {

    if (
      typeof map.container?.fitToViewport ===
      "function"
    ) {
      map.container.fitToViewport();
    }

    return;
  }


  // Проверяем Yandex Maps API
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
    // ЕКАТЕРИНБУРГ
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


        selectedLocation.latitude =
          latitude;

        selectedLocation.longitude =
          longitude;


        reverseGeocode(
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

  selectedLocation.latitude =
    latitude;

  selectedLocation.longitude =
    longitude;


  const currentMap =
    map;


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
// ОБРАТНОЕ ГЕОКОДИРОВАНИЕ
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


  selectedLocation.address =
    "";


  try {

    console.log(
      "Геокодирование:",
      latitude,
      longitude
    );


    // ========================================
    // YANDEX JAVASCRIPT API
    //
    // Передаём координаты как:
    // [latitude, longitude]
    //
    // И ЯВНО указываем порядок:
    // latlong
    // ========================================

    const result =
      await ymaps.geocode(
        [
          latitude,
          longitude
        ],
        {
          results: 1,

          searchCoordOrder:
            "latlong"
        }
      );


    console.log(
      "Ответ ymaps.geocode:",
      result
    );


    // ========================================
    // ПЕРВЫЙ ОБЪЕКТ
    // ========================================

    const firstGeoObject =
      result.geoObjects.get(0);


    if (!firstGeoObject) {

      addressInput.value =
        "Адрес не найден";

      selectedLocation.address =
        "";

      return;
    }


    // ========================================
    // ПОЛУЧАЕМ АДРЕС
    // ========================================

    let address = "";


    if (
      typeof firstGeoObject.getAddressLine ===
      "function"
    ) {

      address =
        firstGeoObject.getAddressLine();
    }


    // Запасной вариант

    if (!address) {

      address =
        firstGeoObject.properties.get(
          "text"
        ) || "";
    }


    // ========================================
    // АДРЕС НЕ НАЙДЕН
    // ========================================

    if (!address) {

      addressInput.value =
        "Адрес не найден";

      selectedLocation.address =
        "";

      return;
    }


    // ========================================
    // СОХРАНЯЕМ АДРЕС
    // ========================================

    selectedLocation.address =
      address;

    addressInput.value =
      address;


    console.log(
      "Адрес определён:",
      address
    );


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


      console.log(
        "Текущее местоположение:",
        latitude,
        longitude
      );


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
