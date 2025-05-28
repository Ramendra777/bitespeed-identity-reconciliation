import { Request, Response } from 'express';
import { identifyContact } from '../services/identityService';

export const identify = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phoneNumber } = req.body;
    
    if (!email && !phoneNumber) {
      res.status(400).json({ error: 'Either email or phoneNumber must be provided' });
      return;
    }

    const response = await identifyContact(email || null, phoneNumber?.toString() || null);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in /identify:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};