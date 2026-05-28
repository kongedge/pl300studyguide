let allQuestions = [];
let currentQuizPool = [];
let currentIdx = 0;
let userStats = JSON.parse(localStorage.getItem('pl300_stats')) || { history: [], weakTopics: [] };

// 1. Initial Load
fetch('questions.json')
    .then(res => res.json())
    .then(data => {
        // Fallback checks depending on how your Python script names the JSON array
        allQuestions = data.questions || data.pl300_questions || []; 
        updateReadiness();
        viewController('dashboard');
    })
    .catch(err => console.error("Error loading JSON. Is your file named questions.json?", err));

// 2. Readiness Metric
function updateReadiness() {
    const total = userStats.history.length;
    if (total === 0) return;
    const correct = userStats.history.filter(x => x.isCorrect).length;
    const percentage = Math.round((correct / total) * 100);
    const badge = percentage >= 80 ? '🟢 Ready' : '🟡 Reviewing';
    document.getElementById('readiness-val').innerText = `${percentage}% (${badge})`;
}

// 3. View Router
window.viewController = (view) => {
    const container = document.getElementById('main-content');
    
    if (view === 'dashboard') {
        container.innerHTML = `<h2>Domain Mastery Analysis</h2>${renderStats()}`;
    } 
    else if (view === 'quiz-menu') {
        // Dynamically find all unique domains from your questions
        const domains = [...new Set(allQuestions.map(q => q.domain).filter(Boolean))];
        let menuHtml = `<h2>Select a Practice Test</h2>
            <button onclick="initQuiz('Full')" style="width:100%; margin-bottom:15px;">Simulate Full Exam</button>
            <h3>Or select a specific section:</h3>`;
        
        domains.forEach(d => {
            menuHtml += `<button onclick="initQuiz('${d}')" style="width:100%; margin-bottom:10px; background:#444; color:#fff;">${d}</button>`;
        });
        container.innerHTML = menuHtml;
    }
};

function renderStats() {
    if (allQuestions.length === 0) return "<p>No data loaded yet.</p>";
    const domains = [...new Set(allQuestions.map(q => q.domain).filter(Boolean))];
    return domains.map(d => {
        const dQuestions = userStats.history.filter(h => h.domain === d);
        const score = dQuestions.length ? Math.round((dQuestions.filter(q => q.isCorrect).length / dQuestions.length) * 100) : 0;
        return `<p><strong>${d}:</strong> ${score}% accuracy (${dQuestions.length} attempts)</p>`;
    }).join('') + `<br><button onclick="clearStats()" style="background:#555;">Reset All Progress</button>`;
}

window.clearStats = () => {
    if(confirm("Are you sure you want to reset all your scores and flashcards?")) {
        userStats = { history: [], weakTopics: [] };
        localStorage.setItem('pl300_stats', JSON.stringify(userStats));
        updateReadiness();
        viewController('dashboard');
    }
};

// 4. Quiz Logic
window.initQuiz = (filterType) => {
    if (filterType === 'Full') {
        currentQuizPool = [...allQuestions].sort(() => 0.5 - Math.random()); // Shuffle all
    } else {
        currentQuizPool = allQuestions.filter(q => q.domain === filterType).sort(() => 0.5 - Math.random());
    }
    
    if (currentQuizPool.length === 0) {
        document.getElementById('main-content').innerHTML = `<p>No questions found for this selection.</p>`;
        return;
    }
    currentIdx = 0;
    showQuestion();
};

function showQuestion() {
    const q = currentQuizPool[currentIdx];
    const container = document.getElementById('main-content');
    
    // Safely format options in case they contain quotes
    const optionsHtml = q.options.map(opt => {
        const safeOpt = opt.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeAnswer = q.answer || q.correctAnswer;
        const safeAns = safeAnswer.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeRat = (q.rationale || "No rationale provided.").replace(/'/g, "\\'").replace(/"/g, '&quot;');
        return `<button class="quiz-option" onclick="handleAnswer('${safeOpt}', '${safeAns}', '${safeRat}', '${q.domain}', '${q.topic}')">${opt}</button>`;
    }).join('');

    container.innerHTML = `<h3>Question ${currentIdx + 1} of ${currentQuizPool.length}</h3>
        <p style="font-size: 1.1em;">${q.question}</p>
        ${optionsHtml}`;
}

window.handleAnswer = (picked, correct, rationale, domain, topic) => {
    const isCorrect = picked === correct;
    
    // Save to history
    userStats.history.push({ isCorrect, domain, topic });
    
    // If wrong, add to weak topics for flashcards
    if (!isCorrect && topic && !userStats.weakTopics.includes(topic)) {
        userStats.weakTopics.push(topic);
    }
    
    // If correct, maybe remove from weak topics if they mastered it (Optional, omitting for now to keep flashcards populated)
    localStorage.setItem('pl300_stats', JSON.stringify(userStats));
    updateReadiness();

    const container = document.getElementById('main-content');
    const feedbackClass = isCorrect ? 'correct-box' : 'incorrect-box';
    const icon = isCorrect ? '✅ Correct!' : '❌ Incorrect. The answer is: ' + correct;
    
    // Inject the result box directly below the question (removes the options so they can't click twice)
    container.innerHTML += `
        <div class="feedback-box ${feedbackClass}">
            <p><strong>${icon}</strong></p>
            <p>${rationale}</p>
        </div>
        <button onclick="nextQuestion()" style="margin-top: 15px; width: 100%;">Next Question</button>
    `;
    
    // Disable the options so they can't be clicked again
    const optionBtns = document.querySelectorAll('.quiz-option');
    optionBtns.forEach(btn => btn.disabled = true);
};

window.nextQuestion = () => {
    currentIdx++;
    if (currentIdx < currentQuizPool.length) {
        showQuestion();
    } else {
        const container = document.getElementById('main-content');
        container.innerHTML = `<h2>Quiz Complete!</h2><button onclick="viewController('dashboard')">Back to Dashboard</button>`;
    }
};

// 5. Dynamic Flashcards Logic
window.initFlashcards = () => {
    const container = document.getElementById('main-content');
    
    if (userStats.weakTopics.length === 0) {
        container.innerHTML = `<h2>Great job!</h2><p>You haven't missed any questions yet, so you have no weak areas to review.</p>`;
        return;
    }

    // Find questions that match the topics the user got wrong
    const flashcardPool = allQuestions.filter(q => userStats.weakTopics.includes(q.topic));
    
    if (flashcardPool.length === 0) {
        container.innerHTML = `<p>No specific questions found for your weak topics.</p>`;
        return;
    }

    let fcIdx = 0;
    
    window.renderCard = () => {
        const q = flashcardPool[fcIdx];
        const answer = q.answer || q.correctAnswer;
        container.innerHTML = `
            <h2>Targeted Review: ${q.topic}</h2>
            <p>Card ${fcIdx + 1} of ${flashcardPool.length}</p>
            <div class="flashcard-container" onclick="this.querySelector('.flashcard').classList.toggle('flipped')">
                <div class="flashcard">
                    <div class="flashcard-front">
                        <h3>${q.question}</h3>
                        <p><em>(Click to flip)</em></p>
                    </div>
                    <div class="flashcard-back">
                        <h3>Answer: ${answer}</h3>
                        <p>${q.rationale}</p>
                    </div>
                </div>
            </div>
            <button onclick="nextFlashcard()" style="width: 100%;">Next Card</button>
        `;
    };

    window.nextFlashcard = () => {
        fcIdx = (fcIdx + 1) % flashcardPool.length;
        renderCard();
    };

    renderCard();
};
