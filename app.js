let allQuestions = [];
let currentIdx = 0;
let userStats = JSON.parse(localStorage.getItem('pl300_stats')) || { history: [], weakTopics: [] };

fetch('questions.json')
    .then(res => res.json())
    .then(data => {
        allQuestions = data.questions;
        viewController('dashboard');
    });

function viewController(view) {
    const container = document.getElementById('main-content');
    if (view === 'dashboard') {
        container.innerHTML = `<h2>Domain Mastery</h2>${renderStats()}`;
    }
}

function renderStats() {
    const domains = [...new Set(allQuestions.map(q => q.domain))];
    return domains.map(d => {
        const dQuestions = userStats.history.filter(h => h.domain === d);
        const score = dQuestions.length ? Math.round((dQuestions.filter(q => q.isCorrect).length / dQuestions.length) * 100) : 0;
        return `<p><strong>${d}:</strong> ${score}%</p>`;
    }).join('');
}

function initQuiz() {
    currentIdx = 0;
    showQuestion();
}

function showQuestion() {
    const q = allQuestions[currentIdx];
    const container = document.getElementById('main-content');
    container.innerHTML = `<h3>${q.question}</h3>` + 
        q.options.map(opt => `<button class="quiz-option" onclick="handleAnswer('${opt}', '${q.answer}', '${q.rationale}', ${q.id}, '${q.domain}', '${q.topic}')">${opt}</button>`).join('');
}

window.handleAnswer = (picked, correct, rationale, id, domain, topic) => {
    const isCorrect = picked === correct;
    userStats.history.push({ id, isCorrect, domain, topic });
    localStorage.setItem('pl300_stats', JSON.stringify(userStats));

    const container = document.getElementById('main-content');
    const feedbackClass = isCorrect ? 'correct-box' : 'incorrect-box';
    const icon = isCorrect ? '✅ Correct!' : '❌ Incorrect.';
    
    container.innerHTML = `
        <div class="feedback-box ${feedbackClass}">
            <p><strong>${icon}</strong></p>
            <p>${rationale}</p>
        </div>
        <button onclick="nextQuestion()">Next Question</button>
    `;
};

window.nextQuestion = () => {
    currentIdx++;
    if (currentIdx < allQuestions.length) {
        showQuestion();
    } else {
        viewController('dashboard');
    }
};
