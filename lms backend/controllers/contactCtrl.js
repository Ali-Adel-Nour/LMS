const Contact = require('../models/contactModel');
const User = require ('../models/userModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');



const createContact = asyncHandler(async (req, res) => {

const contact =  await Contact.create(req.body)


res.status(200).json({
  status: true,
  message: 'Contact Form Submmited Successfully',
})

})


const getAllContacts = asyncHandler(async(req,res)=>{
  const contacts =await Contact.find()

  if(!contacts){
    res.status(404).json({
      status:false,
      message:'Contact Not Found'
    })
  }

  res.status(200).json({
    status: true,
    message: 'Contacts Fetched Successfully',
    contacts,
  })
})


const getSingleContact = asyncHandler(async (req, res) => {
  const {id} = req.params;
  validateMongodbId(id);

  const contact =  await Contact.findById(id)

  if(!contact){
    res.status(404).json({
      status:false,
      message:'Contact Not Found'
    })
  }

  res.status(200).json({
    status: true,
    message: ' Fetched Successfully',
   contact,
  })

  })



const updateContact = asyncHandler(async (req, res) => {
  const {id} = req.params;
  validateMongodbId(id);

  const contact =  await Contact.findByIdAndUpdate(id,req.body,{new:true})

  if(!contact){
    res.status(404).json({
      status:false,
      message:'Contact Not Found'
    })
  }

  res.status(200).json({
    status: true,
    message: 'Contact Updated Successfully',
   contact,
  })

  })



  const deleteContact = asyncHandler(async (req, res) => {
    const {id} = req.params;
    validateMongodbId(id);

    const contact =  await Contact.findByIdAndDelete(id)


    if(!contact){
      res.status(404).json({
        status:false,
        message:'Contact Not Found'
      })
    }

    res.status(200).json({
      status: true,
      message: 'Contact Deleted Successfully',
  contact,
    })

    })

    module.exports = {
      createContact,
      getAllContacts,
      getSingleContact,
      updateContact,
      deleteContact

    }