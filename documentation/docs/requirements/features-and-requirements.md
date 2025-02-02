---
sidebar_position: 4
---

# Features and Requirements

## Functional Requirements

### *Code Suggestions
- The system must provide context-aware code suggestions based on user code
- The system must show whether the code was correct or not
- The system should be able to recognize boiler-plate code
- The system must provide suggestions inline in the editor
### *Interaction
- The system must allow the user to determine if the code suggestion is correct or not
### *Logging
- The system must track whether a code suggestion was accepted or rejected
- The system must track the frequency that it is being used by a user
- The system must track how long it takes for a user to accept or reject a suggestion
### Education
- The system should be able to identify common programming mistakes to be used in creating incorrect suggestions
- The system should promote critical reflection in programmers who are still learning
### Limitations
- The system should provide a method of reinforcing that a user should not accept code too hastily
  - Locking a user out after 3 incorrect suggestions

## Nonfunctional Requirements
### Performance
- The system's performance for providing suggestions should be with 5 seconds of the normal Copilot experience
### Statistics
- The system should provide a portal to easily access statistics
### User Experience
- The system should not get in the way of the user's coding experience too greatly
### Maintainability
- The system should have a codebase that is easy to maintain and add features to
- The system should have a well documented codebase


*\* = Most Important*