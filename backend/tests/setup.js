const mongoose = require('mongoose');

jest.setTimeout(30000);

beforeAll(async () => {
    // Connect to a TEST Database to avoid wiping real data
    // Fallback to Cloud Test DB since Localhost might not be available
    const url = process.env.MONGO_URI || process.env.MONGO_URI_TEST;
    await mongoose.connect(url);
});

afterAll(async () => {
    await mongoose.connection.close();
});

afterEach(async () => {
    // Optional: Clear collections between tests?
    // For now, we'll manage uniqueness in tests
});
