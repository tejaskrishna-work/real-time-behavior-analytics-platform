const state = {
  products: [],
  filteredProducts: [],
  cart: []
};

const productGrid = document.getElementById("productGrid");
const productDetailSection = document.getElementById("productDetailSection");
const productDetail = document.getElementById("productDetail");
const productListSection = document.getElementById("productListSection");
const cartSection = document.getElementById("cartSection");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");
const statusBar = document.getElementById("statusBar");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const cartBtn = document.getElementById("cartBtn");
const backBtn = document.getElementById("backBtn");
const checkoutBtn = document.getElementById("checkoutBtn");
const heroBrowseBtn = document.getElementById("heroBrowseBtn");
const heroCartBtn = document.getElementById("heroCartBtn");

function setStatus(message) {
  statusBar.innerHTML = `<span>${message}</span>`;
}

function formatPrice(value) {
  return `₹${value}`;
}

function updateCartCount() {
  cartCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function getCartTotal() {
  return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function renderProducts(products) {
  productGrid.innerHTML = "";

  if (!products.length) {
    productGrid.innerHTML = "<p>No products found.</p>";
    return;
  }

  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <div class="product-card-content">
        <h3>${product.name}</h3>
        <div class="category">${product.category}</div>
        <div class="price">${formatPrice(product.price)}</div>
        <div class="card-actions">
          <button class="view-btn" data-id="${product.id}">View</button>
          <button class="add-btn" data-id="${product.id}">Add to Cart</button>
        </div>
      </div>
    `;

    productGrid.appendChild(card);
  });

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => openProduct(btn.dataset.id));
  });

  document.querySelectorAll(".add-btn").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.dataset.id));
  });
}

async function loadProducts() {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error(`Failed to load products: ${response.status}`);
    }

    const products = await response.json();
    state.products = products;
    state.filteredProducts = products;

    renderProducts(products);
    setStatus(`Loaded ${products.length} products successfully.`);

    window.Analytics.track("view_product_list", {
      count: products.length
    });
  } catch (error) {
    setStatus(`Product load failed: ${error.message}`);
  }
}

async function openProduct(id) {
  try {
    const response = await fetch(`/api/products/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to load product ${id}`);
    }

    const product = await response.json();

    productListSection.classList.add("hidden");
    cartSection.classList.add("hidden");
    productDetailSection.classList.remove("hidden");

    productDetail.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <h2>${product.name}</h2>
      <p><strong>Category:</strong> ${product.category}</p>
      <p><strong>Price:</strong> ${formatPrice(product.price)}</p>
      <p>${product.description}</p>
      <button id="detailAddBtn">Add to Cart</button>
    `;

    document.getElementById("detailAddBtn").addEventListener("click", () => {
      addToCart(product.id);
    });

    window.Analytics.track("view_product", {
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price
    });
  } catch (error) {
    setStatus(`Could not open product: ${error.message}`);
  }
}

function addToCart(productId) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;

  const existing = state.cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }

  updateCartCount();
  renderCart();

  window.Analytics.track("add_to_cart", {
    productId: product.id,
    productName: product.name,
    category: product.category,
    price: product.price,
    quantity: 1
  });

  setStatus(`${product.name} added to cart.`);
}

function removeFromCart(productId) {
  const existing = state.cart.find((item) => item.id === productId);
  if (!existing) return;

  state.cart = state.cart.filter((item) => item.id !== productId);

  updateCartCount();
  renderCart();

  window.Analytics.track("remove_from_cart", {
    productId: existing.id,
    productName: existing.name,
    price: existing.price,
    removedQuantity: existing.quantity
  });

  setStatus(`${existing.name} removed from cart.`);
}

function renderCart() {
  if (!state.cart.length) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
    cartTotal.textContent = "Total: ₹0";
    return;
  }

  cartItems.innerHTML = "";

  state.cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-item";

    row.innerHTML = `
      <div>
        <div><strong>${item.name}</strong></div>
        <div>Qty: ${item.quantity}</div>
        <div>${formatPrice(item.price)} each</div>
      </div>
      <div>
        <div><strong>${formatPrice(item.price * item.quantity)}</strong></div>
        <button data-id="${item.id}">Remove</button>
      </div>
    `;

    cartItems.appendChild(row);
  });

  cartItems.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => removeFromCart(btn.dataset.id));
  });

  cartTotal.textContent = `Total: ${formatPrice(getCartTotal())}`;
}

function showCart() {
  productListSection.classList.add("hidden");
  productDetailSection.classList.add("hidden");
  cartSection.classList.remove("hidden");

  renderCart();

  window.Analytics.track("view_cart", {
    itemCount: state.cart.reduce((sum, item) => sum + item.quantity, 0),
    total: getCartTotal()
  });
}

function showProductList() {
  productDetailSection.classList.add("hidden");
  cartSection.classList.add("hidden");
  productListSection.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function performSearch() {
  const term = searchInput.value.trim().toLowerCase();

  const filtered = state.products.filter((product) => {
    return (
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term)
    );
  });

  state.filteredProducts = filtered;
  showProductList();
  renderProducts(filtered);

  window.Analytics.track("search", {
    query: term,
    resultCount: filtered.length
  });

  setStatus(`Search completed. Found ${filtered.length} products.`);
}

async function checkout() {
  if (!state.cart.length) {
    alert("Cart is empty.");
    return;
  }

  window.Analytics.track("checkout_started", {
    itemCount: state.cart.reduce((sum, item) => sum + item.quantity, 0),
    total: getCartTotal()
  });

  const purchasedItems = state.cart.map((item) => ({
    productId: item.id,
    productName: item.name,
    category: item.category,
    quantity: item.quantity,
    price: item.price
  }));

  const total = getCartTotal();

  state.cart = [];
  updateCartCount();
  renderCart();

  window.Analytics.track("purchase_completed", {
    orderId: `order_${Date.now()}`,
    total,
    items: purchasedItems
  });

  alert("Purchase completed (demo).");
  setStatus("Purchase completed and analytics sent.");
}

function bindEvents() {
  searchBtn.addEventListener("click", performSearch);

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      performSearch();
    }
  });

  cartBtn.addEventListener("click", showCart);
  heroCartBtn.addEventListener("click", showCart);
  heroBrowseBtn.addEventListener("click", showProductList);
  backBtn.addEventListener("click", showProductList);
  checkoutBtn.addEventListener("click", checkout);
}

async function init() {
  bindEvents();

  window.Analytics.track("view_home", {
    page: "home"
  });

  await loadProducts();
}

init();