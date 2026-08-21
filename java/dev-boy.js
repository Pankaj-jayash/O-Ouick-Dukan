// ============================================
// DELIVERY BOY JS - Complete Logic
// With Login Code + Device ID + Stats + Logout
// Auto Refresh + Block Check + Payment Status + Funny Messages
// ============================================

// ⚠️ अपना Google Apps Script Web App URL डालें
const API_URL = 'https://script.google.com/macros/s/AKfycbzJUHVKP2jkHlc7xJInCTl6XNN0JlH7kqqDoLlztfs0Yg_s1ZAAWzRI0tUNt9eZgW-r/exec';

class DeliveryBoyApp {
    constructor() {
        // DOM Elements - Login
        this.loginScreen = document.getElementById('loginScreen');
        this.mainApp = document.getElementById('mainApp');
        this.loginPhone = document.getElementById('loginPhone');
        this.loginCodeInput = document.getElementById('loginCodeInput');
        this.loginCodeSection = document.getElementById('loginCodeSection');
        this.loginWithCodeBtn = document.getElementById('loginWithCodeBtn');
        this.forgetCodeBtn = document.getElementById('forgetCodeBtn');

        // DOM Elements - OTP
        this.otpSection = document.getElementById('otpSection');
        this.otpInputSection = document.getElementById('otpInputSection');
        this.otpInput = document.getElementById('otpInput');
        this.otpTimer = document.getElementById('otpTimer');
        this.sendOtpBtn = document.getElementById('sendOtpBtn');
        this.verifyOtpBtn = document.getElementById('verifyOtpBtn');
        this.resendOtpBtn = document.getElementById('resendOtpBtn');
        this.loginStatus = document.getElementById('loginStatus');

        // DOM Elements - Stats
        this.totalDeliveriesEl = document.getElementById('totalDeliveries');
        this.totalEarningsEl = document.getElementById('totalEarnings');
        this.loginTimeEl = document.getElementById('loginTime');

        // DOM Elements - Modals
        this.logoutModal = document.getElementById('logoutModal');
        this.forgetCodeModal = document.getElementById('forgetCodeModal');
        this.paymentWarningModal = document.getElementById('paymentWarningModal');

        // Data
        this.deliveryBoyPhone = '';
        this.deliveryBoyName = '';
        this.deviceId = '';
        this.currentOtp = '';
        this.otpTimerInterval = null;
        this.currentOrderId = null;
        this.currentMap = null;
        this.currentMarkers = {};
        this.locationWatchId = null;
        this.currentLocation = null;
        this.loginTime = null;
        this.statsInterval = null;
        this.blockCheckInterval = null;
        this.onlineStatusInterval = null;
        this.ordersRefreshInterval = null;
        this.allPayments = [];

        // 🆕 Funny Messages
        this.funnyMessages = {
            accept: [
                '🎉 शाबाश! एक और order पकड़ लिया! 🏃‍♂️',
                '✅ Order accept! अब जल्दी करो, customer wait कर रहा है! 😅',
                '🔥 तुम तो आग लगा दिए! एक और order! 💪',
                '💰 एक और delivery = और पैसा! चलो भागो! 🏍️💨',
                '😎 Delivery Boy of the Month बनना है तो जल्दी करो!'
            ],
            delivered: [
                '🎉 शाबाश! एक और delivery complete! 🦸‍♂️',
                '😊 Customer खुश! तुम्हारी rating बढ़ेगी! ⭐',
                '💪 आज तुम्हारा दिन है! Delivery machine! 🏍️',
                '👏 क्या बात है! एक और order done! 🎯',
                '🦸‍♂️ Delivery Hero! अगला order ready है!'
            ],
            pendingPayment: [
                '⏳ अरे! Payment अभी pending है! पहले confirm कराओ!',
                '⚠️ रुको! पैसा आने दो, फिर delivery करो! 💰',
                '🤔 Payment verify नहीं हुआ! Admin से पूछो!',
                '⏳ पैसा पहले, delivery बाद में! समझ गए? 😅'
            ],
            noOrders: [
                '😴 अभी कोई order नहीं! थोड़ा आराम कर लो!',
                '☕ चाय पी लो, order आने वाला है!',
                '🛵 Bike ready रखो, order कभी भी आ सकता है!'
            ],
            blocked: [
                '🚫 अरे! Admin ने block कर दिया! Contact करो!'
            ]
        };

        // Device ID generate करें
        this.initDeviceId();

        this.init();
    }

    // ============================================
    // DEVICE ID SYSTEM
    // ============================================
    initDeviceId() {
        let savedDeviceId = localStorage.getItem('deliveryBoyDeviceId');

        if (!savedDeviceId) {
            savedDeviceId = 'DEV-' + this.generateRandomId();
            localStorage.setItem('deliveryBoyDeviceId', savedDeviceId);
        }

        this.deviceId = savedDeviceId;
        console.log('📱 Device ID:', this.deviceId);
    }

    generateRandomId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < 16; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    // ============================================
    // 🆕 GET RANDOM FUNNY MESSAGE
    // ============================================
    getFunnyMessage(type) {
        const messages = this.funnyMessages[type];
        if (!messages || messages.length === 0) return '';
        return messages[Math.floor(Math.random() * messages.length)];
    }

    // ============================================
    // 🆕 SHOW FUNNY TOAST
    // ============================================
    showFunnyToast(message) {
        // पुराना toast हटाएं
        const existingToast = document.querySelector('.funny-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'funny-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ============================================
    // INIT
    // ============================================
    init() {
        this.bindEvents();
        this.checkAutoLogin();
        console.log('🛵 Delivery Boy App Ready');
    }

    checkAutoLogin() {
        const savedPhone = localStorage.getItem('deliveryBoyPhone');
        const savedName = localStorage.getItem('deliveryBoyName');

        if (savedPhone && savedName) {
            this.deliveryBoyPhone = savedPhone;
            this.deliveryBoyName = savedName;
            this.showMainApp();
        }
    }

    bindEvents() {
        // Login method tabs
        document.querySelectorAll('.login-method-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchLoginMethod(tab));
        });

        // Login with code
        this.loginWithCodeBtn?.addEventListener('click', () => this.loginWithCode());

        // Forget code
        this.forgetCodeBtn?.addEventListener('click', () => this.showForgetCodeModal());

        // Send OTP
        this.sendOtpBtn?.addEventListener('click', () => this.sendOTP());

        // Verify OTP
        this.verifyOtpBtn?.addEventListener('click', () => this.verifyOTP());

        // Resend OTP
        this.resendOtpBtn?.addEventListener('click', () => this.sendOTP());

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.showLogoutModal());

        // Logout modal buttons
        document.getElementById('confirmLogoutBtn')?.addEventListener('click', () => this.logout());
        document.getElementById('cancelLogoutBtn')?.addEventListener('click', () => {
            this.logoutModal?.classList.add('hidden');
        });

        // Forget code modal buttons
        document.getElementById('confirmForgetBtn')?.addEventListener('click', () => this.forgetLoginCode());
        document.getElementById('cancelForgetBtn')?.addEventListener('click', () => {
            this.forgetCodeModal?.classList.add('hidden');
        });

        // Payment warning OK
        document.getElementById('paymentWarningOkBtn')?.addEventListener('click', () => {
            this.paymentWarningModal?.classList.add('hidden');
        });

        // Refresh
        document.getElementById('refreshOrdersBtn')?.addEventListener('click', () => this.loadAssignedOrders());

        // Tabs
        document.querySelectorAll('.delivery-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab));
        });

        // Close modals
        document.getElementById('closeOrderDetails')?.addEventListener('click', () => {
            document.getElementById('orderDetailsModal').classList.add('hidden');
        });

        document.getElementById('cancelDeliveredBtn')?.addEventListener('click', () => {
            document.getElementById('deliveredModal').classList.add('hidden');
        });

        document.getElementById('confirmDeliveredBtn')?.addEventListener('click', () => {
            this.markDelivered();
        });
    }

    // ============================================
    // LOGIN METHOD SWITCH
    // ============================================
    switchLoginMethod(tab) {
        document.querySelectorAll('.login-method-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const method = tab.getAttribute('data-method');

        if (method === 'code') {
            this.loginCodeSection?.classList.remove('hidden');
            this.otpSection?.classList.add('hidden');
        } else {
            this.loginCodeSection?.classList.add('hidden');
            this.otpSection?.classList.remove('hidden');
        }
    }

    // ============================================
    // LOGIN WITH CODE
    // ============================================
    async loginWithCode() {
        const phone = this.loginPhone?.value?.trim();
        const loginCode = this.loginCodeInput?.value?.trim().toUpperCase();

        if (!phone || phone.length !== 10) {
            this.showLoginStatus('सही मोबाइल नंबर डालें', 'error');
            return;
        }

        if (!loginCode || loginCode.length < 4) {
            this.showLoginStatus('Login Code डालें', 'error');
            return;
        }

        this.deliveryBoyPhone = phone;
        this.showLoginStatus('🔄 Login हो रहा है...', 'pending');

        try {
            const response = await fetch(`${API_URL}?action=deliveryBoyLoginWithCode&phone=${phone}&loginCode=${loginCode}&deviceId=${this.deviceId}`);
            const data = await response.json();

            if (data.success) {
                this.deliveryBoyName = data.name || 'Delivery Boy';
                localStorage.setItem('deliveryBoyPhone', this.deliveryBoyPhone);
                localStorage.setItem('deliveryBoyName', this.deliveryBoyName);

                this.showLoginStatus('✅ Login successful!', 'success');
                this.showFunnyToast('🛵 ' + this.deliveryBoyName + '! आज फिर कमाई का दिन है! 💰');

                setTimeout(() => {
                    this.showMainApp();
                }, 1000);
            } else {
                this.showLoginStatus('❌ ' + (data.message || 'Login failed'), 'error');
            }
        } catch (error) {
            console.log('⚠️ Login error:', error);
            this.showLoginStatus('❌ Login error', 'error');
        }
    }

    // ============================================
    // FORGET LOGIN CODE
    // ============================================
    showForgetCodeModal() {
        const phone = this.loginPhone?.value?.trim();

        if (!phone || phone.length !== 10) {
            this.showLoginStatus('पहले मोबाइल नंबर डालें', 'error');
            return;
        }

        this.deliveryBoyPhone = phone;
        this.forgetCodeModal?.classList.remove('hidden');
    }

    async forgetLoginCode() {
        try {
            this.showLoginStatus('🔄 Request भेजी जा रही है...', 'pending');

            const response = await fetch(`${API_URL}?action=forgetLoginCode&phone=${this.deliveryBoyPhone}&deviceId=${this.deviceId}`);
            const data = await response.json();

            this.forgetCodeModal?.classList.add('hidden');

            if (data.success) {
                this.showLoginStatus('✅ Request भेज दी गई है।', 'success');

                if (data.otp) {
                    this.currentOtp = data.otp;
                    this.showLoginStatus(`🔐 आपका OTP: ${this.currentOtp}`, 'pending');
                }

                this.checkLoginApproval();
            } else {
                this.showLoginStatus('❌ ' + (data.message || 'Request failed'), 'error');
            }
        } catch (error) {
            this.showLoginStatus('❌ Error', 'error');
        }
    }

    // ============================================
    // OTP SYSTEM
    // ============================================
    async sendOTP() {
        const phone = this.loginPhone?.value?.trim();

        if (!phone || phone.length !== 10) {
            this.showLoginStatus('सही मोबाइल नंबर डालें', 'error');
            return;
        }

        this.deliveryBoyPhone = phone;
        this.currentOtp = Math.floor(100000 + Math.random() * 900000).toString();

        console.log('🔐 OTP Generated:', this.currentOtp);
        this.showLoginStatus(`🔐 आपका OTP: ${this.currentOtp}`, 'pending');

        this.startOTPTimer(10 * 60);
        this.otpInputSection?.classList.remove('hidden');
        this.sendOtpBtn?.classList.add('hidden');

        await this.sendLoginRequest(phone, this.currentOtp);
    }

    startOTPTimer(seconds) {
        clearInterval(this.otpTimerInterval);

        this.otpTimerInterval = setInterval(() => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;

            if (this.otpTimer) {
                this.otpTimer.textContent = `⏱️ ${mins}:${secs.toString().padStart(2, '0')}`;
            }

            if (seconds <= 0) {
                clearInterval(this.otpTimerInterval);
                if (this.otpTimer) {
                    this.otpTimer.textContent = '⏱️ OTP Expired';
                    this.otpTimer.classList.add('expired');
                }
                this.resendOtpBtn?.classList.remove('hidden');
            }

            seconds--;
        }, 1000);
    }

    async verifyOTP() {
        const enteredOtp = this.otpInput?.value?.trim();

        if (!enteredOtp || enteredOtp !== this.currentOtp) {
            this.showLoginStatus('❌ गलत OTP डाला है', 'error');
            return;
        }

        clearInterval(this.otpTimerInterval);
        this.showLoginStatus('✅ OTP सही है! Admin approval का इंतज़ार...', 'pending');
        this.checkLoginApproval();
    }

    async sendLoginRequest(phone, otp) {
        try {
            await fetch(`${API_URL}?action=deliveryBoyLoginRequest&phone=${phone}&otp=${otp}&deviceId=${this.deviceId}`);
            console.log('📤 Login request sent to admin');
        } catch (error) {
            console.log('⚠️ Login request error:', error);
        }
    }

    async checkLoginApproval() {
        const checkInterval = setInterval(async () => {
            try {
                const response = await fetch(`${API_URL}?action=checkLoginApproval&phone=${this.deliveryBoyPhone}`);
                const data = await response.json();

                if (data.success && data.approved) {
                    clearInterval(checkInterval);
                    this.deliveryBoyName = data.name || 'Delivery Boy';

                    localStorage.setItem('deliveryBoyPhone', this.deliveryBoyPhone);
                    localStorage.setItem('deliveryBoyName', this.deliveryBoyName);

                    this.showLoginStatus('✅ Approved! Login successful!', 'success');

                    if (data.loginCode) {
                        this.showLoginStatus(`✅ आपका Login Code: ${data.loginCode}`, 'success');
                    }

                    setTimeout(() => {
                        this.showMainApp();
                    }, 2000);
                }
            } catch (error) {
                console.log('⚠️ Check approval error:', error);
            }
        }, 3000);
    }

    // ============================================
    // SHOW MAIN APP
    // ============================================
    showMainApp() {
        this.loginScreen?.classList.add('hidden');
        this.mainApp?.classList.remove('hidden');

        const nameEl = document.getElementById('deliveryBoyName');
        if (nameEl) nameEl.textContent = this.deliveryBoyName;

        this.loginTime = new Date();
        const timeStr = this.loginTime.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });
        if (this.loginTimeEl) this.loginTimeEl.textContent = timeStr;

        this.loadAssignedOrders();
        this.loadStats();
        this.loadPaymentsData();

        this.statsInterval = setInterval(() => this.loadStats(), 30000);
        this.startLocationTracking();

        this.ordersRefreshInterval = setInterval(() => {
            this.loadAssignedOrders();
        }, 5000);

        this.blockCheckInterval = setInterval(() => {
            this.checkBlockedStatus();
        }, 5000);

        this.onlineStatusInterval = setInterval(() => {
            this.updateOnlineStatus();
        }, 5000);

        console.log('✅ Main app shown with auto-refresh');
    }

    // ============================================
    // 🆕 LOAD PAYMENTS DATA
    // ============================================
    async loadPaymentsData() {
        try {
            const response = await fetch(`${API_URL}?action=getPayments`);
            const data = await response.json();

            if (data.success && data.payments) {
                this.allPayments = data.payments;
                console.log('💳 Payments loaded:', this.allPayments.length);
            }
        } catch (error) {
            console.log('⚠️ Payments load error:', error);
        }
    }

    // ============================================
    // 🆕 GET PAYMENT INFO FOR ORDER
    // ============================================
    getPaymentInfo(orderId) {
        const payment = this.allPayments.find(p => p[1] === orderId);

        if (payment) {
            return {
                paymentId: payment[0] || '',
                orderId: payment[1] || '',
                phone: payment[2] || '',
                name: payment[3] || '',
                items: payment[4] || '',
                productAmount: payment[5] || '0',
                chargeAmount: payment[6] || '0',
                totalAmount: payment[7] || '0',
                method: payment[8] || '',
                time: payment[9] || '',
                status: payment[10] || 'Pending'
            };
        }

        return null;
    }

    // ============================================
    // 🆕 SHOW PAYMENT WARNING
    // ============================================
    showPaymentWarning(orderId) {
        const paymentInfo = this.getPaymentInfo(orderId);
        
        if (paymentInfo && paymentInfo.status !== 'Verified') {
            const message = this.getFunnyMessage('pendingPayment');
            document.getElementById('paymentWarningMessage').textContent = message;
            this.paymentWarningModal?.classList.remove('hidden');
            return true; // Warning shown
        }
        
        return false; // No warning needed
    }

    // ============================================
    // CHECK BLOCKED STATUS
    // ============================================
    async checkBlockedStatus() {
        if (!this.deliveryBoyPhone) return;

        try {
            const response = await fetch(`${API_URL}?action=checkDeliveryBoyBlocked&phone=${this.deliveryBoyPhone}`);
            const data = await response.json();

            if (data.success && data.blocked) {
                console.log('🚫 Delivery boy blocked by admin!');
                this.forceLogout(this.getFunnyMessage('blocked'));
            }
        } catch (error) {
            console.log('⚠️ Block check error:', error);
        }
    }

    // ============================================
    // UPDATE ONLINE STATUS
    // ============================================
    async updateOnlineStatus() {
        if (!this.deliveryBoyPhone) return;

        try {
            await fetch(`${API_URL}?action=updateDeliveryBoyOnlineStatus&phone=${this.deliveryBoyPhone}`);
        } catch (error) {
            console.log('⚠️ Online status update error:', error);
        }
    }

    // ============================================
    // FORCE LOGOUT
    // ============================================
    forceLogout(message) {
        if (this.blockCheckInterval) clearInterval(this.blockCheckInterval);
        if (this.onlineStatusInterval) clearInterval(this.onlineStatusInterval);
        if (this.ordersRefreshInterval) clearInterval(this.ordersRefreshInterval);
        if (this.statsInterval) clearInterval(this.statsInterval);

        this.stopLocationTracking();

        alert('🚫 ' + message);

        localStorage.removeItem('deliveryBoyPhone');
        localStorage.removeItem('deliveryBoyName');

        this.mainApp?.classList.add('hidden');
        this.loginScreen?.classList.remove('hidden');

        if (this.loginPhone) this.loginPhone.value = '';
        if (this.loginCodeInput) this.loginCodeInput.value = '';
        this.otpInputSection?.classList.add('hidden');
        this.sendOtpBtn?.classList.remove('hidden');
        this.loginCodeSection?.classList.remove('hidden');
        this.otpSection?.classList.add('hidden');

        this.showLoginStatus('🚫 ' + message, 'error');

        console.log('🚪 Force logout due to block');
    }

    // ============================================
    // LOAD STATS
    // ============================================
    async loadStats() {
        try {
            const response = await fetch(`${API_URL}?action=getDeliveryBoyStats`);
            const data = await response.json();

            if (data.success && data.stats) {
                const myStats = data.stats.find(s => s[0] === this.deliveryBoyPhone);

                if (myStats) {
                    if (this.totalDeliveriesEl) this.totalDeliveriesEl.textContent = myStats[6] || '0';
                    if (this.totalEarningsEl) this.totalEarningsEl.textContent = '₹' + (myStats[7] || '0');
                }
            }
        } catch (error) {
            console.log('⚠️ Load stats error:', error);
        }
    }

    showLoginStatus(message, type) {
        if (this.loginStatus) {
            this.loginStatus.textContent = message;
            this.loginStatus.className = 'login-status ' + type;
        }
    }

    // ============================================
    // LOGOUT SYSTEM
    // ============================================
    showLogoutModal() {
        this.logoutModal?.classList.remove('hidden');
    }

    async logout() {
        this.logoutModal?.classList.add('hidden');

        if (this.blockCheckInterval) clearInterval(this.blockCheckInterval);
        if (this.onlineStatusInterval) clearInterval(this.onlineStatusInterval);
        if (this.ordersRefreshInterval) clearInterval(this.ordersRefreshInterval);
        if (this.statsInterval) clearInterval(this.statsInterval);

        if (this.deliveryBoyPhone) {
            try {
                await fetch(`${API_URL}?action=deliveryBoyLogout&phone=${this.deliveryBoyPhone}`);
                console.log('📤 Logout saved to sheet');
            } catch (error) {
                console.log('⚠️ Logout save error:', error);
            }
        }

        this.stopLocationTracking();

        localStorage.removeItem('deliveryBoyPhone');
        localStorage.removeItem('deliveryBoyName');

        this.mainApp?.classList.add('hidden');
        this.loginScreen?.classList.remove('hidden');

        if (this.loginPhone) this.loginPhone.value = '';
        if (this.loginCodeInput) this.loginCodeInput.value = '';
        if (this.otpInput) this.otpInput.value = '';
        this.otpInputSection?.classList.add('hidden');
        this.sendOtpBtn?.classList.remove('hidden');
        this.loginCodeSection?.classList.remove('hidden');
        this.otpSection?.classList.add('hidden');

        console.log('🚪 Logged out');
        this.showFunnyToast('👋 फिर मिलेंगे! आराम करो! 😊');
    }

    // ============================================
    // ORDERS LOAD
    // ============================================
    async loadAssignedOrders() {
        try {
            const response = await fetch(`${API_URL}?action=getAssignedOrders&phone=${this.deliveryBoyPhone}`);
            const data = await response.json();

            if (data.success && data.orders) {
                this.displayOrders(data.orders);

                const badge = document.getElementById('ordersBadge');
                if (badge) badge.textContent = data.orders.length;
            }
        } catch (error) {
            console.log('⚠️ Load orders error:', error);
        }
    }

    displayOrders(orders) {
        const container = document.getElementById('assignedOrders');

        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">${this.getFunnyMessage('noOrders')}</div>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        orders.forEach(order => {
            const orderId = order[0] || 'N/A';
            const status = order[13] || 'Pending';
            const statusLower = status.toLowerCase();
            
            // 🆕 Payment Info
            const paymentInfo = this.getPaymentInfo(orderId);
            const paymentStatus = paymentInfo ? paymentInfo.status : 'Pending';
            const paymentMethod = paymentInfo ? paymentInfo.method : 'N/A';
            const paymentTotal = paymentInfo ? paymentInfo.totalAmount : order[8] || '0';

            const card = document.createElement('div');
            card.className = 'order-card';
            card.innerHTML = `
                <div class="order-card-header">
                    <span class="order-id">${orderId}</span>
                    <div>
                        <span class="order-status-badge ${statusLower}">${status}</span>
                        <span class="payment-badge payment-${paymentStatus.toLowerCase()}">💳 ${paymentStatus}</span>
                    </div>
                </div>
                
                <!-- 🆕 Payment Info Bar -->
                <div class="payment-info-bar payment-${paymentStatus.toLowerCase()}">
                    <span class="payment-info-left">
                        <span>💳 ${paymentMethod}</span>
                    </span>
                    <span class="payment-info-right">₹${paymentTotal}</span>
                </div>
                
                <div class="order-customer-info">
                    <span class="order-customer-name">👤 ${order[1] || 'N/A'}</span>
                    <span class="order-customer-address">📍 ${order[3] || 'N/A'}</span>
                    <span class="order-customer-address">🏠 ${order[4] || ''}</span>
                </div>
                <div class="order-total">💰 ₹${order[8] || '0'}</div>
                <div class="order-actions">
                    <button class="delivery-action-btn view-btn" onclick="deliveryBoyApp.viewOrderDetails('${orderId}')">📋</button>
                    <button class="delivery-action-btn call-btn" onclick="deliveryBoyApp.callCustomer('${order[2]}')">📞</button>
                    <button class="delivery-action-btn map-btn" onclick="deliveryBoyApp.openMapForOrder('${orderId}')">🗺️</button>
                    ${order[10] && order[11] ? `<button class="delivery-action-btn navigate-btn" onclick="deliveryBoyApp.openGoogleMapsNavigation('${orderId}')">🧭</button>` : ''}
                    ${status === 'Pending' ? `<button class="delivery-action-btn accept-btn" onclick="deliveryBoyApp.acceptOrder('${orderId}')" ${paymentStatus !== 'Verified' ? 'disabled' : ''}>✅ Accept</button>` : ''}
                    ${status === 'Confirmed' ? `<button class="delivery-action-btn delivered-btn" onclick="deliveryBoyApp.showDeliveredModal('${orderId}')">🚚 Delivered</button>` : ''}
                </div>
            `;
            container.appendChild(card);
        });
    }

    // ============================================
    // ORDER ACTIONS
    // ============================================
    async acceptOrder(orderId) {
        // 🆕 Payment check
        if (this.showPaymentWarning(orderId)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}?action=acceptOrder&orderId=${orderId}&phone=${this.deliveryBoyPhone}`);
            const data = await response.json();

            if (data.success) {
                console.log('✅ Order accepted:', orderId);
                this.showFunnyToast(this.getFunnyMessage('accept'));
                this.openMapForOrder(orderId);
                this.loadAssignedOrders();
            }
        } catch (error) {
            console.log('⚠️ Accept order error:', error);
        }
    }

    viewOrderDetails(orderId) {
        const modal = document.getElementById('orderDetailsModal');
        const body = document.getElementById('orderDetailsBody');

        fetch(`${API_URL}?action=getOrders`).then(r => r.json()).then(data => {
            if (data.success && data.orders) {
                const order = data.orders.find(o => o[0] === orderId);

                if (order) {
                    // 🆕 Payment Info
                    const paymentInfo = this.getPaymentInfo(orderId);
                    const paymentSection = paymentInfo ? `
                        <div class="payment-detail-section ${paymentInfo.status.toLowerCase()}">
                            <strong>💳 Payment Details</strong>
                            <div class="payment-detail-row">
                                <span class="payment-detail-label">Payment ID:</span>
                                <span class="payment-detail-value">${paymentInfo.paymentId}</span>
                            </div>
                            <div class="payment-detail-row">
                                <span class="payment-detail-label">Method:</span>
                                <span class="payment-detail-value">${paymentInfo.method}</span>
                            </div>
                            <div class="payment-detail-row">
                                <span class="payment-detail-label">Total Amount:</span>
                                <span class="payment-detail-value">₹${paymentInfo.totalAmount}</span>
                            </div>
                            <div class="payment-detail-row">
                                <span class="payment-detail-label">Status:</span>
                                <span class="payment-detail-value">${paymentInfo.status}</span>
                            </div>
                        </div>
                    ` : '';

                    body.innerHTML = `
                        ${paymentSection}
                        <div style="margin-bottom:10px;"><strong>Order ID:</strong> ${order[0]}</div>
                        <div style="margin-bottom:10px;"><strong>Customer:</strong> ${order[1]}</div>
                        <div style="margin-bottom:10px;"><strong>Phone:</strong> ${order[2]}</div>
                        <div style="margin-bottom:10px;"><strong>Address:</strong> ${order[3]}, ${order[4] || ''}, ${order[5] || ''}</div>
                        <div style="margin-bottom:10px;"><strong>Delivery Time:</strong> ${order[6] || 'N/A'}</div>
                        <div style="margin-bottom:10px;"><strong>Items:</strong><br>${(order[7] || '').replace(/\n/g, '<br>')}</div>
                        <div style="margin-bottom:10px;"><strong>Total:</strong> ₹${order[8]}</div>
                        <div style="margin-bottom:10px;"><strong>Status:</strong> ${order[13] || 'Pending'}</div>
                    `;
                } else {
                    body.innerHTML = '<p>Order नहीं मिला</p>';
                }
            }
        });

        modal.classList.remove('hidden');
    }

    callCustomer(phone) {
        window.open(`tel:${phone}`);
    }

    showDeliveredModal(orderId) {
        this.currentOrderId = orderId;
        document.getElementById('deliveredModal').classList.remove('hidden');
    }

    async markDelivered() {
        if (!this.currentOrderId) return;

        try {
            const response = await fetch(`${API_URL}?action=updateStatus&orderId=${this.currentOrderId}&status=Delivered`);
            const data = await response.json();

            if (data.success) {
                document.getElementById('deliveredModal').classList.add('hidden');
                this.closeMap();
                this.loadAssignedOrders();
                this.loadStats();
                this.showFunnyToast(this.getFunnyMessage('delivered'));
            }
        } catch (error) {
            console.log('⚠️ Mark delivered error:', error);
        }
    }

    // ============================================
    // LOCATION TRACKING
    // ============================================
    startLocationTracking() {
        if (navigator.geolocation) {
            this.locationWatchId = navigator.geolocation.watchPosition(
                (position) => {
                    this.currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.updateLocationInSheet();
                },
                (error) => {
                    console.log('⚠️ Location error:', error);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 5000,
                    timeout: 10000
                }
            );
        }
    }

    stopLocationTracking() {
        if (this.locationWatchId) {
            navigator.geolocation.clearWatch(this.locationWatchId);
            this.locationWatchId = null;
        }
    }

    async updateLocationInSheet() {
        if (!this.currentLocation || !this.currentOrderId) return;

        try {
            await fetch(`${API_URL}?action=updateRiderLocation&orderId=${this.currentOrderId}&lat=${this.currentLocation.lat}&lng=${this.currentLocation.lng}`);
        } catch (error) {
            console.log('⚠️ Location update error:', error);
        }
    }

    // ============================================
    // MAP FUNCTIONS
    // ============================================
    openMapForOrder(orderId) {
        this.currentOrderId = orderId;

        const mapTab = document.querySelector('[data-tab="map"]');
        this.switchTab(mapTab);

        setTimeout(() => {
            this.initMap();
        }, 300);
    }

    async openGoogleMapsNavigation(orderId) {
        try {
            const response = await fetch(`${API_URL}?action=getOrders`);
            const data = await response.json();

            if (data.success && data.orders) {
                const order = data.orders.find(o => o[0] === orderId);

                if (order && order[10] && order[11]) {
                    const customerLat = order[10];
                    const customerLng = order[11];

                    if (this.currentLocation) {
                        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${this.currentLocation.lat},${this.currentLocation.lng}&destination=${customerLat},${customerLng}&travelmode=driving`;
                        window.open(mapsUrl, '_blank');
                        console.log('🗺️ Google Maps Navigation opened');
                    } else {
                        const mapsUrl = `https://www.google.com/maps?q=${customerLat},${customerLng}`;
                        window.open(mapsUrl, '_blank');
                        console.log('🗺️ Google Maps opened (customer location)');
                    }
                } else {
                    alert('📍 Customer की location नहीं मिली');
                }
            }
        } catch (error) {
            console.log('⚠️ Map navigation error:', error);
            alert('🗺️ Map खोलने में error आया');
        }
    }

    initMap() {
        if (this.currentMap) {
            this.currentMap.remove();
        }

        this.currentMap = L.map('deliveryMap').setView([27.6667496, 77.7124673], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(this.currentMap);

        L.marker([27.6667496, 77.7124673])
            .bindPopup('🏪 Quick Dukan')
            .addTo(this.currentMap);

        if (this.currentLocation) {
            L.marker([this.currentLocation.lat, this.currentLocation.lng])
                .bindPopup('🛵 आप यहाँ हैं')
                .addTo(this.currentMap);
        }

        this.loadCustomerLocation();
    }

    async loadCustomerLocation() {
        try {
            const response = await fetch(`${API_URL}?action=getOrders`);
            const data = await response.json();

            if (data.success && data.orders) {
                const order = data.orders.find(o => o[0] === this.currentOrderId);

                if (order && order[10] && order[11]) {
                    const customerLat = parseFloat(order[10]);
                    const customerLng = parseFloat(order[11]);

                    L.marker([customerLat, customerLng])
                        .bindPopup('📍 Customer')
                        .addTo(this.currentMap);

                    const bounds = L.latLngBounds(
                        [27.6667496, 77.7124673],
                        [customerLat, customerLng]
                    );
                    this.currentMap.fitBounds(bounds, { padding: [50, 50] });

                    const distance = this.calculateDistance(27.6667496, 77.7124673, customerLat, customerLng);
                    const eta = Math.round(distance * 5);

                    document.querySelector('.map-info-distance').textContent = `📍 ${distance.toFixed(1)} km`;
                    document.querySelector('.map-info-eta').textContent = `⏱️ ~${eta} min`;
                }
            }
        } catch (error) {
            console.log('⚠️ Load customer location error:', error);
        }
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    closeMap() {
        if (this.currentMap) {
            this.currentMap.remove();
            this.currentMap = null;
        }
    }

    switchTab(tab) {
        document.querySelectorAll('.delivery-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        tab.classList.add('active');

        const tabName = tab.getAttribute('data-tab');
        document.getElementById(tabName + 'Tab').classList.add('active');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.deliveryBoyApp = new DeliveryBoyApp();
});