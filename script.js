const cartItems = [];
const prices = { Wine: 75, Gin: 165, Vodka: 165 };

function addToCart(type) {
  let productType = document.getElementById(type.toLowerCase() + 'Type').value;
  let qty = parseInt(document.getElementById(type.toLowerCase() + 'Qty').value);

  if (!productType) {
    alert('Please select a ' + type + ' type.');
    return;
  }
  if (!qty || qty <= 0) {
    alert('Please enter a valid quantity.');
    return;
  }

  let found = cartItems.find(item => item.type === type && item.variant === productType);
  if (found) {
    found.qty += qty;
  } else {
    cartItems.push({ type, variant: productType, qty });
  }

  updateCartUI();
  clearInputs(type);
}

function clearInputs(type) {
  document.getElementById(type.toLowerCase() + 'Type').value = '';
  document.getElementById(type.toLowerCase() + 'Qty').value = '';
}

function updateCartUI() {
  const ul = document.getElementById('cartItems');
  ul.innerHTML = '';

  let total = 0;
  let totalQty = 0;
  cartItems.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.qty} x ${item.variant} ${item.type} (R${prices[item.type]} each)
      <button onclick="removeItem(${index})" style="margin-left:10px; color:#b03060; background:none; border:none; cursor:pointer;">✖</button>
    `;
    ul.appendChild(li);
    total += prices[item.type] * item.qty;
    totalQty += item.qty;
  });

  let courierFee = 0;
  if (totalQty > 0) {
    courierFee = 180 + (totalQty > 2 ? (totalQty - 2) * 12 : 0);
  }

  document.getElementById('courierFee').textContent = `R${courierFee}`;
  document.getElementById('totalCost').textContent = `R${total + courierFee}`;
  
  // WhatsApp button disabled if no items
  const whatsappBtn = document.getElementById('whatsappBtn');
  if (total === 0) {
    whatsappBtn.style.pointerEvents = 'none';
    whatsappBtn.style.opacity = '0.5';
    whatsappBtn.title = "Add items to cart first";
  } else {
    whatsappBtn.style.pointerEvents = 'auto';
    whatsappBtn.style.opacity = '1';
    whatsappBtn.title = "Send label & address via WhatsApp";
  }
}

function removeItem(index) {
  cartItems.splice(index, 1);
  updateCartUI();
}
