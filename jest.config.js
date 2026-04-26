/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@engine/(.*)$': '<rootDir>/src/engine/$1',
    '^@gateway/(.*)$': '<rootDir>/src/gateway/$1',
    '^@data/(.*)$': '<rootDir>/data/$1',
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020',
        module: 'commonjs',
        moduleResolution: 'node10',
        lib: ['ES2020'],
        strict: true,
        esModuleInterop: true,
        resolveJsonModule: true,
        rootDir: '.',
        baseUrl: '.',
        paths: {
          '@engine/*': ['src/engine/*'],
          '@gateway/*': ['src/gateway/*'],
          '@data/*': ['data/*'],
          '@/*': ['./*'],
        },
        ignoreDeprecations: '6.0',
      },
    }],
  },
};
