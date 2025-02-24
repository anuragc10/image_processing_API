# 📷 Image Processing System

The **Image Processing System** is a Node.js-based application that allows users to upload CSV files containing product information and image URLs, validates the data, processes the images by compressing them, and provides status updates via RESTful APIs. The system uses asynchronous workers for efficient image processing and offers a way to check the status of requests through unique request IDs.

---

## 🚀 Features

- **CSV Upload:** Accepts CSV files with product information and image URLs.
- **Validation:** Checks for required headers, empty fields, and valid image URLs.
- **Asynchronous Image Processing:** Compresses images to 50% quality using `sharp`.
- **Status Check:** Query processing status using a unique request ID.
- **Image Redirection:** Redirects to the processed/compressed image URL.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Image Processing:** `sharp` library
- **File Handling:** `multer` for file uploads
- **CSV Parsing:** `csv-parser`
- **Asynchronous Processing:** Node.js workers

---

## 💂️ Setup and Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/image-processing-system.git
cd image-processing-system
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment variables:**  
Create a `.env` file with:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
```

4. **Run the server:**
```bash
npm start
```

5. **Start the worker:**
```bash
node workers/imageProcessor.js
```

---

## 👀 API Endpoints

### 1. **Upload API**
**Endpoint:** `POST /upload`  
**Description:** Accepts a CSV file and returns a unique request ID.

#### Request:
- **Method:** `POST`
- **Form Data:**
  - `file`: CSV file with columns `S. No.`, `Product Name`, `Input Image Urls`

#### Response:
- **200:** `{ "requestId": "<unique_request_id>" }`
- **400:** For invalid file types, missing headers, or invalid image URLs.
- **500:** Internal server errors.

#### Example:
```bash
curl -X POST -F 'file=@products.csv' http://localhost:3000/upload
```

---

### 2. **Status API**
**Endpoint:** `GET /status/:requestId`  
**Description:** Checks the processing status using the provided request ID.

#### Request:
- **Method:** `GET`
- **Parameters:** `requestId` - Unique ID returned by the upload API.

#### Response:
- **200:** `{ "status": "Pending|Implemented" }`
- **404:** If the request ID is not found.
- **500:** Internal server errors.

#### Example:
```bash
curl http://localhost:3000/status/3363c43c-68e9-49b6-8926-c014a35650f6
```

---

### 3. **Image Redirect API**
**Endpoint:** `GET /processed_images/:imageName`  
**Description:** Redirects to the original/compressed image using the image name.

#### Request:
- **Method:** `GET`
- **Parameters:** `imageName` - Image file name in `<ProductName>_<ImageIndex>.jpg` format.

#### Response:
- **302:** Redirects to the image URL.
- **404:** If the image is not found.
- **500:** Internal server errors.

#### Example:
```bash
curl -L http://localhost:3000/processed_images/SKU1_1.jpg
```

---

## 🔄 Asynchronous Workers

### **Image Processing Worker**

**Function:**  
- Compresses images to 50% of their original quality.
- Updates the database with processed image URLs.

**Workflow:**  
- Listens for new upload requests with status `Pending`.
- Downloads images using URLs from the `ProcessingRequest` collection.
- Compresses images using the `sharp` library.
- Updates the database status to `Implemented` with the processed image URLs.

---

## 🚦 Testing with Postman

1. **Import the provided Postman collection.**
2. **Set the `requestId` and `imageName` variables in Postman.**
3. **Test the APIs using the predefined requests.**

---

## 🔍 Future Enhancements

- Add authentication and authorization.
- Implement image transformation options (e.g., resizing, watermarking).
- Introduce rate limiting and file size restrictions.

---

## ✨ Contributing

Contributions are welcome!  
Feel free to open issues or submit pull requests to improve the system.

## Images
<img width="1262" alt="image" src="https://github.com/user-attachments/assets/086199db-13dc-4fbf-b611-3fb2c7e08261" />
<img width="1098" alt="image" src="https://github.com/user-attachments/assets/a227e457-edb6-47d1-8412-ed2a90715dde" />


## Server Response 
<img width="1116" alt="image" src="https://github.com/user-attachments/assets/6a8c75a7-d5c2-447e-9ff9-957391350871" />



