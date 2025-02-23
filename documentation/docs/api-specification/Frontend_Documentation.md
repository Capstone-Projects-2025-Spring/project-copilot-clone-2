Person

The purpose of the person class is to identify and create new users within the copilot education tool.  Allows for the identification of a person's role in the system.    
Data fields

  personId
  
    The identification attribute that will be used to track each user. 
  email
  
    The user's personal email address.
  username
  
    The name the user will use when accessing their account. 
  dateCreated
  
    Date variable to classify when the account was created. 
    
Methods

  authenticate()
  
    Uses the Person data fields to confirm the user.  
    User data is stored in the backend database after authentification.  

User

Class that will contain data for an individual using the copilot tool for learning.  The User will have access to different interactive educational tools. 

Data fields

  No data fields.

Methods

  acceptSuggestions()
  
    Method that is used when the user is presented with an AI generated code suggestion.  
    Will be used to process an 'accept' of the suggested code.  
    Response will return an accept object and store it in the database.  
  rejectSuggestion()
  
    Used when the user is presented with a code suggestion.  
    Will be used to process a 'reject' to the current code suggestion. 
    Similarly to accept, the reject will return a rejection object to store in the database.  
  modifySuggestion()
  
    Functions to allow the user to make changes to AI generated code suggestions string rather than accepting or rejecting.  
    Returns a modfied code suggestion object.   
  viewDashboard()
  
    Method that will display the user's information and progress dashboard.  

Progress

Component used to track the user's usage and proficiency as they encounter AI code suggestions.  

Data fields

  No Data fields
  
Methods

  progressId
  
    An identification field to identify unique types of user progress data.  
  status
  
    A tracking field to determine where the user stands with different topics.  
    How far along with an assignment or task the user is.  
  level
  
    Represents the state of the user's progress.  
  lastUpdated
  
    A date field that will show the last time a user's progress was refreshed.  Will be initiated by the admin.  

Admin

Component that classifies the administrator in the system to monitor users and their progress.  

Data fields

  No data fields

Methods

  manageUsers()

    Admin interacts with the person class to monitor different users based on their personal data.  
    Gives the admin the ability to handle administrative actions.  
  monitorProgress()

    Allows the administrator to view different users progress.  
    Will use personId, email, username to differentiate users.  
    Will call lastUpdated to update user's progress.  

Dashboard

Component that will allow the user to see view their progress while using the copilot tool as well as for the administrator to comment on tasks.  

Data fields

  No data fields

Methods

  displayProgress()

    Displays the user progress given their userId and progressId (string or int)
    Will fetch Progress data fields.  
    Accesses users suggestion details to display results and feedback.  
    Returns different progress objects for a given user.  

  provideFeedback()

    Allows the administrator to give users feedback that can be accessed in their dashboard.  
    Level data field can be updated for different tasks.  
    lastUpdated attribute will update when new feedback is entered.  


    
    
  
    
    
