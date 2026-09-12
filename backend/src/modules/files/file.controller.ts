import { Request, Response, NextFunction } from 'express';
import { FileRecord } from '../../models';
import { sendSuccess } from '../../utils/response.util';
import { BadRequestError, NotFoundError } from '../../utils/errors.util';

export class FileController {
  async getUploadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { filename, category, mimeType, sizeBytes } = req.body;
      if (!filename || !category) {
        throw new BadRequestError('filename and category are required');
      }

      const fileKey = `${category.toLowerCase()}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const signedUploadUrl = `/api/v1/files/mock-s3-upload/${fileKey}`; // In production, generates AWS S3 pre-signed PUT URL

      const record = await FileRecord.create({
        originalName: filename,
        fileKey,
        bucket: 'upvia-documents',
        mimeType: mimeType || 'application/octet-stream',
        sizeBytes: sizeBytes || 0,
        category,
        uploaderId: req.user?.userId,
        isPublic: false,
      });

      sendSuccess(res, {
        fileId: record._id,
        fileKey,
        uploadUrl: signedUploadUrl,
        downloadUrl: `/api/v1/files/download/${record._id}`,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDownloadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await FileRecord.findById(req.params.id);
      if (!record) throw new NotFoundError('File not found');

      // In production, generates signed S3 GET URL with 15min expiry
      const signedDownloadUrl = `/uploads/${record.fileKey}?signed=true&expires=${Date.now() + 900000}`;

      sendSuccess(res, {
        file: record,
        downloadUrl: signedDownloadUrl,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const fileController = new FileController();
