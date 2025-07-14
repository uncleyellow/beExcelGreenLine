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
// app.use(cors());
app.use(cors({
    origin: ['http://localhost:4200', 'https://beexcelgreenline.onrender.com','https://greenlinegr.netlify.app','https://nrgreenlines.com.vn','https://api.nrgreenlines.com.vn'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
app.use(bodyParser.json());

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const DEFAULT_SHEET_ID = '1fzOKalqFGruLHZUHhPwQHeorDZonL2r1daeq3ny8je8';

// Function to initialize Google Sheets with credentials
const initializeGoogleSheets = async () => {
    try {
        const credentials = {
            type: process.env.GOOGLE_TYPE,
            project_id: process.env.GOOGLE_PROJECT_ID,
            private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            client_id: process.env.GOOGLE_CLIENT_ID,
            auth_uri: process.env.GOOGLE_AUTH_URI,
            token_uri: process.env.GOOGLE_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
            client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
            universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN
        };

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: SCOPES,
        });
        return {
            sheets: google.sheets({ version: 'v4', auth }),
            sheetId: process.env.SHEET_ID || DEFAULT_SHEET_ID
        };
    } catch (error) {
        console.error('Error initializing Google Sheets:', error);
        throw error;
    }
};

// Helper function to handle sheet operations
const handleSheetOperation = async (operation, range, values = null, updateRange = null) => {
    const { sheets, sheetId } = await initializeGoogleSheets();
    
    if (operation === 'get') {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: range,
        });
        return response.data.values;
    } else if (operation === 'append') {
        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: range,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [values] },
        });
        return true;
    } else if (operation === 'update') {
        await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: updateRange,
            valueInputOption: 'RAW',
            requestBody: { values: [values] },
        });
        return true;
    } else if (operation === 'delete') {
        // For delete operation, we'll clear the row
        await sheets.spreadsheets.values.clear({
            spreadsheetId: sheetId,
            range: updateRange,
        });
        return true;
    }
};

// Vietnamese APIs
// Contact APIs
app.post('/api/contact', async (req, res) => {
    try {
        const { fullName, email, message } = req.body;
        const id = uuidv4();
        const createdAt = new Date().toISOString();

        await handleSheetOperation('append', 'Contact!A:E', [id, fullName, email, message, createdAt]);
        res.json({ message: 'Gửi thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi gửi dữ liệu' });
    }
});

app.get('/api/contact', async (req, res) => {
    try {
        const rows = await handleSheetOperation('get', 'Contact!A:E');
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Không có dữ liệu' });
        }

        const contacts = rows.map(row => ({
            id: row[0] || '',
            fullName: row[1] || '',
            email: row[2] || '',
            message: row[3] || '',
            createdAt: row[4] || '',
        }));

        res.json(contacts);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu' });
    }
});

app.put('/api/contact/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, message } = req.body;
        const rows = await handleSheetOperation('get', 'Contact!A:E');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
        }

        const updatedRow = [id, fullName, email, message, rows[rowIndex][4]];
        await handleSheetOperation('update', null, updatedRow, `Contact!A${rowIndex + 1}:E${rowIndex + 1}`);
        res.json({ message: 'Cập nhật thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu' });
    }
});

app.delete('/api/contact/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await handleSheetOperation('get', 'Contact!A:E');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
        }

        await handleSheetOperation('delete', null, null, `Contact!A${rowIndex + 1}:E${rowIndex + 1}`);
        res.json({ message: 'Xóa thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi xóa dữ liệu' });
    }
});

// Contact Customer APIs
app.post('/api/contact_customer', async (req, res) => {
    try {
        const { fullName, email, phone,services,kind, number, message } = req.body;
        const id = uuidv4();
        const createdAt = new Date().toISOString();

        await handleSheetOperation('append', 'Contact_customer!A:I', [id, fullName, email, phone,services,kind, number, message, createdAt]);
        res.json({ message: 'Gửi thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi gửi dữ liệu' });
    }
});

app.get('/api/contact_customer', async (req, res) => {
    try {
        const rows = await handleSheetOperation('get', 'Contact_customer!A:G');
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Không có dữ liệu' });
        }

        const customers = rows.map(row => ({
            id: row[0] || '',
            fullName: row[1] || '',
            email: row[2] || '',
            phone: row[3] || '',
            services: row[4] || '',
            kind: row[5] || '',
            number: row[6] || '',
            message: row[7] || '',
            createdAt: row[8] || '',
        }));

        res.json(customers);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu' });
    }
});

app.put('/api/contact_customer/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email,phone,services, kind, number, message } = req.body;
        const rows = await handleSheetOperation('get', 'Contact_customer!A:G');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
        }

        const updatedRow = [id, fullName, email,phone,services, kind, number, message, rows[rowIndex][6]];
        await handleSheetOperation('update', null, updatedRow, `Contact_customer!A${rowIndex + 1}:G${rowIndex + 1}`);
        res.json({ message: 'Cập nhật thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu' });
    }
});

app.delete('/api/contact_customer/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await handleSheetOperation('get', 'Contact_customer!A:I');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
        }

        await handleSheetOperation('delete', null, null, `Contact_customer!A${rowIndex + 1}:G${rowIndex + 1}`);
        res.json({ message: 'Xóa thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi xóa dữ liệu' });
    }
});

// Welcome APIs
app.get('/api/welcome', async (req, res) => {
    try {
        const rows = await handleSheetOperation('get', 'Welcome!A:C');
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Không có dữ liệu' });
        }

        const welcomeData = rows.map(row => ({
            id: row[0] || '',
            shortContent: row[1] || '',
            title: row[2] || '',
        }));

        res.json(welcomeData);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu' });
    }
});

app.post('/api/welcome', async (req, res) => {
    try {
        const { shortContent, title } = req.body;
        const id = uuidv4();

        await handleSheetOperation('append', 'Welcome!A:C', [id, shortContent, title]);
        res.json({ message: 'Thêm thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi thêm dữ liệu' });
    }
});

app.put('/api/welcome/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { shortContent, title } = req.body;
        const rows = await handleSheetOperation('get', 'Welcome!A:C');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
        }

        const updatedRow = [id, shortContent, title];
        await handleSheetOperation('update', null, updatedRow, `Welcome!A${rowIndex + 1}:C${rowIndex + 1}`);
        res.json({ message: 'Cập nhật thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu' });
    }
});

app.delete('/api/welcome/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await handleSheetOperation('get', 'Welcome!A:C');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
        }

        await handleSheetOperation('delete', null, null, `Welcome!A${rowIndex + 1}:C${rowIndex + 1}`);
        res.json({ message: 'Xóa thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi xóa dữ liệu' });
    }
});

// Pricing APIs
app.get('/api/pricing', async (req, res) => {
    try {
        const rows = await handleSheetOperation('get', 'Pricing!A:E');
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Không có dữ liệu' });
        }

        const pricingData = rows.map(row => ({
            id: row[0] || '',
            content: row[1] || '',
            kind: row[2] || '',
            money: row[3] || '',
            notes: row[4] || '',
        }));

        res.json(pricingData);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu' });
    }
});

app.post('/api/pricing', async (req, res) => {
    try {
        const { content, kind, money, notes } = req.body;
        const id = uuidv4();

        await handleSheetOperation('append', 'Pricing!A:E', [id, content, kind, money, notes]);
        res.json({ message: 'Thêm thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi thêm dữ liệu' });
    }
});

app.put('/api/pricing/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content, kind, money, notes } = req.body;
        const rows = await handleSheetOperation('get', 'Pricing!A:E');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
        }

        const updatedRow = [id, content, kind, money, notes];
        await handleSheetOperation('update', null, updatedRow, `Pricing!A${rowIndex + 1}:E${rowIndex + 1}`);
        res.json({ message: 'Cập nhật thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu' });
    }
});

app.delete('/api/pricing/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await handleSheetOperation('get', 'Pricing!A:E');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
        }

        await handleSheetOperation('delete', null, null, `Pricing!A${rowIndex + 1}:E${rowIndex + 1}`);
        res.json({ message: 'Xóa thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi xóa dữ liệu' });
    }
});

// Solutions APIs
app.get('/api/solutions', async (req, res) => {
    try {
        const rows = await handleSheetOperation('get', 'Services!A:C');
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Không có dữ liệu' });
        }

        const solutionsData = rows.map(row => ({
            id: row[0] || '',
            content: row[1] || '',
            kind: row[2] || '',
        }));

        res.json(solutionsData);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu' });
    }
});

app.post('/api/solutions', async (req, res) => {
    try {
        const { content, kind } = req.body;
        const id = uuidv4();

        await handleSheetOperation('append', 'Services!A:C', [id, content, kind]);
        res.json({ message: 'Thêm thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi thêm dữ liệu' });
    }
});

app.put('/api/solutions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content, kind } = req.body;
        const rows = await handleSheetOperation('get', 'Services!A:C');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
        }

        const updatedRow = [id, content, kind];
        await handleSheetOperation('update', null, updatedRow, `Services!A${rowIndex + 1}:C${rowIndex + 1}`);
        res.json({ message: 'Cập nhật thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu' });
    }
});

app.delete('/api/solutions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await handleSheetOperation('get', 'Services!A:C');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
        }

        await handleSheetOperation('delete', null, null, `Services!A${rowIndex + 1}:C${rowIndex + 1}`);
        res.json({ message: 'Xóa thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi xóa dữ liệu' });
    }
});

// Dashboard APIs
app.get('/api/dashboard', async (req, res) => {
    try {
        const rows = await handleSheetOperation('get', 'Dashboard!A:E');
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Không có dữ liệu' });
        }

        const dashboardData = rows.map(row => ({
            container: row[0] || '',
            customer: row[1] || '',
            client: row[2] || '',
            rent: row[3] || '',
            support: row[4] || '',
        }));

        res.json(dashboardData);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu' });
    }
});

app.post('/api/dashboard', async (req, res) => {
    try {
        const { container, customer, client, rent, support } = req.body;
        await handleSheetOperation('append', 'Dashboard!A:E', [container, customer, client, rent, support]);
        res.json({ message: 'Thêm thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi thêm dữ liệu' });
    }
});

app.put('/api/dashboard/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { container, customer, client, rent, support } = req.body;
        const rows = await handleSheetOperation('get', 'Dashboard!A:E');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
        }

        const updatedRow = [id, container, customer, client, rent, support];
        await handleSheetOperation('update', null, updatedRow, `Dashboard!A${rowIndex + 1}:E${rowIndex + 1}`);
        res.json({ message: 'Cập nhật thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu' });
    }
});

app.delete('/api/dashboard/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await handleSheetOperation('get', 'Dashboard!A:E');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
        }

        await handleSheetOperation('delete', null, null, `Dashboard!A${rowIndex + 1}:E${rowIndex + 1}`);
        res.json({ message: 'Xóa thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi xóa dữ liệu' });
    }
});

// News APIs
app.get('/api/news', async (req, res) => {
    try {
        const rows = await handleSheetOperation('get', 'News!A2:F');
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
        console.error('Lỗi khi lấy dữ liệu:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu' });
    }
});

app.post('/api/news', async (req, res) => {
    try {
        const { imageUrl, title, shortContent, fullContent } = req.body;
        const id = uuidv4();
        const createdAt = new Date().toISOString();

        await handleSheetOperation('append', 'News!A:F', [id, imageUrl, title, shortContent, fullContent, createdAt]);
        res.json({ message: 'Thêm thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi thêm dữ liệu' });
    }
});

app.put('/api/news/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { imageUrl, title, shortContent, fullContent } = req.body;
        const rows = await handleSheetOperation('get', 'News!A:F');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
        }

        const updatedRow = [id, imageUrl, title, shortContent, fullContent, rows[rowIndex][5]];
        await handleSheetOperation('update', null, updatedRow, `News!A${rowIndex + 1}:F${rowIndex + 1}`);
        res.json({ message: 'Cập nhật thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu' });
    }
});

app.delete('/api/news/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await handleSheetOperation('get', 'News!A:F');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
        }

        await handleSheetOperation('delete', null, null, `News!A${rowIndex + 1}:F${rowIndex + 1}`);
        res.json({ message: 'Xóa thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi xóa dữ liệu' });
    }
});

// English APIs
// Welcome English APIs
app.get('/api/welcome-eng', async (req, res) => {
    try {
        const rows = await handleSheetOperation('get', 'Welcome_ENG!A:C');
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'No data found' });
        }

        const welcomeData = rows.map(row => ({
            id: row[0] || '',
            shortContent: row[1] || '',
            title: row[2] || '',
        }));

        res.json(welcomeData);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.post('/api/welcome-eng', async (req, res) => {
    try {
        const { shortContent, title } = req.body;
        const id = uuidv4();

        await handleSheetOperation('append', 'Welcome_ENG!A:C', [id, shortContent, title]);
        res.json({ message: 'Added successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding data' });
    }
});

app.put('/api/welcome-eng/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { shortContent, title } = req.body;
        const rows = await handleSheetOperation('get', 'Welcome_ENG!A:C');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Data not found' });
        }

        const updatedRow = [id, shortContent, title];
        await handleSheetOperation('update', null, updatedRow, `Welcome_ENG!A${rowIndex + 1}:C${rowIndex + 1}`);
        res.json({ message: 'Updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating data' });
    }
});

app.delete('/api/welcome-eng/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await handleSheetOperation('get', 'Welcome_ENG!A:C');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Data not found' });
        }

        await handleSheetOperation('delete', null, null, `Welcome_ENG!A${rowIndex + 1}:C${rowIndex + 1}`);
        res.json({ message: 'Deleted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting data' });
    }
});

// Pricing English APIs
app.get('/api/pricing-eng', async (req, res) => {
    try {
        const rows = await handleSheetOperation('get', 'Pricing_ENG!A:E');
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'No data found' });
        }

        const pricingData = rows.map(row => ({
            id: row[0] || '',
            content: row[1] || '',
            kind: row[2] || '',
            money: row[3] || '',
            notes: row[4] || '',
        }));

        res.json(pricingData);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.post('/api/pricing-eng', async (req, res) => {
    try {
        const { content, kind, money, notes } = req.body;
        const id = uuidv4();

        await handleSheetOperation('append', 'Pricing_ENG!A:E', [id, content, kind, money, notes]);
        res.json({ message: 'Added successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding data' });
    }
});

app.put('/api/pricing-eng/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content, kind, money, notes } = req.body;
        const rows = await handleSheetOperation('get', 'Pricing_ENG!A:E');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Data not found' });
        }

        const updatedRow = [id, content, kind, money, notes];
        await handleSheetOperation('update', null, updatedRow, `Pricing_ENG!A${rowIndex + 1}:E${rowIndex + 1}`);
        res.json({ message: 'Updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating data' });
    }
});

app.delete('/api/pricing-eng/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await handleSheetOperation('get', 'Pricing_ENG!A:E');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Data not found' });
        }

        await handleSheetOperation('delete', null, null, `Pricing_ENG!A${rowIndex + 1}:E${rowIndex + 1}`);
        res.json({ message: 'Deleted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting data' });
    }
});

// Solutions English APIs
app.get('/api/solutions-eng', async (req, res) => {
    try {
        const rows = await handleSheetOperation('get', 'Services_ENG!A:C');
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'No data found' });
        }

        const solutionsData = rows.map(row => ({
            id: row[0] || '',
            content: row[1] || '',
            kind: row[2] || '',
        }));

        res.json(solutionsData);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.post('/api/solutions-eng', async (req, res) => {
    try {
        const { content, kind } = req.body;
        const id = uuidv4();

        await handleSheetOperation('append', 'Services_ENG!A:C', [id, content, kind]);
        res.json({ message: 'Added successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding data' });
    }
});

app.put('/api/solutions-eng/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content, kind } = req.body;
        const rows = await handleSheetOperation('get', 'Services_ENG!A:C');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Data not found' });
        }

        const updatedRow = [id, content, kind];
        await handleSheetOperation('update', null, updatedRow, `Services_ENG!A${rowIndex + 1}:C${rowIndex + 1}`);
        res.json({ message: 'Updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating data' });
    }
});

app.delete('/api/solutions-eng/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await handleSheetOperation('get', 'Services_ENG!A:C');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Data not found' });
        }

        await handleSheetOperation('delete', null, null, `Services_ENG!A${rowIndex + 1}:C${rowIndex + 1}`);
        res.json({ message: 'Deleted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting data' });
    }
});

// Dashboard English APIs
app.get('/api/dashboard-eng', async (req, res) => {
    try {
        const rows = await handleSheetOperation('get', 'Dashboard_ENG!A:E');
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'No data found' });
        }

        const dashboardData = rows.map(row => ({
            container: row[0] || '',
            customer: row[1] || '',
            client: row[2] || '',
            rent: row[3] || '',
            support: row[4] || '',
        }));

        res.json(dashboardData);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.post('/api/dashboard-eng', async (req, res) => {
    try {
        const { container, customer, client, rent, support } = req.body;
        await handleSheetOperation('append', 'Dashboard_ENG!A:E', [container, customer, client, rent, support]);
        res.json({ message: 'Added successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding data' });
    }
});

app.put('/api/dashboard-eng/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { container, customer, client, rent, support } = req.body;
        const rows = await handleSheetOperation('get', 'Dashboard_ENG!A:E');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Data not found' });
        }

        const updatedRow = [id, container, customer, client, rent, support];
        await handleSheetOperation('update', null, updatedRow, `Dashboard_ENG!A${rowIndex + 1}:E${rowIndex + 1}`);
        res.json({ message: 'Updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating data' });
    }
});

app.delete('/api/dashboard-eng/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await handleSheetOperation('get', 'Dashboard_ENG!A:E');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Data not found' });
        }

        await handleSheetOperation('delete', null, null, `Dashboard_ENG!A${rowIndex + 1}:E${rowIndex + 1}`);
        res.json({ message: 'Deleted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting data' });
    }
});

// News English APIs
app.get('/api/news-eng', async (req, res) => {
    try {
        const rows = await handleSheetOperation('get', 'News_ENG!A2:F');
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'No data found' });
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
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.post('/api/news-eng', async (req, res) => {
    try {
        const { imageUrl, title, shortContent, fullContent } = req.body;
        const id = uuidv4();
        const createdAt = new Date().toISOString();

        await handleSheetOperation('append', 'News_ENG!A:F', [id, imageUrl, title, shortContent, fullContent, createdAt]);
        res.json({ message: 'Added successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding data' });
    }
});

app.put('/api/news-eng/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { imageUrl, title, shortContent, fullContent } = req.body;
        const rows = await handleSheetOperation('get', 'News_ENG!A:F');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Data not found' });
        }

        const updatedRow = [id, imageUrl, title, shortContent, fullContent, rows[rowIndex][5]];
        await handleSheetOperation('update', null, updatedRow, `News_ENG!A${rowIndex + 1}:F${rowIndex + 1}`);
        res.json({ message: 'Updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating data' });
    }
});

app.delete('/api/news-eng/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await handleSheetOperation('get', 'News_ENG!A:F');
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.status(404).json({ message: 'Data not found' });
        }

        await handleSheetOperation('delete', null, null, `News_ENG!A${rowIndex + 1}:F${rowIndex + 1}`);
        res.json({ message: 'Deleted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting data' });
    }
});

// Totals APIs
app.get('/api/totals', async (req, res) => {
    try {
        const rows = await handleSheetOperation('get', 'LCL!A4:F');
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Không có dữ liệu' });
        }

        const newsData = rows.map(row => ({
            STT: row[0] || '',
            ga: row[1] || '',
            viTriLayNhanHang: row[2] || '',
            loaiCont:row[3] || '',
            soTien: row[4] || '',
            ngayVanChuyen: row[5] || '',
        }));

        res.json(newsData);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu' });
    }
});


// FLC APIs
app.get('/api/flc', async (req, res) => {
    try {
        const rows = await handleSheetOperation('get', 'FLC!A2:G');
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Không có dữ liệu' });
        }

        const newsData = rows.map(row => ({
            STT: row[0] || '',
            ga: row[1] || '',
            viTriLayNhanHang: row[2] || '',
            nguyenToa :row[3] || '',
            dongKg: row[4] || '',
            metKhoi: row[5] || '',
        }));

        res.json(newsData);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu' });
    }
});

// FLC APIs
app.get('/api/duongBo', async (req, res) => {
    try {
        const rows = await handleSheetOperation('get', 'DuongBo!A2:E');
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Không có dữ liệu' });
        }

        const newsData = rows.map(row => ({
            STT: row[0] || '',
            ga: row[1] || '',
            viTriLayNhanHang: row[2] || '',
            loaiCont :row[3] || '',
            donViTinh: row[4] || '',
        }));

        res.json(newsData);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu' });
    }
});


const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces
// app.listen(PORT, () => {
//     console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
//     console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
// });

app.listen(PORT, HOST, () => {
    console.log(`✅ Server đang chạy tại http://${HOST}:${PORT}`);
    console.log(`📚 API Documentation available at http://${HOST}:${PORT}/api-docs`);
});
