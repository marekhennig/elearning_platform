document.addEventListener('DOMContentLoaded', () => {
    const coursesView = document.getElementById('coursesView');
    const lessonsView = document.getElementById('lessonsView');
    const lessonView = document.getElementById('lessonView');
    const quizView = document.getElementById('quizView');
    const quizResultsView = document.getElementById('quizResultsView');
    
    const courseList = document.getElementById('courseList');
    const loading = document.getElementById('loading');
    const noCourses = document.getElementById('noCourses');
    
    const lessonsList = document.getElementById('lessonsList');
    const lessonsLoading = document.getElementById('lessonsLoading');
    const noLessons = document.getElementById('noLessons');
    
    const logoutBtn = document.getElementById('logoutBtn');
    const backToCoursesBtn = document.getElementById('backToCoursesBtn');
    const backToLessonsBtn = document.getElementById('backToLessonsBtn');
    const backToLessonsFromQuizBtn = document.getElementById('backToLessonsFromQuizBtn');
    const backToLessonsFromResultsBtn = document.getElementById('backToLessonsFromResultsBtn');
    const breadcrumbContent = document.getElementById('breadcrumbContent');
    
    const courseTitle = document.getElementById('courseTitle');
    const courseDescription = document.getElementById('courseDescription');
    const courseProgress = document.getElementById('courseProgress');
    
    const quizSection = document.getElementById('quizSection');
    const quizStatus = document.getElementById('quizStatus');
    const takeQuizBtn = document.getElementById('takeQuizBtn');
    
    const quizTitle = document.getElementById('quizTitle');
    const quizDescription = document.getElementById('quizDescription');
    const quizTimer = document.getElementById('quizTimer');
    const quizQuestions = document.getElementById('quizQuestions');
    const submitQuizBtn = document.getElementById('submitQuizBtn');
    const passingScoreInfo = document.getElementById('passingScoreInfo');
    const timeInfo = document.getElementById('timeInfo');
    const attemptsInfo = document.getElementById('attemptsInfo');
    const quizResultsContent = document.getElementById('quizResultsContent');
    
    const lessonTitle = document.getElementById('lessonTitle');
    const lessonContent = document.getElementById('lessonContent');
    const courseCompletedMessage = document.getElementById('courseCompletedMessage');
    
    const userScore = document.getElementById('userScore');
    
    const leaderboardLoading = document.getElementById('leaderboardLoading');
    const leaderboard = document.getElementById('leaderboard');
    const leaderboardList = document.getElementById('leaderboardList');
    const noLeaderboard = document.getElementById('noLeaderboard');

    let currentCourse = null;
    let currentLesson = null;
    let currentUser = null;
    let currentLessons = [];
    let currentQuiz = null;
    let quizStartTime = null;
    let quizTimer_interval = null;

    function showCoursesView() {
        hideAllViews();
        coursesView.classList.remove('hidden');
        breadcrumbContent.textContent = 'Dashboard';
        currentCourse = null;
        currentLesson = null;
        currentLessons = [];
        clearQuizTimer();
    }

    function showLessonsView(course) {
        hideAllViews();

        lessonsView.classList.remove('hidden');
        courseTitle.textContent = course.title;
        courseDescription.textContent = course.description;
        breadcrumbContent.innerHTML = `Dashboard > <span class="font-medium">${course.title}</span>`;
        currentCourse = course;
        currentLesson = null;
        
        updateCourseProgress(course);
        
        fetchLessons(course._id);
    
        if (course.quiz) {
            fetchQuizInfo(course._id);
        } else {
            quizSection.classList.add('hidden');
        }
    }

    function showLessonView(lesson) {
        hideAllViews();

        lessonView.classList.remove('hidden');
        lessonTitle.textContent = lesson.title;
        lessonContent.innerHTML = `<p>${lesson.content}</p>`;
        breadcrumbContent.innerHTML = `Dashboard > <span class="font-medium">${currentCourse.title}</span> > <span class="font-medium">${lesson.title}</span>`;
        currentLesson = lesson;
        courseCompletedMessage.classList.add('hidden');
        
        if (!lesson.read) {
            markLessonAsRead(lesson._id);
        }
    }

    function showQuizView(quiz) {
        hideAllViews();

        quizView.classList.remove('hidden');
        quizTitle.textContent = quiz.title;
        quizDescription.textContent = quiz.description;
        breadcrumbContent.innerHTML = `Dashboard > <span class="font-medium">${currentCourse.title}</span> > <span class="font-medium">Quiz</span>`;
        currentQuiz = quiz;
        passingScoreInfo.textContent = `You need ${quiz.passingScore}% to pass`;
        timeInfo.textContent = `Time limit: ${quiz.timeLimit} minutes`;
        attemptsInfo.textContent = `Total attempts: ${quiz.attempts}`;
        
        renderQuizQuestions(quiz.questions);
        startQuizTimer(quiz.timeLimit);
    }

    function showQuizResultsView(results) {
        hideAllViews();
        quizResultsView.classList.remove('hidden');
        breadcrumbContent.innerHTML = `Dashboard > <span class="font-medium">${currentCourse.title}</span> > <span class="font-medium">Quiz Results</span>`;
        renderQuizResults(results);
    }

    function hideAllViews() {
        coursesView.classList.add('hidden');
        lessonsView.classList.add('hidden');
        lessonView.classList.add('hidden');
        quizView.classList.add('hidden');
        quizResultsView.classList.add('hidden');
    }

    function startQuizTimer(timeLimit) {
        quizStartTime = Date.now();
        const endTime = quizStartTime + (timeLimit * 60 * 1000);
        
        quizTimer_interval = setInterval(() => {
            const now = Date.now();
            const timeLeft = endTime - now;
            
            if (timeLeft <= 0) {
                clearInterval(quizTimer_interval);
                quizTimer.textContent = "Time's up!";
                submitQuiz();
            } else {
                const minutes = Math.floor(timeLeft / 60000);
                const seconds = Math.floor((timeLeft % 60000) / 1000);
                quizTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    function clearQuizTimer() {
        if (quizTimer_interval) {
            clearInterval(quizTimer_interval);
            quizTimer_interval = null;
        }
    }

    function renderQuizQuestions(questions) {
        quizQuestions.innerHTML = '';
        
        questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'bg-gray-50 border border-gray-200 rounded-lg p-4';
            
            const optionsHtml = question.options.map((option, optionIndex) => `
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="question_${index}" value="${optionIndex}" class="text-blue-600">
                    <span>${option}</span>
                </label>
            `).join('');
            
            questionDiv.innerHTML = `
                <h4 class="font-semibold mb-3">${index + 1}. ${question.question}</h4>
                <div class="space-y-2">
                    ${optionsHtml}
                </div>
            `;
            
            quizQuestions.appendChild(questionDiv);
        });
    }

    function renderQuizResults(results) {
        const { score, passed, passingScore, results: questionResults, attemptsLeft, wasAlreadyPassed, firstTimePass } = results;
        
        const statusClass = passed ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700';
        const statusIcon = passed ? '🎉' : '❌';
        let statusText = '';
        if (firstTimePass) {
            statusText = 'Congratulations! You passed for the first time!';
        } else if (passed && wasAlreadyPassed) {
            statusText = 'Great job! You passed again!';
        } else if (passed) {
            statusText = 'Congratulations! You passed!';
        } else {
            statusText = 'You did not pass this time.';
        }
        
        let html = `
            <div class="${statusClass} border px-4 py-3 rounded mb-6">
                <div class="flex items-center">
                    <span class="text-2xl mr-3">${statusIcon}</span>
                    <div>
                        <h3 class="font-bold text-lg">${statusText}</h3>
                        <p>Your score: ${score}% (Required: ${passingScore}%)</p>
                        ${wasAlreadyPassed ? '<p class="text-sm italic">Note: Course completion status unchanged (already passed)</p>' : ''}
                    </div>
                </div>
            </div>
            
            <div class="mb-6">
                <button id="retakeQuizBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-200">
                    Take Quiz Again
                </button>
            </div>
            
            <h3 class="text-xl font-semibold mb-4">Question Review</h3>
            <div class="space-y-4">
        `;
        
        questionResults.forEach((result, index) => {
            const isCorrect = result.isCorrect;
            const borderClass = isCorrect ? 'border-green-200' : 'border-red-200';
            const bgClass = isCorrect ? 'bg-green-50' : 'bg-red-50';
            const iconClass = isCorrect ? 'text-green-600' : 'text-red-600';
            const icon = isCorrect ? '✓' : '✗';
            
            html += `
                <div class="border ${borderClass} ${bgClass} rounded-lg p-4">
                    <div class="flex items-start">
                        <span class="${iconClass} text-xl mr-3 mt-1">${icon}</span>
                        <div class="flex-1">
                            <h4 class="font-semibold mb-2">${index + 1}. ${result.question}</h4>
                            <p class="text-sm text-gray-600 mb-1">Your answer: ${result.userAnswer !== undefined ? currentQuiz.questions[index].options[result.userAnswer] : 'No answer'}</p>
                            <p class="text-sm text-gray-600 mb-2">Correct answer: ${currentQuiz.questions[index].options[result.correctAnswer]}</p>
                            ${result.explanation ? `<p class="text-sm text-blue-600 italic">${result.explanation}</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        quizResultsContent.innerHTML = html;

        document.getElementById('retakeQuizBtn').addEventListener('click', async () => {
            try {
                const response = await fetch(`/api/courses/${currentCourse._id}/quiz`);
                if (response.ok) {
                    const quiz = await response.json();
                    showQuizView(quiz);
                }
            } catch (error) {
                console.error('Error loading quiz for retake:', error);
                alert('Error loading quiz. Please try again.');
            }
        });
    }

    async function submitQuiz() {
        const answers = [];
        const questions = currentQuiz.questions;
        
        for (let i = 0; i < questions.length; i++) {
            const selectedOption = document.querySelector(`input[name="question_${i}"]:checked`);
            answers.push(selectedOption ? parseInt(selectedOption.value) : undefined);
        }
        
        const timeSpent = Math.floor((Date.now() - quizStartTime) / 1000);
        clearQuizTimer();
        
        try {
            const response = await fetch(`/api/quizzes/${currentQuiz._id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers, timeSpent })
            });
            
            if (response.ok) {
                const results = await response.json();
                showQuizResultsView(results);
                
                if (results.firstTimePass) {
                    fetchUserInfo();
                    fetchLeaderboard();
                }
            } else {
                const error = await response.json();
                alert(error.error);
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
            alert('Error submitting quiz. Please try again.');
        }
    }

    function updateCourseProgress(course) {
        if (course.progress) {
            let progressHtml = '';
            
            if (course.completed) {
                progressHtml = `<span class="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">✓ Completed</span>`;
            } else {
                const quizStatusText = course.quiz ? 
                    (course.progress.quizStatus === 'passed' ? '✓ Quiz Passed' : 
                     course.progress.quizStatus === 'not_passed' ? '❌ Quiz Required' : '') : '';
                
                progressHtml = `
                    <div class="space-y-2">
                        <div class="flex items-center gap-2">
                            <div class="w-32 bg-gray-200 rounded-full h-2">
                                <div class="bg-blue-600 h-2 rounded-full" style="width: ${course.progress.percentage}%"></div>
                            </div>
                            <span class="text-sm text-gray-600">${course.progress.read}/${course.progress.total} lessons</span>
                        </div>
                        ${quizStatusText ? `<div class="text-sm ${course.progress.quizStatus === 'passed' ? 'text-green-600' : 'text-red-600'}">${quizStatusText}</div>` : ''}
                    </div>
                `;
            }
            
            courseProgress.innerHTML = progressHtml;
        }
    }

    function updateCourseProgressFromLessons() {
        if (!currentCourse || !currentLessons || currentLessons.length === 0) return;
        
        const totalLessons = currentLessons.length;
        const readLessons = currentLessons.filter(lesson => lesson.read).length;
        const percentage = Math.round((readLessons / totalLessons) * 100);
        
        if (!currentCourse.progress) {
            currentCourse.progress = {};
        }
        currentCourse.progress.read = readLessons;
        currentCourse.progress.total = totalLessons;
        currentCourse.progress.percentage = percentage;
        
        updateCourseProgress(currentCourse);
    }

    backToCoursesBtn.addEventListener('click', () => {
        showCoursesView();
        fetchCourses();
    });
    
    backToLessonsBtn.addEventListener('click', async () => {
        if (currentLesson && !currentLesson.read) {
            await markLessonAsRead(currentLesson._id);
        } else {
            updateLessonReadStatus(currentLesson._id);
            updateCourseProgressFromLessons();
        }
        
        showLessonsView(currentCourse);
    });
    backToLessonsFromQuizBtn.addEventListener('click', () => {
        clearQuizTimer();
        showLessonsView(currentCourse);
    });

    backToLessonsFromResultsBtn.addEventListener('click', () => {
        showLessonsView(currentCourse);
    });

    takeQuizBtn.addEventListener('click', async () => {
        console.log('Take Quiz button clicked for course:', currentCourse._id);
        try {
            const response = await fetch(`/api/courses/${currentCourse._id}/quiz`);
            console.log('Quiz fetch response status:', response.status);
            
            if (response.ok) {
                const quiz = await response.json();
                console.log('Quiz data received:', quiz);
                showQuizView(quiz);
            } else {
                const error = await response.json();
                console.error('Error response:', error);
                alert('Error loading quiz: ' + error.error);
            }
        } catch (error) {
            console.error('Error loading quiz:', error);
            alert('Error loading quiz. Please try again.');
        }
    });

    submitQuizBtn.addEventListener('click', submitQuiz);

    logoutBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error logging out:', error);
        }
    });

    async function markLessonAsRead(lessonId) {
        try {
            const response = await fetch(`/api/lessons/${lessonId}/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                updateLessonReadStatus(lessonId);
                updateCourseProgressFromLessons();
                if (data.courseCompleted) {
                    courseCompletedMessage.classList.remove('hidden');
                    currentCourse.completed = true;
                    fetchUserInfo();
                    fetchLeaderboard();
                }
            }
        } catch (error) {
            console.error('Error marking lesson as read:', error);
        }
    }

    function updateLessonReadStatus(lessonId) {
        if (currentLesson && currentLesson._id === lessonId) {
            currentLesson.read = true;
        }
        
        if (currentLessons && currentLessons.length > 0) {
            const lessonIndex = currentLessons.findIndex(l => l._id === lessonId);
            if (lessonIndex !== -1) {
                currentLessons[lessonIndex].read = true;
                
                const lessonElements = document.querySelectorAll(`[data-lesson-id="${lessonId}"]`);
                if (lessonElements.length > 0) {
                    const lessonCard = lessonElements[0].closest('.bg-gray-50');
                    if (lessonCard) {
                        const readBadgeContainer = lessonCard.querySelector('.flex.items-center.mb-2');
                        if (readBadgeContainer) {
                            const oldBadge = readBadgeContainer.querySelector('.inline-block');
                            if (oldBadge) {
                                oldBadge.outerHTML = `<span class="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full ml-2">✓ Read</span>`;
                            }
                        }
                    }
                }
            }
        }
    }

    async function fetchQuizInfo(courseId) {
        try {
            console.log('Fetching quiz info for course:', courseId);
            const response = await fetch(`/api/courses/${courseId}/quiz`);
            console.log('Quiz info response status:', response.status);
            
            if (response.ok) {
                const quiz = await response.json();
                console.log('Quiz info received:', quiz);
                quizSection.classList.remove('hidden');
                
                let statusHtml = '';
                if (quiz.hasPassed) {
                    statusHtml = '<span class="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">✓ Passed</span>';
                    takeQuizBtn.textContent = 'Retake Quiz';
                    takeQuizBtn.disabled = false;
                } else {
                    statusHtml = `<span class="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">Attempts: ${quiz.attempts}</span>`;
                    takeQuizBtn.textContent = 'Take Quiz';
                    takeQuizBtn.disabled = false;
                } 
                
                quizStatus.innerHTML = statusHtml;
            } else {
                console.log('No quiz found for course');
                quizSection.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error fetching quiz info:', error);
            quizSection.classList.add('hidden');
        }
    }

    async function fetchCourses() {
        try {
            loading.classList.remove('hidden');
            courseList.classList.add('hidden');
            noCourses.classList.add('hidden');
            
            const response = await fetch('/api/courses');
            
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/';
                    return;
                }
                throw new Error('Failed to fetch courses');
            }
            
            const courses = await response.json();
            loading.classList.add('hidden');
            
            if (courses.length === 0) {
                noCourses.classList.remove('hidden');
            } else {
                courseList.classList.remove('hidden');
                courseList.innerHTML = '';
                
                courses.forEach(course => {
                    const courseCard = document.createElement('div');
                    courseCard.className = 'bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200';
                    let progressHtml = '';
                    if (course.completed) {
                        progressHtml = `<span class="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full mb-2">✓ Completed</span>`;
                    } else {
                        const quizStatusIcon = course.quiz ? 
                            (course.progress.quizStatus === 'passed' ? '✓' : 
                             course.progress.quizStatus === 'not_passed' ? '📝' : '') : '';
                        
                        progressHtml = `
                            <div class="mb-2">
                                <div class="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Progress</span>
                                    <span>${course.progress.read}/${course.progress.total} lessons ${quizStatusIcon}</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-blue-600 h-2 rounded-full" style="width: ${course.progress.percentage}%"></div>
                                </div>
                            </div>
                        `;
                    }
                    
                    courseCard.innerHTML = `
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">${course.title}</h3>
                        ${progressHtml}
                        <p class="text-gray-600 text-sm mb-3">${course.description}</p>
                        <button class="view-course-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition duration-200" data-course-id="${course._id}">
                            View Course
                        </button>
                    `;
                    courseList.appendChild(courseCard);
                });

                document.querySelectorAll('.view-course-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const courseId = e.target.getAttribute('data-course-id');
                        const course = courses.find(c => c._id === courseId);
                        showLessonsView(course);
                    });
                });
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            loading.classList.add('hidden');
            noCourses.innerHTML = '<p>Error loading courses. Please try again later.</p>';
            noCourses.classList.remove('hidden');
        }
    }

    async function fetchLessons(courseId) {
        try {
            lessonsLoading.classList.remove('hidden');
            lessonsList.classList.add('hidden');
            noLessons.classList.add('hidden');

            const response = await fetch(`/api/courses/${courseId}/lessons`);
            
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/';
                    return;
                }
                throw new Error('Failed to fetch lessons');
            }
            
            const lessons = await response.json();
            currentLessons = lessons;
            lessonsLoading.classList.add('hidden');
            
            if (lessons.length === 0) {
                noLessons.classList.remove('hidden');
            } else {
                lessonsList.classList.remove('hidden');
                lessonsList.innerHTML = '';
                
                lessons.forEach((lesson, index) => {
                    const lessonCard = document.createElement('div');
                    lessonCard.className = 'bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200';
                    
                    const readBadge = lesson.read 
                        ? `<span class="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full ml-2">✓ Read</span>`
                        : `<span class="inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full ml-2">Unread</span>`;
                    
                    lessonCard.innerHTML = `
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="flex items-center mb-2">
                                    <span class="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full mr-3">
                                        ${index + 1}
                                    </span>
                                    <h4 class="text-lg font-semibold text-gray-800">${lesson.title}</h4>
                                    ${readBadge}
                                </div>
                                <p class="text-gray-600 text-sm mb-3">${lesson.content.substring(0, 100)}...</p>
                            </div>
                            <button class="view-lesson-btn bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition duration-200 ml-4" data-lesson-id="${lesson._id}">
                                View Lesson
                            </button>
                        </div>
                    `;
                    lessonsList.appendChild(lessonCard);
                });

                document.querySelectorAll('.view-lesson-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const lessonId = e.target.getAttribute('data-lesson-id');
                        const lesson = lessons.find(l => l._id === lessonId);
                        showLessonView(lesson);
                    });
                });
                
                updateCourseProgressFromLessons();
            }
        } catch (error) {
            console.error('Error fetching lessons:', error);
            lessonsLoading.classList.add('hidden');
            noLessons.innerHTML = '<p>Error loading lessons. Please try again later.</p>';
            noLessons.classList.remove('hidden');
        }
    }
    
    async function fetchUserInfo() {
        try {
            const response = await fetch('/api/user');
            
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/';
                    return;
                }
                throw new Error('Failed to fetch user info');
            }
            
            currentUser = await response.json();
            userScore.innerHTML = `
                <p class="text-sm text-gray-600">Your Score</p>
                <p class="text-xl font-bold text-blue-600">${currentUser.score}</p>
            `;
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    }
    
    async function fetchLeaderboard() {
        try {
            leaderboardLoading.classList.remove('hidden');
            leaderboard.classList.add('hidden');
            noLeaderboard.classList.add('hidden');
            
            const response = await fetch('/api/leaderboard');
            
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/';
                    return;
                }
                throw new Error('Failed to fetch leaderboard');
            }
            
            const users = await response.json();
            leaderboardLoading.classList.add('hidden');
            
            if (users.length === 0) {
                noLeaderboard.classList.remove('hidden');
            } else {
                leaderboard.classList.remove('hidden');
                leaderboardList.innerHTML = '';
                
                users.forEach((user, index) => {
                    const row = document.createElement('tr');
                    const isCurrentUser = currentUser && user.username === currentUser.username;
                    
                    row.className = `border-b ${isCurrentUser ? 'bg-blue-50' : ''}`;
                    row.innerHTML = `
                        <td class="py-2 font-medium">${index + 1}</td>
                        <td class="py-2 ${isCurrentUser ? 'font-bold' : ''}">${user.username}</td>
                        <td class="py-2 text-right">${user.score}</td>
                    `;
                    leaderboardList.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            leaderboardLoading.classList.add('hidden');
            noLeaderboard.innerHTML = '<p>Error loading leaderboard. Please try again later.</p>';
            noLeaderboard.classList.remove('hidden');
        }
    }

    showCoursesView();
    fetchCourses();
    fetchUserInfo();
    fetchLeaderboard();
});