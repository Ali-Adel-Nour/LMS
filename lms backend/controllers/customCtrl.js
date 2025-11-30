const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');
const ApiFeatures = require('../utils/apiFeatures');

const createOne = (Model) =>  {
    return asyncHandler(async (req, res) => {
        try{
            const data = await Model.create(req.body);
            res.status(200).json({status:true,message:"Created successfully"});
        } catch (error) {
            throw new Error(error);  
        }
    });
};

const updateOne = (Model) => {
    return asyncHandler(async (req, res) => {
        const { id } = req.params;
        validateMongodbId(id);
        try {
            const updatedData = await Model.findByIdAndUpdate(id, req.body, { new: true });
            res.status(200).json({status:true,message:"Updated successfully"});
        } catch (error) {
            throw new Error(error);
        }
    });
};

const deleteOne = (Model) => {
    return asyncHandler(async (req, res) => {
        const { id } = req.params;
        validateMongodbId(id);
        try {
            const deletedData = await Model.findByIdAndDelete(id);
            res.status(200).json({status:true,message:"Deleted successfully"});
        } catch (error) {
            throw new Error(error);
        }   
    });
};

const getOne = (Model) => {
    return asyncHandler(async (req, res) => {
        const { id } = req.params;  
        validateMongodbId(id);
        try {
            const data = await Model.findById(id);
            res.status(200).json({status:true,data});
        } catch (error) {
            throw new Error(error);
        }
    });
};

const getAll = (Model) => {
    return asyncHandler(async (req, res) => {
        try {   
            // Create filter query for counting
            const queryObj = {...req.query};
            const excludedFields = ['page', 'sort', 'limit', 'fields'];
            excludedFields.forEach(el => delete queryObj[el]);
            let queryStr = JSON.stringify(queryObj);
            queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
            
            // Get total count with filters
            const totalCount = await Model.countDocuments(JSON.parse(queryStr));
            
            // Get paginated data
            const apiFeatures = new ApiFeatures(Model.find(), req.query)
                .filter()
                .sort()
                .limitFields()
                .paginate();
            const data = await apiFeatures.query;
            const paginationInfo = apiFeatures.GetPaginationInfo(totalCount);
            res.status(200).json({status:true, totalCount, paginationInfo, data});
        } catch (error) {
            throw new Error(error);
        }
    });
};  

module.exports = {
    createOne,
    updateOne,  
    deleteOne,
    getOne,
    getAll,
};