# Build System Documentation

This document explains the build system configuration, development workflow, and dependency management for the TrustInk project.

## Configuration Files

The build system relies on several key configuration files:

1. **next.config.js**: Next.js configuration for transpiling packages and other build settings.
2. **eslint.config.mjs**: ESLint configuration for code quality and style enforcement, using the new flat config format.
3. **tsconfig.json**: TypeScript configuration for type checking and module resolution.
4. **.eslintignore**: Legacy file for ignoring paths in ESLint (transitioning to the ignores property in eslint.config.mjs).

Note: We previously had a babel.config.js file but have removed it to use Next.js's native SWC compiler for better performance.

## Build Process

The project uses Next.js 15 with the App Router architecture. The build process consists of several steps:

1. **Type Checking**: TypeScript validates all type definitions and ensures type safety.
2. **Linting**: ESLint checks code quality and style.
3. **Compilation**: Next.js compiles the code using its built-in SWC compiler.
4. **Bundling**: The compiled code is bundled with dependencies.
5. **Optimization**: The bundles are optimized for production.

## Development Workflow

### Development Server

```bash
npm run dev
```

This starts the Next.js development server with hot-reloading enabled. The server automatically recompiles code as changes are made.

### Production Build

```bash
npm run build
```

This creates an optimized production build. You can bypass linting with the `--no-lint` flag if needed:

```bash
npm run build -- --no-lint
```

### Starting Production Server

```bash
npm start
```

This starts the production server using the optimized build.

## Current Setup and Best Practices

### React and Testing Library Compatibility

Our project uses React 18.2.x with compatible testing libraries. This specific combination is chosen for:

1. **Next.js 15 Compatibility**: Next.js 15 officially supports React 18.
2. **Testing Library Compatibility**: The React Testing Library (v14.x) works with React 18.

Our dependency version structure is:

| Package | Version | Compatible With |
|---------|---------|-----------------|
| react | ^18.2.0 | @testing-library/react ^14.x |
| react-dom | ^18.2.0 | react ^18.2.0 |
| @types/react | ^18.2.45 | react ^18.2.0 |
| @types/react-dom | ^18.2.18 | react-dom ^18.2.0 |
| @testing-library/react | ^14.2.1 | react ^18.0.0 |

### TypeScript Configuration

Our TypeScript configuration handles Next.js-specific type challenges:

```json
{
  "exclude": [
    "node_modules", 
    ".next/types/app/**/*.ts"
  ]
}
```

By excluding `.next/types/app/**/*.ts`, we avoid type errors caused by Next.js's auto-generated types for App Router pages, which can sometimes be incompatible with the actual component props structure.

### Dependency Management Strategy

We carefully manage dependencies to avoid conflicts:

1. **Aligned Versions**: Keep React, React DOM, and their type definitions in sync.
2. **Testing Library Compatibility**: Use the testing library version compatible with our React version.
3. **Avoid Legacy Flags**: Rather than using `--legacy-peer-deps` or `--force`, we properly align our dependency versions.

## Build Troubleshooting

### Common Issues and Solutions

1. **Type Errors with Dynamic Routes**: These often occur with Next.js App Router pages:
   ```
   Type '{ params: { id: string; }; }' does not satisfy the constraint 'PageProps'
   ```
   
   **Solution**: Clean build caches and use TSConfig exclusions:
   ```bash
   rm -rf .next node_modules/.cache
   ```

2. **Module Resolution Errors**: Paths or imports not being recognized.

   **Solution**: Check the paths configuration in tsconfig.json and ensure module names are correct.

3. **Build Errors After Dependency Updates**: When dependencies are updated, incompatibilities can occur.

   **Solution**: Update related packages as a group and ensure version compatibility.

### SWC vs Babel

We now exclusively use SWC instead of Babel for these reasons:

1. **Performance**: SWC is significantly faster (up to 20x) than Babel.
2. **Next.js Integration**: SWC is the default compiler in Next.js.
3. **Simplified Configuration**: Removing babel.config.js reduces configuration complexity.

**Note**: While we still have Babel-related dev dependencies (for Jest), the actual build process no longer uses Babel configuration.

## Testing Configuration

The project uses Jest for testing with:

1. **jest.config.js**: Configuration for test environment and module mapping.
2. **jest.setup.js**: Global setup code for tests.

### Test-Specific Babel Usage

Although we've removed Babel from the Next.js build process, we still use it for Jest testing:

- **babel-jest**: Required for transpiling TypeScript and JSX in tests
- **@babel/preset-env**, **@babel/preset-react**, **@babel/preset-typescript**: Used by Jest to properly parse modern JavaScript, React, and TypeScript

This isolated use of Babel for testing doesn't affect the main application build performance. 