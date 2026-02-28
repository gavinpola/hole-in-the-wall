/**
 * Hole in the Wall - Map Module
 * Mapbox GL JS integration
 */

// Get token from config (loaded via config.js)
const MAPBOX_TOKEN = window.HITW_CONFIG?.MAPBOX_TOKEN || '';

// Check if we have a real token
const hasToken = MAPBOX_TOKEN && !MAPBOX_TOKEN.includes('YOUR_');

// Map instance
let map = null;
let markers = [];
let selectedMarker = null;

// Default center (Tokyo)
const DEFAULT_CENTER = [139.6917, 35.6895];
const DEFAULT_ZOOM = 11;

/**
 * Initialize the map
 */
function initMap() {
  if (!hasToken) {
    console.warn('⚠️ Mapbox token not configured. Map will not display.');
    showMapPlaceholder();
    return;
  }

  mapboxgl.accessToken = MAPBOX_TOKEN;

  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    attributionControl: true
  });

  // Customize map style on load
  map.on('load', () => {
    // Adjust map colors to match our design
    map.setPaintProperty('background', 'background-color', '#0a0a0a');

    // Add markers after data is loaded
    setTimeout(() => {
      addMarkers();
    }, 500);
  });

  // Map control buttons
  document.getElementById('zoom-in-btn').addEventListener('click', () => {
    map.zoomIn();
  });

  document.getElementById('zoom-out-btn').addEventListener('click', () => {
    map.zoomOut();
  });

  document.getElementById('location-btn').addEventListener('click', () => {
    getUserLocation();
  });

  // Click on map to deselect
  map.on('click', (e) => {
    // Check if click was on a marker
    const features = map.queryRenderedFeatures(e.point);
    if (features.length === 0 || !features.some(f => f.layer?.id?.includes('marker'))) {
      // Clicked on empty space
      if (selectedMarker) {
        deselectMarker();
      }
    }
  });
}

/**
 * Show placeholder when no Mapbox token
 */
function showMapPlaceholder() {
  const mapEl = document.getElementById('map');
  mapEl.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: #0a0a0a;
      color: #707070;
      font-family: var(--font-body);
      text-align: center;
      padding: 2rem;
    ">
      <div style="font-size: 3rem; margin-bottom: 1rem;">🗾</div>
      <h3 style="color: #b0b0b0; margin-bottom: 0.5rem;">Map Coming Soon</h3>
      <p style="font-size: 0.875rem;">Configure your Mapbox token in map.js</p>
    </div>
  `;

  // Hide loading
  document.getElementById('map-loading').classList.add('hidden');
}

/**
 * Add markers for all restaurants
 */
function addMarkers() {
  // Clear existing markers
  markers.forEach(m => m.remove());
  markers = [];

  const restaurants = window.getFilteredRestaurants ? window.getFilteredRestaurants() : [];

  restaurants.forEach(restaurant => {
    if (!restaurant.location?.coordinates) return;

    const { lat, lng } = restaurant.location.coordinates;

    // Create marker element
    const el = document.createElement('div');
    el.className = 'marker';
    el.innerHTML = '<div class="marker-inner"></div>';

    // Create marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(map);

    // Store reference
    marker._restaurant = restaurant;
    markers.push(marker);

    // Click handler
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      selectMarker(marker);
      window.selectRestaurant(restaurant);
    });
  });

  // Fit bounds to show all markers
  if (markers.length > 0) {
    fitToMarkers();
  }
}

/**
 * Fit map to show all markers
 */
function fitToMarkers() {
  if (markers.length === 0) return;

  const bounds = new mapboxgl.LngLatBounds();

  markers.forEach(marker => {
    bounds.extend(marker.getLngLat());
  });

  map.fitBounds(bounds, {
    padding: { top: 100, bottom: 250, left: 50, right: 50 },
    maxZoom: 14
  });
}

/**
 * Select a marker
 */
function selectMarker(marker) {
  // Deselect previous
  if (selectedMarker) {
    selectedMarker.getElement().classList.remove('selected');
  }

  // Select new
  marker.getElement().classList.add('selected');
  selectedMarker = marker;
}

/**
 * Deselect current marker
 */
function deselectMarker() {
  if (selectedMarker) {
    selectedMarker.getElement().classList.remove('selected');
    selectedMarker = null;
  }
}

/**
 * Fly to a restaurant location
 */
function flyToRestaurant(restaurant) {
  if (!map || !restaurant.location?.coordinates) return;

  const { lat, lng } = restaurant.location.coordinates;

  map.flyTo({
    center: [lng, lat],
    zoom: 16,
    essential: true
  });

  // Select the corresponding marker
  const marker = markers.find(m => m._restaurant?.id === restaurant.id);
  if (marker) {
    selectMarker(marker);
  }
}

/**
 * Get user's location
 */
function getUserLocation() {
  const btn = document.getElementById('location-btn');
  btn.classList.add('loading');

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (map) {
          map.flyTo({
            center: [longitude, latitude],
            zoom: 14,
            essential: true
          });
        }

        window.state.userLocation = { lat: latitude, lng: longitude };
        btn.classList.remove('loading');
        btn.classList.add('active');

        // Remove active state after a moment
        setTimeout(() => btn.classList.remove('active'), 2000);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        btn.classList.remove('loading');

        // Show brief error indication
        btn.style.borderColor = 'var(--accent-warm)';
        setTimeout(() => btn.style.borderColor = '', 1500);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  } else {
    btn.classList.remove('loading');
    console.warn('Geolocation not supported');
  }
}

/**
 * Update map markers (called when filters change)
 */
function updateMapMarkers() {
  if (!map) return;
  addMarkers();
}

// Initialize map when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure app.js has initialized
  setTimeout(initMap, 100);
});

// Export functions for app.js
window.flyToRestaurant = flyToRestaurant;
window.deselectMarker = deselectMarker;
window.updateMapMarkers = updateMapMarkers;
