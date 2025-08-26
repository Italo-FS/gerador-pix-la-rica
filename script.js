const PIX_KEY = "329bced2-d5a3-4a77-80ff-1ab135c5948a";
const MERCHANT_NAME = "LA RICA";
const MERCHANT_CITY = "FORTALEZA";

document.addEventListener('DOMContentLoaded', function () {
  const valorInput = document.getElementById('valor');
  const identificadorInput = document.getElementById('identificador');
  const gerarBtn = document.getElementById('gerarBtn');
  const limparBtn = document.getElementById('limparBtn');
  const copiarBtn = document.getElementById('copiarBtn');
  const baixarBtn = document.getElementById('baixarBtn');
  const pixCodeTextarea = document.getElementById('pixCode');
  const qrcodeDiv = document.getElementById('qrcode');

  let qrcode = null;

  // Formatar valor monetário
  valorInput.addEventListener('blur', function () {
    if (this.value) {
      this.value = parseFloat(this.value).toFixed(2);
    }
  });

  // Limitar identificador a 20 caracteres alfanuméricos
  identificadorInput.addEventListener('input', function () {
    this.value = this.value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
  });

  // Gerar chave PIX
  gerarBtn.addEventListener('click', function () {
    const valor = valorInput.value;
    const identificador = identificadorInput.value || '***';

    if (!valor) {
      alert('Por favor, informe o valor.');
      return;
    }

    const pixCode = gerarChavePix(parseFloat(valor), identificador);
    pixCodeTextarea.value = pixCode;

    // Gerar QR Code
    if (qrcode) {
      qrcodeDiv.innerHTML = '';
      qrcode.clear();
    }
    qrcode = new QRCode(qrcodeDiv, {
      text: pixCode,
      width: 250,
      height: 250,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    pixCodeOutput.style.display = 'block';

    pixCodeTextarea.scrollIntoView({ behavior: 'smooth' });
  });

  // Limpar campos
  limparBtn.addEventListener('click', function () {
    valorInput.value = '';
    identificadorInput.value = '';
    pixCodeTextarea.value = '';

    if (qrcode) {
      qrcode.clear();
    }
  });

  // Copiar código PIX
  copiarBtn.addEventListener('click', function () {
    if (!pixCodeTextarea.value) {
      alert('Gere um código PIX primeiro.');
      return;
    }

    pixCodeTextarea.select();
    document.execCommand('copy');

    // Feedback visual
    const originalText = copiarBtn.textContent;
    copiarBtn.textContent = 'Copiado!';
    setTimeout(() => {
      copiarBtn.textContent = originalText;
    }, 2000);
  });

  // Baixar QR Code
  baixarBtn.addEventListener('click', function () {
    if (!qrcode || !pixCodeTextarea.value) {
      alert('Gere um QR Code primeiro.');
      return;
    }

    const canvas = qrcodeDiv.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'pix_la_rica.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
});

// Função para calcular CRC16 (algoritmo CCITT-FALSE)
function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc = crc << 1;
    }
    crc &= 0xFFFF;
  }
  return crc.toString(16).padStart(4, '0');
}

function formatField(id, valor) {
  const tamanho = valor.length.toString().padStart(2, '0');
  return id + tamanho + valor;
}

// Função para gerar a chave PIX
function gerarChavePix(valor, identificador) {
  const merchantInfo = formatField("00", "BR.GOV.BCB.PIX") + formatField("01", PIX_KEY);
  const campo26 = formatField("26", merchantInfo);

  const camposFixos = [
    formatField("00", "01"),
    campo26,
    formatField("52", "0000"),
    formatField("53", "986"),
    valor ? formatField("54", parseFloat(valor).toFixed(2)) : "",
    formatField("58", "BR"),
    formatField("59", MERCHANT_NAME),
    formatField("60", MERCHANT_CITY),
    formatField("62", formatField("05", identificador || "***"))
  ].join("");

  const semCRC = camposFixos + "6304";
  const crc = crc16(semCRC).toUpperCase();
  const payload = semCRC + crc;

  return payload;
}
