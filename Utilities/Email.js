import nodeMailer from 'nodemailer'

class Email {
    constructor(user,url) {
        this.to = user.Email
        this.Name = user.FirstName
        this.url = url
        this.from = process.env.EMAIL_FROM
    }

    createNewTransport(){
        return nodeMailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        })
    }

    async Send(subject,html,text){
        const mailOptions = {
            to: this.to,
            from : this.from,
            subject:subject,
            text:text,
            html:html
        }
        try {
            const result = await this.createNewTransport().sendMail(mailOptions)
            console.log("Message sent successfully", result.messageId)
        } catch(err) {
            console.error("Email Send Error:", err.message)
            console.error("Email Config:", {
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                user: process.env.EMAIL_USERNAME ? '***' : 'MISSING'
            })
            throw err
        }
    }

    

    async sendWelcomeEmail(){

        const html= `<div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>Welcome to Our Platform! 🎉</h1>
            <p>Hi ${this.Name},</p>
            <p>We're excited to have you on board!</p>
            <p>Your account has been successfully created.</p>
            <p style="margin-top: 20px;">
            If you have any questions, feel free to contact our support team.
            </p>
            <p>Best regards,<br>BrookField Team</p>
        </div>
        `
        const text = `Welcome to Our Platform, ${this.Name}! We're excited to have you on board.`
    
        await this.Send('Welcome Email',html,text)
        
    }

  async SendEmailVerification(){
            const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Email Verification Required</h2>
                        
                        <p>Hi <b>${this.Name}</b>,</p>
                        
                        <p>Please verify your email address to activate your account:</p>
                        
                        <div style="text-align: center; margin: 25px 0;">
                            <a href="${this.url}" 
                            style="background: #4F46E5; color: white; padding: 12px 24px; 
                                    text-decoration: none; border-radius: 5px; font-weight: bold;">
                                Verify Email
                            </a>
                        </div>
                        
                        <p>Or use this link:<br>
                        <code style="background: #f5f5f5; padding: 10px; display: block; margin: 10px 0;">
                            ${this.url}
                        </code></p>
                        
                        <p><small>This link expires 20 min.</small></p>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">
                            If you didn't request this, please ignore this email.
                        </p>
                    </div>
                `;
    
    const text = `Verify your email: ${this.url}`;
    await this.Send('Verify Your Email', html, text);
}

    async SendResetPassword(){

        const html = `
            <div>
                <h3>Password Reset</h3>
                <p>Hi ${this.Name},</p>
                <p>Click below to reset your password:</p>
                <a href="${this.url}" style="
                    background: #007bff;
                    color: white;
                    padding: 12px 20px;
                    text-decoration: none;
                    border-radius: 5px;
                    display: inline-block;
                ">Reset Password</a>
                <p>Link: ${this.url}</p>
                <p><small>Expires in 10 minutes</small></p>
                <p>Ignore this email if you didn't request it.</p>
            </div>
        `;
        const text = "'Your password reset token (valid for only 10 minutes)'"
        await this.Send('Reset Password',html,text)
}
      
    
}

export default Email