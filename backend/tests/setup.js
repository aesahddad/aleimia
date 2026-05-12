const mongoose = require('mongoose');

jest.setTimeout(30000);

beforeAll(async () => {
    const url = process.env.MONGO_URI_TEST;
    if (!url) return;
    await mongoose.connect(url);
});

afterAll(async () => {
    await mongoose.connection.close();
});

afterEach(async () => {
    // Optional: Clear collections between tests?
    // For now, we'll manage uniqueness in tests
});
