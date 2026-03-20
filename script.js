
const STORAGE_KEY_CART = 'phantomvi_cart_v6';
const IKHOKHA_URL = 'https://pay.ikhokha.com/phantomvi/mpr/vi';

let cart = [];
let addons = { design:false, insurance:false, barcode:0 };

function saveCart(){ localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart)); }
function loadCart(){ try{ cart = JSON.parse(localStorage.getItem(STORAGE_KEY_CART))||[] }catch{cart=[]} }
function money(n){ return `R${Number(n||0)}` }

const prices = {
  Wine: {"Sweet Rosé":75,"Shiraz":85,"Sauvignon Blanc":75,"Pinotage":85,"Sweet White":75,"Sweet Red":75,"Chenin Blanc":75,"Chardonnay":75,"Cabernet Sauvignon":85,"Merlot":75,"Coffee Pinotage":75,"Non-Alcoholic Wine":100},
  Gin:165,
  Vodka:165
};

function getUnitPrice(item){
  return item.type==='Wine'?prices.Wine[item.variant]:prices[item.type];
}

function getTotals(){
  const totalBottles = cart.reduce((s,i)=>s+i.qty,0);
  const itemsSubtotal = cart.reduce((s,i)=>s+getUnitPrice(i)*i.qty,0);
  const courierFee = totalBottles>0 ? 169 + Math.max(0,totalBottles-2)*9 : 0;

  let addonsTotal = 0;
  if(addons.design) addonsTotal+=500;
  if(addons.insurance) addonsTotal+=Math.ceil(totalBottles/20)*120;
  if(addons.barcode>0) addonsTotal+=addons.barcode*500;

  return {itemsSubtotal,courierFee,addonsTotal,grandTotal:itemsSubtotal+courierFee+addonsTotal};
}

window.addToCart=function(type){
  let variant='',qty=0;
  if(type==='Wine'){variant=document.getElementById('wineType').value; qty=parseInt(document.getElementById('wineQty').value)||0;}
  if(type==='Gin'){variant=document.getElementById('ginType').value; qty=parseInt(document.getElementById('ginQty').value)||0;}
  if(type==='Vodka'){variant=document.getElementById('vodkaType').value; qty=parseInt(document.getElementById('vodkaQty').value)||0;}

  if(!variant||qty<=0){alert('Select product and quantity');return;}

  const existing=cart.find(i=>i.type===type&&i.variant===variant);
  if(existing){existing.qty+=qty;} else {cart.push({type,variant,qty});}

  saveCart(); updateUI();
};

window.changeQty=function(i,d){
  if(!cart[i]) return;
  cart[i].qty+=d;
  if(cart[i].qty<=0) cart.splice(i,1);
  saveCart(); updateUI();
};

function updateCartList(){
  const el=document.getElementById('cartItems');
  const empty=document.getElementById('emptyCartMessage');
  el.innerHTML='';
  if(cart.length===0){empty.style.display='block';return;}
  empty.style.display='none';

  cart.forEach((item,i)=>{
    const li=document.createElement('li');
    li.innerHTML=`
    <div style="display:flex;justify-content:space-between;width:100%;">
      <span>${item.variant}</span>
      <div>
        <button onclick="changeQty(${i},-1)">−</button>
        <strong>${item.qty}</strong>
        <button onclick="changeQty(${i},1)">+</button>
      </div>
    </div>`;
    el.appendChild(li);
  });
}

function updateTotalsUI(){
  const t=getTotals();
  document.getElementById('itemsSubtotal').textContent=money(t.itemsSubtotal);
  document.getElementById('courierFee').textContent=money(t.courierFee);
  document.getElementById('addonsTotal').textContent=money(t.addonsTotal);
  document.getElementById('grandTotal').textContent=money(t.grandTotal);
}

function setupAddons(){
  document.getElementById('addonLabelDesign').onclick=()=>{addons.design=!addons.design;updateUI();};
  document.getElementById('addonInsurance').onclick=()=>{addons.insurance=!addons.insurance;updateUI();};
  document.getElementById('barcodePlus').onclick=()=>{addons.barcode++;updateUI();};
  document.getElementById('barcodeMinus').onclick=()=>{if(addons.barcode>0)addons.barcode--;updateUI();};
}

function updateUI(){
  updateCartList();
  updateTotalsUI();
}

function setupCheckout(){
  const btn=document.getElementById('payBtn');
  btn.addEventListener('click',()=>{
    window.location.href = IKHOKHA_URL;
  });
}

window.addEventListener('DOMContentLoaded',()=>{
  loadCart();
  updateUI();
  setupAddons();
  setupCheckout();
});
