const cartItems = [];
const prices = { Wine: 75, Gin: 165, Vodka: 165 };

function addToCart(type) {
  let productType, qty, sel;
  if (type === 'Wine') {
    sel = document.getElementById('wineType');
    productType = sel.value;
    qty = parseInt(document.getElementById('wineQty').value);
  } else if (type === 'Gin') {
    sel = document.getElementById('ginType');
    productType = sel.value;
    qty = parseInt(document.getElementById('ginQty').value);
  } else if (type === 'Vodka') {
    sel = document.getElementById('vodkaType');
    productType = sel.value;
    qty = parseInt(document.getElementById('vodkaQty').value);
  }

  if (!productType) {
    alert('Please select a ' + type + ' type.');
    return;
  }
  if (!qty || qty <= 0) {
    alert('Please enter a valid quantity.');
    return;
  }

  const existingIndex = cartItems.findIndex(
    item => item.type === type && item.variant === productType
  );

  if (existingIndex >= 0) {
    cartItems[existingIndex].qty += qty;
  } else {
    cartItems.push({ type, variant: productType, qty });
  }

  updateCartUI();
  clearInputs(type);
}

function clearInputs(type) {
  if (type === 'Wine') {
    document.getElementById('wineQty').value = '';
    document.getElementById('wineType').value = '';
  } else if (type === 'Gin') {
    document.getElementById('ginQty').value = '';
    document.getElementById('ginType').value = '';
  } else if (type === 'Vodka') {
    document.getElementById('vodkaQty').value = '';
    document.getElementById('vodkaType').value = '';
  }
}

function updateCartUI() {
  const ul = document.getElementById('cartItems');
  ul.innerHTML = '';
  let total = 0;
  let totalQty = 0;

  cartItems.forEach((item, index) => {
    const itemTotal = prices[item.type] * item.qty;
    total += itemTotal;
    totalQty += item.qty;

    const li = document.createElement('li');
    li.style.marginBottom = '10px';

    li.innerHTML = `
      <strong>${item.qty}</strong> x ${item.variant} ${item.type} (R${prices[item.type]} each) = R${itemTotal}
      <button onclick="changeQuantity(${index}, -1)" style="margin-left:10px;">-</button>
      <button onclick="changeQuantity(${index}, 1)">+</button>
      <button onclick="removeItem(${index})" style="margin-left:10px; color:red;">Remove</button>
    `;

    ul.appendChild(li);
  });

  // Courier fee: R180 for 2 bottles + R12 for each extra bottle
  let courierFee = 0;
  if (totalQty > 0) {
    courierFee = 180;
    if (totalQty > 2) {
      courierFee += (totalQty - 2) * 12;
    }
  }

  document.getElementById('courierFee').textContent = `R${courierFee}`;
  const totalCost = total + courierFee;
  document.getElementById('totalCost').textContent = `R${totalCost}`;

  const whatsappBtn = document.getElementById('whatsappBtn');
  if (totalCost === 0) {
    whatsappBtn.href = '#';
    whatsappBtn.style.pointerEvents = 'none';
    whatsappBtn.style.opacity = '0.5';
    whatsappBtn.title = 'Add items to cart first';
  } else {
    whatsappBtn.style.pointerEvents = 'auto';
    whatsappBtn.style.opacity = '1';
    whatsappBtn.title = 'Send order details via WhatsApp';

    let message = 'Hello, I would like to place an order with Phantom VI:%0A%0A';
    cartItems.forEach(item => {
      message += `${item.qty} x ${item.variant} ${item.type} (R${prices[item.type]} each)%0A`;
    });
    message += `%0ACourier Fee: R${courierFee}%0ATotal: R${totalCost}%0A%0A`;
    message += 'Please find my sticker labels and delivery address below:%0A';

    const phoneNumber = '27814458910'; // South Africa +27 81 445 8910
    const encodedMsg = encodeURIComponent(message);
    whatsappBtn.href = `https://wa.me/${phoneNumber}?text=${encodedMsg}`;
  }
}

function changeQuantity(index, delta) {
  if (!cartItems[index]) return;
  cartItems[index].qty += delta;
  if (cartItems[index].qty <= 0) {
    cartItems.splice(index, 1); // Remove if qty <= 0
  }
  updateCartUI();
}

function removeItem(index) {
  if (!cartItems[index]) return;
  cartItems.splice(index, 1);
  updateCartUI();
}
