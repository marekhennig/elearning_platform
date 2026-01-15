import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import crypto from 'crypto';
import { google } from 'googleapis';
import { User } from './models/User.js';
import { Course } from './models/Course.js';
import { Lesson } from './models/Lesson.js';
import { Quiz } from './models/Quiz.js';
import { QuizAttempt } from './models/QuizAttempt.js';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT;
const HOST = process.env.HOST;
const dbURI = process.env.MONGO_URI;
const mailUser = process.env.MAIL_USER;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const refreshToken = process.env.REFRESH_TOKEN;
const OAuth2 = google.auth.OAuth2;

mongoose.connect(dbURI);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'env.SESSION_SECRET',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

const oAuth2Client = new OAuth2(
    clientId,
    clientSecret,
    "https://developers.google.com/oauthplayground"
  );

  oAuth2Client.setCredentials({
    refresh_token: refreshToken
  });

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

function generateMagicLinkEmail(magicLink, userEmail) {
  const textContent = `
Welcome in E-Learning Platform about Web 3.0<br>
ENGLISH:<br>
<br>
Hello ${userEmail},<br>
You requested to sign in to platform.<br>
<br>
<br>
Click this link to sign in: ${magicLink}<br>
<br>
Security Notice: This link expires in 1 hour.<br>
<br>
What's waiting for you:<br>
• Access to comprehensive courses<br>
• Interactive quizzes and assessments<br>
• Track your learning progress<br>
• Compete on the leaderboard<br>
<br>
---<br>
<br>
POLSKI:<br>
Witaj na platformie edukacyjnej o Web 3.0<br>
Cześć ${userEmail},<br>
Zażądałeś zalogowania do platformy.<br>
<br>
Kliknij ten link aby się zalogować: ${magicLink}<br>
<br>
Informacja o bezpieczeństwie: Ten link wygaśnie za 1 godzinę.<br>
<br>
Co na Ciebie czeka:<br>
• Dostęp do kompleksowych kursów<br>
• Interaktywne quizy i testy<br>
• Śledzenie postępów w nauce<br>
• Rywalizacja w rankingu<br>
<br>
---<br>
`;

  return { text: textContent };
}

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

async function checkCourseCompletion(userId, courseId) {
  try {
    const user = await User.findById(userId);
    const course = await Course.findById(courseId).populate('lessons').populate('quiz');
    
    if (!course || !user) return false;
    
    const courseLessonIds = course.lessons.map(lesson => lesson._id.toString());
    const userReadLessonIds = user.readLessons.map(lesson => lesson.toString());
    
    const allLessonsRead = courseLessonIds.every(lessonId => 
      userReadLessonIds.includes(lessonId)
    );
    
    let quizPassed = true;
    if (course.quiz) {
      quizPassed = user.passedQuizzes.includes(course.quiz._id);
    }
    
    const courseCompleted = allLessonsRead && quizPassed;
    
    if (courseCompleted && !user.completedCourses.includes(courseId)) {
      user.completedCourses.push(courseId);
      await user.save();
      return true;
    }
    
    return courseCompleted;
  } catch (error) {
    console.error('Error checking course completion:', error);
    return false;
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/auth', async (req, res) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({ email });
    }
    
    const token = crypto.randomBytes(32).toString('hex');
    user.magicLinkToken = token;
    user.magicLinkExpires = Date.now() + 3600000;
    await user.save();
    
    const magicLink = `${HOST}/verify?token=${token}`;
    const emailContent = generateMagicLinkEmail(magicLink, email);
    const str = [
    `Content-Type: text/html; charset="UTF-8"\n`,
    `MIME-Version: 1.0\n`,
    `Content-Transfer-Encoding: 7bit\n`,
    `to: ${email}\n`,
    `from: ${mailUser}\n`,
    `subject: Your Magic Link Web 3.0 E-Learning Platform\n\n`,
    `${emailContent.text}`,
    ].join('');

    const encodedMail = Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMail,
      },
    });
    
    res.json({ message: 'Magic link sent to your email' });
  } catch (error) {
    console.error('Error in /auth route:', error);
    res.status(400).json({ error: 'Error processing request' });
  }
});

app.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({
      magicLinkToken: token,
      magicLinkExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).send(`
        <html>
          <head><title>Invalid Link</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>Invalid or Expired Link</h1>
            <p>This magic link is invalid or has expired.</p>
            <p>Nieprawidłowy lub wygasły link.</p>
            <a href="/" style="color: #3b82f6;">Return to Login / Powrót do logowania</a>
          </body>
        </html>
      `);
    }
    
    user.magicLinkToken = undefined;
    user.magicLinkExpires = undefined;
    await user.save();
    
    req.session.userId = user._id;
    res.redirect('/dashboard');
  } catch (error) {
    res.status(400).send(`
      <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>Error</h1>
          <p>Error verifying token / Błąd weryfikacji tokenu</p>
          <a href="/" style="color: #3b82f6;">← Return to Login / Powrót do logowania</a>
        </body>
      </html>
    `);;
  }
});

app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/api/courses', requireAuth, async (req, res) => {
  try {
    const courses = await Course.find().populate('lessons').populate('quiz');
    
    const user = await User.findById(req.session.userId);
    const completedCourseIds = user.completedCourses.map(id => id.toString());
    const readLessonIds = user.readLessons.map(id => id.toString());
    const passedQuizIds = user.passedQuizzes.map(id => id.toString());
    
    const coursesWithProgress = courses.map(course => {
      const courseObj = course.toObject();
      courseObj.completed = completedCourseIds.includes(course._id.toString());
      
      const totalLessons = course.lessons.length;
      const readLessonsInCourse = course.lessons.filter(lesson => 
        readLessonIds.includes(lesson._id.toString())
      ).length;
      
      let quizStatus = 'not_required';
      if (course.quiz) {
        quizStatus = passedQuizIds.includes(course.quiz._id.toString()) ? 'passed' : 'not_passed';
      }

      courseObj.progress = {
        read: readLessonsInCourse,
        total: totalLessons,
        percentage: totalLessons > 0 ? Math.round((readLessonsInCourse / totalLessons) * 100) : 0,
        quizStatus: quizStatus
      };
      
      return courseObj;
    });
    
    res.json(coursesWithProgress);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(400).json({ error: 'Error fetching courses' });
  }
});

app.get('/api/courses/:id', requireAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('lessons').populate('quiz');
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const user = await User.findById(req.session.userId);
    const readLessonIds = user.readLessons.map(id => id.toString());
    const passedQuizIds = user.passedQuizzes.map(id => id.toString());
    const courseObj = course.toObject();
    courseObj.lessons = courseObj.lessons.map(lesson => ({
      ...lesson,
      read: readLessonIds.includes(lesson._id.toString())
    }));
    
    if (courseObj.quiz) {
      courseObj.quiz.hasPassed = passedQuizIds.includes(courseObj.quiz._id.toString());
    }

    res.json(courseObj);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(400).json({ error: 'Error fetching course' });
  }
});

app.get('/api/courses/:id/lessons', requireAuth, async (req, res) => {
  try {
    const lessons = await Lesson.find({ course: req.params.id });
    const user = await User.findById(req.session.userId);
    const readLessonIds = user.readLessons.map(id => id.toString());
    
    const lessonsWithReadStatus = lessons.map(lesson => ({
      ...lesson.toObject(),
      read: readLessonIds.includes(lesson._id.toString())
    }));
    
    res.json(lessonsWithReadStatus);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(400).json({ error: 'Error fetching lessons' });
  }
});

app.get('/api/lessons/:id', requireAuth, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course', 'title');
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    const user = await User.findById(req.session.userId);
    const readLessonIds = user.readLessons.map(id => id.toString());
    const lessonObj = lesson.toObject();
    lessonObj.read = readLessonIds.includes(lesson._id.toString());
    
    res.json(lessonObj);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching lesson' });
  }
});

app.post('/api/lessons/:id/read', requireAuth, async (req, res) => {
  try {
    const lessonId = req.params.id;
    const userId = req.session.userId;
    
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    const user = await User.findById(userId);
    if (!user.readLessons.includes(lessonId)) {
      user.readLessons.push(lessonId);
      await user.save();
    }
    
    const courseCompleted = await checkCourseCompletion(userId, lesson.course);
    
    res.json({ 
      message: 'Lesson marked as read', 
      read: true,
      courseCompleted: courseCompleted
    });
  } catch (error) {
    res.status(400).json({ error: 'Error marking lesson as read' });
  }
});

app.get('/api/courses/:id/quiz', requireAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('quiz');
    if (!course || !course.quiz) {
      return res.status(404).json({ error: 'Quiz not found for this course' });
    }
    
    const attempts = await QuizAttempt.find({
      user: req.session.userId,
      quiz: course.quiz._id
    }).sort({ completedAt: -1 });
    
    const user = await User.findById(req.session.userId);
    const hasPassed = user.passedQuizzes.includes(course.quiz._id);
    
    const quizData = {
      _id: course.quiz._id,
      title: course.quiz.title,
      description: course.quiz.description,
      passingScore: course.quiz.passingScore,
      timeLimit: course.quiz.timeLimit,
      maxAttempts: course.quiz.maxAttempts,
      questions: course.quiz.questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options
        
      })),
      attempts: attempts.length,
      maxAttempts: course.quiz.maxAttempts,
      hasPassed: hasPassed,
      canTakeQuiz: true 
    };
    
    res.json(quizData);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(400).json({ error: 'Error fetching quiz' });
  }
});

app.post('/api/quizzes/:id/submit', requireAuth, async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;
    const quizId = req.params.id;
    const userId = req.session.userId;
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    const user = await User.findById(userId);
    const wasAlreadyPassed = user.passedQuizzes.includes(quizId);

    let correctAnswers = 0;
    const results = quiz.questions.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctAnswers++;
      
      return {
        question: question.question,
        userAnswer: userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect,
        explanation: question.explanation
      };
    });
    
    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;
    const attempt = new QuizAttempt({
      user: userId,
      quiz: quizId,
      answers: answers,
      score: score,
      passed: passed,
      timeSpent: timeSpent
    });
    await attempt.save();
    
    if (passed && !wasAlreadyPassed) {
      user.passedQuizzes.push(quizId);
      await user.save();
      
      const course = await Course.findOne({ quiz: quizId });
      if (course) {
        await checkCourseCompletion(userId, course._id);
      }
    }
    
    const totalAttempts = await QuizAttempt.countDocuments({
      user: userId,
      quiz: quizId
    });
    
    res.json({
      score: score,
      passed: passed,
      passingScore: quiz.passingScore,
      results: results,
      attemptsLeft: Math.max(0, quiz.maxAttempts - totalAttempts),
      wasAlreadyPassed: wasAlreadyPassed,
      firstTimePass: passed && !wasAlreadyPassed
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(400).json({ error: 'Error submitting quiz' });
  }
});

app.get('/api/quizzes/:id/results', requireAuth, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({
      user: req.session.userId,
      quiz: req.params.id
    }).sort({ completedAt: -1 });
    
    res.json(attempts);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching quiz results' });
  }
});

app.get('/api/leaderboard', requireAuth, async (req, res) => {
  try {
    const users = await User.find()
      .select('email completedCourses')
      .populate('completedCourses', 'title');
    
    const sortedUsers = users
      .map(user => ({
        username: user.email.split('@')[0],
        score: user.completedCourses.length
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    res.json(sortedUsers);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching leaderboard' });
  }
});

app.get('/api/user', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId)
      .select('email completedCourses readLessons passedQuizzes')
      .populate('completedCourses', 'title');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      username: user.email.split('@')[0],
      email: user.email,
      score: user.completedCourses.length,
      completedCourses: user.completedCourses,
      readLessonsCount: user.readLessons.length,
      passedQuizzesCount: user.passedQuizzes.length
    });
  } catch (error) {
    res.status(400).json({ error: 'Error fetching user info' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});