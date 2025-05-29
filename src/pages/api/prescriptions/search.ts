import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { prescriptionNo, referenceNo, name, phone } = req.query;

    // Build the where clause based on provided search parameters
    const where: any = {};
    
    if (prescriptionNo) {
      // Search for exact prescription number
      where.prescriptionNo = prescriptionNo;
    }
    if (referenceNo) {
      // Search for exact reference number
      where.referenceNo = referenceNo;
    }
    if (name) {
      // Search for name containing the input string (case-insensitive)
      where.name = {
        contains: name as string,
        mode: 'insensitive'
      };
    }
    if (phone) {
      // Search for phone containing the input string in either mobile or landline
      where.OR = [
        { mobileNo: { contains: phone as string } },
        { phoneLandline: { contains: phone as string } }
      ];
    }

    // If no search parameters provided, return error (or perhaps an empty array)
    if (Object.keys(where).length === 0) {
      return res.status(200).json([]); // Return empty array if no parameters
    }

    // Search for prescriptions (find many)
    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        rightEye: {
          include: {
            dv: true,
            nv: true
          }
        },
        leftEye: {
          include: {
            dv: true,
            nv: true
          }
        }
      },
      take: 10 // Limit the number of suggestions
    });

    // Return the found prescriptions (could be an empty array if none match)
    return res.status(200).json(prescriptions);
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 