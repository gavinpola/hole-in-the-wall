/**
 * Hole in the Wall - Main Application
 * Restaurant discovery for Japan
 */

// Global state
const state = {
  restaurants: [],
  regions: {},
  selectedRestaurant: null,
  filters: {
    cuisine: [],
    area: [],
    features: [],
    price: []
  },
  userLocation: null,
  sheetState: 'collapsed' // collapsed, peek, expanded
};

// DOM elements
const elements = {
  sheet: document.getElementById('sheet'),
  sheetHandle: document.getElementById('sheet-handle'),
  sheetContent: document.getElementById('sheet-content'),
  listView: document.getElementById('list-view'),
  detailView: document.getElementById('detail-view'),
  restaurantList: document.getElementById('restaurant-list'),
  restaurantCount: document.getElementById('restaurant-count'),
  filterBtn: document.getElementById('filter-btn'),
  filterDrawer: document.getElementById('filter-drawer'),
  filterOverlay: document.getElementById('filter-overlay'),
  filterCloseBtn: document.getElementById('filter-close-btn'),
  locationBtn: document.getElementById('location-btn'),
  mapLoading: document.getElementById('map-loading')
};

/**
 * Initialize the application
 */
async function init() {
  console.log('🏮 Hole in the Wall - Initializing');

  // Load data
  await loadData();

  // Initialize UI
  initSheet();
  initFilters();
  renderRestaurantList();

  // Hide loading
  setTimeout(() => {
    elements.mapLoading.classList.add('hidden');
  }, 1000);

  console.log('✓ App initialized');
}

/**
 * Load restaurant data from JSON
 */
async function loadData() {
  try {
    const response = await fetch('data.json');
    const data = await response.json();

    state.restaurants = data.restaurants || [];
    state.regions = data.regions || {};

    console.log(`✓ Loaded ${state.restaurants.length} restaurants`);
  } catch (error) {
    console.error('Failed to load data:', error);
    // Use empty data for now
    state.restaurants = [];
  }
}

/**
 * Initialize the bottom sheet
 */
function initSheet() {
  let startY = 0;
  let currentY = 0;
  let isDragging = false;

  elements.sheetHandle.addEventListener('touchstart', (e) => {
    isDragging = true;
    startY = e.touches[0].clientY;
  });

  elements.sheetHandle.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentY = e.touches[0].clientY;
    const diff = startY - currentY;

    // Preview drag (optional visual feedback)
  });

  elements.sheetHandle.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;

    const diff = startY - currentY;

    if (diff > 50) {
      // Dragged up - expand
      expandSheet();
    } else if (diff < -50) {
      // Dragged down - collapse
      if (state.selectedRestaurant) {
        // If detail view, go back to list
        closeDetailView();
      } else {
        collapseSheet();
      }
    }
  });

  // Click to toggle
  elements.sheetHandle.addEventListener('click', () => {
    if (state.sheetState === 'expanded') {
      peekSheet();
    } else {
      expandSheet();
    }
  });
}

/**
 * Sheet state management
 */
function collapseSheet() {
  elements.sheet.classList.remove('expanded');
  elements.sheet.classList.add('collapsed');
  state.sheetState = 'collapsed';
}

function peekSheet() {
  elements.sheet.classList.remove('expanded', 'collapsed');
  state.sheetState = 'peek';
}

function expandSheet() {
  elements.sheet.classList.add('expanded');
  elements.sheet.classList.remove('collapsed');
  state.sheetState = 'expanded';
}

/**
 * Initialize filter UI
 */
function initFilters() {
  // Open filter drawer
  elements.filterBtn.addEventListener('click', () => {
    elements.filterDrawer.classList.add('open');
    elements.filterOverlay.classList.add('visible');
  });

  // Close filter drawer
  const closeFilters = () => {
    elements.filterDrawer.classList.remove('open');
    elements.filterOverlay.classList.remove('visible');
  };

  elements.filterCloseBtn.addEventListener('click', closeFilters);
  elements.filterOverlay.addEventListener('click', closeFilters);

  // Populate cuisine filters from data
  populateCuisineFilters();

  // Populate area filters from data
  populateAreaFilters();

  // Handle filter chip clicks
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      updateFilters();
    });
  });
}

/**
 * Populate cuisine filter chips from restaurant data
 */
function populateCuisineFilters() {
  const cuisines = new Set();
  state.restaurants.forEach(r => {
    if (r.experience?.cuisine_type) {
      cuisines.add(r.experience.cuisine_type);
    }
  });

  const container = document.getElementById('cuisine-filters');
  container.innerHTML = '';

  cuisines.forEach(cuisine => {
    const chip = document.createElement('button');
    chip.className = 'filter-chip';
    chip.dataset.filter = `cuisine_${cuisine}`;
    chip.textContent = formatCuisine(cuisine);
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      updateFilters();
    });
    container.appendChild(chip);
  });
}

/**
 * Populate area filter chips from restaurant data
 */
function populateAreaFilters() {
  const areas = new Set();
  state.restaurants.forEach(r => {
    if (r.location?.area) {
      areas.add(r.location.area);
    }
  });

  const container = document.getElementById('area-filters');
  container.innerHTML = '';

  areas.forEach(area => {
    const chip = document.createElement('button');
    chip.className = 'filter-chip';
    chip.dataset.filter = `area_${area}`;
    chip.textContent = formatArea(area);
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      updateFilters();
    });
    container.appendChild(chip);
  });
}

/**
 * Update filters and re-render
 */
function updateFilters() {
  // Collect active filters
  state.filters = {
    cuisine: [],
    area: [],
    features: [],
    price: []
  };

  document.querySelectorAll('.filter-chip.active').forEach(chip => {
    const filter = chip.dataset.filter;
    if (filter.startsWith('cuisine_')) {
      state.filters.cuisine.push(filter.replace('cuisine_', ''));
    } else if (filter.startsWith('area_')) {
      state.filters.area.push(filter.replace('area_', ''));
    } else if (filter.startsWith('price_')) {
      state.filters.price.push(filter.replace('price_', ''));
    } else {
      state.filters.features.push(filter);
    }
  });

  renderRestaurantList();

  // Update map markers if map is initialized
  if (window.updateMapMarkers) {
    window.updateMapMarkers();
  }
}

/**
 * Get filtered restaurants
 */
function getFilteredRestaurants() {
  return state.restaurants.filter(r => {
    // Cuisine filter
    if (state.filters.cuisine.length > 0) {
      if (!state.filters.cuisine.includes(r.experience?.cuisine_type)) {
        return false;
      }
    }

    // Area filter
    if (state.filters.area.length > 0) {
      if (!state.filters.area.includes(r.location?.area)) {
        return false;
      }
    }

    // Feature filters
    if (state.filters.features.includes('solo_friendly')) {
      if (r.visit_info?.solo_friendly?.rating < 4) return false;
    }
    if (state.filters.features.includes('cash_only')) {
      if (!r.visit_info?.payment?.cash_only) return false;
    }
    if (state.filters.features.includes('english_menu')) {
      if (!r.visit_info?.language?.english_menu) return false;
    }
    if (state.filters.features.includes('no_reservation')) {
      if (r.visit_info?.reservation?.required) return false;
    }

    // Price filter
    if (state.filters.price.length > 0) {
      const priceLevel = (r.experience?.price_range || '').length;
      if (!state.filters.price.includes(`${priceLevel}`)) return false;
    }

    return true;
  });
}

/**
 * Render restaurant list
 */
function renderRestaurantList() {
  const restaurants = getFilteredRestaurants();

  elements.restaurantCount.textContent = `${restaurants.length} place${restaurants.length !== 1 ? 's' : ''}`;

  if (restaurants.length === 0) {
    elements.restaurantList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🏮</div>
        <h3 class="empty-state-title">No spots found</h3>
        <p class="empty-state-text">Try adjusting your filters</p>
      </div>
    `;
    return;
  }

  elements.restaurantList.innerHTML = restaurants.map(r => renderRestaurantCard(r)).join('');

  // Add click handlers
  elements.restaurantList.querySelectorAll('.restaurant-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const restaurant = state.restaurants.find(r => r.id === id);
      if (restaurant) {
        selectRestaurant(restaurant);
      }
    });
  });
}

/**
 * Render a restaurant card
 */
function renderRestaurantCard(r) {
  const soloRating = r.visit_info?.solo_friendly?.rating || 0;
  const soloDots = Array(5).fill(0).map((_, i) =>
    `<span class="solo-dot ${i < soloRating ? 'filled' : ''}"></span>`
  ).join('');

  return `
    <div class="restaurant-card" data-id="${r.id}">
      <div class="card-header">
        <div class="card-names">
          <h3 class="card-name-en">${r.name_en}</h3>
          <span class="card-name-ja jp">${r.name_ja}</span>
        </div>
        ${r.authenticity?.tabelog_rating ? `
          <div class="card-rating">
            <span class="card-rating-value">${r.authenticity.tabelog_rating}</span>
            <span class="card-rating-label">Tabelog</span>
          </div>
        ` : ''}
      </div>
      <p class="card-tagline">${r.tagline}</p>
      <div class="card-meta">
        <span class="pill">${formatCuisine(r.experience?.cuisine_type)}</span>
        <span class="pill">${r.experience?.price_range || '¥¥'}</span>
        ${r.visit_info?.payment?.cash_only ? '<span class="pill pill-gold">💴 Cash</span>' : ''}
        ${soloRating >= 4 ? `<span class="pill pill-sage">Solo-friendly</span>` : ''}
      </div>
    </div>
  `;
}

/**
 * Select a restaurant and show detail view
 */
function selectRestaurant(restaurant) {
  state.selectedRestaurant = restaurant;

  // Render detail view
  elements.detailView.innerHTML = renderDetailView(restaurant);
  elements.detailView.style.display = 'block';
  elements.listView.style.display = 'none';

  // Expand sheet
  expandSheet();

  // Fly to location on map
  if (window.flyToRestaurant) {
    window.flyToRestaurant(restaurant);
  }

  // Add back button handler
  elements.detailView.querySelector('.back-btn')?.addEventListener('click', closeDetailView);
}

/**
 * Close detail view
 */
function closeDetailView() {
  state.selectedRestaurant = null;
  elements.detailView.style.display = 'none';
  elements.listView.style.display = 'block';
  peekSheet();

  // Deselect on map
  if (window.deselectMarker) {
    window.deselectMarker();
  }
}

/**
 * Render restaurant detail view
 */
function renderDetailView(r) {
  const soloRating = r.visit_info?.solo_friendly?.rating || 0;
  const soloDots = Array(5).fill(0).map((_, i) =>
    `<span class="solo-dot ${i < soloRating ? 'filled' : ''}"></span>`
  ).join('');

  const localRatio = (r.authenticity?.local_ratio || 0) * 100;

  return `
    <button class="icon-btn back-btn" style="margin-bottom: var(--space-4);">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
      </svg>
    </button>

    <div class="detail-header">
      <h2 class="detail-name-en">${r.name_en}</h2>
      <p class="detail-name-ja jp">${r.name_ja}</p>
      <p class="detail-tagline">${r.tagline}</p>
      <div class="detail-pills">
        <span class="pill">${formatCuisine(r.experience?.cuisine_type)}</span>
        <span class="pill">${formatArea(r.location?.area)}</span>
        <span class="pill">${r.experience?.price_range || '¥¥'}</span>
        ${r.authenticity?.tabelog_rating ? `<span class="pill pill-gold">★ ${r.authenticity.tabelog_rating}</span>` : ''}
      </div>
    </div>

    ${r.location?.wayfinding ? `
      <div class="wayfinding">
        <div class="wayfinding-label">How to find it</div>
        <p class="wayfinding-text">${r.location.wayfinding.approach}</p>
        <div class="wayfinding-details">
          ${r.location.wayfinding.floor ? `
            <div class="wayfinding-detail">
              <span class="wayfinding-detail-label">Floor:</span>
              <span>${r.location.wayfinding.floor}</span>
            </div>
          ` : ''}
          ${r.location.wayfinding.entrance ? `
            <div class="wayfinding-detail">
              <span class="wayfinding-detail-label">Entrance:</span>
              <span>${r.location.wayfinding.entrance}</span>
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}

    <div class="solo-rating">
      <div class="solo-rating-header">
        <span class="solo-rating-label">Solo diner comfort</span>
        <div class="solo-rating-dots">${soloDots}</div>
      </div>
      <div class="solo-rating-features">
        ${r.visit_info?.solo_friendly?.counter_seats ? `
          <div class="solo-feature">
            <span class="solo-feature-icon positive">✓</span>
            <span>Counter seats (${r.visit_info.solo_friendly.counter_seats} available)</span>
          </div>
        ` : ''}
        ${r.visit_info?.language?.english_menu ? `
          <div class="solo-feature">
            <span class="solo-feature-icon positive">✓</span>
            <span>English menu available</span>
          </div>
        ` : `
          <div class="solo-feature">
            <span class="solo-feature-icon negative">✗</span>
            <span>No English menu</span>
          </div>
        `}
        ${r.visit_info?.payment?.cash_only ? `
          <div class="solo-feature">
            <span class="solo-feature-icon">💴</span>
            <span>Cash only - have yen ready</span>
          </div>
        ` : ''}
      </div>
    </div>

    ${localRatio > 0 ? `
      <div class="local-ratio">
        <div class="local-ratio-header">
          <span class="local-ratio-label">Local crowd</span>
          <span class="local-ratio-value">${Math.round(localRatio)}%</span>
        </div>
        <div class="local-ratio-bar">
          <div class="local-ratio-fill" style="width: ${localRatio}%"></div>
        </div>
      </div>
    ` : ''}

    <div class="info-section">
      <h3 class="info-section-title">Visit info</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Hours</span>
          <span class="info-value mono">${r.visit_info?.hours?.weekday || 'Check ahead'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Closed</span>
          <span class="info-value">${r.visit_info?.hours?.closed || 'Unknown'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Average spend</span>
          <span class="info-value mono">${r.experience?.avg_spend || 'Varies'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Reservation</span>
          <span class="info-value">${r.visit_info?.reservation?.required ? 'Required' : 'Walk-in OK'}</span>
        </div>
      </div>
    </div>

    ${r.visit_info?.language?.order_tip ? `
      <div class="info-section">
        <h3 class="info-section-title">Ordering tip</h3>
        <p class="text-secondary text-sm">${r.visit_info.language.order_tip}</p>
      </div>
    ` : ''}

    ${r.experience?.specialty ? `
      <div class="info-section">
        <h3 class="info-section-title">What to order</h3>
        <p class="text-secondary text-sm">${r.experience.specialty}</p>
        ${r.experience?.signature_dish ? `<p class="text-warm text-sm mt-2">→ ${r.experience.signature_dish}</p>` : ''}
      </div>
    ` : ''}

    ${r.authenticity?.years_operating ? `
      <div class="info-section">
        <p class="text-muted text-xs">Operating for ${r.authenticity.years_operating} years</p>
      </div>
    ` : ''}
  `;
}

/**
 * Format helpers
 */
function formatCuisine(cuisine) {
  if (!cuisine) return 'Restaurant';
  return cuisine.charAt(0).toUpperCase() + cuisine.slice(1).replace(/_/g, ' ');
}

function formatArea(area) {
  if (!area) return '';
  return area.charAt(0).toUpperCase() + area.slice(1);
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', init);

// Export for map.js
window.state = state;
window.getFilteredRestaurants = getFilteredRestaurants;
window.selectRestaurant = selectRestaurant;
