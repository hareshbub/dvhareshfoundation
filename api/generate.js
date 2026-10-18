import { createCanvas, loadImage } from '@napi-rs/canvas';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const student = req.body;

        // Generate Stateless ID
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const certificateCode = `HF-PC-${randomStr}`;

        // Generate QR Code
        const verificationUrl = `https://www.delance.site/verification.html/verify?code=${certificateCode}`;
        const qrCodeDataUri = await QRCode.toDataURL(verificationUrl, {
            errorCorrectionLevel: 'H', margin: 1, width: 200
        });

        // Load Template
        const templatePath = path.join(process.cwd(), 'public', 'template.png');
        const templateBuffer = fs.readFileSync(templatePath);
        const templateImage = await loadImage(templateBuffer);

        const canvas = createCanvas(templateImage.width, templateImage.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

        // Draw Name
        ctx.font = 'bold 80px sans-serif';
        ctx.fillStyle = '#0A2B56';
        ctx.textAlign = 'center';
        ctx.fillText(student.fullName.toUpperCase(), canvas.width / 2, canvas.height / 2);

        // Draw QR
        const qrImage = await loadImage(qrCodeDataUri);
        ctx.drawImage(qrImage, canvas.width - 250, canvas.height - 250, 200, 200);

        // Convert to Base64 String
        const buffer = canvas.toBuffer('image/png');
        const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

        res.status(200).json({ success: true, code: certificateCode, image: base64Image });

    } catch (error) {
        console.error("Engine Error:", error);
        res.status(500).json({ success: false, error: "Engine failure" });
    }
}
