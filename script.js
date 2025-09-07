// CART ARRAY
let cart = [];

// HEADER SCROLL
let lastScroll = 0;
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  if (currentScroll > lastScroll && currentScroll > 100) header.classList.add('hide');
  else header.classList.remove('hide');
  lastScroll = currentScroll;
});

// LOAD CART
window.onload = () => {
  const savedCart = localStorage.getItem('phantomvi_cart');
  if (savedCart) { cart = JSON.parse(savedCart); updateCartUI(); }
};

// HELPER: GET UNIT PRICE BASED ON RULES
function getUnitPrice(item) {
  if (item.type === 'Wine') return item.qty > 50 ? 65 : 75;
  if (item.type === 'Gin' || item.type === 'Vodka') return item.qty > 50 ? 140 : 165;
  return 0;
}

// ADD PRODUCT
function addToCart(type) {
  let sel, qty, variant;
  if (type === 'Wine') { sel = document.getElementById('wineType'); qty = parseInt(document.getElementById('wineQty').value); variant = sel.value; }
  else if (type === 'Gin') { sel = document.getElementById('ginType'); qty = parseInt(document.getElementById('ginQty').value); variant = sel.value; }
  else if (type === 'Vodka') { sel = document.getElementById('vodkaType'); qty = parseInt(document.getElementById('vodkaQty').value); variant = sel.value; }

  if (!variant) { alert(`Please select a ${type}`); return; }
  if (!qty || qty <= 0) { alert('Please enter a valid quantity'); return; }

  showLoading(true);
  setTimeout(() => {
    const existingIndex = cart.findIndex(item => item.type === type && item.variant === variant);
    if (existingIndex >= 0) cart[existingIndex].qty += qty;
    else cart.push({ type, variant, qty });

    saveCart(); updateCartUI(); clearInputs(type); showLoading(false);
  }, 500);
}

// CLEAR INPUTS
function clearInputs(type) {
  if (type === 'Wine') { document.getElementById('wineType').value = ''; document.getElementById('wineQty').value = ''; }
  else if (type === 'Gin') { document.getElementById('ginType').value = ''; document.getElementById('ginQty').value = ''; }
  else if (type === 'Vodka') { document.getElementById('vodkaType').value = ''; document.getElementById('vodkaQty').value = ''; }
}

// LOADING
function showLoading(show) { document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none'; }

// UPDATE CART UI
function updateCartUI() {
  const cartItemsEl = document.getElementById('cartItems');
  const courierFeeEl = document.getElementById('courierFee');
  const totalCostEl = document.getElementById('totalCost');
  const whatsappBtn = document.getElementById('whatsappBtn');
  const emptyCartMessage = document.getElementById('emptyCartMessage');

  cartItemsEl.innerHTML = '';

  if (cart.length === 0) {
    emptyCartMessage.style.display = 'block';
    whatsappBtn.style.pointerEvents = 'none';
    whatsappBtn.style.opacity = '0.5';
    whatsappBtn.href = '#';
    courierFeeEl.textContent = 'R0';
    totalCostEl.textContent = 'R0';
    return;
  } else {
    emptyCartMessage.style.display = 'none';
    whatsappBtn.style.pointerEvents = 'auto';
    whatsappBtn.style.opacity = '1';
  }

  let total = 0;
  let totalQty = 0;

  cart.forEach((item, index) => {
    const pricePerUnit = getUnitPrice(item);
    const itemTotal = pricePerUnit * item.qty;
    total += itemTotal;
    totalQty += item.qty;

    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.marginBottom = '8px';
    li.innerHTML = `
      <span>${item.qty} x ${item.variant} ${item.type} (R${pricePerUnit} each) - R${itemTotal}</span>
      <button class="remove-btn" data-index="${index}" style="
        background: #90284d;
        border: none;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        padding: 4px 8px;
        font-size: 14px;
      ">Remove</button>
    `;
    cartItemsEl.appendChild(li);
  });

  // COURIER FEE
  let courierFee = 0;
  if (totalQty > 0) { courierFee = 180; if (totalQty > 2) courierFee += (totalQty - 2) * 15; }

  const grandTotal = total + courierFee;
  courierFeeEl.textContent = `R${courierFee}`;
  totalCostEl.textContent = `R${grandTotal}`;

  // WHATSAPP MESSAGE
  let message = `Hello, I have placed an order with Phantom VI:%0A%0A`;
  cart.forEach(item => {
    const pricePerUnit = getUnitPrice(item);
    message += `${item.qty} x ${item.variant} ${item.type} (R${pricePerUnit} each) - R${pricePerUnit*item.qty}%0A`;
  });
  message += `%0ACourier Fee: R${courierFee}%0ATotal: R${grandTotal}%0A%0APlease find my sticker labels and delivery address below.`;

  whatsappBtn.href = `https://wa.me/27814458910?text=${message}`;

  // REMOVE ITEM
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', e => removeFromCart(parseInt(e.target.dataset.index)));
  });
}

// REMOVE
function removeFromCart(index) {
  if (index >= 0 && index < cart.length) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
  }
}

// SAVE CART
function saveCart() { localStorage.setItem('phantomvi_cart', JSON.stringify(cart)); }
