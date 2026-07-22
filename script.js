// Khởi tạo AppState theo cấu trúc hiện tại của bạn
const AppState = {
    allQuizData: [],
    userPermissions: [],
    rankings: [],
    currentQuizData: [],
    timerInterval: null,
    correctCount: 0,
    wrongCount: 0,
    wrongQuestions: [],
    isReadingComp: false
};

let userAnswers = {};
let timeLeft = 0;

// 1. Tiêm CSS động nếu cần thiết (bao gồm cả vị trí Dark Mode ở góc trên bên phải khung chính)
(function injectStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .container { background-color: #bbe9f0; padding: 25px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 650px; margin: auto; position: relative; }
        .quiz-card { background: #ffffff; border: 2px solid #540606; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        .option-box { background: #f8f9fa; border: 1px solid #540606; border-radius: 8px; padding: 12px 15px; margin: 8px 0; cursor: pointer; transition: all 0.2s; }
        .option-box:hover { background: #e9ecef; border-color: #adb5bd; }
        .explanation-box { margin-top: 15px; padding: 12px; background: #fff3cd; border: 1px solid #ffeeba; border-radius: 8px; font-size: 0.95em; color: #856404; }
        
        /* Vị trí Dark Mode Toggle ở góc trên bên phải khung chính */
        #dark-mode-toggle {
            position: absolute;
            top: 20px;
            right: 20px;
            background: #343a40;
            color: #fff;
            border: none;
            padding: 6px 12px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.85em;
        }

        /* Dark Mode Styles */
        body.dark-mode { background-color: #121212; color: #e0e0e0; }
        body.dark-mode .container { background-color: #1e1e1e; box-shadow: 0 4px 15px rgba(255,255,255,0.05); }
        body.dark-mode .quiz-card { background: #2d2d2d; border-color: #ff6b6b; color: #fff; }
        body.dark-mode .option-box { background: #383838; border-color: #555; color: #fff; }
        body.dark-mode .option-box:hover { background: #444; }
    `;
    document.head.appendChild(style);
    
    // Tự động thêm nút Dark Mode vào container chính nếu chưa có
    setTimeout(() => {
        const mainContainer = document.getElementById('start-screen');
        if (mainContainer && !document.getElementById('dark-mode-toggle')) {
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'dark-mode-toggle';
            toggleBtn.textContent = '🌙 Dark Mode';
            toggleBtn.onclick = toggleDarkMode;
            mainContainer.appendChild(toggleBtn);
        }
    }, 100);
})();

// Xử lý bật/tắt Dark Mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('dark-mode-toggle');
    if (document.body.classList.contains('dark-mode')) {
        btn.textContent = '☀️ Light Mode';
    } else {
        btn.textContent = '🌙 Dark Mode';
    }
}

// 2. Tải dữ liệu mẫu / API
window.loadData = function() {
    const studentCode = document.getElementById('student-code').value.trim();
    if (!studentCode) {
        alert("Vui lòng nhập mã học sinh!");
        return;
    }

    // Dữ liệu mẫu giả lập tích hợp sẵn
    AppState.allQuizData = [
        {
            id: 1,
            subject: "Toán",
            topic: "Đại số cơ bản",
            question: "Kết quả của phép tính: 5 + 3 * 2 là bao nhiêu?",
            options: ["16", "11", "10", "13"],
            correct: 1,
            explanation: "Thực hiện phép nhân trước: 3 * 2 = 6, sau đó cộng 5: 5 + 6 = 11."
        },
        {
            id: 2,
            subject: "Toán",
            topic: "Hình học phẳng",
            question: "Diện tích hình chữ nhật có chiều dài 5cm và chiều rộng 3cm là?",
            options: ["15 cm²", "16 cm²", "8 cm²", "30 cm²"],
            correct: 0,
            explanation: "Diện tích hình chữ nhật bằng dài nhân rộng: 5 * 3 = 15 cm²."
        },
        {
            id: 3,
            subject: "Anh",
            topic: "Ngữ pháp",
            question: "Choose the correct form: She _____ to school every day.",
            options: ["go", "goes", "gone", "going"],
            correct: 1,
            explanation: "Chủ ngữ ngôi thứ 3 số ít ('She') ở thì hiện tại đơn động từ phải thêm 'es'."
        }
    ];

    const subjectSelect = document.getElementById('subject-select');
    subjectSelect.innerHTML = '<option value="">-- Chọn môn --</option>';
    
    const subjects = [...new Set(AppState.allQuizData.map(q => q.subject))];
    subjects.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.textContent = sub;
        subjectSelect.appendChild(opt);
    });

    document.getElementById('level-container').style.display = 'block';
    document.getElementById('made-container').style.display = 'block';
    updateTopics();
    loadLeaderboard();
    
    alert(`Đã tải dữ liệu thành công cho học sinh: ${studentCode}`);
};

// Cập nhật danh sách chủ đề dựa trên môn học được chọn
window.handleSubjectChange = function() {
    updateTopics();
};

function updateTopics() {
    const topicContainer = document.getElementById('topic-container');
    topicContainer.innerHTML = '';
    const subject = document.getElementById('subject-select').value;
    
    let filteredQuestions = subject ? AppState.allQuizData.filter(q => q.subject === subject) : AppState.allQuizData;
    let topics = [...new Set(filteredQuestions.map(q => q.topic))];
    
    if (topics.length === 0) {
        topics = ["Đại số cơ bản", "Hình học phẳng", "Ngữ pháp"];
    }

    topics.forEach(topic => {
        const div = document.createElement('div');
        div.style.margin = "5px 0";
        div.innerHTML = `
            <label>
                <input type="checkbox" class="topic-checkbox" value="${topic}" checked> ${topic}
            </label>
        `;
        topicContainer.appendChild(div);
    });
}

let allTopicsSelected = true;
window.toggleAllTopics = function() {
    const checkboxes = document.querySelectorAll('.topic-checkbox');
    allTopicsSelected = !allTopicsSelected;
    checkboxes.forEach(cb => cb.checked = allTopicsSelected);
};

// 3. Bắt đầu làm bài kiểm tra
window.startQuiz = function(isRetryingWrong = false) {
    if (!isRetryingWrong) {
        const subject = document.getElementById('subject-select').value;
        if (!subject) {
            alert("Vui lòng chọn môn học trước khi bắt đầu!");
            return;
        }

        // Lọc câu hỏi theo môn và chủ đề được chọn
        const selectedTopics = Array.from(document.querySelectorAll('.topic-checkbox:checked'))
                                    .map(cb => cb.value);

        AppState.currentQuizData = AppState.allQuizData.filter(q => 
            q.subject === subject && selectedTopics.includes(q.topic)
        );
    } else {
        // Nếu chọn làm lại câu sai, nạp danh sách câu sai từ AppState
        AppState.currentQuizData = [...AppState.wrongQuestions];
    }

    if (AppState.currentQuizData.length === 0) {
        alert("Không có câu hỏi nào để hiển thị!");
        return;
    }

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    
    // Ẩn màn hình kết quả/review cũ nếu có
    const reviewScreen = document.getElementById('review-screen');
    if (reviewScreen) reviewScreen.remove();

    renderQuiz();
    
    timeLeft = AppState.currentQuizData.length * 60; // 1 phút mỗi câu
    startTimer();
};

function renderQuiz() {
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = '';
    userAnswers = {};
    
    AppState.currentQuizData.forEach((q, index) => {
        const card = document.createElement('div');
        card.className = 'quiz-card';
        
        let optionsHtml = '';
        q.options.forEach((opt, optIndex) => {
            optionsHtml += `
                <div class="option-box" onclick="selectOption(${index}, ${optIndex}, this)">
                    ${String.fromCharCode(65 + optIndex)}. ${opt}
                </div>
            `;
        });
        
        card.innerHTML = `
            <p><strong>Câu ${index + 1} (${q.topic}):</strong> ${q.question}</p>
            ${optionsHtml}
        `;
        quizDiv.appendChild(card);
    });
}

window.selectOption = function(questionIndex, optionIndex, element) {
    const parentCard = element.closest('.quiz-card');
    parentCard.querySelectorAll('.option-box').forEach(box => {
        box.style.background = document.body.classList.contains('dark-mode') ? '#383838' : '#f8f9fa';
        box.style.borderColor = document.body.classList.contains('dark-mode') ? '#555' : '#540606';
    });
    
    element.style.background = '#d1e7dd';
    element.style.borderColor = '#0f5132';
    
    userAnswers[questionIndex] = optionIndex;
    updateScoreLive();
};

function updateScoreLive() {
    let correct = 0;
    let wrong = 0;
    
    Object.keys(userAnswers).forEach(qIndex => {
        if (userAnswers[qIndex] === AppState.currentQuizData[qIndex].correct) {
            correct++;
        } else {
            wrong++;
        }
    });
    
    document.getElementById('count-correct').textContent = correct;
    document.getElementById('count-wrong').textContent = wrong;
}

function startTimer() {
    clearInterval(AppState.timerInterval);
    const timerDisplay = document.getElementById('timer-display');
    
    AppState.timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(AppState.timerInterval);
            alert("Hết thời gian làm bài!");
            window.submitQuiz();
        }
        timeLeft--;
    }, 1000);
}

// 4. Nộp bài kiểm tra & Cập nhật danh sách câu sai
window.submitQuiz = function() {
    clearInterval(AppState.timerInterval);
    
    AppState.correctCount = 0;
    AppState.wrongCount = 0;
    AppState.wrongQuestions = []; // Reset danh sách câu sai
    
    AppState.currentQuizData.forEach((q, index) => {
        const userAns = userAnswers[index];
        if (userAns === q.correct) {
            AppState.correctCount++;
        } else {
            AppState.wrongCount++;
            AppState.wrongQuestions.push({
                ...q,
                userAnswer: userAns !== undefined ? userAns : null
            });
        }
    });
    
    const score = (AppState.correctCount * 10) / AppState.currentQuizData.length;
    
    // Ẩn màn hình quiz, hiển thị giao diện kết quả kèm 2 chức năng: Xem chi tiết & Làm lại câu sai
    document.getElementById('quiz-screen').style.display = 'none';
    showCompletionScreen(score);
    
    saveToLeaderboard(AppState.correctCount, score);
    loadLeaderboard();
};

// 5. Giao diện kết quả hoàn chỉnh tích hợp tính năng "Xem chi tiết" & "Làm lại câu sai"
function showCompletionScreen(score) {
    let existingScreen = document.getElementById('review-screen');
    if (existingScreen) existingScreen.remove();

    const screen = document.createElement('div');
    screen.id = 'review-screen';
    screen.className = 'container';
    screen.style.marginTop = '20px';

    let html = `
        <h2 style="color: #28a745; text-align: center;">🎉 Kết Quả Bài Làm</h2>
        <p><strong>Điểm số:</strong> <span style="font-size: 1.5em; color: #dc3545;">${score.toFixed(2)} / 10</span></p>
        <p>✅ Số câu đúng: <strong>${AppState.correctCount}</strong> | ❌ Số câu sai/chưa làm: <strong>${AppState.wrongCount}</strong></p>
        
        <div style="display: flex; gap: 10px; margin: 20px 0;">
            <button type="button" onclick="window.viewDetailedReview()" style="flex: 1; padding: 12px; background: #17a2b8; color: white; border: none; border-radius: 6px; cursor: pointer;">🔍 Xem lại chi tiết bài làm</button>
            ${AppState.wrongQuestions.length > 0 ? `<button type="button" onclick="window.startQuiz(true)" style="flex: 1; padding: 12px; background: #ffc107; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">🔄 Làm lại câu sai (${AppState.wrongQuestions.length})</button>` : ''}
        </div>

        <button type="button" onclick="window.returnHome()" style="width: 100%; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">🏠 Về màn hình chính</button>
        
        <div id="detailed-review-container" style="margin-top: 20px;"></div>
    `;

    screen.innerHTML = html;
    document.body.appendChild(screen);
}

// 6. Tính năng: Xem lại chi tiết bài làm
window.viewDetailedReview = function() {
    const container = document.getElementById('detailed-review-container');
    let reviewHtml = '<h3 style="border-bottom: 2px solid #ccc; padding-bottom: 5px;">Chi Tiết Từng Câu Hỏi:</h3>';

    AppState.currentQuizData.forEach((q, index) => {
        const userAns = userAnswers[index];
        const isCorrect = userAns === q.correct;
        
        let optionsHtml = '';
        q.options.forEach((opt, optIndex) => {
            let style = "padding: 8px; margin: 4px 0; border-radius: 5px; border: 1px solid #ccc;";
            if (optIndex === q.correct) {
                style += " background-color: #d1e7dd; border-color: #0f5132; font-weight: bold;"; // Đáp án đúng
            } else if (optIndex === userAns && !isCorrect) {
                style += " background-color: #f8d7da; border-color: #842029; text-decoration: line-through;"; // Người dùng chọn sai
            }
            optionsHtml += `<div style="${style}">${String.fromCharCode(65 + optIndex)}. ${opt}</div>`;
        });

        reviewHtml += `
            <div class="quiz-card" style="border-color: ${isCorrect ? '#28a745' : '#dc3545'};">
                <p><strong>Câu ${index + 1}:</strong> ${q.question} <span style="float: right; color: ${isCorrect ? '#28a745' : '#dc3545'};">${isCorrect ? '✔ Đúng' : '✘ Sai'}</span></p>
                ${optionsHtml}
                ${q.explanation ? `<div class="explanation-box">💡 <strong>Giải thích:</strong> ${q.explanation}</div>` : ''}
            </div>
        `;
    });

    container.innerHTML = reviewHtml;
};

window.returnHome = function() {
    const reviewScreen = document.getElementById('review-screen');
    if (reviewScreen) reviewScreen.remove();
    document.getElementById('start-screen').style.display = 'block';
};

// Lưu kết quả vào bảng xếp hạng LocalStorage
function saveToLeaderboard(correct, score) {
    const studentCode = document.getElementById('student-code').value.trim() || "Học sinh";
    let leaderboard = JSON.parse(localStorage.getItem('quiz_leaderboard')) || [];
    
    leaderboard.push({
        name: studentCode,
        correct: correct,
        score: score,
        time: new Date().toLocaleTimeString()
    });
    
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5);
    localStorage.setItem('quiz_leaderboard', JSON.stringify(leaderboard));
}

function loadLeaderboard() {
    const rankingList = document.getElementById('ranking-list');
    if (!rankingList) return;
    
    let leaderboard = JSON.parse(localStorage.getItem('quiz_leaderboard')) || [];
    if (leaderboard.length === 0) {
        rankingList.innerHTML = '<p style="color: #666;">Chưa có dữ liệu xếp hạng.</p>';
        return;
    }
    
    let html = '<ol style="padding-left: 20px; margin: 0;">';
    leaderboard.forEach(item => {
        html += `<li><strong>${item.name}</strong> - Điểm: ${item.score.toFixed(2)} (Đúng: ${item.correct})</li>`;
    });
    html += '</ol>';
    rankingList.innerHTML = html;
}
