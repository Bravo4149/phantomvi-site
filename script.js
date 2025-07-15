let cartItems = [];
const prices = { Wine: 75, Gin: 165, Vodka: 165 };

function addToCart(type) {
  let productType, qty, sel, qtyInput, button;

  if (type === 'Wine') {
    sel = document.getElementById('wineType');
    qtyInput = document.getElementById('wineQty');
  } else if (type === 'Gin') {
    sel = document.getElementById('ginType');
    qtyInput = document.getElementById('ginQty');
  } else if (type === 'Vodka') {
    sel = document.getElementById('vodkaType');
    qtyInput = document.getElementById('vodkaQty');
  }

  productType = sel.value;
  qty = parseInt(qtyInput.value);
  button = qtyInput.nextElementSibling;

  if (!productType) {
    alert('Please select a ' + type + ' type.');
    return;
  }
  if (!qty || qty <= 0) {
    alert('Please enter a valid quantity.');
    return;
  }

  // Add loading effect
  button.classList.add('button-loading');
  button.disabled = true;

  setTimeout(() => {
    // Check if already exists
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

    // Remove loading effect
    button.classList.remove('button-loading');
    button.disabled = false;
  }, 500); // Short delay to show loader
}

function clearInputs(type) {
  if(type === 'Wine'){
    document.getElementById('wineQty').value = '';
    document.getElementById('wineType').value = '';
  } else if(type === 'Gin'){
    document.getElementById('ginQty').value = '';
    document.getElementById('ginType').value = '';
  } else if(type === 'Vodka'){
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
    const li = document.createElement('li');
    li.innerHTML = `${item.qty} x ${item.variant} ${item.type} (R${prices[item.type]} each)
      <button onclick="removeFromCart(${index})" style="margin-left: 10px; background: #ccc; border: none; padding: 2px 6px; cursor: pointer;">-</button>`;
    ul.appendChild(li);
    total += prices[item.type] * item.qty;
    totalQty += item.qty;
  });

  const courierFee = totalQty <= 2 && totalQty > 0 ? 180 : totalQty > 2 ? 180 + (totalQty - 2) * 12 : 0;
  document.getElementById('courierFee').textContent = `R${courierFee}`;

  const totalCost = total + courierFee;
  document.getElementById('totalCost').textContent = `R${totalCost}`;

  const whatsappBtn = document.getElementById('whatsappBtn');
  if (totalCost === 0) {
    whatsappBtn.href = '#';
    whatsappBtn.style.pointerEvents = 'none';
    whatsappBtn.style.opacity = '0.5';
    whatsappBtn.title = "Add items to cart first";
  } else {
    whatsappBtn.style.pointerEvents = 'auto';
    whatsappBtn.style.opacity = '1';
    whatsappBtn.title = "Send order details via WhatsApp";

    let message = 'Hello, I have placed an order with Phantom VI:%0A%0A';
    cartItems.forEach(item => {
      message += `${item.qty} x ${item.variant} ${item.type} (R${prices[item.type]} each)%0A`;
    });
    message += `%0ACourier Fee: R${courierFee}%0ATotal: R${totalCost}%0A%0A`;
    message += 'Please find my sticker labels and delivery address below:';

    const encodedMsg = encodeURIComponent(message);
    whatsappBtn.href = `https://wa.link/py9pq9?text=${encodedMsg}`;
  }
}

function removeFromCart(index) {
  if (cartItems[index].qty > 1) {
    cartItems[index].qty--;
  } else {
    cartItems.splice(index, 1);
  }
  updateCartUI();
}
