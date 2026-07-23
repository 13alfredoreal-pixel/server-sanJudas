import 'dotenv/config';
import dns from 'node:dns';
import { validateEnv } from './helpers/validate-env.js';
import { initServer } from './configs/app.js';

validateEnv();

// Configuración de DNS para resolver problemas de querySrv ECONNREFUSED en Atlas
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

initServer();
