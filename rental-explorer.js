
/* Nads' Rental Explorer. Public listings only. */
let rentals = [], rentalMap = null, rentalLayer = null;
let rentalLandmarkLayer = null;
let rentalAmenityCache = {}, rentalRequest = 0, amenityRequest = 0;
const $r = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function km(a,b) { const r=Math.PI/180, dlat=(b.lat-a.lat)*r, dlon=(b.lon-a.lon)*r; return 12742*Math.asin(Math.sqrt(Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlon/2)**2)); }
function dist(a,b) { const d=km(a,b); return d<1?Math.round(d*1000)+' m':d.toFixed(2)+' km'; }
async function loadRentals() {
  try {
    const response=await fetch('./rentals.json?'+Date.now(),{cache:'no-store'});
    if(!response.ok) throw Error('Listings unavailable');
    const data=await response.json();
    rentals=(data.properties||[]).filter(x=>x.url&&x.title);
    $r('rentalStatus').textContent=rentals.length+' advertised rental listings · Updated '+(data.updated||'unknown')+(data.notice?' · '+data.notice:'');
    const options='<option value="">Select a property…</option>'+rentals.map((x,i)=>'<option value="'+i+'">'+esc(x.title)+' · '+esc(x.price||'Price on enquiry')+'</option>').join('');
    $r('rentalSelect').innerHTML=options;
    $r('compareRental').innerHTML=options;
    if(!rentals.length) {
  $r('rentalStatus').textContent =
    'No current listings in the snapshot.';
}
if(rentals.length) await showAllRentals();
  } catch(e) {
    $r('rentalStatus').textContent='Rental listings are currently unavailable.';
    $r('rentalSelect').innerHTML='<option value="">No data available</option>';
  }
}
async function geocode(address) {
  const response=await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=gb&q='+encodeURIComponent(address));
  if(!response.ok) throw Error('Location service unavailable');
  const results=await response.json();
  if(!results.length) throw Error('Location not found');
  return {lat:Number(results[0].lat),lon:Number(results[0].lon)};
}
async function rentalLocation(p) {
  if(p.lat!=null&&p.lon!=null) return {lat:Number(p.lat),lon:Number(p.lon)};
  if(p._pos) return p._pos;
  p._pos=await geocode(p.location||p.title+', Kent, UK');
  return p._pos;
}
function propertyMarker(pos) {
  return L.circleMarker([pos.lat,pos.lon],{radius:10,color:'#ffffff',weight:3,fillColor:'#1976d2',fillOpacity:1})
    .addTo(rentalLayer).bindPopup('Approximate rental location');
}
function ensureRentalMap(pos) {
  if(!window.L) throw Error('Map library unavailable');
  const container=$r('rentalMap');
  if(!rentalMap) {
    container.replaceChildren();
    container.style.position='relative';
    container.style.display='block';
    container.style.width='100%';
    container.style.height='320px';
    container.style.overflow='hidden';
    if(!document.getElementById('rentalMapFix')) {
      const style=document.createElement('style');
      style.id='rentalMapFix';
      style.textContent=`#rentalMap{position:relative!important;height:320px!important;min-height:320px!important;overflow:hidden!important}
      #rentalMap .leaflet-pane,#rentalMap .leaflet-map-pane,#rentalMap .leaflet-tile-pane{position:absolute}
      #rentalMap .leaflet-tile{position:absolute;max-width:none!important;max-height:none!important;width:256px;height:256px}
      #rentalMap .leaflet-marker-icon,#rentalMap .leaflet-marker-shadow{position:absolute;max-width:none!important}`;
      document.head.appendChild(style);
    }
    rentalMap=L.map(container,{zoomControl:true,scrollWheelZoom:false});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(rentalMap);
    rentalLayer=L.layerGroup().addTo(rentalMap);
    rentalLandmarkLayer=L.layerGroup().addTo(rentalMap);
  }
  rentalLayer.clearLayers();
  rentalMap.setView([pos.lat,pos.lon],14,{animate:false});
  propertyMarker(pos);
  requestAnimationFrame(()=>rentalMap.invalidateSize({pan:false,animate:false}));
  setTimeout(()=>rentalMap.invalidateSize({pan:false,animate:false}),500);
}
async function rentalSelected() {
  const selected=$r('rentalSelect').value;
  if(selected==='') return;
  const property=rentals[Number(selected)];
  if(!property) return;
  const request=++rentalRequest;
  ++amenityRequest;
  $r('rentalDetails').innerHTML='<strong>'+esc(property.title)+'</strong> · '+esc(property.price||'Price on enquiry')+'<br><a href="'+esc(property.url)+'" target="_blank" rel="noopener noreferrer">View original listing ↗</a><p class="note">'+esc(property.location||'Approximate area')+'</p>';
  $r('rentalNearby').textContent='Finding location…';
  try {
    const pos=await rentalLocation(property);
    if(request!==rentalRequest) return;
    ensureRentalMap(pos);
    await loadRentalAmenities();
  } catch(e) {
    if(request===rentalRequest) $r('rentalNearby').textContent='Location unavailable: '+e.message;
  }
}
async function fetchLandmarks(query) {
const servers=[
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter'
];
  let lastError;
  for(const server of servers) {
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),7000);
    try {
      const response=await fetch(server+'?data='+encodeURIComponent(query),{method:'GET',signal:controller.signal});
      if(!response.ok) throw Error('Landmark server returned '+response.status);
      const data=await response.json();
      if(!Array.isArray(data.elements)) throw Error('Invalid landmark response');
      return data;
    } catch(e) { lastError=e; }
    finally { clearTimeout(timeout); }
  }
  throw Error('Public landmark services are currently unavailable'+(lastError?' ('+lastError.message+')':''));
}
async function loadRentalAmenities() {
  const selected=$r('rentalSelect').value;
  if(selected==='') return;
  const property=rentals[Number(selected)];
  if(!property) return;
  const kind=$r('rentalAmenity').value;
  const output=$r('rentalNearby');
  const request=++amenityRequest;
  const names={station:'railway stations',school:'schools',supermarket:'supermarkets',park:'parks'};
  const searchTerm=names[kind]||kind;
  const searchAddress=property.location||property.address||property.title+', Dartford';
  const mapsUrl='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(searchTerm+' near '+searchAddress);
  const fallback='<a href="'+esc(mapsUrl)+'" target="_blank" rel="noopener noreferrer">🗺️ Find nearby '+esc(searchTerm)+' in Google Maps ↗</a>';
  output.innerHTML=fallback+'<p class="note">Checking for markers on this map (up to 7 seconds)…</p>';
  try {
    const pos=await rentalLocation(property);
    if(request!==amenityRequest) return;
    if(!rentalMap) ensureRentalMap(pos);
    const key=pos.lat.toFixed(4)+','+pos.lon.toFixed(4)+':'+kind;
    let places=rentalAmenityCache[key];
    if(!places) {
      const filters={station:'["railway"="station"]',school:'["amenity"="school"]',supermarket:'["shop"="supermarket"]',park:'["leisure"="park"]'};
      if(!filters[kind]) throw Error('Unknown landmark category');
      const around='(around:4000,'+pos.lat+','+pos.lon+')';
      const query='[out:json][timeout:25];(node'+around+filters[kind]+';way'+around+filters[kind]+';relation'+around+filters[kind]+';);out center 35;';
      const data=await fetchLandmarks(query);
      if(request!==amenityRequest) return;
      places=(data.elements||[]).map(item=>({name:item.tags?.name||'Unnamed '+kind,lat:item.lat??item.center?.lat,lon:item.lon??item.center?.lon}))
        .filter(item=>Number.isFinite(item.lat)&&Number.isFinite(item.lon))
        .sort((a,b)=>km(pos,a)-km(pos,b)).slice(0,12);
      rentalAmenityCache[key]=places;
    }
    if(request!==amenityRequest) return;
    rentalLayer.clearLayers();
    propertyMarker(pos);
    if(!places.length) { output.innerHTML=fallback+'<p class="note">No local markers returned.</p>'; return; }
    output.innerHTML=places.map(place=>{
      const directions='https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(pos.lat+','+pos.lon)+'&destination='+encodeURIComponent(place.lat+','+place.lon)+'&travelmode=walking';
      return '<div class="rental-item"><strong>'+esc(place.name)+'</strong> · '+dist(pos,place)+' straight line <a href="'+directions+'" target="_blank" rel="noopener noreferrer">Walking route ↗</a></div>';
    }).join('');
    places.forEach(place=>L.circleMarker([place.lat,place.lon],{radius:8,color:'#b88746',weight:3,fillColor:'#eabf82',fillOpacity:.95}).addTo(rentalLayer).bindPopup(esc(place.name)+' · '+dist(pos,place)));
    rentalMap.invalidateSize({pan:false,animate:false});
  } catch(e) {
    if(request===amenityRequest) output.innerHTML=fallback+'<p class="note">Markers unavailable just now. The Google Maps search remains available.</p>';
  }
}
async function compareRentals() {
  const firstIndex=$r('rentalSelect').value,secondIndex=$r('compareRental').value,query=$r('comparePlace').value.trim(),output=$r('compareResult');
  if(firstIndex===''||secondIndex===''||!query) {output.textContent='Choose two rentals and enter a landmark.';return;}
  const first=rentals[Number(firstIndex)],second=rentals[Number(secondIndex)];
  output.textContent='Comparing…';
  try {
    const [a,b,landmark]=await Promise.all([rentalLocation(first),rentalLocation(second),geocode(query+', Kent, UK')]);
    output.innerHTML='<div class="rental-item">'+esc(first.title)+': <strong>'+dist(a,landmark)+'</strong></div><div class="rental-item">'+esc(second.title)+': <strong>'+dist(b,landmark)+'</strong></div><p class="note">Straight-line estimates only; locations may be approximate.</p>';
  } catch(e) {output.textContent='Comparison unavailable: '+e.message;}
}

async function showAllRentals() {
  const results = await Promise.allSettled(
    rentals.map(async property => ({
      property,
      pos: await rentalLocation(property)
    }))
  );

  const located = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value)
    .filter(item =>
      Number.isFinite(item.pos.lat) &&
      Number.isFinite(item.pos.lon)
    );

  if (!located.length) {
    $r('rentalNearby').textContent =
      'Property locations could not be mapped.';
    return;
  }

  ensureRentalMap(located[0].pos);
  rentalLayer.clearLayers();
  

  const bounds = L.latLngBounds([]);

  located.forEach(({property, pos}) => {
    bounds.extend([pos.lat, pos.lon]);

    const popup = document.createElement('div');
    const heading = document.createElement('strong');
    heading.textContent = property.title;

    const price = document.createElement('p');
    price.textContent = property.price || 'Price on enquiry';

    const link = document.createElement('a');
    link.href = property.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'View property listing';

    popup.append(heading, price, link);

    L.circleMarker([pos.lat, pos.lon], {
      radius: 10,
      color: '#ffffff',
      weight: 3,
      fillColor: '#1976d2',
      fillOpacity: 1
    }).addTo(rentalLayer).bindPopup(popup);
  });

  rentalMap.fitBounds(bounds.pad(0.15), {
    maxZoom: 15,
    animate: false
  });
loadDefaultLandmarks();

  setTimeout(() => rentalMap.invalidateSize(), 400);
}

async function loadDefaultLandmarks() {
  if (!rentalMap || !rentalLandmarkLayer) return;

  rentalLandmarkLayer.clearLayers();

  const bounds = rentalMap.getBounds();
  const centre = bounds.getCenter();

  // Search around the displayed rental area.
  const radius = Math.min(
    15000,
    Math.max(4000, Math.round(
      rentalMap.distance(
        centre,
        bounds.getNorthEast()
      ) + 1000
    ))
  );

  const query =
    '[out:json][timeout:25];(' +
    'node(around:' + radius + ',' +
      centre.lat + ',' + centre.lng +
      ')["railway"="station"];' +
    'way(around:' + radius + ',' +
      centre.lat + ',' + centre.lng +
      ')["railway"="station"];' +
    'node(around:' + radius + ',' +
      centre.lat + ',' + centre.lng +
      ')["amenity"="school"];' +
    'way(around:' + radius + ',' +
      centre.lat + ',' + centre.lng +
      ')["amenity"="school"];' +
    ');out center 150;';

  const output = $r('rentalNearby');
  output.textContent =
    'Loading nearby schools and railway stations…';

  try {
    const data = await fetchLandmarks(query);
    const seen = new Set();
    let count = 0;

    for (const item of data.elements || []) {
      const lat = Number(item.lat ?? item.center?.lat);
      const lon = Number(item.lon ?? item.center?.lon);

      if (!Number.isFinite(lat) ||
          !Number.isFinite(lon)) continue;

      const school = item.tags?.amenity === 'school';
      const station = item.tags?.railway === 'station';

      if (!school && !station) continue;

      const name = item.tags?.name ||
        (school ? 'Unnamed school' : 'Railway station');

      const key = name + ':' +
        lat.toFixed(3) + ':' + lon.toFixed(3);

      if (seen.has(key)) continue;
      seen.add(key);

      const marker = L.circleMarker([lat,lon], {
        radius: school ? 6 : 8,
        color: '#ffffff',
        weight: 2,
        fillColor: school ? '#f0ad4e' : '#8657c9',
        fillOpacity: 0.95
      });

      marker.bindPopup(
        (school ? '🏫 ' : '🚉 ') + esc(name)
      );

      marker.addTo(rentalLandmarkLayer);
      count++;
    }

    output.textContent =
      count + ' nearby schools and stations mapped. ' +
      'Blue: rentals · Orange: schools · Purple: stations.';

  } catch (error) {
    output.textContent =
      'Nearby school and station markers are temporarily ' +
      'unavailable. Property markers remain visible.';
  }
}
loadRentals();
