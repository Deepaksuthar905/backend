const axios = require('axios');

const API_URL = 'http://localhost:3000';

const testAuth = async () => {
    try {
        // 1. Register a user (or login if already exists) to get token
        // Using a random email to ensure new user creation or predictable failure
        const email = `test${Date.now()}@example.com`;
        const password = 'password123';

        console.log('1. Attempting to register test user...');
        let token;
        try {
            const registerRes = await axios.post(`${API_URL}/register`, {
                name: 'Test User',
                email,
                password,
                phone: '1234567890'
            });
            console.log('   Registration successful.');
            // Assuming the register response doesn't return a token based on reading authController, 
            // we might need to login. Let's check authController again.
            // Wait, authController.register returns { message: "User created", user }
            // authController.login returns { message: "Logged in", token }

            console.log('2. Attempting to login...');
            const loginRes = await axios.post(`${API_URL}/login`, {
                email,
                password
            });
            token = loginRes.data.token;
            console.log('   Login successful. Token received.');

        } catch (err) {
            console.error('   Setup failed. Error details:');
            console.error(JSON.stringify(err.response ? err.response.data : err.message, null, 2));
            return;
        }

        // 2. Try to create a product WITHOUT token (should fail)
        console.log('\n3. Testing unauthorized access (creating product without token)...');
        try {
            await axios.post(`${API_URL}/api/product/create`, {
                name: 'Unauthorized Product',
                description: 'Should fail',
                price: 100,
                category: '6784d787094e09f5923b3780', // Dummy ID, might need a real one if validation is strict
                params: 'test'
            });
            console.error('   FAILED: Request succeeded but should have failed with 401.');
        } catch (err) {
            if (err.response && err.response.status === 401) {
                console.log('   PASSED: Server returned 401 Unauthorized as expected.');
            } else {
                console.error(`   FAILED: Server returned status ${err.response ? err.response.status : 'unknown'} instead of 401.`);
                console.error('   Error:', err.message);
            }
        }

        // 3. Try to create a product WITH token (should success - or at least pass auth)
        console.log('\n4. Testing authorized access (creating product with token)...');
        try {
            // We need a category ID first. Let's try to get one or create one.
            // For simplicity, let's just send the request. Even if it fails validation (e.g. invalid category),
            // if it passes 401, then Auth is working.
            // But we want to confirm 200/201 or 400/500, NOT 401.

            await axios.post(`${API_URL}/api/product/create`, {
                name: 'Authorized Product',
                description: 'Should Pass Auth',
                price: 200,
                // Providing a dummy mongo ID format to avoid cast error middleware crashes if any
                category: '507f1f77bcf86cd799439011',
                countInStock: 10
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('   PASSED: Request succeeded (200/201).');
        } catch (err) {
            if (err.response && err.response.status === 401) {
                console.error('   FAILED: Server returned 401 Unauthorized even with valid token.');
            } else {
                console.log(`   PASSED Auth check (Server returned ${err.response ? err.response.status : 'unknown'}). Verification of auth logic success.`);
                // Note: It might fail due to database constraints (category not found), which is fine for AUTH testing.
            }
        }

    } catch (error) {
        console.error('Unexpected error:', error.message);
    }
};

testAuth();
