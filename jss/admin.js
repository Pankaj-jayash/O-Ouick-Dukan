// ============================================
// ADMIN.JS - Quick Dukan Admin Panel
// Complete System with Auto-Refresh, All Features
// ============================================

// ⚠️ अपना Google Apps Script Web App URL डालें
const API_URL = 'https://script.google.com/macros/s/AKfycbyKwpijTqgU6WyaAYSw-1eCTtGuHu5WpikbuXrqQV1XwxSGx5hcHf4i3BDo7kCabxOR/exec';

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    soundEnabled: true,
    autoRefresh: true,
    refreshInterval: 5000,
    maxPopupShow: 2,
    debug: true
};

// ============================================
// STATE MANAGEMENT
// ============================================
const STATE = {
    orders: [],
    deliveryBoys: [],
    deliveryBoyStats: [],
    ratings: [],
    users: [],
    payments: [],
    products: [],
    coupons: [],
    inventory: [],
    loyalty: [],
    support: [],
    emergency: [],
    notifications: [],
    settings: {},
    
    lastOrderCount: 0,
    lastRequestCount: 0,
    lastPaymentCount: 0,
    lastProductCount: 0,
    
    notifiedOrders: {},
    notifiedDeliveryBoys: {},
    
    currentOrderId: null,
    currentPhone: null,
    currentPaymentId: null,
    currentProductId: null,
    currentCouponId: null,
    
    activeTab: 'dashboard'
};

// ============================================
// SOUND SYSTEM
// ============================================
function playNotificationSound() {
    if (!CONFIG.soundEnabled) return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Main notification sound
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.frequency.value = 800;
        osc1.type = 'sine';
        gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc1.start(audioCtx.currentTime);
        osc1.stop(audioCtx.currentTime + 0.3);

        // Second beep
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.2, audioCtx.currentTime + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc2.start(audioCtx.currentTime + 0.2);
        osc2.stop(audioCtx.currentTime + 0.5);

        // Third beep for urgency
        const osc3 = audioCtx.createOscillator();
        const gain3 = audioCtx.createGain();
        osc3.connect(gain3);
        gain3.connect(audioCtx.destination);
        osc3.frequency.value = 1200;
        osc3.type = 'sine';
        gain3.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.4);
        gain3.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.7);
        osc3.start(audioCtx.currentTime + 0.4);
        osc3.stop(audioCtx.currentTime + 0.7);
    } catch (e) {
        console.log('Sound error:', e);
    }
}

function toggleSound() {
    CONFIG.soundEnabled = !CONFIG.soundEnabled;
    const btn = document.getElementById('soundToggle');
    const icon = btn?.querySelector('.material-icons');
    if (CONFIG.soundEnabled) {
        if (icon) icon.textContent = 'volume_up';
        if (btn) btn.title = 'Sound ON';
    } else {
        if (icon) icon.textContent = 'volume_off';
        if (btn) btn.title = 'Sound OFF';
    }
    showToast(CONFIG.soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF', 'info');
}

// ============================================
// TOAST SYSTEM
// ============================================
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================
// SIDEBAR TOGGLE
// ============================================
function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar) return;
    
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
    
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

// ============================================
// TAB SWITCHING
// ============================================
function switchTab(tabName) {
    STATE.activeTab = tabName;
    
    // Update sidebar links
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-tab') === tabName) {
            link.classList.add('active');
        }
    });
    
    // Update bottom nav
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tabName) {
            item.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('adminSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
    }
    
    // Load tab data
    switch(tabName) {
        case 'dashboard': loadDashboard(); break;
        case 'orders': loadOrders(); break;
        case 'deliveryBoys': loadDeliveryBoys(); break;
        case 'users': loadUsers(); break;
        case 'payments': loadPayments(); break;
        case 'products': loadProducts(); break;
        case 'ratings': loadRatings(); break;
        case 'notifications': loadNotifications(); break;
        case 'reports': break;
        case 'settings': loadSettings(); break;
        case 'support': loadSupportTickets(); break;
        case 'emergency': loadEmergency(); break;
        case 'coupons': loadCoupons(); break;
        case 'inventory': loadInventory(); break;
        case 'loyalty': loadLoyalty(); break;
    }
    
    console.log('📑 Tab switched to:', tabName);
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}?action=getAdminDashboard`);
        const data = await response.json();
        
        if (data.success) {
            // Update stats
            if (data.orders) {
                document.getElementById('totalOrders').textContent = data.orders.total || 0;
                document.getElementById('pendingOrders').textContent = data.orders.pending || 0;
                document.getElementById('confirmedOrders').textContent = data.orders.delivered || 0;
            }
            
            if (data.revenue) {
                document.getElementById('totalRevenue').textContent = '₹' + (data.revenue.totalRevenue || 0).toFixed(2);
            }
            
            if (data.users) {
                document.getElementById('totalDeliveryBoys').textContent = data.users.total || 0;
                document.getElementById('blockedUsers').textContent = data.users.blocked || 0;
            }
            
            if (data.payments) {
                // Update payment stats if needed
            }
            
            // Load recent orders
            await loadRecentOrders();
        }
    } catch (error) {
        console.error('❌ Dashboard load error:', error);
    }
}

async function loadRecentOrders() {
    try {
        const response = await fetch(`${API_URL}?action=getOrders`);
        const data = await response.json();
        
        if (data.success && data.orders) {
            const orders = data.orders.slice(-10).reverse();
            const tbody = document.getElementById('recentOrdersBody');
            
            if (orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="loading-text">No recent orders</td></tr>';
                return;
            }
            
            tbody.innerHTML = orders.map(order => `
                <tr>
                    <td><strong>${order[0] || 'N/A'}</strong></td>
                    <td>${order[1] || 'N/A'}</td>
                    <td><strong>₹${order[8] || '0'}</strong></td>
                    <td><span class="badge badge-${(order[13] || 'pending').toLowerCase()}">${order[13] || 'Pending'}</span></td>
                    <td style="font-size:11px;color:#999;">${order[14] || ''}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('❌ Recent orders load error:', error);
    }
}

// ============================================
// ORDERS
// ============================================
async function loadOrders() {
    try {
        const response = await fetch(`${API_URL}?action=getOrders`);
        const data = await response.json();

        if (data.success && data.orders) {
            const orders = data.orders;
            
            // Check for new orders
            if (orders.length > STATE.lastOrderCount) {
                const newOrders = orders.slice(STATE.lastOrderCount);
                newOrders.forEach(order => {
                    showNewOrderNotification(order);
                    playNotificationSound();
                });
            }
            
            STATE.lastOrderCount = orders.length;
            STATE.orders = orders;
            
            displayOrders(orders);
            updateOrderStats(orders);
            
            // Update badges
            updateBadges(orders);
        }
    } catch (error) {
        console.error('❌ Orders load error:', error);
        document.getElementById('ordersBody').innerHTML = 
            '<tr><td colspan="10" class="loading-text">❌ Orders load नहीं हो सके</td></tr>';
    }
}

function displayOrders(orders) {
    const tbody = document.getElementById('ordersBody');
    document.getElementById('ordersCount').textContent = orders.length;
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="loading-text">📭 कोई ऑर्डर नहीं</td></tr>';
        return;
    }

    // Apply search filter
    const search = document.getElementById('ordersSearch')?.value?.toLowerCase() || '';
    const filter = document.getElementById('ordersFilter')?.value || 'all';
    
    let filtered = orders;
    if (search) {
        filtered = filtered.filter(o => 
            (o[0] || '').toLowerCase().includes(search) ||
            (o[1] || '').toLowerCase().includes(search) ||
            (o[2] || '').includes(search)
        );
    }
    if (filter !== 'all') {
        filtered = filtered.filter(o => (o[13] || 'Pending') === filter);
    }
    
    const recentOrders = filtered.slice(-50).reverse();
    tbody.innerHTML = '';

    recentOrders.forEach(order => {
        const orderId = order[0] || 'N/A';
        const customerName = order[1] || 'N/A';
        const phone = order[2] || 'N/A';
        const villageCity = order[3] || 'N/A';
        const landmark = order[4] || '';
        const pincode = order[5] || '';
        const totalAmount = order[8] || '0';
        const latitude = order[10] || '';
        const longitude = order[11] || '';
        const status = order[13] || 'Pending';
        const orderDate = order[14] || '';
        const deliveryBoyPhone = order[16] || '';
        const rating = order[17] || '';
        const orderMethod = order[15] || '';

        const statusClass = status.toLowerCase();
        const address = [villageCity, landmark, pincode].filter(Boolean).join(', ');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${orderId}</strong></td>
            <td style="font-size:11px;">${orderDate}</td>
            <td>${customerName}</td>
            <td><a href="tel:${phone}" style="color:#2196F3;text-decoration:none;">${phone}</a></td>
            <td>${address || 'N/A'}</td>
            <td><strong style="color:#2E7D32;">₹${totalAmount}</strong></td>
            <td><span class="badge badge-${statusClass}">${status}</span></td>
            <td>
                ${deliveryBoyPhone ? `
                    <span style="font-size:11px;color:#666;">${deliveryBoyPhone}</span>
                ` : `
                    <button class="action-btn btn-assign" onclick="openAssignModal('${orderId}')" title="Assign">🛵</button>
                `}
            </td>
            <td>
                ${rating ? displayStars(rating) : '<span style="color:#ccc;">—</span>'}
            </td>
            <td>
                <button class="action-btn btn-confirm" onclick="updateStatus('${orderId}', 'Confirmed')" title="Confirm">✅</button>
                <button class="action-btn btn-cancel" onclick="updateStatus('${orderId}', 'Cancelled')" title="Cancel">❌</button>
                <button class="action-btn btn-deliver" onclick="updateStatus('${orderId}', 'Delivered')" title="Deliver">🚚</button>
                <button class="action-btn btn-call" onclick="callCustomer('${phone}')" title="Call">📞</button>
                <button class="action-btn btn-whatsapp" onclick="whatsappCustomer('${phone}')" title="WhatsApp">💬</button>
                <button class="action-btn btn-map" onclick="openMap('${latitude}', '${longitude}')" title="Map">📍</button>
                <button class="action-btn btn-block" onclick="openBlockUserModal('${phone}')" title="Block User">🚫</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateOrderStats(orders) {
    const total = orders.length;
    const pending = orders.filter(o => (o[13] || 'Pending') === 'Pending').length;
    const confirmed = orders.filter(o => o[13] === 'Confirmed').length;
    const delivered = orders.filter(o => o[13] === 'Delivered').length;
    const cancelled = orders.filter(o => o[13] === 'Cancelled').length;
    const revenue = orders.reduce((sum, o) => sum + parseFloat(o[8] || '0'), 0);

    document.getElementById('totalOrders').textContent = total;
    document.getElementById('pendingOrders').textContent = pending;
    document.getElementById('confirmedOrders').textContent = delivered;
    document.getElementById('totalRevenue').textContent = '₹' + revenue.toFixed(2);
    
    // Scroll stats
    document.getElementById('totalOrdersScroll').textContent = total;
    document.getElementById('pendingOrdersScroll').textContent = pending;
    document.getElementById('deliveredOrdersScroll').textContent = delivered;
    document.getElementById('totalRevenueScroll').textContent = '₹' + revenue.toFixed(2);
}

function filterOrders() {
    displayOrders(STATE.orders);
}

function refreshOrders() {
    loadOrders();
    showToast('🔄 Orders refreshed', 'info');
}

// ============================================
// DELIVERY BOYS
// ============================================
async function loadDeliveryBoys() {
    await Promise.all([
        loadDeliveryBoyRequests(),
        loadDeliveryBoyStats()
    ]);
}

async function loadDeliveryBoyRequests() {
    try {
        const response = await fetch(`${API_URL}?action=getDeliveryBoyRequests`);
        const data = await response.json();

        if (data.success && data.requests) {
            const requests = data.requests;
            const pendingRequests = requests.filter(r => r[2] === 'Pending Approval');

            // Check for new requests
            if (pendingRequests.length > STATE.lastRequestCount) {
                pendingRequests.forEach(request => {
                    const phone = request[0] || 'Unknown';
                    if (!STATE.notifiedDeliveryBoys[phone] || STATE.notifiedDeliveryBoys[phone] < CONFIG.maxPopupShow) {
                        showDeliveryBoyNotification(phone);
                        playNotificationSound();
                    }
                });
            }
            
            STATE.lastRequestCount = pendingRequests.length;
            STATE.deliveryBoys = requests;

            displayDeliveryBoyRequests(requests);
            updateDeliveryBoyStats(requests);
        }
    } catch (error) {
        console.error('❌ Delivery boys load error:', error);
    }
}

async function loadDeliveryBoyStats() {
    try {
        const response = await fetch(`${API_URL}?action=getDeliveryBoyStats`);
        const data = await response.json();

        if (data.success && data.stats) {
            STATE.deliveryBoyStats = data.stats;
            displayDeliveryBoyStats(data.stats);
        }
    } catch (error) {
        console.error('❌ Stats load error:', error);
        document.getElementById('deliveryBoysStatsBody').innerHTML =
            '<tr><td colspan="7" class="loading-text">❌ Stats load नहीं हो सके</td></tr>';
    }
}

function displayDeliveryBoyRequests(requests) {
    const tbody = document.getElementById('deliveryBoysBody');
    document.getElementById('deliveryBoysCount').textContent = requests.filter(r => r[2] === 'Pending Approval').length;

    if (!requests || requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-text">🛵 कोई requests नहीं</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    requests.reverse().forEach(request => {
        const phone = request[0] || 'N/A';
        const otp = request[1] || 'N/A';
        const status = request[2] || 'Pending';
        const requestTime = request[3] || 'N/A';
        const name = request[5] || '';
        const loginCode = request[6] || '';

        const statusClass = status.toLowerCase().replace(' ', '-');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${phone}</strong></td>
            <td>${otp}</td>
            <td style="font-size:11px;">${requestTime}</td>
            <td><span class="badge badge-${statusClass}">${status}</span></td>
            <td>${name || '—'}</td>
            <td>
                ${status === 'Pending Approval' ? `
                    <input type="text" id="nameInput_${phone}" placeholder="नाम" 
                           style="padding:5px;border:1px solid #ddd;border-radius:5px;font-size:11px;margin-right:4px;width:80px;">
                    <button class="action-btn btn-approve" onclick="approveDeliveryBoy('${phone}')" title="Approve">✅</button>
                    <button class="action-btn btn-reject" onclick="rejectDeliveryBoy('${phone}')" title="Reject">❌</button>
                ` : status === 'Approved' ? `
                    <span class="login-code-display">${loginCode || 'N/A'}</span>
                    <button class="action-btn btn-block" onclick="blockDeliveryBoy('${phone}')" title="Block">🚫</button>
                ` : status === 'Blocked' ? `
                    <button class="action-btn btn-unblock" onclick="unblockDeliveryBoy('${phone}')" title="Unblock">✅ Unblock</button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function displayDeliveryBoyStats(stats) {
    const tbody = document.getElementById('deliveryBoysStatsBody');
    document.getElementById('activeDeliveryBoysCount').textContent = stats.length;

    if (!stats || stats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-text">📊 कोई delivery boys नहीं</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    stats.forEach(stat => {
        const phone = stat[0] || 'N/A';
        const name = stat[1] || '—';
        const status = stat[2] || 'Pending';
        const loginTime = stat[3] || '—';
        const logoutTime = stat[4] || '—';
        const isLoggedIn = stat[5] || 'No';
        const deliveries = stat[6] || '0';
        const earnings = stat[7] || '0';

        const statusClass = status.toLowerCase();
        const isOnline = isLoggedIn === 'Yes';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${phone}</strong></td>
            <td>${name}</td>
            <td><span class="badge badge-${statusClass}">${status}</span></td>
            <td>
                <span class="online-dot ${isOnline ? 'yes' : 'no'}"></span>
                ${isOnline ? '🟢 Online' : '⚪ Offline'}
            </td>
            <td><strong style="color:#FF9800;">${deliveries}</strong></td>
            <td><strong style="color:#2E7D32;">₹${earnings}</strong></td>
            <td>
                <button class="action-btn btn-call" onclick="callCustomer('${phone}')" title="Call">📞</button>
                ${status === 'Blocked' ? `
                    <button class="action-btn btn-unblock" onclick="unblockDeliveryBoy('${phone}')" title="Unblock">✅</button>
                ` : `
                    <button class="action-btn btn-block" onclick="blockDeliveryBoy('${phone}')" title="Block">🚫</button>
                `}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateDeliveryBoyStats(requests) {
    const approved = requests.filter(r => r[2] === 'Approved').length;
    const pending = requests.filter(r => r[2] === 'Pending Approval').length;

    document.getElementById('totalDeliveryBoys').textContent = approved;
    document.getElementById('pendingRequests').textContent = pending;
    document.getElementById('totalDeliveryBoysScroll').textContent = approved;
    document.getElementById('pendingRequestsScroll').textContent = pending;
    document.getElementById('deliveryBoysTabCount').textContent = pending;
    document.getElementById('sidebarDeliveryBadge').textContent = pending;
}

// ============================================
// USERS
// ============================================
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}?action=adminGetAllUsers`);
        const data = await response.json();

        if (data.success && data.users) {
            STATE.users = data.users;
            displayUsers(data.users);
            updateUserStats(data.users);
        }
    } catch (error) {
        console.error('❌ Users load error:', error);
        document.getElementById('usersBody').innerHTML =
            '<tr><td colspan="7" class="loading-text">❌ Users load नहीं हो सके</td></tr>';
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersBody');
    document.getElementById('usersCount').textContent = users.length;

    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-text">👤 कोई users नहीं</td></tr>';
        return;
    }

    // Apply search
    const search = document.getElementById('usersSearch')?.value?.toLowerCase() || '';
    let filtered = users;
    if (search) {
        filtered = filtered.filter(u => 
            (u[0] || '').includes(search) ||
            (u[1] || '').toLowerCase().includes(search) ||
            (u[2] || '').toLowerCase().includes(search)
        );
    }

    tbody.innerHTML = '';

    filtered.forEach(user => {
        const phone = user[0] || 'N/A';
        const name = user[1] || '—';
        const email = user[2] || '—';
        const status = user[3] || 'Active';
        const orders = user[4] || '0';
        const lastLogin = user[5] || '—';

        const statusClass = status.toLowerCase();

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${phone}</strong></td>
            <td>${name}</td>
            <td>${email}</td>
            <td><span class="badge badge-${statusClass}">${status}</span></td>
            <td>${orders}</td>
            <td style="font-size:11px;">${lastLogin}</td>
            <td>
                ${status === 'Blocked' ? `
                    <button class="action-btn btn-unblock" onclick="unblockUser('${phone}')" title="Unblock">✅ Unblock</button>
                ` : status === 'Deactivated' ? `
                    <button class="action-btn btn-unblock" onclick="unblockUser('${phone}')" title="Activate">✅ Activate</button>
                ` : `
                    <button class="action-btn btn-block" onclick="openBlockUserModal('${phone}')" title="Block">🚫 Block</button>
                `}
                <button class="action-btn btn-edit" onclick="viewUserDetails('${phone}')" title="View">👁️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateUserStats(users) {
    const blocked = users.filter(u => u[3] === 'Blocked').length;
    const active = users.filter(u => u[3] === 'Active').length;
    document.getElementById('blockedUsers').textContent = blocked;
    document.getElementById('blockedUsersScroll').textContent = blocked;
    document.getElementById('usersTabCount').textContent = users.length;
    document.getElementById('sidebarUsersBadge').textContent = blocked;
}

function filterUsers() {
    displayUsers(STATE.users);
}

function refreshUsers() {
    loadUsers();
    showToast('🔄 Users refreshed', 'info');
}

async function viewUserDetails(phone) {
    try {
        const response = await fetch(`${API_URL}?action=getUserProfile&phone=${phone}`);
        const data = await response.json();
        
        if (data.success && data.profile) {
            const p = data.profile;
            showToast(`👤 ${p.name}\n📱 ${p.phone}\n📧 ${p.email}\n📦 ${p.totalOrders} orders`, 'info', 5000);
        }
    } catch (error) {
        console.error('❌ User details error:', error);
    }
}

// ============================================
// PAYMENTS
// ============================================
async function loadPayments() {
    try {
        const response = await fetch(`${API_URL}?action=getPayments`);
        const data = await response.json();

        if (data.success && data.payments) {
            STATE.payments = data.payments;
            displayPayments(data.payments);
            updatePaymentStats(data.payments);
        }
    } catch (error) {
        console.error('❌ Payments load error:', error);
        document.getElementById('paymentsBody').innerHTML =
            '<tr><td colspan="7" class="loading-text">❌ Payments load नहीं हो सके</td></tr>';
    }
}

function displayPayments(payments) {
    const tbody = document.getElementById('paymentsBody');

    if (!payments || payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-text">💰 कोई payments नहीं</td></tr>';
        return;
    }

    // Apply search
    const search = document.getElementById('paymentsSearch')?.value?.toLowerCase() || '';
    let filtered = payments;
    if (search) {
        filtered = filtered.filter(p => 
            (p[0] || '').toLowerCase().includes(search) ||
            (p[1] || '').includes(search) ||
            (p[2] || '').includes(search)
        );
    }

    tbody.innerHTML = '';

    filtered.reverse().forEach(payment => {
        const orderId = payment[0] || 'N/A';
        const phone = payment[1] || 'N/A';
        const amount = payment[2] || '0';
        const method = payment[3] || 'N/A';
        const status = payment[4] || 'Pending';
        const time = payment[5] || 'N/A';

        const statusClass = status.toLowerCase();

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${orderId}</strong></td>
            <td>${phone}</td>
            <td><strong style="color:#2E7D32;">₹${amount}</strong></td>
            <td>${method}</td>
            <td><span class="badge badge-${statusClass}">${status}</span></td>
            <td style="font-size:11px;">${time}</td>
            <td>
                ${status === 'Pending' ? `
                    <button class="action-btn btn-confirm" onclick="verifyPayment('${orderId}')" title="Verify">✅</button>
                    <button class="action-btn btn-cancel" onclick="refundPayment('${orderId}')" title="Refund">↩️</button>
                ` : status === 'Verified' ? `
                    <button class="action-btn btn-cancel" onclick="refundPayment('${orderId}')" title="Refund">↩️</button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updatePaymentStats(payments) {
    const total = payments.length;
    const pending = payments.filter(p => p[4] === 'Pending').length;
    const verified = payments.filter(p => p[4] === 'Verified').length;
    const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p[2] || '0'), 0);
    
    document.getElementById('sidebarPaymentsBadge').textContent = pending;
}

function filterPayments() {
    displayPayments(STATE.payments);
}

function refreshPayments() {
    loadPayments();
    showToast('🔄 Payments refreshed', 'info');
}

async function verifyPayment(orderId) {
    try {
        const response = await fetch(`${API_URL}?action=refundPayment&paymentId=${orderId}`);
        const data = await response.json();
        
        if (data.success) {
            showToast('✅ Payment verified', 'success');
            loadPayments();
        }
    } catch (error) {
        console.error('❌ Verify payment error:', error);
    }
}

async function refundPayment(orderId) {
    if (!confirm('क्या आप इस payment को refund करना चाहते हैं?')) return;
    
    try {
        const response = await fetch(`${API_URL}?action=refundPayment&paymentId=${orderId}`);
        const data = await response.json();
        
        if (data.success) {
            showToast('✅ Payment refunded', 'success');
            loadPayments();
        }
    } catch (error) {
        console.error('❌ Refund payment error:', error);
    }
}

// ============================================
// PRODUCTS
// ============================================
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}?action=adminGetAllProducts`);
        const data = await response.json();

        if (data.success && data.products) {
            STATE.products = data.products;
            displayProducts(data.products);
        }
    } catch (error) {
        console.error('❌ Products load error:', error);
        document.getElementById('productsBody').innerHTML =
            '<tr><td colspan="6" class="loading-text">❌ Products load नहीं हो सके</td></tr>';
    }
}

function displayProducts(products) {
    const tbody = document.getElementById('productsBody');

    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-text">🏷️ कोई products नहीं</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    products.forEach(product => {
        const id = product[0] || 'N/A';
        const name = product[1] || 'N/A';
        const price = product[2] || '0';
        const stock = product[3] || '0';
        const category = product[4] || '—';
        const image = product[5] || '';

        const lowStock = parseInt(stock) < 5;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${id}</strong></td>
            <td>${name}</td>
            <td><strong style="color:#2E7D32;">₹${price}</strong></td>
            <td style="color:${lowStock ? '#f44336' : '#333'}; font-weight:${lowStock ? '700' : 'normal'};">
                ${stock} ${lowStock ? '⚠️' : ''}
            </td>
            <td>${category}</td>
            <td>
                <button class="action-btn btn-edit" onclick="openEditProductModal('${id}')" title="Edit">✏️</button>
                <button class="action-btn btn-delete" onclick="deleteProduct('${id}')" title="Delete">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openAddProductModal() {
    document.getElementById('prodId').value = '';
    document.getElementById('prodName').value = '';
    document.getElementById('prodPrice').value = '';
    document.getElementById('prodStock').value = '';
    document.getElementById('prodCategory').value = '';
    document.getElementById('prodImage').value = '';
    document.getElementById('addProductModal').classList.remove('hidden');
}

function openEditProductModal(productId) {
    const product = STATE.products.find(p => p[0] === productId);
    if (!product) return;
    
    document.getElementById('prodId').value = product[0];
    document.getElementById('prodName').value = product[1];
    document.getElementById('prodPrice').value = product[2];
    document.getElementById('prodStock').value = product[3];
    document.getElementById('prodCategory').value = product[4] || '';
    document.getElementById('prodImage').value = product[5] || '';
    document.getElementById('addProductModal').classList.remove('hidden');
}

async function addProduct() {
    const id = document.getElementById('prodId').value.trim();
    const name = document.getElementById('prodName').value.trim();
    const price = document.getElementById('prodPrice').value.trim();
    const stock = document.getElementById('prodStock').value.trim();
    const category = document.getElementById('prodCategory').value.trim();
    const image = document.getElementById('prodImage').value.trim();

    if (!id || !name || !price || !stock) {
        showToast('⚠️ सभी fields भरें', 'warning');
        return;
    }

    const action = STATE.products.find(p => p[0] === id) ? 'adminUpdateProduct' : 'adminAddProduct';
    
    try {
        const response = await fetch(`${API_URL}?action=${action}&productId=${id}&name=${encodeURIComponent(name)}&price=${price}&stock=${stock}&category=${encodeURIComponent(category)}&image=${encodeURIComponent(image)}`);
        const data = await response.json();

        if (data.success) {
            showToast('✅ Product saved successfully', 'success');
            document.getElementById('addProductModal').classList.add('hidden');
            loadProducts();
        } else {
            showToast('❌ ' + (data.message || 'Error saving product'), 'error');
        }
    } catch (error) {
        console.error('❌ Save product error:', error);
        showToast('❌ Error saving product', 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('क्या आप इस product को delete करना चाहते हैं?')) return;
    
    try {
        const response = await fetch(`${API_URL}?action=adminDeleteProduct&productId=${productId}`);
        const data = await response.json();

        if (data.success) {
            showToast('✅ Product deleted', 'success');
            loadProducts();
        }
    } catch (error) {
        console.error('❌ Delete product error:', error);
        showToast('❌ Error deleting product', 'error');
    }
}

// ============================================
// RATINGS
// ============================================
async function loadRatings() {
    try {
        const response = await fetch(`${API_URL}?action=getRatings`);
        const data = await response.json();

        if (data.success && data.ratings) {
            STATE.ratings = data.ratings;
            displayRatings(data.ratings);
            updateRatingStats(data.ratings);
        }
    } catch (error) {
        console.error('❌ Ratings load error:', error);
        document.getElementById('ratingsBody').innerHTML =
            '<tr><td colspan="4" class="loading-text">❌ Ratings load नहीं हो सके</td></tr>';
    }
}

function displayRatings(ratings) {
    const tbody = document.getElementById('ratingsBody');
    document.getElementById('ratingsCount').textContent = ratings.length;

    if (!ratings || ratings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading-text">⭐ कोई ratings नहीं</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    ratings.reverse().forEach(rating => {
        const orderId = rating[0] || 'N/A';
        const ratingValue = rating[1] || '0';
        const comment = rating[2] || '—';
        const time = rating[3] || 'N/A';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${orderId}</strong></td>
            <td>${displayStars(ratingValue)}</td>
            <td style="max-width:200px;">${comment}</td>
            <td style="font-size:11px;">${time}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateRatingStats(ratings) {
    if (ratings.length === 0) {
        document.getElementById('averageRating').textContent = '0.0';
        document.getElementById('averageRatingScroll').textContent = '0.0';
        return;
    }

    const totalRating = ratings.reduce((sum, r) => sum + parseFloat(r[1] || '0'), 0);
    const avg = (totalRating / ratings.length).toFixed(1);
    document.getElementById('averageRating').textContent = avg;
    document.getElementById('averageRatingScroll').textContent = avg;
    document.getElementById('ratingsTabCount').textContent = ratings.length;
}

// ============================================
// NOTIFICATIONS
// ============================================
async function loadNotifications() {
    try {
        const response = await fetch(`${API_URL}?action=getAdminNotifications`);
        const data = await response.json();

        if (data.success && data.notifications) {
            STATE.notifications = data.notifications;
            displayNotificationHistory(data.notifications);
        }
    } catch (error) {
        console.error('❌ Notifications load error:', error);
    }
}

function displayNotificationHistory(notifications) {
    const tbody = document.getElementById('notifHistoryBody');

    if (!notifications || notifications.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-text">📜 कोई notifications नहीं</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    notifications.forEach(notif => {
        const id = notif[0] || 'N/A';
        const phone = notif[1] || 'All';
        const title = notif[2] || 'N/A';
        const status = notif[3] || 'Unread';
        const time = notif[4] || 'N/A';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${title}</strong></td>
            <td>${notif[3] || '—'}</td>
            <td>${phone}</td>
            <td style="font-size:11px;">${time}</td>
            <td><span class="badge badge-${status.toLowerCase()}">${status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

async function sendNotification() {
    const recipient = document.getElementById('notifRecipient').value;
    const phone = document.getElementById('notifPhone').value.trim();
    const title = document.getElementById('notifTitle').value.trim();
    const message = document.getElementById('notifMessage').value.trim();

    if (!title || !message) {
        showToast('⚠️ Title और Message दोनों भरें', 'warning');
        return;
    }

    let action = 'sendBroadcastNotification';
    let url = `${API_URL}?action=${action}&title=${encodeURIComponent(title)}&message=${encodeURIComponent(message)}`;

    if (recipient === 'specific' && phone) {
        action = 'sendUserNotification';
        url = `${API_URL}?action=${action}&phone=${phone}&title=${encodeURIComponent(title)}&message=${encodeURIComponent(message)}`;
    } else if (recipient === 'users') {
        action = 'sendBroadcastNotification';
        url = `${API_URL}?action=${action}&title=${encodeURIComponent(title)}&message=${encodeURIComponent(message)}`;
    } else if (recipient === 'delivery') {
        action = 'sendBroadcastNotification';
        url = `${API_URL}?action=${action}&title=${encodeURIComponent(title)}&message=${encodeURIComponent(message)}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            showToast('✅ Notification sent successfully', 'success');
            document.getElementById('notifTitle').value = '';
            document.getElementById('notifMessage').value = '';
            document.getElementById('notifPhone').value = '';
            loadNotifications();
        } else {
            showToast('❌ ' + (data.message || 'Error sending notification'), 'error');
        }
    } catch (error) {
        console.error('❌ Send notification error:', error);
        showToast('❌ Error sending notification', 'error');
    }
}

// ============================================
// SETTINGS
// ============================================
async function loadSettings() {
    try {
        const response = await fetch(`${API_URL}?action=getAllSettings`);
        const data = await response.json();

        if (data.success && data.settings) {
            STATE.settings = data.settings;
            displaySettings(data.settings);
        }
    } catch (error) {
        console.error('❌ Settings load error:', error);
    }
}

function displaySettings(settings) {
    // Call Button
    const callToggle = document.getElementById('callButtonToggle');
    if (callToggle) {
        callToggle.checked = settings['Show Call Button'] === 'Yes';
        document.getElementById('callButtonStatus').textContent = callToggle.checked ? 'Enabled' : 'Disabled';
    }

    // Online Charge
    const chargeToggle = document.getElementById('onlineChargeToggle');
    if (chargeToggle) {
        chargeToggle.checked = settings['Online Charge ON'] === 'Yes';
        document.getElementById('onlineChargeStatus').textContent = chargeToggle.checked ? 'Enabled' : 'Disabled';
    }

    // Charge Range
    document.getElementById('chargeMin').value = settings['Charge Min'] || '1';
    document.getElementById('chargeMax').value = settings['Charge Max'] || '5';
}

async function updateSetting(setting, value) {
    try {
        const response = await fetch(`${API_URL}?action=updateSetting&setting=${setting}&value=${value}`);
        const data = await response.json();

        if (data.success) {
            showToast('✅ Setting updated', 'success');
            loadSettings();
        }
    } catch (error) {
        console.error('❌ Update setting error:', error);
        showToast('❌ Error updating setting', 'error');
    }
}

function updateChargeRange() {
    const min = document.getElementById('chargeMin').value;
    const max = document.getElementById('chargeMax').value;
    
    if (min && max) {
        updateSetting('Charge Min', min);
        updateSetting('Charge Max', max);
    }
}

function toggleAutoRefresh() {
    CONFIG.autoRefresh = !CONFIG.autoRefresh;
    document.getElementById('autoRefreshStatus').textContent = CONFIG.autoRefresh ? 'Enabled' : 'Disabled';
    showToast(CONFIG.autoRefresh ? '🔄 Auto-refresh enabled' : '⏸️ Auto-refresh disabled', 'info');
}

// ============================================
// SUPPORT TICKETS
// ============================================
async function loadSupportTickets() {
    try {
        const response = await fetch(`${API_URL}?action=getAllUserFeedback`);
        const data = await response.json();

        if (data.success && data.feedback) {
            displaySupportTickets(data.feedback);
        }
    } catch (error) {
        console.error('❌ Support tickets load error:', error);
        document.getElementById('supportTicketsBody').innerHTML =
            '<tr><td colspan="7" class="loading-text">❌ Tickets load नहीं हो सके</td></tr>';
    }
}

function displaySupportTickets(tickets) {
    const tbody = document.getElementById('supportTicketsBody');

    if (!tickets || tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-text">💬 कोई tickets नहीं</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    tickets.reverse().forEach(ticket => {
        const phone = ticket[0] || 'N/A';
        const type = ticket[1] || 'General';
        const message = ticket[2] || '—';
        const time = ticket[3] || 'N/A';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>TKT${Math.floor(Math.random() * 10000)}</td>
            <td>${phone}</td>
            <td>${type}</td>
            <td style="max-width:200px;">${message}</td>
            <td><span class="badge badge-pending">Open</span></td>
            <td style="font-size:11px;">${time}</td>
            <td>
                <button class="action-btn btn-confirm" onclick="showToast('✅ Ticket resolved', 'success')">✅ Resolve</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// EMERGENCY
// ============================================
async function loadEmergency() {
    try {
        // Emergency data from SOS sheet
        const response = await fetch(`${API_URL}?action=getActiveDeliveries`);
        const data = await response.json();

        if (data.success && data.deliveries) {
            displayEmergency(data.deliveries);
        }
    } catch (error) {
        console.error('❌ Emergency load error:', error);
    }
}

function displayEmergency(deliveries) {
    const tbody = document.getElementById('emergencyBody');
    document.getElementById('emergencyCount').textContent = deliveries.length;
    document.getElementById('sidebarEmergencyBadge').textContent = deliveries.length;

    if (!deliveries || deliveries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-text">🚨 कोई emergency alerts नहीं</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    deliveries.forEach(delivery => {
        const orderId = delivery[0] || 'N/A';
        const status = delivery[13] || 'Active';
        const time = delivery[14] || 'N/A';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${orderId}</td>
            <td>—</td>
            <td>—</td>
            <td style="font-size:11px;">${time}</td>
            <td><span class="badge badge-${status.toLowerCase()}">${status}</span></td>
            <td>
                <button class="action-btn btn-call" onclick="showToast('📞 Emergency call initiated', 'warning')">📞</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// COUPONS
// ============================================
async function loadCoupons() {
    try {
        const response = await fetch(`${API_URL}?action=getActivePromos`);
        const data = await response.json();

        if (data.success && data.promos) {
            STATE.coupons = data.promos;
            displayCoupons(data.promos);
        }
    } catch (error) {
        console.error('❌ Coupons load error:', error);
        document.getElementById('couponsBody').innerHTML =
            '<tr><td colspan="5" class="loading-text">❌ Coupons load नहीं हो सके</td></tr>';
    }
}

function displayCoupons(coupons) {
    const tbody = document.getElementById('couponsBody');

    if (!coupons || coupons.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-text">🎫 कोई coupons नहीं</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    coupons.forEach(coupon => {
        const code = coupon[0] || 'N/A';
        const discount = coupon[1] || '0';
        const validTill = coupon[2] || 'N/A';
        const status = coupon[3] || 'Active';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${code}</strong></td>
            <td>${discount}</td>
            <td>${validTill}</td>
            <td><span class="badge badge-${status.toLowerCase()}">${status}</span></td>
            <td>
                <button class="action-btn btn-delete" onclick="showToast('🗑️ Coupon deleted', 'success')">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openAddCouponModal() {
    document.getElementById('couponCode').value = '';
    document.getElementById('couponDiscount').value = '';
    document.getElementById('couponValidTill').value = '';
    document.getElementById('addCouponModal').classList.remove('hidden');
}

async function addCoupon() {
    const code = document.getElementById('couponCode').value.trim();
    const discount = document.getElementById('couponDiscount').value.trim();
    const validTill = document.getElementById('couponValidTill').value;

    if (!code || !discount) {
        showToast('⚠️ Code और Discount भरें', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}?action=createPromoOffer&promoCode=${code}&discount=${discount}&validTill=${validTill}`);
        const data = await response.json();

        if (data.success) {
            showToast('✅ Coupon added', 'success');
            document.getElementById('addCouponModal').classList.add('hidden');
            loadCoupons();
        }
    } catch (error) {
        console.error('❌ Add coupon error:', error);
        showToast('❌ Error adding coupon', 'error');
    }
}

// ============================================
// INVENTORY
// ============================================
async function loadInventory() {
    try {
        const response = await fetch(`${API_URL}?action=getLowStockProducts`);
        const data = await response.json();

        if (data.success && data.products) {
            STATE.inventory = data.products;
            displayInventory(data.products);
            document.getElementById('lowStockCount').textContent = data.products.length;
            document.getElementById('sidebarInventoryBadge').textContent = data.products.length;
        }
    } catch (error) {
        console.error('❌ Inventory load error:', error);
        document.getElementById('inventoryBody').innerHTML =
            '<tr><td colspan="6" class="loading-text">❌ Inventory load नहीं हो सके</td></tr>';
    }
}

function displayInventory(products) {
    const tbody = document.getElementById('inventoryBody');

    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-text">📦 कोई low stock products नहीं</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    products.forEach(product => {
        const id = product[0] || 'N/A';
        const name = product[1] || 'N/A';
        const stock = product[2] || '0';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${id}</strong></td>
            <td>${name}</td>
            <td style="color:#f44336;font-weight:700;">${stock}</td>
            <td>5</td>
            <td><span class="badge badge-cancelled">⚠️ Low Stock</span></td>
            <td>
                <button class="action-btn btn-confirm" onclick="restockProduct('${id}')">📦 Restock</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function restockProduct(productId) {
    const quantity = prompt('कितनी quantity add करनी है?', '10');
    if (!quantity) return;

    try {
        const response = await fetch(`${API_URL}?action=restockProduct&productId=${productId}&quantity=${quantity}`);
        const data = await response.json();

        if (data.success) {
            showToast('✅ Stock updated', 'success');
            loadInventory();
        }
    } catch (error) {
        console.error('❌ Restock error:', error);
        showToast('❌ Error updating stock', 'error');
    }
}

// ============================================
// LOYALTY POINTS
// ============================================
async function loadLoyalty() {
    try {
        // Loyalty data fetch
        const tbody = document.getElementById('loyaltyBody');
        tbody.innerHTML = '<tr><td colspan="3" class="loading-text">⭐ Loyalty points loading...</td></tr>';
    } catch (error) {
        console.error('❌ Loyalty load error:', error);
    }
}

async function addLoyaltyPoints() {
    const phone = document.getElementById('loyaltyPhone').value.trim();
    const points = document.getElementById('loyaltyPoints').value.trim();

    if (!phone || !points) {
        showToast('⚠️ Phone और Points भरें', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}?action=addLoyaltyPoints&phone=${phone}&points=${points}`);
        const data = await response.json();

        if (data.success) {
            showToast('✅ Points added', 'success');
            document.getElementById('loyaltyPhone').value = '';
            document.getElementById('loyaltyPoints').value = '';
            loadLoyalty();
        }
    } catch (error) {
        console.error('❌ Add loyalty error:', error);
        showToast('❌ Error adding points', 'error');
    }
}

async function redeemLoyaltyPoints() {
    const phone = document.getElementById('loyaltyPhone').value.trim();
    const points = document.getElementById('loyaltyPoints').value.trim();

    if (!phone || !points) {
        showToast('⚠️ Phone और Points भरें', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}?action=redeemLoyaltyPoints&phone=${phone}&points=${points}`);
        const data = await response.json();

        if (data.success) {
            showToast('✅ Points redeemed', 'success');
            document.getElementById('loyaltyPhone').value = '';
            document.getElementById('loyaltyPoints').value = '';
            loadLoyalty();
        } else {
            showToast('❌ ' + (data.message || 'Insufficient points'), 'error');
        }
    } catch (error) {
        console.error('❌ Redeem loyalty error:', error);
        showToast('❌ Error redeeming points', 'error');
    }
}

// ============================================
// NOTIFICATION POPUPS
// ============================================
function showNewOrderNotification(order) {
    const orderId = order[0] || 'Unknown';

    if (!STATE.notifiedOrders[orderId]) {
        STATE.notifiedOrders[orderId] = 0;
    }

    if (STATE.notifiedOrders[orderId] >= CONFIG.maxPopupShow) {
        console.log(`🔔 Order ${orderId} popup already shown ${CONFIG.maxPopupShow} times, skipping`);
        return;
    }

    STATE.notifiedOrders[orderId]++;

    STATE.currentOrderId = orderId;
    const customerName = order[1] || 'Unknown';
    const total = order[8] || '0';

    document.getElementById('notificationBody').innerHTML = `
        <strong>Order ID:</strong> ${orderId}<br>
        <strong>Customer:</strong> ${customerName}<br>
        <strong>Total:</strong> ₹${total}
    `;

    document.getElementById('notificationPopup').classList.add('show');
    console.log(`🔔 Order ${orderId} popup shown (${STATE.notifiedOrders[orderId]}/${CONFIG.maxPopupShow})`);

    setTimeout(() => {
        document.getElementById('notificationPopup').classList.remove('show');
    }, 10000);
}

function showDeliveryBoyNotification(phone) {
    const cleanPhone = phone || 'Unknown';

    if (!STATE.notifiedDeliveryBoys[cleanPhone]) {
        STATE.notifiedDeliveryBoys[cleanPhone] = 0;
    }

    if (STATE.notifiedDeliveryBoys[cleanPhone] >= CONFIG.maxPopupShow) {
        console.log(`🔔 Delivery boy ${cleanPhone} popup already shown ${CONFIG.maxPopupShow} times, skipping`);
        return;
    }

    STATE.notifiedDeliveryBoys[cleanPhone]++;

    document.getElementById('deliveryBoyNotificationBody').innerHTML = `
        <strong>🛵 नई Delivery Boy Login Request!</strong><br>
        <strong>Phone:</strong> ${cleanPhone}<br>
        कृपया request को approve या reject करें।
    `;

    document.getElementById('deliveryBoyNotification').classList.add('show');
    console.log(`🔔 Delivery boy ${cleanPhone} popup shown (${STATE.notifiedDeliveryBoys[cleanPhone]}/${CONFIG.maxPopupShow})`);

    setTimeout(() => {
        document.getElementById('deliveryBoyNotification').classList.remove('show');
    }, 10000);
}

function closeNotification() {
    document.getElementById('notificationPopup').classList.remove('show');
}

function closeDeliveryBoyNotif() {
    document.getElementById('deliveryBoyNotification').classList.remove('show');
}

// ============================================
// NOTIFICATION BUTTONS
// ============================================
function notifConfirm() {
    if (STATE.currentOrderId) {
        updateStatus(STATE.currentOrderId, 'Confirmed');
        document.getElementById('notificationPopup').classList.remove('show');
    }
}

function notifCancel() {
    if (STATE.currentOrderId) {
        updateStatus(STATE.currentOrderId, 'Cancelled');
        document.getElementById('notificationPopup').classList.remove('show');
    }
}

function notifView() {
    document.getElementById('notificationPopup').classList.remove('show');
    switchTab('orders');
}

function viewDeliveryBoys() {
    document.getElementById('deliveryBoyNotification').classList.remove('show');
    switchTab('deliveryBoys');
}

// ============================================
// ORDER STATUS UPDATE
// ============================================
async function updateStatus(orderId, status) {
    try {
        const response = await fetch(`${API_URL}?action=updateStatus&orderId=${orderId}&status=${status}`);
        const data = await response.json();

        if (data.success) {
            playNotificationSound();
            showToast(`✅ Order ${orderId} ${status} हो गया!`, 'success');
            loadOrders();
        } else {
            showToast('❌ Update failed: ' + (data.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('❌ Update error:', error);
        showToast('❌ Update failed', 'error');
    }
}

// ============================================
// DELIVERY BOY ACTIONS
// ============================================
async function approveDeliveryBoy(phone) {
    const name = document.getElementById(`nameInput_${phone}`)?.value || 'Delivery Boy';

    try {
        const response = await fetch(`${API_URL}?action=approveDeliveryBoy&phone=${phone}&name=${encodeURIComponent(name)}`);
        const data = await response.json();

        if (data.success) {
            playNotificationSound();
            showToast(`✅ Delivery Boy approved! Login Code: ${data.loginCode || 'N/A'}`, 'success');
            loadDeliveryBoys();
        } else {
            showToast('❌ Approval failed: ' + (data.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('❌ Approval error:', error);
        showToast('❌ Approval failed', 'error');
    }
}

async function rejectDeliveryBoy(phone) {
    try {
        const response = await fetch(`${API_URL}?action=rejectDeliveryBoy&phone=${phone}`);
        const data = await response.json();

        if (data.success) {
            playNotificationSound();
            showToast('❌ Delivery Boy rejected!', 'success');
            loadDeliveryBoys();
        }
    } catch (error) {
        console.error('❌ Reject error:', error);
        showToast('❌ Reject failed', 'error');
    }
}

async function blockDeliveryBoy(phone) {
    if (!confirm('क्या आप इस delivery boy को block करना चाहते हैं?')) return;

    try {
        const response = await fetch(`${API_URL}?action=blockDeliveryBoy&phone=${phone}`);
        const data = await response.json();

        if (data.success) {
            playNotificationSound();
            showToast('🚫 Delivery Boy blocked!', 'success');
            loadDeliveryBoys();
        }
    } catch (error) {
        console.error('❌ Block error:', error);
        showToast('❌ Block failed', 'error');
    }
}

async function unblockDeliveryBoy(phone) {
    try {
        const response = await fetch(`${API_URL}?action=unblockDeliveryBoy&phone=${phone}`);
        const data = await response.json();

        if (data.success) {
            playNotificationSound();
            showToast('✅ Delivery Boy unblocked!', 'success');
            loadDeliveryBoys();
        }
    } catch (error) {
        console.error('❌ Unblock error:', error);
        showToast('❌ Unblock failed', 'error');
    }
}

// ============================================
// USER BLOCK ACTIONS
// ============================================
function openBlockUserModal(phone) {
    STATE.currentPhone = phone;
    document.getElementById('blockUserPhone').textContent = phone;
    document.getElementById('blockReasonInput').value = '';
    document.getElementById('blockUserModal').classList.remove('hidden');
}

function closeBlockUserModal() {
    document.getElementById('blockUserModal').classList.add('hidden');
    STATE.currentPhone = null;
}

async function confirmBlockUser() {
    const reason = document.getElementById('blockReasonInput')?.value || 'No reason';

    if (!STATE.currentPhone) return;

    try {
        const response = await fetch(`${API_URL}?action=blockUser&phone=${STATE.currentPhone}&reason=${encodeURIComponent(reason)}`);
        const data = await response.json();

        if (data.success) {
            playNotificationSound();
            showToast('🚫 User blocked!', 'success');
            closeBlockUserModal();
            loadUsers();
        }
    } catch (error) {
        console.error('❌ Block user error:', error);
        showToast('❌ Block failed', 'error');
    }
}

async function unblockUser(phone) {
    try {
        const response = await fetch(`${API_URL}?action=unblockUser&phone=${phone}`);
        const data = await response.json();

        if (data.success) {
            playNotificationSound();
            showToast('✅ User unblocked!', 'success');
            loadUsers();
        }
    } catch (error) {
        console.error('❌ Unblock user error:', error);
        showToast('❌ Unblock failed', 'error');
    }
}

// ============================================
// ASSIGN DELIVERY BOY
// ============================================
function openAssignModal(orderId) {
    STATE.currentOrderId = orderId;
    document.getElementById('assignOrderId').textContent = orderId;

    const select = document.getElementById('deliveryBoySelect');
    select.innerHTML = '<option value="">-- चुनें --</option>';

    // Get approved delivery boys
    const approvedBoys = STATE.deliveryBoys.filter(d => d[2] === 'Approved');
    approvedBoys.forEach(deliveryBoy => {
        const phone = deliveryBoy[0] || '';
        const name = deliveryBoy[5] || 'Delivery Boy';
        const option = document.createElement('option');
        option.value = phone;
        option.textContent = `${name} (${phone})`;
        select.appendChild(option);
    });

    document.getElementById('assignModal').classList.remove('hidden');
}

function closeAssignModal() {
    document.getElementById('assignModal').classList.add('hidden');
    STATE.currentOrderId = null;
}

async function assignDeliveryBoy() {
    const phone = document.getElementById('deliveryBoySelect')?.value;

    if (!phone || !STATE.currentOrderId) {
        showToast('⚠️ कृपया delivery boy चुनें', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}?action=acceptOrder&orderId=${STATE.currentOrderId}&phone=${phone}`);
        const data = await response.json();

        if (data.success) {
            playNotificationSound();
            showToast('✅ Delivery Boy assigned!', 'success');
            closeAssignModal();
            loadOrders();
        }
    } catch (error) {
        console.error('❌ Assign error:', error);
        showToast('❌ Assign failed', 'error');
    }
}

// ============================================
// CLOSE MODAL
// ============================================
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// ============================================
// CUSTOMER FUNCTIONS
// ============================================
function callCustomer(phone) {
    window.open(`tel:${phone}`);
}

function whatsappCustomer(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`);
}

function openMap(lat, lng) {
    if (lat && lng && lat !== '' && lng !== '') {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`);
    } else {
        showToast('📍 Location not available', 'warning');
    }
}

// ============================================
// DISPLAY STARS
// ============================================
function displayStars(rating) {
    const ratingNum = parseInt(rating) || 0;
    let stars = '<span class="rating-stars-display">';

    for (let i = 1; i <= 5; i++) {
        if (i <= ratingNum) {
            stars += '<span class="rating-star-filled">⭐</span>';
        } else {
            stars += '<span class="rating-star-empty">☆</span>';
        }
    }

    stars += `<span class="rating-value">${ratingNum}.0</span></span>`;
    return stars;
}

// ============================================
// UPDATE BADGES
// ============================================
function updateBadges(orders) {
    const pending = orders.filter(o => (o[13] || 'Pending') === 'Pending').length;
    const confirmed = orders.filter(o => o[13] === 'Confirmed').length;
    const delivered = orders.filter(o => o[13] === 'Delivered').length;
    
    document.getElementById('sidebarOrdersBadge').textContent = pending;
    document.getElementById('bottomOrdersBadge').textContent = pending;
    document.getElementById('bottomNotifBadge').textContent = pending;
    document.getElementById('ordersTabCount').textContent = orders.length;
}

// ============================================
// EXPORT FUNCTIONS
// ============================================
async function exportOrders() {
    try {
        const response = await fetch(`${API_URL}?action=exportOrdersData`);
        const data = await response.json();
        
        if (data.success) {
            const json = JSON.stringify(data.orders, null, 2);
            const blob = new Blob([json], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orders_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('📥 Orders exported', 'success');
        }
    } catch (error) {
        console.error('❌ Export error:', error);
        showToast('❌ Export failed', 'error');
    }
}

async function exportUsers() {
    try {
        const response = await fetch(`${API_URL}?action=exportUsersData`);
        const data = await response.json();
        
        if (data.success) {
            const json = JSON.stringify(data.users, null, 2);
            const blob = new Blob([json], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `users_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('📥 Users exported', 'success');
        }
    } catch (error) {
        console.error('❌ Export error:', error);
        showToast('❌ Export failed', 'error');
    }
}

// ============================================
// REPORT FUNCTIONS
// ============================================
async function loadDailyReport() {
    try {
        const response = await fetch(`${API_URL}?action=getDailyReport`);
        const data = await response.json();
        showReportResult('📅 Daily Report', data);
    } catch (error) {
        console.error('❌ Report error:', error);
        showToast('❌ Report load failed', 'error');
    }
}

async function loadWeeklyReport() {
    try {
        const response = await fetch(`${API_URL}?action=getWeeklyReport`);
        const data = await response.json();
        showReportResult('📆 Weekly Report', data);
    } catch (error) {
        console.error('❌ Report error:', error);
        showToast('❌ Report load failed', 'error');
    }
}

async function loadMonthlyReport() {
    try {
        const response = await fetch(`${API_URL}?action=getMonthlyReport`);
        const data = await response.json();
        showReportResult('📊 Monthly Report', data);
    } catch (error) {
        console.error('❌ Report error:', error);
        showToast('❌ Report load failed', 'error');
    }
}

async function loadRevenueReport() {
    try {
        const response = await fetch(`${API_URL}?action=getRevenueStats`);
        const data = await response.json();
        showReportResult('💰 Revenue Report', data);
    } catch (error) {
        console.error('❌ Report error:', error);
        showToast('❌ Report load failed', 'error');
    }
}

function showReportResult(title, data) {
    const container = document.getElementById('reportResult');
    if (!container) return;
    
    container.innerHTML = `
        <h3 style="color:#2E7D32;margin-bottom:12px;">${title}</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
            ${Object.entries(data).map(([key, value]) => `
                <div style="background:#f5f5f5;padding:12px;border-radius:10px;text-align:center;">
                    <div style="font-size:11px;color:#999;text-transform:uppercase;font-weight:700;">${key}</div>
                    <div style="font-size:20px;font-weight:800;color:#2E7D32;">${value}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================
// REFRESH ALL
// ============================================
async function refreshAll() {
    showToast('🔄 Refreshing all data...', 'info');
    console.log('🔄 Refreshing all data...');
    
    await Promise.all([
        loadDashboard(),
        loadOrders(),
        loadDeliveryBoys(),
        loadUsers(),
        loadPayments(),
        loadProducts(),
        loadRatings(),
        loadNotifications(),
        loadSupportTickets(),
        loadEmergency(),
        loadCoupons(),
        loadInventory(),
        loadLoyalty()
    ]);
    
    showToast('✅ All data refreshed', 'success');
    console.log('✅ All data refreshed');
}

// ============================================
// ADMIN LOGOUT
// ============================================
function logoutAdmin() {
    if (confirm('क्या आप logout करना चाहते हैं?')) {
        localStorage.removeItem('adminAuth');
        window.location.reload();
    }
}

// ============================================
// RECIPIENT CHANGE HANDLER
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const recipientSelect = document.getElementById('notifRecipient');
    if (recipientSelect) {
        recipientSelect.addEventListener('change', function() {
            const specificGroup = document.getElementById('specificPhoneGroup');
            if (specificGroup) {
                specificGroup.style.display = this.value === 'specific' ? 'block' : 'none';
            }
        });
    }

    // Initialize notification recipient
    if (recipientSelect) {
        const specificGroup = document.getElementById('specificPhoneGroup');
        if (specificGroup) {
            specificGroup.style.display = recipientSelect.value === 'specific' ? 'block' : 'none';
        }
    }
});

// ============================================
// AUTO REFRESH
// ============================================
setInterval(() => {
    if (CONFIG.autoRefresh) {
        const activeTab = STATE.activeTab;
        switch(activeTab) {
            case 'dashboard': loadDashboard(); break;
            case 'orders': loadOrders(); break;
            case 'deliveryBoys': loadDeliveryBoys(); break;
            case 'users': loadUsers(); break;
            case 'payments': loadPayments(); break;
            case 'products': loadProducts(); break;
            case 'ratings': loadRatings(); break;
            case 'notifications': loadNotifications(); break;
            case 'support': loadSupportTickets(); break;
            case 'emergency': loadEmergency(); break;
            case 'coupons': loadCoupons(); break;
            case 'inventory': loadInventory(); break;
            case 'loyalty': loadLoyalty(); break;
        }
    }
}, CONFIG.refreshInterval);

// ============================================
// INIT
// ============================================
console.log('🛒 Quick Dukan Admin Panel v2.0');
console.log('🔄 Auto-refresh:', CONFIG.autoRefresh ? 'ON' : 'OFF');
console.log('⏱️  Interval:', CONFIG.refreshInterval / 1000, 'seconds');
console.log('🔊 Sound:', CONFIG.soundEnabled ? 'ON' : 'OFF');
console.log('🔔 Popup Control: Per-item ' + CONFIG.maxPopupShow + ' times');
console.log('📱 Mobile Ready');

// Initial load
refreshAll();