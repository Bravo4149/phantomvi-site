<script>
  let cartItems = [];
  const prices = { Wine: 75, Gin: 165, Vodka: 165 };

  function addToCart(type) {
    const qtyInput = document.getElementById(type.toLowerCase() + 'Qty');
    const selectInput = document.getElementById(type.toLowerCase() + 'Type');
    const qty = parseInt(qtyInput.value);
    const variant = selectInput.value;

    if (!variant || qty <= 0) {
      alert('Please select type and quantity');
      return;
    }

    const existing = cartItems.find(item => item.type === type && item.variant === variant);
    if (existing) {
      existing.qty += qty;
    } else {
      cartItems.push({ type, variant, qty });
    }

    qtyInput.value = '';
    selectInput.value = '';
    updateCart();
  }

  function updateCart() {
    const cartList = document.getElementById('cartItems');
    cartList.innerHTML = '';

    let totalQty = 0;
    let totalCost = 0;

    cartItems.forEach(item => {
      const itemTotal = item.qty * prices[item.type];
      const li = document.createElement('li');
      li.textContent = `${item.qty} x ${item.variant} ${item.type} - R${itemTotal}`;
      cartList.appendChild(li);
      totalQty += item.qty;
      totalCost += itemTotal;
    });

    // Calculate courier fee
    let courier = 0;
    if (totalQty > 0) {
      courier = 180;
      if (totalQty > 2) {
        courier += (totalQty - 2) * 12;
      }
    }

    const grandTotal = totalCost + courier;

    document.getElementById('courierFee').innerText = `R${courier}`;
    document.getElementById('totalCost').innerText = `R${grandTotal}`;

    // Create WhatsApp message with order details
    let message = `Hello PHANTOM VI,%0AI'm placing an order:%0A`;
    cartItems.forEach(item => {
      message += `${item.qty} x ${item.variant} ${item.type} (R${prices[item.type]})%0A`;
    });
    message += `Courier: R${courier}%0ATotal: R${grandTotal}%0A`;
    message += `%0AI have completed payment via Yoco.%0AHere is my sticker label and delivery address:%0A`;

    // Encode & update WhatsApp link
    const whatsappLink = `https://wa.link/py9pq9?text=${message}`;
    const waBtn = document.getElementById('whatsappBtn');
    waBtn.href = whatsappLink;
    waBtn.style.opacity = grandTotal > 0 ? '1' : '0.5';
    waBtn.style.pointerEvents = grandTotal > 0 ? 'auto' : 'none';
  }
</script>
