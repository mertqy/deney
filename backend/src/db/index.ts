import { Pool } from 'pg';
import { config } from '../config';

const pool = new Pool(config.DB);


export const query = (text: string, params?: any[]) => {
    console.log(`[DB Query] ${text} ${params ? JSON.stringify(params) : ''}`);
    return pool.query(text, params);
};

export default pool;
