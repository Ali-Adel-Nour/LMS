const Contact = require('../models/contactModel');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');



const createContact = asyncHandler(async (req, res) => {

  const contact = await Contact.create(req.body)


  res.status(200).json({
    status: true,
    message: 'Contact Form Submmited Successfully',
  })

})


const getAllContacts = asyncHandler(async (req, res) => {

  let = { page, size } = req.query;

  if (!page) {
    page = 1;
  }
  if (!size) {
    size = 10;
  }

  const limit = parseInt(size);
  const skip = (page - 1) * size;


  const contacts = await Contact.find().limit(limit).skip(skip)

  if (!contacts) {
    res.status(404).json({
      status: false,
      message: 'Contact Not Found'
    })
  }

  res.status(200).json({
    status: true,
    page,size,
    message: 'Contacts Fetched Successfully',
    contacts,
  })
})


const getSingleContact = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const contact = await Contact.findById(id)

  if (!contact) {
    res.status(404).json({
      status: false,
      message: 'Contact Not Found'
    })
  }

  res.status(200).json({
    status: true,
    message: ' Fetched Successfully',
    contact,
  })

})



const updateContact = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const contact = await Contact.findByIdAndUpdate(id, req.body, { new: true })

  if (!contact) {
    res.status(404).json({
      status: false,
      message: 'Contact Not Found'
    })
  }

  res.status(200).json({
    status: true,
    message: 'Contact Updated Successfully',
    contact,
  })

})



const deleteContact = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const contact = await Contact.findByIdAndDelete(id)


  if (!contact) {
    res.status(404).json({
      status: false,
      message: 'Contact Not Found'
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