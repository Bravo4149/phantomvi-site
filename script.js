let cart = [];

function addToCart(type) {
  const qty = parseInt(document.getElementById(type.toLowerCase() + 'Qty').value) || 0;
  const productType = document.getElementById(type.toLowerCase() + 'Type').value || "Type not selected";
  const price = (type === 'Wine') ? 75 : 165;

  if (qty <= 0) return;

  cart.push({ category: type, name: productType, qty, price });
  updateCart();
}

function updateCart() {
  const cartItems = document.getElementById('cartItems');
  cartItems.innerHTML = "";

  let wineTotal = 0, ginTotal = 0, vodkaTotal = 0;
  let totalQty = 0;

  cart.forEach(item => {
    const itemTotal = item.qty * item.price;
    totalQty += item.qty;
    if (item.category === 'Wine') wineTotal += itemTotal;
    else if (item.category === 'Gin') ginTotal += itemTotal;
    else if (item.category === 'Vodka') vodkaTotal += itemTotal;

    cartItems.innerHTML += `<li>${item.qty} x ${item.category} (${item.name}) - R${itemTotal}</li>`;
  });

  let courierFee = 0;
  if (totalQty > 0) {
    if (totalQty <= 2) {
      courierFee = 180;
    } else {
      courierFee = 180 + (totalQty - 2) * 12;
    }
  }

  const total = wineTotal + ginTotal + vodkaTotal + courierFee;

  document.getElementById('courierFee').innerText = `R${courierFee}`;
  document.getElementById('totalCost').innerText = `R${total}`;

  let message = "Hi PHANTOM VI, I would like to order:%0A";
  cart.forEach(item => {
    message += `${item.qty} x ${item.category} (${item.name}) - R${item.qty * item.price}%0A`;
  });
  message += `Courier: R${courierFee}%0ATotal: R${total}%0A`;
  message += `I will send my sticker label and delivery address here.`;

  document.getElementById('checkoutBtn').href = `https://wa.me/27814458910?text=${message}`;
}
