# Tech stack

Milestone 0 is a web application. The first draft of this repository targeted Tauri 2 because that was the original request. The user then said a desktop app was unnecessary and a web app was acceptable. That decision is [decisions/0001-stack-and-repo-layout.md](decisions/0001-stack-and-repo-layout.md). Exact versions are in `package-lock.json`.

| Piece           | Choice                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| UI              | React 19, TypeScript, Vite                                                                                                               |
| Styling         | Tailwind CSS 4, via `@tailwindcss/vite`                                                                                                  |
| Icons           | `lucide-react`                                                                                                                           |
| Tests           | Vitest                                                                                                                                   |
| Lint and format | ESLint 10 (flat config) and Prettier                                                                                                     |
| Node            | 22 or newer. `.npmrc` sets `legacy-peer-deps` because npm 10, which ships with Node 22, crashes while resolving Vitest's optional peers. |
| License         | MIT                                                                                                                                      |

## Added because the shell uses them

- React, Vite, `@vitejs/plugin-react`, TypeScript
- Tailwind and lucide-react
- Vitest, ESLint, typescript-eslint, Prettier

## Left out on purpose

| Omitted                                          | Why                                                                                                   |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Tauri, Rust, and a desktop shell                 | The user accepted a web app for this milestone.                                                       |
| Monaco, PDF.js                                   | Milestone 1.                                                                                          |
| A document database or a project manifest format | Projects are directories.                                                                             |
| A local compiler service                         | No compilation in this milestone, and the host is not chosen.                                         |
| Playwright and browser binaries                  | The plan is in [TESTING.md](TESTING.md). Installing browsers is not required to prove the foundation. |

## Version

`package.json` version `0.1.0` is what the status strip shows. Change the package version and the unit test together.
