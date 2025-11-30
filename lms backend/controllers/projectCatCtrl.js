const ProjectCategory = require('../models/projectCatModel');
const { createOne, updateOne, deleteOne, getOne, getAll } = require('./customCtrl');

const createProjectCategory = createOne(ProjectCategory);
const updateProjectCategory = updateOne(ProjectCategory);
const deleteProjectCategory = deleteOne(ProjectCategory);
const getProjectCategory = getOne(ProjectCategory);
const getAllProjectCategories = getAll(ProjectCategory);

module.exports = {
    createProjectCategory,
    updateProjectCategory,
    deleteProjectCategory,
    getProjectCategory,
    getAllProjectCategories
};