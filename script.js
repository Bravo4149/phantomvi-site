const IKHOKHA_URL = 'https://pay.ikhokha.com/phantomvi/mpr/vi';

let cart = [];

function handleAdd(type) {
  let variant = '';
  let qty = 0;

  if (type === 'Wine') {
    variant = document.getElementById('wineType').value;
    qty = parseInt(document.getElementById('wineQty').value);
  }

  if (type === 'Gin') {
    variant = document.getElementById('ginType').value;
    qty = parseInt(document.getElementById('ginQty').value);
  }

  if (type === 'Vodka') {
    variant = document.getElementById('vodkaType').value;
    qty = parseInt(document.getElementById('vodkaQty').value);
  }

  if (!variant) return alert('Select a type');
  if (!qty || qty <= 0) return alert('Enter quantity');

  const existing = cart.find(i => i.variant === variant);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ type, variant, qty });
  }

  render();
}

function render() {
  const list = document.getElementById('cartItems');
  list.innerHTML = '';

  let total = 0;

  cart.forEach((item, index) => {
    const price = 100;
    total += price * item.qty;

    const li = document.createElement('li');
    li.innerHTML = `
      ${item.variant} x ${item.qty}
      <button onclick="removeItem(${index})">X</button>
    `;
    list.appendChild(li);
  });

  document.getElementById('grandTotal').textContent = 'R' + total;
}

function removeItem(i) {
  cart.splice(i, 1);
  render();
}

document.getElementById('ikhokhaBtn').onclick = () => {
  const name = document.getElementById('custName').value;
  const phone = document.getElementById('custPhone').value;
  const address = document.getElementById('custAddress').value;

  if (!name || !phone || !address) {
    return alert('Fill all details');
  }

  if (cart.length === 0) {
    return alert('Cart is empty');
  }

  window.location.href = IKHOKHA_URL;
};
