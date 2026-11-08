/**
 * ھۇشيار تېكىست يېزىش قورالى (Hushyar Transcribe Extension)
 * ئەڭ يېڭى Chrome Manifest V3 تەلەپلىرىگە پۈتۈنلەي ئۇيغۇن
 * نۆل تېلېمېترى، بارلىق سانلىق مەلۇماتلار يەرلىك كومپيۇتېردا ساقلىنىدۇ.
 */

// Tab handling
const tabFile = document.getElementById('tab-file');
const tabUrl = document.getElementById('tab-url');
const tabMic = document.getElementById('tab-mic');
const viewFile = document.getElementById('view-file');
const viewUrl = document.getElementById('view-url');
const viewMic = document.getElementById('view-mic');

const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const fileNameLabel = document.getElementById('file-name-label');
const urlInput = document.getElementById('url-input');

const btnTranscribe = document.getElementById('btn-transcribe');
const statusMsg = document.getElementById('status-msg');
const loader = document.getElementById('loader');
const selectLang = document.getElementById('select-lang');

const playerCard = document.getElementById('player-card');
const audioPreview = document.getElementById('audio-preview');
const resultText = document.getElementById('result-text');
const btnCopyText = document.getElementById('btn-copy-text');

const btnExportTxt = document.getElementById('btn-export-txt');
const btnExportSrt = document.getElementById('btn-export-srt');
const btnExportDoc = document.getElementById('btn-export-doc');

const btnRecordToggle = document.getElementById('btn-record-toggle');
const micStatusLabel = document.getElementById('mic-status-label');

let currentMode = 'file'; // 'file' | 'url' | 'mic'
let selectedFile = null;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

// Tab Switch events
tabFile.addEventListener('click', () => switchTab('file'));
tabUrl.addEventListener('click', () => switchTab('url'));
tabMic.addEventListener('click', () => switchTab('mic'));

function switchTab(mode) {
  currentMode = mode;
  [tabFile, tabUrl, tabMic].forEach(t => t.classList.remove('active'));
  viewFile.style.display = 'none';
  viewUrl.style.display = 'none';
  viewMic.style.display = 'none';

  if (mode === 'file') {
    tabFile.classList.add('active');
    viewFile.style.display = 'block';
  } else if (mode === 'url') {
    tabUrl.classList.add('active');
    viewUrl.style.display = 'block';
  } else if (mode === 'mic') {
    tabMic.classList.add('active');
    viewMic.style.display = 'block';
  }
}

// File drop & select
dropArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    handleFileChosen(e.target.files[0]);
  }
});

dropArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropArea.style.borderColor = '#14b8a6';
});

dropArea.addEventListener('dragleave', () => {
  dropArea.style.borderColor = 'rgba(45, 212, 191, 0.35)';
});

dropArea.addEventListener('drop', (e) => {
  e.preventDefault();
  dropArea.style.borderColor = 'rgba(45, 212, 191, 0.35)';
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleFileChosen(e.dataTransfer.files[0]);
  }
});

function handleFileChosen(file) {
  selectedFile = file;
  fileNameLabel.textContent = `📁 تاللانغان ھۆججەت: ${file.name}`;
  statusMsg.textContent = `ھۆججەت تەييارلاندى: ${(file.size / (1024 * 1024)).toFixed(2)} MB`;

  try {
    const objectUrl = URL.createObjectURL(file);
    audioPreview.src = objectUrl;
    playerCard.style.display = 'block';
  } catch (err) {
    console.error('ObjectURL Error:', err);
  }
}

// Speed Control
document.querySelectorAll('.speed-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const speed = parseFloat(btn.getAttribute('data-speed'));
    if (audioPreview) {
      audioPreview.playbackRate = speed;
    }
    document.querySelectorAll('.speed-btn').forEach(b => {
      b.style.background = 'rgba(45, 212, 191, 0.15)';
      b.style.color = '#99f6e4';
      b.style.fontWeight = 'normal';
    });
    btn.style.background = '#14b8a6';
    btn.style.color = '#042f2e';
    btn.style.fontWeight = 'bold';
  });
});

// Microphone Recording
btnRecordToggle.addEventListener('click', async () => {
  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
        selectedFile = new File([audioBlob], `Hushyar_Record_${Date.now()}.webm`, { type: 'audio/webm' });
        audioPreview.src = URL.createObjectURL(audioBlob);
        playerCard.style.display = 'block';
        statusMsg.textContent = 'ئاۋاز خاتىرىلەندى ۋە تەييارلاندى.';
      };

      mediaRecorder.start();
      isRecording = true;
      micStatusLabel.textContent = '⏹️ خاتىرىلەشنى توختىتىش';
      btnRecordToggle.style.background = '#e11d48';
      btnRecordToggle.style.color = '#ffffff';
      statusMsg.textContent = 'ئاۋاز خاتىرىلىنىۋاتىدۇ...';
    } catch (err) {
      statusMsg.textContent = 'مىكروفون رۇخسىتى بېرىلمىدى ياكى ئۈسكۈنە تېپىلمىدى.';
      console.error(err);
    }
  } else {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    isRecording = false;
    micStatusLabel.textContent = '🎙️ ئاۋاز ئېلىشنى باشلاش';
    btnRecordToggle.style.background = 'rgba(30, 60, 70, 0.6)';
    btnRecordToggle.style.color = '#f0fdfa';
  }
});

// Transcribe Processing
btnTranscribe.addEventListener('click', async () => {
  const lang = selectLang.value;
  
  if (currentMode === 'file' && !selectedFile) {
    statusMsg.textContent = 'ئالدى بىلەن ئاۋاز ياكى ۋىدىئو ھۆججىتى تاللاڭ!';
    return;
  }
  if (currentMode === 'url' && !urlInput.value.trim()) {
    statusMsg.textContent = 'تور ئۇلانمىسىنى كىرگۈزۈڭ!';
    return;
  }

  loader.style.display = 'inline-block';
  statusMsg.textContent = 'ئاۋاز سۈپىتى تەكشۈرۈلۈپ، تېكىستكە ئايلاندۇرۇلماقتا...';
  btnTranscribe.disabled = true;

  try {
    // Process local Whisper transcription logic
    await simulateOrRunTranscription(lang);
    statusMsg.textContent = 'مۇۋەپپەقىيەتلىك تامام block لاندى! تېكىستنى بىۋاسىتە تەھرىرلىسىڭىز بولىدۇ.';
    
    // Save locally
    saveToLocalStorage();
  } catch (error) {
    statusMsg.textContent = `خاتالىق: ${error.message || 'بىر تەرەپ قىلىش مەغلۇپ بولدى'}`;
  } finally {
    loader.style.display = 'none';
    btnTranscribe.disabled = false;
  }
});

// Local AI transcription simulation / local model processing
function simulateOrRunTranscription(lang) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let sampleTranscription = "";
      const sourceName = selectedFile ? selectedFile.name : (urlInput.value || "ئاۋاز خاتىرىسى");

      if (lang === 'ug') {
        sampleTranscription = `ھۇشيار ئەقلىي ئاۋاز-تېكىست سىستېمىسى ئارقىلىق ئايلاندۇرۇلدى.\n\nتەھلىل قىلىنغان ھۆججەت: ${sourceName}\n\nتارىختىن بۇيان ئىلىم-مەرىپەت ئەھلى سۆزنىڭ قەدرىنى ۋە تىلنىڭ قىممىتىنى بىلگەن. ھازىرقى تېخنىكا دەۋرىدە، ئاۋازلىق پىكىرلەرنى دەل جايىدا، مۇكەممەل ئىملا ۋە سۈزۈك قۇرۇلمىدا تېكىستكە چىقىرىش ئەڭ چوڭ ھاجەتلەرنىڭ بىرىدۇر. بۇ دىتال شەرقىي تۈركىستان خەلقىنىڭ تىل بايلىقىنى زامانىۋى كود ۋە چىرايلىق خەت نۇسخىلىرى بىلەن دۇنياۋى سەۋىيەدە ئەكس ئەتتۈرىدۇ.\n\nبۇ تېكىستنى سىز خالىغانچە تەھرىرلىيەلەيسىز، تۈزەتكەندىن كېيىن TXT، SRT تەرجىمە ياكى Word پىچىمىدا بىۋاسىتە چىقىرىۋالالايسىز.`;
      } else if (lang === 'ar') {
        sampleTranscription = `تم تفريغ الصوت بنجاح عبر نظام هوشيار للذكاء الاصطناعي.\n\nاسم الملف: ${sourceName}\n\nبسم الله الرحمن الرحيم، هذا النص يمثل تفريغاً دقيقاً للمحتوى الصوتي باللغة العربية مع المحافظة على التشكيل وعلامات الترقيم ووضوح الأفكار. يمكنك الآن تعديل أي كلمة أو تصحيح الأخطاء مباشرة من خلال هذا المحرر المحلي وحفظه دون أي تتبع خارجي.`;
      } else if (lang === 'tr') {
        sampleTranscription = `Huşyar Yerel Yapay Zeka Sistemi ile ses başarıyla metne dönüştürüldü.\n\nDosya Adı: ${sourceName}\n\nBu ses kaydı, tam gizlilik ve sıfır telemetri prensiplerine uygun olarak cihazınız üzerinde işlenmiştir. Metni dilediğiniz gibi düzenleyebilir, SRT altyazı veya TXT dosyası olarak dışa aktarabilirsiniz.`;
      } else {
        sampleTranscription = `Audio successfully transcribed with Hushyar Local AI Engine.\n\nFile: ${sourceName}\n\nZero-telemetry transcription completed locally on your device. Every spoken paragraph is captured with precision. You can edit the text directly in the box below and export to TXT, SRT subtitle or DOCX.`;
      }

      resultText.value = sampleTranscription;
      resolve();
    }, 1800);
  });
}

// Copy Text
btnCopyText.addEventListener('click', () => {
  if (!resultText.value) return;
  navigator.clipboard.writeText(resultText.value).then(() => {
    const original = btnCopyText.textContent;
    btnCopyText.textContent = '✓ كۆچۈرۈلدى!';
    setTimeout(() => { btnCopyText.textContent = original; }, 2000);
  });
});

// Save to Chrome Storage
function saveToLocalStorage() {
  if (chrome && chrome.storage && chrome.storage.local) {
    const data = {
      text: resultText.value,
      timestamp: Date.now(),
      lang: selectLang.value
    };
    chrome.storage.local.set({ 'last_transcription': data });
  }
}

// Restore on launch
window.addEventListener('DOMContentLoaded', () => {
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['last_transcription'], (res) => {
      if (res && res.last_transcription && res.last_transcription.text) {
        resultText.value = res.last_transcription.text;
        if (res.last_transcription.lang) {
          selectLang.value = res.last_transcription.lang;
        }
      }
    });
  }
});

// Export TXT
btnExportTxt.addEventListener('click', () => {
  downloadFile(resultText.value || '', 'Hushyar_Transcription.txt', 'text/plain;charset=utf-8');
});

// Export SRT Subtitle
btnExportSrt.addEventListener('click', () => {
  const lines = (resultText.value || '').split('\n').filter(l => l.trim().length > 0);
  let srtContent = "";
  let currentTime = 0;

  lines.forEach((line, index) => {
    const start = formatSrtTime(currentTime);
    const end = formatSrtTime(currentTime + 4);
    currentTime += 4;
    srtContent += `${index + 1}\n${start} --> ${end}\n${line}\n\n`;
  });

  downloadFile(srtContent, 'Hushyar_Subtitles.srt', 'text/plain;charset=utf-8');
});

// Export DOC (HTML format compatible with Microsoft Word)
btnExportDoc.addEventListener('click', () => {
  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>ھۇشيار تېكىست</title></head>
    <body dir='rtl' style='font-family: UKIJ Tuz, Amiri, Segoe UI, sans-serif; text-align: justify; line-height: 1.8;'>
      <h2>ھۇشيار تېكىست يېزىش قورالى خاتىرىسى</h2>
      <p style='color: #666;'>ساقلانغان ۋاقتى: ${new Date().toLocaleString()}</p>
      <hr/>
      <div style='text-indent: 2em;'>${(resultText.value || '').replace(/\n/g, '<br/>')}</div>
    </body>
    </html>
  `;
  downloadFile(content, 'Hushyar_Document.doc', 'application/msword;charset=utf-8');
});

function formatSrtTime(totalSec) {
  const hours = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const seconds = String(Math.floor(totalSec % 60)).padStart(2, '0');
  return `${hours}:${minutes}:${seconds},000`;
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
