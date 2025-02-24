---
sidebar_position: 4
---

# Features and Requirements

## Functional Requirements

### Logging
- The system must be able to log clickstream data from the user
  - Whether a code suggestion was accepted or rejected
  - Frequency that code suggestions are given to a user
  - How long it takes for a user to accept or reject a suggestion from its generation
### Code Suggestions
- The system must provide context-aware code suggestions based on user code
- The system must provide suggestions inline in the editor
- The system must be able to generate correct and incorrect suggestions
- The system must be able to tell the user when they accept an incorrect suggestion
### Interaction
- The system allows users to write code
- The system must allow the user to select if the code suggestion is correct or not
### Limitations
- The system should provide a method of reinforcing that a user should not accept code too hastily
  - Locking a user out after 3 incorrect suggestions

## Nonfunctional Requirements
### Performance
- The system's performance for providing suggestions should be with 5 seconds of the normal Copilot experience
### Statistics
- The system should provide a portal to easily access statistics
### Education
- The system should be able to identify common programming mistakes to be used in creating incorrect suggestions
- The system should promote critical reflection in programmers who are still learning
### User Experience
- The system should not get in the way of the user's coding experience too greatly
### Maintainability
- The system should have a codebase that is easy to maintain and add features to
- The system should have a well documented codebase