// @ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly
(function () {
  const vscode = acquireVsCodeApi();
  
  // State management
  let currentFile = null;
  let isLoading = false;

  // DOM elements
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const chatMessages = document.getElementById('chat-messages');
  const clearChatButton = document.getElementById('clear-chat');
  const useCurrentFileButton = document.getElementById('use-current-file');
  const uploadFileButton = document.getElementById('upload-file');
  
  // Initialize marked.js with highlight.js for code highlighting
  marked.setOptions({
    highlight: function(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (err) {}
      }
      return hljs.highlightAuto(code).value;
    },
    breaks: true
  });

  // Function to render markdown content
  function renderMarkdown(content) {
    return marked.parse(content);
  }

  // Function to scroll to the bottom of the chat
  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Function to handle sending a message
  function sendMessage() {
    if (!chatInput.value.trim()) {
      return;
    }

    const message = chatInput.value.trim();
    chatInput.value = '';

    // Check if it's a dev-agent command
    const isDevAgentCommand = message.startsWith('@dev-agent');

    if (isDevAgentCommand) {
      // Send as a dev-agent command
      vscode.postMessage({
        command: 'devAgentCommand',
        text: message.substring('@dev-agent'.length).trim()
      });
    } else if (message.includes('```python') || message.includes('```py')) {
      // Extract code blocks and execute them
      const codeRegex = /```(?:python|py)\n([\s\S]*?)```/g;
      let match = codeRegex.exec(message);
      
      if (match && match[1]) {
        const code = match[1].trim();
        vscode.postMessage({
          command: 'executeCode',
          code: code
        });
      } else {
        // If no code block found, send as a regular message
        vscode.postMessage({
          command: 'execute',
          prompt: message,
          isDevAgentCommand: false,
          currentFile: currentFile
        });
      }
    } else {
      // Send as a dev-agent command anyway (treat all messages as commands)
      vscode.postMessage({
        command: 'devAgentCommand',
        text: message
      });
    }
  }

  // Event listeners
  sendButton.addEventListener('click', sendMessage);
  
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  clearChatButton.addEventListener('click', () => {
    vscode.postMessage({
      command: 'clearChat'
    });
  });
  
  useCurrentFileButton.addEventListener('click', () => {
    vscode.postMessage({
      command: 'useCurrentFile'
    });
  });
  
  uploadFileButton.addEventListener('click', () => {
    vscode.postMessage({
      command: 'uploadFile'
    });
  });

  // Handle messages from the extension
  window.addEventListener('message', (event) => {
    const message = event.data;
    
    switch (message.command) {
      case 'response':
        // Update loading state
        isLoading = message.isLoading || false;
        
        // If it's just a loading indicator, don't add a new message
        if (isLoading) {
          // Find the last agent message and update it
          const agentMessages = document.querySelectorAll('.agent-message');
          if (agentMessages.length > 0) {
            const lastAgentMessage = agentMessages[agentMessages.length - 1];
            const contentDiv = lastAgentMessage.querySelector('.content');
            if (contentDiv) {
              contentDiv.innerHTML = '<div class="loading">Processing your request...</div>';
            }
          } else {
            // If no agent message exists, create a new one
            const newMessage = document.createElement('div');
            newMessage.className = 'message agent-message';
            newMessage.innerHTML = `
              <div class="avatar">🤖</div>
              <div class="content">
                <div class="loading">Processing your request...</div>
              </div>
            `;
            chatMessages.appendChild(newMessage);
            scrollToBottom();
          }
        } else {
          // Find the last agent message and update it
          const agentMessages = document.querySelectorAll('.agent-message');
          if (agentMessages.length > 0) {
            const lastAgentMessage = agentMessages[agentMessages.length - 1];
            const contentDiv = lastAgentMessage.querySelector('.content');
            if (contentDiv) {
              contentDiv.innerHTML = `<div class="markdown-content">${renderMarkdown(message.text)}</div>`;
            }
          }
          scrollToBottom();
        }
        break;
        
      case 'updateFileContext':
        // Update the current file context
        currentFile = {
          path: message.filePath,
          content: message.fileContent
        };
        
        // Update the file context display
        const fileContextDiv = document.querySelector('.file-context');
        if (fileContextDiv) {
          fileContextDiv.textContent = `Current file: ${message.filePath.split('/').pop()}`;
        }
        break;
    }
  });

  // Process all markdown content on page load
  document.querySelectorAll('.markdown-content').forEach(element => {
    element.innerHTML = renderMarkdown(element.textContent || '');
  });

  // Focus the input field on load
  chatInput.focus();
})();