import { z } from 'zod';

export const currency = z.number().gt(0);
