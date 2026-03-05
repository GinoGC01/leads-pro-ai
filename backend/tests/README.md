# Test Architecture (Leads Pro AI)

To keep the codebase maintainable and organized, **all tests** are consolidated in this directory. Do not place test files within `src/` to prevent polluting the production source code.

## Folder Structure

```
tests/
├── unit/           # Testing isolated functions, classes, and models
│   ├── models/     # Mongoose models logic (e.g., validation rules)
│   ├── controllers/# Controller logic (mocking DB and services)
│   └── workers/    # Background job processing logic
├── integration/    # Testing real module interactions (e.g., DB + APIs)
└── README.md       # This file
```

## Running Tests

We use **Jest** connected through a cross-platform ES Modules setup.

To run all tests:

```bash
npm run test
```

To run only unit tests:

```bash
npx jest tests/unit/
```

To run only integration tests:

```bash
npx jest tests/integration/
```

## Rules for Writing Tests

1. **Location**: Always place `.test.js` files in the corresponding subfolder inside `tests/`. **NEVER** inside `src/`.
2. **Naming**: Mirror the path of the file you are testing. For example, to test `src/services/AIService.js`, create `tests/unit/services/AIService.test.js`.
3. **Mocks (ESM)**: Because we use native ES Modules, use `jest.spyOn()` where possible. If you must mock an entire module dependency, use `jest.unstable_mockModule` BEFORE importing the module under test, and prefer mocking relative paths accurately or using `pathToFileURL`.
4. **Integration Tests**: Do NOT hit paid external APIs (like OpenAI) during automated testing; always mock them. Focus integration tests on database interactions (MongoDB/Qdrant) testing the closed-loop pipelines.
