import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    // If you don't provide SMTP credentials, ethereal email (mock) can be used,
    // but here we set standard env vars users can configure in render or .env
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendVerificationEmail = async (email: string, code: string) => {
    // If no credentials, just log it out (development mode)
    if (!process.env.SMTP_USER) {
        console.log(`\n\n[MOCK EMAIL] To: ${email} | Code: ${code}\n\n`);
        return true;
    }

    try {
        await transporter.sendMail({
            from: `"Meetiva Onay" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Meetiva - Hesap Onay Kodu',
            text: `Meetiva hesabınızı onaylamak için doğrulama kodunuz: ${code}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Meetiva Hesabınızı Doğrulayın</h2>
                    <p>Mavi tik alıp güvenli bir profil oluşturmak için aşağıdaki 5 haneli doğrulama kodunu uygulamaya giriniz:</p>
                    <h1 style="color: #6c5ce7; font-size: 32px; letter-spacing: 5px;">${code}</h1>
                    <p>Bu kod 15 dakika boyunca geçerlidir.</p>
                </div>
            `,
        });
        return true;
    } catch (error) {
        console.error("Error sending verification email:", error);
        return false;
    }
};
