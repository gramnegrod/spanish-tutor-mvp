// Test if the server starts
try {
    console.log('Starting server test...');
    require('./server.js');
} catch (error) {
    console.error('Server error:', error);
    process.exit(1);
}