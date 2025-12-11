// Admin Configuration
// IMPORTANT: Change the password after first use!
// For better security, consider using environment variables or a more secure authentication method

window.ADMIN_CONFIG = {
    // Change this password to something secure
    password: 'mumtaz2025',
    
    // Optional: GitHub API configuration (for automatic posting)
    // You'll need a GitHub Personal Access Token with repo permissions
    github: {
        enabled: false, // Set to true to enable GitHub API integration
        token: '', // Your GitHub Personal Access Token
        repo: 'your-username/your-repo', // Your GitHub repository
        branch: 'main' // Branch to commit to
    }
};

