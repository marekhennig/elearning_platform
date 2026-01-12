import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  magicLinkToken: String,
  magicLinkExpires: Date,
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  completedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  readLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  passedQuizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }]
});

userSchema.virtual('username').get(function() {
  return this.email.split('@')[0];
});

userSchema.virtual('score').get(function() {
  return this.completedCourses.length;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export const User = mongoose.model('User', userSchema);