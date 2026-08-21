// ============================================
// ADMIN.JS - Mobile First with Live Notifications
// Quick Dukan Admin Panel v2.0
// ============================================

// ===== CONFIGURATION =====
const API_URL = 'https://script.google.com/macros/s/AKfycbyKwpijTqgU6WyaAYSw-1eCTtGuHu5WpikbuXrqQV1XwxSGx5hcHf4i3BDo7kCabxOR/exec';

// ===== STATE =====
let state = {
    orders: [],
    users: [],
    deliveryBoys: [],
    payments: [],
    products: [],
    notifications: [],
    settings: {},
    currentPage: 1,
    pageSize: 10,
    soundEnabled: true,
    isRefreshing: false,
    notifiedOrders: {},
    notifiedDeliveryBoys: {},
    maxNotifShow: 2,
    orderCount: 0,
    pendingCount: 0,
    deliveryCount: 0
};

// ===== DOM REFS =====
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛒 Quick Dukan Admin v2.0 (Mobile First)');
    
    // Load saved preferences
    const savedSound = localStorage.getItem('adminSound');
    if (savedSound === 'off') {
        state.soundEnabled = false;
        updateSoundIcon();
    }
    
    // Start auto-refresh every 5 seconds
    setInterval(() => {
        if (!state.isRefreshing) {
            refreshAll();
        }
    }, 5000);
    
    // Initial load
    refreshAll();
    
    console.log('✅ Admin Ready | Auto-Refresh: 5s');
});

// ===== SOUND SYSTEM =====
function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    localStorage.setItem('adminSound', state.soundEnabled ? 'on' : 'off');
    updateSoundIcon();
}

function updateSoundIcon() {
    const icon = document.querySelector('#soundBtn i');
    if (icon) {
        icon.className = state.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    }
}

function playNotificationSound() {
    if (!state.soundEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
}

// ===== TAB SWITCHING =====
function switchTab(tab) {
    // Update bottom nav
    $$('.bottom-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tab);
    });
    
    // Update content
    $$('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const target = $(tab + 'Tab');
    if (target) target.classList.add('active');
    
    // Close more menu
    $('moreMenu').classList.remove('open');
    
    // Load data
    switch(tab) {
        case 'dashboard': loadDashboard(); break;
        case 'orders': loadOrders(); break;
        case 'deliveryBoys': loadDeliveryBoys(); break;
        case 'users': loadUsers(); break;
        case 'payments': loadPayments(); break;
        case 'products': loadProducts(); break;
        case 'reports': loadReports(); break;
        case 'notifications': loadNotifications(); break;
        case 'settings': loadSettings(); break;
        case 'support': loadSupportTickets(); break;
        case 'emergency': loadEmergencyAlerts(); break;
    }
}

function toggleMoreMenu() {
    $('moreMenu').classList.toggle('open');
}

// ===== TOAST =====
function showToast(msg, type = 'success') {
    const toast = $('toast');
    toast.textContent = msg;
    toast.className = 'toast show ' + type;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== LIVE NOTIFICATION =====
function showLiveNotification(icon, title, message, type = 'order') {
    const notif = $('liveNotification');
    $('notifIcon').textContent = icon;
    $('notifTitleText').textContent = title;
    $('notifMessageText').innerHTML = message;
    notif.className = 'live-notification show';
    notif.style.borderLeftColor = type === 'order' ? '#FF6B00' : 
                                   type === 'delivery' ? '#9C27B0' : 
                                   type === 'sos' ? '#f44336' : '#2196F3';
    
    playNotificationSound();
    
    // Update floating badge
    updateFloatingBadge();
    
    clearTimeout(notif._timer);
    notif._timer = setTimeout(() => {
        notif.classList.remove('show');
    }, 8000);
}

function closeLiveNotif() {
    $('liveNotification').classList.remove('show');
}

// ===== FLOATING BADGE =====
function updateFloatingBadge() {
    const badge = $('notifBadgeFloat');
    const total = state.pendingCount + state.deliveryCount;
    if (total > 0) {
        badge.textContent = '🔔 ' + total;
        badge.classList.add('show');
    } else {
        badge.classList.remove('show');
    }
}

// ===== REFRESH ALL =====
async function refreshAll() {
    if (state.isRefreshing) return;
    state.isRefreshing = true;
    
    const icon = document.querySelector('#refreshIcon');
    if (icon) icon.classList.add('fa-spin');
    
    try {
        await Promise.all([
            loadDashboard(),
            loadOrders(),
            loadDeliveryBoys(),
            loadUsers(),
            loadPayments(),
            loadProducts(),
            loadNotifications()
        ]);
    } catch(e) {
        console.error('Refresh error:', e);
    }
    
    state.isRefreshing = false;
    if (icon) icon.classList.remove('fa-spin');
}

// ===== DASHBOARD =====
async function loadDashboard() {
    try {
        const res = await fetch(`${API_URL}?action=getAdminDashboard`);
        const data = await res.json();
        
        if (data.success) {
            $('mTotalOrders').textContent = data.orders?.total || 0;
            $('mPendingOrders').textContent = data.orders?.pending || 0;
            $('mDeliveredOrders').textContent = data.orders?.delivered || 0;
            $('mRevenue').textContent = '₹' + (data.revenue?.totalRevenue || 0).toFixed(0);
            $('mTotalUsers').textContent = data.users?.total || 0;
            $('mDeliveryBoys').textContent = data.orders?.confirmed || 0;
            
            // Update badges
            $('navOrdersBadge').textContent = data.orders?.total || 0;
            $('navDeliveryBadge').textContent = data.orders?.confirmed || 0;
            $('navUsersBadge').textContent = data.users?.total || 0;
            
            // Show/hide badges
            document.querySelectorAll('.nav-badge').forEach(b => {
                b.classList.toggle('show', parseInt(b.textContent) > 0);
            });
        }
    } catch(e) {
        console.error('Dashboard error:', e);
    }
}

// ===== ORDERS =====
async function loadOrders() {
    try {
        const res = await fetch(`${API_URL}?action=getOrders`);
        const data = await res.json();
        
        if (data.success && data.orders) {
            state.orders = data.orders;
            state.orderCount = data.orders.length;
            state.pendingCount = data.orders.filter(o => (o[13] || '') === 'Pending').length;
            
            // Check for new orders
            checkNewOrders(data.orders);
            
            displayOrders(data.orders);
            $('ordersCountBadge').textContent = data.orders.length;
        }
    } catch(e) {
        console.error('Orders error:', e);
    }
}

function checkNewOrders(orders) {
    const pending = orders.filter(o => (o[13] || '') === 'Pending');
    
    pending.forEach(order => {
        const id = order[0];
        if (!state.notifiedOrders[id]) {
            state.notifiedOrders[id] = 0;
        }
        if (state.notifiedOrders[id] < state.maxNotifShow) {
            state.notifiedOrders[id]++;
            showLiveNotification(
                '📦',
                'New Order!',
                `<strong>${order[1] || 'Unknown'}</strong> | ₹${order[8] || '0'}<br><small>${order[0]}</small>`,
                'order'
            );
        }
    });
}

function displayOrders(orders) {
    const container = $('ordersList');
    const search = ($('orderSearch')?.value || '').toLowerCase();
    const statusFilter = $('orderStatusFilter')?.value || '';
    
    let filtered = orders;
    if (search) {
        filtered = filtered.filter(o => 
            (o[0] || '').toLowerCase().includes(search) ||
            (o[1] || '').toLowerCase().includes(search) ||
            (o[2] || '').includes(search)
        );
    }
    if (statusFilter) {
        filtered = filtered.filter(o => (o[13] || '') === statusFilter);
    }
    
    // Show latest first
    filtered = filtered.slice(-20).reverse();
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="loading-item">📭 No orders found</div>`;
        return;
    }
    
    container.innerHTML = filtered.map(order => `
        <div class="order-item" style="${(order[13] || '') === 'Pending' ? 'border-left:3px solid #FF6B00;' : ''}">
            <div class="order-info">
                <div class="order-id">${order[0] || 'N/A'}</div>
                <div class="order-name">${order[1] || 'Unknown'}</div>
                <div class="order-detail">₹${order[8] || '0'} · ${order[2] || ''}</div>
                <span class="badge-mobile badge-${(order[13] || 'pending').toLowerCase()}">${order[13] || 'Pending'}</span>
            </div>
            <div class="order-actions">
                ${(order[13] || '') === 'Pending' ? `
                    <button class="action-btn-mobile" style="background:#4CAF50;color:white;" onclick="updateOrderStatus('${order[0]}','Confirmed')">✅</button>
                    <button class="action-btn-mobile" style="background:#f44336;color:white;" onclick="updateOrderStatus('${order[0]}','Cancelled')">❌</button>
                ` : ''}
                ${(order[13] || '') === 'Confirmed' ? `
                    <button class="action-btn-mobile" style="background:#2196F3;color:white;" onclick="updateOrderStatus('${order[0]}','Delivered')">🚚</button>
                    <button class="action-btn-mobile" style="background:#FF9800;color:white;" onclick="openAssignModal('${order[0]}')">🛵</button>
                ` : ''}
                <button class="action-btn-mobile" style="background:#25D366;color:white;" onclick="whatsappCustomer('${order[2]}')">💬</button>
                ${order[10] && order[11] ? `
                    <button class="action-btn-mobile" style="background:#9C27B0;color:white;" onclick="openMap('${order[10]}','${order[11]}')">📍</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function updateOrderStatus(orderId, status) {
    try {
        const res = await fetch(`${API_URL}?action=updateStatus&orderId=${orderId}&status=${status}`);
        const data = await res.json();
        if (data.success) {
            showToast(`✅ Order ${orderId} ${status}`);
            playNotificationSound();
            loadOrders();
            loadDashboard();
        } else {
            showToast(data.message || 'Failed', 'error');
        }
    } catch(e) {
        showToast('Update failed', 'error');
    }
}

function searchOrders(query) { loadOrders(); }
function filterOrdersByStatus(status) { loadOrders(); }
function loadMoreOrders() { /* Load more */ }

// ===== DELIVERY BOYS =====
async function loadDeliveryBoys() {
    try {
        const [reqRes, statsRes] = await Promise.all([
            fetch(`${API_URL}?action=getDeliveryBoyRequests`),
            fetch(`${API_URL}?action=getDeliveryBoyStats`)
        ]);
        
        const reqData = await reqRes.json();
        const statsData = await statsRes.json();
        
        if (reqData.success && reqData.requests) {
            const pending = reqData.requests.filter(r => r[2] === 'Pending Approval');
            state.deliveryCount = pending.length;
            
            // Check new delivery requests
            pending.forEach(req => {
                const phone = req[0];
                if (!state.notifiedDeliveryBoys[phone]) {
                    state.notifiedDeliveryBoys[phone] = 0;
                }
                if (state.notifiedDeliveryBoys[phone] < state.maxNotifShow) {
                    state.notifiedDeliveryBoys[phone]++;
                    showLiveNotification(
                        '🛵',
                        'New Delivery Boy Request!',
                        `<strong>${phone}</strong> wants to join<br><small>Tap to approve</small>`,
                        'delivery'
                    );
                }
            });
            
            displayDeliveryRequests(reqData.requests);
            $('pendingReqBadge').textContent = pending.length;
        }
        
        if (statsData.success && statsData.stats) {
            displayDeliveryBoys(statsData.stats);
            $('activeBoysBadge').textContent = statsData.stats.length;
        }
    } catch(e) {
        console.error('Delivery boys error:', e);
    }
}

function displayDeliveryRequests(requests) {
    const container = $('deliveryRequests');
    const pending = requests.filter(r => r[2] === 'Pending Approval');
    
    if (pending.length === 0) {
        container.innerHTML = `<div class="loading-item">✅ No pending requests</div>`;
        return;
    }
    
    container.innerHTML = pending.map(req => `
        <div class="delivery-request">
            <div class="req-info">
                <div class="req-phone">📱 ${req[0] || 'N/A'}</div>
                <div class="req-time">${req[3] || ''}</div>
            </div>
            <div class="req-actions">
                <input type="text" id="dName_${req[0]}" placeholder="Name" style="width:60px;padding:4px 6px;border:1px solid #ddd;border-radius:6px;font-size:11px;">
                <button class="action-btn-mobile" style="background:#4CAF50;color:white;" onclick="approveDeliveryBoy('${req[0]}')">✅</button>
                <button class="action-btn-mobile" style="background:#f44336;color:white;" onclick="rejectDeliveryBoy('${req[0]}')">❌</button>
            </div>
        </div>
    `).join('');
}

function displayDeliveryBoys(stats) {
    const container = $('deliveryBoysList');
    
    if (!stats || stats.length === 0) {
        container.innerHTML = `<div class="loading-item">No active boys</div>`;
        return;
    }
    
    container.innerHTML = stats.map(boy => `
        <div class="delivery-item">
            <div class="order-info">
                <div class="order-id">${boy[0] || 'N/A'}</div>
                <div class="order-name">${boy[1] || 'Unknown'}</div>
                <div class="order-detail">Deliveries: ${boy[6] || '0'} · ₹${boy[7] || '0'}</div>
                <span class="badge-mobile ${boy[5] === 'Yes' ? 'badge-online' : 'badge-offline'}">${boy[5] === 'Yes' ? '🟢 Online' : '⚪ Offline'}</span>
            </div>
            <div class="order-actions">
                ${boy[2] === 'Blocked' ? 
                    `<button class="action-btn-mobile" style="background:#4CAF50;color:white;" onclick="unblockDeliveryBoy('${boy[0]}')">✅</button>` :
                    `<button class="action-btn-mobile" style="background:#f44336;color:white;" onclick="blockDeliveryBoy('${boy[0]}')">🚫</button>`
                }
            </div>
        </div>
    `).join('');
}

async function approveDeliveryBoy(phone) {
    const name = $(`dName_${phone}`)?.value || 'Delivery Boy';
    try {
        const res = await fetch(`${API_URL}?action=approveDeliveryBoy&phone=${phone}&name=${encodeURIComponent(name)}`);
        const data = await res.json();
        if (data.success) {
            showToast(`✅ Approved! Code: ${data.loginCode || 'N/A'}`);
            loadDeliveryBoys();
        }
    } catch(e) {
        showToast('Approval failed', 'error');
    }
}

async function rejectDeliveryBoy(phone) {
    try {
        const res = await fetch(`${API_URL}?action=rejectDeliveryBoy&phone=${phone}`);
        const data = await res.json();
        if (data.success) {
            showToast(`❌ Rejected`);
            loadDeliveryBoys();
        }
    } catch(e) {
        showToast('Rejection failed', 'error');
    }
}

async function blockDeliveryBoy(phone) {
    if (!confirm(`Block ${phone}?`)) return;
    try {
        const res = await fetch(`${API_URL}?action=blockDeliveryBoy&phone=${phone}`);
        const data = await res.json();
        if (data.success) {
            showToast(`🚫 Blocked`);
            loadDeliveryBoys();
        }
    } catch(e) {
        showToast('Block failed', 'error');
    }
}

async function unblockDeliveryBoy(phone) {
    try {
        const res = await fetch(`${API_URL}?action=unblockDeliveryBoy&phone=${phone}`);
        const data = await res.json();
        if (data.success) {
            showToast(`✅ Unblocked`);
            loadDeliveryBoys();
        }
    } catch(e) {
        showToast('Unblock failed', 'error');
    }
}

// ===== USERS =====
async function loadUsers() {
    try {
        const res = await fetch(`${API_URL}?action=adminGetAllUsers`);
        const data = await res.json();
        if (data.success && data.users) {
            state.users = data.users;
            displayUsers(data.users);
            $('usersCountBadge').textContent = data.users.length;
        }
    } catch(e) {
        console.error('Users error:', e);
    }
}

function displayUsers(users) {
    const container = $('usersList');
    const search = ($('userSearch')?.value || '').toLowerCase();
    const statusFilter = $('userStatusFilter')?.value || '';
    
    let filtered = users;
    if (search) {
        filtered = filtered.filter(u => 
            (u[0] || '').includes(search) ||
            (u[1] || '').toLowerCase().includes(search)
        );
    }
    if (statusFilter) {
        filtered = filtered.filter(u => (u[3] || '') === statusFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="loading-item">👤 No users found</div>`;
        return;
    }
    
    container.innerHTML = filtered.map(user => `
        <div class="user-item">
            <div class="user-info">
                <div class="order-id">${user[0] || 'N/A'}</div>
                <div class="order-name">${user[1] || 'Unknown'}</div>
                <div class="order-detail">Orders: ${user[4] || '0'} · ${user[3] || 'Active'}</div>
                <span class="badge-mobile badge-${(user[3] || 'active').toLowerCase()}">${user[3] || 'Active'}</span>
            </div>
            <div class="order-actions">
                ${(user[3] || '') === 'Blocked' ? 
                    `<button class="action-btn-mobile" style="background:#4CAF50;color:white;" onclick="unblockUser('${user[0]}')">✅</button>` :
                    `<button class="action-btn-mobile" style="background:#f44336;color:white;" onclick="openBlockUserModal('${user[0]}')">🚫</button>`
                }
            </div>
        </div>
    `).join('');
}

function searchUsers(query) { loadUsers(); }
function filterUsersByStatus(status) { loadUsers(); }

function openBlockUserModal(phone) {
    state.currentUserPhone = phone;
    $('blockUserPhone').textContent = phone;
    $('blockReasonInput').value = '';
    openModal('blockUserModal');
}

async function confirmBlockUser() {
    const reason = $('blockReasonInput')?.value || 'No reason';
    try {
        const res = await fetch(`${API_URL}?action=blockUser&phone=${state.currentUserPhone}&reason=${encodeURIComponent(reason)}`);
        const data = await res.json();
        if (data.success) {
            showToast(`🚫 User blocked`);
            closeModal('blockUserModal');
            loadUsers();
        }
    } catch(e) {
        showToast('Block failed', 'error');
    }
}

async function unblockUser(phone) {
    if (!confirm(`Unblock ${phone}?`)) return;
    try {
        const res = await fetch(`${API_URL}?action=unblockUser&phone=${phone}`);
        const data = await res.json();
        if (data.success) {
            showToast(`✅ Unblocked`);
            loadUsers();
        }
    } catch(e) {
        showToast('Unblock failed', 'error');
    }
}

// ===== PAYMENTS =====
async function loadPayments() {
    try {
        const res = await fetch(`${API_URL}?action=getPayments`);
        const data = await res.json();
        if (data.success && data.payments) {
            state.payments = data.payments;
            displayPayments(data.payments);
            $('paymentsCountBadge').textContent = data.payments.length;
        }
    } catch(e) {
        console.error('Payments error:', e);
    }
}

function displayPayments(payments) {
    const container = $('paymentsList');
    const search = ($('paymentSearch')?.value || '').toLowerCase();
    const statusFilter = $('paymentStatusFilter')?.value || '';
    
    let filtered = payments;
    if (search) {
        filtered = filtered.filter(p => 
            (p[0] || '').toLowerCase().includes(search) ||
            (p[1] || '').includes(search)
        );
    }
    if (statusFilter) {
        filtered = filtered.filter(p => (p[4] || '') === statusFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="loading-item">💰 No payments found</div>`;
        return;
    }
    
    container.innerHTML = filtered.slice(-20).reverse().map(p => `
        <div class="payment-item">
            <div class="order-info">
                <div class="order-id">${p[0] || 'N/A'}</div>
                <div class="order-name">₹${p[2] || '0'} · ${p[3] || 'Cash'}</div>
                <div class="order-detail">${p[1] || ''}</div>
                <span class="badge-mobile badge-${(p[4] || 'pending').toLowerCase()}">${p[4] || 'Pending'}</span>
            </div>
            <div class="order-actions">
                ${(p[4] || '') === 'Pending' ? `
                    <button class="action-btn-mobile" style="background:#4CAF50;color:white;" onclick="verifyPayment('${p[0]}')">✅</button>
                ` : ''}
                ${(p[4] || '') === 'Verified' ? `
                    <button class="action-btn-mobile" style="background:#FF9800;color:white;" onclick="refundPayment('${p[0]}')">↩️</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function searchPayments(query) { loadPayments(); }
function filterPaymentsByStatus(status) { loadPayments(); }

async function verifyPayment(orderId) {
    try {
        const res = await fetch(`${API_URL}?action=updatePaymentStatus&orderId=${orderId}&status=Verified`);
        const data = await res.json();
        if (data.success) {
            showToast(`✅ Payment verified`);
            loadPayments();
        }
    } catch(e) {
        showToast('Verification failed', 'error');
    }
}

async function refundPayment(orderId) {
    if (!confirm(`Refund ${orderId}?`)) return;
    try {
        const res = await fetch(`${API_URL}?action=refundPayment&paymentId=${orderId}`);
        const data = await res.json();
        if (data.success) {
            showToast(`↩️ Refunded`);
            loadPayments();
        }
    } catch(e) {
        showToast('Refund failed', 'error');
    }
}

// ===== PRODUCTS =====
async function loadProducts() {
    try {
        const res = await fetch(`${API_URL}?action=getProducts`);
        const data = await res.json();
        if (data.success && data.products) {
            state.products = data.products;
            displayProducts(data.products);
        }
    } catch(e) {
        console.error('Products error:', e);
    }
}

function displayProducts(products) {
    const container = $('productsList');
    const search = ($('productSearch')?.value || '').toLowerCase();
    
    let filtered = products;
    if (search) {
        filtered = filtered.filter(p => 
            (p[1] || '').toLowerCase().includes(search) ||
            (p[0] || '').toLowerCase().includes(search)
        );
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="loading-item">📦 No products found</div>`;
        return;
    }
    
    container.innerHTML = filtered.map(p => `
        <div class="product-item">
            <div class="order-info">
                <div class="order-id">${p[0] || 'N/A'}</div>
                <div class="order-name">${p[1] || 'Unknown'}</div>
                <div class="order-detail">₹${p[2] || '0'} · Stock: ${p[3] || '0'}</div>
                ${parseInt(p[3] || '0') < 5 ? '<span style="color:#f44336;font-weight:700;">⚠️ Low Stock</span>' : ''}
            </div>
            <div class="order-actions">
                <button class="action-btn-mobile" style="background:#2196F3;color:white;" onclick="editProduct('${p[0]}')">✏️</button>
                <button class="action-btn-mobile" style="background:#f44336;color:white;" onclick="deleteProduct('${p[0]}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

function searchProducts(query) { loadProducts(); }

function showAddProductModal() {
    $('productIdInput').value = 'PROD' + Date.now().toString().slice(-6);
    $('productNameInput').value = '';
    $('productPriceInput').value = '';
    $('productStockInput').value = '';
    $('productCategoryInput').value = '';
    openModal('addProductModal');
}

async function confirmAddProduct() {
    const id = $('productIdInput').value;
    const name = $('productNameInput').value;
    const price = $('productPriceInput').value;
    const stock = $('productStockInput').value;
    const category = $('productCategoryInput').value;
    
    if (!id || !name || !price) {
        showToast('Please fill required fields', 'warning');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}?action=adminAddProduct&productId=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}&price=${price}&stock=${stock}&category=${encodeURIComponent(category)}&image=`);
        const data = await res.json();
        if (data.success) {
            showToast(`✅ Product added`);
            closeModal('addProductModal');
            loadProducts();
        }
    } catch(e) {
        showToast('Add failed', 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm(`Delete ${productId}?`)) return;
    try {
        const res = await fetch(`${API_URL}?action=adminDeleteProduct&productId=${productId}`);
        const data = await res.json();
        if (data.success) {
            showToast(`🗑️ Deleted`);
            loadProducts();
        }
    } catch(e) {
        showToast('Delete failed', 'error');
    }
}

function editProduct(productId) {
    const product = state.products.find(p => p[0] === productId);
    if (!product) return;
    // Simple edit - show prompt
    const newName = prompt('Product Name:', product[1] || '');
    if (newName) {
        const newPrice = prompt('Price:', product[2] || '0');
        const newStock = prompt('Stock:', product[3] || '0');
        updateProduct(productId, newName, newPrice, newStock);
    }
}

async function updateProduct(productId, name, price, stock) {
    try {
        const res = await fetch(`${API_URL}?action=adminUpdateProduct&productId=${encodeURIComponent(productId)}&name=${encodeURIComponent(name)}&price=${price}&stock=${stock}&category=&image=`);
        const data = await res.json();
        if (data.success) {
            showToast(`✅ Updated`);
            loadProducts();
        }
    } catch(e) {
        showToast('Update failed', 'error');
    }
}

// ===== REPORTS =====
async function loadReports() {
    try {
        const res = await fetch(`${API_URL}?action=getRevenueStats`);
        const data = await res.json();
        if (data.success) {
            displayReports(data);
        }
    } catch(e) {
        console.error('Reports error:', e);
    }
}

function displayReports(data) {
    const container = $('reportContent');
    container.innerHTML = `
        <div class="report-content-item"><span>Total Orders</span><strong>${data.totalOrders || 0}</strong></div>
        <div class="report-content-item"><span>Total Revenue</span><strong>₹${data.totalRevenue || 0}</strong></div>
        <div class="report-content-item"><span>Delivered</span><strong>${data.deliveredOrders || 0}</strong></div>
        <div class="report-content-item"><span>Pending</span><strong>${data.pendingOrders || 0}</strong></div>
        <div class="report-content-item"><span>Cancelled</span><strong>${data.cancelledOrders || 0}</strong></div>
    `;
}

function generateReport(type) {
    showToast(`📊 Generating ${type} report...`);
    loadReports();
}

// ===== NOTIFICATIONS =====
async function loadNotifications() {
    try {
        const res = await fetch(`${API_URL}?action=getAdminNotifications`);
        const data = await res.json();
        if (data.success && data.notifications) {
            displayNotifications(data.notifications);
        }
    } catch(e) {
        console.error('Notifications error:', e);
    }
}

function displayNotifications(notifications) {
    const container = $('notifHistory');
    if (!notifications || notifications.length === 0) {
        container.innerHTML = `<div class="loading-item">🔕 No notifications</div>`;
        return;
    }
    
    container.innerHTML = notifications.slice(0, 20).map(n => `
        <div class="report-content-item">
            <span><strong>${n[2] || ''}</strong><br><small>${n[3] || ''}</small></span>
            <span style="font-size:11px;color:var(--text-muted);">${n[5] || ''}</span>
        </div>
    `).join('');
}

async function sendBroadcast() {
    const title = $('notifTitle').value;
    const message = $('notifMessage').value;
    
    if (!title || !message) {
        showToast('Please fill both fields', 'warning');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}?action=sendBroadcastNotification&title=${encodeURIComponent(title)}&message=${encodeURIComponent(message)}`);
        const data = await res.json();
        if (data.success) {
            showToast(`📢 Broadcast sent!`);
            $('notifTitle').value = '';
            $('notifMessage').value = '';
            loadNotifications();
        }
    } catch(e) {
        showToast('Broadcast failed', 'error');
    }
}

// ===== SETTINGS =====
async function loadSettings() {
    try {
        const res = await fetch(`${API_URL}?action=getAllSettings`);
        const data = await res.json();
        if (data.success && data.settings) {
            state.settings = data.settings;
            applySettings(data.settings);
        }
    } catch(e) {
        console.error('Settings error:', e);
    }
}

function applySettings(settings) {
    if (settings['Show Call Button']) $('settingShowCall').value = settings['Show Call Button'];
    if (settings['Online Charge ON']) $('settingOnlineCharge').value = settings['Online Charge ON'];
    if (settings['Charge Min']) $('settingChargeMin').value = settings['Charge Min'];
    if (settings['Charge Max']) $('settingChargeMax').value = settings['Charge Max'];
}

async function updateSetting(setting, value) {
    try {
        const res = await fetch(`${API_URL}?action=updateSetting&setting=${encodeURIComponent(setting)}&value=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (data.success) {
            showToast(`✅ Setting updated`);
        }
    } catch(e) {
        showToast('Update failed', 'error');
    }
}

function clearAllData() {
    if (!confirm('⚠️ Delete ALL data? This cannot be undone!')) return;
    showToast('🗑️ Clearing data...', 'warning');
}

// ===== SUPPORT =====
async function loadSupportTickets() {
    try {
        const res = await fetch(`${API_URL}?action=getAllUserFeedback`);
        const data = await res.json();
        if (data.success && data.feedback) {
            displaySupportTickets(data.feedback);
            $('supportBadge').textContent = data.feedback.length;
        }
    } catch(e) {
        console.error('Support error:', e);
    }
}

function displaySupportTickets(tickets) {
    const container = $('supportList');
    if (!tickets || tickets.length === 0) {
        container.innerHTML = `<div class="loading-item">🎫 No tickets</div>`;
        return;
    }
    
    container.innerHTML = tickets.slice(-20).reverse().map(t => `
        <div class="report-content-item">
            <span><strong>${t[0] || 'N/A'}</strong><br><small>${t[2] || ''}: ${t[3] || ''}</small></span>
            <span style="font-size:11px;">
                <span class="badge-mobile badge-pending">Open</span>
                <button class="action-btn-mobile" style="background:#4CAF50;color:white;" onclick="showToast('✅ Ticket resolved')">✅</button>
            </span>
        </div>
    `).join('');
}

// ===== EMERGENCY =====
async function loadEmergencyAlerts() {
    try {
        const res = await fetch(`${API_URL}?action=getActiveDeliveries`);
        const data = await res.json();
        if (data.success) {
            $('eActiveDeliveries').textContent = data.deliveries?.length || 0;
            displayEmergencyAlerts(data.deliveries || []);
        }
    } catch(e) {
        console.error('Emergency error:', e);
    }
}

function displayEmergencyAlerts(alerts) {
    const container = $('emergencyList');
    if (!alerts || alerts.length === 0) {
        container.innerHTML = `<div class="loading-item">✅ No active alerts</div>`;
        return;
    }
    
    container.innerHTML = alerts.map(alert => `
        <div class="emergency-item">
            <div>
                <strong>${alert[0] || 'N/A'}</strong>
                <div style="font-size:11px;color:var(--text-muted);">${alert[3] || ''}</div>
            </div>
            <button class="action-btn-mobile" style="background:#f44336;color:white;" onclick="callCustomer('${alert[0]}')">📞</button>
        </div>
    `).join('');
}

// ===== MODAL HELPERS =====
function openModal(id) {
    const modal = $(id);
    if (modal) modal.classList.add('show');
}

function closeModal(id) {
    const modal = $(id);
    if (modal) modal.classList.remove('show');
}

// Close modal on overlay click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('show');
    }
});

// ===== ASSIGN DELIVERY BOY =====
function openAssignModal(orderId) {
    state.currentOrderId = orderId;
    $('assignOrderId').textContent = orderId;
    const select = $('deliveryBoySelect');
    select.innerHTML = '<option value="">-- Select --</option>';
    
    fetch(`${API_URL}?action=getDeliveryBoyStats`)
        .then(r => r.json())
        .then(data => {
            if (data.success && data.stats) {
                data.stats.forEach(boy => {
                    const opt = document.createElement('option');
                    opt.value = boy[0];
                    opt.textContent = `${boy[1] || 'Unknown'} (${boy[0]})`;
                    select.appendChild(opt);
                });
            }
        });
    openModal('assignModal');
}

async function confirmAssign() {
    const phone = $('deliveryBoySelect').value;
    if (!phone) {
        showToast('Select a delivery boy', 'warning');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}?action=assignDeliveryBoyToOrder&orderId=${state.currentOrderId}&deliveryBoyPhone=${phone}`);
        const data = await res.json();
        if (data.success) {
            showToast(`🛵 Assigned!`);
            closeModal('assignModal');
            loadOrders();
        }
    } catch(e) {
        showToast('Assignment failed', 'error');
    }
}

// ===== CUSTOMER FUNCTIONS =====
function callCustomer(phone) {
    if (phone) window.open(`tel:${phone}`);
}

function whatsappCustomer(phone) {
    if (phone) window.open(`https://wa.me/${phone.replace(/\D/g, '')}`);
}

function openMap(lat, lng) {
    if (lat && lng) window.open(`https://www.google.com/maps?q=${lat},${lng}`);
}

// ===== LOGOUT =====
function adminLogout() {
    if (confirm('Logout?')) {
        localStorage.clear();
        window.location.reload();
    }
}

// ===== CLOSE MODALS ON BACK =====
window.addEventListener('popstate', function() {
    $$('.modal-overlay.show').forEach(m => m.classList.remove('show'));
    $('moreMenu').classList.remove('open');
});

console.log('✅ Admin Panel v2.0 (Mobile First) Loaded');
console.log('🔔 Live Notifications: Enabled');
console.log('🔄 Auto-Refresh: 5 seconds');
console.log('📱 Mobile Optimized: Yes');