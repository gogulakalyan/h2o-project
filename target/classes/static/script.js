const apiBase = `${window.location.origin}/api`;
let authMode = "login";
let paymentConfig = { enabled: false, keyId: "" };

function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  btn.classList.add('active');
}

function quickFill(city, location) {
  document.getElementById('city').value = city;
  document.getElementById('location').value = location;
  showToast(`Location set to ${city}, ${location}`);
}

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('h2oUser') || 'null'); }
  catch (e) { return null; }
}

function syncUserToForm() {
  const user = getStoredUser();
  const badge = document.getElementById('userBadge');
  if (!badge) return;
  if (user) {
    badge.textContent = `${user.name || user.email} • ${user.role || 'CUSTOMER'}`;
    const name = document.getElementById('customerName');
    const phone = document.getElementById('customerPhone');
    const email = document.getElementById('customerEmail');
    if (name && !name.value) name.value = user.name || '';
    if (phone && !phone.value) phone.value = user.phone || '';
    if (email && !email.value) email.value = user.email || '';
  } else {
    badge.textContent = 'Guest mode';
  }
}

function openAuthModal(mode) {
  authMode = mode;
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  renderAuthMode();
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('hidden');
}

function toggleAuthMode() {
  authMode = authMode === 'login' ? 'signup' : 'login';
  renderAuthMode();
}

function renderAuthMode() {
  const title = document.getElementById('authTitle');
  const label = document.getElementById('authModeLabel');
  const nameWrap = document.getElementById('signupNameWrap');
  const phone = document.getElementById('authPhone');
  const submit = document.getElementById('authSubmitBtn');
  if (!title) return;
  const isLogin = authMode === 'login';
  title.textContent = isLogin ? 'Login to continue' : 'Create your account';
  label.textContent = isLogin ? 'Welcome back' : 'Get started';
  submit.textContent = isLogin ? 'Login' : 'Sign up';
  if (nameWrap) nameWrap.style.display = isLogin ? 'none' : 'block';
  if (phone) phone.style.display = isLogin ? 'none' : 'block';
}

async function submitAuth() {
  const payload = {
    name: document.getElementById('authFullName')?.value?.trim(),
    email: document.getElementById('authEmail')?.value?.trim(),
    phone: document.getElementById('authPhone')?.value?.trim(),
    password: document.getElementById('authPassword')?.value
  };

  const endpoint = authMode === 'login' ? 'login' : 'signup';
  const response = await fetch(`${apiBase}/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    showToast(await response.text());
    return;
  }

  const data = await response.json();
  localStorage.setItem('h2oUser', JSON.stringify(data));
  syncUserToForm();
  closeAuthModal();
  showToast(endpoint === 'login' ? 'Login successful' : 'Signup successful');
}

function getCommonFields() {
  return {
    customerName: document.getElementById('customerName')?.value.trim(),
    customerPhone: document.getElementById('customerPhone')?.value.trim(),
    customerEmail: document.getElementById('customerEmail')?.value.trim(),
    city: document.getElementById('city')?.value,
    location: document.getElementById('location')?.value.trim(),
    paymentMethod: document.getElementById('paymentMethod')?.value || 'COD'
  };
}

function validateCustomer() {
  const { customerName, customerPhone, customerEmail, location } = getCommonFields();
  if (!customerName || !customerPhone || !customerEmail || !location) {
    showToast('Please enter name, phone, email, and area/pincode.');
    return false;
  }
  return true;
}

async function searchTankers() {
  if (!validateCustomer()) return;
  const { city, location } = getCommonFields();
  const usageType = document.getElementById('usageType').value;
  const res = await fetch(`${apiBase}/catalog/tankers?city=${encodeURIComponent(city)}&location=${encodeURIComponent(location)}&usageType=${usageType}`);
  const data = await res.json();
  const box = document.getElementById('tankerResults');
  box.innerHTML = data.length ? data.map(t => `
    <div class="card product-card">
      <div class="card-top">
        <span class="category-pill">${t.usageType}</span>
        <span class="price-tag">₹${t.price}</span>
      </div>
      <h3>${t.capacityLitres} Litres Tanker</h3>
      <p><strong>Driver:</strong> ${t.driverName} (${t.driverPhone})</p>
      <p><strong>Vehicle:</strong> ${t.vehicleNumber}</p>
      <p><strong>Area:</strong> ${t.area}, ${t.pincode}</p>
      <button class="solid-btn wide" onclick="placeOrder('TANKER', ${t.id}, 1)">Book Now</button>
    </div>
  `).join('') : '<p class="muted">No tanker available for this location.</p>';
}

async function searchProducts(serviceType, targetId) {
  if (!validateCustomer()) return;
  const { city, location } = getCommonFields();
  const res = await fetch(`${apiBase}/catalog/products?city=${encodeURIComponent(city)}&location=${encodeURIComponent(location)}&serviceType=${serviceType}`);
  const data = await res.json();
  const box = document.getElementById(targetId);
  box.innerHTML = data.length ? data.map(p => `
    <div class="card product-card">
      <div class="card-top">
        <span class="category-pill">${p.brand}</span>
        <span class="price-tag">₹${p.price}</span>
      </div>
      <h3>${p.name}</h3>
      <p><strong>Unit:</strong> ${p.unit}</p>
      <p><strong>Stock:</strong> ${p.stock}</p>
      <p><strong>Area:</strong> ${p.area}, ${p.pincode}</p>
      <div class="qty-row">
        <input type="number" min="1" value="1" id="qty-${serviceType}-${p.id}" />
        <button class="solid-btn" onclick="placeOrder('${serviceType}', ${p.id}, document.getElementById('qty-${serviceType}-${p.id}').value)">Order Now</button>
      </div>
    </div>
  `).join('') : '<p class="muted">No products available for this location.</p>';
}

async function placeOrder(serviceType, itemId, quantity) {
  const fields = getCommonFields();
  const payload = {
    customerName: fields.customerName,
    customerPhone: fields.customerPhone,
    customerEmail: fields.customerEmail,
    city: fields.city,
    area: fields.location,
    pincode: /^\d{6}$/.test(fields.location) ? fields.location : '',
    serviceType,
    itemId,
    quantity: Number(quantity),
    paymentMethod: fields.paymentMethod,
    paymentStatus: fields.paymentMethod === 'ONLINE' ? 'INITIATED' : 'PENDING_AT_DELIVERY'
  };

  if (fields.paymentMethod === 'ONLINE') {
    const checkoutReady = await startRazorpayFlow(payload);
    if (!checkoutReady) return;
  }

  const res = await fetch(`${apiBase}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    showToast(await res.text());
    return;
  }

  const data = await res.json();
  localStorage.setItem('lastOrderId', String(data.id));
  document.getElementById('trackOrderId').value = data.id;
  showToast(`Order placed successfully • Order ID ${data.id} • ₹${data.totalPrice}`);
  await trackOrder();
  if (document.getElementById('ordersTable')) {
    loadAnalytics();
    loadAdminOrders();
  }
}

async function trackOrder() {
  const orderId = document.getElementById('trackOrderId')?.value || localStorage.getItem('lastOrderId');
  if (!orderId) {
    showToast('Enter an order ID first.');
    return;
  }
  const res = await fetch(`${apiBase}/orders/${orderId}`);
  const box = document.getElementById('trackingResult');
  if (!res.ok) {
    box.innerHTML = '<p class="muted">Order not found.</p>';
    return;
  }
  const o = await res.json();
  box.innerHTML = `
    <div class="card product-card">
      <div class="card-top">
        <span class="category-pill">${o.orderStatus}</span>
        <span class="price-tag">₹${o.totalPrice}</span>
      </div>
      <h3>Order #${o.id} • ${o.itemName || o.serviceType}</h3>
      <p><strong>Customer:</strong> ${o.customerName} (${o.customerPhone})</p>
      <p><strong>Location:</strong> ${o.area}, ${o.city} ${o.pincode || ''}</p>
      <p><strong>Payment:</strong> ${o.paymentMethod} • ${o.paymentStatus}</p>
      <p><strong>Driver:</strong> ${o.driverName || 'Not assigned yet'} ${o.driverPhone ? '(' + o.driverPhone + ')' : ''}</p>
      <p><strong>Vehicle:</strong> ${o.vehicleNumber || '-'}</p>
    </div>`;
}

async function loadMyOrders() {
  const user = getStoredUser();
  if (!user?.email) {
    showToast('Login first to view your orders.');
    return;
  }
  const res = await fetch(`${apiBase}/orders?email=${encodeURIComponent(user.email)}`);
  const orders = await res.json();
  const box = document.getElementById('trackingResult');
  box.innerHTML = orders.length ? orders.map(o => `
    <div class="card product-card">
      <div class="card-top">
        <span class="category-pill">${o.orderStatus}</span>
        <span class="price-tag">₹${o.totalPrice}</span>
      </div>
      <h3>Order #${o.id} • ${o.itemName || o.serviceType}</h3>
      <p><strong>Payment:</strong> ${o.paymentMethod} • ${o.paymentStatus}</p>
      <p><strong>Driver:</strong> ${o.driverName || 'Not assigned yet'}</p>
    </div>
  `).join('') : '<p class="muted">No orders found.</p>';
}

async function loadPaymentConfig() {
  try {
    const res = await fetch(`${apiBase}/payments/config`);
    paymentConfig = res.ok ? await res.json() : { enabled: false, keyId: '' };
  } catch (e) {
    paymentConfig = { enabled: false, keyId: '' };
  }
}

async function startRazorpayFlow(orderPayload) {
  const prep = await fetch(`${apiBase}/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 0, itemId: orderPayload.itemId, serviceType: orderPayload.serviceType })
  });
  const prepData = await prep.json();

  if (!paymentConfig.enabled || !paymentConfig.keyId || typeof Razorpay === 'undefined') {
    showToast('Razorpay demo hook is ready. Add razorpay.key-id in application.properties for live checkout, or use COD for now.');
    return false;
  }

  const options = {
    key: paymentConfig.keyId,
    amount: prepData.amount || 100,
    currency: 'INR',
    name: 'H2O',
    description: 'Water order',
    handler: function () { showToast('Payment authorized. Saving order...'); },
    prefill: {
      name: orderPayload.customerName,
      email: orderPayload.customerEmail,
      contact: orderPayload.customerPhone
    },
    theme: { color: '#0f766e' }
  };

  new Razorpay(options).open();
  return true;
}

async function loadAnalytics() {
  const box = document.getElementById('analyticsGrid') || document.getElementById('analyticsBox');
  if (!box) return;
  const res = await fetch(`${apiBase}/admin/analytics`);
  const data = await res.json();
  box.innerHTML = `
    <div class="card metric-card"><span>Total Revenue</span><strong>₹${data.totalRevenue}</strong></div>
    <div class="card metric-card"><span>Total Orders</span><strong>${data.totalOrders}</strong></div>
    <div class="card metric-card"><span>Total Tankers</span><strong>${data.totalTankers}</strong></div>
    <div class="card metric-card"><span>Total Products</span><strong>${data.totalProducts}</strong></div>
    <div class="card metric-card"><span>Tanker Orders</span><strong>${data.tankerOrders}</strong></div>
    <div class="card metric-card"><span>Drinking Water</span><strong>${data.drinkingWaterOrders}</strong></div>
    <div class="card metric-card"><span>Soft Drinks</span><strong>${data.softDrinkOrders}</strong></div>
    <div class="card metric-card"><span>Paid Orders</span><strong>${data.paidOrders}</strong></div>
  `;
}

async function updateOrderStatus(orderId, status) {
  const res = await fetch(`${apiBase}/admin/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderStatus: status })
  });
  if (!res.ok) {
    showToast('Could not update status');
    return;
  }
  showToast(`Order ${orderId} updated to ${status}`);
  loadAdminDashboard();
}

async function assignDriver(orderId) {
  const driverName = prompt('Driver name:');
  const driverPhone = prompt('Driver phone:');
  const vehicleNumber = prompt('Vehicle number:');
  if (!driverName || !driverPhone || !vehicleNumber) return;
  const res = await fetch(`${apiBase}/admin/orders/${orderId}/assign-driver`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverName, driverPhone, vehicleNumber })
  });
  if (!res.ok) {
    showToast('Could not assign driver');
    return;
  }
  showToast('Driver assigned');
  loadAdminDashboard();
}

async function loadAdminOrders() {
  const tbody = document.getElementById('ordersTable');
  if (!tbody) return;
  const res = await fetch(`${apiBase}/admin/orders`);
  const orders = await res.json();
  tbody.innerHTML = orders.length ? orders.map(o => `
    <tr>
      <td>#${o.id}</td>
      <td>${o.customerName}<br><span class="muted small">${o.customerPhone}</span></td>
      <td>${o.itemName || '-'}<br><span class="muted small">Qty ${o.quantity || 1}</span></td>
      <td>${o.serviceType}</td>
      <td>₹${o.totalPrice || 0}</td>
      <td>${o.orderStatus}<br><span class="muted small">${o.paymentMethod} • ${o.paymentStatus}</span></td>
      <td>${o.driverName || '-'}<br><span class="muted small">${o.vehicleNumber || '-'}</span></td>
      <td>
        <div class="stack-gap">
          <button class="ghost-btn" onclick="updateOrderStatus(${o.id}, 'CONFIRMED')">Confirm</button>
          <button class="ghost-btn" onclick="updateOrderStatus(${o.id}, 'OUT_FOR_DELIVERY')">Dispatch</button>
          <button class="ghost-btn" onclick="updateOrderStatus(${o.id}, 'DELIVERED')">Delivered</button>
          <button class="solid-btn" onclick="assignDriver(${o.id})">Assign Driver</button>
        </div>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="8">No orders yet</td></tr>';
}

async function addProductFromAdmin() {
  const payload = {
    city: 'Hyderabad',
    area: document.getElementById('adminArea').value.trim(),
    pincode: document.getElementById('adminPincode').value.trim(),
    brand: document.getElementById('adminProductBrand').value.trim(),
    name: document.getElementById('adminProductName').value.trim(),
    unit: 'custom',
    price: Number(document.getElementById('adminPrice').value),
    stock: Number(document.getElementById('adminStock').value),
    available: true,
    serviceType: document.getElementById('adminServiceType').value
  };

  const res = await fetch(`${apiBase}/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    showToast('Could not add product');
    return;
  }

  showToast('Product added');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3200);
}

function loadAdminDashboard() {
  loadAnalytics();
  loadAdminOrders();
}

window.onload = async function () {
  syncUserToForm();
  renderAuthMode();
  await loadPaymentConfig();
  if (document.getElementById('trackOrderId') && localStorage.getItem('lastOrderId')) {
    document.getElementById('trackOrderId').value = localStorage.getItem('lastOrderId');
  }
  if (document.getElementById('analyticsGrid')) loadAnalytics();
  if (document.getElementById('ordersTable')) loadAdminOrders();
};
function showToast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.remove("hidden");

  setTimeout(() => {
    t.classList.add("hidden");
  }, 3000);
}
/* =========================
   MICRO INTERACTIONS / UX
========================= */

// ripple effect for buttons
function enableRippleEffect() {
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("button, .solid-btn, .ghost-btn, .tab");
    if (!btn) return;

    const ripple = document.createElement("span");
    ripple.className = "ripple";

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

    btn.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });
}

// smooth tab transitions
function animateTabSwitch(tabId, btn) {
  const tabs = document.querySelectorAll('.tab-content');
  const buttons = document.querySelectorAll('.tab');

  buttons.forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  tabs.forEach(tab => {
    if (tab.id === tabId) {
      tab.classList.remove('tab-exit');
      tab.classList.add('active', 'tab-enter');
      setTimeout(() => tab.classList.remove('tab-enter'), 450);
    } else if (tab.classList.contains('active')) {
      tab.classList.add('tab-exit');
      setTimeout(() => {
        tab.classList.remove('active', 'tab-exit');
      }, 280);
    } else {
      tab.classList.remove('active', 'tab-enter', 'tab-exit');
    }
  });
}

// replace your existing switchTab with this
function switchTab(tabId, btn) {
  animateTabSwitch(tabId, btn);
}

// better toast animation
function showToast(message, type = "success") {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden', 'toast-out');
  toast.classList.add('toast-in');

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove('toast-in');
    toast.classList.add('toast-out');
    setTimeout(() => toast.classList.add('hidden'), 350);
  }, 2600);
}

// button loading state
function setButtonLoading(button, isLoading, loadingText = "Loading...") {
  if (!button) return;

  if (isLoading) {
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="btn-loader"></span> ${loadingText}`;
    button.classList.add("is-loading");
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || "Continue";
    button.classList.remove("is-loading");
  }
}

// count-up animation for metrics
function animateCountUp(el, target, prefix = "", duration = 1200) {
  if (!el) return;
  const start = 0;
  const startTime = performance.now();

  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.floor(start + (target - start) * easeOutCubic(progress));
    el.textContent = `${prefix}${value}`;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// animate metrics if present
function animateMetricCards() {
  const metricValues = document.querySelectorAll("[data-count]");
  metricValues.forEach(el => {
    const target = parseInt(el.dataset.count || "0", 10);
    const prefix = el.dataset.prefix || "";
    animateCountUp(el, target, prefix);
  });
}

// reveal cards on scroll
function enableRevealOnScroll() {
  const items = document.querySelectorAll(".glass-card, .card, .product-card, .metric-card, .hero-card");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal-visible");
      }
    });
  }, { threshold: 0.12 });

  items.forEach(item => {
    item.classList.add("reveal");
    observer.observe(item);
  });
}

// loading skeleton for search sections
function renderLoadingCards(targetId, count = 3) {
  const box = document.getElementById(targetId);
  if (!box) return;

  box.innerHTML = Array.from({ length: count }).map(() => `
    <div class="product-card skeleton-card">
      <div class="skeleton skeleton-pill"></div>
      <div class="skeleton skeleton-line large"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-btn"></div>
    </div>
  `).join("");
}

// live tracking pulse for status card
function pulseTrackingCard() {
  const trackingCard = document.querySelector(".tracking-live");
  if (!trackingCard) return;
  trackingCard.classList.add("tracking-pulse");
  setTimeout(() => trackingCard.classList.remove("tracking-pulse"), 1400);
}

// fake periodic refresh animation for tracking UI
function enableTrackingHeartbeat() {
  setInterval(() => {
    pulseTrackingCard();
  }, 5000);
}

/* =========================
   SAFE UPDATES TO YOUR EXISTING FUNCTIONS
========================= */

// auth with loading feedback
async function submitAuth() {
  const submitBtn = document.getElementById('authSubmitBtn');

  const payload = {
    name: document.getElementById('authFullName')?.value?.trim(),
    email: document.getElementById('authEmail')?.value?.trim(),
    phone: document.getElementById('authPhone')?.value?.trim(),
    password: document.getElementById('authPassword')?.value
  };

  if (!payload.email || !payload.password || (authMode === 'signup' && (!payload.name || !payload.phone))) {
    showToast('Please fill all required auth fields.', 'error');
    return;
  }

  const endpoint = authMode === 'login' ? 'login' : 'signup';

  try {
    setButtonLoading(submitBtn, true, authMode === 'login' ? 'Signing in...' : 'Creating account...');

    const res = await fetch(`${apiBase}/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Auth error:', error);
      showToast('Authentication failed. Check details.', 'error');
      return;
    }

    const data = await res.json();
    localStorage.setItem('h2oUser', JSON.stringify(data));
    syncUserToForm();
    closeAuthModal();
    showToast(authMode === 'login' ? 'Login successful' : 'Signup successful', 'success');
  } catch (err) {
    console.error('Request failed:', err);
    showToast('Server error. Try again.', 'error');
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// tanker search with loading skeleton
async function searchTankers() {
  if (!validateCustomer()) return;

  const { city, location } = getCommonFields();
  const usageType = document.getElementById('usageType').value;

  renderLoadingCards('tankerResults', 3);

  try {
    const res = await fetch(`${apiBase}/catalog/tankers?city=${encodeURIComponent(city)}&location=${encodeURIComponent(location)}&usageType=${usageType}`);
    const data = await res.json();
    const box = document.getElementById('tankerResults');

    box.innerHTML = data.length ? data.map(t => `
      <div class="card product-card">
        <div class="card-top">
          <span class="category-pill">${t.usageType || usageType}</span>
          <span class="price-tag">₹${t.price}</span>
        </div>
        <h3>${t.capacityLitres || t.capacity || 0} Litres Tanker</h3>
        <p><strong>Driver:</strong> ${t.driverName || '-'} (${t.driverPhone || '-'})</p>
        <p><strong>Vehicle:</strong> ${t.vehicleNumber || '-'}</p>
        <p><strong>Area:</strong> ${t.area || '-'}, ${t.pincode || '-'}</p>
        <button class="solid-btn wide" onclick="placeOrder('TANKER', ${t.id}, 1, this)">Book Now</button>
      </div>
    `).join('') : '<p class="muted">No tanker available for this location.</p>';

    showToast(data.length ? 'Tankers loaded' : 'No tankers found', data.length ? 'success' : 'info');
  } catch (e) {
    console.error(e);
    document.getElementById('tankerResults').innerHTML = '<p class="muted">Failed to load tankers.</p>';
    showToast('Failed to load tankers.', 'error');
  }
}

// products search with loading skeleton
async function searchProducts(serviceType, targetId) {
  if (!validateCustomer()) return;

  const { city, location } = getCommonFields();
  renderLoadingCards(targetId, 3);

  try {
    const res = await fetch(`${apiBase}/catalog/products?city=${encodeURIComponent(city)}&location=${encodeURIComponent(location)}&serviceType=${serviceType}`);
    const data = await res.json();
    const box = document.getElementById(targetId);

    box.innerHTML = data.length ? data.map(p => `
      <div class="card product-card">
        <div class="card-top">
          <span class="category-pill">${p.brand || 'Brand'}</span>
          <span class="price-tag">₹${p.price}</span>
        </div>
        <h3>${p.name}</h3>
        <p><strong>Unit:</strong> ${p.unit || '-'}</p>
        <p><strong>Stock:</strong> ${p.stock || 0}</p>
        <p><strong>Area:</strong> ${p.area || '-'}, ${p.pincode || '-'}</p>
        <div class="qty-row">
          <input type="number" min="1" value="1" id="qty-${serviceType}-${p.id}" />
          <button class="solid-btn" onclick="placeOrder('${serviceType}', ${p.id}, document.getElementById('qty-${serviceType}-${p.id}').value, this)">Order Now</button>
        </div>
      </div>
    `).join('') : '<p class="muted">No products available for this location.</p>';

    showToast(data.length ? 'Products loaded' : 'No products found', data.length ? 'success' : 'info');
  } catch (e) {
    console.error(e);
    document.getElementById(targetId).innerHTML = '<p class="muted">Failed to load products.</p>';
    showToast('Failed to load products.', 'error');
  }
}

// order placement with loading button
async function placeOrder(serviceType, itemId, quantity, buttonRef = null) {
  const fields = getCommonFields();

  const payload = {
    customerName: fields.customerName,
    customerPhone: fields.customerPhone,
    customerEmail: fields.customerEmail,
    city: fields.city,
    area: fields.location,
    pincode: /^\\d{6}$/.test(fields.location) ? fields.location : '',
    serviceType,
    itemId,
    quantity: Number(quantity),
    paymentMethod: fields.paymentMethod,
    paymentStatus: fields.paymentMethod === 'ONLINE' ? 'INITIATED' : 'PENDING_AT_DELIVERY'
  };

  try {
    setButtonLoading(buttonRef, true, 'Placing order...');

    const res = await fetch(`${apiBase}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      showToast('Order failed.', 'error');
      return;
    }

    const data = await res.json();
    showToast(`Order placed successfully • #${data.id}`, 'success');

    const orderIdInput = document.getElementById("trackOrderId");
    if (orderIdInput && data.id) orderIdInput.value = data.id;
  } catch (e) {
    console.error(e);
    showToast('Order failed.', 'error');
  } finally {
    setButtonLoading(buttonRef, false);
  }
}

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  enableRippleEffect();
  enableRevealOnScroll();
  enableTrackingHeartbeat();
  animateMetricCards();
});