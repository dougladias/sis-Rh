import multer from 'multer';
import { Request } from 'express';

// Configurar multer para armazenar em memória
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb) => {
    // Aceitar todos os tipos de arquivo por enquanto
    cb(null, true);
  }
});

// Middleware personalizado para processar o arquivo
export const uploadMiddleware = (req: any, res: any, next: any) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Erro no upload:', err);
      return res.status(400).json({
        success: false,
        message: 'Erro no upload do arquivo'
      });
    }

    // Log para debug
    console.log('=== UPLOAD DEBUG ===');
    console.log('Body:', req.body);
    console.log('File:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'Nenhum arquivo');
    console.log('==================');

    // Converter para o formato esperado pelo controller
    if (req.file) {
      req.uploadedFile = {
        originalname: req.file.originalname,
        filename: `${Date.now()}-${req.file.originalname}`,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer
      };
    }

    next();
  });
};