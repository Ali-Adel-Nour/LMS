router.get('/redis-test', async (req, res) => {
    try {
        // Ensure Redis is connected
        if (!redisClient.isOpen) {
            throw new Error('Redis client is not connected');
        }

        const testKey = 'test_' + Date.now();

        // Test Redis operations
        await redisClient.set(testKey, 'Test Value');
        const value = await redisClient.get(testKey);
        await redisClient.del(testKey);

        res.json({
            status: true,
            message: 'Redis test successful',
            value
        });
    } catch (error) {
        console.error('Redis Test Error:', error);
        res.status(500).json({
            status: false,
            message: 'Redis test failed',
            error: error.message
        });
    }
});

module.exports = router;