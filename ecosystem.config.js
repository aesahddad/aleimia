module.exports = {
    apps: [{
        name: "aleinia-v3",
        script: "./backend/server.js",
        env_production: {
            NODE_ENV: "production",
            PORT: 3000
        }
    }]
}
