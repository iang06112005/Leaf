# Vision

TexFlow is a LaTeX IDE for people who want Overleaf's edit-and-build loop on their own machine.

A project is a normal folder: `.tex` sources, images, bibliographies, and class files. TexFlow should edit those files in place and, when compilation exists, use the TeX distribution already installed on the computer (TeX Live, driven by latexmk). The app does not ship a TeX engine and does not upload the project.

The product is local-first. Writing and compiling a document should work with no account and no service operated by this project. Collaboration, sharing, subscriptions, and AI are outside the MVP.

Milestone 0 is a web application. A page by itself cannot start TeX or freely rewrite a folder. Those capabilities stay in later milestones. The working name is TexFlow.
