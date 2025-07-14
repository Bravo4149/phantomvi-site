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

  // Check if item already exists in cart
  const existingIndex = cartItems.findIndex(
    item => item.type === type && item.variant === productType
  );
  if (existingIndex >= 0) {
    cartItems[existingIndex].qty += qty; // Add qty to existing item
  } else {
    cartItems.push({ type, variant: productType, qty });
  }

  updateCartUI();
  clearInputs(type);
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

function removeFromCart(index) {
  cartItems.splice(index, 1);
  updateCartUI();
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
    li.textContent = `${item.qty} x ${item.variant} ${item.type} (R${prices[item.type]} each) - R${itemTotal}`;
    
    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×'; // cross symbol
    removeBtn.title = 'Remove item';
    removeBtn.onclick = () => removeFromCart(index);

    li.appendChild(removeBtn);
    ul.appendChild(li);
  });

  // Calculate courier fee: R180 for first 2 bottles, + R12 per extra bottle
  let courierFee = 0;
  if(totalQty > 0) {
    courierFee = 180;
    if(totalQty > 2) {
      courierFee += (totalQty - 2) * 12;
    }
  }

  document.getElementById('courierFee').textContent = `R${courierFee}`;
  const totalCost = total + courierFee;
  document.getElementById('totalCost').textContent = `R${totalCost}`;

  // Update WhatsApp button
  const whatsappBtn = document.getElementById('whatsappBtn');
  if(totalCost === 0){
    whatsappBtn.href = '#';
    whatsappBtn.style.pointerEvents = 'none';
    whatsappBtn.style.opacity = '0.5';
    whatsappBtn.title = "Add items to cart first";
  } else {
    whatsappBtn.style.pointerEvents = 'auto';
    whatsappBtn.style.opacity = '1';
    whatsappBtn.title = "Send order details via WhatsApp";

    // Compose message text with line breaks encoded for WhatsApp
    let message = 'Hello, I have placed an order with Phantom VI:%0A%0A';
    cartItems.forEach(item => {
      message += `${item.qty} x ${item.variant} ${item.type} (R${prices[item.type]} each) - R${prices[item.type] * item.qty}%0A`;
    });
    message += `%0ACourier Fee: R${courierFee}%0ATotal: R${totalCost}%0A%0A`;
    message += 'Please find my sticker labels and delivery address below:';

    // WhatsApp link — using your wa.link short link
    const phoneNumber = '27814458910'; // SA number without +
    whatsappBtn.href = `https://wa.me/${phoneNumber}?text=${message}`;
  }
}
