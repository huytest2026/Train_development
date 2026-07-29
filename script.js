// ==========================================
// TOÀN BỘ MÃ NGUỒN HỆ THỐNG TRẮC NGHIỆM HOÀN CHỈNH
// ==========================================

const API_URL = "YOUR_GOOGLE_APPS_SCRIPT_API_URL_HERE"; // Thay thế bằng URL Google Apps Script của bạn

window.AppState = window.AppState || {
    currentQuizData: [],
    correctCount: 0,
    timerInterval: null,
    timeLeft: 0,
    studentCode: '',
    subject: '',
    level: '',
    selectedTopics: []
};

// ==========================================
// 1. CÁC HÀM HỖ TRỢ CƠ BẢN (HELPER FUNCTIONS)
// ==========================================
window.escapeHTML = function(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

window.cleanKey = function(str) {
    if (!str) return '';
    return String(str).trim().toLowerCase();
};

window.cleanOptionText = function(text) {
    if (!text) return '';
    return String(text).replace(/^[a-dA-D][\.\)]\s*/, '').trim();
};

window.removeDiacritics = function(str) {
    if (!str) return '';
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

window.speakWord = function(text) {
    if (!text) return;
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn('Trình duyệt không hỗ trợ phát âm (SpeechSynthesis).');
    }
};

window.handleBeforeUnload = function(e) {
    e.preventDefault();
    e.returnValue = '';
};

function parseCorrectKeys(correctStr) {
    if (!correctStr) return [];
    let cleaned = String(correctStr).toLowerCase().replace(/[^a-d]/g, '');
    let keys = [];
    for (let i = 0; i < cleaned.length; i++) {
        keys.push(cleaned[i]);
    }
    return keys;
}

// ==========================================
// 2. KHỞI TẠO, XÁC THỰC MÃ HS & TẢI DỮ LIỆU
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const loadBtn = document.getElementById('load-data-btn');
    if (loadBtn) {
        loadBtn.addEventListener('click', function() {
            let maHS = document.getElementById('student-code') ? document.getElementById('student-code').value.trim() : '';
            let mon = document.getElementById('subject-select') ? document.getElementById('subject-select').value : '';
            
            if (!maHS) {
                alert('Vui lòng nhập Mã học sinh!');
                return;
            }
            if (!mon) {
                alert('Vui lòng chọn môn học!');
                return;
            }

            localStorage.setItem('saved_maHS', maHS);
            AppState.studentCode = maHS;
            AppState.subject = mon;

            loadBtn.innerHTML = "⏳ Đang tải dữ liệu...";
            loadBtn.disabled = true;

            fetch(API_URL + "?mon=" + encodeURIComponent(mon))
                .then(response => response.json())
                .then(data => {
                    loadBtn.innerHTML = "Xác nhận Mã & Tải đề";
                    loadBtn.disabled = false;
                    if (data && data.length > 0) {
                        AppState.currentQuizData = data;
                        alert(`Đã tải thành công ${data.length} câu hỏi!`);
                        if (typeof window.showTopicSelection === 'function') {
                            window.showTopicSelection();
                        }
                    } else {
                        alert('Không có dữ liệu câu hỏi cho môn này.');
                    }
                })
                .catch(err => {
                    loadBtn.innerHTML = "Xác nhận Mã & Tải đề";
                    loadBtn.disabled = false;
                    console.error('Lỗi tải dữ liệu:', err);
                    alert('Lỗi kết nối đến máy chủ dữ liệu.');
                });
        });
    }
});

// ==========================================
// 3. HIỂN THỊ CÂU HỎI & XỬ LÝ LỰA CHỌN
// ==========================================
window.startQuiz = function() {
    let startScreen = document.getElementById('start-screen');
    let quizScreen = document.getElementById('quiz-screen');
    if (startScreen) startScreen.style.display = 'none';
    if (quizScreen) quizScreen.style.display = 'block';

    window.renderQuestions();
    if (typeof window.startTimerTotal === 'function' && !AppState.timerInterval) {
        window.startTimerTotal(15 * 60);
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
};

window.renderQuestions = function() {
    const container = document.getElementById('questions-container');
    if (!container) return;

    let html = '';
    AppState.currentQuizData.forEach((item, index) => {
        let hasOptions = item.a || item.b || item.c || item.d;
        let correctKeys = parseCorrectKeys(item.correct);
        item._correctKeys = correctKeys;
        let isMulti = correctKeys.length > 1;

        html += `<div class="question-card" style="background: #fff; border: 1px solid #ddd; padding: 16px; border-radius: 8px; margin-bottom: 15px;">` +
                `<div style="font-weight: bold; margin-bottom: 10px;">Câu ${index + 1}: ${escapeHTML(item.question || '')}</div>`;

        if (hasOptions) {
            let options = ['a', 'b', 'c', 'd'];
            options.forEach(optKey => {
                if (item[optKey]) {
                    let inputType = isMulti ? 'checkbox' : 'radio';
                    let inputName = `q_${index}`;
                    let optionText = cleanOptionText(item[optKey]);
                    html += `<label style="display: block; margin-bottom: 6px; cursor: pointer;">` +
                            `<input type="${inputType}" name="${inputName}" value="${optKey}" onchange="saveUserAnswer(${index}, '${optKey}', ${isMulti})"> ` +
                            `<b>${optKey.toUpperCase()}.</b> ${escapeHTML(optionText)}` +
                            `</label>`;
                }
            });
        } else {
            html += `<input type="text" placeholder="Nhập câu trả lời của bạn..." oninput="saveTextAnswer(${index}, this.value)" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">`;
        }
        html += `</div>`;
    });

    container.innerHTML = html;
};

window.saveUserAnswer = function(qIndex, optKey, isMulti) {
    if (!AppState.currentQuizData[qIndex]._userAnswer) {
        AppState.currentQuizData[qIndex]._userAnswer = [];
    }

    let userAns = AppState.currentQuizData[qIndex]._userAnswer;
    if (isMulti) {
        let idx = userAns.indexOf(optKey);
        if (idx > -1) {
            userAns.splice(idx, 1);
        } else {
            userAns.push(optKey);
        }
    } else {
        AppState.currentQuizData[qIndex]._userAnswer = [optKey];
    }
    updateCorrectCount();
};

window.saveTextAnswer = function(qIndex, text) {
    AppState.currentQuizData[qIndex]._userAnswer = [text.trim()];
    updateCorrectCount();
};

window.updateCorrectCount = function() {
    let count = 0;
    AppState.currentQuizData.forEach(item => {
        let userAns = item._userAnswer || [];
        let correctKeys = item._correctKeys || [];
        let hasOptions = item.a || item.b || item.c || item.d;

        if (hasOptions) {
            if (correctKeys.length > 1) {
                if (userAns.length === correctKeys.length && userAns.every(k => correctKeys.includes(k))) {
                    count++;
                }
            } else {
                if (userAns.length > 0 && correctKeys.length > 0 && userAns[0].toLowerCase() === correctKeys[0].toLowerCase()) {
                    count++;
                }
            }
        } else {
            if (userAns.length > 0 && item.correct && userAns[0].toLowerCase() === item.correct.trim().toLowerCase()) {
                count++;
            }
        }
    });
    AppState.correctCount = count;
};

// ==========================================
// 4. TÍNH NĂNG TRA TỪ ĐIỂN & TỰ ĐỘNG BÔI ĐEN
// ==========================================
window.lookupWord = async function() {
    const input = document.getElementById('dict-input');
    const resultDiv = document.getElementById('dict-result');
    if (!input || !resultDiv) return;

    let word = input.value.trim();
    if (!word) {
        resultDiv.innerHTML = '<span style="color: red;">Vui lòng nhập từ cần tra!</span>';
        return;
    }

    resultDiv.innerHTML = '⏳ Đang tra từ...';

    try {
        let response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        if (!response.ok) {
            resultDiv.innerHTML = '<span style="color: red;">Không tìm thấy từ này trong từ điển.</span>';
            return;
        }
        let data = await response.json();
        let entry = data[0];
        let phonetics = entry.phonetic || (entry.phonetics.find(p => p.text) ? entry.phonetics.find(p => p.text).text : '');
        let audioUrl = '';
        let audioObj = entry.phonetics.find(p => p.audio && p.audio.trim() !== '');
        if (audioObj) audioUrl = audioObj.audio;

        let html = `<div style="font-size: 1.2em; font-weight: bold; color: #540606;">${escapeHTML(entry.word)}</div>`;
        if (phonetics) html += `<div style="color: #d9534f; font-family: monospace;">${escapeHTML(phonetics)}</div>`;
        
        if (audioUrl) {
            html += `<button onclick="new Audio('${audioUrl}').play()" style="margin: 6px 0; padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">🔊 Nghe phát âm</button>`;
        }

        entry.meanings.forEach(meaning => {
            html += `<div style="margin-top: 8px; font-weight: bold; font-style: italic; color: #333;">${escapeHTML(meaning.partOfSpeech)}</div>`;
            meaning.definitions.slice(0, 2).forEach((def) => {
                html += `<div style="margin-left: 10px; font-size: 0.95em;">• ${escapeHTML(def.definition)}</div>`;
                if (def.example) {
                    html += `<div style="margin-left: 20px; font-size: 0.9em; color: #666; font-style: italic;">Ví dụ: "${escapeHTML(def.example)}"</div>`;
                }
            });
        });

        resultDiv.innerHTML = html;
    } catch (e) {
        resultDiv.innerHTML = '<span style="color: red;">Lỗi kết nối từ điển. Vui lòng thử lại sau.</span>';
    }
};

document.addEventListener('mouseup', function() {
    setTimeout(() => {
        let selectedText = window.getSelection().toString().trim();
        if (selectedText && selectedText.split(/\s+/).length === 1 && /^[a-zA-ZÀ-ỹ]+$/.test(selectedText)) {
            const modal = document.getElementById('dict-modal');
            const input = document.getElementById('dict-input');
            if (modal && input) {
                if (modal.style.display !== 'flex' || input.value.trim().toLowerCase() !== selectedText.toLowerCase()) {
                    modal.style.display = 'flex';
                    input.value = selectedText;
                    if (typeof window.lookupWord === 'function') window.lookupWord();
                }
            }
        }
    }, 100);
});

document.addEventListener('touchend', function() {
    setTimeout(() => {
        let selectedText = window.getSelection().toString().trim();
        if (selectedText && selectedText.split(/\s+/).length === 1 && /^[a-zA-ZÀ-ỹ]+$/.test(selectedText)) {
            const modal = document.getElementById('dict-modal');
            const input = document.getElementById('dict-input');
            if (modal && input) {
                modal.style.display = 'flex';
                input.value = selectedText;
                if (typeof window.lookupWord === 'function') window.lookupWord();
            }
        }
    }, 200);
});

// ==========================================
// 5. THỜI GIAN, NỘP BÀI, XEM LẠI & ĐIỀU HƯỚNG
// ==========================================
window.startTimerTotal = function(durationSeconds) {
    clearInterval(AppState.timerInterval);
    let remainingTime = durationSeconds;
    const timerDisplay = document.getElementById('timer-display');
    
    AppState.timerInterval = setInterval(() => {
        remainingTime--;
        let minutes = Math.floor(remainingTime / 60);
        let seconds = remainingTime % 60;
        if (timerDisplay) {
            timerDisplay.innerHTML = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
        }
        if (remainingTime <= 0) {
            clearInterval(AppState.timerInterval);
            alert("Đã hết thời gian làm bài!");
            window.submitQuiz();
        }
    }, 1000);
};

window.submitQuiz = function() {
    if (typeof handleBeforeUnload !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    }

    let maHS = document.getElementById('student-code') ? document.getElementById('student-code').value.trim() : localStorage.getItem('saved_maHS');
    let mon = document.getElementById('subject-select') ? document.getElementById('subject-select').value : '';
    let levelSelect = document.getElementById('level-select');
    let level = levelSelect ? levelSelect.value : '';

    let totalQuestions = AppState.currentQuizData.length;
    let score = Math.round((AppState.correctCount / totalQuestions) * 10 * 10) / 10;

    let details = AppState.currentQuizData.map((item, index) => {
        let hasOptions = item.a || item.b || item.c || item.d;
        let userAnswerText = 'Chưa trả lời';
        let correctAnswerText = '';
        let isCorrect = false;
        let correctKeys = item._correctKeys || [];
        let isMultiChoice = correctKeys.length > 1;

        if (hasOptions) {
            if (isMultiChoice) {
                correctAnswerText = correctKeys.map(k => k.toUpperCase() + '. ' + cleanOptionText(item[k])).join('; ');
                if (Array.isArray(item._userAnswer) && item._userAnswer.length > 0) {
                    userAnswerText = item._userAnswer.map(k => k.toUpperCase() + '. ' + cleanOptionText(item[k])).join('; ');
                    isCorrect = item._userAnswer.length === correctKeys.length && item._userAnswer.every(k => correctKeys.includes(k));
                }
            } else {
                let correctKey = correctKeys[0] || '';
                correctAnswerText = correctKey ? correctKey.toUpperCase() + '. ' + cleanOptionText(item[correctKey]) : item.correct;
                if (item._userAnswer && item._userAnswer.length > 0) {
                    let userKey = item._userAnswer[0];
                    userAnswerText = userKey.toUpperCase() + '. ' + cleanOptionText(item[userKey]);
                    isCorrect = (String(userKey).toLowerCase() === String(correctKey).toLowerCase());
                }
            }
        } else {
            correctAnswerText = item.correct || '';
            if (item._userAnswer && item._userAnswer.length > 0) {
                userAnswerText = item._userAnswer[0];
                isCorrect = (String(userAnswerText).trim().toLowerCase() === String(correctAnswerText).trim().toLowerCase());
            }
        }

        return {
            index: index + 1,
            question: item.question || ('Câu ' + (index + 1)),
            userAnswer: userAnswerText,
            correctAnswer: correctAnswerText,
            isCorrect: isCorrect
        };
    });

    if (maHS && mon) {
        fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ maHS: maHS, mon: mon, score: score, level: level, details: details })
        }).catch(err => console.log('Lỗi gửi kết quả:', err));
    }

    let quizScreen = document.getElementById('quiz-screen');
    if (quizScreen) quizScreen.style.display = 'none';

    let resultContainer = document.getElementById('result-container');
    if (!resultContainer) {
        resultContainer = document.createElement('div');
        resultContainer.id = 'result-container';
        resultContainer.className = 'container';
        document.body.appendChild(resultContainer);
    }

    resultContainer.innerHTML = '<h2 style="text-align: center; color: #540606; font-size: 1.6em;">Kết Quả Bài Làm</h2>' +
        '<p style="font-size: 1.2em; text-align: center;">Số câu hỏi đúng: <b>' + AppState.correctCount + ' / ' + totalQuestions + '</b></p>' +
        '<p style="font-size: 1.4em; text-align: center; font-weight: bold;">Điểm số: ' + score + ' đ</p>' +
        '<div style="display: flex; gap: 12px; margin-top: 20px;">' +
        '<button type="button" onclick="window.location.reload()" style="flex: 1; padding: 14px; background: #007bff; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 1.05em;">Làm bài mới</button>' +
        '<button type="button" onclick="window.viewReviewDetails()" style="flex: 1; padding: 14px; background: #6c757d; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 1.05em;">🔍 Xem lại chi tiết</button>' +
        '</div>' +
        '<div id="review-detail-box" style="margin-top: 20px;"></div>';
};

window.viewReviewDetails = function() {
    const box = document.getElementById('review-detail-box');
    if (!box) return;

    let html = '<h3 style="color: #540606; border-bottom: 2px solid #540606; padding-bottom: 8px; font-size: 1.3em;">Chi Tiết Bài Làm</h3>';

    AppState.currentQuizData.forEach((item, index) => {
        let hasOptions = item.a || item.b || item.c || item.d;
        let userAnswerText = 'Chưa trả lời';
        let correctAnswerText = '';
        let isCorrect = false;
        let correctKeys = item._correctKeys || [];
        let isMultiChoice = correctKeys.length > 1;

        if (hasOptions) {
            if (isMultiChoice) {
                correctAnswerText = correctKeys.map(k => k.toUpperCase() + '. ' + cleanOptionText(item[k])).join('; ');
                if (Array.isArray(item._userAnswer) && item._userAnswer.length > 0) {
                    userAnswerText = item._userAnswer.map(k => k.toUpperCase() + '. ' + cleanOptionText(item[k])).join('; ');
                    isCorrect = item._userAnswer.length === correctKeys.length && item._userAnswer.every(k => correctKeys.includes(k));
                }
            } else {
                let correctKey = correctKeys[0] || '';
                correctAnswerText = correctKey ? correctKey.toUpperCase() + '. ' + cleanOptionText(item[correctKey]) : item.correct;
                if (item._userAnswer && item._userAnswer.length > 0) {
                    let userKey = item._userAnswer[0];
                    userAnswerText = userKey.toUpperCase() + '. ' + cleanOptionText(item[userKey]);
                    isCorrect = (String(userKey).toLowerCase() === String(correctKey).toLowerCase());
                }
            }
        } else {
            correctAnswerText = item.correct || '';
            if (item._userAnswer && item._userAnswer.length > 0) {
                userAnswerText = item._userAnswer[0];
                isCorrect = (String(userAnswerText).trim().toLowerCase() === String(correctAnswerText).trim().toLowerCase());
            }
        }

        let statusColor = isCorrect ? 'green' : 'red';
        let statusText = isCorrect ? '✅ Đúng' : '❌ Sai';

        html += '<div style="background: #fff; border: 1px solid #ddd; padding: 14px; border-radius: 8px; margin-bottom: 12px; font-size: 1.05em;">' +
            '<div style="font-weight: bold; margin-bottom: 6px;">Câu ' + (index + 1) + ': ' + escapeHTML(item.question) + '</div>' +
            '<div style="font-size: 1em; color: ' + statusColor + '; font-weight: bold; margin-bottom: 4px;">Trạng thái: ' + statusText + '</div>' +
            '<div style="font-size: 1em;">Bạn chọn: <b>' + escapeHTML(userAnswerText) + '</b></div>' +
            '<div style="font-size: 1em; color: #28a745;">Đáp án đúng: <b>' + escapeHTML(correctAnswerText) + '</b></div>' +
            '</div>';
    });

    box.innerHTML = html;
};

window.backToHome = function() {
    if (confirm("Bạn có chắc muốn thoát ra màn hình chính? Bài làm hiện tại sẽ không được lưu.")) {
        if (typeof AppState !== 'undefined' && AppState.timerInterval) {
            clearInterval(AppState.timerInterval);
        }
        window.removeEventListener('beforeunload', handleBeforeUnload);
        const quizScreen = document.getElementById('quiz-screen');
        const startScreen = document.getElementById('start-screen');
        if (quizScreen) quizScreen.style.display = 'none';
        if (startScreen) startScreen.style.display = 'block';
        const resContainer = document.getElementById('result-container');
        if (resContainer) resContainer.remove();
    }
};

// ==========================================
// 6. QUẢN LÝ BẢNG ĐỘNG TỪ BẤT QUY TẮC
// ==========================================
const IRREGULAR_VERBS_DATA = [
    { v1: "be", ipa1: "/biː/", v2: "was / were", ipa2: "/wɒz / wɜː/", v3: "been", ipa3: "/biːn/", meaning: "là, ở" },
    { v1: "beat", ipa1: "/biːt/", v2: "beat", ipa2: "/biːt/", v3: "beaten", ipa3: "/ˈbiːtn/", meaning: "đánh, đập" },
    { v1: "become", ipa1: "/bɪˈkʌm/", v2: "became", ipa2: "/bɪˈkeɪm/", v3: "become", ipa3: "/bɪˈkʌm/", meaning: "trở thành" },
    { v1: "begin", ipa1: "/bɪˈɡɪn/", v2: "began", ipa2: "/bɪˈɡæn/", v3: "begun", ipa3: "/bɪˈɡʌn/", meaning: "bắt đầu" },
    { v1: "bite", ipa1: "/baɪt/", v2: "bit", ipa2: "/bɪt/", v3: "bitten", ipa3: "/ˈbɪtn/", meaning: "cắn" },
    { v1: "blow", ipa1: "/bləʊ/", v2: "blew", ipa2: "/bluː/", v3: "blown", ipa3: "/bləʊn/", meaning: "thổi" },
    { v1: "break", ipa1: "/breɪk/", v2: "broke", ipa2: "/brəʊk/", v3: "broken", ipa3: "/ˈbrəʊkən/", meaning: "làm vỡ, gãy" },
    { v1: "bring", ipa1: "/brɪŋ/", v2: "brought", ipa2: "/brɔːt/", v3: "brought", ipa3: "/brɔːt/", meaning: "mang lại" },
    { v1: "build", ipa1: "/bɪld/", v2: "built", ipa2: "/bɪlt/", v3: "built", ipa3: "/bɪlt/", meaning: "xây dựng" },
    { v1: "buy", ipa1: "/baɪ/", v2: "bought", ipa2: "/brɔːt/", v3: "bought", ipa3: "/brɔːt/", meaning: "mua" },
    { v1: "catch", ipa1: "/kætʃ/", v2: "caught", ipa2: "/kɔːt/", v3: "caught", ipa3: "/kɔːt/", meaning: "bắt, tóm" },
    { v1: "choose", ipa1: "/tʃuːz/", v2: "chose", ipa2: "/tʃəʊz/", v3: "chosen", ipa3: "/ˈtʃəʊzn/", meaning: "chọn, lựa" },
    { v1: "come", ipa1: "/kʌm/", v2: "came", ipa2: "/keɪm/", v3: "come", ipa3: "/kʌm/", meaning: "đến, đi đến" },
    { v1: "cost", ipa1: "/kɒst/", v2: "cost", ipa2: "/kɒst/", v3: "cost", ipa3: "/kɒst/", meaning: "có giá là" },
    { v1: "cut", ipa1: "/kʌt/", v2: "cut", ipa2: "/kʌt/", v3: "cut", ipa3: "/kʌt/", meaning: "cắt" },
    { v1: "do", ipa1: "/duː/", v2: "did", ipa2: "/dɪd/", v3: "done", ipa3: "/dʌn/", meaning: "làm" },
    { v1: "draw", ipa1: "/drɔː/", v2: "drew", ipa2: "/druː/", v3: "drawn", ipa3: "/drɔːn/", meaning: "vẽ, kéo" },
    { v1: "drink", ipa1: "/drɪŋk/", v2: "drank", ipa2: "/dræŋk/", v3: "drunk", ipa3: "/drʌŋk/", meaning: "uống" },
    { v1: "drive", ipa1: "/draɪv/", v2: "drove", ipa2: "/drəʊv/", v3: "driven", ipa3: "/ˈdrɪvn/", meaning: "lái xe" },
    { v1: "eat", ipa1: "/iːt/", v2: "ate", ipa2: "/et/", v3: "eaten", ipa3: "/ˈiːtn/", meaning: "ăn" },
    { v1: "fall", ipa1: "/fɔːl/", v2: "fell", ipa2: "/fel/", v3: "fallen", ipa3: "/ˈfɔːlən/", meaning: "ngã, rơi" },
    { v1: "feel", ipa1: "/fiːl/", v2: "felt", ipa2: "/felt/", v3: "felt", ipa3: "/felt/", meaning: "cảm thấy" },
    { v1: "find", ipa1: "/faɪnd/", v2: "found", ipa2: "/faʊnd/", v3: "found", ipa3: "/faʊnd/", meaning: "tìm thấy" },
    { v1: "fly", ipa1: "/flaɪ/", v2: "flew", ipa2: "/fluː/", v3: "flown", ipa3: "/fləʊn/", meaning: "bay" },
    { v1: "forget", ipa1: "/fəˈɡet/", v2: "forgot", ipa2: "/fəˈɡɒt/", v3: "forgotten", ipa3: "/fəˈɡɒtn/", meaning: "quên" },
    { v1: "get", ipa1: "/ɡet/", v2: "got", ipa2: "/ɡɒt/", v3: "got / gotten", ipa3: "/ɡɒt / ˈɡɒtn/", meaning: "được, nhận" },
    { v1: "give", ipa1: "/ɡɪv/", v2: "gave", ipa2: "/ɡeɪv/", v3: "given", ipa3: "/ˈɡɪvn/", meaning: "cho, tặng" },
    { v1: "go", ipa1: "/ɡəʊ/", v2: "went", ipa2: "/went/", v3: "gone", ipa3: "/ɡɒn/", meaning: "đi" },
    { v1: "grow", ipa1: "/ɡrəʊ/", v2: "grew", ipa2: "/ɡruː/", v3: "grown", ipa3: "/ɡrəʊn/", meaning: "mọc, phát triển" },
    { v1: "have", ipa1: "/hæv/", v2: "had", ipa2: "/hæd/", v3: "had", ipa3: "/hæd/", meaning: "có" },
    { v1: "hear", ipa1: "/hɪər/", v2: "heard", ipa2: "/hɜːd/", v3: "heard", ipa3: "/hɜːd/", meaning: "nghe" },
    { v1: "hide", ipa1: "/haɪd/", v2: "hid", ipa2: "/hɪd/", v3: "hidden", ipa3: "/ˈhɪdn/", meaning: "trốn, giấu" },
    { v1: "hit", ipa1: "/hɪt/", v2: "hit", ipa2: "/hɪt/", v3: "hit", ipa3: "/hɪt/", meaning: "đánh" },
    { v1: "hold", ipa1: "/həʊld/", v2: "held", ipa2: "/held/", v3: "held", ipa3: "/held/", meaning: "cầm, nắm" },
    { v1: "hurt", ipa1: "/hɜːt/", v2: "hurt", ipa2: "/hɜːt/", v3: "hurt", ipa3: "/hɜːt/", meaning: "làm đau" },
    { v1: "keep", ipa1: "/kiːp/", v2: "kept", ipa2: "/kept/", v3: "kept", ipa3: "/kept/", meaning: "giữ" },
    { v1: "know", ipa1: "/nəʊ/", v2: "knew", ipa2: "/njuː/", v3: "known", ipa3: "/nəʊn/", meaning: "biết" },
    { v1: "leave", ipa1: "/liːv/", v2: "left", ipa2: "/left/", v3: "left", ipa3: "/left/", meaning: "rời đi, để lại" },
    { v1: "lend", ipa1: "/lend/", v2: "lent", ipa2: "/lent/", v3: "lent", ipa3: "/lent/", meaning: "cho mượn" },
    { v1: "let", ipa1: "/let/", v2: "let", ipa2: "/let/", v3: "let", ipa3: "/let/", meaning: "cho phép" },
    { v1: "lie", ipa1: "/laɪ/", v2: "lay", ipa2: "/leɪ/", v3: "lain", ipa3: "/leɪn/", meaning: "nằm" },
    { v1: "lose", ipa1: "/luːz/", v2: "lost", ipa2: "/lɒst/", v3: "lost", ipa3: "/lɒst/", meaning: "mất, thua" },
    { v1: "make", ipa1: "/meɪk/", v2: "made", ipa2: "/meɪd/", v3: "made", ipa3: "/meɪd/", meaning: "làm, chế tạo" },
    { v1: "meet", ipa1: "/miːt/", v2: "met", ipa2: "/met/", v3: "met", ipa3: "/met/", meaning: "gặp" },
    { v1: "pay", ipa1: "/peɪ/", v2: "paid", ipa2: "/peɪd/", v3: "paid", ipa3: "/peɪd/", meaning: "trả tiền" },
    { v1: "put", ipa1: "/pʊt/", v2: "put", ipa2: "/pʊt/", v3: "put", ipa3: "/pʊt/", meaning: "đặt, để" },
    { v1: "read", ipa1: "/riːd/", v2: "read", ipa2: "/red/", v3: "read", ipa3: "/red/", meaning: "đọc" },
    { v1: "ride", ipa1: "/raɪd/", v2: "rode", ipa2: "/rəʊd/", v3: "ridden", ipa3: "/ˈrɪdn/", meaning: "cưỡi, lái" },
    { v1: "ring", ipa1: "/rɪŋ/", v2: "rang", ipa2: "/ræŋ/", v3: "rung", ipa3: "/rʌŋ/", meaning: "reo, rung chuông" },
    { v1: "rise", ipa1: "/raɪz/", v2: "rose", ipa2: "/rəʊz/", v3: "risen", ipa3: "/ˈrɪzn/", meaning: "mọc, tăng lên" },
    { v1: "run", ipa1: "/rʌn/", v2: "ran", ipa2: "/ræn/", v3: "run", ipa3: "/rʌn/", meaning: "chạy" },
    { v1: "say", ipa1: "/seɪ/", v2: "said", ipa2: "/sed/", v3: "said", ipa3: "/sed/", meaning: "nói" },
    { v1: "see", ipa1: "/siː/", v2: "saw", ipa2: "/sɔː/", v3: "seen", ipa3: "/siːn/", meaning: "nhìn thấy" },
    { v1: "sell", ipa1: "/sel/", v2: "sold", ipa2: "/səʊld/", v3: "sold", ipa3: "/səʊld/", meaning: "bán" },
    { v1: "send", ipa1: "/send/", v2: "sent", ipa2: "/sent/", v3: "sent", ipa3: "/sent/", meaning: "gửi" },
    { v1: "show", ipa1: "/ʃəʊ/", v2: "showed", ipa2: "/ʃəʊd/", v3: "shown", ipa3: "/ʃəʊn/", meaning: "trình bày, chỉ" },
    { v1: "shut", ipa1: "/ʃʌt/", v2: "shut", ipa2: "/ʃʌt/", v3: "shut", ipa3: "/ʃʌt/", meaning: "đóng lại" },
    { v1: "sing", ipa1: "/sɪŋ/", v2: "sang", ipa2: "/sæŋ/", v3: "sung", ipa3: "/sʌŋ/", meaning: "hát" },
    { v1: "sit", ipa1: "/sɪt/", v2: "sat", ipa2: "/sæt/", v3: "sat", ipa3: "/sæt/", meaning: "ngồi" },
    { v1: "sleep", ipa1: "/sliːp/", v2: "slept", ipa2: "/slept/", v3: "slept", ipa3: "/slept/", meaning: "ngủ" },
    { v1: "speak", ipa1: "/spiːk/", v2: "spoke", ipa2: "/spəʊk/", v3: "spoken", ipa3: "/ˈspəʊkən/", meaning: "nói" },
    { v1: "spend", ipa1: "/spend/", v2: "spent", ipa2: "/spent/", v3: "spent", ipa3: "/spent/", meaning: "tiêu xài, trải qua" },
    { v1: "stand", ipa1: "/stænd/", v2: "stood", ipa2: "/stʊd/", v3: "stood", ipa3: "/stʊd/", meaning: "đứng" },
    { v1: "swim", ipa1: "/swɪm/", v2: "swam", ipa2: "/swæm/", v3: "swum", ipa3: "/swʌm/", meaning: "bơi" },
    { v1: "take", ipa1: "/teɪk/", v2: "took", ipa2: "/tʊk/", v3: "taken", ipa3: "/ˈteɪkən/", meaning: "cầm, lấy" },
    { v1: "teach", ipa1: "/tiːtʃ/", v2: "taught", ipa2: "/tɔːt/", v3: "taught", ipa3: "/tɔːt/", meaning: "dạy" },
    { v1: "tear", ipa1: "/teər/", v2: "tore", ipa2: "/tɔːr/", v3: "torn", ipa3: "/tɔːrn/", meaning: "xé" },
    { v1: "tell", ipa1: "/tel/", v2: "told", ipa2: "/təʊld/", v3: "told", ipa3: "/təʊld/", meaning: "kể, bảo" },
    { v1: "think", ipa1: "/θɪŋk/", v2: "thought", ipa2: "/θɔːt/", v3: "thought", ipa3: "/θɔːt/", meaning: "suy nghĩ" },
    { v1: "throw", ipa1: "/θrəʊ/", v2: "threw", ipa2: "/θruː/", v3: "thrown", ipa3: "/θrəʊn/", meaning: "ném, quăng" },
    { v1: "understand", ipa1: "/ˌʌndəˈstænd/", v2: "understood", ipa2: "/ˌʌndəˈstʊd/", v3: "understood", ipa3: "/ˌʌndəˈstʊd/", meaning: "hiểu" },
    { v1: "wake", ipa1: "/weɪk/", v2: "woke", ipa2: "/wəʊk/", v3: "woken", ipa3: "/ˈwəʊkən/", meaning: "thức dậy" },
    { v1: "wear", ipa1: "/weər/", v2: "wore", ipa2: "/wɔːr/", v3: "worn", ipa3: "/wɔːrn/", meaning: "mặc" },
    { v1: "win", ipa1: "/wɪn/", v2: "won", ipa2: "/wʌn/", v3: "won", ipa3: "/wʌn/", meaning: "thắng, chiến thắng" },
    { v1: "write", ipa1: "/raɪt/", v2: "wrote", ipa2: "/rəʊt/", v3: "written", ipa3: "/ˈrɪtn/", meaning: "viết" }
];

window.openIrregularVerbsModal = function() {
    const modal = document.getElementById('irregular-verbs-modal');
    if (modal) {
        modal.style.display = 'flex';
        window.renderIrregularVerbsTable(IRREGULAR_VERBS_DATA);
        const searchInput = document.getElementById('iv-search-input');
        if (searchInput) searchInput.focus();
    }
};

window.closeIrregularVerbsModal = function() {
    const modal = document.getElementById('irregular-verbs-modal');
    if (modal) modal.style.display = 'none';
};

window.renderIrregularVerbsTable = function(dataArray) {
    const resultList = document.getElementById('iv-result-list');
    if (!resultList) return;

    if (dataArray.length === 0) {
        resultList.innerHTML = '<div style="text-align: center; color: #888; padding: 15px;">Không tìm thấy động từ phù hợp.</div>';
        return;
    }

    let html = '<table style="width: 100%; border-collapse: collapse; font-size: 1.02em;">';
    html += '<tr style="background: #540606; color: white; text-align: left;">' +
            '<th style="padding: 10px; border: 1px solid #ddd;">V1 (Base)</th>' +
            '<th style="padding: 10px; border: 1px solid #ddd;">V2 (Past)</th>' +
            '<th style="padding: 10px; border: 1px solid #ddd;">V3 (Participle)</th>' +
            '<th style="padding: 10px; border: 1px solid #ddd;">Ý nghĩa</th>' +
            '</tr>';

    dataArray.forEach((item, index) => {
        let bg = index % 2 === 0 ? '#ffffff' : '#f1f3f5';
        html += `<tr style="background: ${bg};">` +
                `<td style="padding: 8px 10px; border: 1px solid #ddd;">` +
                    `<div style="font-weight: bold; color: #007bff; cursor: pointer;" title="Nhấp để nghe phát âm" onclick="speakWord('${escapeHTML(item.v1)}')">${escapeHTML(item.v1)} 🔊</div>` +
                    `<div style="color: #d9534f; font-family: monospace; font-size: 0.88em;">${escapeHTML(item.ipa1 || '')}</div>` +
                `</td>` +
                `<td style="padding: 8px 10px; border: 1px solid #ddd;">` +
                    `<div style="font-weight: bold; color: #333; cursor: pointer;" title="Nhấp để nghe phát âm" onclick="speakWord('${escapeHTML(item.v2)}')">${escapeHTML(item.v2)} 🔊</div>` +
                    `<div style="color: #d9534f; font-family: monospace; font-size: 0.88em;">${escapeHTML(item.ipa2 || '')}</div>` +
                `</td>` +
                `<td style="padding: 8px 10px; border: 1px solid #ddd;">` +
                    `<div style="font-weight: bold; color: #333; cursor: pointer;" title="Nhấp để nghe phát âm" onclick="speakWord('${escapeHTML(item.v3)}')">${escapeHTML(item.v3)} 🔊</div>` +
                    `<div style="color: #d9534f; font-family: monospace; font-size: 0.88em;">${escapeHTML(item.ipa3 || '')}</div>` +
                `</td>` +
                `<td style="padding: 8px 10px; border: 1px solid #ddd; font-style: italic;">${escapeHTML(item.meaning)}</td>` +
                `</tr>`;
    });
    html += '</table>';
    resultList.innerHTML = html;
};

window.filterIrregularVerbs = function() {
    const input = document.getElementById('iv-search-input');
    if (!input) return;
    let keyword = removeDiacritics(input.value.trim().toLowerCase());

    if (!keyword) {
        window.renderIrregularVerbsTable(IRREGULAR_VERBS_DATA);
        return;
    }

    let filtered = IRREGULAR_VERBS_DATA.filter(item => 
        removeDiacritics(item.v1.toLowerCase()).includes(keyword) ||
        removeDiacritics(item.v2.toLowerCase()).includes(keyword) ||
        removeDiacritics(item.v3.toLowerCase()).includes(keyword) ||
        removeDiacritics(item.meaning.toLowerCase()).includes(keyword) ||
        (item.ipa1 && item.ipa1.toLowerCase().includes(keyword)) ||
        (item.ipa2 && item.ipa2.toLowerCase().includes(keyword)) ||
        (item.ipa3 && item.ipa3.toLowerCase().includes(keyword))
    );

    window.renderIrregularVerbsTable(filtered);
};

// ==========================================
// 7. QUẢN LÝ MÁY TÍNH BỎ TÚI (CALCULATOR)
// ==========================================
window.openCalculatorModal = function() {
    const modal = document.getElementById('calc-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeCalculatorModal = function() {
    const modal = document.getElementById('calc-modal');
    if (modal) modal.style.display = 'none';
};

window.calcInput = function(value) {
    const display = document.getElementById('calc-display');
    if (display) {
        display.value += value;
    }
};

window.calcClear = function() {
    const display = document.getElementById('calc-display');
    if (display) {
        display.value = '';
    }
};

window.calcCalculate = function() {
    const display = document.getElementById('calc-display');
    if (!display || !display.value.trim()) return;

    try {
        let expression = display.value.replace(/×/g, '*').replace(/÷/g, '/');
        let result = new Function(`return ${expression}`)();
        
        if (result !== undefined && !isNaN(result)) {
            display.value = result;
        } else {
            display.value = 'Lỗi';
        }
    } catch (e) {
        display.value = 'Lỗi';
    }
};

// ==========================================
// 8. TỰ ĐỘNG TẢI DỮ LIỆU & TẠO ĐỀ TỔNG HỢP (30 phút - 21 câu)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const btnMixedQuiz = document.getElementById('btnMixedQuiz');
    if (btnMixedQuiz) {
        btnMixedQuiz.addEventListener('click', function() {
            
            function generateMixedQuiz() {
                const targetStructure = [
                    { chuDe: "Hình học", count: 2 },
                    { chuDe: "Đổi đơn vị", count: 6 },
                    { chuDe: "Phân số", count: 4 },
                    { chuDe: "Phép tính số thập phân", count: 5 },
                    { chuDe: "So sánh phân số", count: 4 }
                ];

                let mixedQuestions = [];
                let errors = [];

                targetStructure.forEach(item => {
                    let pool = AppState.currentQuizData.filter(q => {
                        let qChuDe = String(q.chuDe || q.chude || '').trim().toLowerCase();
                        return qChuDe === item.chuDe.toLowerCase();
                    });

                    if (pool.length < item.count) {
                        errors.push(`- Chủ đề "${item.chuDe}": Cần ${item.count} câu, nhưng trong kho chỉ có ${pool.length} câu.`);
                    }

                    pool.sort(() => Math.random() - 0.5);
                    let selected = pool.slice(0, item.count);
                    mixedQuestions = mixedQuestions.concat(selected);
                });

                if (errors.length > 0) {
                    alert("Không đủ dữ liệu tạo đề tổng hợp:\n\n" + errors.join("\n") + "\n\nBạn vui lòng kiểm tra lại tên cột chủ đề trong Google Sheet!");
                    return;
                }

                mixedQuestions.sort(() => Math.random() - 0.5);
                AppState.currentQuizData = mixedQuestions;

                if (typeof window.startTimer === 'function') {
                    window.startTimer(30 * 60);
                } else if (window.timeLeft !== undefined) {
                    window.timeLeft = 30 * 60;
                }

                if (typeof window.startQuizWithToolCheck === 'function') {
                    window.startQuizWithToolCheck();
                } else if (typeof window.startQuiz === 'function') {
                    window.startQuiz();
                } else {
                    alert("Đã tạo thành công đề tổng hợp 30 phút! Vui lòng bấm 'Bắt Đầu Làm Bài'.");
                }
            }

            if (window.AppState && AppState.currentQuizData && AppState.currentQuizData.length > 0) {
                generateMixedQuiz();
            } else {
                let loadBtn = document.getElementById('load-data-btn');
                if (loadBtn) {
                    if (window.jQuery) {
                        window.jQuery('#load-data-btn').click();
                    } else {
                        loadBtn.click();
                    }
                }

                const originalText = btnMixedQuiz.innerHTML;
                btnMixedQuiz.innerHTML = "⏳ Đang tải và tạo đề...";
                btnMixedQuiz.disabled = true;

                let attempts = 0;
                let checkInterval = setInterval(function() {
                    attempts++;
                    if (window.AppState && AppState.currentQuizData && AppState.currentQuizData.length > 0) {
                        clearInterval(checkInterval);
                        btnMixedQuiz.innerHTML = originalText;
                        btnMixedQuiz.disabled = false;
                        generateMixedQuiz();
                    } else if (attempts > 80) {
                        clearInterval(checkInterval);
                        btnMixedQuiz.innerHTML = originalText;
                        btnMixedQuiz.disabled = false;
                        alert("Quá thời gian tải dữ liệu. Vui lòng kiểm tra lại kết nối mạng hoặc bấm nút 'Xác nhận Mã & Tải đề' thủ công một lần!");
                    }
                }, 500);
            }
        });
    }
});
