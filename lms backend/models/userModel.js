const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');

const crypto = require('crypto');

let userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },

  user_image: {
    type: String,
    default: "https://png.pngtree.com/png-vector/20190710/ourlarge/pngtree-user-vector-avatar-png-image_1541962.jpg"

  },

  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  roles: {
    type: String,
    default: "user"
  },

  profession: {
    type: String,
    required: true,
  },

  active:{
    type: Boolean,
    default: true,
    select:false

  },

  passwordHint: {
    type: Object,
    select: false
  },

  isBlocked: { // Use camelCase for consistency
    type: Boolean,
    default: false,
  },
  blockDetails: {
    reason: {
      type: String,
      validate: { // Add validation when blocked
        validator: function(v) {
          return !this.isBlocked || !!v;
        },
        message: 'Reason is required when blocking user'
      }
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: function(v) {
          return !this.isBlocked || !!v;
        },
        message: 'BlockedBy is required when blocking user'
      }
    },
    blockedAt: {
      type: Date,
      validate: {
        validator: function(v) {
          return !this.isBlocked || !!v;
        },
        message: 'BlockedAt is required when blocking user'
      }
    },
    blockExpires: {
      type: Date,
      validate: {
        validator: function(v) {
          return !this.isBlocked || !v || v > this.blockedAt;
        },
        message: 'Expiration must be after block time'
      }
    }
  },
  blockHistory: [{
    _id: false, // Disable automatic _id for subdocuments
    reason: String,
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    blockedAt: {
      type: Date,
      required: true
    },
    unblockedAt: Date,
    blockDuration: {
      type: Number,
      min: 0,
      default: 0 // 0 = permanent block
    }

  }],
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  stripe_account_id: String,
  stripe_seller: {},
  stripeSession: {},
}, {
  timestamps: true,


});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    // Generate password hint if not provided
    if (!this.passwordHint) {
      this.passwordHint = this.generatePasswordHint(this.password);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});
// Password comparison method
userSchema.methods.isPasswordMatch = async function(enteredPassword) {
  try {
    // Make sure password exists and is a string
    if (!this.password || !enteredPassword) {
      return false;
    }
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};
//any query satrt with find

userSchema.pre(/^find/, function (next) {

  this.find({active:{$ne:false}});
  next()
})




userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex")
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken)
    .digest("hex")
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; //10 minutes
  return resetToken
}


userSchema.methods.generatePasswordHint = function(password) {
  if (!password) return null;

  // Get password characteristics
  const length = password.length;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  // Show first 3 characters and mask the rest
  const firstChars = password.substring(0, 3);
  const maskedPart = '*'.repeat(length - 3);

  // Create additional hint about password composition
  let composition = [];
  if (hasUppercase) composition.push('uppercase');
  if (hasLowercase) composition.push('lowercase');
  if (hasNumbers) composition.push('numbers');
  if (hasSpecial) composition.push('special characters');

  // Combine the hints
  return {
    preview: firstChars + maskedPart,
    length: length,
    composition: composition
  };
};


userSchema.virtual('blockStatus').get(function() {
  if (!this.isBlocked) return 'active';
  if (this.blockDetails.blockExpires && this.blockDetails.blockExpires < new Date()) {
    return 'expired_block';
  }
  return 'blocked';
});

module.exports = mongoose.model("User", userSchema)