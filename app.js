// ===== إعدادات Supabase (سنعمرها لاحقاً) =====
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_KEY = "YOUR_ANON_KEY";

let supabaseClient = null;
let productsData = [];
let cart = [];

// ===== التشغيل =====
document.addEventListener('DOMContentLoaded', async () => {
    // تهيئة Supabase
    if (typeof supabase !== 'undefined' && SUPABASE_URL !== "https://YOUR_PROJECT.supabase.co") {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        await loadProductsFromSupabase();
    } else {
        // بيانات تجريبية (قبل ربط Supabase)
        loadDemoProducts();
    }

    setupEventListeners();
});

// ===== تحميل المنتجات من Supabase =====
async function loadProductsFromSupabase() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        productsData = data || [];
        renderProducts('all');
        buildCategories();
    } catch (err) {
        console.error('خطأ في تحميل المنتجات:', err);
        document.getElementById('mainContent').innerHTML = 
            '<div class="loading">❌ خطأ في تحميل المنتجات</div>';
    }
}

// ===== بيانات تجريبية (مؤقتاً) =====
function loadDemoProducts() {
    productsData = [
        { id: 1, name: "تي شيرت أسود", category: "T-Shirt", emoji: "👕", sizes: "S, M, L", colors: "Noir, Blanc", price: 5800 },
        { id: 2, name: "تي شيرت أزرق", category: "T-Shirt", emoji: "👕", sizes: "M, L", colors: "Bleu", price: 7800 },
        { id: 3, name: "تي شيرت أبيض", category: "T-Shirt", emoji: "👕", sizes: "M, L, XL", colors: "Blanc", price: 5800 },
        { id: 4, name: "Bas Loewe China", category: "Bas", emoji: "👖", sizes: "31, 32, 33, 34", colors: "Bleu, Noir", price: 6800 },
        { id: 5, name: "Bas Sport", category: "Bas", emoji: "👖", sizes: "31, 32, 33", colors: "Noir, Gris", price: 5800 },
        { id: 6, name: "حذاء رياضي", category: "Baskets", emoji: "👟", sizes: "40, 41, 43", colors: "Noir, Rouge", price: 13800 },
        { id: 7, name: "قميص أزرق", category: "Chemises", emoji: "👔", sizes: "M, XL, XXL", colors: "Bleu ciel", price: 4800 },
        { id: 8, name: "طقم أسود", category: "Ensemble", emoji: "🧥", sizes: "M, L, XL", colors: "Noir, Rose", price: 8800 },
        { id: 9, name: "Polo أبيض", category: "Polo", emoji: "👕", sizes: "M, L", colors: "Blanc", price: 5800 },
        { id: 10, name: "شورت صيفي", category: "Shorts", emoji: "🩳", sizes: "M, L, XL", colors: "Noir, Bleu", price: 5800 }
    ];
    renderProducts('all');
    buildCategories();
}

// ===== بناء التصنيفات تلقائياً =====
function buildCategories() {
    const categories = [...new Set(productsData.map(p => p.category))];
    const bar = document.getElementById('categoriesBar');
    
    bar.innerHTML = '<button class="active" data-category="all">الكل</button>';
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.textContent = cat;
        btn.setAttribute('data-category', cat);
        bar.appendChild(btn);
    });

    // ربط الأحداث
    bar.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            bar.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderProducts(btn.getAttribute('data-category'));
        });
    });
}

// ===== رسم المنتجات =====
function renderProducts(category = 'all') {
    const container = document.getElementById('mainContent');
    container.innerHTML = '';

    const filtered = category === 'all' 
        ? productsData 
        : productsData.filter(p => p.category === category);

    if (filtered.length === 0) {
        container.innerHTML = '<div class="loading">لا توجد منتجات</div>';
        return;
    }

    const title = document.createElement('div');
    title.className = 'section-title';
    title.innerHTML = `${category === 'all' ? 'جميع المنتجات' : category} <span>${filtered.length}</span>`;
    container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'products';

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const imageContent = p.image_url 
            ? `<img src="${p.image_url}" alt="${p.name}">`
            : `${p.emoji || '📦'}`;

        card.innerHTML = `
            <div class="product-image">
                ${imageContent}
                <span class="variants-badge">Variantes</span>
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <div class="variants">Sizes: ${p.sizes || '-'}</div>
                <div class="price">${p.price.toLocaleString()} دج</div>
            </div>
        `;
        card.addEventListener('click', () => addToCart(p));
        grid.appendChild(card);
    });

    container.appendChild(grid);
}

// ===== السلة =====
function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCart();
    showToast(`✅ تمت إضافة ${product.name}`);
}

function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartCount = document.getElementById('cartCount');
    const cartCountBadge = document.getElementById('cartCountBadge');

    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = totalItems;
    cartCountBadge.textContent = totalItems;

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">السلة فارغة 🛒</div>';
        cartFooter.style.display = 'none';
        return;
    }

    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.qty;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.emoji || '📦'} ${item.name}</h4>
                <div class="details">Size: ${(item.sizes || '-').split(',')[0]}</div>
            </div>
            <div class="cart-item-actions">
                <div class="qty-control">
                    <button onclick="changeQty(${item.id}, -1)">−</button>
                    <span class="qty">${item.qty}</span>
                    <button onclick="changeQty(${item.id}, 1)">+</button>
                </div>
                <div class="cart-item-price">${(item.price * item.qty).toLocaleString()} دج</div>
                <button class="delete-btn" onclick="removeFromCart(${item.id})">🗑</button>
            </div>
        `;
        cartItems.appendChild(div);
    });

    document.getElementById('itemsCount').textContent = totalItems;
    document.getElementById('cartTotal').textContent = total.toLocaleString() + ' دج';
    document.getElementById('checkoutTotal').textContent = total.toLocaleString() + ' دج ›';
    cartFooter.style.display = 'block';
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    updateCart();
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    updateCart();
}

// ===== Toast =====
let toastTimeout;
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ===== الأحداث =====
function setupEventListeners() {
    // السلة
    const cartPanel = document.getElementById('cartPanel');
    const cartOverlay = document.getElementById('cartOverlay');

    document.getElementById('cartBtn').addEventListener('click', () => {
        cartPanel.classList.add('open');
        cartOverlay.classList.add('open');
    });

    document.getElementById('closeCart').addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    function closeCart() {
        cartPanel.classList.remove('open');
        cartOverlay.classList.remove('open');
    }

    // البحث
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        document.querySelectorAll('.product-card').forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            card.style.display = name.includes(query) ? 'block' : 'none';
        });
    });

    // الترتيب
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        const value = e.target.value;
        let sorted = [...productsData];
        
        if (value === 'price-asc') sorted.sort((a, b) => a.price - b.price);
        else if (value === 'price-desc') sorted.sort((a, b) => b.price - a.price);
        else if (value === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

        const original = productsData;
        productsData = sorted;
        renderProducts('all');
        productsData = original;
    });

    // Commander
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (cart.length === 0) return;
        showToast('📞 سيتم التواصل معك قريباً');
    });
}