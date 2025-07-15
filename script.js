let cart = [];
const prices = { Wine: 75, Gin: 165, Vodka: 165 };

// Add product to cart with loading effect
function addToCart(type) {
  const qtyInput = document.getElementById(type.toLowerCase() + 'Qty');
  const typeSelect = document.getElementById(type.toLowerCase() + 'Type');
  const qty = parseInt(qtyInput.value);
  const selectedType = typeSelect.value;

  if (!selectedType) {
    alert(`Please select a ${type} type.`);
    return;
  }
  if (!qty || qty <= 0) {
    alert('Enter a valid quantity.');
    return;
  }

  // Add loading spinner to button
  const button = qtyInput.parentElement.querySelector('button');
  button.classList.add('loading');
  button.disabled = true;

  setTimeout(() => {
    const existingIndex = cart.findIndex(
      item => item.category === type && item.name === selectedType
    );

    if (existingIndex >= 0) {
      cart[existingIndex].qty += qty;
    } else {
      cart.push({ category: type, name: selectedType, qty });
    }

    updateCart();
    qtyInput.value = '';
    typeSelect.value = '';

    // Remove loading
    button.classList.remove('loading');
    button.disabled = false;
  }, 500); // Half second loading effect
}

// Update cart display
function updateCart() {
  const cartItems = document.getElementById('cartItems');
  cartItems.innerHTML = '';

  let totalQty = 0;
  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.qty * prices[item.category];
    totalQty += item.qty;
    total += itemTotal;

    const li = document.createElement('li');
    li.innerHTML = `
      ${item.qty} x ${item.category} (${item.name}) - R${itemTotal}
      <button class="remove-btn" onclick="removeFromCart(${index})">x</button>
    `;
    cartItems.appendChild(li);
  });

  const courierFee = totalQty > 0 ? (totalQty <= 2 ? 180 : 180 + (totalQty - 2) * 12) : 0;
  const totalWithCourier = total + courierFee;

  document.getElementById('courierFee').innerText = `R${courierFee}`;
  document.getElementById('totalCost').innerText = `R${totalWithCourier}`;

  updateWhatsAppLink(courierFee, totalWithCourier);
}

// Remove item from cart
function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

// Generate WhatsApp link using wa.link
function updateWhatsAppLink(courier, total) {
  if (cart.length === 0) {
    document.getElementById('whatsappBtn').href = "#";
    return;
  }

  let message = "Hi PHANTOM VI, I'd like to order:\n";
  cart.forEach(item => {
    const line = `${item.qty} x ${item.category} (${item.name}) - R${item.qty * prices[item.category]}\n`;
    message += line;
  });

  message += `Courier Fee: R${courier}\nTotal: R${total}\n\nHere is my delivery address & label:`;

  const fullLink = `https://wa.link/py9pq9?text=${encodeURIComponent(message)}`;
  document.getElementById('whatsappBtn').href = fullLink;
}
