

/* Nads' Rental Explorer */

let rentals = [];

let rentalMap = null;

let rentalLayer = null;

let rentalAmenityCache = {};

let rentalRequest = 0;

const $r = id => document.getElementById(id);

const esc = value => String(value ?? '').replace(

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

  const r = Math.PI / 180;

  const dlat = (b.lat - a.lat) * r;

  const dlon = (b.lon - a.lon) * r;

  const q = Math.sin(dlat / 2) ** 2 +

    Math.cos(a.lat * r) * Math.cos(b.lat * r) *

    Math.sin(dlon / 2) ** 2;

  return 12742 * Math.asin(Math.sqrt(q));

}

function dist(a, b) {

  const d = km(a, b);

  return d < 1

    ? Math.round(d * 1000) + ' m'

    : d.toFixed(2) + ' km';

}

async function loadRentals() {

  try {

    const response = await fetch(

      './rentals.json?' + Date.now(),

      { cache: 'no-store' }

    );

    if (!response.ok) throw Error('Listings unavailable');

    const data = await response.json();

    rentals = (data.properties || []).filter(

      x => x.url && x.title

    );

    $r('rentalStatus').textContent =

      rentals.length + ' advertised rental listings · Updated ' +

      (data.updated || 'unknown') +

      (data.notice ? ' · ' + data.notice : '');

    const options =

      '<option value="">Select a property…</option>' +

      rentals.map((x, i) =>

        '<option value="' + i + '">' +

        esc(x.title) + ' · ' +

        esc(x.price || 'Price on enquiry') +

        '</option>'

      ).join('');

    $r('rentalSelect').innerHTML = options;

    $r('compareRental').innerHTML = options;

    if (!rentals.length) {

      $r('rentalStatus').textContent =

        'No current listings in the snapshot.';

    }

  } catch (error) {

    $r('rentalStatus').textContent =

      'Rental listings are currently unavailable.';

    $r('rentalSelect').innerHTML =

      '<option value="">No data available</option>';

  }

}

async function geocode(address) {

  const url =

    'https://nominatim.openstreetmap.org/search' +

    '?format=json&limit=1&countrycodes=gb&q=' +

    encodeURIComponent(address);

  const response = await fetch(url);

  if (!response.ok) throw Error('Location service unavailable');

  const results = await response.json();

  if (!results.length) throw Error('Location not found');

  return {

    lat: Number(results[0].lat),

    lon: Number(results[0].lon)

  };

}

async function rentalLocation(property) {

  if (property.lat && property.lon) {

    return {

      lat: Number(property.lat),

      lon: Number(property.lon)

    };

  }

  if (property._pos) return property._pos;

  property._pos = await geocode(

    property.location || property.title + ', Kent, UK'

  );

  return property._pos;

}

function ensureRentalMap(pos) {

  if (!window.L) {

    throw Error('Map library unavailable');

  }

  const container = $r('rentalMap');

  if (!rentalMap) {

    // Remove the original placeholder completely.

    container.replaceChildren();

    container.style.position = 'relative';

    container.style.display = 'block';

    container.style.width = '100%';

    container.style.height = '320px';

    container.style.overflow = 'hidden';

    // Keep map images under Leaflet's own positioning rules.

    if (!document.getElementById('rentalMapFix')) {

      const style = document.createElement('style');

      style.id = 'rentalMapFix';

      style.textContent = `

        #rentalMap {

          position: relative !important;

          height: 320px !important;

          min-height: 320px !important;

          overflow: hidden !important;

        }

        #rentalMap .leaflet-pane,

        #rentalMap .leaflet-map-pane,

        #rentalMap .leaflet-tile-pane {

          position: absolute;

        }

        #rentalMap .leaflet-tile {

          position: absolute;

          max-width: none !important;

          max-height: none !important;

          width: 256px;

          height: 256px;

        }

        #rentalMap .leaflet-marker-icon,

        #rentalMap .leaflet-marker-shadow {

          position: absolute;

          max-width: none !important;

        }

      `;

      document.head.appendChild(style);

    }

    rentalMap = L.map(container, {

      zoomControl: true,

      scrollWheelZoom: false

    });

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

  rentalMap.setView([pos.lat, pos.lon], 14, {

    animate: false

  });

  L.marker([pos.lat, pos.lon])

    .addTo(rentalLayer)

    .bindPopup('Approximate rental location');

  // Recalculate map dimensions after layout settles.

  requestAnimationFrame(() => {

    rentalMap.invalidateSize({

      pan: false,

      animate: false

    });

  });

  setTimeout(() => {

    rentalMap.invalidateSize({

      pan: false,

      animate: false

    });

  }, 500);

}

async function rentalSelected() {

  const selected = $r('rentalSelect').value;

  if (selected === '') return;

  const property = rentals[Number(selected)];

  if (!property) return;

  const request = ++rentalRequest;

  $r('rentalDetails').innerHTML =

    '<strong>' + esc(property.title) + '</strong> · ' +

    esc(property.price || 'Price on enquiry') +

    '<br><a href="' + esc(property.url) +

    '" target="_blank" rel="noopener noreferrer">' +

    'View original listing ↗</a>' +

    '<p class="note">' +

    esc(property.location || 'Approximate area') +

    '</p>';

  $r('rentalNearby').textContent = 'Finding location…';

  try {

    const pos = await rentalLocation(property);

    if (request !== rentalRequest) return;

    ensureRentalMap(pos);

    await loadRentalAmenities();

  } catch (error) {

    $r('rentalNearby').textContent =

      'Location unavailable: ' + error.message;

  }

}

async function fetchLandmarks(query) {

  const servers = [

    'https://overpass.kumi.systems/api/interpreter',

    'https://overpass.private.coffee/api/interpreter'

  ];

  let lastError;

  for (const server of servers) {

    try {

      const controller = new AbortController();

      const timeout = setTimeout(

        () => controller.abort(),

        12000

      );

      try {

        const response = await fetch(server, {

          method: 'POST',

          body: new URLSearchParams({ data: query }),

          signal: controller.signal

        });

        if (!response.ok) {

          throw Error('Landmark server busy');

        }

        return await response.json();

      } finally {

        clearTimeout(timeout);

      }

    } catch (error) {

      lastError = error;

    }

  }

  throw lastError || Error('Landmark services unavailable');

}

async function loadRentalAmenities() {

  const selected = $r('rentalSelect').value;

  if (selected === '') return;

  const property = rentals[Number(selected)];

  if (!property) return;

  const kind = $r('rentalAmenity').value;

  const output = $r('rentalNearby');

  output.textContent = 'Searching nearby landmarks…';

  try {

    const pos = await rentalLocation(property);

    // Only create the map if it does not already exist.

    if (!rentalMap) ensureRentalMap(pos);

    const key =

      pos.lat.toFixed(4) + ',' +

      pos.lon.toFixed(4) + ':' + kind;

    let places = rentalAmenityCache[key];

    if (!places) {

      const filters = {

        station: '["railway"="station"]',

        school: '["amenity"="school"]',

        supermarket: '["shop"="supermarket"]',

        park: '["leisure"="park"]'

      };

      if (!filters[kind]) {

        throw Error('Unknown landmark category');

      }

      const query =

        '[out:json][timeout:20];(' +

        'node(around:4000,' +

        pos.lat + ',' + pos.lon + ')' +

        filters[kind] + ';' +

        'way(around:4000,' +

        pos.lat + ',' + pos.lon + ')' +

        filters[kind] + ';' +

        ');out center 35;';

      const data = await fetchLandmarks(query);

      places = (data.elements || [])

        .map(item => ({

          name: item.tags?.name || 'Unnamed ' + kind,

          lat: item.lat ?? item.center?.lat,

          lon: item.lon ?? item.center?.lon

        }))

        .filter(item =>

          Number.isFinite(item.lat) &&

          Number.isFinite(item.lon)

        )

        .sort((a, b) => km(pos, a) - km(pos, b))

        .slice(0, 12);

      rentalAmenityCache[key] = places;

    }

    // Keep the property marker, remove older amenity markers.

    rentalLayer.clearLayers();

    L.marker([pos.lat, pos.lon])

      .addTo(rentalLayer)

      .bindPopup('Approximate rental location');

    if (!places.length) {

      output.textContent =

        'No nearby ' + kind +

        ' locations found in OpenStreetMap.';

      return;

    }

    output.innerHTML = places.map(place => {

      const directions =

        'https://www.google.com/maps/dir/?api=1' +

        '&origin=' +

        encodeURIComponent(pos.lat + ',' + pos.lon) +

        '&destination=' +

        encodeURIComponent(place.lat + ',' + place.lon) +

        '&travelmode=walking';

      return '<div class="rental-item">' +

        '<strong>' + esc(place.name) + '</strong> · ' +

        dist(pos, place) +

        ' straight line ' +

        '<a href="' + directions +

        '" target="_blank" rel="noopener noreferrer">' +

        'Walking route ↗</a></div>';

    }).join('');

    places.forEach(place => {

      L.circleMarker([place.lat, place.lon], {

        radius: 8,

        color: '#b88746',

        weight: 3,

        fillColor: '#eabf82',

        fillOpacity: 0.95

      })

        .addTo(rentalLayer)

        .bindPopup(

          esc(place.name) + ' · ' + dist(pos, place)

        );

    });

    rentalMap.invalidateSize({

      pan: false,

      animate: false

    });

  } catch (error) {

    output.textContent =

      'Nearby search unavailable: ' +

      error.message +

      '. Please try again later.';

  }

}

async function compareRentals() {

  const firstIndex = $r('rentalSelect').value;

  const secondIndex = $r('compareRental').value;

  const query = $r('comparePlace').value.trim();

  const output = $r('compareResult');

  if (

    firstIndex === '' ||

    secondIndex === '' ||

    !query

  ) {

    output.textContent =

      'Choose two rentals and enter a landmark.';

    return;

  }

  const first = rentals[Number(firstIndex)];

  const second = rentals[Number(secondIndex)];

  output.textContent = 'Comparing…';

  try {

    const [a, b, landmark] = await Promise.all([

      rentalLocation(first),

      rentalLocation(second),

      geocode(query + ', Kent, UK')

    ]);

    output.innerHTML =

      '<div class="rental-item">' +

      esc(first.title) + ': <strong>' +

      dist(a, landmark) + '</strong></div>' +

      '<div class="rental-item">' +

      esc(second.title) + ': <strong>' +

      dist(b, landmark) + '</strong></div>' +

      '<p class="note">' +

      'Straight-line estimates only; locations may be approximate.' +

      '</p>';

  } catch (error) {

    output.textContent =

      'Comparison unavailable: ' + error.message;

  }

}

loadRentals();
