const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

exports.sendEmail = async ({ to, subject, text, html }) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || 'noreply@campus.edu',
            to,
            subject,
            text,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Message sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`Email Error: ${error.message}`);
        throw error;
    }
};
