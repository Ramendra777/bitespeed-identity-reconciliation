import { Request, Response } from 'express';
import { identifyContact } from '../services/identityService';

export const identify = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;
    
    if (!email && !phoneNumber) {
      return res.status(400).json({ error: 'Either email or phoneNumber must be provided' });
    }

    const response = await identifyContact(email || null, phoneNumber?.toString() || null);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in /identify:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};