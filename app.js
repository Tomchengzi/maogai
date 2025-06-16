let questionsData = [];
let chapters = [];
let currentChapter = '';
let currentType = '单项选择题';
let types = ['单项选择题', '判断题'];
let mainTab = 'chapter'; // chapter, choice, judge

let displayedQuestions = []; // Filtered questions for current view
let currentQuestionIndex = 0; // Index of current question in displayedQuestions

// DOM elements
const questionsContainer = document.getElementById('questions-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const chapterNav = document.getElementById('chapter-nav');
const typeTabsDiv = document.getElementById('type-tabs');
const questionNavigation = document.getElementById('question-navigation');
let questionCountInfoDiv;

async function loadQuestions() {
  const res = await fetch('questions.json');
  questionsData = await res.json();
  chapters = [...new Set(questionsData.map(q => q.chapter))];
  currentChapter = chapters[0];
  types = [...new Set(questionsData.map(q => q.type))];

  // Initialize main tabs, chapter tabs, type tabs
  renderMainTabs();
  renderChapterTabs();
  renderTypeTabs();
  setupNavigationButtons(); // Setup button listeners once

  // Initial content update
  updateContent();
}

function renderMainTabs() {
  const mainTabs = document.querySelectorAll('.main-tab');
  mainTabs.forEach(tab => {
    tab.onclick = () => {
      mainTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      mainTab = tab.dataset.tab;
      updateContent();
    };
  });
}

function renderChapterTabs() {
  chapterNav.innerHTML = '';
  chapters.forEach(chap => {
    const btn = document.createElement('button');
    btn.className = 'chapter-tab' + (chap === currentChapter ? ' active' : '');
    btn.textContent = chap;
    btn.onclick = () => {
      currentChapter = chap;
      renderChapterTabs(); // Re-render to update active state
      updateContent();
    };
    chapterNav.appendChild(btn);
  });
}

function renderTypeTabs() {
  typeTabsDiv.innerHTML = '';
  types.forEach(type => {
    const btn = document.createElement('button');
    btn.className = 'type-tab' + (type === currentType ? ' active' : '');
    btn.textContent = type;
    btn.dataset.type = type;
    btn.onclick = () => {
      document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      currentType = type;
      updateContent();
    };
    typeTabsDiv.appendChild(btn);
  });
}

// New: Central function to update displayed questions and render first one
function updateContent() {
  currentQuestionIndex = 0; // Reset index whenever the content source changes

  // Set visibility of navigation elements
  chapterNav.style.display = (mainTab === 'chapter') ? 'flex' : 'none';
  typeTabsDiv.style.display = (mainTab === 'chapter') ? 'flex' : 'none';

  // Filter questions based on current mainTab
  if (mainTab === 'chapter') {
    const block = questionsData.find(q => q.chapter === currentChapter && q.type === currentType);
    displayedQuestions = block ? block.questions : [];
  } else if (mainTab === 'choice') {
    displayedQuestions = questionsData.filter(q => q.type === '单项选择题').flatMap(q => q.questions.map(qq => ({...qq, _chapter: q.chapter})));
  } else if (mainTab === 'judge') {
    displayedQuestions = questionsData.filter(q => q.type === '判断题').flatMap(q => q.questions.map(qq => ({...qq, _chapter: q.chapter})));
  }

  renderCurrentQuestion(); // Render the first question of the new set
}

// New: Render only the current question based on currentQuestionIndex
function renderCurrentQuestion() {
  questionsContainer.innerHTML = ''; // Clear previous question

  if (!displayedQuestions.length) {
    questionsContainer.innerHTML = '<div class="no-questions">暂无题目</div>';
    questionNavigation.style.display = 'none';
    if (questionCountInfoDiv) questionCountInfoDiv.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top even if no questions
    return;
  }

  questionNavigation.style.display = 'flex'; // Show navigation if there are questions
  if (!questionCountInfoDiv) {
    questionCountInfoDiv = document.createElement('div');
    questionCountInfoDiv.className = 'question-count-info';
    questionsContainer.before(questionCountInfoDiv); // Insert before the questions container
  }
  questionCountInfoDiv.style.display = 'block';

  const currentQ = displayedQuestions[currentQuestionIndex];
  const questionType = (mainTab === 'chapter') ? currentType : (mainTab === 'choice' ? '单项选择题' : '判断题');
  const showChapterTag = mainTab !== 'chapter';

  renderSingleQuestionCard(currentQ, currentQuestionIndex, questionType, questionsContainer, showChapterTag);

  updateNavigationButtonsState();
  updateQuestionCountInfoText();

  // Scroll to the top of the questions container after rendering a new question
  // Using window.scrollTo with getBoundingClientRect().top for precise positioning
  const rect = questionsContainer.getBoundingClientRect();
  window.scrollTo({ top: rect.top + window.scrollY, behavior: 'smooth' });
}

// New: Helper to render a single question card
function renderSingleQuestionCard(q, idx, type, container, showChapter) {
  const card = document.createElement('div');
  card.className = 'question-card';

  const title = document.createElement('div');
  title.className = 'question-title';

  // Question index circle
  const indexCircle = document.createElement('span');
  indexCircle.className = 'question-index';
  indexCircle.textContent = idx + 1;
  title.appendChild(indexCircle);

  // Question text
  const questionText = document.createElement('span');
  questionText.textContent = q.question;
  title.appendChild(questionText);

  // Chapter tag for all-questions view
  if (showChapter && q._chapter) {
    const chapterSpan = document.createElement('span');
    chapterSpan.className = 'question-chapter-tag';
    chapterSpan.textContent = `（${q._chapter.replace(/^(导论|第[一二三四五六七八九十]+章)\s*/, '')}）`;
    title.appendChild(chapterSpan);
  }

  card.appendChild(title);

  // Options for multiple choice or true/false
  const opts = document.createElement('div');
  opts.className = 'options';

  if (type === '单项选择题') {
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = String.fromCharCode(65 + i) + '. ' + opt;
      btn.onclick = () => {
        opts.querySelectorAll('button').forEach(b => b.classList.remove('selected', 'correct', 'incorrect'));
        btn.classList.add('selected');
        if (String.fromCharCode(65 + i) === q.answer) {
          btn.classList.add('correct');
        } else {
          btn.classList.add('incorrect');
          // Highlight correct answer
          opts.querySelectorAll('button')[q.answer.charCodeAt(0) - 65].classList.add('correct');
        }
        showExplain(card, q.answer, q.explanation);
      };
      opts.appendChild(btn);
    });
  } else if (type === '判断题') {
    ['对', '错'].forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.onclick = () => {
        opts.querySelectorAll('button').forEach(b => b.classList.remove('selected', 'correct', 'incorrect'));
        btn.classList.add('selected');
        if (opt === q.answer) {
          btn.classList.add('correct');
        } else {
          btn.classList.add('incorrect');
          opts.querySelectorAll('button')[q.answer === '对' ? 0 : 1].classList.add('correct');
        }
        showExplain(card, q.answer, q.explanation);
      };
      opts.appendChild(btn);
    });
  }
  card.appendChild(opts);
  container.appendChild(card);
  return card; // Return the created card element
}

// New: Setup navigation button click listeners
function setupNavigationButtons() {
  prevBtn.onclick = () => {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      renderCurrentQuestion();
    }
  };
  nextBtn.onclick = () => {
    if (currentQuestionIndex < displayedQuestions.length - 1) {
      currentQuestionIndex++;
      renderCurrentQuestion();
    }
  };
}

// New: Update disabled state of navigation buttons
function updateNavigationButtonsState() {
  prevBtn.disabled = currentQuestionIndex === 0;
  nextBtn.disabled = currentQuestionIndex === displayedQuestions.length - 1;
}

// New: Update the question count info text
function updateQuestionCountInfoText() {
  if (questionCountInfoDiv) {
    questionCountInfoDiv.textContent = `第 ${currentQuestionIndex + 1} 题 / 共 ${displayedQuestions.length} 题`;
  }
}

function showExplain(card, answer, explanation) {
  let explain = card.querySelector('.answer-explain');
  if (!explain) {
    explain = document.createElement('div');
    explain.className = 'answer-explain';
    card.appendChild(explain);
  }
  explain.innerHTML = `<b>正确答案：</b> ${answer}${explanation ? '<br><b>解析：</b> ' + explanation : ''}`;
}

// Initial load
window.onload = loadQuestions; 