# Change Log

All notable changes to the "Dev Agent" extension will be documented in this file.

## [0.0.4] - 2025-05-20

### Added
- New agent_v2.py script with improved features:
  - Code explanation
  - Pseudo code generation
  - File summarization
  - Code execution
  - Custom commands
- Support for --input-file argument format
- Updated default script path to agent_v2.py

### Fixed
- Fixed issue where chat always showed default response
- Improved message handling in main.js

## [0.0.3] - 2025-05-20

### Added
- Support for opening chat in panel area (similar to GitHub Copilot Chat)
- Smart file selection that considers files selected in VS Code explorer
- Support for executing Python code directly from the chat
- Better support for @dev-agent mentions in code
- Improved documentation

### Fixed
- Fixed "No active editor found" error when using "Use Current File" button
- Fixed duplicate method in chatPanel.ts
- Fixed "Clear Chat" button not working properly
- Fixed chat panel opening in a new tab instead of the panel area

## [0.0.2] - 2025-05-19

### Added
- Support for uploading files
- Support for processing current file
- Chat history

### Fixed
- Fixed issues with Python script execution

## [0.0.1] - 2025-05-18

### Added
- Initial release
- Basic chat interface
- Python script integration