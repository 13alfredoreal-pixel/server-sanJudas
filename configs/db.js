'use strict'

import mongoose from 'mongoose'

export const dbConnection = async () => {
    try {
        // Eventos de la conexión
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB | Error en la conexión:', err.message)
        })

        mongoose.connection.on('open', () => {
            console.log('MongoDB | Conexión establecida con éxito')
        })

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB | Reconectado a MongoDB')
        })

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB | Desconectado de MongoDB')
        })

        const uri = process.env.URI_MONGODB

        if (!uri) {
            throw new Error('La variable URI_MONGODB no está definida en el archivo .env')
        }

        console.log('MongoDB | Intentando conectar a Atlas...')

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000, 
            maxPoolSize: 10,
            socketTimeoutMS: 45000,
            family: 4 
        })

    } catch (error) {
        console.error('CRÍTICO | Error al conectar la base de datos:', error.message)
        throw error;
    }
}