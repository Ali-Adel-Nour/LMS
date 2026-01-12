const mongoose = require('mongoose');

const bookSessionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
            index: true,
        },
        mobile: {
            type: String,
            required: [true, 'Mobile number is required'],
            trim: true,
        },
        subject: {
            type: String,
            required: [true, 'Subject is required'],
            trim: true,
        },
        desc: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters']
        },
        // Structured date/time instead of just string
        sessionDate: {
            type: Date,
            required: [true, 'Session date is required'],
            index: true,
        },
        timeslot: {
            type: String,
            required: [true, 'Time slot is required'],
            
        },
        duration: {
            type: Number,
            default: 60, 
            min: [15, 'Duration must be at least 15 minutes']
        },
        status: {
            type: String,
            enum: {
                values: ['Requested', 'Confirmed', 'Completed', 'Cancelled', 'Rejected'],
                message: '{VALUE} is not a valid status'
            },
            default: 'Requested',
            index: true,
        },
       
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
     
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        // Track status changes
        confirmedAt: Date,
        completedAt: Date,
        cancelledAt: Date,
        cancellationReason: String,
        // Admin/instructor notes
        notes: {
            type: String,
            maxlength: [1000, 'Notes cannot exceed 1000 characters']
        },
        // Meeting link for online sessions
        meetingLink: String,
    },
    {
        timestamps: true,
    }
);

// Indexes for common queries
bookSessionSchema.index({ sessionDate: 1, status: 1 });
bookSessionSchema.index({ email: 1, sessionDate: 1 });

// Virtual for checking if session is upcoming
bookSessionSchema.virtual('isUpcoming').get(function() {
    return this.sessionDate > new Date() && this.status === 'Confirmed';
});

// Method to cancel session
bookSessionSchema.methods.cancel = function(reason) {
    this.status = 'Cancelled';
    this.cancelledAt = new Date();
    if (reason) this.cancellationReason = reason;
    return this.save();
};

// Auto-populate user and instructor on find queries
bookSessionSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: 'firstname lastname email mobile'
    }).populate({
        path: 'instructor',
        select: 'firstname lastname email mobile profession'
    });
    next();
});

module.exports = mongoose.model("BookSession", bookSessionSchema);