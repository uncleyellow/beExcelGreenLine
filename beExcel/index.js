require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid'); // Thư viện UUID
const { GoogleAuth } = require('google-auth-library');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SHEET_ID = process.env.SHEET_ID;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// const auth = new google.auth.GoogleAuth({
//     keyFile: './keyExcel/credential.json',
//     scopes: SCOPES,
// });
// Chuyển GOOGLE_CREDENTIALS từ JSON string thành Object
const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const auth = new GoogleAuth({
    credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key.replace(/\\n/g, "\n"),  // Fix lỗi xuống dòng trong Private Key
    },
    scopes: SCOPES,
});
const sheets = google.sheets({ version: 'v4', auth });

/**
 * 📌 API: Gửi dữ liệu vào bảng "Contact"
 */
app.post('/api/contact', async (req, res) => {
    try {
        const { fullName, email, message } = req.body;
        const id = uuidv4(); // Tạo ID GUID
        const createdAt = new Date().toISOString();

        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'Contact!A:E',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [[id, fullName, email, message, createdAt]],
            },
        });

        res.json({ message: 'Gửi thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi gửi dữ liệu' });
    }
});

/**
 * 📌 API: Lấy dữ liệu từ bảng "News"
 */
app.get('/api/news', async (req, res) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: 'News!A2:F', // Lấy dữ liệu từ bảng "News" bắt đầu từ dòng 2 (bỏ qua tiêu đề)
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Không có dữ liệu' });
        }

        // Chuyển dữ liệu thành JSON
        const newsData = rows.map(row => ({
            id: row[0] || '',
            imageUrl: row[1] || '',
            title: row[2] || '',
            shortContent: row[3] || '',
            fullContent: row[4] || '',
            createdAt: row[5] || '',
        }));

        res.json(newsData);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu từ bảng News:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});
