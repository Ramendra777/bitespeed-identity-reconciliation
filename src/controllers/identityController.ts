// src/controllers/identityController.ts
import { Request, Response } from 'express';
import { identifyContact } from '../services/identityService';

interface IdentifyRequest {
  email?: string;
  phoneNumber?: string;
}

export const identify = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body as IdentifyRequest;

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: 'Either email or phoneNumber must be provided' });
    }

    const response = await identifyContact(email || null, phoneNumber?.toString() || null);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in identify endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};