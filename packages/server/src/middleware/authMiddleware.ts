import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types';

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
      
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) {
        return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
      }
      
      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Yetkilendirme hatası, geçersiz token.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Yetkilendirme hatası, token bulunamadı.' });
  }
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Yetkisiz erişim, admin yetkisi gerekiyor.' });
  }
};

export const scraperApiKeyOrAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];

  if (apiKey) {
    const configApiKey = process.env.SCRAPER_API_KEY;
    if (!configApiKey || apiKey !== configApiKey) {
      return res.status(401).json({ message: 'Yetkisiz erişim, geçersiz API anahtarı.' });
    }
    return next();
  }

  // If no x-api-key, check for admin token
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
      
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) {
        return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
      }
      
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Yetkisiz erişim, admin yetkisi gerekiyor.' });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Yetkilendirme hatası, geçersiz token.' });
    }
  }

  return res.status(401).json({ message: 'Yetkilendirme hatası, API anahtarı veya token bulunamadı.' });
};
