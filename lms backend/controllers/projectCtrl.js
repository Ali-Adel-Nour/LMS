const Project = require('../models/projectModel');
const { createOne, updateOne, deleteOne, getOne, getAll } = require('./customCtrl');

const createProject = createOne(Project);
const updateProject = updateOne(Project);
const deleteProject = deleteOne(Project);
const getProject = getOne(Project);
const getAllProjects = getAll(Project);
module.exports = {
    createProject,
    updateProject,
    deleteProject,
    getProject,
    getAllProjects
};