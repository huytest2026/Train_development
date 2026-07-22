const AppState = {
    allQuizData: [],
    userPermissions: [],
    rankings: [],
    currentQuizData: [],
    timerInterval: null,
    correctCount: 0,
    wrongCount: 0,
    wrongQuestions: [],
    isReadingComp: false,
    darkMode: false,
    userAnswers: {} // Lưu lại lịch sử đáp án để xem lại chi tiết
};

(function injectStyles() {
    const style = document.createElement('style');
    style.id = 'app-custom-styles';
    style.innerHTML = `
        .container { background: #bbe9f0; padding: 25px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 600px; margin: 20px auto; transition: background 0.3s, color 0.3s; }
        .quiz-card { background: #ffffff; border: 2px solid #540606; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transition: background 0.3s, border-color 0.3s, color 0.3s; }
        .option-box { background: #f8f9fa; border: 1px solid #540606; border-radius: 8px; padding: 12px 15px; margin: 8px 0; cursor: pointer; transition: all 0.2s ease; font-weight: 500; }
        .option-box:hover { background: #e9ecef; border-color: #adb5bd; }
        .explanation-box { margin-top: 15px; padding: 12px; background: #fff3cd; border-left: 5px solid #ffc107; border-radius: 4px; display: none; color: #856404; font-size: 0.95em; line-height: 1.4; }
        .leaderboard-container { background: #fff; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #eee; transition: background 0.3s, color 0.3s; }
        .leaderboard-item { padding: 10px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
        .medal { font-size: 1.2em; margin-right: 10px; }
        .score-badge { background: #eef2f3; padding: 4px 12px; border-radius: 20px; font-weight: bold; color: #4f46e5; }
        .time-text { font-size: 0.8em; color: #888; display: block; }
        .speaker-btn { background: #6c757d; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-bottom: 10px; display: inline-flex; align-items: center; gap: 5px; font-weight: 500; }
        .speaker-btn:hover { background: #5a6268; }
        #retry-wrong-btn { background: #d9534f; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 10px; width: 100%; font-weight: bold; }
        
        /* Cố định khung đầu trang khi cuộn */
        #quiz-screen > .container:first-child, #timer-display {
            position: sticky;
            top: 10px;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }

        .passage-box { 
            background: #ffffff; 
            border: 2px solid #540606; 
            border-radius: 12px; 
            padding: 20px; 
            margin-bottom: 20px; 
            font-size: 1.05em; 
            line-height: 1.6; 
            color: #333; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            transition: background 0.3s, border-color 0.3s, color 0.3s;
        }

        .passage-tag {
            display: inline-block;
            background: #e9ecef;
            border: 1px solid #ced4da;
            padding: 5px 15px;
            font-weight: bold;
            border-radius: 6px;
            margin-bottom: 12px;
            color: #333;
            font-size: 1em;
        }

        input[type="text"], select {
            width: 100%;
            padding: 12px 15px;
            margin: 8px 0 15px 0;
            border: 1px solid #540606;
            border-radius: 8px;
            box-sizing: border-box;
            font-size: 1em;
            background: #ffffff;
            color: #000;
        }

        #topic-container {
            width: 100%;
            background: #ffffff;
            border: 1px solid #540606;
            border-radius: 8px;
            padding: 12px 15px;
            margin: 8px 0 15px 0;
            box-sizing: border-box;
            min-height: 50px;
            max-height: 200px;
            overflow-y: auto;
            color: #000;
        }

        select option:disabled { color: #aaa; background: #f1f1f1; }
        
        .mistake-bank-btn {
            background: #6f42c1;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 10px;
            width: 100%;
            font-weight: bold;
            transition: background 0.2s;
            font-size: 1em;
        }
        .mistake-bank-btn:hover { background: #5a32a3; }

        /* Dark Mode Styles */
        body.dark-mode {
            background-color: #121212 !important;
            color: #e0e0e0 !important;
        }
        body.dark-mode .container {
            background: #1e1e1e !important;
            color: #e0e0e0 !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            border: 1px solid #333;
        }
        body.dark-mode #quiz-screen > .container:first-child, body.dark-mode #timer-display {
            background: #1e1e1e !important;
            border: 1px solid #bb86fc;
        }
        body.dark-mode .quiz-card {
            background: #2d2d2d !important;
            border-color: #bb86fc !important;
            color: #e0e0e0 !important;
        }
        body.dark-mode .option-box {
            background: #383838 !important;
            border-color: #555 !important;
            color: #e0e0e0 !important;
        }
        body.dark-mode .option-box:hover {
            background: #454545 !important;
            border-color: #bb86fc !important;
        }
        body.dark-mode .passage-box {
            background: #2d2d2d !important;
            border-color: #bb86fc !important;
            color: #e0e0e0 !important;
        }
        body.dark-mode .passage-tag {
            background: #383838 !important;
            border-color: #555 !important;
            color: #e0e0e0 !important;
        }
        body.dark-mode input[type="text"], body.dark-mode select, body.dark-mode #topic-container {
            background: #2d2d2d !important;
            color: #e0e0e0 !important;
            border-color: #bb86fc !important;
        }
        body.dark-mode .leaderboard-container {
            background: #1e1e1e !important;
            border-color: #333 !important;
            color: #e0e0e0 !important;
        }
        body.dark-mode .leaderboard-item {
            border-bottom-color: #333 !important;
        }
        body.dark-mode .score-badge {
            background: #333 !important;
            color: #bb86fc !important;
        }
        body.dark-mode .explanation-box {
            background: #3a321d !important;
            color: #ffda6a !important;
            border-left-color: #ffc107 !important;
        }
    `;
    document.head.appendChild(style);
})();

function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}

function removeDiacritics(str) {
    return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function cleanKey(str) {
    return removeDiacritics(str).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeItem(item) {
    if (!item) return null;
    
    if (!Array.isArray(item) && typeof item === 'object') {
        const findKey = (possibleNames) => {
            for (let name of possibleNames) {
                const cleanN = cleanKey(name);
                for (let realKey of Object.keys(item)) {
                    if (cleanKey(realKey) === cleanN) {
                        const val = item[realKey];
                        if (val !== undefined && val !== null && String(val).trim() !== '') {
                            return String(val).trim();
                        }
                    }
                }
            }
            return '';
        };

        return {
            mon: findKey(['mon', 'môn', 'subject']),
            chuDe: findKey(['chude', 'chủ đề', 'chu de', 'topic']),
            question: findKey(['question', 'noidungcauhoi', 'noi_dung_cau_hoi', 'noi_dung', 'noidung', 'cauhoi', 'cau_hoi', 'cau', 'de_bai', 'de', 'nd', 'content', 'text', 'câu hỏi', 'nội dung câu hỏi', 'đề bài', 'đề']),
            a: findKey(['a', 'dapan_a', 'dap an a', 'đáp án a', 'option_a']),
            b: findKey(['b', 'dapan_b', 'dap an b', 'đáp án b', 'option_b']),
            c: findKey(['c', 'dapan_c', 'dap an c', 'đáp án c', 'option_c']),
            d: findKey(['d', 'dapan_d', 'dap an d', 'đáp án d', 'option_d']),
            correct: findKey(['correct', 'dapan_dung', 'dap an dung', 'đáp án đúng', 'dapandung', 'đáp_án_đúng', 'answer']),
            explanation: findKey(['explanation', 'giaithich', 'giai_thich', 'diễn giải', 'dien giai', 'giải thích', 'giai thich']),
            loai: findKey(['loai', 'loại', 'type']),
            level: findKey(['level', 'cấp độ', 'cap do', 'muc do']),
            passage: findKey(['passage', 'doanvan', 'đoạn văn', 'doan_van', 'đoạn_văn', 'noidungdoanvan', 'noidung', 'reading', 'content']),
            made: findKey(['made', 'mã đề', 'ma_de', 'mã đề'])
        };
    }
    
    let values = Array.isArray(item) ? item : [];
    if (values.length === 0) return null;

    let v1 = String(values[1] || '').trim().toLowerCase();
    if (v1 === 'môn' || v1 === 'mon' || v1 === 'id') {
        return null;
    }

    const getCol = (idx) => {
        if (idx < values.length && values[idx] !== undefined && values[idx] !== null) {
            return String(values[idx]).trim();
        }
        return '';
    };

    return {
        mon: getCol(1),
        chuDe: getCol(2),
        question: getCol(3),
        a: getCol(4),
        b: getCol(5),
        c: getCol(6),
        d: getCol(7),
        correct: getCol(8),
        explanation: getCol(9),
        loai: getCol(10),
        level: getCol(11),
        passage: getCol(12),
        made: getCol(13)
    };
}

window.addEventListener('DOMContentLoaded', () => {
    const savedMa = localStorage.getItem('saved_maHS') || 'Huy';
    const input = document.getElementById('student-code');
    if (input) input.value = savedMa;
    
    const savedDarkMode = localStorage.getItem('app_dark_mode') === 'true';
    if (savedDarkMode) {
        AppState.darkMode = true;
        document.body.classList.add('dark-mode');
    }

    const startScreen = document.getElementById('start-screen');
    if (startScreen && !document.getElementById('dark-mode-toggle-btn')) {
        const targetContainer = startScreen.querySelector('.container') || startScreen;
        
        const darkModeBtn = document.createElement('button');
        darkModeBtn.id = 'dark-mode-toggle-btn';
        darkModeBtn.className = 'speaker-btn';
        darkModeBtn.style.width = '100%';
        darkModeBtn.style.marginBottom = '10px';
        darkModeBtn.style.justifyContent = 'center';
        darkModeBtn.style.background = AppState.darkMode ? '#444' : '#333';
        darkModeBtn.innerHTML = AppState.darkMode ? '☀️ Tắt Giao diện tối (Light Mode)' : '🌙 Bật Giao diện tối (Dark Mode)';
        darkModeBtn.onclick = window.toggleDarkMode;
        targetContainer.insertBefore(darkModeBtn, targetContainer.firstChild);
    }

    let topicCard = document.querySelector('#topic-container') ? document.querySelector('#topic-container').parentNode : null;
    if (topicCard && !document.getElementById('made-select-container')) {
        const uncheckAllDiv = document.createElement('div');
        uncheckAllDiv.style.marginBottom = '8px';
        uncheckAllDiv.innerHTML = `
            <button type="button" onclick="window.uncheckAllTopics()" style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85em; font-weight: bold;">Bỏ chọn tất cả</button>
        `;
        const topicContainerEl = document.querySelector('#topic-container');
        topicCard.insertBefore(uncheckAllDiv, topicContainerEl);

        const madeDiv = document.createElement('div');
        madeDiv.id = 'made-select-container';
        madeDiv.style.marginTop = '15px';
        madeDiv.innerHTML = `
            <label><b>Hoặc chọn Mã đề (MADE) để thi trực tiếp:</b></label>
            <select id="made-select" onchange="window.handleMadeChange()">
                <option value="">-- Chọn mã đề --</option>
            </select>
        `;
        topicCard.insertBefore(madeDiv, topicContainerEl.nextSibling);
    }

    if (startScreen && !document.getElementById('open-mistake-bank-btn')) {
        const mistakeBtn = document.createElement('button');
        mistakeBtn.id = 'open-mistake-bank-btn';
        mistakeBtn.className = 'mistake-bank-btn';
        mistakeBtn.onclick = window.openMistakeBank;
        
        const targetContainer = startScreen.querySelector('.container') || startScreen;
        targetContainer.appendChild(mistakeBtn);
        window.updateMistakeButtonText();
    }

    window.loadData();
});

window.toggleDarkMode = function() {
    AppState.darkMode = !AppState.darkMode;
    localStorage.setItem('app_dark_mode', AppState.darkMode);
    
    if (AppState.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    const btn = document.getElementById('dark-mode-toggle-btn');
    if (btn) {
        btn.style.background = AppState.darkMode ? '#444' : '#333';
        btn.innerHTML = AppState.darkMode ? '☀️ Tắt Giao diện tối (Light Mode)' : '🌙 Bật Giao diện tối (Dark Mode)';
    }
};

window.uncheckAllTopics = function() {
    const checkboxes = document.querySelectorAll('input[name="topic"]');
    checkboxes.forEach(cb => cb.checked = false);
    const madeSelect = document.getElementById('made-select');
    if (madeSelect) madeSelect.value = '';
};

window.updateMistakeButtonText = function() {
    const btn = document.getElementById('open-mistake-bank-btn');
    if (!btn) return;
    const maHS = document.getElementById('student-code') ? document.getElementById('student-code').value.trim() : 'Huy';
    const mistakes = window.getMistakeBank(maHS);
    btn.innerHTML = `📚 Ngân hàng câu sai (${mistakes.length} câu)`;
};

window.getMistakeBank = function(maHS) {
    try {
        const data = localStorage.getItem(`mistake_bank_${maHS}`);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

window.saveMistakeBank = function(maHS, mistakes) {
    try {
        localStorage.setItem(`mistake_bank_${maHS}`, JSON.stringify(mistakes));
        window.updateMistakeButtonText();
    } catch (e) {
        console.error("Lỗi lưu ngân hàng câu sai:", e);
    }
};

window.addQuestionsToMistakeBank = function(newWrongItems) {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS || !newWrongItems || newWrongItems.length === 0) return;
    let currentMistakes = window.getMistakeBank(maHS);

    newWrongItems.forEach(newItem => {
        const exists = currentMistakes.some(m => m.question === newItem.question && m.mon === newItem.mon);
        if (!exists) {
            currentMistakes.push(newItem);
        }
    });

    window.saveMistakeBank(maHS, currentMistakes);
};

window.openMistakeBank = function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    const mistakes = window.getMistakeBank(maHS);

    if (mistakes.length === 0) {
        return alert("Tuyệt vời! Ngân hàng câu sai của bạn đang trống.");
    }

    let startScreen = document.getElementById('start-screen');
    let quizScreen = document.getElementById('quiz-screen');
    if (startScreen) startScreen.style.display = 'none';
    if (quizScreen) quizScreen.style.display = 'block';

    const container = document.getElementById('quiz');
    if (!container) return;

    let html = `
        <div class="container">
            <h2>📚 Ngân hàng câu sai (${mistakes.length} câu)</h2>
            <p>Ôn tập lại các câu hỏi bạn đã làm sai trước đây để nắm vững kiến thức.</p>
            <button onclick="window.startMistakeQuiz()" style="padding: 12px 20px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; margin-bottom: 10px;">Làm bài ôn tập câu sai này</button>
            <button onclick="window.clearMistakeBank()" style="padding: 12px 20px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; margin-bottom: 15px;">Xóa sạch ngân hàng câu sai</button>
            <button onclick="location.reload()" style="padding: 12px 20px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;">Quay lại trang chủ</button>
        </div>
    `;
    container.innerHTML = html;
};

window.clearMistakeBank = function() {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ câu sai trong ngân hàng không?")) {
        const maHS = document.getElementById('student-code').value.trim();
        localStorage.removeItem(`mistake_bank_${maHS}`);
        window.updateMistakeButtonText();
        alert("Đã xóa sạch ngân hàng câu sai!");
        location.reload();
    }
};

window.startMistakeQuiz = function() {
    const maHS = document.getElementById('student-code').value.trim();
    const mistakes = window.getMistakeBank(maHS);
    if (mistakes.length === 0) return alert("Không có câu hỏi nào trong ngân hàng!");

    AppState.currentQuizData = mistakes.map(item => {
        let originalCorrectKey = getOriginalCorrectKey(item);
        let validKeys = ['a', 'b', 'c', 'd'].filter(k => item[k] !== '');
        let isDH = (item.made && item.made !== '');
        let shuffledKeys = isDH ? validKeys : [...validKeys].sort(() => 0.5 - Math.random());

        return {
            ...item,
            _shuffledKeys: shuffledKeys,
            _correctKey: originalCorrectKey
        };
    });

    AppState.isReadingComp = false;
    AppState.correctCount = 0; 
    AppState.wrongCount = 0;
    AppState.wrongQuestions = [];
    AppState.userAnswers = {};
    
    document.getElementById('quiz-screen').innerHTML = `
        <div class="container" style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div><b>Ôn tập Ngân hàng câu sai</b></div>
            <div>Đúng: <span id="count-correct">0</span> | Sai: <span id="count-wrong">0</span></div>
        </div>
        <div id="quiz"></div>
        <div style="text-align: center; margin-top: 20px;">
            <button onclick="window.submitQuiz()" style="padding: 12px 30px; background: #28a745; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Nộp bài</button>
        </div>
    `;
    window.renderQuiz();
};

window.handleSubjectChange = function() {
    const mon = document.getElementById('subject-select').value;
    const levelContainer = document.getElementById('level-container');
    if (levelContainer) {
        levelContainer.style.display = (mon === 'Tiếng Anh') ? 'block' : 'none';
    }
    window.updateTopicList();
    window.updateMadeOptions();
    window.updateLevelOptions();
    window.renderLeaderboard(mon);
};

window.updateMadeOptions = function() {
    const monSelect = document.getElementById('subject-select').value.trim();
    const madeSelect = document.getElementById('made-select');
    if (!madeSelect) return;

    const cleanMonSelect = cleanKey(monSelect);
    const mades = [...new Set(AppState.allQuizData
        .filter(i => (!monSelect || cleanKey(i.mon) === cleanMonSelect) && i.made && i.made !== '')
        .map(i => i.made))];

    madeSelect.innerHTML = `<option value="">-- Chọn mã đề --</option>` + mades.map(m => `<option value="${escapeHTML(m)}">${escapeHTML(m)}</option>`).join('');
};

window.handleMadeChange = function() {
    const madeSelect = document.getElementById('made-select');
    if (madeSelect && madeSelect.value) {
        const checkboxes = document.querySelectorAll('input[name="topic"]');
        checkboxes.forEach(cb => cb.checked = false);
    }
};

window.updateLevelOptions = function() {
    const mon = document.getElementById('subject-select').value;
    const levelSelect = document.getElementById('level-select');
    if (!levelSelect) return;
    if (mon !== 'Tiếng Anh') return;

    const rankings = AppState.rankings || [];

    const passedLevel1 = rankings.some(r => {
        const rMon = cleanKey(r.subject || r.mon || '');
        const rLvl = String(r.level || '').trim();
        const rScore = parseFloat(r.score || 0);
        return rMon === cleanKey('Tiếng Anh') && rLvl.includes('1') && rScore >= 8;
    });

    const passedLevel2 = rankings.some(r => {
        const rMon = cleanKey(r.subject || r.mon || '');
        const rLvl = String(r.level || '').trim();
        const rScore = parseFloat(r.score || 0);
        return rMon === cleanKey('Tiếng Anh') && rLvl.includes('2') && rScore >= 8;
    });

    for (let option of levelSelect.options) {
        const val = option.value.trim();
        if (val.includes('1') || val === '1') {
            option.disabled = false;
            option.style.opacity = '1';
        } else if (val.includes('2') || val === '2') {
            option.disabled = !passedLevel1;
            option.style.opacity = passedLevel1 ? '1' : '0.4';
        } else if (val.includes('3') || val === '3') {
            option.disabled = !passedLevel2;
            option.style.opacity = passedLevel2 ? '1' : '0.4';
        }
    }

    if (levelSelect.selectedOptions[0] && levelSelect.selectedOptions[0].disabled) {
        levelSelect.value = levelSelect.options[0].value;
    }
};

window.updateTopicList = function() {
    const monSelect = document.getElementById('subject-select').value.trim();
    const maHS = document.getElementById('student-code').value.trim();
    const container = document.getElementById('topic-container');
    if (!container || !monSelect) return;

    const cleanMonSelect = cleanKey(monSelect);

    const allowed = AppState.userPermissions
        .filter(p => String(p.maHS).trim() === maHS && cleanKey(p.mon) === cleanMonSelect)
        .map(p => String(p.chuDe).trim());

    const topics = [...new Set(AppState.allQuizData
        .filter(i => cleanKey(i.mon) === cleanMonSelect && i.question !== '')
        .map(i => i.chuDe))].filter(topic => topic !== "");

    if (topics.length === 0) {
        container.innerHTML = "Không tìm thấy chủ đề cho môn này.";
        return;
    }

    const hasSpecificPermissions = allowed.length > 0;

    container.innerHTML = topics.map(topic => {
        const isAllowed = !hasSpecificPermissions || allowed.includes(topic);
        return `<label style="display:block; margin:5px 0; opacity:${isAllowed ? '1' : '0.5'}">
            <input type="checkbox" name="topic" value="${escapeHTML(topic)}" ${isAllowed ? 'checked' : ''} onclick="document.getElementById('made-select').value=''"> ${escapeHTML(topic)}
        </label>`;
    }).join('');
};

window.loadData = function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    localStorage.setItem('saved_maHS', maHS);
    localStorage.removeItem('cache_quiz_data_' + maHS);

    window.updateMistakeButtonText();

    const container = document.getElementById('topic-container');
    if (container) container.innerHTML = "Đang tải dữ liệu chủ đề...";

    const API_URL = "https://script.google.com/macros/s/AKfycbwABOWdjRcG_rX9tVXjrLDsXFRMEbgUfn01QC6U5Z91qwdwq5askg7CrQHEDjf8np-H/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(maHS)}&callback=handleQuizData`;
    script.onerror = () => { 
        script.remove(); 
        if (container) container.innerHTML = "Lỗi kết nối tải dữ liệu.";
    };
    document.body.appendChild(script);
    script.onload = () => script.remove();
};

window.handleQuizData = function(data) {
    if (!data || data.error) {
        const container = document.getElementById('topic-container');
        if (container) container.innerHTML = "Không thể tải dữ liệu từ máy chủ.";
        return;
    }
    
    let lastMon = '';
    let lastChuDe = '';
    let lastLevel = '';
    let lastLoai = '';
    let lastPassage = '';
    let lastMade = '';

    AppState.allQuizData = (data.questions || [])
        .map(rawItem => {
            let item = normalizeItem(rawItem);
            if (!item) return null;

            if (item.mon) lastMon = item.mon;
            else item.mon = lastMon;

            if (item.chuDe) lastChuDe = item.chuDe;
            else item.chuDe = lastChuDe;

            if (item.level) lastLevel = item.level;
            else if (lastLevel) item.level = lastLevel;

            if (item.loai) lastLoai = item.loai;
            else if (lastLoai) item.loai = lastLoai;

            if (item.made) lastMade = item.made;
            else if (lastMade) item.made = lastMade;

            if (item.passage) {
                lastPassage = item.passage;
            } else if (cleanKey(item.mon) !== cleanKey('Tiếng Anh') || !item.passage) {
                lastPassage = ''; 
            } else if (lastPassage) {
                item.passage = lastPassage;
            }

            if (cleanKey(item.mon) !== cleanKey('Tiếng Anh')) {
                item.passage = '';
            }

            return item;
        })
        .filter(item => item && item.question !== '' && item.mon !== '');
        
    let lastMaHS = '';
    let lastPermMon = '';
    AppState.userPermissions = (data.permissions || []).map(p => {
        let maHS = String(p.maHS || p[0] || '').trim();
        let mon = String(p.mon || p[1] || '').trim();
        let chuDe = String(p.chuDe || p[2] || '').trim();
        
        if (maHS !== '') lastMaHS = maHS;
        else maHS = lastMaHS;
        
        if (mon !== '') lastPermMon = mon;
        else mon = lastPermMon;
        
        return { maHS, mon, chuDe };
    }).filter(p => p.chuDe !== '');

    AppState.rankings = data.rankings || [];

    const maHS = document.getElementById('student-code').value.trim();
    localStorage.setItem('cache_quiz_data_' + maHS, JSON.stringify(data));

    window.renderLeaderboard();
    window.updateTopicList();
    window.updateMadeOptions();
    window.updateLevelOptions();
};

window.renderLeaderboard = function(subjectFilter = null) {
    const list = document.getElementById('ranking-list');
    if (!list) return;
    list.className = "leaderboard-container";
    let data = AppState.rankings;
    if (subjectFilter && subjectFilter !== "-- Chọn môn --") {
        data = data.filter(item => cleanKey(item.subject || item.mon || '') === cleanKey(subjectFilter));
    }
    const qualifiedData = data.filter(item => item.score >= 8);
    if (qualifiedData.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 15px; color: #888;">Chưa có dữ liệu xếp hạng (>= 8).</div>`;
        return;
    }
    const top3 = qualifiedData.sort((a, b) => b.score - a.score).slice(0, 3);
    list.innerHTML = top3.map((item, index) => {
        let medal = index === 0 ? "🥇" : (index === 1 ? "🥈" : "🥉");
        let dateDisplay = item.date ? `<span class="time-text">Ngày: ${escapeHTML(item.date)}</span>` : "";
        let levelDisplay = item.level ? ` - <span style="font-size:0.85em; color:#555;">${escapeHTML(item.level)}</span>` : "";
        return `<div class="leaderboard-item"><div><span class="medal">${medal}</span> <b>${escapeHTML(item.name)}</b>${levelDisplay}${dateDisplay}</div><span class="score-badge">${item.score} đ</span></div>`;
    }).join('');
};

function getOriginalCorrectKey(item) {
    const raw = String(item.correct || '').trim();
    if (!raw) return '';
    const upper = raw.toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(upper)) {
        return upper.toLowerCase();
    }
    for (let key of ['a', 'b', 'c', 'd']) {
        if (item[key] && String(item[key]).trim().toLowerCase() === raw.toLowerCase()) {
            return key;
        }
    }
    return raw; 
}

window.startQuiz = function() {
    const mon = document.getElementById('subject-select').value;
    const levelSelected = document.getElementById('level-select').value;
    const selectedMade = document.getElementById('made-select') ? document.getElementById('made-select').value.trim() : '';
    
    let rawSelectedQuestions = [];
    let isReadingComp = false;

    if (selectedMade !== '') {
        rawSelectedQuestions = AppState.allQuizData.filter(i => {
            const isSameSubject = (cleanKey(i.mon) === cleanKey(mon));
            const isMadeMatch = String(i.made || '').trim().toLowerCase() === selectedMade.toLowerCase();
            return isSameSubject && isMadeMatch && i.question !== '';
        });
        isReadingComp = true; 
    } else {
        const selectedTopics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
        if (!selectedTopics.length) return alert("Vui lòng chọn chủ đề hoặc chọn Mã đề!");
        
        let normalTopics = selectedTopics;

        let normalQuestions = [];
        if (normalTopics.length > 0) {
            let filteredNormal = AppState.allQuizData.filter(i => {
                const isSameSubject = (cleanKey(i.mon) === cleanKey(mon));
                const isTopicMatch = normalTopics.includes(i.chuDe);
                const isLevelMatch = (cleanKey(mon) !== cleanKey('Tiếng Anh')) || (String(i.level).trim() === String(levelSelected).trim());
                return isSameSubject && isTopicMatch && isLevelMatch && i.question !== '';
            });
            normalQuestions = filteredNormal.sort(() => 0.5 - Math.random()).slice(0, 20);
        }

        rawSelectedQuestions = normalQuestions;
        isReadingComp = false;
    }

    if (rawSelectedQuestions.length === 0) return alert("Không tìm thấy câu hỏi phù hợp cho lựa chọn này!");
    
    AppState.currentQuizData = rawSelectedQuestions.map(item => {
        let originalCorrectKey = getOriginalCorrectKey(item);
        let validKeys = ['a', 'b', 'c', 'd'].filter(k => item[k] !== '');
        let isDH = (item.made && item.made !== '');
        let shuffledKeys = isDH ? validKeys : [...validKeys].sort(() => 0.5 - Math.random());

        return {
            ...item,
            _shuffledKeys: shuffledKeys,
            _correctKey: originalCorrectKey
        };
    });

    AppState.isReadingComp = isReadingComp;
    AppState.correctCount = 0; 
    AppState.wrongCount = 0;
    AppState.wrongQuestions = [];
    AppState.userAnswers = {};
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    window.renderQuiz();
    
    let totalSeconds = 10 * 60; 
    if (selectedMade !== '') {
        totalSeconds = 45 * 60; 
    } else if (cleanKey(mon) === cleanKey('Toán')) {
        totalSeconds = 15 * 60; 
    }
    window.startTimerTotal(totalSeconds);
};

window.renderQuiz = function() {
    const container = document.getElementById('quiz');
    if (!container) return;

    let contentHtml = '';
    let currentChuDe = '';

    AppState.currentQuizData.forEach((item, index) => {
        let isEnglish = cleanKey(item.mon) === cleanKey('Tiếng Anh');
        let itemChuDe = item.chuDe || '';

        if (isEnglish && item.passage && item.passage.trim() !== '' && itemChuDe !== currentChuDe) {
            currentChuDe = itemChuDe;
            contentHtml += `
                <div class="passage-box">
                    <div class="passage-tag">${escapeHTML(itemChuDe)}</div>
                    <div>
                        <button class="speaker-btn" data-question="${escapeHTML(item.passage)}" onclick="window.handleSpeak(this)">🔊 Nghe đoạn văn</button>
                    </div>
                    <div style="white-space: pre-line; margin-top: 10px;">${escapeHTML(item.passage)}</div>
                </div>
            `;
        } else if (!item.made) {
            currentChuDe = '';
        }

        let loaiVal = (item.loai || '').toLowerCase();
        let hasNoOptions = (!item.a || item.a.trim() === '') &&
                            (!item.b || item.b.trim() === '') &&
                            (!item.c || item.c.trim() === '') &&
                            (!item.d || item.d.trim() === '');
        let isVoca = loaiVal.includes('voca') || loaiVal.includes('dien') || loaiVal.includes('từ') || hasNoOptions;
        
        let questionText = item.question;
        let explanationText = item.explanation || 'Không có giải thích.';

        let speakerBtn = '';
        let bodyHtml = '';

        if (isEnglish) {
            let chuDeLower = String(item.chuDe || '').toLowerCase();
            let loaiLower = String(item.loai || '').toLowerCase();
            
            if (isVoca) {
                const hasVietnameseChars = /[àáảãạăắằẳẵặâấầẩẫệèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(questionText);
                const isVietAnh = chuDeLower.includes('việt anh') || chuDeLower.includes('viet anh') || 
                                    loaiLower.includes('việt anh') || loaiLower.includes('viet anh') || 
                                    hasVietnameseChars;
                const isAnhViet = chuDeLower.includes('anh việt') || chuDeLower.includes('anh viet') || 
                                    loaiLower.includes('anh việt') || loaiLower.includes('anh viet') || 
                                    (!hasVietnameseChars && !isVietAnh);

                let placeholderText = "Nhập đáp án tiếng Anh...";
                let speakTextContent = questionText;
                let speakerLabel = '🔊 Nghe từ tiếng Anh';

                if (isVietAnh) {
                    placeholderText = "Nhập đáp án tiếng Anh...";
                    speakerLabel = '🔊 Nghe từ tiếng Anh';
                    speakTextContent = item._correctKey || questionText;
                } else if (isAnhViet) {
                    placeholderText = "Nhập đáp án tiếng Việt...";
                    speakerLabel = '🔊 Nghe từ tiếng Anh';
                    speakTextContent = questionText;
                }

                speakerBtn = `<button class="speaker-btn" data-question="${escapeHTML(speakTextContent)}" onclick="window.handleSpeak(this)">${speakerLabel}</button>`;

                bodyHtml = `
                    <div style="margin-top: 10px;">
                        <input type="text" id="voca-input-${index}" placeholder="${placeholderText}" oninput="window.recordVocaAnswer(${index}, this.value)">
                        <button type="button" onclick="window.checkVocaAnswer(${index})" style="margin-top: 8px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Kiểm tra</button>
                    </div>
                `;
            } else {
                speakerBtn = `<button class="speaker-btn" data-question="${escapeHTML(questionText)}" onclick="window.handleSpeak(this)">🔊 Nghe câu hỏi</button>`;
                let keysToRender = item._shuffledKeys.length > 0 ? item._shuffledKeys : ['a', 'b', 'c', 'd'].filter(k => item[k]);
                bodyHtml = keysToRender.map((optKey, displayIndex) => {
                    if (!item[optKey]) return '';
                    let displayLetter = String.fromCharCode(65 + displayIndex);
                    return `<div class="option-box" data-orig-key="${optKey}" onclick="window.checkAnswer(this, '${optKey}', ${index})">
                        <b>${displayLetter}.</b> ${escapeHTML(item[optKey])}
                    </div>`;
                }).join('');
            }
        } else {
            let keysToRender = item._shuffledKeys.length > 0 ? item._shuffledKeys : ['a', 'b', 'c', 'd'].filter(k => item[k]);
            bodyHtml = keysToRender.map((optKey, displayIndex) => {
                if (!item[optKey]) return '';
                let displayLetter = String.fromCharCode(65 + displayIndex);
                return `<div class="option-box" data-orig-key="${optKey}" onclick="window.checkAnswer(this, '${optKey}', ${index})">
                    <b>${displayLetter}.</b> ${escapeHTML(item[optKey])}
                </div>`;
            }).join('');
        }

        contentHtml += `<div class="quiz-card" id="q-card-${index}">
            <p><b>Câu ${index + 1}:</b> ${escapeHTML(questionText)}</p>
            ${speakerBtn}
            ${bodyHtml}
            <div class="explanation-box" id="exp-${index}"><b>Giải thích:</b> ${escapeHTML(explanationText)}</div>
        </div>`;
    });

    container.innerHTML = contentHtml;
};

window.recordVocaAnswer = function(index, value) {
    AppState.userAnswers[index] = value;
};

window.checkAnswer = function(element, chosenKey, index) {
    const card = document.getElementById(`q-card-${index}`);
    if (!card) return;
    
    if (card.dataset.answered === 'true') return;
    card.dataset.answered = 'true';

    const item = AppState.currentQuizData[index];
    const correctKey = item._correctKey;

    AppState.userAnswers[index] = chosenKey;

    const options = card.querySelectorAll('.option-box');
    options.forEach(opt => {
        opt.style.pointerEvents = 'none';
        const origKey = opt.getAttribute('data-orig-key');
        if (origKey === correctKey) {
            opt.style.background = '#d4edda';
            opt.style.borderColor = '#28a745';
            opt.style.color = '#155724';
        } else if (origKey === chosenKey) {
            opt.style.background = '#f8d7da';
            opt.style.borderColor = '#dc3545';
            opt.style.color = '#721c24';
        }
    });

    const expBox = document.getElementById(`exp-${index}`);
    if (expBox) expBox.style.display = 'block';

    if (chosenKey === correctKey) {
        AppState.correctCount++;
    } else {
        AppState.wrongCount++;
        AppState.wrongQuestions.push(item);
    }

    const cEl = document.getElementById('count-correct');
    const wEl = document.getElementById('count-wrong');
    if (cEl) cEl.innerText = AppState.correctCount;
    if (wEl) wEl.innerText = AppState.wrongCount;
};

window.checkVocaAnswer = function(index) {
    const card = document.getElementById(`q-card-${index}`);
    if (!card || card.dataset.answered === 'true') return;

    const input = document.getElementById(`voca-input-${index}`);
    if (!input) return;

    const userVal = input.value.trim();
    AppState.userAnswers[index] = userVal;

    const item = AppState.currentQuizData[index];
    const correctVal = item.correct || item._correctKey || '';

    card.dataset.answered = 'true';
    input.disabled = true;

    const expBox = document.getElementById(`exp-${index}`);
    if (expBox) expBox.style.display = 'block';

    const isCorrect = cleanKey(userVal) === cleanKey(correctVal);
    if (isCorrect) {
        AppState.correctCount++;
        input.style.borderColor = '#28a745';
        input.style.background = '#d4edda';
    } else {
        AppState.wrongCount++;
        AppState.wrongQuestions.push(item);
        input.style.borderColor = '#dc3545';
        input.style.background = '#f8d7da';
    }

    const cEl = document.getElementById('count-correct');
    const wEl = document.getElementById('count-wrong');
    if (cEl) cEl.innerText = AppState.correctCount;
    if (wEl) wEl.innerText = AppState.wrongCount;
};

window.startTimerTotal = function(seconds) {
    let timeLeft = seconds;
    const timerContainer = document.createElement('div');
    timerContainer.id = 'timer-display';
    timerContainer.className = 'container';
    timerContainer.style.textAlign = 'center';
    timerContainer.style.fontWeight = 'bold';
    timerContainer.style.marginBottom = '15px';
    timerContainer.style.fontSize = '1.2em';

    const quizScreen = document.getElementById('quiz-screen');
    if (quizScreen) quizScreen.insertBefore(timerContainer, quizScreen.firstChild);

    if (AppState.timerInterval) clearInterval(AppState.timerInterval);

    AppState.timerInterval = setInterval(() => {
        let m = Math.floor(timeLeft / 60);
        let s = timeLeft % 60;
        timerContainer.innerHTML = `⏱️ Thời gian còn lại: ${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        
        if (timeLeft <= 0) {
            clearInterval(AppState.timerInterval);
            alert("Hết thời gian làm bài!");
            window.submitQuiz();
        }
        timeLeft--;
    }, 1000);
};

window.submitQuiz = function() {
    if (AppState.timerInterval) clearInterval(AppState.timerInterval);

    AppState.currentQuizData.forEach((item, index) => {
        const card = document.getElementById(`q-card-${index}`);
        if (card && card.dataset.answered !== 'true') {
            card.dataset.answered = 'true';
            AppState.wrongCount++;
            AppState.wrongQuestions.push(item);
        }
    });

    const total = AppState.currentQuizData.length;
    const score = total > 0 ? ((AppState.correctCount / total) * 10).toFixed(2) : 0;

    const maHS = document.getElementById('student-code').value.trim();
    const mon = document.getElementById('subject-select').value;
    const levelSelected = document.getElementById('level-select') ? document.getElementById('level-select').value : '';

    if (AppState.wrongQuestions.length > 0) {
        window.addQuestionsToMistakeBank(AppState.wrongQuestions);
    }

    const quizScreen = document.getElementById('quiz-screen');
    if (quizScreen) {
        quizScreen.innerHTML = `
            <div class="container" style="text-align: center;">
                <h2>🎉 Kết quả bài làm</h2>
                <p style="font-size: 1.2em; margin: 15px 0;">Điểm số của bạn: <b style="color: #28a745; font-size: 1.5em;">${score} / 10</b></p>
                <p>Số câu đúng: <b>${AppState.correctCount}</b> / ${total}</p>
                <p>Số câu sai: <b>${AppState.wrongCount}</b> / ${total}</p>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="window.renderDetailedReview()" style="flex: 1; padding: 12px; background: #17a2b8; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">🔍 Xem lại chi tiết</button>
                    <button onclick="location.reload()" style="flex: 1; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Về trang chủ</button>
                </div>
            </div>
            <div id="detailed-review-container" style="margin-top: 20px;"></div>
        `;
    }
};

window.renderDetailedReview = function() {
    const reviewContainer = document.getElementById('detailed-review-container');
    if (!reviewContainer) return;

    let html = `<h3 style="text-align: center; margin-bottom: 20px;">📋 Chi tiết bài làm</h3>`;

    AppState.currentQuizData.forEach((item, index) => {
        let userAns = AppState.userAnswers[index] || "Chưa trả lời";
        let correctAns = item._correctKey || item.correct || '';
        
        let isCorrect = cleanKey(userAns) === cleanKey(correctAns);
        let statusBadge = isCorrect ? 
            `<span style="color: #28a745; font-weight: bold;">✔ Đúng</span>` : 
            `<span style="color: #dc3545; font-weight: bold;">✘ Sai</span>`;

        html += `
            <div class="quiz-card" style="border-color: ${isCorrect ? '#28a745' : '#dc3545'};">
                <p><b>Câu ${index + 1}:</b> ${escapeHTML(item.question)}</p>
                <p>Đáp án bạn chọn: <b>${escapeHTML(userAns.toUpperCase())}</b></p>
                <p>Đáp án đúng: <b style="color: #28a745;">${escapeHTML(correctAns.toUpperCase())}</b></p>
                <p>Trạng thái: ${statusBadge}</p>
                <div class="explanation-box" style="display: block; margin-top: 10px;">
                    <b>Giải thích:</b> ${escapeHTML(item.explanation || 'Không có giải thích.')}
                </div>
            </div>
        `;
    });

    reviewContainer.innerHTML = html;
    window.scrollTo({ top: reviewContainer.offsetTop, behavior: 'smooth' });
};

window.handleSpeak = function(btn) {
    const text = btn.getAttribute('data-question');
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
};
