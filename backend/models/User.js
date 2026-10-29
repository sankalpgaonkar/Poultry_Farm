const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  // A user signs up with an email OR a mobile number, so neither is required on its own.
  email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
  phone: { type: String, trim: true, unique: true, sparse: true },
  password: { type: String, required: true },
  // Admin accounts cannot be created through signup; only the demo seed (or a DB operator) creates them.
  role: { type: String, enum: ['Farmer', 'Buyer', 'Admin'], required: true },
}, { timestamps: true });

userSchema.pre('validate', function () {
  if (!this.email && !this.phone) this.invalidate('email', 'An email address or mobile number is required');
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Never send password hashes to the client, even by accident.
userSchema.set('toJSON', { transform: (_doc, ret) => { delete ret.password; return ret; } });

module.exports = mongoose.model('User', userSchema);
