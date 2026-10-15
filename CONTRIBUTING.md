# Contributing to cache-nomad

First off, thank you for considering contributing to `cache-nomad`! It's people like you that make open-source software such a great community to learn, inspire, and create.

## Where do I start?

### 1. Bug Reports
If you notice a bug, please check if it has already been reported in the Issues tab. If not, open a new issue providing:
* A clear title and description.
* Steps to reproduce the issue.
* The version of `cache-nomad` you are using.
* Any relevant logs or screenshots.

### 2. Feature Requests
Have an idea to make `cache-nomad` better? (Like React hooks, automatic rollbacks, or TTL). We'd love to hear it! Open an issue with the tag `enhancement` and describe your idea, the problem it solves, and ideally, how you envision the API looking.

## Local Development Setup

To work on `cache-nomad` locally, follow these steps:

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone [https://github.com/sabtain05/cache-nomad.git](https://github.com/sabtain05/cache-nomad.git)
   cd cache-nomad

```

3. **Install dependencies**:
```bash
npm install

```


4. **Run tests** (We use Vitest and JSDOM):
```bash
npm test

```


5. **Build the project** to ensure TypeScript compiles successfully:
```bash
npm run build

```



## Pull Request Process

1. Create a new branch for your feature or bugfix:
`git checkout -b feature/my-awesome-feature` or `git checkout -b fix/issue-number`.
2. Make your changes in the `src` or `test` directories.
3. Write or update tests in the `test` directory to cover your changes. Ensure `npm test` passes.
4. Commit your changes with clear, descriptive commit messages.
5. Push your branch to your fork on GitHub.
6. Open a Pull Request against the `main` branch of the original repository.

### Code Style

* The library is written in strict TypeScript. Please ensure there are no `any` types introduced unless absolutely necessary.
* Keep the footprint small. The goal of this library is to be a lightweight, zero-dependency alternative to massive state management frameworks.

We will review your PR as soon as possible. Thank you for helping improve `cache-nomad`!