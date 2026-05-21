import Grade from './grade.model.js'

const defaultGrades = [
    {
        name: '1ro Básico',
        level: 'BASICO',
        yearNumber: 1,
        section: 'A',
        description: 'Primer año del ciclo básico. Fundamentos de las ciencias, matemáticas y lenguaje.',
        shift: 'MATUTINA',
        maxStudents: 35
    },
    {
        name: '2do Básico',
        level: 'BASICO',
        yearNumber: 2,
        section: 'A',
        description: 'Segundo año del ciclo básico. Profundización en ciencias naturales y sociales.',
        shift: 'MATUTINA',
        maxStudents: 35
    },
    {
        name: '3ro Básico',
        level: 'BASICO',
        yearNumber: 3,
        section: 'A',
        description: 'Tercer año del ciclo básico. Preparación para el ciclo diversificado con énfasis en competencias.',
        shift: 'MATUTINA',
        maxStudents: 35
    },
    {
        name: '4to Bachillerato',
        level: 'BACHILLERATO',
        yearNumber: 4,
        section: 'A',
        description: 'Primer año de bachillerato. Inicio de la especialización en ciencias y letras.',
        shift: 'MATUTINA',
        maxStudents: 30
    },
    {
        name: '5to Bachillerato',
        level: 'BACHILLERATO',
        yearNumber: 5,
        section: 'A',
        description: 'Segundo año de bachillerato. Especialización avanzada y preparación para la universidad.',
        shift: 'MATUTINA',
        maxStudents: 30
    }
]

export const setupGrades = async () => {
    try {
        const existingCount = await Grade.countDocuments()

        if (existingCount > 0) {
            console.log(`SEEDER | Ya existen ${existingCount} grados en la base de datos`)
            return
        }

        await Grade.insertMany(defaultGrades)

        console.log('********************************************************')
        console.log('*   SEEDER: Grados creados exitosamente                *')
        console.log('*   - 3 grados de Básico (1ro, 2do, 3ro)              *')
        console.log('*   - 2 grados de Bachillerato (4to, 5to)             *')
        console.log('********************************************************')
    } catch (error) {
        console.error('!!! SEEDER: Error al crear los grados iniciales:', error.message)
    }
}
