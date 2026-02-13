// Admin Configuration
// The password is injected from GitHub Secrets during deployment.
// To set the password, add a repository secret named ADMIN_PASSWORD in GitHub Settings > Secrets.
// For local development, replace __ADMIN_PASSWORD_PLACEHOLDER__ with your password.

window.ADMIN_CONFIG = {
    password: '__ADMIN_PASSWORD_PLACEHOLDER__',
    
    // Optional: GitHub API configuration (for automatic posting)
    // You'll need a GitHub Personal Access Token with repo permissions
    github: {
        enabled: false, // Set to true to enable GitHub API integration
        token: '', // Your GitHub Personal Access Token
        repo: 'your-username/your-repo', // Your GitHub repository
        branch: 'main' // Branch to commit to
    }
};

