# PupGuardian - Local Development Setup

🐶 A VS Code extension that protects your eyesight with gamified 20/20/20 rule reminders  
*(Designed for local development use only)*

## Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [VS Code](https://code.visualstudio.com/) (v1.75+)
- [TypeScript](https://www.typescriptlang.org/) (v4.9+)

## Installation from Source

### 1. Clone the repository
```bash
git clone https://github.com/your-repo/pupguardian.git
cd pupguardian
```
### 2. Install dependencies
```
npm install
```

### 3. Build the extension

```
npm run compile
```

### 4. Install in VS Code
```
npx vsce package
```
or
```
npm run package
```
Once the vsix file is generated, then install it via the command or manually in VS Code.
```
code --install-extension pupguardian-1.0.0.vsix
```

## Disabling the Extension
Open VS Code

Press Ctrl+Shift+P (Cmd+Shift+P on Mac)

Search for: Extensions: Disable Extension

Select "PupGuardian"

## Uninstalling
```
code --uninstall-extension your-extension-name
```


-----

## Developers:

For quick uninstall and fresh install:

```
code --uninstall-extension pupguardian
rm -rf ~/.vscode/extensions/pupguardian*
npm run package && code --install-extension *.vsix
```