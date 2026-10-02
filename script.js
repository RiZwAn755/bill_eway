const form = document.getElementById('billForm');
const qrBox = document.getElementById('qrcode');
const STORAGE_KEY = 'ewaybill-form';

// "471775822627" -> "4717 7582 2627"
function formatEwbNo(n) {
  return n.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
}

// 132300 -> "₹ 132300.00"
function formatValue(v) {
  const num = parseFloat(v);
  return isNaN(num) ? '' : '₹ ' + num.toFixed(2);
}

function getData() {
  const d = Object.fromEntries(new FormData(form).entries());
  d.ewbNoFmt = formatEwbNo(d.ewbNo || '');
  d.valueFmt = formatValue(d.value);
  d.validFromFull = d.validFrom + (d.distance ? `[${d.distance}Kms ]` : '');
  return d;
}

function render() {
  const d = getData();

  document.querySelectorAll('[data-f]').forEach(el => {
    el.textContent = d[el.dataset.f] ?? '';
  });

  const ewb = (d.ewbNo || '').replace(/\D/g, '');

  // QR code: EWB No / Generator GSTIN / Date
  qrBox.innerHTML = '';
  if (ewb && window.QRCode) {
    const gstin = (d.generatedBy || '').split(/[\s,-]/)[0];
    new QRCode(qrBox, {
      text: `${ewb}/${gstin}/${d.ewbDate}`,
      width: 100,
      height: 100,
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  // Barcode (Code 128) with number below
  const bc = document.getElementById('barcode');
  if (ewb && window.JsBarcode) {
    JsBarcode(bc, ewb, {
      format: 'CODE128',
      width: 1.2,
      height: 40,
      fontSize: 9,
      margin: 0,
      displayValue: true
    });
    bc.style.display = '';
  } else {
    bc.style.display = 'none';
  }

  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(new FormData(form)))); } catch (e) {}
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return;
    for (const [k, v] of Object.entries(saved)) {
      if (form.elements[k]) form.elements[k].value = v;
    }
  } catch (e) {}
}

form.addEventListener('input', render);
form.addEventListener('change', render);

document.getElementById('printBtn').addEventListener('click', () => {
  render();
  window.print();
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all fields?')) return;
  [...form.elements].forEach(el => { if (el.tagName === 'INPUT') el.value = ''; });
  render();
});

restore();
render();
