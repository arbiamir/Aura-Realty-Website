/**
 * ============================================================
 * AURA REALTY — Interactive Map (Leaflet.js)
 * ============================================================
 * Initializes a Leaflet map, places property markers,
 * and syncs with the listings filter system.
 * Uses OpenStreetMap tiles (free, no API key required).
 * ============================================================
 */

let map = null;
let markersLayer = null;

/**
 * Initialize the Leaflet map on the listings page
 */
function initMap() {
  const mapContainer = document.getElementById('listings-map');
  if (!mapContainer) return;

  // Center on the US
  map = L.map('listings-map', {
    center: [39.8283, -98.5795],
    zoom: 4,
    scrollWheelZoom: true,
    zoomControl: true
  });

  // OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  // Create marker layer group
  markersLayer = L.layerGroup().addTo(map);

  // Place all property markers initially
  updateMapMarkers(PROPERTIES);

  // Map/List toggle
  const mapToggle = document.getElementById('toggle-map');
  const listToggle = document.getElementById('toggle-list');
  const mapPanel = document.querySelector('.listings-map-panel');
  const listPanel = document.querySelector('.listings-results');

  if (mapToggle && listToggle) {
    mapToggle.addEventListener('click', () => {
      mapPanel.classList.add('active');
      mapToggle.classList.add('active');
      listToggle.classList.remove('active');
      setTimeout(() => map.invalidateSize(), 300);
    });

    listToggle.addEventListener('click', () => {
      mapPanel.classList.remove('active');
      listToggle.classList.add('active');
      mapToggle.classList.remove('active');
    });
  }
}

/**
 * Custom marker icon
 */
function createMarkerIcon(price) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin"><span>${formatPrice(price)}</span></div>`,
    iconSize: [80, 40],
    iconAnchor: [40, 40]
  });
}

/**
 * Update map markers based on filtered properties
 */
function updateMapMarkers(properties) {
  if (!markersLayer) return;
  markersLayer.clearLayers();

  const bounds = [];

  properties.forEach(p => {
    const marker = L.marker([p.lat, p.lng], {
      icon: createMarkerIcon(p.price)
    });

    marker.bindPopup(`
      <div class="map-popup">
        <img src="${p.images[0]}" alt="${p.title}" style="width:100%;height:120px;object-fit:cover;border-radius:6px;">
        <h4 style="margin:8px 0 4px;font-size:14px;">${p.title}</h4>
        <p style="margin:0 0 4px;font-weight:700;color:#d92228;font-size:16px;">${formatPrice(p.price)}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#666;">${p.beds} bd | ${p.baths} ba | ${p.sqft.toLocaleString()} sqft</p>
        <p style="margin:0;font-size:11px;color:#999;">${p.address}, ${p.city}, ${p.state}</p>
        <button onclick="showPropertyDetail(${p.id})" style="margin-top:8px;padding:6px 12px;background:#d92228;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;width:100%;">View Details</button>
      </div>
    `, { maxWidth: 250 });

    marker.addTo(markersLayer);
    bounds.push([p.lat, p.lng]);
  });

  // Fit bounds if we have markers
  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }
}

/**
 * Initialize Contact page map
 */
function initContactMap() {
  const mapContainer = document.getElementById('contact-map');
  if (!mapContainer) return;

  const contactMap = L.map('contact-map', {
    center: [25.7617, -80.1918],
    zoom: 15,
    scrollWheelZoom: false
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(contactMap);

  L.marker([25.7617, -80.1918]).addTo(contactMap)
    .bindPopup('<strong>Aura Realty</strong><br>1234 Brickell Ave, Suite 500<br>Miami, FL 33131')
    .openPopup();
}

/* Initialize maps on DOM ready */
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initContactMap();
});
