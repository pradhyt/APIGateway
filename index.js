const express = require('express');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { rateLimit } = require('express-rate-limit');
const axios = require('axios');
const app = express();

const PORT = 3005;

// Rate limiter
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 5,
})

// Logger
app.use(morgan('combined'));
app.use(limiter);

// Protecting routes: checking authenticity of the user (auth service)
app.use('/bookingservice', async (req, res, next) => {
    try {
        const response = await axios.get('http://localhost:3001/api/v1/isAuthenticated', {
            headers: {
                'x-access-token': req.headers['x-access-token']
            }
        });
        console.log('*** response >>', response.data);
        if (response.data.success) {
            next();
        }
        else {
            return res.status(401).json({
                message: 'Unauthorised'
            })
        }
    } catch (error) {
        return res.status(401).json({
            message: 'Unauthorised'
        })
    }
})

// Proxy server: routing the requests to respective microservice (booking service)
app.use('/bookingservice', createProxyMiddleware({ target: 'http://localhost:3002/', changeOrigin: true }))

app.get('/home', (req, res) => {
    return res.json({ message: 'OK' });
})

app.listen(PORT, () => {
    console.log(`Server started at PORT ${PORT}`)
})