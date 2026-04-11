import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.errors
        .map(e => `${e.path.join('.') || 'campo'}: ${e.message}`)
        .join(', ');
      return res.status(400).json({ error: messages });
    }
    req.body = result.data;
    next();
  };
}
