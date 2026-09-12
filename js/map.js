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
  // обновляем её размеры

  if (mapInitialized && map) {

    if (
      typeof map.container?.fitToViewport ===
      "function"
    ) {
      map.container.fitToViewport();
    }

    return;
  }


  // Проверяем загрузку Yandex Maps API

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


    // Сохраняем карту в глобальное состояние

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


        // Определяем адрес новой точки

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
    // УСТАНАВЛИВАЕМ СТАРТОВУЮ ТОЧКУ
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


  const currentMap =
    map;


  // Если карта существует —
  // перемещаем её

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


  // Определяем адрес

  reverseGeocode(
    latitude,
    longitude
  );
}


// ============================================
// ОБРАТНОЕ ГЕОКОДИРОВАНИЕ
// КООРДИНАТЫ → АДРЕС
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


  // Показываем пользователю процесс определения

  addressInput.value =
    "Определяем адрес...";


  selectedLocation.address =
    "";


  try {

    // ========================================
    // YANDEX GEOCODER HTTP API
    //
    // Формат координат:
    // longitude,latitude
    // ========================================

    const url =
      "https://geocode-maps.yandex.ru/v1/" +
      "?apikey=c355cb46-e31f-4942-a74d-336abc2cb19a" +
      "&geocode=" +
      encodeURIComponent(
        longitude + "," + latitude
      ) +
      "&lang=ru_RU" +
      "&format=json" +
      "&results=1";


    console.log(
      "Запрос геокодера:",
      url
    );


    // ========================================
    // ОТПРАВЛЯЕМ ЗАПРОС
    // ========================================

    const response =
      await fetch(url);


    // Проверяем HTTP-статус

    if (!response.ok) {

      throw new Error(
        "HTTP " + response.status
      );
    }


    // ========================================
    // ПОЛУЧАЕМ JSON
    // ========================================

    const data =
      await response.json();


    console.log(
      "Ответ геокодера:",
      data
    );


    // ========================================
    // ПОЛУЧАЕМ СПИСОК ОБЪЕКТОВ
    // ========================================

    const members =
      data
        ?.response
        ?.GeoObjectCollection
        ?.featureMember;


    if (
      !members ||
      members.length === 0
    ) {

      addressInput.value =
        "Адрес не найден";

      selectedLocation.address =
        "";

      return;
    }


    // ========================================
    // ПЕРВЫЙ НАЙДЕННЫЙ ОБЪЕКТ
    // ========================================

    const geoObject =
      members[0]?.GeoObject;


    // ========================================
    // ПОЛУЧАЕМ АДРЕС
    // ========================================

    const address =
      geoObject
        ?.metaDataProperty
        ?.GeocoderMetaData
        ?.text;


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

    // ========================================
    // ОШИБКА ГЕОКОДИРОВАНИЯ
    // ========================================

    console.error(
      "Ошибка HTTP геокодирования:",
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
