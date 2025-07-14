let cart = [];
const prices = { Wine: 75, Gin: 165, Vodka: 165 };

function addToCart(type) {
  const typeSelect = document.getElementById(type.toLowerCase() + "Type");
  const qtyInput = document.getElementById(type.toLowerCase() + "Qty");
  const variant = typeSelect.value;
  const qty = parseInt(qtyInput.value);

  if (!variant || qty <= 0 || isNaN(qty)) {
    alert("Please select a type and enter a valid quantity.");
    return;
  }

  // Check if item already in cart
  const existingIndex = cart.findIndex(
    (item) => item.type === type && item.variant === variant
  );

  if (existingIndex >= 0) {
    cart[existingIndex].qty += qty;
  } else {
    cart.push({ type, variant, qty });
  }

  typeSelect.value = "";
  qtyInput.value = "";
  updateCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

function updateCart() {
  const cartList = document.getElementById("cartItems");
  const courierFeeElement = document.getElementById("courierFee");
  const totalCostElement = document.getElementById("totalCost");

  cartList.innerHTML = "";

  let total = 0;
  let totalQty = 0;

  cart.forEach((item, index) => {
    const itemPrice = prices[item.type] * item.qty;
    total += itemPrice;
    totalQty += item.qty;

    const li = document.createElement("li");
    li.innerHTML = `
      ${item.qty} x ${item.variant} ${item.type} - R${itemPrice}
      <button onclick="removeFromCart(${index})" style="margin-left:10px;color:red;border:none;background:none;cursor:pointer;">🗑️</button>
    `;
    cartList.appendChild(li);
  });

  const courierFee =
    totalQty === 0
      ? 0
      : totalQty <= 2
      ? 180
      : 180 + (totalQty - 2) * 12;

  const grandTotal = total + courierFee;

  courierFeeElement.textContent = `R${courierFee}`;
  totalCostElement.textContent = `R${grandTotal}`;

  // Build WhatsApp message
  let message = "Hello PHANTOM VI,%0AI'd like to place an order:%0A";
  cart.forEach((item) => {
    message += `${item.qty} x ${item.variant} ${item.type} - R${
      item.qty * prices[item.type]
    }%0A`;
  });
  message += `Courier Fee: R${courierFee}%0ATotal: R${grandTotal}%0A%0AHere is my label and address info:`;

  // Final WhatsApp link using wa.link
  const whatsappBtn = document.getElementById("whatsappBtn");
  whatsappBtn.href = `https://wa.link/py9pq9?text=${message}`;
}
