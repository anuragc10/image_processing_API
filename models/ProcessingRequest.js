const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    serialNumber: Number,
    productName: String,
    inputImageUrls: [String],
    outputImageUrls: [String], // Compressed image URLs stored here
});

const ProcessingRequestSchema = new mongoose.Schema({
    requestId: String,
    status: String,
    products: [ProductSchema],
});

module.exports = mongoose.model('ProcessingRequest', ProcessingRequestSchema);
