const mongoose = require('mongoose');

const bcrypt = require('bcrypt');

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

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next()
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt)
  next()
})
//any query satrt with find

userSchema.pre(/^find/, function (next) {

  this.find({active:{$ne:false}});
  next()
})

userSchema.methods.isPasswordMatch = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}


userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex")
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken)
    .digest("hex")
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; //10 minutes
  return resetToken
}


userSchema.virtual('blockStatus').get(function() {
  if (!this.isBlocked) return 'active';
  if (this.blockDetails.blockExpires && this.blockDetails.blockExpires < new Date()) {
    return 'expired_block';
  }
  return 'blocked';
});

module.exports = mongoose.model("User", userSchema)