import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
    }],
    deadline: {
        type: Date,
        required: true,
    },
    progress: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

export default Project;