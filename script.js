// =======================
// PHANTOM VI COMPLETE ENGINE
// =======================

const CONFIG = {
  STORAGE: 'phantom_cart',
  WHATSAPP: '27814458910',
  PAYMENT: 'https://pay.ikhokha.com/phantomvi/mpr/vi'
};

// --- PRICES ---
const PRICES = {
  Wine: {
    "Sweet Rosé": 75,
    "Shiraz": 85,
    "Sauvignon Blanc": 75,
    "Pinotage": 85,
    "Sweet White": 75,
    "Sweet Red": 75,
    "Chenin Blanc": 75,
    "Chardonnay": 85,
    "Cabernet Sauvignon": 95,
    "Merlot": 90,
    "Coffee Pinotage": 95,
    "Non-Alcoholic Wine": 125
  },
  Gin: 165,
  Vodka: 165,
  LabelDesign: 500,
  InsurancePer20: 120,
  Barcode: 500
};

let cart = [];
let addons = {
  label: false,
  insurance: false,
  barcode: 0
};

// --- HELPERS ---
const $ = id => document.getElementById(id);

function save() {
  localStorage.setItem(CONFIG.STORAGE, JSON.stringify({ cart, addons }));
}

function load() {
  const data = JSON.parse(localStorage.getItem(CONFIG.STORAGE));
  if (data) {
    cart = data.cart || [];
    addons = data.addons || addons;
  }
}

// --- CART ---
function addToCart(type) {
  let variant, qty;

  if (type === 'Wine') {
    variant = $('wineType').value;
    qty = +$('wineQty').value;
  }

  if (type === 'Gin') {
    variant = $('ginType').value;
    qty = +$('ginQty').value;
  }

  if (type === 'Vodka') {
    variant = $('vodkaType').value;
    qty = +$('vodkaQty').value;
  }

  if (!variant) return alert('Select product');
  if (!qty || qty <= 0) return alert('Enter quantity');

  const item = cart.find(i => i.type === type && i.variant === variant);

  if (item) item.qty += qty;
  else cart.push({ type, variant, qty });

  save();
  render();
}

function updateQty(i, change) {
  cart[i].qty += change;
  if (cart[i].qty <= 0) cart.splice(i, 1);

  save();
  render();
}

// --- TOTALS ---
function itemTotal() {
  return cart.reduce((sum, i) => {
    const price = i.type === 'Wine' ? PRICES.Wine[i.variant] : PRICES[i.type];
    return sum + price * i.qty;
  }, 0);
}

function bottleCount() {
  return cart.reduce((sum, i) => sum + i.qty, 0);
}

function insuranceCost() {
  if (!addons.insurance) return 0;
  return Math.ceil(bottleCount() / 20) * PRICES.InsurancePer20;
}

function addonsTotal() {
  return (addons.label ? PRICES.LabelDesign : 0)
       + insuranceCost()
       + addons.barcode * PRICES.Barcode;
}

function grandTotal() {
  return itemTotal() + addonsTotal();
}

// --- RENDER ---
function render() {
  const list = $('cartItems');

  if (cart.length === 0) {
    $('emptyCartMessage').style.display = 'block';
    list.innerHTML = '';
  } else {
    $('emptyCartMessage').style.display = 'none';

    list.innerHTML = cart.map((i, idx) => {
      const price = i.type === 'Wine'
        ? PRICES.Wine[i.variant]
        : PRICES[i.type];

      return `
        <li>
          ${i.variant} (${i.type}) - R${price}
          <button onclick="updateQty(${idx}, -1)">-</button>
          ${i.qty}
          <button onclick="updateQty(${idx}, 1)">+</button>
        </li>
      `;
    }).join('');
  }

  $('barcodeCount').textContent = addons.barcode;
  $('grandTotal').textContent = `R${grandTotal()}`;

  updateButtons();
}

// --- ADDONS ---
$('addonLabelDesign').onclick = () => {
  addons.label = !addons.label;
  save(); render();
};

$('addonInsurance').onclick = () => {
  addons.insurance = !addons.insurance;
  save(); render();
};

$('barcodePlus').onclick = () => {
  addons.barcode++;
  save(); render();
};

$('barcodeMinus').onclick = () => {
  if (addons.barcode > 0) addons.barcode--;
  save(); render();
};

// --- CUSTOMER ---
function validCustomer() {
  return $('custName').value &&
         $('custPhone').value &&
         $('custAddress').value;
}

// --- WHATSAPP ---
function buildWhatsApp() {
  let msg = "PHANTOM VI ORDER:%0A";

  cart.forEach(i => {
    msg += `${i.qty} x ${i.variant}%0A`;
  });

  if (addons.label) msg += "Label Design%0A";
  if (addons.insurance) msg += "Insurance Included%0A";
  if (addons.barcode) msg += `Barcodes: ${addons.barcode}%0A`;

  msg += `%0ATotal: R${grandTotal()}%0A`;

  return `https://wa.me/${CONFIG.WHATSAPP}?text=${msg}`;
}

// --- BUTTON CONTROL ---
function updateButtons() {
  const active = cart.length && validCustomer();

  $('ikhokhaBtn').disabled = !active;
  $('ikhokhaBtn').onclick = active
    ? () => window.location.href = CONFIG.PAYMENT
    : null;

  $('whatsappBtn').href = active ? buildWhatsApp() : '#';
}

// --- INIT ---
function init() {
  load();
  render();

  ['custName','custPhone','custAddress'].forEach(id => {
    $(id).addEventListener('input', updateButtons);
  });
}

init();
