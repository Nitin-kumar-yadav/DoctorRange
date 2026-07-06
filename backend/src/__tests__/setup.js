// Global test setup — mock environment variables before any module loads
process.env.PORT = "5000";
process.env.JWT_TOKEN = "test-jwt-secret-key";
process.env.RAZORPAY_KEY_ID = "rzp_test_fake";
process.env.RAZORPAY_KEY_SECRET = "rzp_secret_fake";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-api-key";
process.env.CLOUDINARY_API_SECRET = "test-api-secret";
process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.NODE_ENV = "test";
process.env.MONGO_URI = "mongodb://localhost:27017/test";
