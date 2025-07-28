import type { NextApiRequest, NextApiResponse } from 'next';
// Replace the ESM import with CommonJS require for formidable
const formidable = require('formidable');
import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

const PRINTER_IP = process.env.PRINTER_IP || '192.168.0.209';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const form = new formidable.IncomingForm();
  form.parse(req, async (err: any, fields: any, files: any) => {
    if (err) {
      res.status(500).json({ error: 'Form parse error', details: err });
      return;
    }
    const formData = new FormData();
    for (const key in fields) {
      formData.append(key, Array.isArray(fields[key]) ? fields[key][0] : fields[key]);
    }
    if (files.File) {
      const file = Array.isArray(files.File) ? files.File[0] : files.File;
      const filename = file.originalFilename || 'upload.gcode';
      formData.append('File', fs.createReadStream(file.filepath), filename);
    }
    try {
      const printerUrl = `http://${PRINTER_IP}:3030/uploadFile/upload`;
      const response = await fetch(printerUrl, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
      });
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (error) {
      res.status(500).json({ error: 'Proxy upload failed', details: error });
    }
  });
} 