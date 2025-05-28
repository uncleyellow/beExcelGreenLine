require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const { GoogleAuth } = require('google-auth-library');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const DEFAULT_SHEET_ID = '1fzOKalqFGruLHZUHhPwQHeorDZonL2r1daeq3ny8je8';

// Function to initialize Google Sheets with credentials
const initializeGoogleSheets = async () => {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: './credential.json',
            scopes: SCOPES,
        });
        return {
            sheets: google.sheets({ version: 'v4', auth }),
            sheetId: DEFAULT_SHEET_ID
        };
    } catch (error) {
        console.error('Error initializing Google Sheets:', error);
        throw error;
    }
};

/**
 * 📌 API: Gửi dữ liệu vào bảng "Contact"
 */
app.post('/api/contact', async (req, res) => {
    try {
        const { fullName, email, message } = req.body;
        const id = uuidv4();
        const createdAt = new Date().toISOString();

        const { sheets, sheetId } = await initializeGoogleSheets();

        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
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
 * 📌 API: Gửi dữ liệu vào bảng "Contact_customer"
 */
app.post('/api/contact_customer', async (req, res) => {
    try {
        const { fullName, email,kind, number,message } = req.body;
        const id = uuidv4();
        const createdAt = new Date().toISOString();

        const { sheets, sheetId } = await initializeGoogleSheets();

        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: 'Contact_customer!A:G',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [[id, fullName, email, kind, number,message, createdAt]],
            },
        });

        res.json({ message: 'Gửi thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi gửi dữ liệu' });
    }
});

/**
 * 📌 API: Lấy dữ liệu từ bảng "Welcome"
 */
app.get('/api/welcome', async (req, res) => {
    try {
        const { sheets, sheetId } = await initializeGoogleSheets();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'Welcome!A:C',
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Không có dữ liệu' });
        }

        const newsData = rows.map(row => ({
            id: row[0] || '',
            shortContent: row[1] || '',
            title: row[2] || '',
        }));

        res.json(newsData);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu từ bảng News:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu' });
    }
});

/**
 * 📌 API: Lấy dữ liệu từ bảng "Pricing"
 */
app.get('/api/pricing', async (req, res) => {
    try {
        const { sheets, sheetId } = await initializeGoogleSheets();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'Pricing!A:E',
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Không có dữ liệu' });
        }

        const newsData = rows.map(row => ({
            id: row[0] || '',
            content: row[1] || '',
            kind: row[2] || '',
            money: row[3] || '',
            notes: row[4] || '',
        }));

        res.json(newsData);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu từ bảng Pricing:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu' });
    }
});


/**
 * 📌 API: Lấy dữ liệu từ bảng "Solutions"
 */
app.get('/api/solutions', async (req, res) => {
    try {
        const { sheets, sheetId } = await initializeGoogleSheets();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'Solutions!A:C',
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Không có dữ liệu' });
        }

        const newsData = rows.map(row => ({
            id: row[0] || '',
            content: row[1] || '',
            kind: row[2] || '',
        }));

        res.json(newsData);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu từ bảng solutions:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu' });
    }
});

/**
 * 📌 API: Lấy dữ liệu từ bảng "Dashboard"
 */
app.get('/api/dashboard', async (req, res) => {
    try {
        const { sheets, sheetId } = await initializeGoogleSheets();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'Dashboard!A:E',
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Không có dữ liệu' });
        }

        const newsData = rows.map(row => ({
            container: row[0] || '',
            customer: row[1] || '',
            client: row[2] || '',
            rent: row[3] || '',
            support: row[4] || '',
        }));

        res.json(newsData);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu từ bảng Dashboard:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu' });
    }
});

/**
 * 📌 API: Lấy dữ liệu từ bảng "News"
 */
app.get('/api/news', async (req, res) => {
    try {
        const { sheets, sheetId } = await initializeGoogleSheets();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'News!A2:F',
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Không có dữ liệu' });
        }

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
    console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
});
