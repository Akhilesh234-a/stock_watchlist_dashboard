/**
 * script.js
 * 
 * Stock Watchlist Dashboard - Client-side Frontend Logic
 * Technology: Plain Vanilla JavaScript (ES6+), Fetch API, Async/Await
 * 
 * Features:
 * - Communicates with Express.js REST API endpoints
 * - Performs CRUD operations: Create (POST), Read (GET), Delete (DELETE)
 * - Safe DOM manipulation to prevent XSS (Cross-Site Scripting)
 * - Instant client-side search & filtering
 * - Dynamic metrics calculation (Total, Demo Gainers, Demo Losers)
 * - Interactive modals & floating toast notifications
 * - Backend health status monitoring
 */

// ==========================================================================
// 1. STATE MANAGEMENT & API CONFIGURATION
// ==========================================================================
const API_BASE_URL = '/api';

// Application State
let watchlistStocks = [];     // Full array of stocks from database
let activeDeleteStockId = null; // Currently selected stock for deletion

// ==========================================================================
// 2. DOM ELEMENT SELECTORS
// ==========================================================================
// System Status
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// Metric Counts
const totalStocksCountEl = document.getElementById('totalStocksCount');
const gainingStocksCountEl = document.getElementById('gainingStocksCount');
const losingStocksCountEl = document.getElementById('losingStocksCount');

// Form Elements
const addStockForm = document.getElementById('addStockForm');
const stockSymbolInput = document.getElementById('stockSymbol');
const companyNameInput = document.getElementById('companyName');
const stockExchangeSelect = document.getElementById('stockExchange');
const submitStockBtn = document.getElementById('submitStockBtn');
const formMessageEl = document.getElementById('formMessage');

// Search Elements
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchResultsCountEl = document.getElementById('searchResultsCount');

// Table Elements
const watchlistTableBody = document.getElementById('watchlistTableBody');
const tableLoadingEl = document.getElementById('tableLoading');
const tableEmptyEl = document.getElementById('tableEmpty');
const tableNoSearchMatchEl = document.getElementById('tableNoSearchMatch');
const tableContainerEl = document.getElementById('tableContainer');

// Details Modal Elements
const stockDetailsModal = document.getElementById('stockDetailsModal');
const modalSymbol = document.getElementById('modalSymbol');
const modalExchange = document.getElementById('modalExchange');
const modalCompanyName = document.getElementById('modalCompanyName');
const modalMongoId = document.getElementById('modalMongoId');
const modalAddedAt = document.getElementById('modalAddedAt');
const modalDemoPrice = document.getElementById('modalDemoPrice');
const modalDemoChange = document.getElementById('modalDemoChange');

// Delete Modal Elements
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const deleteStockSymbolName = document.getElementById('deleteStockSymbolName');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Toast Container
const toastContainer = document.getElementById('toastContainer');

// ==========================================================================
// 3. INITIALIZATION ON PAGE LOAD
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Check backend server and database health
  checkBackendHealth();

  // Load stocks from MongoDB
  fetchStocks();

  // Setup Form Submit Listener
  if (addStockForm) {
    addStockForm.addEventListener('submit', handleAddStock);
  }

  // Setup Search Input Listener
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  // Setup Clear Search Button
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', clearSearch);
  }

  // Setup Delete Confirmation Button
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', executeStockDelete);
  }

  // Auto-uppercase stock symbol input as user types
  if (stockSymbolInput) {
    stockSymbolInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
  }

  // Close modals when user presses ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeStockDetailsModal();
      closeDeleteModal();
    }
  });
});

// ==========================================================================
// 4. API FUNCTIONS (FETCH / CRUD)
// ==========================================================================

/**
 * Checks backend server health and MongoDB connection status
 * Endpoint: GET /api/health
 */
async function checkBackendHealth() {
  try {
    statusDot.className = 'status-dot status-checking';
    statusText.textContent = 'Connecting...';

    const response = await fetch(`${API_BASE_URL}/health`);
    const result = await response.json();

    if (response.ok && result.success) {
      const isDbConnected = result.database && result.database.status === 'connected';
      
      if (isDbConnected) {
        statusDot.className = 'status-dot status-online';
        statusText.textContent = 'MongoDB Atlas Connected';
      } else {
        statusDot.className = 'status-dot status-checking';
        statusText.textContent = `DB: ${result.database.status}`;
      }
    } else {
      throw new Error(result.message || 'Health check failed');
    }
  } catch (error) {
    console.warn('Backend health check error:', error.message);
    statusDot.className = 'status-dot status-offline';
    statusText.textContent = 'Server / DB Disconnected';
  }
}

/**
 * Fetches all saved stocks from the Express backend
 * Endpoint: GET /api/stocks
 */
async function fetchStocks() {
  showTableLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/stocks`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch stocks from server.');
    }

    watchlistStocks = result.data || [];
    
    // Update summary counts
    updateDashboardMetrics();

    // Render stocks table (filtered by any active search term)
    applyCurrentFilter();

  } catch (error) {
    console.error('Error in fetchStocks:', error);
    showToast(error.message, 'error');
    renderStocks([]); // Show empty/error state
  } finally {
    showTableLoading(false);
  }
}

/**
 * Handles stock form submission and saves stock to MongoDB
 * Endpoint: POST /api/stocks
 */
async function handleAddStock(event) {
  event.preventDefault();

  // Clear previous inline messages
  setFormMessage('', '');

  // Extract and clean values
  const symbol = stockSymbolInput.value.trim().toUpperCase();
  const companyName = companyNameInput.value.trim();
  const exchange = stockExchangeSelect.value.trim();

  // Client-Side Validation
  if (!symbol) {
    setFormMessage('Please enter a valid stock symbol (e.g., AAPL).', 'error');
    stockSymbolInput.focus();
    return;
  }

  if (!companyName) {
    setFormMessage('Please enter the company name.', 'error');
    companyNameInput.focus();
    return;
  }

  // Disable submit button during request
  toggleFormSubmitting(true);

  try {
    const payload = { symbol, companyName, exchange };

    const response = await fetch(`${API_BASE_URL}/stocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Error occurred while saving stock.');
    }

    // Success: Notify user & reset form
    showToast(`✅ ${result.message}`, 'success');
    setFormMessage(`Stock '${symbol}' was added successfully!`, 'success');
    addStockForm.reset();

    // Re-fetch watchlist from database to show updated list
    await fetchStocks();

    // Smooth scroll to table to see the new stock
    setTimeout(() => {
      scrollToSection('watchlist');
    }, 500);

  } catch (error) {
    console.error('Error adding stock:', error);
    setFormMessage(error.message, 'error');
    showToast(error.message, 'error');
  } finally {
    toggleFormSubmitting(false);
  }
}

/**
 * Opens confirmation modal to delete a stock
 */
function openDeleteModal(stockId, stockSymbol, companyName) {
  activeDeleteStockId = stockId;
  deleteStockSymbolName.textContent = `${stockSymbol} (${companyName})`;
  deleteConfirmModal.style.display = 'flex';
}

/**
 * Closes the delete confirmation modal
 */
function closeDeleteModal() {
  activeDeleteStockId = null;
  deleteConfirmModal.style.display = 'none';
}

/**
 * Executes stock deletion via Express backend API
 * Endpoint: DELETE /api/stocks/:id
 */
async function executeStockDelete() {
  if (!activeDeleteStockId) return;

  const stockId = activeDeleteStockId;
  closeDeleteModal();

  try {
    const response = await fetch(`${API_BASE_URL}/stocks/${stockId}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete stock.');
    }

    showToast(`🗑️ ${result.message}`, 'success');

    // Refresh stocks from backend
    await fetchStocks();

  } catch (error) {
    console.error('Error deleting stock:', error);
    showToast(error.message, 'error');
  }
}

/**
 * Fetches stock details and opens details modal
 * Endpoint: GET /api/stocks/:id
 */
async function openStockDetails(stockId) {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks/${stockId}`);
    const result = await response.json();

    if (!response.ok || !result.data) {
      throw new Error(result.message || 'Failed to fetch stock details.');
    }

    const stock = result.data;
    const demoMetrics = generateDeterministicDemoMetrics(stock.symbol);

    // Populate Modal Fields safely using textContent
    modalSymbol.textContent = stock.symbol;
    modalExchange.textContent = stock.exchange || 'NASDAQ';
    modalCompanyName.textContent = stock.companyName;
    modalMongoId.textContent = stock._id;
    modalAddedAt.textContent = formatDate(stock.addedAt);

    // Sample Demonstration Data
    modalDemoPrice.textContent = `$${demoMetrics.price.toFixed(2)}`;
    
    if (demoMetrics.isGain) {
      modalDemoChange.className = 'detail-value font-bold text-green';
      modalDemoChange.textContent = `+${demoMetrics.change.toFixed(2)} (+${demoMetrics.percent.toFixed(2)}%) 🟢`;
    } else {
      modalDemoChange.className = 'detail-value font-bold text-red';
      modalDemoChange.textContent = `${demoMetrics.change.toFixed(2)} (${demoMetrics.percent.toFixed(2)}%) 🔴`;
    }

    // Show modal
    stockDetailsModal.style.display = 'flex';

  } catch (error) {
    console.error('Error opening stock details:', error);
    showToast(error.message, 'error');
  }
}

/**
 * Closes the Stock Details Modal
 */
function closeStockDetailsModal() {
  stockDetailsModal.style.display = 'none';
}

// ==========================================================================
// 5. SEARCH & FILTER LOGIC (CLIENT-SIDE)
// ==========================================================================

/**
 * Filters the saved stocks by symbol or company name
 */
function handleSearch() {
  applyCurrentFilter();
}

/**
 * Clears the search input and restores full watchlist
 */
function clearSearch() {
  searchInput.value = '';
  applyCurrentFilter();
  searchInput.focus();
}

/**
 * Applies search filtering based on the current input value
 */
function applyCurrentFilter() {
  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

  // Show or hide clear button
  if (clearSearchBtn) {
    clearSearchBtn.style.display = searchTerm ? 'inline-block' : 'none';
  }

  if (!searchTerm) {
    renderStocks(watchlistStocks);
    searchResultsCountEl.textContent = `Showing all ${watchlistStocks.length} stocks`;
    return;
  }

  // Filter stocks matching symbol or company name
  const filtered = watchlistStocks.filter(stock => {
    const symbolMatch = stock.symbol.toLowerCase().includes(searchTerm);
    const companyMatch = stock.companyName.toLowerCase().includes(searchTerm);
    return symbolMatch || companyMatch;
  });

  renderStocks(filtered, true);
  searchResultsCountEl.textContent = `Showing ${filtered.length} of ${watchlistStocks.length} stocks`;
}

// ==========================================================================
// 6. SAFE DOM RENDERING
// ==========================================================================

/**
 * Renders the stock rows into the HTML table safely without innerHTML XSS vulnerabilities
 */
function renderStocks(stocksToRender, isFiltering = false) {
  // Clear existing table rows
  watchlistTableBody.innerHTML = '';

  // 1. If watchlist is completely empty from database
  if (watchlistStocks.length === 0) {
    tableContainerEl.style.display = 'none';
    tableEmptyEl.style.display = 'block';
    tableNoSearchMatchEl.style.display = 'none';
    return;
  }

  // 2. If search has no matching results
  if (stocksToRender.length === 0 && isFiltering) {
    tableContainerEl.style.display = 'none';
    tableEmptyEl.style.display = 'none';
    tableNoSearchMatchEl.style.display = 'block';
    return;
  }

  // 3. Otherwise show the table and rows
  tableContainerEl.style.display = 'block';
  tableEmptyEl.style.display = 'none';
  tableNoSearchMatchEl.style.display = 'none';

  stocksToRender.forEach((stock, index) => {
    const tr = document.createElement('tr');

    // # Index Cell
    const tdIndex = document.createElement('td');
    tdIndex.textContent = index + 1;
    tr.appendChild(tdIndex);

    // Stock Symbol Cell
    const tdSymbol = document.createElement('td');
    const symbolBadge = document.createElement('span');
    symbolBadge.className = 'stock-symbol-badge';
    symbolBadge.textContent = stock.symbol;
    tdSymbol.appendChild(symbolBadge);
    tr.appendChild(tdSymbol);

    // Company Name Cell
    const tdCompany = document.createElement('td');
    tdCompany.className = 'stock-company-name';
    tdCompany.textContent = stock.companyName;
    tr.appendChild(tdCompany);

    // Exchange Cell
    const tdExchange = document.createElement('td');
    const exchangeBadge = document.createElement('span');
    exchangeBadge.className = 'stock-exchange-badge';
    exchangeBadge.textContent = stock.exchange || 'NASDAQ';
    tdExchange.appendChild(exchangeBadge);
    tr.appendChild(tdExchange);

    // Trend (Educational Demo Data) Cell
    const tdTrend = document.createElement('td');
    const demoMetrics = generateDeterministicDemoMetrics(stock.symbol);
    const trendPill = document.createElement('span');
    trendPill.className = `table-trend-pill ${demoMetrics.isGain ? 'pill-green' : 'pill-red'}`;
    trendPill.textContent = demoMetrics.isGain 
      ? `🟢 +${demoMetrics.percent.toFixed(2)}%` 
      : `🔴 ${demoMetrics.percent.toFixed(2)}%`;
    trendPill.title = 'Educational Sample Trend Demo';
    tdTrend.appendChild(trendPill);
    tr.appendChild(tdTrend);

    // Date Added Cell
    const tdDate = document.createElement('td');
    tdDate.textContent = formatDate(stock.addedAt);
    tdDate.className = 'text-muted text-sm';
    tr.appendChild(tdDate);

    // Actions Cell
    const tdActions = document.createElement('td');
    tdActions.className = 'table-actions-cell';

    // View Details Button
    const detailsBtn = document.createElement('button');
    detailsBtn.type = 'button';
    detailsBtn.className = 'btn-action details';
    detailsBtn.innerHTML = '<span>ℹ️</span> Details';
    detailsBtn.title = `View details for ${stock.symbol}`;
    detailsBtn.addEventListener('click', () => openStockDetails(stock._id));
    tdActions.appendChild(detailsBtn);

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-action delete';
    deleteBtn.innerHTML = '<span>🗑️</span> Delete';
    deleteBtn.title = `Delete ${stock.symbol} from watchlist`;
    deleteBtn.addEventListener('click', () => openDeleteModal(stock._id, stock.symbol, stock.companyName));
    tdActions.appendChild(deleteBtn);

    tr.appendChild(tdActions);

    // Append completed row
    watchlistTableBody.appendChild(tr);
  });
}

// ==========================================================================
// 7. DASHBOARD METRICS CALCULATION
// ==========================================================================

/**
 * Calculates dashboard metrics from current saved stock data
 */
function updateDashboardMetrics() {
  const total = watchlistStocks.length;
  totalStocksCountEl.textContent = total;

  let gainers = 0;
  let losers = 0;

  watchlistStocks.forEach(stock => {
    const demo = generateDeterministicDemoMetrics(stock.symbol);
    if (demo.isGain) {
      gainers++;
    } else {
      losers++;
    }
  });

  gainingStocksCountEl.textContent = gainers;
  losingStocksCountEl.textContent = losers;
}

/**
 * Generates consistent, deterministic demo price & trend metrics for a stock
 * based on its ticker characters. This ensures the demo data does NOT flicker
 * or change randomly on every page refresh, while demonstrating dynamic financial UI.
 */
function generateDeterministicDemoMetrics(symbol) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash << 5) - hash + symbol.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  // Deterministic price between $45.00 and $380.00
  const price = 45 + (positiveHash % 33500) / 100;

  // Trend determination: even hash = gain (+), odd hash = loss (-)
  const isGain = positiveHash % 2 === 0;

  // Percentage change between 0.35% and 4.85%
  const percentChange = 0.35 + ((positiveHash >> 2) % 450) / 100;
  const changeValue = (price * percentChange) / 100;

  return {
    price: price,
    change: isGain ? changeValue : -changeValue,
    percent: isGain ? percentChange : -percentChange,
    isGain: isGain
  };
}

// ==========================================================================
// 8. UI HELPERS & NOTIFICATIONS
// ==========================================================================

/**
 * Shows floating toast notification
 */
function showToast(message, type = 'info') {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  toast.innerHTML = `<span>${iconMap[type] || '🔔'}</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);

  // Auto-remove after 3.5 seconds
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3500);
}

/**
 * Sets inline form message banner
 */
function setFormMessage(message, type) {
  if (!formMessageEl) return;

  if (!message) {
    formMessageEl.style.display = 'none';
    formMessageEl.className = 'form-message';
    formMessageEl.textContent = '';
    return;
  }

  formMessageEl.className = `form-message ${type}`;
  formMessageEl.textContent = message;
  formMessageEl.style.display = 'block';
}

/**
 * Toggles form submit button loading spinner
 */
function toggleFormSubmitting(isSubmitting) {
  const btnText = submitStockBtn.querySelector('.btn-text');
  const btnSpinner = submitStockBtn.querySelector('.btn-spinner');

  if (isSubmitting) {
    submitStockBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline';
  } else {
    submitStockBtn.disabled = false;
    if (btnText) btnText.style.display = 'inline';
    if (btnSpinner) btnSpinner.style.display = 'none';
  }
}

/**
 * Displays or hides table loading spinner
 */
function showTableLoading(isLoading) {
  if (isLoading) {
    tableLoadingEl.style.display = 'block';
    tableContainerEl.style.display = 'none';
    tableEmptyEl.style.display = 'none';
    tableNoSearchMatchEl.style.display = 'none';
  } else {
    tableLoadingEl.style.display = 'none';
  }
}

/**
 * Formats ISO Date string into friendly human-readable format
 * Example: "Oct 27, 2026, 04:30 PM"
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
}

/**
 * Smooth scrolls page to given section ID
 */
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}
