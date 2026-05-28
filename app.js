const state = {
    questions: [],
    history: JSON.parse(localStorage.getItem('pl300_history')) || { scores: {}, struggled: [] },
    currentView: 'dashboard'
};

// Load Data
async function init() {
    const res = await fetch('questions.json');
    const data = await res.json();
    state.questions = data.questions;
    router.navigate('dashboard');
}

const router = {
    navigate(view) {
        state.currentView = view;
        const container = document.getElementById('view-container');
        container.innerHTML = ''; 

        if (view === 'dashboard') renderDashboard(container);
        if (view === 'quiz') renderQuiz(container);
        if (view === 'flashcards') renderFlashcards(container);
    }
};

function renderDashboard(container) {
    const domains = [...new Set(state.questions.map(q => q.domain))];
    let html = `<h2>Readiness Analytics</h2><div class="stats-grid">`;
    
    domains.forEach(domain => {
        const stats = state.history.scores[domain] || { correct: 0, total: 0 };
        const percent = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
        const status = percent >= 80 ? '✅ Ready' : '❌ Study More';
        html += `<div class="card"><h3>${domain}</h3><p>${percent}% Accuracy</p><span>${status}</span></div>`;
    });

    html += `</div><h3>Weak Areas to Review: ${state.history.struggled.length} Topics</h3>`;
    container.innerHTML = html;
}

function renderQuiz(container) {
    // Basic Quiz Logic
    const q = state.questions[Math.floor(Math.random() * state.questions.length)];
    container.innerHTML = `
        <div class="quiz-card">
            <small>${q.domain} > ${q.topic}</small>
            <p>${q.question}</p>
            ${q.options.map(opt => `<button onclick="checkAnswer(${q.id}, '${opt}')">${opt}</button>`).join('')}
        </div>
    `;
}

window.checkAnswer = (qId, choice) => {
    const q = state.questions.find(item => item.id === qId);
    const isCorrect = q.answer === choice;
    
    // Update State
    if (!state.history.scores[q.domain]) state.history.scores[q.domain] = { correct: 0, total: 0 };
    state.history.scores[q.domain].total++;
    if (isCorrect) {
        state.history.scores[q.domain].correct++;
    } else {
        if (!state.history.struggled.includes(q.topic)) state.history.struggled.push(q.topic);
    }

    localStorage.setItem('pl300_history', JSON.stringify(state.history));
    alert(isCorrect ? "Correct!" : `Wrong. Correct was: ${q.answer}\n\nRationale: ${q.rationale}`);
    router.navigate('quiz');
};

function renderFlashcards(container) {
    if (state.history.struggled.length === 0) {
        container.innerHTML = "<p>No weak areas identified yet. Take a quiz first!</p>";
        return;
    }
    const topic = state.history.struggled[0];
    container.innerHTML = `
        <div class="flashcard" onclick="this.classList.toggle('flipped')">
            <div class="front">What should I remember about: <strong>${topic}</strong>?</div>
            <div class="back">Review the documentation for ${topic} and practice relevant labs.</div>
        </div>
        <button onclick="state.history.struggled.shift(); router.navigate('flashcards');">Mark as Mastered</button>
    `;
}

init();
