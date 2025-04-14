App Specification – Whiteboard for Structured Writing
Purpose of the App:
The app helps users create structured written assignments through a visual interface. The user provides a short description of the task, and the system automatically generates an initial outline composed of blocks (containers), each representing a section of the document. The user can fill in the blocks in any order, with optional AI support for guidance or writing assistance.

Target Audience
Middle and high school students who want to write school assignments, essays, or summaries in a clear, organized way, and who may need guidance or help getting started.

Workflow:
The user enters a short description of the task.
Example: "Essay about the Holocaust for history class" or "Assignment in English about The Giver".

The system generates an initial outline of 3 to 6 blocks based on the description.

Each block includes:

A title (editable by the user)

A guiding question or writing tip

A writing area, either empty or with a suggested starting sentence

The user fills in the content for each block at their own pace and in any order.
Blocks can be dragged to change order, edited, deleted, or new ones added.

Users can ask the AI for help with any block – suggestions for a beginning, rewriting content, or answering guiding questions.

When finished, users can save their work, export it to Word or PDF, or share it.

User Interface Overview
Home Screen: Input field for task description and a "Generate Outline" button.

Writing Screen:

A whiteboard-style layout with draggable blocks

Each block contains:

An editable title

A writing area

A button for AI assistance

Edit, delete, and copy options

Button to add a new block

Button to export or save the work

AI-Powered Features
Automatic outline generation from user description

Suggested 2–3 sentence openers for each block

AI chatbot per block for writing support

Self-assessment of block quality: clarity, length, argument strength

Recommended Tech Stack
Frontend: React with drag-and-drop support (e.g. React Flow or React DnD)

Backend: Node.js

Database: Supabase

AI Integration: gemini API (e.g. gemini 2.5) for content generation and analysis

Export: Use libraries like html-to-docx or pdfmake for Word/PDF export

Optional Future Features
User accounts for saving work

Outline templates based on subject (e.g. history, biology, literature)

Sharing system between students

Teacher or peer feedback on work

