require('dotenv').config();
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs');

class NewsletterWorkflow {
    constructor() {
        this.setupServices();
        this.stats = {
            subscribers: 0,
            emailsSent: 0,
            emailsFailed: 0
        };
    }

    setupServices() {
        console.log('🔧 Setting up services...');
        
        // Google Sheets setup
        if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON && fs.existsSync(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)) {
            try {
                console.log('📁 Loading Google credentials...');
                const credentials = JSON.parse(
                    fs.readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, 'utf8')
                );
                this.sheetsAuth = new google.auth.JWT(
                    credentials.client_email,
                    null,
                    credentials.private_key,
                    ['https://www.googleapis.com/auth/spreadsheets']
                );
                this.sheets = google.sheets({ version: 'v4', auth: this.sheetsAuth });
                console.log('✅ Google Sheets service initialized');
            } catch (error) {
                console.error('❌ Failed to initialize Google Sheets:', error.message);
            }
        }

        // Email transporter setup
        if (process.env.SMTP_PASSWORD) {
            try {
                this.transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT),
                    secure: false,
                    auth: {
                        user: process.env.FROM_EMAIL,
                        pass: process.env.SMTP_PASSWORD
                    }
                });
                console.log('✅ Email service initialized');
            } catch (error) {
                console.error('❌ Failed to initialize email service:', error.message);
            }
        }
    }

    // Step 1: Read REAL subscribers from Google Sheets
    async readGoogleSheets() {
        console.log('📊 Reading subscribers from Google Sheets...');
        
        if (!this.sheets) {
            console.error('❌ Google Sheets not available');
            return [];
        }

        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: `${process.env.SHEET_NAME}!A:Z`
            });

            const rows = response.data.values;
            if (!rows || rows.length === 0) {
                console.log('ℹ️  No data found in sheet');
                return [];
            }

            const headers = rows[0].map(h => h.trim().toLowerCase());
            const subscribers = [];

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const subscriber = {};
                
                headers.forEach((header, index) => {
                    const value = row[index] || '';
                    if (header === 'email' || header === 'e-mail') {
                        subscriber.Email = value;
                    } else if (header === 'name' || header === 'full name') {
                        subscriber.Name = value;
                    } else if (header === 'subscriberid' || header === 'id') {
                        subscriber.SubscriberID = value;
                    }
                });

                if (subscriber.Email && subscriber.Email.includes('@')) {
                    subscribers.push(subscriber);
                }
            }

            this.stats.subscribers = subscribers.length;
            console.log(`✅ Found ${subscribers.length} subscribers`);
            return subscribers;

        } catch (error) {
            console.error('❌ Error reading Google Sheets:', error.message);
            return [];
        }
    }

    // Step 2: Add randomness with MORE variety
    addRandomness() {
        console.log('🎲 Generating random content...');
        
        const topics = [
            "breakthrough technology trends reshaping industries in 2024",
            "proven productivity hacks for busy professionals working remotely", 
            "innovative business strategies for sustainable growth and scalability",
            "cutting-edge digital marketing tactics that drive real results",
            "personal development and leadership skills for modern entrepreneurs",
            "emerging industry disruptions and opportunities in the AI era",
            "entrepreneurship lessons from successful founders and industry leaders",
            "workplace culture and team collaboration tips for hybrid environments",
            "customer experience strategies that drive loyalty and retention",
            "future of work and remote team management best practices",
            "data-driven decision making for business optimization",
            "creative problem solving and innovation techniques",
            "work-life balance strategies for high-performing professionals",
            "digital transformation trends across various industries",
            "sustainable business practices and green technologies"
        ];
        
        const tones = [
            "enthusiastic and energetic",
            "professional and analytical",
            "casual and conversational", 
            "inspiring and motivational",
            "practical and actionable",
            "authoritative and expert",
            "friendly and approachable"
        ];
        
        const emojiStyles = [
            "🚀💡✨",
            "🎯📈💪", 
            "🔥⚡🌟",
            "💼📊🎓",
            "🌱🎨💫",
            "📱🌐🤖",
            "⭐🌟🎉"
        ];

        const industries = [
            "technology", "healthcare", "finance", "education", "retail", 
            "manufacturing", "real estate", "entertainment", "transportation"
        ];
        
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        const randomTone = tones[Math.floor(Math.random() * tones.length)];
        const randomEmojis = emojiStyles[Math.floor(Math.random() * emojiStyles.length)];
        const randomIndustry = industries[Math.floor(Math.random() * industries.length)];
        
        const now = new Date();
        const dateString = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        const uniqueId = `${now.getTime()}-${Math.random().toString(36).substring(7)}`;
        
        console.log(`📝 Topic: ${randomTopic}`);
        console.log(`🎨 Tone: ${randomTone}`);
        console.log(`✨ Emojis: ${randomEmojis}`);
        console.log(`🏢 Industry: ${randomIndustry}`);
        
        return {
            randomTopic,
            randomTone, 
            randomEmojis,
            randomIndustry,
            currentDate: dateString,
            newsletterId: uniqueId
        };
    }

    // Step 3: Generate REAL AI content with SIMPLIFIED prompt
    async generateAIContent(randomData) {
        console.log('🤖 Generating AI content...');
        
        if (!process.env.OPENROUTER_API_KEY) {
            console.log('❌ OpenRouter API key not configured');
            return this.generateFallbackContent(randomData);
        }

        try {
            console.log('📡 Calling OpenRouter API...');
            
            const prompt = `Create a newsletter about ${randomData.randomTopic} for the ${randomData.randomIndustry} industry.

Write in a ${randomData.randomTone} tone.

Start with: SUBJECT: ${randomData.randomEmojis} [create a compelling subject line]

Then write: CONTENT: [write 3-4 engaging paragraphs with practical insights and examples]

Make it professional, actionable, and include specific examples.`;

            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    "model": "meta-llama/llama-3.2-3b-instruct:free",
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": 0.9,
                    "max_tokens": 800,
                    "top_p": 0.95
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 45000
                }
            );

            console.log('✅ AI Response received');
            const aiResponse = response.data.choices[0].message.content;
            
            console.log('📄 AI Response:', aiResponse.substring(0, 200) + '...');
            
            // Parse subject and content
            let subject, content;
            
            const subjectMatch = aiResponse.match(/SUBJECT:\s*(.+?)(\n|$)/i);
            const contentMatch = aiResponse.match(/CONTENT:\s*([\s\S]+)/i);
            
            if (subjectMatch && contentMatch) {
                subject = subjectMatch[1].trim();
                content = contentMatch[1].trim();
                console.log(`✅ Parsed: "${subject}"`);
            } else {
                // If parsing fails, generate creative content
                subject = `${randomData.randomEmojis} Mastering ${randomData.randomTopic}`;
                content = this.generateCreativeContent(randomData);
                console.log(`⚠️  Using generated content: "${subject}"`);
            }

            return { subject, content };

        } catch (error) {
            console.error('❌ AI content generation failed:', error.message);
            if (error.response) {
                console.error('📡 API Error:', error.response.status, error.response.data);
            }
            return this.generateFallbackContent(randomData);
        }
    }

    // Generate creative content when AI fails
    generateCreativeContent(randomData) {
        const contents = [
            `In today's rapidly evolving ${randomData.randomIndustry} landscape, ${randomData.randomTopic.toLowerCase()} has become more crucial than ever. Companies that adapt quickly are seeing remarkable results.

Consider the case of a leading ${randomData.randomIndustry} firm that implemented innovative strategies around ${randomData.randomTopic.toLowerCase()}. Within just six months, they reported a 40% increase in efficiency and a 25% boost in customer satisfaction.

The key takeaway? Embracing change and investing in continuous improvement can yield significant returns. Start by assessing your current processes and identifying areas for enhancement.

Ready to transform your approach? Begin with small, measurable changes and scale what works. The future belongs to those who innovate today.`,

            `The world of ${randomData.randomIndustry} is being transformed by new approaches to ${randomData.randomTopic.toLowerCase()}. What seemed impossible yesterday is becoming standard practice today.

Successful organizations are leveraging data-driven insights to optimize their ${randomData.randomTopic.toLowerCase()} strategies. One notable example saw a 60% improvement in key metrics by adopting these methods.

To stay competitive, focus on building adaptable systems and fostering a culture of innovation. The most successful teams are those that learn and evolve continuously.

Take the first step today by evaluating your current strategy and setting clear, achievable goals for improvement.`,

            `${randomData.randomTopic} represents one of the most exciting opportunities in modern ${randomData.randomIndustry}. Forward-thinking companies are already reaping the benefits.

Imagine reducing operational costs by 30% while improving output quality. That's exactly what several industry leaders have achieved through strategic implementation of ${randomData.randomTopic.toLowerCase()} principles.

The secret lies in combining traditional wisdom with cutting-edge technology. This balanced approach ensures sustainable growth and long-term success.

Begin your journey by conducting a thorough analysis of your current position and developing a phased implementation plan.`
        ];

        return contents[Math.floor(Math.random() * contents.length)];
    }

    generateFallbackContent(randomData) {
        const subject = `${randomData.randomEmojis} ${randomData.randomTopic}`;
        const content = this.generateCreativeContent(randomData);
        return { subject, content };
    }

    // Step 4: Send emails to ALL subscribers
    async sendEmail(subscriber, subject, content) {
        console.log(`📧 Sending to: ${subscriber.Email}`);
        
        if (!this.transporter) {
            console.error('❌ Email transporter not available');
            return false;
        }

        const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; line-height: 1.3; }
    .content { padding: 40px 30px; line-height: 1.8; font-size: 16px; }
    .greeting { font-size: 18px; margin-bottom: 25px; color: #2c3e50; }
    .newsletter-content { margin-top: 20px; }
    .newsletter-content p { margin-bottom: 20px; }
    .footer { text-align: center; padding: 30px 20px; font-size: 14px; color: #666; background-color: #f8f9fa; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${subject}</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi ${subscriber.Name || 'there'},</p>
      <div class="newsletter-content">${content.replace(/\n/g, '<br>')}</div>
    </div>
    <div class="footer">
      <p>You're receiving this because you subscribed to our newsletter.</p>
    </div>
  </div>
</body>
</html>`;

        try {
            await this.transporter.sendMail({
                from: `"Newsletter System" <${process.env.FROM_EMAIL}>`,
                to: subscriber.Email,
                subject: subject,
                html: htmlTemplate
            });
            
            this.stats.emailsSent++;
            console.log(`✅ Sent to ${subscriber.Email}`);
            return true;

        } catch (error) {
            this.stats.emailsFailed++;
            console.error(`❌ Failed to send to ${subscriber.Email}:`, error.message);
            return false;
        }
    }

    // Main workflow execution
    async executeWorkflow() {
        console.log('🚀 Starting Automated Newsletter System...\n');
        const startTime = Date.now();
        
        try {
            // Step 1: Read subscribers
            const subscribers = await this.readGoogleSheets();
            
            if (subscribers.length === 0) {
                console.log('❌ No subscribers found. Please check your Google Sheet.');
                return;
            }
            
            // Step 2: Generate random content
            const randomData = this.addRandomness();
            
            // Step 3: Generate content (AI or fallback)
            const { subject, content } = await this.generateAIContent(randomData);
            
            // Step 4: Send to all subscribers
            console.log(`\n📨 Sending newsletter to ${subscribers.length} subscribers...`);
            for (let i = 0; i < subscribers.length; i++) {
                const subscriber = subscribers[i];
                await this.sendEmail(subscriber, subject, content);
                
                // Delay between emails
                if (i < subscribers.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`\n🎉 NEWSLETTERS SENT SUCCESSFULLY!`);
            console.log(`⏱️  Completed in ${executionTime}s`);
            console.log(`📊 Results:`);
            console.log(`   • Total subscribers: ${subscribers.length}`);
            console.log(`   • Newsletters sent: ${this.stats.emailsSent}`);
            console.log(`   • Failed sends: ${this.stats.emailsFailed}`);
            console.log(`   • Subject: "${subject}"`);
            
        } catch (error) {
            console.error('❌ Workflow failed:', error.message);
        }
    }
}

// Execute the workflow
async function main() {
    const workflow = new NewsletterWorkflow();
    await workflow.executeWorkflow();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = NewsletterWorkflow;