const API_URL =
&quot;https://script.google.com/macros/s/AKfycbzmrdy3uWiVDt9Mzx9i_mzFVwj3Kwns2t9JR
qPMBEmxjpBL7pGsS1cJ-lDvhcvxG-72/exec&quot;;

let AppState = {
allQuizData: [],
userPermissions: [],
rankings: [],
currentQuizData: [],
timerInterval: null,
correctCount: 0,
wrongCount: 0,
wrongQuestions: []
};

// Hàm chặn tắt/đóng/load lại trang khi đang làm bài
function handleBeforeUnload(e) {
e.preventDefault();
e.returnValue = &#39;&#39;;
}

// ==========================================
// HÀM TIỆN ÍCH CƠ BẢN VÀ PHÁT ÂM
// ==========================================
function escapeHTML(str) {
if (!str) return &#39;&#39;;
return String(str).replace(/[&amp;&lt;&gt;&quot;&#39;]/g, function(m) {
return { &#39;&amp;&#39;: &#39;&amp;amp;&#39;, &#39;&lt;&#39;: &#39;&amp;lt;&#39;, &#39;&gt;&#39;: &#39;&amp;gt;&#39;, &#39;&quot;&#39;: &#39;&amp;quot;&#39;, &quot;&#39;&quot;: &#39;&amp;#039;&#39; }[m];

});
}

function removeDiacritics(str) {
if (!str) return &#39;&#39;;
return String(str).normalize(&#39;NFD&#39;).replace(/[\u0300-\u036f]/g, &#39;&#39;).replace(/đ/g,
&#39;d&#39;).replace(/Đ/g, &#39;D&#39;);
}

function cleanKey(str) {
if (!str) return &#39;&#39;;
return removeDiacritics(str).toLowerCase().replace(/[^a-z0-9]/g, &#39;&#39;);
}

function standardizeSubject(monStr) {
if (!monStr) return &#39;&#39;;
const cleanM = cleanKey(monStr);
if (cleanM.includes(&#39;anh&#39;) || cleanM.includes(&#39;english&#39;)) return &#39;Tiếng Anh&#39;;
if (cleanM.includes(&#39;toan&#39;) || cleanM.includes(&#39;math&#39;)) return &#39;Toán&#39;;
if (cleanM.includes(&#39;tiengviet&#39;) || cleanM.includes(&#39;tv&#39;)) return &#39;Tiếng Việt&#39;;
return monStr.trim();
}

function speakWord(text) {
if (&#39;speechSynthesis&#39; in window) {
window.speechSynthesis.cancel();
let cleanText = text.replace(/\/.+?\//g, &#39;&#39;).trim();

const utterance = new SpeechSynthesisUtterance(cleanText);
utterance.lang = &#39;en-US&#39;;
utterance.rate = 0.9;
window.speechSynthesis.speak(utterance);
} else {
alert(&quot;Trình duyệt của bạn không hỗ trợ tính năng phát âm.&quot;);
}
}

// 1. Quản lý Tra từ điển (Đã tích hợp Anh - Việt)
window.openDictionaryModal = function() {
const modal = document.getElementById(&#39;dict-modal&#39;);
if (modal) modal.style.display = &#39;flex&#39;;
const input = document.getElementById(&#39;dict-input&#39;);
if (input) {
input.focus();
let selectedText = window.getSelection().toString().trim();
if (selectedText &amp;&amp; selectedText.split(&#39; &#39;).length === 1) {
input.value = selectedText;
window.lookupWord();
}
}
};

window.closeDictionaryModal = function() {
const modal = document.getElementById(&#39;dict-modal&#39;);
if (modal) modal.style.display = &#39;none&#39;;

};

window.lookupWord = async function() {
const input = document.getElementById(&#39;dict-input&#39;);
const resultBox = document.getElementById(&#39;dict-result&#39;);
if (!input || !resultBox) return;
let word = input.value.trim().toLowerCase();
if (!word) {
resultBox.innerHTML = &#39;&lt;span style=&quot;color: red;&quot;&gt;Vui lòng nhập từ cần
tra!&lt;/span&gt;&#39;;
return;
}
resultBox.innerHTML = &#39;Đang tra từ Anh - Việt...&#39;;
try {
let [dictResponse, transResponse] = await Promise.all([
fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`).c
atch(() =&gt; null),
fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&amp;lang
pair=en|vi`).catch(() =&gt; null)
]);
let vietnameseMeaning = &#39;&#39;;
if (transResponse &amp;&amp; transResponse.ok) {
let transData = await transResponse.json();
if (transData &amp;&amp; transData.responseData &amp;&amp;
transData.responseData.translatedText) {
vietnameseMeaning = transData.responseData.translatedText;
}
}

if (!dictResponse || !dictResponse.ok) {
if (vietnameseMeaning &amp;&amp; vietnameseMeaning.toLowerCase() !== word) {
resultBox.innerHTML = `&lt;div style=&quot;margin-bottom: 8px;&quot;&gt;&lt;b style=&quot;font-size:
1.2em; color: #540606;&quot;&gt;${escapeHTML(word)}&lt;/b&gt;&lt;/div&gt;` +
`&lt;div style=&quot;margin-top: 8px; padding: 10px; background:
#e8f5e9; border-radius: 6px; border: 1px solid #c8e6c9;&quot;&gt;` +
`&lt;b style=&quot;color: #2e7d32;&quot;&gt;���� Nghĩa tiếng Việt:&lt;/b&gt; &lt;span
style=&quot;color: #1b5e20; font-weight: bold; font-size:
1.1em;&quot;&gt;${escapeHTML(vietnameseMeaning)}&lt;/span&gt;` +
`&lt;/div&gt;`;
return;
}
resultBox.innerHTML = `&lt;span style=&quot;color: red;&quot;&gt;Không tìm thấy từ
&quot;${escapeHTML(word)}&quot; trong từ điển.&lt;/span&gt;`;
return;
}
let data = await dictResponse.json();
if (data &amp;&amp; data.length &gt; 0) {
let entry = data[0];
let phonetic = entry.phonetic || (entry.phonetics &amp;&amp; entry.phonetics.find(p =&gt;
p.text)?.text) || &#39;&#39;;
let audioUrl = entry.phonetics &amp;&amp; entry.phonetics.find(p =&gt; p.audio)?.audio || &#39;&#39;;
let html = `&lt;div style=&quot;margin-bottom: 8px;&quot;&gt;&lt;b style=&quot;font-size: 1.2em; color:
#540606;&quot;&gt;${escapeHTML(entry.word)}&lt;/b&gt; &lt;span style=&quot;color: #666; font-style:
italic;&quot;&gt;${escapeHTML(phonetic)}&lt;/span&gt;`;
if (audioUrl) {
html += ` &lt;button type=&quot;button&quot; onclick=&quot;new Audio(&#39;${audioUrl}&#39;).play()&quot;
style=&quot;background:#ffc107; border:none; border-radius:4px; padding:2px 8px;
cursor:pointer; font-weight:bold;&quot;&gt;�� Nghe&lt;/button&gt;`;
}

html += `&lt;/div&gt;`;
if (vietnameseMeaning &amp;&amp; vietnameseMeaning.toLowerCase() !== word) {
html += `&lt;div style=&quot;margin-top: 8px; padding: 10px; background: #e8f5e9;
border-radius: 6px; border: 1px solid #c8e6c9;&quot;&gt;` +
`&lt;b style=&quot;color: #2e7d32;&quot;&gt;���� Nghĩa tiếng Việt:&lt;/b&gt; &lt;span
style=&quot;color: #1b5e20; font-weight: bold; font-size:
1.1em;&quot;&gt;${escapeHTML(vietnameseMeaning)}&lt;/span&gt;` +
`&lt;/div&gt;`;
}
entry.meanings.forEach(meaning =&gt; {
html += `&lt;div style=&quot;margin-top: 10px;&quot;&gt;&lt;b style=&quot;color:
#007bff;&quot;&gt;(${escapeHTML(meaning.partOfSpeech)})&lt;/b&gt;`;
meaning.definitions.slice(0, 2).forEach((def) =&gt; {
html += `&lt;div style=&quot;margin-left: 10px; margin-top: 4px;&quot;&gt;•
${escapeHTML(def.definition)}`;
if (def.example) {
html += `&lt;br&gt;&lt;span style=&quot;color: #555; font-size: 0.95em; font-style:
italic;&quot;&gt;Ví dụ: &quot;${escapeHTML(def.example)}&quot;&lt;/span&gt;`;
}
html += `&lt;/div&gt;`;
});
html += `&lt;/div&gt;`;
});
resultBox.innerHTML = html;
}
} catch(e) {
resultBox.innerHTML = &#39;&lt;span style=&quot;color: red;&quot;&gt;Lỗi kết nối khi tra từ. Vui lòng
thử lại sau!&lt;/span&gt;&#39;;
}

};

// Lưu nhớ trạng thái môn và chủ đề đã chọn
window.saveUserSelections = function() {
try {
const mon = document.getElementById(&#39;subject-select&#39;) ?
document.getElementById(&#39;subject-select&#39;).value : &#39;&#39;;
const maHS = document.getElementById(&#39;student-code&#39;) ?
document.getElementById(&#39;student-code&#39;).value.trim() : &#39;&#39;;
const selectedTopics =
Array.from(document.querySelectorAll(&#39;input[name=&quot;topic&quot;]:checked&#39;)).map(cb =&gt;
cb.value);

if (maHS) localStorage.setItem(&#39;saved_maHS&#39;, maHS);
if (mon) localStorage.setItem(&#39;saved_mon&#39;, mon);
if (selectedTopics.length &gt; 0) {
localStorage.setItem(&#39;saved_topics_&#39; + maHS + &#39;_&#39; + mon,
JSON.stringify(selectedTopics));
}
} catch(e) {}
};

window.restoreUserSelections = function() {
try {
const savedMon = localStorage.getItem(&#39;saved_mon&#39;);
const subjectSelect = document.getElementById(&#39;subject-select&#39;);
if (savedMon &amp;&amp; subjectSelect) {
subjectSelect.value = savedMon;
window.handleSubjectChange();

const maHS = document.getElementById(&#39;student-code&#39;) ?
document.getElementById(&#39;student-code&#39;).value.trim() : &#39;&#39;;
const savedTopics = localStorage.getItem(&#39;saved_topics_&#39; + maHS + &#39;_&#39; +
savedMon);
if (savedTopics) {
let topicsArray = JSON.parse(savedTopics);
setTimeout(() =&gt; {
document.querySelectorAll(&#39;input[name=&quot;topic&quot;]&#39;).forEach(cb =&gt; {
cb.checked = topicsArray.includes(cb.value);
});
}, 200);
}
}
} catch(e) {}
};

window.handleMadeChange = function() {
const madeSelect = document.getElementById(&#39;made-select&#39;);
const previewEl = document.getElementById(&#39;made-passage-preview&#39;);
if (!madeSelect || !previewEl) return;

const selectedMade = madeSelect.value.trim();
if (!selectedMade) {
previewEl.innerHTML = &#39;&#39;;
return;
}
const found = AppState.allQuizData.find(i =&gt;

(String(i.made).trim() === selectedMade || String(i.chuDe).trim() ===
selectedMade) &amp;&amp;
i.passage &amp;&amp; i.passage.trim() !== &#39;&#39;
);
if (found) {
const subText = escapeHTML(found.passage.substring(0, 150));
previewEl.innerHTML = &#39;&lt;div style=&quot;background: #f8f9fa; border: 1px solid
#540606; padding: 12px; border-radius: 6px; margin-top: 5px; font-size: 1.05em;&quot;&gt;&lt;b
style=&quot;color: #540606;&quot;&gt;�� Xem trước đoạn văn/bài nghe:&lt;/b&gt;&lt;br&gt;&#39; + subText +
&#39;...&lt;/div&gt;&#39;;
} else {
previewEl.innerHTML = &#39;&#39;;
}
};

window.toggleMadeMode = function() {
const toggleMade = document.getElementById(&#39;toggle-made&#39;);
if (!toggleMade) return;
let madeContainer = document.getElementById(&#39;made-container&#39;);
const topicContainer = document.getElementById(&#39;topic-container&#39;);
const topicWrapper = topicContainer ? topicContainer.previousElementSibling : null;
const selectAllBtn = document.querySelector(&#39;button[onclick*=&quot;toggleAllTopics&quot;]&#39;) ||
Array.from(document.querySelectorAll(&#39;button&#39;)).find(b =&gt;
b.textContent.includes(&#39;Chọn/Bỏ chọn tất cả&#39;));
const isChecked = toggleMade.checked;
if (madeContainer) madeContainer.style.display = isChecked ? &#39;block&#39; : &#39;none&#39;;
if (topicContainer) topicContainer.style.display = isChecked ? &#39;none&#39; : &#39;block&#39;;
if (topicWrapper &amp;&amp; topicWrapper !== madeContainer) topicWrapper.style.display =
isChecked ? &#39;none&#39; : &#39;block&#39;;

if (selectAllBtn) selectAllBtn.style.display = isChecked ? &#39;none&#39; : &#39;inline-block&#39;;
if (isChecked) {
window.updateMadeList();
}
};

function shuffleArray(array) {
let arr = [...array];
for (let i = arr.length - 1; i &gt; 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[arr[i], arr[j]] = [arr[j], arr[i]];
}
return arr;
}

function cleanOptionText(text) {
if (!text) return &#39;&#39;;
return String(text).replace(/^[a-dA-D][\.\)]\s*/, &#39;&#39;).trim();
}

function updateScoreDisplay() {
const correctEl = document.getElementById(&#39;correct-count-display&#39;);
const wrongEl = document.getElementById(&#39;wrong-count-display&#39;);
if (correctEl) correctEl.innerText = AppState.correctCount;
if (wrongEl) wrongEl.innerText = AppState.wrongCount;
}

function getStoredWrongQuestions(maHS, mon) {
try {
const data = localStorage.getItem(&#39;wrong_q_&#39; + maHS + &#39;_&#39; + mon);
return data ? JSON.parse(data) : [];
} catch(e) { return []; }
}

function saveStoredWrongQuestions(maHS, mon, wrongs) {
try {
localStorage.setItem(&#39;wrong_q_&#39; + maHS + &#39;_&#39; + mon, JSON.stringify(wrongs));
} catch(e) {}
}

(function injectStyles() {
const style = document.createElement(&#39;style&#39;);
style.innerHTML = `
.quiz-card { background: #ffffff; border: 2px solid #540606; border-radius: 12px;
padding: 22px; margin-bottom: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); font-size:
1.15em; }
.option-box { background: #f8f9fa; border: 1px solid #540606; border-radius: 8px;
padding: 14px 18px; margin: 10px 0; cursor: pointer; transition: all 0.2s ease; font-
weight: 600; font-size: 1.1em; color: #111; }
.option-box:hover { background: #e9ecef; border-color: #adb5bd; }
.explanation-box { margin-top: 15px; padding: 14px; background: #fff3cd; border-
left: 5px solid #ffc107; border-radius: 4px; display: none; color: #856404; font-size:
1.05em; line-height: 1.5; font-weight: 500; }
.leaderboard-container { background: #fff; padding: 15px; border-radius: 12px; box-
shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #eee; }

.speech-btn { background: #ffc107; border: none; border-radius: 6px; padding: 6px
12px; cursor: pointer; font-size: 0.95em; font-weight: bold; color: #000; display: inline-
flex; align-items: center; gap: 4px; }
.speech-btn:hover { background: #e0a800; }
.passage-box { background: #ffffff; border: 2px solid #540606; border-radius: 12px;
padding: 22px; margin-bottom: 22px; font-size: 1.15em; line-height: 1.7; color: #222;
font-weight: 500; }
.passage-tag { display: inline-block; background: #e9ecef; border: 1px solid
#ced4da; padding: 6px 16px; font-weight: bold; border-radius: 6px; margin-bottom:
12px; color: #333; font-size: 1.05em; }
input[type=&quot;text&quot;], select { width: 100%; padding: 14px 18px; margin: 8px 0 15px 0;
border: 1px solid #540606; border-radius: 8px; box-sizing: border-box; font-size: 1.1em;
background: #ffffff; color: #000; font-weight: 500; }
#topic-container { width: 100%; background: #ffffff; border: 1px solid #540606;
border-radius: 8px; padding: 14px 18px; margin: 8px 0 15px 0; box-sizing: border-box;
min-height: 60px; max-height: 220px; overflow-y: auto; font-size: 1.05em; }
body.dark-mode { background-color: #121212 !important; color: #e0e0e0; }
body.dark-mode .container { background: #1e1e1e; color: #e0e0e0; box-shadow: 0
10px 25px rgba(0,0,0,0.5); }
body.dark-mode .quiz-card, body.dark-mode .passage-box { background: #2d2d2d;
border-color: #777; color: #e0e0e0; }
body.dark-mode .option-box { background: #3a3a3a; border-color: #666; color:
#e0e0e0; }
body.dark-mode .option-box:hover { background: #4a4a4a; border-color: #888; }
body.dark-mode input[type=&quot;text&quot;], body.dark-mode select { background: #2d2d2d;
color: #e0e0e0; border-color: #777; }
body.dark-mode #topic-container { background: #2d2d2d; border-color: #777;
color: #e0e0e0; }
.dark-mode-btn { position: absolute; top: 20px; right: 20px; background: #ffffff;
color: #333; border: 2px solid #540606; padding: 8px 14px; border-radius: 8px; cursor:
pointer; font-weight: bold; font-size: 1em; z-index: 10; }
`;
document.head.appendChild(style);

})();

if (&#39;speechSynthesis&#39; in window) {
window.speechSynthesis.getVoices();
}

document.addEventListener(&#39;click&#39;, function(e) {
const optionBox = e.target.closest(&#39;.option-box&#39;);
if (optionBox) {
const quizCard = optionBox.closest(&#39;.quiz-card&#39;);
if (quizCard) {
quizCard.querySelectorAll(&#39;.option-box&#39;).forEach(b =&gt;
b.classList.remove(&#39;selected-option&#39;));
optionBox.classList.add(&#39;selected-option&#39;);
}
}
});

window.speakQuestion = function(index) {
const item = AppState.currentQuizData[index];
if (!item) return;

const isListeningType = item.loai === &#39;listening_fill&#39; ||
cleanKey(item.loai).includes(&#39;listening&#39;) ||
cleanKey(item.chuDe).includes(&#39;listening&#39;) ||
cleanKey(item.chuDe).includes(&#39;listu&#39;);

let textToRead = &#39;&#39;;

if (isListeningType) {
// Ưu tiên đọc nội dung dạng listening fill
textToRead = item.passage || item.question || &#39;&#39;;
if (textToRead.includes(&#39;___&#39;) &amp;&amp; item.correct) {
textToRead = textToRead.replace(/_{2,}/g, item.correct);
} else if (textToRead.includes(&#39;...&#39;) &amp;&amp; item.correct) {
textToRead = textToRead.replace(/\.{3,}/g, item.correct);
}
} else {
let hasAnswered = false;
const quizCards = document.querySelectorAll(&#39;.quiz-card&#39;);
if (quizCards[index]) {
hasAnswered = quizCards[index].querySelector(&#39;.option-box.selected-option&#39;)
!== null ||
quizCards[index].querySelector(&#39;input[type=&quot;checkbox&quot;]:checked&#39;) !==
null ||
quizCards[index].querySelector(&#39;input:disabled&#39;) !== null ||
item._isAnswered;
}

if (!hasAnswered) {
textToRead = item.question || &#39;&#39;;
} else {
const chuDeLower = (item.chuDe || &#39;&#39;).toLowerCase();
const isVietAnh = chuDeLower.includes(&#39;việt anh&#39;) || chuDeLower.includes(&#39;viet
anh&#39;);

if (isVietAnh &amp;&amp; item.correct) {
textToRead = item.correct;
} else {
let correctKeys = item._correctKeys || getCorrectKeys(item);
if (correctKeys.length &gt; 0 &amp;&amp; item[correctKeys[0]]) {
textToRead = cleanOptionText(item[correctKeys[0]]);
} else if (item.correct) {
textToRead = cleanOptionText(item.correct);
} else {
textToRead = item.question;
}
}
}
}

// Nếu textToRead chứa liên kết âm thanh online (mp3, wav, Google Drive audio)
if (textToRead &amp;&amp; (textToRead.startsWith(&#39;http://&#39;) || textToRead.startsWith(&#39;https://&#39;))
&amp;&amp;
(textToRead.endsWith(&#39;.mp3&#39;) || textToRead.endsWith(&#39;.wav&#39;) ||
textToRead.endsWith(&#39;.m4a&#39;) || textToRead.includes(&#39;drive.google.com&#39;))) {
new Audio(textToRead).play().catch(() =&gt; alert(&quot;Không thể phát file âm thanh.&quot;));
return;
}

if (textToRead &amp;&amp; &#39;speechSynthesis&#39; in window) {
window.speechSynthesis.cancel();
const utterance = new SpeechSynthesisUtterance(textToRead);

utterance.lang = &#39;en-US&#39;;
utterance.rate = isListeningType ? 0.85 : 0.9;
window.speechSynthesis.speak(utterance);
}
};

function normalizeItem(item) {
if (!item) return null;
if (!Array.isArray(item) &amp;&amp; typeof item === &#39;object&#39;) {
const findKey = (possibleNames) =&gt; {
for (let name of possibleNames) {
const cleanN = cleanKey(name);
for (let realKey of Object.keys(item)) {
if (cleanKey(realKey) === cleanN) {
const val = item[realKey];
if (val !== undefined &amp;&amp; val !== null &amp;&amp; String(val).trim() !== &#39;&#39;) return
String(val).trim();
}
}
}
return &#39;&#39;;
};
return {
mon: findKey([&#39;mon&#39;, &#39;môn&#39;, &#39;subject&#39;]),
chuDe: findKey([&#39;chude&#39;, &#39;chủ đề&#39;, &#39;chu de&#39;, &#39;topic&#39;]),
question: findKey([&#39;question&#39;, &#39;noidungcauhoi&#39;, &#39;noi_dung_cau_hoi&#39;, &#39;noi_dung&#39;,
&#39;noidung&#39;, &#39;cauhoi&#39;, &#39;cau_hoi&#39;, &#39;cau&#39;, &#39;de_bai&#39;, &#39;de&#39;, &#39;nd&#39;, &#39;content&#39;, &#39;text&#39;]),
a: findKey([&#39;a&#39;, &#39;dapan_a&#39;, &#39;dap an a&#39;, &#39;đáp án a&#39;, &#39;option_a&#39;]),

b: findKey([&#39;b&#39;, &#39;dapan_b&#39;, &#39;dap an b&#39;, &#39;đáp án b&#39;, &#39;option_b&#39;]),
c: findKey([&#39;c&#39;, &#39;dapan_c&#39;, &#39;dap an c&#39;, &#39;đáp án c&#39;, &#39;option_c&#39;]),
d: findKey([&#39;d&#39;, &#39;dapan_d&#39;, &#39;dap an d&#39;, &#39;đáp án d&#39;, &#39;option_d&#39;]),
correct: findKey([&#39;correct&#39;, &#39;dapan_dung&#39;, &#39;dap an dung&#39;, &#39;đáp án đúng&#39;,
&#39;dapandung&#39;, &#39;đáp_án_đúng&#39;, &#39;answer&#39;]),
explanation: findKey([&#39;explanation&#39;, &#39;giaithich&#39;, &#39;giai_thich&#39;, &#39;diễn giải&#39;, &#39;dien giai&#39;,
&#39;giải thích&#39;]),
loai: findKey([&#39;loai&#39;, &#39;loại&#39;, &#39;type&#39;, &#39;kieu&#39;, &#39;kiểu&#39;]),
level: findKey([&#39;level&#39;, &#39;cấp độ&#39;, &#39;cap do&#39;, &#39;muc do&#39;]),
passage: findKey([&#39;passage&#39;, &#39;doanvan&#39;, &#39;đoạn văn&#39;, &#39;doan_van&#39;, &#39;đoạn_văn&#39;,
&#39;noidungdoanvan&#39;, &#39;reading&#39;, &#39;audio&#39;]),
made: findKey([&#39;made&#39;, &#39;ma_de&#39;, &#39;mã đề&#39;, &#39;madề&#39;])
};
}
let values = Array.isArray(item) ? item : [];
if (values.length === 0) return null;
let hasStt = /^\d+$/.test(String(values[0]).trim());
const getVal = (indexWithoutId) =&gt; {
let idx = hasStt ? indexWithoutId + 1 : indexWithoutId;
return (idx &lt; values.length &amp;&amp; values[idx] !== null) ? String(values[idx]).trim() : &#39;&#39;;
};
return {
mon: getVal(0), chuDe: getVal(1), question: getVal(2),
a: getVal(3), b: getVal(4), c: getVal(5), d: getVal(6),
correct: getVal(7), explanation: getVal(8), loai: getVal(9),
level: getVal(10), passage: getVal(11), made: getVal(12)
};
}

window.addEventListener(&#39;DOMContentLoaded&#39;, () =&gt; {
const savedMa = localStorage.getItem(&#39;saved_maHS&#39;) || &#39;&#39;;
const input = document.getElementById(&#39;student-code&#39;);
if (input &amp;&amp; savedMa) input.value = savedMa;
const startScreen = document.getElementById(&#39;start-screen&#39;);
if (startScreen &amp;&amp; !document.getElementById(&#39;dark-mode-toggle-btn&#39;)) {
const btn = document.createElement(&#39;button&#39;);
btn.id = &#39;dark-mode-toggle-btn&#39;;
btn.className = &#39;dark-mode-btn&#39;;
btn.innerHTML = localStorage.getItem(&#39;theme&#39;) === &#39;dark&#39; ? &#39;☀️ Sáng&#39; : &#39;�� Tối&#39;;
btn.onclick = window.toggleDarkMode;
startScreen.insertBefore(btn, startScreen.firstChild);
}
if (localStorage.getItem(&#39;theme&#39;) === &#39;dark&#39;) document.body.classList.add(&#39;dark-
mode&#39;);
if (startScreen &amp;&amp; !document.getElementById(&#39;practice-wrong-btn&#39;)) {
const wrongBtn = document.createElement(&#39;button&#39;);
wrongBtn.id = &#39;practice-wrong-btn&#39;;
wrongBtn.type = &#39;button&#39;;
wrongBtn.innerHTML = &#39;�� Luyện tập lại các câu đã làm sai&#39;;
wrongBtn.style.cssText = &#39;width: 100%; padding: 14px; background: #dc3545;
color: white; border: none; border-radius: 8px; cursor: pointer; margin-top: 12px; font-
weight: bold; font-size: 1.05em;&#39;;
wrongBtn.onclick = window.startWrongQuiz;

const startBtn = document.getElementById(&#39;start-btn&#39;);
if (startBtn) {

startBtn.parentNode.insertBefore(wrongBtn, startBtn.nextSibling);
}
}
if (savedMa) {
window.loadData();
}
});

window.toggleDarkMode = function() {
document.body.classList.toggle(&#39;dark-mode&#39;);
const isDark = document.body.classList.contains(&#39;dark-mode&#39;);
localStorage.setItem(&#39;theme&#39;, isDark ? &#39;dark&#39; : &#39;light&#39;);
const btn = document.getElementById(&#39;dark-mode-toggle-btn&#39;);
if (btn) btn.innerHTML = isDark ? &#39;☀️ Sáng&#39; : &#39;�� Tối&#39;;
};

window.handleSubjectChange = function() {
const mon = document.getElementById(&#39;subject-select&#39;).value;
const levelContainer = document.getElementById(&#39;level-container&#39;);
if (levelContainer) levelContainer.style.display = (mon === &#39;Tiếng Anh&#39;) ? &#39;block&#39; :
&#39;none&#39;;

window.updateTopicList();
window.updateMadeList();
window.renderLeaderboard(mon);
window.saveUserSelections();
};

window.updateMadeList = function() {
const monSelect = document.getElementById(&#39;subject-select&#39;) ?
document.getElementById(&#39;subject-select&#39;).value.trim() : &#39;&#39;;
const madeSelect = document.getElementById(&#39;made-select&#39;);
if (!madeSelect || !monSelect) return;
const cleanMonSelect = cleanKey(monSelect);

// Thu thập danh sách MÃ ĐỀ và danh sách nội dung LIST_U1, LIST_U2,...
let madesList = [];
AppState.allQuizData.forEach(i =&gt; {
if (cleanKey(i.mon) === cleanMonSelect) {
if (i.made &amp;&amp; String(i.made).trim() !== &#39;&#39;) {
madesList.push(String(i.made).trim());
}
if (i.chuDe &amp;&amp; (cleanKey(i.chuDe).startsWith(&#39;list&#39;) ||
cleanKey(i.chuDe).startsWith(&#39;made&#39;))) {
madesList.push(String(i.chuDe).trim());
}
}
});

const mades = [...new Set(madesList)].filter(Boolean);
madeSelect.innerHTML = &#39;&lt;option value=&quot;&quot;&gt;-- Chọn mã đề --&lt;/option&gt;&#39; +
mades.map(m =&gt; &#39;&lt;option value=&quot;&#39; + escapeHTML(m) + &#39;&quot;&gt;Mã đề: &#39; + escapeHTML(m)
+ &#39;&lt;/option&gt;&#39;).join(&#39;&#39;);
};

window.updateTopicList = function() {
const monSelect = document.getElementById(&#39;subject-select&#39;) ?
document.getElementById(&#39;subject-select&#39;).value.trim() : &#39;&#39;;
const maHS = document.getElementById(&#39;student-code&#39;).value.trim();
const container = document.getElementById(&#39;topic-container&#39;);
if (!container || !monSelect) return;
const cleanMonSelect = cleanKey(monSelect);
const allowed = AppState.userPermissions
.filter(p =&gt; String(p.maHS).trim() === maHS &amp;&amp; cleanKey(p.mon) ===
cleanMonSelect)
.map(p =&gt; String(p.chuDe).trim());
const topics = [...new Set(AppState.allQuizData
.filter(i =&gt; cleanKey(i.mon) === cleanMonSelect &amp;&amp; i.question !== &#39;&#39;)
.map(i =&gt; i.chuDe))].filter(Boolean);
if (topics.length === 0) {
container.innerHTML = &quot;Không tìm thấy chủ đề cho môn này.&quot;;
return;
}

const hasSpecificPerms = AppState.userPermissions.some(p =&gt;
String(p.maHS).trim() === maHS &amp;&amp; cleanKey(p.mon) === cleanMonSelect);
const authorizedTopics = hasSpecificPerms ? topics.filter(topic =&gt;
allowed.includes(topic)) : topics;

if (authorizedTopics.length === 0) {
container.innerHTML = &#39;&lt;i style=&quot;color: #d9534f;&quot;&gt;Bạn chưa được phân quyền chủ
đề nào cho môn này.&lt;/i&gt;&#39;;
return;
}

container.innerHTML = authorizedTopics.map(topic =&gt; {
return &#39;&lt;label style=&quot;display:block; margin:8px 0; font-size: 1.05em; cursor:
pointer;&quot;&gt;&lt;input type=&quot;checkbox&quot; name=&quot;topic&quot; value=&quot;&#39; + escapeHTML(topic) + &#39;&quot;
onchange=&quot;window.saveUserSelections()&quot; checked style=&quot;width: 18px; height: 18px;
vertical-align: middle; margin-right: 6px;&quot;&gt; &#39; + escapeHTML(topic) + &#39;&lt;/label&gt;&#39;;
}).join(&#39;&#39;);
};

window.toggleAllTopics = function() {
const checkboxes = document.querySelectorAll(&#39;input[name=&quot;topic&quot;]&#39;);
if (checkboxes.length === 0) return;
const allChecked = Array.from(checkboxes).every(cb =&gt; cb.checked);
checkboxes.forEach(cb =&gt; cb.checked = !allChecked);
window.saveUserSelections();
};

window.initInterface = function() {
const subjectSelect = document.getElementById(&#39;subject-select&#39;);
if (subjectSelect) {
const subjects = [...new Set(AppState.allQuizData.map(i =&gt; i.mon).filter(s =&gt; s &amp;&amp;
cleanKey(s) !== &#39;id&#39;))];
subjectSelect.innerHTML = &#39;&lt;option value=&quot;&quot;&gt;-- Chọn môn --&lt;/option&gt;&#39; +
subjects.map(s =&gt; &#39;&lt;option value=&quot;&#39; + escapeHTML(s) + &#39;&quot;&gt;&#39; + escapeHTML(s) +
&#39;&lt;/option&gt;&#39;).join(&#39;&#39;);
}
window.renderLeaderboard();
window.updateTopicList();
window.updateMadeList();
window.restoreUserSelections();

};

window.loadData = function() {
const maHS = document.getElementById(&#39;student-code&#39;).value.trim();
if (!maHS) return alert(&quot;Vui lòng nhập mã học sinh!&quot;);

const oldMa = localStorage.getItem(&#39;saved_maHS&#39;);
if (oldMa !== maHS) {
localStorage.removeItem(&#39;saved_mon&#39;);
}
localStorage.setItem(&#39;saved_maHS&#39;, maHS);
const container = document.getElementById(&#39;topic-container&#39;);
if (container) container.innerHTML = &quot;Đang tải dữ liệu...&quot;;
const script = document.createElement(&#39;script&#39;);
script.src = API_URL + &#39;?ma=&#39; + encodeURIComponent(maHS) +
&#39;&amp;callback=handleQuizData&#39;;
script.onerror = () =&gt; {
script.remove();
if (container) container.innerHTML = &quot;Lỗi kết nối mạng khi tải dữ liệu.&quot;;
};
document.body.appendChild(script);
script.onload = () =&gt; script.remove();
};

window.handleQuizData = function(data) {
if (data &amp;&amp; !data.error &amp;&amp; data.questions &amp;&amp; data.questions.length &gt; 0) {
let lastMon = &#39;&#39;, lastChuDe = &#39;&#39;, lastLevel = &#39;&#39;, lastLoai = &#39;&#39;, lastPassage = &#39;&#39;,
lastMade = &#39;&#39;;

AppState.allQuizData = (data.questions || []).map(rawItem =&gt; {
let item = normalizeItem(rawItem);
if (!item) return null;
if (item.mon) {
lastMon = standardizeSubject(item.mon);
lastChuDe = &#39;&#39;; lastLevel = &#39;&#39;; lastLoai = &#39;&#39;; lastPassage = &#39;&#39;; lastMade = &#39;&#39;;
}
item.mon = lastMon;
if (item.made) {
if (item.made !== lastMade) lastPassage = &#39;&#39;;
lastMade = item.made;
} else if (lastMade) {
item.made = lastMade;
}
if (item.chuDe) lastChuDe = item.chuDe; else item.chuDe = lastChuDe;
if (item.level) lastLevel = item.level; else if (lastLevel) item.level = lastLevel;
if (item.loai) lastLoai = item.loai; else if (lastLoai) item.loai = lastLoai;
if (item.passage) lastPassage = item.passage; else if (lastPassage)
item.passage = lastPassage;
return item;
}).filter(item =&gt; item &amp;&amp; item.question !== &#39;&#39; &amp;&amp; item.mon !== &#39;&#39; &amp;&amp;
cleanKey(item.mon) !== &#39;id&#39;);
AppState.userPermissions = (data.permissions || []).map(p =&gt; ({
maHS: String(p.maHS || p[0] || &#39;&#39;).trim(),
mon: standardizeSubject(String(p.mon || p[1] || &#39;&#39;).trim()),
chuDe: String(p.chuDe || p[2] || &#39;&#39;).trim()
})).filter(p =&gt; p.chuDe !== &#39;&#39;);
AppState.rankings = [];

if (data.rankings &amp;&amp; Array.isArray(data.rankings)) {
data.rankings.forEach(raw =&gt; {
if (!raw) return;

let item = null;
if (Array.isArray(raw)) {
item = {
name: String(raw[0] || &#39;&#39;).trim(),
score: Number(raw[1] || 0),
subject: standardizeSubject(String(raw[2] || &#39;&#39;).trim()),
level: String(raw[3] || &#39;&#39;).trim(),
chuDe: String(raw[4] || &#39;&#39;).trim(),
date: String(raw[5] || &#39;&#39;).trim()
};
} else if (typeof raw === &#39;object&#39;) {
const getVal = (keys) =&gt; {
for (let k of keys) {
for (let rk of Object.keys(raw)) {
if (cleanKey(rk) === cleanKey(k)) {
return raw[rk];
}
}
}
return &#39;&#39;;
};
item = {
name: String(getVal([&#39;name&#39;, &#39;hoten&#39;, &#39;ho_ten&#39;, &#39;hovaten&#39;, &#39;họ tên&#39;])).trim(),

score: Number(getVal([&#39;score&#39;, &#39;diem&#39;, &#39;điểm&#39;]) || 0),
subject: standardizeSubject(String(getVal([&#39;subject&#39;, &#39;mon&#39;,
&#39;môn&#39;])).trim()),
level: String(getVal([&#39;level&#39;, &#39;capdo&#39;, &#39;cấp độ&#39;])).trim(),
chuDe: String(getVal([&#39;chude&#39;, &#39;topic&#39;, &#39;chủ đề&#39;])).trim(),
date: String(getVal([&#39;date&#39;, &#39;ngay&#39;, &#39;ngày&#39;])).trim()
};
}
if (item &amp;&amp; item.name !== &#39;&#39;) {
let lowerName = item.name.toLowerCase();
let lowerSubj = cleanKey(item.subject);
if (lowerName === &#39;họ tên&#39; || lowerName === &#39;hoten&#39; || lowerName ===
&#39;name&#39; || lowerSubj === &#39;mon&#39; || lowerSubj === &#39;môn&#39;) {
return;
}
AppState.rankings.push(item);
}
});
}
window.initInterface();
}
};

function parseCustomDate(dateStr) {
if (!dateStr) return 0;
let str = String(dateStr).trim();
let parts = str.split(/[\s/\-:]+/);
if (parts.length &gt;= 5) {

let day = parseInt(parts[0], 10);
let month = parseInt(parts[1], 10) - 1;
let year = parseInt(parts[2], 10);
let hour = parseInt(parts[3], 10) || 0;
let minute = parseInt(parts[4], 10) || 0;
let second = parseInt(parts[5], 10) || 0;
return new Date(year, month, day, hour, minute, second).getTime();
}
let parsed = Date.parse(str);
return isNaN(parsed) ? 0 : parsed;
}

window.renderLeaderboard = function(subjectFilter = null) {
const list = document.getElementById(&#39;ranking-list&#39;);
if (!list) return;

let activeSubject = subjectFilter &amp;&amp; subjectFilter !== &quot;-- Chọn môn --&quot; ? subjectFilter :
null;

let studentSubjects = {};
AppState.rankings.forEach(item =&gt; {
let name = String(item.name || &#39;&#39;).trim();
let subj = String(item.subject || &#39;&#39;).trim();
if (!name || !subj) return;
let key = name + &#39;___&#39; + subj;
if (!studentSubjects[key]) {
studentSubjects[key] = { name: name, subject: subj };

}
});
let kimCuongList = [];
let vangList = [];
let bacList = [];
let dongList = [];
for (let key in studentSubjects) {
let st = studentSubjects[key];
if (activeSubject &amp;&amp; cleanKey(st.subject) !== cleanKey(activeSubject)) continue;

let attempts = AppState.rankings.filter(r =&gt; {
let rName = String(r.name || &#39;&#39;).trim().toLowerCase();
let rSubj = cleanKey(r.subject || &#39;&#39;);
return rName === st.name.toLowerCase() &amp;&amp; rSubj === cleanKey(st.subject);
});
if (attempts.length === 0) continue;
attempts.forEach(a =&gt; {
let s = a.score !== undefined ? a.score : 0;
a._parsedScore = Number(s) || 0;
});
let bestScore = Math.max(...attempts.map(a =&gt; a._parsedScore));
let latestAttempt = attempts[attempts.length - 1];
let hasExplicitLevel = attempts.some(a =&gt; a.level &amp;&amp; a.level.trim() !== &#39;&#39;);
let record = {
name: st.name,
subject: st.subject,
score: bestScore,

date: latestAttempt.date || &#39;&#39;
};
if (hasExplicitLevel) {
attempts.forEach(a =&gt; {
let lvl = String(a.level || &#39;&#39;).trim();
let rec = { name: st.name, subject: st.subject, score: Number(a.score) ||
bestScore, date: a.date || &#39;&#39; };
if (lvl === &quot;Kim Cương&quot; &amp;&amp; !kimCuongList.some(x =&gt; x.name === st.name &amp;&amp;
x.subject === st.subject)) kimCuongList.push(rec);
if (lvl === &quot;Vàng&quot; &amp;&amp; !vangList.some(x =&gt; x.name === st.name &amp;&amp; x.subject
=== st.subject)) vangList.push(rec);
if (lvl === &quot;Bạc&quot; &amp;&amp; !bacList.some(x =&gt; x.name === st.name &amp;&amp; x.subject ===
st.subject)) bacList.push(rec);
if (lvl === &quot;Đồng&quot; &amp;&amp; !dongList.some(x =&gt; x.name === st.name &amp;&amp; x.subject
=== st.subject)) dongList.push(rec);
});
} else {
let count10 = attempts.filter(a =&gt; a._parsedScore === 10).length;
let count9 = attempts.filter(a =&gt; a._parsedScore &gt;= 9).length;
let count8 = attempts.filter(a =&gt; a._parsedScore &gt;= 8).length;
let sortedAttempts = [...attempts].sort((a, b) =&gt; parseCustomDate(a.date) -
parseCustomDate(b.date));
let isKimCuong = false;
if (sortedAttempts.length &gt;= 3) {
for (let i = 0; i &lt;= sortedAttempts.length - 3; i++) {
let s1 = sortedAttempts[i]._parsedScore;
let s2 = sortedAttempts[i+1]._parsedScore;
let s3 = sortedAttempts[i+2]._parsedScore;
let t1 = extractTopicFlexible(sortedAttempts[i]);

let t2 = extractTopicFlexible(sortedAttempts[i+1]);
let t3 = extractTopicFlexible(sortedAttempts[i+2]);
if (s1 === 10 &amp;&amp; s2 === 10 &amp;&amp; s3 === 10) {
if (!t1 || !t2 || !t3 || (t1 !== t2 &amp;&amp; t2 !== t3 &amp;&amp; t1 !== t3)) {
isKimCuong = true;
break;
}
}
}
}
if (isKimCuong) kimCuongList.push(record);
if (count10 &gt; 0) vangList.push(record);
if (count9 &gt;= 2) bacList.push(record);
if (count8 &gt;= 2) dongList.push(record);
}
}
kimCuongList.sort((a, b) =&gt; b.score - a.score);
vangList.sort((a, b) =&gt; b.score - a.score);
bacList.sort((a, b) =&gt; b.score - a.score);
dongList.sort((a, b) =&gt; b.score - a.score);
function buildGroupHtml(title, color, listItems) {
if (listItems.length === 0) {
return `&lt;div style=&quot;margin-bottom: 12px; font-size: 1.02em;&quot;&gt;&lt;b&gt;${title}:&lt;/b&gt;
&lt;span style=&quot;color: #888; font-style: italic;&quot;&gt;Chưa có học sinh đạt chuẩn&lt;/span&gt;&lt;/div&gt;`;
}
let itemsHtml = listItems.map(item =&gt;

`&lt;li style=&quot;margin: 6px 0;&quot;&gt;&lt;b&gt;${escapeHTML(item.name)}&lt;/b&gt; (Môn: &lt;span
style=&quot;color: #007bff; font-weight: 600;&quot;&gt;${escapeHTML(item.subject)}&lt;/span&gt; - Điểm
cao nhất: ${item.score} đ)&lt;/li&gt;`
).join(&#39;&#39;);
return `&lt;div style=&quot;margin-bottom: 16px;&quot;&gt;
&lt;b style=&quot;color: ${color}; font-size: 1.1em;&quot;&gt;${title}:&lt;/b&gt;
&lt;ul style=&quot;margin: 6px 0 0 20px; padding: 0; font-size:
1.05em;&quot;&gt;${itemsHtml}&lt;/ul&gt;
&lt;/div&gt;`;
}
let html = &#39;&lt;div style=&quot;display: flex; flex-direction: column; gap: 8px;&quot;&gt;&#39;;
html += buildGroupHtml(&#39;�� Kim Cương (3 lần liên tiếp đạt 10 điểm, khác chủ đề)&#39;,
&#39;#007bff&#39;, kimCuongList);
html += buildGroupHtml(&#39;�� Vàng (Có ít nhất 1 lần đạt 10 điểm)&#39;, &#39;#d9822b&#39;, vangList);
html += buildGroupHtml(&#39;�� Bạc (Có ít nhất 1 lần đạt 9 điểm trở lên và nhỏ hơn 10)&#39;,
&#39;#6c757d&#39;, bacList);
html += buildGroupHtml(&#39;�� Đồng (Có ít nhất 1 lần đạt 8 điểm trở lên và nhỏ hơn 9)&#39;,
&#39;#cd7f32&#39;, dongList);
html += &#39;&lt;/div&gt;&#39;;
list.innerHTML = html;
};

function extractTopicFlexible(att) {
let raw = att.chuDe || att[&#39;Chủ đề&#39;] || att.topic || att.tieuDe || att.baiHoc || &#39;&#39;;
if (raw) return cleanKey(raw);

for (let key in att) {
let val = att[key];

if (typeof val === &#39;string&#39; &amp;&amp; val.length &gt; 2 &amp;&amp; ![&#39;name&#39;, &#39;subject&#39;, &#39;date&#39;, &#39;score&#39;, &#39;Họ
tên&#39;, &#39;Môn&#39;, &#39;Ngày&#39;, &#39;Điểm&#39;].includes(key)) {
return cleanKey(val);
}
}
return &#39;&#39;;
}

function getCorrectKeys(item) {
const raw = String(item.correct || &#39;&#39;).trim();
if (!raw) return [];

let keys = [];

for (let k of [&#39;a&#39;, &#39;b&#39;, &#39;c&#39;, &#39;d&#39;]) {
if (item[k] &amp;&amp; cleanOptionText(String(item[k])).toLowerCase() ===
cleanOptionText(raw).toLowerCase()) {
keys.push(k);
}
}
if (keys.length &gt; 0) return [...new Set(keys)];
let parts = raw.split(/[\s,;]+/);
for (let p of parts) {
let upper = p.toUpperCase();
if ([&#39;A&#39;, &#39;B&#39;, &#39;C&#39;, &#39;D&#39;].includes(upper)) {
keys.push(upper.toLowerCase());
} else {
for (let k of [&#39;a&#39;, &#39;b&#39;, &#39;c&#39;, &#39;d&#39;]) {

if (item[k] &amp;&amp; cleanOptionText(String(item[k])).toLowerCase() ===
cleanOptionText(p).toLowerCase()) {
keys.push(k);
}
}
}
}
return [...new Set(keys)];
}

window.startQuiz = function() {
const subjectSelect = document.getElementById(&#39;subject-select&#39;);
const selectedSubject = subjectSelect ? subjectSelect.value.toLowerCase() : &#39;&#39;;
// 1. Kiểm tra chọn môn học
const mon = subjectSelect ? subjectSelect.value : &#39;&#39;;
if (!mon) {
return alert(&quot;Vui lòng chọn môn học trước khi bắt đầu!&quot;);
}
const maHS = document.getElementById(&#39;student-code&#39;) ?
document.getElementById(&#39;student-code&#39;).value.trim() :
localStorage.getItem(&#39;saved_maHS&#39;);

// 2. Ẩn / Hiện các công cụ tương ứng với môn học (Toán / Tiếng Anh)
const btnCalc = document.getElementById(&#39;btn-calc&#39;);
const btnDict = document.getElementById(&#39;btn-dict&#39;);
const btnVerbs = document.getElementById(&#39;btn-verbs&#39;);
const isMath = selectedSubject.includes(&#39;toán&#39;) || selectedSubject.includes(&#39;math&#39;);

const isEnglish = selectedSubject.includes(&#39;anh&#39;) ||
selectedSubject.includes(&#39;english&#39;);
if (btnCalc &amp;&amp; btnDict &amp;&amp; btnVerbs) {
if (isMath) {
btnCalc.style.display = &#39;block&#39;; // Hiện máy tính
btnDict.style.display = &#39;none&#39;; // Ẩn tra từ
btnVerbs.style.display = &#39;none&#39;; // Ẩn động từ bất quy tắc
} else if (isEnglish) {
btnCalc.style.display = &#39;none&#39;; // Ẩn máy tính
btnDict.style.display = &#39;block&#39;; // Hiện tra từ
btnVerbs.style.display = &#39;block&#39;; // Hiện động từ bất quy tắc
}
}

// 3. Kiểm tra Mã đề (MADE) - Khóa 6 tiếng nếu từng đạt điểm 10
const toggleMade = document.getElementById(&#39;toggle-made&#39;);
const selectedMade = (toggleMade &amp;&amp; toggleMade.checked &amp;&amp;
document.getElementById(&#39;made-select&#39;)) ? document.getElementById(&#39;made-
select&#39;).value.trim() : &#39;&#39;;
if (selectedMade) {
const tenPointTimeKey = &#39;made_10_time_&#39; + maHS + &#39;_&#39; + mon + &#39;_&#39; +
selectedMade;
const lastTenPointTime = localStorage.getItem(tenPointTimeKey);
if (lastTenPointTime) {
const elapsedHours = (Date.now() - Number(lastTenPointTime)) / (1000 * 60 *
60);
if (elapsedHours &lt; 6) {
const remainingHours = Math.ceil(6 - elapsedHours);

return alert(`Bạn đã đạt điểm tuyệt đối (10 điểm) cho mã đề
&quot;${selectedMade}&quot;. Xin chọn nội dung khác hoặc có thể làm lại sau khoảng
${remainingHours} tiếng nữa!`);
}
}
}

// 4. Kiểm tra điều kiện mở Level 2 &amp; Level 3
const levelSelect = document.getElementById(&#39;level-select&#39;);
const selectedLevel = levelSelect ? levelSelect.value : &#39;&#39;;
const selectedTopics =
Array.from(document.querySelectorAll(&#39;input[name=&quot;topic&quot;]:checked&#39;)).map(cb =&gt;
cb.value);
if (selectedLevel === &#39;Level 2&#39; || selectedLevel === &#39;Level 3&#39; || selectedLevel === &#39;2&#39; ||
selectedLevel === &#39;3&#39; || selectedLevel.includes(&#39;2&#39;) || selectedLevel.includes(&#39;3&#39;)) {
if (!selectedTopics.length) return alert(&quot;Vui lòng chọn chủ đề!&quot;);
for (let topic of selectedTopics) {
let topicAttempts = AppState.rankings.filter(r =&gt;
String(r.name).trim().toLowerCase() === maHS.toLowerCase() &amp;&amp;
cleanKey(r.subject || &#39;&#39;) === cleanKey(mon) &amp;&amp;
(String(r.level || &#39;&#39;).includes(&#39;1&#39;)) &amp;&amp;
(cleanKey(r.chuDe || &#39;&#39;) === cleanKey(topic) || !r.chuDe)
);
let hasThreeConsecutive = false;
if (topicAttempts.length &gt;= 3) {
for (let i = 0; i &lt;= topicAttempts.length - 3; i++) {
let s1 = Number(topicAttempts[i].score);
let s2 = Number(topicAttempts[i+1].score);
let s3 = Number(topicAttempts[i+2].score);

if (s1 &gt;= 8 &amp;&amp; s2 &gt;= 8 &amp;&amp; s3 &gt;= 8) {
hasThreeConsecutive = true;
break;
}
}
}
if (!hasThreeConsecutive) {
return alert(`Bạn chưa đạt 3 lần liên tiếp từ 8 điểm trở lên ở Level 1 đối với
chủ đề &quot;${topic}&quot; nên chưa được phép chọn mức 2, 3!`);
}
}
}
window.saveUserSelections();

let rawSelectedQuestions = [];
let totalSeconds = 10 * 60;
const cleanM = standardizeSubject(mon);

if (selectedMade) {
rawSelectedQuestions = AppState.allQuizData.filter(i =&gt;
cleanKey(i.mon) === cleanKey(mon) &amp;&amp;
(String(i.made).trim() === selectedMade || String(i.chuDe).trim() ===
selectedMade) &amp;&amp;
i.question !== &#39;&#39;
);
totalSeconds = 45 * 60;
} else {
if (!selectedTopics.length) return alert(&quot;Vui lòng chọn chủ đề!&quot;);

const isIrregularVerbs = selectedTopics.some(t =&gt;
cleanKey(t).includes(&#39;dongtubatquytac&#39;) ||
t.toLowerCase().includes(&#39;động từ bất quy tắc&#39;)
);
const isPreposition = selectedTopics.some(t =&gt;
cleanKey(t).includes(&#39;preposition&#39;) ||
t.toLowerCase().includes(&#39;giới từ&#39;)
);
const isListeningFill = selectedTopics.some(t =&gt;
cleanKey(t).includes(&#39;listeningfill&#39;) ||
cleanKey(t).includes(&#39;listening&#39;) ||
cleanKey(t).includes(&#39;listu&#39;) ||
t.toLowerCase().includes(&#39;listening_fill&#39;) ||
t.toLowerCase().includes(&#39;nghe&#39;)
);

let storedWrongs = getStoredWrongQuestions(maHS, mon);
let targetCount = 20;
let topicPool = AppState.allQuizData.filter(i =&gt;
cleanKey(i.mon) === cleanKey(mon) &amp;&amp;
selectedTopics.includes(i.chuDe) &amp;&amp;
i.question !== &#39;&#39;
);
let uniquePool = [];
let seenQ = new Set();
for (let item of topicPool) {
if (!seenQ.has(item.question + (item.a || &#39;&#39;))) {

seenQ.add(item.question + (item.a || &#39;&#39;));
uniquePool.push(item);
}
}

if (isIrregularVerbs) {
targetCount = 10;
totalSeconds = 10 * 60;
let verbMap = {};
uniquePool.forEach(item =&gt; {
let verb = &#39;&#39;;
let match = item.question.match(/[&quot;&#39;]([^&quot;&#39;]+)[&quot;&#39;]/);
if (match) {
verb = match[1].toLowerCase().trim();
} else {
let matchDt = item.question.match(/(?:động từ|từ)\s+[&quot;&#39;]?([a-zA-Z\-]+)[&quot;&#39;]?/i);
if (matchDt) {
verb = matchDt[1].toLowerCase().trim();
} else {
let cleanQ = item.question.toLowerCase()
.replace(/dạng quá khứ|v2|v3|của|động từ|là gì|\(|\)|\?/g, &#39;&#39;)
.trim();
verb = cleanQ || item.question.toLowerCase();
}
}
if (!verbMap[verb]) {
verbMap[verb] = { textQ: [], mcqQ: [] };

}
let hasOptions = item.a || item.b || item.c || item.d;
if (!hasOptions) {
verbMap[verb].textQ.push(item);
} else {
verbMap[verb].mcqQ.push(item);
}
});
let finalSelected = [];
let verbs = Object.keys(verbMap);
verbs = shuffleArray(verbs);
for (let v of verbs) {
if (finalSelected.length &gt;= 10) break;
let group = verbMap[v];
if (group.textQ.length &gt; 0 &amp;&amp; finalSelected.length &lt; 10) {
finalSelected.push(group.textQ[Math.floor(Math.random() *
group.textQ.length)]);
}
if (group.mcqQ.length &gt; 0 &amp;&amp; finalSelected.length &lt; 10) {
finalSelected.push(group.mcqQ[Math.floor(Math.random() *
group.mcqQ.length)]);
}
}
rawSelectedQuestions = finalSelected;
} else if (isPreposition) {
targetCount = 10;
totalSeconds = 5 * 60;

let wrongPool = uniquePool.filter(i =&gt; storedWrongs.some(w =&gt; w.question ===
i.question));
let normalPool = shuffleArray(uniquePool.filter(i =&gt; !storedWrongs.some(w =&gt;
w.question === i.question)));
rawSelectedQuestions = [...wrongPool, ...normalPool];
if (rawSelectedQuestions.length &gt; targetCount) {
rawSelectedQuestions = rawSelectedQuestions.slice(0, targetCount);
}
} else if (isListeningFill) {
targetCount = 10;
totalSeconds = 15 * 60;
let wrongPool = uniquePool.filter(i =&gt; storedWrongs.some(w =&gt; w.question ===
i.question));
let normalPool = shuffleArray(uniquePool.filter(i =&gt; !storedWrongs.some(w =&gt;
w.question === i.question)));
rawSelectedQuestions = [...wrongPool, ...normalPool];
if (rawSelectedQuestions.length &gt; targetCount) {
rawSelectedQuestions = rawSelectedQuestions.slice(0, targetCount);
}
} else {
if (cleanM === &#39;Tiếng Anh&#39;) {
targetCount = 20;
totalSeconds = 10 * 60;
} else if (cleanM === &#39;Toán&#39;) {
targetCount = 10;
totalSeconds = 20 * 60;
} else if (cleanM === &#39;Tiếng Việt&#39;) {
targetCount = 10;

totalSeconds = 15 * 60;
}
let wrongPool = uniquePool.filter(i =&gt; storedWrongs.some(w =&gt; w.question ===
i.question &amp;&amp; w.chuDe === i.chuDe));
let normalPool = shuffleArray(uniquePool.filter(i =&gt; !storedWrongs.some(w =&gt;
w.question === i.question &amp;&amp; w.chuDe === i.chuDe)));
rawSelectedQuestions = [...wrongPool, ...normalPool];
if (rawSelectedQuestions.length &gt; targetCount) {
rawSelectedQuestions = rawSelectedQuestions.slice(0, targetCount);
}
}
}
if (rawSelectedQuestions.length === 0) return alert(&quot;Không tìm thấy câu hỏi phù
hợp!&quot;);
AppState.currentQuizData = rawSelectedQuestions.map(item =&gt; {
let correctKeys = getCorrectKeys(item);
let validKeys = [&#39;a&#39;, &#39;b&#39;, &#39;c&#39;, &#39;d&#39;].filter(k =&gt; item[k] !== &#39;&#39;);
validKeys = shuffleArray(validKeys);
return { ...item, _shuffledKeys: validKeys, _correctKeys: correctKeys };
});
AppState.correctCount = 0;
AppState.wrongCount = 0;
const startScreen = document.getElementById(&#39;start-screen&#39;);
if (startScreen) startScreen.style.display = &#39;none&#39;;
const quizScreen = document.getElementById(&#39;quiz-screen&#39;);
if (quizScreen) quizScreen.style.display = &#39;block&#39;;
window.addEventListener(&#39;beforeunload&#39;, handleBeforeUnload);
updateScoreDisplay();

window.renderQuiz();
window.startTimerTotal(totalSeconds);
};

window.startWrongQuiz = function() {
const mon = document.getElementById(&#39;subject-select&#39;) ?
document.getElementById(&#39;subject-select&#39;).value : &#39;&#39;;
if (!mon) return alert(&quot;Vui lòng chọn môn học để ôn tập câu sai!&quot;);
const maHS = document.getElementById(&#39;student-code&#39;) ?
document.getElementById(&#39;student-code&#39;).value.trim() :
localStorage.getItem(&#39;saved_maHS&#39;);
let storedWrongs = getStoredWrongQuestions(maHS, mon);
if (storedWrongs.length === 0) {
return alert(&quot;Tuyệt vời! Bạn chưa có câu hỏi sai nào cần luyện tập lại trong môn
này.&quot;);
}
let rawSelectedQuestions = AppState.allQuizData.filter(i =&gt;
cleanKey(i.mon) === cleanKey(mon) &amp;&amp;
storedWrongs.some(w =&gt; w.question === i.question) &amp;&amp;
i.question !== &#39;&#39;
);
if (rawSelectedQuestions.length === 0) {
return alert(&quot;Không tìm thấy dữ liệu câu sai tương ứng trong hệ thống!&quot;);
}
AppState.currentQuizData = rawSelectedQuestions.map(item =&gt; {
let correctKeys = getCorrectKeys(item);
let validKeys = [&#39;a&#39;, &#39;b&#39;, &#39;c&#39;, &#39;d&#39;].filter(k =&gt; item[k] !== &#39;&#39;);
validKeys = shuffleArray(validKeys);

return { ...item, _shuffledKeys: validKeys, _correctKeys: correctKeys };
});
AppState.correctCount = 0;
AppState.wrongCount = 0;
const startScreen = document.getElementById(&#39;start-screen&#39;);
if (startScreen) startScreen.style.display = &#39;none&#39;;
const quizScreen = document.getElementById(&#39;quiz-screen&#39;);
if (quizScreen) quizScreen.style.display = &#39;block&#39;;
window.addEventListener(&#39;beforeunload&#39;, handleBeforeUnload);
updateScoreDisplay();
window.renderQuiz();
window.startTimerTotal(10 * 60);
};

window.renderQuiz = function() {
const container = document.getElementById(&#39;quiz&#39;);
if (!container) return;
let renderedPassages = new Set();
let html = &#39;&#39;;
AppState.currentQuizData.forEach((item, index) =&gt; {
let passage = item.passage;
if (passage &amp;&amp; passage.trim() !== &#39;&#39; &amp;&amp; !renderedPassages.has(passage)) {
renderedPassages.add(passage);
html += &#39;&lt;div class=&quot;passage-box&quot;&gt;&lt;div class=&quot;passage-tag&quot;&gt;�� Đoạn văn / Bài
nghe đọc hiểu&lt;/div&gt;&lt;div style=&quot;white-space: pre-line; margin-top: 10px;&quot;&gt;&#39; +
escapeHTML(passage) + &#39;&lt;/div&gt;&lt;/div&gt;&#39;;
}
let hasOptions = item.a || item.b || item.c || item.d;

let bodyHtml = &#39;&#39;;
let correctKeys = item._correctKeys || [];
let isMultiChoice = correctKeys.length &gt; 1;

if (hasOptions) {
let keysToRender = item._shuffledKeys || [&#39;a&#39;, &#39;b&#39;, &#39;c&#39;, &#39;d&#39;].filter(k =&gt; item[k]);
bodyHtml = keysToRender.map((optKey, displayIndex) =&gt; {
if (!item[optKey]) return &#39;&#39;;
let displayLetter = String.fromCharCode(65 + displayIndex);
let cleanText = cleanOptionText(item[optKey]);

if (isMultiChoice) {
return &#39;&lt;label class=&quot;option-box&quot; style=&quot;display: block; cursor: pointer;&quot;
id=&quot;q&#39; + index + &#39;-opt-&#39; + optKey + &#39;&quot;&gt;&#39; +
&#39;&lt;input type=&quot;checkbox&quot; name=&quot;multi-q&#39; + index + &#39;&quot; value=&quot;&#39; + optKey
+ &#39;&quot; style=&quot;margin-right: 10px; width: 18px; height: 18px; cursor: pointer; vertical-align:
middle;&quot;&gt;&#39; +
&#39;&lt;b&gt;&#39; + displayLetter + &#39;.&lt;/b&gt; &#39; + escapeHTML(cleanText) + &#39;&lt;/label&gt;&#39;;
} else {
return &#39;&lt;div class=&quot;option-box&quot; onclick=&quot;window.selectAnswer(&#39; + index + &#39;,
\&#39;&#39; + optKey + &#39;\&#39;)&quot; id=&quot;q&#39; + index + &#39;-opt-&#39; + optKey + &#39;&quot;&gt;&lt;b&gt;&#39; + displayLetter + &#39;.&lt;/b&gt; &#39; +
escapeHTML(cleanText) + &#39;&lt;/div&gt;&#39;;
}
}).join(&#39;&#39;);
if (isMultiChoice) {
bodyHtml += &#39;&lt;button type=&quot;button&quot; onclick=&quot;window.submitMultiAnswer(&#39; +
index + &#39;)&quot; id=&quot;multi-btn-&#39; + index + &#39;&quot; style=&quot;margin-top: 12px; background: #007bff;
color: white; border: none; padding: 12px 22px; border-radius: 8px; font-weight: bold;
cursor: pointer; font-size: 1.05em;&quot;&gt;Xác nhận đáp án&lt;/button&gt;&#39;;
}

} else {
bodyHtml = &#39;&lt;div style=&quot;margin-top: 12px;&quot;&gt;&lt;input type=&quot;text&quot; id=&quot;text-input-&#39; +
index + &#39;&quot; placeholder=&quot;Nhập từ/cụm từ điền vào...&quot;&gt;&lt;button type=&quot;button&quot;
onclick=&quot;window.submitTextAnswer(&#39; + index + &#39;)&quot; style=&quot;background: #007bff; color:
white; border: none; padding: 12px 22px; border-radius: 8px; font-weight: bold; cursor:
pointer; display: inline-block; font-size: 1.05em;&quot;&gt;Gửi đáp án&lt;/button&gt;&lt;/div&gt;&#39;;
}

const cleanMon = cleanKey(item.mon);
const isMathOrVietnamese = cleanMon.includes(&#39;toan&#39;) ||
cleanMon.includes(&#39;math&#39;) || cleanMon.includes(&#39;tiengviet&#39;) || cleanMon.includes(&#39;tv&#39;);
const isListening = item.loai === &#39;listening_fill&#39; ||
cleanKey(item.loai).includes(&#39;listening&#39;) ||
cleanKey(item.chuDe).includes(&#39;listening&#39;) ||
cleanKey(item.chuDe).includes(&#39;listu&#39;);

let speechBtnHtml = (isMathOrVietnamese &amp;&amp; !isListening) ? &#39;&#39; : &#39;&lt;button
type=&quot;button&quot; class=&quot;speech-btn&quot; onclick=&quot;window.speakQuestion(&#39; + index + &#39;)&quot;&gt;��
Nghe câu hỏi&lt;/button&gt;&#39;;

let loaiBadge = &#39;&#39;;
if (item.loai === &#39;listening_fill&#39; || cleanKey(item.loai).includes(&#39;listeningfill&#39;)) {
loaiBadge = &#39;&lt;span style=&quot;background: #17a2b8; color: white; padding: 3px 8px;
border-radius: 4px; font-size: 0.85em; font-weight: bold; margin-left: 8px;&quot;&gt;�� Listening
Fill&lt;/span&gt;&#39;;
}

html += &#39;&lt;div class=&quot;quiz-card&quot; id=&quot;question-card-&#39; + index + &#39;&quot;&gt;&lt;div style=&quot;display:
flex; justify-content: space-between; align-items: center; margin-bottom: 12px;&quot;&gt;&lt;div
style=&quot;font-weight: bold; color: #540606; font-size: 1.1em;&quot;&gt;Câu &#39; + (index + 1) + &#39;:&#39; +
loaiBadge + &#39;&lt;/div&gt;&#39; + speechBtnHtml + &#39;&lt;/div&gt;&lt;div style=&quot;margin-bottom: 15px; font-

weight: 600; white-space: pre-line; line-height: 1.6; font-size: 1.1em;&quot;&gt;&#39; +
escapeHTML(item.question) + &#39;&lt;/div&gt;&#39; + bodyHtml + &#39;&lt;div class=&quot;explanation-box&quot;
id=&quot;explanation-&#39; + index + &#39;&quot;&gt;&lt;b&gt;�� Giải thích:&lt;/b&gt; &#39; + escapeHTML(item.explanation ||
&#39;Không có giải thích.&#39;) + &#39;&lt;/div&gt;&lt;/div&gt;&#39;;
});
container.innerHTML = html;
};

window.selectAnswer = function(index, optKey) {
const item = AppState.currentQuizData[index];
if (item._isAnswered) return;
item._isAnswered = true;
item._userAnswer = [optKey];
let correctKeys = item._correctKeys || [];
let correctKey = correctKeys[0] || &#39;&#39;;
let isCorrect = (optKey.toLowerCase() === correctKey.toLowerCase());
const maHS = document.getElementById(&#39;student-code&#39;) ?
document.getElementById(&#39;student-code&#39;).value.trim() :
localStorage.getItem(&#39;saved_maHS&#39;);
let storedWrongs = getStoredWrongQuestions(maHS, item.mon);
if (isCorrect) {
AppState.correctCount++;
const box = document.getElementById(&#39;q&#39; + index + &#39;-opt-&#39; + optKey);
if (box) { box.style.background = &#39;#d4edda&#39;; box.style.borderColor = &#39;#28a745&#39;; }
storedWrongs = storedWrongs.filter(w =&gt; w.question !== item.question);
} else {
AppState.wrongCount++;
const wrongBox = document.getElementById(&#39;q&#39; + index + &#39;-opt-&#39; + optKey);

if (wrongBox) { wrongBox.style.background = &#39;#f8d7da&#39;;
wrongBox.style.borderColor = &#39;#dc3545&#39;; }
if (correctKey) {
const correctBox = document.getElementById(&#39;q&#39; + index + &#39;-opt-&#39; + correctKey);
if (correctBox) { correctBox.style.background = &#39;#d4edda&#39;;
correctBox.style.borderColor = &#39;#28a745&#39;; }
}
if (!storedWrongs.some(w =&gt; w.question === item.question)) {
storedWrongs.push({ question: item.question, chuDe: item.chuDe });
}
}
saveStoredWrongQuestions(maHS, item.mon, storedWrongs);
updateScoreDisplay();
item._shuffledKeys.forEach(k =&gt; {
const el = document.getElementById(&#39;q&#39; + index + &#39;-opt-&#39; + k);
if (el) el.style.pointerEvents = &#39;none&#39;;
});
const expBox = document.getElementById(&#39;explanation-&#39; + index);
if (expBox) expBox.style.display = &#39;block&#39;;
};

window.submitMultiAnswer = function(index) {
const item = AppState.currentQuizData[index];
if (item._isAnswered) return;
const checkboxes = document.querySelectorAll(&#39;input[name=&quot;multi-q&#39; + index + &#39;&quot;]&#39;);
let userSelected = [];
checkboxes.forEach(cb =&gt; {
if (cb.checked) userSelected.push(cb.value);

});
if (userSelected.length === 0) {
return alert(&quot;Vui lòng chọn ít nhất một đáp án!&quot;);
}
item._isAnswered = true;
item._userAnswer = userSelected;
let correctKeys = item._correctKeys || [];
let isCorrect = userSelected.length === correctKeys.length &amp;&amp; userSelected.every(k
=&gt; correctKeys.includes(k));
const maHS = document.getElementById(&#39;student-code&#39;) ?
document.getElementById(&#39;student-code&#39;).value.trim() :
localStorage.getItem(&#39;saved_maHS&#39;);
let storedWrongs = getStoredWrongQuestions(maHS, item.mon);
item._shuffledKeys.forEach(k =&gt; {
const box = document.getElementById(&#39;q&#39; + index + &#39;-opt-&#39; + k);
const cb = box ? box.querySelector(&#39;input&#39;) : null;
if (cb) cb.disabled = true;
if (correctKeys.includes(k)) {
if (box) { box.style.background = &#39;#d4edda&#39;; box.style.borderColor = &#39;#28a745&#39;; }
} else if (userSelected.includes(k)) {
if (box) { box.style.background = &#39;#f8d7da&#39;; box.style.borderColor = &#39;#dc3545&#39;; }
}
});
const submitBtn = document.getElementById(&#39;multi-btn-&#39; + index);
if (submitBtn) submitBtn.disabled = true;
if (isCorrect) {
AppState.correctCount++;
storedWrongs = storedWrongs.filter(w =&gt; w.question !== item.question);

} else {
AppState.wrongCount++;
if (!storedWrongs.some(w =&gt; w.question === item.question)) {
storedWrongs.push({ question: item.question, chuDe: item.chuDe });
}
}
saveStoredWrongQuestions(maHS, item.mon, storedWrongs);
updateScoreDisplay();
const expBox = document.getElementById(&#39;explanation-&#39; + index);
if (expBox) expBox.style.display = &#39;block&#39;;
};

window.submitTextAnswer = function(index) {
const item = AppState.currentQuizData[index];
if (item._isAnswered) return;
const inputEl = document.getElementById(&#39;text-input-&#39; + index);
if (!inputEl) return;
const userVal = inputEl.value.trim();
if (!userVal) return alert(&quot;Vui lòng nhập đáp án!&quot;);
item._isAnswered = true;
item._userAnswer = [userVal];
let correctVal = String(item.correct || &#39;&#39;).trim();

// So sánh đáp án linh hoạt (hỗ trợ cả đáp án phân cách bằng dấu /)
let isCorrect = cleanKey(userVal) === cleanKey(correctVal) || userVal.toLowerCase()
=== correctVal.toLowerCase();
if (!isCorrect &amp;&amp; correctVal.includes(&#39;/&#39;)) {

let possibleAnswers = correctVal.split(&#39;/&#39;).map(a =&gt; cleanKey(a));
if (possibleAnswers.includes(cleanKey(userVal))) {
isCorrect = true;
}
}

const maHS = document.getElementById(&#39;student-code&#39;) ?
document.getElementById(&#39;student-code&#39;).value.trim() :
localStorage.getItem(&#39;saved_maHS&#39;);
let storedWrongs = getStoredWrongQuestions(maHS, item.mon);
if (isCorrect) {
AppState.correctCount++;
inputEl.style.background = &#39;#d4edda&#39;;
inputEl.style.borderColor = &#39;#28a745&#39;;
storedWrongs = storedWrongs.filter(w =&gt; w.question !== item.question);
} else {
AppState.wrongCount++;
inputEl.style.background = &#39;#f8d7da&#39;;
inputEl.style.borderColor = &#39;#dc3545&#39;;
if (!storedWrongs.some(w =&gt; w.question === item.question)) {
storedWrongs.push({ question: item.question, chuDe: item.chuDe });
}
}
saveStoredWrongQuestions(maHS, item.mon, storedWrongs);
updateScoreDisplay();
inputEl.disabled = true;
const btn = inputEl.nextElementSibling;
if (btn) btn.disabled = true;

const expBox = document.getElementById(&#39;explanation-&#39; + index);
if (expBox) {
expBox.innerHTML = &#39;&lt;b&gt;�� Giải thích:&lt;/b&gt; Đáp án đúng là: &lt;b&gt;&#39; +
escapeHTML(correctVal) + &#39;&lt;/b&gt;. &#39; + escapeHTML(item.explanation || &#39;&#39;);
expBox.style.display = &#39;block&#39;;
}
};

window.startTimerTotal = function(durationSeconds) {
clearInterval(AppState.timerInterval);
let remainingTime = durationSeconds;
const timerDisplay = document.getElementById(&#39;timer-display&#39;);

AppState.timerInterval = setInterval(() =&gt; {
remainingTime--;
let minutes = Math.floor(remainingTime / 60);
let seconds = remainingTime % 60;
if (timerDisplay) {
timerDisplay.innerHTML = minutes + &#39;:&#39; + (seconds &lt; 10 ? &#39;0&#39; : &#39;&#39;) + seconds;
}
if (remainingTime &lt;= 0) {
clearInterval(AppState.timerInterval);
alert(&quot;Đã hết thời gian làm bài!&quot;);
window.submitQuiz();
}
}, 1000);
};

window.submitQuiz = function() {
if (typeof handleBeforeUnload !== &#39;undefined&#39;) {
window.removeEventListener(&#39;beforeunload&#39;, handleBeforeUnload);
}
let maHS = document.getElementById(&#39;student-code&#39;) ?
document.getElementById(&#39;student-code&#39;).value.trim() :
localStorage.getItem(&#39;saved_maHS&#39;);
let mon = document.getElementById(&#39;subject-select&#39;) ?
document.getElementById(&#39;subject-select&#39;).value : &#39;&#39;;
let levelSelect = document.getElementById(&#39;level-select&#39;);
let level = levelSelect ? levelSelect.value : &#39;&#39;;
let selectedTopicsStr =
Array.from(document.querySelectorAll(&#39;input[name=&quot;topic&quot;]:checked&#39;)).map(cb =&gt;
cb.value).join(&#39;, &#39;);
const toggleMade = document.getElementById(&#39;toggle-made&#39;);
let selectedMade = (toggleMade &amp;&amp; toggleMade.checked &amp;&amp;
document.getElementById(&#39;made-select&#39;)) ? document.getElementById(&#39;made-
select&#39;).value.trim() : &#39;&#39;;
let totalQuestions = AppState.currentQuizData.length;
let score = Math.round((AppState.correctCount / totalQuestions) * 10 * 10) / 10;
if (selectedMade &amp;&amp; score === 10) {
localStorage.setItem(&#39;made_10_time_&#39; + maHS + &#39;_&#39; + mon + &#39;_&#39; + selectedMade,
Date.now());
}
let details = AppState.currentQuizData.map((item, index) =&gt; {
let hasOptions = item.a || item.b || item.c || item.d;
let userAnswerText = &#39;Chưa trả lời&#39;;
let correctAnswerText = &#39;&#39;;
let isCorrect = false;

let correctKeys = item._correctKeys || [];
let isMultiChoice = correctKeys.length &gt; 1;
if (hasOptions) {
if (isMultiChoice) {
correctAnswerText = correctKeys.map(k =&gt; k.toUpperCase() + &#39;. &#39; +
cleanOptionText(item[k])).join(&#39;; &#39;);
if (Array.isArray(item._userAnswer) &amp;&amp; item._userAnswer.length &gt; 0) {
userAnswerText = item._userAnswer.map(k =&gt; k.toUpperCase() + &#39;. &#39; +
cleanOptionText(item[k])).join(&#39;; &#39;);
isCorrect = item._userAnswer.length === correctKeys.length &amp;&amp;
item._userAnswer.every(k =&gt; correctKeys.includes(k));
}
} else {
let correctKey = correctKeys[0] || &#39;&#39;;
correctAnswerText = correctKey ? correctKey.toUpperCase() + &#39;. &#39; +
cleanOptionText(item[correctKey]) : item.correct;
if (item._userAnswer &amp;&amp; item._userAnswer.length &gt; 0) {
let userKey = item._userAnswer[0];
userAnswerText = userKey.toUpperCase() + &#39;. &#39; +
cleanOptionText(item[userKey]);
isCorrect = (String(userKey).toLowerCase() ===
String(correctKey).toLowerCase());
}
}
} else {
correctAnswerText = item.correct || &#39;&#39;;
if (item._userAnswer &amp;&amp; item._userAnswer.length &gt; 0) {
userAnswerText = item._userAnswer[0];
isCorrect = (cleanKey(userAnswerText) === cleanKey(correctAnswerText));

}
}
return {
index: index + 1,
question: item.question || (&#39;Câu &#39; + (index + 1)),
userAnswer: userAnswerText,
correctAnswer: correctAnswerText,
isCorrect: isCorrect
};
});
if (maHS &amp;&amp; mon) {
fetch(API_URL, {
method: &#39;POST&#39;,
mode: &#39;no-cors&#39;,
headers: { &#39;Content-Type&#39;: &#39;application/json&#39; },
body: JSON.stringify({
maHS: maHS,
mon: mon,
score: score,
level: level,
chuDe: selectedTopicsStr,
made: selectedMade,
details: details
})
}).catch(err =&gt; console.log(&#39;Lỗi gửi kết quả:&#39;, err));
}
let quizScreen = document.getElementById(&#39;quiz-screen&#39;);

if (quizScreen) quizScreen.style.display = &#39;none&#39;;
let resultContainer = document.getElementById(&#39;result-container&#39;);
if (!resultContainer) {
resultContainer = document.createElement(&#39;div&#39;);
resultContainer.id = &#39;result-container&#39;;
resultContainer.className = &#39;container&#39;;
document.body.appendChild(resultContainer);
}
resultContainer.innerHTML = &#39;&lt;h2 style=&quot;text-align: center; color: #540606; font-size:
1.6em;&quot;&gt;Kết Quả Bài Làm&lt;/h2&gt;&#39; +
&#39;&lt;p style=&quot;font-size: 1.2em; text-align: center;&quot;&gt;Số câu hỏi đúng: &lt;b&gt;&#39; +
AppState.correctCount + &#39; / &#39; + totalQuestions + &#39;&lt;/b&gt;&lt;/p&gt;&#39; +
&#39;&lt;p style=&quot;font-size: 1.4em; text-align: center; font-weight: bold;&quot;&gt;Điểm số: &#39; + score
+ &#39; đ&lt;/p&gt;&#39; +
&#39;&lt;div style=&quot;display: flex; gap: 12px; margin-top: 20px;&quot;&gt;&#39; +
&#39;&lt;button type=&quot;button&quot; onclick=&quot;window.location.reload()&quot; style=&quot;flex: 1; padding:
14px; background: #007bff; color: white; border: none; border-radius: 8px; font-weight:
bold; cursor: pointer; font-size: 1.05em;&quot;&gt;Làm bài mới&lt;/button&gt;&#39; +
&#39;&lt;button type=&quot;button&quot; onclick=&quot;window.viewReviewDetails()&quot; style=&quot;flex: 1;
padding: 14px; background: #6c757d; color: white; border: none; border-radius: 8px;
font-weight: bold; cursor: pointer; font-size: 1.05em;&quot;&gt;�� Xem lại chi tiết&lt;/button&gt;&#39; +
&#39;&lt;/div&gt;&#39; +
&#39;&lt;div id=&quot;review-detail-box&quot; style=&quot;margin-top: 20px;&quot;&gt;&lt;/div&gt;&#39;;
};

window.viewReviewDetails = function() {
const box = document.getElementById(&#39;review-detail-box&#39;);
if (!box) return;
let html = &#39;&lt;h3 style=&quot;color: #540606; border-bottom: 2px solid #540606; padding-
bottom: 8px; font-size: 1.3em;&quot;&gt;Chi Tiết Bài Làm&lt;/h3&gt;&#39;;

AppState.currentQuizData.forEach((item, index) =&gt; {
let hasOptions = item.a || item.b || item.c || item.d;
let userAnswerText = &#39;Chưa trả lời&#39;;
let correctAnswerText = &#39;&#39;;
let isCorrect = false;
let correctKeys = item._correctKeys || [];
let isMultiChoice = correctKeys.length &gt; 1;
if (hasOptions) {
if (isMultiChoice) {
correctAnswerText = correctKeys.map(k =&gt; k.toUpperCase() + &#39;. &#39; +
cleanOptionText(item[k])).join(&#39;; &#39;);
if (Array.isArray(item._userAnswer) &amp;&amp; item._userAnswer.length &gt; 0) {
userAnswerText = item._userAnswer.map(k =&gt; k.toUpperCase() + &#39;. &#39; +
cleanOptionText(item[k])).join(&#39;; &#39;);
isCorrect = item._userAnswer.length === correctKeys.length &amp;&amp;
item._userAnswer.every(k =&gt; correctKeys.includes(k));
}
} else {
let correctKey = correctKeys[0] || &#39;&#39;;
correctAnswerText = correctKey ? correctKey.toUpperCase() + &#39;. &#39; +
cleanOptionText(item[correctKey]) : item.correct;

if (item._userAnswer &amp;&amp; item._userAnswer.length &gt; 0) {
let userKey = item._userAnswer[0];
userAnswerText = userKey.toUpperCase() + &#39;. &#39; +
cleanOptionText(item[userKey]);
isCorrect = (userKey.toLowerCase() === correctKey.toLowerCase());
}
}

} else {
correctAnswerText = item.correct;
if (item._userAnswer &amp;&amp; item._userAnswer.length &gt; 0) {
userAnswerText = item._userAnswer[0];
isCorrect = (cleanKey(userAnswerText) === cleanKey(correctAnswerText));
}
}
let statusColor = isCorrect ? &#39;green&#39; : &#39;red&#39;;
let statusText = isCorrect ? &#39;✅ Đúng&#39; : &#39;❌ Sai&#39;;
html += &#39;&lt;div style=&quot;background: #fff; border: 1px solid #ddd; padding: 14px;
border-radius: 8px; margin-bottom: 12px; font-size: 1.05em;&quot;&gt;&#39; +
&#39;&lt;div style=&quot;font-weight: bold; margin-bottom: 6px;&quot;&gt;Câu &#39; + (index + 1) + &#39;: &#39; +
escapeHTML(item.question) + &#39;&lt;/div&gt;&#39; +
&#39;&lt;div style=&quot;font-size: 1em; color: &#39; + statusColor + &#39;; font-weight: bold; margin-
bottom: 4px;&quot;&gt;Trạng thái: &#39; + statusText + &#39;&lt;/div&gt;&#39; +
&#39;&lt;div style=&quot;font-size: 1em;&quot;&gt;Bạn chọn: &lt;b&gt;&#39; + escapeHTML(userAnswerText) +
&#39;&lt;/b&gt;&lt;/div&gt;&#39; +
&#39;&lt;div style=&quot;font-size: 1em; color: #28a745;&quot;&gt;Đáp án đúng: &lt;b&gt;&#39; +
escapeHTML(correctAnswerText) + &#39;&lt;/b&gt;&lt;/div&gt;&#39; +
&#39;&lt;/div&gt;&#39;;
});
box.innerHTML = html;
};

window.backToHome = function() {
if (confirm(&quot;Bạn có chắc muốn thoát ra màn hình chính? Bài làm hiện tại sẽ không
được lưu.&quot;)) {
if (typeof AppState !== &#39;undefined&#39; &amp;&amp; AppState.timerInterval) {
clearInterval(AppState.timerInterval);

}
window.removeEventListener(&#39;beforeunload&#39;, handleBeforeUnload);
document.getElementById(&#39;quiz-screen&#39;).style.display = &#39;none&#39;;
document.getElementById(&#39;start-screen&#39;).style.display = &#39;block&#39;;
const resContainer = document.getElementById(&#39;result-container&#39;);
if (resContainer) resContainer.remove();
}
};

// TỰ ĐỘNG TRA TỪ KHI BÔI ĐEN HOẶC CHỌN TỪ TRÊN MÀN HÌNH
document.addEventListener(&#39;mouseup&#39;, function() {
setTimeout(() =&gt; {
let selectedText = window.getSelection().toString().trim();
if (selectedText &amp;&amp; selectedText.split(/\s+/).length === 1 &amp;&amp; /^[a-zA-ZÀ-
ỹ]+$/.test(selectedText)) {
const modal = document.getElementById(&#39;dict-modal&#39;);
const input = document.getElementById(&#39;dict-input&#39;);
if (modal &amp;&amp; input) {
if (modal.style.display !== &#39;flex&#39; || input.value.trim().toLowerCase() !==
selectedText.toLowerCase()) {
modal.style.display = &#39;flex&#39;;
input.value = selectedText;
window.lookupWord();
}
}
}
}, 100);
});

document.addEventListener(&#39;touchend&#39;, function() {
setTimeout(() =&gt; {
let selectedText = window.getSelection().toString().trim();
if (selectedText &amp;&amp; selectedText.split(/\s+/).length === 1 &amp;&amp; /^[a-zA-ZÀ-
ỹ]+$/.test(selectedText)) {
const modal = document.getElementById(&#39;dict-modal&#39;);
const input = document.getElementById(&#39;dict-input&#39;);
if (modal &amp;&amp; input) {
modal.style.display = &#39;flex&#39;;
input.value = selectedText;
window.lookupWord();
}
}
}, 200);
});

// ==========================================
// QUẢN LÝ BẢNG ĐỘNG TỪ BẤT QUY TẮC (CÓ IPA &amp; PHÁT ÂM)
// ==========================================
const IRREGULAR_VERBS_DATA = [
{ v1: &quot;be&quot;, ipa1: &quot;/biː/&quot;, v2: &quot;was / were&quot;, ipa2: &quot;/wɒz / wɜː/&quot;, v3: &quot;been&quot;, ipa3: &quot;/biːn/&quot;,
meaning: &quot;là, ở&quot; },
{ v1: &quot;beat&quot;, ipa1: &quot;/biːt/&quot;, v2: &quot;beat&quot;, ipa2: &quot;/biːt/&quot;, v3: &quot;beaten&quot;, ipa3: &quot;/ˈbiːtn/&quot;,
meaning: &quot;đánh, đập&quot; },
{ v1: &quot;become&quot;, ipa1: &quot;/bɪˈkʌm/&quot;, v2: &quot;became&quot;, ipa2: &quot;/bɪˈkeɪm/&quot;, v3: &quot;become&quot;, ipa3:
&quot;/bɪˈkʌm/&quot;, meaning: &quot;trở thành&quot; },
{ v1: &quot;begin&quot;, ipa1: &quot;/bɪˈɡɪn/&quot;, v2: &quot;began&quot;, ipa2: &quot;/bɪˈɡæn/&quot;, v3: &quot;begun&quot;, ipa3:
&quot;/bɪˈɡʌn/&quot;, meaning: &quot;bắt đầu&quot; },

{ v1: &quot;bite&quot;, ipa1: &quot;/baɪt/&quot;, v2: &quot;bit&quot;, ipa2: &quot;/bɪt/&quot;, v3: &quot;bitten&quot;, ipa3: &quot;/ˈbɪtn/&quot;, meaning:
&quot;cắn&quot; },
{ v1: &quot;blow&quot;, ipa1: &quot;/bləʊ/&quot;, v2: &quot;blew&quot;, ipa2: &quot;/bluː/&quot;, v3: &quot;blown&quot;, ipa3: &quot;/bləʊn/&quot;,
meaning: &quot;thổi&quot; },
{ v1: &quot;break&quot;, ipa1: &quot;/breɪk/&quot;, v2: &quot;broke&quot;, ipa2: &quot;/brəʊk/&quot;, v3: &quot;broken&quot;, ipa3:
&quot;/ˈbrəʊkən/&quot;, meaning: &quot;làm vỡ, gãy&quot; },
{ v1: &quot;bring&quot;, ipa1: &quot;/brɪŋ/&quot;, v2: &quot;brought&quot;, ipa2: &quot;/brɔːt/&quot;, v3: &quot;brought&quot;, ipa3: &quot;/brɔːt/&quot;,
meaning: &quot;mang lại&quot; },
{ v1: &quot;build&quot;, ipa1: &quot;/bɪld/&quot;, v2: &quot;built&quot;, ipa2: &quot;/bɪlt/&quot;, v3: &quot;built&quot;, ipa3: &quot;/bɪlt/&quot;, meaning:
&quot;xây dựng&quot; },
{ v1: &quot;buy&quot;, ipa1: &quot;/baɪ/&quot;, v2: &quot;bought&quot;, ipa2: &quot;/brɔːt/&quot;, v3: &quot;bought&quot;, ipa3: &quot;/brɔːt/&quot;,
meaning: &quot;mua&quot; },
{ v1: &quot;catch&quot;, ipa1: &quot;/kætʃ/&quot;, v2: &quot;caught&quot;, ipa2: &quot;/kɔːt/&quot;, v3: &quot;caught&quot;, ipa3: &quot;/kɔːt/&quot;,
meaning: &quot;bắt, tóm&quot; },
{ v1: &quot;choose&quot;, ipa1: &quot;/tʃuːz/&quot;, v2: &quot;chose&quot;, ipa2: &quot;/tʃəʊz/&quot;, v3: &quot;chosen&quot;, ipa3: &quot;/ˈtʃəʊzn/&quot;,
meaning: &quot;chọn, lựa&quot; },
{ v1: &quot;come&quot;, ipa1: &quot;/kʌm/&quot;, v2: &quot;came&quot;, ipa2: &quot;/keɪm/&quot;, v3: &quot;come&quot;, ipa3: &quot;/kʌm/&quot;,
meaning: &quot;đến, đi đến&quot; },
{ v1: &quot;cost&quot;, ipa1: &quot;/kɒst/&quot;, v2: &quot;cost&quot;, ipa2: &quot;/kɒst/&quot;, v3: &quot;cost&quot;, ipa3: &quot;/kɒst/&quot;, meaning:
&quot;có giá là&quot; },
{ v1: &quot;cut&quot;, ipa1: &quot;/kʌt/&quot;, v2: &quot;cut&quot;, ipa2: &quot;/kʌt/&quot;, v3: &quot;cut&quot;, ipa3: &quot;/kʌt/&quot;, meaning: &quot;cắt&quot; },
{ v1: &quot;do&quot;, ipa1: &quot;/duː/&quot;, v2: &quot;did&quot;, ipa2: &quot;/dɪd/&quot;, v3: &quot;done&quot;, ipa3: &quot;/dʌn/&quot;, meaning:
&quot;làm&quot; },
{ v1: &quot;draw&quot;, ipa1: &quot;/drɔː/&quot;, v2: &quot;drew&quot;, ipa2: &quot;/druː/&quot;, v3: &quot;drawn&quot;, ipa3: &quot;/drɔːn/&quot;,
meaning: &quot;vẽ, kéo&quot; },
{ v1: &quot;drink&quot;, ipa1: &quot;/drɪŋk/&quot;, v2: &quot;drank&quot;, ipa2: &quot;/dræŋk/&quot;, v3: &quot;drunk&quot;, ipa3: &quot;/drʌŋk/&quot;,
meaning: &quot;uống&quot; },
{ v1: &quot;drive&quot;, ipa1: &quot;/draɪv/&quot;, v2: &quot;drove&quot;, ipa2: &quot;/drəʊv/&quot;, v3: &quot;driven&quot;, ipa3: &quot;/ˈdrɪvn/&quot;,
meaning: &quot;lái xe&quot; },
{ v1: &quot;eat&quot;, ipa1: &quot;/iːt/&quot;, v2: &quot;ate&quot;, ipa2: &quot;/et/&quot;, v3: &quot;eaten&quot;, ipa3: &quot;/ˈiːtn/&quot;, meaning: &quot;ăn&quot; },
{ v1: &quot;fall&quot;, ipa1: &quot;/fɔːl/&quot;, v2: &quot;fell&quot;, ipa2: &quot;/fel/&quot;, v3: &quot;fallen&quot;, ipa3: &quot;/ˈfɔːlən/&quot;, meaning:
&quot;ngã, rơi&quot; },

{ v1: &quot;feel&quot;, ipa1: &quot;/fiːl/&quot;, v2: &quot;felt&quot;, ipa2: &quot;/felt/&quot;, v3: &quot;felt&quot;, ipa3: &quot;/felt/&quot;, meaning: &quot;cảm
thấy&quot; },
{ v1: &quot;find&quot;, ipa1: &quot;/faɪnd/&quot;, v2: &quot;found&quot;, ipa2: &quot;/faʊnd/&quot;, v3: &quot;found&quot;, ipa3: &quot;/faʊnd/&quot;,
meaning: &quot;tìm thấy&quot; },
{ v1: &quot;fly&quot;, ipa1: &quot;/flaɪ/&quot;, v2: &quot;flew&quot;, ipa2: &quot;/fluː/&quot;, v3: &quot;flown&quot;, ipa3: &quot;/fləʊn/&quot;, meaning:
&quot;bay&quot; },
{ v1: &quot;forget&quot;, ipa1: &quot;/fəˈɡet/&quot;, v2: &quot;forgot&quot;, ipa2: &quot;/fəˈɡɒt/&quot;, v3: &quot;forgotten&quot;, ipa3:
&quot;/fəˈɡɒtn/&quot;, meaning: &quot;quên&quot; },
{ v1: &quot;get&quot;, ipa1: &quot;/ɡet/&quot;, v2: &quot;got&quot;, ipa2: &quot;/ɡɒt/&quot;, v3: &quot;got / gotten&quot;, ipa3: &quot;/ɡɒt / ˈɡɒtn/&quot;,
meaning: &quot;được, nhận&quot; },
{ v1: &quot;give&quot;, ipa1: &quot;/ɡɪv/&quot;, v2: &quot;gave&quot;, ipa2: &quot;/ɡeɪv/&quot;, v3: &quot;given&quot;, ipa3: &quot;/ˈɡɪvn/&quot;,
meaning: &quot;cho, tặng&quot; },
{ v1: &quot;go&quot;, ipa1: &quot;/ɡəʊ/&quot;, v2: &quot;went&quot;, ipa2: &quot;/went/&quot;, v3: &quot;gone&quot;, ipa3: &quot;/ɡɒn/&quot;, meaning:
&quot;đi&quot; },
{ v1: &quot;grow&quot;, ipa1: &quot;/ɡrəʊ/&quot;, v2: &quot;grew&quot;, ipa2: &quot;/ɡruː/&quot;, v3: &quot;grown&quot;, ipa3: &quot;/ɡrəʊn/&quot;,
meaning: &quot;mọc, phát triển&quot; },
{ v1: &quot;have&quot;, ipa1: &quot;/hæv/&quot;, v2: &quot;had&quot;, ipa2: &quot;/hæd/&quot;, v3: &quot;had&quot;, ipa3: &quot;/hæd/&quot;, meaning:
&quot;có&quot; },
{ v1: &quot;hear&quot;, ipa1: &quot;/hɪər/&quot;, v2: &quot;heard&quot;, ipa2: &quot;/hɜːd/&quot;, v3: &quot;heard&quot;, ipa3: &quot;/hɜːd/&quot;,
meaning: &quot;nghe&quot; },
{ v1: &quot;hide&quot;, ipa1: &quot;/haɪd/&quot;, v2: &quot;hid&quot;, ipa2: &quot;/hɪd/&quot;, v3: &quot;hidden&quot;, ipa3: &quot;/ˈhɪdn/&quot;,
meaning: &quot;trốn, giấu&quot; },
{ v1: &quot;hit&quot;, ipa1: &quot;/hɪt/&quot;, v2: &quot;hit&quot;, ipa2: &quot;/hɪt/&quot;, v3: &quot;hit&quot;, ipa3: &quot;/hɪt/&quot;, meaning: &quot;đánh&quot; },
{ v1: &quot;hold&quot;, ipa1: &quot;/həʊld/&quot;, v2: &quot;held&quot;, ipa2: &quot;/held/&quot;, v3: &quot;held&quot;, ipa3: &quot;/held/&quot;,
meaning: &quot;cầm, nắm&quot; },
{ v1: &quot;hurt&quot;, ipa1: &quot;/hɜːt/&quot;, v2: &quot;hurt&quot;, ipa2: &quot;/hɜːt/&quot;, v3: &quot;hurt&quot;, ipa3: &quot;/hɜːt/&quot;, meaning:
&quot;làm đau&quot; },
{ v1: &quot;keep&quot;, ipa1: &quot;/kiːp/&quot;, v2: &quot;kept&quot;, ipa2: &quot;/kept/&quot;, v3: &quot;kept&quot;, ipa3: &quot;/kept/&quot;, meaning:
&quot;giữ&quot; },
{ v1: &quot;know&quot;, ipa1: &quot;/nəʊ/&quot;, v2: &quot;knew&quot;, ipa2: &quot;/njuː/&quot;, v3: &quot;known&quot;, ipa3: &quot;/nəʊn/&quot;,
meaning: &quot;biết&quot; },

{ v1: &quot;leave&quot;, ipa1: &quot;/liːv/&quot;, v2: &quot;left&quot;, ipa2: &quot;/left/&quot;, v3: &quot;left&quot;, ipa3: &quot;/left/&quot;, meaning: &quot;rời
đi, để lại&quot; },
{ v1: &quot;lend&quot;, ipa1: &quot;/lend/&quot;, v2: &quot;lent&quot;, ipa2: &quot;/lent/&quot;, v3: &quot;lent&quot;, ipa3: &quot;/lent/&quot;, meaning:
&quot;cho mượn&quot; },
{ v1: &quot;let&quot;, ipa1: &quot;/let/&quot;, v2: &quot;let&quot;, ipa2: &quot;/let/&quot;, v3: &quot;let&quot;, ipa3: &quot;/let/&quot;, meaning: &quot;cho phép&quot;
},
{ v1: &quot;lie&quot;, ipa1: &quot;/laɪ/&quot;, v2: &quot;lay&quot;, ipa2: &quot;/leɪ/&quot;, v3: &quot;lain&quot;, ipa3: &quot;/leɪn/&quot;, meaning: &quot;nằm&quot; },
{ v1: &quot;lose&quot;, ipa1: &quot;/luːz/&quot;, v2: &quot;lost&quot;, ipa2: &quot;/lɒst/&quot;, v3: &quot;lost&quot;, ipa3: &quot;/lɒst/&quot;, meaning:
&quot;mất, thua&quot; },
{ v1: &quot;make&quot;, ipa1: &quot;/meɪk/&quot;, v2: &quot;made&quot;, ipa2: &quot;/meɪd/&quot;, v3: &quot;made&quot;, ipa3: &quot;/meɪd/&quot;,
meaning: &quot;làm, chế tạo&quot; },
{ v1: &quot;meet&quot;, ipa1: &quot;/miːt/&quot;, v2: &quot;met&quot;, ipa2: &quot;/met/&quot;, v3: &quot;met&quot;, ipa3: &quot;/met/&quot;, meaning:
&quot;gặp&quot; },
{ v1: &quot;pay&quot;, ipa1: &quot;/peɪ/&quot;, v2: &quot;paid&quot;, ipa2: &quot;/peɪd/&quot;, v3: &quot;paid&quot;, ipa3: &quot;/peɪd/&quot;, meaning:
&quot;trả tiền&quot; },
{ v1: &quot;put&quot;, ipa1: &quot;/pʊt/&quot;, v2: &quot;put&quot;, ipa2: &quot;/pʊt/&quot;, v3: &quot;put&quot;, ipa3: &quot;/pʊt/&quot;, meaning: &quot;đặt,
để&quot; },
{ v1: &quot;read&quot;, ipa1: &quot;/riːd/&quot;, v2: &quot;read&quot;, ipa2: &quot;/red/&quot;, v3: &quot;read&quot;, ipa3: &quot;/red/&quot;, meaning:
&quot;đọc&quot; },
{ v1: &quot;ride&quot;, ipa1: &quot;/raɪd/&quot;, v2: &quot;rode&quot;, ipa2: &quot;/rəʊd/&quot;, v3: &quot;ridden&quot;, ipa3: &quot;/ˈrɪdn/&quot;,
meaning: &quot;cưỡi, lái&quot; },
{ v1: &quot;ring&quot;, ipa1: &quot;/rɪŋ/&quot;, v2: &quot;rang&quot;, ipa2: &quot;/ræŋ/&quot;, v3: &quot;rung&quot;, ipa3: &quot;/rʌŋ/&quot;, meaning:
&quot;reo, rung chuông&quot; },
{ v1: &quot;rise&quot;, ipa1: &quot;/raɪz/&quot;, v2: &quot;rose&quot;, ipa2: &quot;/rəʊz/&quot;, v3: &quot;risen&quot;, ipa3: &quot;/ˈrɪzn/&quot;, meaning:
&quot;mọc, tăng lên&quot; },
{ v1: &quot;run&quot;, ipa1: &quot;/rʌn/&quot;, v2: &quot;ran&quot;, ipa2: &quot;/ræn/&quot;, v3: &quot;run&quot;, ipa3: &quot;/rʌn/&quot;, meaning:
&quot;chạy&quot; },
{ v1: &quot;say&quot;, ipa1: &quot;/seɪ/&quot;, v2: &quot;said&quot;, ipa2: &quot;/sed/&quot;, v3: &quot;said&quot;, ipa3: &quot;/sed/&quot;, meaning:
&quot;nói&quot; },
{ v1: &quot;see&quot;, ipa1: &quot;/siː/&quot;, v2: &quot;saw&quot;, ipa2: &quot;/sɔː/&quot;, v3: &quot;seen&quot;, ipa3: &quot;/siːn/&quot;, meaning:
&quot;nhìn thấy&quot; },

{ v1: &quot;sell&quot;, ipa1: &quot;/sel/&quot;, v2: &quot;sold&quot;, ipa2: &quot;/səʊld/&quot;, v3: &quot;sold&quot;, ipa3: &quot;/səʊld/&quot;, meaning:
&quot;bán&quot; },
{ v1: &quot;send&quot;, ipa1: &quot;/send/&quot;, v2: &quot;sent&quot;, ipa2: &quot;/sent/&quot;, v3: &quot;sent&quot;, ipa3: &quot;/sent/&quot;,
meaning: &quot;gửi&quot; },
{ v1: &quot;show&quot;, ipa1: &quot;/ʃəʊ/&quot;, v2: &quot;showed&quot;, ipa2: &quot;/ʃəʊd/&quot;, v3: &quot;shown&quot;, ipa3: &quot;/ʃəʊn/&quot;,
meaning: &quot;trình bày, chỉ&quot; },
{ v1: &quot;shut&quot;, ipa1: &quot;/ʃʌt/&quot;, v2: &quot;shut&quot;, ipa2: &quot;/ʃʌt/&quot;, v3: &quot;shut&quot;, ipa3: &quot;/ʃʌt/&quot;, meaning: &quot;đóng
lại&quot; },
{ v1: &quot;sing&quot;, ipa1: &quot;/sɪŋ/&quot;, v2: &quot;sang&quot;, ipa2: &quot;/sæŋ/&quot;, v3: &quot;sung&quot;, ipa3: &quot;/sʌŋ/&quot;, meaning:
&quot;hát&quot; },
{ v1: &quot;sit&quot;, ipa1: &quot;/sɪt/&quot;, v2: &quot;sat&quot;, ipa2: &quot;/sæt/&quot;, v3: &quot;sat&quot;, ipa3: &quot;/sæt/&quot;, meaning: &quot;ngồi&quot;
},
{ v1: &quot;sleep&quot;, ipa1: &quot;/sliːp/&quot;, v2: &quot;slept&quot;, ipa2: &quot;/slept/&quot;, v3: &quot;slept&quot;, ipa3: &quot;/slept/&quot;,
meaning: &quot;ngủ&quot; },
{ v1: &quot;speak&quot;, ipa1: &quot;/spiːk/&quot;, v2: &quot;spoke&quot;, ipa2: &quot;/spəʊk/&quot;, v3: &quot;spoken&quot;, ipa3:
&quot;/ˈspəʊkən/&quot;, meaning: &quot;nói&quot; },
{ v1: &quot;spend&quot;, ipa1: &quot;/spend/&quot;, v2: &quot;spent&quot;, ipa2: &quot;/spent/&quot;, v3: &quot;spent&quot;, ipa3: &quot;/spent/&quot;,
meaning: &quot;tiêu xài, trải qua&quot; },
{ v1: &quot;stand&quot;, ipa1: &quot;/stænd/&quot;, v2: &quot;stood&quot;, ipa2: &quot;/stʊd/&quot;, v3: &quot;stood&quot;, ipa3: &quot;/stʊd/&quot;,
meaning: &quot;đứng&quot; },
{ v1: &quot;swim&quot;, ipa1: &quot;/swɪm/&quot;, v2: &quot;swam&quot;, ipa2: &quot;/swæm/&quot;, v3: &quot;swum&quot;, ipa3: &quot;/swʌm/&quot;,
meaning: &quot;bơi&quot; },
{ v1: &quot;take&quot;, ipa1: &quot;/teɪk/&quot;, v2: &quot;took&quot;, ipa2: &quot;/tʊk/&quot;, v3: &quot;taken&quot;, ipa3: &quot;/ˈteɪkən/&quot;,
meaning: &quot;cầm, lấy&quot; },
{ v1: &quot;teach&quot;, ipa1: &quot;/tiːtʃ/&quot;, v2: &quot;taught&quot;, ipa2: &quot;/tɔːt/&quot;, v3: &quot;taught&quot;, ipa3: &quot;/tɔːt/&quot;,
meaning: &quot;dạy&quot; },
{ v1: &quot;tear&quot;, ipa1: &quot;/teər/&quot;, v2: &quot;tore&quot;, ipa2: &quot;/tɔːr/&quot;, v3: &quot;torn&quot;, ipa3: &quot;/tɔːrn/&quot;, meaning:
&quot;xé&quot; },
{ v1: &quot;tell&quot;, ipa1: &quot;/tel/&quot;, v2: &quot;told&quot;, ipa2: &quot;/təʊld/&quot;, v3: &quot;told&quot;, ipa3: &quot;/təʊld/&quot;, meaning:
&quot;kể, bảo&quot; },
{ v1: &quot;think&quot;, ipa1: &quot;/θɪŋk/&quot;, v2: &quot;thought&quot;, ipa2: &quot;/θɔːt/&quot;, v3: &quot;thought&quot;, ipa3: &quot;/θɔːt/&quot;,
meaning: &quot;suy nghĩ&quot; },

{ v1: &quot;throw&quot;, ipa1: &quot;/θrəʊ/&quot;, v2: &quot;threw&quot;, ipa2: &quot;/θruː/&quot;, v3: &quot;thrown&quot;, ipa3: &quot;/θrəʊn/&quot;,
meaning: &quot;ném, quăng&quot; },
{ v1: &quot;understand&quot;, ipa1: &quot;/ˌʌndəˈstænd/&quot;, v2: &quot;understood&quot;, ipa2: &quot;/ˌʌndəˈstʊd/&quot;, v3:
&quot;understood&quot;, ipa3: &quot;/ˌʌndəˈstʊd/&quot;, meaning: &quot;hiểu&quot; },
{ v1: &quot;wake&quot;, ipa1: &quot;/weɪk/&quot;, v2: &quot;woke&quot;, ipa2: &quot;/wəʊk/&quot;, v3: &quot;woken&quot;, ipa3: &quot;/ˈwəʊkən/&quot;,
meaning: &quot;thức dậy&quot; },
{ v1: &quot;wear&quot;, ipa1: &quot;/weər/&quot;, v2: &quot;wore&quot;, ipa2: &quot;/wɔːr/&quot;, v3: &quot;worn&quot;, ipa3: &quot;/wɔːrn/&quot;,
meaning: &quot;mặc&quot; },
{ v1: &quot;win&quot;, ipa1: &quot;/wɪn/&quot;, v2: &quot;won&quot;, ipa2: &quot;/wʌn/&quot;, v3: &quot;won&quot;, ipa3: &quot;/wʌn/&quot;, meaning:
&quot;thắng, chiến thắng&quot; },
{ v1: &quot;write&quot;, ipa1: &quot;/raɪt/&quot;, v2: &quot;wrote&quot;, ipa2: &quot;/rəʊt/&quot;, v3: &quot;written&quot;, ipa3: &quot;/ˈrɪtn/&quot;,
meaning: &quot;viết&quot; }
];

window.openIrregularVerbsModal = function() {
const modal = document.getElementById(&#39;irregular-verbs-modal&#39;);
if (modal) {
modal.style.display = &#39;flex&#39;;
window.renderIrregularVerbsTable(IRREGULAR_VERBS_DATA);
const searchInput = document.getElementById(&#39;iv-search-input&#39;);
if (searchInput) searchInput.focus();
}
};

window.closeIrregularVerbsModal = function() {
const modal = document.getElementById(&#39;irregular-verbs-modal&#39;);
if (modal) modal.style.display = &#39;none&#39;;
};

window.renderIrregularVerbsTable = function(dataArray) {
const resultList = document.getElementById(&#39;iv-result-list&#39;);
if (!resultList) return;
if (dataArray.length === 0) {
resultList.innerHTML = &#39;&lt;div style=&quot;text-align: center; color: #888; padding:
15px;&quot;&gt;Không tìm thấy động từ phù hợp.&lt;/div&gt;&#39;;
return;
}
let html = &#39;&lt;table style=&quot;width: 100%; border-collapse: collapse; font-size: 1.02em;&quot;&gt;&#39;;
html += &#39;&lt;tr style=&quot;background: #540606; color: white; text-align: left;&quot;&gt;&#39; +
&#39;&lt;th style=&quot;padding: 10px; border: 1px solid #ddd;&quot;&gt;V1 (Base)&lt;/th&gt;&#39; +
&#39;&lt;th style=&quot;padding: 10px; border: 1px solid #ddd;&quot;&gt;V2 (Past)&lt;/th&gt;&#39; +
&#39;&lt;th style=&quot;padding: 10px; border: 1px solid #ddd;&quot;&gt;V3 (Participle)&lt;/th&gt;&#39; +
&#39;&lt;th style=&quot;padding: 10px; border: 1px solid #ddd;&quot;&gt;Ý nghĩa&lt;/th&gt;&#39; +
&#39;&lt;/tr&gt;&#39;;
dataArray.forEach((item, index) =&gt; {
let bg = index % 2 === 0 ? &#39;#ffffff&#39; : &#39;#f1f3f5&#39;;
html += `&lt;tr style=&quot;background: ${bg};&quot;&gt;` +
`&lt;td style=&quot;padding: 8px 10px; border: 1px solid #ddd;&quot;&gt;` +
`&lt;div style=&quot;font-weight: bold; color: #007bff; cursor: pointer;&quot; title=&quot;Nhấp
để nghe phát âm&quot;
onclick=&quot;speakWord(&#39;${escapeHTML(item.v1)}&#39;)&quot;&gt;${escapeHTML(item.v1)} ��&lt;/div&gt;` +
`&lt;div style=&quot;color: #d9534f; font-family: monospace; font-size:
0.88em;&quot;&gt;${escapeHTML(item.ipa1 || &#39;&#39;)}&lt;/div&gt;` +
`&lt;/td&gt;` +
`&lt;td style=&quot;padding: 8px 10px; border: 1px solid #ddd;&quot;&gt;` +
`&lt;div style=&quot;font-weight: bold; color: #333; cursor: pointer;&quot; title=&quot;Nhấp để
nghe phát âm&quot;
onclick=&quot;speakWord(&#39;${escapeHTML(item.v2)}&#39;)&quot;&gt;${escapeHTML(item.v2)} ��&lt;/div&gt;` +

`&lt;div style=&quot;color: #d9534f; font-family: monospace; font-size:
0.88em;&quot;&gt;${escapeHTML(item.ipa2 || &#39;&#39;)}&lt;/div&gt;` +
`&lt;/td&gt;` +
`&lt;td style=&quot;padding: 8px 10px; border: 1px solid #ddd;&quot;&gt;` +
`&lt;div style=&quot;font-weight: bold; color: #333; cursor: pointer;&quot; title=&quot;Nhấp để
nghe phát âm&quot;
onclick=&quot;speakWord(&#39;${escapeHTML(item.v3)}&#39;)&quot;&gt;${escapeHTML(item.v3)} ��&lt;/div&gt;` +
`&lt;div style=&quot;color: #d9534f; font-family: monospace; font-size:
0.88em;&quot;&gt;${escapeHTML(item.ipa3 || &#39;&#39;)}&lt;/div&gt;` +
`&lt;/td&gt;` +
`&lt;td style=&quot;padding: 8px 10px; border: 1px solid #ddd; font-style:
italic;&quot;&gt;${escapeHTML(item.meaning)}&lt;/td&gt;` +
`&lt;/tr&gt;`;
});
html += &#39;&lt;/table&gt;&#39;;
resultList.innerHTML = html;
};

window.filterIrregularVerbs = function() {
const input = document.getElementById(&#39;iv-search-input&#39;);
if (!input) return;
let keyword = removeDiacritics(input.value.trim().toLowerCase());
if (!keyword) {
window.renderIrregularVerbsTable(IRREGULAR_VERBS_DATA);
return;
}
let filtered = IRREGULAR_VERBS_DATA.filter(item =&gt;
removeDiacritics(item.v1.toLowerCase()).includes(keyword) ||
removeDiacritics(item.v2.toLowerCase()).includes(keyword) ||

removeDiacritics(item.v3.toLowerCase()).includes(keyword) ||
removeDiacritics(item.meaning.toLowerCase()).includes(keyword) ||
(item.ipa1 &amp;&amp; item.ipa1.toLowerCase().includes(keyword)) ||
(item.ipa2 &amp;&amp; item.ipa2.toLowerCase().includes(keyword)) ||
(item.ipa3 &amp;&amp; item.ipa3.toLowerCase().includes(keyword))
);
window.renderIrregularVerbsTable(filtered);
};

// ==========================================
// QUẢN LÝ MÁY TÍNH BỎ TÚI (CALCULATOR)
// ==========================================
window.openCalculatorModal = function() {
const modal = document.getElementById(&#39;calc-modal&#39;);
if (modal) modal.style.display = &#39;flex&#39;;
};

window.closeCalculatorModal = function() {
const modal = document.getElementById(&#39;calc-modal&#39;);
if (modal) modal.style.display = &#39;none&#39;;
};

window.calcInput = function(value) {
const display = document.getElementById(&#39;calc-display&#39;);
if (display) {
display.value += value;
}

};

window.calcClear = function() {
const display = document.getElementById(&#39;calc-display&#39;);
if (display) {
display.value = &#39;&#39;;
}
};

window.calcCalculate = function() {
const display = document.getElementById(&#39;calc-display&#39;);
if (!display || !display.value.trim()) return;
try {
let expression = display.value.replace(/×/g, &#39;*&#39;).replace(/÷/g, &#39;/&#39;);
let result = new Function(`return ${expression}`)();

if (result !== undefined &amp;&amp; !isNaN(result)) {
display.value = result;
} else {
display.value = &#39;Lỗi&#39;;
}
} catch (e) {
display.value = &#39;Lỗi&#39;;
}
};

document.addEventListener(&#39;DOMContentLoaded&#39;, function() {

const btnCalc = document.getElementById(&#39;btn-calc&#39;);
if (btnCalc) {
btnCalc.addEventListener(&#39;click&#39;, window.openCalculatorModal);
}
});
// Biến lưu trữ đối tượng Audio đang phát
let currentAudio = null;

/**
* 1. Hàm tự động chuẩn hóa link Google Drive
*/
function formatDriveAudioUrl(url) {
if (!url) return &#39;&#39;;
let fileId = &#39;&#39;;

let match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
if (match &amp;&amp; match[1]) {
fileId = match[1];
} else {
match = url.match(/[?&amp;]id=([a-zA-Z0-9_-]+)/);
if (match &amp;&amp; match[1]) {
fileId = match[1];
}
}

if (fileId) {
return `https://docs.google.com/uc?export=open&amp;id=${fileId}`;

}
return url.trim();
}

/**
* 2. Hàm đọc văn bản tự động (TTS) - ĐÃ KHẮC PHỤC LỖI ĐỌC UNDERSCORE
*/
function speakText(text) {
if (!text || !(&#39;speechSynthesis&#39; in window)) return;

// XỬ LÝ TRIỆT ĐỂ: Thay thế tất cả dấu &#39;_&#39; thành khoảng trắng và xóa khoảng trắng
thừa
let cleanText = text
.replace(/_/g, &#39; &#39;) // Đổi &#39;_&#39; thành &#39; &#39; để máy KHÔNG đọc &quot;underscore&quot;
.replace(/\s+/g, &#39; &#39;) // Rút gọn khoảng trắng
.trim();

if (!cleanText) return;

// Khởi tạo giọng đọc
const utterance = new SpeechSynthesisUtterance(cleanText);
utterance.lang = &#39;en-US&#39;; // Hoặc &#39;vi-VN&#39; tùy theo môn học
utterance.rate = 0.9; // Tốc độ đọc vừa phải

window.speechSynthesis.speak(utterance);
}

/**
* 3. Hàm tổng hợp xử lý khi bấm nút LOA (Kết hợp MP3 + Giọng đọc cũ)
*/
function playAudio(mp3Url, fallbackText) {
// Dừng mọi âm thanh / giọng đọc đang phát trước đó
if (currentAudio) {
currentAudio.pause();
currentAudio.currentTime = 0;
}
if (&#39;speechSynthesis&#39; in window) {
window.speechSynthesis.cancel();
}

// Trường hợp 1: Có link MP3 -&gt; Ưu tiên phát MP3
if (mp3Url &amp;&amp; mp3Url.trim() !== &#39;&#39; &amp;&amp; mp3Url !== &#39;undefined&#39; &amp;&amp; mp3Url !== &#39;null&#39;) {
const playableUrl = formatDriveAudioUrl(mp3Url);
currentAudio = new Audio(playableUrl);

currentAudio.play().catch(error =&gt; {
console.warn(&quot;Không phát được file MP3, tự động chuyển sang đọc văn bản:&quot;,
error);
// Nếu link MP3 bị lỗi -&gt; Tự động chuyển sang đọc chữ (TTS)
speakText(fallbackText);
});
return;
}

// Trường hợp 2: Không có file MP3 -&gt; Đọc bằng giọng nói tự động (TTS) đã lọc dấu
&#39;_&#39;
speakText(fallbackText);
