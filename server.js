require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');
const sharp = require('sharp');
const ProcessingRequest = require('./models/ProcessingRequest');

const app = express();
app.use(bodyParser.json());

// 📂 Ensure required directories exist
const compressedDir = path.join(__dirname, 'compressed');
const uploadsDir = path.join(__dirname, 'uploads');
[compressedDir, uploadsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📂 Created directory: ${dir}`);
    }
});

// 🌐 Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// 📤 Multer for CSV file uploads
const upload = multer({ dest: 'uploads/' });

// 🌐 Validate URL
const isValidURL = (url) => {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
};

// 📤 Upload API with Compression
app.post('/upload', upload.single('file'), async (req, res) => {
  console.log('✅ Upload API called');

  try {
      if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
      }

      if (req.file.mimetype !== 'text/csv') {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ message: 'Invalid file type. Please upload a CSV file.' });
      }

      const filePath = req.file.path;
      const products = [];
      const requestId = uuidv4();
      let isValidFormat = true;

      const csvData = [];

      // 📂 Read and Parse CSV
      fs.createReadStream(filePath)
          .pipe(csv())
          .on('headers', (headers) => {
              const expectedHeaders = ['S. No.', 'Product Name', 'Input Image Urls'];
              const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));

              if (missingHeaders.length > 0) {
                  isValidFormat = false;
                  res.status(400).json({ message: `Missing required headers: ${missingHeaders.join(', ')}` });
                  fs.unlinkSync(filePath);
              }
          })
          .on('data', (row) => {
              if (!isValidFormat) return;
              csvData.push(row); // Collect all rows first
          })
          .on('end', async () => {
              if (!isValidFormat) return;
              console.log('📂 CSV Data Parsed:', csvData);

              // Process each row
              for (const row of csvData) {
                  const { 'S. No.': serialNumber, 'Product Name': productName, 'Input Image Urls': inputImageUrls } = row;

                  if (!serialNumber || !productName || !inputImageUrls) {
                      isValidFormat = false;
                      res.status(400).json({ message: 'CSV contains empty fields' });
                      fs.unlinkSync(filePath);
                      return;
                  }

                  const imageUrls = inputImageUrls.split(',').map(url => url.trim());
                  const invalidUrls = imageUrls.filter(url => !isValidURL(url));

                  if (invalidUrls.length > 0) {
                      isValidFormat = false;
                      res.status(400).json({ message: `Invalid image URLs: ${invalidUrls.join(', ')}` });
                      fs.unlinkSync(filePath);
                      return;
                  }

                  // 🔥 Compressing Images & Storing in DB
                  const compressedImageUrls = await Promise.all(imageUrls.map(async (url, index) => {
                      try {
                          const response = await axios({ url, responseType: 'arraybuffer' });
                          const imageBuffer = Buffer.from(response.data, 'binary');

                          const compressedImagePath = path.join(compressedDir, `${productName}_${index + 1}.jpg`);

                          await sharp(imageBuffer)
                              .jpeg({ quality: 50 }) // 💡 Compress to 50% quality
                              .toFile(compressedImagePath);

                          console.log(`✅ Compressed: ${compressedImagePath}`);
                          return `http://localhost:${process.env.PORT}/compressed/${productName}_${index + 1}.jpg`;

                      } catch (error) {
                          console.error('❌ Error compressing image:', error);
                          return null;
                      }
                  }));

                  products.push({
                      serialNumber: parseInt(serialNumber, 10),
                      productName,
                      inputImageUrls: imageUrls,
                      outputImageUrls: compressedImageUrls.filter(Boolean),
                  });
              }

              console.log('📦 Products Prepared:', products);

              const newRequest = new ProcessingRequest({
                  requestId,
                  status: 'Implemented',
                  products,
              });

              await newRequest.save();
              console.log('✅ Saved to DB:', newRequest);

              res.status(200).json({ requestId });
              fs.unlinkSync(filePath);
          });

  } catch (error) {
      console.error('❌ Error processing file:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// 🌐 Serve Compressed Images
app.get('/compressed/:imageName', (req, res) => {
    const imagePath = path.join(compressedDir, req.params.imageName);
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).json({ message: 'Image not found' });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`🚀 Server is running on port ${process.env.PORT}`);
});
