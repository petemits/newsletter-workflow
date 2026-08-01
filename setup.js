const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function setup() {
    console.log('🎯 Newsletter Workflow Setup\n');
    
    // Check if .env exists
    if (fs.existsSync('.env')) {
        const overwrite = await question('.env file exists. Overwrite? (y/n): ');
        if (overwrite.toLowerCase() !== 'y') {
            console.log('Setup cancelled.');
            rl.close();
            return;
        }
    }
    
    console.log('Please provide the following information:\n');
    
    // Gather configuration
    const config = {
        GOOGLE_SERVICE_ACCOUNT_JSON: await question('Path to Google Service Account JSON file: '),
        SPREADSHEET_ID: await question('Google Spreadsheet ID: '),
        SHEET_NAME: await question('Subscribers sheet name (default: Newsletter Subscribers): ') || 'Newsletter Subscribers',
        OPENROUTER_API_KEY: await question('OpenRouter API Key: '),
        FROM_EMAIL: await question('From email address: '),
        SMTP_PASSWORD: await question('SMTP App Password: '),
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: '587',
        AI_MODEL: 'meta-llama/llama-3.2-3b-instruct:free',
        LOG_SHEET_NAME: 'Newsletter Logs'
    };
    
    // Create .env file
    const envContent = Object.entries(config)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    
    fs.writeFileSync('.env', envContent);
    
    console.log('\n✅ Setup complete!');
    console.log('📁 Created .env file with your configuration');
    console.log('\nNext steps:');
    console.log('1. Run: npm install');
    console.log('2. Run: npm start');
    console.log('3. Check your Google Sheets and email!');
    
    rl.close();
}

setup();