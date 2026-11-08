/* Nads' Rental Explorer
   Public rental listings, approximate locations and nearby amenities.
*/

let rentals = [];
let rentalMap = null;
let rentalLayer = null;
let rentalAmenityCache = {};
let rentalSearchId = 0;

const $r = id => document.getElementById(id);

const esc = text => String(text ?? '').replace(
  /[&<>"']/g,
  c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c])
);

function km(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;

  const q =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) *
    Math.cos(b.lat * rad) *
    Math.sin(dLon / 2) ** 2;

  return 12742 * Math.asin(Math.sqrt(q));
}

function dist(a, b) {
  const distance = km(a, b);

  return distance < 1
    ? Math.round(distance * 1000) + ' m'
    : distance.toFixed(2) + ' km';
}

/* Prevent external services hanging indefinitely */

async function fetchWithTimeout(url, milliseconds = 12000) {
  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    milliseconds
  );

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Server returned ' + response.status);
    }

    return await response.json();

  } finally {
    clearTimeout(timer);
  }
}

/* Load rental properties */

async function loadRentals() {
  try {
    const response = await fetch(
      './rentals.json?' + Date.now(),
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error('Rental listings unavailable');
    }

    const data = await response.json();

    rentals = (data.properties || []).filter(
      property => property.url && property.title
    );

    $r('rentalStatus').textContent =
      rentals.length +
      ' advertised rental listings in latest snapshot' +
      ' · Updated ' +
      (data.updated || 'unknown') +
      (data.notice ? ' · ' + data.notice : '');

    const options =
      '<option value="">Select a property…</option>' +
      rentals.map((property, index) =>
        '<option value="' + index + '">' +
        esc(property.title) +
        ' · ' +
        esc(property.price || 'Price on enquiry') +
        '</option>'
      ).join('');

    $r('rentalSelect').innerHTML = options;
    $r('compareRental').innerHTML = options;

    if (!rentals.length) {
      $r('rentalStatus').textContent =
        'No current rental listings available.';
    }

  } catch (error) {
    $r('rentalStatus').textContent =
      'Unable to load rental listings: ' + error.message;
  }
}

/* Find approximate property coordinates */

async function geocode(address) {
  const url =
    'https://nominatim.openstreetmap.org/search' +
    '?format=json&limit=1&countrycodes=gb&q=' +
    encodeURIComponent(address);

  const results = await fetchWithTimeout(url, 12000);

  if (!results.length) {
    throw new Error('Location not found');
  }

  return {
    lat: Number(results[0].lat),
    lon: Number(results[0].lon)
  };
}

async function rentalLocation(property) {
  if (property.lat != null && property.lon != null) {
    return {
      lat: Number(property.lat),
      lon: Number(property.lon)
    };
  }

  if (property._pos) {
    return property._pos;
  }

  const address =
    property.location ||
    property.address ||
    property.title + ', Kent, UK';

  property._pos = await geocode(address);

  return property._pos;
}

/* Create and resize map */

function ensureRentalMap(position) {
  if (!window.L) {
    throw new Error('Map library unavailable');
  }

  if (!rentalMap) {
    rentalMap = L.map('rentalMap', {
      zoomControl: true
    }).setView(
      [position.lat, position.lon],
      14
    );

    L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }
    ).addTo(rentalMap);

    rentalLayer = L.layerGroup().addTo(rentalMap);
  }

  rentalLayer.clearLayers();

  rentalMap.setView(
    [position.lat, position.lon],
    14
  );

  /* Prominent property marker */

  L.circleMarker(
    [position.lat, position.lon],
    {
      radius: 11,
      color: '#ffffff',
      weight: 3,
      fillColor: '#e53935',
      fillOpacity: 1
    }
  )
  .addTo(rentalLayer)
  .bindPopup(
    '<strong>🏠 Rental property</strong><br>' +
    'Approximate location'
  );

  /* Ensure Leaflet fills its container */

  const container = $r('rentalMap');

  container.style.height = '350px';
  container.style.width = '100%';

  setTimeout(() => {
    rentalMap.invalidateSize();
    rentalMap.setView(
      [position.lat, position.lon],
      14
    );
  }, 250);

  setTimeout(() => {
    rentalMap.invalidateSize();
  }, 800);
}

/* Display selected rental */

async function rentalSelected() {
  const property =
    rentals[Number($r('rentalSelect').value)];

  rentalSearchId++;

  if (!property) {
    $r('rentalDetails').innerHTML = '';
    $r('rentalNearby').textContent =
      'Select a rental to begin.';
    return;
  }

  $r('rentalDetails').innerHTML =
    '<strong>' + esc(property.title) + '</strong>' +
    ' · ' +
    esc(property.price || 'Price on enquiry') +
    '<br>' +
    '<a href="' + esc(property.url) + '"' +
    ' target="_blank" rel="noopener noreferrer">' +
    'View original listing ↗</a>' +
    '<p class="note">' +
    esc(property.location || property.address || 'Approximate area') +
    '</p
