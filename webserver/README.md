# Requirements
Make sure you have python3 installed
Currently it is set to use Ollama's llama3.2'
Download and follow the prompts here https://ollama.com/
Download the .env file from Discord and place it in this directory, root/webserver/, on the same level as app.py.

**Update**: This should not be required anymore. Use python to run
the run.py script to have it build the docs and run the server. Testing still needs to be done for mac

CD to the webserver folder
Then to install all the requirements
Windows
```
    py -m venv .venv
    .venv\Scripts\activate
    pip install -r requirements.txt
    deactivate

```
Mac(I think)
```
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    deactivate
```

# Running the program
windows
```
    .venv\Scripts\activate
    py app.py
    deactivate

```
Mac(I think)
```
    source .venv/bin/activate
    python3 app.py
    deactivate
```

# Tests

From the webserver directory start the virtual environment and run `pytest test/`
AI and database tests will fail if they are not running