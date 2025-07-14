<script>
  const cartItems = [];
  const prices = { Wine: 75, Gin: 165, Vodka: 165 };

  function addToCart(type) {
    let productType, qty;
    if (type === 'Wine') {
      productType = document.getElementById('wineType').value;
      qty = parseInt(document.getElementById('wineQty').value);
    } else if (type === 'Gin') {
      productType = document.getElementById('ginType').value;
      qty = parseInt(document.getElementById('ginQty').value);
    } else if (type === 'Vodka') {
      productType = document.getElementById('vodkaType').value;
      qty = parseInt(document.getElementById('vodkaQty').value);
    }

    if (!productType || qty <= 0 || isNaN(qty)) {
      alert('Please select a type and enter a valid quantity.');
      return;
    }

    // Add to cart or update quantity
    const existing = cartItems.find(
      item => item.type === type && item.variant === productType
    );
    if (existing) {
      existing.qty += qty;
    } else {
      cartItems.push({ type, variant: productType, qty });
    }

    clearInputs(type);
    updateCartUI();
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

    cartItems.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.qty} x ${item.variant} ${item.type} (R${prices[item.type]} each)`;
      ul.appendChild(li);
      total += prices[item.type] * item.qty;
      totalQty += item.qty;
    });

    // Courier fee calculation:
    // R180 for 2 bottles or less, plus R12 for each bottle over 2
    let courierFee = 0;
    if (totalQty > 0) {
      if (totalQty <= 2) courierFee = 180;
      else courierFee = 180 + (totalQty - 2) * 12;
    }

    const totalCost = total + courierFee;

    document.getElementById('courierFee').textContent = `R${courierFee}`;
    document.getElementById('totalCost').textContent = `R${totalCost}`;

    // WhatsApp order message
    const whatsappBtn = document.getElementById('whatsappBtn');
    if (totalQty === 0) {
      whatsappBtn.href = "#";
      whatsappBtn.style.pointerEvents = "none";
      whatsappBtn.style.opacity = "0.6";
    } else {
      let message = "Hi PHANTOM VI,%0AI'd like to order:%0A";
      cartItems.forEach(item => {
        message += `${item.qty} x ${item.variant} ${item.type} - R${item.qty * prices[item.type]}%0A`;
      });
      message += `%0ACourier Fee: R${courierFee}%0ATotal: R${totalCost}%0A%0AMy label and delivery address:%0A[Paste here]`;

      whatsappBtn.href = `https://wa.me/27814458910?text=${message}`;
      whatsappBtn.style.pointerEvents = "auto";
      whatsappBtn.style.opacity = "1";
    }
  }
</script>
